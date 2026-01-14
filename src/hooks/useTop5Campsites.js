import { useMemo } from "react";
import { haversine } from "../lib/geo";

/**
 * useTop5Campsites
 *
 * Turns leaderboard scores into a sorted "Top 5" list.
 * Sort order:
 *  1) Higher weekly score first
 *  2) If tied, nearer to user (if userLoc is available)
 *
 * Inputs:
 * - siteList: [{ id, lat, lon, name, ... }]
 * - scoresById: { [siteId]: { score: number, rows: [...] } }
 * - userLoc: { lat, lon } | null
 */
export function useTop5Campsites(siteList, scoresById, userLoc) {
  const siteById = useMemo(() => {
    const map = new Map();
    for (const s of siteList) map.set(s.id, s);
    return map;
  }, [siteList]);

  const top5 = useMemo(() => {
    const distanceTo = (site) =>
      userLoc ? haversine(userLoc.lat, userLoc.lon, site.lat, site.lon) : null;

    const items = Object.entries(scoresById)
      .map(([id, val]) => {
        const site = siteById.get(id);
        if (!site) return null;

        return {
          site,
          score: val?.score ?? 0,
          dist: distanceTo(site),
        };
      })
      .filter(Boolean);

    items.sort((a, b) =>
      b.score !== a.score ? b.score - a.score : (a.dist ?? Infinity) - (b.dist ?? Infinity)
    );

    return items.slice(0, 5);
  }, [scoresById, siteById, userLoc]);

  return { top5, siteById };
}
