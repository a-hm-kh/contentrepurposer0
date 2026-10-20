import { NextResponse } from "next/server";
import crypto from "node:crypto";

import { prisma } from "@/lib/db";
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
    meta?: { event_name?: string; custom_data?: { user_id?: string } };
    data?: { id?: string; attributes?: Record<string, unknown> };
  };

  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const eventName = event.meta?.event_name ?? "unknown";
  const userId = event.meta?.custom_data?.user_id;
  const attributes = event.data?.attributes ?? {};
  const subscriptionId = event.data?.id ?? null;

  try {
    if (userId && eventName.startsWith("subscription_")) {
      const status = STATUS_MAP[String(attributes.status ?? "")] ?? "PAST_DUE";
      const isPro = eventName !== "subscription_cancelled" && eventName !== "subscription_expired";

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
          canceledAt: status === "CANCELLED" ? new Date() : undefined,
          endedAt: status === "EXPIRED" ? new Date() : undefined,
        },
      });

      // Pro → ensure a fresh daily allowance. Cancelled/expired → return to free tier.
      await prisma.usageQuota.upsert({
        where: { userId },
        create: {
          userId,
          proGenerationsLimit: 20,
          proModificationsLimit: 20,
          lastProResetAt: new Date(),
        },
        update: isPro
          ? { proGenerationsLimit: 20, proModificationsLimit: 20, lastProResetAt: new Date() }
          : {},
      });

      await prisma.auditLog.create({
        data: {
          userId,
          category: "PAYMENT",
          action: eventName,
          details: {
            status,
            plan: isPro ? "PRO" : "FREE",
            subscriptionId,
            renewsAt: shared.renewsAt ? shared.renewsAt.toISOString() : null,
          },
        },
      });
    } else {
      await prisma.auditLog.create({
        data: {
          category: "PAYMENT",
          action: eventName,
          details: { subscriptionId, handled: false, reason: userId ? "non-subscription event" : "missing user_id" },
        },
      });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[webhooks/lemonsqueezy] handler failed:", error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
