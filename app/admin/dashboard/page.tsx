import type { Metadata } from "next";
import Link from "next/link";

import { LogoMark } from "@/components/icons";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db";

export const metadata: Metadata = {
  title: "لوحة الإدارة",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("ar", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function formatDay(date: Date): string {
  return new Intl.DateTimeFormat("ar", { dateStyle: "medium" }).format(date);
}

export default async function AdminDashboard() {
  const session = await auth();

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [
    totalUsers,
    totalGenerations,
    totalModifications,
    activeSubscriptions,
    revenueAgg,
    recentGenerations,
    recentAudit,
    analytics,
    monthlyGenerations,
    monthlyModifications,
    monthlySignups,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.generation.count(),
    prisma.modification.count(),
    prisma.subscription.count({ where: { status: "ACTIVE", plan: "PRO" } }),
    prisma.subscription.aggregate({ _sum: { price: true }, where: { status: "ACTIVE", plan: "PRO" } }),
    prisma.generation.findMany({
      take: 40,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        user: { select: { email: true } },
        anonymousId: true,
        inputType: true,
        language: true,
        tone: true,
        inputText: true,
        linkedinPost: true,
        provider: true,
        reviewPassed: true,
        createdAt: true,
      },
    }),
    prisma.auditLog.findMany({ take: 20, orderBy: { createdAt: "desc" } }),
    prisma.siteAnalytics.findMany({ where: { date: { gte: thirtyDaysAgo } }, orderBy: { date: "desc" } }),
    prisma.generation.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    prisma.modification.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
  ]);

  const monthlyVisits = analytics.reduce((sum, a) => sum + a.uniqueVisitors, 0);
  const mrr = Number(revenueAgg._sum.price ?? 0);

  const stats = [
    { label: "إجمالي المستخدمين", value: totalUsers.toLocaleString("ar"), hint: `+${monthlySignups} هذا الشهر` },
    { label: "اشتراكات Pro نشطة", value: activeSubscriptions.toLocaleString("ar"), hint: `الإيراد الشهري ≈ $${mrr.toFixed(2)}` },
    { label: "زيارات آخر 30 يوماً", value: monthlyVisits.toLocaleString("ar"), hint: "زيارات فريدة" },
    { label: "توليدات آخر 30 يوماً", value: monthlyGenerations.toLocaleString("ar"), hint: `${monthlyModifications} تعديل` },
  ];

  return (
    <div className="min-h-dvh bg-neutral-50/60" dir="rtl">
      <header className="sticky top-0 z-40 border-b border-neutral-200/70 bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <LogoMark className="h-7 w-7" />
            <span className="text-[15px] font-semibold tracking-tight text-neutral-950">ContentRepurposer</span>
          </Link>
          <span className="rounded-full bg-neutral-950 px-2.5 py-1 text-[11px] font-medium text-white">إدارة</span>
          <Link
            href="/dashboard"
            className="mr-auto text-[13px] font-medium text-neutral-500 transition hover:text-neutral-950"
          >
            الاستوديو
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-950 sm:text-3xl">لوحة التحكم الإدارية</h1>
          <p className="mt-2 text-[14px] text-neutral-500">
            مرحباً {session?.user?.name ?? session?.user?.email ?? "أيها المشرف"} — هذه اللوحة خاصة بك فقط.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-neutral-200 bg-white p-6">
              <p className="text-[13px] text-neutral-500">{stat.label}</p>
              <p className="mt-2 text-3xl font-semibold tracking-tight text-neutral-950">{stat.value}</p>
              <p className="mt-1 text-[12px] text-neutral-400">{stat.hint}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <section className="rounded-2xl border border-neutral-200 bg-white lg:col-span-2">
            <div className="border-b border-neutral-100 p-6">
              <h2 className="text-base font-semibold tracking-tight text-neutral-950">سجل التوليدات</h2>
              <p className="mt-1 text-[13px] text-neutral-500">
                النص المدخل والمخرجات الكاملة — سجل خاص، متاح للأدمن فقط لحماية الجودة.
              </p>
            </div>
            <div className="max-h-[560px] overflow-auto">
              <table className="w-full text-right">
                <thead className="sticky top-0 bg-neutral-50 text-[12px] text-neutral-500">
                  <tr>
                    <th className="p-3 font-medium">المستخدم</th>
                    <th className="p-3 font-medium">النوع</th>
                    <th className="p-3 font-medium">المدخل</th>
                    <th className="p-3 font-medium">المخرج</th>
                    <th className="p-3 font-medium">مراجعة</th>
                    <th className="p-3 font-medium">التاريخ</th>
                  </tr>
                </thead>
                <tbody>
                  {recentGenerations.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-[13px] text-neutral-400">
                        لا توجد توليدات بعد.
                      </td>
                    </tr>
                  )}
                  {recentGenerations.map((gen) => (
                    <tr key={gen.id} className="border-t border-neutral-100 align-top">
                      <td className="p-3 text-[12.5px]">
                        {gen.user?.email ?? <span className="text-neutral-400">زائر</span>}
                      </td>
                      <td className="p-3 text-[12px] text-neutral-500">
                        {gen.inputType}
                        <br />
                        <span className="text-neutral-400">{gen.language} · {gen.tone}</span>
                      </td>
                      <td className="max-w-[220px] p-3 text-[12.5px] text-neutral-600">
                        <span className="line-clamp-3">{gen.inputText}</span>
                      </td>
                      <td className="max-w-[220px] p-3 text-[12.5px] text-neutral-600">
                        <span className="line-clamp-3">{gen.linkedinPost}</span>
                      </td>
                      <td className="p-3 text-[12px]">
                        {gen.reviewPassed ? (
                          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-700">مطابق</span>
                        ) : (
                          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-amber-700">تحقق</span>
                        )}
                      </td>
                      <td className="p-3 text-[12px] text-neutral-400">{formatDate(gen.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <div className="space-y-6">
            <section className="rounded-2xl border border-neutral-200 bg-white">
              <div className="border-b border-neutral-100 p-6">
                <h2 className="text-base font-semibold tracking-tight text-neutral-950">سجل التدقيق</h2>
                <p className="mt-1 text-[13px] text-neutral-500">أحداث الدفع والأمان.</p>
              </div>
              <ul className="max-h-[300px] divide-y divide-neutral-100 overflow-auto">
                {recentAudit.length === 0 && (
                  <li className="p-6 text-center text-[13px] text-neutral-400">لا توجد أحداث بعد.</li>
                )}
                {recentAudit.map((log) => (
                  <li key={log.id} className="flex items-center justify-between gap-3 p-4">
                    <div>
                      <p className="text-[13px] font-medium text-neutral-800">{log.action}</p>
                      <p className="text-[11.5px] text-neutral-400">{log.category}</p>
                    </div>
                    <span className="text-[11.5px] text-neutral-400">{formatDate(log.createdAt)}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-2xl border border-neutral-200 bg-white">
              <div className="border-b border-neutral-100 p-6">
                <h2 className="text-base font-semibold tracking-tight text-neutral-950">التحليلات اليومية</h2>
                <p className="mt-1 text-[13px] text-neutral-500">آخر 30 يوماً.</p>
              </div>
              <ul className="max-h-[300px] divide-y divide-neutral-100 overflow-auto">
                {analytics.length === 0 && (
                  <li className="p-6 text-center text-[13px] text-neutral-400">لا توجد بيانات بعد.</li>
                )}
                {analytics.map((day) => (
                  <li key={day.id} className="flex items-center justify-between gap-3 p-4 text-[12.5px]">
                    <span className="text-neutral-500">{formatDay(day.date)}</span>
                    <span className="text-neutral-700">
                      {day.uniqueVisitors} زيارة · {day.generations} توليد · {day.signups} تسجيل
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>

        <p className="mt-8 text-center text-xs text-neutral-400">
          إجمالي التوليدات: {totalGenerations.toLocaleString("ar")} · إجمالي التعديلات: {totalModifications.toLocaleString("ar")}
        </p>
      </main>
    </div>
  );
}
