"use client";

import { useEffect, useRef, useState } from "react";

import { AlertIcon, BoltIcon, CheckIcon, SparklesIcon, SpinnerIcon, TrashIcon } from "@/components/icons";
import { NewsletterForm } from "@/components/tool/NewsletterForm";
import { CopyButton } from "@/components/tool/CopyButton";
import { RepurposeResults, type ModifyRequest, type ModifyResponse } from "@/components/tool/RepurposeResults";
import { DRAFT_STORAGE_KEY, MAX_INPUT_CHARS, MIN_INPUT_CHARS } from "@/lib/constants";
import { SAMPLE_ARTICLE } from "@/lib/sample";
import type { RepurposedContent, RepurposeResponse, UsageInfo } from "@/lib/types";

const PRO_URL = process.env.NEXT_PUBLIC_PRO_URL?.trim() || "/dashboard/billing";

const TONES = [
  { value: "balanced", label: "Balanced" },
  { value: "formal", label: "Formal" },
  { value: "casual", label: "Casual" },
  { value: "marketing", label: "Marketing" },
  { value: "educational", label: "Educational" },
  { value: "professional", label: "Professional" },
  { value: "friendly", label: "Friendly" },
  { value: "persuasive", label: "Persuasive" },
  { value: "concise", label: "Concise" },
];

const CONTENT_TYPES = [
  { value: "ARTICLE", label: "Article / blog post" },
  { value: "VIDEO_SCRIPT", label: "Video script" },
  { value: "NEWSLETTER", label: "Newsletter" },
  { value: "TRANSCRIPT", label: "Transcript" },
];

const UPGRADE_FEATURES = [
  "20 generations per day (refreshed daily)",
  "20 inline edits per day",
  "7-day publishing plan with export",
  "Video-script support and title ideas",
  "Smart review on every result",
];

interface Meta {
  elapsedMs: number;
  failedProviders: number;
}

export function RepurposeTool() {
  const [text, setText] = useState("");
  const [tone, setTone] = useState("balanced");
  const [contentType, setContentType] = useState("ARTICLE");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<RepurposedContent | null>(null);
  const [generationId, setGenerationId] = useState<string | null>(null);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [usage, setUsage] = useState<UsageInfo | null>(null);

  const outputRef = useRef<HTMLElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  async function refreshUsage() {
    try {
      const res = await fetch("/api/usage", { cache: "no-store" });
      const payload = await res.json();
      if (payload?.ok && payload.usage) setUsage(payload.usage);
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    // Merge any anonymous free usage onto the account once signed in, so
    // signing in can't be used to farm a second set of free generations.
    void fetch("/api/auth/merge", { method: "POST" })
      .catch(() => undefined)
      .finally(() => void refreshUsage());
  }, []);

  useEffect(() => {
    try {
      const draft = sessionStorage.getItem(DRAFT_STORAGE_KEY);
      if (draft) {
        setText(draft.slice(0, MAX_INPUT_CHARS));
        sessionStorage.removeItem(DRAFT_STORAGE_KEY);
        textareaRef.current?.focus();
      }
    } catch {
      /* ignore */
    }
  }, []);

  const trimmed = text.trim();
  const canGenerate = trimmed.length >= MIN_INPUT_CHARS && trimmed.length <= MAX_INPUT_CHARS;
  const nearLimit = text.length > MAX_INPUT_CHARS * 0.9;
  const exhausted = usage?.exhausted ?? false;

  async function generate() {
    if (isLoading) return;

    if (trimmed.length < MIN_INPUT_CHARS) {
      setError(`Please paste at least ${MIN_INPUT_CHARS} characters — a paragraph or two is enough to start.`);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/repurpose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, tone, inputType: contentType }),
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
      setGenerationId(payload.generationId ?? null);
      setMeta({ elapsedMs: payload.elapsedMs, failedProviders: payload.failedProviders.length });

      requestAnimationFrame(() => {
        outputRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
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

  function handleUpdate(patch: Partial<RepurposedContent>) {
    setResult((prev) => (prev ? { ...prev, ...patch } : prev));
  }

  async function handleModify(req: ModifyRequest): Promise<ModifyResponse | null> {
    try {
      const res = await fetch("/api/modify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: req.type,
          platform: req.platform,
          content: req.currentText,
          generationId,
        }),
      });
      const payload = (await res.json().catch(() => null)) as
        | { ok: true; text: string; variants?: string[] }
        | { ok: false; error?: string }
        | null;

      if (!res.ok || !payload || payload.ok !== true) {
        if (payload && payload.ok === false && payload.error) setError(payload.error);
        return null;
      }

      // Refresh the quota chip so the user sees their modification counted.
      void refreshUsage();

      return { text: payload.text, variants: payload.variants ?? [] };
    } catch {
      return null;
    }
  }

  return (
    <div className="space-y-8">
      {exhausted ? (
        <UpgradeCard usage={usage} />
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-[13px] text-neutral-500">
            Paste your content and get the full bundle.
          </p>
          {usage && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-1 text-[11.5px] font-medium text-neutral-600 shadow-[var(--shadow-control)]">
              <SparklesIcon className="h-3 w-3 text-neutral-400" />
              {usage.plan === "admin"
                ? "Admin · unlimited generations"
                : usage.plan === "pro"
                  ? `Pro plan · ${usage.remaining} of ${usage.limit} generations left today`
                  : `Free plan · ${usage.remaining} of ${usage.limit} generations left`}
            </span>
          )}
        </div>
      )}

      {!exhausted && (
        <form onSubmit={handleSubmit} className="surface p-4 sm:p-6">
          <div className="mb-4 grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="content-type" className="mb-1.5 block text-xs font-medium text-neutral-600">
                Content type
              </label>
              <select
                id="content-type"
                value={contentType}
                onChange={(e) => setContentType(e.target.value)}
                className="field"
              >
                {CONTENT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="tone" className="mb-1.5 block text-xs font-medium text-neutral-600">
                Writing tone
              </label>
              <select
                id="tone"
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="field"
              >
                {TONES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <label htmlFor="source-text" className="text-sm font-semibold tracking-tight text-neutral-900">
              Your content
            </label>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => { setText(SAMPLE_ARTICLE); setError(null); }}
                className="btn btn-ghost btn-sm"
              >
                Load an example
              </button>
              <button
                type="button"
                onClick={() => { setText(""); setError(null); textareaRef.current?.focus(); }}
                disabled={!text}
                className="btn btn-ghost btn-sm"
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
            dir="ltr"
            spellCheck={false}
            placeholder={"Paste your article, blog post, newsletter or video script here…\n\nTip: press ⌘/Ctrl + Enter to generate."}
            className="field scrollbar-thin min-h-[200px] resize-y bg-neutral-50/60 leading-7 focus:bg-white"
          />

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 text-xs">
              <span className={`font-mono ${nearLimit ? "text-amber-600" : "text-neutral-400"}`}>
                {text.length.toLocaleString()} / {MAX_INPUT_CHARS.toLocaleString()}
              </span>
              <span className="hidden text-neutral-400 sm:inline">
                {trimmed ? `${trimmed.split(/\s+/).length.toLocaleString()} words` : "empty"}
              </span>
            </div>

            <button type="submit" disabled={isLoading || !canGenerate} className="btn btn-primary btn-lg">
              {isLoading ? (
                <><SpinnerIcon className="h-4 w-4" /> Repurposing…</>
              ) : (
                <><SparklesIcon className="h-4 w-4" /> Repurpose content</>
              )}
            </button>
          </div>
        </form>
      )}

      {error && (
        <div role="alert" className="animate-fade-in flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50/70 px-4 py-3.5 text-sm text-red-800">
          <AlertIcon className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
          <div className="flex-1">
            <p className="font-medium">Generation failed</p>
            <p className="mt-0.5 text-red-700">{error}</p>
          </div>
          {!exhausted && (
            <button type="button" onClick={() => void generate()} className="btn btn-secondary btn-sm shrink-0 border-red-200 text-red-700">
              Try again
            </button>
          )}
        </div>
      )}

      {meta && meta.failedProviders > 0 && (
        <div className="animate-fade-in flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50/70 px-4 py-3 text-[13px] text-amber-900">
          <BoltIcon className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
          <p>
            <span className="font-semibold">Backup engine engaged.</span> The primary
            engine was busy, so a backup completed the job automatically — no
            interruption, same quality.
          </p>
        </div>
      )}

      <section ref={outputRef} id="results" className="scroll-mt-24">
        {result && meta && (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-neutral-950">Your results</h2>
              <p className="font-mono text-[11.5px] text-neutral-500">
                Generated in {(meta.elapsedMs / 1000).toFixed(1)}s
              </p>
            </div>
            <div className="flex items-center gap-2">
              <CopyButton variant="ghost" label="Copy all" text={composeAllText(result)} />
              {!exhausted && (
                <button
                  type="button"
                  onClick={() => void generate()}
                  disabled={isLoading}
                  className="btn btn-primary btn-sm"
                >
                  {isLoading ? <SpinnerIcon className="h-3.5 w-3.5" /> : null}
                  Regenerate
                </button>
              )}
            </div>
          </div>
        )}

        <RepurposeResults
          result={result}
          isLoading={isLoading}
          onUpdate={handleUpdate}
          onModify={handleModify}
        />
      </section>
    </div>
  );
}

function UpgradeCard({ usage }: { usage: UsageInfo | null }) {
  return (
    <div className="surface animate-fade-up overflow-hidden">
      <div className="px-6 py-8 text-center sm:px-10 sm:py-10">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-neutral-950 text-white">
          <CheckIcon className="h-5 w-5" />
        </span>

        <h2 className="mt-5 text-xl font-semibold tracking-tight text-neutral-950 sm:text-2xl">
          You have used all {usage?.limit ?? 10} free generations
        </h2>

        <p className="mx-auto mt-3 max-w-md text-[14.5px] leading-7 text-neutral-500">
          The free plan is a{" "}
          <strong className="font-semibold text-neutral-700">one-time allowance</strong> —
          it never renews and never resets. Upgrade to Pro to keep repurposing
          without limits.
        </p>

        <div className="mt-6 rounded-xl border border-neutral-200 bg-neutral-50/60 p-5 text-left">
          <p className="text-sm font-semibold text-neutral-900">Pro plan — $15/month</p>
          <ul className="mt-3 space-y-1.5 text-[13px] text-neutral-600">
            {UPGRADE_FEATURES.map((feature) => (
              <li key={feature} className="flex gap-2">
                <CheckIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                {feature}
              </li>
            ))}
          </ul>
        </div>

        <a href={PRO_URL} className="btn btn-primary btn-lg mt-6">
          Upgrade to Pro now
        </a>

        <p className="mt-3 text-xs text-neutral-400">
          Secure, encrypted checkout. Cancel anytime.
        </p>
      </div>

      <div className="border-t border-neutral-100 bg-neutral-50/60 px-6 py-5 sm:px-10">
        <NewsletterForm className="mx-auto max-w-md" />
      </div>
    </div>
  );
}

function composeAllText(data: RepurposedContent): string {
  const parts: string[] = [];

  if (data.linkedin) parts.push(`LINKEDIN\n\n${data.linkedin}`);
  if (data.twitter_thread?.length) {
    parts.push(`X / TWITTER THREAD\n\n${data.twitter_thread.map((t, i) => `${i + 1}/ ${t}`).join("\n\n")}`);
  }
  if (data.instagram) parts.push(`INSTAGRAM\n\n${data.instagram}`);
  if (data.facebook) parts.push(`FACEBOOK\n\n${data.facebook}`);
  if (data.hooks?.length) parts.push(`HOOKS\n\n${data.hooks.map((h, i) => `${i + 1}. ${h}`).join("\n")}`);
  if (data.cta) parts.push(`CALL TO ACTION\n\n${data.cta}`);
  if (data.videoTitles?.length) parts.push(`VIDEO TITLES\n\n${data.videoTitles.map((t, i) => `${i + 1}. ${t}`).join("\n")}`);
  if (data.shortIdeas?.length) parts.push(`SHORT-FORM IDEAS\n\n${data.shortIdeas.map((s, i) => `${i + 1}. ${s}`).join("\n")}`);

  return parts.join("\n\n———\n\n");
}
