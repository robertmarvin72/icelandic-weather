// src/components/RoutePlannerCard.jsx
import React, { useEffect, useMemo, useState } from "react";

import { getRelocationRecommendation } from "../lib/relocationService";
import { getRouteVerdictMeta } from "../lib/routeVerdictMeta";
import RoutePlannerDetailsModal from "./RoutePlannerDetailsModal";
import AnimatedPill from "./AnimatedPill";

// Map reason type -> FLAT translation key
function reasonTypeToKey(type) {
  switch (type) {
    case "rainStreak":
      return "routeReasonRainStreak";
    case "gust":
      return "routeReasonGust";
    case "wind":
      return "routeReasonWind";
    case "rain":
      return "routeReasonRain";
    case "temp":
      return "routeReasonTemp";
    case "shelter":
      return "routeReasonShelter";
    default:
      return null;
  }
}

function verdictAccentClasses(verdictLower) {
  switch (verdictLower) {
    case "move":
      return "border-emerald-300 dark:border-emerald-700 bg-emerald-50/60 dark:bg-emerald-900/20";
    case "consider":
      return "border-amber-300 dark:border-amber-700 bg-amber-50/60 dark:bg-amber-900/20";
    case "stay":
    default:
      return "border-sky-300 dark:border-sky-700 bg-sky-50/60 dark:bg-sky-900/20";
  }
}

function ProLock({ t, me, onUpgrade }) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-3">
      <div className="text-sm font-semibold mb-1">{t("routePlannerTitle")}</div>
      <div className="text-xs text-slate-600 dark:text-slate-300 mb-3">
        {t("routePlannerLockedBody")}
      </div>

      <button
        type="button"
        onClick={() => typeof onUpgrade === "function" && onUpgrade()}
        className="
          w-full rounded-xl px-3 py-2 text-sm font-semibold
          bg-emerald-600 text-white
          hover:bg-emerald-500
          focus:outline-none focus:ring-2 focus:ring-emerald-400/60
          dark:bg-emerald-500 dark:hover:bg-emerald-400
        "
      >
        {me?.user ? t("proUpgrade") : t("proCtaTitle")}
      </button>
    </div>
  );
}

function tomorrowISODate() {
  const now = new Date();
  const tmr = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
  return tmr.toISOString().slice(0, 10);
}

function interpolate(template, vars) {
  if (typeof template !== "string") return "";
  let out = template;
  for (const [k, v] of Object.entries(vars || {})) {
    out = out.replaceAll(`{${k}}`, String(v));
  }
  return out;
}

export default function RoutePlannerCard({
  t = (k) => k,
  entitlements,
  me,
  onUpgrade,

  // IMPORTANT: pass the same sites list as rest of app
  sites = [],

  // Base selection from app
  baseSiteId,

  radiusKmDefault = 50,
  windowDaysDefault = 3,

  // kept for backward compat with call-sites; not used in UI anymore
  wetThresholdMmDefault = 3, // eslint-disable-line no-unused-vars

  limitDefault = 30,
}) {
  const isPro = !!entitlements?.isPro;

  const [radiusKm, setRadiusKm] = useState(radiusKmDefault);
  const [windowDays, setWindowDays] = useState(windowDaysDefault);
  const [limit] = useState(limitDefault);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsCandidate, setDetailsCandidate] = useState(null);

  function openDetails(candidateRow) {
    if (!candidateRow) return;
    setDetailsCandidate(candidateRow);
    setDetailsOpen(true);
  }

  // Kept for backward compat (used in aria-label as extra hint)
  function getImprovementLabel(delta, tFn) {
    if (typeof delta !== "number") return null;

    // thresholds (feel free to tweak later)
    if (delta < 0.1) return tFn("routeImproveNone");
    if (delta < 1.0) return tFn("routeImproveSlight");
    if (delta < 2.5) return tFn("routeImproveBetter");
    return tFn("routeImproveMuchBetter");
  }

  const baseSite = useMemo(() => {
    if (!baseSiteId) return null;
    return (Array.isArray(sites) ? sites : []).find((s) => s?.id === baseSiteId) ?? null;
  }, [baseSiteId, sites]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setError("");
      setResult(null);

      if (!isPro) return;
      if (!baseSiteId) return;
      if (!baseSite) return;
      if (!Array.isArray(sites) || sites.length === 0) return;

      setLoading(true);
      try {
        const startDateISO = tomorrowISODate();

        const out = await getRelocationRecommendation(baseSiteId, sites, {
          radiusKm,
          days: windowDays,
          startDateISO,
          limit,

          // wetThresholdMm removed from UI by design
        });

        if (!cancelled) setResult(out);
      } catch (e) {
        const msg = e?.message || "Route planner failed";
        if (!cancelled) {
          setError(
            msg.includes("Base site forecast missing") ? t("routePlannerBaseForecastMissing") : msg
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [isPro, baseSiteId, baseSite, sites, radiusKm, windowDays, limit, t]);

  if (!isPro) return <ProLock t={t} me={me} onUpgrade={onUpgrade} />;

  if (!baseSiteId) {
    return (
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-3">
        <div className="text-sm font-semibold mb-1">{t("routePlannerTitle")}</div>
        <div className="text-xs text-slate-600 dark:text-slate-300">
          {t("routePlannerSelectBase")}
        </div>
      </div>
    );
  }

  if (!baseSite && Array.isArray(sites) && sites.length > 0) {
    return (
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-3">
        <div className="text-sm font-semibold mb-1">{t("routePlannerTitle")}</div>
        <div className="text-xs text-slate-600 dark:text-slate-300">
          {t("routePlannerBaseLabel")}: <span className="font-semibold">{baseSiteId}</span>
        </div>
        <div className="text-xs text-red-600 mt-2">
          Base site not found (ID mismatch between lists).
        </div>
      </div>
    );
  }

  // ranked already contains reasons + distances etc.
  const top3 = Array.isArray(result?.ranked) ? result.ranked.slice(0, 3) : [];
  const best = top3[0] || null;

  // Camper-first day verdict threshold (shared with modal)
  const THRESH = 0.2;

  function getDayCounts(windowDaysArr, windowDaysCount) {
    const daysArr = Array.isArray(windowDaysArr) ? windowDaysArr : [];
    const slice = typeof windowDaysCount === "number" ? daysArr.slice(0, windowDaysCount) : daysArr;

    let betterDays = 0,
      sameDays = 0,
      worseDays = 0;

    for (const d of slice) {
      const basePts = d?.basePts ?? 0;
      const candPts = d?.points ?? 0;
      const delta = candPts - basePts;

      if (delta > THRESH) betterDays++;
      else if (delta < -THRESH) worseDays++;
      else sameDays++;
    }

    return { betterDays, sameDays, worseDays, totalDays: slice.length };
  }

  // Your rule: MOVE only if 2+ better days and 0 worse days
  function getDecisionFromCounts({ betterDays, worseDays }) {
    if (betterDays >= 2 && worseDays === 0) return "move";
    if (betterDays > 0 && betterDays > worseDays) return "consider";
    return "stay";
  }

  function getVerdictFromDays(windowDaysArr, windowDaysCount) {
    const c = getDayCounts(windowDaysArr, windowDaysCount);
    if (c.betterDays > c.worseDays && c.betterDays > c.sameDays) return "better";
    if (c.worseDays > c.betterDays && c.worseDays > c.sameDays) return "worse";
    return "same";
  }

  function verdictLabelFromV(v) {
    if (v === "better") return t("routeDayBetter");
    if (v === "worse") return t("routeDayWorse");
    return t("routeDaySame");
  }

  function verdictButtonClassFromV(v) {
    if (v === "better") {
      return `
        border border-emerald-200 bg-emerald-50 text-emerald-800
        dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-200
        hover:bg-emerald-100 hover:border-emerald-300
        dark:hover:bg-emerald-900/35 dark:hover:border-emerald-700/50
        focus:ring-emerald-400/50
      `;
    }
    if (v === "worse") {
      return `
      border border-rose-200 bg-rose-50 text-rose-800
      dark:border-rose-900/40 dark:bg-rose-950/40 dark:text-rose-200
      hover:bg-rose-100 hover:border-rose-300
      dark:hover:bg-rose-900/40 dark:hover:border-rose-700/50
      focus:ring-rose-400/50
    `;
    }
    return `
      border border-slate-200 bg-slate-50 text-slate-800
      dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200
      hover:bg-slate-100 hover:border-slate-300
      dark:hover:bg-slate-800 dark:hover:border-slate-600/60
      focus:ring-slate-400/50
    `;
  }

  // Decision tool: drive the main verdict box from the BEST option day-counts
  const bestCounts = best ? getDayCounts(best.windowDays, windowDays) : null;
  const decisionLower = bestCounts ? getDecisionFromCounts(bestCounts) : "stay";

  const meta = result && getRouteVerdictMeta(decisionLower);

  // ---------- Trend / “human” explanation text (under verdict) ----------
  const trendText = (() => {
    const v = decisionLower || "stay";
    if (v === "move") return interpolate(t("routePlannerTrendMove"), { days: windowDays });
    if (v === "consider") return interpolate(t("routePlannerTrendConsider"), { days: windowDays });
    return interpolate(t("routePlannerTrendStay"), { days: windowDays });
  })();
  // ---------------------------------------------------------------------

  // For bullets, use best.reasons but only when decision says move/consider (keeps the story clean)
  const showDecisionReasons =
    ["move", "consider"].includes(String(decisionLower)) &&
    Array.isArray(best?.reasons) &&
    best.reasons.length > 0;

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-3">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div>
          <div className="text-sm font-semibold">{t("routePlannerTitle")}</div>
          <div className="text-xs text-slate-600 dark:text-slate-300">
            {t("routePlannerBaseLabel")}:{" "}
            <span className="font-semibold">{baseSite?.name ?? baseSiteId}</span>
          </div>
        </div>

        {result?.debug?.candidatesScored > 0 && (
          <div className="text-[11px] text-slate-500 dark:text-slate-400 text-right">
            {t("routePlannerAlternativesCount")}: {result.debug.candidatesScored}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="grid gap-2 mb-3">
        <label className="text-xs text-slate-600 dark:text-slate-300">
          {t("routePlannerRadius")} ({radiusKm} km)
          <input
            className="w-full"
            type="range"
            min={10}
            max={200}
            step={5}
            value={radiusKm}
            onChange={(e) => setRadiusKm(Number(e.target.value))}
          />
        </label>

        <label className="text-xs text-slate-600 dark:text-slate-300">
          {t("routePlannerWindowDays")} ({windowDays})
          <input
            className="w-full"
            type="range"
            min={2}
            max={5}
            step={1}
            value={windowDays}
            onChange={(e) => setWindowDays(Number(e.target.value))}
          />
        </label>
      </div>

      {loading && <div className="text-xs text-slate-600 dark:text-slate-300">{t("loading")}…</div>}
      {error && <div className="text-xs text-red-600">{error}</div>}

      {!loading && !error && result && meta && (
        <div className="grid gap-3">
          {/* Verdict (Decision Tool) */}
          <div className={`rounded-lg border p-2 ${verdictAccentClasses(decisionLower)}`}>
            <div className="text-sm font-semibold">{t(meta.titleKey)}</div>
            <div className="text-xs text-slate-600 dark:text-slate-300">{t(meta.bodyKey)}</div>

            {/* Trend explanation (human) */}
            {trendText && (
              <div className="text-xs text-slate-600 dark:text-slate-300 mt-1">{trendText}</div>
            )}

            {/* Decision counts (very useful for camper trust) */}
            {bestCounts && (
              <div className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                {interpolate(t("routeDecisionCounts"), {
                  better: bestCounts.betterDays,
                  same: bestCounts.sameDays,
                  worse: bestCounts.worseDays,
                })}
              </div>
            )}

            {/* Reasons bullets (only when we suggest moving/considering) */}
            {showDecisionReasons && (
              <ul className="mt-2 pl-4 text-xs grid gap-1 list-disc text-slate-700 marker:text-emerald-500 dark:text-slate-300">
                {best.reasons.slice(0, 3).map((r, idx) => {
                  const key = reasonTypeToKey(r?.type);
                  return key ? <li key={`${r.type}-${idx}`}>{t(key)}</li> : null;
                })}
              </ul>
            )}
          </div>

          {/* Top 3 */}
          <div>
            <div className="text-xs font-semibold mb-2">
              {decisionLower === "stay"
                ? interpolate(t("routePlannerTopAlternativesNoBetter"), { days: windowDays })
                : t("routePlannerTopAlternatives")}
            </div>

            {top3.length > 0 ? (
              <ol className="grid gap-2 pl-4 text-xs">
                {top3.map((x) => {
                  const v = getVerdictFromDays(x?.windowDays, windowDays);

                  const triggerKey = `${x.siteId}:${windowDays}:${v}:${
                    typeof x?.deltaVsBase === "number" ? x.deltaVsBase.toFixed(1) : "na"
                  }`;

                  const deltaTitle =
                    typeof x?.deltaVsBase === "number"
                      ? `${t("routeDetailsDelta") || "Delta"}: ${
                          x.deltaVsBase >= 0 ? "+" : ""
                        }${x.deltaVsBase.toFixed(1)}`
                      : "";

                  const oldImprovement = getImprovementLabel(x?.deltaVsBase, t);

                  return (
                    <li key={x.siteId}>
                      <div className="font-semibold flex items-center gap-2">
                        <span>{x.siteName ?? x.siteId}</span>
                        <AnimatedPill triggerKey={triggerKey} as="span" className="inline-flex">
                          <button
                            type="button"
                            onClick={() => openDetails(x)}
                            className={`
                            inline-flex items-center gap-1.5
                            rounded-full px-2.5 py-1
                            text-xs font-semibold
                            transition-all duration-150 ease-out
                            hover:shadow-sm
                            active:scale-[0.98]
                            focus:outline-none focus:ring-2
                            ${verdictButtonClassFromV(v)}
                          `}
                            title={deltaTitle}
                            aria-label={`${verdictLabelFromV(v)}. ${
                              oldImprovement ? `${oldImprovement}. ` : ""
                            }${t("routeDetailsOpenHint") || "Open details"}`}
                          >
                            <span className="text-[11px] leading-none opacity-80">ⓘ</span>
                            {verdictLabelFromV(v)}
                          </button>
                        </AnimatedPill>
                      </div>

                      {/* Reasons: show translated reason labels (no numbers in text) */}
                      {Array.isArray(x.reasons) && x.reasons.length > 0 ? (
                        <ul className="pl-4 mt-1 grid gap-1">
                          {x.reasons.slice(0, 3).map((r, idx) => {
                            const key = reasonTypeToKey(r.type);
                            return <li key={`${r.type}-${idx}`}>{key ? t(key) : r.type}</li>;
                          })}
                        </ul>
                      ) : (
                        <div className="opacity-80 mt-1">{t("routePlannerMinimalDifference")}</div>
                      )}
                    </li>
                  );
                })}
              </ol>
            ) : (
              <div className="text-xs text-slate-600 dark:text-slate-300">
                {t("routePlannerNoAlternatives")}
              </div>
            )}
          </div>
        </div>
      )}

      <RoutePlannerDetailsModal
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        t={t}
        baseSiteLabel={baseSite?.name ?? baseSiteId}
        candidate={detailsCandidate}
        windowDaysCount={windowDays}
      />
    </div>
  );
}
