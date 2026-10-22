"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { CopyButton } from "@/components/tool/CopyButton";
import { AlertIcon, BookmarkIcon, LibraryIcon, SpinnerIcon, TrashIcon } from "@/components/icons";

interface LibraryData {
  linkedin: string | null;
  twitter_thread: string[] | null;
  instagram: string | null;
  facebook: string | null;
  hooks: string[] | null;
  cta: string | null;
  newsletter: string | null;
  carousel: string[] | null;
  blogArticle: string | null;
  hashtags: string[] | null;
}

interface LibraryItem {
  savedId: string;
  title: string | null;
  kind: string;
  savedAt: string;
  generationId: string;
  language: string;
  tone: string;
  inputType: string;
  createdAt: string;
  preview: string;
  inputPreview: string;
  data: LibraryData;
}

type State =
  | { status: "loading" }
  | { status: "ready"; items: LibraryItem[] }
  | { status: "error"; message: string };

/** Every non-empty section of a saved bundle, ready to copy or download. */
function sections(item: LibraryItem): { key: string; label: string; text: string }[] {
  const d = item.data;
  const out: { key: string; label: string; text: string }[] = [];
  const push = (key: string, label: string, text: string | null | undefined) => {
    if (text && text.trim()) out.push({ key, label, text });
  };

  push("linkedin", "LinkedIn", d.linkedin);
  push("twitter_thread", "X thread", d.twitter_thread?.join("\n\n---\n\n"));
  push("instagram", "Instagram", d.instagram);
  push("facebook", "Facebook", d.facebook);
  push("hooks", "Hooks", d.hooks?.map((h, i) => `${i + 1}. ${h}`).join("\n"));
  push("cta", "Call to action", d.cta);
  push("newsletter", "Email newsletter", d.newsletter);
  push("carousel", "Carousel", d.carousel?.map((s, i) => `Slide ${i + 1}: ${s}`).join("\n\n"));
  push("blogArticle", "Short article", d.blogArticle);
  push("hashtags", "Hashtags", d.hashtags?.join("\n\n"));

  return out;
}

function downloadBundle(item: LibraryItem) {
  const header = `CONTENT BUNDLE\nSaved: ${new Date(item.savedAt).toLocaleString()}\nLanguage: ${item.language} · Tone: ${item.tone}\n\n`;
  const body = sections(item)
    .map((s) => `${s.label.toUpperCase()}\n${"=".repeat(s.label.length)}\n${s.text}`)
    .join("\n\n\n");

  const blob = new Blob([`\ufeff${header}${body}`], { type: "text/plain;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `content-bundle-${item.generationId.slice(-6)}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

export function LibraryList() {
  const [state, setState] = useState<State>({ status: "loading" });
  const [openId, setOpenId] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/library", { cache: "no-store" });
      const payload = (await res.json().catch(() => null)) as
        | { ok: true; items: LibraryItem[] }
        | { ok: false; error?: string }
        | null;

      if (!res.ok || !payload || payload.ok !== true) {
        setState({
          status: "error",
          message: payload && payload.ok === false && payload.error ? payload.error : "Could not load your library.",
        });
        return;
      }
      setState({ status: "ready", items: payload.items });
    } catch {
      setState({ status: "error", message: "Could not reach the server. Check your connection." });
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function remove(savedId: string) {
    setRemoving(savedId);
    try {
      const res = await fetch(`/api/library?id=${encodeURIComponent(savedId)}`, { method: "DELETE" });
      if (res.ok) {
        setState((prev) =>
          prev.status === "ready"
            ? { status: "ready", items: prev.items.filter((i) => i.savedId !== savedId) }
            : prev,
        );
      }
    } finally {
      setRemoving(null);
    }
  }

  if (state.status === "loading") {
    return (
      <div className="surface flex items-center gap-3 p-6 text-sm text-neutral-500">
        <SpinnerIcon className="h-4 w-4" /> Loading your library…
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div role="alert" className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50/70 px-4 py-3.5 text-sm text-red-800">
        <AlertIcon className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
        <p>{state.message}</p>
      </div>
    );
  }

  if (state.items.length === 0) {
    return (
      <div className="surface flex flex-col items-center gap-4 px-6 py-16 text-center">
        <span className="grid h-12 w-12 place-items-center rounded-full bg-neutral-100">
          <LibraryIcon className="h-5 w-5 text-neutral-400" />
        </span>
        <div>
          <p className="text-sm font-semibold tracking-tight text-neutral-900">Your library is empty</p>
          <p className="mt-1 max-w-sm text-[13px] leading-6 text-neutral-500">
            Generate a bundle in the studio, then hit <span className="font-medium text-neutral-700">Save</span> to
            keep it here for later.
          </p>
        </div>
        <Link href="/dashboard" className="btn btn-primary btn-sm">
          Go to the studio
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {state.items.map((item) => {
        const parts = sections(item);
        const open = openId === item.generationId;

        return (
          <article key={item.savedId} className="surface">
            <header className="flex flex-wrap items-start justify-between gap-3 p-5">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <BookmarkIcon filled className="h-4 w-4 text-emerald-600" />
                  <h2 className="truncate text-sm font-semibold tracking-tight text-neutral-950">
                    {item.title || item.preview.slice(0, 60) || "Saved bundle"}
                  </h2>
                </div>
                <p className="mt-1 font-mono text-[11px] text-neutral-400">
                  Saved {new Date(item.savedAt).toLocaleDateString()} · {item.language} · {item.tone} ·{" "}
                  {parts.length} formats
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setOpenId(open ? null : item.generationId)}
                  className="btn btn-secondary btn-sm"
                >
                  {open ? "Hide" : "Open"}
                </button>
                <button
                  type="button"
                  onClick={() => downloadBundle(item)}
                  className="btn btn-ghost btn-sm"
                >
                  Download
                </button>
                <button
                  type="button"
                  onClick={() => void remove(item.savedId)}
                  disabled={removing === item.savedId}
                  className="btn btn-ghost btn-sm text-red-600 hover:bg-red-50"
                  title="Remove from library"
                >
                  {removing === item.savedId ? (
                    <SpinnerIcon className="h-3.5 w-3.5" />
                  ) : (
                    <TrashIcon className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            </header>

            {open && (
              <div className="animate-fade-in space-y-3 border-t border-neutral-100 px-5 py-4">
                {parts.map((section) => (
                  <div key={section.key} className="rounded-xl border border-neutral-100 bg-neutral-50/50 p-3.5">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <h3 className="text-[12px] font-semibold uppercase tracking-wide text-neutral-500">
                        {section.label}
                      </h3>
                      <CopyButton variant="ghost" label="Copy" text={section.text} />
                    </div>
                    <p className="whitespace-pre-wrap text-[13.5px] leading-6 text-neutral-700">
                      {section.text}
                    </p>
                  </div>
                ))}
                <p className="pt-1 text-[11px] text-neutral-400">
                  Source: {item.inputPreview}
                  {item.inputPreview.length >= 180 ? "…" : ""}
                </p>
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}
