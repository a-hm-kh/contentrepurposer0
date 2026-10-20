"use client";

import { useState } from "react";

import { SpinnerIcon } from "@/components/icons";

export function CheckoutButton({ label = "الاشتراك في Pro الآن" }: { label?: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startCheckout() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", { method: "POST" });
      const payload = (await res.json().catch(() => null)) as { url?: string; error?: string } | null;

      if (!res.ok || !payload?.url) {
        setError(payload?.error ?? "تعذّر بدء عملية الدفع. حاول مرة أخرى.");
        return;
      }

      window.location.href = payload.url;
    } catch {
      setError("تعذّر الوصول إلى الخادم. تحقّق من اتصالك بالإنترنت.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => void startCheckout()}
        disabled={loading}
        aria-busy={loading}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-neutral-950 transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? (
          <>
            <SpinnerIcon className="h-4 w-4" /> جاري التحويل…
          </>
        ) : (
          label
        )}
      </button>
      {error && <p className="text-xs text-red-300">{error}</p>}
    </div>
  );
}
