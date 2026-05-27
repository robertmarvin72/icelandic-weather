import React from "react";
import InstallPWA from "./InstallPWA";
import CampsitePicker from "./CampsitePicker";
import DevProToggle from "./DevProToggle";
import { getSeasonForDate } from "../lib/scoring";
import { trackEvent } from "../lib/analytics";

/**
 * Toolbar
 * - Campsite selector
 * - My location button
 * - Install PWA button
 * - Units toggle
 * - Theme toggle
 *
 * Pure UI component: no localStorage, no side effects.
 */
export default function Toolbar({
  t,
  lang,
  onToggleLanguage,
  siteList,
  siteId,
  onSelectSite,
  onUseMyLocation,
  units,
  onToggleUnits,
  darkMode,
  onToggleTheme,

  // NEW: dev pro toggle plumbing
  devPro,
  onToggleDevPro,
}) {
  const season = getSeasonForDate(new Date());

  function scrollToComparison() {
    document.getElementById("comparison-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
    trackEvent("homepage_hero_cta_click");
  }

  return (
    <header className="relative z-30 mb-3 md:mb-6">
      {/* Row 1: Hero copy (left) + campsite selector (right) */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        {/* Hero copy */}
        <div className="max-w-xl">
          <h1 className="text-2xl md:text-3xl font-black tracking-tight leading-tight">
            {t?.("heroStayMoveTitle")}
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 max-w-md leading-relaxed">
            {t?.("heroStayMoveSubtitle")}
          </p>

          <button
            type="button"
            onClick={scrollToComparison}
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-emerald-700 active:bg-emerald-800 transition-colors"
          >
            {t?.("heroCta") ?? "Finna betri stað"} →
          </button>

          {season === "winter" && (
            <div className="mt-3 space-y-1">
              <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                <span>{t("weatherNearbyHint")}</span>
                <span className="cursor-pointer" title={t("weatherNearbyTooltip")}>ⓘ</span>
              </div>
              <div
                title={t("winterModeTooltip")}
                className="inline-flex items-center gap-1 text-xs font-medium text-sky-300 dark:text-sky-400"
              >
                <span>❄</span>
                <span>{t("winterModeActive")}</span>
              </div>
            </div>
          )}
        </div>

        {/* Primary selector */}
        <div className="relative z-30 flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200/80 bg-white/70 px-3 py-2.5 shadow-sm backdrop-blur-sm dark:border-slate-700/80 dark:bg-slate-900/70 self-start">
          <label htmlFor="site" className="sr-only">Campsite</label>
          <CampsitePicker siteList={siteList} siteId={siteId} onSelectSite={onSelectSite} t={t} />
          <button
            onClick={onUseMyLocation}
            className="px-3 py-2 rounded-xl border border-slate-300 bg-white shadow-sm focus-ring smooth text-slate-900 dark:bg-slate-900 dark:border-slate-600 dark:text-slate-100 inline-flex items-center gap-2 text-sm whitespace-nowrap"
            aria-label="Use my current location"
            title="Use my current location"
          >
            <span>📍</span>
            <span>{t?.("myLocation")}</span>
          </button>
        </div>
      </div>

      {/* Row 2: Utility controls — visually quieter, smaller */}
      <div className="mt-2 flex flex-wrap items-center gap-1.5 justify-end">
        <InstallPWA />

        <button
          type="button"
          onClick={onToggleUnits}
          className="px-2 py-1 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition-colors"
          aria-label={units === "metric" ? "Switch to imperial units" : "Switch to metric units"}
          title={units === "metric" ? "Metric units: °C, mm, m/s" : "Imperial units: °F, in, knots"}
        >
          {units === "metric" ? "°C" : "°F"}
        </button>

        <button
          type="button"
          onClick={onToggleLanguage}
          className="px-2 py-1 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition-colors"
          title={t?.("toolbar.toggleLanguage") ?? "Toggle language"}
        >
          🌐 {lang === "is" ? "EN" : "IS"}
        </button>

        <button
          type="button"
          onClick={onToggleTheme}
          className="px-2 py-1 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition-colors"
          aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
          title="Toggle dark mode"
        >
          {darkMode ? "🌙" : "☀️"}
        </button>

        {import.meta.env.DEV && <DevProToggle devPro={devPro} onToggleDevPro={onToggleDevPro} />}
      </div>
    </header>
  );
}
