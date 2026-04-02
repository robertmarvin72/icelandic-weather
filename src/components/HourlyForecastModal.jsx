import React, { useEffect, useMemo, useState } from "react";
import { getForecast } from "../lib/forecastCache";
import {
  convertTemp,
  convertRain,
  convertWind,
  formatNumber,
  TEMP_UNIT_LABEL,
  RAIN_UNIT_LABEL,
  WIND_UNIT_LABEL,
} from "../lib/scoring";

function formatDateLabel(dateStr, lang = "en") {
  if (!dateStr) return "Selected day";

  try {
    return new Intl.DateTimeFormat(lang === "is" ? "is-IS" : "en-GB", {
      weekday: "short",
      day: "2-digit",
      month: "short",
    }).format(new Date(`${dateStr}T12:00:00`));
  } catch {
    return dateStr;
  }
}

function formatHourLabel(dateTimeStr, lang = "en") {
  if (!dateTimeStr) return "—";

  try {
    return new Intl.DateTimeFormat(lang === "is" ? "is-IS" : "en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(new Date(dateTimeStr));
  } catch {
    const timePart = String(dateTimeStr).split("T")[1];
    return timePart ? timePart.slice(0, 5) : "—";
  }
}

function buildHourlyRows(data, selectedDate) {
  const hourly = data?.hourly;
  const times = hourly?.time;

  if (!Array.isArray(times) || !selectedDate) return [];

  return times
    .map((time, i) => {
      const datePart = String(time).split("T")[0];
      const hourPart = String(time).split("T")[1]?.slice(0, 2);

      return {
        key: time,
        time,
        date: datePart,
        hour: hourPart != null ? Number(hourPart) : null,
        temp: hourly?.temperature_2m?.[i] ?? null,
        weatherCode: hourly?.weathercode?.[i] ?? hourly?.weather_code?.[i] ?? null,
        wind: hourly?.windspeed_10m?.[i] ?? hourly?.wind_speed_10m?.[i] ?? null,
        gust: hourly?.windgusts_10m?.[i] ?? null,
        rain: hourly?.precipitation?.[i] ?? null,
        precipProbability: hourly?.precipitation_probability?.[i] ?? null,
      };
    })
    .filter((row) => row.date === selectedDate)
    .filter((row) => row.hour != null && row.hour % 3 === 0);
}

function getWeatherInfo(code, weatherMap, t, lang = "en") {
  if (code == null) {
    return {
      icon: "—",
      label: lang === "is" ? "Óþekkt veður" : "Unknown weather",
    };
  }

  const fromMap = weatherMap?.[code];

  if (fromMap) {
    return {
      icon: fromMap.icon || "•",
      label: typeof t === "function" ? t(fromMap.textKey) : fromMap.textKey || `Weather ${code}`,
    };
  }

  return {
    icon: "•",
    label: lang === "is" ? `Veður ${code}` : `Weather ${code}`,
  };
}

function getMetricStrings(row, units) {
  return {
    temp:
      row.temp == null
        ? "—"
        : `${formatNumber(convertTemp(row.temp, units), 0)} ${TEMP_UNIT_LABEL[units]}`,
    wind:
      row.wind == null
        ? "—"
        : `${formatNumber(convertWind(row.wind, units), 0)} ${WIND_UNIT_LABEL[units]}`,
    gust:
      row.gust == null
        ? "—"
        : `${formatNumber(convertWind(row.gust, units), 0)} ${WIND_UNIT_LABEL[units]}`,
    rain:
      row.rain == null
        ? "—"
        : `${formatNumber(convertRain(row.rain, units), 1)} ${RAIN_UNIT_LABEL[units]}`,
    pop: row.precipProbability == null ? null : `${formatNumber(row.precipProbability, 0)}%`,
  };
}

function getWindowState(row) {
  const wind = typeof row.wind === "number" ? row.wind : null;
  const gust = typeof row.gust === "number" ? row.gust : null;
  const rain = typeof row.rain === "number" ? row.rain : null;
  const pop = typeof row.precipProbability === "number" ? row.precipProbability : null;

  const good =
    (wind == null || wind <= 10) &&
    (gust == null || gust <= 15) &&
    (rain == null || rain <= 1) &&
    (pop == null || pop <= 40);

  const rough =
    (wind != null && wind >= 15) ||
    (gust != null && gust >= 20) ||
    (rain != null && rain >= 3) ||
    (pop != null && pop >= 70);

  if (good) return "good";
  if (rough) return "rough";
  return "neutral";
}

function getWindowBadge(state, t) {
  if (state === "good") {
    return {
      text: t?.("badgeGood") ?? "Good",
      className:
        "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/50 dark:text-emerald-200 dark:border-emerald-500/40 dark:shadow-[0_0_12px_rgba(16,185,129,0.18)]",
    };
  }

  if (state === "rough") {
    return {
      text: t?.("badgeRough") ?? "Rough",
      className:
        "bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/50 dark:text-red-200 dark:border-red-500/40 dark:shadow-[0_0_12px_rgba(239,68,68,0.18)]",
    };
  }

  return null;
}

function getCardClassName(state) {
  if (state === "good") {
    return "rounded-3xl border border-emerald-200 bg-emerald-50/50 px-5 py-5 shadow-sm dark:border-emerald-500/40 dark:bg-emerald-900/30 dark:shadow-[0_0_0_1px_rgba(16,185,129,0.16),0_0_16px_rgba(16,185,129,0.05)]";
  }

  if (state === "rough") {
    return "rounded-3xl border border-red-200 bg-red-50/40 px-5 py-5 shadow-sm dark:border-red-500/40 dark:bg-red-900/30 dark:shadow-[0_0_0_1px_rgba(239,68,68,0.16),0_0_24px_rgba(239,68,68,0.08)]";
  }

  return "rounded-3xl border border-slate-200 bg-white px-5 py-5 shadow-sm dark:border-slate-700 dark:bg-slate-900";
}

export default function HourlyForecastModal({
  site,
  day,
  units = "metric",
  lang = "en",
  t,
  weatherMap,
  onClose,
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hourlyRows, setHourlyRows] = useState([]);

  const selectedDate = day?.date || null;

  useEffect(() => {
    let cancelled = false;

    async function loadHourly() {
      if (!site?.lat || !site?.lon || !selectedDate) {
        setHourlyRows([]);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const data = await getForecast({ lat: site.lat, lon: site.lon });
        if (cancelled) return;

        const rows = buildHourlyRows(data, selectedDate);
        setHourlyRows(rows);
      } catch (err) {
        if (cancelled) return;
        setError(String(err?.message || err || "Could not load hourly forecast."));
        setHourlyRows([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadHourly();

    return () => {
      cancelled = true;
    };
  }, [site?.lat, site?.lon, selectedDate]);

  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === "Escape") onClose?.();
    }

    const prevOverflow = document.body.style.overflow;
    const prevPaddingRight = document.body.style.paddingRight;
    const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = "hidden";
    if (scrollBarWidth > 0) {
      document.body.style.paddingRight = `${scrollBarWidth}px`;
    }

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.paddingRight = prevPaddingRight;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  const dateLabel = useMemo(() => {
    return day?.dayLabel || formatDateLabel(selectedDate, lang);
  }, [day?.dayLabel, selectedDate, lang]);

  const summary = useMemo(() => {
    if (!hourlyRows.length) return null;

    let bestStart = null;
    let bestEnd = null;
    let bestLength = 0;

    let currentStart = null;
    let currentLength = 0;

    hourlyRows.forEach((row, i) => {
      const state = getWindowState(row);

      if (state === "good") {
        if (currentStart == null) {
          currentStart = i;
          currentLength = 1;
        } else {
          currentLength++;
        }

        if (currentLength > bestLength) {
          bestLength = currentLength;
          bestStart = currentStart;
          bestEnd = i;
        }
      } else {
        currentStart = null;
        currentLength = 0;
      }
    });

    if (bestStart == null || bestEnd == null) return null;

    return {
      from: formatHourLabel(hourlyRows[bestStart].time, lang),
      to: formatHourLabel(hourlyRows[bestEnd].time, lang),
    };
  }, [hourlyRows, lang]);

  if (!day || !site) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-end justify-center overscroll-none bg-black/70 backdrop-blur-[2px] sm:items-center"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex h-[85vh] w-full max-w-5xl flex-col overflow-hidden rounded-t-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900 sm:h-auto sm:max-h-[85vh] sm:rounded-2xl"
      >
        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-200 bg-white/95 px-6 py-5 backdrop-blur dark:border-slate-700 dark:bg-slate-900/95">
          <div>
            <h3 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
              {site?.name || (lang === "is" ? "Tjaldsvæði" : "Campsite")}
            </h3>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{dateLabel}</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            {t?.("close") ?? (lang === "is" ? "Loka" : "Close")}
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-6 [webkit-overflow-scrolling:touch]">
          {loading && (
            <div className="space-y-3">
              <div className="rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-600 dark:border-slate-700 dark:text-slate-300">
                {t?.("loading") ??
                  (lang === "is" ? "Hleð hourly veðurspá…" : "Loading hourly forecast…")}
              </div>

              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="animate-pulse rounded-2xl border border-slate-200 px-4 py-4 dark:border-slate-700"
                >
                  <div className="grid grid-cols-[84px_1fr] gap-4">
                    <div className="h-10 w-16 rounded bg-slate-200 dark:bg-slate-700" />
                    <div>
                      <div className="h-4 w-40 rounded bg-slate-200 dark:bg-slate-700" />
                      <div className="mt-3 h-3 w-72 rounded bg-slate-200 dark:bg-slate-700" />
                      <div className="mt-2 h-3 w-56 rounded bg-slate-200 dark:bg-slate-700" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
              {t?.("forecastLoadFailed") ??
                (lang === "is" ? "Ekki tókst að hlaða veðurspá." : "Could not load forecast.")}
              <div className="mt-1 text-xs opacity-80">{error}</div>
            </div>
          )}

          {!loading && !error && hourlyRows.length === 0 && (
            <div className="rounded-2xl border border-slate-200 px-4 py-4 text-sm text-slate-600 dark:border-slate-700 dark:text-slate-300">
              {t?.("noHourlyData") ??
                (lang === "is"
                  ? "Engin hourly gögn fundust fyrir þennan dag."
                  : "No hourly data available for this day.")}
            </div>
          )}

          {!loading && !error && hourlyRows.length > 0 && (
            <div className="space-y-4">
              {summary && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-500/40 dark:bg-emerald-950/20 dark:text-emerald-300">
                  {(t?.("bestWeatherWindow") ?? "Best window {from}-{to}")
                    .replace("{from}", summary.from)
                    .replace("{to}", summary.to) ?? `Best window ${summary.from}-${summary.to}`}
                </div>
              )}

              {hourlyRows.map((row) => {
                const metrics = getMetricStrings(row, units);
                const weather = getWeatherInfo(row.weatherCode, weatherMap, t, lang);
                const state = getWindowState(row);
                const badge = getWindowBadge(state, t);

                return (
                  <div key={row.key} className={getCardClassName(state)}>
                    <div className="grid grid-cols-[84px_1fr] gap-5">
                      <div className="text-4xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                        {formatHourLabel(row.time, lang)}
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2 text-base text-slate-700 dark:text-slate-200">
                          <span className="text-xl">{weather.icon}</span>
                          <span className="font-medium">{weather.label}</span>

                          {badge ? (
                            <span
                              className={`ml-1 rounded-full px-2.5 py-1 text-xs font-semibold ${badge.className}`}
                            >
                              {badge.text}
                            </span>
                          ) : null}
                        </div>

                        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-700 dark:text-slate-200">
                          <span>
                            <span className="font-semibold">{t?.("labelTemp") ?? "Temp"}:</span>{" "}
                            {metrics.temp}
                          </span>

                          <span>
                            <span className="font-semibold">{t?.("labelWind") ?? "Wind"}:</span>{" "}
                            {metrics.wind}
                          </span>

                          <span>
                            <span className="font-semibold">{t?.("labelGust") ?? "Gust"}:</span>{" "}
                            {metrics.gust}
                          </span>

                          <span>
                            <span className="font-semibold">{t?.("labelRain") ?? "Rain"}:</span>{" "}
                            {metrics.rain}
                          </span>

                          {metrics.pop ? (
                            <span>
                              <span className="font-semibold">
                                {t?.("labelPrecipProbability") ?? "Precip. probability"}:
                              </span>{" "}
                              {metrics.pop}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
