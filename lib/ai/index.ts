/**
 * The failover AI engine with language + tone support.
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
    super("محركات الذكاء الاصطناعي مشغولة أو غير متاحة مؤقتاً. الرجاء المحاولة بعد ثوانٍ.");
    this.name = "AiUnavailableError";
    this.failures = failures;
  }
}

export class AiConfigurationError extends Error {
  constructor() {
    super("لم يتم تهيئة التوليد على هذا السيرفر بعد. أضف مفاتيح الذكاء الاصطناعي إلى الإعدادات وأعد التشغيل.");
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

const MODIFICATION_RULES: Record<ModificationKind, { ar: string; en: string; wantsVariants: boolean }> = {
  SHORTEN: {
    ar: "اختصر النص بشكل ملحوظ مع الحفاظ على الفكرة الرئيسية وأهم النقاط فقط.",
    en: "Shorten the text noticeably while keeping the main idea and only the key points.",
    wantsVariants: false,
  },
  MORE_PERSUASIVE: {
    ar: "اجعل النص أكثر إقناعاً وقوة في الطرح دون إضافة أي أفكار أو حقائق جديدة.",
    en: "Make the text more persuasive and punchier without adding any new ideas or facts.",
    wantsVariants: false,
  },
  CHANGE_HOOK: {
    ar: "غيّر الافتتاحية (الخطاف) فقط، واترك باقي النص كما هو دون تغيير.",
    en: "Rewrite ONLY the opening hook and leave the rest of the text unchanged.",
    wantsVariants: false,
  },
  SIMPLIFY: {
    ar: "أعد كتابة النص بأسلوب أبسط وأوضح بكلمات سهلة يفهمها الجميع.",
    en: "Rewrite the text in simpler, clearer language anyone can understand.",
    wantsVariants: false,
  },
  THREE_VARIANTS: {
    ar: "أنشئ ثلاث نسخ مختلفة تماماً بنفس الفكرة والجوهر والنبرة.",
    en: "Create three completely different versions that keep the same idea and core.",
    wantsVariants: true,
  },
  CHANGE_TONE: {
    ar: "غيّر نبرة النص وفق المطلوب مع الحفاظ التام على المعنى والأفكار.",
    en: "Change the tone as requested while preserving the meaning and ideas exactly.",
    wantsVariants: false,
  },
  CUSTOM: {
    ar: "طبّق التعديل المطلوب مع الحفاظ التام على الفكرة الأصلية.",
    en: "Apply the requested edit while strictly preserving the original idea.",
    wantsVariants: false,
  },
};

type Runner = (text: string, language: string, tone: string) => Promise<{ content: RepurposedContent; model: string }>;

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
): Promise<GenerationResult> {
  const providers = CHAIN.filter((step) => isConfigured(step.name));
  if (providers.length === 0) throw new AiConfigurationError();

  const startedAt = Date.now();
  const failures: string[] = [];
  const failedProviders: ProviderName[] = [];

  for (const step of providers) {
    try {
      const { content, model } = await step.run(text, language, tone);
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
}): { messages: { role: "system" | "user"; content: string }[]; wantsVariants: boolean; isArabic: boolean } {
  const rule = MODIFICATION_RULES[params.type];
  const isArabic = /[\u0600-\u06FF]/.test(params.content);
  const wantsVariants = rule.wantsVariants;
  const ruleText = isArabic ? rule.ar : rule.en;
  const platformNote = params.platform ? (isArabic ? `\nالمنصة: ${params.platform}` : `\nPlatform: ${params.platform}`) : "";
  const customNote =
    params.type === "CUSTOM" && params.instruction
      ? isArabic
        ? `\nطلب المستخدم: ${params.instruction}`
        : `\nUser request: ${params.instruction}`
      : "";

  if (wantsVariants) {
    const system = isArabic
      ? `أنت محرر محتوى محترف. مهمتك إجراء تعديل محدد على نص جاهز.\nقاعدة حاسمة: لا تخترع أي أفكار أو حقائق أو أرقام غير موجودة في النص.\nالتعديل المطلوب: ${ruleText}${platformNote}${customNote}\n\nأعد JSON صالح فقط بهذا الشكل:\n{ "variants": ["نسخة 1", "نسخة 2", "نسخة 3"] }`
      : `You are a professional content editor. Perform one specific edit on a ready text.\nHard rule: do NOT invent any ideas, facts, or numbers absent from the text.\nRequested edit: ${ruleText}${platformNote}${customNote}\n\nReturn ONLY valid JSON in this shape:\n{ "variants": ["version 1", "version 2", "version 3"] }`;

    return {
      messages: [{ role: "system", content: system }, { role: "user", content: params.content }],
      wantsVariants: true,
      isArabic,
    };
  }

  const system = isArabic
    ? `أنت محرر محتوى محترف. مهمتك إجراء تعديل محدد على نص جاهز.\nقاعدة حاسمة: لا تخترع أي أفكار أو حقائق أو أرقام غير موجودة في النص، ولا تذكر أبداً أن النص معدّل.\nالتعديل المطلوب: ${ruleText}${platformNote}${customNote}\n\nأعد النص المعدّل فقط، بدون أي شرح أو علامات markdown أو عناوين.`
    : `You are a professional content editor. Perform one specific edit on a ready text.\nHard rule: do NOT invent any ideas, facts, or numbers absent from the text, and never mention that it was edited.\nRequested edit: ${ruleText}${platformNote}${customNote}\n\nReturn ONLY the edited text — no commentary, no markdown fences, no headings.`;

  return {
    messages: [{ role: "system", content: system }, { role: "user", content: params.content }],
    wantsVariants: false,
    isArabic,
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

const DAY_NAMES_AR = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
const DAY_NAMES_EN = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function normalizeWeeklyPlan(raw: string, language: string): WeeklyPlanDay[] {
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
  const dayNames = language === "ar" ? DAY_NAMES_AR : DAY_NAMES_EN;

  const normalized = list
    .map((entry, index) => {
      const item = (entry ?? {}) as Record<string, unknown>;
      return {
        day: String(item.day ?? dayNames[index] ?? `Day ${index + 1}`).trim(),
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

  const language = params.language === "en" ? "en" : "ar";
  const isArabic = language === "ar";

  const system = isArabic
    ? `أنت استراتيجي محتوى وسوشيال ميديا. ستتلقى قطعة محتوى، ومهمتك اقتراح خطة نشر لأسبوع كامل (7 أيام).\n\nقواعد حاسمة:\n- اعتمد فقط على الأفكار الموجودة في المحتوى الأصلي. لا تخترع مواضيع أو حقائق جديدة.\n- وزّع الأيام على منصات مختلفة (لينكدإن، إنستغرام، إكس، فيسبوك، تيك توك، يوتيوب شورتس) بحيث لا تتكرر نفس المنصة يومين متتاليين.\n- نوّع نوع المنشور: تعليمي، قصة، نصيحة سريعة، رأي، عرض قيمة، سؤال تفاعلي، ملخص.\n- اقترح وقت نشر واقعي بصيغة 24 ساعة.\n- هذه خطة تخطيط وتصدير فقط — لا تنشر أي شيء نيابة عن المستخدم.\n\nأعد JSON صالح فقط بهذا الشكل بالضبط:\n{\n  "days": [\n    { "day": "الأحد", "platform": "LinkedIn", "type": "منشور تعليمي", "topic": "الموضوع", "time": "09:00", "hook": "خطاف مقترح", "goal": "الهدف من المنشور" }\n  ]\n}\nجاهز؟ أعد 7 أيام فقط، JSON بدون أي شرح.`
    : `You are a content and social media strategist. You'll receive one piece of content and must propose a full 7-day publishing plan.\n\nHard rules:\n- Use ONLY ideas present in the original content. Do not invent topics or facts.\n- Spread days across different platforms (LinkedIn, Instagram, X, Facebook, TikTok, YouTube Shorts), never the same platform two days in a row.\n- Vary the post type: educational, story, quick tip, opinion, value offer, engagement question, recap.\n- Suggest a realistic 24-hour posting time.\n- This is planning and export only — you never publish on the user's behalf.\n\nReturn ONLY valid JSON in exactly this shape:\n{\n  "days": [\n    { "day": "Sunday", "platform": "LinkedIn", "type": "Educational post", "topic": "topic", "time": "09:00", "hook": "suggested hook", "goal": "post goal" }\n  ]\n}\nReturn 7 days only, JSON with no commentary.`;

  const messages = [
    { role: "system" as const, content: system },
    { role: "user" as const, content: params.text },
  ];

  const failures: string[] = [];

  for (const step of providers) {
    try {
      const { raw, model } = await step.run(messages, true);
      const days = normalizeWeeklyPlan(raw, language);
      return { days, provider: step.name, model };
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err);
      failures.push(`${step.name}: ${detail}`);
      console.warn(`[ai] weekly plan on "${step.name}" failed — falling back. Reason: ${detail}`);
    }
  }

  throw new AiUnavailableError(failures);
}
