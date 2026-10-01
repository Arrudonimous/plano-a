import "server-only";
import type { createClient } from "@/lib/supabase/server";
import { dateInTimeZone } from "@/lib/utils/dates";
import { longestStreak } from "@/lib/utils/streak";
import type { ObjectivePeriod } from "@/lib/types/database.types";
import {
  buildActivityMap,
  evaluateAchievements,
  nextAchievements,
} from "@/lib/progress/achievements";

type Client = Awaited<ReturnType<typeof createClient>>;

const PAGE_SIZE = 1000;
const MAX_PAGES = 20;

// PostgREST limita cada resposta (1000 linhas); pagina para não truncar o histórico.
async function fetchAll<T>(
  page: (from: number, to: number) => PromiseLike<{ data: T[] | null }>,
): Promise<T[]> {
  const rows: T[] = [];
  for (let i = 0; i < MAX_PAGES; i++) {
    const { data } = await page(i * PAGE_SIZE, (i + 1) * PAGE_SIZE - 1);
    if (!data) break;
    rows.push(...data);
    if (data.length < PAGE_SIZE) break;
  }
  return rows;
}

export async function loadProgress(
  supabase: Client,
  userId: string,
  timeZone: string,
  today: string,
) {
  const [
    { data: dreams },
    { data: objectives },
    checkins,
    doneActions,
    { count: boardItems },
    { count: capsulesSealed },
    affirmationRows,
    gratitudeRows,
  ] = await Promise.all([
    supabase.from("dreams").select("realized_at").eq("user_id", userId),
    supabase.from("objectives").select("period, declaration").eq("user_id", userId),
    fetchAll((from, to) =>
      supabase
        .from("habit_checkins")
        .select("habit_id, checkin_date")
        .eq("user_id", userId)
        .order("checkin_date")
        .order("id")
        .range(from, to),
    ),
    fetchAll((from, to) =>
      supabase
        .from("daily_actions")
        .select("done_at")
        .eq("user_id", userId)
        .not("done_at", "is", null)
        .order("done_at")
        .order("id")
        .range(from, to),
    ),
    supabase
      .from("dream_board_items")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
    supabase
      .from("time_capsules")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
    fetchAll((from, to) =>
      supabase
        .from("affirmations")
        .select("for_date")
        .eq("user_id", userId)
        .order("for_date")
        .order("id")
        .range(from, to),
    ),
    fetchAll((from, to) =>
      supabase
        .from("gratitude_entries")
        .select("entry_date")
        .eq("user_id", userId)
        .order("entry_date")
        .order("id")
        .range(from, to),
    ),
  ]);

  const checkinsByHabit = new Map<string, string[]>();
  for (const { habit_id, checkin_date } of checkins) {
    checkinsByHabit.set(habit_id, [...(checkinsByHabit.get(habit_id) ?? []), checkin_date]);
  }
  const longestHabitStreak = Math.max(
    0,
    ...[...checkinsByHabit.values()].map((dates) => longestStreak(dates)),
  );

  const completedAt = doneActions.flatMap(({ done_at }) => (done_at ? [done_at] : []));
  const actionDates = completedAt.map((doneAt) => dateInTimeZone(new Date(doneAt), timeZone));
  const gratitudeDates = gratitudeRows.map((r) => r.entry_date);
  const activeDates = new Set([
    ...checkins.map((c) => c.checkin_date),
    ...actionDates,
    ...gratitudeDates,
  ]);

  const definedPeriods = (objectives ?? [])
    .filter((o) => o.declaration.trim())
    .map((o) => o.period as ObjectivePeriod);

  const counts = {
    dreamsTotal: dreams?.length ?? 0,
    dreamsRealized: (dreams ?? []).filter((d) => d.realized_at).length,
    objectivesDefined: definedPeriods.length,
    actionsCompleted: completedAt.length,
    longestHabitStreak,
    activeDays: activeDates.size,
    boardItems: boardItems ?? 0,
    capsulesSealed: capsulesSealed ?? 0,
    affirmationDays: new Set(affirmationRows.map((r) => r.for_date)).size,
    gratitudeDays: new Set(gratitudeDates).size,
  };

  const activity = buildActivityMap(activeDates, today);
  const achievements = evaluateAchievements(counts);

  return {
    counts,
    definedPeriods,
    activity,
    activeLast30: activity.slice(-30).filter((d) => d.active).length,
    achievements,
    next: nextAchievements(achievements),
  };
}
