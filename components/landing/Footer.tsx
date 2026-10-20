import Link from "next/link";

import { LogoMark } from "@/components/icons";
import { NewsletterForm } from "@/components/tool/NewsletterForm";

export function Footer() {
  return (
    <footer className="mx-auto max-w-6xl px-6 py-12">
      <div className="flex flex-col items-center justify-between gap-6 border-b border-neutral-200/70 pb-8 sm:flex-row">
        <Link
          href="/"
          className="flex items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950/20"
        >
          <LogoMark className="h-6 w-6" />
          <span className="text-sm font-medium tracking-tight text-neutral-700">
            ContentRepurposer
          </span>
        </Link>

        <div className="flex items-center gap-4 text-xs text-neutral-500">
          <Link href="/dashboard" className="transition hover:text-neutral-950">
            App
          </Link>
          <a href="#how-it-works" className="transition hover:text-neutral-950">
            How it works
          </a>
        </div>
      </div>

      <div className="flex flex-col items-center gap-6 py-8 lg:flex-row lg:justify-between">
        <div className="max-w-sm text-center lg:text-left">
          <h3 className="text-sm font-semibold tracking-tight text-neutral-950">
            Stay in the loop
          </h3>
          <p className="mt-1 text-[13px] leading-6 text-neutral-500">
            Be first to hear about new features, updates, and the launch of paid plans.
          </p>
        </div>

        <NewsletterForm className="w-full max-w-md" />
      </div>

      <div className="flex flex-col items-center justify-between gap-3 border-t border-neutral-200/70 pt-8 sm:flex-row">
        <p className="text-xs text-neutral-400">
          © {new Date().getFullYear()} <span className="font-medium text-neutral-600">Ahmad Khalil</span>. All rights reserved.
        </p>
        <p className="text-xs text-neutral-400">Designed &amp; built with care.</p>
      </div>
    </footer>
  );
}
