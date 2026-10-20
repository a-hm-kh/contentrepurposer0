import type { RepurposedContent } from "@/lib/types";

/**
 * The single source of truth for prompting.
 * Every provider (Groq → Gemini → OpenAI) receives these EXACT messages,
 * so a fallback produces identical output quality/shape.
 */

/**
 * JSON Schema handed to Google Gemini via `responseSchema`
 * (Gemini requires uppercase type enums).
 */
export const GEMINI_RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    linkedin: { type: "STRING" },
    twitter_thread: { type: "ARRAY", items: { type: "STRING" } },
    instagram: { type: "STRING" },
  },
  required: ["linkedin", "twitter_thread", "instagram"],
  propertyOrdering: ["linkedin", "twitter_thread", "instagram"],
} as const;

export const SYSTEM_PROMPT = `You are a world-class social media copywriter and content strategist.

You will receive one piece of long-form content (an article, blog post, or raw text).
Repurpose it into three platform-specific formats and return ONLY a valid JSON object
— no markdown fences, no commentary, no explanation.

The JSON object MUST have exactly these keys:

1. "linkedin" (string)
   - A complete LinkedIn post in the voice of the original author.
   - Structure: a scroll-stopping first line (the hook, no hashtags on it), a blank line,
     2-4 short punchy paragraphs (2-3 sentences each, lots of white space),
     then a clear call-to-action question or invitation to comment.
   - Professional but human tone. Line breaks between paragraphs. No hashtags unless the
     source explicitly uses them (max 3, placed at the very end).

2. "twitter_thread" (array of strings)
   - 5-9 tweets that tell the same story as a thread.
   - Tweet 1 must be a standalone hook that makes people click "show more".
   - Every tweet must be ≤ 280 characters.
   - Do NOT number the tweets ("1/") — numbering is added by the UI.
   - Final tweet: a short summary + call-to-action to follow/reply.

3. "instagram" (string)
   - A conversational, scroll-stopping caption with a hook on the first line.
   - Natural, relevant emojis (not spammy), short lines with line breaks,
     a question to drive comments, then 5-10 niche-relevant hashtags on the final line.

Ground rules:
- Preserve the original facts, numbers, names, and opinions. NEVER invent statistics.
- Never mention that the content was repurposed, generated, or written by AI.
- Keep the author's core message intact while adapting tone per platform.
- Output STRICT JSON only. If in doubt, output the JSON object and nothing else.`;

export function buildMessages(text: string): { role: "system" | "user"; content: string }[] {
  return [
    { role: "system", content: SYSTEM_PROMPT },
    {
      role: "user",
      content: `Repurpose the following content into the three JSON formats requested.\n\n<content>\n${text}\n</content>`,
    },
  ];
}

/** Thrown when a model returns something we cannot turn into content. */
export class InvalidModelOutputError extends Error {}

/**
 * Robustly parse model output into `RepurposedContent`.
 * Handles: code fences, leading prose, stringified threads, numbering prefixes.
 */
export function parseRepurposedContent(raw: string): RepurposedContent {
  const json = extractJson(raw);

  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new InvalidModelOutputError("The AI returned malformed JSON.");
  }

  if (typeof parsed !== "object" || parsed === null) {
    throw new InvalidModelOutputError("The AI returned an unexpected payload.");
  }

  const obj = parsed as Record<string, unknown>;
  const linkedin = toBlock(obj.linkedin);
  const instagram = toBlock(obj.instagram);
  const twitter = toArray(obj.twitter_thread ?? obj.twitterThread ?? obj.tweets);

  if (!linkedin || !instagram || twitter.length === 0) {
    throw new InvalidModelOutputError("The AI returned empty content.");
  }

  return { linkedin, twitter_thread: twitter, instagram };
}

/* ------------------------------------------------------------------ */
/* helpers                                                             */
/* ------------------------------------------------------------------ */

function extractJson(raw: string): string {
  let text = (raw ?? "").trim();

  // Strip ```json ... ``` fences (with or without a language tag).
  const fence = text.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (fence?.[1]) text = fence[1].trim();

  // Fast path.
  if (text.startsWith("{") && text.endsWith("}")) return text;

  // Slow path: pull the outermost object out of surrounding prose.
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start !== -1 && end > start) return text.slice(start, end + 1);

  throw new InvalidModelOutputError("The AI did not return JSON.");
}

function toBlock(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (Array.isArray(value)) return value.map((v) => String(v).trim()).join("\n\n").trim();
  return "";
}

function toArray(value: unknown): string[] {
  let items: string[] = [];

  if (Array.isArray(value)) {
    items = value.map((v) => String(v).trim());
  } else if (typeof value === "string" && value.trim()) {
    // Model returned one big string — split it into tweets.
    items = splitThreadIntoTweets(value);
  }

  // Models love adding "1." / "2)" prefixes even when told not to — strip them
  // because the UI renders its own numbering.
  return items
    .map((item) => item.replace(/^\s*\d+\s*[/.)-]\s*/, "").trim())
    .filter(Boolean);
}

function splitThreadIntoTweets(text: string): string[] {
  // Preferred delimiter: a line containing only --- or •••
  if (/^\s*(?:---+|•{2,}|~{3})\s*$/m.test(text)) {
    return text
      .split(/^\s*(?:---+|•{2,}|~{3})\s*$/m)
      .map((t) => t.trim())
      .filter(Boolean);
  }

  // Fallback: blank-line separated blocks.
  return text
    .split(/\n{2,}/)
    .map((t) => t.trim())
    .filter(Boolean);
}
