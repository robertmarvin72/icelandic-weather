import { useState } from "react";
import { findNearestCampsite } from "../lib/geo";

/**
 * useMyLocationNearestSite
 *
 * Handles:
 * - Browser geolocation
 * - Nearest campsite lookup
 * - User-facing status message
 *
 * App controls what to do with the selected site via onSelectSite
 */
export function useMyLocationNearestSite(siteList, onSelectSite, t) {
  const [userLoc, setUserLoc] = useState(null);
  const [geoMsg, setGeoMsg] = useState(null);

  function useMyLocation() {
    if (!("geolocation" in navigator)) {
      setGeoMsg(t?.("geolocationNotSupported"));
      return;
    }

    setGeoMsg(t?.("locating"));
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords || {};
        if (latitude == null || longitude == null) {
          setGeoMsg(t?.("couldNotReadPosition"));
          return;
        }

        const loc = { lat: latitude, lon: longitude };
        setUserLoc(loc);

        const { site: nearest, distanceKm } = findNearestCampsite(
          latitude,
          longitude,
          siteList
        );

        if (nearest) {
          onSelectSite(nearest.id);
          setGeoMsg(t?.("nearest")+`: ${nearest.name} (${distanceKm.toFixed(1)} km)`);
        } else {
          setGeoMsg(t?.("noCampsitesFound"));
        }
      },
      (err) => {
        setGeoMsg(err?.message || t?.("permissionDenied"));
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }

  return { userLoc, geoMsg, useMyLocation };
}
