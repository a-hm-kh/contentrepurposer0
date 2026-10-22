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
    body: "An article, a blog post, a newsletter, a video script or even a chat transcript. Up to 20,000 characters, no formatting required.",
  },
  {
    title: "Pick your style",
    body: "Choose the content type and the writing tone (formal, casual, marketing, educational…) and the engine adapts to every choice.",
  },
  {
    title: "Copy and publish",
    body: "You get the full bundle: LinkedIn, a numbered X thread, an Instagram caption, a Facebook post, hooks and a call to action — ready to copy.",
  },
];

const RELIABILITY_POINTS = [
  "A fast primary engine that handles most requests in seconds.",
  "If it fails, stalls or hits its limit, the same job is automatically retried on a backup engine.",
  "An optional third engine adds an extra safety net.",
  "A smart review step compares the output against your source and keeps invented ideas out.",
];

const FREE_FEATURES = [
  "10 free generations, for life",
  "Every post format included",
  "Email newsletter, carousel & article",
  "Outputs in your own language",
  "Tone selection",
  "One-click copy on every result",
];

const PRO_FEATURES = [
  "20 generations per day (refreshed daily)",
  "20 inline edits per day",
  "Every format: newsletter, carousel, article & more",
  "7-day publishing plan with export",
  "Video-script support and title ideas",
  "Smart review + publishing checklist",
  "Cancel anytime in one click — no emails",
];

const TRUST_POINTS = [
  {
    title: "Speaks your language",
    body: "Paste content in any language and every output comes back in that same language — natively written, never machine-translated.",
  },
  {
    title: "We never post for you",
    body: "No risky auto-publishing that can get your accounts flagged. Copy each piece and publish it yourself, on your terms.",
  },
  {
    title: "Nothing burns on a failure",
    body: "If the generator is briefly busy, you see a calm message — and your credit is not spent. Nothing is charged unless you get results.",
  },
  {
    title: "Cancel in one click",
    body: "Manage or cancel your plan straight from your dashboard. No support emails, no phone calls, no retention maze.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-24 border-b border-neutral-200/70">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <header className="max-w-2xl">
          <p className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.18em] text-neutral-400">
            <span aria-hidden className="h-1 w-1 rounded-full bg-sky-500" />
            How it works
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-neutral-950 sm:text-4xl">
            From a long piece of content to a full publishing plan in three steps
          </h2>
        </header>

        <ol className="mt-12 grid gap-8 md:grid-cols-3">
          {STEPS.map((step, index) => (
            <li
              key={step.title}
              className="surface group p-6 transition duration-200 hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow-[var(--shadow-raised)]"
            >
              <div className="flex items-center gap-3">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-neutral-950 font-mono text-xs font-semibold text-white transition group-hover:bg-neutral-800">
                  {index + 1}
                </span>
                <h3 className="text-base font-semibold tracking-tight text-neutral-950">
                  {step.title}
                </h3>
              </div>
              <p className="mt-3 text-[14.5px] leading-7 text-neutral-500">
                {step.body}
              </p>
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
          <p className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.18em] text-neutral-400">
            <span aria-hidden className="h-1 w-1 rounded-full bg-sky-500" />
            The output bundle
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-neutral-950 sm:text-4xl">
            Every platform in its own voice — never a copy-paste repeat
          </h2>
          <p className="mt-4 text-[15px] leading-7 text-neutral-500">
            The same source material, reworked for each platform while your
            original ideas stay exactly as you wrote them.
          </p>
        </header>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {PLATFORM_LIST.map((platform) => (
            <article
              key={platform.id}
              className="surface flex flex-col p-6 transition duration-200 hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow-[var(--shadow-raised)]"
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

export function FailoverBand() {
  return (
    <section id="reliability" className="scroll-mt-24 border-b border-neutral-200/70">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <div className="surface grid gap-10 p-8 sm:p-12 lg:grid-cols-2 lg:items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 ring-1 ring-amber-200/70">
              <BoltIcon className="h-3.5 w-3.5" />
              Built to stay up
            </span>
            <h2 className="mt-5 text-3xl font-semibold tracking-tight text-neutral-950">
              Generation that never stalls — and never loses your idea
            </h2>
            <p className="mt-4 text-[15px] leading-7 text-neutral-500">
              One engine means one point of failure. That is why
              ContentRepurposer runs on a chain of engines behind a review
              layer, so a limit on one provider never reaches your client — and
              your idea stays untouched.
            </p>

            <Link href="/dashboard" className="btn btn-primary btn-md mt-7">
              Try it on your content
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
                Provider keys stay on the server. Your text is never shared with
                a third party, and the review log is visible only to the
                administrator to protect quality.
              </p>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}

export function Pricing() {
  return (
    <section id="pricing" className="scroll-mt-24 border-b border-neutral-200/70 bg-neutral-50/50">
      <div className="mx-auto max-w-5xl px-6 py-20">
        <header className="text-center">
          <p className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.18em] text-neutral-400">
            <span aria-hidden className="h-1 w-1 rounded-full bg-sky-500" />
            Pricing
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-neutral-950 sm:text-4xl">
            Start free, upgrade when you need it
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-[15px] leading-7 text-neutral-500">
            Your first 10 generations are free for life — they never renew.
            After that, Pro is simple and predictable, and you can cancel
            anytime in one click.
          </p>
        </header>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          <div className="surface flex flex-col p-8">
            <h3 className="text-lg font-semibold tracking-tight text-neutral-950">
              Free
            </h3>
            <p className="mt-2 text-3xl font-semibold text-neutral-950">
              $0
            </p>
            <p className="mt-1 text-[13px] text-neutral-500">
              One-time — never renews
            </p>
            <ul className="mt-6 flex-1 space-y-2.5 text-[14px] text-neutral-600">
              {FREE_FEATURES.map((feature) => (
                <li key={feature} className="flex gap-2">
                  <CheckIcon className="mt-1 h-4 w-4 shrink-0 text-emerald-600" />
                  {feature}
                </li>
              ))}
            </ul>
            <Link href="/dashboard" className="btn btn-secondary btn-lg mt-8">
              Start free
            </Link>
          </div>

          <div className="relative flex flex-col overflow-hidden rounded-2xl border border-neutral-900 bg-neutral-950 p-8 text-white shadow-[var(--shadow-raised)]">
            <span className="absolute left-6 top-6 rounded-full bg-white/10 px-3 py-1 text-[11px] font-medium text-white/80">
              Most popular
            </span>
            <h3 className="text-lg font-semibold tracking-tight">Pro</h3>
            <p className="mt-2 text-3xl font-semibold">
              $15
              <span className="text-base font-normal text-white/60">/month</span>
            </p>
            <p className="mt-1 text-[13px] text-white/60">
              Renews monthly — cancel anytime
            </p>
            <ul className="mt-6 flex-1 space-y-2.5 text-[14px] text-white/85">
              {PRO_FEATURES.map((feature) => (
                <li key={feature} className="flex gap-2">
                  <CheckIcon className="mt-1 h-4 w-4 shrink-0 text-emerald-400" />
                  {feature}
                </li>
              ))}
            </ul>
            <Link
              href="/dashboard/billing"
              className="btn btn-on-dark btn-lg mt-8"
            >
              Upgrade to Pro
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export function TrustBand() {
  return (
    <section id="why" className="scroll-mt-24 border-b border-neutral-200/70">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <header className="max-w-2xl">
          <p className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.18em] text-neutral-400">
            <span aria-hidden className="h-1 w-1 rounded-full bg-emerald-500" />
            Why people stay
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-neutral-950 sm:text-4xl">
            The things that make creators quit other tools — solved here
          </h2>
          <p className="mt-4 text-[15px] leading-7 text-neutral-500">
            Everything you need in one place, with none of the traps that turn a
            useful tool into a frustrating subscription.
          </p>
        </header>

        <div className="mt-12 grid gap-5 sm:grid-cols-2">
          {TRUST_POINTS.map((point) => (
            <article key={point.title} className="surface p-6">
              <div className="flex items-center gap-2.5">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-emerald-50 ring-1 ring-emerald-200">
                  <CheckIcon className="h-3 w-3 text-emerald-600" />
                </span>
                <h3 className="text-base font-semibold tracking-tight text-neutral-950">
                  {point.title}
                </h3>
              </div>
              <p className="mt-3 text-[14.5px] leading-7 text-neutral-500">{point.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function CtaBand() {
  return (
    <section className="border-b border-neutral-200/70">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <div className="relative overflow-hidden rounded-2xl border border-neutral-900 bg-neutral-950 px-6 py-16 text-center shadow-[var(--shadow-raised)] sm:px-12">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-24 left-1/2 h-72 w-[560px] -translate-x-1/2 rounded-full bg-linear-to-r from-violet-500/20 via-sky-500/20 to-emerald-500/20 blur-3xl"
          />
          <div className="relative">
            <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              One piece of content, a complete publishing plan
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-[15px] leading-7 text-white/60">
              No sign-up to start and no credit card. Your first 10 generations
              are free — in any language, with every format unlocked.
            </p>
            <Link
              href="/dashboard"
              className="btn btn-on-dark btn-lg mt-8"
            >
              Try it free
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
