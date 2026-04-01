// Simple local cache for Open-Meteo forecasts (stale-while-revalidate-ish)
const TTL_MS = 30 * 60 * 1000; // 30 minutes
const mem = new Map(); // in-memory cache (fast, per tab)
const inflight = new Map(); // coalesce duplicate requests

function key(lat, lon) {
  // keep precision but normalize
  // Bump version when forecast shape changes (e.g., adding windgusts)
  return `forecast:v8:${Number(lat).toFixed(4)},${Number(lon).toFixed(4)}`;
}

function readStorage(k) {
  try {
    const raw = localStorage.getItem(k);
    if (!raw) return null;
    const obj = JSON.parse(raw);
    if (!obj || !obj.ts || !obj.data) return null;
    if (Date.now() - obj.ts > TTL_MS) return null;
    return obj.data;
  } catch {
    return null;
  }
}

function writeStorage(k, data) {
  try {
    cleanupOldForecasts();
    localStorage.setItem(k, JSON.stringify({ ts: Date.now(), data }));
  } catch {
    // storage might be full — fail silently
  }
}

function cleanupOldForecasts() {
  const now = Date.now();

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);

    if (!key || !key.startsWith("forecast:v8:")) continue;

    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;

      const obj = JSON.parse(raw);

      if (!obj?.ts || now - obj.ts > TTL_MS) {
        localStorage.removeItem(key);
      }
    } catch {
      localStorage.removeItem(key);
    }
  }
}

async function fetchOpenMeteo({ lat, lon }) {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    timezone: "Atlantic/Reykjavik",
    temperature_unit: "celsius",
    windspeed_unit: "ms",
    precipitation_unit: "mm",
    forecast_days: "7",
    daily: [
      "temperature_2m_max",
      "temperature_2m_min",
      "precipitation_sum",
      "windspeed_10m_max",
      "windgusts_10m_max",
      "winddirection_10m_dominant",
      "weathercode",
    ].join(","),
    hourly: [
      "temperature_2m",
      "weathercode",
      "precipitation",
      "precipitation_probability",
      "windspeed_10m",
      "windgusts_10m",
    ].join(","),
  });

  const url = `/api/forecast?${params.toString()}`;

  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`Forecast API request failed (${res.status})`);
  }

  const data = await res.json();

  if (!data || !data.daily || !Array.isArray(data.daily.time)) {
    throw new Error("Forecast API returned invalid payload");
  }

  return data;
}

/**
 * getForecast({lat, lon}): returns cached forecast JSON when fresh,
 * otherwise fetches, caches, and returns. Duplicate in-flight calls are merged.
 */
export async function getForecast({ lat, lon }) {
  const k = key(lat, lon);

  // 1) memory
  const m = mem.get(k);
  if (m && Date.now() - m.ts < TTL_MS) return m.data;

  // 2) localStorage
  const s = readStorage(k);
  if (s) {
    // refresh memory for fast next hits
    mem.set(k, { ts: Date.now(), data: s });
    return s;
  }

  // 3) in-flight coalescing
  if (inflight.has(k)) return inflight.get(k);

  // 4) fetch → cache (also populate mem + storage)
  const p = (async () => {
    try {
      const data = await fetchOpenMeteo({ lat, lon });
      mem.set(k, { ts: Date.now(), data });
      writeStorage(k, data);
      return data;
    } finally {
      inflight.delete(k);
    }
  })();

  inflight.set(k, p);
  return p;
}
