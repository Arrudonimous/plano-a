import { useFormatter, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { addTransaction, deleteTransaction } from "@/lib/actions/finance";
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  makeConverter,
  monthStats,
  shiftMonth,
  type Rates,
} from "@/lib/finance/finance";
import type { Database } from "@/lib/types/database.types";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Bar } from "./Bar";
import { CurrencySelect } from "./CurrencySelect";
import { DeleteButton } from "./DeleteButton";
import { FinanceForm } from "./FinanceForm";
import { useMoney } from "./useMoney";

type Tx = Database["public"]["Tables"]["finance_transactions"]["Row"];

export function TransactionsTab({
  month,
  transactions,
  currency,
  rates,
  today,
  plannedExpenses,
}: {
  month: string;
  transactions: Tx[];
  currency: string;
  rates: Rates;
  today: string;
  /** Despesas do orçamento mensal, já na moeda preferida (0 = sem orçamento). */
  plannedExpenses: number;
}) {
  const t = useTranslations("financeiro");
  const format = useFormatter();
  const money = useMoney(currency);
  const convert = makeConverter(rates, currency);

  const stats = monthStats(
    transactions.map((tx) => ({
      kind: tx.kind,
      category: tx.category,
      amount_cents: convert(tx.amount_cents, tx.currency).cents,
    })),
  );
  const monthLabel = format.dateTime(new Date(`${month}-01T00:00:00Z`), {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
  const nav = (target: string) => ({ pathname: "/financeiro" as const, query: { mes: target, aba: "lancamentos" } });
  const defaultDate = today.startsWith(month) ? today : `${month}-01`;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Link href={nav(shiftMonth(month, -1))} className="rounded-full px-3 py-1.5 text-sm text-primary hover:bg-surface-muted" aria-label={t("prevMonth")}>
          ←
        </Link>
        <h2 className="text-sm font-semibold capitalize">{monthLabel}</h2>
        <Link href={nav(shiftMonth(month, 1))} className="rounded-full px-3 py-1.5 text-sm text-primary hover:bg-surface-muted" aria-label={t("nextMonth")}>
          →
        </Link>
      </div>

      <Card className="space-y-3">
        <dl className="space-y-1.5 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">{t("income")}</dt>
            <dd className="font-medium">{money(stats.income)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">{t("expenses")}</dt>
            <dd className="font-medium">{money(stats.expenses)}</dd>
          </div>
          <div className="flex justify-between border-t border-border pt-1.5">
            <dt className="font-medium">{t("monthBalance")}</dt>
            <dd className="font-semibold">{money(stats.balance)}</dd>
          </div>
        </dl>
        {plannedExpenses > 0 && (
          <p className="text-xs text-muted-foreground">
            {t("plannedVsActual", { planned: money(plannedExpenses), actual: money(stats.expenses) })}
          </p>
        )}
        {stats.byCategory.length > 0 && (
          <ul className="space-y-2 border-t border-border pt-3">
            {stats.byCategory.map(({ category, cents }) => (
              <li key={category} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>{t(`categories.${category}`)}</span>
                  <span className="text-muted-foreground">{money(cents)}</span>
                </div>
                <Bar percent={Math.round((cents / stats.expenses) * 100)} label={t(`categories.${category}`)} />
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <FinanceForm action={addTransaction} submitLabel={t("addTransaction")}>
          <select
            name="type"
            defaultValue="expense:food"
            aria-label={t("transactionType")}
            className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary"
          >
            <optgroup label={t("expenses")}>
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c} value={`expense:${c}`}>
                  {t(`categories.${c}`)}
                </option>
              ))}
            </optgroup>
            <optgroup label={t("income")}>
              {INCOME_CATEGORIES.map((c) => (
                <option key={c} value={`income:${c}`}>
                  {t(`categories.${c}`)}
                </option>
              ))}
            </optgroup>
          </select>
          <Input name="description" maxLength={120} placeholder={t("descriptionPlaceholder")} aria-label={t("description")} />
          <div className="flex gap-2">
            <Input name="amount" inputMode="decimal" placeholder={t("amountOnly")} aria-label={t("amount")} required />
            <div className="w-28 shrink-0">
              <CurrencySelect defaultValue={currency} />
            </div>
          </div>
          <Input name="date" type="date" defaultValue={defaultDate} min={`${month}-01`} aria-label={t("date")} required />
        </FinanceForm>
      </Card>

      {transactions.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("transactionsEmpty")}</p>
      ) : (
        <ul className="divide-y divide-border rounded-2xl border border-border bg-surface px-4">
          {transactions.map((tx) => (
            <li key={tx.id} className="flex items-center gap-3 py-2.5">
              <span className="w-10 shrink-0 text-xs text-muted-foreground">{tx.occurred_on.slice(8)}/{tx.occurred_on.slice(5, 7)}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm">{tx.description || t(`categories.${tx.category}`)}</span>
                {tx.description && <span className="block text-xs text-muted-foreground">{t(`categories.${tx.category}`)}</span>}
              </span>
              <span className={`text-sm font-medium ${tx.kind === "income" ? "text-accent" : ""}`}>
                {tx.kind === "income" ? "+" : "−"}
                {money(tx.amount_cents, tx.currency)}
              </span>
              <DeleteButton action={deleteTransaction.bind(null, tx.id)} confirmText={t("confirmDelete")} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
