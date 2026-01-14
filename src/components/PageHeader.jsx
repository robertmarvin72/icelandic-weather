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
  siteList,
  siteId,
  onSelectSite,
  onUseMyLocation,
  units,
  onToggleUnits,
  darkMode,
  onToggleTheme,
  geoMsg,
}) {
  return (
    <>
      <Header />

      <div className="max-w-6xl mx-auto px-4 py-10">
        <Toolbar
          siteList={siteList}
          siteId={siteId}
          onSelectSite={onSelectSite}
          onUseMyLocation={onUseMyLocation}
          units={units}
          onToggleUnits={onToggleUnits}
          darkMode={darkMode}
          onToggleTheme={onToggleTheme}
        />

        {geoMsg && (
          <div className="mb-4 text-sm text-slate-700 dark:text-slate-300">📍 {geoMsg}</div>
        )}
      </div>
    </>
  );
}
