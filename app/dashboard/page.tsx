import type { Metadata } from "next";
import Link from "next/link";

import { UserMenu } from "@/components/auth/UserMenu";
import { LogoMark } from "@/components/icons";
import { NewsletterForm } from "@/components/tool/NewsletterForm";
import { RepurposeTool } from "@/components/tool/RepurposeTool";
import { signOutAction } from "@/lib/auth/actions";
import { auth } from "@/lib/auth/config";

export const metadata: Metadata = {
  title: "Studio",
  description:
    "Turn an article or video script into a LinkedIn post, an X thread, an Instagram caption, a Facebook post and a weekly publishing plan.",
};

export default async function DashboardPage() {
  const session = await auth();
  const user = session?.user;

  return (
    <div className="min-h-dvh bg-neutral-50/50">
      <header className="sticky top-0 z-40 border-b border-neutral-200/70 bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-6">
          <Link href="/" className="flex items-center gap-2.5 rounded-lg focus-visible:outline-none">
            <LogoMark className="h-7 w-7" />
            <span className="text-[15px] font-semibold tracking-tight text-neutral-950">
              ContentRepurposer
            </span>
          </Link>

          <nav className="ml-auto hidden items-center gap-1 sm:flex">
            <Link href="/weekly-plan" className="btn btn-ghost btn-sm">
              Weekly plan
            </Link>
            <Link href="/dashboard/billing" className="btn btn-ghost btn-sm">
              Billing
            </Link>
          </nav>

          {user ? (
            <UserMenu
              name={user.name}
              email={user.email}
              image={user.image}
              isAdmin={user.role === "ADMIN"}
              signOutAction={signOutAction}
            />
          ) : (
            <Link href="/auth/signin" className="btn btn-secondary btn-sm">
              Sign in
            </Link>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-950 sm:text-3xl">
            The Studio
          </h1>
          <p className="mt-2 max-w-2xl text-[15px] leading-7 text-neutral-500">
            Paste your content, pick a tone, and get a complete bundle ready to
            edit and publish — with a smart review that keeps your original idea
            intact.
          </p>
        </div>

        <RepurposeTool />

        <div className="mt-12 grid gap-4 lg:grid-cols-2">
          <Link
            href="/weekly-plan"
            className="surface group p-6 transition hover:border-neutral-300"
          >
            <p className="text-sm font-semibold tracking-tight text-neutral-950">
              Weekly publishing plan
            </p>
            <p className="mt-1 text-[13px] leading-6 text-neutral-500">
              Drop in an article or script and get a seven-day publishing plan:
              platform, post type, topic and suggested time — with JSON / CSV /
              Markdown export.
            </p>
          </Link>

          <div className="surface flex flex-col gap-5 px-6 py-6">
            <div>
              <p className="text-sm font-semibold tracking-tight text-neutral-950">
                Product updates
              </p>
              <p className="mt-0.5 text-[13px] leading-6 text-neutral-500">
                New formats, improvements and paid plan launches — straight to
                your inbox.
              </p>
            </div>
            <NewsletterForm className="w-full" />
          </div>
        </div>
      </main>

      <footer className="mx-auto max-w-6xl px-6 pb-10">
        <p className="text-xs text-neutral-400">
          © {new Date().getFullYear()}{" "}
          <span className="font-medium text-neutral-600">Ahmad Khalil</span>.
          All rights reserved.
        </p>
      </footer>
    </div>
  );
}
