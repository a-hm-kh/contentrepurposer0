"use client";

import { useEffect, useState } from "react";

import { CopyButton } from "@/components/tool/CopyButton";
import { ModifyButtons } from "@/components/ui/ModifyButtons";
import { CheckIcon } from "@/components/icons";
import type { RepurposedContent } from "@/lib/types";

const MODIFY_LABELS: Record<string, string> = {
  SHORTEN: "Shorten",
  MORE_PERSUASIVE: "More persuasive",
  CHANGE_HOOK: "New hook",
  SIMPLIFY: "Simpler rewrite",
  THREE_VARIANTS: "3 variants",
  CHANGE_TONE: "Change tone",
  CUSTOM: "Custom edit",
};

export interface ModifyRequest {
  type: string;
  platform: string;
  currentText: string;
}

export interface ModifyResponse {
  text: string;
  variants: string[];
}

interface CardProps {
  title: string;
  badge?: string;
  copyText: string;
  children: React.ReactNode;
  onApply?: (next: string) => void;
  onModify?: (req: ModifyRequest) => Promise<ModifyResponse | null>;
}

function Card({ title, badge, copyText, children, onApply, onModify }: CardProps) {
  const [showModify, setShowModify] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [variants, setVariants] = useState<string[] | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(copyText);

  // Keep the draft in sync when the card's content changes from the outside
  // (regenerate, variant applied, edit applied elsewhere).
  useEffect(() => {
    if (!editing) setDraft(copyText);
  }, [copyText, editing]);

  async function handleModify(type: string) {
    if (!onModify) return;
    setBusy(type);
    setNote(null);
    setVariants(null);

    const result = await onModify({ type, platform: title, currentText: copyText });
    setBusy(null);

    if (!result) {
      setNote("Could not apply the edit. Check your quota or try again.");
      return;
    }

    if (type === "THREE_VARIANTS" && result.variants.length) {
      setVariants(result.variants);
      setNote("Three variants ready — pick the one you like.");
      return;
    }

    onApply?.(result.text);
    setNote(`Applied “${MODIFY_LABELS[type] ?? type}”.`);
  }

  function startEditing() {
    setDraft(copyText);
    setEditing(true);
  }

  function commitEdit() {
    onApply?.(draft);
    setEditing(false);
    setNote("Your edit was saved.");
  }

  return (
    <article className="surface flex flex-col">
      <header className="flex items-center justify-between gap-2 border-b border-neutral-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold tracking-tight text-neutral-900">{title}</h3>
          {badge && (
            <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-medium text-neutral-500">
              {badge}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {onApply && !editing && (
            <button type="button" onClick={startEditing} className="btn btn-ghost btn-sm">
              Write
            </button>
          )}
          {editing && (
            <>
              <button
                type="button"
                onClick={() => { setEditing(false); setDraft(copyText); setNote(null); }}
                className="btn btn-ghost btn-sm"
              >
                Cancel
              </button>
              <button type="button" onClick={commitEdit} className="btn btn-primary btn-sm">
                Save
              </button>
            </>
          )}
          {onModify && !editing && (
            <button type="button" onClick={() => setShowModify((v) => !v)} className="btn btn-ghost btn-sm">
              Edit
            </button>
          )}
          {!editing && <CopyButton variant="ghost" label="Copy" text={copyText} />}
        </div>
      </header>

      <div className="flex-1 px-4 py-4">
        {editing ? (
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={Math.min(24, Math.max(6, draft.split("\n").length + 2))}
            dir="auto"
            className="field scrollbar-thin w-full resize-y bg-white text-[14px] leading-7"
          />
        ) : (
          children
        )}

        {variants && (
          <div className="mt-4 space-y-2 border-t border-neutral-100 pt-4">
            {variants.map((variant, i) => (
              <div key={i} className="rounded-xl border border-neutral-200 bg-neutral-50/60 p-3">
                <div className="mb-1 flex items-center justify-between">
                  <span className="font-mono text-[11px] text-neutral-400">Variant {i + 1}</span>
                  <div className="flex items-center gap-1">
                    <CopyButton variant="ghost" label="Copy" text={variant} />
                    {onApply && (
                      <button
                        type="button"
                        onClick={() => {
                          onApply(variant);
                          setVariants(null);
                          setNote("Variant applied.");
                        }}
                        className="btn btn-ghost btn-sm text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
                      >
                        Use this
                      </button>
                    )}
                  </div>
                </div>
                <p className="whitespace-pre-wrap text-[13.5px] leading-6 text-neutral-700">{variant}</p>
              </div>
            ))}
          </div>
        )}

        {showModify && onModify && !editing && (
          <div className="mt-4 border-t border-neutral-100 pt-4">
            <p className="mb-2 text-[11px] font-medium text-neutral-500">
              Rewrite just this piece — no need to regenerate the whole bundle.
              Each edit counts against your quota.
            </p>
            <ModifyButtons onModify={handleModify} disabled={busy !== null} busyType={busy} />
            {note && <p className="mt-2 text-[11px] text-emerald-600">{note}</p>}
          </div>
        )}

        {note && !showModify && <p className="mt-3 text-[11px] text-emerald-600">{note}</p>}
      </div>
    </article>
  );
}

function Paragraphs({ text }: { text: string }) {
  return (
    <div className="whitespace-pre-wrap text-[14px] leading-7 text-neutral-700">{text}</div>
  );
}

function List({ items, ordered }: { items: string[]; ordered?: boolean }) {
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2.5 text-[14px] leading-7 text-neutral-700">
          <span className="mt-0.5 shrink-0 font-mono text-xs text-neutral-400">
            {ordered ? `${i + 1}.` : "•"}
          </span>
          <span className="whitespace-pre-wrap">{item}</span>
        </li>
      ))}
    </ul>
  );
}

/* ------------------------------------------------------------------ */
/* Interactive pre-publish checklist                                   */
/* ------------------------------------------------------------------ */

const CHECKLIST_ITEMS = [
  { id: "facts", label: "Facts, names and numbers match my source" },
  { id: "voice", label: "It still sounds like me, not a generic AI" },
  { id: "platform", label: "The length and format fit the platform" },
  { id: "hook", label: "The first line makes people stop scrolling" },
  { id: "cta", label: "There is a clear next step for the reader" },
];

function PublishChecklist() {
  const [done, setDone] = useState<Record<string, boolean>>({});
  const completed = CHECKLIST_ITEMS.filter((item) => done[item.id]).length;
  const allDone = completed === CHECKLIST_ITEMS.length;

  return (
    <section className="surface p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold tracking-tight text-neutral-900">
            Ready-to-publish checklist
          </h3>
          <p className="mt-0.5 text-[12px] text-neutral-500">
            A quick human pass before you post — nothing is published for you.
          </p>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 font-mono text-[11px] font-medium ${
            allDone ? "bg-emerald-50 text-emerald-700" : "bg-neutral-100 text-neutral-500"
          }`}
        >
          {completed}/{CHECKLIST_ITEMS.length}
        </span>
      </div>

      <ul className="mt-3 grid gap-2 sm:grid-cols-2">
        {CHECKLIST_ITEMS.map((item) => {
          const checked = !!done[item.id];
          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => setDone((prev) => ({ ...prev, [item.id]: !prev[item.id] }))}
                aria-pressed={checked}
                className={`flex w-full items-start gap-2.5 rounded-xl border px-3 py-2.5 text-left text-[13px] transition ${
                  checked
                    ? "border-emerald-200 bg-emerald-50/60 text-emerald-900"
                    : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300"
                }`}
              >
                <span
                  className={`mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-[5px] border ${
                    checked ? "border-emerald-500 bg-emerald-500 text-white" : "border-neutral-300 bg-white"
                  }`}
                >
                  {checked && <CheckIcon className="h-2.5 w-2.5" />}
                </span>
                <span className={checked ? "line-through decoration-emerald-400/70" : ""}>{item.label}</span>
              </button>
            </li>
          );
        })}
      </ul>

      {allDone && (
        <p className="animate-fade-in mt-3 flex items-center gap-2 text-[12px] font-medium text-emerald-700">
          <CheckIcon className="h-3.5 w-3.5" />
          Looks good. Copy each piece and publish when you are ready.
        </p>
      )}
    </section>
  );
}

const EMPTY_CARDS = ["LinkedIn", "X thread", "Instagram", "Facebook"];

export function RepurposeResults({
  result,
  isLoading,
  onUpdate,
  onModify,
}: {
  result: RepurposedContent | null;
  isLoading: boolean;
  onUpdate?: (patch: Partial<RepurposedContent>) => void;
  onModify?: (req: ModifyRequest) => Promise<ModifyResponse | null>;
}) {
  if (isLoading && !result) {
    return (
      <div className="grid gap-5 lg:grid-cols-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-56 animate-pulse rounded-2xl border border-neutral-200 bg-neutral-100/60" />
        ))}
      </div>
    );
  }

  if (!result) {
    return (
      <div className="grid gap-5 lg:grid-cols-2">
        {EMPTY_CARDS.map((label) => (
          <div
            key={label}
            className="flex h-56 items-center justify-center rounded-2xl border border-dashed border-neutral-200 bg-neutral-50/40 text-sm text-neutral-400"
          >
            {label} — appears here after generating
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {result.reviewCheck && (
        <div
          className={`flex items-start gap-3 rounded-2xl border px-4 py-3 text-[13px] ${
            result.reviewCheck.matchesOriginal
              ? "border-emerald-200 bg-emerald-50/60 text-emerald-900"
              : "border-amber-200 bg-amber-50/60 text-amber-900"
          }`}
        >
          <span
            className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full text-[11px] ${
              result.reviewCheck.matchesOriginal ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
            }`}
          >
            {result.reviewCheck.matchesOriginal ? "✓" : "!"}
          </span>
          <div>
            <p className="font-semibold">
              Smart review:{" "}
              {result.reviewCheck.matchesOriginal
                ? "the output matches your original idea"
                : "warning: there may be a slight drift from the source"}
              {result.reviewCheck.confidence > 0 &&
                ` · ${(result.reviewCheck.confidence * 100).toFixed(0)}% confidence`}
            </p>
            {result.reviewCheck.notes && (
              <p className="mt-0.5 opacity-80">{result.reviewCheck.notes}</p>
            )}
          </div>
        </div>
      )}

      <PublishChecklist />

      <div className="grid gap-5 lg:grid-cols-2">
        <Card
          title="LinkedIn"
          badge="Full post"
          copyText={result.linkedin}
          onApply={(next) => onUpdate?.({ linkedin: next })}
          onModify={onModify}
        >
          <Paragraphs text={result.linkedin} />
        </Card>

        <Card
          title="X (Twitter)"
          badge={`${result.twitter_thread?.length ?? 0} posts`}
          copyText={(result.twitter_thread ?? []).map((t, i) => `${i + 1}/ ${t}`).join("\n\n")}
          onApply={(next) =>
            onUpdate?.({ twitter_thread: next.split(/\n{2,}/).map((t) => t.replace(/^\d+\/\s*/, "").trim()).filter(Boolean) })
          }
          onModify={onModify}
        >
          <ol className="space-y-3">
            {(result.twitter_thread ?? []).map((tweet, i) => (
              <li key={i} className="rounded-xl border border-neutral-100 bg-neutral-50/50 p-3">
                <div className="mb-1 flex items-center justify-between">
                  <span className="font-mono text-[11px] text-neutral-400">Post {i + 1}</span>
                  <span className={`font-mono text-[10px] ${tweet.length > 280 ? "text-red-500" : "text-neutral-400"}`}>
                    {tweet.length}/280
                  </span>
                </div>
                <p className="whitespace-pre-wrap text-[13.5px] leading-6 text-neutral-700">{tweet}</p>
              </li>
            ))}
          </ol>
        </Card>

        <Card title="Instagram" badge="Caption + hashtags" copyText={result.instagram} onApply={(next) => onUpdate?.({ instagram: next })} onModify={onModify}>
          <Paragraphs text={result.instagram} />
        </Card>

        {result.facebook ? (
          <Card title="Facebook" badge="Post" copyText={result.facebook ?? ""} onApply={(next) => onUpdate?.({ facebook: next })} onModify={onModify}>
            <Paragraphs text={result.facebook ?? ""} />
          </Card>
        ) : null}

        {result.newsletter ? (
          <Card
            title="Email newsletter"
            badge="Ready to send"
            copyText={result.newsletter}
            onApply={(next) => onUpdate?.({ newsletter: next })}
            onModify={onModify}
          >
            <Paragraphs text={result.newsletter} />
          </Card>
        ) : null}

        {result.carousel?.length ? (
          <Card
            title="Carousel slides"
            badge={`${result.carousel.length} slides`}
            copyText={result.carousel.map((s, i) => `Slide ${i + 1}: ${s}`).join("\n\n")}
            onApply={(next) =>
              onUpdate?.({
                carousel: next
                  .split(/\n{2,}/)
                  .map((s) => s.replace(/^Slide\s+\d+\s*:\s*/i, "").trim())
                  .filter(Boolean),
              })
            }
            onModify={onModify}
          >
            <ol className="space-y-3">
              {result.carousel.map((slide, i) => (
                <li key={i} className="flex gap-3 rounded-xl border border-neutral-100 bg-neutral-50/50 p-3">
                  <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-neutral-950 font-mono text-[11px] font-semibold text-white">
                    {i + 1}
                  </span>
                  <p className="whitespace-pre-wrap text-[13.5px] leading-6 text-neutral-700">{slide}</p>
                </li>
              ))}
            </ol>
          </Card>
        ) : null}

        {result.blogArticle ? (
          <Card
            title="Short article"
            badge="Blog / newsletter"
            copyText={result.blogArticle}
            onApply={(next) => onUpdate?.({ blogArticle: next })}
            onModify={onModify}
          >
            <Paragraphs text={result.blogArticle} />
          </Card>
        ) : null}

        {result.hashtags?.length ? (
          <Card
            title="Hashtag sets"
            badge="Per platform"
            copyText={result.hashtags.join("\n\n")}
            onApply={(next) =>
              onUpdate?.({ hashtags: next.split(/\n{2,}/).map((s) => s.trim()).filter(Boolean) })
            }
            onModify={onModify}
          >
            <ul className="space-y-2">
              {result.hashtags.map((set, i) => (
                <li key={i} className="flex items-start justify-between gap-3 rounded-xl border border-neutral-100 bg-neutral-50/50 p-3">
                  <p className="whitespace-pre-wrap text-[13.5px] leading-6 text-neutral-700">{set}</p>
                  <CopyButton variant="ghost" label="Copy" text={set} />
                </li>
              ))}
            </ul>
          </Card>
        ) : null}

        {result.hooks?.length ? (
          <Card title="Scroll-stopping hooks" badge={`${result.hooks.length}`} copyText={result.hooks.join("\n\n")} onModify={onModify}>
            <List items={result.hooks} ordered />
          </Card>
        ) : null}

        {result.cta ? (
          <Card title="Call to action" copyText={result.cta} onApply={(next) => onUpdate?.({ cta: next })} onModify={onModify}>
            <Paragraphs text={result.cta} />
          </Card>
        ) : null}

        {result.videoTitles?.length ? (
          <Card title="Alternative titles" badge={`${result.videoTitles.length}`} copyText={result.videoTitles.join("\n\n")} onModify={onModify}>
            <List items={result.videoTitles} ordered />
          </Card>
        ) : null}

        {result.videoPromotions?.length ? (
          <Card title="Video promo posts" copyText={result.videoPromotions.join("\n\n")} onModify={onModify}>
            <List items={result.videoPromotions} />
          </Card>
        ) : null}

        {result.shortIdeas?.length ? (
          <Card title="Short-clip ideas" badge="Reels · TikTok · Shorts" copyText={result.shortIdeas.join("\n\n")} onModify={onModify}>
            <List items={result.shortIdeas} ordered />
          </Card>
        ) : null}
      </div>
    </div>
  );
}
