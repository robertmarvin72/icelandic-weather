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

export default function DecisionBanner({ t, rows = [], routePlannerSummary = null }) {
  const model = useMemo(() => {
    const rough = hasRoughWeather(rows);
    const verdict = String(routePlannerSummary?.verdict || "").toLowerCase();
    const candidateName = routePlannerSummary?.candidate?.name || t("nearbyCampsite");

    if (verdict === "move") {
      const meta = getRouteVerdictMeta(verdict);

      return {
        tone: "move",
        title: t(meta.titleKey),
        body: (t("decisionMoveBody") || "Betra veður er líklegt hjá {site}.").replace(
          "{site}",
          candidateName
        ),
      };
    }

    if (verdict === "consider") {
      const meta = getRouteVerdictMeta(verdict);

      return {
        tone: "consider",
        title: t(meta.titleKey),
        body: (t("decisionConsiderBody") || "Betra veður er líklegt hjá {site}.").replace(
          "{site}",
          candidateName
        ),
      };
    }

    if (verdict === "stay") {
      const meta = getRouteVerdictMeta(verdict);

      return {
        tone: "stay",
        title: t(meta.titleKey),
        body: rough ? t("decisionStayBodyRough") : t("decisionStayBodyGood"),
      };
    }

    return {
      tone: "stay",
      title: t("routeVerdictStayTitle"),
      body: rough ? t("decisionStayBodyRough") : t("decisionStayBodyGood"),
    };
  }, [rows, routePlannerSummary, t]);

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
        </div>
      </div>
    </div>
  );
}
