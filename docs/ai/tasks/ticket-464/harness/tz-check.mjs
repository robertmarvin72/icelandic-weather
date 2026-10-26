// Ticket #464 — R2 correction. Checks the REAL behaviour of (a) a
// timezone-less local datetime string parsed by `new Date()` and formatted
// via `Intl.DateTimeFormat(..., {hour:"2-digit", minute:"2-digit",
// hour12:false})` (the exact call HourlyForecastModal.jsx's formatHourLabel
// makes), and (b) the real, retained getSeasonForDate from scoring.js, each
// under a different process TZ (set via the OS env var before this process
// starts — Node reads TZ once at startup, so each TZ must be its own
// process; one process per TZ, set via PowerShell $env:TZ, not changed mid-process).
import { register } from "node:module";
register("./esm-ext-loader.mjs", import.meta.url);
const { getSeasonForDate } = await import("../../../../../src/lib/scoring.js");

function formatHourLabel(dateTimeStr, lang) {
  // Exact logic of HourlyForecastModal.jsx:29-42's try branch.
  return new Intl.DateTimeFormat(lang === "is" ? "is-IS" : "en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(dateTimeStr));
}

console.log(`process.env.TZ=${process.env.TZ}  Intl resolved TZ=${Intl.DateTimeFormat().resolvedOptions().timeZone}  node=${process.version}`);

for (const dt of ["2026-10-28T00:00", "2026-10-28T21:00"]) {
  console.log(`  ${dt}  en-GB=${formatHourLabel(dt, "en")}  is-IS=${formatHourLabel(dt, "is")}`);
}

// DST spring-forward nonexistent local time (US 2026: DST begins Sun 2026-03-08
// 02:00 local -> clocks jump to 03:00; 02:00-02:59 does not exist that day).
// Labelled edge counterfactual only; not an October observation.
// Correction (2026-10-26, v3): this line previously fed is-IS the input
// "2026-03-08T02:30" instead of "2026-03-08T02:00", so the earlier printed
// "is-IS=02:30/03:30" was a differing-input artifact, not a locale
// difference. Both locales now format the identical input string.
console.log("  DST-gap counterfactual 2026-03-08T02:00 (only meaningful under an America/* TZ):");
console.log(`    en-GB=${formatHourLabel("2026-03-08T02:00", "en")}  is-IS=${formatHourLabel("2026-03-08T02:00", "is")}`);

console.log("  getSeasonForDate (real, retained scoring.js):");
for (const d of ["2026-10-01", "2026-05-01", "2026-10-27", "2026-10-28"]) {
  console.log(`    ${d} -> ${getSeasonForDate(d)}  (new Date("${d}").getMonth()+1 = ${new Date(d).getMonth() + 1})`);
}
