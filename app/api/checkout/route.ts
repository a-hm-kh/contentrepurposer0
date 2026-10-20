import { NextResponse } from "next/server";

import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db";
import { createLemonSqueezyCheckout } from "@/lib/lemonsqueezy/client";
import { checkRateLimit, clientKeyFrom } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Creates a Lemon Squeezy checkout for the signed-in user (Pro, $15/month). */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ error: "يجب تسجيل الدخول أولاً." }, { status: 401 });
  }

  const rateLimit = checkRateLimit(`checkout:${clientKeyFrom(req.headers)}`);
  if (!rateLimit.ok) {
    return NextResponse.json(
      { error: "محاولات كثيرة. حاول بعد قليل." },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } },
    );
  }

  const variantId =
    process.env.LEMONSQUEEZY_SUBSCRIPTION_VARIANT_ID?.trim() ||
    process.env.LEMONSQUEEZY_PRO_VARIANT_ID?.trim();

  if (!variantId) {
    console.error("[api/checkout] LEMONSQUEEZY_SUBSCRIPTION_VARIANT_ID is not set");
    return NextResponse.json({ error: "الدفع غير مهيأ على السيرفر بعد." }, { status: 503 });
  }

  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL?.trim() ||
      process.env.AUTH_URL?.trim() ||
      "http://localhost:3000";

    const checkoutUrl = await createLemonSqueezyCheckout({
      variantId,
      userId: session.user.id,
      email: session.user.email,
      name: session.user.name ?? undefined,
      redirectUrl: `${baseUrl}/dashboard/billing?checkout=success`,
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        category: "PAYMENT",
        action: "checkout_created",
        details: { variantId },
      },
    });

    return NextResponse.json({ url: checkoutUrl });
  } catch (error) {
    console.error("[api/checkout] failed:", error);
    return NextResponse.json({ error: "تعذّر إنشاء صفحة الدفع. حاول مرة أخرى." }, { status: 500 });
  }
}
