// src/lib/auroraNightQuery.js
//
// Ticket #425 — pure helpers for carrying the selected Aurora night between
// the homepage module and the existing English landing page via a `date`
// query parameter. Window membership (is the date one of today's three
// slots?) is deliberately NOT decided here: only the hook that owns the
// slot dates can know it, and it falls back to tonight when the date is
// outside the window.

export const AURORA_NIGHT_QUERY_PARAM = "date";
export const AURORA_LANDING_PATH = "/en/northern-lights";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Returns the single exact, calendar-valid ISO date in the query, or null
 * for a missing, duplicated, malformed or impossible (e.g. 2026-02-30) value.
 */
export function parseNightQueryDate(searchParams) {
  const values = searchParams.getAll(AURORA_NIGHT_QUERY_PARAM);
  if (values.length !== 1) return null;
  const value = values[0];
  if (!ISO_DATE.test(value)) return null;
  const parsed = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) return null;
  return value;
}

export function buildNightDetailPath(date) {
  return `${AURORA_LANDING_PATH}?${AURORA_NIGHT_QUERY_PARAM}=${date}`;
}

/**
 * Next search params after the selected night changed: replaces every
 * existing `date` value with the selected one, preserving unrelated params.
 */
export function withNightQueryDate(searchParams, date) {
  const next = new URLSearchParams(searchParams);
  next.delete(AURORA_NIGHT_QUERY_PARAM);
  next.set(AURORA_NIGHT_QUERY_PARAM, date);
  return next;
}
