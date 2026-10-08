import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Valida o header `Stripe-Signature` (esquema v1: HMAC-SHA256 de "<t>.<corpo>")
 * com tolerância de relógio, em tempo constante.
 */
export function verifyStripeSignature(
  payload: string,
  header: string | null,
  secret: string,
  nowSeconds = Math.floor(Date.now() / 1000),
  toleranceSeconds = 300,
): boolean {
  if (!header || !secret) return false;

  let timestamp = "";
  const signatures: string[] = [];
  for (const part of header.split(",")) {
    const [key, value] = part.split("=");
    if (key === "t") timestamp = value ?? "";
    if (key === "v1" && value) signatures.push(value);
  }
  const t = Number(timestamp);
  if (!Number.isInteger(t) || signatures.length === 0) return false;
  if (Math.abs(nowSeconds - t) > toleranceSeconds) return false;

  const expected = Buffer.from(
    createHmac("sha256", secret).update(`${timestamp}.${payload}`).digest("hex"),
  );
  return signatures.some((sig) => {
    const received = Buffer.from(sig);
    return received.length === expected.length && timingSafeEqual(received, expected);
  });
}

export interface StripeSubscription {
  id: string;
  status: string;
  customer: string | { id: string };
  cancel_at_period_end?: boolean;
  current_period_end?: number;
  items?: { data?: { current_period_end?: number }[] };
  metadata?: Record<string, string>;
}

export interface SubscriptionRow {
  provider: "stripe";
  provider_customer_id: string;
  provider_subscription_id: string;
  plan: "premium";
  status: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  updated_at: string;
}

/** Converte a assinatura da Stripe (qualquer versão da API) na linha da tabela. */
export function mapSubscription(sub: StripeSubscription, now = new Date()): SubscriptionRow {
  // Versões recentes da API trazem o fim do período em items.data[0].
  const end = sub.current_period_end ?? sub.items?.data?.[0]?.current_period_end;
  return {
    provider: "stripe",
    provider_customer_id: typeof sub.customer === "string" ? sub.customer : sub.customer.id,
    provider_subscription_id: sub.id,
    plan: "premium",
    status: sub.status,
    current_period_end: typeof end === "number" ? new Date(end * 1000).toISOString() : null,
    cancel_at_period_end: Boolean(sub.cancel_at_period_end),
    updated_at: now.toISOString(),
  };
}
