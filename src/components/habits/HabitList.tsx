"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { checkInHabit, undoHabitCheckIn } from "@/lib/actions/habits";
import { calculateStreak } from "@/lib/utils/streak";
import { StreakBadge } from "@/components/habits/StreakBadge";
import { Button } from "@/components/ui/Button";
import type { Database } from "@/lib/types/database.types";

type Habit = Database["public"]["Tables"]["habits"]["Row"];

export function HabitList({
  habits,
  today,
}: {
  habits: { habit: Habit; checkinDates: string[] }[];
  today: string;
}) {
  const t = useTranslations("acao");

  if (habits.length === 0) {
    return <p className="text-sm text-muted-foreground">{t("emptyHabits")}</p>;
  }

  return (
    <ul className="space-y-2">
      {habits.map(({ habit, checkinDates }) => {
        const checkedInToday = checkinDates.includes(today);
        const streak = calculateStreak(checkinDates, today);

        return (
          <li
            key={habit.id}
            className="rounded-xl border border-border bg-surface px-4 py-3"
          >
            <div className="flex items-center justify-between gap-3">
              <Link href={`/acao/habitos/${habit.id}`} className="text-sm font-medium">
                {habit.name}
              </Link>
              <StreakBadge streak={streak} />
            </div>
            <div className="mt-2">
              <Button
                variant={checkedInToday ? "secondary" : "primary"}
                className="px-3 py-1.5 text-xs"
                onClick={() =>
                  checkedInToday
                    ? undoHabitCheckIn(habit.id)
                    : checkInHabit(habit.id)
                }
              >
                {checkedInToday ? t("undoCheckIn") : t("checkIn")}
              </Button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
