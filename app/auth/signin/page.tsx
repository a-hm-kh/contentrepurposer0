import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { LogoMark } from "@/components/icons";
import { auth, signIn } from "@/lib/auth/config";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to ContentRepurposer with your Google account.",
};

export default async function SignInPage() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <div className="flex min-h-dvh items-center justify-center bg-neutral-50/50 px-6">
      <div className="surface w-full max-w-md p-8 shadow-[var(--shadow-raised)]">
        <Link href="/" className="mx-auto flex w-fit items-center gap-2.5">
          <LogoMark className="h-8 w-8" />
          <span className="text-base font-semibold tracking-tight text-neutral-950">
            ContentRepurposer
          </span>
        </Link>

        <div className="mt-8 text-center">
          <h1 className="text-xl font-semibold tracking-tight text-neutral-950">
            Sign in
          </h1>
          <p className="mt-2 text-[14px] leading-6 text-neutral-500">
            Sign in to save your content bundles, manage your subscription and
            unlock the weekly publishing plan.
          </p>
        </div>

        <form
          className="mt-8"
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: "/dashboard" });
          }}
        >
          <button type="submit" className="btn btn-secondary btn-lg w-full">
            <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden>
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-neutral-400">
          By continuing you agree to our{" "}
          <Link href="/terms" className="underline hover:text-neutral-600">
            Terms of Use
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="underline hover:text-neutral-600">
            Privacy Policy
          </Link>
          .
        </p>

        <p className="mt-4 text-center text-[13px] text-neutral-500">
          No account needed to start —{" "}
          <Link
            href="/dashboard"
            className="font-medium text-neutral-800 underline hover:text-neutral-950"
          >
            try 10 free generations
          </Link>
        </p>
      </div>
    </div>
  );
}
