// src/components/WeatherFinderCard.jsx
const MODE_ICON = { calmest: "🌫️", warmest: "🔥", driest: "💧" };

export default function WeatherFinderCard({ result, rank, mode, units, t, onSelect }) {
  const isImperial = units === "imperial";
  // Ticket 415 (#415): only a real, non-empty result.id with a genuinely
  // available callback becomes an interactive control — otherwise this
  // stays ordinary, non-clickable text (no misleading control, no event).
  const canSelect = typeof onSelect === "function" && !!result?.id;

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
      {canSelect ? (
        <button
          type="button"
          onClick={() => onSelect(result)}
          title={t("selectOnMap")}
          aria-label={`${result.name} — ${t("selectOnMap")}`}
          className="group flex min-w-0 flex-1 items-center gap-1 rounded text-left text-sm font-medium text-sky-700 hover:text-sky-900 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 dark:text-sky-300 dark:hover:text-sky-100"
        >
          <span className="min-w-0 flex-1 truncate">{result.name}</span>
          <span aria-hidden="true" className="shrink-0 opacity-70 transition-transform group-hover:translate-x-0.5">
            →
          </span>
        </button>
      ) : (
        <div className="min-w-0 flex-1 truncate text-sm font-medium">{result.name}</div>
      )}
      <div className="shrink-0 text-right text-sm text-slate-600 dark:text-slate-300">
        <span className="mr-1 text-xs" aria-hidden="true">{MODE_ICON[mode]}</span>{metricString}
      </div>
    </div>
  );
}
