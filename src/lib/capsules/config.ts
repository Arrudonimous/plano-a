import { addDaysISO } from "@/lib/utils/dates";

export const CAPSULE_MAX_MESSAGE_LENGTH = 5000;
export const CAPSULE_FREE_MAX_DAYS = 365;
/** Retenção estendida (plano Premium): até 5 anos. */
export const CAPSULE_EXTENDED_MAX_DAYS = 1825;
export const CAPSULE_MAX_DELIVERY_ATTEMPTS = 5;
export const CAPSULE_CLAIM_TIMEOUT_MS = 10 * 60 * 1000;

/** Earliest/latest delivery dates a capsule may use, given the user's "today". */
export function capsuleDateBounds(today: string, extended = false) {
  return {
    min: addDaysISO(today, 1),
    max: addDaysISO(today, extended ? CAPSULE_EXTENDED_MAX_DAYS : CAPSULE_FREE_MAX_DAYS),
    freeMax: addDaysISO(today, CAPSULE_FREE_MAX_DAYS),
  };
}
