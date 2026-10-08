import { useTranslations } from "next-intl";
import { addGoal, addToGoal, deleteGoal, saveReserve } from "@/lib/actions/finance";
import { goalPercent, monthlyForGoal, type FinanceSummary } from "@/lib/finance/finance";
import type { Database } from "@/lib/types/database.types";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { CurrencySelect } from "./CurrencySelect";
import { Bar } from "./Bar";
import { DeleteButton } from "./DeleteButton";
import { FinanceForm } from "./FinanceForm";
import { useMoney } from "./useMoney";

type Goal = Database["public"]["Tables"]["finance_goals"]["Row"];
interface DreamOption {
  id: string;
  description: string;
}

function ReserveCard({
  summary,
  balanceCents,
  targetMonths,
  currency,
}: {
  summary: FinanceSummary;
  balanceCents: number;
  targetMonths: number;
  currency: string;
}) {
  const t = useTranslations("financeiro");
  const money = useMoney(currency);

  return (
    <Card className="space-y-3">
      <h2 className="text-sm font-semibold">{t("reserveTitle")}</h2>
      <p className="text-sm text-muted-foreground">{t("reserveIntro")}</p>
      {summary.reservePercent !== null && (
        <div className="space-y-1.5">
          <Bar percent={summary.reservePercent} label={t("reserveTitle")} />
          <p className="text-xs text-muted-foreground">
            {t("reserveProgress", {
              saved: money(balanceCents),
              target: money(summary.reserveTarget),
            })}
          </p>
        </div>
      )}
      <FinanceForm
        action={saveReserve}
        submitLabel={t("save")}
        showSaved
        className="space-y-2 border-t border-border pt-3"
      >
        <label className="block text-xs text-muted-foreground" htmlFor="reserve-balance">
          {t("reserveBalance")}
        </label>
        <Input
          id="reserve-balance"
          name="balance"
          inputMode="decimal"
          defaultValue={(balanceCents / 100).toFixed(2).replace(".", ",")}
        />
        <label className="block text-xs text-muted-foreground" htmlFor="reserve-months">
          {t("reserveMonths")}
        </label>
        <Input
          id="reserve-months"
          name="months"
          type="number"
          min={1}
          max={24}
          defaultValue={targetMonths}
          required
        />
      </FinanceForm>
    </Card>
  );
}

function GoalCard({
  goal,
  currency,
  today,
  dreamName,
}: {
  goal: Goal;
  currency: string;
  today: string;
  dreamName: string | null;
}) {
  const t = useTranslations("financeiro");
  const money = useMoney(currency);
  const percent = goalPercent(goal);
  const reached = goal.saved_cents >= goal.target_cents;
  const perMonth = reached ? null : monthlyForGoal(goal, goal.target_date, today);

  return (
    <Card className="space-y-2">
      <div className="flex items-start justify-between gap-3">
        <p className="min-w-0 truncate text-sm font-semibold">{goal.name}</p>
        <DeleteButton action={deleteGoal.bind(null, goal.id)} confirmText={t("confirmDelete")} />
      </div>
      {dreamName && (
        <p className="text-xs text-accent">
          {t("goalDream", { dream: dreamName })}
        </p>
      )}
      <Bar percent={percent} label={goal.name} />
      <p className="text-xs text-muted-foreground">
        {reached
          ? t("goalReached")
          : t("goalProgress", {
              saved: money(goal.saved_cents, goal.currency),
              target: money(goal.target_cents, goal.currency),
              percent,
            })}
      </p>
      {perMonth !== null && perMonth > 0 && (
        <p className="text-xs text-muted-foreground">{t("goalPerMonth", { amount: money(perMonth, goal.currency) })}</p>
      )}
      {!reached && (
        <FinanceForm
          action={addToGoal.bind(null, goal.id)}
          submitLabel={t("addSaving")}
          className="space-y-2 border-t border-border pt-3"
        >
          <Input
            name="amount"
            inputMode="decimal"
            placeholder={t("savedPlaceholder")}
            aria-label={t("savedAmount")}
            required
          />
        </FinanceForm>
      )}
    </Card>
  );
}

export function ReserveGoalsTab({
  summary,
  reserve,
  goals,
  dreams,
  currency,
  today,
}: {
  summary: FinanceSummary;
  reserve: { balance_cents: number; target_months: number };
  goals: Goal[];
  dreams: DreamOption[];
  currency: string;
  today: string;
}) {
  const t = useTranslations("financeiro");

  return (
    <div className="space-y-4">
      <ReserveCard
        summary={summary}
        balanceCents={reserve.balance_cents}
        targetMonths={reserve.target_months}
        currency={currency}
      />

      <h2 className="pt-2 text-sm font-semibold">{t("goalsTitle")}</h2>
      {goals.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("goalsEmpty")}</p>
      ) : (
        goals.map((goal) => (
          <GoalCard
            key={goal.id}
            goal={goal}
            currency={currency}
            today={today}
            dreamName={dreams.find((d) => d.id === goal.dream_id)?.description ?? null}
          />
        ))
      )}
      <Card>
        <FinanceForm action={addGoal} submitLabel={t("addGoal")}>
          <Input name="name" placeholder={t("goalNamePlaceholder")} maxLength={80} required />
          <div className="flex gap-2">
            <Input
              name="target"
              inputMode="decimal"
              placeholder={t("targetPlaceholder")}
              aria-label={t("target")}
              required
            />
            <div className="w-28 shrink-0">
              <CurrencySelect defaultValue={currency} />
            </div>
          </div>
          {dreams.length > 0 && (
            <select
              name="dreamId"
              defaultValue=""
              aria-label={t("goalDreamLabel")}
              className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary"
            >
              <option value="">{t("goalNoDream")}</option>
              {dreams.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.description.slice(0, 60)}
                </option>
              ))}
            </select>
          )}
          <label className="block text-xs text-muted-foreground" htmlFor="goal-date">
            {t("goalDate")}
          </label>
          <Input id="goal-date" name="targetDate" type="date" />
        </FinanceForm>
      </Card>
    </div>
  );
}
