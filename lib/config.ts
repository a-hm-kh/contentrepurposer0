/**
 * Server-side configuration (read from environment variables).
 */

function num(name: string, fallback: number): number {
  const parsed = Number.parseInt(process.env[name] ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export const config = {
  /** Hard cap on input length, protects token spend. */
  maxInputChars: num("MAX_INPUT_CHARS", 20_000),
  /** Anything shorter than this isn't worth repurposing. */
  minInputChars: 40,
  /** Requests allowed per IP per minute. */
  rateLimitPerMinute: num("RATE_LIMIT_PER_MINUTE", 10),
  /**
   * Lifetime free generations per visitor. The free package is never renewed
   * or reset — after this, generation requires the paid plan.
   */
  freeGenerations: num("FREE_GENERATIONS", 10),
};
