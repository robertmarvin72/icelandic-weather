// src/config/homepageHero.js
//
// Centralized homepage hero presentation configuration (Ticket 411, #411).
// Determines which of three copy variants the Toolbar hero renders, purely
// from the calendar date — the mapping from variant ID to translation keys
// lives here too, so Toolbar.jsx stays free of month conditions.
//
// Date extraction: Iceland does not observe DST and its standard time is
// UTC+0 year-round, so reading a Date's UTC calendar month IS Icelandic
// (Atlantic/Reykjavik) local calendar month here — no timezone conversion
// is needed or correct to add. Same technique, same reasoning, as
// src/lib/auroraSeason.js.
//
// Deliberately independent from auroraSeason.js and scoring.js
// (see approved-prompt-v1.md, #411): auroraSeason.js's own Sept-March
// month boundaries are private module constants, not exported, so this
// config re-states Sept 1 - March 31 as its own literal boundary rather
// than importing them — the two happen to agree by product decision (the
// hero's aurora-mention window was deliberately set to match the feature's
// real gate), not because they share code. Coupling them would make a
// future change to either the marketing calendar or the feature gate
// silently affect the other. scoring.js's getSeasonForDate uses
// browser-local months for score weighting (October-April) — a completely
// different concern (scoring inputs, not presentation copy) that must stay
// unchanged and is not reused here either.

export const HOMEPAGE_HERO_VARIANTS = {
  WINTER_WEATHER_AURORA: "winter_weather_aurora", // September 1 - March 31 (inclusive)
  WINTER_WEATHER: "winter_weather", // April 1 - April 30 (inclusive)
  SUMMER_CAMPING: "summer_camping", // May 1 - August 31 (inclusive)
};

// Deterministic fallback for a missing/invalid date, matching
// scoring.js's getSeasonForDate precedent of defaulting to the
// non-aurora, non-alarming variant rather than throwing or guessing.
const DEFAULT_VARIANT = HOMEPAGE_HERO_VARIANTS.SUMMER_CAMPING;

export function getHomepageHeroVariant(date = new Date()) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return DEFAULT_VARIANT;
  }

  const month = date.getUTCMonth() + 1; // 1-12, Atlantic/Reykjavik calendar (see module header)

  if (month >= 9 || month <= 3) return HOMEPAGE_HERO_VARIANTS.WINTER_WEATHER_AURORA;
  if (month === 4) return HOMEPAGE_HERO_VARIANTS.WINTER_WEATHER;
  return HOMEPAGE_HERO_VARIANTS.SUMMER_CAMPING; // May-August
}

// Maps each variant to its translation keys. Summer reuses the existing,
// unmodified hero keys; the two winter variants share a single CTA key
// (they show the same button label) but have distinct title/subtitle keys.
const HOMEPAGE_HERO_COPY_KEYS = {
  [HOMEPAGE_HERO_VARIANTS.WINTER_WEATHER_AURORA]: {
    titleKey: "heroWinterAuroraTitle",
    subtitleKey: "heroWinterAuroraSubtitle",
    ctaKey: "heroWinterCta",
  },
  [HOMEPAGE_HERO_VARIANTS.WINTER_WEATHER]: {
    titleKey: "heroAprilTitle",
    subtitleKey: "heroAprilSubtitle",
    ctaKey: "heroWinterCta",
  },
  [HOMEPAGE_HERO_VARIANTS.SUMMER_CAMPING]: {
    titleKey: "heroStayMoveTitle",
    subtitleKey: "heroStayMoveSubtitle",
    ctaKey: "heroCta",
  },
};

export function getHomepageHeroCopyKeys(variant) {
  return HOMEPAGE_HERO_COPY_KEYS[variant] ?? HOMEPAGE_HERO_COPY_KEYS[DEFAULT_VARIANT];
}
