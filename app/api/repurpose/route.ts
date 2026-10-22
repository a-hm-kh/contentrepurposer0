import { NextRequest, NextResponse } from "next/server";

import { AiConfigurationError, AiUnavailableError, generateRepurposedContent } from "@/lib/ai";
import { auth } from "@/lib/auth/config";
import { config } from "@/lib/config";
import { prisma } from "@/lib/db";
import { checkRateLimit, clientKeyFrom } from "@/lib/rate-limit";
import { ANONYMOUS_UID_COOKIE, getUid, newUid, uidCookieOptions } from "@/lib/store";
import { consumeGeneration, QuotaExceededError, resolveQuota, type QuotaSnapshot } from "@/lib/utils/quota";
import { trackGeneration } from "@/lib/analytics/tracker";
import { detectLanguage } from "@/lib/utils/language";
import type { InputType, RepurposeFailure, UsageInfo } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const UPGRADE_URL = process.env.NEXT_PUBLIC_PRO_URL?.trim() || "/dashboard/billing";

const INPUT_TYPES: Record<string, InputType> = {
  ARTICLE: "ARTICLE",
  VIDEO_SCRIPT: "VIDEO_SCRIPT",
  BLOG_POST: "BLOG_POST",
  NEWSLETTER: "NEWSLETTER",
  TRANSCRIPT: "TRANSCRIPT",
};

function normalizeInputType(raw: unknown): InputType {
  return typeof raw === "string" && raw in INPUT_TYPES ? INPUT_TYPES[raw] : "ARTICLE";
}

function toUsageInfo(quota: QuotaSnapshot | null): UsageInfo | undefined {
  if (!quota) return undefined;
  return {
    used: quota.used,
    limit: quota.limit,
    remaining: quota.remaining,
    exhausted: quota.exhausted,
    plan: quota.plan,
    scope: quota.scope,
    canGenerate: quota.canGenerate,
    canModify: quota.canModify,
    modificationsUsed: quota.modificationsUsed,
    modificationsLimit: quota.modificationsLimit,
    modificationsRemaining: quota.modificationsRemaining,
    resetsAt: quota.resetsAt,
    upgradeUrl: UPGRADE_URL,
  };
}

function clientIp(req: NextRequest): string | undefined {
  const forwarded = req.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || undefined;
}

function sanitizeText(raw: string): string {
  // Drop control characters (except newline/tab) that could break JSON or logs.
  return raw.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim();
}

export async function POST(req: NextRequest) {
  const existingUid = getUid(req);
  const anonymousId = existingUid ?? newUid();
  const isNewVisitor = !existingUid;

  const finish = (res: NextResponse) => {
    if (isNewVisitor) res.cookies.set(ANONYMOUS_UID_COOKIE, anonymousId, uidCookieOptions(req));
    return res;
  };

  const fail = (
    error: string,
    status: number,
    code: RepurposeFailure["code"],
    usage?: UsageInfo,
    headers?: Record<string, string>,
  ) =>
    finish(
      NextResponse.json<RepurposeFailure>({ ok: false, error, code, usage }, { status, headers }),
    );

  // 1) Abuse control — per-IP sliding window.
  const rateLimit = checkRateLimit(clientKeyFrom(req.headers));
  if (!rateLimit.ok) {
    return fail(
      `You are generating too quickly. Please wait ${rateLimit.retryAfterSeconds} seconds and try again.`,
      429,
      "rate_limited",
      toUsageInfo(await resolveQuota(anonymousId)),
      { "Retry-After": String(rateLimit.retryAfterSeconds) },
    );
  }

  // 2) Quota gate — checked BEFORE spending any AI tokens.
  const quota = await resolveQuota(anonymousId);
  if (!quota || !quota.canGenerate) {
    const message =
      quota?.plan === "pro"
        ? `You have used all ${quota.limit} generations for today. Your allowance refreshes automatically within 24 hours.`
        : `You have used all ${quota?.limit ?? config.freeGenerations} free generations. The Pro plan gives you 20 generations per day.`;

    return fail(message, 402, "limit_reached", toUsageInfo(quota));
  }

  // 3) Parse + validate input.
  let body: {
    text?: unknown;
    language?: unknown;
    tone?: unknown;
    inputType?: unknown;
  };

  try {
    body = await req.json();
  } catch {
    return fail("Could not read the request. Please try again.", 400, "bad_request", toUsageInfo(quota));
  }

  const text = typeof body?.text === "string" ? sanitizeText(body.text) : "";
  // The output language always follows the language of the pasted text, so we
  // detect it here just to record it — never to force a translation.
  const language = detectLanguage(text);
  const tone = typeof body?.tone === "string" && body.tone.trim() ? body.tone.trim().slice(0, 32) : "balanced";
  const inputType = normalizeInputType(body?.inputType);

  if (!text) {
    return fail("Please paste an article or some text first.", 400, "invalid_input", toUsageInfo(quota));
  }
  if (text.length < config.minInputChars) {
    return fail(
      `That text is too short — paste at least ${config.minInputChars} characters.`,
      400,
      "invalid_input",
      toUsageInfo(quota),
    );
  }
  if (text.length > config.maxInputChars) {
    return fail(
      `That text is too long. Please shorten it to ${config.maxInputChars.toLocaleString()} characters or fewer.`,
      413,
      "invalid_input",
      toUsageInfo(quota),
    );
  }

  // 4) Generate via the failover chain.
  try {
    const result = await generateRepurposedContent(text, language, tone);

    // 5) Charge quota only after a successful generation.
    let nextQuota: QuotaSnapshot | null = quota;
    try {
      nextQuota = await consumeGeneration(anonymousId);
    } catch (quotaErr) {
      if (!(quotaErr instanceof QuotaExceededError)) throw quotaErr;
    }

    const session = await auth();
    const userId = session?.user?.id ?? null;

    // 6) Persist the full input + output for the private admin record.
    let generationId: string | null = null;
    try {
      const review = result.data.reviewCheck;
      const created = await prisma.generation.create({
        data: {
          userId,
          anonymousId: userId ? null : anonymousId,
          inputText: text,
          inputType,
          language,
          tone,
          linkedinPost: result.data.linkedin,
          twitterThread: result.data.twitter_thread,
          instagramCaption: result.data.instagram,
          facebookPost: result.data.facebook ?? "",
          hooks: result.data.hooks,
          cta: result.data.cta,
          videoPromotions: result.data.videoPromotions ?? undefined,
          videoTitles: result.data.videoTitles ?? undefined,
          shortIdeas: result.data.shortIdeas ?? undefined,
          newsletter: result.data.newsletter ?? null,
          carousel: result.data.carousel ?? undefined,
          blogArticle: result.data.blogArticle ?? null,
          hashtags: result.data.hashtags ?? undefined,
          provider: result.provider,
          model: result.model,
          reviewPassed: review?.matchesOriginal ?? false,
          reviewNotes: review?.notes ?? null,
          generationTime: result.elapsedMs,
          ipAddress: clientIp(req),
          userAgent: req.headers.get("user-agent") ?? undefined,
        },
        select: { id: true },
      });
      generationId = created.id;
    } catch (dbErr) {
      // Never fail a paid generation because of a logging hiccup.
      console.error("[api/repurpose] failed to persist generation:", dbErr);
    }

    void trackGeneration().catch(() => undefined);

    return finish(
      NextResponse.json(
        {
          ok: true as const,
          data: result.data,
          generationId,
          provider: result.provider,
          model: result.model,
          elapsedMs: result.elapsedMs,
          failedProviders: result.failedProviders,
          usage: toUsageInfo(nextQuota),
        },
        { headers: { "Cache-Control": "no-store" } },
      ),
    );
  } catch (err) {
    if (err instanceof AiConfigurationError) {
      return fail(err.message, 503, "ai_unavailable", toUsageInfo(quota));
    }
    if (err instanceof AiUnavailableError) {
      // Transient upstream trouble (rate limits / demand spikes). The quota was
      // already refunded above by not consuming on failure, so the user can
      // simply retry. Show a calm message, not the raw provider payload.
      console.warn("[api/repurpose] providers unavailable:", err.message);
      return fail(
        "The generator is busy right now. Please try again in a few seconds.",
        503,
        "ai_unavailable",
        toUsageInfo(quota),
        { "Retry-After": "5" },
      );
    }
    console.error("[api/repurpose] unexpected error:", err);
    return fail("Something went wrong while generating. Please try again.", 500, "bad_request", toUsageInfo(quota));
  }
}

export function GET() {
  return NextResponse.json(
    { ok: false, error: 'Use POST with a JSON body: { "text": string }' },
    { status: 405, headers: { Allow: "POST" } },
  );
}
