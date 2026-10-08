import { getFormatter, getLocale, getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { billingConfigured, getPrice, PLANS, type PlanId } from "@/lib/billing/stripe";
import { openBillingPortal, startCheckout } from "@/lib/actions/billing";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

async function priceLabel(plan: PlanId, format: Awaited<ReturnType<typeof getFormatter>>) {
  const id = PLANS[plan]?.();
  if (!id) return null;
  try {
    const price = await getPrice(id);
    if (price.unit_amount === null) return null;
    return format.number(price.unit_amount / 100, { style: "currency", currency: price.currency.toUpperCase() });
  } catch {
    return null;
  }
}

export default async function PlanosPage({ searchParams }: { searchParams: Promise<{ ok?: string }> }) {
  const { ok } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const t = await getTranslations("planos");
  const format = await getFormatter();
  const locale = await getLocale();

  const { data: sub } = await supabase.from("subscriptions").select("*").eq("user_id", user!.id).maybeSingle();
  const { data: hasPremium } = await supabase.rpc("has_premium");
  const active = Boolean(hasPremium);
  const configured = billingConfigured();

  const [monthly, yearly] = configured
    ? await Promise.all([priceLabel("monthly", format), priceLabel("yearly", format)])
    : [null, null];

  const benefits = ["b1", "b2", "b3", "b4"] as const;

  return (
    <div className="mx-auto max-w-2xl space-y-5 px-4 py-6">
      <div>
        <h1 className="text-xl font-semibold">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      {ok && (
        <p role="status" className="rounded-xl bg-surface-muted p-3 text-sm text-accent">
          {t("thanks")}
        </p>
      )}

      <Card className="space-y-3">
        <h2 className="text-sm font-semibold">{t("premiumTitle")}</h2>
        <ul className="list-disc space-y-1 pl-5 text-sm">
          {benefits.map((b) => (
            <li key={b}>{t(b)}</li>
          ))}
        </ul>
        <p className="text-xs text-muted-foreground">{t("freeNote")}</p>
      </Card>

      {active ? (
        <Card className="space-y-3">
          <p className="text-sm font-semibold">{t("active")}</p>
          {sub?.current_period_end && (
            <p className="text-xs text-muted-foreground">
              {sub.cancel_at_period_end ? t("endsOn") : t("renewsOn")}{" "}
              {format.dateTime(new Date(sub.current_period_end), { dateStyle: "long" })}
            </p>
          )}
          {sub?.provider_customer_id && (
            <form action={openBillingPortal}>
              <Button type="submit" variant="secondary">
                {t("manage")}
              </Button>
            </form>
          )}
        </Card>
      ) : configured ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {(["monthly", "yearly"] as const).map(
            (plan) =>
              PLANS[plan]?.() && (
                <Card key={plan} className="space-y-3">
                  <p className="text-sm font-semibold">{t(plan)}</p>
                  {(plan === "monthly" ? monthly : yearly) && (
                    <p className="text-2xl font-semibold">{plan === "monthly" ? monthly : yearly}</p>
                  )}
                  <form action={startCheckout.bind(null, plan)}>
                    <Button type="submit" className="w-full">
                      {t("subscribe")}
                    </Button>
                  </form>
                </Card>
              ),
          )}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">{t("soon")}</p>
      )}
      <p className="text-xs text-muted-foreground" lang={locale}>
        {t("cancelNote")}
      </p>
    </div>
  );
}
