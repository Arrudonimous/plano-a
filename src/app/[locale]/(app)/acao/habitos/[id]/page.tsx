import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { todayInTimeZone } from "@/lib/utils/dates";
import { calculateStreak } from "@/lib/utils/streak";
import { archiveHabit, checkInHabit, undoHabitCheckIn } from "@/lib/actions/habits";
import { StreakBadge } from "@/components/habits/StreakBadge";
import { Button } from "@/components/ui/Button";

export default async function HabitDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const t = await getTranslations("acao");

  const { data: habit } = await supabase
    .from("habits")
    .select("*")
    .eq("id", id)
    .single();

  if (!habit) notFound();

  const { data: profile } = await supabase
    .from("profiles")
    .select("timezone")
    .eq("id", user!.id)
    .single();
  const timezone = profile?.timezone ?? "America/Sao_Paulo";
  const today = todayInTimeZone(timezone);

  const { data: checkins } = await supabase
    .from("habit_checkins")
    .select("checkin_date")
    .eq("habit_id", id)
    .order("checkin_date", { ascending: false });

  const dates = (checkins ?? []).map((c) => c.checkin_date);
  const streak = calculateStreak(dates, today);
  const checkedInToday = dates.includes(today);

  return (
    <div className="mx-auto max-w-2xl space-y-4 px-4 py-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{habit.name}</h1>
        <StreakBadge streak={streak} />
      </div>

      <p className="text-sm text-muted-foreground">{t("missedDayMessage")}</p>

      <form action={(checkedInToday ? undoHabitCheckIn : checkInHabit).bind(null, id)}>
        <Button type="submit" variant={checkedInToday ? "secondary" : "primary"}>
          {checkedInToday ? t("undoCheckIn") : t("checkIn")}
        </Button>
      </form>

      {dates.length > 0 && (
        <ul className="space-y-1 text-sm text-muted-foreground">
          {dates.slice(0, 30).map((date) => (
            <li key={date}>✓ {date}</li>
          ))}
        </ul>
      )}

      <form action={archiveHabit.bind(null, id)}>
        <Button type="submit" variant="danger">
          {t("archiveHabit")}
        </Button>
      </form>
    </div>
  );
}
