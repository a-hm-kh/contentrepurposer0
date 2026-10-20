import { NextResponse } from "next/server";

import { config } from "@/lib/config";
import { checkRateLimit, clientKeyFrom } from "@/lib/rate-limit";
import { addSubscriber } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function fail(error: string, status = 400) {
  return NextResponse.json({ ok: false, error }, { status });
}

export async function POST(req: Request) {
  // 1. Rate limit (max 5 subscriptions per IP per minute) ---------------
  const rateLimit = checkRateLimit(`sub:${clientKeyFrom(req.headers)}`);
  if (!rateLimit.ok) {
    return NextResponse.json(
      { ok: false, error: "Too many attempts. Please wait a minute." },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } },
    );
  }

  // 2. Parse + validate ---------------------------------------------------
  let body: { email?: unknown; source?: unknown };
  try {
    body = await req.json();
  } catch {
    return fail("We couldn't read that request.", 400);
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";

  if (!email || email.length > 254 || !EMAIL_REGEX.test(email)) {
    return fail("Please enter a valid email address.");
  }

  // 3. Store (deduped) ----------------------------------------------------
  const isNew = await addSubscriber(email, typeof body.source === "string" ? body.source : "site");

  // 4. Notify — optional webhook / Telegram bot (wired up later) ----------
  if (isNew) void notify(email).catch(() => undefined);

  return NextResponse.json({
    ok: true,
    isNew,
    message: isNew
      ? "You're on the list — we'll email you about updates and new features."
      : "You're already on the list — nothing else to do!",
  });
}

/**
 * Forward new subscribers to any external system.
 *
 * - `NEWSLETTER_WEBHOOK_URL` → POST { event, email, subscribedAt }
 *   (Zapier / Make / n8n / Buttondown / ConvertKit — anything with a webhook)
 * - `TELEGRAM_BOT_TOKEN` + `TELEGRAM_CHAT_ID` → pings your bot directly.
 *   This is the hook to build the Telegram notify-bot on top of later.
 */
async function notify(email: string): Promise<void> {
  const subscribedAt = new Date().toISOString();

  const webhookUrl = process.env.NEWSLETTER_WEBHOOK_URL?.trim();
  if (webhookUrl) {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event: "subscriber.created", email, subscribedAt }),
      signal: AbortSignal.timeout(5_000),
    }).catch(() => undefined);
  }

  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const chatId = process.env.TELEGRAM_CHAT_ID?.trim();

  if (token && chatId) {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: `📬 New ContentRepurposer subscriber\n${email}\n${subscribedAt}`,
      }),
      signal: AbortSignal.timeout(5_000),
    }).catch(() => undefined);
  }
}

export function GET() {
  return NextResponse.json(
    { ok: false, error: "Use POST with a JSON body: { \"email\": string }" },
    { status: 405, headers: { Allow: "POST" } },
  );
}
