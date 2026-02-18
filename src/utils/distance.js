// src/utils/distance.js
// Small geo helpers for CampCast RouteAdvisor + general utilities.

const EARTH_RADIUS_KM = 6371;

/**
 * Haversine distance between two coordinates in kilometers.
 */
export function haversineKm(lat1, lon1, lat2, lon2) {
  const toRad = (deg) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

/**
 * Safe distance between two point objects: { lat, lon }.
 * Returns null if missing/invalid.
 */
export function distanceKm(a, b) {
  const lat1 = Number(a?.lat);
  const lon1 = Number(a?.lon);
  const lat2 = Number(b?.lat);
  const lon2 = Number(b?.lon);

  if (![lat1, lon1, lat2, lon2].every((n) => Number.isFinite(n))) return null;
  return haversineKm(lat1, lon1, lat2, lon2);
}

/**
 * Adds distanceKm from origin to each site.
 * Keeps original fields, adds { distanceKm }.
 */
export function withDistanceFrom(origin, sites) {
  const list = Array.isArray(sites) ? sites : [];
  if (!origin) return list.map((s) => ({ ...s, distanceKm: null }));

  return list.map((s) => ({
    ...s,
    distanceKm: distanceKm(origin, s),
  }));
}

/**
 * Filters sites within radiusKm of origin (km).
 * - excludes origin itself by id (default true)
 * - sorts ascending by distance
 * - can limit results
 */
export function sitesWithinRadius(origin, sites, radiusKm, opts = {}) {
  const {
    excludeSelf = true,
    limit = null,
  } = opts;

  const r = Number(radiusKm);
  if (!origin || !Number.isFinite(r) || r <= 0) return [];

  const originId = origin?.id;

  const enriched = withDistanceFrom(origin, sites)
    .filter((s) => Number.isFinite(s.distanceKm));

  const filtered = enriched.filter((s) => {
    if (excludeSelf && originId && s?.id === originId) return false;
    return s.distanceKm <= r;
  });

  filtered.sort((a, b) => a.distanceKm - b.distanceKm);

  if (Number.isFinite(limit) && limit > 0) return filtered.slice(0, limit);
  return filtered;
}

/**
 * Returns the nearest N sites to origin (excluding self by default).
 */
export function nearestSites(origin, sites, n = 5, opts = {}) {
  const {
    excludeSelf = true,
  } = opts;

  const count = Number(n);
  if (!origin || !Number.isFinite(count) || count <= 0) return [];

  const originId = origin?.id;

  const enriched = withDistanceFrom(origin, sites)
    .filter((s) => Number.isFinite(s.distanceKm))
    .filter((s) => !(excludeSelf && originId && s?.id === originId));

  enriched.sort((a, b) => a.distanceKm - b.distanceKm);
  return enriched.slice(0, count);
}
