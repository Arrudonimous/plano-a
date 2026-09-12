import { useTranslations } from "next-intl";
import { upsertObjective } from "@/lib/actions/objectives";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import type { ObjectivePeriod } from "@/lib/types/database.types";

const PERIOD_LABEL_KEY: Record<ObjectivePeriod, string> = {
  "6_MONTHS": "period6Months",
  "1_YEAR": "period1Year",
  "5_YEARS": "period5Years",
  "10_YEARS": "period10Years",
};

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

  return (
    <form action={action} className="space-y-3">
      <h3 className="text-sm font-semibold text-primary">
        {t(PERIOD_LABEL_KEY[period])}
      </h3>
      <Textarea
        name="declaration"
        defaultValue={declaration}
        placeholder={t("placeholder")}
        rows={4}
      />
      <Button type="submit" variant="secondary" className="text-xs">
        {tCommon("save")}
      </Button>
    </form>
  );
}
