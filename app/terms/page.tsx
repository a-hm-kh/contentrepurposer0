import type { Metadata } from "next";
import Link from "next/link";

import { LogoMark } from "@/components/icons";

export const metadata: Metadata = {
  title: "Terms of Use",
  description: "The terms for using ContentRepurposer and subscribing to the Pro plan.",
};

const SECTIONS = [
  {
    title: "The service",
    body: [
      "ContentRepurposer turns a piece of content you provide into formats ready to publish on social platforms (LinkedIn, X, Instagram, Facebook) along with a weekly publishing plan.",
      "The service is a planning and writing tool only — it never publishes anything on your behalf and never connects to your accounts on any platform.",
    ],
  },
  {
    title: "Your responsibility for content",
    body: [
      "You are fully responsible for the content you paste and for any later use of the output.",
      "You must not paste content that is unlawful, infringes the rights of others, or contains sensitive personal data about third parties without permission.",
      "Always review the output before publishing — you are the final judge of its accuracy and suitability.",
    ],
  },
  {
    title: "Plans and pricing",
    body: [
      "The free plan gives you 10 generations for life. It is one-time and never renews or resets.",
      "The Pro plan is $15 per month and gives you 20 generations and 20 edits per day, refreshed automatically every 24 hours.",
      "Payments are processed by Lemon Squeezy. You can cancel at any time and the service continues until the end of the paid period.",
    ],
  },
  {
    title: "Fair use",
    body: [
      "Excessive or automated use (such as bulk programmatic access) to bypass the enforced limits is not allowed.",
      "We reserve the right to suspend any account whose use harms the service or other users.",
    ],
  },
  {
    title: "Limitation of liability",
    body: [
      "We provide the service \u201Cas is\u201D without absolute warranties. We make a reasonable effort to keep it available and high quality, but we do not guarantee the output is free of errors.",
      "We are not liable for any loss resulting from relying on the output without human review.",
    ],
  },
];

export default function TermsPage() {
  return (
    <div className="min-h-dvh bg-neutral-50/50">
      <header className="border-b border-neutral-200/70 bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-3xl items-center px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <LogoMark className="h-7 w-7" />
            <span className="text-[15px] font-semibold tracking-tight text-neutral-950">ContentRepurposer</span>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-3xl font-semibold tracking-tight text-neutral-950">Terms of Use</h1>
        <p className="mt-3 text-[15px] leading-7 text-neutral-500">
          By using the platform you agree to the following terms. They are written
          in plain language so they are completely clear.
        </p>

        <div className="mt-10 space-y-8">
          {SECTIONS.map((section) => (
            <section key={section.title}>
              <h2 className="text-lg font-semibold tracking-tight text-neutral-950">{section.title}</h2>
              <ul className="mt-3 space-y-2">
                {section.body.map((line) => (
                  <li key={line} className="flex gap-2.5 text-[14.5px] leading-7 text-neutral-600">
                    <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-neutral-300" />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <div className="mt-8 flex gap-4 text-sm">
          <Link href="/privacy" className="text-neutral-600 underline hover:text-neutral-950">Privacy Policy</Link>
          <Link href="/" className="text-neutral-600 underline hover:text-neutral-950">Back to home</Link>
        </div>
      </main>
    </div>
  );
}
