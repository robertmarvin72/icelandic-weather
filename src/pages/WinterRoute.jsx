// src/pages/WinterRoute.jsx
//
// Ticket #486 — winter road + forecast page. Standalone route (own Footer,
// like NorthernLightsLanding.jsx), no login/paywall. Ticket #491 added a
// second route (Rauðavatn–Borgarnes) selectable via a native IS/EN
// `<select>` on this same page (Rauðavatn–Vík stays the default/unchanged
// entrypoint) — fetches /api/winter-route (optionally `?routeId=...`) once
// per selected route, never once-per-mount; see the routeId effect below.
// Hour selection is purely local (no new network request per selection),
// and the list of selectable hours is re-filtered every time the clock
// ticks past one (checked once a minute) without any refetch, so past
// hours simply drop out of the picker on their own.
//
// Ticket #493 — replaced the former per-point ETA model (a distance +
// assumed-speed estimate deciding which fetched hourly slot each point's
// own card showed, plus a ±2h departure-time comparison) with ONE shared
// selected forecast hour (`effectiveHour`, computed at render time below)
// looked up directly in every point's own `hours` array via an exact
// `indexOf` — no distance, no ETA, no per-point time, no arrival-time
// display. `winterRouteEta.js`/`winterRouteComparison.js` and their tests
// were removed entirely (zero remaining consumers once ForecastCard/
// RouteSummary switched to the direct lookup) rather than left dead.

import { useEffect, useMemo, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import Footer from "../components/Footer";
import Brand from "../components/Brand";
import { WeatherIcon } from "../components/WeatherIcon";
import { usePageRouteProps } from "../hooks/usePageRouteProps";
import { useThemeClass } from "../hooks/useThemeClass";
import { resolveWeatherPresentation, isDaytimeHour } from "../lib/weatherPresentation";
import {
  SEGMENT_CATEGORY_LABEL_KEY,
  formatDecimal,
  formatValidatedUtcTimestamp,
  cacheAgeMinutesDisplay,
  hourOfDayFromHourString,
  flaggedRoadSegments,
  roadOverviewIsConfirmedClear,
  staleOldUniformity,
  shortenWinterRoutePointLabel,
  formatWinterRouteHourFull,
  formatWinterRouteHourValueText,
  winterRouteTimeSliderMarks,
} from "../lib/winterRoutePresentation";
import { winterRouteSurfaceDisplayCategory, winterRouteUnknownAdditionCode } from "../lib/winterRouteRoadConditionCodes";
import {
  WINTER_ROUTE_OPTIONS,
  DEFAULT_WINTER_ROUTE_ID,
  resolveDirectPairRouteId,
} from "../lib/winterRouteRoutes";
import {
  WINTER_ROUTE_PLACES,
  WINTER_ROUTE_GROUP_RING,
  WINTER_ROUTE_GROUP_WESTFJORDS,
  WINTER_ROUTE_GROUP_OTHER,
  winterRoutePlaceName,
  winterRoutePlaceMatchesSearch,
} from "../lib/winterRoutePlaces";
import {
  WINTER_ROUTE_OUTCOME,
  classifyWinterRouteGeometryResponse,
  winterRouteHasSelectableOptions,
  winterRouteGeometryOptions,
  winterRouteDisplayVia,
  winterRouteShowsEstimatedConnectorNote,
  winterRouteAccessPointShortFlag,
  winterRouteOptionLabelKey,
} from "../lib/winterRouteGeometryResponse";
import {
  isWinterRouteDataPair,
  isRingOptionPair,
  isRingCompletionPair,
  identityKindFor,
} from "./winterRoutePairClassification";

// Ticket #502 — "Velja staði" default pre-filled pair (the existing ring-
// pilot MVP short route), never auto-requested on mount (P1a): only
// "Sýna leið" fires the first /api/winter-route-geometry request.
const DEFAULT_GEOMETRY_FROM = "reykjavik-raudavatn";
const DEFAULT_GEOMETRY_TO = "selfoss";

// Ticket #492, direct-flow, C1 -- places the geometry endpoint has no
// knowledge of at all; a same-id draft for either must be handled
// entirely client-side (see handleSubmit). The original 11 ids are
// deliberately NOT in this set -- they keep using the real geometry
// endpoint's own existing `same_place` classification unchanged.
const WINTER_ROUTE_CLIENT_SAME_PLACE_IDS = new Set(["vik", "borgarnes"]);

const VEGAGERDIN_LINKS = {
  is: "https://www.vegagerdin.is/upplysingar-og-utgafa/gagnaveita-vegagerdarinnar/",
  en: "https://www.vegagerdin.is/vegagerdin/gagnasafn/vefthjonustur/terms-and-conditions-for-data-services",
};
const OPEN_METEO_TERMS_LINK = "https://open-meteo.com/en/terms";

const CATEGORY_PILL_CLASS = {
  passable_positive:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200",
  passable_neutral: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
  hazard_notice: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200",
  out_of_service: "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200",
  impassable: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200",
  closed: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200",
  unknown_unclassified: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
};

function categoryPillClass(category, positiveStyleEligible) {
  if (category === "passable") return CATEGORY_PILL_CLASS[positiveStyleEligible ? "passable_positive" : "passable_neutral"];
  return CATEGORY_PILL_CLASS[category] || CATEGORY_PILL_CLASS.unknown_unclassified;
}

function useNowTicking(intervalMs = 60000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

// Ticket #503, P3(b) — `edgeSegmentNote` is an optional extra line (never
// passed by the existing Vík/Borgarnes callers, so their own rendering
// stays byte-identical): a short-section caveat so a closure/notice on a
// section carrying under 1% of the route's own total length never reads
// as the whole route's own status.
// Ticket #492, round 3 (UX priority), P3(vi) -- an optional `compact` prop
// (default false/undefined = byte-identical to before, so the legacy
// view and every existing caller that doesn't pass it are untouched):
// when true, a description line that says exactly the same thing as the
// category pill above it (e.g. "Greiðfært" pill + "Greiðfært" own
// description) is suppressed, since showing the identical word twice in
// one card is the literal duplication req2 names. A description that
// says something ELSE is still shown either way.
function SegmentRow({ segment, t, lang, edgeSegmentNote = null, compact = false, hideStaleOldBadges = false }) {
  const name = lang === "en" ? segment.nameEn : segment.nameIs;
  // Ticket #492, direct-flow, P6 -- the pill shows the SURFACE's own
  // category when a known surface was only pulled to "unknown" by an
  // unrelated unclassified point notice (see winterRouteSurfaceDisplayCategory's
  // own doc comment for the full three-way split). `positiveStyleEligible`
  // is left untouched -- it already reflects the backend's own composite
  // category, so a swapped-to-"passable" display here still renders
  // neutral, never green, while an unresolved notice is still present.
  const displayCategory = winterRouteSurfaceDisplayCategory(segment);
  const pillClass = categoryPillClass(displayCategory, segment.positiveStyleEligible);
  const categoryLabel = t(SEGMENT_CATEGORY_LABEL_KEY[displayCategory] || SEGMENT_CATEGORY_LABEL_KEY.unknown_unclassified);
  // Ticket #492, direct-flow round 2, R4(1)/V4 -- an ambiguous segment's
  // own `astandLysing` is just ONE of the contradictory duplicate rows'
  // own text; presenting it as the segment's real surface description
  // would misrepresent a genuinely unresolved conflict as known. Shown
  // instead of (never alongside) the normal description, for every
  // ambiguous segment regardless of its composite category -- including
  // a real closure (V4(1): the closure's own PILL is untouched, since
  // winterRouteSurfaceDisplayCategory never touches a non-"unknown"
  // composite; only this description line changes).
  const description = segment.ambiguous
    ? t("winterRouteConflictingRoadData")
    : lang === "en" ? segment.astandLysingEn : segment.astandLysing;
  const descriptionIsRedundant = compact && !segment.ambiguous && description === categoryLabel;
  // V4(2) -- shown by default (never behind a control), as plain text;
  // null for an ambiguous segment or a known/missing AstandVidbotaruppl.
  const unknownAdditionCode = winterRouteUnknownAdditionCode(segment);

  return (
    <li className="rounded-xl border border-slate-200/70 bg-white/70 px-4 py-3 dark:border-slate-800/70 dark:bg-slate-900/70">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-medium text-slate-800 dark:text-slate-100">{name}</span>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${pillClass}`}>{categoryLabel}</span>
      </div>

      {edgeSegmentNote ? <p className="mt-1 text-xs font-medium text-amber-700 dark:text-amber-300">{edgeSegmentNote}</p> : null}

      {!segment.segmentDataAvailable ? (
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{t("winterRouteSegmentDataUnavailable")}</p>
      ) : (
        <>
          {description && !descriptionIsRedundant ? <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{description}</p> : null}
          {unknownAdditionCode ? (
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              {t("winterRouteUnknownAdditionCode").replace("{code}", unknownAdditionCode)}
            </p>
          ) : null}
          {!hideStaleOldBadges ? (
            <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400">
              {segment.export?.isStale ? <span>{t("winterRouteExportStale")}</span> : null}
              {segment.registration?.isOld ? <span>{t("winterRouteRegistrationOld")}</span> : null}
            </div>
          ) : null}
        </>
      )}

      {segment.notices?.length > 0 ? (
        <ul className="mt-2 space-y-1 border-t border-slate-200/60 pt-2 dark:border-slate-800/60">
          {segment.notices.map((notice) => {
            // Round 3 (R5-1): an expired ALLUR_AKSTUR_BANN notice gets the
            // prominent, explicit "confirm with Vegagerðin" wording instead
            // of the generic small status line — but ONLY when the segment
            // is not ALSO currently closed via some other active source
            // (category "closed" there already carries its own prominent
            // pill/treatment; this notice individually is still expired and
            // keeps saying so, just without the extra emphasis, since the
            // segment-level closure is what should read as current).
            const isProminentExpiredClosure =
              notice.astand === "ALLUR_AKSTUR_BANN" && notice.status === "expired" && segment.category !== "closed";

            if (isProminentExpiredClosure) {
              return (
                <li
                  key={notice.idPunktur ?? `${segment.idButur}-${notice.astand}`}
                  className="rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1.5 text-sm font-semibold text-amber-900 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-200"
                >
                  {t("winterRouteExpiredClosureNoticeProminent")}
                </li>
              );
            }

            // R4(3)/V4(3) -- an unclassified (or any) notice without its
            // own lysing/lysingEn text falls back to its raw `astand`
            // code as plain text, rather than rendering blank.
            const noticeText = (lang === "en" ? notice.lysingEn || notice.lysing : notice.lysing) || notice.astand;
            const statusKey =
              notice.status === "active"
                ? "winterRouteNoticeActive"
                : notice.status === "expired"
                  ? "winterRouteNoticeExpired"
                  : "winterRouteNoticeUnknownValidity";
            // source.md "Sýna tilkynningar beint" / carried P5 -- an
            // active notice's own "— Tilkynning í gildi" suffix is
            // dropped: the notice is already shown by default (it would
            // not be listed at all otherwise), so repeating "in effect"
            // on every line adds no information. "Útrunnin..."/"Óþekktur
            // gildistími" genuinely carry information (they tell the
            // reader NOT to trust this notice as current) and stay.
            return (
              <li key={notice.idPunktur ?? `${segment.idButur}-${notice.astand}`} className="text-xs text-slate-600 dark:text-slate-300">
                <span className="font-medium">{noticeText}</span>
                {notice.status !== "active" ? <> — {t(statusKey)}</> : null}
              </li>
            );
          })}
        </ul>
      ) : null}
    </li>
  );
}

// Ticket #492, round 3 (UX priority), P1(e)/P2 — a single accessible
// combobox per Frá/Til field, replacing the former separate search-input
// + native-<select> pair (no custom combobox framework/dependency).
//
// `query` (the visible typed text) and the confirmed `value` (placeId,
// owned by the parent) are STRICTLY separate: typing alone never commits
// a selection, so a half-typed/ambiguous string can never silently reuse
// a stale confirmed id (P2a). Only a real selection -- mouse/touch click,
// or Enter on a highlighted option -- calls `onChange`. On blur/Escape
// without a fresh selection, the field reverts to its last confirmed
// place's own name (documented choice; the alternative the prompt also
// allowed was a dedicated "missing selection" state, not needed here
// since the field always already holds a valid confirmed id to revert
// to -- there is no "empty" draft state in this form). The swap button
// (P3(d)) needs no separate "swap while mid-edit" branch either: it only
// ever reads/writes the parent's own confirmed draftFrom/draftTo, never a
// field's in-progress `query` text, so a half-typed string is simply
// discarded -- the field's displayed text re-syncs to its (new) confirmed
// place via the effect above the moment `value` itself changes, whether
// or not a blur happened to fire first.
//
// Options carry `data-place-id` (stable, language-independent) alongside
// their ARIA role, and the input itself exposes the confirmed id via
// `data-selected-place-id` -- both test-only hooks, read by nothing in
// the component itself, kept so tests can assert the real confirmed
// selection without depending on display-name text.
function PlaceField({ idPrefix, label, searchLabel, noResultsText, value, onChange, lang, t }) {
  const [query, setQuery] = useState(() => winterRoutePlaceName(value, lang));
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  // `query` always holds the input's own displayed text (including the
  // confirmed place's full name right after opening, before any typing),
  // but filtering by THAT text would hide every other place the instant
  // the field opens. `filtering` tracks whether the user has actually
  // typed since the field opened -- false means "show the complete list",
  // true means "filter by query" -- so opening via focus/click always
  // shows all 11 places (like the old native <select> always did), and
  // only an actual keystroke narrows it.
  const [filtering, setFiltering] = useState(false);

  // Re-sync the displayed text to the CONFIRMED place whenever it changes
  // from outside this keystroke (a real selection here, or an external
  // reset such as the swap button) -- never a reaction to the user's own
  // typing, since `value` itself doesn't change while typing.
  useEffect(() => {
    setQuery(winterRoutePlaceName(value, lang));
  }, [value, lang]);

  const inputId = `${idPrefix}-input`;
  const listboxId = `${idPrefix}-listbox`;
  const matches = filtering ? WINTER_ROUTE_PLACES.filter((p) => winterRoutePlaceMatchesSearch(p, lang, query)) : WINTER_ROUTE_PLACES;
  const hasNoRealMatches = matches.length === 0;
  const ringPlaces = matches.filter((p) => p.group === WINTER_ROUTE_GROUP_RING);
  const westfjordsPlaces = matches.filter((p) => p.group === WINTER_ROUTE_GROUP_WESTFJORDS);
  const otherPlaces = matches.filter((p) => p.group === WINTER_ROUTE_GROUP_OTHER);
  const flat = [...ringPlaces, ...westfjordsPlaces, ...otherPlaces];
  const activeOption = activeIndex >= 0 ? flat[activeIndex] : null;

  function commit(place) {
    onChange(place.id);
    setQuery(lang === "en" ? place.nameEn : place.nameIs);
    setOpen(false);
    setActiveIndex(-1);
    setFiltering(false);
  }

  function revert() {
    setQuery(winterRoutePlaceName(value, lang));
    setOpen(false);
    setActiveIndex(-1);
    setFiltering(false);
  }

  function handleKeyDown(e) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) {
        setOpen(true);
        setActiveIndex(0);
        return;
      }
      setActiveIndex((i) => Math.min(flat.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (open) setActiveIndex((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter") {
      // Never let Enter submit the surrounding form while an option is
      // highlighted -- only a real commit, never an accidental submit.
      if (open && activeOption) {
        e.preventDefault();
        commit(activeOption);
      }
    } else if (e.key === "Escape") {
      if (open) {
        e.preventDefault();
        revert();
      }
    }
  }

  function renderOption(p, index) {
    const isActive = index === activeIndex;
    return (
      <div
        key={p.id}
        id={`${idPrefix}-option-${p.id}`}
        role="option"
        aria-selected={p.id === value}
        data-place-id={p.id}
        // Mouse/touch selection fires on mousedown (preventDefault so the
        // input's own blur-revert never runs first and destroys the list
        // before the click lands) -- the actual commit still happens on
        // click, so a drag-off-and-release never selects.
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => commit(p)}
        className={`cursor-pointer px-3 py-2 text-sm ${
          isActive ? "bg-sky-100 dark:bg-sky-900/40" : "hover:bg-slate-50 dark:hover:bg-slate-800"
        }`}
      >
        {lang === "en" ? p.nameEn : p.nameIs}
      </div>
    );
  }

  return (
    <div>
      <label htmlFor={inputId} className="text-sm font-medium text-slate-700 dark:text-slate-200">
        {label}
      </label>
      <div className="relative mt-1">
        <input
          id={inputId}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={open && activeOption ? `${idPrefix}-option-${activeOption.id}` : undefined}
          placeholder={searchLabel}
          value={query}
          data-selected-place-id={value}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setFiltering(true);
            setActiveIndex(0);
          }}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            if (open) revert();
          }}
          autoComplete="off"
          // Ticket #492 round 3, P2 -- >=16px to avoid iOS Safari's
          // auto-zoom-on-focus for any input under 16px.
          className="block w-full max-w-xs rounded-lg border border-slate-300 bg-white px-3 py-2 text-base focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 dark:border-slate-700 dark:bg-slate-900"
        />
        {open ? (
          <div
            id={listboxId}
            role="listbox"
            aria-label={label}
            className="absolute z-10 mt-1 max-h-60 w-full max-w-xs overflow-auto rounded-lg border border-slate-300 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-900"
          >
            {hasNoRealMatches ? (
              <div className="px-3 py-2 text-sm text-slate-500 dark:text-slate-400">{noResultsText}</div>
            ) : (
              <>
                {ringPlaces.length > 0 ? (
                  <div role="group" aria-label={t("winterRouteGroupRingLabel")}>
                    {ringPlaces.map((p) => renderOption(p, flat.indexOf(p)))}
                  </div>
                ) : null}
                {westfjordsPlaces.length > 0 ? (
                  <div role="group" aria-label={t("winterRouteGroupWestfjordsLabel")}>
                    {westfjordsPlaces.map((p) => renderOption(p, flat.indexOf(p)))}
                  </div>
                ) : null}
                {otherPlaces.length > 0 ? (
                  <div role="group" aria-label={t("winterRouteGroupOtherLabel")}>
                    {otherPlaces.map((p) => renderOption(p, flat.indexOf(p)))}
                  </div>
                ) : null}
              </>
            )}
          </div>
        ) : null}
      </div>
      <p role="status" aria-live="polite" className="mt-1 text-xs text-slate-500 dark:text-slate-400">
        {hasNoRealMatches && open ? noResultsText : ""}
      </p>
    </div>
  );
}

// Ticket #502, P5/P6 — the result body for a `geometry_only`/`same_place`
// outcome. Deliberately never renders `lengthNote`/`options[].label`/
// `coordinates`/`slices`/`idButurIds`/`geometryId`/`regionVersion`/
// `datasetVersion` (P5g) — only the small set of fields this function
// itself reads below ever reaches the DOM.
function GeometryResultView({ outcome, payload, applied, t, lang, onSelectOption, dataConnected = false }) {
  const fromName = winterRoutePlaceName(applied.from, lang);
  const toName = winterRoutePlaceName(applied.to, lang);

  if (outcome === WINTER_ROUTE_OUTCOME.SAME_PLACE) {
    const shortFlag = winterRouteAccessPointShortFlag(payload, applied.from);
    return (
      <div>
        <p className="font-medium text-slate-800 dark:text-slate-100">{fromName}</p>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{t("winterRouteSamePlaceMessage")}</p>
        {shortFlag ? <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{t("winterRouteApproachShortNote")}</p> : null}
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{t("winterRouteAccessPointDisclaimer")}</p>
      </div>
    );
  }

  // GEOMETRY_ONLY
  const hasOptions = winterRouteHasSelectableOptions(payload);
  const options = winterRouteGeometryOptions(payload);
  const via = winterRouteDisplayVia(payload);
  const showConnectorNote = winterRouteShowsEstimatedConnectorNote(payload);
  const fromShort = winterRouteAccessPointShortFlag(payload, applied.from);
  const toShort = winterRouteAccessPointShortFlag(payload, applied.to);

  return (
    <div>
      <p className="font-medium text-slate-800 dark:text-slate-100">
        {fromName} → {toName}
      </p>

      {hasOptions ? (
        <div className="mt-2">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{t("winterRouteOptionsLabel")}</span>
          <div role="radiogroup" aria-label={t("winterRouteOptionsLabel")} className="mt-1 flex flex-wrap gap-2">
            {options.map((opt) => (
              <button
                key={opt.id}
                type="button"
                role="radio"
                data-route-option={opt.id}
                tabIndex={payload.selectedOption === opt.id ? 0 : -1}
                onKeyDown={(e) => {
                  const moves = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
                  if (!moves[e.key]) return;
                  e.preventDefault();
                  const next = options[(options.indexOf(opt) + moves[e.key] + options.length) % options.length];
                  e.currentTarget.parentElement.querySelector(`[data-route-option="${next.id}"]`)?.focus();
                  onSelectOption(next.id);
                }}
                aria-checked={payload.selectedOption === opt.id}
                onClick={() => onSelectOption(opt.id)}
                className={`rounded-lg border px-3 py-1.5 text-sm ${
                  payload.selectedOption === opt.id
                    ? "border-sky-500 bg-sky-50 text-sky-800 dark:border-sky-500 dark:bg-sky-950/40 dark:text-sky-200"
                    : "border-slate-300 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                }`}
              >
                {t(winterRouteOptionLabelKey(opt.id))}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {via.length > 0 ? (
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{t("winterRouteViaLabel").replace("{via}", via.join(", "))}</p>
      ) : null}

      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
        {dataConnected ? t("winterRouteDataConnectedDisclaimer") : t("winterRouteBaseDisclaimer")}
      </p>
      {showConnectorNote ? <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{t("winterRouteEstimatedConnectorNote")}</p> : null}
      {fromShort || toShort ? <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{t("winterRouteApproachShortNote")}</p> : null}
      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{t("winterRouteAccessPointDisclaimer")}</p>
    </div>
  );
}

// Pair classification (Westfjords/ring-option/ring-completion) lives in its
// own module, not here -- see winterRoutePairClassification.js's own
// header for why (keeps this file exporting only the page component, and
// lets the repo-checked front/back parity test import it directly).

// P4(c) ring-options -- an edge segment's own percent-of-route can round
// to "0.0%" on a ~1200km route (the ring absolute-length rule flags
// segments far below 0.05% of the total). Never show "0,0%"/"0.0%": fall
// back to a plain, honest "very short part of the route" sentence
// instead, for ring routes without changing the Westfjords 1%-based text.
function edgeSegmentNoteFor(section, t, lang) {
  if (!section.isEdgeSegment) return null;
  const percentText = formatDecimal(section.routeLengthFraction * 100, lang, 1);
  if (percentText === "0,0" || percentText === "0.0") return t("winterRouteEdgeSegmentNoteShort");
  return t("winterRouteEdgeSegmentNote").replace("{percent}", percentText);
}

// P3 -- exactly one of three identity shapes may be present, matching
// what this specific pair is classified as; never a blended/mismatched
// response (e.g. a generic ring-completion pair must never carry
// selectedOption/policyVersion/regionVersion, even if datasetVersion is
// also correct).
function hasValidIdentityShape(data, from, to) {
  const kind = identityKindFor(from, to);
  const nonEmpty = (value) => typeof value === "string" && value.trim().length > 0;
  const noRegion = data.regionVersion === undefined;
  const noOption = data.selectedOption === undefined && data.policyVersion === undefined;
  if (kind === "region") return nonEmpty(data.regionVersion) && noOption && data.datasetVersion === undefined;
  if (kind === "option") return noRegion && nonEmpty(data.datasetVersion) && nonEmpty(data.policyVersion) && (data.selectedOption === "south" || data.selectedOption === "north");
  if (kind === "generic") return nonEmpty(data.datasetVersion) && noRegion && noOption;
  return false;
}

// Ticket #492, direct-flow, C4 -- shared by every identity kind (not a
// second copy for the new "fixed" kind): a road section whose own
// `segmentDataAvailable` is `false` may be missing `registration`
// (ONLY that field -- `notices`/`export` are still required
// unconditionally). The real `/api/winter-route`/`/api/winter-route-
// data` handlers' own "segment not found in the feed" branch never sets
// `registration` at all (there is no registration date for a segment
// the feed doesn't even mention) -- requiring it unconditionally meant
// a real, correctly-shaped "data unavailable for this section" response
// was rejected outright as a validation failure, turning an honest
// partial-data state into a generic error for the whole route. This
// previously affected every pair (not just the two new fixed routes);
// fixing it here fixes it everywhere `validRouteData`/
// `validFixedRouteData` are used, not a parallel exception.
function validRoadSectionsShape(sections) {
  return Array.isArray(sections) && sections.every((section) =>
    section && Array.isArray(section.notices) && section.export &&
    (section.segmentDataAvailable === false || section.registration)
  );
}

function validForecastShape(forecast) {
  return forecast && typeof forecast.available === "boolean" && (!forecast.available || (
    Array.isArray(forecast.window?.expectedHours) &&
    forecast.window.expectedHours.every((h) => typeof h === "string" && Number.isFinite(Date.parse(`${h}:00Z`))) &&
    Array.isArray(forecast.points) && forecast.points.every((point) => point && typeof point.available === "boolean" &&
      (!point.available || (Array.isArray(point.hours) && point.series &&
        ["temperature_2m", "wind_speed_10m", "wind_gusts_10m", "precipitation", "weather_code"].every((key) => Array.isArray(point.series[key])))))
  ));
}

// Validate the fields consumed by the data view before accepting a response.
function validRouteData(data, from, to, geometryId) {
  if (!data || data.from !== from || data.to !== to || data.geometryId !== geometryId ||
      !hasValidIdentityShape(data, from, to) ||
      !validRoadSectionsShape(data.roadSections) || !data.roadMeta || typeof data.roadMeta.available !== "boolean") return false;
  return validForecastShape(data.forecast);
}

// Ticket #492, direct-flow, C3 -- the 4th identity kind: a real `/api/
// winter-route?routeId=...` response reused AS-IS for the choose-flow
// (no geometryId/region/option/dataset/policy fields exist for these two
// routes at all -- their PRESENCE is rejected, not just their absence
// tolerated, so a blended/wrong-generation response is never accepted).
// `route` is the frontend's own WINTER_ROUTE_OPTIONS entry (routeId/
// expectedPointCount/pointIdOrder/idButurOrder) -- the point/segment
// COUNT, IDs and ORDER must all match exactly; normalization adds
// nothing (no fabricated routeLengthM/isEdgeSegment/chainageKm/
// geometryId, per C3's own "bætir engu við").
function validFixedRouteData(data, routeId, route) {
  if (!data || data.routeId !== routeId || data.expectedPointCount !== route.expectedPointCount) return false;
  if (data.geometryId !== undefined || data.regionVersion !== undefined || data.selectedOption !== undefined ||
      data.datasetVersion !== undefined || data.policyVersion !== undefined) return false;
  if (!validRoadSectionsShape(data.segments) || data.segments.length !== route.idButurOrder.length ||
      !data.segments.every((s, i) => s.idButur === route.idButurOrder[i])) return false;
  if (!data.roadMeta || typeof data.roadMeta.available !== "boolean") return false;
  if (!validForecastShape(data.forecast)) return false;
  if (data.forecast.available) {
    if (data.forecast.points.length !== route.pointIdOrder.length) return false;
    if (!data.forecast.points.every((p, i) => p.id === route.pointIdOrder[i])) return false;
  }
  return true;
}

// Ticket #492, direct-flow, C1/P4/P5, source.md "Sýna tilkynningar beint,
// án tvítekninga" -- the road/closures overview for the "Velja staði"
// data view, module-level. Shows FIRST, above the weather table: feed-
// level flags, the real road release time (req5, kept visible in the
// main view -- cache age moves to "Um gögnin" below), a compact count-
// based summary ("N kaflar með tilkynningum" / honest "ekki staðfest",
// never a green "all clear" unless genuinely confirmed clean with no
// stale/old data either), and ONE dense default list of every FLAGGED
// section (closed/unconfirmed/stale/no-data/with-notices, in driving
// order) using the SAME `SegmentRow` card the full list uses -- so a
// flagged section's actual notice CONTENT is visible directly, never
// just a name+pill chip repeating what a second list would say. Exactly
// ONE control ("Sjá alla vegkafla") toggles to the full section list
// (ALL sections, same renderer, same driving order); the two lists are
// never both mounted at once (only one <ol> renders at a time), so a
// section can never appear twice in the DOM simultaneously. The former
// separate "Sjá tilkynningar" action/filter and the former name-only
// `FlaggedSegmentChip` card are both removed entirely (no remaining
// callers) -- this redesign replaces them, it does not add to them.
function RoadOverviewSection({ data, roadExportedAtText, t, lang, sectionCoverageNote = false }) {
  const flagged = useMemo(() => flaggedRoadSegments(data.roadSections), [data.roadSections]);
  const allClear = roadOverviewIsConfirmedClear(data.roadSections, data.roadMeta);
  const uniformStaleOld = useMemo(() => staleOldUniformity(flagged), [flagged]);
  // P3(i)/(v)/carried -- compact count of DISTINCT sections carrying at
  // least one real notice, regardless of that notice's own status
  // (active/expired/unknown-validity all count the section once); a
  // section is never counted just because its own category happens to
  // be unknown with no real notice attached.
  const noticeCount = useMemo(() => flagged.filter((s) => (s.notices ?? []).length > 0).length, [flagged]);
  // The same "feeds are trustworthy right now" signal roadOverviewIsConfirmedClear
  // itself requires before it will ever say "clear" -- reused directly so
  // the summary line never contradicts it.
  const confirmed =
    !!data.roadMeta?.available &&
    !!data.roadMeta?.segmentsAvailable &&
    !!data.roadMeta?.pointsAvailable &&
    !data.roadMeta?.pointsFeedUnavailableOrStale &&
    !data.roadMeta?.stale;

  const [detailsOpen, setDetailsOpen] = useState(false);
  const visibleSections = detailsOpen ? data.roadSections : flagged;

  return (
    <section>
      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">{t("winterRouteRoadSectionTitle")}</h3>
      {/* Ticket #492, time-slider, P5(ii)/marks-fix P4(i) -- a new,
          separate i18n line (never the legacy
          `winterRouteSameForecastTimeNote`/`winterRouteHourLabel` keys),
          INSIDE this section's own <section> (not a sibling in the
          caller) so it is genuinely reachable via `closest("section")`
          from this heading, as the approved prompt's own test
          requires: the road section is explicitly time-independent, so
          a user reading "Nýjasta færðarstaða..." never mistakes a
          stale/unavailable road badge for a forecast of future
          conditions at the selected time. */}
      <p className="mt-2 text-xs italic text-slate-500 dark:text-slate-400">{t("winterRouteRoadCurrentRegardlessOfTimeNote")}</p>
      {/* Ticket #492, direct-flow, C5 -- Borgarnes-only: the reused
          IDBUTUR road data covers a longer stretch than this route's own
          actual drive (see winterRouteRoutes.js's own header comment). */}
      {sectionCoverageNote ? (
        <p className="mt-2 text-xs italic text-slate-500 dark:text-slate-400">{t("winterRouteSectionCoverageNote")}</p>
      ) : null}
      {!data.roadMeta.available ? <p className="mt-2 text-sm text-slate-500">{t("winterRouteRoadFeedUnavailable")}</p> : null}
      {/* req5/P6(iv) -- the overall road-feed staleness stays visible
          OUTSIDE the details list, more prominent than any internal
          timestamp (which lives only in "Um gögnin" below). */}
      {data.roadMeta.stale ? (
        <p className="mt-2 text-xs text-amber-600 dark:text-amber-300">{t("winterRouteRoadStaleServed").replace("{minutes}", String(Math.round((data.roadMeta.cacheAgeMs || 0) / 60000)))}</p>
      ) : null}
      {data.roadMeta.pointsFeedUnavailableOrStale ? (
        <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
          {t("winterRoutePointsFeedUnavailable")}
        </p>
      ) : null}
      {/* req5 -- the real Vegagerðin release time stays visible in the
          main view; internal cache-age/response-prepared timestamps are
          now only in "Um gögnin" below (never duplicated here). */}
      {roadExportedAtText ? (
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{t("winterRouteRoadExportedAtLine").replace("{time}", roadExportedAtText)}</p>
      ) : (
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{t("winterRouteRoadReleaseTimeUnknown")}</p>
      )}

      {/* P3(i)/(v) -- compact count of DISTINCT sections carrying a
          notice, never the raw notice count, only stated as a number
          when the underlying feed is actually confirmed; a genuine
          all-clear only when confirmed AND nothing at all is flagged
          (reuses roadOverviewIsConfirmedClear's own stricter definition,
          P4 round 1 + round 3 P3v); when confirmed but something besides
          notices is flagged (e.g. a closure with no notice of its own),
          the list below already says so -- no separate summary line. */}
      {!confirmed ? (
        <p className="mt-2 text-sm font-medium text-slate-700 dark:text-slate-200">{t("winterRouteRoadOverviewUnconfirmed")}</p>
      ) : allClear ? (
        <p className="mt-2 text-sm font-medium text-slate-700 dark:text-slate-200">{t("winterRouteRoadOverviewAllClear")}</p>
      ) : noticeCount > 0 ? (
        <p className="mt-2 text-sm font-medium text-slate-700 dark:text-slate-200">
          {noticeCount === 1 ? t("winterRouteRoadSummaryCountOne") : t("winterRouteRoadSummaryCount").replace("{count}", String(noticeCount))}
        </p>
      ) : null}

      {/* P3(iv) -- one shared sentence when every flagged section is
          flagged for the exact same stale/old reason and nothing else;
          otherwise each row below carries its own short per-row text
          (SegmentRow's own stale/old lines, suppressed here via
          hideStaleOldBadges so the reason is never stated twice). */}
      {uniformStaleOld ? (
        <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">{t("winterRouteRoadAllDataOld")}</p>
      ) : null}

      <p className="mt-3">
        <button
          type="button"
          aria-expanded={detailsOpen}
          aria-controls="winter-route-road-details"
          onClick={() => setDetailsOpen((open) => !open)}
          className="text-sm font-medium text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300"
        >
          {t("winterRouteViewAllSectionsAction")}
        </button>
      </p>

      <div id="winter-route-road-details">
        {detailsOpen ? (
          <h4 className="mt-3 text-sm font-medium text-slate-700 dark:text-slate-200">{t("winterRouteAllSectionsHeading")}</h4>
        ) : null}
        {visibleSections.length > 0 ? (
          <ol className="mt-3 space-y-2">
            {visibleSections.map((section) => (
              <SegmentRow
                key={section.idButur}
                segment={section}
                t={t}
                lang={lang}
                edgeSegmentNote={edgeSegmentNoteFor(section, t, lang)}
                compact
                hideStaleOldBadges={uniformStaleOld}
              />
            ))}
          </ol>
        ) : null}
      </div>
    </section>
  );
}

// Ticket #492, round 3 (UX priority), P4 -- ONE mounted DOM shape (option
// A: a single CSS-reflowed representation, never two markups where only
// one is mounted/hidden): a `role="table"` built from plain `div`s, since
// giving a real `<table>`'s rows `display:grid` for the desktop layout
// would strip their native table semantics in some browsers (P4's own
// warning) -- explicit `role="table"/"row"/"columnheader"/"cell"` keeps
// it a real accessible table at every width. At `md:` and up, each row
// becomes a 6-column CSS grid (Staður/Veður/Hiti/Vindur/Hviður/Úrkoma,
// real synchronised columns, req3); below `md:`, the exact same divs
// simply stack as blocks, with a per-cell mobile-only label (hidden at
// `md:`, where the shared column header already names it) so every value
// stays legible without opening/zooming anything. The SAME six `role=
// "cell"` elements exist at every width -- nothing is duplicated or
// swapped out by JS/matchMedia.
const WR_GRID = "md:grid md:grid-cols-[2fr_1.3fr_0.8fr_0.8fr_0.9fr_0.9fr] md:items-center md:gap-3";

function WinterRouteGridCellLabel({ t, labelKey }) {
  return <span className="mr-1 text-xs font-medium text-slate-500 dark:text-slate-400 md:hidden">{t(labelKey)}:</span>;
}

function WinterRoutePointRow({ point, effectiveHour, t, lang }) {
  // Ticket #492, P5 (round 3) -- choose-flow-only display shortening
  // ("Leiðarpunktur nærri X" -> "Nærri X"); the point's own id/coords/
  // labelIs/labelEn are untouched, this only affects what is rendered.
  const label = shortenWinterRoutePointLabel(lang === "en" ? point.labelEn : point.labelIs, lang);

  if (!point.available) {
    return (
      <div role="row" className={`border-b border-slate-100 py-2 dark:border-slate-900 ${WR_GRID}`}>
        <div role="cell" className="font-medium text-slate-800 dark:text-slate-100">
          <span className="break-words">{label}</span>
        </div>
        <div role="cell" className="mt-1 text-slate-500 dark:text-slate-400 md:col-span-5 md:mt-0">{t("winterRoutePointUnavailable")}</div>
      </div>
    );
  }

  const hourIndex = effectiveHour != null ? point.hours.indexOf(effectiveHour) : -1;
  const hasHour = hourIndex >= 0;
  const temp = hasHour ? point.series.temperature_2m[hourIndex] : null;
  const wind = hasHour ? point.series.wind_speed_10m[hourIndex] : null;
  const gust = hasHour ? point.series.wind_gusts_10m[hourIndex] : null;
  const precip = hasHour ? point.series.precipitation[hourIndex] : null;
  const code = hasHour ? point.series.weather_code[hourIndex] : null;
  const hourOfDay = hasHour ? hourOfDayFromHourString(point.hours[hourIndex]) : null;
  const presentation = resolveWeatherPresentation(code, { isDay: isDaytimeHour(hourOfDay) });

  if (!hasHour) {
    return (
      <div role="row" className={`border-b border-slate-100 py-2 dark:border-slate-900 ${WR_GRID}`}>
        <div role="cell" className="font-medium text-slate-800 dark:text-slate-100">
          <span className="break-words">{label}</span>
        </div>
        <div role="cell" className="mt-1 text-slate-500 dark:text-slate-400 md:col-span-5 md:mt-0">{t("winterRouteForecastNotAvailableAtComputedTime")}</div>
      </div>
    );
  }

  // P4 -- "Merki tengd eigin gildi": each value is its own `role="cell"`,
  // directly paired with its own mobile label AND the shared column
  // header at `md:` (never a swapped/mismatched pairing); value and unit
  // always stay in ONE text node (P2d unchanged in spirit from round 2).
  return (
    <div role="row" className={`border-b border-slate-100 py-2 dark:border-slate-900 ${WR_GRID}`}>
      <div role="cell" className="font-medium text-slate-800 dark:text-slate-100">
        <span className="break-words">{label}</span>
      </div>
      <div role="cell" className="mt-1 flex items-center gap-1.5 md:mt-0">
        <WinterRouteGridCellLabel t={t} labelKey="winterRouteTableColumnWeather" />
        {!presentation.isUnknown ? (
          <WeatherIcon iconId={presentation.iconId} aria-hidden="true" className="h-6 w-6 shrink-0" />
        ) : null}
        <span className="whitespace-nowrap">{presentation.isUnknown ? t("winterRouteUnknownWeatherSymbol") : t(presentation.textKey)}</span>
      </div>
      <div role="cell" className="mt-1 md:mt-0">
        <WinterRouteGridCellLabel t={t} labelKey="winterRouteTableColumnTemp" />
        <span className="whitespace-nowrap">{temp == null ? "—" : `${formatDecimal(temp, lang, 1)} °C`}</span>
      </div>
      <div role="cell" className="mt-1 md:mt-0">
        <WinterRouteGridCellLabel t={t} labelKey="winterRouteTableColumnWind" />
        <span className="whitespace-nowrap">{wind == null ? "—" : `${formatDecimal(wind, lang, 1)} m/s`}</span>
      </div>
      <div role="cell" className="mt-1 md:mt-0">
        <WinterRouteGridCellLabel t={t} labelKey="winterRouteTableColumnGust" />
        <span className="whitespace-nowrap">{gust == null ? "—" : `${formatDecimal(gust, lang, 1)} m/s`}</span>
      </div>
      <div role="cell" className="mt-1 md:mt-0">
        <WinterRouteGridCellLabel t={t} labelKey="winterRouteTableColumnPrecip" />
        <span className="whitespace-nowrap">{precip == null ? "—" : `${formatDecimal(precip, lang, 1)} mm`}</span>
      </div>
    </div>
  );
}

// Ticket #492, round 3 (UX priority), P4 -- the 6-column header row,
// visible only at `md:` and up (mobile relies on each cell's own inline
// label instead, see WinterRouteGridCellLabel) but always present in the
// DOM -- this is still the SAME mounted shape, just visually collapsed
// below `md:` via CSS, not a second structure.
function WinterRoutePointsTable({ points, effectiveHour, t, lang, headingId }) {
  return (
    <div role="table" aria-labelledby={headingId} className="mt-3 text-sm">
      <div role="row" className={`hidden border-b border-slate-300 pb-1.5 text-left text-xs font-medium text-slate-500 dark:border-slate-700 dark:text-slate-400 ${WR_GRID}`}>
        <div role="columnheader">{t("winterRouteTableColumnPlace")}</div>
        <div role="columnheader">{t("winterRouteTableColumnWeather")}</div>
        <div role="columnheader">{t("winterRouteTableColumnTemp")}</div>
        <div role="columnheader">{t("winterRouteTableColumnWind")}</div>
        <div role="columnheader">{t("winterRouteTableColumnGust")}</div>
        <div role="columnheader">{t("winterRouteTableColumnPrecip")}</div>
      </div>
      {points.map((point) => (
        <WinterRoutePointRow key={point.id} point={point} effectiveHour={effectiveHour} t={t} lang={lang} />
      ))}
      <p className="mt-2 text-xs italic text-slate-400 dark:text-slate-500">{t("winterRouteGustPrecipNote")}</p>
      <p className="mt-1 text-xs italic text-slate-400 dark:text-slate-500">{t("winterRouteGridDisclaimer")}</p>
    </div>
  );
}

// Ticket #492, time-slider -- replaces the choose-flow's own former
// native <select> with a native <input type="range"> + prev/next step
// buttons (P1/P3). `selectedHour`/`hasUserPicked`/`availableHours`/
// `effectiveHour` are all owned by the parent (`WinterRouteDataView`,
// below) since the table/notes need `effectiveHour` too -- this
// component is purely presentational + its own interaction/focus
// handling, controlled entirely by props.
//
// P1(iii) -- the "previous time no longer available" notice must only
// ever appear after the user's OWN pick disappears from `availableHours`
// (never for an untouched default aging out on its own), which is why
// `hasUserPicked` is a separate prop from `selectedHour` rather than
// inferred from `selectedHour !== null`.
//
// P3(iv) -- when a step button is disabled WHILE it holds focus (the
// user stepped to an end, or a minute-tick shrank `availableHours` out
// from under a focused-but-now-out-of-range button), focus must move to
// the slider itself, never fall through to `document.body` and strand a
// keyboard user -- checked after every render via this effect, not
// inside the click handler (the button's own `disabled` attribute only
// takes effect on the NEXT render).
function WinterRouteTimeSlider({ availableHours, selectedHour, effectiveHour, hasUserPicked, onSelect, t, lang }) {
  const n = availableHours.length;
  const currentIndex = effectiveHour != null ? availableHours.indexOf(effectiveHour) : -1;
  const sliderRef = useRef(null);
  const prevRef = useRef(null);
  const nextRef = useRef(null);

  const prevDisabled = n === 0 || currentIndex <= 0;
  const nextDisabled = n === 0 || currentIndex === -1 || currentIndex >= n - 1;

  useEffect(() => {
    const active = document.activeElement;
    if ((active === prevRef.current && active?.disabled) || (active === nextRef.current && active?.disabled)) {
      sliderRef.current?.focus();
    }
  }, [currentIndex, n]);

  function handleSliderChange(e) {
    const idx = Number(e.target.value);
    if (!Number.isInteger(idx) || idx < 0 || idx >= n) return;
    onSelect(availableHours[idx]);
  }
  function goPrev() {
    if (!prevDisabled) onSelect(availableHours[currentIndex - 1]);
  }
  function goNext() {
    if (!nextDisabled) onSelect(availableHours[currentIndex + 1]);
  }

  const fullLabel = effectiveHour != null ? formatWinterRouteHourFull(effectiveHour, lang) : "—";
  const valueText = effectiveHour != null ? formatWinterRouteHourValueText(effectiveHour, lang) : "—";
  // P4 -- marks positioned with a thumb-width CSS correction (a native
  // range's thumb center never reaches the track's physical edges), not
  // a raw percentage -- CC's chosen/documented method (cc-report.md):
  // `calc((100% - thumbPx) * fraction + thumbPx / 2)`, thumbPx a CSS
  // constant (16px, a typical default/accent-color thumb width; verified
  // against the thumb/label alignment visually in the P8 evidence
  // screenshots, not measured in jsdom). Secondary (non-edge, non-date-
  // break) marks are hidden below `sm:` so the row stays readable on a
  // narrow phone, per P4's own "aðlöguð með Tailwind sm: flokkum".
  const marks = n > 1 ? winterRouteTimeSliderMarks(availableHours) : [];
  const showFallbackNotice = hasUserPicked && selectedHour != null && !availableHours.includes(selectedHour);

  return (
    <div className="mt-3" data-testid="winter-route-time-slider">
      <label htmlFor="winter-route-data-hour" className="text-sm font-medium text-slate-700 dark:text-slate-200">
        {t("winterRouteDataHourLabel")}
      </label>
      <p className="mt-1 text-base font-semibold text-slate-800 dark:text-slate-100">{fullLabel}</p>
      <div className="mt-2 flex items-center gap-2">
        <button
          ref={prevRef}
          type="button"
          onClick={goPrev}
          disabled={prevDisabled}
          aria-label={t("winterRoutePrevHourButton")}
          className="flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-lg border border-slate-300 text-slate-700 disabled:opacity-40 dark:border-slate-700 dark:text-slate-200"
        >
          ‹
        </button>
        <div className="relative flex-1">
          <input
            ref={sliderRef}
            id="winter-route-data-hour"
            type="range"
            min={0}
            max={Math.max(0, n - 1)}
            step={1}
            value={currentIndex >= 0 ? currentIndex : 0}
            disabled={n <= 1}
            onChange={handleSliderChange}
            aria-valuetext={valueText}
            className="h-6 w-full accent-sky-600"
          />
          {marks.length > 0 ? (
            <div aria-hidden="true" className="relative mt-1 h-4 text-[10px] text-slate-500 dark:text-slate-400">
              {marks.map((m) => (
                <span
                  key={m.index}
                  className={m.primary ? "absolute whitespace-nowrap" : "absolute hidden whitespace-nowrap sm:inline"}
                  style={{ left: `calc((100% - 16px) * ${m.index / (n - 1)} + 8px)`, transform: "translateX(-50%)" }}
                >
                  {m.label}
                </span>
              ))}
            </div>
          ) : null}
        </div>
        <button
          ref={nextRef}
          type="button"
          onClick={goNext}
          disabled={nextDisabled}
          aria-label={t("winterRouteNextHourButton")}
          className="flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-lg border border-slate-300 text-slate-700 disabled:opacity-40 dark:border-slate-700 dark:text-slate-200"
        >
          ›
        </button>
      </div>
      <p className="mt-1 text-xs italic text-slate-500 dark:text-slate-400">{t("winterRouteSameForecastTimeNoteChoose")}</p>
      {showFallbackNotice ? (
        <p role="status" className="mt-1 text-xs text-amber-600 dark:text-amber-300">
          {t("winterRouteTimeNoLongerAvailable")}
        </p>
      ) : null}
    </div>
  );
}

// Ticket #503 (B<->H) / westfjords-batch — the actual weather/road body for
// a confirmed /api/winter-route-data response, for any of the 7 connected
// pairs. Own local-only (no-fetch) shared hour selection — same #490 R1
// discipline as every other <select> in this file (plain onChange, no
// focus-moving ref/effect). The data body is outside live status regions
// (P6c). Point count (3-18) and the largest-gap caveat are computed from
// the actual response (P6a) via approxDistanceFromStartKm.
//
// Ticket #492, first overview round — restructured: the road/closures
// overview now comes FIRST (above the weather table, P4), the shared hour
// control sits directly above the single weather table (P1/P2, replacing
// the former repeated ForecastCard grid — ForecastCard itself is
// untouched and still used by the legacy fixed-route view below), and the
// road/forecast timestamp lines move up near their own sections (P5)
// instead of only appearing in the bottom attribution block.
//
// Ticket #492, time-slider -- the former native <select> is now
// `WinterRouteTimeSlider` above (P1/P3), and P5(i) reverses the previous
// DOM order: RoadOverviewSection now comes BEFORE the time control, which
// sits directly above `role="table"` with nothing else between them (the
// weather heading/notes/stale-line all moved to above the control).
function WinterRouteDataView({ data, t, lang, sectionCoverageNote = false }) {
  const now = useNowTicking();
  const availableHours = useMemo(() => {
    const hours = data.forecast.available ? data.forecast.window.expectedHours : [];
    return hours.filter((h) => new Date(`${h}:00Z`).getTime() > now.getTime());
  }, [data, now]);
  // Ticket #492, time-slider, P1(iii) -- `selectedHour` starts as "nothing
  // picked yet" (`null`), not the first available hour: an untouched
  // default that later ages out of `availableHours` must never trigger
  // the "previous time no longer available" notice below. `hasUserPicked`
  // only ever becomes true via the slider/step-button's own `onSelect`
  // (never set from this initial state or from the tick-driven
  // `availableHours` recompute), so the notice is shown only when the
  // user's OWN real choice is the one that disappeared.
  const [selectedHour, setSelectedHour] = useState(null);
  const [hasUserPicked, setHasUserPicked] = useState(false);
  const effectiveHour = selectedHour && availableHours.includes(selectedHour) ? selectedHour : (availableHours[0] ?? null);
  function handleSelectHour(hour) {
    setSelectedHour(hour);
    setHasUserPicked(true);
  }

  // P8(d) -- a fixed disclaimer on any route whose own real measured
  // length is >= ~400km (computed from routeLengthM, never hardcoded to
  // "north" or any specific pair): the per-point forecast compares
  // weather at the SAME chosen time along the route, not conditions when
  // a traveller actually reaches each place. No ETA/arrival/departure.
  const isLongRoute = typeof data.routeLengthM === "number" && data.routeLengthM >= 400000;

  const pointCount = data.forecast.available ? data.forecast.points.length : 0;
  const largestGap = useMemo(() => {
    if (!data.forecast.available) return null;
    // P5(a) westfjords-completion: a point without its own forecast data
    // does not count as a "point" for the gap calculation -- otherwise a
    // temporarily unavailable point would understate the real gap.
    const pts = data.forecast.points.filter((p) => p.available && Number.isFinite(p.approxDistanceFromStartKm));
    if (pts.length < 2) return null;
    let best = null;
    for (let i = 1; i < pts.length; i++) {
      const km = pts[i].approxDistanceFromStartKm - pts[i - 1].approxDistanceFromStartKm;
      if (!best || km > best.km) best = { km, a: pts[i - 1], b: pts[i] };
    }
    return best;
  }, [data]);

  // Ticket #503 source-time -- P4: the server stamp taken BEFORE road/
  // forecast is awaited, never a derived fetch time; invalid/missing
  // input simply omits the line (never "— UTC").
  const generatedAtText = formatValidatedUtcTimestamp(data.generatedAt);

  // P2 -- the OLDEST valid upstream export timestamp among road sections
  // (more conservative than the first; all sections share one feed's own
  // export time in practice), only when segmentsAvailable is true. This
  // is the real Vegagerðin export time, never a derived fetchedAt.
  const roadExportedAtText = useMemo(() => {
    if (!data.roadMeta?.segmentsAvailable) return null;
    const validTimestamps = (data.roadSections ?? [])
      .map((s) => s.export?.dagsKeyrtUt)
      .filter((ts) => typeof ts === "string" && Number.isFinite(Date.parse(ts)));
    if (validTimestamps.length === 0) return null;
    const oldest = validTimestamps.reduce((a, b) => (Date.parse(a) <= Date.parse(b) ? a : b));
    return formatValidatedUtcTimestamp(oldest);
  }, [data]);

  // P3 -- cache age at response time, never a ticking "current" age; gated
  // on each data part's own `available` flag so an unavailable feed's
  // `cacheAgeMs: 0` is never shown as a confident "under a minute".
  const roadCacheAge = data.roadMeta?.available ? cacheAgeMinutesDisplay(data.roadMeta.cacheAgeMs) : null;
  const forecastCacheAge = data.forecast.available ? cacheAgeMinutesDisplay(data.forecast.cacheAgeMs) : null;

  return (
    <div className="mt-4">
      {/* Ticket #492, time-slider, P5(i) -- DOM order is now road overview
          FIRST, then the time control, then `role="table"` with NOTHING
          else between the control and the table: the weather heading and
          its own notes (coverage/long-route/gap/stale) all moved to
          ABOVE the control, inside the same <section> as the table, so
          they no longer sit between the control and the table either. */}
      <div className="mt-6">
        <RoadOverviewSection data={data} roadExportedAtText={roadExportedAtText} t={t} lang={lang} sectionCoverageNote={sectionCoverageNote} />
      </div>

      <section className="mt-6">
        <h3 id="winter-route-data-weather-heading" className="text-sm font-semibold text-slate-700 dark:text-slate-200">
          {data.forecast.available ? t("winterRouteDataForecastHeading").replace("{count}", String(pointCount)) : t("winterRouteForecastUnavailable")}
        </h3>
        {data.forecast.available ? <p className="mt-1 text-xs italic text-slate-500 dark:text-slate-400">{t("winterRouteNoCoveragePointsNote")}</p> : null}
        {isLongRoute ? <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{t("winterRouteLongRouteComparisonNote")}</p> : null}
        {largestGap ? (
          <p className="mt-1 text-xs italic text-slate-500 dark:text-slate-400">
            {t("winterRouteLargestGapNote")
              .replace("{km}", formatDecimal(largestGap.km, lang, 1))
              .replace("{pointA}", shortenWinterRoutePointLabel(lang === "is" ? largestGap.a.labelIs : largestGap.a.labelEn, lang))
              .replace("{pointB}", shortenWinterRoutePointLabel(lang === "is" ? largestGap.b.labelIs : largestGap.b.labelEn, lang))}
          </p>
        ) : null}
        {data.forecast.available && data.forecast.stale ? (
          <p className="mt-1 text-xs text-amber-600 dark:text-amber-300">{t("winterRouteForecastStaleServed").replace("{minutes}", String(Math.round((data.forecast.cacheAgeMs || 0) / 60000)))}</p>
        ) : null}

        {data.forecast.available && availableHours.length > 0 ? (
          <WinterRouteTimeSlider
            availableHours={availableHours}
            selectedHour={selectedHour}
            effectiveHour={effectiveHour}
            hasUserPicked={hasUserPicked}
            onSelect={handleSelectHour}
            t={t}
            lang={lang}
          />
        ) : !data.forecast.available ? null : (
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">{t("winterRouteForecastUnavailable")}</p>
        )}

        {data.forecast.available ? (
          <WinterRoutePointsTable points={data.forecast.points} effectiveHour={effectiveHour} t={t} lang={lang} headingId="winter-route-data-weather-heading" />
        ) : null}
      </section>

      {/* Ticket #492, round 3 (UX priority), P6 -- "Um gögnin": the
          response-prepared timestamp (never called "fetched/updated",
          req5) and both parts' internal cache age now live ONLY here,
          never duplicated in the main view above. Attribution/legal text
          is unchanged and stays its own separate, always-visible block
          below (stale/errors are already shown outside any details,
          higher up). */}
      <details className="mt-6 rounded-xl border border-slate-200/70 bg-white/60 px-4 py-3 text-xs text-slate-500 dark:border-slate-800/70 dark:bg-slate-900/60 dark:text-slate-400">
        <summary className="cursor-pointer text-sm font-medium text-slate-700 dark:text-slate-200">{t("winterRouteAboutDataSummary")}</summary>
        <div className="mt-2 space-y-1 leading-relaxed">
          {generatedAtText ? <p>{t("winterRouteDataGeneratedAtLine").replace("{time}", generatedAtText)}</p> : null}
          {roadCacheAge ? (
            <p>{roadCacheAge.underOneMinute ? t("winterRouteRoadCacheAgeUnderMinuteLine") : t("winterRouteRoadCacheAgeLine").replace("{minutes}", String(roadCacheAge.minutes))}</p>
          ) : null}
          {forecastCacheAge ? (
            <p>{forecastCacheAge.underOneMinute ? t("winterRouteForecastCacheAgeUnderMinuteLine") : t("winterRouteForecastCacheAgeLine").replace("{minutes}", String(forecastCacheAge.minutes))}</p>
          ) : null}
        </div>
      </details>

      {/* Ticket #503 source-time -- same attribution/legal text the
          legacy fixed-route view already shows (P1: no new wording).
          Outside role="status": the sr-only status line in the parent
          only ever announces the heading, never this block. */}
      <section className="mt-4 rounded-xl border border-slate-200/70 bg-white/60 px-4 py-4 text-xs leading-relaxed text-slate-500 dark:border-slate-800/70 dark:bg-slate-900/60 dark:text-slate-400">
        <p>{t("winterRouteAttributionRoadLine")}</p>
        <p>{t("winterRouteAttributionWeatherLine")}</p>
        <p>{t("winterRouteModifiedBy")}</p>
        <p>{t("winterRouteNoEndorsement")}</p>
        <p className="font-medium">{t("winterRouteOfficialOverride")}</p>
        <p>{t("winterRouteNotSafetyAdvice")}</p>
        <p className="mt-2 flex flex-wrap gap-3">
          <a
            href={VEGAGERDIN_LINKS[lang === "en" ? "en" : "is"]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300 underline-offset-4 hover:underline"
          >
            {t("winterRouteOfficialSourceLinkRoad")}
          </a>
          <a
            href={OPEN_METEO_TERMS_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300 underline-offset-4 hover:underline"
          >
            {t("winterRouteOfficialSourceLinkWeather")}
          </a>
        </p>
      </section>
    </div>
  );
}

// Ticket #502 — the new primary "Velja staði" Frá/Til search/select +
// route-base result flow (approved-prompt-v1.md). Request lifecycle
// (abort/generation-guard/draft-vs-applied) follows the same proven
// pattern as the legacy routeId effect above, adapted for an explicit
// submit-handler request instead of a mount/dependency-driven effect
// (P4a: no mount-effect-fetch here at all — only "Sýna leið" fetches).
function WinterRouteGeometrySection({ t, lang, onAppliedChange }) {
  const [draftFrom, setDraftFrom] = useState(DEFAULT_GEOMETRY_FROM);
  const [draftTo, setDraftTo] = useState(DEFAULT_GEOMETRY_TO);
  const [applied, setApplied] = useState(null); // { from, to } | null -- null until first "Sýna leið"
  const [requestState, setRequestState] = useState({ key: null, loading: false, result: null });

  const sectionRef = useRef(null);
  const submitRef = useRef(null);
  const pendingFocusRef = useRef(null);
  const requestIdRef = useRef(0);
  const controllerRef = useRef(null);
  useEffect(() => () => controllerRef.current?.abort(), []);
  useEffect(() => {
    onAppliedChange?.(applied);
  }, [applied, onAppliedChange]);

  // Ticket #503, P6(a) — the B<->H weather/road data fetch, a SEPARATE
  // request lifecycle from the geometry one above (own AbortController/
  // requestId), gated strictly on: applied pair is B<->H, draft still
  // matches applied, and the geometry result currently on screen is a
  // real geometry_only response (never fired for same_place/unsupported/
  // other pairs/while the geometry request itself is loading).
  const [dataRequestState, setDataRequestState] = useState({ key: null, loading: false, result: null });
  const dataRequestIdRef = useRef(0);
  const dataControllerRef = useRef(null);
  const lastDataKeyRef = useRef(null);
  useEffect(() => () => dataControllerRef.current?.abort(), []);

  function runRequest(from, to, option, focusTarget = null) {
    pendingFocusRef.current = focusTarget ? { target: focusTarget, from, to } : null;
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    const thisRequestId = ++requestIdRef.current;
    const key = `${from}|${to}|${option ?? ""}`;
    setRequestState({ key, loading: true, result: null });

    const params = new URLSearchParams({ from, to });
    if (option) params.set("option", option);

    fetch(`/api/winter-route-geometry?${params.toString()}`, { signal: controller.signal })
      .then(async (res) => {
        let payload = null;
        try {
          payload = await res.json();
        } catch {
          payload = null;
        }
        return { httpStatus: res.status, payload };
      })
      .catch((err) => {
        if (err?.name === "AbortError") return undefined;
        return { httpStatus: null, payload: null };
      })
      .then((resolved) => {
        if (!resolved) return; // aborted -- superseded request, nothing to apply
        if (requestIdRef.current !== thisRequestId) return; // superseded by a later request
        const classified = classifyWinterRouteGeometryResponse({
          httpStatus: resolved.httpStatus,
          payload: resolved.payload,
          applied: { from, to, option: option ?? null },
        });
        setRequestState({ key, loading: false, result: classified });
      });
  }

  // Ticket #492, direct-flow, C1/C2 -- the single fixed-route-adapter
  // request, using the SAME requestState/controllerRef/requestIdRef as
  // the geometry request above (this is just "the result of submitting
  // a draft", not something intrinsically geometry-specific) so abort/
  // requestId/retry/swap/draft-vs-applied protections are identical,
  // never a second parallel lifecycle.
  function runFixedRequest(from, to, routeId, focusTarget = null) {
    pendingFocusRef.current = focusTarget ? { target: focusTarget, from, to } : null;
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    const thisRequestId = ++requestIdRef.current;
    const key = `${from}|${to}|`;
    setRequestState({ key, loading: true, result: null });

    fetch(`/api/winter-route?routeId=${routeId}`, { signal: controller.signal })
      .then(async (res) => {
        let payload = null;
        try {
          payload = await res.json();
        } catch {
          payload = null;
        }
        return { httpStatus: res.status, payload };
      })
      .catch((err) => (err?.name === "AbortError" ? undefined : { httpStatus: null, payload: null }))
      .then((resolved) => {
        if (!resolved) return;
        if (requestIdRef.current !== thisRequestId) return;
        const route = WINTER_ROUTE_OPTIONS.find((r) => r.routeId === routeId);
        const ok = resolved.httpStatus === 200 && route && validFixedRouteData(resolved.payload, routeId, route);
        setRequestState({
          key,
          loading: false,
          // C3 -- normalization adds nothing beyond the one rename this
          // shared data view already expects (`segments` -> `roadSections`,
          // same objects, same order); no fabricated routeLengthM/
          // isEdgeSegment/chainageKm/geometryId.
          result: ok
            ? { outcome: WINTER_ROUTE_OUTCOME.FIXED_ROUTE, payload: { ...resolved.payload, roadSections: resolved.payload.segments } }
            : { outcome: WINTER_ROUTE_OUTCOME.ERROR },
        });
      });
  }

  function handleSubmit(e) {
    e.preventDefault();
    setApplied({ from: draftFrom, to: draftTo });

    // C1 -- same-place guard for the two new fixed-route-only ids (vik/
    // borgarnes): the geometry endpoint has no knowledge of either, so a
    // same-id submission would otherwise resolve as a confusing
    // "unsupported" instead of the existing, already-correct same-place
    // message. The original 11 ids keep going through the real geometry
    // endpoint's own `same_place` classification unchanged (already
    // covered by its own real accessApproach data -- see P5(h)'s own
    // existing test) -- this is additive, not a replacement.
    if (draftFrom === draftTo && WINTER_ROUTE_CLIENT_SAME_PLACE_IDS.has(draftFrom)) {
      controllerRef.current?.abort();
      requestIdRef.current += 1; // invalidate any in-flight request; nothing to apply from it
      setRequestState({ key: `${draftFrom}|${draftTo}|`, loading: false, result: { outcome: WINTER_ROUTE_OUTCOME.SAME_PLACE, payload: {} } });
      return;
    }

    const fixedRouteId = resolveDirectPairRouteId(draftFrom, draftTo);
    if (fixedRouteId) {
      runFixedRequest(draftFrom, draftTo, fixedRouteId);
      return;
    }
    runRequest(draftFrom, draftTo, null);
  }

  function handleSwap() {
    setDraftFrom(draftTo);
    setDraftTo(draftFrom);
  }

  function handleSelectOption(optionId) {
    if (!applied) return;
    runRequest(applied.from, applied.to, optionId, optionId);
  }

  const draftMatchesApplied = Boolean(applied) && draftFrom === applied.from && draftTo === applied.to;
  // The CURRENT applied key reflects whichever option (if any) the result
  // currently on screen was fetched for -- read from the in-flight/last
  // settled request's own key, never re-derived from `applied` alone, so
  // an option switch's own loading/result is tracked correctly too.
  const currentOption = requestState.key && applied ? requestState.key.slice(`${applied.from}|${applied.to}|`.length) || null : null;
  const currentKey = applied ? `${applied.from}|${applied.to}|${currentOption ?? ""}` : null;
  const isCurrentLoading = requestState.loading && requestState.key === currentKey;
  const view = !requestState.loading && requestState.key === currentKey ? requestState.result : null;
  const submitDisabled = requestState.loading && requestState.key === `${draftFrom}|${draftTo}|`;

  // P8(a) -- ring pairs are only data-eligible once the geometry response
  // itself carries a resolved selectedOption (south|north); that value
  // (never re-derived client-side) is what the data request sends back.
  const isRingPair = Boolean(applied) && isRingOptionPair(applied.from, applied.to);
  const ringSelectedOption = isRingPair ? view?.payload?.selectedOption : null;
  // Ticket #492, direct-flow, C2 -- a fixed-route result IS the final
  // data already (one single fetch, no separate geometry+data two-step
  // at all) -- data-eligible the moment the request settles, with no
  // geometryId concept involved.
  const isFixedRoute = view?.outcome === WINTER_ROUTE_OUTCOME.FIXED_ROUTE;
  const isDataEligible =
    Boolean(applied) &&
    draftMatchesApplied &&
    !isCurrentLoading &&
    (isFixedRoute ||
      (view?.outcome === WINTER_ROUTE_OUTCOME.GEOMETRY_ONLY &&
        (isWinterRouteDataPair(applied.from, applied.to) ||
          isRingCompletionPair(applied.from, applied.to) ||
          (isRingPair && (ringSelectedOption === "south" || ringSelectedOption === "north")))));
  const dataGeometryId = isDataEligible && !isFixedRoute ? view.payload.geometryId : null;
  const dataOption = isDataEligible && !isFixedRoute && isRingPair ? ringSelectedOption : null;
  const currentDataKey = isDataEligible && !isFixedRoute && dataGeometryId ? `${applied.from}|${applied.to}|${dataOption ?? ""}|${dataGeometryId}` : null;
  const isDataLoading = !isFixedRoute && dataRequestState.loading && dataRequestState.key === currentDataKey;
  const dataView = isFixedRoute
    ? { ok: true, payload: view.payload }
    : (!dataRequestState.loading && dataRequestState.key === currentDataKey ? dataRequestState.result : null);

  useEffect(() => {
    if (!isDataEligible || !dataGeometryId) {
      if (lastDataKeyRef.current !== null) {
        dataControllerRef.current?.abort();
        lastDataKeyRef.current = null;
        setDataRequestState({ key: null, loading: false, result: null });
      }
      return undefined;
    }

    const key = `${applied.from}|${applied.to}|${dataOption ?? ""}|${dataGeometryId}`;
    if (lastDataKeyRef.current === key) return undefined; // StrictMode double-invoke / already current
    lastDataKeyRef.current = key;

    dataControllerRef.current?.abort();
    const controller = new AbortController();
    dataControllerRef.current = controller;
    const thisRequestId = ++dataRequestIdRef.current;
    setDataRequestState({ key, loading: true, result: null });

    const params = new URLSearchParams({ from: applied.from, to: applied.to, geometryId: dataGeometryId });
    if (dataOption) params.set("option", dataOption);
    fetch(`/api/winter-route-data?${params.toString()}`, { signal: controller.signal })
      .then(async (res) => {
        let payload = null;
        try {
          payload = await res.json();
        } catch {
          payload = null;
        }
        return { httpStatus: res.status, payload };
      })
      .catch((err) => (err?.name === "AbortError" ? undefined : { httpStatus: null, payload: null }))
      .then((resolved) => {
        if (!resolved) return;
        if (dataRequestIdRef.current !== thisRequestId) return;
        const ok = resolved.httpStatus === 200 && validRouteData(resolved.payload, applied.from, applied.to, dataGeometryId);
        setDataRequestState({ key, loading: false, result: ok ? { ok: true, payload: resolved.payload } : { ok: false } });
      });

    return undefined;
  }, [isDataEligible, dataGeometryId, dataOption, applied?.from, applied?.to]);

  useEffect(() => {
    const intent = pendingFocusRef.current;
    if (!intent || requestState.loading) return;
    pendingFocusRef.current = null;
    // Restore only the control removed by the user's own option/retry action.
    // A user who moved elsewhere during the request keeps their focus.
    if (draftFrom !== intent.from || draftTo !== intent.to || sectionRef.current?.closest("[hidden]") || document.activeElement !== document.body) return;
    const option = sectionRef.current?.querySelector(`[data-route-option="${intent.target}"]`);
    (option ?? sectionRef.current?.querySelector("[data-route-retry]") ?? submitRef.current)?.focus();
  }, [requestState, draftFrom, draftTo]);

  return (
    <div ref={sectionRef} className="mt-6">
      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <PlaceField
          idPrefix="winter-route-from"
          label={t("winterRouteFromLabel")}
          searchLabel={t("winterRouteFromSearchLabel")}
          noResultsText={t("winterRouteNoSearchResults")}
          value={draftFrom}
          onChange={setDraftFrom}
          lang={lang}
          t={t}
        />
        <PlaceField
          idPrefix="winter-route-to"
          label={t("winterRouteToLabel")}
          searchLabel={t("winterRouteToSearchLabel")}
          noResultsText={t("winterRouteNoSearchResults")}
          value={draftTo}
          onChange={setDraftTo}
          lang={lang}
          t={t}
        />
        <div className="flex items-center gap-3 sm:col-span-2">
          <button
            type="button"
            onClick={handleSwap}
            aria-label={t("winterRouteSwapLabel")}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          >
            ⇄
          </button>
          <button
            ref={submitRef}
            type="submit"
            disabled={submitDisabled}
            className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {t("winterRouteShowRouteButton")}
          </button>
        </div>
      </form>

      <div role="status" aria-live="polite" className="mt-4 rounded-xl border border-slate-200/70 bg-white/70 px-4 py-3 dark:border-slate-800/70 dark:bg-slate-900/70">
        {!applied ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">{t("winterRouteIdleHint")}</p>
        ) : !draftMatchesApplied ? (
          <p className="text-sm text-slate-600 dark:text-slate-300">{t("winterRouteSelectionChangedNotice")}</p>
        ) : isCurrentLoading ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">{t("winterRouteGeometryLoading")}</p>
        ) : view?.outcome === WINTER_ROUTE_OUTCOME.ERROR ? (
          <div>
            <p className="text-sm text-red-700 dark:text-red-300">{t("winterRouteGenericError")}</p>
            <button
              type="button"
              data-route-retry
              onClick={() => {
                // Ticket #492, direct-flow, R1 -- a fixed pair's own retry
                // must re-run the SAME fixed-route adapter request (same
                // routeId, same requestId/abort machinery), never fall
                // through to the geometry endpoint (which has no data for
                // these two pairs at all and would wrongly resolve as
                // "no route yet" on every retry).
                const fixedRouteId = resolveDirectPairRouteId(applied.from, applied.to);
                if (fixedRouteId) {
                  runFixedRequest(applied.from, applied.to, fixedRouteId, "retry");
                } else {
                  runRequest(applied.from, applied.to, currentOption, "retry");
                }
              }}
              className="mt-2 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              {t("winterRouteRetryButton")}
            </button>
          </div>
        ) : view?.outcome === WINTER_ROUTE_OUTCOME.NO_ROUTE ? (
          <p className="text-sm text-slate-600 dark:text-slate-300">{t("winterRouteNoRouteYet")}</p>
        ) : view?.outcome === WINTER_ROUTE_OUTCOME.SAME_PLACE || view?.outcome === WINTER_ROUTE_OUTCOME.GEOMETRY_ONLY || view?.outcome === WINTER_ROUTE_OUTCOME.FIXED_ROUTE ? (
          <GeometryResultView
            outcome={view.outcome}
            payload={view.payload}
            applied={applied}
            t={t}
            lang={lang}
            onSelectOption={handleSelectOption}
            dataConnected={Boolean(dataView?.ok)}
          />
        ) : null}
      </div>

      {/* Only request status is live; hour changes do not announce all cards. */}
      {isDataEligible ? (
        <div data-testid="winter-route-data" className="mt-4 rounded-xl border border-slate-200/70 bg-white/70 px-3 py-3 dark:border-slate-800/70 dark:bg-slate-900/70 sm:px-4">
          <p role="status" aria-live="polite" className="sr-only">
            {isDataLoading
              ? t("winterRouteDataLoading")
              : dataView?.ok === false
                ? t("winterRouteGenericError")
                : dataView?.ok
                  ? (dataView.payload.forecast.available
                      ? t("winterRouteDataForecastHeading").replace("{count}", String(dataView.payload.forecast.points.length))
                      : t("winterRouteForecastUnavailable"))
                  : ""}
          </p>
          {dataView?.ok ? (
            <WinterRouteDataView
              data={dataView.payload}
              t={t}
              lang={lang}
              sectionCoverageNote={isFixedRoute && view.payload.routeId === "raudavatn-borgarnes"}
            />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export default function WinterRoute() {
  const { t, lang, theme } = usePageRouteProps();
  useThemeClass(theme === "dark");

  // Ticket #492, direct-flow -- the former "Fastar veðurleiðir"/"Velja
  // staði" mode toggle and its entire legacy fixed-route weather flow
  // (routeId <select>, its own fetch effect, RouteSummary/ForecastCard
  // grid, legacy road-section list, legacy attribution block) are
  // removed entirely (source.md "Fjarlægja 'Fastar veðurleiðir' úr
  // notendaviðmóti"): there is now exactly one direct Frá->Til->Sýna
  // leið flow (WinterRouteGeometrySection below), which also serves the
  // two fixed routes (Vík/Borgarnes) via its own frontend adapter -- see
  // WINTER_ROUTE_DIRECT_PAIRS/resolveDirectPairRouteId in
  // winterRouteRoutes.js. `winterRouteRoutes.js`'s own ROUTE_DEFS-
  // parity table, backend, fixtures and their own tests are unaffected
  // -- this removal only reaches identifiers that became unreachable
  // once this component's legacy branch itself was deleted (full list
  // in cc-report.md).
  const [geometryApplied, setGeometryApplied] = useState(null);
  const geometryTitle = geometryApplied
    ? `${winterRoutePlaceName(geometryApplied.from, lang)} → ${winterRoutePlaceName(geometryApplied.to, lang)}`
    : t("winterRouteDefaultHeading");

  return (
    <>
      <Helmet>
        <title>{geometryTitle} · {lang === "en" ? "Chase the Weather" : "Eltum Veðrið"}</title>
      </Helmet>

      <div className="min-h-screen bg-soft-grid text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        <header className="sticky top-0 z-30 border-b border-slate-200/60 bg-white/80 backdrop-blur-sm dark:border-slate-800/60 dark:bg-slate-950/80">
          <div className="mx-auto flex max-w-4xl items-center px-6 py-3">
            <Brand t={t} size="full" lang={lang} hideTagline />
          </div>
        </header>

        <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
          <h1 className="text-2xl font-black tracking-tight md:text-3xl">{geometryTitle}</h1>

          <WinterRouteGeometrySection t={t} lang={lang} onAppliedChange={setGeometryApplied} />
        </main>

        <Footer t={t} />
      </div>
    </>
  );
}
