import { NextRequest, NextResponse } from "next/server";

import { AiConfigurationError, AiUnavailableError, generateModification } from "@/lib/ai";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db";
import { checkRateLimit, clientKeyFrom } from "@/lib/rate-limit";
import { getUid } from "@/lib/store";
import {
  consumeModification,
  QuotaExceededError,
  resolveQuota,
} from "@/lib/utils/quota";
import { trackModification } from "@/lib/analytics/tracker";
import type { ModificationType } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MODIFICATION_TYPES: ModificationType[] = [
  "SHORTEN",
  "MORE_PERSUASIVE",
  "CHANGE_HOOK",
  "SIMPLIFY",
  "THREE_VARIANTS",
  "CHANGE_TONE",
  "CUSTOM",
];

function isModificationType(value: unknown): value is ModificationType {
  return typeof value === "string" && (MODIFICATION_TYPES as string[]).includes(value);
}

function clientIp(req: NextRequest): string | undefined {
  const forwarded = req.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || undefined;
}

export async function POST(req: NextRequest) {
  const anonymousId = getUid(req) ?? null;

  const rateLimit = checkRateLimit(clientKeyFrom(req.headers));
  if (!rateLimit.ok) {
    return NextResponse.json(
      { ok: false, error: `محاولات كثيرة. انتظر ${rateLimit.retryAfterSeconds} ثانية.`, code: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } },
    );
  }

  // Quota gate BEFORE spending tokens.
  const quota = await resolveQuota(anonymousId);
  if (!quota || !quota.canModify) {
    return NextResponse.json(
      {
        ok: false,
        error:
          quota?.plan === "pro"
            ? `لقد استهلكت ${quota.modificationsLimit} تعديلاً لهذا اليوم. تتجدد تلقائياً خلال 24 ساعة.`
            : "لقد استهلكت حصّتك المجانية. الاشتراك في Pro يمنحك 20 تعديلاً يومياً.",
        code: "limit_reached",
      },
      { status: 402 },
    );
  }

  let body: { generationId?: unknown; type?: unknown; instruction?: unknown; platform?: unknown; content?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "تعذّر قراءة الطلب.", code: "bad_request" }, { status: 400 });
  }

  const type = isModificationType(body.type) ? body.type : "CUSTOM";
  const platform = typeof body.platform === "string" ? body.platform.slice(0, 64) : null;
  const instruction = typeof body.instruction === "string" ? body.instruction.slice(0, 500) : null;
  const generationId = typeof body.generationId === "string" ? body.generationId : null;
  const content = typeof body.content === "string" ? body.content.trim() : "";

  if (!content) {
    return NextResponse.json(
      { ok: false, error: "لا يوجد نص لتعديله.", code: "invalid_input" },
      { status: 400 },
    );
  }
  if (content.length > 20_000) {
    return NextResponse.json(
      { ok: false, error: "النص طويل جداً للتعديل.", code: "invalid_input" },
      { status: 413 },
    );
  }

  try {
    const result = await generateModification({ content, type, instruction, platform });

    try {
      await consumeModification(anonymousId);
    } catch (quotaErr) {
      if (!(quotaErr instanceof QuotaExceededError)) throw quotaErr;
    }

    const session = await auth();
    const userId = session?.user?.id ?? null;

    // Persist the modification when we can attach it to a stored generation.
    try {
      if (generationId) {
        const owns = await prisma.generation.findFirst({
          where: { id: generationId, OR: [{ userId: userId ?? undefined }, { anonymousId: anonymousId ?? undefined }] },
          select: { id: true },
        });
        if (owns) {
          await prisma.modification.create({
            data: {
              generationId,
              userId,
              type,
              instruction,
              platform,
              inputText: content,
              resultText: result.text,
              ipAddress: clientIp(req),
            },
          });
        }
      }
    } catch (dbErr) {
      console.error("[api/modify] failed to persist modification:", dbErr);
    }

    void trackModification().catch(() => undefined);

    return NextResponse.json(
      { ok: true as const, text: result.text, variants: result.variants, usage: null },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (err) {
    if (err instanceof AiConfigurationError) {
      return NextResponse.json({ ok: false, error: err.message, code: "ai_unavailable" }, { status: 503 });
    }
    if (err instanceof AiUnavailableError) {
      return NextResponse.json({ ok: false, error: err.message, code: "ai_unavailable" }, { status: 502 });
    }
    console.error("[api/modify] unexpected error:", err);
    return NextResponse.json({ ok: false, error: "فشل التعديل. حاول مرة أخرى.", code: "bad_request" }, { status: 500 });
  }
}
