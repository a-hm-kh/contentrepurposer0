import type { Metadata } from "next";
import Link from "next/link";

import { LogoMark } from "@/components/icons";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How ContentRepurposer collects, uses and protects your data.",
};

const SECTIONS = [
  {
    title: "What we collect",
    body: [
      "The content you paste to repurpose (your article text or video script) and the output we generate from it.",
      "Basic account details when you sign in with Google: your name, email address and profile picture.",
      "Technical usage data: generation counts, input type, tone and language, timestamps, and your IP address for abuse prevention.",
      "We never collect your card details — payments are handled entirely by Lemon Squeezy.",
    ],
  },
  {
    title: "Why we store your text",
    body: [
      "We keep a copy of the input and output in a protected database for diagnostics, quality improvement and abuse prevention.",
      "This record is visible to the platform owner (administrator) only. It is never shown to another user and never shared with a third party.",
      "You can request deletion of your full record at any time by contacting us, and we will respond within a reasonable period.",
    ],
  },
  {
    title: "Who can see your content",
    body: [
      "Only you. The bundle you generate is never shown to any other user on the platform.",
      "We send your text to one of several trusted AI providers to complete generation immediately, and it is not used to train our models.",
      "AI provider keys stay on the server and are never sent to your browser.",
    ],
  },
  {
    title: "Security",
    body: [
      "We follow standard security practices: signature verification on every payment, HTTPS-encrypted connections, and input sanitisation.",
      "We keep an administrative audit log of sensitive operations (sign-in, payment, generation) for monitoring and protection.",
      "We do not sell your data or share it with advertisers or data brokers.",
    ],
  },
  {
    title: "Retention and deletion",
    body: [
      "We retain technical logs for a limited period for security and performance measurement.",
      "When you delete your account, the data tied to it is removed from our databases.",
    ],
  },
];

export default function PrivacyPage() {
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
        <h1 className="text-3xl font-semibold tracking-tight text-neutral-950">Privacy Policy</h1>
        <p className="mt-3 text-[15px] leading-7 text-neutral-500">
          Your privacy is the foundation of the product. This page explains —
          clearly and without jargon — what we collect, why, and who can see it.
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

        <div className="surface mt-12 p-6 text-[14px] leading-7 text-neutral-600">
          <p className="font-semibold text-neutral-900">Questions or a data deletion request?</p>
          <p className="mt-1">Get in touch and we will handle your request as soon as possible.</p>
        </div>

        <div className="mt-8 flex gap-4 text-sm">
          <Link href="/terms" className="text-neutral-600 underline hover:text-neutral-950">Terms of Use</Link>
          <Link href="/" className="text-neutral-600 underline hover:text-neutral-950">Back to home</Link>
        </div>
      </main>
    </div>
  );
}
