"use client";

import Link from "next/link";
import { useState } from "react";

import { AlertIcon, ArrowRightIcon, LogoMark, SparklesIcon, SpinnerIcon } from "@/components/icons";
import { MAX_INPUT_CHARS, MIN_INPUT_CHARS } from "@/lib/constants";

interface PlanDay {
  day: string;
  platform: string;
  type: string;
  topic: string;
  time: string;
  hook: string;
  goal: string;
}

type ExportFormat = "json" | "csv" | "markdown";

const PLATFORM_STYLES: Record<string, string> = {
  linkedin: "bg-[#0A66C2]/10 text-[#0A66C2]",
  instagram: "bg-[#DD2A7B]/10 text-[#DD2A7B]",
  facebook: "bg-[#1877F2]/10 text-[#1877F2]",
  x: "bg-neutral-900/5 text-neutral-800",
  tiktok: "bg-neutral-900/5 text-neutral-800",
  youtube: "bg-red-500/10 text-red-600",
};

function platformTone(platform: string): string {
  const key = platform.toLowerCase();
  const match = Object.keys(PLATFORM_STYLES).find((k) => key.includes(k));
  return match ? PLATFORM_STYLES[match]! : "bg-neutral-100 text-neutral-600";
}

function download(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function toCsv(plan: PlanDay[]): string {
  const headers = "اليوم,المنصة,نوع النشر,الموضوع,الوقت,الخطاف,الهدف\n";
  const escape = (value: string) => `"${(value ?? "").replace(/"/g, '""')}"`;
  const rows = plan
    .map((d) => [d.day, d.platform, d.type, d.topic, d.time, d.hook, d.goal].map(escape).join(","))
    .join("\n");
  return `\ufeff${headers}${rows}`;
}

function toMarkdown(plan: PlanDay[]): string {
  let md = "# خطة النشر الأسبوعية\n\n";
  plan.forEach((d, idx) => {
    md += `## اليوم ${idx + 1}: ${d.day}\n\n`;
    md += `- **المنصة:** ${d.platform}\n`;
    md += `- **نوع النشر:** ${d.type}\n`;
    md += `- **الموضوع:** ${d.topic}\n`;
    md += `- **الوقت المقترح:** ${d.time}\n`;
    md += `- **خطاف مقترح:** ${d.hook}\n`;
    md += `- **الهدف:** ${d.goal}\n\n`;
  });
  return md;
}

export default function WeeklyPlanPage() {
  const [text, setText] = useState("");
  const [language, setLanguage] = useState<"ar" | "en">("ar");
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<PlanDay[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const trimmed = text.trim();
  const canGenerate = trimmed.length >= MIN_INPUT_CHARS && trimmed.length <= MAX_INPUT_CHARS && !loading;

  async function generatePlan() {
    if (!canGenerate) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/weekly-plan/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, language }),
      });
      const payload = (await res.json().catch(() => null)) as
        | { ok: true; plan: PlanDay[] }
        | { ok: false; error?: string }
        | null;

      if (!res.ok || !payload || payload.ok !== true) {
        setError(payload && payload.ok === false && payload.error ? payload.error : "تعذّر إنشاء الخطة. حاول مرة أخرى.");
        return;
      }

      setPlan(payload.plan);
    } catch {
      setError("تعذّر الوصول إلى الخادم. تحقّق من اتصالك بالإنترنت.");
    } finally {
      setLoading(false);
    }
  }

  function exportPlan(format: ExportFormat) {
    if (!plan) return;
    if (format === "json") download("weekly-plan.json", JSON.stringify(plan, null, 2), "application/json");
    else if (format === "csv") download("weekly-plan.csv", toCsv(plan), "text/csv;charset=utf-8;");
    else download("weekly-plan.md", toMarkdown(plan), "text/markdown");
  }

  return (
    <div className="min-h-dvh bg-neutral-50/50" dir="rtl">
      <header className="sticky top-0 z-40 border-b border-neutral-200/70 bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-6">
          <Link
            href="/"
            className="flex items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950/20"
          >
            <LogoMark className="h-7 w-7" />
            <span className="text-[15px] font-semibold tracking-tight text-neutral-950">
              ContentRepurposer
            </span>
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

      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-950 sm:text-3xl">
            خطة النشر الأسبوعية
          </h1>
          <p className="mt-2 max-w-2xl text-[15px] leading-7 text-neutral-500">
            الصق مقالاً أو سكريبت فيديو، واحصل على خطة نشر لسبعة أيام: المنصة، نوع المنشور، الموضوع،
            الوقت المقترح، وخطاف جاهز. تخطيط وتصدير فقط — لا نلمس حساباتك إطلاقاً.
          </p>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-[0_1px_3px_rgba(10,10,10,0.05)] sm:p-6">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <label htmlFor="plan-text" className="text-sm font-semibold tracking-tight text-neutral-900">
              المحتوى الأصلي
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as "ar" | "en")}
              className="rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-[13px] text-neutral-800 focus:border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-950/5"
            >
              <option value="ar">العربية</option>
              <option value="en">English</option>
            </select>
          </div>

          <textarea
            id="plan-text"
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, MAX_INPUT_CHARS))}
            rows={8}
            dir={language === "ar" ? "rtl" : "ltr"}
            placeholder="الصق المقال أو السكريبت هنا…"
            className="scrollbar-thin min-h-[180px] w-full resize-y rounded-xl border border-neutral-200 bg-neutral-50/60 px-4 py-3.5 text-[15px] leading-7 text-neutral-800 transition placeholder:text-neutral-400 focus:border-neutral-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-neutral-950/5"
          />

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <span className="font-mono text-xs text-neutral-400">
              {text.length.toLocaleString()} / {MAX_INPUT_CHARS.toLocaleString()}
            </span>
            <button
              type="button"
              onClick={() => void generatePlan()}
              disabled={!canGenerate}
              aria-busy={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-neutral-950 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950/30 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {loading ? (
                <>
                  <SpinnerIcon className="h-4 w-4" /> جاري إنشاء الخطة…
                </>
              ) : (
                <>
                  <SparklesIcon className="h-4 w-4" /> اقترح خطة النشر
                </>
              )}
            </button>
          </div>
        </div>

        {error && (
          <div role="alert" className="animate-fade-in mt-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50/70 px-4 py-3.5 text-sm text-red-800">
            <AlertIcon className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
            <p>{error}</p>
          </div>
        )}

        {plan && (
          <>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <span className="text-sm font-semibold text-neutral-900">تصدير الخطة:</span>
              <button onClick={() => exportPlan("json")} className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-[13px] font-medium text-neutral-700 transition hover:bg-neutral-50">
                JSON
              </button>
              <button onClick={() => exportPlan("csv")} className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-[13px] font-medium text-neutral-700 transition hover:bg-neutral-50">
                CSV
              </button>
              <button onClick={() => exportPlan("markdown")} className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-[13px] font-medium text-neutral-700 transition hover:bg-neutral-50">
                Markdown
              </button>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              {plan.map((day, idx) => (
                <article key={`${day.day}-${idx}`} className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-[0_1px_2px_rgba(10,10,10,0.04)]">
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-neutral-950 font-mono text-sm font-semibold text-white">
                      {idx + 1}
                    </span>
                    <div>
                      <h3 className="text-sm font-semibold tracking-tight text-neutral-950">{day.day}</h3>
                      <p className="text-xs text-neutral-500">{day.time} · {day.platform}</p>
                    </div>
                    <span className={`mr-auto rounded-full px-2.5 py-1 text-[11px] font-medium ${platformTone(day.platform)}`}>
                      {day.platform}
                    </span>
                  </div>

                  <dl className="mt-4 space-y-2 text-[13.5px] leading-6">
                    <div className="flex gap-2">
                      <dt className="shrink-0 font-medium text-neutral-500">نوع النشر:</dt>
                      <dd className="text-neutral-700">{day.type}</dd>
                    </div>
                    <div className="flex gap-2">
                      <dt className="shrink-0 font-medium text-neutral-500">الموضوع:</dt>
                      <dd className="text-neutral-700">{day.topic}</dd>
                    </div>
                    <div className="flex gap-2">
                      <dt className="shrink-0 font-medium text-neutral-500">خطاف مقترح:</dt>
                      <dd className="text-neutral-700">{day.hook}</dd>
                    </div>
                    {day.goal && (
                      <div className="flex gap-2">
                        <dt className="shrink-0 font-medium text-neutral-500">الهدف:</dt>
                        <dd className="text-neutral-700">{day.goal}</dd>
                      </div>
                    )}
                  </dl>
                </article>
              ))}
            </div>
          </>
        )}
      </main>

      <footer className="mx-auto max-w-6xl px-6 pb-10">
        <p className="text-xs text-neutral-400">
          © {new Date().getFullYear()} <span className="font-medium text-neutral-600">Ahmad Khalil</span>. جميع الحقوق محفوظة.
        </p>
      </footer>
    </div>
  );
}
