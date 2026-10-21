/**
 * Lightweight language detection used only for record-keeping.
 *
 * The generation pipeline never *forces* a language: the model is instructed
 * to reply in the language of the source text. This helper just tags the
 * request (for the admin record and analytics) with a coarse language code.
 *
 * It is intentionally script-based and cheap — no extra API call — so it can
 * run on every request without adding latency.
 */

const SCRIPT_TESTS: { code: string; test: RegExp }[] = [
  { code: "ar", test: /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/ },
  { code: "he", test: /[\u0590-\u05FF]/ },
  { code: "ru", test: /[\u0400-\u04FF]/ },
  { code: "el", test: /[\u0370-\u03FF]/ },
  { code: "hi", test: /[\u0900-\u097F]/ },
  { code: "ja", test: /[\u3040-\u30FF]/ },
  { code: "ko", test: /[\uAC00-\uD7AF]/ },
  { code: "zh", test: /[\u4E00-\u9FFF]/ },
  { code: "th", test: /[\u0E00-\u0E7F]/ },
];

/** Latin-script language hints, checked only when the text is Latin-heavy. */
const LATIN_HINTS: { code: string; words: RegExp }[] = [
  { code: "es", words: /\b(el|la|los|las|una|que|para|con|por|como|pero|más|está|este|esta|muy)\b/gi },
  { code: "fr", words: /\b(le|la|les|une|des|que|pour|avec|dans|est|pas|plus|cette|mais|vous)\b/gi },
  { code: "de", words: /\b(der|die|das|und|eine|nicht|mit|für|ist|auch|dass|werden|sich)\b/gi },
  { code: "pt", words: /\b(o|a|os|as|uma|que|para|com|por|como|mas|muito|não|este)\b/gi },
  { code: "tr", words: /\b(ve|bir|bu|için|ile|olarak|daha|çok|ama|değil|var)\b/gi },
  { code: "it", words: /\b(il|lo|la|che|per|con|come|ma|più|questo|una|non)\b/gi },
];

/**
 * Returns a best-effort ISO 639-1 code for the dominant language of `text`.
 * Falls back to `"en"` when nothing matches, which matches the site default.
 */
export function detectLanguage(text: string): string {
  const sample = (text ?? "").slice(0, 4000);
  if (!sample.trim()) return "en";

  const letters = sample.replace(/[^\p{L}]/gu, "");
  if (!letters) return "en";

  for (const { code, test } of SCRIPT_TESTS) {
    const matches = letters.match(new RegExp(test.source, "gu"));
    if (matches && matches.length / letters.length > 0.2) return code;
  }

  // Latin script — score the hint words and pick the strongest.
  let best = { code: "en", score: 0 };
  for (const { code, words } of LATIN_HINTS) {
    const matches = sample.match(words);
    const score = matches?.length ?? 0;
    if (score > best.score) best = { code, score };
  }

  return best.code;
}
