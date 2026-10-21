import type { Metadata } from "next";
import Link from "next/link";

import { LogoMark } from "@/components/icons";

export const metadata: Metadata = {
  title: "Sign-in error",
};

export default function AuthErrorPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-neutral-50/50 px-6">
      <div className="surface w-full max-w-md p-8 text-center shadow-[var(--shadow-raised)]">
        <Link href="/" className="mx-auto flex w-fit items-center gap-2.5">
          <LogoMark className="h-8 w-8" />
          <span className="text-base font-semibold tracking-tight text-neutral-950">
            ContentRepurposer
          </span>
        </Link>

        <h1 className="mt-8 text-xl font-semibold tracking-tight text-neutral-950">
          We could not complete the sign-in
        </h1>
        <p className="mt-3 text-[14px] leading-7 text-neutral-500">
          Something went wrong while authenticating with Google. Make sure pop-ups
          are allowed, or try again.
        </p>

        <Link href="/auth/signin" className="btn btn-primary btn-lg mt-6">
          Try again
        </Link>

        <p className="mt-4 text-[13px] text-neutral-500">
          Or{" "}
          <Link href="/dashboard" className="font-medium text-neutral-800 underline">
            continue without an account
          </Link>
        </p>
      </div>
    </div>
  );
}
