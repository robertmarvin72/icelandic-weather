// src/components/RoutePlanner.jsx
import { useEffect, useMemo, useState } from "react";

import sites from "../data/campsites.full.json";

import { getRouteRecommendationV2 } from "../lib/routeAdvisor";
import { getRouteVerdictMeta } from "../lib/routeVerdictMeta";
import { getImprovementReasons } from "../lib/routeExplain";

// helper: map reason type -> FLAT translation key
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
    case "tmax":
      return "routeReasonTmax";
    default:
      return null;
  }
}

function formatReasonLine(r, t) {
  const key = reasonTypeToKey(r.type);
  const label = key ? t(key) : r.type;

  if (r.type === "tmax") {
    const v = typeof r.delta === "number" ? r.delta.toFixed(1) : String(r.delta);
    return `${label} (+${v}°C)`;
  }

  // penalties are negative deltas; show as-is (no need to “explain scoring”)
  const n =
    typeof r.delta === "number" && Number.isFinite(r.delta)
      ? Number.isInteger(r.delta)
        ? `${r.delta}`
        : r.delta.toFixed(1)
      : String(r.delta);

  return `${label}`;
}

export default function RoutePlanner({
  t = (k) => k,
  // base selection (required for v1 component)
  baseSiteId,
  // optional: if you already have user location mode wired, pass it here later
  // basePoint, // { lat, lon }  (not used in this MVP; see note below)
}) {
  // Controls (MVP)
  const [radiusKm, setRadiusKm] = useState(50);
  const [windowDays, setWindowDays] = useState(3);
  const [wetThresholdMm, setWetThresholdMm] = useState(3);
  const [limit, setLimit] = useState(30);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const baseSite = useMemo(() => {
    if (!baseSiteId) return null;
    return (sites || []).find((s) => s.id === baseSiteId) ?? null;
  }, [baseSiteId]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setError("");
      setResult(null);

      if (!baseSiteId) return; // no base selected yet
      if (!baseSite) {
        setError("Base site not found");
        return;
      }

      setLoading(true);
      try {
        const r = await getRouteRecommendationV2(baseSiteId, sites, {
          radiusKm,
          windowDays,
          wetThresholdMm,
          limit,
          topN: 3,
        });

        if (!cancelled) setResult(r);
      } catch (e) {
        if (!cancelled) setError(e?.message || "Route recommendation failed");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [baseSiteId, baseSite, radiusKm, windowDays, wetThresholdMm, limit]);

  const verdictMeta = useMemo(() => {
    if (!result?.verdict) return null;
    return getRouteVerdictMeta(result.verdict);
  }, [result]);

  // Precompute reasons for each top candidate
  const topWithReasons = useMemo(() => {
    if (!result?.top3?.length || !result?.explain?.base?.windowDays) return [];

    const baseWindow = result.explain.base.windowDays;

    return result.top3.map((c) => {
      const candWindow = result.explain?.candidates?.[c.siteId]?.windowDays || [];
      const reasons = getImprovementReasons(baseWindow, candWindow, {
        maxReasons: 3,
        minTempDeltaC: 1.0,
      });

      return { ...c, reasons };
    });
  }, [result]);

  // --- Render --------------------------------------------------------------

  if (!baseSiteId) {
    return (
      <div>
        <h2>{t("routePlannerTitle")}</h2>
        <p>{t("routePlannerSelectBase")}</p>
      </div>
    );
  }

  return (
    <div>
      <h2>{t("routePlannerTitle")}</h2>

      <div style={{ marginBottom: 12 }}>
        <div>
          <strong>{t("routePlannerBaseLabel")}:</strong> {baseSite?.name ?? baseSiteId}
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: "grid", gap: 8, marginBottom: 12 }}>
        <label>
          {t("routePlannerRadius")} ({radiusKm} km)
          <input
            type="range"
            min={10}
            max={200}
            step={5}
            value={radiusKm}
            onChange={(e) => setRadiusKm(Number(e.target.value))}
            style={{ width: "100%" }}
          />
        </label>

        <label>
          {t("routePlannerWindowDays")} ({windowDays})
          <input
            type="range"
            min={2}
            max={5}
            step={1}
            value={windowDays}
            onChange={(e) => setWindowDays(Number(e.target.value))}
            style={{ width: "100%" }}
          />
        </label>

        <label>
          {t("routePlannerWetThreshold")} ({wetThresholdMm} mm)
          <input
            type="range"
            min={1}
            max={8}
            step={1}
            value={wetThresholdMm}
            onChange={(e) => setWetThresholdMm(Number(e.target.value))}
            style={{ width: "100%" }}
          />
        </label>

        <label>
          {t("routePlannerCandidateLimit")} ({limit})
          <input
            type="range"
            min={10}
            max={60}
            step={5}
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            style={{ width: "100%" }}
          />
        </label>
      </div>

      {/* State */}
      {loading && <p>{t("loading")}…</p>}
      {error && <p style={{ color: "crimson" }}>{error}</p>}

      {/* Result */}
      {!loading && !error && result && verdictMeta && (
        <div style={{ display: "grid", gap: 12 }}>
          {/* Verdict card */}
          <div style={{ border: "1px solid #ddd", borderRadius: 10, padding: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>{t(verdictMeta.titleKey)}</div>
                <div style={{ opacity: 0.85 }}>{t(verdictMeta.bodyKey)}</div>
              </div>

              <div style={{ opacity: 0.7, fontSize: 12, textAlign: "right" }}>
                <div>
                  {t("routePlannerCandidatesPreselected")}: {result.candidatesPreselected}
                </div>
                <div>
                  {t("routePlannerCandidatesScored")}: {result.candidatesConsidered}
                </div>
              </div>
            </div>
          </div>

          {/* Top 3 */}
          <div style={{ border: "1px solid #ddd", borderRadius: 10, padding: 12 }}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>
              {t("routePlannerTopAlternatives")}
            </div>

            {topWithReasons.length === 0 ? (
              <div style={{ opacity: 0.85 }}>{t("routePlannerNoAlternatives")}</div>
            ) : (
              <ol style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 10 }}>
                {topWithReasons.map((c) => (
                  <li key={c.siteId}>
                    <div style={{ fontWeight: 650 }}>
                      {c.siteName ?? c.siteId}{" "}
                      <span style={{ opacity: 0.7, fontWeight: 400 }}>
                        ({Math.round(c.distanceKm)} km)
                      </span>
                    </div>

                    {/* Reasons (no numbers in text; human reasons only) */}
                    {c.reasons?.length ? (
                      <ul style={{ margin: "6px 0 0 0", paddingLeft: 18 }}>
                        {c.reasons.map((r) => (
                          <li key={r.type}>{formatReasonLine(r, t)}</li>
                        ))}
                      </ul>
                    ) : (
                      <div style={{ marginTop: 6, opacity: 0.8 }}>{t("routePlannerNoReasons")}</div>
                    )}
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
