"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { upsertObjective, type ObjectiveActionState } from "@/lib/actions/objectives";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import type { ObjectivePeriod } from "@/lib/types/database.types";

const PERIOD_LABEL_KEY: Record<ObjectivePeriod, string> = {
  "6_MONTHS": "period6Months",
  "1_YEAR": "period1Year",
  "5_YEARS": "period5Years",
  "10_YEARS": "period10Years",
};

const PERIOD_PLACEHOLDER_KEY: Record<ObjectivePeriod, string> = {
  "6_MONTHS": "placeholder6Months",
  "1_YEAR": "placeholder1Year",
  "5_YEARS": "placeholder5Years",
  "10_YEARS": "placeholder10Years",
};

const initialState: ObjectiveActionState = {};

export function ObjectivePeriodEditor({
  period,
  declaration,
}: {
  period: ObjectivePeriod;
  declaration: string;
}) {
  const t = useTranslations("objetivos");
  const tCommon = useTranslations("common");
  const action = upsertObjective.bind(null, period);
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-3">
      <h3 className="text-sm font-semibold text-primary">
        {t(PERIOD_LABEL_KEY[period])}
      </h3>
      <Textarea
        name="declaration"
        defaultValue={declaration}
        placeholder={t(PERIOD_PLACEHOLDER_KEY[period])}
        rows={4}
      />
      <div className="flex items-center gap-3">
        <Button type="submit" variant="secondary" className="text-xs" disabled={pending}>
          {tCommon("save")}
        </Button>
        {state.success && (
          <span className="text-xs text-emerald-600">{t("saved")} ✓</span>
        )}
        {state.error && <span className="text-xs text-red-600">{state.error}</span>}
      </div>
    </form>
  );
}
