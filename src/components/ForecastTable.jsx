import React, { useMemo } from "react";
import LoadingShimmer from "./LoadingShimmer";
import { WeatherIcon } from "./WeatherIcon";
import { mapWeatherCodeToIconId } from "../utils/WeatherIconMapping";

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

/**
 * ForecastTable
 * - Renders the left-side card: header, totals, table rows, and lazy map container passed as children.
 *
 * NOTE:
 * - This component is presentation-only.
 * - It receives "mapSlot" as JSX so App can keep controlling Map lazy-loading.
 */
export default function ForecastTable({
  site,
  userLoc,
  distanceToKm, // number | null
  rows,
  loading,
  error,
  units,
  weatherMap,
  mapSlot, // JSX to render below the table
}) {
  const totalPoints = useMemo(
    () => rows.reduce((s, r) => s + (r.points ?? 0), 0),
    [rows]
  );

  return (
    <div className="card rounded-2xl shadow-sm border border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-700 p-4">
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="text-lg font-semibold">
          {site?.name || "—"}
          {userLoc && site && distanceToKm != null && (
            <span className="ml-2 text-sm text-slate-500 dark:text-slate-300">
              · {formatNumber(convertDistanceKm(distanceToKm, units), 1)}{" "}
              {DIST_UNIT_LABEL[units]} away
            </span>
          )}
        </h2>

        <div className="text-sm text-slate-600 dark:text-slate-300">
          {site?.lat?.toFixed?.(4)}, {site?.lon?.toFixed?.(4)}
        </div>
      </div>

      <div className="mb-3 text-sm">
        <span className="inline-flex items-center rounded-full bg-white/80 dark:bg-slate-900/70 glass px-3 py-1 shadow-sm border border-slate-200 dark:border-slate-600">
          Total (7 days): <span className="ml-2 font-semibold">{totalPoints} pts</span>
        </span>
      </div>

      {loading && <LoadingShimmer rows={8} />}
      {error && (
        <div className="py-10 text-center text-red-600">
          {String(error.message || error)}
        </div>
      )}

      {!loading && !error && (
        <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm table-sticky">
              <thead className="bg-slate-50 dark:bg-slate-900/80">
                <tr className="border-b border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-200">
                  <th className="py-3 pl-4 pr-3 font-semibold">Score</th>
                  <th className="py-3 pr-3 font-semibold">Weather</th>
                  <th className="py-3 pr-3 font-semibold">Day</th>
                  <th className="py-3 pr-3 font-semibold">Temp min</th>
                  <th className="py-3 pr-3 font-semibold">Temp max</th>
                  <th className="py-3 pr-3 font-semibold">Max wind</th>
                  <th className="py-3 pr-3 font-semibold">Rain</th>
                </tr>
              </thead>

              <tbody className="[&>tr:nth-child(even)]:bg-slate-50 dark:[&>tr:nth-child(even)]:bg-slate-800/40">
                {rows.map((r) => (
                  <tr
                    key={r.date}
                    className="border-b last:border-0 border-slate-100 dark:border-slate-800
                              hover:bg-sky-50/50 dark:hover:bg-slate-800/60"
                  >
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
                          iconId={mapWeatherCodeToIconId(r.code ?? 0, true)}
                          aria-label={`Weather: ${weatherMap?.[r.code]?.text || "Unknown"}`}
                          className="w-9 h-9"
                          role="img"
                        />
                        <span>{r.class}</span>
                      </span>
                    </td>

                    <td className="py-2 pr-3 text-slate-700 dark:text-slate-200">
                      {weatherMap?.[r.code]?.text || ""}
                    </td>

                    <td className="py-2 pr-3 whitespace-nowrap font-medium">
                      {r.dayLabel}
                    </td>

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
                ))}
              </tbody>
            </table>
          </div>

          {/* Map slot (lazy-loaded in App) */}
          {mapSlot}
        </div>
      )}

      <div className="mt-2 text-xs text-slate-500 dark:text-slate-300">
        Temp base: &gt;14°C=10, 12–14=8, 8–12=5, 6–8=2, &lt;6=0. Wind penalty: ≤5=0,
        ≤10=2, ≤15=5, &gt;15=10. Rain penalty: &lt;1=0, 1–4=2, &gt;4=5. Final =
        clamp(base − penalties, 0..10).
      </div>
    </div>
  );
}
