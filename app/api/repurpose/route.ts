import { NextRequest, NextResponse } from "next/server";

import { AiConfigurationError, AiUnavailableError, generateRepurposedContent } from "@/lib/ai";
import { config } from "@/lib/config";
import { checkRateLimit, clientKeyFrom } from "@/lib/rate-limit";
import {
  ANONYMOUS_UID_COOKIE,
  getUid,
  getUsage,
  newUid,
  recordUsage,
  uidCookieOptions,
  type UsageSnapshot,
} from "@/lib/store";
import type { RepurposeFailure, UsageInfo } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function upgradeUrl(): string | null {
  return process.env.NEXT_PUBLIC_PRO_URL?.trim() || null;
}

function toUsageInfo(snapshot: UsageSnapshot): UsageInfo {
  return { ...snapshot, upgradeUrl: upgradeUrl() };
}

/** Always set the visitor cookie so the quota survives across requests. */
function withVisitorCookie(res: NextResponse, req: NextRequest, uid: string, isNew: boolean) {
  if (isNew) res.cookies.set(ANONYMOUS_UID_COOKIE, uid, uidCookieOptions(req));
  return res;
}

function fail(
  req: NextRequest,
  uid: string,
  isNewUid: boolean,
  error: string,
  status: number,
  code: RepurposeFailure["code"],
  usage?: UsageInfo,
  headers?: Record<string, string>,
) {
  const res = NextResponse.json<RepurposeFailure>(
    { ok: false, error, code, usage },
    { status, headers },
  );
  return withVisitorCookie(res, req, uid, isNewUid);
}

export async function POST(req: NextRequest) {
  // 1. Identify the visitor (anonymous cookie — no account needed) -------
  const existingUid = getUid(req);
  const uid = existingUid ?? newUid();

  // 2. Rate limit ---------------------------------------------------------
  const rateLimit = checkRateLimit(clientKeyFrom(req.headers));
  if (!rateLimit.ok) {
    return fail(
      req,
      uid,
      !existingUid,
      `You're generating too quickly. Please wait ${rateLimit.retryAfterSeconds}s and try again.`,
      429,
      "rate_limited",
      toUsageInfo(await getUsage(uid)),
      { "Retry-After": String(rateLimit.retryAfterSeconds) },
    );
  }

  // 3. Lifetime free quota (10 free generations, never renews) ------------
  const usage = await getUsage(uid);

  if (usage.remaining <= 0) {
    return fail(
      req,
      uid,
      !existingUid,
      `You've used all ${usage.limit} free generations. Upgrade to Pro to keep repurposing.`,
      402,
      "limit_reached",
      toUsageInfo(usage),
    );
  }

  // 4. Validate input -----------------------------------------------------
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail(req, uid, !existingUid, "We couldn't read that request. Please try again.", 400, "bad_request");
  }

  const text = typeof (body as { text?: unknown })?.text === "string"
    ? ((body as { text: string }).text).trim()
    : "";

  if (!text) {
    return fail(req, uid, !existingUid, "Please paste an article, blog post, or some text first.", 400, "invalid_input");
  }
  if (text.length < config.minInputChars) {
    return fail(
      req,
      uid,
      !existingUid,
      `That's a little short — paste at least ${config.minInputChars} characters so the AI has something to work with.`,
      400,
      "invalid_input",
    );
  }
  if (text.length > config.maxInputChars) {
    return fail(
      req,
      uid,
      !existingUid,
      `That's too long. Please trim your text to ${config.maxInputChars.toLocaleString()} characters or fewer.`,
      413,
      "invalid_input",
    );
  }

  // 5. Generate (primary → fallback → friendly error) --------------------
  try {
    const result = await generateRepurposedContent(text);

    // Only successful generations consume the free quota.
    const nextUsage = await recordUsage(uid);

    const res = NextResponse.json(
      {
        ok: true as const,
        data: result.data,
        provider: result.provider,
        model: result.model,
        elapsedMs: result.elapsedMs,
        failedProviders: result.failedProviders,
        usage: toUsageInfo(nextUsage),
      },
      { headers: { "Cache-Control": "no-store" } },
    );

    return withVisitorCookie(res, req, uid, !existingUid);
  } catch (err) {
    if (err instanceof AiConfigurationError) {
      return fail(req, uid, !existingUid, err.message, 503, "ai_unavailable", toUsageInfo(usage));
    }
    if (err instanceof AiUnavailableError) {
      // Details are already logged inside the failover engine.
      return fail(req, uid, !existingUid, err.message, 502, "ai_unavailable", toUsageInfo(usage));
    }

    console.error("[api/repurpose] unexpected error:", err);
    return fail(
      req,
      uid,
      !existingUid,
      "Something went wrong while generating your content. Please try again.",
      500,
      "bad_request",
      toUsageInfo(usage),
    );
  }
}

export function GET(req: NextRequest) {
  const existingUid = getUid(req);
  const uid = existingUid ?? newUid();

  return withVisitorCookie(
    NextResponse.json(
      { ok: false, error: "Use POST with a JSON body: { \"text\": string }" },
      { status: 405, headers: { Allow: "POST" } },
    ),
    req,
    uid,
    !existingUid,
  );
}
