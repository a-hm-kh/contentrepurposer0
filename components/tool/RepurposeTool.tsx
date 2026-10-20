"use client";

import { useEffect, useRef, useState } from "react";

import { AlertIcon, BoltIcon, CheckIcon, SparklesIcon, SpinnerIcon, TrashIcon } from "@/components/icons";
import { PLATFORM_ORDER, PLATFORMS } from "@/components/platforms";
import { NewsletterForm } from "@/components/tool/NewsletterForm";
import { CopyButton } from "@/components/tool/CopyButton";
import {
  OutputCard,
  OutputCardPlaceholder,
  OutputCardSkeleton,
} from "@/components/tool/OutputCard";
import { DRAFT_STORAGE_KEY, MAX_INPUT_CHARS, MIN_INPUT_CHARS } from "@/lib/constants";
import { SAMPLE_ARTICLE } from "@/lib/sample";
import type { RepurposedContent, RepurposeResponse, UsageInfo } from "@/lib/types";

/** Set NEXT_PUBLIC_PRO_URL once payments are live (Stripe, Lemon Squeezy…). */
const PRO_URL = process.env.NEXT_PUBLIC_PRO_URL?.trim() || null;

interface Meta {
  elapsedMs: number;
  failedProviders: number;
}

export function RepurposeTool() {
  const [text, setText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<RepurposedContent | null>(null);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [usage, setUsage] = useState<UsageInfo | null>(null);

  const outputRef = useRef<HTMLElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Load the visitor's lifetime free-quota (sets an anonymous cookie).
  useEffect(() => {
    fetch("/api/usage", { cache: "no-store" })
      .then((res) => res.json())
      .then((payload) => {
        if (payload?.ok && payload.usage) setUsage(payload.usage);
      })
      .catch(() => undefined);
  }, []);

  // Pick up text handed over from the landing page hero.
  useEffect(() => {
    try {
      const draft = sessionStorage.getItem(DRAFT_STORAGE_KEY);
      if (draft) {
        setText(draft.slice(0, MAX_INPUT_CHARS));
        sessionStorage.removeItem(DRAFT_STORAGE_KEY);
        textareaRef.current?.focus();
      }
    } catch {
      /* sessionStorage unavailable — ignore */
    }
  }, []);

  const trimmed = text.trim();
  const canGenerate = trimmed.length >= MIN_INPUT_CHARS && trimmed.length <= MAX_INPUT_CHARS;
  const nearLimit = text.length > MAX_INPUT_CHARS * 0.9;
  const exhausted = usage?.exhausted ?? false;

  async function generate() {
    if (isLoading) return;

    if (trimmed.length < MIN_INPUT_CHARS) {
      setError(
        `Please paste at least ${MIN_INPUT_CHARS} characters — a paragraph or two is enough to start.`,
      );
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/repurpose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      const payload = (await res.json().catch(() => null)) as RepurposeResponse | null;

      if (payload && "usage" in payload && payload.usage) {
        setUsage(payload.usage);
      }

      if (!res.ok || !payload || payload.ok !== true) {
        setError(
          payload && payload.ok === false && payload.error
            ? payload.error
            : "Something went wrong while generating your content. Please try again.",
        );
        return;
      }

      setResult(payload.data);
      setMeta({
        elapsedMs: payload.elapsedMs,
        failedProviders: payload.failedProviders.length,
      });

      requestAnimationFrame(() => {
        outputRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    } catch {
      setError("We couldn't reach the server. Check your internet connection and try again.");
    } finally {
      setIsLoading(false);
    }
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    void generate();
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      void generate();
    }
  }

  return (
    <div className="space-y-8">
      {/* ── Free-quota / paywall ──────────────────────────────── */}
      {exhausted ? (
        <UpgradeCard usage={usage} />
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[13px] text-neutral-500">
            Paste your content, get all three formats.
          </p>
          {usage && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-1 text-[11.5px] font-medium text-neutral-600">
              <SparklesIcon className="h-3 w-3 text-neutral-400" />
              Free plan · {usage.remaining} of {usage.limit} generations left
            </span>
          )}
        </div>
      )}

      {/* ── Input ─────────────────────────────────────────────── */}
      {!exhausted && (
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-[0_1px_3px_rgba(10,10,10,0.05)] sm:p-6"
        >
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <label
              htmlFor="source-text"
              className="text-sm font-semibold tracking-tight text-neutral-900"
            >
              Your source content
            </label>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  setText(SAMPLE_ARTICLE);
                  setError(null);
                }}
                className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950/20"
              >
                Load example
              </button>
              <button
                type="button"
                onClick={() => {
                  setText("");
                  setError(null);
                  textareaRef.current?.focus();
                }}
                disabled={!text}
                className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-900 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950/20"
              >
                <TrashIcon className="h-3.5 w-3.5" />
                Clear
              </button>
            </div>
          </div>

          <textarea
            id="source-text"
            ref={textareaRef}
            value={text}
            onChange={(event) => setText(event.target.value.slice(0, MAX_INPUT_CHARS))}
            onKeyDown={handleKeyDown}
            rows={9}
            spellCheck={false}
            placeholder={
              "Paste your article, blog post, newsletter, or transcript here…\n\nTip: press ⌘/Ctrl + Enter to generate."
            }
            className="scrollbar-thin min-h-[200px] w-full resize-y rounded-xl border border-neutral-200 bg-neutral-50/60 px-4 py-3.5 text-[15px] leading-7 text-neutral-800 transition placeholder:text-neutral-400 focus:border-neutral-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-neutral-950/5"
          />

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 text-xs">
              <span className={`font-mono ${nearLimit ? "text-amber-600" : "text-neutral-400"}`}>
                {text.length.toLocaleString()} / {MAX_INPUT_CHARS.toLocaleString()}
              </span>
              <span className="hidden text-neutral-400 sm:inline">
                {trimmed ? `${trimmed.split(/\s+/).length.toLocaleString()} words` : "Empty"}
              </span>
            </div>

            <button
              type="submit"
              disabled={isLoading || !canGenerate}
              aria-busy={isLoading}
              className="inline-flex items-center gap-2 rounded-xl bg-neutral-950 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950/30 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isLoading ? (
                <>
                  <SpinnerIcon className="h-4 w-4" />
                  Generating…
                </>
              ) : (
                <>
                  <SparklesIcon className="h-4 w-4" />
                  Generate repurposed content
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* ── Error ─────────────────────────────────────────────── */}
      {error && (
        <div
          role="alert"
          className="animate-fade-in flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50/70 px-4 py-3.5 text-sm text-red-800"
        >
          <AlertIcon className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
          <div className="flex-1">
            <p className="font-medium">Generation failed</p>
            <p className="mt-0.5 text-red-700">{error}</p>
          </div>
          {!exhausted && (
            <button
              type="button"
              onClick={() => void generate()}
              className="shrink-0 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-50"
            >
              Try again
            </button>
          )}
        </div>
      )}

      {/* ── Backup-engine notice (no provider names) ──────────── */}
      {meta && meta.failedProviders > 0 && (
        <div className="animate-fade-in flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50/70 px-4 py-3 text-[13px] text-amber-900">
          <BoltIcon className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
          <p>
            <span className="font-semibold">Backup engine engaged.</span> The primary engine was
            busy, so a backup finished the job automatically — no interruption, same quality.
          </p>
        </div>
      )}

      {/* ── Output ────────────────────────────────────────────── */}
      <section ref={outputRef} id="results" className="scroll-mt-24">
        {result && meta && (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-neutral-950">
                Your repurposed content
              </h2>
              <p className="font-mono text-[11.5px] text-neutral-500">
                Generated in {(meta.elapsedMs / 1000).toFixed(1)}s
              </p>
            </div>
            <div className="flex items-center gap-2">
              <CopyButton
                variant="ghost"
                label="Copy all three"
                text={composeAllText(result)}
              />
              {!exhausted && (
                <button
                  type="button"
                  onClick={() => void generate()}
                  disabled={isLoading}
                  className="inline-flex items-center gap-2 rounded-lg bg-neutral-950 px-3.5 py-2 text-[13px] font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {isLoading ? <SpinnerIcon className="h-3.5 w-3.5" /> : null}
                  Regenerate
                </button>
              )}
            </div>
          </div>
        )}

        <div
          className={`grid gap-5 lg:grid-cols-3 ${
            isLoading && result ? "pointer-events-none opacity-60" : ""
          }`}
          aria-live="polite"
        >
          {isLoading && !result
            ? PLATFORM_ORDER.map((platform) => (
                <OutputCardSkeleton key={platform} platform={platform} />
              ))
            : PLATFORM_ORDER.map((platform) => {
                if (!result) return <OutputCardPlaceholder key={platform} platform={platform} />;

                const content = result[platform];
                return content ? (
                  <OutputCard key={platform} platform={platform} content={content} />
                ) : (
                  <OutputCardPlaceholder key={platform} platform={platform} />
                );
              })}
        </div>
      </section>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Paywall (lifetime free package exhausted)                           */
/* ------------------------------------------------------------------ */

function UpgradeCard({ usage }: { usage: UsageInfo | null }) {
  return (
    <div className="animate-fade-up overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-[0_1px_3px_rgba(10,10,10,0.05)]">
      <div className="px-6 py-8 text-center sm:px-10 sm:py-10">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-neutral-950 text-white">
          <CheckIcon className="h-5 w-5" />
        </span>

        <h2 className="mt-5 text-xl font-semibold tracking-tight text-neutral-950 sm:text-2xl">
          You&apos;ve used all {usage?.limit ?? 10} free generations
        </h2>

        <p className="mx-auto mt-3 max-w-md text-[14.5px] leading-7 text-neutral-500">
          The free package is a <strong className="font-semibold text-neutral-700">one-time</strong>{" "}
          offer — it never renews or resets. Upgrade to Pro to keep repurposing without limits.
        </p>

        {PRO_URL ? (
          <a
            href={PRO_URL}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-neutral-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800"
          >
            Upgrade to Pro
          </a>
        ) : (
          <button
            type="button"
            disabled
            title="Payments coming soon"
            className="mt-6 inline-flex cursor-not-allowed items-center gap-2 rounded-xl bg-neutral-950/40 px-6 py-3 text-sm font-semibold text-white"
          >
            Upgrade to Pro — coming soon
          </button>
        )}

        <p className="mt-3 text-xs text-neutral-400">
          Online payments are being wired up. Leave your email and you&apos;ll be notified the day
          they launch.
        </p>
      </div>

      <div className="border-t border-neutral-100 bg-neutral-50/60 px-6 py-5 sm:px-10">
        <NewsletterForm className="mx-auto max-w-md" />
      </div>
    </div>
  );
}

/** Plain-text bundle of all three outputs, for the "Copy all three" button. */
function composeAllText(data: RepurposedContent): string {
  const sections = PLATFORM_ORDER.map((platform) => {
    const value = data[platform];
    if (!value) return "";

    const body = Array.isArray(value)
      ? value.map((tweet, index) => `${index + 1}/ ${tweet}`).join("\n\n")
      : value;

    return `${PLATFORMS[platform].label.toUpperCase()}\n\n${body}`;
  }).filter(Boolean);

  return sections.join("\n\n———\n\n");
}
