import { useTranslations } from "next-intl";
import type { FinanceSummary } from "@/lib/finance/finance";
import { Card } from "@/components/ui/Card";
import { Bar } from "./Bar";
import { useMoney } from "./useMoney";

export function SummaryTab({
  summary,
  currency,
  hasData,
  missingRates,
}: {
  summary: FinanceSummary;
  currency: string;
  hasData: boolean;
  missingRates: boolean;
}) {
  const t = useTranslations("financeiro");
  const money = useMoney(currency);

  if (!hasData) {
    return <p className="text-sm text-muted-foreground">{t("summaryEmpty")}</p>;
  }

  const rows = [
    { label: t("income"), value: summary.income },
    { label: t("expenses"), value: summary.expenses },
    { label: t("debtPayments"), value: summary.debtPayments },
  ];

  return (
    <div className="space-y-4">
      {missingRates && (
        <p role="status" className="rounded-xl bg-surface-muted p-3 text-xs text-muted-foreground">
          {t("missingRates")}
        </p>
      )}
      <Card>
        <p className="text-xs font-medium text-accent">{t("monthlyBalance")}</p>
        <p className="mt-1 text-3xl font-semibold tracking-tight">{money(summary.surplus)}</p>
        <p className="mt-2 text-sm text-muted-foreground">
          {summary.surplus > 0
            ? t("surplusPositive")
            : summary.surplus === 0
              ? t("surplusZero")
              : t("surplusNegative")}
        </p>
        <dl className="mt-4 space-y-1.5 border-t border-border pt-3 text-sm">
          {rows.map(({ label, value }) => (
            <div key={label} className="flex justify-between">
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="font-medium">{money(value)}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-3 text-xs text-muted-foreground">{t("convertedNote", { currency })}</p>
      </Card>

      <Card>
        <h2 className="text-sm font-semibold">{t("reserveTitle")}</h2>
        {summary.reservePercent === null ? (
          <p className="mt-2 text-sm text-muted-foreground">{t("reserveNeedsBudget")}</p>
        ) : (
          <div className="mt-3 space-y-2">
            <Bar percent={summary.reservePercent} label={t("reserveTitle")} />
            <p className="text-sm text-muted-foreground">
              {t("reserveCovers", { months: summary.reserveMonths ?? 0 })}
            </p>
          </div>
        )}
      </Card>

      {summary.debtBalance > 0 && (
        <Card>
          <h2 className="text-sm font-semibold">{t("debtsTitle")}</h2>
          <p className="mt-1 text-2xl font-semibold">{money(summary.debtBalance)}</p>
          <p className="mt-1 text-xs text-muted-foreground">{t("debtTotalHint")}</p>
        </Card>
      )}
    </div>
  );
}
