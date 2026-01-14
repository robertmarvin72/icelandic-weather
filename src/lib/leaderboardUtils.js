// src/lib/leaderboardUtils.js

export function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Concurrency-limited queue with spacing to avoid 429s.
 * - items: array of work items
 * - fn: async (item, idx) => void
 * - concurrency: number of parallel workers
 * - delayMs: delay after each item
 * - betweenBatchesMs: small pause at the end (optional)
 */
export async function processInBatches(
  items,
  fn,
  { concurrency = 2, delayMs = 350, betweenBatchesMs = 500 } = {}
) {
  let i = 0;

  const workers = new Array(concurrency).fill(0).map(async () => {
    while (i < items.length) {
      const idx = i++;
      await fn(items[idx], idx);
      await sleep(delayMs);
    }
  });

  await Promise.all(workers);
  await sleep(betweenBatchesMs);
}

export function prioritizedSites(siteList, selectedId, userLoc) {
  if (!siteList?.length) return [];
  const selected = siteList.find((s) => s.id === selectedId);
  const others = siteList.filter((s) => s.id !== selectedId);

  const dist = (a, b) => {
    const toRad = (x) => (x * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(b.lat - a.lat);
    const dLon = toRad(b.lon - a.lon);
    const la1 = toRad(a.lat);
    const la2 = toRad(b.lat);
    const h =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(la1) * Math.cos(la2) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  };

  let nearest = others;
  if (userLoc) nearest = [...others].sort((a, b) => dist(userLoc, a) - dist(userLoc, b));

  const head = selected ? [selected] : [];
  const firstWave = nearest.slice(0, 8);
  const remaining = nearest.slice(8);
  return [...head, ...firstWave, ...remaining];
}
