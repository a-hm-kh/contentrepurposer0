/**
 * Quota engine (single source of truth).
 *
 * Two tiers, one API:
 *  - FREE   → 10 generations, lifetime, never renews.
 *  - PRO    → 20 generations + 20 modifications per rolling 24h window.
 *
 * Quota is tracked in Postgres (`UsageQuota`) for BOTH signed-in users
 * (keyed by `userId`) and anonymous visitors (keyed by the `cr_uid` cookie).
 * Anonymous usage is migrated onto the account on first Google sign-in, so a
 * visitor can never reset their free allowance by clearing cookies vs signing in.
 */

import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db";
import { config } from "@/lib/config";

export const FREE_GENERATIONS = config.freeGenerations;
export const PRO_DAILY_GENERATIONS = 20;
export const PRO_DAILY_MODIFICATIONS = 20;
const RESET_WINDOW_MS = 24 * 60 * 60 * 1000;

export type PlanKind = "free" | "pro";

export interface QuotaSnapshot {
  /** Who this snapshot belongs to. */
  scope: "user" | "anonymous";
  plan: PlanKind;
  /** Generations consumed (lifetime for free, today for pro). */
  used: number;
  limit: number;
  remaining: number;
  /** `true` when the free package is exhausted or the Pro daily cap is hit. */
  exhausted: boolean;
  canGenerate: boolean;
  canModify: boolean;
  modificationsUsed: number;
  modificationsLimit: number;
  modificationsRemaining: number;
  /** ISO timestamp of the next Pro refresh, when applicable. */
  resetsAt: string | null;
}

function shape(params: {
  scope: "user" | "anonymous";
  plan: PlanKind;
  used: number;
  limit: number;
  modificationsUsed: number;
  modificationsLimit: number;
  resetsAt?: Date | null;
}): QuotaSnapshot {
  const used = Math.max(0, params.used);
  const limit = Math.max(0, params.limit);
  const remaining = Math.max(0, limit - used);
  const modificationsUsed = Math.max(0, params.modificationsUsed);
  const modificationsLimit = Math.max(0, params.modificationsLimit);
  const modificationsRemaining = Math.max(0, modificationsLimit - modificationsUsed);

  return {
    scope: params.scope,
    plan: params.plan,
    used,
    limit,
    remaining,
    exhausted: remaining <= 0,
    canGenerate: remaining > 0,
    canModify: params.plan === "pro" ? modificationsRemaining > 0 : remaining > 0,
    modificationsUsed,
    modificationsLimit,
    modificationsRemaining,
    resetsAt: params.resetsAt ? params.resetsAt.toISOString() : null,
  };
}

/* ------------------------------------------------------------------ */
/* Pro rolling-window reset                                            */
/* ------------------------------------------------------------------ */

/**
 * Pro quotas refresh on a rolling 24h window anchored at `lastProResetAt`.
 * Returns the (possibly refreshed) quota row.
 */
async function applyProReset(userId: string) {
  const quota = await prisma.usageQuota.findUnique({ where: { userId } });
  if (!quota) return null;

  const elapsed = Date.now() - quota.lastProResetAt.getTime();
  if (elapsed < RESET_WINDOW_MS) return quota;

  return prisma.usageQuota.update({
    where: { userId },
    data: {
      proGenerationsUsed: 0,
      proModificationsUsed: 0,
      lastProResetAt: new Date(),
    },
  });
}

async function isProUser(userId: string): Promise<boolean> {
  const subscription = await prisma.subscription.findUnique({ where: { userId } });
  return subscription?.plan === "PRO" && subscription.status === "ACTIVE";
}

/* ------------------------------------------------------------------ */
/* Anonymous visitors                                                  */
/* ------------------------------------------------------------------ */

async function ensureAnonymousQuota(anonymousId: string) {
  const existing = await prisma.usageQuota.findUnique({ where: { anonymousId } });
  if (existing) return existing;

  return prisma.usageQuota.create({
    data: {
      id: `anon_${anonymousId}`,
      anonymousId,
      freeGenerationsLimit: FREE_GENERATIONS,
    },
  });
}

/* ------------------------------------------------------------------ */
/* Public API                                                          */
/* ------------------------------------------------------------------ */

/** Snapshot for the current request: signed-in user, else anonymous cookie id. */
export async function resolveQuota(anonymousId?: string | null): Promise<QuotaSnapshot | null> {
  const session = await auth();

  if (session?.user?.id) {
    const userId = session.user.id;
    const pro = await isProUser(userId);

    if (pro) {
      const quota =
        (await applyProReset(userId)) ??
        (await prisma.usageQuota.upsert({
          where: { userId },
          create: { userId, lastProResetAt: new Date() },
          update: {},
        }));

      return shape({
        scope: "user",
        plan: "pro",
        used: quota.proGenerationsUsed,
        limit: quota.proGenerationsLimit,
        modificationsUsed: quota.proModificationsUsed,
        modificationsLimit: quota.proModificationsLimit,
        resetsAt: new Date(quota.lastProResetAt.getTime() + RESET_WINDOW_MS),
      });
    }

    const quota = await prisma.usageQuota.upsert({
      where: { userId },
      create: { userId, freeGenerationsLimit: FREE_GENERATIONS },
      update: {},
    });

    return shape({
      scope: "user",
      plan: "free",
      used: quota.freeGenerationsUsed,
      limit: quota.freeGenerationsLimit,
      modificationsUsed: 0,
      modificationsLimit: 0,
    });
  }

  if (!anonymousId) return null;

  const quota = await ensureAnonymousQuota(anonymousId);
  return shape({
    scope: "anonymous",
    plan: "free",
    used: quota.freeGenerationsUsed,
    limit: quota.freeGenerationsLimit,
    modificationsUsed: 0,
    modificationsLimit: 0,
  });
}

/** Atomically consume one generation. Throws `QuotaExceededError` when spent. */
export async function consumeGeneration(anonymousId?: string | null) {
  const session = await auth();

  if (session?.user?.id) {
    const userId = session.user.id;
    const pro = await isProUser(userId);

    if (pro) {
      const quota = await applyProReset(userId);
      if (quota && quota.proGenerationsUsed >= quota.proGenerationsLimit) {
        throw new QuotaExceededError("pro_daily_generations");
      }
      const updated = await prisma.usageQuota.update({
        where: { userId },
        data: { proGenerationsUsed: { increment: 1 } },
      });
      return shape({
        scope: "user",
        plan: "pro",
        used: updated.proGenerationsUsed,
        limit: updated.proGenerationsLimit,
        modificationsUsed: updated.proModificationsUsed,
        modificationsLimit: updated.proModificationsLimit,
        resetsAt: new Date(updated.lastProResetAt.getTime() + RESET_WINDOW_MS),
      });
    }

    const existing = await prisma.usageQuota.upsert({
      where: { userId },
      create: { userId, freeGenerationsLimit: FREE_GENERATIONS },
      update: {},
    });
    if (existing.freeGenerationsUsed >= existing.freeGenerationsLimit) {
      throw new QuotaExceededError("free_lifetime_generations");
    }
    const updated = await prisma.usageQuota.update({
      where: { userId },
      data: { freeGenerationsUsed: { increment: 1 } },
    });
    return shape({
      scope: "user",
      plan: "free",
      used: updated.freeGenerationsUsed,
      limit: updated.freeGenerationsLimit,
      modificationsUsed: 0,
      modificationsLimit: 0,
    });
  }

  if (!anonymousId) throw new QuotaExceededError("missing_identity");

  const existing = await ensureAnonymousQuota(anonymousId);
  if (existing.freeGenerationsUsed >= existing.freeGenerationsLimit) {
    throw new QuotaExceededError("free_lifetime_generations");
  }
  const updated = await prisma.usageQuota.update({
    where: { anonymousId },
    data: { freeGenerationsUsed: { increment: 1 } },
  });
  return shape({
    scope: "anonymous",
    plan: "free",
    used: updated.freeGenerationsUsed,
    limit: updated.freeGenerationsLimit,
    modificationsUsed: 0,
    modificationsLimit: 0,
  });
}

/** Consume one inline modification. Free users spend a generation; Pro uses its daily pool. */
export async function consumeModification(anonymousId?: string | null) {
  const session = await auth();

  if (session?.user?.id) {
    const userId = session.user.id;
    const pro = await isProUser(userId);

    if (pro) {
      const quota = await applyProReset(userId);
      if (!quota || quota.proModificationsUsed >= quota.proModificationsLimit) {
        throw new QuotaExceededError("pro_daily_modifications");
      }
      const updated = await prisma.usageQuota.update({
        where: { userId },
        data: { proModificationsUsed: { increment: 1 } },
      });
      return shape({
        scope: "user",
        plan: "pro",
        used: updated.proGenerationsUsed,
        limit: updated.proGenerationsLimit,
        modificationsUsed: updated.proModificationsUsed,
        modificationsLimit: updated.proModificationsLimit,
        resetsAt: new Date(updated.lastProResetAt.getTime() + RESET_WINDOW_MS),
      });
    }
  }

  // Free tier: a modification costs one generation from the lifetime pool.
  return consumeGeneration(anonymousId);
}

/**
 * Merge an anonymous visitor's free usage onto their account the first time
 * they sign in, so signing in cannot be used to farm extra free generations.
 * The anonymous allowance is preserved as "already used".
 */
export async function mergeAnonymousUsage(userId: string, anonymousId: string) {
  const anon = await prisma.usageQuota.findUnique({ where: { anonymousId } });
  if (!anon) return;

  const user = await prisma.usageQuota.upsert({
    where: { userId },
    create: { userId, freeGenerationsLimit: FREE_GENERATIONS },
    update: {},
  });

  const merged = Math.min(
    user.freeGenerationsLimit,
    user.freeGenerationsUsed + anon.freeGenerationsUsed,
  );

  await prisma.$transaction([
    prisma.usageQuota.update({ where: { userId }, data: { freeGenerationsUsed: merged } }),
    prisma.usageQuota.update({ where: { anonymousId }, data: { freeGenerationsUsed: anon.freeGenerationsLimit } }),
  ]);
}

export class QuotaExceededError extends Error {
  constructor(
    readonly reason:
      | "free_lifetime_generations"
      | "pro_daily_generations"
      | "pro_daily_modifications"
      | "missing_identity",
  ) {
    super("Quota exceeded");
    this.name = "QuotaExceededError";
  }
}
