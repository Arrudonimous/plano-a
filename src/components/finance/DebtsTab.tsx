import { useTranslations } from "next-intl";
import { addDebt, deleteDebt, updateDebt } from "@/lib/actions/finance";
import { payoffWithInterest } from "@/lib/finance/finance";
import type { Database } from "@/lib/types/database.types";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { CurrencySelect } from "./CurrencySelect";
import { DeleteButton } from "./DeleteButton";
import { FinanceForm } from "./FinanceForm";
import { useMoney } from "./useMoney";

type Debt = Database["public"]["Tables"]["finance_debts"]["Row"];

const toInput = (cents: number) => (cents / 100).toFixed(2).replace(".", ",");

function DebtCard({ debt, currency }: { debt: Debt; currency: string }) {
  const t = useTranslations("financeiro");
  const money = useMoney(currency);
  const rate = Number(debt.monthly_rate_pct);
  const estimate = payoffWithInterest(debt.balance_cents, debt.monthly_payment_cents, rate);

  return (
    <Card className="space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{debt.name}</p>
          <p className="text-lg font-semibold">{money(debt.balance_cents, debt.currency)}</p>
        </div>
        <DeleteButton action={deleteDebt.bind(null, debt.id)} confirmText={t("confirmDelete")} />
      </div>
      <p className="text-xs text-muted-foreground">
        {debt.balance_cents === 0
          ? t("debtPaid")
          : debt.monthly_payment_cents === 0
            ? t("debtNoPayment")
            : estimate === null
              ? t("debtNeverEnds")
              : t("debtPayoff", {
                  payment: money(debt.monthly_payment_cents, debt.currency),
                  months: estimate.months,
                })}
      </p>
      {estimate && estimate.totalInterestCents > 0 && (
        <p className="text-xs text-muted-foreground">
          {t("debtInterest", { amount: money(estimate.totalInterestCents, debt.currency) })}
        </p>
      )}
      <FinanceForm
        action={updateDebt.bind(null, debt.id)}
        submitLabel={t("updateDebt")}
        showSaved
        className="space-y-2 border-t border-border pt-3"
      >
        <label className="block text-xs text-muted-foreground">{t("balance")}</label>
        <Input name="balance" inputMode="decimal" defaultValue={toInput(debt.balance_cents)} required />
        <label className="block text-xs text-muted-foreground">{t("payment")}</label>
        <Input name="payment" inputMode="decimal" defaultValue={toInput(debt.monthly_payment_cents)} />
        <label className="block text-xs text-muted-foreground">{t("rate")}</label>
        <Input name="rate" inputMode="decimal" defaultValue={rate ? String(rate).replace(".", ",") : ""} placeholder="0" />
      </FinanceForm>
    </Card>
  );
}

export function DebtsTab({ debts, currency }: { debts: Debt[]; currency: string }) {
  const t = useTranslations("financeiro");

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{t("debtsIntro")}</p>
      {debts.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("debtsEmpty")}</p>
      ) : (
        debts.map((debt) => <DebtCard key={debt.id} debt={debt} currency={currency} />)
      )}
      <Card>
        <FinanceForm action={addDebt} submitLabel={t("addDebt")}>
          <Input name="name" placeholder={t("debtNamePlaceholder")} maxLength={80} required />
          <div className="flex gap-2">
            <Input
              name="balance"
              inputMode="decimal"
              placeholder={t("balancePlaceholder")}
              aria-label={t("balance")}
              required
            />
            <div className="w-28 shrink-0">
              <CurrencySelect defaultValue={currency} />
            </div>
          </div>
          <Input
            name="payment"
            inputMode="decimal"
            placeholder={t("paymentPlaceholder")}
            aria-label={t("payment")}
          />
          <Input name="rate" inputMode="decimal" placeholder={t("ratePlaceholder")} aria-label={t("rate")} />
        </FinanceForm>
      </Card>
    </div>
  );
}
