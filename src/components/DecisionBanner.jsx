import React, { useMemo } from "react";
import { HAZARDS_V1 } from "../config/hazards";
import { getRouteVerdictMeta } from "../lib/routeVerdictMeta";

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

// comparisonState is produced by useComparisonState in App.jsx and shared with
// InstantComparison so both components always reflect the same direction.
//
// direction "nearby_better"  → allow existing move/consider verdict from route planner
// direction "similar"        → show no-clear-reason-to-move copy
// direction "current_better" → show current-campsite-is-better copy
// direction "no_candidate" or comparisonState absent → fall through to verdict-based logic
export default function DecisionBanner({
  t,
  rows = [],
  routePlannerSummary = null,
  comparisonState = null,
}) {
  const model = useMemo(() => {
    const rough = hasRoughWeather(rows);
    const verdict = String(routePlannerSummary?.verdict || "").toLowerCase();
    const candidateName = routePlannerSummary?.candidate?.name || t("nearbyCampsite");

    // When a comparison exists, gate move/consider on the metric-based direction.
    // This prevents "Íhugaðu að færa þig" from appearing when the comparison
    // shows "Svipað" or when the current campsite is actually better.
    if (comparisonState?.showComparison) {
      const { direction } = comparisonState;

      if (direction === "similar") {
        return {
          tone: "stay",
          title: t("decisionSimilarTitle") || "No clear reason to move",
          body:
            t("decisionSimilarBody") ||
            "Weather conditions at nearby campsites look similar over the next few days. Staying where you are is likely the better choice.",
          painLine: null,
        };
      }

      if (direction === "current_better") {
        return {
          tone: "stay",
          title: t("decisionCurrentBetterTitle") || "Stay where you are",
          body:
            t("decisionCurrentBetterBody") ||
            "Conditions at your current campsite look better than at the nearby alternatives over the next few days.",
          painLine: null,
        };
      }

      // direction === "nearby_better" falls through to verdict-based logic below.
    }

    if (verdict === "move") {
      const meta = getRouteVerdictMeta(verdict);

      return {
        tone: "move",
        title: t(meta.titleKey),
        body: (
          t("decisionMoveBodyWindowAware") ||
          "Better weather is likely at {site} over the next few days, even if your current campsite scores best overall this week."
        ).replace("{site}", candidateName),
        painLine: t("routePainMoveBody"),
      };
    }

    if (verdict === "consider") {
      const meta = getRouteVerdictMeta(verdict);

      return {
        tone: "consider",
        title: t(meta.titleKey),
        body: (
          t("decisionConsiderBodyWindowAware") ||
          "Slightly better conditions may be available at {site} over the next few days."
        ).replace("{site}", candidateName),
        painLine: t("routePainConsiderBody"),
      };
    }

    if (verdict === "stay") {
      const meta = getRouteVerdictMeta(verdict);

      return {
        tone: "stay",
        title: t(meta.titleKey),
        body: rough ? t("decisionStayBodyRough") : t("decisionStayBodyGood"),
        painLine: t("routePainStayBody"),
      };
    }

    return {
      tone: "stay",
      title: t("routeVerdictStayTitle"),
      body: rough ? t("decisionStayBodyRough") : t("decisionStayBodyGood"),
      painLine: null,
    };
  }, [rows, routePlannerSummary, comparisonState, t]);

  const classes =
    model.tone === "move"
      ? "border-emerald-200/60 bg-emerald-50 text-emerald-950 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-100"
      : model.tone === "consider"
        ? "border-amber-200/60 bg-amber-50 text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100"
        : "border-sky-200 bg-sky-50 text-sky-950 dark:border-sky-900/60 dark:bg-sky-950/30 dark:text-sky-100";

  return (
    <div className={`mb-3 rounded-2xl border px-4 py-3 shadow-sm ${classes}`}>
      <div className="flex items-start gap-3">
        <div className="mt-1">
          <div
            className={`w-2.5 h-2.5 rounded-full shadow-sm ${
              model.tone === "move"
                ? "bg-emerald-500"
                : model.tone === "consider"
                  ? "bg-amber-500"
                  : "bg-sky-500"
            }`}
          />
        </div>

        <div className="min-w-0">
          <div className="text-sm font-semibold">{model.title}</div>
          <div className="mt-1.5 text-sm opacity-90">{model.body}</div>
          {model.painLine && (
            <div className="mt-1 text-xs opacity-75">{model.painLine}</div>
          )}
        </div>
      </div>
    </div>
  );
}
