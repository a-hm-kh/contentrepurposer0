/**
 * The failover AI engine with tone support.
 */

import type { ProviderName, RepurposedContent } from "@/lib/types";
import {
  ProviderError,
  isConfigured,
  runGemini,
  runGeminiText,
  runGroq,
  runGroqText,
  runOpenAi,
  runOpenAiText,
} from "@/lib/ai/providers";
import type { BrandVoiceProfile } from "@/lib/ai/prompts";

export type { BrandVoiceProfile };

export interface GenerationResult {
  data: RepurposedContent;
  provider: ProviderName;
  model: string;
  elapsedMs: number;
  failedProviders: ProviderName[];
}

export class AiUnavailableError extends Error {
  readonly failures: string[];
  constructor(failures: string[]) {
    super("The content engines are busy or temporarily unavailable. Please try again in a few seconds.");
    this.name = "AiUnavailableError";
    this.failures = failures;
  }
}

export class AiConfigurationError extends Error {
  constructor() {
    super("Generation is not configured on this server yet. Add the AI keys to the environment and restart.");
    this.name = "AiConfigurationError";
  }
}

/* ------------------------------------------------------------------ */
/* Inline modifications (shorten / restyle / re-hook / variants)       */
/* ------------------------------------------------------------------ */

export type ModificationKind =
  | "SHORTEN"
  | "MORE_PERSUASIVE"
  | "CHANGE_HOOK"
  | "SIMPLIFY"
  | "THREE_VARIANTS"
  | "CHANGE_TONE"
  | "CUSTOM";

export interface ModificationResult {
  text: string;
  variants: string[];
  provider: ProviderName;
  model: string;
}

/**
 * Modification instructions. The output language always follows the text
 * being edited (detected at runtime), so the rules are language-agnostic.
 */
const MODIFICATION_RULES: Record<ModificationKind, { rule: string; wantsVariants: boolean }> = {
  SHORTEN: {
    rule: "Shorten the text noticeably while keeping the main idea and only the key points.",
    wantsVariants: false,
  },
  MORE_PERSUASIVE: {
    rule: "Make the text more persuasive and punchier without adding any new ideas or facts.",
    wantsVariants: false,
  },
  CHANGE_HOOK: {
    rule: "Rewrite ONLY the opening hook and leave the rest of the text unchanged.",
    wantsVariants: false,
  },
  SIMPLIFY: {
    rule: "Rewrite the text in simpler, clearer language anyone can understand.",
    wantsVariants: false,
  },
  THREE_VARIANTS: {
    rule: "Create three completely different versions that keep the same idea and core.",
    wantsVariants: true,
  },
  CHANGE_TONE: {
    rule: "Change the tone as requested while preserving the meaning and ideas exactly.",
    wantsVariants: false,
  },
  CUSTOM: {
    rule: "Apply the requested edit while strictly preserving the original idea.",
    wantsVariants: false,
  },
};

type Runner = (
  text: string,
  language: string,
  tone: string,
  voice?: BrandVoiceProfile | null,
) => Promise<{ content: RepurposedContent; model: string }>;

const CHAIN: { name: ProviderName; run: Runner }[] = [
  { name: "groq", run: runGroq as Runner },
  { name: "gemini", run: runGemini as Runner },
  { name: "openai", run: runOpenAi as Runner },
];

export function availableProviders(): ProviderName[] {
  return CHAIN.filter((step) => isConfigured(step.name)).map((step) => step.name);
}

export async function generateRepurposedContent(
  text: string,
  language: string = "ar",
  tone: string = "balanced",
  voice?: BrandVoiceProfile | null,
): Promise<GenerationResult> {
  const providers = CHAIN.filter((step) => isConfigured(step.name));
  if (providers.length === 0) throw new AiConfigurationError();

  const startedAt = Date.now();
  const failures: string[] = [];
  const failedProviders: ProviderName[] = [];

  for (const step of providers) {
    try {
      const { content, model } = await step.run(text, language, tone, voice);
      return { data: content, provider: step.name, model, elapsedMs: Date.now() - startedAt, failedProviders };
    } catch (err) {
      const detail = err instanceof ProviderError ? err.message : err instanceof Error ? err.message : String(err);
      failedProviders.push(step.name);
      failures.push(`${step.name}: ${detail}`);
      console.warn(`[ai] provider "${step.name}" failed — falling back. Reason: ${detail}`);
    }
  }

  console.error(`[ai] all providers failed:\n  - ${failures.join("\n  - ")}`);
  throw new AiUnavailableError(failures);
}

/* ------------------------------------------------------------------ */
/* Inline modification runner (same failover chain)                    */
/* ------------------------------------------------------------------ */

type TextRunner = (
  messages: { role: "system" | "user"; content: string }[],
  jsonMode?: boolean,
) => Promise<{ raw: string; model: string }>;

const TEXT_CHAIN: { name: ProviderName; run: TextRunner }[] = [
  { name: "groq", run: runGroqText },
  { name: "gemini", run: runGeminiText },
  { name: "openai", run: runOpenAiText },
];

function buildModificationMessages(params: {
  content: string;
  type: ModificationKind;
  instruction: string | null;
  platform: string | null;
}): { messages: { role: "system" | "user"; content: string }[]; wantsVariants: boolean } {
  const rule = MODIFICATION_RULES[params.type];
  const wantsVariants = rule.wantsVariants;
  const ruleText = rule.rule;
  const platformNote = params.platform ? `\nPlatform: ${params.platform}` : "";
  const customNote =
    params.type === "CUSTOM" && params.instruction ? `\nUser request: ${params.instruction}` : "";

  const languageRule =
    "Language rule: detect the language of the text below and reply in that SAME language. Never translate it.";

  if (wantsVariants) {
    const system = `You are a professional content editor. Perform one specific edit on a ready text.
Hard rule: do NOT invent any ideas, facts, or numbers absent from the text.
${languageRule}
Requested edit: ${ruleText}${platformNote}${customNote}

Return ONLY valid JSON in this shape:
{ "variants": ["version 1", "version 2", "version 3"] }`;

    return {
      messages: [{ role: "system", content: system }, { role: "user", content: params.content }],
      wantsVariants: true,
    };
  }

  const system = `You are a professional content editor. Perform one specific edit on a ready text.
Hard rule: do NOT invent any ideas, facts, or numbers absent from the text, and never mention that it was edited.
${languageRule}
Requested edit: ${ruleText}${platformNote}${customNote}

Return ONLY the edited text — no commentary, no markdown fences, no headings.`;

  return {
    messages: [{ role: "system", content: system }, { role: "user", content: params.content }],
    wantsVariants: false,
  };
}

function stripFences(raw: string): string {
  let text = (raw ?? "").trim();
  const fence = text.match(/^```(?:[a-z]+)?\s*([\s\S]*?)\s*```$/i);
  if (fence?.[1]) text = fence[1].trim();
  return text;
}

export async function generateModification(params: {
  content: string;
  type: ModificationKind;
  instruction?: string | null;
  platform?: string | null;
}): Promise<ModificationResult> {
  const providers = TEXT_CHAIN.filter((step) => isConfigured(step.name));
  if (providers.length === 0) throw new AiConfigurationError();

  const { messages, wantsVariants } = buildModificationMessages({
    content: params.content,
    type: params.type,
    instruction: params.instruction ?? null,
    platform: params.platform ?? null,
  });

  const failures: string[] = [];

  for (const step of providers) {
    try {
      const { raw, model } = await step.run(messages, wantsVariants);

      if (wantsVariants) {
        const variants = parseVariants(raw);
        if (variants.length === 0) {
          throw new ProviderError(step.name, "Model returned no variants");
        }
        return { text: variants[0]!, variants, provider: step.name, model };
      }

      const text = stripFences(raw);
      if (!text) throw new ProviderError(step.name, "Model returned empty text");
      return { text, variants: [], provider: step.name, model };
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err);
      failures.push(`${step.name}: ${detail}`);
      console.warn(`[ai] modification on "${step.name}" failed — falling back. Reason: ${detail}`);
    }
  }

  console.error(`[ai] all providers failed for modification:\n  - ${failures.join("\n  - ")}`);
  throw new AiUnavailableError(failures);
}

function parseVariants(raw: string): string[] {
  const text = stripFences(raw);
  try {
    const parsed = JSON.parse(text) as { variants?: unknown };
    if (Array.isArray(parsed?.variants)) {
      return parsed.variants.map((v) => String(v).trim()).filter(Boolean);
    }
  } catch {
    /* fall through to plain-text split */
  }

  return text
    .split(/\n{2,}/)
    .map((v) => v.replace(/^\s*(?:\d+[.)]|[-•*])\s*/, "").trim())
    .filter(Boolean)
    .slice(0, 3);
}

/* ------------------------------------------------------------------ */
/* Weekly publishing plan (planning + export only)                     */
/* ------------------------------------------------------------------ */

export interface WeeklyPlanDay {
  day: string;
  platform: string;
  type: string;
  topic: string;
  time: string;
  hook: string;
  goal: string;
}

export interface WeeklyPlanResult {
  days: WeeklyPlanDay[];
  provider: ProviderName;
  model: string;
}

const DAY_NAMES_EN = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function normalizeWeeklyPlan(raw: string): WeeklyPlanDay[] {
  const text = stripFences(raw);
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start === -1 || end <= start) throw new AiUnavailableError(["weekly-plan: model did not return JSON"]);
    parsed = JSON.parse(text.slice(start, end + 1));
  }

  const obj = parsed as { days?: unknown };
  const list = Array.isArray(obj?.days) ? obj.days : Array.isArray(parsed) ? parsed : [];

  const normalized = list
    .map((entry, index) => {
      const item = (entry ?? {}) as Record<string, unknown>;
      return {
        day: String(item.day ?? DAY_NAMES_EN[index] ?? `Day ${index + 1}`).trim(),
        platform: String(item.platform ?? "").trim(),
        type: String(item.type ?? "").trim(),
        topic: String(item.topic ?? "").trim(),
        time: String(item.time ?? "09:00").trim(),
        hook: String(item.hook ?? "").trim(),
        goal: String(item.goal ?? "").trim(),
      };
    })
    .filter((d) => d.platform || d.topic);

  if (normalized.length === 0) {
    throw new AiUnavailableError(["weekly-plan: model returned an empty plan"]);
  }

  return normalized.slice(0, 7);
}

export async function generateWeeklyPlan(params: {
  text: string;
  language?: string;
  tone?: string;
}): Promise<WeeklyPlanResult> {
  const providers = TEXT_CHAIN.filter((step) => isConfigured(step.name));
  if (providers.length === 0) throw new AiConfigurationError();

  const system = `You are a content and social media strategist. You will receive ONE piece of content and must propose a full 7-day publishing plan.

Hard rules:
- The "days" array MUST contain EXACTLY 7 items — one item per day of the week, in calendar order starting from the first day given in the weekday list below. Never return fewer than 7.
- Every item must have ALL of these keys filled with non-empty text: day, platform, type, topic, time, hook, goal.
- Use ONLY ideas present in the original content. Do not invent topics or facts.
- Detect the language of the source content and write every value in that SAME language (day names, topic, type, hook and goal included). Platform names stay in English.
- Spread days across different platforms (LinkedIn, Instagram, X, Facebook, TikTok, YouTube Shorts), never the same platform two days in a row.
- Vary the post type across the week: educational, story, quick tip, opinion, value offer, engagement question, recap.
- Give a realistic 24-hour posting time (HH:MM).
- This is planning and export only — you never publish on the user's behalf.

Return ONLY valid JSON in exactly this shape:
{
  "days": [
    { "day": "Sunday", "platform": "LinkedIn", "type": "Educational post", "topic": "topic", "time": "09:00", "hook": "suggested hook", "goal": "post goal" }
  ]
}
Return exactly 7 items in "days". JSON only, no commentary.`;

  const messages = [
    { role: "system" as const, content: system },
    { role: "user" as const, content: params.text },
  ];

  const failures: string[] = [];

  for (const step of providers) {
    try {
      const { raw, model } = await step.run(messages, true);
      let days = normalizeWeeklyPlan(raw);

      // Recovery: some models occasionally return fewer than 7 days. Ask again
      // once for the missing days so the user gets a complete plan.
      //
      // Guarded on purpose: the top-up costs an extra request, and on free
      // tiers (Groq's 8k-tokens-per-minute cap) firing it instantly can hit
      // the provider rate limit. We wait briefly first and, if the top-up
      // fails, we simply return what we already have rather than erroring.
      if (days.length < 7) {
        await sleep(1500);
        try {
          const have = days.map((d) => d.day).join(", ");
          const topUpSystem = `${system}

IMPORTANT: A previous attempt already produced these days: ${have}.
Return JSON with ONLY the remaining days needed to complete a 7-day week.
The "days" array must contain exactly ${7 - days.length} item(s).`;
          const topUpMessages = [
            { role: "system" as const, content: topUpSystem },
            { role: "user" as const, content: params.text },
          ];
          const { raw: raw2 } = await step.run(topUpMessages, true);
          const extra = normalizeWeeklyPlan(raw2).filter(
            (d) => !days.some((existing) => existing.day === d.day),
          );
          days = [...days, ...extra].slice(0, 7);
        } catch (topUpErr) {
          const detail = topUpErr instanceof Error ? topUpErr.message : String(topUpErr);
          console.warn(`[ai] weekly plan top-up failed (returning ${days.length} days). Reason: ${detail}`);
        }
      }

      return { days, provider: step.name, model };
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err);
      failures.push(`${step.name}: ${detail}`);
      console.warn(`[ai] weekly plan on "${step.name}" failed — falling back. Reason: ${detail}`);
    }
  }

  throw new AiUnavailableError(failures);
}

/** Small promise delay — used to space out provider requests on free tiers. */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
