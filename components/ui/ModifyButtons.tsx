"use client";

interface ModifyButtonsProps {
  onModify: (type: string) => void;
  disabled?: boolean;
  /** The modification currently in flight, used to show a spinner on that button. */
  busyType?: string | null;
}

const ACTIONS = [
  { type: "SHORTEN", label: "اختصر النص" },
  { type: "MORE_PERSUASIVE", label: "اجعله أكثر إقناعاً" },
  { type: "CHANGE_HOOK", label: "غير الافتتاحية" },
  { type: "SIMPLIFY", label: "أعد الكتابة بأسهل" },
  { type: "THREE_VARIANTS", label: "أنشئ 3 نسخ" },
  { type: "CHANGE_TONE", label: "غير النبرة" },
];

export function ModifyButtons({ onModify, disabled, busyType }: ModifyButtonsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {ACTIONS.map((action) => {
        const busy = busyType === action.type;
        return (
          <button
            key={action.type}
            type="button"
            onClick={() => onModify(action.type)}
            disabled={disabled}
            aria-busy={busy}
            className="rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-600 transition hover:bg-neutral-50 hover:text-neutral-900 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? "…" : action.label}
          </button>
        );
      })}
    </div>
  );
}
