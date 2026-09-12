function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Current streak length ending today or yesterday (missing today doesn't
 * break the streak yet — the day isn't over). `checkinDates` are
 * YYYY-MM-DD strings, `today` is the user's local YYYY-MM-DD.
 */
export function calculateStreak(checkinDates: string[], today: string): number {
  if (checkinDates.length === 0) return 0;

  const dates = new Set(checkinDates);
  let cursor = new Date(`${today}T00:00:00.000Z`);

  if (!dates.has(toISODate(cursor))) {
    cursor = addDays(cursor, -1);
  }

  let streak = 0;
  while (dates.has(toISODate(cursor))) {
    streak++;
    cursor = addDays(cursor, -1);
  }

  return streak;
}
