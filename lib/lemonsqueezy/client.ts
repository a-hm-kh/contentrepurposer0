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
