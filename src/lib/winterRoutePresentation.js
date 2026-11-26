// src/lib/winterRoutePresentation.js
//
// Ticket #486 — small, pure presentation helpers for the winter-route page.
// No scoring/classification logic here (that lives server-side, see
// api/_lib/winterRoute/roadConditionCodes.js) — this is formatting only.

export const SEGMENT_CATEGORY_LABEL_KEY = {
  passable: "winterRouteCategoryPassable",
  hazard_notice: "winterRouteCategoryHazardNotice",
  out_of_service: "winterRouteCategoryOutOfService",
  impassable: "winterRouteCategoryImpassable",
  closed: "winterRouteCategoryClosed",
  unknown_unclassified: "winterRouteCategoryUnknownUnclassified",
};

// Icelandic decimal comma vs. English decimal point — same number either
// way, just the separator (CLAUDE.md: "íslenskar kommur").
export function formatDecimal(value, lang, digits = 1) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—";
  const fixed = value.toFixed(digits);
  return lang === "is" ? fixed.replace(".", ",") : fixed;
}

// `hourString` is a fixed "YYYY-MM-DDTHH:00" UTC value from the backend's
// expectedHours list — formatted directly from its own characters, never
// parsed through a Date object, so no local-timezone shift can sneak in.
export function formatHourLabel(hourString) {
  if (typeof hourString !== "string" || hourString.length < 16) return hourString ?? "—";
  const day = hourString.slice(8, 10);
  const month = hourString.slice(5, 7);
  const time = hourString.slice(11, 16);
  return `${day}.${month} ${time}`;
}

// Ticket #492, time-slider, P2 -- a SEPARATE full date/time formatter for
// the new choose-flow time slider only. `formatHourLabel` and the legacy
// `winterRouteHourLabel`/`winterRouteSameForecastTimeNote` keys are
// untouched -- this never replaces them. Uses `Intl.DateTimeFormat` with
// an EXPLICIT `timeZone: "UTC"` (never the machine's own timezone) and
// builds the `Date` from the hour string's own "...:00Z" form, matching
// the same construction `WinterRouteDataView`'s own `availableHours`
// filter already uses elsewhere in this file's caller. Invalid/missing
// input returns the original value unchanged (or "—" for non-strings),
// never a thrown "Invalid Date" and never a fabricated date.
//
// P8 live-browser evidence (time-slider round) found a REAL defect this
// would otherwise ship with: Chromium's own ICU build carries NO
// Icelandic locale data at all -- verified directly in both a real
// installed Chrome and Playwright's own Chromium on this machine,
// `Intl.DateTimeFormat.supportedLocalesOf(["is-IS","is"])` returns `[]`
// -- so `new Intl.DateTimeFormat("is-IS", ...)` never throws, it just
// SILENTLY formats in English. A try/catch alone can't catch this. This
// is the exact same gap `src/utils/date.js`'s own `formatDay()` already
// works around (same `supportedLocalesOf` detection); reused here in
// LONG form (spelled-out weekday/month, matching what a genuinely-
// Icelandic-aware Intl implementation already produces, e.g. Node/
// Firefox) since this caller needs the full date, not `formatDay`'s own
// short "mið. 25. nóv" form.
const IS_WEEKDAYS_LONG = ["sunnudagur", "mánudagur", "þriðjudagur", "miðvikudagur", "fimmtudagur", "föstudagur", "laugardagur"];
const IS_MONTHS_LONG = ["janúar", "febrúar", "mars", "apríl", "maí", "júní", "júlí", "ágúst", "september", "október", "nóvember", "desember"];

function formatIsHourFullFallback(date) {
  const weekday = IS_WEEKDAYS_LONG[date.getUTCDay()];
  const day = date.getUTCDate();
  const month = IS_MONTHS_LONG[date.getUTCMonth()];
  const hh = String(date.getUTCHours()).padStart(2, "0");
  const mm = String(date.getUTCMinutes()).padStart(2, "0");
  return `${weekday}, ${day}. ${month} kl. ${hh}:${mm}`;
}

export function formatWinterRouteHourFull(hourString, lang) {
  if (typeof hourString !== "string") return "—";
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(hourString)) return hourString;
  const date = new Date(`${hourString.slice(0, 16)}:00Z`);
  if (!Number.isFinite(date.getTime())) return hourString;

  if (lang === "is") {
    const supported = Intl.DateTimeFormat.supportedLocalesOf(["is-IS", "is"], { localeMatcher: "lookup" });
    if (!supported[0]) return formatIsHourFullFallback(date);
  }

  try {
    return new Intl.DateTimeFormat(lang === "is" ? "is-IS" : "en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "UTC",
    }).format(date);
  } catch {
    return hourString;
  }
}

// Ticket #492, time-slider, P2/P3(ii) -- the slider's own `aria-valuetext`
// adds an explicit "UTC" suffix to the full label above, so a screen
// reader never implies the machine's local timezone. Never appends "UTC"
// to an unresolved value (no "— UTC"/raw-string-plus-UTC nonsense).
export function formatWinterRouteHourValueText(hourString, lang) {
  const full = formatWinterRouteHourFull(hourString, lang);
  return full === hourString || full === "—" ? full : `${full} UTC`;
}

// Ticket #492, time-slider, P4 (round 1) + P1 (marks-fix round) -- a few
// sparse, readable tick positions for the native range: date-boundary
// crossings and the first/last slot, plus a handful of evenly-spaced
// slots in between, never one per slot (a hidden duplicate of the old
// dropdown). `primary` marks (edges/date-breaks) are meant to be always
// visible; `primary: false` marks are meant to be hidden below the
// caller's own `sm:` breakpoint (a CSS concern, not decided here). Pure
// index/string work, no Intl -- the label itself reuses
// `formatHourLabel`'s own always-numeric, language-independent
// convention ("DD.MM" for a date break, "HH:MM" otherwise).
//
// Round-1's own fixed MAX_MARKS=6 scheme was measured LIVE in Chromium
// (prior evidence run) to actually overlap for spá-windows starting
// near midnight (22/23/02/03/04 UTC -- 5 of 24 possible real start
// hours): a window of 24 one-hour slots always has the SAME mark count
// regardless of where the date-break happens to fall, but two marks
// landing close together around that date-break (e.g. edge + date-break
// only 1-2 slots apart) were never checked against each other for real
// pixel distance. Fixed by replacing the fixed-count scheme with a
// genuine MINIMUM GAP, expressed as a FRACTION of the track (not a
// slot count, which would scale wrong as `n` changes): chosen as
// `MIN_GAP_FRACTION = 0.23`, derived from a measured ~28px-wide "HH:MM"
// label (the widest label this function ever produces) needing >=4px of
// clear space on each side (~32px center-to-center) on a 320px-wide
// mobile track (~142px of usable travel once the 16px thumb-width
// correction on each edge is subtracted) -- 32/142 ~= 0.23. This is
// DELIBERATELY the stricter of the two candidate values Jonesy's own
// measurement implied (0.18 would suffice for 360px alone; 0.23 is
// chosen so 320px -- an information-only reference width, not a hard
// target -- is ALSO clean, never leaving 360px's own real target
// width silently under-protected by optimizing for a narrower case
// instead). The real per-viewport pixel/font measurement that confirms
// this choice lives in evidence/marks-fix/ (P2), not in this pure
// function, which has no DOM access.
const MIN_GAP_FRACTION = 0.23;
// Secondary (non-edge, non-date-break) marks are only ever visible at
// `sm:` and up, where the track is wider -- but this function has no
// way to know the real `sm:` track width, so it reuses the SAME
// conservative fraction for them too rather than a second, smaller
// constant tuned for a wider track. This is intentionally safe (never
// produces a real overlap at any width secondaries are shown at) at the
// cost of a few fewer secondary marks than a width-aware threshold
// could have kept -- an explicit, documented trade-off, not an oversight.
const MAX_TOTAL_MARKS = 8;

export function winterRouteTimeSliderMarks(availableHours) {
  const n = Array.isArray(availableHours) ? availableHours.length : 0;
  if (n === 0) return [];

  const isDateBreak = (i) => i > 0 && availableHours[i].slice(0, 10) !== availableHours[i - 1].slice(0, 10);
  const labelFor = (i) => {
    const h = availableHours[i];
    return i === 0 || isDateBreak(i) ? `${h.slice(8, 10)}.${h.slice(5, 7)}` : h.slice(11, 16);
  };

  if (n === 1) return [{ index: 0, label: labelFor(0), primary: true }];

  // A real distance threshold in INDEX units, derived from the same
  // fraction for every `n` (never a fixed slot count like the old "4")
  // -- this is what makes the minimum PIXEL gap stay roughly constant
  // as the real track divides into more or fewer slots.
  const minIndexGap = Math.max(1, Math.ceil(MIN_GAP_FRACTION * (n - 1)));

  const accepted = [];
  // Greedy accept in PRIORITY order: every date-break first (highest
  // priority, P1(ii): "dagskil hafa forgang fram yfir jaðarmerki"), then
  // the first edge, then the last edge -- each candidate is kept only if
  // it clears `minIndexGap` from every ALREADY-accepted mark; a losing
  // edge is simply dropped, never a date-break that was already kept.
  // Trying the first edge before the last edge is also what keeps the
  // FIRST mark (not the last) when both edges would otherwise collide
  // on a very small `n` (P1(ii)'s own "fyrsta merkingin haldast").
  function tryAccept(index, primary) {
    if (accepted.some((m) => Math.abs(m.index - index) < minIndexGap)) return false;
    accepted.push({ index, label: labelFor(index), primary });
    return true;
  }
  for (let i = 1; i < n; i++) {
    if (isDateBreak(i)) tryAccept(i, true);
  }
  tryAccept(0, true);
  tryAccept(n - 1, true);

  // Secondary marks: evenly spaced candidates, accepted only if clear of
  // EVERY already-accepted mark (primary or secondary) by the same gap.
  if (accepted.length < MAX_TOTAL_MARKS) {
    const step = Math.max(1, Math.round((n - 1) / 6));
    for (let i = step; i < n - 1 && accepted.length < MAX_TOTAL_MARKS; i += step) {
      tryAccept(i, false);
    }
  }

  return accepted.sort((a, b) => a.index - b.index);
}

// `isoString` is a full ISO-8601 UTC instant (e.g. generatedAt).
export function formatTimestamp(isoString) {
  if (typeof isoString !== "string" || isoString.length < 16) return "—";
  return isoString.slice(0, 16).replace("T", " ");
}

// Ticket #503 source-time, P4 -- unlike formatTimestamp's own existing
// "—" fallback (kept unchanged for its current legacy call site),
// formatTimestamp itself does NOT validate the string beyond a length
// check: any garbage string of 16+ characters slices through silently.
// A new line that must be omitted entirely on invalid input (never
// "— UTC") needs an actual validity check first -- this is that check,
// shared by any UTC instant string (generatedAt, roadSections[].export.
// dagsKeyrtUt): real "YYYY-MM-DDTHH:MM" shape AND a real parseable
// instant, not just long enough. Returns the formatted string, or null
// so the caller can skip the line.
export function formatValidatedUtcTimestamp(isoString) {
  if (typeof isoString !== "string") return null;
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(isoString)) return null;
  if (!Number.isFinite(Date.parse(isoString))) return null;
  return formatTimestamp(isoString);
}

// Ticket #503 source-time, P3(d) -- honest cache-age-in-minutes display:
// under 60s is "under a minute" (a confident "0 min" would misleadingly
// imply precision that doesn't exist), otherwise Math.round(ms/60000) --
// the SAME rounding the existing stale-line text already uses, so two
// minute figures shown together in the same view never disagree (floor
// would read "6 min" on the stale line and "5 min" here at x:30-x:59s).
// Returns null for anything that isn't a valid non-negative finite
// duration -- the caller must then omit the line, never fabricate an age
// (a backend `cacheAgeMs ?? 0` on an unavailable feed is a real risk this
// guards against, not a non-issue).
export function cacheAgeMinutesDisplay(cacheAgeMs) {
  if (!Number.isFinite(cacheAgeMs) || cacheAgeMs < 0) return null;
  if (cacheAgeMs < 60000) return { underOneMinute: true, minutes: 0 };
  return { underOneMinute: false, minutes: Math.round(cacheAgeMs / 60000) };
}

// N1 correction: the selected forecast hour's own "HH" digits, read
// directly from the fixed "YYYY-MM-DDTHH:00" UTC string — never through a
// Date object (which would apply the browser's local timezone) — for
// src/lib/weatherPresentation.js's isDaytimeHour()/day-night icon choice.
// Returns null for anything not shaped like a valid hour string, so the
// caller's day/night check falls back to its own default rather than
// guessing a value.
export function hourOfDayFromHourString(hourString) {
  if (typeof hourString !== "string" || hourString.length < 13) return null;
  const hour = Number(hourString.slice(11, 13));
  return Number.isInteger(hour) && hour >= 0 && hour <= 23 ? hour : null;
}

// Ticket #492, P4 (round 1) + P3 (round 3 UX-priority) -- a road section
// needs attention in the overview when it isn't a plain passable section,
// its own data is unavailable, carries any notice at all (active,
// expired, or of unknown validity), OR its own export/registration is
// stale/old (`export.isStale`/`registration.isOld`) -- round 3 extends
// this: a passable section with no notices but stale/old data must not
// silently count toward an "all clear" claim either (P3v), and must stay
// visible without opening the details list (P3iv). Shown regardless of
// category, since road condition and notices are tracked and displayed
// separately and neither is ever hidden because of the other.
export function flaggedRoadSegments(sections) {
  const safe = Array.isArray(sections) ? sections : [];
  return safe.filter(
    (s) =>
      s.category !== "passable" ||
      s.segmentDataAvailable === false ||
      (s.notices ?? []).length > 0 ||
      Boolean(s.export?.isStale) ||
      Boolean(s.registration?.isOld)
  );
}

// Ticket #492, P3(iv) (round 3) -- whether every FLAGGED section shares
// the exact same stale/old combination, so the overview can show ONE
// honest sentence ("all road data here is old") instead of repeating an
// identical badge on every line. Returns null when the flagged list is
// empty, mixed, or any flagged section is flagged for a DIFFERENT reason
// (closure/notice/unavailable-data) rather than staleness alone --
// collapsing a genuinely mixed set (e.g. 2 closed + 1 stale) into one
// blanket "old data" sentence would misstate the closures, so that case
// instead falls through to per-section badges.
export function staleOldUniformity(flaggedSections) {
  const safe = Array.isArray(flaggedSections) ? flaggedSections : [];
  if (safe.length === 0) return null;
  const isStaleOldOnly = (s) =>
    s.category === "passable" &&
    s.segmentDataAvailable !== false &&
    (s.notices ?? []).length === 0 &&
    (Boolean(s.export?.isStale) || Boolean(s.registration?.isOld));
  if (!safe.every(isStaleOldOnly)) return null;
  const first = { isStale: Boolean(safe[0].export?.isStale), isOld: Boolean(safe[0].registration?.isOld) };
  const uniform = safe.every((s) => Boolean(s.export?.isStale) === first.isStale && Boolean(s.registration?.isOld) === first.isOld);
  return uniform ? first : null;
}

// Ticket #492, P5 (round 3 UX-priority) -- strictly scoped prefix-only
// shortening for the choose-flow's own forecast-point labels: a point
// label already of the form "Nærri X"/"Near X" or the Westfjords
// "X — leiðarpunktur"/"X — route point" form, or a plain place name, is
// returned UNCHANGED -- only the specific, repeated
// "Leiðarpunktur nærri "/"Route point near " prefix is stripped down to
// "Nærri "/"Near ". Never touches data/ids/coordinates; used only by
// choose-flow display code, never the legacy view. `lang` picks which
// prefix to look for; an unrecognised shape (no match) passes through
// unchanged, same as a plain town name would.
const POINT_LABEL_PREFIX = {
  is: { from: "Leiðarpunktur nærri ", to: "Nærri " },
  en: { from: "Route point near ", to: "Near " },
};
export function shortenWinterRoutePointLabel(label, lang) {
  if (typeof label !== "string") return label;
  const rule = POINT_LABEL_PREFIX[lang] ?? POINT_LABEL_PREFIX.is;
  return label.startsWith(rule.from) ? rule.to + label.slice(rule.from.length) : label;
}

// Ticket #492, P4 -- "no notices/closures" may only be stated once the
// road+point feeds are confirmed available and fresh (the same signal
// computeActiveNoticeSegmentCount's own `confirmed` flag is built from)
// AND nothing is actually flagged; otherwise the honest "unconfirmed"
// state must be shown instead of a false all-clear.
export function roadOverviewIsConfirmedClear(sections, roadMeta) {
  const confirmed =
    !!roadMeta?.available &&
    !!roadMeta?.segmentsAvailable &&
    !!roadMeta?.pointsAvailable &&
    !roadMeta?.pointsFeedUnavailableOrStale &&
    !roadMeta?.stale;
  return confirmed && flaggedRoadSegments(sections).length === 0;
}
