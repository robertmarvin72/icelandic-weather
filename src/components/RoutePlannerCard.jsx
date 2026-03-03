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

function dateKey(d) {
  return String(d ?? "").slice(0, 10);
}

/**
 * ✅ Enrich candidate days with base-site day points so UI can do correct deltas.
 * - candidate.windowDays gets: baseSitePoints, baseSitePointsRaw
 * - matched by date (YYYY-MM-DD)
 */
function enrichWithBaseDays(out, windowDaysCount) {
  if (!out || !Array.isArray(out?.ranked)) return out;

  const baseDays = Array.isArray(out?.explain?.base?.windowDays) ? out.explain.base.windowDays : [];
  const baseByDate = new Map(baseDays.map((d) => [dateKey(d?.date), d]));

  const ranked = out.ranked.map((c) => {
    const allDays = Array.isArray(c?.windowDays) ? c.windowDays : [];
    const days = typeof windowDaysCount === "number" ? allDays.slice(0, windowDaysCount) : allDays;

    const enrichedDays = days.map((d) => {
      const bd = baseByDate.get(dateKey(d?.date));
      return {
        ...d,
        baseSitePoints: typeof bd?.points === "number" ? bd.points : (d?.baseSitePoints ?? null),
        baseSitePointsRaw:
          typeof bd?.pointsRaw === "number" ? bd.pointsRaw : (d?.baseSitePointsRaw ?? null),
      };
    });

    const mergedWindowDays = [...enrichedDays, ...allDays.slice(enrichedDays.length).map((d) => d)];

    return { ...c, windowDays: mergedWindowDays };
  });

  return { ...out, ranked };
}

export default function RoutePlannerCard({
  t = (k) => k,
  entitlements,
  me,
  onUpgrade,
  sites = [],
  baseSiteId,
  radiusKmDefault = 50,
  windowDaysDefault = 3,
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

  // ✅ Glow state (adaptive radius text)
  const [adaptiveGlow, setAdaptiveGlow] = useState(false);
  const prevAdaptiveUsedRef = React.useRef(null);

  function openDetails(candidateRow) {
    if (!candidateRow) return;
    setDetailsCandidate(candidateRow);
    setDetailsOpen(true);
  }

  function getImprovementLabel(delta, tFn) {
    if (typeof delta !== "number") return null;
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

        const outRaw = await getRelocationRecommendation(baseSiteId, sites, {
          radiusKm,
          days: windowDays,
          startDateISO,
          limit,
        });

        const out = enrichWithBaseDays(outRaw, windowDays);

        console.log("ROUTE DEBUG radius/days:", { radiusKm, windowDays });
        console.log("Candidates fetched:", out?.debugFetch?.ids);

        console.log(
          "Top ranked (first 10):",
          (out?.ranked || []).slice(0, 10).map((r) => ({
            site: r.siteName ?? r.siteId,
            delta: r.deltaVsBase,
            days: (r.windowDays || [])
              .slice(0, windowDays)
              .map((d) => (d?.points ?? 0) - (d?.baseSitePoints ?? 0)),
          }))
        );

        console.log(
          "Top 10 deltas:",
          (out?.ranked || []).slice(0, 10).map((r) => ({
            site: r.siteId,
            delta: r.deltaVsBase,
          }))
        );

        const bestDbg = (out?.ranked || [])[0];
        console.log(
          "BEST:",
          bestDbg?.siteId,
          bestDbg?.deltaVsBase,
          bestDbg?.windowDays?.slice(0, 2)
        );

        console.log("DAY0:", bestDbg?.windowDays?.[0]);
        console.log("DAY0 keys:", Object.keys(bestDbg?.windowDays?.[0] || {}));
        console.log("SITES SAMPLE", sites?.[0]);

        if (!cancelled) {
          setResult(out);

          console.log("[ADAPTIVE]", {
            max: out?.debug?.adaptiveRadiusMaxKm,
            used: out?.debug?.adaptiveRadiusUsedKm,
            attempts: out?.debug?.adaptiveRadiusAttempts,
            bestDelta: out?.delta,
            verdict: out?.verdict,
          });
        }
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

  const top3 = Array.isArray(result?.ranked) ? result.ranked.slice(0, 3) : [];
  const best = top3[0] || null;

  const THRESH = 0.75;

  function getDayCounts(windowDaysArr, windowDaysCount) {
    const daysArr = Array.isArray(windowDaysArr) ? windowDaysArr : [];
    const slice = typeof windowDaysCount === "number" ? daysArr.slice(0, windowDaysCount) : daysArr;

    let betterDays = 0,
      sameDays = 0,
      worseDays = 0;

    for (const d of slice) {
      const basePts =
        typeof d?.baseSitePoints === "number"
          ? d.baseSitePoints
          : typeof d?.baseSitePointsRaw === "number"
            ? d.baseSitePointsRaw
            : 0;

      const candPts =
        typeof d?.points === "number"
          ? d.points
          : typeof d?.pointsRaw === "number"
            ? d.pointsRaw
            : 0;

      const baseRaw =
        typeof d?.baseSitePointsRaw === "number"
          ? d.baseSitePointsRaw
          : typeof d?.baseSitePoints === "number"
            ? d.baseSitePoints
            : 0;

      const candRaw =
        typeof d?.pointsRaw === "number"
          ? d.pointsRaw
          : typeof d?.points === "number"
            ? d.points
            : 0;

      const deltaPts = candPts - basePts;
      const deltaRaw = candRaw - baseRaw;

      const useRaw =
        (candPts === basePts && (candPts <= 0.0001 || candPts >= 9.9999)) ||
        Math.abs(deltaPts) < 0.0001;

      const delta = useRaw ? deltaRaw : deltaPts;

      if (delta > THRESH) betterDays++;
      else if (delta < -THRESH) worseDays++;
      else sameDays++;
    }

    return { betterDays, sameDays, worseDays, totalDays: slice.length };
  }

  function getDecisionFromCounts({ betterDays, worseDays }) {
    if (betterDays >= 2 && worseDays === 0) return "move";
    if (betterDays > 0 && betterDays > worseDays) return "consider";
    return "stay";
  }

  function getVerdictFromDays(windowDaysArr, windowDaysCount) {
    const c = getDayCounts(windowDaysArr, windowDaysCount);
    if (!c || c.totalDays === 0) return "same";

    if (c.betterDays > c.worseDays && c.betterDays >= Math.ceil(c.totalDays / 2)) return "better";
    if (c.worseDays > c.betterDays && c.worseDays >= Math.ceil(c.totalDays / 2)) return "worse";
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

  const bestCounts = best ? getDayCounts(best.windowDays, windowDays) : null;
  const decisionLower = bestCounts ? getDecisionFromCounts(bestCounts) : "stay";
  const meta = result && getRouteVerdictMeta(decisionLower);

  const trendText = (() => {
    const v = decisionLower || "stay";
    if (v === "move") return interpolate(t("routePlannerTrendMove"), { days: windowDays });
    if (v === "consider") return interpolate(t("routePlannerTrendConsider"), { days: windowDays });
    return interpolate(t("routePlannerTrendStay"), { days: windowDays });
  })();

  // ---------- Adaptive radius UI text ----------
  const adaptive = result?.debug || null;
  const adaptiveEnabled = !!adaptive?.adaptiveRadiusEnabled;

  const adaptiveMaxKm =
    typeof adaptive?.adaptiveRadiusMaxKm === "number" ? adaptive.adaptiveRadiusMaxKm : null;

  const adaptiveUsedKm =
    typeof adaptive?.adaptiveRadiusUsedKm === "number" ? adaptive.adaptiveRadiusUsedKm : null;

  const adaptiveAttempts = Array.isArray(adaptive?.adaptiveRadiusAttempts)
    ? adaptive.adaptiveRadiusAttempts
    : [];

  const adaptivePrevKm = (() => {
    if (!adaptiveEnabled || typeof adaptiveUsedKm !== "number") return null;
    const idx = adaptiveAttempts.findIndex((a) => a?.radiusKm === adaptiveUsedKm);
    if (idx > 0) return adaptiveAttempts[idx - 1]?.radiusKm ?? null;
    return null;
  })();

  const adaptiveRadiusLine =
    adaptiveEnabled &&
    typeof adaptiveUsedKm === "number" &&
    typeof adaptiveMaxKm === "number" &&
    adaptiveUsedKm < adaptiveMaxKm
      ? interpolate(t("routeAdaptiveRadiusUsed"), { used: adaptiveUsedKm, max: adaptiveMaxKm })
      : "";

  const adaptiveVerdictLine = (() => {
    if (!adaptiveEnabled || typeof adaptiveUsedKm !== "number") return "";

    if (
      (decisionLower === "move" || decisionLower === "consider") &&
      typeof adaptivePrevKm === "number" &&
      adaptiveUsedKm > adaptivePrevKm
    ) {
      return interpolate(t("routeAdaptiveFoundBeyond"), {
        prev: adaptivePrevKm,
        used: adaptiveUsedKm,
      });
    }

    if (decisionLower === "stay" && typeof adaptiveMaxKm === "number") {
      return interpolate(t("routeAdaptiveNoBetterWithin"), {
        used: adaptiveUsedKm,
        max: adaptiveMaxKm,
      });
    }

    return "";
  })();
  // --------------------------------------------

  // ✅ Glow effect MUST be at top-level (NOT inside getDayCounts)
  useEffect(() => {
    if (typeof adaptiveUsedKm !== "number") return;

    if (prevAdaptiveUsedRef.current !== null && prevAdaptiveUsedRef.current !== adaptiveUsedKm) {
      setAdaptiveGlow(true);
      const tt = setTimeout(() => setAdaptiveGlow(false), 800);
      return () => clearTimeout(tt);
    }

    prevAdaptiveUsedRef.current = adaptiveUsedKm;
  }, [adaptiveUsedKm]);

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
            max={400}
            step={5}
            value={radiusKm}
            onChange={(e) => setRadiusKm(Number(e.target.value))}
          />
          {adaptiveRadiusLine ? (
            <div
              className={`
                mt-1 text-[11px] transition-all duration-700
                ${
                  adaptiveGlow
                    ? "text-emerald-600 dark:text-emerald-400 drop-shadow-[0_0_6px_rgba(16,185,129,0.6)]"
                    : "text-slate-500 dark:text-slate-400"
                }
              `}
            >
              {adaptiveRadiusLine}
            </div>
          ) : null}
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

            {trendText && (
              <div className="text-xs text-slate-600 dark:text-slate-300 mt-1">{trendText}</div>
            )}

            {bestCounts && (
              <div className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                {interpolate(t("routeDecisionCounts"), {
                  better: bestCounts.betterDays,
                  same: bestCounts.sameDays,
                  worse: bestCounts.worseDays,
                })}

                {adaptiveVerdictLine ? (
                  <div className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                    {adaptiveVerdictLine}
                  </div>
                ) : null}
              </div>
            )}

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
        adaptiveUsedKm={adaptiveUsedKm}
        adaptiveMaxKm={adaptiveMaxKm}
      />
    </div>
  );
}
