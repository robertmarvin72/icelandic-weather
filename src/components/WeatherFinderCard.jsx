// src/components/WeatherFinderCard.jsx
export default function WeatherFinderCard({ result, rank, mode, units, t }) {
  const isImperial = units === "imperial";

  const windDisplay = isImperial
    ? `${(result.metrics.avgWind * 2.237).toFixed(1)} mph`
    : `${result.metrics.avgWind.toFixed(1)} m/s`;

  const tempDisplay = isImperial
    ? `${((result.metrics.avgTemp * 9) / 5 + 32).toFixed(0)}°F`
    : `${result.metrics.avgTemp.toFixed(1)}°C`;

  let primaryLabel, primaryValue;
  if (mode === "calmest") {
    primaryLabel = t("weatherFinderAvgWind");
    primaryValue = windDisplay;
  } else if (mode === "warmest") {
    primaryLabel = t("weatherFinderAvgTemp");
    primaryValue = tempDisplay;
  } else {
    primaryLabel = t("weatherFinderRainDays");
    primaryValue = result.metrics.rainDays;
  }

  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 px-4 py-3">
      <div className="w-5 shrink-0 text-center text-sm font-bold text-slate-400 dark:text-slate-500">
        {rank}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold">{result.name}</div>
        {result.distanceKm != null && (
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {result.distanceKm.toFixed(0)} km {t("away")}
          </div>
        )}
      </div>
      <div className="shrink-0 text-right">
        <div className="text-sm font-bold">{primaryValue}</div>
        <div className="text-xs text-slate-500 dark:text-slate-400">{primaryLabel}</div>
      </div>
    </div>
  );
}
