/**
 * CampCast — App.jsx
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import About from "./pages/About";

import { formatDay } from "./utils/date";
import { WEATHER_MAP } from "./utils/weatherMap";
import { isFeatureAvailable } from "./config/features";
import SlimHeader from "./components/SlimHeader";

// ──────────────────────────────────────────────────────────────
// App page
// ──────────────────────────────────────────────────────────────
function IcelandCampingWeatherApp({ page = "home" }) {
  const siteList = Array.isArray(campsitesFull) ? campsitesFull : [];

  const [siteId, setSiteId] = useLocalStorageState("lastSite", siteList[0]?.id);
  const [units, setUnits] = useLocalStorageState("units", "metric");
  const [theme, setTheme] = useLocalStorageState("theme", "light");
  const darkMode = theme === "dark";
  const mapAnchorRef = useRef(null);

  // ✅ Server identity / entitlements
  const { me, refetchMe } = useMe();
  const serverPro = !!me?.entitlements?.pro;
  const serverProUntil = me?.entitlements?.proUntil ?? null;

  // ✅ Optional dev override (only in dev)
  const [devPro, setDevPro] = useLocalStorageState("devPro", false);
  const toggleDevPro = useCallback(() => setDevPro((v) => !v), [setDevPro]);

  const entitlements = useMemo(() => {
    const isPro = import.meta.env.DEV ? !!devPro || serverPro : serverPro;
    return { isPro, proUntil: serverProUntil };
  }, [devPro, serverPro, serverProUntil]);

  const { toasts, pushToast, dismissToast } = useToast();

  const handleSelectSite = useCallback(
    (id) => {
      setSiteId(id);
      mapAnchorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    },
    [setSiteId]
  );

  const toggleTheme = useCallback(
    () => setTheme((t) => (t === "dark" ? "light" : "dark")),
    [setTheme]
  );

  const toggleUnits = useCallback(
    () => setUnits((u) => (u === "metric" ? "imperial" : "metric")),
    [setUnits]
  );

  const { lang, toggleLanguage } = useLanguage();
  const t = useT(lang);

  // GEO
  const { userLoc, geoMsg, useMyLocation } = useMyLocationNearestSite(
    siteList,
    handleSelectSite,
    t
  );
  const distanceTo = useDistanceTo(userLoc);

  // LEADERBOARD
  const { scoresById, loadingWave1, loadingBg } = useLeaderboardScores(siteList, siteId, userLoc);
  const { top5 } = useTop5Campsites(siteList, scoresById, userLoc);

  // Effects
  useThemeClass(darkMode);
  useEffect(() => {
    if (!siteId && siteList[0]?.id) setSiteId(siteList[0].id);
  }, [siteId, siteList, setSiteId]);

  // FORECAST
  const site = siteList.find((s) => s.id === siteId) || siteList[0];
  const { rows, windDir, shelter, loading, error } = useForecast(site?.lat, site?.lon, {
    t,
    toast: pushToast,
    retries: 2,
  });

  // ✅ Prevent Pro data leakage
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

  // Boot splash lifecycle
  const booting = useBooting(loading, rows.length);

  // ✅ Checkout: call /api/checkout and redirect to pay domain
  const startCheckout = useCallback(async () => {
    try {
      pushToast({ type: "info", title: t("loading"), message: t("redirectingToCheckout") });

      const r = await fetch("/api/checkout", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });

      const data = await r.json().catch(() => null);

      if (!r.ok || !data?.ok || !data?.url) {
        const msg = data?.error || `Checkout failed (${r.status})`;
        pushToast({ type: "error", title: "Checkout", message: msg });
        return;
      }

      window.location.assign(data.url);
    } catch (e) {
      pushToast({ type: "error", title: "Checkout", message: String(e?.message || e) });
    }
  }, [pushToast, t]);

  // ✅ If we come back from Paddle success/cancel, refresh entitlements
  useEffect(() => {
    const url = new URL(window.location.href);
    const status = url.searchParams.get("checkout");
    if (!status) return;

    if (status === "success") {
      pushToast({
        type: "success",
        title: "Pro",
        message: t?.("checkoutSuccess") ?? "Pro unlocked!",
      });
      refetchMe();
    } else if (status === "cancel") {
      pushToast({
        type: "info",
        title: "Checkout",
        message: t?.("checkoutCancelled") ?? "Checkout cancelled.",
      });
      refetchMe();
    }

    url.searchParams.delete("checkout");
    window.history.replaceState({}, "", url.toString());
  }, [pushToast, refetchMe, t]);

  return (
    <div>
      <Splash show={booting} minMs={700} fadeMs={500} />
      <ToastHub toasts={toasts} onDismiss={dismissToast} />

      <div className="min-h-screen font-sans bg-soft-grid text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        {page === "about" ? (
          <SlimHeader t={t} />
        ) : (
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
        )}

        <div className="max-w-6xl mx-auto px-4 py-10">
          {page === "about" ? (
            <About t={t} />
          ) : (
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
                onUpgrade={startCheckout} // ✅ NEW
                t={t}
                shelter={gatedShelter}
                windDir={gatedWindDir}
                proUntil={me?.entitlements?.proUntil ?? null}
                subscription={me?.subscription ?? null}
              />
            </div>
          )}
        </div>

        <Footer t={t} />
      </div>

      <BackToTop threshold={400} />
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Minimal /api/me hook (kept inside App.jsx for now)
// ──────────────────────────────────────────────────────────────
function useMe() {
  const [me, setMe] = useState(null);

  const fetchMe = useCallback(async () => {
    try {
      const r = await fetch("/api/me", { method: "GET", credentials: "include" });
      const data = await r.json().catch(() => null);
      setMe(data || null);
    } catch {
      setMe(null);
    }
  }, []);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  return { me, refetchMe: fetchMe };
}

// ──────────────────────────────────────────────────────────────
// Router
// ──────────────────────────────────────────────────────────────
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<IcelandCampingWeatherApp />} />
        <Route path="/about" element={<IcelandCampingWeatherApp page="about" />} />
        <Route path="*" element={<NotFound />} />
      </Routes>

      <Analytics />
      <SpeedInsights />
    </BrowserRouter>
  );
}
