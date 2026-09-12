/** Returns "today" as a YYYY-MM-DD string in the given IANA timezone. */
export function todayInTimeZone(timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
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
