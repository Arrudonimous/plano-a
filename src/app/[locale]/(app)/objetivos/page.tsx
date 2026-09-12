import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { ObjectivePeriodEditor } from "@/components/objectives/ObjectivePeriodEditor";
import type { ObjectivePeriod } from "@/lib/types/database.types";

const PERIODS: ObjectivePeriod[] = [
  "6_MONTHS",
  "1_YEAR",
  "5_YEARS",
  "10_YEARS",
];

export default async function ObjetivosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const t = await getTranslations("objetivos");

  const { data: objectives } = await supabase
    .from("objectives")
    .select("*")
    .eq("user_id", user!.id);

  const byPeriod = new Map(
    (objectives ?? []).map((o) => [o.period, o.declaration]),
  );

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-6">
      <div>
        <h1 className="text-xl font-semibold">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>
      <div className="space-y-6">
        {PERIODS.map((period) => (
          <ObjectivePeriodEditor
            key={period}
            period={period}
            declaration={byPeriod.get(period) ?? ""}
          />
        ))}
      </div>
    </div>
  );
}
