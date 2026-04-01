import React, { useEffect, useMemo, useState } from "react";
import LoadingShimmer from "./LoadingShimmer";
import { WeatherIcon } from "./WeatherIcon";
import { mapWeatherCodeToIconId } from "../utils/WeatherIconMapping";
import ScoreExplanation from "./ScoreExplanation";
import { getSiteAvailability } from "../config/availability";
import { HAZARDS_V1 } from "../config/hazards";
import { getPrecipitationLabel } from "../utils/precipitation";

import {
  convertTemp,
  convertRain,
  convertWind,
  convertDistanceKm,
  formatNumber,
  TEMP_UNIT_LABEL,
  RAIN_UNIT_LABEL,
  WIND_UNIT_LABEL,
  DIST_UNIT_LABEL,
} from "../lib/scoring";

// --- Hazard thresholds (keep in sync with relocationEngine normalizeConfig.hazards) ---

function computeWarningsFromRow(r) {
  const out = [];

  const wind = typeof r?.windMax === "number" ? r.windMax : null;
  const gust = typeof r?.windGust === "number" ? r.windGust : null;
  const rain = typeof r?.rain === "number" ? r.rain : null;
  const tmin = typeof r?.tmin === "number" ? r.tmin : null;
  const tmax = typeof r?.tmax === "number" ? r.tmax : null;

  // wind
  if (wind != null) {
    if (wind >= HAZARDS_V1.windHigh) out.push({ type: "wind", level: "high", value: wind });
    else if (wind >= HAZARDS_V1.windWarn) out.push({ type: "wind", level: "warn", value: wind });
  }

  // gust
  if (gust != null) {
    if (gust >= HAZARDS_V1.gustHigh) out.push({ type: "gust", level: "high", value: gust });
    else if (gust >= HAZARDS_V1.gustWarn) out.push({ type: "gust", level: "warn", value: gust });
  }

  // rain (daily)
  if (rain != null) {
    if (rain >= HAZARDS_V1.rainHigh) out.push({ type: "rain", level: "high", value: rain });
    else if (rain >= HAZARDS_V1.rainWarn) out.push({ type: "rain", level: "warn", value: rain });
  }

  // temp (use tmin for cold risk, tmax for heat risk)
  if (tmin != null) {
    if (tmin <= HAZARDS_V1.tempLowHigh) out.push({ type: "tempLow", level: "high", value: tmin });
    else if (tmin <= HAZARDS_V1.tempLowWarn)
      out.push({ type: "tempLow", level: "warn", value: tmin });
  }

  if (tmax != null) {
    if (tmax >= HAZARDS_V1.tempHighHigh) out.push({ type: "tempHigh", level: "high", value: tmax });
    else if (tmax >= HAZARDS_V1.tempHighWarn)
      out.push({ type: "tempHigh", level: "warn", value: tmax });
  }

  return out;
}

function rowHasHighWarning(warnings) {
  return Array.isArray(warnings) && warnings.some((w) => w?.level === "high");
}

function rowHasWarning(warnings) {
  return Array.isArray(warnings) && warnings.some((w) => w?.level === "warn");
}

export default function ForecastTable({
  site,
  userLoc,
  distanceToKm,
  rows,
  loading,
  error,
  units,
  weatherMap,
  mapSlot,
  lang,
  t,
  onSelectDay,
}) {
  const totalPoints = useMemo(() => rows.reduce((s, r) => s + (r.points ?? 0), 0), [rows]);

  const availability = useMemo(() => {
    if (!site?.id) return null;
    return getSiteAvailability(site.id, new Date());
  }, [site?.id]);

  const availabilityBadge = useMemo(() => {
    if (!availability) return null;

    // --- Seasonal closed (winter) ---
    // We don't know exact open day -> show generic "Most open in May"
    if (availability.isClosed && availability.mode === "seasonal") {
      const text = lang === "is" ? "🔒 Lokað" : "🔒 Closed";
      const title =
        typeof t === "function"
          ? t("availabilityMostOpenInMay")
          : lang === "is"
            ? "Flest tjaldsvæði opna í maí."
            : "Most campsites open in May.";

      return {
        text,
        title,
      };
    }

    // --- All-year limited service info ---
    if (availability.mode === "allYear" && availability.winterStatus === "year_round_limited") {
      const text = lang === "is" ? "ℹ️ Opið (takmörkuð þjónusta)" : "ℹ️ Open (limited service)";
      return { text, title: availability.winterNotes || "" };
    }

    // --- All-year full ---
    // Keep it clean: show a positive badge only if you want it.
    // If you want less noise, return null here.
    if (availability.mode === "allYear" && availability.winterStatus === "year_round_full") {
      return null;
    }

    return null;
  }, [availability, lang, t]);

  // ✅ Pro hazard animation (runs briefly, then stops)
  const [animateHighHazards, setAnimateHighHazards] = useState(true);

  useEffect(() => {
    setAnimateHighHazards(true);
    const tt = setTimeout(() => setAnimateHighHazards(false), 6000);
    return () => clearTimeout(tt);
  }, [site?.id]);

  return (
    <div className="card rounded-2xl shadow-sm border border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-700 p-4">
      {/* Header */}
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="text-lg font-semibold">
          <span className="inline-flex items-center gap-2">
            <span>{site?.name || "—"}</span>

            {availabilityBadge ? (
              <span
                title={availabilityBadge.title}
                className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold
                   border border-slate-200 dark:border-slate-700
                   bg-white/70 dark:bg-slate-900/60 text-slate-700 dark:text-slate-200"
              >
                {availabilityBadge.text}
              </span>
            ) : null}
          </span>

          {userLoc && site && distanceToKm != null && (
            <span className="ml-2 text-sm text-slate-500 dark:text-slate-300">
              · {formatNumber(convertDistanceKm(distanceToKm, units), 1)} {DIST_UNIT_LABEL[units]}{" "}
              {t?.("away")}
            </span>
          )}
        </h2>

        <div className="text-sm text-slate-600 dark:text-slate-300">
          {site?.lat?.toFixed?.(4)}, {site?.lon?.toFixed?.(4)}
        </div>
      </div>

      {/* Total */}
      <div className="mb-3 text-sm">
        <span className="inline-flex items-center rounded-full bg-white/80 dark:bg-slate-900/70 glass px-3 py-1 shadow-sm border border-slate-200 dark:border-slate-600">
          {t?.("total")} (7 {t?.("days")}):
          <span className="ml-2 font-semibold">
            {totalPoints} {t?.("pts")}
          </span>
        </span>
        {availability?.isClosed && availability?.mode === "seasonal" && (
          <div className="mb-4 text-xs text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-start gap-2">
              <span className="mt-0.5">ℹ️</span>
              <span className="max-w-[700px]">{t?.("seasonClosedInfo")}</span>
            </span>
          </div>
        )}
      </div>

      {loading && <LoadingShimmer rows={8} />}
      {error && (
        <div className="py-10 text-center text-red-600">
          {t?.("forecastLoadFailed") ?? "Could not load forecast."}
        </div>
      )}

      {!loading && !error && (
        <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm table-sticky">
              <thead className="bg-slate-50 dark:bg-slate-900/80">
                <tr className="border-b border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-200">
                  <th className="py-3 pl-4 pr-3 font-semibold">{t?.("score")}</th>
                  <th className="py-3 pr-3 font-semibold">{t?.("weather")}</th>
                  <th className="py-3 pr-3 font-semibold">{t?.("day")}</th>
                  <th className="py-3 pr-3 font-semibold">
                    <span className="sm:hidden">{t?.("tempMinShort")}</span>
                    <span className="hidden sm:inline">{t?.("tempMin")}</span>
                  </th>

                  <th className="py-3 pr-3 font-semibold">
                    <span className="sm:hidden">{t?.("tempMaxShort")}</span>
                    <span className="hidden sm:inline">{t?.("tempMax")}</span>
                  </th>

                  <th className="py-3 pr-3 font-semibold">
                    <span className="sm:hidden">{t?.("windMaxShort")}</span>
                    <span className="hidden sm:inline">{t?.("windMax")}</span>
                  </th>

                  <th className="py-3 pr-3 font-semibold">
                    <span className="sm:hidden">{t?.("rainShort")}</span>
                    <span className="hidden sm:inline">{t?.("rain")}</span>
                  </th>
                  <th className="py-3 pr-4 font-semibold sr-only">Open</th>
                </tr>
              </thead>

              <tbody className="[&>tr:nth-child(even)]:bg-slate-50 dark:[&>tr:nth-child(even)]:bg-slate-800/40">
                {rows.map((r) => {
                  const code = Number(r.code ?? 0);
                  const weatherKey = weatherMap?.[code]?.textKey ?? "unknown";

                  const warnings = computeWarningsFromRow(r);
                  const hasHigh = rowHasHighWarning(warnings);
                  const hasWarn = rowHasWarning(warnings);

                  return (
                    <tr
                      key={r.date}
                      onClick={() => onSelectDay?.(r)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          onSelectDay?.(r);
                        }
                      }}
                      tabIndex={0}
                      role="button"
                      aria-label={`${t?.("day") ?? "Day"} ${r.dayLabel}`}
                      className={`
                        border-b last:border-0 border-slate-100 dark:border-slate-800
                        hover:bg-sky-50/50 dark:hover:bg-slate-800/60
                        cursor-pointer focus:outline-none focus:ring-2 focus:ring-sky-400/60
                      `}
                    >
                      {/* Score */}
                      <td className="relative py-2 pl-4 pr-3">
                        {hasHigh && (
                          <>
                            {/* Left severity bar */}
                            <span
                              aria-hidden
                              className="
                                  absolute left-0 top-0 h-full w-1
                                  bg-rose-500/70 dark:bg-rose-400/60
                                "
                            />

                            {/* Soft gradient overlay */}
                            <span
                              aria-hidden
                              className="
                                pointer-events-none
                                absolute -left-4 -right-[999px] top-0 bottom-0
                                bg-gradient-to-r from-rose-500/4 via-rose-500/3 to-transparent
                                dark:from-rose-400/8 dark:via-rose-400/5
                              "
                            />
                          </>
                        )}

                        <span
                          title={`Base ${r.basePts} (Temp ${
                            formatNumber(convertTemp(r.tmax, units)) ?? "?"
                          }${TEMP_UNIT_LABEL[units]}) Wind ${r.windPen} (${
                            formatNumber(convertWind(r.windMax, units)) ?? "?"
                          } ${WIND_UNIT_LABEL[units]}) Rain ${r.rainPen} (${
                            formatNumber(convertRain(r.rain, units)) ?? "?"
                          } ${RAIN_UNIT_LABEL[units]}) = ${r.points} → ${r.class}`}
                          className={
                            "relative z-10 inline-flex flex-col items-center justify-center gap-0.5 rounded-full px-2 py-2 text-[9px] font-semibold cursor-help w-14 h-14 text-center " +
                            (r.class === "Best"
                              ? "bg-green-100 text-green-800"
                              : r.class === "Good"
                                ? "bg-emerald-100 text-emerald-800"
                                : r.class === "Ok"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : r.class === "Fair"
                                    ? "bg-amber-100 text-amber-800"
                                    : "bg-red-100 text-red-800")
                          }
                        >
                          <WeatherIcon
                            iconId={mapWeatherCodeToIconId(code, true)}
                            aria-label={t?.(weatherKey)}
                            className="w-9 h-9"
                            role="img"
                          />

                          <span>{t?.(r.class?.toLowerCase?.()) ?? r.class}</span>

                          {(hasHigh || hasWarn) && (
                            <span
                              className={`
                                ring-offset-1 ring-offset-white dark:ring-offset-slate-900
                                absolute -right-[4px] -top-[2px]
                                inline-flex items-center justify-center
                                w-[18px] h-[18px] rounded-full text-[12px] leading-none
                                bg-white/95 dark:bg-slate-50/90
                                shadow-sm
                                ${
                                  hasHigh
                                    ? "ring-2 ring-rose-500 dark:ring-rose-400"
                                    : "ring-1 ring-amber-400/60 dark:ring-amber-400/70"
                                }
                                ${
                                  hasHigh
                                    ? "drop-shadow-[0_0_8px_rgba(244,63,94,0.45)]"
                                    : "drop-shadow-none"
                                }
                                ${hasHigh && animateHighHazards ? "hazard-glow" : ""}
                              `}
                              title={
                                hasHigh
                                  ? t?.("routeWarningHigh") || "Dangerous weather"
                                  : t?.("routeWarning") || "Weather warning"
                              }
                              aria-label={
                                hasHigh
                                  ? t?.("routeWarningHigh") || "Dangerous weather"
                                  : t?.("routeWarning") || "Weather warning"
                              }
                            >
                              {hasHigh ? "🚨" : "⚠️"}
                            </span>
                          )}
                        </span>
                      </td>

                      {/* Weather text */}
                      <td className="py-2 pr-3 text-slate-700 dark:text-slate-200">
                        {(() => {
                          const base = t?.(weatherKey);

                          const code = Number(r.code ?? 0);

                          // Open-Meteo style mapping
                          const SNOW_CODES = [71, 73, 75, 77, 85, 86];
                          const RAIN_CODES = [51, 53, 55, 61, 63, 65, 80, 81, 82];

                          const isSnow = SNOW_CODES.includes(code);
                          const isRain = RAIN_CODES.includes(code);

                          if (!isSnow && !isRain) return base;

                          const label = getPrecipitationLabel(isSnow ? "snow" : "rain", r.rain, t, {
                            precipStartHour: r.precipStartHour,
                            precipDurationHours: r.precipDurationHours,
                            tmin: r.tmin,
                            tmax: r.tmax,
                          });

                          return label || base;
                        })()}
                      </td>

                      <td className="py-2 pr-3 whitespace-nowrap font-medium">{r.dayLabel}</td>

                      <td className="py-2 pr-3">
                        {formatNumber(convertTemp(r.tmin, units))} {TEMP_UNIT_LABEL[units]}
                      </td>

                      <td className="py-2 pr-3">
                        {formatNumber(convertTemp(r.tmax, units))} {TEMP_UNIT_LABEL[units]}
                      </td>

                      <td className="py-2 pr-3">
                        <div className="flex items-center gap-2">
                          <span>
                            {formatNumber(convertWind(r.windMax, units))} {WIND_UNIT_LABEL[units]}
                          </span>

                          {r.windGust != null &&
                          Number.isFinite(Number(r.windGust)) &&
                          Number(r.windGust) >= 15 ? (
                            <span
                              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 dark:text-slate-300"
                              title={`${t?.("windGust")}: ${formatNumber(convertWind(r.windGust, units))} ${WIND_UNIT_LABEL[units]}`}
                            >
                              <span aria-hidden>🌬</span>
                              <span className="opacity-80">
                                {formatNumber(convertWind(r.windGust, units))}{" "}
                                {WIND_UNIT_LABEL[units]}
                              </span>
                            </span>
                          ) : null}
                        </div>
                      </td>

                      <td className="py-2 pr-3">
                        {formatNumber(convertRain(r.rain, units))} {RAIN_UNIT_LABEL[units]}
                      </td>

                      <td className="py-2 pr-4 text-right text-slate-400 dark:text-slate-500">
                        <span aria-hidden>›</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Map slot */}
          {mapSlot}
        </div>
      )}

      {/* Legend */}
      <ScoreExplanation t={t} lang={lang} />
    </div>
  );
}
