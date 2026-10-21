"use client";

import { useState } from "react";

import { SpinnerIcon } from "@/components/icons";

export function CheckoutButton({ label = "Upgrade to Pro now" }: { label?: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startCheckout() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", { method: "POST" });
      const payload = (await res.json().catch(() => null)) as { url?: string; error?: string } | null;

      if (!res.ok || !payload?.url) {
        setError(payload?.error ?? "Could not start checkout. Please try again.");
        return;
      }

      window.location.href = payload.url;
    } catch {
      setError("Could not reach the server. Check your connection.");
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
        className="btn btn-on-dark btn-lg w-full"
      >
        {loading ? (
          <>
            <SpinnerIcon className="h-4 w-4" /> Redirecting…
          </>
        ) : (
          label
        )}
      </button>
      {error && <p className="text-xs text-red-300">{error}</p>}
    </div>
  );
}
