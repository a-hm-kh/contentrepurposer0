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
    newsletter: { type: "STRING" },
    carousel: { type: "ARRAY", items: { type: "STRING" } },
    blogArticle: { type: "STRING" },
    hashtags: { type: "ARRAY", items: { type: "STRING" } },
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
    "newsletter",
    "carousel",
    "blogArticle",
    "hashtags",
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

/** The user's saved writing identity, injected into the system prompt. */
export interface BrandVoiceProfile {
  about?: string | null;
  audience?: string | null;
  likedWords?: string | null;
  bannedWords?: string | null;
}

function buildVoiceBlock(voice?: BrandVoiceProfile | null): string {
  if (!voice) return "";
  const parts: string[] = [];
  if (voice.about?.trim()) parts.push(`- Who the author is: ${voice.about.trim()}`);
  if (voice.audience?.trim()) parts.push(`- Who they write for: ${voice.audience.trim()}`);
  if (voice.likedWords?.trim()) parts.push(`- Words and phrases they like to use: ${voice.likedWords.trim()}`);
  const hasBanned = Boolean(voice.bannedWords?.trim());
  if (hasBanned) parts.push(`- Words and phrases they NEVER want to see: ${voice.bannedWords!.trim()}`);
  if (parts.length === 0) return "";

  return `
AUTHOR VOICE PROFILE — match this voice exactly, it overrides generic style advice:
${parts.join("\n")}
- Write as this specific person, not as a content marketer.${hasBanned ? "\n- The banned list above is an absolute hard rule: never output those words or phrases." : ""}`;
}

function buildSystemPrompt(tone: string, voice?: BrandVoiceProfile | null): string {
  const toneLabel = TONE_LABELS[tone] || tone;

  return `You are a world-class social media copywriter and content strategist.

You will receive one piece of long-form content (article, video script, newsletter, or transcript).
Repurpose it into a complete package of platform-ready posts while staying strictly faithful to the source.

⚠️ CRITICAL CONTENT INTEGRITY RULES:
- Do NOT invent facts, numbers, statistics, or ideas not present in the original text.
- Preserve the core message and conclusions exactly.
- Your job is RESTRUCTURING and ADAPTING, not creating new content.
- Never mention that the content was repurposed or AI-generated.

SOUND HUMAN — BANNED PHRASES (this is critical, readers punish robotic copy):
- Never use any of these openers or fillers: "In today's fast-paced world", "In the ever-evolving landscape", "Let's dive in", "Let's unpack", "Game-changer", "Unlock the power", "Take it to the next level", "Whether you're a… or a…", "It's not just X, it's Y", "delve", "leverage", "seamless", "robust", "elevate", "revolutionize", "tapestry", "testament to".
- In Arabic never use: "في عالمنا المتسارع", "في ظل التطور المتسارع", "لا شك أن", "من الجدير بالذكر", "دعنا نغوص", "يُعدّ بمثابة", "نقلة نوعية", "تحقيق التنمية المستدامة".
- No em-dash-heavy rhythm, no "Firstly/Secondly/In conclusion", no generic closing summaries.
- Write like a specific person talking to a specific reader: concrete nouns, short sentences, no filler adjectives. Vary sentence length.

WRITING TONE: ${toneLabel}${buildVoiceBlock(voice)}
OUTPUT LANGUAGE — most important rule:
- Detect the language of the source content and write EVERY output field in that SAME language.
- Do NOT translate. Do NOT force English. Never output a different language than the source.
- Write the source language natively and idiomatically — not as a literal translation.
- If the source is Arabic, write in natural, clear Modern Standard Arabic (idiomatic, not translated-sounding).
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
  "newsletter": "a ready-to-send email newsletter built from the source: a short subject-worthy opening line, 3-5 tight sections with a subheading each, and a closing line. Plain text, no HTML.",
  "carousel": ["6-10 slides; each slide is 'SLIDE TITLE — one or two supporting lines'. First slide is the hook, last slide is the call to action."],
  "blogArticle": "a short standalone article (roughly 350-600 words) with a headline, a 2-3 sentence intro, 3 subheadings with a paragraph each, and a closing takeaway. Built ONLY from ideas in the source.",
  "hashtags": ["three separate lines; each line is a ready-to-paste hashtag set for one platform: LinkedIn, Instagram, and X/TikTok"],
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
  voice?: BrandVoiceProfile | null,
): { role: "system" | "user"; content: string }[] {
  const userIntro =
    "Repurpose the following content into the requested JSON package. Write every value in the same language as the content itself.";

  return [
    { role: "system", content: buildSystemPrompt(tone, voice) },
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
  const newsletter = toBlock(obj.newsletter ?? obj.newsletterDraft);
  const carousel = toArray(obj.carousel ?? obj.carouselSlides);
  const blogArticle = toBlock(obj.blogArticle ?? obj.blog_article ?? obj.article);
  const hashtags = toArray(obj.hashtags ?? obj.hashTags);

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
    newsletter: newsletter || undefined,
    carousel: carousel.length ? carousel : undefined,
    blogArticle: blogArticle || undefined,
    hashtags: hashtags.length ? hashtags : undefined,
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
