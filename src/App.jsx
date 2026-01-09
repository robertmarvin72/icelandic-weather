/**
 * CampCast — App.jsx
 *
 * PURPOSE
 * - Main page for campsite forecast browsing.
 * - Handles global UI state: selected campsite, units, dark mode, user location.
 * - Fetches forecasts + computes scores + renders:
 *   (1) Daily forecast table
 *   (2) Top 5 leaderboard
 *   (3) Lazy-loaded map
 *
 * QUICK NAV (search these tags)
 * - [CONFIG]         Constants + small helpers
 * - [SCORING]        Scoring model and mapping to UI classes
 * - [UNITS]          Unit conversion helpers + labels
 * - [FORECAST]       Fetch + cache access + forecast shaping
 * - [HOOKS]          Custom hooks (useForecast, etc.)
 * - [GEO]            Geolocation + nearest campsite logic
 * - [APP STATE]      React state for site selection, units, dark mode, splash boot
 * - [PRELOAD]        Preloading leaderboard scores (throttled)
 * - [UI]             JSX render sections (toolbar, table, map, top5)
 * - [ROUTER]         Router wrapper + analytics
 *
 * NOTES
 * - Underlying data stays metric; conversions are display-only.
 * - Forecasts are cached via ./lib/forecastCache.
 */


import React, {
  useEffect,
  useMemo,
  useState,
  useRef,
  lazy,
  Suspense,
} from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import { scorePillClass } from "./ui/scoreStyles";

import {
  scoreDay,
  convertTemp,
  convertRain,
  convertWind,
  convertDistanceKm,
  formatNumber,
  TEMP_UNIT_LABEL,
  RAIN_UNIT_LABEL,
  WIND_UNIT_LABEL,
  DIST_UNIT_LABEL,
} from "./lib/scoring";

import campsitesLimited from "./data/campsites.limited.json";
import campsitesFull from "./data/campsites.full.json";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Splash from "./components/Splash";
import ScoreLegend from "./components/ScoreLegend";
import { getForecast } from "./lib/forecastCache";
import NotFound from "./pages/NotFound";
import LoadingShimmer from "./components/LoadingShimmer";
import BackToTop from "./components/BackToTop";
import InstallPWA from "./components/InstallPWA";
import { WeatherIcon } from "./components/WeatherIcon";
import { mapWeatherCodeToIconId } from "./utils/WeatherIconMapping";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";


const MapView = lazy(() => import("./MapView"));

// ──────────────────────────────────────────────────────────────
// [CONFIG] Small utilities + constants used across the file
// ──────────────────────────────────────────────────────────────
// Small sleep helper
function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// Prioritize: selected site, then nearest 8 (if we know user location), then the rest
function prioritizedSites(siteList, selectedId, userLoc) {
  if (!siteList?.length) return [];
  const selected = siteList.find((s) => s.id === selectedId);
  const others = siteList.filter((s) => s.id !== selectedId);

  const dist = (a, b) => {
    const toRad = (x) => (x * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(b.lat - a.lat),
      dLon = toRad(b.lon - a.lon);
    const la1 = toRad(a.lat),
      la2 = toRad(b.lat);
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

// Concurrency-limited queue with spacing to avoid 429s
async function processInBatches(
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

// Weather codes → emoji & description
const WEATHER_MAP = {
  0: { icon: "☀️", text: "Clear sky" },
  1: { icon: "🌤️", text: "Mainly clear" },
  2: { icon: "⛅", text: "Partly cloudy" },
  3: { icon: "☁️", text: "Overcast" },
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
  75: { icon: "❄️", text: "Heavy snow" },
  77: { icon: "🌨️", text: "Snow grains" },
  80: { icon: "🌦️", text: "Showers" },
  81: { icon: "🌧️", text: "Heavy showers" },
  82: { icon: "🌧️", text: "Violent showers" },
  95: { icon: "⛈️", text: "Thunderstorm" },
  96: { icon: "⛈️", text: "Thunder + hail" },
  99: { icon: "⛈️", text: "Severe thunder + hail" },
};

// ──────────────────────────────────────────────────────────────
// [FORECAST] Cached forecast fetch + “score rows” shaping
// ──────────────────────────────────────────────────────────────
// Cached forecast
async function fetchForecast({ lat, lon }) {
  return getForecast({ lat, lon });
}

// ──────────────────────────────────────────────────────────────
// [HOOKS] Data hook for selected campsite forecast
// ──────────────────────────────────────────────────────────────
// Hook for selected site
function useForecast(lat, lon) {
  const [data, setData] = useState(null),
    [loading, setLoading] = useState(false),
    [error, setError] = useState(null);

  useEffect(() => {
    if (lat == null || lon == null) return;
    let aborted = false;
    setLoading(true);
    setError(null);

    fetchForecast({ lat, lon })
      .then((j) => !aborted && setData(j))
      .catch((e) => !aborted && setError(e))
      .finally(() => !aborted && setLoading(false));

    return () => {
      aborted = true;
    };
  }, [lat, lon]);

  const rows = useMemo(() => {
    if (!data?.daily) return [];
    const { time, temperature_2m_max, temperature_2m_min, precipitation_sum, wind_speed_10m_max, weathercode } =
      data.daily;

    return time.map((t, i) => {
      const row = {
        date: t,
        tmax: temperature_2m_max?.[i] ?? null,
        tmin: temperature_2m_min?.[i] ?? null,
        rain: precipitation_sum?.[i] ?? null,
        windMax: wind_speed_10m_max?.[i] ?? null,
        code: weathercode?.[i] ?? null,
      };
      const s = scoreDay(row);
      return { ...row, class: s.finalClass, points: s.points, basePts: s.basePts, windPen: s.windPen, rainPen: s.rainPen };
    });
  }, [data]);

  return { data, rows, loading, error };
}

// ──────────────────────────────────────────────────────────────
// [GEO] Location helpers: distance + nearest campsite selection
// ──────────────────────────────────────────────────────────────
// Helpers
function formatDay(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short" });
}
function haversine(a1, o1, a2, o2) {
  const R = 6371,
    toRad = (x) => (x * Math.PI) / 180,
    dA = toRad(a2 - a1),
    dO = toRad(o2 - o1);
  const m =
    Math.sin(dA / 2) ** 2 + Math.cos(toRad(a1)) * Math.cos(toRad(a2)) * Math.sin(dO / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(m));
}
function findNearestCampsite(lat, lon, list) {
  let best = null,
    bestD = Infinity;
  for (const s of list) {
    const d = haversine(lat, lon, s.lat, s.lon);
    if (d < bestD) {
      bestD = d;
      best = s;
    }
  }
  return { site: best, distanceKm: bestD };
}

// ──────────────────────────────────────────────────────────────
// [UI] Small presentational helpers
// ──────────────────────────────────────────────────────────────
function Card({ children, className = "" }) {
  return (
    <div className={`rounded-2xl shadow-sm border border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-700 p-4 ${className}`}>
      {children}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// App page
// ──────────────────────────────────────────────────────────────
function IcelandCampingWeatherApp() {
  // ──────────────────────────────────────────────────────────────
  // [APP STATE] Global UI state for the page
  // ──────────────────────────────────────────────────────────────
  const siteList = Array.isArray(campsitesFull) ? campsitesFull : [];

  const [siteId, setSiteId] = useState(localStorage.getItem("lastSite") || siteList[0]?.id);
  const [userLoc, setUserLoc] = useState(null);
  const [geoMsg, setGeoMsg] = useState(null);

  const [scoresById, setScoresById] = useState({});
  const [loadingWave1, setLoadingWave1] = useState(false);
  const [loadingBg, setLoadingBg] = useState(false);


  const mapRef = useRef(null);
  const [mapInView, setMapInView] = useState(false);

  // 🔥 NEW: units state (metric vs imperial)
  const [units, setUnits] = useState(() => {
    if (typeof window === "undefined") return "metric";
    const stored = localStorage.getItem("units");
    return stored === "imperial" ? "imperial" : "metric";
  });

  const SCORES_CACHE_KEY = "campcast:scoresById:v1";
  const SCORES_CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

  function loadScoresCache() {
    try {
      const raw = localStorage.getItem(SCORES_CACHE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") return null;

      const { ts, scores } = parsed;
      if (!ts || !scores) return null;

      const age = Date.now() - ts;
      if (age > SCORES_CACHE_TTL_MS) return null;

      return scores;
    } catch {
      return null;
    }
  }

  let saveTimer = null;
  function scheduleSaveScoresCache(getLatestScoresById) {
    // Debounce writes to avoid hammering localStorage
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      try {
        const scores = getLatestScoresById();
        localStorage.setItem(
          SCORES_CACHE_KEY,
          JSON.stringify({ ts: Date.now(), scores })
        );
      } catch {
        // ignore
      }
    }, 800);
  }


  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("units", units);
    }
  }, [units]);

  // 🔥 NEW: dark mode state
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("theme") === "dark";
  });

  // Keep <html class="dark"> in sync with state
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  // Ensure siteId is set + persist it
  useEffect(() => {
    if (!siteId && siteList[0]?.id) setSiteId(siteList[0].id);
  }, [siteId, siteList]);

  useEffect(() => {
    if (siteId) localStorage.setItem("lastSite", siteId);
  }, [siteId]);

  // ✅ selected site + forecast (defines rows/loading)
  const site = siteList.find((s) => s.id === siteId) || siteList[0];
  const { rows, loading, error } = useForecast(site?.lat, site?.lon);

  // ✅ boot splash state MUST come after loading/rows exist
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    if (booting && !loading && rows.length > 0) {
      setBooting(false);
    }
  }, [booting, loading, rows.length]);

  const totalPoints = useMemo(() => rows.reduce((s, r) => s + (r.points ?? 0), 0), [rows]);

  // 🔥 Bonus improvement: prefetch MapView chunk after initial render
  useEffect(() => {
    const timer = setTimeout(() => {
      import("./MapView");
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // NEW: start loading the map only once its container is near viewport
  useEffect(() => {
    if (!mapRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting) {
          setMapInView(true);
          observer.disconnect();
        }
      },
      { root: null, rootMargin: "200px", threshold: 0.1 }
    );

    observer.observe(mapRef.current);
    return () => observer.disconnect();
  }, []);

  // ──────────────────────────────────────────────────────────────
  // [PRELOAD] Performance: prefetch MapView + lazy-mount map on scroll
  // ──────────────────────────────────────────────────────────────
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
          windMax: data.daily.wind_speed_10m_max?.[i] ?? null,
          code: data.daily.weathercode?.[i] ?? null,
        };
        const s = scoreDay(r);
        return { ...r, class: s.finalClass, points: s.points };
      });
      const score = rows.reduce((sum, r) => sum + (r.points ?? 0), 0);
      return { score, rows };
    }

    // ──────────────────────────────────────────────────────────────
    // [PRELOAD] Leaderboard: preload weekly scores (prioritized + throttled)
    // ──────────────────────────────────────────────────────────────
    async function preloadScores() {
      if (!siteList.length) return;

      // ✅ 1) Hydrate from cache immediately (fast repeat visits)
      // Only do this if we don't already have a bunch of scores in memory
      if (Object.keys(scoresById).length === 0) {
        const cached = loadScoresCache();
        if (cached && !aborted) {
          // Merge cached scores, but only for IDs we still have in the dataset
          const allowed = new Set(siteList.map(s => s.id));
          const filtered = {};
          for (const [id, val] of Object.entries(cached)) {
            if (allowed.has(id)) filtered[id] = val;
          }
          setScoresById(prev => ({ ...filtered, ...prev }));
        }
      }

      const prio = prioritizedSites(siteList, siteId, userLoc);

      const fetchOne = async (site) => {
        try {
          const data = await getForecast({ lat: site.lat, lon: site.lon });
          const scored = await computeScoreFromData(data);

          if (!aborted) {
            setScoresById((prev) => {
              const next = { ...prev, [site.id]: scored };

              // ✅ 2) Persist updates to cache (debounced)
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

      // ── Background: trickle the rest (unchanged for now)
      const rest = prio.slice(head.length);
      if (!rest.length) return;

      setLoadingBg(true);

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

    // 🧹 optional but recommended: cancel pending cache write
    if (saveTimer) {
      clearTimeout(saveTimer);
      saveTimer = null;
    }
    };
  }, [siteList.length, siteId, userLoc?.lat, userLoc?.lon]);

  const distanceTo = (s) => (userLoc ? haversine(userLoc.lat, userLoc.lon, s.lat, s.lon) : null);

  const siteById = useMemo(() => {
    const map = new Map();
    for (const s of siteList) {
      map.set(s.id, s);
    }
    return map;
  }, [siteList]);


  const top5 = useMemo(() => {
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
      b.score !== a.score
        ? b.score - a.score
        : (a.dist ?? Infinity) - (b.dist ?? Infinity)
    );

    return items.slice(0, 5);
  }, [scoresById, siteById, userLoc]);



  // ──────────────────────────────────────────────────────────────
  // [GEO] "My location" action: geolocate -> find nearest campsite -> select it
  // ──────────────────────────────────────────────────────────────
  function useMyLocation() {
    if (!("geolocation" in navigator)) {
      setGeoMsg("Geolocation not supported.");
      return;
    }
    setGeoMsg("Locating…");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords || {};
        if (latitude == null || longitude == null) {
          setGeoMsg("Could not read position.");
          return;
        }
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

  // ──────────────────────────────────────────────────────────────
  // [UI] Render: toolbar + forecast table + map + top 5 leaderboard
  // ──────────────────────────────────────────────────────────────

  return (
    <div>
      {/* ✅ show splash until first forecast is loaded */}
      {/* [APP STATE] Splash boot lifecycle (show until first successful forecast load) */}
      <Splash show={booting} minMs={700} fadeMs={500} />

      <div className="min-h-screen font-sans bg-soft-grid text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        <Header />
        <div className="max-w-6xl mx-auto px-4 py-10">
          <header className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-2xl font-black tracking-tight">7-Day Weather</h1>
            </div>

            <div className="flex items-center gap-3">
              <label htmlFor="site" className="text-sm font-medium sr-only">
                Campsite
              </label>

              <select
                id="site"
                aria-label="Select campsite"
                className="px-3 py-2 rounded-xl border border-slate-300 bg-white shadow-sm focus-ring smooth text-slate-900 dark:bg-slate-900 dark:border-slate-600 dark:text-slate-100"
                value={siteId || ""}
                onChange={(e) => {
                  setSiteId(e.target.value);
                  mapRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
              >
                {siteList.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              <button
                onClick={useMyLocation}
                className="px-3 py-2 rounded-xl border border-slate-300 bg-white shadow-sm focus-ring smooth
                          text-slate-900 dark:bg-slate-900 dark:border-slate-600 dark:text-slate-100
                          inline-flex items-center gap-2 text-sm whitespace-nowrap"
                aria-label="Use my current location"
                title="Use my current location"
              >
                <span>📍</span>
                <span>My location</span>
              </button>

              <InstallPWA />

              <button
                type="button"
                onClick={() => setUnits((prev) => (prev === "metric" ? "imperial" : "metric"))}
                className="px-3 py-2 rounded-xl border border-slate-300 bg-white shadow-sm focus-ring smooth text-sm
                          flex items-center gap-2
                          text-slate-900 dark:bg-slate-900 dark:border-slate-600 dark:text-slate-100"
                aria-label={units === "metric" ? "Switch to imperial units" : "Switch to metric units"}
                title={units === "metric" ? "Metric units: °C, mm, m/s" : "Imperial units: °F, in, knots"}
              >
                <span>📏</span>
                <span>{units === "metric" ? "°C" : "°F"}</span>
              </button>

              <button
                onClick={() => setDarkMode((d) => !d)}
                className="px-3 py-2 rounded-xl border border-slate-300 bg-white shadow-sm focus-ring smooth text-sm dark:bg-slate-900 dark:border-slate-600"
                aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
                title="Toggle dark mode"
              >
                {darkMode ? "🌙 Dark" : "☀️ Light"}
              </button>
            </div>
          </header>

          {geoMsg && <div className="mb-4 text-sm text-slate-700 dark:text-slate-300">📍 {geoMsg}</div>}

          <div className="grid md:grid-cols-2 gap-4">
            <Card className="card">
              <div className="flex items-baseline justify-between mb-3">
                <h2 className="text-lg font-semibold">
                  {site?.name || "—"}
                  {userLoc && site && (
                    <span className="ml-2 text-sm text-slate-500 dark:text-slate-300">
                      · {formatNumber(convertDistanceKm(distanceTo(site), units), 1)} {DIST_UNIT_LABEL[units]} away
                    </span>
                  )}
                </h2>
                <div className="text-sm text-slate-600 dark:text-slate-300">
                  {site?.lat?.toFixed?.(4)}, {site?.lon?.toFixed?.(4)}
                </div>
              </div>

              <div className="mb-3 text-sm">
                <span className="inline-flex items-center rounded-full bg-white/80 dark:bg-slate-900/70 glass px-3 py-1 shadow-sm border border-slate-200 dark:border-slate-600">
                  Total (7 days): <span className="ml-2 font-semibold">{totalPoints} pts</span>
                </span>
              </div>

              {loading && <LoadingShimmer rows={8} />}
              {error && <div className="py-10 text-center text-red-600">{String(error.message || error)}</div>}

              {!loading && !error && (
                <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm table-sticky">
                      <thead className="bg-slate-50 dark:bg-slate-900/80">
                        <tr className="border-b border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-200">
                          <th className="py-3 pl-4 pr-3 font-semibold">Score</th>
                          <th className="py-3 pr-3 font-semibold">Weather</th>
                          <th className="py-3 pr-3 font-semibold">Day</th>
                          <th className="py-3 pr-3 font-semibold">Temp min</th>
                          <th className="py-3 pr-3 font-semibold">Temp max</th>
                          <th className="py-3 pr-3 font-semibold">Max wind</th>
                          <th className="py-3 pr-3 font-semibold">Rain</th>
                        </tr>
                      </thead>

                      <tbody className="[&>tr:nth-child(even)]:bg-slate-50 dark:[&>tr:nth-child(even)]:bg-slate-800/40">
                        {rows.map((r) => (
                          <tr
                            key={r.date}
                            className="border-b last:border-0 border-slate-100 dark:border-slate-800
                                      hover:bg-sky-50/50 dark:hover:bg-slate-800/60"
                          >
                            <td className="py-2 pl-4 pr-3">
                              <span
                                title={`Base ${r.basePts} (Temp ${
                                  formatNumber(convertTemp(r.tmax, units)) ?? "?"
                                }${TEMP_UNIT_LABEL[units]}) Wind ${r.windPen} (${
                                  formatNumber(convertWind(r.windMax, units)) ?? "?"
                                } ${WIND_UNIT_LABEL[units]}) Rain ${r.rainPen} (${
                                  formatNumber(convertRain(r.rain, units)) ?? "?"
                                } ${RAIN_UNIT_LABEL[units]}) = ${r.points} → ${r.class}`}
                                className={
                                  "inline-flex flex-col items-center justify-center gap-0.5 rounded-full px-2 py-2 text-[9px] font-semibold cursor-help w-14 h-14 text-center " +
                                  (r.class === "Best"
                                    ? "bg-green-100 text-green-800"
                                    : r.class === "Good"
                                    ? "bg-emerald-100 text-emerald-800"
                                    : r.class === "Ok"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : r.class === "Fair"
                                    ? "bg-amber-100 text-amber-800"
                                    : "bg-red-100 text-red-800")
                                }
                              >
                                <WeatherIcon
                                  iconId={mapWeatherCodeToIconId(r.code ?? 0, true)}
                                  aria-label={`Weather: ${WEATHER_MAP?.[r.code]?.text || "Unknown"}`}
                                  className="w-9 h-9"
                                  role="img"
                                />
                                <span>{r.class}</span>
                              </span>
                            </td>

                            <td className="py-2 pr-3 text-slate-700 dark:text-slate-200">
                              {WEATHER_MAP?.[r.code]?.text || ""}
                            </td>

                            <td className="py-2 pr-3 whitespace-nowrap font-medium">{formatDay(r.date)}</td>
                            <td className="py-2 pr-3">{formatNumber(convertTemp(r.tmin, units))} {TEMP_UNIT_LABEL[units]}</td>
                            <td className="py-2 pr-3">{formatNumber(convertTemp(r.tmax, units))} {TEMP_UNIT_LABEL[units]}</td>
                            <td className="py-2 pr-3">{formatNumber(convertWind(r.windMax, units))} {WIND_UNIT_LABEL[units]}</td>
                            <td className="py-2 pr-3">{formatNumber(convertRain(r.rain, units))} {RAIN_UNIT_LABEL[units]}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div ref={mapRef}>
                    {mapInView && (
                      <Suspense
                        fallback={
                          <div className="p-6 text-center text-slate-600 dark:text-slate-300 text-sm">
                            Loading map…
                          </div>
                        }
                      >
                        <MapView
                          campsites={siteList}
                          selectedId={siteId}
                          onSelect={(id) => setSiteId(id)}
                          userLocation={userLoc}
                        />
                      </Suspense>
                    )}
                  </div>
                </div>
              )}

              <div className="mt-2 text-xs text-slate-500 dark:text-slate-300">
                Temp base: &gt;14°C=10, 12–14=8, 8–12=5, 6–8=2, &lt;6=0. Wind penalty: ≤5=0, ≤10=2, ≤15=5, &gt;15=10. Rain penalty: &lt;1=0, 1–4=2, &gt;4=5. Final = clamp(base − penalties, 0..10).
              </div>
            </Card>

            <Card className="card hover-lift">
              <h3 className="text-base font-semibold mb-1">
                Top 5 Campsites This Week
                <span className="ml-2 text-xs font-normal text-slate-500 dark:text-slate-400">
                  (from {Object.keys(scoresById).length} scored)
                </span>
              </h3>

              {/* Show shimmer only if we have nothing yet */}
              {top5.length === 0 && loadingWave1 && <LoadingShimmer rows={5} height={20} />}
              <div className="mb-3 text-xs text-slate-500 dark:text-slate-400">
                {loadingBg ? "Loading more campsites…" : "Up to date."}
              </div>
              {top5.length > 0 && (
                <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-100/80 backdrop-blur-sm text-slate-700 dark:bg-slate-900/80 dark:text-slate-300">
                      <tr>
                        <th className="px-3 py-2 font-semibold w-10 text-center">#</th>
                        <th className="px-3 py-2 font-semibold">Campsite</th>
                        <th className="px-3 py-2 font-semibold text-right">Distance</th>
                        <th className="px-3 py-2 font-semibold text-right">Score</th>
                      </tr>
                    </thead>

                    <tbody className="[&>tr:nth-child(even)]:bg-slate-50 dark:[&>tr:nth-child(even)]:bg-slate-800/40">
                      {top5.map((item, idx) => (
                        <tr
                          key={item.site.id}
                          className="hover:bg-sky-50/60 cursor-pointer transition dark:hover:bg-slate-800/60"
                          onClick={() => {
                            setSiteId(item.site.id);
                            mapRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                          }}
                          title="Select on map"
                        >
                          <td className="px-3 py-2 text-center font-semibold text-slate-700 dark:text-slate-200">
                            {idx + 1}
                          </td>
                          <td className="px-3 py-2 font-medium text-slate-800 dark:text-slate-100">
                            {item.site.name}
                          </td>
                          <td className="px-3 py-2 text-right text-slate-600 dark:text-slate-300">
                            {item.dist == null
                              ? "—"
                              : `${formatNumber(convertDistanceKm(item.dist, units), 1)} ${DIST_UNIT_LABEL[units]}`}
                          </td>
                          <td className="px-3 py-2 text-right">
                            <span
                              className={`pill-pop inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-semibold ${scorePillClass(
                                item.score
                              )}`}
                              title={`Weekly score: ${item.score} / 70`}
                            >
                              {item.score}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <ScoreLegend />
                </div>
              )}

              <div className="mt-3 text-xs text-slate-500 dark:text-slate-300">
                Sorted by weekly score, then nearest to you.
              </div>
            </Card>

          </div>

          <footer className="mt-6 text-xs text-slate-500 dark:text-slate-300">
            Data by Open-Meteo. Forecast includes temperature, rain, wind, & weather codes.
          </footer>
        </div>

        <Footer />
      </div>

      <BackToTop threshold={400} />
    </div>
  );
}


// ──────────────────────────────────────────────────────────────
// [ROUTER] App routing + Vercel analytics
// ──────────────────────────────────────────────────────────────

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<IcelandCampingWeatherApp />} />
        <Route path="*" element={<NotFound />} />
      </Routes>

      <Analytics />
      <SpeedInsights />
    </BrowserRouter>
  );
}
