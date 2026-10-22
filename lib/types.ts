/**
 * Shared types for ContentRepurposer (v2).
 */

export interface RepurposedContent {
  linkedin: string;
  twitter_thread: string[];
  instagram: string;
  facebook: string;
  hooks: string[];
  cta: string;
  videoPromotions?: string[];
  videoTitles?: string[];
  shortIdeas?: string[];
  /** Newsletter / email edition of the source content. */
  newsletter?: string;
  /** Slide-by-slide carousel outline (LinkedIn / Instagram). */
  carousel?: string[];
  /** A short standalone article / blog post built only from the source. */
  blogArticle?: string;
  /** Ready-to-use hashtag sets for the source topic. */
  hashtags?: string[];
  reviewCheck?: {
    matchesOriginal: boolean;
    confidence: number;
    notes: string;
  };
}

export type ProviderName = "groq" | "gemini" | "openai";

export type InputType = "ARTICLE" | "VIDEO_SCRIPT" | "BLOG_POST" | "NEWSLETTER" | "TRANSCRIPT";

export interface UsageInfo {
  used: number;
  limit: number;
  remaining: number;
  exhausted: boolean;
  plan?: "free" | "pro" | "admin";
  scope?: "user" | "anonymous";
  canGenerate?: boolean;
  canModify?: boolean;
  modificationsUsed?: number;
  modificationsLimit?: number;
  modificationsRemaining?: number;
  resetsAt?: string | null;
  upgradeUrl: string | null;
}

export interface RepurposeSuccess {
  ok: true;
  data: RepurposedContent;
  generationId?: string | null;
  provider: ProviderName;
  model: string;
  elapsedMs: number;
  failedProviders: ProviderName[];
  usage: UsageInfo;
}

export interface RepurposeFailure {
  ok: false;
  error: string;
  code?: "invalid_input" | "rate_limited" | "ai_unavailable" | "bad_request" | "limit_reached";
  usage?: UsageInfo;
}

export type RepurposeResponse = RepurposeSuccess | RepurposeFailure;

