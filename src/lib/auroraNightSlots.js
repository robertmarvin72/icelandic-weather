// src/lib/auroraNightSlots.js
//
// Ticket #423 Phase 2 — builds the three consecutive UTC evening dates
// (today + 0/1/2 calendar days) from a single captured clock reading, using
// the existing todayEveningUtc convention (src/lib/auroraSeason.js). All
// three dates are derived from ONE Date object so they can never observe a
// rollover mid-computation.

import { todayEveningUtc } from "./auroraSeason";

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * @param {Date} baseDate - a single captured clock reading.
 * @returns {Array<{date: string, daysAhead: number}>} exactly 3 entries.
 */
export function buildThreeEveningSlotDates(baseDate) {
  const baseMs = baseDate.getTime();
  return [0, 1, 2].map((daysAhead) => ({
    date: todayEveningUtc(new Date(baseMs + daysAhead * DAY_MS)),
    daysAhead,
  }));
}
