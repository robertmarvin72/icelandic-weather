/**
 * CampCast — App.jsx
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BrowserRouter, Route, Routes, useNavigate } from "react-router-dom";

import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";

// ✅ PWA update detection
import { registerSW } from "virtual:pwa-register";
import { usePwaUpdateToast } from "./hooks/usePwaUpdateToast";

import BackToTop from "./components/BackToTop";
import Footer from "./components/Footer";
import ForecastTable from "./components/ForecastTable";
import LazyMap from "./components/LazyMap";
import PageHeader from "./components/PageHeader";
import Splash from "./components/Splash";
import Top5Leaderboard from "./components/Top5Leaderboard";
import ToastHub from "./components/ToastHub";
import { useToast } from "./hooks/useToast";

import { useCampsites } from "./hooks/useCampsites";

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
import { useMe } from "./hooks/useMe";

import NotFound from "./pages/NotFound";
import About from "./pages/About";

import { formatDay } from "./utils/date";
import { WEATHER_MAP } from "./utils/weatherMap";
import { isFeatureAvailable } from "./config/features";
import SlimHeader from "./components/SlimHeader";

import Subscribe from "./pages/Subscribe";
import Success from "./pages/Success";
import Pricing from "./pages/Pricing";

// ──────────────────────────────────────────────────────────────
// App page
// ──────────────────────────────────────────────────────────────
function IcelandCampingWeatherApp({ page = "home" }) {
  const [units, setUnits] = useLocalStorageState("units", "metric");
  const [theme, setTheme] = useLocalStorageState("theme", "light");
  const darkMode = theme === "dark";
  const mapAnchorRef = useRef(null);

  const { lang, toggleLanguage } = useLanguage();
  const t = useT(lang);

  const { toasts, pushToast, dismissToast } = useToast();

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

  // ✅ Campsites now come from server (real Free vs Pro gating)
  const {
    campsites: siteList,
    loading: campsitesLoading,
    error: campsitesError,
  } = useCampsites({
    reloadKey: entitlements.isPro,
  });

  // ✅ Gate flag (NO early returns — avoids Rules of Hooks errors)
  const showCampsitesGate = campsitesLoading || campsitesError || !siteList?.length;

  const [siteId, setSiteId] = useLocalStorageState("lastSite", null);

  const navigate = useNavigate();

  // ──────────────────────────────────────────────────────────────
  // ✅ PWA update toast (onNeedRefresh)
  // ──────────────────────────────────────────────────────────────
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

  // Optional: offline-ready toast (nice UX)
  useEffect(() => {
    if (!offlineReady) return;

    pushToast({
      type: "success",
      title: t?.("offlineReadyTitle") ?? "Ready for offline",
      message: t?.("offlineReadyMsg") ?? "CampCast is cached and can work offline.",
    });

    setOfflineReady(false);
  }, [offlineReady, pushToast, t]);

  // ──────────────────────────────────────────────────────────────
  // Login modal state (email-based)
  // ──────────────────────────────────────────────────────────────
  const [loginOpen, setLoginOpen] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginBusy, setLoginBusy] = useState(false);

  const openLoginModal = useCallback(() => {
    setLoginEmail(me?.user?.email || "");
    setLoginOpen(true);
  }, [me]);

  const closeLoginModal = useCallback(() => {
    if (loginBusy) return;
    setLoginOpen(false);
  }, [loginBusy]);

  const submitLogin = useCallback(
    async (e) => {
      e?.preventDefault?.();

      const email = String(loginEmail || "").trim();
      if (!email || !email.includes("@")) {
        pushToast({
          type: "error",
          title: t?.("login") ?? "Login",
          message: t?.("invalidEmail") ?? "Please enter a valid email.",
        });
        return;
      }

      setLoginBusy(true);
      try {
        const r = await fetch("/api/login-email", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });

        const data = await r.json().catch(() => null);

        if (!r.ok || !data?.ok) {
          if (data?.code === "USER_NOT_FOUND") {
            navigate(`/pricing?email=${encodeURIComponent(email)}`);
            setLoginOpen(false);
            return;
          }

          const msg = data?.error || `Login failed (${r.status})`;
          pushToast({ type: "error", title: t?.("login") ?? "Login", message: msg });
          return;
        }

        await refetchMe();

        pushToast({
          type: "success",
          title: t?.("login") ?? "Login",
          message: t?.("loggedIn") ?? "You're logged in.",
        });

        setLoginOpen(false);
        navigate(`/pricing?email=${encodeURIComponent(email)}`);
      } catch (err) {
        pushToast({
          type: "error",
          title: t?.("login") ?? "Login",
          message: String(err?.message || err),
        });
      } finally {
        setLoginBusy(false);
      }
    },
    [loginEmail, pushToast, refetchMe, t, navigate]
  );

  // ──────────────────────────────────────────────────────────────
  // UI handlers
  // ──────────────────────────────────────────────────────────────
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

  // GEO (use empty list during gate)
  const { userLoc, geoMsg, useMyLocation } = useMyLocationNearestSite(
    showCampsitesGate ? [] : siteList,
    handleSelectSite,
    t
  );
  const distanceTo = useDistanceTo(userLoc);

  // LEADERBOARD (use empty list during gate)
  const { scoresById, loadingWave1, loadingBg } = useLeaderboardScores(
    showCampsitesGate ? [] : siteList,
    siteId,
    userLoc
  );
  const { top5 } = useTop5Campsites(showCampsitesGate ? [] : siteList, scoresById, userLoc);

  // Effects
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

  // FORECAST (null during gate)
  const site = showCampsitesGate ? null : siteList.find((s) => s.id === siteId) || siteList[0];
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

  // ✅ Checkout: if not logged in -> open login modal first
  const startCheckout = useCallback(async () => {
    if (!me?.user) {
      pushToast({
        type: "info",
        title: t?.("loginRequired") ?? "Login required",
        message: t?.("pleaseLoginToContinue") ?? "Please log in to continue.",
      });
      openLoginModal();
      return;
    }

    if (me?.entitlements?.pro) {
      pushToast({
        type: "success",
        title: t?.("proActive") ?? "Pro",
        message: t?.("alreadyPro") ?? "You already have Pro 👌",
      });
      return;
    }

    navigate(`/pricing?email=${encodeURIComponent(me?.user?.email || "")}`);
  }, [me, navigate, openLoginModal, pushToast, t]);

  // ✅ Paddle billing portal (customer portal)
  const openBillingPortal = useCallback(async () => {
    if (!me?.user) {
      openLoginModal();
      return;
    }

    try {
      pushToast({
        type: "info",
        title: t?.("billingPortal") ?? "Billing",
        message: t?.("openingBillingPortal") ?? "Opening billing portal…",
      });

      const r = await fetch("/api/billing-portal", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });

      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j?.ok || !j?.url) {
        const msg =
          j?.error ||
          (j?.code === "MISSING_PADDLE_CUSTOMER"
            ? (t?.("billingPortalUnavailable") ?? "Billing portal not ready for this account yet.")
            : `Billing portal failed (${r.status})`);
        throw new Error(msg);
      }

      window.location.assign(j.url);
    } catch (err) {
      pushToast({
        type: "error",
        title: t?.("billingPortal") ?? "Billing",
        message: String(err?.message || err),
      });
    }
  }, [me, openLoginModal, pushToast, t]);

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

      {/* ✅ Simple login modal */}
      {loginOpen && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4"
          role="dialog"
          aria-modal="true"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeLoginModal();
          }}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-xl p-4
                 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="text-base font-semibold">{t?.("login") ?? "Login"}</div>

              <button
                type="button"
                onClick={closeLoginModal}
                disabled={loginBusy}
                className="rounded-lg px-2 py-1 text-sm border border-slate-300 text-slate-700 hover:bg-slate-50
                     dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
                aria-label="Close"
                title="Close"
              >
                ✕
              </button>
            </div>

            <div className="text-sm text-slate-600 mb-3 dark:text-slate-300">
              {t?.("enterEmailToContinue") ?? "Enter your email to continue."}
            </div>

            <form onSubmit={submitLogin} className="grid gap-3">
              <input
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900
                     placeholder:text-slate-400
                     focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-400
                     dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-400
                     dark:focus:ring-sky-400/30 dark:focus:border-sky-400"
                autoFocus
              />

              <button
                type="submit"
                disabled={loginBusy}
                className={`rounded-xl px-4 py-2 text-sm font-semibold
                      bg-slate-900 text-white hover:opacity-100
                      dark:bg-white dark:text-slate-900
                      ${loginBusy ? "opacity-60 cursor-not-allowed" : "opacity-95"}`}
              >
                {loginBusy ? (t?.("loading") ?? "Loading…") : (t?.("continue") ?? "Continue")}
              </button>
            </form>

            <div className="mt-3 text-xs text-slate-500 dark:text-slate-300">
              {t?.("noPasswordNeeded") ?? "No password. Because life is hard enough already."}
            </div>
          </div>
        </div>
      )}

      <div className="min-h-screen font-sans bg-soft-grid text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        {page === "about" ? (
          <SlimHeader t={t} />
        ) : (
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
        )}

        <div className="max-w-6xl mx-auto px-4 py-10">
          {page === "about" ? (
            <About t={t} />
          ) : showCampsitesGate ? (
            <div className="min-h-[50vh] flex items-center justify-center p-6">
              <div className="max-w-md text-center">
                <div className="text-base font-semibold mb-2">
                  {campsitesLoading ? "Loading campsites…" : "Couldn’t load campsites"}
                </div>

                {!campsitesLoading && (
                  <div className="text-sm opacity-80 mb-4">
                    {String(campsitesError?.message || "Unknown error")}
                  </div>
                )}

                {!campsitesLoading && (
                  <button
                    type="button"
                    onClick={() => window.location.reload()}
                    className="rounded-xl px-4 py-2 text-sm font-semibold bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                  >
                    Reload
                  </button>
                )}
              </div>
            </div>
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
                      lang={lang}
                      t={t}
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
                me={me}
                onUpgrade={startCheckout}
                t={t}
                shelter={gatedShelter}
                windDir={gatedWindDir}
                proUntil={me?.entitlements?.proUntil ?? null}
                subscription={me?.subscription ?? null}
                onManageSubscription={openBillingPortal}
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

// --- Route wrappers so Subscribe/Success can receive lang/theme/t via props ---
function PricingRoute() {
  const [theme] = useLocalStorageState("theme", "light");
  const { lang } = useLanguage();
  const t = useT(lang);
  return <Pricing lang={lang} theme={theme} t={t} />;
}

function SubscribeRoute() {
  const [theme] = useLocalStorageState("theme", "light");
  const { lang } = useLanguage();
  const t = useT(lang);
  return <Subscribe lang={lang} theme={theme} t={t} />;
}

function SuccessRoute() {
  const [theme] = useLocalStorageState("theme", "light");
  const { lang } = useLanguage();
  const t = useT(lang);
  return <Success lang={lang} theme={theme} t={t} />;
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

        {/* ✅ These pages need lang/theme/t, so use wrappers */}
        <Route path="/pricing" element={<PricingRoute />} />
        <Route path="/subscribe" element={<SubscribeRoute />} />
        <Route path="/success" element={<SuccessRoute />} />

        <Route path="*" element={<NotFound />} />
      </Routes>

      <Analytics />
      <SpeedInsights />
    </BrowserRouter>
  );
}
