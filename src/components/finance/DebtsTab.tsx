import { useTranslations } from "next-intl";
import { addDebt, deleteDebt, updateDebtBalance } from "@/lib/actions/finance";
import { monthsToPayOff } from "@/lib/finance/finance";
import type { Database } from "@/lib/types/database.types";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { DeleteButton } from "./DeleteButton";
import { FinanceForm } from "./FinanceForm";
import { useMoney } from "./useMoney";

type Debt = Database["public"]["Tables"]["finance_debts"]["Row"];

function DebtCard({ debt, currency }: { debt: Debt; currency: string }) {
  const t = useTranslations("financeiro");
  const money = useMoney(currency);
  const months = monthsToPayOff(debt);

  return (
    <Card className="space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{debt.name}</p>
          <p className="text-lg font-semibold">{money(debt.balance_cents)}</p>
        </div>
        <DeleteButton action={deleteDebt.bind(null, debt.id)} confirmText={t("confirmDelete")} />
      </div>
      <p className="text-xs text-muted-foreground">
        {debt.balance_cents === 0
          ? t("debtPaid")
          : months === null
            ? t("debtNoPayment")
            : t("debtPayoff", { payment: money(debt.monthly_payment_cents), months })}
      </p>
      <FinanceForm
        action={updateDebtBalance.bind(null, debt.id)}
        submitLabel={t("updateBalance")}
        showSaved
        className="space-y-2 border-t border-border pt-3"
      >
        <Input
          name="balance"
          inputMode="decimal"
          defaultValue={(debt.balance_cents / 100).toFixed(2).replace(".", ",")}
          aria-label={t("balance")}
          required
        />
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
          <Input
            name="balance"
            inputMode="decimal"
            placeholder={t("balancePlaceholder")}
            aria-label={t("balance")}
            required
          />
          <Input
            name="payment"
            inputMode="decimal"
            placeholder={t("paymentPlaceholder")}
            aria-label={t("payment")}
          />
        </FinanceForm>
      </Card>
    </div>
  );
}
