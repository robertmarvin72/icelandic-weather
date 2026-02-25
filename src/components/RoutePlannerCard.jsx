// src/components/RoutePlannerCard.jsx
import React, { useEffect, useMemo, useState } from "react";

import { getRelocationRecommendation } from "../lib/relocationService";
import { getRouteVerdictMeta } from "../lib/routeVerdictMeta";

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
  const t = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
  return t.toISOString().slice(0, 10);
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
  wetThresholdMmDefault = 3,
  limitDefault = 30,
}) {
  const isPro = !!entitlements?.isPro;

  const [radiusKm, setRadiusKm] = useState(radiusKmDefault);
  const [windowDays, setWindowDays] = useState(windowDaysDefault);
  const [wetThresholdMm, setWetThresholdMm] = useState(wetThresholdMmDefault);
  const [limit, setLimit] = useState(limitDefault);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

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
          // keep these “simple” knobs visible for now
          wetThresholdMm,

          // Optional: you can later expose these too:
          // minDeltaToMove: 2,
          // minDeltaToConsider: 1,
          // weightDecay: 0.85,
          // useWorstDayGuardrail: true,
          // worstDayMin: 2,
          // reasonMinDelta: 1,
          // maxReasons: 4,
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
  }, [isPro, baseSiteId, baseSite, sites, radiusKm, windowDays, wetThresholdMm, limit]);

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

  // relocationEngine verdict is "MOVE"/"CONSIDER"/"STAY" -> meta expects lower-case keys in your codebase
  const meta = result?.verdict ? getRouteVerdictMeta(String(result.verdict).toLowerCase()) : null;

  // ranked already contains reasons + distances etc.
  const top3 = Array.isArray(result?.ranked) ? result.ranked.slice(0, 3) : [];

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

        {/* tiny debug counter (optional but useful) */}
        {result?.debugFetch && (
          <div className="text-[11px] text-slate-500 dark:text-slate-400 text-right">
            <div>
              {t("routePlannerCandidatesPreselected")}:{" "}
              {result?.debug?.candidatesPreselected ?? "—"}
            </div>
            <div>
              {t("routePlannerCandidatesScored")}: {result?.debug?.candidatesScored ?? "—"}
            </div>
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
            min={1}
            max={5}
            step={1}
            value={windowDays}
            onChange={(e) => setWindowDays(Number(e.target.value))}
          />
        </label>

        <label className="text-xs text-slate-600 dark:text-slate-300">
          {t("routePlannerWetThreshold")} ({wetThresholdMm} mm)
          <input
            className="w-full"
            type="range"
            min={1}
            max={8}
            step={1}
            value={wetThresholdMm}
            onChange={(e) => setWetThresholdMm(Number(e.target.value))}
          />
        </label>

        <label className="text-xs text-slate-600 dark:text-slate-300">
          {t("routePlannerCandidateLimit")} ({limit})
          <input
            className="w-full"
            type="range"
            min={10}
            max={60}
            step={5}
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
          />
        </label>
      </div>

      {loading && <div className="text-xs text-slate-600 dark:text-slate-300">{t("loading")}…</div>}
      {error && <div className="text-xs text-red-600">{error}</div>}

      {!loading && !error && result && meta && (
        <div className="grid gap-3">
          {/* Verdict */}
          <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-2">
            <div className="text-sm font-semibold">{t(meta.titleKey)}</div>
            <div className="text-xs text-slate-600 dark:text-slate-300">{t(meta.bodyKey)}</div>
          </div>

          {/* Top 3 */}
          <div>
            <div className="text-xs font-semibold mb-2">{t("routePlannerTopAlternatives")}</div>

            {top3.length > 0 ? (
              <ol className="grid gap-2 pl-4 text-xs">
                {top3.map((x) => (
                  <li key={x.siteId}>
                    <div className="font-semibold">{x.siteName ?? x.siteId}</div>

                    {/* Reasons: show translated reason labels (no numbers in text) */}
                    {Array.isArray(x.reasons) && x.reasons.length > 0 ? (
                      <ul className="pl-4 mt-1 grid gap-1">
                        {x.reasons.slice(0, 3).map((r, idx) => {
                          const key = reasonTypeToKey(r.type);
                          return <li key={`${r.type}-${idx}`}>{key ? t(key) : r.type}</li>;
                        })}
                      </ul>
                    ) : (
                      <div className="opacity-80 mt-1">{t("routePlannerNoReasons")}</div>
                    )}
                  </li>
                ))}
              </ol>
            ) : (
              <div className="text-xs text-slate-600 dark:text-slate-300">
                {t("routePlannerNoAlternatives")}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
