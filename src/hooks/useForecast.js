// src/hooks/useForecast.js
import { getWeeklyDominantWindDeg, degreesToCompass, degreesToArrow } from "../lib/windUtils";
import { getWeeklyShelterScore } from "../lib/shelterUtils";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getForecast } from "../lib/forecastCache";
import { scoreSiteDay } from "../lib/scoring";
import { normalizeDailyToScoreInput } from "../lib/forecastNormalize";
import { summarizeDailyWeather } from "../lib/dailyWeatherSummary";

async function fetchForecast({ lat, lon }) {
  return getForecast({ lat, lon });
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * useForecast
 * - Fetches and scores daily forecast for a site
 * - Includes small automatic retry (network hiccups) + optional toast messaging
 *
 * @param {number|null} lat
 * @param {number|null} lon
 * @param {{ t?: Function, toast?: Function, retries?: number }} opts
 */
function useForecast(lat, lon, opts = {}) {
  const { t, toast, retries = 2 } = opts;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [retrying, setRetrying] = useState(false);
  // Ticket 408 (#408) — narrow, additive request-provenance seam: which
  // requested coordinates the CURRENT `data`/`rows` actually came from.
  // `loading` alone can't answer this — on the render immediately after
  // `lat`/`lon` change, `rows` (derived from the still-old `data`) and
  // `loading` (still whatever it was before this effect re-ran) are both
  // stale for the new coordinates until this effect's fetch resolves.
  // Deliberately the REQUESTED lat/lon (this hook's own params), never the
  // provider's own (possibly grid-rounded) response coordinates — so a
  // consumer can reliably compare `requestedFor` against the coordinates
  // it currently cares about. Set in the same synchronous block as
  // setData(j) below (including the cached-response path, which resolves
  // through this same call site) so both land in one batched commit.
  const [requestedFor, setRequestedFor] = useState(null);

  const [refreshKey, setRefreshKey] = useState(0);
  const refetch = useCallback(() => setRefreshKey((k) => k + 1), []);

  // Avoid spamming "retrying" toasts on rapid re-renders
  const lastToastAtRef = useRef(0);

  useEffect(() => {
    if (lat == null || lon == null) return;
    let aborted = false;

    async function run() {
      setLoading(true);
      setError(null);
      setRetrying(false);

      const maxAttempts = Math.max(1, 1 + Number(retries || 0));

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        if (aborted) return;

        try {
          const j = await fetchForecast({ lat, lon });

          if (!j?.daily || !Array.isArray(j.daily.time)) {
            throw new Error("Invalid forecast payload");
          }

          if (!aborted) {
            setData(j);
            setRequestedFor({ lat, lon });
            setRetrying(false);
          }
          return;
        } catch (e) {
          if (aborted) return;

          const isLast = attempt === maxAttempts;

          if (!isLast) {
            setRetrying(true);

            // Polite, rate-limited toast
            if (typeof toast === "function") {
              const now = Date.now();
              if (now - lastToastAtRef.current > 2500) {
                lastToastAtRef.current = now;
                toast({
                  type: "warning",
                  message: `${t?.("forecastLoadFailed") ?? "Could not load forecast."} ${
                    t?.("retrying") ?? "Retrying…"
                  }`,
                  durationMs: 2200,
                });
              }
            }

            // Backoff: 500ms, 1500ms, 3000ms...
            const backoff = 500 * Math.pow(2, attempt - 1) + Math.floor(Math.random() * 150);
            await sleep(backoff);
            continue;
          }

          // Final failure
          setRetrying(false);
          setError(e);

          if (typeof toast === "function") {
            toast({
              type: "error",
              message: t?.("forecastLoadFailed") ?? "Could not load forecast.",
              actionLabel: t?.("retry") ?? "Retry",
              onAction: refetch,
              durationMs: 6500,
            });
          }
        }
      }
    }

    run().finally(() => {
      if (!aborted) setLoading(false);
    });

    return () => {
      aborted = true;
    };
  }, [lat, lon, refreshKey, retries, t, toast, refetch]);

  const shelter = useMemo(() => {
    if (!data?.daily) return null;
    return getWeeklyShelterScore(data.daily);
  }, [data]);

  const windDir = useMemo(() => {
    if (!data?.daily) return null;

    const dominantDeg = getWeeklyDominantWindDeg(data.daily);
    if (dominantDeg == null) return null;

    return {
      deg: dominantDeg,
      compass: degreesToCompass(dominantDeg),
      arrow: degreesToArrow(dominantDeg),
    };
  }, [data]);

  const rows = useMemo(() => {
    if (!data?.daily) return [];

    const baseRows = normalizeDailyToScoreInput(data.daily, data.hourly);
    if (baseRows.length === 0) return [];

    return baseRows.map((row) => {
      // scoreSiteDay reads only the untouched raw daily row (row.code stays
      // Open-Meteo's daily.weathercode) — summaryCode/summaryTextKey below
      // are computed separately, from hourly data, purely for display, and
      // are merged in only after scoring has already run on the pristine
      // row (Ticket 400 #400, extended Ticket 402 #402). Neither must ever
      // be passed into scoreSiteDay or any other scoring/ranking/
      // recommendation consumer.
      const s = scoreSiteDay(row);
      const { code: summaryCode, textKey: summaryTextKey } = summarizeDailyWeather({
        hourly: data?.hourly,
        date: row.date,
        fallbackCode: row.code,
      });

      return {
        ...row,
        summaryCode,
        summaryTextKey,
        class: s.finalClass,
        points: s.points,
        basePts: s.basePts,
        windPen: s.windPen,
        gustPen: s.gustPen,
        rainPen: s.rainPen,
        precipTimingMultiplier: s.precipTimingMultiplier,
        season: s.season,
      };
    });
  }, [data?.daily, data?.hourly]);

  return { data, rows, windDir, shelter, loading, error, retrying, refetch, requestedFor };
}

export { useForecast };
