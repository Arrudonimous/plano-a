import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { todayInTimeZone } from "@/lib/utils/dates";
import { loadProgress } from "@/lib/progress/load";
import { ActivityMap } from "@/components/progress/ActivityMap";
import { AchievementList } from "@/components/progress/AchievementList";
import { JourneyMap } from "@/components/progress/JourneyMap";
import { Card } from "@/components/ui/Card";

export default async function ProgressoPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const t = await getTranslations("progresso");

  const { data: profile } = await supabase
    .from("profiles")
    .select("timezone")
    .eq("id", user!.id)
    .single();
  const timeZone = profile?.timezone ?? "America/Sao_Paulo";
  const today = todayInTimeZone(timeZone);

  const { counts, definedPeriods, activity, activeLast30, achievements, next } =
    await loadProgress(supabase, user!.id, timeZone, today);

  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const stats = [
    { label: t("statDreams"), value: t("statDreamsValue", { realized: counts.dreamsRealized, total: counts.dreamsTotal }) },
    { label: t("statSteps"), value: String(counts.actionsCompleted) },
    { label: t("statActiveDays"), value: String(activeLast30) },
    { label: t("statStreak"), value: t("statStreakValue", { count: counts.longestHabitStreak }) },
  ];

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-6">
      <div>
        <h1 className="text-xl font-semibold">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {activeLast30 > 0 ? t("summaryActive", { count: activeLast30 }) : t("summaryStart")}
        </p>
      </div>

      <ul className="grid grid-cols-2 gap-3">
        {stats.map((stat) => (
          <li key={stat.label}>
            <Card className="p-4">
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <p className="mt-1 text-lg font-semibold">{stat.value}</p>
            </Card>
          </li>
        ))}
      </ul>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold">{t("mapTitle")}</h2>
        <Card>
          <JourneyMap defined={definedPeriods} />
        </Card>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold">{t("activityTitle")}</h2>
        <Card>
          <ActivityMap days={activity} />
        </Card>
      </section>

      <section className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-semibold">{t("achievementsTitle")}</h2>
          <span className="text-xs text-muted-foreground">
            {t("unlockedCount", { unlocked: unlockedCount, total: achievements.length })}
          </span>
        </div>
        <AchievementList achievements={achievements} next={next} />
      </section>
    </div>
  );
}
