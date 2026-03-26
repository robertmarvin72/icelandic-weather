/**
 * CampCast — App.jsx
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BrowserRouter, useNavigate } from "react-router-dom";

import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { registerSW } from "virtual:pwa-register";

import AppRoutes from "./AppRoutes";
import BackToTop from "./components/BackToTop";
import DecisionBanner from "./components/DecisionBanner";
import Footer from "./components/Footer";
import ForecastTable from "./components/ForecastTable";
import LazyMap from "./components/LazyMap";
import LoginModal from "./components/LoginModal";
import PageHeader from "./components/PageHeader";
import Splash from "./components/Splash";
import ToastHub from "./components/ToastHub";
import Top5Leaderboard from "./components/Top5Leaderboard";
import { isFeatureAvailable } from "./config/features";
import { useBooting } from "./hooks/useBooting";
import { useCampsites } from "./hooks/useCampsites";
import { useCheckoutFlow } from "./hooks/useCheckoutFlow";
import { useDistanceTo } from "./hooks/useDistanceTo";
import { useForecast } from "./hooks/useForecast";
import { useLanguage } from "./hooks/useLanguage";
import { useLeaderboardScores } from "./hooks/useLeaderboardScores";
import { useLocalStorageState } from "./hooks/useLocalStorageState";
import { useLoginFlow } from "./hooks/useLoginFlow";
import { useMe } from "./hooks/useMe";
import { useMyLocationNearestSite } from "./hooks/useMyLocationNearestSite";
import { usePwaUpdateToast } from "./hooks/usePwaUpdateToast";
import { useT } from "./hooks/useT";
import { useThemeClass } from "./hooks/useThemeClass";
import { useToast } from "./hooks/useToast";
import { useTop5Campsites } from "./hooks/useTop5Campsites";
import About from "./pages/About";
import { formatDay } from "./utils/date";
import { WEATHER_MAP } from "./utils/weatherMap";

function IcelandCampingWeatherApp({ page = "home" }) {
  const [units, setUnits] = useLocalStorageState("units", "metric");
  const [theme, setTheme] = useLocalStorageState("theme", "light");
  const darkMode = theme === "dark";
  const mapAnchorRef = useRef(null);

  const { lang, toggleLanguage } = useLanguage();
  const t = useT(lang);
  const { toasts, pushToast, dismissToast } = useToast();
  const navigate = useNavigate();

  const { me, refetchMe } = useMe();
  const serverPro = !!me?.entitlements?.pro;
  const serverProUntil = me?.entitlements?.proUntil ?? null;

  const [devPro, setDevPro] = useLocalStorageState("devPro", false);
  const toggleDevPro = useCallback(() => setDevPro((v) => !v), [setDevPro]);

  const entitlements = useMemo(() => {
    const isPro = import.meta.env.DEV ? !!devPro || serverPro : serverPro;
    return { isPro, proUntil: serverProUntil };
  }, [devPro, serverPro, serverProUntil]);

  const {
    campsites: siteList,
    loading: campsitesLoading,
    error: campsitesError,
  } = useCampsites({ reloadKey: entitlements.isPro });

  const showCampsitesGate = campsitesLoading || campsitesError || !siteList?.length;
  const [siteId, setSiteId] = useLocalStorageState("lastSite", null);

  const [needRefresh, setNeedRefresh] = useState(false);
  const [offlineReady, setOfflineReady] = useState(false);
  const updateServiceWorkerRef = useRef(null);

  useEffect(() => {
    const updateSW = registerSW({
      onNeedRefresh() {
        setNeedRefresh(true);
      },
      onOfflineReady() {
        setOfflineReady(true);
      },
    });

    updateServiceWorkerRef.current = updateSW;
  }, []);

  usePwaUpdateToast({
    needRefresh,
    updateServiceWorker: updateServiceWorkerRef.current,
    pushToast,
    dismissToast,
    t,
  });

  useEffect(() => {
    if (!offlineReady) return;

    pushToast({
      type: "success",
      title: t?.("offlineReadyTitle") ?? "Ready for offline",
      message: t?.("offlineReadyMsg") ?? "CampCast is cached and can work offline.",
    });

    setOfflineReady(false);
  }, [offlineReady, pushToast, t]);

  const {
    loginOpen,
    loginEmail,
    loginBusy,
    setLoginEmail,
    openLoginModal,
    closeLoginModal,
    submitLogin,
  } = useLoginFlow({ me, navigate, pushToast, refetchMe, t });

  const { startCheckout, openBillingPortal } = useCheckoutFlow({
    me,
    navigate,
    openLoginModal,
    pushToast,
    refetchMe,
    t,
  });

  const handleSelectSite = useCallback(
    (id) => {
      setSiteId(id);
      mapAnchorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    },
    [setSiteId]
  );

  const toggleTheme = useCallback(
    () => setTheme((th) => (th === "dark" ? "light" : "dark")),
    [setTheme]
  );

  const toggleUnits = useCallback(
    () => setUnits((u) => (u === "metric" ? "imperial" : "metric")),
    [setUnits]
  );

  const { userLoc, geoMsg, useMyLocation } = useMyLocationNearestSite(
    showCampsitesGate ? [] : siteList,
    handleSelectSite,
    t
  );
  const distanceTo = useDistanceTo(userLoc);

  const { scoresById, loadingWave1, loadingBg } = useLeaderboardScores(
    showCampsitesGate ? [] : siteList,
    siteId,
    userLoc
  );
  const { top5 } = useTop5Campsites(showCampsitesGate ? [] : siteList, scoresById, userLoc);

  const userLocationLabel = useMemo(() => {
    if (!userLoc || !siteList?.length) return null;

    let nearest = null;
    let minDist = Infinity;

    for (const site of siteList) {
      const siteLat = Number(site?.lat);
      const siteLon = Number(site?.lon);
      if (!Number.isFinite(siteLat) || !Number.isFinite(siteLon)) continue;

      const dx = siteLat - userLoc.lat;
      const dy = siteLon - userLoc.lon;
      const dist = dx * dx + dy * dy;

      if (dist < minDist) {
        minDist = dist;
        nearest = site;
      }
    }

    return nearest?.name ?? null;
  }, [userLoc, siteList]);

  useThemeClass(darkMode);
  useEffect(() => {
    if (showCampsitesGate) return;

    if (!siteId) {
      setSiteId(siteList[0].id);
      return;
    }

    const exists = siteList.some((s) => s.id === siteId);
    if (!exists) setSiteId(siteList[0].id);
  }, [showCampsitesGate, siteId, siteList, setSiteId]);

  const site = showCampsitesGate ? null : siteList.find((s) => s.id === siteId) || siteList[0];
  const { rows, windDir, shelter, loading, error } = useForecast(site?.lat, site?.lon, {
    t,
    toast: pushToast,
    retries: 2,
  });

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

  const currentScore = useMemo(
    () => Number(scoresById?.[siteId]?.score ?? 0),
    [scoresById, siteId]
  );
  const [routePlannerSummary, setRoutePlannerSummary] = useState(null);
  const booting = useBooting(loading, rows.length);

  return (
    <div>
      <Splash show={booting} minMs={700} fadeMs={500} />
      <ToastHub toasts={toasts} onDismiss={dismissToast} />

      <LoginModal
        open={loginOpen}
        loginBusy={loginBusy}
        loginEmail={loginEmail}
        setLoginEmail={setLoginEmail}
        closeLoginModal={closeLoginModal}
        submitLogin={submitLogin}
        t={t}
      />

      <div className="min-h-screen font-sans bg-soft-grid text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        <PageHeader
          t={t}
          lang={lang}
          onToggleLanguage={toggleLanguage}
          siteList={showCampsitesGate ? [] : siteList}
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

        <div className="mx-auto max-w-6xl px-4 py-10">
          {page === "about" ? (
            <About t={t} />
          ) : showCampsitesGate ? (
            <div className="flex min-h-[50vh] items-center justify-center p-6">
              <div className="max-w-md text-center">
                <div className="mb-2 text-base font-semibold">
                  {campsitesLoading ? "Loading campsites…" : "Couldn’t load campsites"}
                </div>

                {!campsitesLoading && (
                  <div className="mb-4 text-sm opacity-80">
                    {String(campsitesError?.message || "Unknown error")}
                  </div>
                )}

                {!campsitesLoading && (
                  <button
                    type="button"
                    onClick={() => window.location.reload()}
                    className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white dark:bg-white dark:text-slate-900"
                  >
                    Reload
                  </button>
                )}
              </div>
            </div>
          ) : (
            <>
              <DecisionBanner
                t={t}
                rows={rowsWithDay}
                currentScore={currentScore}
                routePlannerSummary={routePlannerSummary}
                entitlements={entitlements}
              />

              <div className="grid gap-4 md:grid-cols-2">
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
                        lang={lang}
                        t={t}
                        theme={theme}
                      />
                    </div>
                  }
                  lang={lang}
                  t={t}
                />

                <Top5Leaderboard
                  sites={siteList}
                  entitlements={entitlements}
                  top5={top5}
                  lang={lang}
                  scoredCount={Object.keys(scoresById).length}
                  loadingWave1={loadingWave1}
                  loadingBg={loadingBg}
                  units={units}
                  onSelectSite={handleSelectSite}
                  me={me}
                  onUpgrade={startCheckout}
                  t={t}
                  shelter={gatedShelter}
                  windDir={gatedWindDir}
                  proUntil={me?.entitlements?.proUntil ?? null}
                  subscription={me?.subscription ?? null}
                  onManageSubscription={openBillingPortal}
                  selectedSiteId={siteId}
                  userLocationLabel={userLocationLabel}
                  onRoutePlannerSummaryChange={setRoutePlannerSummary}
                />
              </div>
            </>
          )}
        </div>

        <Footer t={t} />
      </div>

      <BackToTop threshold={400} />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes HomeComponent={IcelandCampingWeatherApp} />
      <Analytics />
      <SpeedInsights />
    </BrowserRouter>
  );
}
