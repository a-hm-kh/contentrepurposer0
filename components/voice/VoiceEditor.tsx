"use client";

import { useCallback, useEffect, useState } from "react";

import { AlertIcon, CheckIcon, SpinnerIcon, VoiceIcon } from "@/components/icons";

interface VoiceFields {
  about: string;
  audience: string;
  likedWords: string;
  bannedWords: string;
  samples: string;
}

const EMPTY: VoiceFields = {
  about: "",
  audience: "",
  likedWords: "",
  bannedWords: "",
  samples: "",
};

const FIELDS: {
  key: keyof VoiceFields;
  label: string;
  hint: string;
  placeholder: string;
  rows: number;
}[] = [
  {
    key: "about",
    label: "Who you are",
    hint: "Your role, your edge, the way you see your field.",
    placeholder: "I'm a product designer who writes about shipping fast without breaking trust…",
    rows: 3,
  },
  {
    key: "audience",
    label: "Who you write for",
    hint: "Be specific — it changes the vocabulary the engine picks.",
    placeholder: "Early-stage founders who already know the basics and hate fluff…",
    rows: 3,
  },
  {
    key: "likedWords",
    label: "Words you like",
    hint: "Phrases, slang or terms that sound like you.",
    placeholder: "shipping, small bets, boring solutions, “in practice”…",
    rows: 2,
  },
  {
    key: "bannedWords",
    label: "Words to never use",
    hint: "The engine treats this as a hard rule.",
    placeholder: "synergy, disrupt, guru, hack, “game-changer”…",
    rows: 2,
  },
  {
    key: "samples",
    label: "A writing sample (optional)",
    hint: "Paste a post you're proud of. Not injected verbatim — it's a reference.",
    placeholder: "Paste one of your best posts here…",
    rows: 5,
  },
];

export function VoiceEditor() {
  const [fields, setFields] = useState<VoiceFields>(EMPTY);
  const [status, setStatus] = useState<"loading" | "ready" | "saving" | "saved" | "error">("loading");
  const [message, setMessage] = useState<string | null>(null);
  const [maxLength, setMaxLength] = useState(600);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/brand-voice", { cache: "no-store" });
      const payload = (await res.json().catch(() => null)) as
        | {
            ok: true;
            voice: Partial<Record<keyof VoiceFields, string | null>>;
            maxLength?: number;
          }
        | { ok: false; error?: string }
        | null;

      if (!res.ok || !payload || payload.ok !== true) {
        setStatus("error");
        setMessage(
          payload && payload.ok === false && payload.error ? payload.error : "Could not load your settings.",
        );
        return;
      }

      if (payload.maxLength) setMaxLength(payload.maxLength);
      setFields({
        about: payload.voice.about ?? "",
        audience: payload.voice.audience ?? "",
        likedWords: payload.voice.likedWords ?? "",
        bannedWords: payload.voice.bannedWords ?? "",
        samples: payload.voice.samples ?? "",
      });
      setStatus("ready");
    } catch {
      setStatus("error");
      setMessage("Could not reach the server. Check your connection.");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function save() {
    setStatus("saving");
    setMessage(null);
    try {
      const res = await fetch("/api/brand-voice", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });
      const payload = (await res.json().catch(() => null)) as
        | { ok: true }
        | { ok: false; error?: string }
        | null;

      if (!res.ok || !payload || payload.ok !== true) {
        setStatus("error");
        setMessage(
          payload && payload.ok === false && payload.error ? payload.error : "Could not save your settings.",
        );
        return;
      }

      setStatus("saved");
      setMessage("Saved. Every new generation will follow this voice.");
    } catch {
      setStatus("error");
      setMessage("Could not reach the server. Check your connection.");
    }
  }

  const filled = Object.values(fields).some((v) => v.trim().length > 0);

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3 rounded-2xl border border-neutral-200 bg-white px-4 py-3.5">
        <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-neutral-950">
          <VoiceIcon className="h-4 w-4 text-white" />
        </span>
        <div>
          <p className="text-[13px] font-semibold text-neutral-900">Applied automatically</p>
          <p className="mt-0.5 text-[12.5px] leading-6 text-neutral-500">
            Once saved, this profile is added to the prompt behind every bundle you generate. You never have to
            repeat yourself.
          </p>
        </div>
      </div>

      {message && (
        <div
          role="status"
          className={`animate-fade-in flex items-start gap-3 rounded-2xl border px-4 py-3.5 text-sm ${
            status === "error"
              ? "border-red-200 bg-red-50/70 text-red-800"
              : "border-emerald-200 bg-emerald-50/70 text-emerald-800"
          }`}
        >
          {status === "error" ? (
            <AlertIcon className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
          ) : (
            <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
          )}
          <p>{message}</p>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {FIELDS.map((field) => (
          <div
            key={field.key}
            className={`surface p-5 ${field.key === "samples" ? "lg:col-span-2" : ""}`}
          >
            <label
              htmlFor={`voice-${field.key}`}
              className="text-sm font-semibold tracking-tight text-neutral-900"
            >
              {field.label}
            </label>
            <p className="mt-1 text-[12px] leading-5 text-neutral-500">{field.hint}</p>
            <textarea
              id={`voice-${field.key}`}
              value={fields[field.key]}
              onChange={(e) =>
                setFields((prev) => ({ ...prev, [field.key]: e.target.value.slice(0, maxLength) }))
              }
              rows={field.rows}
              dir="auto"
              placeholder={field.placeholder}
              className="field scrollbar-thin mt-3 w-full resize-y bg-neutral-50/60 leading-7 focus:bg-white"
            />
            <p className="mt-1.5 text-right font-mono text-[10.5px] text-neutral-400">
              {fields[field.key].length}/{maxLength}
            </p>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => void save()}
          disabled={status === "loading" || status === "saving"}
          className="btn btn-primary btn-lg"
        >
          {status === "saving" ? (
            <>
              <SpinnerIcon className="h-4 w-4" /> Saving…
            </>
          ) : (
            <>
              <CheckIcon className="h-4 w-4" /> Save my voice
            </>
          )}
        </button>
        {filled && (
          <button
            type="button"
            onClick={() => setFields(EMPTY)}
            className="btn btn-ghost btn-md"
            disabled={status === "saving"}
          >
            Clear all fields
          </button>
        )}
      </div>
    </div>
  );
}
