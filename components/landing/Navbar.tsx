import Link from "next/link";

import { ArrowRightIcon, LogoMark } from "@/components/icons";

export function Navbar({ showLinks = true }: { showLinks?: boolean }) {
  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200/70 bg-white/80 backdrop-blur-md">
      <nav className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-6">
        <Link
          href="/"
          className="flex items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950/20"
        >
          <LogoMark className="h-7 w-7" />
          <span className="text-[15px] font-semibold tracking-tight text-neutral-950">
            ContentRepurposer
          </span>
        </Link>

        {showLinks && (
          <div className="ml-4 hidden items-center gap-6 md:flex">
            <a
              href="#how-it-works"
              className="text-[13.5px] text-neutral-500 transition hover:text-neutral-950"
            >
              How it works
            </a>
            <a
              href="#formats"
              className="text-[13.5px] text-neutral-500 transition hover:text-neutral-950"
            >
              Output formats
            </a>
            <a
              href="#reliability"
              className="text-[13.5px] text-neutral-500 transition hover:text-neutral-950"
            >
              Reliability
            </a>
          </div>
        )}

        <div className="ml-auto flex items-center gap-2">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl bg-neutral-950 px-4 py-2 text-[13.5px] font-semibold text-white transition hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950/30 focus-visible:ring-offset-2"
          >
            Open the app
            <ArrowRightIcon className="h-3.5 w-3.5" />
          </Link>
        </div>
      </nav>
    </header>
  );
}
