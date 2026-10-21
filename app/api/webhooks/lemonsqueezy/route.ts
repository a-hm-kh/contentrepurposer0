import { NextResponse } from "next/server";
import crypto from "node:crypto";

import { prisma } from "@/lib/db";
import { PRO_DAILY_GENERATIONS, PRO_DAILY_MODIFICATIONS } from "@/lib/utils/quota";
import type { SubscriptionStatus } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Lemon Squeezy webhook.
 *
 * Security:
 *  - Raw body is read as text and verified against the `X-Signature` header with
 *    a timing-safe HMAC-SHA256 compare, so a forged payload is rejected.
 *  - Every relevant event is written to the audit log for the admin dashboard.
 *  - Only the fields we need are persisted; card data never reaches this server.
 */

const STATUS_MAP: Record<string, SubscriptionStatus> = {
  active: "ACTIVE",
  on_trial: "TRIALING",
  paused: "PAUSED",
  past_due: "PAST_DUE",
  unpaid: "PAST_DUE",
  cancelled: "CANCELLED",
  expired: "EXPIRED",
};

/**
 * Statuses that keep Pro features switched on.
 *
 * IMPORTANT: this is derived from the SUBSCRIPTION STATUS, not the event name.
 * Lemon Squeezy emits `subscription_updated` for *every* change — including a
 * customer cancelling. Reading only the event name would keep a cancelled
 * customer on Pro forever, so the status is the single source of truth.
 *
 * `CANCELLED` still grants Pro until the paid period actually ends (access
 * runs to `renews_at`), which is what the customer paid for; the subscription
 * flips to `EXPIRED` when Lemon Squeezy ends it.
 */
const PRO_STATUSES = new Set<SubscriptionStatus>([
  "ACTIVE",
  "TRIALING",
  "PAST_DUE",
  "CANCELLED",
]);

function isProStatus(status: SubscriptionStatus): boolean {
  return PRO_STATUSES.has(status);
}

function verifySignature(rawBody: string, signature: string, secret: string): boolean {
  const digest = crypto.createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");
  const a = Buffer.from(digest, "utf8");
  const b = Buffer.from(signature, "utf8");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function toDate(value: unknown): Date | null {
  if (typeof value !== "string" && typeof value !== "number") return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function toNumber(value: unknown): number | null {
  const parsed = typeof value === "string" ? Number(value) : value;
  return typeof parsed === "number" && Number.isFinite(parsed) ? parsed : null;
}

export async function POST(req: Request) {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;

  if (!secret) {
    console.error("[webhooks/lemonsqueezy] LEMONSQUEEZY_WEBHOOK_SECRET is not set");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  const rawBody = await req.text();
  const signature = req.headers.get("x-signature") ?? "";

  if (!signature || !verifySignature(rawBody, signature, secret)) {
    console.warn("[webhooks/lemonsqueezy] rejected a request with an invalid signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: {
    meta?: {
      event_name?: string;
      event_id?: string;
      test_mode?: boolean;
      custom_data?: { user_id?: string };
    };
    data?: { id?: string; attributes?: Record<string, unknown> };
  };

  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const eventName = event.meta?.event_name ?? "unknown";
  const eventId = event.meta?.event_id ?? null;
  const testMode = Boolean(event.meta?.test_mode);
  const userId = event.meta?.custom_data?.user_id;
  const attributes = event.data?.attributes ?? {};
  const subscriptionId = event.data?.id ?? null;

  /*
   * Idempotency.
   *
   * Lemon Squeezy guarantees at-least-once delivery and retries on any non-2xx,
   * so the same event can arrive more than once. Re-processing a
   * `subscription_created` after a `subscription_cancelled` would silently
   * re-grant Pro, so each event id is recorded once and duplicates are a no-op.
   */
  if (eventId) {
    try {
      await prisma.webhookEvent.create({
        data: {
          eventId,
          eventName,
          testMode,
          payload: { subscriptionId },
        },
      });
    } catch (dedupeErr) {
      const message = dedupeErr instanceof Error ? dedupeErr.message : String(dedupeErr);
      if (message.includes("Unique constraint") || message.includes("P2002")) {
        console.log(`[webhooks/lemonsqueezy] duplicate event ${eventId} ignored`);
        return NextResponse.json({ received: true, duplicate: true });
      }
      // A failure to record the id must not block a legitimate payment —
      // log it and continue so the customer still gets access.
      console.warn("[webhooks/lemonsqueezy] could not record event id:", message);
    }
  }

  try {
    // Only subscription lifecycle events touch billing state. Checkouts,
    // orders and refunds are recorded for the audit trail but do not by
    // themselves grant or revoke access.
    if (eventName.startsWith("subscription_") && subscriptionId) {
      const status = STATUS_MAP[String(attributes.status ?? "")] ?? "PAST_DUE";
      const isPro = isProStatus(status);

      /*
       * Resolve which user this subscription belongs to.
       *
       * `custom_data.user_id` is the happy path (it is stamped on the checkout
       * we created). Webhooks Lemon Squeezy sends outside that checkout (e.g. a
       * subscription created by hand in their dashboard) carry no custom data,
       * so fall back to the stored subscription id, and finally to the
       * customer's email.
       */
      const resolvedUserId = await resolveUserId({
        userId,
        subscriptionId,
        attributes,
      });

      if (!resolvedUserId) {
        await prisma.auditLog.create({
          data: {
            userId: null,
            category: "PAYMENT",
            action: eventName,
            details: { status, subscriptionId, handled: false, reason: "could not resolve user" },
          },
        });
        console.warn(`[webhooks/lemonsqueezy] no user for subscription ${subscriptionId} (${eventName})`);
        return NextResponse.json({ received: true, matched: false });
      }

      const shared = {
        lemonSqueezySubscriptionId: subscriptionId,
        lemonSqueezyCustomerId:
          attributes.customer_id !== undefined ? String(attributes.customer_id) : null,
        lemonSqueezyOrderId:
          attributes.order_id !== undefined ? String(attributes.order_id) : null,
        lemonSqueezyProductId:
          attributes.product_id !== undefined ? String(attributes.product_id) : null,
        lemonSqueezyVariantId:
          attributes.variant_id !== undefined ? String(attributes.variant_id) : null,
        price: toNumber(attributes.unit_price),
        currency: typeof attributes.currency === "string" ? attributes.currency : "USD",
        currentPeriodStart: toDate(attributes.created_at),
        currentPeriodEnd: toDate(attributes.renews_at),
        renewsAt: toDate(attributes.renews_at),
        cancelAtPeriodEnd: Boolean(attributes.cancelled),
      };

      await prisma.subscription.upsert({
        where: { userId: resolvedUserId },
        create: {
          userId: resolvedUserId,
          ...shared,
          status,
          plan: isPro ? "PRO" : "FREE",
        },
        update: {
          ...shared,
          status,
          plan: isPro ? "PRO" : "FREE",
          canceledAt: status === "CANCELLED" ? new Date() : undefined,
          endedAt: status === "EXPIRED" ? new Date() : undefined,
        },
      });

      /*
       * Pro → ensure a fresh daily allowance (only when the subscription first
       * becomes active, so a renewal event doesn't hand out a second full day).
       * Cancelled/expired → back to the free lifetime allowance.
       */
      await prisma.usageQuota.upsert({
        where: { userId: resolvedUserId },
        create: {
          userId: resolvedUserId,
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
          userId: resolvedUserId,
          category: "PAYMENT",
          action: eventName,
          details: {
            status,
            plan: isPro ? "PRO" : "FREE",
            subscriptionId,
            testMode,
            renewsAt: shared.renewsAt ? shared.renewsAt.toISOString() : null,
          },
        },
      });
    } else {
      // Non-subscription events (checkout, order, refund…) are recorded for the
      // audit trail only — they must never grant access on their own.
      await prisma.auditLog.create({
        data: {
          category: "PAYMENT",
          action: eventName,
          details: { subscriptionId, handled: false, reason: "non-subscription event" },
        },
      });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[webhooks/lemonsqueezy] handler failed:", error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}

/**
 * Work out which local user a subscription event belongs to.
 *
 * Order of trust:
 *  1. `custom_data.user_id` — stamped on the checkout we created. Exact.
 *  2. The subscription id we already stored — for events we did not originate.
 *  3. The customer email — last resort when neither is available.
 */
async function resolveUserId(params: {
  userId?: string;
  subscriptionId: string | null;
  attributes: Record<string, unknown>;
}): Promise<string | null> {
  const { userId, subscriptionId, attributes } = params;

  if (userId) {
    const direct = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (direct) return direct.id;
    console.warn(`[webhooks/lemonsqueezy] custom user_id ${userId} does not exist`);
  }

  if (subscriptionId) {
    const known = await prisma.subscription.findUnique({
      where: { lemonSqueezySubscriptionId: subscriptionId },
      select: { userId: true },
    });
    if (known) return known.userId;
  }

  const email =
    typeof attributes.user_email === "string"
      ? attributes.user_email
      : typeof attributes.customer_email === "string"
        ? attributes.customer_email
        : null;

  if (email) {
    const byEmail = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true },
    });
    if (byEmail) return byEmail.id;
  }

  return null;
}
