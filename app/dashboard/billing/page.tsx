import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { CheckoutButton } from "@/components/billing/CheckoutButton";
import { ArrowRightIcon, CheckIcon, LogoMark } from "@/components/icons";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db";
import { resolveQuota } from "@/lib/utils/quota";

export const metadata: Metadata = {
  title: "الاشتراك",
  description: "إدارة اشتراكك في ContentRepurposer — خطة Pro بـ 15 دولاراً شهرياً مع 20 توليداً يومياً.",
};

export const dynamic = "force-dynamic";

function formatDate(value: Date | null | undefined): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("ar", { dateStyle: "long" }).format(value);
}

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");

  const params = await searchParams;
  const [subscription, quota] = await Promise.all([
    prisma.subscription.findUnique({ where: { userId: session.user.id } }),
    resolveQuota(),
  ]);

  const isPro = subscription?.plan === "PRO" && subscription?.status === "ACTIVE";

  return (
    <div className="min-h-dvh bg-neutral-50/50" dir="rtl">
      <header className="sticky top-0 z-40 border-b border-neutral-200/70 bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-4xl items-center gap-4 px-6">
          <Link href="/" className="flex items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950/20">
            <LogoMark className="h-7 w-7" />
            <span className="text-[15px] font-semibold tracking-tight text-neutral-950">ContentRepurposer</span>
          </Link>
          <Link
            href="/dashboard"
            className="mr-auto inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-medium text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-950"
          >
            الاستوديو
            <ArrowRightIcon className="h-3.5 w-3.5" />
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-12">
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-950 sm:text-3xl">
          الفواتير والاشتراك
        </h1>
        <p className="mt-2 text-[15px] leading-7 text-neutral-500">
          مسجّل الدخول باسم <span className="font-medium text-neutral-700">{session.user.email}</span>
        </p>

        {params.checkout === "success" && !isPro && (
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50/70 px-4 py-3.5 text-sm text-amber-900">
            <span className="mt-0.5">⏳</span>
            <p>
              تم استلام عملية الدفع. قد يستغرق تأكيد الاشتراك بضع ثوانٍ — حدّث الصفحة بعد قليل لترى خطتك
              الجديدة مفعّلة.
            </p>
          </div>
        )}

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <div className="flex flex-col rounded-2xl border border-neutral-200 bg-white p-8">
            <h2 className="text-lg font-semibold tracking-tight text-neutral-950">الخطة المجانية</h2>
            <p className="mt-2 text-3xl font-semibold text-neutral-950">0<span className="text-base font-normal text-neutral-500">$</span></p>
            <p className="mt-1 text-[13px] text-neutral-500">لمرة واحدة — لا تتجدد أبداً</p>
            <ul className="mt-6 flex-1 space-y-2.5 text-[14px] text-neutral-600">
              <li className="flex gap-2"><CheckIcon className="mt-1 h-4 w-4 shrink-0 text-emerald-600" /> 10 توليدات مجانية مدى الحياة</li>
              <li className="flex gap-2"><CheckIcon className="mt-1 h-4 w-4 shrink-0 text-emerald-600" /> جميع صيغ المنشورات</li>
              <li className="flex gap-2"><CheckIcon className="mt-1 h-4 w-4 shrink-0 text-emerald-600" /> اختيار النبرة واللغة</li>
              <li className="flex gap-2"><CheckIcon className="mt-1 h-4 w-4 shrink-0 text-emerald-600" /> نسخ بضغطة واحدة</li>
            </ul>
            {!isPro && quota && (
              <p className="mt-6 rounded-xl bg-neutral-50 px-4 py-3 text-[13px] text-neutral-600">
                استخدمت {quota.used} من {quota.limit} توليدات مجانية.
              </p>
            )}
            {!isPro && <p className="mt-3 text-xs font-medium text-neutral-500">خطتك الحالية</p>}
          </div>

          <div className="relative flex flex-col overflow-hidden rounded-2xl border border-neutral-900 bg-neutral-950 p-8 text-white">
            <span className="absolute left-6 top-6 rounded-full bg-white/10 px-3 py-1 text-[11px] font-medium text-white/80">
              {isPro ? "مفعّلة" : "الأكثر اختياراً"}
            </span>
            <h2 className="text-lg font-semibold tracking-tight">خطة Pro</h2>
            <p className="mt-2 text-3xl font-semibold">$15<span className="text-base font-normal text-white/60">/شهر</span></p>
            <p className="mt-1 text-[13px] text-white/60">
              {isPro ? `تتجدد في ${formatDate(subscription?.renewsAt ?? subscription?.currentPeriodEnd)}` : "يُجدّد شهرياً — يمكنك الإلغاء في أي وقت"}
            </p>
            <ul className="mt-6 flex-1 space-y-2.5 text-[14px] text-white/85">
              <li className="flex gap-2"><CheckIcon className="mt-1 h-4 w-4 shrink-0 text-emerald-400" /> 20 توليد يومياً (تتجدد كل 24 ساعة)</li>
              <li className="flex gap-2"><CheckIcon className="mt-1 h-4 w-4 shrink-0 text-emerald-400" /> 20 تعديلاً يومياً</li>
              <li className="flex gap-2"><CheckIcon className="mt-1 h-4 w-4 shrink-0 text-emerald-400" /> خطة النشر الأسبوعية + تصدير</li>
              <li className="flex gap-2"><CheckIcon className="mt-1 h-4 w-4 shrink-0 text-emerald-400" /> دعم سكريبت الفيديو والعناوين</li>
              <li className="flex gap-2"><CheckIcon className="mt-1 h-4 w-4 shrink-0 text-emerald-400" /> مراجعة ذكية لكل نتيجة</li>
            </ul>

            <div className="mt-6">
              {isPro ? (
                <p className="rounded-xl bg-white/10 px-4 py-3 text-center text-[13px] text-white/80">
                  اشتراكك نشط. شكراً لثقتك!
                </p>
              ) : (
                <CheckoutButton />
              )}
            </div>

            {quota?.plan === "pro" && (
              <p className="mt-3 text-center text-xs text-white/60">
                متبقٍ اليوم: {quota.remaining} توليد · {quota.modificationsRemaining} تعديل
              </p>
            )}
          </div>
        </div>

        <p className="mt-8 text-center text-xs text-neutral-400">
          الدفع آمن ومشفّر بالكامل عبر Lemon Squeezy. لا نحتفظ ببيانات بطاقتك على سيرفراتنا.
        </p>
      </main>
    </div>
  );
}
