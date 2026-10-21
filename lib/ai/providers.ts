/**
 * AI provider adapters (v2 — language + tone aware).
 */

import type { ProviderName, RepurposedContent } from "@/lib/types";
import { buildMessages, GEMINI_RESPONSE_SCHEMA, parseRepurposedContent } from "@/lib/ai/prompts";

export interface ProviderResult {
  content: RepurposedContent;
  model: string;
}

export class ProviderError extends Error {
  constructor(
    readonly provider: ProviderName,
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "ProviderError";
  }
}

const REQUEST_TIMEOUT_MS = 60_000;
const TEMPERATURE = 0.7;
// The full bundle is large, and newer reasoning models spend part of this
// budget on hidden reasoning tokens before writing the answer. Keep it high
// enough that the JSON is never truncated mid-object.
const MAX_TOKENS = 8_000;

function env(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

export function isConfigured(provider: ProviderName): boolean {
  if (provider === "groq") return Boolean(env("GROQ_API_KEY"));
  if (provider === "gemini") return Boolean(env("GEMINI_API_KEY") || env("GOOGLE_API_KEY"));
  return Boolean(env("OPENAI_API_KEY"));
}

const GROQ_BASE_URL = env("GROQ_BASE_URL") || "https://api.groq.com/openai/v1";
const GEMINI_BASE_URL = env("GEMINI_BASE_URL") || "https://generativelanguage.googleapis.com/v1beta";
const OPENAI_BASE_URL = env("OPENAI_BASE_URL") || "https://api.openai.com/v1";

async function request(provider: ProviderName, url: string, init: RequestInit): Promise<Response> {
  try {
    return await fetch(url, { ...init, signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS), cache: "no-store" });
  } catch (err) {
    if (err instanceof Error && (err.name === "TimeoutError" || err.name === "AbortError")) {
      throw new ProviderError(provider, `Request timed out after ${REQUEST_TIMEOUT_MS / 1000}s`);
    }
    throw new ProviderError(provider, err instanceof Error ? err.message : "Network error");
  }
}

async function errorFromBody(res: Response, provider: ProviderName): Promise<ProviderError> {
  let detail = "";
  try {
    const body = (await res.text()).slice(0, 300);
    try {
      const parsed = JSON.parse(body) as { error?: { message?: string } };
      detail = parsed?.error?.message ?? body;
    } catch {
      detail = body;
    }
  } catch {
    /* ignore */
  }
  return new ProviderError(provider, `HTTP ${res.status}${detail ? ` — ${detail}` : ""}`, res.status);
}

async function callChat(
  provider: ProviderName,
  url: string,
  apiKey: string,
  model: string,
  text: string,
  language: string,
  tone: string,
): Promise<string> {
  const body: {
    model: string;
    messages: { role: "system" | "user"; content: string }[];
    temperature: number;
    max_tokens: number;
    response_format?: { type: "json_object" };
  } = {
    model,
    messages: buildMessages(text, language, tone),
    temperature: TEMPERATURE,
    max_tokens: MAX_TOKENS,
    response_format: { type: "json_object" },
  };

  const send = (payload: typeof body) =>
    request(provider, url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify(payload),
    });

  let res = await send(body);

  if (res.status === 400 && body.response_format) {
    const { response_format: _ignored, ...payload } = body;
    res = await send(payload).catch(() => res);
  }

  if (!res.ok) throw await errorFromBody(res, provider);

  const json = (await res.json()) as {
    choices?: { message?: { content?: string | null } }[];
    model?: string;
  };

  const content = json?.choices?.[0]?.message?.content;
  if (!content) throw new ProviderError(provider, "Empty response from model");
  return content;
}

export async function runGroq(text: string, language = "ar", tone = "balanced"): Promise<ProviderResult> {
  const apiKey = env("GROQ_API_KEY");
  if (!apiKey) throw new ProviderError("groq", "GROQ_API_KEY is not set");
  const model = env("GROQ_MODEL") || "llama-3.3-70b-versatile";
  const raw = await callChat("groq", `${GROQ_BASE_URL}/chat/completions`, apiKey, model, text, language, tone);
  return { content: parseRepurposedContent(raw), model };
}

export async function runGemini(text: string, language = "ar", tone = "balanced"): Promise<ProviderResult> {
  const apiKey = env("GEMINI_API_KEY") || env("GOOGLE_API_KEY");
  if (!apiKey) throw new ProviderError("gemini", "GEMINI_API_KEY is not set");

  const model = env("GEMINI_MODEL") || "gemini-2.5-flash";
  const messages = buildMessages(text, language, tone);
  const system = messages[0]?.content ?? "";
  const user = messages[1]?.content ?? "";
  const url = `${GEMINI_BASE_URL}/models/${encodeURIComponent(model)}:generateContent`;

  const build = (withThinkingConfig: boolean) => ({
    systemInstruction: { parts: [{ text: system }] },
    contents: [{ role: "user", parts: [{ text: user }] }],
    generationConfig: {
      temperature: TEMPERATURE,
      maxOutputTokens: MAX_TOKENS,
      responseMimeType: "application/json",
      responseSchema: GEMINI_RESPONSE_SCHEMA,
      ...(withThinkingConfig ? { thinkingConfig: { thinkingBudget: 0 } } : {}),
    },
  });

  const send = (payload: ReturnType<typeof build>) =>
    request("gemini", url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify(payload),
    });

  let res = await send(build(true));
  if (res.status === 400) res = await send(build(false)).catch(() => res);
  if (!res.ok) throw await errorFromBody(res, "gemini");

  const json = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
    promptFeedback?: { blockReason?: string };
  };

  if (json?.promptFeedback?.blockReason) {
    throw new ProviderError("gemini", `Blocked: ${json.promptFeedback.blockReason}`);
  }

  const raw = json?.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("").trim();
  if (!raw) throw new ProviderError("gemini", "Empty response from model");
  return { content: parseRepurposedContent(raw), model };
}

export async function runOpenAi(text: string, language = "ar", tone = "balanced"): Promise<ProviderResult> {
  const apiKey = env("OPENAI_API_KEY");
  if (!apiKey) throw new ProviderError("openai", "OPENAI_API_KEY is not set");
  const model = env("OPENAI_MODEL") || "gpt-4o-mini";
  const raw = await callChat("openai", `${OPENAI_BASE_URL}/chat/completions`, apiKey, model, text, language, tone);
  return { content: parseRepurposedContent(raw), model };
}

/* ------------------------------------------------------------------ */
/* Free-form text (inline modification) — same models, no JSON schema  */
/* ------------------------------------------------------------------ */

async function callChatText(
  provider: ProviderName,
  url: string,
  apiKey: string,
  model: string,
  messages: { role: "system" | "user"; content: string }[],
  jsonMode: boolean,
): Promise<string> {
  const body: {
    model: string;
    messages: { role: "system" | "user"; content: string }[];
    temperature: number;
    max_tokens: number;
    response_format?: { type: "json_object" };
  } = {
    model,
    messages,
    temperature: 0.6,
    max_tokens: 1_500,
    ...(jsonMode ? { response_format: { type: "json_object" } } : {}),
  };

  const send = (payload: typeof body) =>
    request(provider, url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify(payload),
    });

  let res = await send(body);
  if (res.status === 400 && body.response_format) {
    const { response_format: _ignored, ...payload } = body;
    res = await send(payload).catch(() => res);
  }
  if (!res.ok) throw await errorFromBody(res, provider);

  const json = (await res.json()) as { choices?: { message?: { content?: string | null } }[] };
  const content = json?.choices?.[0]?.message?.content;
  if (!content) throw new ProviderError(provider, "Empty response from model");
  return content;
}

/** Run a free-form instruction on Groq (primary text provider). */
export async function runGroqText(
  messages: { role: "system" | "user"; content: string }[],
  jsonMode = false,
): Promise<{ raw: string; model: string }> {
  const apiKey = env("GROQ_API_KEY");
  if (!apiKey) throw new ProviderError("groq", "GROQ_API_KEY is not set");
  const model = env("GROQ_MODEL") || "llama-3.3-70b-versatile";
  const raw = await callChatText("groq", `${GROQ_BASE_URL}/chat/completions`, apiKey, model, messages, jsonMode);
  return { raw, model };
}

export async function runGeminiText(
  messages: { role: "system" | "user"; content: string }[],
  jsonMode = false,
): Promise<{ raw: string; model: string }> {
  const apiKey = env("GEMINI_API_KEY") || env("GOOGLE_API_KEY");
  if (!apiKey) throw new ProviderError("gemini", "GEMINI_API_KEY is not set");
  const model = env("GEMINI_MODEL") || "gemini-2.5-flash";
  const system = messages.find((m) => m.role === "system")?.content ?? "";
  const user = messages.filter((m) => m.role === "user").map((m) => m.content).join("\n\n");
  const url = `${GEMINI_BASE_URL}/models/${encodeURIComponent(model)}:generateContent`;

  const res = await request("gemini", url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: "user", parts: [{ text: user }] }],
      generationConfig: {
        temperature: 0.6,
        maxOutputTokens: 1_500,
        ...(jsonMode ? { responseMimeType: "application/json" } : {}),
      },
    }),
  });
  if (!res.ok) throw await errorFromBody(res, "gemini");

  const json = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
  const raw = json?.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("").trim();
  if (!raw) throw new ProviderError("gemini", "Empty response from model");
  return { raw, model };
}

export async function runOpenAiText(
  messages: { role: "system" | "user"; content: string }[],
  jsonMode = false,
): Promise<{ raw: string; model: string }> {
  const apiKey = env("OPENAI_API_KEY");
  if (!apiKey) throw new ProviderError("openai", "OPENAI_API_KEY is not set");
  const model = env("OPENAI_MODEL") || "gpt-4o-mini";
  const raw = await callChatText("openai", `${OPENAI_BASE_URL}/chat/completions`, apiKey, model, messages, jsonMode);
  return { raw, model };
}
