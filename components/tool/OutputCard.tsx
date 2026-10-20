import { CopyButton } from "@/components/tool/CopyButton";
import { PLATFORMS, type PlatformId } from "@/components/platforms";
import { TWEET_LIMIT } from "@/lib/constants";

interface OutputCardProps {
  platform: PlatformId;
  /** Rendered content: a block of text, or the list of tweets for X. */
  content: string | string[];
}

export function OutputCard({ platform, content }: OutputCardProps) {
  const meta = PLATFORMS[platform];
  const isThread = Array.isArray(content);

  const copyText = isThread ? (content as string[]).join("\n\n") : (content as string);

  const stat = isThread
    ? `${(content as string[]).length} tweet${(content as string[]).length === 1 ? "" : "s"}`
    : `${countWords(content as string)} words · ${(content as string).length.toLocaleString()} chars`;

  return (
    <article className="animate-fade-up flex h-full flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-[0_1px_2px_rgba(10,10,10,0.04)] transition-shadow hover:shadow-[0_8px_30px_rgba(10,10,10,0.06)]">
      {/* Header */}
      <header className="flex items-center gap-3 border-b border-neutral-100 px-5 py-4">
        <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${meta.tile}`}>
          <meta.Icon className={`h-[18px] w-[18px] ${meta.glyph}`} />
        </span>
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold tracking-tight text-neutral-950">
            {meta.label}
          </h3>
          <p className="truncate text-xs text-neutral-500">{stat}</p>
        </div>
      </header>

      {/* Body */}
      <div className="scrollbar-thin max-h-[360px] flex-1 overflow-y-auto px-5 py-4">
        {isThread ? (
          <ThreadBody tweets={content as string[]} />
        ) : (
          <p className="whitespace-pre-wrap text-[14.5px] leading-7 text-neutral-700">{content}</p>
        )}
      </div>

      {/* Footer */}
      <footer className="flex items-center justify-between gap-3 border-t border-neutral-100 bg-neutral-50/60 px-4 py-3">
        <CopyButton text={copyText} label={isThread ? "Copy whole thread" : "Copy to clipboard"} />
        <span className="hidden truncate text-[11px] text-neutral-400 sm:block">
          {meta.destination}
        </span>
      </footer>
    </article>
  );
}

function ThreadBody({ tweets }: { tweets: string[] }) {
  const total = tweets.length;

  return (
    <ol className="space-y-2.5">
      {tweets.map((tweet, index) => {
        const over = tweet.length > TWEET_LIMIT;
        const isLast = index === total - 1;

        return (
          <li
            key={index}
            className={`relative rounded-xl border p-3.5 transition-colors ${
              isLast
                ? "border-neutral-300 bg-neutral-50"
                : "border-neutral-200/80 bg-white hover:border-neutral-300"
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-neutral-900/5 px-1.5 py-0.5 font-mono text-[10.5px] font-medium text-neutral-500">
                {index + 1}/{total}
              </span>
              <span
                className={`ml-auto font-mono text-[10.5px] ${
                  over ? "font-semibold text-red-500" : "text-neutral-400"
                }`}
              >
                {tweet.length}/{TWEET_LIMIT}
              </span>
            </div>
            <p className="mt-2 whitespace-pre-wrap text-[14px] leading-6 text-neutral-700">
              {tweet}
            </p>
          </li>
        );
      })}
    </ol>
  );
}

/* ------------------------------------------------------------------ */
/* Loading + empty states                                              */
/* ------------------------------------------------------------------ */

export function OutputCardSkeleton({ platform }: { platform: PlatformId }) {
  const meta = PLATFORMS[platform];

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white">
      <header className="flex items-center gap-3 border-b border-neutral-100 px-5 py-4">
        <span className={`grid h-9 w-9 place-items-center rounded-xl ${meta.tile} opacity-50`}>
          <meta.Icon className={`h-[18px] w-[18px] ${meta.glyph} opacity-50`} />
        </span>
        <div className="space-y-1.5">
          <div className="bg-shimmer h-3 w-28 rounded-full" />
          <div className="bg-shimmer h-2.5 w-20 rounded-full" />
        </div>
      </header>
      <div className="flex-1 space-y-2.5 px-5 py-5">
        <div className="bg-shimmer h-3 w-full rounded-full" />
        <div className="bg-shimmer h-3 w-11/12 rounded-full" />
        <div className="bg-shimmer h-3 w-10/12 rounded-full" />
        <div className="bg-shimmer h-3 w-9/12 rounded-full" />
        <div className="bg-shimmer h-3 w-8/12 rounded-full" />
      </div>
      <footer className="border-t border-neutral-100 px-4 py-3">
        <div className="bg-shimmer h-8 w-36 rounded-lg" />
      </footer>
    </article>
  );
}

export function OutputCardPlaceholder({ platform }: { platform: PlatformId }) {
  const meta = PLATFORMS[platform];

  return (
    <article className="flex h-full flex-col rounded-2xl border border-dashed border-neutral-200 bg-neutral-50/40 p-5">
      <div className="flex items-center gap-3">
        <span className={`grid h-9 w-9 place-items-center rounded-xl bg-white ring-1 ring-neutral-200/80`}>
          <meta.Icon className={`h-[18px] w-[18px] text-neutral-400`} />
        </span>
        <div>
          <h3 className="text-sm font-semibold tracking-tight text-neutral-800">{meta.label}</h3>
          <p className="text-xs text-neutral-400">{meta.tagline}</p>
        </div>
      </div>
      <p className="mt-4 text-[13px] leading-6 text-neutral-500">{meta.description}</p>
      <p className="mt-auto pt-6 font-mono text-[11px] text-neutral-300">
        waiting for input…
      </p>
    </article>
  );
}

function countWords(text: string): number {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}
