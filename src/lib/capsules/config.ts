export const CAPSULE_MAX_MESSAGE_LENGTH = 5000;
export const CAPSULE_FREE_MAX_DAYS = 365;
export const CAPSULE_MAX_DELIVERY_ATTEMPTS = 5;
export const CAPSULE_CLAIM_TIMEOUT_MS = 10 * 60 * 1000;

/** Adds days to a YYYY-MM-DD string, returning YYYY-MM-DD. */
export function addDaysISO(isoDate: string, days: number): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + days))
    .toISOString()
    .slice(0, 10);
}

/** Earliest/latest delivery dates a free capsule may use, given the user's "today". */
export function capsuleDateBounds(today: string) {
  return {
    min: addDaysISO(today, 1),
    max: addDaysISO(today, CAPSULE_FREE_MAX_DAYS),
  };
}
