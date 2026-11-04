// src/pages/WinterRoute.jsx
//
// Ticket #486 — Rauðavatn–Vík winter road + forecast page. Standalone
// route (own Footer, like NorthernLightsLanding.jsx), no login/paywall.
// Fetches /api/winter-route exactly once on mount — hour selection is
// purely local (no new network request per selection, see "Spá" in the
// approved prompt), and the list of selectable hours is re-filtered every
// time the clock ticks past one (checked once a minute) without any
// refetch, so past hours simply drop out of the picker on their own.

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
  formatInstantHHMM,
  formatTimestamp,
  hourOfDayFromHourString,
} from "../lib/winterRoutePresentation";
import { resolvePointAtDeparture } from "../lib/winterRouteEta";
import { computeWeatherExtremaSummary, computeActiveNoticeSegmentCount } from "../lib/winterRouteSummary";
import { computeDepartureOptionSet, COMPARISON_UNAVAILABLE_REASON } from "../lib/winterRouteComparison";

const COMPARISON_REASON_KEY = {
  [COMPARISON_UNAVAILABLE_REASON.NOT_UPCOMING]: "winterRouteComparisonReasonNotUpcoming",
  [COMPARISON_UNAVAILABLE_REASON.ARRIVAL_OUTSIDE_WINDOW]: "winterRouteComparisonReasonArrivalOutsideWindow",
  [COMPARISON_UNAVAILABLE_REASON.POINT_UNAVAILABLE]: "winterRouteComparisonReasonPointUnavailable",
  [COMPARISON_UNAVAILABLE_REASON.METRIC_GAP]: "winterRouteComparisonReasonMetricGap",
};

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

function SegmentRow({ segment, t, lang }) {
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

function ForecastCard({ point, departureHour, t, lang }) {
  const label = lang === "en" ? point.labelEn : point.labelIs;

  if (!point.available) {
    return (
      <div className="rounded-xl border border-slate-200/70 bg-white/70 p-4 dark:border-slate-800/70 dark:bg-slate-900/70">
        <div className="font-medium text-slate-800 dark:text-slate-100">{label}</div>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{t("winterRoutePointUnavailable")}</p>
      </div>
    );
  }

  // ETA follow-up (#486): each point now resolves its OWN forecast hour
  // from the shared departure time + its own approximate distance from
  // the corridor start — no longer a single shared hourIndex across all
  // six cards. #489: resolution itself now lives in the shared
  // resolvePointAtDeparture() so the route-level summary reads the exact
  // same per-point time as this card — never a second parallel
  // computation. An unresolvable/out-of-window arrival is still an
  // explicit "not available" (hasHour: false), never a silent wrap.
  const { rawArrivalMs, forecastHour, hourIndex, hasHour } = resolvePointAtDeparture(point, departureHour);

  const temp = hasHour ? point.series.temperature_2m[hourIndex] : null;
  const wind = hasHour ? point.series.wind_speed_10m[hourIndex] : null;
  const gust = hasHour ? point.series.wind_gusts_10m[hourIndex] : null;
  const precip = hasHour ? point.series.precipitation[hourIndex] : null;
  const code = hasHour ? point.series.weather_code[hourIndex] : null;
  // N1: derive day/night from the resolved UTC hour's own "HH" digits
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

      {rawArrivalMs != null ? (
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {t("winterRouteEstimatedArrival").replace("{time}", formatInstantHHMM(rawArrivalMs))}
        </p>
      ) : null}

      {!hasHour ? (
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{t("winterRouteForecastNotAvailableAtComputedTime")}</p>
      ) : (
        <>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {t("winterRouteValidFor").replace("{time}", formatHourLabel(forecastHour))}
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
function SummaryMetricLine({ t, lang, metric, valueKey, missingKey }) {
  if (metric.isMissing) {
    return <p className="text-sm text-slate-600 dark:text-slate-300">{t(missingKey)}</p>;
  }

  const pointLabel = lang === "en" ? metric.point.labelEn : metric.point.labelIs;
  let line = t(valueKey)
    .replace("{value}", formatDecimal(metric.value, lang, 1))
    .replace("{point}", pointLabel)
    .replace("{time}", formatHourLabel(metric.hourString));

  if (metric.isPartial) {
    line += t("winterRouteSummaryPartialSuffix").replace("{count}", String(metric.validCount));
  }

  return <p className="text-sm text-slate-600 dark:text-slate-300">{line}</p>;
}

// #489 — route-level summary, positioned above the six cards and the road
// list. Weather extrema reuse the exact same per-point ETA resolution the
// cards use (resolvePointAtDeparture, via computeWeatherExtremaSummary —
// never a second ETA model); the notice count is independent of the
// selected departure time entirely (point-notice status is computed
// server-side from "now"). No positive styling anywhere here (S1) — the
// notice count never reads as a green/safe indicator, including when it is
// 0, and the fixed scope disclaimer is always shown regardless of the
// count's value.
function RouteSummary({ data, selectedHour, t, lang }) {
  const weatherSummary = useMemo(() => {
    const points = data.forecast?.available ? data.forecast.points : [];
    return computeWeatherExtremaSummary(points, selectedHour);
  }, [data.forecast, selectedHour]);
  const noticeSummary = computeActiveNoticeSegmentCount(data.segments, data.roadMeta);

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
        />
        <SummaryMetricLine
          t={t}
          lang={lang}
          metric={weatherSummary.maxPrecip}
          valueKey="winterRouteSummaryPrecip"
          missingKey="winterRouteSummaryPrecipMissing"
        />
        <SummaryMetricLine
          t={t}
          lang={lang}
          metric={weatherSummary.minTemp}
          valueKey="winterRouteSummaryMinTemp"
          missingKey="winterRouteSummaryMinTempMissing"
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

// #490 — one of the three departure options (−2h / selected / +2h). The
// baseline (`isBaseline`) is never a button (selecting the already-selected
// time is a no-op) — it is the stable, programmatically-focusable node
// (`tabIndex={-1}`) S3 requires after a user-driven selection. An
// unavailable option is still a real `<button disabled>` (not a plain
// `<div>`) with its reason rendered as visible text, never only a `title`
// attribute — satisfies S3's keyboard/screen-reader requirement directly.
function DepartureOptionCard({ option, label, isBaseline, baselineRef, onSelect, t, lang }) {
  const timeLabel = option.departureHour ? formatHourLabel(option.departureHour) : "—";
  const reasonKey = option.reason ? COMPARISON_REASON_KEY[option.reason] : null;

  const body = (
    <>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          {label}
        </span>
        {isBaseline ? (
          <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-semibold text-sky-800 dark:bg-sky-900/40 dark:text-sky-200">
            {t("winterRouteComparisonSelectedBadge")}
          </span>
        ) : null}
      </div>
      <p className="mt-1 text-sm font-medium text-slate-800 dark:text-slate-100">{timeLabel} UTC</p>

      {!option.available ? (
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{reasonKey ? t(reasonKey) : null}</p>
      ) : (
        <div className="mt-2 space-y-1">
          <SummaryMetricLine
            t={t}
            lang={lang}
            metric={option.summary.maxGust}
            valueKey="winterRouteSummaryGust"
            missingKey="winterRouteSummaryGustMissing"
          />
          <SummaryMetricLine
            t={t}
            lang={lang}
            metric={option.summary.maxPrecip}
            valueKey="winterRouteSummaryPrecip"
            missingKey="winterRouteSummaryPrecipMissing"
          />
          <SummaryMetricLine
            t={t}
            lang={lang}
            metric={option.summary.minTemp}
            valueKey="winterRouteSummaryMinTemp"
            missingKey="winterRouteSummaryMinTempMissing"
          />
        </div>
      )}
    </>
  );

  const sharedClass =
    "rounded-xl border border-slate-200/70 bg-white/70 p-3 text-left dark:border-slate-800/70 dark:bg-slate-900/70";

  if (isBaseline) {
    return (
      <div ref={baselineRef} tabIndex={-1} className={`${sharedClass} outline-none`}>
        {body}
      </div>
    );
  }

  if (!option.available) {
    return (
      <button type="button" disabled className={`${sharedClass} w-full cursor-not-allowed opacity-80`}>
        {body}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onSelect(option.departureHour)}
      className={`${sharedClass} w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500`}
    >
      {body}
      <span className="mt-2 inline-block text-xs font-medium text-sky-700 dark:text-sky-300">
        {t("winterRouteComparisonViewButton")}
      </span>
    </button>
  );
}

// #490 — small departure-time comparison area, rendered next to the
// existing departure picker/#489 summary. Gated by the caller (S2): only
// rendered once `data.forecast.available` and `selectedHour` both hold, so
// it never flashes three identical "unavailable" slots on first load or
// when the forecast itself is down — the page's existing loading/
// unavailable states already cover those cases. Each option independently
// reuses #489's own extrema computation (never a shared/new ETA model);
// road conditions/closures/notice count are explicitly NOT repeated here —
// one shared "latest status" note instead (S6).
function RouteComparison({ data, selectedHour, availableHours, onSelect, baselineRef, t, lang }) {
  const options = useMemo(() => {
    const points = data.forecast?.available ? data.forecast.points : [];
    return computeDepartureOptionSet(selectedHour, availableHours, points);
  }, [data.forecast, selectedHour, availableHours]);

  const labelFor = (offsetHours) => {
    if (offsetHours === -2) return t("winterRouteComparisonEarlierLabel");
    if (offsetHours === 2) return t("winterRouteComparisonLaterLabel");
    return t("winterRouteComparisonBaselineLabel");
  };

  return (
    <div className="mt-4 border-t border-slate-200/60 pt-3 dark:border-slate-800/60">
      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">{t("winterRouteComparisonHeading")}</h3>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{t("winterRouteComparisonRoadNote")}</p>

      {data.forecast.stale ? (
        <p className="mt-1 text-xs text-amber-600 dark:text-amber-300">
          {t("winterRouteForecastStaleServed").replace(
            "{minutes}",
            String(Math.round((data.forecast.cacheAgeMs || 0) / 60000))
          )}
        </p>
      ) : null}

      <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {options.map((option) => (
          <DepartureOptionCard
            key={option.offsetHours}
            option={option}
            label={labelFor(option.offsetHours)}
            isBaseline={option.offsetHours === 0}
            baselineRef={option.offsetHours === 0 ? baselineRef : null}
            onSelect={onSelect}
            t={t}
            lang={lang}
          />
        ))}
      </div>
    </div>
  );
}

export default function WinterRoute() {
  const { t, lang, theme } = usePageRouteProps();
  useThemeClass(theme === "dark");

  const [data, setData] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const [selectedHour, setSelectedHour] = useState(null);
  const fetchedRef = useRef(false);

  // Round 2 correction (N3, found via the real-browser pass): `fetchedRef`
  // alone already guarantees the real fetch below starts at most once per
  // mount, including across React 18 StrictMode's synthetic dev-only
  // double-invoke (mount -> cleanup -> mount again) — refs survive that
  // synthetic cycle, so the second invocation's own guard check skips it.
  // A separate per-invocation `cancelled` flag, FLIPPED BY THE CLEANUP OF
  // THE FIRST (guard-setting) INVOCATION, used to mark the one-and-only
  // in-flight fetch's own eventual result as "cancelled" before it ever
  // resolved — StrictMode's synthetic cleanup fires immediately, so the
  // real network response always arrived too late and `setData` was
  // silently skipped every time, in every real browser (confirmed via
  // Playwright against `npm run dev`; not caught by jsdom/RTL tests,
  // which do not render through `<StrictMode>`). No cancellation flag is
  // needed here: nothing crashes if this ever resolves after a genuine
  // unmount, it is just a harmless no-op state update on a discarded page.
  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    fetch("/api/winter-route")
      .then((res) => {
        if (!res.ok) throw new Error("winter_route_fetch_failed");
        return res.json();
      })
      .then((payload) => setData(payload))
      .catch(() => setLoadError(true));
  }, []);

  const now = useNowTicking();

  const availableHours = useMemo(() => {
    const hours = data?.forecast?.available ? data.forecast.window.expectedHours : [];
    return hours.filter((h) => new Date(`${h}:00Z`).getTime() > now.getTime());
  }, [data, now]);

  useEffect(() => {
    if (availableHours.length === 0) return;
    if (!selectedHour || !availableHours.includes(selectedHour)) {
      setSelectedHour(availableHours[0]);
    }
  }, [availableHours, selectedHour]);

  // #490 (S3, R1) — focus/announcement must only follow a comparison-button
  // selection, never the existing hour <select> (native keyboard behavior
  // fires `change` on every ArrowDown while the select is open; moving
  // focus away from it on each change breaks stepping through hours with
  // the keyboard — see result-review.md R1), and never the auto-select-
  // first-hour effect above or the once-a-minute availableHours re-filter.
  // The select's own onChange calls `setSelectedHour` directly (below) and
  // never touches `userInitiatedRef`, so it keeps native focus/announcement
  // behavior. `userInitiatedRef` is set synchronously right before the
  // state update that caused it, and consumed (reset to false) the first
  // time this effect runs afterward — so an unrelated re-render (e.g. a
  // language change re-creating `t`) can never accidentally replay the
  // focus move.
  const userInitiatedRef = useRef(false);
  const comparisonBaselineRef = useRef(null);
  const [comparisonAnnouncement, setComparisonAnnouncement] = useState("");

  const handleUserSelectHour = (hour) => {
    userInitiatedRef.current = true;
    setSelectedHour(hour);
  };

  useEffect(() => {
    if (!userInitiatedRef.current) return;
    userInitiatedRef.current = false;
    if (comparisonBaselineRef.current) comparisonBaselineRef.current.focus();
    if (selectedHour) {
      setComparisonAnnouncement(
        t("winterRouteComparisonSelectedAnnouncement").replace("{time}", formatHourLabel(selectedHour))
      );
    }
  }, [selectedHour, t]);

  return (
    <>
      <Helmet>
        <title>{t("winterRouteTitle")} · {lang === "en" ? "Chase the Weather" : "Eltum Veðrið"}</title>
      </Helmet>

      <div className="min-h-screen bg-soft-grid text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        <header className="sticky top-0 z-30 border-b border-slate-200/60 bg-white/80 backdrop-blur-sm dark:border-slate-800/60 dark:bg-slate-950/80">
          <div className="mx-auto flex max-w-4xl items-center px-6 py-3">
            <Brand t={t} size="full" lang={lang} hideTagline />
          </div>
        </header>

        <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
          <h1 className="text-2xl font-black tracking-tight md:text-3xl">{t("winterRouteTitle")}</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{t("winterRouteSubtitle")}</p>
          <p className="mt-1 text-xs italic text-slate-500 dark:text-slate-400">{t("winterRouteLatestStatusNote")}</p>

          {loadError ? (
            <p className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
              {t("winterRouteRoadFeedUnavailable")}
            </p>
          ) : null}

          {data ? (
            <>
              <RouteSummary data={data} selectedHour={selectedHour} t={t} lang={lang} />

              <section className="mt-6">
                <h2 className="text-lg font-semibold">{t("winterRouteForecastSectionTitle")}</h2>

                {data.forecast.available ? (
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

                    {/* #490 (S2): only once a baseline departure actually
                        exists — never a flash of three "unavailable" slots
                        on first load or when the forecast itself is down. */}
                    {selectedHour ? (
                      <RouteComparison
                        data={data}
                        selectedHour={selectedHour}
                        availableHours={availableHours}
                        onSelect={handleUserSelectHour}
                        baselineRef={comparisonBaselineRef}
                        t={t}
                        lang={lang}
                      />
                    ) : null}
                    <div aria-live="polite" className="sr-only">
                      {comparisonAnnouncement}
                    </div>
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{t("winterRouteForecastUnavailable")}</p>
                )}

                {data.forecast.available && data.forecast.stale ? (
                  <p className="mt-2 text-xs text-amber-600 dark:text-amber-300">
                    {t("winterRouteForecastStaleServed").replace(
                      "{minutes}",
                      String(Math.round((data.forecast.cacheAgeMs || 0) / 60000))
                    )}
                  </p>
                ) : null}

                {data.forecast.available ? (
                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
                    {data.forecast.points.map((point) => (
                      <ForecastCard key={point.id} point={point} departureHour={selectedHour} t={t} lang={lang} />
                    ))}
                  </div>
                ) : null}
              </section>

              <section className="mt-8">
                <h2 className="text-lg font-semibold">{t("winterRouteRoadSectionTitle")}</h2>

                {!data.roadMeta.available ? (
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{t("winterRouteRoadFeedUnavailable")}</p>
                ) : null}
                {data.roadMeta.stale ? (
                  <p className="mt-2 text-xs text-amber-600 dark:text-amber-300">
                    {t("winterRouteRoadStaleServed").replace(
                      "{minutes}",
                      String(Math.round((data.roadMeta.cacheAgeMs || 0) / 60000))
                    )}
                  </p>
                ) : null}

                {data.roadMeta.pointsFeedUnavailableOrStale ? (
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
                  {data.segments.map((segment) => (
                    <SegmentRow key={segment.idButur} segment={segment} t={t} lang={lang} />
                  ))}
                </ol>
              </section>

              <section className="mt-8 rounded-xl border border-slate-200/70 bg-white/60 px-4 py-4 text-xs leading-relaxed text-slate-500 dark:border-slate-800/70 dark:bg-slate-900/60 dark:text-slate-400">
                <p>{t("winterRouteAttributionRoadLine")}</p>
                <p>{t("winterRouteAcquiredAt").replace("{time}", formatTimestamp(data.generatedAt))}</p>
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
          ) : !loadError ? (
            <p className="mt-6 text-sm text-slate-500 dark:text-slate-400">…</p>
          ) : null}
        </main>

        <Footer t={t} />
      </div>
    </>
  );
}
