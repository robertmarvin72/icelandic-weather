// src/components/WeatherFinderCard.jsx
export default function WeatherFinderCard({ result, rank, mode, units, t }) {
  const isImperial = units === "imperial";

  let metricString;
  if (mode === "calmest") {
    const val = isImperial
      ? `${(result.metrics.avgWind * 2.237).toFixed(1)} mph`
      : `${result.metrics.avgWind.toFixed(1)} m/s`;
    metricString = `${val} ${t("weatherFinderAvgWind")}`;
  } else if (mode === "warmest") {
    const val = isImperial
      ? `${((result.metrics.avgTemp * 9) / 5 + 32).toFixed(0)}°F`
      : `${result.metrics.avgTemp.toFixed(1)}°C`;
    metricString = `${val} ${t("weatherFinderAvgTemp")}`;
  } else {
    const n = result.metrics.rainDays;
    const label = n === 1 ? t("weatherFinderRainDay") : t("weatherFinderRainDays");
    metricString = `${n} ${label}`;
  }

  return (
    <div className="flex items-center gap-3 rounded-lg px-3 py-2.5 odd:bg-slate-50 odd:dark:bg-slate-800/40">
      <div className="w-5 shrink-0 text-center text-xs font-bold text-slate-400 dark:text-slate-500">
        {rank}
      </div>
      <div className="min-w-0 flex-1 truncate text-sm font-medium">{result.name}</div>
      <div className="shrink-0 text-right text-sm text-slate-600 dark:text-slate-300">{metricString}</div>
    </div>
  );
}
