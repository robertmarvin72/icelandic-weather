import React, { useMemo } from "react";
import LoadingShimmer from "./LoadingShimmer";
import { WeatherIcon } from "./WeatherIcon";
import { mapWeatherCodeToIconId } from "../utils/WeatherIconMapping";
import ScoreExplanation from "./ScoreExplanation";

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
}) {
  const totalPoints = useMemo(() => rows.reduce((s, r) => s + (r.points ?? 0), 0), [rows]);

  return (
    <div className="card rounded-2xl shadow-sm border border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-700 p-4">
      {/* Header */}
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="text-lg font-semibold">
          {site?.name || "—"}
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
                  <th className="py-3 pr-3 font-semibold">{t?.("tempMin")}</th>
                  <th className="py-3 pr-3 font-semibold">{t?.("tempMax")}</th>
                  <th className="py-3 pr-3 font-semibold">{t?.("windMax")}</th>
                  <th className="py-3 pr-3 font-semibold">{t?.("rain")}</th>
                </tr>
              </thead>

              <tbody className="[&>tr:nth-child(even)]:bg-slate-50 dark:[&>tr:nth-child(even)]:bg-slate-800/40">
                {rows.map((r) => {
                  const code = Number(r.code ?? 0);
                  const weatherKey = weatherMap?.[code]?.textKey ?? "unknown";

                  return (
                    <tr
                      key={r.date}
                      className="border-b last:border-0 border-slate-100 dark:border-slate-800
                                 hover:bg-sky-50/50 dark:hover:bg-slate-800/60"
                    >
                      {/* Score */}
                      <td className="py-2 pl-4 pr-3">
                        <span
                          title={`Base ${r.basePts} (Temp ${
                            formatNumber(convertTemp(r.tmax, units)) ?? "?"
                          }${TEMP_UNIT_LABEL[units]}) Wind ${r.windPen} (${
                            formatNumber(convertWind(r.windMax, units)) ?? "?"
                          } ${WIND_UNIT_LABEL[units]}) Rain ${r.rainPen} (${
                            formatNumber(convertRain(r.rain, units)) ?? "?"
                          } ${RAIN_UNIT_LABEL[units]}) = ${r.points} → ${r.class}`}
                          className={
                            "inline-flex flex-col items-center justify-center gap-0.5 rounded-full px-2 py-2 text-[9px] font-semibold cursor-help w-14 h-14 text-center " +
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
                        </span>
                      </td>

                      {/* Weather text */}
                      <td className="py-2 pr-3 text-slate-700 dark:text-slate-200">
                        {t?.(weatherKey)}
                      </td>

                      <td className="py-2 pr-3 whitespace-nowrap font-medium">{r.dayLabel}</td>

                      <td className="py-2 pr-3">
                        {formatNumber(convertTemp(r.tmin, units))} {TEMP_UNIT_LABEL[units]}
                      </td>

                      <td className="py-2 pr-3">
                        {formatNumber(convertTemp(r.tmax, units))} {TEMP_UNIT_LABEL[units]}
                      </td>

                      <td className="py-2 pr-3">
                        {formatNumber(convertWind(r.windMax, units))} {WIND_UNIT_LABEL[units]}
                      </td>

                      <td className="py-2 pr-3">
                        {formatNumber(convertRain(r.rain, units))} {RAIN_UNIT_LABEL[units]}
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
