import { NextRequest, NextResponse } from "next/server";

import { AiConfigurationError, AiUnavailableError, generateWeeklyPlan } from "@/lib/ai";
import { auth } from "@/lib/auth/config";
import { config } from "@/lib/config";
import { prisma } from "@/lib/db";
import { checkRateLimit, clientKeyFrom } from "@/lib/rate-limit";
import { getUid } from "@/lib/store";
import { detectLanguage } from "@/lib/utils/language";
import { resolveQuota } from "@/lib/utils/quota";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const anonymousId = getUid(req) ?? null;

  const rateLimit = checkRateLimit(clientKeyFrom(req.headers));
  if (!rateLimit.ok) {
    return NextResponse.json(
      { ok: false, error: `Too many requests. Please wait ${rateLimit.retryAfterSeconds} seconds.` },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } },
    );
  }

  let body: { text?: unknown; language?: unknown; tone?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Could not read the request." }, { status: 400 });
  }

  const text = typeof body.text === "string" ? body.text.trim() : "";
  const language = detectLanguage(text);
  const tone = typeof body.tone === "string" && body.tone.trim() ? body.tone.trim().slice(0, 32) : "balanced";

  if (!text) {
    return NextResponse.json({ ok: false, error: "Please paste your content first." }, { status: 400 });
  }
  if (text.length < config.minInputChars) {
    return NextResponse.json(
      { ok: false, error: `That text is too short — paste at least ${config.minInputChars} characters.` },
      { status: 400 },
    );
  }
  if (text.length > config.maxInputChars) {
    return NextResponse.json(
      { ok: false, error: `That text is too long (limit ${config.maxInputChars.toLocaleString()} characters).` },
      { status: 413 },
    );
  }

  try {
    const result = await generateWeeklyPlan({ text, language, tone });

    const session = await auth();
    const userId = session?.user?.id ?? null;

    try {
      await prisma.weeklyPlan.create({
        data: {
          userId,
          title: "Weekly publishing plan",
          inputText: text,
          language,
          planData: result.days as unknown as object,
        },
      });
    } catch (dbErr) {
      console.error("[api/weekly-plan] failed to persist plan:", dbErr);
    }

    return NextResponse.json(
      {
        ok: true as const,
        plan: result.days,
        provider: result.provider,
        model: result.model,
        quota: await resolveQuota(anonymousId),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (err) {
    if (err instanceof AiConfigurationError) {
      return NextResponse.json({ ok: false, error: err.message }, { status: 503 });
    }
    if (err instanceof AiUnavailableError) {
      // Transient upstream trouble (rate limits / demand spikes). Show a calm,
      // retryable message rather than the raw provider payload.
      console.warn("[api/weekly-plan] providers unavailable:", err.message);
      return NextResponse.json(
        {
          ok: false,
          error:
            "The planner is busy right now. Please try again in a few seconds.",
          code: "ai_unavailable",
        },
        { status: 503, headers: { "Retry-After": "5" } },
      );
    }
    console.error("[api/weekly-plan] unexpected error:", err);
    return NextResponse.json({ ok: false, error: "Could not build the plan. Please try again." }, { status: 500 });
  }
}
