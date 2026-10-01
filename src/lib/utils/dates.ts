/** Returns the YYYY-MM-DD calendar date of `date` in the given IANA timezone. */
export function dateInTimeZone(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/** Returns "today" as a YYYY-MM-DD string in the given IANA timezone. */
export function todayInTimeZone(timeZone: string): string {
  return dateInTimeZone(new Date(), timeZone);
}

/** Adds days to a YYYY-MM-DD string, returning YYYY-MM-DD. */
export function addDaysISO(isoDate: string, days: number): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + days))
    .toISOString()
    .slice(0, 10);
}

export type GreetingPeriod = "morning" | "afternoon" | "evening";

export function greetingPeriod(timeZone: string): GreetingPeriod {
  const hour = Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone,
      hour: "numeric",
      hourCycle: "h23",
    }).format(new Date()),
  );

  if (hour < 12) return "morning";
  if (hour < 18) return "afternoon";
  return "evening";
}
