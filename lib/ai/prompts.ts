import type { RepurposedContent } from "@/lib/types";

/**
 * The single source of truth for prompting (v2).
 * Every provider receives these EXACT messages, so a fallback produces
 * identical output quality/shape.
 */

export const GEMINI_RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    linkedin: { type: "STRING" },
    twitter_thread: { type: "ARRAY", items: { type: "STRING" } },
    instagram: { type: "STRING" },
    facebook: { type: "STRING" },
    hooks: { type: "ARRAY", items: { type: "STRING" } },
    cta: { type: "STRING" },
    videoPromotions: { type: "ARRAY", items: { type: "STRING" } },
    videoTitles: { type: "ARRAY", items: { type: "STRING" } },
    shortIdeas: { type: "ARRAY", items: { type: "STRING" } },
    reviewCheck: {
      type: "OBJECT",
      properties: {
        matchesOriginal: { type: "BOOLEAN" },
        confidence: { type: "NUMBER" },
        notes: { type: "STRING" },
      },
      required: ["matchesOriginal", "confidence", "notes"],
    },
  },
  required: [
    "linkedin",
    "twitter_thread",
    "instagram",
    "facebook",
    "hooks",
    "cta",
    "videoPromotions",
    "videoTitles",
    "shortIdeas",
    "reviewCheck",
  ],
} as const;

const TONE_LABELS: Record<string, string> = {
  balanced: "balanced (natural and professional)",
  formal: "formal",
  casual: "casual and relatable",
  marketing: "marketing driven",
  educational: "educational and explanatory",
  professional: "corporate professional",
  friendly: "friendly and warm",
  persuasive: "persuasive and argumentative",
  concise: "concise and focused",
};

function buildSystemPrompt(tone: string): string {
  const toneLabel = TONE_LABELS[tone] || tone;

  return `You are a world-class social media copywriter and content strategist.

You will receive one piece of long-form content (article, video script, newsletter, or transcript).
Repurpose it into a complete package of platform-ready posts while staying strictly faithful to the source.

⚠️ CRITICAL CONTENT INTEGRITY RULES:
- Do NOT invent facts, numbers, statistics, or ideas not present in the original text.
- Preserve the core message and conclusions exactly.
- Your job is RESTRUCTURING and ADAPTING, not creating new content.
- Never mention that the content was repurposed or AI-generated.

WRITING TONE: ${toneLabel}
OUTPUT LANGUAGE — most important rule:
- Detect the language of the source content and write EVERY output field in that SAME language.
- If the source is Arabic, write in natural, clear Modern Standard Arabic.
- If the source is English, write in English.
- If the source is Spanish, French, Turkish, Hindi, or any other language, write in that language.
- If the source mixes languages, follow the dominant language of the source.
- Only the JSON keys stay in English. All values must be in the source language.

Return ONLY valid JSON (no markdown fences, no commentary) with exactly these keys:

{
  "linkedin": "full LinkedIn post: scroll-stopping hook, short scannable paragraphs, clear CTA question",
  "twitter_thread": ["tweet 1", "tweet 2", "... 5-9 tweets, each <= 280 chars, no numbering"],
  "instagram": "conversational caption with a hook, tasteful emojis, a question, and 5-10 hashtags on the last line",
  "facebook": "friendly, shareable Facebook post with an engagement question",
  "hooks": ["five distinct attention-grabbing hooks drawn from the same source ideas"],
  "cta": "one compelling call-to-action suitable across platforms",
  "videoPromotions": ["three promotional posts for the video / short-form version"],
  "videoTitles": ["five alternative catchy titles"],
  "shortIdeas": ["four short-form video ideas (Reels / TikTok / YouTube Shorts)"],
  "reviewCheck": {
    "matchesOriginal": true,
    "confidence": 0.95,
    "notes": "short note on how faithfully the output matches the original without inventing ideas"
  }
}

Remember: JSON only.`;
}

export function buildMessages(
  text: string,
  _language?: string,
  tone = "balanced",
): { role: "system" | "user"; content: string }[] {
  const userIntro =
    "Repurpose the following content into the requested JSON package. Write every value in the same language as the content itself.";

  return [
    { role: "system", content: buildSystemPrompt(tone) },
    { role: "user", content: `${userIntro}\n\n<content>\n${text}\n</content>` },
  ];
}

/** Kept for backward compatibility with anything importing SYSTEM_PROMPT. */
export const SYSTEM_PROMPT = buildSystemPrompt("balanced");

export class InvalidModelOutputError extends Error {}

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

  const facebook = toBlock(obj.facebook) || linkedin;
  const hooks = toArray(obj.hooks ?? obj.hookIdeas);
  const cta = toBlock(obj.cta) || "";
  const videoPromotions = toArray(obj.videoPromotions ?? obj.video_promotions);
  const videoTitles = toArray(obj.videoTitles ?? obj.video_titles);
  const shortIdeas = toArray(obj.shortIdeas ?? obj.short_ideas);

  const reviewRaw = obj.reviewCheck ?? obj.review_check;
  const reviewCheck =
    typeof reviewRaw === "object" && reviewRaw !== null
      ? {
          matchesOriginal: Boolean((reviewRaw as Record<string, unknown>).matchesOriginal),
          confidence: Number((reviewRaw as Record<string, unknown>).confidence) || 0,
          notes: String((reviewRaw as Record<string, unknown>).notes ?? ""),
        }
      : undefined;

  return {
    linkedin,
    twitter_thread: twitter,
    instagram,
    facebook,
    hooks,
    cta,
    videoPromotions: videoPromotions.length ? videoPromotions : undefined,
    videoTitles: videoTitles.length ? videoTitles : undefined,
    shortIdeas: shortIdeas.length ? shortIdeas : undefined,
    reviewCheck,
  };
}

/* ------------------------------------------------------------------ */
/* helpers                                                             */
/* ------------------------------------------------------------------ */

function extractJson(raw: string): string {
  let text = (raw ?? "").trim();

  const fence = text.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (fence?.[1]) text = fence[1].trim();

  if (text.startsWith("{") && text.endsWith("}")) return text;

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
    items = splitThreadIntoTweets(value);
  }

  return items
    .map((item) => item.replace(/^\s*\d+\s*[/.)-]\s*/, "").trim())
    .filter(Boolean);
}

function splitThreadIntoTweets(text: string): string[] {
  if (/^\s*(?:---+|•{2,}|~{3})\s*$/m.test(text)) {
    return text
      .split(/^\s*(?:---+|•{2,}|~{3})\s*$/m)
      .map((t) => t.trim())
      .filter(Boolean);
  }

  return text
    .split(/\n{2,}/)
    .map((t) => t.trim())
    .filter(Boolean);
}
