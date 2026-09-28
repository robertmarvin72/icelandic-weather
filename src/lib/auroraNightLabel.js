// src/lib/auroraNightLabel.js
//
// Ticket #423 Phase 2 / #427 — pure, date-aware label helpers for the
// multi-night selector/copy. Never touches scoring/classification; only
// turns a (date, daysAhead, lang) triple into localized display text.
//
// #427: weekday names are resolved via a fixed, translated, Sunday-first
// table indexed by getUTCDay() — never via Intl.DateTimeFormat. A real
// #425/#426 browser check showed a headless runtime can silently resolve
// "is-IS" to English locale data, producing "Wednesday"/"Wednesdaykvöld" on
// the Icelandic UI; this deterministic table has no locale-data dependency
// at all, so that failure mode cannot recur regardless of what locales the
// runtime happens to have installed.

const WEEKDAY_KEYS = [
  "nlWeekdaySunday",
  "nlWeekdayMonday",
  "nlWeekdayTuesday",
  "nlWeekdayWednesday",
  "nlWeekdayThursday",
  "nlWeekdayFriday",
  "nlWeekdaySaturday",
];

// Icelandic weekday names (translations.northernLights.js's nlWeekday* keys)
// are regular: every one ends in "-dagur". The genitive-linking stem used in
// real compound words like "föstudagskvöld" (Friday evening) drops "ur" and
// adds "s" — mánudagur -> mánudags, föstudagur -> föstudags, etc. This holds
// for all seven Icelandic weekday names, so the transform is safe to
// generalize rather than hardcoding a per-weekday stem table too.
function icelandicGenitiveWeekdayStem(weekdayNominative) {
  return weekdayNominative.replace(/ur$/, "s");
}

// Sole path for resolving a UTC calendar date's weekday name, for both
// exported helpers below — no duplicate weekday table anywhere else.
function weekdayName(date, t) {
  return t(WEEKDAY_KEYS[date.getUTCDay()]);
}

/**
 * "when" phrase used inside a sentence, e.g. "Good conditions {when}" ->
 * "Good conditions tonight" / "Good conditions Friday night".
 */
export function formatNightWhenLabel({ date, daysAhead, lang, t }) {
  if (daysAhead === 0) return t("nlWhenTonight");
  if (daysAhead === 1) return t("nlWhenTomorrowNight");

  const d = new Date(`${date}T00:00:00Z`);
  const weekday = weekdayName(d, t);
  if (lang === "is") {
    return t("nlWhenWeekdayNight").replace("{weekday}", icelandicGenitiveWeekdayStem(weekday));
  }
  return t("nlWhenWeekdayNight").replace("{weekday}", weekday);
}

/**
 * Short label for a selector tab, e.g. "Tonight" / "Tomorrow night" /
 * "Friday" (weekday only — the tab itself doesn't need "night" appended
 * since it's a proper-noun-style label, not a sentence).
 */
// `lang` is part of this helper's preserved public call-site contract
// (mirrors formatNightWhenLabel's signature) even though tab labels no
// longer need it themselves.
// eslint-disable-next-line no-unused-vars
export function formatNightTabLabel({ date, daysAhead, lang, t }) {
  if (daysAhead === 0) return t("nlTabTonight");
  if (daysAhead === 1) return t("nlTabTomorrow");

  const d = new Date(`${date}T00:00:00Z`);
  return weekdayName(d, t);
}
