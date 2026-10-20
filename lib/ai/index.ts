/**
 * The failover (Failover AI) engine.
 *
 * Provider chain:
 *   1. Groq            (primary  — llama-3.3-70b-versatile by default)
 *   2. Google Gemini   (automatic fallback — Gemini Flash by default)
 *   3. OpenAI          (optional extra fallback, only if OPENAI_API_KEY is set)
 *
 * If every configured provider fails, a single friendly `AiUnavailableError`
 * is thrown so the user never sees a broken generation process.
 */

import type { ProviderName, RepurposedContent } from "@/lib/types";
import {
  ProviderError,
  isConfigured,
  runGemini,
  runGroq,
  runOpenAi,
} from "@/lib/ai/providers";

export interface GenerationResult {
  data: RepurposedContent;
  provider: ProviderName;
  model: string;
  elapsedMs: number;
  /** Providers that failed before `provider` succeeded (failover trail). */
  failedProviders: ProviderName[];
}

/** Every provider failed (network, rate limit, outage…). */
export class AiUnavailableError extends Error {
  readonly failures: string[];

  constructor(failures: string[]) {
    super(
      "Our AI providers are temporarily unavailable or rate-limited. Please try again in a few seconds.",
    );
    this.name = "AiUnavailableError";
    this.failures = failures;
  }
}

/** No API key configured at all — a setup problem, not an outage. */
export class AiConfigurationError extends Error {
  constructor() {
    super(
      "AI generation isn't configured on this server yet. Add the API keys to .env.local and restart.",
    );
    this.name = "AiConfigurationError";
  }
}

const CHAIN: { name: ProviderName; run: (text: string) => Promise<{ content: RepurposedContent; model: string }> }[] =
  [
    { name: "groq", run: runGroq },
    { name: "gemini", run: runGemini },
    { name: "openai", run: runOpenAi },
  ];

/** Which providers are actually usable right now (key present). */
export function availableProviders(): ProviderName[] {
  return CHAIN.filter((step) => isConfigured(step.name)).map((step) => step.name);
}

export async function generateRepurposedContent(text: string): Promise<GenerationResult> {
  const providers = CHAIN.filter((step) => isConfigured(step.name));
  if (providers.length === 0) throw new AiConfigurationError();

  const startedAt = Date.now();
  const failures: string[] = [];
  const failedProviders: ProviderName[] = [];

  for (const step of providers) {
    try {
      const { content, model } = await step.run(text);
      return {
        data: content,
        provider: step.name,
        model,
        elapsedMs: Date.now() - startedAt,
        failedProviders,
      };
    } catch (err) {
      const detail =
        err instanceof ProviderError
          ? err.message
          : err instanceof Error
            ? err.message
            : String(err);

      failedProviders.push(step.name);
      failures.push(`${step.name}: ${detail}`);
      console.warn(`[ai] provider "${step.name}" failed — falling back. Reason: ${detail}`);
    }
  }

  console.error(`[ai] all providers failed:\n  - ${failures.join("\n  - ")}`);
  throw new AiUnavailableError(failures);
}
