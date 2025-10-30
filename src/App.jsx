import React, { useEffect, useMemo, useState } from "react";
import MapView from "./MapView";
import campsites from "./data/campsites.json";

// ───────────────────────────────────────────────
// Weather codes → emoji & description for the table
const WEATHER_MAP = {
  0:  { icon: "☀️", text: "Clear sky" },
  1:  { icon: "🌤️", text: "Mainly clear" },
  2:  { icon: "⛅",  text: "Partly cloudy" },
  3:  { icon: "☁️", text: "Overcast" },
  45: { icon: "🌫️", text: "Fog" },
  48: { icon: "🌫️", text: "Rime fog" },
  51: { icon: "🌦️", text: "Light drizzle" },
  53: { icon: "🌦️", text: "Drizzle" },
  55: { icon: "🌦️", text: "Heavy drizzle" },
  61: { icon: "🌧️", text: "Light rain" },
  63: { icon: "🌧️", text: "Rain" },
  65: { icon: "🌧️", text: "Heavy rain" },
  66: { icon: "🌨️", text: "Freezing rain" },
  67: { icon: "🌨️", text: "Heavy freezing rain" },
  71: { icon: "🌨️", text: "Light snow" },
  73: { icon: "🌨️", text: "Snow" },
  75: { icon: "❄️",  text: "Heavy snow" },
  77: { icon: "🌨️", text: "Snow grains" },
  80: { icon: "🌦️", text: "Showers" },
  81: { icon: "🌧️", text: "Heavy showers" },
  82: { icon: "🌧️", text: "Violent showers" },
  95: { icon: "⛈️", text: "Thunderstorm" },
  96: { icon: "⛈️", text: "Thunder + hail" },
  99: { icon: "⛈️", text: "Severe thunder + hail" },
};

// ───────────────────────────────────────────────
// WIND-FIRST scoring (caravan-friendly)
const CLASS_ORDER = ["Best", "Good", "Ok", "Fair", "Bad"];
const SCORE_BY_CLASS = { Best: 10, Good: 8, Ok: 5, Fair: 2, Bad: 0 };

function windCapRank(wind) {
  if (wind == null) return 4;  // unknown → be cautious
  if (wind >= 22) return 4;    // Bad
  if (wind >= 18) return 3;    // Fair max
  if (wind >= 14) return 2;    // Ok max
  if (wind >= 10) return 1;    // Good max
  return 0;                    // <10 → no wind cap
}

function baseClassRank({ tmax, rain }) {
  const temp = tmax ?? -999;
  const prcp = rain ?? 99;
  if (prcp <= 0.5 && temp >= 12) return 0; // Best
  if (prcp <= 2 && temp >= 8)   return 1;  // Good
  if (prcp <= 5 && temp >= 5)   return 2;  // Ok
  if (prcp <= 10 || temp >= 2)  return 3;  // Fair
  return 4;                                // Bad
}

function classifyDay({ tmax, windMax, rain }) {
  const base = baseClassRank({ tmax, rain });
  const wcap = windCapRank(windMax);
  const finalRank = Math.max(base, wcap); // wind can only worsen the class
  return CLASS_ORDER[finalRank];
}

// ───────────────────────────────────────────────
// Open-Meteo 7-day daily forecast
async function fetchForecast({ lat, lon }) {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    timezone: "Atlantic/Reykjavik",
    temperature_unit: "celsius",
    wind_speed_unit: "ms",
    precipitation_unit: "mm",
    forecast_days: "7",
    daily: [
      "temperature_2m_max",
      "temperature_2m_min",
      "precipitation_sum",
      "wind_speed_10m_max",
      "weathercode",
    ].join(","),
  });

  const url = `https://api.open-meteo.com/v1/forecast?${params.toString()}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Forecast failed: ${res.status}`);
  return res.json();
}

// For leaderboard: fetch and compute weekly score
async function fetchForecastAndScore({ lat, lon }) {
  const data = await fetchForecast({ lat, lon });
  if (!data?.daily?.time) return { score: 0, rows: [] };
  const rows = data.daily.time.map((t, i) => {
    const r = {
      date: t,
      tmax: data.daily.temperature_2m_max?.[i],
      rain: data.daily.precipitation_sum?.[i],
      windMax: data.daily.wind_speed_10m_max?.[i],
      code: data.daily.weathercode?.[i],
      tmin: data.daily.temperature_2m_min?.[i],
    };
    const cls = classifyDay(r);
    return { ...r, class: cls, points: SCORE_BY_CLASS[cls] ?? 0 };
  });
  const score = rows.reduce((sum, r) => sum + r.points, 0);
  return { score, rows };
}

// ───────────────────────────────────────────────
// Forecast hook (+ scoring) for the selected site
function useForecast(lat, lon) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (lat == null || lon == null) return;
    let aborted = false;
    setLoading(true);
    setError(null);

    fetchForecast({ lat, lon })
      .then((json) => !aborted && setData(json))
      .catch((err) => !aborted && setError(err))
      .finally(() => !aborted && setLoading(false));

    return () => { aborted = true; };
  }, [lat, lon]);

  const rows = useMemo(() => {
    if (!data?.daily) return [];
    const {
      time,
      temperature_2m_max,
      temperature_2m_min,
      precipitation_sum,
      wind_speed_10m_max,
      weathercode,
    } = data.daily;

    return time.map((t, i) => {
      const row = {
        date: t,
        tmax: temperature_2m_max?.[i] ?? null,
        tmin: temperature_2m_min?.[i] ?? null,
        rain: precipitation_sum?.[i] ?? null,
        windMax: wind_speed_10m_max?.[i] ?? null,
        code: weathercode?.[i] ?? null,
      };
      const cls = classifyDay(row);
      row.class = cls;
      row.points = { Best: 10, Good: 8, Ok: 5, Fair: 2, Bad: 0 }[cls] ?? 0;
      return row;
    });
  }, [data]);

  return { data, rows, loading, error };
}

// ───────────────────────────────────────────────
// Helpers
function formatDay(isoDate) {
  const d = new Date(isoDate);
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short" });
}
function haversine(lat1, lon1, lat2, lon2) {
  const toRad = (x) => (x * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}
function findNearestCampsite(lat, lon, list) {
  let best = null, bestD = Infinity;
  for (const s of list) {
    const d = haversine(lat, lon, s.lat, s.lon);
    if (d < bestD) { bestD = d; best = s; }
  }
  return { site: best, distanceKm: bestD };
}

// UI helper
function Card({ children, className = "" }) {
  return <div className={`rounded-2xl shadow-sm border border-slate-200 bg-white p-4 ${className}`}>{children}</div>;
}

// ───────────────────────────────────────────────
// Main App
export default function IcelandCampingWeatherApp() {
  const siteList = Array.isArray(campsites) ? campsites : [];
  const [siteId, setSiteId] = useState(localStorage.getItem("lastSite") || siteList[0]?.id);
  const [userLoc, setUserLoc] = useState(null); // { lat, lon }
  const [geoMsg, setGeoMsg] = useState(null);

  // Leaderboard data
  const [scoresById, setScoresById] = useState({}); // { [id]: { score, rows } }
  const [loadingAll, setLoadingAll] = useState(false);

  // repair siteId if JSON failed to load
  useEffect(() => {
    if (!siteId && siteList[0]?.id) setSiteId(siteList[0].id);
  }, [siteId, siteList]);

  useEffect(() => {
    if (siteId) localStorage.setItem("lastSite", siteId);
  }, [siteId]);

  const site = siteList.find((s) => s.id === siteId) || siteList[0];
  const { rows, loading, error } = useForecast(site?.lat, site?.lon);

  const totalPoints = useMemo(
    () => rows.reduce((sum, r) => sum + (r.points ?? 0), 0),
    [rows]
  );

  // Load weekly scores for ALL campsites (for leaderboard & map colors)
  useEffect(() => {
    let aborted = false;
    async function run() {
      if (!siteList.length) return;
      setLoadingAll(true);
      try {
        const pairs = await Promise.all(
          siteList.map(async (s) => {
            try {
              const data = await fetchForecastAndScore({ lat: s.lat, lon: s.lon });
              return [s.id, data];
            } catch (e) {
              return [s.id, { score: 0, rows: [] }];
            }
          })
        );
        if (!aborted) {
          const map = Object.fromEntries(pairs);
          setScoresById(map);
        }
      } finally {
        if (!aborted) setLoadingAll(false);
      }
    }
    run();
    return () => { aborted = true; };
  }, [siteList.length]);

  // Distance helper for UI
  const distanceTo = (s) =>
    userLoc ? haversine(userLoc.lat, userLoc.lon, s.lat, s.lon) : null;

  // Build Top 5 leaderboard (score desc, then distance asc)
  const top5 = useMemo(() => {
    const items = siteList.map((s) => ({
      site: s,
      score: scoresById[s.id]?.score ?? 0,
      dist: distanceTo(s),
    }));
    items.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      const da = a.dist ?? Infinity, db = b.dist ?? Infinity;
      return da - db;
    });
    return items.slice(0, 5);
  }, [siteList, scoresById, userLoc]);

  function useMyLocation() {
    if (!("geolocation" in navigator)) { setGeoMsg("Geolocation not supported."); return; }
    setGeoMsg("Locating…");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords || {};
        if (latitude == null || longitude == null) { setGeoMsg("Could not read position."); return; }
        setUserLoc({ lat: latitude, lon: longitude });
        const { site: nearest, distanceKm } = findNearestCampsite(latitude, longitude, siteList);
        if (nearest) {
          setSiteId(nearest.id);
          setGeoMsg(`Nearest: ${nearest.name} (${distanceKm.toFixed(1)} km)`);
        } else setGeoMsg("No campsites found.");
      },
      (err) => setGeoMsg(err?.message || "Permission denied / location unavailable."),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-100 to-slate-100 text-slate-900">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <header className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Iceland Camping – 7-Day Weather</h1>
            <p className="text-slate-600">Temp (°C), Max wind (m/s), Rain (mm), Weather icons & weekly score (wind-capped)</p>
          </div>
          <div className="flex items-center gap-3">
            <label htmlFor="site" className="text-sm font-medium">Campsite</label>
            <select
              id="site"
              className="px-3 py-2 rounded-xl border border-slate-300 bg-white shadow-sm"
              value={siteId || ""}
              onChange={(e) => setSiteId(e.target.value)}
            >
              {siteList.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <button
              onClick={useMyLocation}
              className="px-3 py-2 rounded-xl border border-slate-300 bg-white shadow-sm hover:bg-slate-50 text-sm"
              title="Find nearest campsite"
            >
              Use my location
            </button>
          </div>
        </header>

        {geoMsg && <div className="mb-4 text-sm text-slate-700">📍 {geoMsg}</div>}

        {/* Two-column layout: left main, right leaderboard */}
        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <div className="flex items-baseline justify-between mb-3">
              <h2 className="text-lg font-semibold">
                {site?.name || "—"}
                {userLoc && site && (
                  <span className="ml-2 text-sm text-slate-500">
                    · {distanceTo(site).toFixed(1)} km away
                  </span>
                )}
              </h2>
              <div className="text-sm text-slate-600">
                {site?.lat?.toFixed?.(4)}, {site?.lon?.toFixed?.(4)}
              </div>
            </div>

            {/* Weekly total */}
            <div className="mb-2 text-sm">
              <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1">
                Total (7 days): <span className="ml-2 font-semibold">{totalPoints} pts</span>
              </span>
            </div>

            {loading && <div className="py-10 text-center text-slate-600">Loading forecast…</div>}
            {error && <div className="py-10 text-center text-red-600">{String(error.message || error)}</div>}

            {!loading && !error && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-600">
                      <th className="py-2 pr-3 font-medium">Score</th>
                      <th className="py-2 pr-3 font-medium">Weather</th>
                      <th className="py-2 pr-3 font-medium">Day</th>
                      <th className="py-2 pr-3 font-medium">Temp min</th>
                      <th className="py-2 pr-3 font-medium">Temp max</th>
                      <th className="py-2 pr-3 font-medium">Max wind</th>
                      <th className="py-2 pr-3 font-medium">Rain</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.date} className="border-b last:border-0 border-slate-100">
                        <td className="py-2 pr-3">
                          <span
                            className={
                              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs " +
                              (r.class === "Best" ? "bg-green-100 text-green-800" :
                               r.class === "Good" ? "bg-emerald-100 text-emerald-800" :
                               r.class === "Ok"   ? "bg-yellow-100 text-yellow-800" :
                               r.class === "Fair" ? "bg-amber-100 text-amber-800" :
                                                    "bg-red-100 text-red-800")
                            }
                          >
                            {r.class} · {r.points}
                          </span>
                        </td>
                        <td className="py-2 pr-3">
                          {WEATHER_MAP?.[r.code]?.icon || "❔"}{" "}
                          <span className="text-slate-600">{WEATHER_MAP?.[r.code]?.text || ""}</span>
                        </td>
                        <td className="py-2 pr-3 whitespace-nowrap font-medium">{formatDay(r.date)}</td>
                        <td className="py-2 pr-3">{r.tmin?.toFixed?.(1)} °C</td>
                        <td className="py-2 pr-3">{r.tmax?.toFixed?.(1)} °C</td>
                        <td className="py-2 pr-3">{r.windMax?.toFixed?.(1)} m/s</td>
                        <td className="py-2 pr-3">{r.rain?.toFixed?.(1)} mm</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <MapView
                  campsites={siteList}
                  selectedId={siteId}
                  onSelect={(id) => setSiteId(id)}
                  userLocation={userLoc}
                />
              </div>
            )}

            <div className="mt-2 text-xs text-slate-500">
              Legend: Best=10, Good=8, Ok=5, Fair=2, Bad=0. Wind caps the class: ≥22 m/s → Bad; 18–21.9 → Fair max; 14–17.9 → Ok max; 10–13.9 → Good max.
            </div>
          </Card>

          <Card className="card">
  <h3 className="text-base font-semibold mb-3">Top 5 Campsites This Week</h3>

  {loadingAll && (
    <div className="text-sm text-slate-600">Crunching the numbers…</div>
  )}

  {!loadingAll && (
    <div className="overflow-hidden rounded-xl border border-slate-200">
      <table className="w-full text-sm text-left">
        <thead className="bg-slate-100/80 backdrop-blur-sm text-slate-600">
          <tr>
            <th className="px-3 py-2 font-semibold w-10 text-center">#</th>
            <th className="px-3 py-2 font-semibold">Campsite</th>
            <th className="px-3 py-2 font-semibold text-right">Distance</th>
            <th className="px-3 py-2 font-semibold text-right">Score</th>
          </tr>
        </thead>
        <tbody className="[&>tr:nth-child(even)]:bg-slate-50">
          {top5.map((item, idx) => (
            <tr
              key={item.site.id}
              className="hover:bg-sky-50/60 cursor-pointer transition"
              onClick={() => setSiteId(item.site.id)}
              title="Select on map"
            >
              <td className="px-3 py-2 text-center font-semibold text-slate-700">
                {idx + 1}
              </td>
              <td className="px-3 py-2 font-medium text-slate-800">
                {item.site.name}
              </td>
              <td className="px-3 py-2 text-right text-slate-600">
                {item.dist != null ? `${item.dist.toFixed(1)} km` : "—"}
              </td>
              <td className="px-3 py-2 text-right font-semibold text-slate-900">
                {item.score}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )}

  <div className="mt-3 text-xs text-slate-500">
    Sorted by weekly score, then nearest to you (if we know your location).
  </div>
</Card>
        </div>

        <footer className="mt-6 text-xs text-slate-500">
          Data by Open-Meteo. Forecast includes temperature, rain, wind, weather codes.
        </footer>
      </div>
    </div>
  );
}
