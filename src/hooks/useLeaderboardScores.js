import { useEffect, useRef, useState } from "react";

import { scoreSiteDay } from "../lib/scoring";
import { getForecast } from "../lib/forecastCache";
import { prioritizedSites, processInBatches, sleep } from "../lib/leaderboardUtils";

export function useLeaderboardScores(siteList, siteId, userLoc) {
  const [scoresById, setScoresById] = useState({});
  const [loadingWave1, setLoadingWave1] = useState(false);
  const [loadingBg, setLoadingBg] = useState(false);

  // Keep latest scores in a ref so the preload effect can read up-to-date values
  const scoresRef = useRef(scoresById);
  useEffect(() => {
    scoresRef.current = scoresById;
  }, [scoresById]);

  const SCORES_CACHE_KEY = "campcast:scoresById:v5"; // bump version when scoring model changes (e.g., adding wind gusts)
  const SCORES_CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

  function loadScoresCache() {
    try {
      const raw = localStorage.getItem(SCORES_CACHE_KEY);
      if (!raw) return null;

      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") return null;

      const ts = Number(parsed.ts);
      const scores = parsed.scores;

      if (!Number.isFinite(ts)) return null;
      if (!scores || typeof scores !== "object") return null;

      const age = Date.now() - ts;
      if (age < 0 || age > SCORES_CACHE_TTL_MS) return null;

      for (const v of Object.values(scores)) {
        if (!v || typeof v !== "object" || !Number.isFinite(v.score)) return null;
      }

      return scores;
    } catch {
      return null;
    }
  }

  const saveTimerRef = useRef(null);

  function scheduleSaveScoresCache(getLatestScoresById) {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      try {
        const scores = getLatestScoresById();
        localStorage.setItem(SCORES_CACHE_KEY, JSON.stringify({ ts: Date.now(), scores }));
      } catch {
        // ignore
      }
    }, 800);
  }

  useEffect(() => {
    let aborted = false;

    async function computeScoreFromData(data) {
      if (!data?.daily?.time) return { score: 0, rows: [] };

      const rows = data.daily.time.map((t, i) => {
        const r = {
          date: t,
          tmax: data.daily.temperature_2m_max?.[i] ?? null,
          tmin: data.daily.temperature_2m_min?.[i] ?? null,
          rain: data.daily.precipitation_sum?.[i] ?? null,
          windMax: data.daily.windspeed_10m_max?.[i] ?? data.daily.wind_speed_10m_max?.[i] ?? null,
          windGust: data.daily.windgusts_10m_max?.[i] ?? null,
          code: data.daily.weathercode?.[i] ?? null,
        };
        const s = scoreSiteDay(r);
        return { ...r, class: s.finalClass, points: s.points };
      });

      const score = rows.reduce((sum, r) => sum + (r.points ?? 0), 0);
      return { score, rows };
    }

    async function preloadScores() {
      if (!siteList?.length) return;

      // ✅ 1) Hydrate from cache immediately (fast repeat visits)
      if (Object.keys(scoresRef.current).length === 0) {
        const cached = loadScoresCache();
        if (cached && !aborted) {
          const allowed = new Set(siteList.map((s) => s.id));
          const filtered = {};
          for (const [id, val] of Object.entries(cached)) {
            if (allowed.has(id)) filtered[id] = val;
          }
          setScoresById((prev) => ({ ...filtered, ...prev }));
        }
      }

      const prioAll = prioritizedSites(siteList, siteId, userLoc);

      // ✅ Cap total scoring work to keep app responsive
      const MAX_SCORE_NO_LOC = 80; // tweak 50–120
      const MAX_SCORE_WITH_LOC = 250; // tweak 150–400
      const maxToScore = userLoc ? MAX_SCORE_WITH_LOC : MAX_SCORE_NO_LOC;

      const prio = prioAll.slice(0, Math.min(prioAll.length, maxToScore));

      const fetchOne = async (site) => {
        try {
          const data = await getForecast({ lat: site.lat, lon: site.lon });
          const scored = await computeScoreFromData(data);

          if (!aborted) {
            setScoresById((prev) => {
              const next = { ...prev, [site.id]: scored };
              scheduleSaveScoresCache(() => next);
              return next;
            });
          }
        } catch {
          if (!aborted) {
            setScoresById((prev) => {
              const next = { ...prev, [site.id]: { score: 0, rows: [] } };
              scheduleSaveScoresCache(() => next);
              return next;
            });
          }
        }
      };

      // ── Wave 1: selected + nearest 8
      setLoadingWave1(true);
      const head = prio.slice(0, Math.min(prio.length, 9));

      for (const s of head) {
        if (aborted) break;
        await fetchOne(s);
        await sleep(120);
      }

      if (!aborted) setLoadingWave1(false);

      // ── Background: trickle the rest
      const rest = prio.slice(head.length);
      if (!rest.length) return;

      const SCORES_ENOUGH = userLoc ? 120 : 40;
      if (Object.keys(scoresRef.current).length >= SCORES_ENOUGH) {
        if (!aborted && loadingBg) setLoadingBg(false);
        return;
      }

      if (!aborted && !loadingBg) setLoadingBg(true);

      await processInBatches(
        rest,
        async (s) => {
          if (!aborted) await fetchOne(s);
        },
        { concurrency: 2, delayMs: 350, betweenBatchesMs: 250 }
      );

      if (!aborted) setLoadingBg(false);
    }

    preloadScores();

    return () => {
      aborted = true;

      // cancel pending cache write
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
    };
    // Keep dependencies aligned with your current behavior
  }, [siteList?.length, siteId, userLoc?.lat, userLoc?.lon]);

  return { scoresById, loadingWave1, loadingBg };
}
