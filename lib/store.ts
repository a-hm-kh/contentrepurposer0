/**
 * Visitor identity + newsletter storage.
 *
 * Usage/quota now lives in Postgres (`lib/utils/quota.ts`); this module keeps
 * only the anonymous cookie helpers and the newsletter list, which is a plain
 * append-only log and does not need a relational store.
 */

import { promises as fs } from "node:fs";
import { randomUUID } from "node:crypto";
import path from "node:path";

const DATA_DIR = path.join(process.cwd(), "data");
const SUBSCRIBERS_FILE = path.join(DATA_DIR, "subscribers.json");

/** Anonymous visitor id — no account, no email, just a cookie. */
export const ANONYMOUS_UID_COOKIE = "cr_uid";

export interface Subscriber {
  email: string;
  subscribedAt: string;
  source: string;
}

/* ------------------------------------------------------------------ */
/* anonymous visitor id (cookie)                                       */
/* ------------------------------------------------------------------ */

export function getUid(req: Request): string | undefined {
  const header = req.headers.get("cookie") ?? "";

  for (const part of header.split(";")) {
    const [rawKey, ...rest] = part.trim().split("=");
    if (rawKey !== ANONYMOUS_UID_COOKIE) continue;

    const value = rest.join("=").trim();
    return /^[A-Za-z0-9-]{8,64}$/.test(value) ? value : undefined;
  }

  return undefined;
}

export function newUid(): string {
  return randomUUID();
}

/** Cookie options for the anonymous visitor id (1 year, HttpOnly). */
export function uidCookieOptions(req: Request) {
  const isHttps = req.url.startsWith("https:");

  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    secure: isHttps,
  };
}

/* ------------------------------------------------------------------ */
/* newsletter subscribers                                              */
/* ------------------------------------------------------------------ */

async function readSubscribers(): Promise<Subscriber[]> {
  try {
    return JSON.parse(await fs.readFile(SUBSCRIBERS_FILE, "utf8")) as Subscriber[];
  } catch {
    return [];
  }
}

export async function listSubscribers(): Promise<Subscriber[]> {
  return readSubscribers();
}

/** Case-insensitive dedupe. Returns `true` when the email was new. */
export async function addSubscriber(email: string, source: string): Promise<boolean> {
  const subscribers = await readSubscribers();
  const normalized = email.trim().toLowerCase();

  if (subscribers.some((entry) => entry.email.toLowerCase() === normalized)) {
    return false;
  }

  subscribers.push({ email: normalized, subscribedAt: new Date().toISOString(), source });

  await fs.mkdir(DATA_DIR, { recursive: true });
  const tmp = `${SUBSCRIBERS_FILE}.${process.pid}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(subscribers, null, 2), "utf8");
  await fs.rename(tmp, SUBSCRIBERS_FILE);

  return true;
}
