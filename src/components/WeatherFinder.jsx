// src/components/WeatherFinder.jsx
import { useEffect, useMemo, useState } from "react";
import { getFeatureLimit } from "../config/features";
import { rankCalmest, rankDriest, rankWarmest } from "../lib/weatherFinderRanking";
import { distanceKm } from "../utils/distance";
import WeatherFinderCard from "./WeatherFinderCard";

const INITIAL_VISIBLE_COUNT = 10;
const MODES = ["calmest", "warmest", "driest"];
const RADIUS_OPTIONS = [50, 100, 200, null];
const DAYS_OPTIONS = [3, 5, 7];

const MODE_KEY = {
  calmest: "weatherFinderCalmest",
  warmest: "weatherFinderWarmest",
  driest: "weatherFinderDriest",
};

const RESULT_TITLE_KEY = {
  calmest: "weatherFinderResultTitleCalmest",
  warmest: "weatherFinderResultTitleWarmest",
  driest: "weatherFinderResultTitleDriest",
};

export default function WeatherFinder({ siteList, scoresById, userLoc, entitlements, units, t, onUpgrade }) {
  const isPro = !!entitlements?.isPro;

  const [mode, setMode] = useState("calmest");
  const [radiusKm, setRadiusKm] = useState(100);
  const [days, setDays] = useState(3);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    setShowAll(false);
  }, [mode, radiusKm, days]);

  const resultsLimit = getFeatureLimit("weatherFinderResultsCount", entitlements) ?? 3;

  const sites = useMemo(() => {
    if (!siteList?.length || !scoresById) return [];
    return siteList
      .filter((site) => scoresById[site.id]?.rows?.length)
      .map((site) => ({
        id: site.id,
        name: site.name,
        distanceKm: userLoc ? distanceKm(userLoc, site) : null,
        forecast: scoresById[site.id].rows,
      }));
  }, [siteList, scoresById, userLoc]);

  const effectiveDays = isPro ? days : 3;
  const effectiveRadius = isPro ? radiusKm : 100;

  const options = useMemo(() => ({
    days: effectiveDays,
    maxDistanceKm: userLoc ? effectiveRadius : null,
  }), [effectiveDays, effectiveRadius, userLoc]);

  const ranked = useMemo(() => {
    const rankFn = mode === "calmest" ? rankCalmest : mode === "warmest" ? rankWarmest : rankDriest;
    return rankFn(sites, options).slice(0, resultsLimit);
  }, [mode, sites, options, resultsLimit]);

  const visibleResults = showAll ? ranked : ranked.slice(0, INITIAL_VISIBLE_COUNT);
  const hasMore = ranked.length > INITIAL_VISIBLE_COUNT;

  if (!sites.length) return null;

  const activeBtn = "bg-slate-900 text-white dark:bg-white dark:text-slate-900";
  const inactiveBtn = "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700";

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 shadow-sm">
      {/* Dynamic title */}
      <div className="mb-4 text-base font-bold">
        {t(RESULT_TITLE_KEY[mode])}
        <span className="ml-2 text-sm font-normal text-slate-400 dark:text-slate-500">
          · {effectiveDays} {t("days").toLowerCase()}
        </span>
      </div>

      {/* Mode tabs */}
      <div className="mb-4 flex gap-2">
        {MODES.map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${mode === m ? activeBtn : inactiveBtn}`}
          >
            {t(MODE_KEY[m])}
          </button>
        ))}
      </div>

      {/* Pro controls */}
      {isPro && (
        <div className="mb-4 flex flex-wrap gap-x-6 gap-y-3">
          <div>
            <div className="mb-1 text-xs text-slate-500 dark:text-slate-400">{t("weatherFinderRadius")}</div>
            <div className="flex gap-1.5">
              {RADIUS_OPTIONS.map((r) => (
                <button
                  key={r ?? "unlimited"}
                  type="button"
                  onClick={() => setRadiusKm(r)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${radiusKm === r ? activeBtn : inactiveBtn}`}
                >
                  {r != null ? `${r} km` : t("weatherFinderUnlimited")}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="mb-1 text-xs text-slate-500 dark:text-slate-400">{t("weatherFinderDays")}</div>
            <div className="flex gap-1.5">
              {DAYS_OPTIONS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDays(d)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${days === d ? activeBtn : inactiveBtn}`}
                >
                  {d}d
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {ranked.length === 0 ? (
        <div className="py-4 text-center">
          <div className="text-sm text-slate-500 dark:text-slate-400">{t("weatherFinderNoResults")}</div>
          <div className="mt-1 text-xs text-slate-400 dark:text-slate-500">{t("weatherFinderNoResultsHint")}</div>
        </div>
      ) : (
        <>
          <div className="space-y-1.5">
            {visibleResults.map((result, i) => (
              <WeatherFinderCard
                key={result.id}
                result={result}
                rank={i + 1}
                mode={mode}
                units={units}
                t={t}
              />
            ))}
          </div>

          {hasMore && (
            <button
              type="button"
              onClick={() => setShowAll((v) => !v)}
              className={`mt-3 w-full rounded-xl px-4 py-2 text-sm font-medium transition-colors ${inactiveBtn}`}
            >
              {showAll ? t("weatherFinderShowTop10") : t("weatherFinderShowFull")}
            </button>
          )}
        </>
      )}

      {/* Free upsell */}
      {!isPro && (
        <div className="mt-3 text-center">
          <button
            type="button"
            onClick={() => typeof onUpgrade === "function" && onUpgrade()}
            className="text-xs text-slate-400 underline underline-offset-2 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
          >
            {t("weatherFinderUpgradeForMore")}
          </button>
        </div>
      )}
    </div>
  );
}
