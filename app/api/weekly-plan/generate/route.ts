import { NextRequest, NextResponse } from "next/server";

import { AiConfigurationError, AiUnavailableError, generateWeeklyPlan } from "@/lib/ai";
import { auth } from "@/lib/auth/config";
import { config } from "@/lib/config";
import { prisma } from "@/lib/db";
import { checkRateLimit, clientKeyFrom } from "@/lib/rate-limit";
import { getUid } from "@/lib/store";
import { resolveQuota } from "@/lib/utils/quota";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const anonymousId = getUid(req) ?? null;

  const rateLimit = checkRateLimit(clientKeyFrom(req.headers));
  if (!rateLimit.ok) {
    return NextResponse.json(
      { ok: false, error: `محاولات كثيرة. انتظر ${rateLimit.retryAfterSeconds} ثانية.` },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } },
    );
  }

  let body: { text?: unknown; language?: unknown; tone?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "تعذّر قراءة الطلب." }, { status: 400 });
  }

  const text = typeof body.text === "string" ? body.text.trim() : "";
  const language = body.language === "en" ? "en" : "ar";
  const tone = typeof body.tone === "string" && body.tone.trim() ? body.tone.trim().slice(0, 32) : "balanced";

  if (!text) {
    return NextResponse.json({ ok: false, error: "الرجاء لصق المحتوى أولاً." }, { status: 400 });
  }
  if (text.length < config.minInputChars) {
    return NextResponse.json(
      { ok: false, error: `النص قصير جداً — الصق ${config.minInputChars} حرفاً على الأقل.` },
      { status: 400 },
    );
  }
  if (text.length > config.maxInputChars) {
    return NextResponse.json(
      { ok: false, error: `النص طويل جداً (الحد ${config.maxInputChars.toLocaleString()} حرف).` },
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
          title: language === "ar" ? "خطة النشر الأسبوعية" : "Weekly publishing plan",
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
      return NextResponse.json({ ok: false, error: err.message }, { status: 502 });
    }
    console.error("[api/weekly-plan] unexpected error:", err);
    return NextResponse.json({ ok: false, error: "فشل في إنشاء الخطة. حاول مرة أخرى." }, { status: 500 });
  }
}
