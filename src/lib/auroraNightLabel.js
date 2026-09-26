// src/lib/auroraNightLabel.js
//
// Ticket #423 Phase 2 — pure, date-aware label helpers for the multi-night
// selector/copy. Never touches scoring/classification; only turns a
// (date, daysAhead, lang) triple into localized display text.

// Icelandic weekday names (Intl "is-IS" long form) are regular: every one
// ends in "-dagur". The genitive-linking stem used in real compound words
// like "föstudagskvöld" (Friday evening) drops "ur" and adds "s" —
// mánudagur -> mánudags, föstudagur -> föstudags, etc. This holds for all
// seven Icelandic weekday names, so the transform is safe to generalize
// rather than hardcoding a per-weekday table.
function icelandicGenitiveWeekdayStem(weekdayNominative) {
  return weekdayNominative.replace(/ur$/, "s");
}

function weekdayName(date, lang) {
  const locale = lang === "is" ? "is-IS" : "en-US";
  return new Intl.DateTimeFormat(locale, { weekday: "long", timeZone: "UTC" }).format(date);
}

/**
 * "when" phrase used inside a sentence, e.g. "Good conditions {when}" ->
 * "Good conditions tonight" / "Good conditions Friday night".
 */
export function formatNightWhenLabel({ date, daysAhead, lang, t }) {
  if (daysAhead === 0) return t("nlWhenTonight");
  if (daysAhead === 1) return t("nlWhenTomorrowNight");

  const d = new Date(`${date}T00:00:00Z`);
  const weekday = weekdayName(d, lang);
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
export function formatNightTabLabel({ date, daysAhead, lang, t }) {
  if (daysAhead === 0) return t("nlTabTonight");
  if (daysAhead === 1) return t("nlTabTomorrow");

  const d = new Date(`${date}T00:00:00Z`);
  return weekdayName(d, lang);
}
