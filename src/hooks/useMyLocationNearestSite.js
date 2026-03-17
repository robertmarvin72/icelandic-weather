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
      setGeoMsg(t?.("geolocationNotSupported") ?? "Geolocation is not supported.");
      return;
    }

    if (!Array.isArray(siteList) || siteList.length === 0) {
      setGeoMsg(t?.("noCampsitesFound") ?? "No campsites available.");
      return;
    }

    setGeoMsg(t?.("locating") ?? "Locating…");

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const latitude = Number(pos?.coords?.latitude);
        const longitude = Number(pos?.coords?.longitude);

        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
          setGeoMsg(t?.("couldNotReadPosition") ?? "Could not read your position.");
          return;
        }

        const loc = { lat: latitude, lon: longitude };
        setUserLoc(loc);

        const { site: nearest, distanceKm } = findNearestCampsite(latitude, longitude, siteList);

        if (nearest && Number.isFinite(distanceKm)) {
          onSelectSite(nearest.id);
          setGeoMsg(
            `${t?.("nearest") ?? "Nearest"}: ${nearest.name} (${distanceKm.toFixed(1)} km)`
          );
        } else {
          setGeoMsg(t?.("noCampsitesFound") ?? "No campsites found near your location.");
        }
        console.log("My location coords:", latitude, longitude);
      },
      (err) => {
        console.error("Geolocation failed:", err);

        let msg = t?.("permissionDenied") ?? "Could not access your location.";

        if (err?.code === 1) msg = t?.("permissionDenied") ?? "Location permission denied.";
        else if (err?.code === 2) msg = t?.("positionUnavailable") ?? "Location unavailable.";
        else if (err?.code === 3) msg = t?.("locationTimeout") ?? "Location request timed out.";

        setGeoMsg(msg);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }

  return { userLoc, geoMsg, useMyLocation };
}
