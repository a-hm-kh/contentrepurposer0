/**
 * Lightweight server-side storage for the MVP.
 *
 * Uses plain JSON files under `/data` — zero external services, works out of
 * the box. Because serverless platforms keep ephemeral disk, move these two
 * functions to Upstash Redis / Vercel KV / Postgres when you go to production
 * (the signatures below are designed to stay identical).
 */

import { promises as fs } from "node:fs";
import { randomUUID } from "node:crypto";
import path from "node:path";

import { config } from "@/lib/config";

const DATA_DIR = path.join(process.cwd(), "data");
const USAGE_FILE = path.join(DATA_DIR, "usage.json");
const SUBSCRIBERS_FILE = path.join(DATA_DIR, "subscribers.json");

/** Anonymous visitor id — no account, no email, just a cookie. */
export const ANONYMOUS_UID_COOKIE = "cr_uid";

export interface UsageRecord {
  used: number;
  firstUsedAt: string;
  updatedAt: string;
}

export interface Subscriber {
  email: string;
  subscribedAt: string;
  source: string;
}

/* ------------------------------------------------------------------ */
/* helpers                                                             */
/* ------------------------------------------------------------------ */

async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await fs.readFile(file, "utf8")) as T;
  } catch {
    return fallback;
  }
}

async function writeJson(file: string, data: unknown): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const tmp = `${file}.${process.pid}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(data, null, 2), "utf8");
  await fs.rename(tmp, file);
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
/* usage quota (lifetime free package)                                 */
/* ------------------------------------------------------------------ */

export interface UsageSnapshot {
  used: number;
  limit: number;
  remaining: number;
  /** `true` once the free package is exhausted (it never renews). */
  exhausted: boolean;
}

export async function getUsage(uid: string): Promise<UsageSnapshot> {
  const map = await readJson<Record<string, UsageRecord>>(USAGE_FILE, {});
  const record = map[uid];
  const used = record?.used ?? 0;
  const limit = config.freeGenerations;

  return {
    used,
    limit,
    remaining: Math.max(0, limit - used),
    exhausted: used >= limit,
  };
}

/** Lifetime counter — the free package is never reset or renewed. */
export async function recordUsage(uid: string): Promise<UsageSnapshot> {
  const map = await readJson<Record<string, UsageRecord>>(USAGE_FILE, {});
  const now = new Date().toISOString();

  map[uid] = {
    used: (map[uid]?.used ?? 0) + 1,
    firstUsedAt: map[uid]?.firstUsedAt ?? now,
    updatedAt: now,
  };

  await writeJson(USAGE_FILE, map);
  return getUsage(uid);
}

/* ------------------------------------------------------------------ */
/* newsletter subscribers                                              */
/* ------------------------------------------------------------------ */

export async function listSubscribers(): Promise<Subscriber[]> {
  return readJson<Subscriber[]>(SUBSCRIBERS_FILE, []);
}

/** Case-insensitive dedupe. Returns `true` when the email was new. */
export async function addSubscriber(email: string, source: string): Promise<boolean> {
  const subscribers = await listSubscribers();
  const normalized = email.trim().toLowerCase();

  if (subscribers.some((entry) => entry.email.toLowerCase() === normalized)) {
    return false;
  }

  subscribers.push({ email: normalized, subscribedAt: new Date().toISOString(), source });
  await writeJson(SUBSCRIBERS_FILE, subscribers);
  return true;
}
