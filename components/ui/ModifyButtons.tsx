"use client";

interface ModifyButtonsProps {
  onModify: (type: string) => void;
  disabled?: boolean;
  /** The modification currently in flight, used to show a spinner on that button. */
  busyType?: string | null;
}

const ACTIONS = [
  { type: "SHORTEN", label: "Shorten" },
  { type: "MORE_PERSUASIVE", label: "More persuasive" },
  { type: "CHANGE_HOOK", label: "New hook" },
  { type: "SIMPLIFY", label: "Simpler rewrite" },
  { type: "THREE_VARIANTS", label: "3 variants" },
  { type: "CHANGE_TONE", label: "Change tone" },
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
            className="btn btn-secondary btn-sm"
          >
            {busy ? "…" : action.label}
          </button>
        );
      })}
    </div>
  );
}
