// src/components/WeatherFinderCard.jsx
const MODE_ICON = { calmest: "🌫️", warmest: "🔥", driest: "💧" };

function interpolate(template, vars) {
  if (typeof template !== "string") return "";
  let out = template;
  for (const [k, v] of Object.entries(vars || {})) {
    out = out.replaceAll(`{${k}}`, String(v));
  }
  return out;
}

// Ticket #444 — "warmest" mode's metric is presentation-only completeness
// gating on top of the UNCHANGED engine metrics.avgTemp: a complete window
// still shows that same number; an incomplete one shows "Insufficient
// data" instead, never a 0-coerced value. `completeness` is built by the
// parent from the same sites/options.days used for ranking (never derived
// here from `result`, since the ranked array itself drops forecast rows).
//
// Correction v4 (J4 compliance) — the numeric value requires BOTH
// `complete === true` AND a valid positive-integer `windowLength`. A
// `complete: true` with a missing/malformed `windowLength` is itself
// malformed metadata (we would be showing a number for a period we cannot
// honestly state) and must also fail closed to "Insufficient data" — not
// just absent metadata as the v3 round treated it. The period line is
// omitted whenever `windowLength` isn't valid, regardless of `complete`.
function getWarmestDisplay({ result, completeness, isImperial, t }) {
  const windowLength =
    Number.isInteger(completeness?.windowLength) && completeness.windowLength > 0
      ? completeness.windowLength
      : null;

  const periodLine =
    windowLength != null
      ? interpolate(t("weatherFinderPeriodLine"), { n: windowLength })
      : null;

  if (completeness?.complete === true && windowLength != null) {
    const val = isImperial
      ? `${((result.metrics.avgTemp * 9) / 5 + 32).toFixed(0)}°F`
      : `${result.metrics.avgTemp.toFixed(1)}°C`;
    return { line: `${val} — ${t("weatherFinderWarmestLabel")}`, periodLine };
  }

  return { line: t("weatherFinderInsufficientData"), periodLine };
}

export default function WeatherFinderCard({ result, rank, mode, units, t, onSelect, completeness }) {
  const isImperial = units === "imperial";
  // Ticket 415 (#415): only a real, non-empty result.id with a genuinely
  // available callback becomes an interactive control — otherwise this
  // stays ordinary, non-clickable text (no misleading control, no event).
  const canSelect = typeof onSelect === "function" && !!result?.id;

  let metricString;
  let warmestPeriodLine = null;
  if (mode === "calmest") {
    const val = isImperial
      ? `${(result.metrics.avgWind * 2.237).toFixed(1)} mph`
      : `${result.metrics.avgWind.toFixed(1)} m/s`;
    metricString = `${val} ${t("weatherFinderAvgWind")}`;
  } else if (mode === "warmest") {
    const display = getWarmestDisplay({ result, completeness, isImperial, t });
    metricString = display.line;
    warmestPeriodLine = display.periodLine;
  } else {
    const n = result.metrics.rainDays;
    const label = n === 1 ? t("weatherFinderRainDay") : t("weatherFinderRainDays");
    metricString = `${n} ${label}`;
  }

  const nameControl = canSelect ? (
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
  );

  // calmest/driest: EXACT pre-#444 markup, byte-for-byte unchanged structure
  // and classes (J4/R1 correction explicitly requires these untouched).
  if (mode !== "warmest") {
    return (
      <div className="flex items-center gap-3 rounded-lg px-3 py-2.5 odd:bg-slate-50 odd:dark:bg-slate-800/40">
        <div className="w-5 shrink-0 text-center text-xs font-bold text-slate-400 dark:text-slate-500">
          {rank}
        </div>
        {nameControl}
        <div className="shrink-0 text-right text-sm text-slate-600 dark:text-slate-300">
          <span className="mr-1 text-xs" aria-hidden="true">{MODE_ICON[mode]}</span>{metricString}
        </div>
      </div>
    );
  }

  // warmest only (correction v4, R1; desktop alignment fixed in v5, R3) —
  // the metric/period block no longer shares a row with the name below
  // `sm`: it drops to its own full-width line underneath, so the name
  // control keeps real width to render in (previously `max-w-[55%]` on the
  // metric block squeezed the name down to a handful of visible characters
  // on a 320-375px phone). At `sm` and above this lays out like before
  // (name + metric side by side, metric right-aligned and capped at 55%) —
  // `min-w-0 sm:flex-1` on the name wrapper is what actually makes it grow
  // to fill the row at `sm`+, pushing the metric block to the right edge;
  // v4 omitted this, so the metric block merely sat beside a
  // natural-width name instead of being right-aligned (Jonesy's R3).
  return (
    <div className="flex flex-col gap-1.5 rounded-lg px-3 py-2.5 odd:bg-slate-50 odd:dark:bg-slate-800/40 sm:flex-row sm:items-center sm:gap-3">
      <div className="flex min-w-0 items-center gap-3 sm:flex-1">
        <div className="w-5 shrink-0 text-center text-xs font-bold text-slate-400 dark:text-slate-500">
          {rank}
        </div>
        {nameControl}
      </div>
      <div
        data-testid="weather-finder-warmest-metric"
        className="pl-8 text-left text-sm text-slate-600 dark:text-slate-300 sm:max-w-[55%] sm:shrink-0 sm:pl-0 sm:text-right"
      >
        <div>
          <span className="mr-1 text-xs" aria-hidden="true">{MODE_ICON[mode]}</span>{metricString}
        </div>
        {warmestPeriodLine && (
          <div className="text-[11px] leading-tight text-slate-400 dark:text-slate-500">
            {warmestPeriodLine}
          </div>
        )}
      </div>
    </div>
  );
}
