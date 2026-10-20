"use client";

import { useState } from "react";

import { CopyButton } from "@/components/tool/CopyButton";
import { ModifyButtons } from "@/components/ui/ModifyButtons";
import type { RepurposedContent } from "@/lib/types";

const MODIFY_LABELS: Record<string, string> = {
  SHORTEN: "اختصر النص",
  MORE_PERSUASIVE: "اجعله أكثر إقناعاً",
  CHANGE_HOOK: "غير الافتتاحية",
  SIMPLIFY: "أعد الكتابة بأسهل",
  THREE_VARIANTS: "أنشئ 3 نسخ مختلفة",
  CHANGE_TONE: "غير النبرة",
  CUSTOM: "تعديل مخصص",
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

function Card({ title, badge, children, copyText, onApply, onModify }: CardProps) {
  const [showModify, setShowModify] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [variants, setVariants] = useState<string[] | null>(null);

  async function handleModify(type: string) {
    if (!onModify) return;
    setBusy(type);
    setNote(null);
    setVariants(null);

    const result = await onModify({ type, platform: title, currentText: copyText });
    setBusy(null);

    if (!result) {
      setNote("تعذّر التعديل. تحقّق من حصّتك أو حاول مرة أخرى.");
      return;
    }

    if (type === "THREE_VARIANTS" && result.variants.length) {
      setVariants(result.variants);
      setNote("ثلاث نسخ جاهزة — اختر ما يعجبك.");
      return;
    }

    onApply?.(result.text);
    setNote(`تم تطبيق «${MODIFY_LABELS[type] ?? type}».`);
  }

  return (
    <article className="flex flex-col rounded-2xl border border-neutral-200 bg-white shadow-[0_1px_2px_rgba(10,10,10,0.04)]">
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
          {onModify && (
            <button
              type="button"
              onClick={() => setShowModify((v) => !v)}
              className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-900"
            >
              تعديل
            </button>
          )}
          <CopyButton variant="ghost" label="نسخ" text={copyText} />
        </div>
      </header>

      <div className="flex-1 px-4 py-4">
        {children}

        {variants && (
          <div className="mt-4 space-y-2 border-t border-neutral-100 pt-4">
            {variants.map((variant, i) => (
              <div key={i} className="rounded-xl border border-neutral-200 bg-neutral-50/60 p-3">
                <div className="mb-1 flex items-center justify-between">
                  <span className="font-mono text-[11px] text-neutral-400">نسخة {i + 1}</span>
                  <div className="flex items-center gap-1">
                    <CopyButton variant="ghost" label="نسخ" text={variant} />
                    {onApply && (
                      <button
                        type="button"
                        onClick={() => {
                          onApply(variant);
                          setVariants(null);
                          setNote("تم اعتماد النسخة.");
                        }}
                        className="rounded-lg px-2.5 py-1 text-xs font-medium text-emerald-700 transition hover:bg-emerald-50"
                      >
                        اعتماد
                      </button>
                    )}
                  </div>
                </div>
                <p className="whitespace-pre-wrap text-[13.5px] leading-6 text-neutral-700">{variant}</p>
              </div>
            ))}
          </div>
        )}

        {showModify && onModify && (
          <div className="mt-4 border-t border-neutral-100 pt-4">
            <p className="mb-2 text-[11px] font-medium text-neutral-500">
              عدّل بدون إعادة توليد الحزمة كاملة — كل تعديل محسوب من حصّتك
            </p>
            <ModifyButtons onModify={handleModify} disabled={busy !== null} busyType={busy} />
            {note && <p className="mt-2 text-[11px] text-emerald-600">{note}</p>}
          </div>
        )}
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
        {["لينكدإن", "سلسلة إكس", "إنستغرام", "فيسبوك"].map((label) => (
          <div
            key={label}
            className="flex h-56 items-center justify-center rounded-2xl border border-dashed border-neutral-200 bg-neutral-50/40 text-sm text-neutral-400"
          >
            {label} — سيظهر هنا بعد التوليد
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
              مراجعة ذكية:{" "}
              {result.reviewCheck.matchesOriginal
                ? "المحتوى مطابق للفكرة الأصلية"
                : "تحذير: قد يكون هناك انحراف بسيط عن الأصل"}
              {result.reviewCheck.confidence > 0 &&
                ` · الثقة ${(result.reviewCheck.confidence * 100).toFixed(0)}%`}
            </p>
            {result.reviewCheck.notes && (
              <p className="mt-0.5 opacity-80">{result.reviewCheck.notes}</p>
            )}
          </div>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        <Card
          title="لينكدإن"
          badge="منشور كامل"
          copyText={result.linkedin}
          onApply={(next) => onUpdate?.({ linkedin: next })}
          onModify={onModify}
        >
          <Paragraphs text={result.linkedin} />
        </Card>

        <Card
          title="إكس (تويتر)"
          badge={`${result.twitter_thread?.length ?? 0} تغريدات`}
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
                  <span className="font-mono text-[11px] text-neutral-400">تغريدة {i + 1}</span>
                  <span className={`font-mono text-[10px] ${tweet.length > 280 ? "text-red-500" : "text-neutral-400"}`}>
                    {tweet.length}/280
                  </span>
                </div>
                <p className="whitespace-pre-wrap text-[13.5px] leading-6 text-neutral-700">{tweet}</p>
              </li>
            ))}
          </ol>
        </Card>

        <Card title="إنستغرام" badge="كابشن + هاشتاقات" copyText={result.instagram} onApply={(next) => onUpdate?.({ instagram: next })} onModify={onModify}>
          <Paragraphs text={result.instagram} />
        </Card>

        <Card title="فيسبوك" badge="منشور" copyText={result.facebook ?? ""} onApply={(next) => onUpdate?.({ facebook: next })} onModify={onModify}>
          <Paragraphs text={result.facebook ?? ""} />
        </Card>

        {result.hooks?.length ? (
          <Card title="افتتاحيات جذابة" badge={`${result.hooks.length}`} copyText={result.hooks.join("\n\n")} onModify={onModify}>
            <List items={result.hooks} ordered />
          </Card>
        ) : null}

        {result.cta ? (
          <Card title="دعوة للتفاعل" copyText={result.cta} onApply={(next) => onUpdate?.({ cta: next })} onModify={onModify}>
            <Paragraphs text={result.cta} />
          </Card>
        ) : null}

        {result.videoTitles?.length ? (
          <Card title="عناوين بديلة" badge={`${result.videoTitles.length}`} copyText={result.videoTitles.join("\n\n")} onModify={onModify}>
            <List items={result.videoTitles} ordered />
          </Card>
        ) : null}

        {result.videoPromotions?.length ? (
          <Card title="منشورات ترويجية للفيديو" copyText={result.videoPromotions.join("\n\n")} onModify={onModify}>
            <List items={result.videoPromotions} />
          </Card>
        ) : null}

        {result.shortIdeas?.length ? (
          <Card title="أفكار مقاطع قصيرة" badge="Reels · TikTok · Shorts" copyText={result.shortIdeas.join("\n\n")} onModify={onModify}>
            <List items={result.shortIdeas} ordered />
          </Card>
        ) : null}
      </div>
    </div>
  );
}
