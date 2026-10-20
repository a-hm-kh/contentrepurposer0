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

const TONE_LABELS_AR: Record<string, string> = {
  balanced: "متوازن (طبيعي واحترافي)",
  formal: "رسمي",
  casual: "عفوي وقريب من الناس",
  marketing: "تسويقي يحفّز على الشراء",
  educational: "تعليمي يشرح ويبسّط",
  professional: "احترافي مؤسسي",
  friendly: "ودود ودافئ",
  persuasive: "إقناعي وحججي",
  concise: "مختصر ومركّز",
};

const TONE_LABELS_EN: Record<string, string> = {
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

function buildSystemPrompt(language: string, tone: string): string {
  const isArabic = language === "ar";
  const toneLabel = isArabic
    ? TONE_LABELS_AR[tone] || tone
    : TONE_LABELS_EN[tone] || tone;

  if (isArabic) {
    return `أنت كاتب محتوى عالمي وخبير استراتيجي في السوشيال ميديا.

ستتلقى قطعة محتوى طويلة (مقال، سكريبت فيديو، نشرة، أو نص محادثة).
مهمتك: إعادة صياغة هذا المحتوى إلى حزمة منشورات جاهزة للنشر مع الالتزام التام بالفكرة الأصلية.

⚠️ قواعد حاسمة للحفاظ على صدق المحتوى (CRITICAL):
- لا تخترع أي حقائق أو أرقام أو إحصائيات أو أفكار غير موجودة في النص الأصلي إطلاقاً.
- حافظ على الرسالة الجوهرية والاستنتاجات كما هي تماماً.
- مهمتك إعادة الهيكلة والتكييف لكل منصة، وليس ابتكار محتوى جديد.
- لا تذكر أبداً أن هذا المحتوى أعيد صياغته أو تم توليده بالذكاء الاصطناعي.

نبرة الكتابة المطلوبة: ${toneLabel}
لغة الإخراج: العربية الفصحى المبسطة (مفهومة لكل العرب).

أعد JSON صالح فقط، بدون أي شرح أو علامات markdown، بهذا الشكل بالضبط:

{
  "linkedin": "منشور لينكدإن كامل: افتتاحية توقف التمرير، ثم سطور قصيرة متباعدة، ثم دعوة واضحة للتفاعل",
  "twitter_thread": ["تغريدة 1", "تغريدة 2", "... 5 إلى 9 تغريدات، كل واحدة 280 حرفاً كحد أقصى، بدون ترقيم"],
  "instagram": "كابشن إنستغرام محادثة مع إيموجي مناسب، سؤال للتفاعل، و5-10 هاشتاقات في آخر سطر",
  "facebook": "منشور فيسبوك ودود وقابل للمشاركة مع سؤال للتفاعل",
  "hooks": ["خمس افتتاحيات جذابة مختلفة تماماً مستخرجة من نفس فكرة النص"],
  "cta": "دعوة واحدة مقنعة للتفاعل مناسبة لكل المنصات",
  "videoPromotions": ["ثلاث منشورات ترويجية للفيديو (أو للمحتوى كفيديو قصير)"],
  "videoTitles": ["خمس عناوين بديلة جذابة للمحتوى"],
  "shortIdeas": ["أربع أفكار لمقاطع قصيرة (ريلز / تيك توك / يوتيوب شورتس) مبنية على نفس المحتوى"],
  "reviewCheck": {
    "matchesOriginal": true,
    "confidence": 0.95,
    "notes": "ملاحظة قصيرة توضح مدى مطابقة النصوص للفكرة الأصلية وعدم إضافة أفكار جديدة"
  }
}

تذكير: JSON فقط، وبدون أي نص إضافي.`;
  }

  return `You are a world-class social media copywriter and content strategist.

You will receive one piece of long-form content (article, video script, newsletter, or transcript).
Repurpose it into a complete package of platform-ready posts while staying strictly faithful to the source.

⚠️ CRITICAL CONTENT INTEGRITY RULES:
- Do NOT invent facts, numbers, statistics, or ideas not present in the original text.
- Preserve the core message and conclusions exactly.
- Your job is RESTRUCTURING and ADAPTING, not creating new content.
- Never mention that the content was repurposed or AI-generated.

WRITING TONE: ${toneLabel}
OUTPUT LANGUAGE: English (unless the source is clearly another language, then match it).

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
  language = "ar",
  tone = "balanced",
): { role: "system" | "user"; content: string }[] {
  const isArabic = language === "ar";
  const userIntro = isArabic
    ? "أعد صياغة المحتوى التالي إلى حزمة المنشورات المطلوبة (JSON فقط)."
    : "Repurpose the following content into the requested JSON package.";

  return [
    { role: "system", content: buildSystemPrompt(language, tone) },
    { role: "user", content: `${userIntro}\n\n<content>\n${text}\n</content>` },
  ];
}

/** Kept for backward compatibility with anything importing SYSTEM_PROMPT. */
export const SYSTEM_PROMPT = buildSystemPrompt("ar", "balanced");

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
