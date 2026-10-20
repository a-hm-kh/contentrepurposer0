/**
 * Tiny in-memory sliding-window rate limiter.
 *
 * Good enough for a single-instance MVP. On serverless platforms each instance
 * keeps its own counter — swap `checkRateLimit` for Upstash Redis (or Vercel KV)
 * when you need a global limit. The signature stays the same.
 */

import { config } from "@/lib/config";

const WINDOW_MS = 60_000;
const MAX_TRACKED_KEYS = 5_000;

const hits = new Map<string, number[]>();

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

export function checkRateLimit(key: string): RateLimitResult {
  const now = Date.now();
  const windowStart = now - WINDOW_MS;

  // Opportunistic cleanup so the map can't grow unbounded.
  if (hits.size > MAX_TRACKED_KEYS) {
    for (const [existingKey, timestamps] of hits) {
      if (timestamps.every((t) => t < windowStart)) hits.delete(existingKey);
    }
  }

  const recent = (hits.get(key) ?? []).filter((t) => t > windowStart);

  if (recent.length >= config.rateLimitPerMinute) {
    const oldest = recent[0] ?? now;
    const retryAfterSeconds = Math.max(1, Math.ceil((oldest + WINDOW_MS - now) / 1000));
    hits.set(key, recent);
    return { ok: false, remaining: 0, retryAfterSeconds };
  }

  recent.push(now);
  hits.set(key, recent);

  return {
    ok: true,
    remaining: Math.max(0, config.rateLimitPerMinute - recent.length),
    retryAfterSeconds: 0,
  };
}

/** Best-effort client identity for rate limiting. */
export function clientKeyFrom(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || headers.get("x-real-ip") || "unknown";
  return ip;
}
