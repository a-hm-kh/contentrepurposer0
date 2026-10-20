/** Shared client/server constants (safe to import from client components). */

/** sessionStorage key used to hand text from the landing hero to the dashboard. */
export const DRAFT_STORAGE_KEY = "contentrepurposer:draft";

/** Must mirror `lib/config.ts` (server-side, env-overridable). */
export const MAX_INPUT_CHARS = 20_000;
export const MIN_INPUT_CHARS = 40;

/** Lifetime free generations per visitor (never renews). */
export const FREE_GENERATIONS = 10;

/** Twitter/X hard limit per tweet. */
export const TWEET_LIMIT = 280;
