/**
 * Brand voice helpers.
 *
 * A user's writing identity is stored one row per user (`BrandVoice`) and
 * injected into every generation so the output sounds like the person rather
 * than a generic model. Everything here is best-effort: if the lookup fails
 * for any reason, generation continues without a voice profile.
 */

import type { BrandVoiceProfile } from "@/lib/ai/prompts";
import { prisma } from "@/lib/db";

/** Max characters accepted per field — keeps the system prompt bounded. */
export const VOICE_FIELD_MAX = 600;

export interface StoredBrandVoice {
  about: string | null;
  audience: string | null;
  likedWords: string | null;
  bannedWords: string | null;
  samples: string | null;
  updatedAt: Date | null;
}

function clean(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim().slice(0, VOICE_FIELD_MAX);
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Loads the voice profile used to steer prompts. Returns `null` when the user
 * is anonymous or has not saved anything yet.
 */
export async function loadBrandVoice(userId: string | null | undefined): Promise<BrandVoiceProfile | null> {
  if (!userId) return null;

  try {
    const row = await prisma.brandVoice.findUnique({ where: { userId } });
    if (!row) return null;

    const profile: BrandVoiceProfile = {
      about: row.about,
      audience: row.audience,
      likedWords: row.likedWords,
      bannedWords: row.bannedWords,
    };

    const hasAny =
      Boolean(profile.about?.trim()) ||
      Boolean(profile.audience?.trim()) ||
      Boolean(profile.likedWords?.trim()) ||
      Boolean(profile.bannedWords?.trim());

    return hasAny ? profile : null;
  } catch (err) {
    console.error("[brand-voice] failed to load voice profile:", err);
    return null;
  }
}

/** Reads the full row (including samples) for the editor UI. */
export async function getBrandVoice(userId: string): Promise<StoredBrandVoice | null> {
  const row = await prisma.brandVoice.findUnique({ where: { userId } });
  if (!row) return null;
  return {
    about: row.about,
    audience: row.audience,
    likedWords: row.likedWords,
    bannedWords: row.bannedWords,
    samples: row.samples,
    updatedAt: row.updatedAt,
  };
}

export interface BrandVoiceInput {
  about?: unknown;
  audience?: unknown;
  likedWords?: unknown;
  bannedWords?: unknown;
  samples?: unknown;
}

/** Validates and stores a voice profile, creating the row on first save. */
export async function saveBrandVoice(userId: string, input: BrandVoiceInput): Promise<StoredBrandVoice> {
  const data = {
    about: clean(input.about),
    audience: clean(input.audience),
    likedWords: clean(input.likedWords),
    bannedWords: clean(input.bannedWords),
    samples: clean(input.samples),
  };

  const row = await prisma.brandVoice.upsert({
    where: { userId },
    create: { userId, ...data },
    update: data,
  });

  return {
    about: row.about,
    audience: row.audience,
    likedWords: row.likedWords,
    bannedWords: row.bannedWords,
    samples: row.samples,
    updatedAt: row.updatedAt,
  };
}
