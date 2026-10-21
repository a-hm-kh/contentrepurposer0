import type { Metadata } from "next";
import Link from "next/link";

import { LogoMark } from "@/components/icons";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db";

export const metadata: Metadata = {
  title: "Admin dashboard",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function formatDay(date: Date): string {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(date);
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
    { label: "Total users", value: totalUsers.toLocaleString("en-US"), hint: `+${monthlySignups} this month` },
    { label: "Active Pro subscriptions", value: activeSubscriptions.toLocaleString("en-US"), hint: `MRR ≈ $${mrr.toFixed(2)}` },
    { label: "Visits, last 30 days", value: monthlyVisits.toLocaleString("en-US"), hint: "unique visitors" },
    { label: "Generations, last 30 days", value: monthlyGenerations.toLocaleString("en-US"), hint: `${monthlyModifications} edits` },
  ];

  return (
    <div className="min-h-dvh bg-neutral-50/60">
      <header className="sticky top-0 z-40 border-b border-neutral-200/70 bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <LogoMark className="h-7 w-7" />
            <span className="text-[15px] font-semibold tracking-tight text-neutral-950">ContentRepurposer</span>
          </Link>
          <span className="rounded-full bg-neutral-950 px-2.5 py-1 text-[11px] font-medium text-white">Admin</span>
          <Link href="/dashboard" className="btn btn-ghost btn-sm ml-auto">
            Studio
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-950 sm:text-3xl">
            Admin dashboard
          </h1>
          <p className="mt-2 text-[14px] text-neutral-500">
            Welcome {session?.user?.name ?? session?.user?.email ?? "administrator"} — this
            dashboard is private to you.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="surface p-6">
              <p className="text-[13px] text-neutral-500">{stat.label}</p>
              <p className="mt-2 text-3xl font-semibold tracking-tight text-neutral-950">{stat.value}</p>
              <p className="mt-1 text-[12px] text-neutral-400">{stat.hint}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <section className="surface lg:col-span-2">
            <div className="border-b border-neutral-100 p-6">
              <h2 className="text-base font-semibold tracking-tight text-neutral-950">Generation log</h2>
              <p className="mt-1 text-[13px] text-neutral-500">
                Input text and full output — a private record, visible to the
                administrator only, to protect quality.
              </p>
            </div>
            <div className="max-h-[560px] overflow-auto">
              <table className="w-full text-left">
                <thead className="sticky top-0 bg-neutral-50 text-[12px] text-neutral-500">
                  <tr>
                    <th className="p-3 font-medium">User</th>
                    <th className="p-3 font-medium">Type</th>
                    <th className="p-3 font-medium">Input</th>
                    <th className="p-3 font-medium">Output</th>
                    <th className="p-3 font-medium">Review</th>
                    <th className="p-3 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentGenerations.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-[13px] text-neutral-400">
                        No generations yet.
                      </td>
                    </tr>
                  )}
                  {recentGenerations.map((gen) => (
                    <tr key={gen.id} className="border-t border-neutral-100 align-top">
                      <td className="p-3 text-[12.5px]">
                        {gen.user?.email ?? <span className="text-neutral-400">Visitor</span>}
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
                          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-700">Matched</span>
                        ) : (
                          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-amber-700">Check</span>
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
            <section className="surface">
              <div className="border-b border-neutral-100 p-6">
                <h2 className="text-base font-semibold tracking-tight text-neutral-950">Audit log</h2>
                <p className="mt-1 text-[13px] text-neutral-500">Payment and security events.</p>
              </div>
              <ul className="max-h-[300px] divide-y divide-neutral-100 overflow-auto">
                {recentAudit.length === 0 && (
                  <li className="p-6 text-center text-[13px] text-neutral-400">No events yet.</li>
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

            <section className="surface">
              <div className="border-b border-neutral-100 p-6">
                <h2 className="text-base font-semibold tracking-tight text-neutral-950">Daily analytics</h2>
                <p className="mt-1 text-[13px] text-neutral-500">Last 30 days.</p>
              </div>
              <ul className="max-h-[300px] divide-y divide-neutral-100 overflow-auto">
                {analytics.length === 0 && (
                  <li className="p-6 text-center text-[13px] text-neutral-400">No data yet.</li>
                )}
                {analytics.map((day) => (
                  <li key={day.id} className="flex items-center justify-between gap-3 p-4 text-[12.5px]">
                    <span className="text-neutral-500">{formatDay(day.date)}</span>
                    <span className="text-neutral-700">
                      {day.uniqueVisitors} visits · {day.generations} generations · {day.signups} signups
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>

        <p className="mt-8 text-center text-xs text-neutral-400">
          Total generations: {totalGenerations.toLocaleString("en-US")} · Total edits:{" "}
          {totalModifications.toLocaleString("en-US")}
        </p>
      </main>
    </div>
  );
}
