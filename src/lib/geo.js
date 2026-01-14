// src/lib/geo.js

function haversine(a1, o1, a2, o2) {
  const R = 6371;
  const toRad = (x) => (x * Math.PI) / 180;
  const dA = toRad(a2 - a1);
  const dO = toRad(o2 - o1);
  const m =
    Math.sin(dA / 2) ** 2 +
    Math.cos(toRad(a1)) *
      Math.cos(toRad(a2)) *
      Math.sin(dO / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(m));
}

function findNearestCampsite(lat, lon, list) {
  let best = null;
  let bestD = Infinity;

  for (const s of list) {
    const d = haversine(lat, lon, s.lat, s.lon);
    if (d < bestD) {
      bestD = d;
      best = s;
    }
  }

  return { site: best, distanceKm: bestD };
}

export { haversine, findNearestCampsite };
