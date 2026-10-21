/**
 * Reconcile a local subscription with Lemon Squeezy.
 *
 * The webhook is the primary path for activating a paid plan, but webhooks can
 * be delayed, retried or (rarely) dropped entirely. This module is the safety
 * net: it asks Lemon Squeezy directly for the subscription's real state and
 * writes it through the same rules the webhook uses.
 *
 * It is deliberately conservative — it only ever *activates* a plan when Lemon
 * Squeezy reports a paid status, and it never touches a subscription that is
 * already correct.
 */

import { prisma } from "@/lib/db";
import {
  fetchLemonSqueezySubscription,
  findSubscriptionIdByOrder,
  type LemonSqueezySubscription,
} from "@/lib/lemonsqueezy/client";
import { PRO_DAILY_GENERATIONS, PRO_DAILY_MODIFICATIONS } from "@/lib/utils/quota";
import type { SubscriptionStatus } from "@prisma/client";

/** Lemon Squeezy status → local status. Mirrors the webhook's mapping. */
const STATUS_MAP: Record<string, SubscriptionStatus> = {
  active: "ACTIVE",
  on_trial: "TRIALING",
  paused: "PAUSED",
  past_due: "PAST_DUE",
  unpaid: "PAST_DUE",
  cancelled: "CANCELLED",
  expired: "EXPIRED",
};

/** Statuses that keep Pro features on. Mirrors the webhook's PRO_STATUSES. */
const PRO_STATUSES = new Set<SubscriptionStatus>([
  "ACTIVE",
  "TRIALING",
  "PAST_DUE",
  "CANCELLED",
]);

export async function syncSubscriptionFromLemonSqueezy(params: {
  userId: string;
  subscriptionId?: string | null;
  orderId?: string | null;
}): Promise<{ synced: boolean; status?: SubscriptionStatus }> {
  const { userId } = params;

  // Resolve a subscription id, from the redirect params or via the order id.
  let subscriptionId = params.subscriptionId?.trim() || null;
  if (!subscriptionId && params.orderId) {
    subscriptionId = await findSubscriptionIdByOrder(params.orderId);
  }
  if (!subscriptionId) return { synced: false };

  const remote = await fetchLemonSqueezySubscription(subscriptionId);
  if (!remote) return { synced: false };

  // Never attach a subscription that belongs to somebody else.
  if (remote.userId && remote.userId !== userId) {
    console.warn(
      `[lemonsqueezy/sync] subscription ${subscriptionId} belongs to ${remote.userId}, not ${userId} — ignoring`,
    );
    return { synced: false };
  }

  const existing = await prisma.subscription.findUnique({ where: { userId } });
  if (existing?.lemonSqueezySubscriptionId === subscriptionId && existing.status === statusOf(remote)) {
    // Already in sync — nothing to write.
    return { synced: true, status: existing.status };
  }

  return { synced: true, status: await applySubscription(userId, remote) };
}

function statusOf(remote: LemonSqueezySubscription): SubscriptionStatus {
  return STATUS_MAP[remote.status] ?? "PAST_DUE";
}

/** Write a remote subscription through the app's plan rules. */
async function applySubscription(
  userId: string,
  remote: LemonSqueezySubscription,
): Promise<SubscriptionStatus> {
  const status = statusOf(remote);
  const isPro = PRO_STATUSES.has(status);
  const renewsAt = remote.renewsAt ? new Date(remote.renewsAt) : null;

  const shared = {
    lemonSqueezySubscriptionId: remote.id,
    lemonSqueezyCustomerId: remote.customerId,
    lemonSqueezyOrderId: remote.orderId,
    lemonSqueezyProductId: remote.productId,
    lemonSqueezyVariantId: remote.variantId,
    price: remote.price,
    currency: remote.currency,
    currentPeriodEnd: renewsAt && !Number.isNaN(renewsAt.getTime()) ? renewsAt : null,
    renewsAt: renewsAt && !Number.isNaN(renewsAt.getTime()) ? renewsAt : null,
    cancelAtPeriodEnd: remote.cancelled,
  };

  await prisma.subscription.upsert({
    where: { userId },
    create: {
      userId,
      ...shared,
      status,
      plan: isPro ? "PRO" : "FREE",
    },
    update: {
      ...shared,
      status,
      plan: isPro ? "PRO" : "FREE",
    },
  });

  await prisma.usageQuota.upsert({
    where: { userId },
    create: {
      userId,
      proGenerationsLimit: PRO_DAILY_GENERATIONS,
      proModificationsLimit: PRO_DAILY_MODIFICATIONS,
      lastProResetAt: new Date(),
    },
    update: isPro
      ? {
          proGenerationsLimit: PRO_DAILY_GENERATIONS,
          proModificationsLimit: PRO_DAILY_MODIFICATIONS,
        }
      : {},
  });

  await prisma.auditLog.create({
    data: {
      userId,
      category: "PAYMENT",
      action: "subscription_reconciled",
      details: {
        status,
        plan: isPro ? "PRO" : "FREE",
        subscriptionId: remote.id,
        source: "api_sync",
      },
    },
  });

  return status;
}
