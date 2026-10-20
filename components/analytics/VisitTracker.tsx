"use client";

import { useEffect } from "react";

/**
 * Fires a single anonymous page-view beacon per browser session.
 * No cookies are read beyond the existing visitor id; nothing personal is sent.
 */
export function VisitTracker() {
  useEffect(() => {
    const KEY = "contentrepurposer:tracked";
    try {
      if (sessionStorage.getItem(KEY)) return;
      sessionStorage.setItem(KEY, "1");
    } catch {
      /* sessionStorage unavailable — still fire once per mount */
    }

    void fetch("/api/track/visit", { method: "POST", keepalive: true }).catch(() => undefined);
  }, []);

  return null;
}
