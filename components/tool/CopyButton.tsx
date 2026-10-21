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

export function CopyButton({
  text,
  label = "Copy",
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

  const stateClasses = isCopied
    ? "border border-emerald-200 bg-emerald-50 text-emerald-700 shadow-[var(--shadow-control)]"
    : isError
      ? "border border-red-200 bg-red-50 text-red-700 shadow-[var(--shadow-control)]"
      : variant === "solid"
        ? "btn-primary"
        : "btn-secondary";

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-live="polite"
      className={`btn btn-sm ${stateClasses} ${className}`}
    >
      {isCopied ? <CheckIcon className="h-3.5 w-3.5" /> : <CopyIcon className="h-3.5 w-3.5" />}
      <span>{isCopied ? "Copied" : isError ? "Copy failed — copy manually" : label}</span>
    </button>
  );
}
