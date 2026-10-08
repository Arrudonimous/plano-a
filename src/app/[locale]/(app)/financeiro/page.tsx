import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { summarize } from "@/lib/finance/finance";
import { todayInTimeZone } from "@/lib/utils/dates";
import { Tabs } from "@/components/ui/Tabs";
import { BudgetTab } from "@/components/finance/BudgetTab";
import { DebtsTab } from "@/components/finance/DebtsTab";
import { ReserveGoalsTab } from "@/components/finance/ReserveGoalsTab";
import { SummaryTab } from "@/components/finance/SummaryTab";

export default async function FinanceiroPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const t = await getTranslations("financeiro");

  const [{ data: profile }, { data: items }, { data: debts }, { data: reserveRow }, { data: goals }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("preferred_currency, timezone")
        .eq("id", user!.id)
        .single(),
      supabase
        .from("finance_items")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at"),
      supabase
        .from("finance_debts")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at"),
      supabase.from("finance_reserve").select("*").eq("user_id", user!.id).maybeSingle(),
      supabase
        .from("finance_goals")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at"),
    ]);

  const currency = profile?.preferred_currency ?? "BRL";
  const today = todayInTimeZone(profile?.timezone ?? "America/Sao_Paulo");
  const reserve = {
    balance_cents: reserveRow?.balance_cents ?? 0,
    target_months: reserveRow?.target_months ?? 6,
  };
  const summary = summarize(items ?? [], debts ?? [], reserve);
  const hasData = (items?.length ?? 0) + (debts?.length ?? 0) > 0;

  return (
    <div className="mx-auto max-w-2xl space-y-4 px-4 py-6">
      <div>
        <h1 className="text-xl font-semibold">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>
      <Tabs
        tabs={[
          {
            id: "resumo",
            label: t("tabSummary"),
            content: <SummaryTab summary={summary} currency={currency} hasData={hasData} />,
          },
          {
            id: "orcamento",
            label: t("tabBudget"),
            content: <BudgetTab items={items ?? []} currency={currency} />,
          },
          {
            id: "dividas",
            label: t("tabDebts"),
            content: <DebtsTab debts={debts ?? []} currency={currency} />,
          },
          {
            id: "reserva",
            label: t("tabReserve"),
            content: (
              <ReserveGoalsTab
                summary={summary}
                reserve={reserve}
                goals={goals ?? []}
                currency={currency}
                today={today}
              />
            ),
          },
        ]}
      />
      <p className="text-xs text-muted-foreground">{t("privacy")}</p>
    </div>
  );
}
