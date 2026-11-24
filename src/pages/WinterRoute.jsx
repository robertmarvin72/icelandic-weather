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
  formatHourLabel,
  formatTimestamp,
  hourOfDayFromHourString,
} from "../lib/winterRoutePresentation";
import { computeWeatherExtremaSummary, computeActiveNoticeSegmentCount } from "../lib/winterRouteSummary";
import { WINTER_ROUTE_OPTIONS, DEFAULT_WINTER_ROUTE_ID, expectedPointCountForRoute } from "../lib/winterRouteRoutes";
import {
  WINTER_ROUTE_PLACES,
  WINTER_ROUTE_GROUP_RING,
  WINTER_ROUTE_GROUP_WESTFJORDS,
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

// Ticket #502 — "Velja staði" default pre-filled pair (the existing ring-
// pilot MVP short route), never auto-requested on mount (P1a): only
// "Sýna leið" fires the first /api/winter-route-geometry request.
const DEFAULT_GEOMETRY_FROM = "reykjavik-raudavatn";
const DEFAULT_GEOMETRY_TO = "selfoss";

const WINTER_ROUTE_MODE_CHOOSE = "choose";
const WINTER_ROUTE_MODE_LEGACY = "legacy";

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
function SegmentRow({ segment, t, lang, edgeSegmentNote = null }) {
  const name = lang === "en" ? segment.nameEn : segment.nameIs;
  const pillClass = categoryPillClass(segment.category, segment.positiveStyleEligible);
  const categoryLabel = t(SEGMENT_CATEGORY_LABEL_KEY[segment.category] || SEGMENT_CATEGORY_LABEL_KEY.unknown_unclassified);
  const description = lang === "en" ? segment.astandLysingEn : segment.astandLysing;

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
          {description ? <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{description}</p> : null}
          <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400">
            {segment.export?.isStale ? <span>{t("winterRouteExportStale")}</span> : null}
            {segment.registration?.isOld ? <span>{t("winterRouteRegistrationOld")}</span> : null}
          </div>
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

            const noticeText = lang === "en" ? notice.lysingEn || notice.lysing : notice.lysing;
            const statusKey =
              notice.status === "active"
                ? "winterRouteNoticeActive"
                : notice.status === "expired"
                  ? "winterRouteNoticeExpired"
                  : "winterRouteNoticeUnknownValidity";
            return (
              <li key={notice.idPunktur ?? `${segment.idButur}-${notice.astand}`} className="text-xs text-slate-600 dark:text-slate-300">
                <span className="font-medium">{noticeText}</span> — {t(statusKey)}
              </li>
            );
          })}
        </ul>
      ) : null}
    </li>
  );
}

function ForecastCard({ point, effectiveHour, t, lang }) {
  const label = lang === "en" ? point.labelEn : point.labelIs;

  if (!point.available) {
    return (
      <div className="rounded-xl border border-slate-200/70 bg-white/70 p-4 dark:border-slate-800/70 dark:bg-slate-900/70">
        <div className="font-medium text-slate-800 dark:text-slate-100">{label}</div>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{t("winterRoutePointUnavailable")}</p>
      </div>
    );
  }

  // Ticket #493 — exact lookup of the ONE shared selected forecast hour in
  // this point's own `hours` array. No distance, no ETA, no per-point time;
  // a hand-picked hour not present in this point's own `hours` (shouldn't
  // happen per the backend's own contract, but not assumed) is the same
  // explicit "not available" outcome as `effectiveHour` itself being null.
  const hourIndex = effectiveHour != null ? point.hours.indexOf(effectiveHour) : -1;
  const hasHour = hourIndex >= 0;

  const temp = hasHour ? point.series.temperature_2m[hourIndex] : null;
  const wind = hasHour ? point.series.wind_speed_10m[hourIndex] : null;
  const gust = hasHour ? point.series.wind_gusts_10m[hourIndex] : null;
  const precip = hasHour ? point.series.precipitation[hourIndex] : null;
  const code = hasHour ? point.series.weather_code[hourIndex] : null;
  // N1: derive day/night from the selected UTC hour's own "HH" digits
  // (the fixed "YYYY-MM-DDTHH:00" string, never a Date/local-timezone
  // read) using the same isDaytimeHour() convention ForecastTable/
  // HourlyForecastModal already use — no new sunrise/sunset lookup.
  const hourOfDay = hasHour ? hourOfDayFromHourString(point.hours[hourIndex]) : null;
  const presentation = resolveWeatherPresentation(code, { isDay: isDaytimeHour(hourOfDay) });

  return (
    <div className="rounded-xl border border-slate-200/70 bg-white/70 p-4 dark:border-slate-800/70 dark:bg-slate-900/70">
      <div className="flex items-center justify-between gap-2">
        <div className="font-medium text-slate-800 dark:text-slate-100">{label}</div>
        {!presentation.isUnknown ? (
          <WeatherIcon iconId={presentation.iconId} aria-label={t(presentation.textKey)} className="h-8 w-8" />
        ) : (
          <span className="text-xs text-slate-400">{t("winterRouteUnknownWeatherSymbol")}</span>
        )}
      </div>

      {!hasHour ? (
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{t("winterRouteForecastNotAvailableAtComputedTime")}</p>
      ) : (
        <>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {t("winterRouteValidFor").replace("{time}", formatHourLabel(effectiveHour))}
          </p>
          <dl className="mt-2 grid grid-cols-2 gap-1 text-sm text-slate-700 dark:text-slate-200">
            <dt className="text-slate-500 dark:text-slate-400">{t("winterRouteTemperature")}</dt>
            <dd>{temp == null ? "—" : `${formatDecimal(temp, lang, 1)} °C`}</dd>
            <dt className="text-slate-500 dark:text-slate-400">{t("winterRouteWind")}</dt>
            <dd>{wind == null ? "—" : `${formatDecimal(wind, lang, 1)} m/s`}</dd>
            <dt className="text-slate-500 dark:text-slate-400">{t("winterRouteGust")}</dt>
            <dd>{gust == null ? "—" : `${formatDecimal(gust, lang, 1)} m/s`}</dd>
            <dt className="text-slate-500 dark:text-slate-400">{t("winterRoutePrecip")}</dt>
            <dd>{precip == null ? "—" : `${formatDecimal(precip, lang, 1)} mm`}</dd>
          </dl>
        </>
      )}

      <p className="mt-2 text-xs italic text-slate-400 dark:text-slate-500">{t("winterRouteGridDisclaimer")}</p>
    </div>
  );
}

// #489 — one metric line in the route-level summary. `metric` is one entry
// from computeWeatherExtremaSummary()'s result (value/point/hourString/
// isMissing/isPartial/validCount). Null/missing is its own dedicated
// string, never a "0" or a silently-dropped line.
function SummaryMetricLine({ t, lang, metric, valueKey, missingKey, expectedPointCount }) {
  if (metric.isMissing) {
    return <p className="text-sm text-slate-600 dark:text-slate-300">{t(missingKey)}</p>;
  }

  const pointLabel = lang === "en" ? metric.point.labelEn : metric.point.labelIs;
  let line = t(valueKey)
    .replace("{value}", formatDecimal(metric.value, lang, 1))
    .replace("{point}", pointLabel)
    .replace("{time}", formatHourLabel(metric.hourString));

  if (metric.isPartial) {
    line += t("winterRouteSummaryPartialSuffix")
      .replace("{count}", String(metric.validCount))
      .replace("{total}", String(expectedPointCount));
  }

  return <p className="text-sm text-slate-600 dark:text-slate-300">{line}</p>;
}

// #489 — route-level summary, positioned above the forecast cards and the
// road list. Ticket #493: weather extrema read the exact same ONE shared
// `effectiveHour` the cards use (computeWeatherExtremaSummary, an exact
// per-point lookup — no ETA model, never a second time per point); the
// notice count is independent of the selected hour entirely (point-notice
// status is computed server-side from "now"). No positive styling anywhere
// here (S1) — the notice count never reads as a green/safe indicator,
// including when it is 0, and the fixed scope disclaimer is always shown
// regardless of the count's value.
function RouteSummary({ data, effectiveHour, t, lang }) {
  const weatherSummary = useMemo(() => {
    const points = data.forecast?.available ? data.forecast.points : [];
    return computeWeatherExtremaSummary(points, effectiveHour);
  }, [data.forecast, effectiveHour]);
  const noticeSummary = computeActiveNoticeSegmentCount(data.segments, data.roadMeta);
  const expectedPointCount = data.expectedPointCount;

  return (
    <section className="mb-6 rounded-xl border border-slate-200/70 bg-white/70 px-4 py-3 dark:border-slate-800/70 dark:bg-slate-900/70">
      <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">{t("winterRouteSummaryHeading")}</h2>

      <div className="mt-2 space-y-1">
        <SummaryMetricLine
          t={t}
          lang={lang}
          metric={weatherSummary.maxGust}
          valueKey="winterRouteSummaryGust"
          missingKey="winterRouteSummaryGustMissing"
          expectedPointCount={expectedPointCount}
        />
        <SummaryMetricLine
          t={t}
          lang={lang}
          metric={weatherSummary.maxPrecip}
          valueKey="winterRouteSummaryPrecip"
          missingKey="winterRouteSummaryPrecipMissing"
          expectedPointCount={expectedPointCount}
        />
        <SummaryMetricLine
          t={t}
          lang={lang}
          metric={weatherSummary.minTemp}
          valueKey="winterRouteSummaryMinTemp"
          missingKey="winterRouteSummaryMinTempMissing"
          expectedPointCount={expectedPointCount}
        />
      </div>

      {data.forecast?.available && data.forecast.stale ? (
        <p className="mt-1 text-xs text-amber-600 dark:text-amber-300">
          {t("winterRouteForecastStaleServed").replace(
            "{minutes}",
            String(Math.round((data.forecast.cacheAgeMs || 0) / 60000))
          )}
        </p>
      ) : null}

      <div className="mt-3 border-t border-slate-200/60 pt-2 dark:border-slate-800/60">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          {noticeSummary.confirmed
            ? t("winterRouteSummaryNoticeCount").replace("{count}", String(noticeSummary.count))
            : t("winterRouteSummaryNoticeCountUnconfirmed")}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400">{t("winterRouteSummaryNoticeScope")}</p>
      </div>

      <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
        {t("winterRouteAcquiredAt").replace("{time}", formatTimestamp(data.generatedAt))}
      </p>
    </section>
  );
}

// Ticket #502, P3 — one labelled search input + one labelled native
// <select> per endpoint (no custom combobox framework/dependency). The
// currently selected id is ALWAYS included in the rendered option list,
// even when the search text would otherwise filter it out (P3b: a valid
// selection is never silently lost). Grouped via <optgroup> by network
// membership (P2b) so the user can see ring-pilot and Westfjords ids are
// never mixed. The search input never changes `value` itself — only an
// actual <select> change does — so Enter/typing can never send a
// half-typed non-place string.
function PlaceField({ idPrefix, label, searchLabel, noResultsText, value, onChange, search, onSearchChange, lang, t }) {
  const matches = WINTER_ROUTE_PLACES.filter((p) => winterRoutePlaceMatchesSearch(p, lang, search));
  const visiblePlaces = matches.some((p) => p.id === value)
    ? matches
    : [...WINTER_ROUTE_PLACES.filter((p) => p.id === value), ...matches];
  const hasNoRealMatches = matches.length === 0;
  const ringPlaces = visiblePlaces.filter((p) => p.group === WINTER_ROUTE_GROUP_RING);
  const westfjordsPlaces = visiblePlaces.filter((p) => p.group === WINTER_ROUTE_GROUP_WESTFJORDS);

  return (
    <div>
      <label htmlFor={`${idPrefix}-select`} className="text-sm font-medium text-slate-700 dark:text-slate-200">
        {label}
      </label>
      <div className="mt-1 flex flex-col gap-1 sm:flex-row sm:items-center">
        <div>
          <label htmlFor={`${idPrefix}-search`} className="sr-only">
            {searchLabel}
          </label>
          <input
            id={`${idPrefix}-search`}
            type="text"
            placeholder={searchLabel}
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="block w-full max-w-xs rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 dark:border-slate-700 dark:bg-slate-900"
          />
        </div>
        <select
          id={`${idPrefix}-select`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="block w-full max-w-xs rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 dark:border-slate-700 dark:bg-slate-900"
        >
          {ringPlaces.length > 0 ? (
            <optgroup label={t("winterRouteGroupRingLabel")}>
              {ringPlaces.map((p) => (
                <option key={p.id} value={p.id}>
                  {lang === "en" ? p.nameEn : p.nameIs}
                </option>
              ))}
            </optgroup>
          ) : null}
          {westfjordsPlaces.length > 0 ? (
            <optgroup label={t("winterRouteGroupWestfjordsLabel")}>
              {westfjordsPlaces.map((p) => (
                <option key={p.id} value={p.id}>
                  {lang === "en" ? p.nameEn : p.nameIs}
                </option>
              ))}
            </optgroup>
          ) : null}
        </select>
      </div>
      <p role="status" aria-live="polite" className="mt-1 text-xs text-slate-500 dark:text-slate-400">
        {hasNoRealMatches ? noResultsText : ""}
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

const BUDARDALUR_HOLMAVIK_PLACE_IDS = new Set(["budardalur", "holmavik"]);
function isBudardalurHolmavikPair(from, to) {
  return from !== to && BUDARDALUR_HOLMAVIK_PLACE_IDS.has(from) && BUDARDALUR_HOLMAVIK_PLACE_IDS.has(to);
}

// Ticket #503 westfjords-batch -- frontend-only duplicate of the backend's
// own pair allowlist (api/_lib/winterRoute/westfjordsBatchRoute.js). src/
// must not import api/ code directly (bundler boundary), same convention
// already used for winterRoutePlaces.js/winterRouteRoutes.js.
const WESTFJORDS_BATCH_PAIRS = [
  ["budardalur", "flokalundur"], ["budardalur", "patreksfjordur"], ["budardalur", "talknafjordur"],
  ["flokalundur", "patreksfjordur"], ["flokalundur", "talknafjordur"], ["patreksfjordur", "talknafjordur"],
];
const WESTFJORDS_BATCH_PAIR_KEYS = new Set(WESTFJORDS_BATCH_PAIRS.flatMap(([a, b]) => [`${a}|${b}`, `${b}|${a}`]));
function isWestfjordsBatchPair(from, to) {
  return from !== to && WESTFJORDS_BATCH_PAIR_KEYS.has(`${from}|${to}`);
}

// Ticket #503 westfjords-completion -- frontend-only duplicate of the
// backend's own pair allowlist (api/_lib/winterRoute/westfjordsCompletionRoute.js).
const WESTFJORDS_COMPLETION_PAIRS = [
  ["budardalur", "isafjordur"], ["flokalundur", "isafjordur"], ["isafjordur", "holmavik"],
  ["isafjordur", "patreksfjordur"], ["isafjordur", "talknafjordur"], ["flokalundur", "holmavik"],
  ["holmavik", "patreksfjordur"], ["holmavik", "talknafjordur"],
];
const WESTFJORDS_COMPLETION_PAIR_KEYS = new Set(WESTFJORDS_COMPLETION_PAIRS.flatMap(([a, b]) => [`${a}|${b}`, `${b}|${a}`]));
function isWestfjordsCompletionPair(from, to) {
  return from !== to && WESTFJORDS_COMPLETION_PAIR_KEYS.has(`${from}|${to}`);
}
function isWinterRouteDataPair(from, to) {
  return isBudardalurHolmavikPair(from, to) || isWestfjordsBatchPair(from, to) || isWestfjordsCompletionPair(from, to);
}

// Ticket #503 ring-options -- frontend-only duplicate of the backend's own
// pair allowlist (api/_lib/winterRoute/ringOptionsRoute.js). Unlike the
// Westfjords pairs, these two ALSO require a valid `option` (south|north)
// taken from the geometry response's own `selectedOption` -- never
// hardcoded, never re-derived client-side (P8a).
const RING_OPTION_PAIR_KEYS = new Set([
  "reykjavik-raudavatn|selfoss", "selfoss|reykjavik-raudavatn",
  "reykjavik-raudavatn|hella", "hella|reykjavik-raudavatn",
]);
function isRingOptionPair(from, to) {
  return from !== to && RING_OPTION_PAIR_KEYS.has(`${from}|${to}`);
}

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

// Validate the fields consumed by the data view before accepting a response.
function validRouteData(data, from, to, geometryId) {
  if (!data || data.from !== from || data.to !== to || data.geometryId !== geometryId ||
      !Array.isArray(data.roadSections) || !data.roadMeta || typeof data.roadMeta.available !== "boolean" ||
      !data.forecast || typeof data.forecast.available !== "boolean") return false;
  if (!data.roadSections.every((section) => section && Array.isArray(section.notices) && section.export && section.registration)) return false;
  const forecast = data.forecast;
  return !forecast.available || (Array.isArray(forecast.window?.expectedHours) &&
    forecast.window.expectedHours.every((h) => typeof h === "string" && Number.isFinite(Date.parse(`${h}:00Z`))) &&
    Array.isArray(forecast.points) && forecast.points.every((point) => point && typeof point.available === "boolean" &&
      (!point.available || (Array.isArray(point.hours) && point.series &&
        ["temperature_2m", "wind_speed_10m", "wind_gusts_10m", "precipitation", "weather_code"].every((key) => Array.isArray(point.series[key]))))));
}

// Ticket #503 (B<->H) / westfjords-batch — the actual weather/road body for
// a confirmed /api/winter-route-data response, for any of the 7 connected
// pairs. Reuses the existing ForecastCard/SegmentRow components verbatim
// (same field shapes), own local-only (no-fetch) shared hour selection —
// same #490 R1 discipline as every other <select> in this file (plain
// onChange, no focus-moving ref/effect). The data body is outside live
// status regions (P6c). Point count (3-8) and the largest-gap caveat are
// computed from the actual response (P6a) via approxDistanceFromStartKm,
// which is only present for westfjords-batch pairs; B<->H has none, so it
// keeps its own generic coverage note with no computed gap line.
function WinterRouteDataView({ data, t, lang }) {
  const now = useNowTicking();
  const availableHours = useMemo(() => {
    const hours = data.forecast.available ? data.forecast.window.expectedHours : [];
    return hours.filter((h) => new Date(`${h}:00Z`).getTime() > now.getTime());
  }, [data, now]);
  const [selectedHour, setSelectedHour] = useState(availableHours[0] ?? null);
  const effectiveHour = selectedHour && availableHours.includes(selectedHour) ? selectedHour : (availableHours[0] ?? null);

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

  return (
    <div className="mt-4">
      <section>
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
          {data.forecast.available ? t("winterRouteDataForecastHeading").replace("{count}", String(pointCount)) : t("winterRouteForecastUnavailable")}
        </h3>
        {data.forecast.available ? <p className="mt-1 text-xs italic text-slate-500 dark:text-slate-400">{t("winterRouteNoCoveragePointsNote")}</p> : null}
        {isLongRoute ? <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{t("winterRouteLongRouteComparisonNote")}</p> : null}
        {largestGap ? (
          <p className="mt-1 text-xs italic text-slate-500 dark:text-slate-400">
            {t("winterRouteLargestGapNote")
              .replace("{km}", formatDecimal(largestGap.km, lang, 1))
              .replace("{pointA}", lang === "is" ? largestGap.a.labelIs : largestGap.a.labelEn)
              .replace("{pointB}", lang === "is" ? largestGap.b.labelIs : largestGap.b.labelEn)}
          </p>
        ) : null}

        {data.forecast.available && availableHours.length > 0 ? (
          <div className="mt-2">
            <label htmlFor="winter-route-data-hour" className="text-sm font-medium text-slate-700 dark:text-slate-200">
              {t("winterRouteHourLabel")}
            </label>
            <select
              id="winter-route-data-hour"
              className="mt-1 block w-full max-w-xs rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 dark:border-slate-700 dark:bg-slate-900"
              value={effectiveHour ?? ""}
              onChange={(e) => setSelectedHour(e.target.value)}
            >
              {availableHours.map((h) => (
                <option key={h} value={h}>
                  {formatHourLabel(h)}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs italic text-slate-500 dark:text-slate-400">{t("winterRouteSameForecastTimeNote")}</p>
          </div>
        ) : (
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{t("winterRouteForecastUnavailable")}</p>
        )}

        {data.forecast.available && data.forecast.stale ? (
          <p className="mt-2 text-xs text-amber-600 dark:text-amber-300">{t("winterRouteForecastStaleServed").replace("{minutes}", String(Math.round((data.forecast.cacheAgeMs || 0) / 60000)))}</p>
        ) : null}

        {data.forecast.available ? (
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {data.forecast.points.map((point) => (
              <ForecastCard key={point.id} point={point} effectiveHour={effectiveHour} t={t} lang={lang} />
            ))}
          </div>
        ) : null}
      </section>

      <section className="mt-6">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">{t("winterRouteRoadSectionTitle")}</h3>
        {!data.roadMeta.available ? <p className="mt-2 text-sm text-slate-500">{t("winterRouteRoadFeedUnavailable")}</p> : null}
        {data.roadMeta.stale ? <p className="mt-2 text-xs text-amber-600 dark:text-amber-300">{t("winterRouteRoadStaleServed").replace("{minutes}", String(Math.round((data.roadMeta.cacheAgeMs || 0) / 60000)))}</p> : null}
        {data.roadMeta.pointsFeedUnavailableOrStale ? (
          <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
            {t("winterRoutePointsFeedUnavailable")}
          </p>
        ) : null}
        <ol className="mt-3 space-y-2">
          {data.roadSections.map((section) => (
            <SegmentRow
              key={section.idButur}
              segment={section}
              t={t}
              lang={lang}
              edgeSegmentNote={edgeSegmentNoteFor(section, t, lang)}
            />
          ))}
        </ol>
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
  const [searchFrom, setSearchFrom] = useState("");
  const [searchTo, setSearchTo] = useState("");
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

  function handleSubmit(e) {
    e.preventDefault();
    setApplied({ from: draftFrom, to: draftTo });
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
  const isDataEligible =
    Boolean(applied) &&
    draftMatchesApplied &&
    !isCurrentLoading &&
    view?.outcome === WINTER_ROUTE_OUTCOME.GEOMETRY_ONLY &&
    (isWinterRouteDataPair(applied.from, applied.to) ||
      (isRingPair && (ringSelectedOption === "south" || ringSelectedOption === "north")));
  const dataGeometryId = isDataEligible ? view.payload.geometryId : null;
  const dataOption = isDataEligible && isRingPair ? ringSelectedOption : null;
  const currentDataKey = isDataEligible && dataGeometryId ? `${applied.from}|${applied.to}|${dataOption ?? ""}|${dataGeometryId}` : null;
  const isDataLoading = dataRequestState.loading && dataRequestState.key === currentDataKey;
  const dataView = !dataRequestState.loading && dataRequestState.key === currentDataKey ? dataRequestState.result : null;

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
          search={searchFrom}
          onSearchChange={setSearchFrom}
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
          search={searchTo}
          onSearchChange={setSearchTo}
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
              onClick={() => runRequest(applied.from, applied.to, currentOption, "retry")}
              className="mt-2 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              {t("winterRouteRetryButton")}
            </button>
          </div>
        ) : view?.outcome === WINTER_ROUTE_OUTCOME.NO_ROUTE ? (
          <p className="text-sm text-slate-600 dark:text-slate-300">{t("winterRouteNoRouteYet")}</p>
        ) : view?.outcome === WINTER_ROUTE_OUTCOME.SAME_PLACE || view?.outcome === WINTER_ROUTE_OUTCOME.GEOMETRY_ONLY ? (
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
        <div data-testid="winter-route-data" className="mt-4 rounded-xl border border-slate-200/70 bg-white/70 px-4 py-3 dark:border-slate-800/70 dark:bg-slate-900/70">
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
          {dataView?.ok ? <WinterRouteDataView data={dataView.payload} t={t} lang={lang} /> : null}
        </div>
      ) : null}
    </div>
  );
}

export default function WinterRoute() {
  const { t, lang, theme } = usePageRouteProps();
  useThemeClass(theme === "dark");

  // Ticket #502, P1(a) — "Velja staði" (geometry mode) is the default,
  // primary mode; the legacy fixed-route weather flow below is opt-in via
  // "Fastar veðurleiðir". Switching modes never clears the other mode's
  // own state (routeId/data stay put if the user switches back).
  const [mode, setMode] = useState(WINTER_ROUTE_MODE_CHOOSE);

  const [routeId, setRouteId] = useState(DEFAULT_WINTER_ROUTE_ID);
  const [data, setData] = useState(null);
  // Ticket #491, V2 — tagged with the routeId the error belongs to (the
  // routeId captured in the fetch effect's closure, i.e. the route that
  // was actually requested), so a stale error from a route the user has
  // since switched away from can be told apart from the CURRENT route's
  // own error at render time. See `viewErrorKey` below.
  const [loadError, setLoadError] = useState(null); // { routeId, key: "winterRouteRoadFeedUnavailable" | "winterRouteRouteDataMismatch" } | null
  const [selectedHour, setSelectedHour] = useState(null);

  const selectedRouteOption = useMemo(
    () => WINTER_ROUTE_OPTIONS.find((o) => o.routeId === routeId) ?? WINTER_ROUTE_OPTIONS[0],
    [routeId]
  );
  const routeName = lang === "en" ? selectedRouteOption.nameEn : selectedRouteOption.nameIs;

  // Ticket #491 — replaces the old #486 `fetchedRef`/mount-only guard,
  // which deliberately fetched at most ONCE PER MOUNT and therefore could
  // never support a route switch (a second `routeId` would never trigger a
  // new fetch). `lastRequestedRouteIdRef` now guards "has a fetch already
  // been started for THIS routeId" rather than "has any fetch ever
  // started" — a real `routeId` change always starts a genuinely new
  // fetch, but React 18 StrictMode's dev-only synthetic double-invoke of
  // the INITIAL mount's effect (mount -> cleanup -> mount again, same
  // routeId both times) is correctly collapsed back to a single real
  // request, exactly like the old behaviour, WITHOUT reintroducing the
  // actual #490 R1 bug: that bug was the first invocation's own
  // still-in-flight (never aborted) fetch having its eventual real
  // response silently discarded by a `cancelled` flag the synthetic
  // cleanup flipped — not "too many requests". Here, the synthetic
  // second invocation returns early and touches nothing (no abort, no
  // flag), so the first invocation's single real fetch is left
  // completely alone and its response is applied normally when it
  // resolves. `controllerRef` aborts only a previous GENUINELY abandoned
  // route's in-flight request (never the current one) when a real switch
  // happens, and `requestIdRef` is the final authoritative guard so a
  // late-arriving response for an abandoned route can never overwrite the
  // current route's state even if abort() itself doesn't actually stop a
  // fetch already past that point in some runtime (defensive, not the
  // only safeguard). `selectedHour` is deliberately left untouched here;
  // the existing availableHours-reconciliation effect below already keeps
  // it only if still valid in the new data, otherwise picks the new
  // route's first available hour once that data arrives.
  //
  // Ticket #491, V2 correction: an earlier version of this comment (and
  // of cc-report-implementation.md) claimed `data`/`loadError` were
  // "cleared synchronously at the top of a GENUINE switch (same render
  // pass the routeId state change is applied in)" via setData(null)/
  // setLoadError(null) calls made here. That claim was wrong — those
  // calls ran inside this PASSIVE EFFECT, which commits one render pass
  // AFTER the `routeId` state change itself (not in the same pass), so a
  // route switch really could commit one frame with the new routeId
  // selected next to the previous route's still-current `data`/
  // `loadError`. This effect no longer calls setData(null)/
  // setLoadError(null) at all: `data` and `loadError` now carry the
  // `routeId` they belong to (the response's own `routeId`, or the
  // routeId captured in this closure for an error), and `view`/
  // `viewErrorKey` below mask either one at RENDER TIME whenever that tag
  // no longer matches the currently selected `routeId` — so the masking
  // itself lands in the exact same render pass as the `routeId` state
  // change, with no extra state update required.
  const requestIdRef = useRef(0);
  const controllerRef = useRef(null);
  const lastRequestedRouteIdRef = useRef(null);
  useEffect(() => {
    // Ticket #502, P1(b) — the legacy fixed-route fetch must never start
    // while "Velja staði" (geometry mode) is active; it begins the first
    // time the user actually switches to "Fastar veðurleiðir" and then
    // keeps the existing "once per routeId" semantics from then on (this
    // early return, not the ref assignment below, is what gates it —
    // toggling back to legacy mode again never re-fetches the same
    // routeId it already fetched once).
    if (mode !== WINTER_ROUTE_MODE_LEGACY) return undefined;

    if (lastRequestedRouteIdRef.current === routeId) {
      // StrictMode's synthetic re-invocation for the SAME routeId a fetch
      // was already started for this render cycle — do nothing.
      return undefined;
    }
    lastRequestedRouteIdRef.current = routeId;

    controllerRef.current?.abort(); // stop a previous, now-abandoned route's request, if any
    const controller = new AbortController();
    controllerRef.current = controller;

    const thisRequestId = ++requestIdRef.current;

    const url = routeId === DEFAULT_WINTER_ROUTE_ID ? "/api/winter-route" : `/api/winter-route?routeId=${routeId}`;

    fetch(url, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error("winter_route_fetch_failed");
        return res.json();
      })
      .then((payload) => {
        if (requestIdRef.current !== thisRequestId) return; // superseded by a later route switch

        // B3 — the response must match THIS page's own expectation for the
        // route it was requested for, not just "some" 200 response: a
        // wrong routeId, a point-count contract mismatch, or (when the
        // forecast is actually available) a points array of the wrong
        // length is a route-scoped error, never a silent partial/wrong-
        // route view.
        const expected = expectedPointCountForRoute(routeId);
        const forecastPointCountOk =
          !payload?.forecast?.available || payload.forecast.points.length === expected;
        if (payload?.routeId !== routeId || payload?.expectedPointCount !== expected || !forecastPointCountOk) {
          setLoadError({ routeId, key: "winterRouteRouteDataMismatch" });
          return;
        }
        setData(payload);
      })
      .catch((err) => {
        if (err?.name === "AbortError") return;
        if (requestIdRef.current !== thisRequestId) return;
        setLoadError({ routeId, key: "winterRouteRoadFeedUnavailable" });
      });

    return undefined;
  }, [routeId, mode]);

  // Ticket #491, V2 — route-bound view of `data`/`loadError`, derived at
  // render time (not via a setData(null)/setLoadError(null) call inside
  // the passive effect above — see its corrected comment). `data` only
  // "counts" for display when its own `routeId` still matches the
  // currently selected `routeId`; same for `loadError`'s captured
  // `routeId`. This is what actually prevents a route switch from ever
  // committing the new selection's title/disclaimers next to the
  // previous route's stale cards/segments/error — the masking lands in
  // the exact same render pass as the `routeId` state change itself.
  const view = data?.routeId === routeId ? data : null;
  const viewErrorKey = loadError?.routeId === routeId ? loadError.key : null;

  const now = useNowTicking();

  const availableHours = useMemo(() => {
    const hours = view?.forecast?.available ? view.forecast.window.expectedHours : [];
    return hours.filter((h) => new Date(`${h}:00Z`).getTime() > now.getTime());
  }, [view, now]);

  useEffect(() => {
    if (availableHours.length === 0) return;
    if (!selectedHour || !availableHours.includes(selectedHour)) {
      setSelectedHour(availableHours[0]);
    }
  }, [availableHours, selectedHour]);

  // Ticket #493 — the one shared, valid selected forecast hour, computed
  // fresh EVERY render (not via an effect): `selectedHour` only "counts"
  // when it is still present in the CURRENT `availableHours` (same filter
  // the hour `<select>` itself uses). This is what keeps an empty window, a
  // selection that just expired (the once-a-minute `availableHours`
  // re-filter above), or the first render right after a route switch whose
  // new window doesn't contain the old selection from ever showing stale
  // values for a time the picker itself calls unavailable — the
  // reconciliation effect above still runs to pick a new valid hour, but
  // `effectiveHour` is correct in the very same render pass regardless,
  // one render before that effect would otherwise fire.
  const effectiveHour = selectedHour && availableHours.includes(selectedHour) ? selectedHour : null;

  // Ticket #502, P1(e) — in geometry mode, the h1/<title> follow the
  // applied Frá/Til result (e.g. "Reykjavík (Rauðavatn) → Selfoss"), never
  // the legacy routeName, and never a drawn-out draft (only the APPLIED
  // pair, reported up by the section itself once "Sýna leið" is pressed).
  // Before any pair has been applied, a neutral generic heading is shown.
  const [geometryApplied, setGeometryApplied] = useState(null);
  const geometryTitle = geometryApplied
    ? `${winterRoutePlaceName(geometryApplied.from, lang)} → ${winterRoutePlaceName(geometryApplied.to, lang)}`
    : t("winterRouteModeChooseLabel");
  const pageTitle = mode === WINTER_ROUTE_MODE_LEGACY ? routeName : geometryTitle;

  return (
    <>
      <Helmet>
        <title>{pageTitle} · {lang === "en" ? "Chase the Weather" : "Eltum Veðrið"}</title>
      </Helmet>

      <div className="min-h-screen bg-soft-grid text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        <header className="sticky top-0 z-30 border-b border-slate-200/60 bg-white/80 backdrop-blur-sm dark:border-slate-800/60 dark:bg-slate-950/80">
          <div className="mx-auto flex max-w-4xl items-center px-6 py-3">
            <Brand t={t} size="full" lang={lang} hideTagline />
          </div>
        </header>

        <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
          <h1 className="text-2xl font-black tracking-tight md:text-3xl">{pageTitle}</h1>

          {/* Ticket #502, P1(a)/P6 — mode toggle. "Velja staði" is the
              primary/default mode; "Fastar veðurleiðir" is the existing
              #486/#491 flow, now opt-in. Switching modes is a plain state
              change, never a request by itself. */}
          <div role="group" aria-label={t("winterRouteModeGroupLabel")} className="mt-3 inline-flex rounded-lg border border-slate-300 p-1 dark:border-slate-700">
            <button
              type="button"
              aria-pressed={mode === WINTER_ROUTE_MODE_CHOOSE}
              onClick={() => setMode(WINTER_ROUTE_MODE_CHOOSE)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                mode === WINTER_ROUTE_MODE_CHOOSE
                  ? "bg-sky-600 text-white"
                  : "text-slate-600 dark:text-slate-300"
              }`}
            >
              {t("winterRouteModeChooseLabel")}
            </button>
            <button
              type="button"
              aria-pressed={mode === WINTER_ROUTE_MODE_LEGACY}
              onClick={() => setMode(WINTER_ROUTE_MODE_LEGACY)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                mode === WINTER_ROUTE_MODE_LEGACY
                  ? "bg-sky-600 text-white"
                  : "text-slate-600 dark:text-slate-300"
              }`}
            >
              {t("winterRouteModeLegacyLabel")}
            </button>
          </div>

          {/* Ticket #502 — both mode sections stay mounted at all times
              (never conditionally unmounted via a ternary), hidden with
              the native `hidden` attribute instead: this is what lets
              each mode's own in-progress state (the geometry section's
              draft/applied/request; the legacy section's routeId/data/
              lastRequestedRouteIdRef dedup) survive round-tripping through
              the other mode, exactly like switching back to an already-
              fetched legacy route never re-fetches it. */}
          <div hidden={mode !== WINTER_ROUTE_MODE_CHOOSE}>
            <WinterRouteGeometrySection t={t} lang={lang} onAppliedChange={setGeometryApplied} />
          </div>

          <div hidden={mode !== WINTER_ROUTE_MODE_LEGACY}>
          <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">{t("winterRouteSubtitle")}</p>
          <p className="mt-1 text-xs italic text-slate-500 dark:text-slate-400">{t("winterRouteLatestStatusNote")}</p>

          {/* Ticket #491 — native IS/EN route select, Vík default, single
              existing entrypoint (same page). onChange calls setRouteId
              directly (no focus-moving ref/effect attached to it, same
              reasoning as the hour <select>'s own #490 R1 fix: never
              interrupt native keyboard stepping). */}
          <div className="mt-4">
            <label htmlFor="winter-route-select" className="text-sm font-medium text-slate-700 dark:text-slate-200">
              {t("winterRouteRouteSelectLabel")}
            </label>
            <select
              id="winter-route-select"
              className="mt-1 block w-full max-w-xs rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 dark:border-slate-700 dark:bg-slate-900"
              value={routeId}
              onChange={(e) => setRouteId(e.target.value)}
            >
              {WINTER_ROUTE_OPTIONS.map((opt) => (
                <option key={opt.routeId} value={opt.routeId}>
                  {lang === "en" ? opt.nameEn : opt.nameIs}
                </option>
              ))}
            </select>
          </div>

          {viewErrorKey ? (
            <p className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
              {t(viewErrorKey)}
            </p>
          ) : null}

          {view ? (
            <>
              <RouteSummary data={view} effectiveHour={effectiveHour} t={t} lang={lang} />

              <section className="mt-6">
                <h2 className="text-lg font-semibold">
                  {t("winterRouteForecastSectionTitle").replace("{count}", String(view.expectedPointCount))}
                </h2>

                {view.forecast.available ? (
                  <div className="mt-3">
                    <label htmlFor="winter-route-hour" className="text-sm font-medium text-slate-700 dark:text-slate-200">
                      {t("winterRouteHourLabel")}
                    </label>
                    {availableHours.length === 0 ? (
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t("winterRouteNoHoursAvailable")}</p>
                    ) : (
                      <select
                        id="winter-route-hour"
                        className="mt-1 block w-full max-w-xs rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 dark:border-slate-700 dark:bg-slate-900"
                        value={selectedHour ?? ""}
                        onChange={(e) => setSelectedHour(e.target.value)}
                      >
                        {availableHours.map((h) => (
                          <option key={h} value={h}>
                            {formatHourLabel(h)}
                          </option>
                        ))}
                      </select>
                    )}

                    {/* Ticket #493 — the one shared forecast hour applies to
                        every point below; stated once here rather than
                        repeated per card/metric line. */}
                    <p className="mt-1 text-xs italic text-slate-500 dark:text-slate-400">
                      {t("winterRouteSameForecastTimeNote")}
                    </p>
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{t("winterRouteForecastUnavailable")}</p>
                )}

                {view.forecast.available && view.forecast.stale ? (
                  <p className="mt-2 text-xs text-amber-600 dark:text-amber-300">
                    {t("winterRouteForecastStaleServed").replace(
                      "{minutes}",
                      String(Math.round((view.forecast.cacheAgeMs || 0) / 60000))
                    )}
                  </p>
                ) : null}

                {view.forecast.available ? (
                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
                    {view.forecast.points.map((point) => (
                      <ForecastCard key={point.id} point={point} effectiveHour={effectiveHour} t={t} lang={lang} />
                    ))}
                  </div>
                ) : null}
              </section>

              <section className="mt-8">
                <h2 className="text-lg font-semibold">{t("winterRouteRoadSectionTitle")}</h2>

                {/* B6/item 6 — Borgarnes reuses a few IDBUTUR whose road-
                    condition line covers a longer stretch than the part
                    this route actually drives (e.g. 904040037/
                    904690037); said once here, not per-segment. */}
                {routeId !== DEFAULT_WINTER_ROUTE_ID ? (
                  <p className="mt-1 text-xs italic text-slate-500 dark:text-slate-400">{t("winterRouteSectionCoverageNote")}</p>
                ) : null}

                {!view.roadMeta.available ? (
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{t("winterRouteRoadFeedUnavailable")}</p>
                ) : null}
                {view.roadMeta.stale ? (
                  <p className="mt-2 text-xs text-amber-600 dark:text-amber-300">
                    {t("winterRouteRoadStaleServed").replace(
                      "{minutes}",
                      String(Math.round((view.roadMeta.cacheAgeMs || 0) / 60000))
                    )}
                  </p>
                ) : null}

                {view.roadMeta.pointsFeedUnavailableOrStale ? (
                  <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
                    <p>{t("winterRoutePointsFeedUnavailable")}</p>
                    {/* Round 3 (R5-2): same retained VEGAGERDIN_LINKS[lang]
                        already used at the page bottom — no new URL. */}
                    <a
                      href={VEGAGERDIN_LINKS[lang === "en" ? "en" : "is"]}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-block underline underline-offset-2 hover:text-amber-900 dark:hover:text-amber-100"
                    >
                      {t("winterRouteOfficialSourceLinkRoad")}
                    </a>
                  </div>
                ) : null}

                <ol className="mt-3 space-y-2">
                  {view.segments.map((segment) => (
                    <SegmentRow key={segment.idButur} segment={segment} t={t} lang={lang} />
                  ))}
                </ol>
              </section>

              <section className="mt-8 rounded-xl border border-slate-200/70 bg-white/60 px-4 py-4 text-xs leading-relaxed text-slate-500 dark:border-slate-800/70 dark:bg-slate-900/60 dark:text-slate-400">
                <p>{t("winterRouteAttributionRoadLine")}</p>
                <p>{t("winterRouteAcquiredAt").replace("{time}", formatTimestamp(view.generatedAt))}</p>
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
            </>
          ) : !viewErrorKey ? (
            <p className="mt-6 text-sm text-slate-500 dark:text-slate-400">…</p>
          ) : null}
          </div>
        </main>

        <Footer t={t} />
      </div>
    </>
  );
}
