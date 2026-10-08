import "server-only";
import type { StripeSubscription } from "@/lib/billing/stripeCore";

const API = "https://api.stripe.com/v1";

export const PLANS = {
  monthly: () => process.env.STRIPE_PRICE_MONTHLY,
  yearly: () => process.env.STRIPE_PRICE_YEARLY,
} as const;
export type PlanId = keyof typeof PLANS;

export function billingConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY && (PLANS.monthly() || PLANS.yearly()));
}

/** Aplana um objeto em campos form-encoded no estilo da Stripe (a[b][c]=v). */
export function toStripeForm(params: Record<string, unknown>, prefix = ""): URLSearchParams {
  const out = new URLSearchParams();
  const walk = (value: unknown, key: string) => {
    if (value === undefined || value === null) return;
    if (Array.isArray(value)) value.forEach((v, i) => walk(v, `${key}[${i}]`));
    else if (typeof value === "object") {
      for (const [k, v] of Object.entries(value)) walk(v, key ? `${key}[${k}]` : k);
    } else out.append(key, String(value));
  };
  walk(params, prefix);
  return out;
}

async function stripe<T>(method: "GET" | "POST" | "DELETE", path: string, params?: Record<string, unknown>): Promise<T> {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY não configurada");

  const response = await fetch(`${API}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${key}`,
      ...(method === "POST" ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
    },
    body: method === "POST" && params ? toStripeForm(params) : undefined,
    cache: "no-store",
  });
  const body = (await response.json()) as T & { error?: { message?: string } };
  if (!response.ok) throw new Error(body.error?.message ?? `Stripe HTTP ${response.status}`);
  return body;
}

export function createCheckoutSession(input: {
  priceId: string;
  userId: string;
  email: string | undefined;
  siteUrl: string;
  locale: string;
  customerId?: string | null;
}) {
  return stripe<{ url: string }>("POST", "/checkout/sessions", {
    mode: "subscription",
    line_items: [{ price: input.priceId, quantity: 1 }],
    client_reference_id: input.userId,
    ...(input.customerId ? { customer: input.customerId } : { customer_email: input.email }),
    subscription_data: { metadata: { user_id: input.userId } },
    allow_promotion_codes: true,
    success_url: `${input.siteUrl}/planos?ok=1`,
    cancel_url: `${input.siteUrl}/planos`,
    locale: input.locale.startsWith("pt") ? "pt-BR" : input.locale.startsWith("es") ? "es" : "en",
  });
}

export function createPortalSession(customerId: string, returnUrl: string) {
  return stripe<{ url: string }>("POST", "/billing_portal/sessions", {
    customer: customerId,
    return_url: returnUrl,
  });
}

export function getSubscription(id: string) {
  return stripe<StripeSubscription>("GET", `/subscriptions/${encodeURIComponent(id)}`);
}

export async function getPrice(id: string) {
  return stripe<{ unit_amount: number | null; currency: string; recurring: { interval: string } | null }>(
    "GET",
    `/prices/${encodeURIComponent(id)}`,
  );
}

/** Cancela a assinatura imediatamente (usado ao excluir a conta). */
export async function cancelSubscription(id: string) {
  return stripe<{ status: string }>("DELETE", `/subscriptions/${encodeURIComponent(id)}`);
}
