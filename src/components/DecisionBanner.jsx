import React, { useMemo } from "react";
import { HAZARDS_V1 } from "../config/hazards";

function hasRoughWeather(rows = []) {
  return rows.some((r) => {
    const wind = typeof r?.windMax === "number" ? r.windMax : null;
    const gust = typeof r?.windGust === "number" ? r.windGust : null;
    const rain = typeof r?.rain === "number" ? r.rain : null;

    return (
      (wind != null && wind >= HAZARDS_V1.windWarn) ||
      (gust != null && gust >= HAZARDS_V1.gustWarn) ||
      (rain != null && rain >= HAZARDS_V1.rainWarn)
    );
  });
}

export default function DecisionBanner({ t, rows = [], currentScore = 0, bestNearby = null }) {
  const model = useMemo(() => {
    const rough = hasRoughWeather(rows);
    const bestScore = Number(bestNearby?.score ?? currentScore ?? 0);
    const delta = bestScore - Number(currentScore ?? 0);
    const bestName = bestNearby?.site?.name ?? null;

    if (delta >= 2) {
      return {
        tone: "consider",
        title: t("decisionConsiderTitle"),
        body: t("decisionConsiderBody").replace("{site}", bestName ?? t("nearbyCampsite")),
      };
    }

    return {
      tone: "good",
      title: t("decisionStayTitle"),
      body: rough ? t("decisionStayBodyRough") : t("decisionStayBodyGood"),
    };
  }, [rows, currentScore, bestNearby, t]);

  const classes =
    model.tone === "consider"
      ? "border-amber-200/60 bg-amber-50 text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100"
      : "border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-100";

  const pill = model.tone === "consider" ? "🟡" : "🟢";

  return (
    <div className={`mb-3 rounded-2xl border px-4 py-3 shadow-sm ${classes}`}>
      <div className="flex items-start gap-3">
        <div className="mt-1">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm" />
        </div>

        <div className="min-w-0">
          <div className="text-sm font-semibold">{model.title}</div>
          <div className="mt-1.5 text-sm opacity-90">{model.body}</div>
        </div>
      </div>
    </div>
  );
}
