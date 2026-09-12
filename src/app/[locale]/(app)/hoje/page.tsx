import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { greetingPeriod, todayInTimeZone } from "@/lib/utils/dates";
import { Link } from "@/i18n/navigation";
import { Card } from "@/components/ui/Card";

const GREETING_KEY = {
  morning: "greetingMorning",
  afternoon: "greetingAfternoon",
  evening: "greetingEvening",
} as const;

export default async function HojePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const t = await getTranslations("meuDia");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, timezone")
    .eq("id", user!.id)
    .single();

  const timezone = profile?.timezone ?? "America/Sao_Paulo";
  const today = todayInTimeZone(timezone);
  const period = greetingPeriod(timezone);

  const [{ data: openActions }, { data: habits }, { data: checkins }] =
    await Promise.all([
      supabase
        .from("daily_actions")
        .select("id")
        .eq("user_id", user!.id)
        .eq("due_date", today)
        .is("done_at", null),
      supabase
        .from("habits")
        .select("id")
        .eq("user_id", user!.id)
        .is("archived_at", null),
      supabase
        .from("habit_checkins")
        .select("habit_id")
        .eq("user_id", user!.id)
        .eq("checkin_date", today),
    ]);

  const checkedInHabitIds = new Set((checkins ?? []).map((c) => c.habit_id));
  const pendingHabitsCount = (habits ?? []).filter(
    (h) => !checkedInHabitIds.has(h.id),
  ).length;
  const openActionsCount = openActions?.length ?? 0;

  const name = profile?.display_name || user!.email?.split("@")[0] || "";

  return (
    <div className="mx-auto max-w-2xl space-y-4 px-4 py-6">
      <div>
        <h1 className="text-xl font-semibold">
          {t(GREETING_KEY[period], { name })}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("dailyMessage")}
        </p>
      </div>

      <Card>
        {openActionsCount === 0 && pendingHabitsCount === 0 ? (
          <p className="text-sm text-muted-foreground">{t("emptyToday")}</p>
        ) : (
          <div className="space-y-1 text-sm">
            <p>{t("actionsToday", { count: openActionsCount })}</p>
            <p>{t("habitsToday", { count: pendingHabitsCount })}</p>
          </div>
        )}
        <Link
          href="/acao"
          className="mt-3 inline-block text-sm font-medium text-primary"
        >
          {t("viewActions")} →
        </Link>
      </Card>
    </div>
  );
}
