/**
 * CampCast — App.jsx
 *
 * PURPOSE
 * - App shell + routing (React Router) + analytics.
 * - IcelandCampingWeatherApp orchestrates UI state and composes the main page:
 *   (1) Toolbar controls (site, location, units, theme)
 *   (2) Forecast table (7-day rows + map slot)
 *   (3) Top 5 leaderboard (weekly score ranking)
 *
 * WHAT LIVES ELSEWHERE NOW
 * - Leaderboard preloading/caching/throttling: ./hooks/useLeaderboardScores
 * - Map lazy loading + viewport mounting: ./components/LazyMap
 * - Geolocation + nearest campsite selection: ./hooks/useMyLocationNearestSite
 * - Forecast fetch + shaping: ./hooks/useForecast
 *
 * QUICK NAV (search these tags)
 * - [IMPORTS]        External + internal imports
 * - [DATA]           Campsite dataset + derived lookups
 * - [APP STATE]      Persisted UI state (site, units, theme) + transient UI state (boot splash)
 * - [ACTIONS]        UI actions/handlers (select site, toggle theme, etc.)
 * - [GEO]            Location state + distance helpers
 * - [LEADERBOARD]    Read/compute Top 5 view from scores
 * - [EFFECTS]        DOM sync (theme) + siteId fallback
 * - [FORECAST]       Selected site + forecast hook + row shaping
 * - [UI]             Page composition (Toolbar, ForecastTable, LazyMap, Top5Leaderboard)
 * - [ROUTER]         Routes + Vercel analytics
 *
 * NOTES
 * - Units/theme are persisted with useLocalStorageState.
 * - Scoring rules are encapsulated in scoring + leaderboard hooks/components.
 */

import { useCallback, useEffect, useMemo, useRef } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";

import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";

import BackToTop from "./components/BackToTop";
import Footer from "./components/Footer";
import ForecastTable from "./components/ForecastTable";
import LazyMap from "./components/LazyMap";
import PageHeader from "./components/PageHeader";
import Splash from "./components/Splash";
import Top5Leaderboard from "./components/Top5Leaderboard";
import ToastHub from "./components/ToastHub";
import { useToast } from "./hooks/useToast";

import campsitesFull from "./data/campsites.full.json";

import { useBooting } from "./hooks/useBooting";
import { useDistanceTo } from "./hooks/useDistanceTo";
import { useForecast } from "./hooks/useForecast";
import { useLeaderboardScores } from "./hooks/useLeaderboardScores";
import { useLocalStorageState } from "./hooks/useLocalStorageState";
import { useMyLocationNearestSite } from "./hooks/useMyLocationNearestSite";
import { useThemeClass } from "./hooks/useThemeClass";
import { useTop5Campsites } from "./hooks/useTop5Campsites";
import { useLanguage } from "./hooks/useLanguage";
import { useT } from "./hooks/useT";

import NotFound from "./pages/NotFound";

import { formatDay } from "./utils/date";
import { WEATHER_MAP } from "./utils/weatherMap";
import { isFeatureAvailable } from "./config/features";

// ──────────────────────────────────────────────────────────────
// App page
// ──────────────────────────────────────────────────────────────
function IcelandCampingWeatherApp() {
  // ──────────────────────────────────────────────────────────────
  // [DATA] Campsite dataset
  // ──────────────────────────────────────────────────────────────
  const siteList = Array.isArray(campsitesFull) ? campsitesFull : [];

  // ──────────────────────────────────────────────────────────────
  // [APP STATE] Persisted UI state
  // ──────────────────────────────────────────────────────────────
  const [siteId, setSiteId] = useLocalStorageState("lastSite", siteList[0]?.id);
  const [units, setUnits] = useLocalStorageState("units", "metric");
  const [theme, setTheme] = useLocalStorageState("theme", "light"); // "light" | "dark"
  const darkMode = theme === "dark";
  const mapAnchorRef = useRef(null);

  // ──────────────────────────────────────────────────────────────
  // [ENTITLEMENTS] Dev Pro toggle (persisted) + derived entitlements
  // ──────────────────────────────────────────────────────────────
  const [devPro, setDevPro] = useLocalStorageState("devPro", false);

  const toggleDevPro = useCallback(() => {
    setDevPro((v) => !v);
  }, [setDevPro]);

  const entitlements = useMemo(() => ({ isPro: !!devPro }), [devPro]);

  // ──────────────────────────────────────────────────────────────
  // [ACTIONS] User interactions
  // ──────────────────────────────────────────────────────────────
  const handleSelectSite = useCallback((id) => {
    setSiteId(id);
    mapAnchorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((t) => (t === "dark" ? "light" : "dark"));
  }, []);

  const toggleUnits = useCallback(() => {
    setUnits((u) => (u === "metric" ? "imperial" : "metric"));
  }, []);

  const { lang, toggleLanguage } = useLanguage();
  const t = useT(lang);

  const { toasts, pushToast, dismissToast } = useToast();

  // ──────────────────────────────────────────────────────────────
  // [GEO] Location + distance helpers
  // ──────────────────────────────────────────────────────────────
  const { userLoc, geoMsg, useMyLocation } = useMyLocationNearestSite(
    siteList,
    handleSelectSite,
    t
  );

  // Distance helper used by forecast header + Top 5 tie-breaks
  const distanceTo = useDistanceTo(userLoc);

  // ──────────────────────────────────────────────────────────────
  // [LEADERBOARD] Scores + derived Top 5 view
  // ──────────────────────────────────────────────────────────────
  const { scoresById, loadingWave1, loadingBg } = useLeaderboardScores(siteList, siteId, userLoc);

  const { top5 } = useTop5Campsites(siteList, scoresById, userLoc);

  // ──────────────────────────────────────────────────────────────
  // [EFFECTS] DOM sync + site Id fallback
  // ──────────────────────────────────────────────────────────────
  useThemeClass(darkMode);

  // Ensure siteId is set + persist it
  useEffect(() => {
    if (!siteId && siteList[0]?.id) setSiteId(siteList[0].id);
  }, [siteId, siteList]);

  // ──────────────────────────────────────────────────────────────
  // [FORECAST] Selected site + forecast hook + row shaping
  // ──────────────────────────────────────────────────────────────
  const site = siteList.find((s) => s.id === siteId) || siteList[0];
  const { rows, windDir, shelter, loading, error, retrying, refetch } = useForecast(
    site?.lat,
    site?.lon,
    {
      t,
      toast: pushToast,
      retries: 2,
    }
  );

  // ──────────────────────────────────────────────────────────────
  // [PRO GATING] Prevent Pro data leakage in Free/Teaser mode
  // ──────────────────────────────────────────────────────────────
  const gatedWindDir = useMemo(() => {
    const gate = isFeatureAvailable("windDirection", entitlements);
    return gate.available ? windDir : null;
  }, [windDir, entitlements]);

  const gatedShelter = useMemo(() => {
    const gate = isFeatureAvailable("shelterIndex", entitlements);
    return gate.available ? shelter : null;
  }, [shelter, entitlements]);

  const rowsWithDay = useMemo(
    () => rows.map((r) => ({ ...r, dayLabel: formatDay(r.date, lang) })),
    [rows, lang]
  );

  // ──────────────────────────────────────────────────────────────
  // [APP STATE] Boot splash lifecycle
  // ──────────────────────────────────────────────────────────────
  const booting = useBooting(loading, rows.length);

  // ──────────────────────────────────────────────────────────────
  // [UI] Render
  // ──────────────────────────────────────────────────────────────
  return (
    <div>
      <Splash show={booting} minMs={700} fadeMs={500} />
      <ToastHub toasts={toasts} onDismiss={dismissToast} />
      <div className="min-h-screen font-sans bg-soft-grid text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        <PageHeader
          t={t}
          lang={lang}
          onToggleLanguage={toggleLanguage}
          siteList={siteList}
          siteId={siteId}
          onSelectSite={handleSelectSite}
          onUseMyLocation={useMyLocation}
          units={units}
          onToggleUnits={toggleUnits}
          darkMode={darkMode}
          onToggleTheme={toggleTheme}
          geoMsg={geoMsg}
          devPro={devPro}
          onToggleDevPro={toggleDevPro}
        />

        <div className="max-w-6xl mx-auto px-4 py-10">
          <div className="grid md:grid-cols-2 gap-4">
            <ForecastTable
              entitlements={entitlements}
              site={site}
              userLoc={userLoc}
              distanceToKm={distanceTo(site)}
              rows={rowsWithDay}
              loading={loading}
              error={error}
              units={units}
              weatherMap={WEATHER_MAP}
              mapSlot={
                <div ref={mapAnchorRef}>
                  <LazyMap
                    campsites={siteList}
                    selectedId={siteId}
                    onSelect={(id) => setSiteId(id)}
                    userLocation={userLoc}
                  />
                </div>
              }
              lang={lang}
              t={t}
            />

            <Top5Leaderboard
              entitlements={entitlements}
              top5={top5}
              lang={lang}
              scoredCount={Object.keys(scoresById).length}
              loadingWave1={loadingWave1}
              loadingBg={loadingBg}
              units={units}
              onSelectSite={handleSelectSite}
              t={t}
              shelter={gatedShelter}
              windDir={gatedWindDir}
            />
          </div>
        </div>

        <Footer t={t} />
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
