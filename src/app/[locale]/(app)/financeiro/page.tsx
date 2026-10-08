import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { isValidMonth, makeConverter, monthBounds, monthOf, summarize } from "@/lib/finance/finance";
import { loadRates } from "@/lib/finance/rates";
import { todayInTimeZone } from "@/lib/utils/dates";
import { Tabs } from "@/components/ui/Tabs";
import { BudgetTab } from "@/components/finance/BudgetTab";
import { DebtsTab } from "@/components/finance/DebtsTab";
import { ReserveGoalsTab } from "@/components/finance/ReserveGoalsTab";
import { SummaryTab } from "@/components/finance/SummaryTab";
import { TransactionsTab } from "@/components/finance/TransactionsTab";

export default async function FinanceiroPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string; aba?: string }>;
}) {
  const { mes, aba } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const t = await getTranslations("financeiro");

  const { data: profile } = await supabase
    .from("profiles")
    .select("preferred_currency, timezone")
    .eq("id", user!.id)
    .single();
  const currency = profile?.preferred_currency ?? "BRL";
  const today = todayInTimeZone(profile?.timezone ?? "America/Sao_Paulo");
  const month = mes && isValidMonth(mes) ? mes : monthOf(today);
  const bounds = monthBounds(month);

  const [{ data: items }, { data: debts }, { data: reserveRow }, { data: goals }, { data: dreams }, { data: transactions }, rates] =
    await Promise.all([
      supabase.from("finance_items").select("*").eq("user_id", user!.id).order("created_at"),
      supabase.from("finance_debts").select("*").eq("user_id", user!.id).order("created_at"),
      supabase.from("finance_reserve").select("*").eq("user_id", user!.id).maybeSingle(),
      supabase.from("finance_goals").select("*").eq("user_id", user!.id).order("created_at"),
      supabase
        .from("dreams")
        .select("id, description, realized_at")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("finance_transactions")
        .select("*")
        .eq("user_id", user!.id)
        .gte("occurred_on", bounds.start)
        .lte("occurred_on", bounds.end)
        .order("occurred_on", { ascending: false })
        .order("created_at", { ascending: false }),
      loadRates(supabase),
    ]);

  const convert = makeConverter(rates, currency);
  const convertedItems = (items ?? []).map((i) => ({ kind: i.kind, amount_cents: convert(i.amount_cents, i.currency).cents }));
  const convertedDebts = (debts ?? []).map((d) => ({
    balance_cents: convert(d.balance_cents, d.currency).cents,
    monthly_payment_cents: convert(d.monthly_payment_cents, d.currency).cents,
  }));
  const missingRates =
    (items ?? []).some((i) => convert(1, i.currency).missing) ||
    (debts ?? []).some((d) => convert(1, d.currency).missing);

  const reserve = {
    balance_cents: reserveRow?.balance_cents ?? 0,
    target_months: reserveRow?.target_months ?? 6,
  };
  const summary = summarize(convertedItems, convertedDebts, reserve);
  const hasData = (items?.length ?? 0) + (debts?.length ?? 0) > 0;
  const openDreams = (dreams ?? [])
    .filter((d) => !d.realized_at)
    .map(({ id, description }) => ({ id, description }));

  return (
    <div className="mx-auto max-w-2xl space-y-4 px-4 py-6">
      <div>
        <h1 className="text-xl font-semibold">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>
      <Tabs
        initial={aba}
        tabs={[
          {
            id: "resumo",
            label: t("tabSummary"),
            content: <SummaryTab summary={summary} currency={currency} hasData={hasData} missingRates={missingRates} />,
          },
          {
            id: "orcamento",
            label: t("tabBudget"),
            content: <BudgetTab items={items ?? []} currency={currency} rates={rates} />,
          },
          {
            id: "lancamentos",
            label: t("tabTransactions"),
            content: (
              <TransactionsTab
                month={month}
                transactions={transactions ?? []}
                currency={currency}
                rates={rates}
                today={today}
                plannedExpenses={summary.expenses}
              />
            ),
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
                dreams={openDreams}
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
