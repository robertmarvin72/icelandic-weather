// src/hooks/useRoutePlanner.js
import { useEffect, useState } from "react";
import { getRelocationRecommendation } from "../lib/relocationService";
import { getForecast } from "../lib/forecastCache";
import { estimateRouteRisk } from "../lib/routeRisk";
import { HAZARDS_V1 } from "../config/hazards";

// helper (copy from component - NO changes)
function tomorrowISODate() {
  const now = new Date();
  const tmr = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
  return tmr.toISOString().slice(0, 10);
}

// helper (copy from component - NO changes)
function dateKey(d) {
  return String(d ?? "").slice(0, 10);
}

// helper (copy from component - NO changes)
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

export function useRoutePlanner({
  isPro,
  isPreview,
  baseSiteId,
  baseSite,
  sites,
  effectiveRadiusKm,
  effectiveWindowDays,
  effectiveLimit,
  t,
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const [routeRiskData, setRouteRiskData] = useState(null);
  const [routeRiskLoading, setRouteRiskLoading] = useState(false);

  // ─────────────────────────────────────────────
  // MAIN FETCH (relocation)
  // ─────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function run() {
      setError("");
      setResult(null);
      setRouteRiskData(null);
      setRouteRiskLoading(false);

      // allow preview
      if (!isPro && !isPreview) return;
      if (!baseSiteId) return;
      if (!baseSite) return;
      if (!Array.isArray(sites) || sites.length === 0) return;

      setLoading(true);

      try {
        const startDateISO = tomorrowISODate();

        const outRaw = await getRelocationRecommendation(baseSiteId, sites, {
          radiusKm: effectiveRadiusKm,
          days: effectiveWindowDays,
          startDateISO,
          limit: effectiveLimit,
        });

        const out = enrichWithBaseDays(outRaw, effectiveWindowDays);

        if (!cancelled) {
          setResult(out);
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
  }, [
    isPro,
    isPreview,
    baseSiteId,
    baseSite,
    sites,
    effectiveRadiusKm,
    effectiveWindowDays,
    effectiveLimit,
    t,
  ]);

  // ─────────────────────────────────────────────
  // ROUTE RISK
  // ─────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function loadRouteRisk() {
      setRouteRiskData(null);
      setRouteRiskLoading(false);

      if (!result) return;
      if (!baseSite) return;
      if (isPreview) return;

      const topRanked = Array.isArray(result?.ranked) ? result.ranked.slice(0, 3) : [];

      const bestCandidate = topRanked[0] || null;

      const recommendation = String(
        result?.recommendation || bestCandidate?.recommendation || "stay"
      ).toLowerCase();

      if (!bestCandidate) return;
      if (recommendation === "stay") return;

      const destinationSite =
        (Array.isArray(sites) ? sites : []).find((s) => s?.id === bestCandidate?.siteId) ?? null;

      const baseLat = baseSite?.lat ?? baseSite?.latitude;
      const baseLon = baseSite?.lon ?? baseSite?.longitude;

      const destLat =
        destinationSite?.lat ??
        destinationSite?.latitude ??
        bestCandidate?.site?.lat ??
        bestCandidate?.site?.latitude ??
        bestCandidate?.lat ??
        bestCandidate?.latitude;

      const destLon =
        destinationSite?.lon ??
        destinationSite?.longitude ??
        bestCandidate?.site?.lon ??
        bestCandidate?.site?.longitude ??
        bestCandidate?.lon ??
        bestCandidate?.longitude;

      if (
        typeof baseLat !== "number" ||
        typeof baseLon !== "number" ||
        typeof destLat !== "number" ||
        typeof destLon !== "number"
      ) {
        return;
      }

      setRouteRiskLoading(true);

      try {
        const risk = await estimateRouteRisk({
          origin: { lat: baseLat, lon: baseLon },
          destination: { lat: destLat, lon: destLon },
          getForecast,
          hazards: HAZARDS_V1,
          samples: 7,
        });

        if (!cancelled) {
          setRouteRiskData(risk);
        }
      } catch (err) {
        console.error("Route risk failed", err);

        if (!cancelled) {
          setRouteRiskData(null);
        }
      } finally {
        if (!cancelled) {
          setRouteRiskLoading(false);
        }
      }
    }

    loadRouteRisk();

    return () => {
      cancelled = true;
    };
  }, [result, baseSite, isPreview, sites]);

  return {
    loading,
    error,
    result,
    routeRiskData,
    routeRiskLoading,
  };
}
