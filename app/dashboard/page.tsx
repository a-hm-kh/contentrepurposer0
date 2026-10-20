import type { Metadata } from "next";
import Link from "next/link";

import { LogoMark } from "@/components/icons";
import { NewsletterForm } from "@/components/tool/NewsletterForm";
import { RepurposeTool } from "@/components/tool/RepurposeTool";

export const metadata: Metadata = {
  title: "Repurpose studio",
  description:
    "Paste an article and generate a LinkedIn post, an X thread, and an Instagram caption.",
};

export default function DashboardPage() {
  return (
    <div className="min-h-dvh bg-neutral-50/50">
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

          <span className="ml-auto hidden items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-1 text-[11px] font-medium text-neutral-500 sm:inline-flex">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Private by design · nothing stored
          </span>

          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[13px] font-medium text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-950"
          >
            Back home
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-950 sm:text-3xl">
            Repurpose studio
          </h1>
          <p className="mt-2 max-w-2xl text-[15px] leading-7 text-neutral-500">
            Paste your long-form content, generate all three formats at once, then copy
            whichever one you need. Nothing is stored — your text is only used for this
            request.
          </p>
        </div>

        <RepurposeTool />

        <div className="mt-12 flex flex-col gap-5 rounded-2xl border border-neutral-200 bg-white px-6 py-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-md">
            <p className="text-sm font-semibold tracking-tight text-neutral-950">
              Get product updates
            </p>
            <p className="mt-0.5 text-[13px] leading-6 text-neutral-500">
              New features, improvements, and the launch of paid plans — straight to your
              inbox.
            </p>
          </div>
          <NewsletterForm className="w-full lg:max-w-md" />
        </div>
      </main>

      <footer className="mx-auto max-w-6xl px-6 pb-10">
        <p className="text-xs text-neutral-400">
          © {new Date().getFullYear()}{" "}
          <span className="font-medium text-neutral-600">Ahmad Khalil</span>. All rights
          reserved.
        </p>
      </footer>
    </div>
  );
}
