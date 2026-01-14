import { useCallback } from "react";
import { haversine } from "../lib/geo";

/**
 * useDistanceTo
 *
 * Returns a stable function that calculates distance (km) from the user's location
 * to a campsite (or any object with { lat, lon }).
 *
 * If userLoc is null/undefined, returns null for all calls.
 */
export function useDistanceTo(userLoc) {
  return useCallback(
    (place) => {
      if (!userLoc || !place) return null;

      const { lat, lon } = userLoc;
      const { lat: pLat, lon: pLon } = place;

      if (lat == null || lon == null || pLat == null || pLon == null) return null;

      return haversine(lat, lon, pLat, pLon);
    },
    [userLoc]
  );
}
