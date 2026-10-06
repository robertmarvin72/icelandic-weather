import React from "react";
import Header from "./Header";
import Toolbar from "./Toolbar";

/**
 * PageHeader
 * - Renders the app header + the top toolbar controls.
 * - Optionally shows the geolocation status message under the toolbar.
 *
 * Keep this component "dumb": it receives state + handlers as props.
 */
export default function PageHeader({
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
  geoMsg,

  // NEW: dev Pro toggle plumbing
  devPro,
  onToggleDevPro,

  // Logout row plumbing (absent defaults keep anonymous/tests unchanged)
  isSignedIn = false,
  onLogout,
  loggingOut = false,
}) {
  return (
    <>
      <Header t={t} lang={lang} />

      <div className="max-w-6xl mx-auto px-4 pt-2 pb-0">
        <Toolbar
          t={t}
          lang={lang}
          onToggleLanguage={onToggleLanguage}
          siteList={siteList}
          siteId={siteId}
          onSelectSite={onSelectSite}
          onUseMyLocation={onUseMyLocation}
          units={units}
          onToggleUnits={onToggleUnits}
          darkMode={darkMode}
          onToggleTheme={onToggleTheme}
          // NEW: pass to Toolbar (where the button lives)
          devPro={devPro}
          onToggleDevPro={onToggleDevPro}
          isSignedIn={isSignedIn}
          onLogout={onLogout}
          loggingOut={loggingOut}
        />

        {geoMsg && (
          <div className="mb-2 text-sm text-slate-500 dark:text-slate-400">📍 {geoMsg}</div>
        )}
      </div>
    </>
  );
}
