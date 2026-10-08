"use server";

import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { track } from "@/lib/analytics";
import { createCheckoutSession, createPortalSession, PLANS, type PlanId } from "@/lib/billing/stripe";
import { createClient } from "@/lib/supabase/server";

const siteUrl = () => process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export async function startCheckout(plan: PlanId) {
  const priceId = PLANS[plan]?.();
  if (!priceId) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const locale = await getLocale();
  const { data: existing } = await supabase
    .from("subscriptions")
    .select("provider_customer_id")
    .eq("user_id", user.id)
    .maybeSingle();

  const session = await createCheckoutSession({
    priceId,
    userId: user.id,
    email: user.email,
    siteUrl: siteUrl(),
    locale,
    customerId: existing?.provider_customer_id,
  });
  await track("checkout_started", { plan });
  // URL externa (Stripe): redirect nativo do Next, sem prefixo de idioma.
  const { redirect: nativeRedirect } = await import("next/navigation");
  nativeRedirect(session.url);
}

export async function openBillingPortal() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("provider_customer_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!sub?.provider_customer_id) {
    redirect({ href: "/planos", locale: await getLocale() });
    return;
  }

  const portal = await createPortalSession(sub.provider_customer_id, `${siteUrl()}/planos`);
  const { redirect: nativeRedirect } = await import("next/navigation");
  nativeRedirect(portal.url);
}
