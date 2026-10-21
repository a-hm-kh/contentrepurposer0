"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FormEvent } from "react";

import { ArrowRightIcon, BoltIcon, SparklesIcon } from "@/components/icons";
import { DRAFT_STORAGE_KEY, MAX_INPUT_CHARS } from "@/lib/constants";

const TRUST_POINTS = [
  "Smart review keeps the output faithful to your original idea",
  "Ready to copy and publish on every platform",
  "7-day publishing plan included",
];

export function Hero() {
  const router = useRouter();
  const [text, setText] = useState("");
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;

  function handleStart(event: FormEvent) {
    event.preventDefault();

    const value = text.trim();
    if (value) {
      try {
        sessionStorage.setItem(DRAFT_STORAGE_KEY, value.slice(0, MAX_INPUT_CHARS));
      } catch {
        /* sessionStorage unavailable — the dashboard still works */
      }
    }

    router.push("/dashboard");
  }

  return (
    <section className="relative overflow-hidden border-b border-neutral-200/70">
      <div
        aria-hidden
        className="bg-grid pointer-events-none absolute inset-0"
        style={{
          maskImage: "radial-gradient(ellipse 70% 55% at 50% 0%, black 20%, transparent 80%)",
          WebkitMaskImage: "radial-gradient(ellipse 70% 55% at 50% 0%, black 20%, transparent 80%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-linear-to-r from-violet-200/40 via-sky-200/40 to-emerald-200/30 blur-3xl"
      />

      <div className="relative mx-auto max-w-4xl px-6 pb-20 pt-16 text-center sm:pt-24">
        <span className="animate-fade-in inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white/80 px-3.5 py-1.5 text-xs font-medium text-neutral-600 shadow-sm backdrop-blur">
          <BoltIcon className="h-3.5 w-3.5 text-amber-500" />
          Content engine · no sign-up to start
        </span>

        <h1 className="animate-fade-up mt-6 text-balance text-3xl font-semibold leading-snug tracking-tight text-neutral-950 sm:text-5xl sm:leading-[1.15]">
          Turn one piece of content into a{" "}
          <span className="bg-linear-to-r from-violet-600 via-sky-600 to-emerald-600 bg-clip-text text-transparent">
            complete publishing plan
          </span>{" "}
          in your own voice
        </h1>

        <p className="animate-fade-up mx-auto mt-5 max-w-2xl text-pretty text-[16px] leading-8 text-neutral-500 sm:text-[17px]">
          Paste an article or a video script and get a LinkedIn post, an X
          thread, an Instagram caption, a Facebook post, scroll-stopping hooks,
          a call to action, and a full weekly publishing plan — in seconds.
        </p>

        <form
          onSubmit={handleStart}
          className="animate-fade-up mx-auto mt-10 w-full max-w-2xl rounded-2xl border border-neutral-200 bg-white p-2.5 text-left shadow-[0_10px_40px_-18px_rgba(10,10,10,0.25)]"
        >
          <label htmlFor="hero-text" className="sr-only">
            Paste your content
          </label>
          <textarea
            id="hero-text"
            value={text}
            onChange={(event) => setText(event.target.value.slice(0, MAX_INPUT_CHARS))}
            rows={4}
            dir="ltr"
            placeholder="Paste your article, blog post or video script here…"
            className="scrollbar-thin w-full resize-none rounded-xl border-0 bg-transparent px-3 py-2.5 text-[15px] leading-7 text-neutral-800 outline-none placeholder:text-neutral-400"
          />

          <div className="flex flex-wrap items-center justify-between gap-2 px-1.5 pb-0.5 pt-1">
            <span className="hidden pl-1.5 text-xs text-neutral-400 sm:block">
              {words
                ? `${words.toLocaleString()} words`
                : "No sign-up · 10 free generations"}
            </span>

            <button type="submit" className="btn btn-primary btn-md">
              {text.trim() ? "Repurpose it" : "Try it free"}
              <ArrowRightIcon className="h-4 w-4" />
            </button>
          </div>
        </form>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-neutral-400">
          {TRUST_POINTS.map((point, index) => (
            <span key={point} className="inline-flex items-center gap-1.5">
              {index === 0 && <SparklesIcon className="h-3.5 w-3.5" />}
              {index > 0 && (
                <span className="hidden h-1 w-1 rounded-full bg-neutral-300 sm:block" />
              )}
              {point}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
