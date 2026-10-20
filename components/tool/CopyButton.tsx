"use client";

import { useEffect, useRef, useState } from "react";

import { CheckIcon, CopyIcon } from "@/components/icons";
import { writeToClipboard } from "@/lib/clipboard";

type CopyState = "idle" | "copied" | "error";

interface CopyButtonProps {
  /** Plain text written to the clipboard. */
  text: string;
  /** Button label in the idle state. */
  label?: string;
  /** `solid` = primary black button, `ghost` = quiet outline button. */
  variant?: "solid" | "ghost";
  className?: string;
}

const VARIANT_CLASSES: Record<NonNullable<CopyButtonProps["variant"]>, string> = {
  solid:
    "bg-neutral-950 text-white hover:bg-neutral-800 focus-visible:ring-neutral-950/25",
  ghost:
    "border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 hover:text-neutral-950 focus-visible:ring-neutral-950/20",
};

export function CopyButton({
  text,
  label = "Copy to clipboard",
  variant = "ghost",
  className = "",
}: CopyButtonProps) {
  const [state, setState] = useState<CopyState>("idle");
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeout.current) clearTimeout(timeout.current);
    };
  }, []);

  async function handleCopy() {
    try {
      await writeToClipboard(text);
      setState("copied");
    } catch {
      setState("error");
    }

    if (timeout.current) clearTimeout(timeout.current);
    timeout.current = setTimeout(() => setState("idle"), 2000);
  }

  const isCopied = state === "copied";
  const isError = state === "error";

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-live="polite"
      className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
        isCopied
          ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
          : isError
            ? "border border-red-200 bg-red-50 text-red-700"
            : VARIANT_CLASSES[variant]
      } ${className}`}
    >
      {isCopied ? (
        <CheckIcon className="h-4 w-4" />
      ) : (
        <CopyIcon className="h-4 w-4" />
      )}
      <span>{isCopied ? "Copied!" : isError ? "Copy failed — select manually" : label}</span>
    </button>
  );
}
