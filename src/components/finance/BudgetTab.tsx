import { useTranslations } from "next-intl";
import {
  addFinanceItem,
  deleteFinanceItem,
} from "@/lib/actions/finance";
import type { Database } from "@/lib/types/database.types";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { DeleteButton } from "./DeleteButton";
import { FinanceForm } from "./FinanceForm";
import { useMoney } from "./useMoney";

type Item = Database["public"]["Tables"]["finance_items"]["Row"];

function Section({
  kind,
  items,
  currency,
}: {
  kind: "income" | "expense";
  items: Item[];
  currency: string;
}) {
  const t = useTranslations("financeiro");
  const money = useMoney(currency);
  const total = items.reduce((sum, item) => sum + item.amount_cents, 0);

  return (
    <Card className="space-y-3">
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-semibold">{kind === "income" ? t("income") : t("expenses")}</h2>
        {items.length > 0 && <span className="text-sm font-medium">{money(total)}</span>}
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {kind === "income" ? t("incomeEmpty") : t("expensesEmpty")}
        </p>
      ) : (
        <ul className="divide-y divide-border">
          {items.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-3 py-2">
              <span className="min-w-0 flex-1 truncate text-sm">{item.name}</span>
              <span className="text-sm font-medium">{money(item.amount_cents)}</span>
              <DeleteButton
                action={deleteFinanceItem.bind(null, item.id)}
                confirmText={t("confirmDelete")}
              />
            </li>
          ))}
        </ul>
      )}

      <FinanceForm
        action={addFinanceItem.bind(null, kind)}
        submitLabel={t("add")}
        className="space-y-2 border-t border-border pt-3"
      >
        <Input
          name="name"
          placeholder={kind === "income" ? t("incomeNamePlaceholder") : t("expenseNamePlaceholder")}
          maxLength={80}
          required
        />
        <Input
          name="amount"
          inputMode="decimal"
          placeholder={t("amountPlaceholder")}
          aria-label={t("amount")}
          required
        />
      </FinanceForm>
    </Card>
  );
}

export function BudgetTab({ items, currency }: { items: Item[]; currency: string }) {
  const t = useTranslations("financeiro");

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{t("budgetIntro")}</p>
      <Section kind="income" items={items.filter((i) => i.kind === "income")} currency={currency} />
      <Section kind="expense" items={items.filter((i) => i.kind === "expense")} currency={currency} />
    </div>
  );
}
