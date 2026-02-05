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
import { useMe } from "./hooks/useMe";

import NotFound from "./pages/NotFound";
import About from "./pages/About";

import { formatDay } from "./utils/date";
import { WEATHER_MAP } from "./utils/weatherMap";
import { isFeatureAvailable } from "./config/features";
import SlimHeader from "./components/SlimHeader";
import Subscribe from "./pages/Subscribe";

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
        const r = await fetch("/api/login", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, createIfMissing: false }),
        });

        const data = await r.json().catch(() => null);

        if (!r.ok || !data?.ok) {
          if (data?.code === "USER_NOT_FOUND") {
            // Send them to the purchase/subscribe page (don’t auto-create users on login)
            const url = new URL(window.location.href);
            const to = `/subscribe?email=${encodeURIComponent(email)}`;
            window.location.assign(to);
            return;
          }

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
  // Subscribe (purchase) page state
  // ──────────────────────────────────────────────────────────────
  const [subscribeEmail, setSubscribeEmail] = useState("");

  useEffect(() => {
    if (page !== "subscribe") return;
    const qs = new URLSearchParams(window.location.search);
    const e = (qs.get("email") || "").trim();
    setSubscribeEmail(e);
  }, [page]);

  const continueFromSubscribe = useCallback(async () => {
    const email = String(subscribeEmail || "").trim();
    if (!me?.user && (!email || !email.includes("@"))) {
      pushToast({
        type: "error",
        title: "Pro",
        message: t?.("invalidEmail") ?? "Please enter a valid email.",
      });
      return;
    }

    try {
      // If not logged in, create user + session (explicitly).
      if (!me?.user) {
        const r = await fetch("/api/login", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, createIfMissing: true }),
        });

        const data = await r.json().catch(() => null);
        if (!r.ok || !data?.ok) {
          const msg = data?.error || `Login failed (${r.status})`;
          pushToast({ type: "error", title: t?.("login") ?? "Login", message: msg });
          return;
        }
      }

      await refetchMe();

      // Then go to checkout
      const cr = await fetch("/api/checkout", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });

      const cd = await cr.json().catch(() => null);
      if (!cr.ok || !cd?.ok || !cd?.url) {
        const msg = cd?.error || `Checkout failed (${cr.status})`;
        pushToast({ type: "error", title: "Checkout", message: msg });
        return;
      }

      window.location.assign(cd.url);
    } catch (e) {
      pushToast({ type: "error", title: "Checkout", message: String(e?.message || e) });
    }
  }, [me, pushToast, refetchMe, subscribeEmail, t, page]);

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

      {/* ✅ Simple login modal (better dark-mode contrast) */}
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
          ) : page === "subscribe" ? (
            <div className="max-w-2xl mx-auto">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                <h1 className="text-xl font-bold mb-2">{t?.("goPro") ?? "Go Pro"}</h1>
                <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
                  {t?.("proPitch") ??
                    "Unlock wind direction, shelter index, and future Pro features."}
                </p>

                {!me?.user && (
                  <div className="mb-4">
                    <label className="block text-sm font-semibold mb-1">
                      {t?.("email") ?? "Email"}
                    </label>
                    <input
                      type="email"
                      value={subscribeEmail}
                      onChange={(e) => setSubscribeEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900
                        placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-400
                        dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-400"
                    />
                    <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {t?.("emailUsedForReceipt") ??
                        "Used for your receipt and to link your Pro access."}
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    onClick={() => window.location.assign("/")}
                    className="rounded-xl px-4 py-2 text-sm font-semibold border border-slate-300 hover:bg-slate-50
                      dark:border-slate-600 dark:hover:bg-slate-800"
                  >
                    {t?.("back") ?? "Back"}
                  </button>

                  <button
                    type="button"
                    onClick={continueFromSubscribe}
                    className="rounded-xl px-4 py-2 text-sm font-semibold bg-slate-900 text-white hover:opacity-95
                      dark:bg-white dark:text-slate-900"
                  >
                    {t?.("continueToCheckout") ?? "Continue to secure checkout"}
                  </button>
                </div>

                <div className="mt-4 text-xs text-slate-500 dark:text-slate-400">
                  {t?.("poweredByPaddle") ?? "Payments are handled securely by Paddle."}
                </div>
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
// Router
// ──────────────────────────────────────────────────────────────
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<IcelandCampingWeatherApp />} />
        <Route path="/about" element={<IcelandCampingWeatherApp page="about" />} />
        <Route path="/subscribe" element={<Subscribe />} />
        <Route path="*" element={<NotFound />} />
      </Routes>

      <Analytics />
      <SpeedInsights />
    </BrowserRouter>
  );
}
