import { useEffect, useState } from "react";
import CampsitePicker from "./CampsitePicker";
import { getForecast } from "../lib/forecastCache";
import {
  compareCampsiteForecasts,
  getHourlyComparisonWinner,
  WIND_DIFF_THRESHOLD,
  RAIN_DIFF_THRESHOLD,
  TEMP_DIFF_THRESHOLD,
} from "../utils/compareCampsiteForecasts";
import { formatDay } from "../utils/date";
import { formatNumber } from "../lib/scoring";

// Extracts per-hour raw slices for a YYYY-MM-DD date from raw forecast data.
// Returns objects with Open-Meteo field names — the shape getHourlyComparisonWinner expects.
// Do NOT pass normalized daily rows here; these are RAW cache values.
function extractHourlyForDate(rawHourly, date) {
  if (!rawHourly?.time || !date) return [];
  return rawHourly.time
    .map((time, i) => ({
      time,
      hour: Number(String(time).slice(11, 13)),
      windspeed_10m: rawHourly.windspeed_10m?.[i] ?? null,
      windgusts_10m: rawHourly.windgusts_10m?.[i] ?? null,
      precipitation: rawHourly.precipitation?.[i] ?? null,
      temperature_2m: rawHourly.temperature_2m?.[i] ?? null,
    }))
    .filter(
      (row) =>
        String(row.time).startsWith(date) &&
        Number.isFinite(row.hour) &&
        row.hour % 3 === 0
    );
}

// Returns 3 factor rows (wind/gusts, rain, temp) for a day, always showing A vs B.
// better: "A" | "B" | "similar" — determined by the exported threshold constants.
function buildFactorRows(result, dailyA, dailyB) {
  if (!dailyA?.time || !dailyB?.time) return null;

  const idxA = dailyA.time.indexOf(result.date);
  const idxB = dailyB.time.indexOf(result.date);
  if (idxA === -1 || idxB === -1) return null;

  const windA = dailyA.windspeed_10m_max?.[idxA] ?? null;
  const windB = dailyB.windspeed_10m_max?.[idxB] ?? null;
  const gustA = dailyA.windgusts_10m_max?.[idxA] ?? null;
  const gustB = dailyB.windgusts_10m_max?.[idxB] ?? null;
  const rainA = dailyA.precipitation_sum?.[idxA] ?? null;
  const rainB = dailyB.precipitation_sum?.[idxB] ?? null;
  const tmaxA = dailyA.temperature_2m_max?.[idxA] ?? null;
  const tmaxB = dailyB.temperature_2m_max?.[idxB] ?? null;

  const windDiff = windA != null && windB != null ? Math.abs(windA - windB) : -Infinity;
  const gustDiff = gustA != null && gustB != null ? Math.abs(gustA - gustB) : -Infinity;
  const useGust = gustDiff > windDiff;

  function lowerIsBetter(vA, vB, threshold) {
    if (vA == null || vB == null) return "similar";
    return Math.abs(vA - vB) < threshold ? "similar" : vA < vB ? "A" : "B";
  }

  function higherIsBetter(vA, vB, threshold) {
    if (vA == null || vB == null) return "similar";
    return Math.abs(vA - vB) < threshold ? "similar" : vA > vB ? "A" : "B";
  }

  return [
    {
      labelKey: useGust ? "comparisonFactorGusts" : "comparisonFactorWind",
      valA: useGust ? gustA : windA,
      valB: useGust ? gustB : windB,
      unit: "m/s",
      better: lowerIsBetter(
        useGust ? gustA : windA,
        useGust ? gustB : windB,
        WIND_DIFF_THRESHOLD
      ),
    },
    {
      labelKey: "comparisonFactorRain",
      valA: rainA,
      valB: rainB,
      unit: "mm",
      better: lowerIsBetter(rainA, rainB, RAIN_DIFF_THRESHOLD),
    },
    {
      labelKey: "comparisonFactorTemp",
      valA: tmaxA,
      valB: tmaxB,
      unit: "°C",
      better: higherIsBetter(tmaxA, tmaxB, TEMP_DIFF_THRESHOLD),
    },
  ];
}

function HourlyComparisonBreakdown({ rawDataA, rawDataB, date, siteA, siteB, t }) {
  // Slice raw hourly data by date — results have Open-Meteo field names for getHourlyComparisonWinner
  const slicesA = extractHourlyForDate(rawDataA?.hourly, date);
  const slicesB = extractHourlyForDate(rawDataB?.hourly, date);
  const len = Math.min(slicesA.length, slicesB.length);

  if (len === 0) {
    return (
      <p className="py-2 text-xs text-slate-500 dark:text-slate-400">
        {t("comparisonNoHourly")}
      </p>
    );
  }

  return (
    <div>
      {Array.from({ length: len }, (_, i) => {
        const hourA = slicesA[i];
        const hourB = slicesB[i];
        // SHAPE CHECK: hourA/hourB have windspeed_10m, windgusts_10m, precipitation, temperature_2m
        // This is the RAW Open-Meteo hourly shape that getHourlyComparisonWinner expects.
        const result = getHourlyComparisonWinner(hourA, hourB);
        const timeLabel = String(hourA.time).slice(11, 16);

        let detail = null;
        if (result.winner !== "SIMILAR") {
          const winnerSite = result.winner === "A_BETTER" ? siteA : siteB;
          const wA = hourA.windspeed_10m;
          const wB = hourB.windspeed_10m;
          const gA = hourA.windgusts_10m;
          const gB = hourB.windgusts_10m;
          const rA = hourA.precipitation;
          const rB = hourB.precipitation;
          const tA = hourA.temperature_2m;
          const tB = hourB.temperature_2m;

          const parts = [];
          if (result.reasons.includes("calmer")) {
            const windDiff = wA != null && wB != null ? Math.abs(wA - wB) : -Infinity;
            const gustDiff = gA != null && gB != null ? Math.abs(gA - gB) : -Infinity;
            const useGust = gustDiff > windDiff;
            const diff = useGust ? gustDiff : windDiff;
            if (Number.isFinite(diff)) {
              parts.push(
                t(useGust ? "comparisonHrCalmerGust" : "comparisonHrCalmer").replace(
                  "{diff}",
                  formatNumber(diff, 1)
                )
              );
            }
          }
          if (result.reasons.includes("drier") && rA != null && rB != null) {
            parts.push(
              t("comparisonHrDrier").replace("{diff}", formatNumber(Math.abs(rA - rB), 1))
            );
          }
          if (result.reasons.includes("warmer") && tA != null && tB != null) {
            parts.push(
              t("comparisonHrWarmer").replace("{diff}", formatNumber(Math.abs(tA - tB), 1))
            );
          }

          detail = (
            <span>
              <span className={`font-medium ${result.winner === "A_BETTER" ? "text-emerald-700 dark:text-emerald-400" : "text-sky-700 dark:text-sky-400"}`}>
                {winnerSite.name}
              </span>
              {parts.length > 0 && (
                <span className="text-slate-500 dark:text-slate-400">: {parts.join(", ")}</span>
              )}
            </span>
          );
        }

        return (
          <div
            key={hourA.time}
            className="flex items-baseline gap-3 border-b border-slate-100 py-1.5 text-xs last:border-0 dark:border-slate-800/60"
          >
            <span className="w-10 shrink-0 font-mono font-medium text-slate-400 dark:text-slate-500">
              {timeLabel}
            </span>
            <span className="min-w-0 flex-1">
              {result.winner === "SIMILAR" ? (
                <span className="text-slate-400 dark:text-slate-500">{t("comparisonHrSimilar")}</span>
              ) : (
                detail
              )}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function DailyComparisonRow({ result, rawDataA, rawDataB, siteA, siteB, t, lang }) {
  const [expanded, setExpanded] = useState(false);

  const dateLabel = formatDay(result.date, lang);
  const isSimilar = result.winner === "SIMILAR";

  const winnerSite =
    result.winner === "A_BETTER" ? siteA : result.winner === "B_BETTER" ? siteB : null;

  const summaryLine = isSimilar
    ? t("comparisonDaySimilar")
    : t("comparisonDayBetter").replace("{site}", winnerSite?.name ?? "");

  const factorRows = buildFactorRows(result, rawDataA?.daily, rawDataB?.daily);

  return (
    <div>
      <div className="flex items-start gap-3 py-3">
        <span className="w-[4.5rem] shrink-0 pt-0.5 text-xs text-slate-400 dark:text-slate-500">
          {dateLabel}
        </span>
        <div className="min-w-0 flex-1">
          <p
            className={`text-sm ${
              isSimilar
                ? "text-slate-500 dark:text-slate-400"
                : result.winner === "A_BETTER"
                ? "font-medium text-emerald-700 dark:text-emerald-400"
                : "font-medium text-sky-700 dark:text-sky-400"
            }`}
          >
            {summaryLine}
          </p>
          {factorRows && (
            <div className="mt-1.5 space-y-0.5">
              {factorRows.map((row) => (
                <div key={row.labelKey} className="flex flex-wrap items-baseline gap-x-2 text-xs">
                  <span className="shrink-0 text-slate-400 dark:text-slate-500">
                    {t(row.labelKey)}
                  </span>
                  <span className="text-slate-500 dark:text-slate-400">
                    {row.valA != null ? formatNumber(row.valA, 1) : "—"}
                    {" vs "}
                    {row.valB != null ? formatNumber(row.valB, 1) : "—"}
                    {" "}
                    {row.unit}
                  </span>
                  <span
                    className={
                      row.better === "A"
                        ? "text-emerald-700 dark:text-emerald-400"
                        : row.better === "B"
                        ? "text-sky-700 dark:text-sky-400"
                        : "text-slate-400 dark:text-slate-500"
                    }
                  >
                    {row.better === "A"
                      ? siteA.name
                      : row.better === "B"
                      ? siteB.name
                      : t("comparisonHrSimilar")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="shrink-0 rounded px-2 py-0.5 text-xs text-sky-600 hover:bg-sky-50 dark:text-sky-400 dark:hover:bg-sky-900/30"
        >
          {expanded ? t("comparisonHideHourly") : t("comparisonShowHourly")}
        </button>
      </div>

      {expanded && (
        <div className="pb-3 pl-[5.25rem]">
          <HourlyComparisonBreakdown
            rawDataA={rawDataA}
            rawDataB={rawDataB}
            date={result.date}
            siteA={siteA}
            siteB={siteB}
            t={t}
          />
        </div>
      )}
    </div>
  );
}

export default function CampsiteComparisonSection({ siteList, t, lang, currentSiteId }) {
  const [siteIdA, setSiteIdA] = useState(currentSiteId ?? null);
  const [siteIdB, setSiteIdB] = useState(null);

  const [rawDataA, setRawDataA] = useState(null);
  const [rawDataB, setRawDataB] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState(null);

  const siteA = siteList.find((s) => s.id === siteIdA) ?? null;
  const siteB = siteList.find((s) => s.id === siteIdB) ?? null;

  const latA = siteA?.lat != null ? Number(siteA.lat) : null;
  const lonA = siteA?.lon != null ? Number(siteA.lon) : null;
  const latB = siteB?.lat != null ? Number(siteB.lat) : null;
  const lonB = siteB?.lon != null ? Number(siteB.lon) : null;

  const sameSite = !!(siteIdA && siteIdB && siteIdA === siteIdB);
  const bothSelected = !!(
    siteIdA && siteIdB && !sameSite &&
    Number.isFinite(latA) && Number.isFinite(lonA) &&
    Number.isFinite(latB) && Number.isFinite(lonB)
  );

  useEffect(() => {
    if (!siteIdA || !siteIdB || siteIdA === siteIdB || !latA || !lonA || !latB || !lonB) {
      setResults(null);
      setRawDataA(null);
      setRawDataB(null);
      setError(null);
      return;
    }

    let cancelled = false;

    async function run() {
      setLoading(true);
      setError(null);

      try {
        // 2 fetches: one per site. getForecast handles caching and deduplication.
        const [dataA, dataB] = await Promise.all([
          getForecast({ lat: latA, lon: lonA }),
          getForecast({ lat: latB, lon: lonB }),
        ]);

        if (cancelled) return;

        const rowsA = (dataA.daily.time || []).map((date, i) => ({
          date,
          windMax: dataA.daily.windspeed_10m_max?.[i] ?? null,
          windGust: dataA.daily.windgusts_10m_max?.[i] ?? null,
          rain: dataA.daily.precipitation_sum?.[i] ?? null,
          tmax: dataA.daily.temperature_2m_max?.[i] ?? null,
        }));
        const rowsB = (dataB.daily.time || []).map((date, i) => ({
          date,
          windMax: dataB.daily.windspeed_10m_max?.[i] ?? null,
          windGust: dataB.daily.windgusts_10m_max?.[i] ?? null,
          rain: dataB.daily.precipitation_sum?.[i] ?? null,
          tmax: dataB.daily.temperature_2m_max?.[i] ?? null,
        }));

        const dayResults = compareCampsiteForecasts(rowsA, rowsB);

        // Store full raw data so hourly expansion can slice it without a new fetch.
        setRawDataA(dataA);
        setRawDataB(dataB);
        setResults(dayResults);
      } catch (err) {
        if (cancelled) return;
        setError(String(err?.message || err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [siteIdA, siteIdB, latA, lonA, latB, lonB]);

  return (
    <div className="relative z-30 mb-4 rounded-2xl border border-slate-200/70 bg-white/80 p-5 shadow-sm backdrop-blur-sm dark:border-slate-700/70 dark:bg-slate-900/70">
      <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
        {t("comparisonTitle")}
      </h2>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t("comparisonIntro")}</p>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <p className="mb-1.5 text-xs font-medium text-slate-600 dark:text-slate-400">
            {t("comparisonSiteALabel")}
          </p>
          <CampsitePicker
            siteList={siteList}
            siteId={siteIdA}
            onSelectSite={setSiteIdA}
            t={t}
          />
        </div>
        <div>
          <p className="mb-1.5 text-xs font-medium text-slate-600 dark:text-slate-400">
            {t("comparisonSiteBLabel")}
          </p>
          <CampsitePicker
            siteList={siteList}
            siteId={siteIdB}
            onSelectSite={setSiteIdB}
            t={t}
          />
        </div>
      </div>

      {sameSite && (
        <p className="mt-3 text-sm text-amber-700 dark:text-amber-300">
          {t("comparisonSameSite")}
        </p>
      )}

      {!sameSite && !(siteIdA && siteIdB) && (
        <p className="mt-4 text-sm text-slate-400 dark:text-slate-500">
          {t("comparisonEmpty")}
        </p>
      )}

      {bothSelected && loading && (
        <p className="mt-4 animate-pulse text-sm text-slate-500 dark:text-slate-400">
          {t("comparisonLoading")}
        </p>
      )}

      {bothSelected && !loading && error && (
        <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
          {t("comparisonError")}
        </p>
      )}

      {bothSelected && !loading && !error && results && results.length > 0 && (
        <div className="mt-4 overflow-hidden rounded-xl border border-slate-200/70 dark:border-slate-700/70">
          <div className="flex flex-wrap gap-x-4 gap-y-1 border-b border-slate-100 bg-slate-50/80 px-3 py-2 text-xs font-medium text-slate-500 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" aria-hidden="true" />
              A: {siteA.name}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-full bg-sky-500" aria-hidden="true" />
              B: {siteB.name}
            </span>
          </div>
          <div className="divide-y divide-slate-100 bg-white px-3 dark:divide-slate-800/60 dark:bg-slate-900/60">
            {results.map((result) => (
              <DailyComparisonRow
                key={result.date}
                result={result}
                rawDataA={rawDataA}
                rawDataB={rawDataB}
                siteA={siteA}
                siteB={siteB}
                t={t}
                lang={lang}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
