// src/utils/date.js

const IS_WEEKDAYS_SHORT = ["sun.", "mán.", "þri.", "mið.", "fim.", "fös.", "lau."];
const IS_MONTHS_SHORT = ["jan.", "feb.", "mar.", "apr.", "maí", "jún.", "júl.", "ágú.", "sep.", "okt.", "nóv.", "des."];

function formatIsFallback(d) {
  // Use UTC to avoid timezone edge cases on ISO-only dates
  const wd = d.getUTCDay();
  const day = String(d.getUTCDate()).padStart(2, "0");
  const m = d.getUTCMonth();
  return `${IS_WEEKDAYS_SHORT[wd]} ${day}. ${IS_MONTHS_SHORT[m]}`;
}

export function formatDay(iso, lang = "en") {
  // Parse as UTC date (avoids local TZ shifting when iso is YYYY-MM-DD)
  const d = new Date(`${iso}T00:00:00Z`);

  if (lang !== "is") {
    return new Intl.DateTimeFormat("en-GB", {
      weekday: "short",
      day: "2-digit",
      month: "short",
    }).format(d);
  }

  // Prefer supported Icelandic locale
  const supported = Intl.DateTimeFormat.supportedLocalesOf(["is-IS", "is"], { localeMatcher: "lookup" });
  const locale = supported[0];

  if (!locale) {
    // Hard fallback if Icelandic locale data isn't available
    return formatIsFallback(d);
  }

  return new Intl.DateTimeFormat(locale, {
    weekday: "short",
    day: "2-digit",
    month: "short",
  }).format(d);
}
