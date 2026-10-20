/**
 * Shared types for ContentRepurposer.
 */

/** The structured payload every AI provider must return. */
export interface RepurposedContent {
  /** Long-form LinkedIn post: hook, body, CTA. */
  linkedin: string;
  /** X (Twitter) thread — one string per tweet, in order. */
  twitter_thread: string[];
  /** Instagram/Facebook caption with emojis + hashtags. */
  instagram: string;
}

/**
 * Providers tried in order by the failover chain.
 * (Internal only — never surfaced to users.)
 */
export type ProviderName = "groq" | "gemini" | "openai";

/** Lifetime free-quota status for the current visitor. */
export interface UsageInfo {
  used: number;
  limit: number;
  remaining: number;
  exhausted: boolean;
  /** Where the "Upgrade" button should point (null = payments not live yet). */
  upgradeUrl: string | null;
}

/** Successful /api/repurpose response. */
export interface RepurposeSuccess {
  ok: true;
  data: RepurposedContent;
  /** Which provider actually produced the content (internal). */
  provider: ProviderName;
  model: string;
  elapsedMs: number;
  /** Providers that were tried and failed before `provider` succeeded. */
  failedProviders: ProviderName[];
  usage: UsageInfo;
}

/** Failed /api/repurpose response (always user-friendly). */
export interface RepurposeFailure {
  ok: false;
  error: string;
  /** Optional machine-readable code for the frontend. */
  code?: "invalid_input" | "rate_limited" | "ai_unavailable" | "bad_request" | "limit_reached";
  usage?: UsageInfo;
}

export type RepurposeResponse = RepurposeSuccess | RepurposeFailure;
