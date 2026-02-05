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
          const msg = data?.error || `Login failed (${r.status})`;
          pushToast({ type: "error", title: t?.("login") ?? "Login", message: msg });
          return;
        }

        // session cookie should now be set
        await refetchMe();

        pushToast({
          type: "success",
          title: t?.("login") ?? "Login",
          message: t?.("loggedIn") ?? "You're logged in.",
        });

        setLoginOpen(false);
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
    [loginEmail, pushToast, refetchMe, t]
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

  // ✅ Checkout: if not logged in -> open login modal first
  const startCheckout = useCallback(async () => {
    try {
      if (!me?.user) {
        pushToast({
          type: "info",
          title: t?.("loginRequired") ?? "Login required",
          message: t?.("pleaseLoginToContinue") ?? "Please log in to continue.",
        });
        openLoginModal();
        return;
      }

      pushToast({
        type: "info",
        title: t?.("loading") ?? "Loading",
        message: t?.("redirectingToCheckout") ?? "Redirecting to checkout…",
      });

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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          onMouseDown={(e) => {
            // close on backdrop click
            if (e.target === e.currentTarget) closeLoginModal();
          }}
        >
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-base font-semibold">{t?.("login") ?? "Login"}</div>
              <button
                type="button"
                onClick={closeLoginModal}
                disabled={loginBusy}
                className="rounded-lg px-2 py-1 text-sm border border-slate-300 dark:border-slate-600"
                aria-label="Close"
                title="Close"
              >
                ✕
              </button>
            </div>

            <div className="text-sm text-slate-600 dark:text-slate-300 mb-3">
              {t?.("enterEmailToContinue") ?? "Enter your email to continue."}
            </div>

            <form onSubmit={submitLogin} className="grid gap-3">
              <input
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
                autoFocus
              />

              <button
                type="submit"
                disabled={loginBusy}
                className={`rounded-xl px-4 py-2 text-sm font-semibold
                            bg-slate-900 text-white dark:bg-white dark:text-slate-900
                            ${loginBusy ? "opacity-60 cursor-not-allowed" : "opacity-95 hover:opacity-100"}`}
              >
                {loginBusy ? (t?.("loading") ?? "Loading…") : (t?.("continue") ?? "Continue")}
              </button>
            </form>

            <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">
              {/* Smá létt grín, ekki of mikið 😄 */}
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
                onUpgrade={startCheckout}
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
