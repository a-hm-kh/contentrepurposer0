import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { CheckoutButton } from "@/components/billing/CheckoutButton";
import { CheckIcon, LogoMark } from "@/components/icons";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db";
import { fetchCustomerPortalUrl } from "@/lib/lemonsqueezy/client";
import { syncSubscriptionFromLemonSqueezy } from "@/lib/lemonsqueezy/sync";
import { resolveQuota } from "@/lib/utils/quota";

export const metadata: Metadata = {
  title: "Billing",
  description:
    "Manage your ContentRepurposer subscription — Pro is $15/month with 20 generations per day.",
};

export const dynamic = "force-dynamic";

const FREE_FEATURES = [
  "10 free generations, for life",
  "Every post format included",
  "Tone selection",
  "One-click copy on every result",
];

const PRO_FEATURES = [
  "20 generations per day (refreshed every 24h)",
  "20 inline edits per day",
  "7-day publishing plan with export",
  "Video-script support and title ideas",
  "Smart review on every result",
];

function formatDate(value: Date | null | undefined): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-US", { dateStyle: "long" }).format(value);
}

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string; subscription_id?: string; order_id?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");

  const params = await searchParams;

  /*
   * Self-healing activation.
   *
   * Lemon Squeezy returns the customer here straight after payment, appending
   * `order_id` / `subscription_id` to the redirect URL. The webhook normally
   * activates the plan within seconds, but webhooks can be delayed or dropped.
   * When that happens we confirm the purchase directly with the API so a paying
   * customer is never left on the free plan.
   */
  if (params.checkout === "success") {
    await syncSubscriptionFromLemonSqueezy({
      userId: session.user.id,
      subscriptionId: params.subscription_id ?? null,
      orderId: params.order_id ?? null,
    }).catch((err) => {
      console.warn("[billing] could not sync subscription from Lemon Squeezy:", err);
    });
  }

  const [subscription, quota] = await Promise.all([
    prisma.subscription.findUnique({ where: { userId: session.user.id } }),
    resolveQuota(),
  ]);

  const isPro = subscription?.plan === "PRO" && subscription?.status === "ACTIVE";

  // Self-service billing portal (update card / cancel). Fetched only for live
  // Pro customers, and only when we hold a subscription id to look it up with.
  const portalUrl =
    isPro && subscription?.lemonSqueezySubscriptionId
      ? await fetchCustomerPortalUrl(subscription.lemonSqueezySubscriptionId).catch(() => null)
      : null;

  return (
    <div className="min-h-dvh bg-neutral-50/50">
      <header className="sticky top-0 z-40 border-b border-neutral-200/70 bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-4xl items-center gap-4 px-6">
          <Link href="/" className="flex items-center gap-2.5 rounded-lg focus-visible:outline-none">
            <LogoMark className="h-7 w-7" />
            <span className="text-[15px] font-semibold tracking-tight text-neutral-950">
              ContentRepurposer
            </span>
          </Link>
          <Link href="/dashboard" className="btn btn-ghost btn-sm ml-auto">
            Back to studio
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-12">
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-950 sm:text-3xl">
          Billing &amp; plan
        </h1>
        <p className="mt-2 text-[15px] leading-7 text-neutral-500">
          Signed in as{" "}
          <span className="font-medium text-neutral-700">{session.user.email}</span>
        </p>

        {params.checkout === "success" && !isPro && (
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50/70 px-4 py-3.5 text-sm text-amber-900">
            <span className="mt-0.5">⏳</span>
            <p>
              Your payment was received. Subscription confirmation can take a few
              seconds — refresh this page shortly to see your new plan active.
            </p>
          </div>
        )}

        {quota?.plan === "admin" && (
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/70 px-4 py-3.5 text-sm text-emerald-900">
            <span className="mt-0.5">★</span>
            <p>
              You are signed in as an administrator — generations and edits are
              unlimited and never counted against a plan.
            </p>
          </div>
        )}

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <div className="surface flex flex-col p-8">
            <h2 className="text-lg font-semibold tracking-tight text-neutral-950">
              Free plan
            </h2>
            <p className="mt-2 text-3xl font-semibold text-neutral-950">$0</p>
            <p className="mt-1 text-[13px] text-neutral-500">
              One-time — never renews
            </p>
            <ul className="mt-6 flex-1 space-y-2.5 text-[14px] text-neutral-600">
              {FREE_FEATURES.map((feature) => (
                <li key={feature} className="flex gap-2">
                  <CheckIcon className="mt-1 h-4 w-4 shrink-0 text-emerald-600" />
                  {feature}
                </li>
              ))}
            </ul>
            {!isPro && quota?.plan !== "admin" && quota && (
              <p className="mt-6 rounded-xl bg-neutral-50 px-4 py-3 text-[13px] text-neutral-600">
                You have used {quota.used} of {quota.limit} free generations.
              </p>
            )}
            {!isPro && quota?.plan !== "admin" && (
              <p className="mt-3 text-xs font-medium text-neutral-500">
                Your current plan
              </p>
            )}
          </div>

          <div className="relative flex flex-col overflow-hidden rounded-2xl border border-neutral-900 bg-neutral-950 p-8 text-white shadow-[var(--shadow-raised)]">
            <span className="absolute left-6 top-6 rounded-full bg-white/10 px-3 py-1 text-[11px] font-medium text-white/80">
              {isPro ? "Active" : "Most popular"}
            </span>
            <h2 className="text-lg font-semibold tracking-tight">Pro plan</h2>
            <p className="mt-2 text-3xl font-semibold">
              $15<span className="text-base font-normal text-white/60">/month</span>
            </p>
            <p className="mt-1 text-[13px] text-white/60">
              {isPro
                ? `Renews on ${formatDate(subscription?.renewsAt ?? subscription?.currentPeriodEnd)}`
                : "Renews monthly — cancel anytime"}
            </p>
            <ul className="mt-6 flex-1 space-y-2.5 text-[14px] text-white/85">
              {PRO_FEATURES.map((feature) => (
                <li key={feature} className="flex gap-2">
                  <CheckIcon className="mt-1 h-4 w-4 shrink-0 text-emerald-400" />
                  {feature}
                </li>
              ))}
            </ul>

            <div className="mt-6">
              {isPro ? (
                portalUrl ? (
                  <a
                    href={portalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-on-dark btn-lg w-full"
                  >
                    Manage subscription
                  </a>
                ) : (
                  <p className="rounded-xl bg-white/10 px-4 py-3 text-center text-[13px] text-white/80">
                    Your subscription is active. Thanks for your support!
                  </p>
                )
              ) : quota?.plan === "admin" ? (
                <p className="rounded-xl bg-white/10 px-4 py-3 text-center text-[13px] text-white/80">
                  Not needed — admin accounts are unlimited.
                </p>
              ) : (
                <CheckoutButton />
              )}
            </div>

            {quota?.plan === "pro" && (
              <p className="mt-3 text-center text-xs text-white/60">
                Left today: {quota.remaining} generations ·{" "}
                {quota.modificationsRemaining} edits
              </p>
            )}
          </div>
        </div>

        <p className="mt-8 text-center text-xs text-neutral-400">
          Checkout is fully secure and encrypted through Lemon Squeezy. We never
          store your card details on our servers.
        </p>
      </main>
    </div>
  );
}
