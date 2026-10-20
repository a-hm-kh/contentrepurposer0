import Link from "next/link";

import {
  ArrowRightIcon,
  BoltIcon,
  CheckIcon,
  ShieldIcon,
} from "@/components/icons";
import { PLATFORM_LIST } from "@/components/platforms";

const STEPS = [
  {
    title: "Paste your content",
    body: "Drop in an article, blog post, newsletter, or raw transcript. Up to 20,000 characters, no formatting required.",
  },
  {
    title: "AI repurposes it",
    body: "One structured prompt extracts the hook, the argument, and the takeaways — then rewrites them for each platform.",
  },
  {
    title: "Copy and publish",
    body: "Each format arrives ready to paste: a numbered thread, a LinkedIn post with a CTA, a caption with hashtags.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-24 border-b border-neutral-200/70">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <header className="max-w-2xl">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-neutral-400">
            How it works
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-neutral-950 sm:text-4xl">
            From long-form to publish-ready in three steps
          </h2>
        </header>

        <ol className="mt-12 grid gap-8 md:grid-cols-3">
          {STEPS.map((step, index) => (
            <li key={step.title} className="relative">
              <div className="flex items-center gap-3">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-neutral-950 font-mono text-xs font-semibold text-white">
                  {index + 1}
                </span>
                <h3 className="text-base font-semibold tracking-tight text-neutral-950">
                  {step.title}
                </h3>
              </div>
              <p className="mt-3 text-[14.5px] leading-7 text-neutral-500">{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function Formats() {
  return (
    <section id="formats" className="scroll-mt-24 border-b border-neutral-200/70 bg-neutral-50/50">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <header className="max-w-2xl">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-neutral-400">
            Output formats
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-neutral-950 sm:text-4xl">
            Three formats, tuned for how each platform actually reads
          </h2>
          <p className="mt-4 text-[15px] leading-7 text-neutral-500">
            Same source material, three different voices — not one post recycled three times.
          </p>
        </header>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {PLATFORM_LIST.map((platform) => (
            <article
              key={platform.id}
              className="flex flex-col rounded-2xl border border-neutral-200 bg-white p-6 shadow-[0_1px_2px_rgba(10,10,10,0.04)] transition-shadow hover:shadow-[0_10px_40px_-20px_rgba(10,10,10,0.25)]"
            >
              <span className={`grid h-10 w-10 place-items-center rounded-xl ${platform.tile}`}>
                <platform.Icon className={`h-5 w-5 ${platform.glyph}`} />
              </span>
              <h3 className="mt-5 text-base font-semibold tracking-tight text-neutral-950">
                {platform.label}
              </h3>
              <p className="mt-1 text-xs text-neutral-400">{platform.tagline}</p>
              <p className="mt-3 text-[14.5px] leading-7 text-neutral-500">
                {platform.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

const RELIABILITY_POINTS = [
  "A fast primary engine handles most requests in seconds.",
  "If it fails, times out, or rate-limits, the same prompt is retried on a backup engine automatically.",
  "An extra engine can be enabled for an additional safety net.",
  "If every engine is down you get a clear, friendly message — never a broken spinner.",
];

export function FailoverBand() {
  return (
    <section id="reliability" className="scroll-mt-24 border-b border-neutral-200/70">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid gap-10 rounded-3xl border border-neutral-200 bg-white p-8 sm:p-12 lg:grid-cols-2 lg:items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 ring-1 ring-amber-200/70">
              <BoltIcon className="h-3.5 w-3.5" />
              Built for uptime
            </span>
            <h2 className="mt-5 text-3xl font-semibold tracking-tight text-neutral-950">
              Generation that never dead-ends
            </h2>
            <p className="mt-4 text-[15px] leading-7 text-neutral-500">
              A single AI engine is a single point of failure. ContentRepurposer runs a
              failover chain, so a rate limit on one engine is invisible to your workflow.
            </p>

            <Link
              href="/dashboard"
              className="mt-7 inline-flex items-center gap-2 rounded-xl bg-neutral-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-800"
            >
              Try it on your own text
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </div>

          <ul className="space-y-4">
            {RELIABILITY_POINTS.map((point) => (
              <li key={point} className="flex gap-3">
                <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-emerald-50 ring-1 ring-emerald-200">
                  <CheckIcon className="h-3 w-3 text-emerald-600" />
                </span>
                <p className="text-[14.5px] leading-7 text-neutral-600">{point}</p>
              </li>
            ))}
            <li className="flex gap-3 pt-2">
              <ShieldIcon className="mt-0.5 h-5 w-5 shrink-0 text-neutral-400" />
              <p className="text-[13px] leading-6 text-neutral-400">
                Your API keys stay server-side. Only the text you paste leaves the browser.
              </p>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}

export function CtaBand() {
  return (
    <section className="border-b border-neutral-200/70">
      <div className="mx-auto max-w-3xl px-6 py-20 text-center">
        <h2 className="text-3xl font-semibold tracking-tight text-neutral-950 sm:text-4xl">
          Your next article is already three posts
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-[15px] leading-7 text-neutral-500">
          No account, no credit card. Your first 10 generations are free.
        </p>
        <Link
          href="/dashboard"
          className="mt-8 inline-flex items-center gap-2 rounded-xl bg-neutral-950 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-neutral-800"
        >
          Try it now
          <ArrowRightIcon className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}
