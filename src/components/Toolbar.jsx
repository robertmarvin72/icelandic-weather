import React from "react";
import InstallPWA from "./InstallPWA";
import CampsitePicker from "./CampsitePicker";
import DevProToggle from "./DevProToggle";
import { getSeasonForDate } from "../lib/scoring";

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
  return (
    <header className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <h1 className="text-2xl md:text-2xl font-black tracking-tight">{t?.("sevenDayWeather")}</h1>
        {season === "winter" && (
          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <span
              title={t("winterModeTooltip")}
              className="inline-flex items-center gap-1 text-xs font-medium text-sky-300 dark:text-sky-400"
            >
              ❄ {t("winterModeActive")}
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <label htmlFor="site" className="text-sm font-medium sr-only">
          Campsite
        </label>

        <CampsitePicker siteList={siteList} siteId={siteId} onSelectSite={onSelectSite} t={t} />

        <button
          onClick={onUseMyLocation}
          className="px-3 py-2 rounded-xl border border-slate-300 bg-white shadow-sm focus-ring smooth
                    text-slate-900 dark:bg-slate-900 dark:border-slate-600 dark:text-slate-100
                    inline-flex items-center gap-2 text-sm whitespace-nowrap"
          aria-label="Use my current location"
          title="Use my current location"
        >
          <span>📍</span>
          <span>{t?.("myLocation")}</span>
        </button>

        <InstallPWA />

        <button
          type="button"
          onClick={onToggleUnits}
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
          type="button"
          onClick={onToggleLanguage}
          className="px-3 py-2 rounded-xl border border-slate-300 bg-white shadow-sm focus-ring smooth text-sm dark:bg-slate-900 dark:border-slate-600"
          title={t?.("toolbar.toggleLanguage") ?? "Toggle language"}
        >
          🌐 {lang === "is" ? "EN" : "IS"}
        </button>

        <button
          onClick={onToggleTheme}
          className="px-3 py-2 rounded-xl border border-slate-300 bg-white shadow-sm focus-ring smooth text-sm dark:bg-slate-900 dark:border-slate-600"
          aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
          title="Toggle dark mode"
        >
          {darkMode ? "🌙 " + t?.("dark") : "☀️ " + t?.("light")}
        </button>

        {import.meta.env.DEV && <DevProToggle devPro={devPro} onToggleDevPro={onToggleDevPro} />}
      </div>
    </header>
  );
}
