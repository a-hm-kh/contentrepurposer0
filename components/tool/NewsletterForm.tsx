"use client";

import { useEffect, useRef, useState } from "react";

import { ArrowRightIcon, CheckIcon, SpinnerIcon } from "@/components/icons";

type Status = "idle" | "loading" | "done" | "error";

interface SubscribeResponse {
  ok: boolean;
  message?: string;
  error?: string;
}

export function NewsletterForm({ className = "" }: { className?: string }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timeout.current) clearTimeout(timeout.current);
  }, []);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const value = email.trim();
    if (!value || status === "loading") return;

    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: value, source: "footer" }),
      });

      const payload = (await res.json().catch(() => null)) as SubscribeResponse | null;

      if (!res.ok || !payload?.ok) {
        setStatus("error");
        setMessage(payload?.error ?? "Something went wrong. Please try again.");
        return;
      }

      setStatus("done");
      setMessage(payload.message ?? "You're on the list!");
      setEmail("");
    } catch {
      setStatus("error");
      setMessage("We couldn't reach the server. Please try again.");
    }
  }

  if (status === "done") {
    return (
      <div
        role="status"
        className={`inline-flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-[13px] font-medium text-emerald-800 ${className}`}
      >
        <CheckIcon className="h-4 w-4 shrink-0 text-emerald-600" />
        {message}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={className}>
      <div className="flex items-center gap-2">
        <label htmlFor="newsletter-email" className="sr-only">
          Email address
        </label>

        <input
          id="newsletter-email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          className="w-full min-w-0 rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-[13.5px] text-neutral-900 transition placeholder:text-neutral-400 focus:border-neutral-300 focus:outline-none focus:ring-4 focus:ring-neutral-950/5 sm:w-64"
        />

        <button
          type="submit"
          disabled={status === "loading"}
          aria-busy={status === "loading"}
          className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-neutral-950 px-4 py-2.5 text-[13.5px] font-semibold text-white transition hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950/30 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {status === "loading" ? (
            <SpinnerIcon className="h-3.5 w-3.5" />
          ) : (
            <ArrowRightIcon className="h-3.5 w-3.5" />
          )}
          Subscribe
        </button>
      </div>

      {status === "error" && message ? (
        <p role="alert" className="mt-2 text-xs text-red-600">
          {message}
        </p>
      ) : (
        <p className="mt-2 text-xs text-neutral-400">
          New features &amp; updates. No spam — unsubscribe anytime.
        </p>
      )}
    </form>
  );
}
