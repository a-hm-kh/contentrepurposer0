export interface LemonSqueezyCheckoutParams {
  variantId: string;
  userId: string;
  email: string;
  name?: string;
  redirectUrl: string;
}

export async function createLemonSqueezyCheckout({
  variantId,
  userId,
  email,
  name,
  redirectUrl,
}: LemonSqueezyCheckoutParams) {
  const storeId = process.env.LEMONSQUEEZY_STORE_ID;
  const apiKey = process.env.LEMONSQUEEZY_API_KEY;

  if (!storeId || !apiKey) {
    throw new Error("LemonSqueezy is not configured");
  }

  const response = await fetch("https://api.lemonsqueezy.com/v1/checkouts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/vnd.api+json",
      Accept: "application/vnd.api+json",
    },
    body: JSON.stringify({
      data: {
        type: "checkouts",
        attributes: {
          checkout_options: {
            button_color: "#000000",
          },
          checkout_data: {
            custom: {
              user_id: userId,
            },
            email,
            name,
            redirect_url: redirectUrl,
          },
        },
        relationships: {
          store: {
            data: {
              type: "stores",
              id: storeId,
            },
          },
          variant: {
            data: {
              type: "variants",
              id: variantId,
            },
          },
        },
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create checkout: ${error}`);
  }

  const data = await response.json();
  return data.data.attributes.url;
}

export interface LemonSqueezySubscription {
  id: string;
  status: string;
  userId: string | null;
  variantId: string | null;
  customerId: string | null;
  orderId: string | null;
  productId: string | null;
  renewsAt: string | null;
  cancelled: boolean;
  price: number | null;
  currency: string;
}

/**
 * Fetch a subscription straight from Lemon Squeezy.
 *
 * Used as a self-healing fallback: if a customer returns from a successful
 * checkout before the webhook has been delivered (or if a webhook is ever
 * dropped), the billing page calls this and activates the plan itself instead
 * of leaving a paying customer locked out.
 */
export async function fetchLemonSqueezySubscription(
  subscriptionId: string,
): Promise<LemonSqueezySubscription | null> {
  const apiKey = process.env.LEMONSQUEEZY_API_KEY;
  if (!apiKey) return null;

  const response = await fetch(
    `https://api.lemonsqueezy.com/v1/subscriptions/${encodeURIComponent(subscriptionId)}`,
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/vnd.api+json",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    },
  );

  if (!response.ok) return null;

  const body = (await response.json()) as {
    data?: {
      id?: string;
      attributes?: Record<string, unknown>;
    };
  };

  const attributes = body.data?.attributes;
  if (!attributes) return null;

  const custom = attributes.custom_data as { user_id?: string } | undefined;

  return {
    id: String(body.data?.id ?? subscriptionId),
    status: String(attributes.status ?? ""),
    userId: custom?.user_id ?? null,
    variantId: attributes.variant_id !== undefined ? String(attributes.variant_id) : null,
    customerId: attributes.customer_id !== undefined ? String(attributes.customer_id) : null,
    orderId: attributes.order_id !== undefined ? String(attributes.order_id) : null,
    productId: attributes.product_id !== undefined ? String(attributes.product_id) : null,
    renewsAt: typeof attributes.renews_at === "string" ? attributes.renews_at : null,
    cancelled: Boolean(attributes.cancelled),
    price:
      typeof attributes.unit_price === "number"
        ? attributes.unit_price
        : typeof attributes.unit_price === "string"
          ? Number(attributes.unit_price)
          : null,
    currency: typeof attributes.currency === "string" ? attributes.currency : "USD",
  };
}

/**
 * Most recent subscription id for a customer, looked up by their order id.
 *
 * Lemon Squeezy's checkout redirect only carries the order, so this bridges
 * the gap between "customer paid" and "webhook stored the subscription id".
 */
export async function findSubscriptionIdByOrder(
  orderId: string,
): Promise<string | null> {
  const apiKey = process.env.LEMONSQUEEZY_API_KEY;
  if (!apiKey) return null;

  const response = await fetch(
    `https://api.lemonsqueezy.com/v1/subscriptions?filter[order_id]=${encodeURIComponent(orderId)}`,
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/vnd.api+json",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    },
  );

  if (!response.ok) return null;

  const body = (await response.json()) as { data?: { id?: string }[] };
  const first = body.data?.[0]?.id;
  return first ? String(first) : null;
}

/**
 * Signed URL for the customer's self-service billing portal.
 *
 * Lets a Pro customer update their card or cancel without emailing support.
 * Returns null when the API key or subscription id is missing, so the UI can
 * fall back to hiding the button rather than showing a dead link.
 */
export async function fetchCustomerPortalUrl(
  subscriptionId: string,
): Promise<string | null> {
  const apiKey = process.env.LEMONSQUEEZY_API_KEY;
  if (!apiKey) return null;

  const response = await fetch(
    `https://api.lemonsqueezy.com/v1/subscriptions/${encodeURIComponent(subscriptionId)}`,
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/vnd.api+json",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    },
  );

  if (!response.ok) return null;

  const body = (await response.json()) as {
    data?: { attributes?: { urls?: { customer_portal?: string } } };
  };

  const url = body.data?.attributes?.urls?.customer_portal;
  return typeof url === "string" && url.length > 0 ? url : null;
}
