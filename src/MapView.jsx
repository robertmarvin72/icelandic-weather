// src/MapView.jsx
import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, useMap } from "react-leaflet";
import L from "leaflet";
import { getForecast } from "./lib/forecastCache";
import MarkerClusterGroup from "react-leaflet-cluster";
import { scoreSiteDay } from "./lib/scoring";
import { normalizeDailyToScoreInput } from "./lib/forecastNormalize";

// ───────────────────────────────────────────────
// Color mapping by average score
function colorForScore(score) {
  if (score >= 6) return "#22c55e"; // green
  if (score >= 3) return "#facc15"; // yellow
  return "#ef4444"; // red
}

function labelForScore(score, t) {
  if (score >= 6) return typeof t === "function" ? t("mapConditionGood") : "Good";
  if (score >= 4) return typeof t === "function" ? t("mapConditionFair") : "Fair";
  return typeof t === "function" ? t("mapConditionRough") : "Rough";
}

// ───────────────────────────────────────────────
// Fetch forecast and compute weekly score — uses the same pipeline as ForecastTable
async function fetchForecastAndScore({ lat, lon }) {
  const data = await getForecast({ lat, lon }); // cached
  if (!data?.daily?.time) return { score: 0, rows: [] };
  if (!Array.isArray(data?.daily?.time)) return { score: 0, rows: [] };

  const baseRows = normalizeDailyToScoreInput(data.daily, data.hourly);

  const rows = baseRows.map((r) => {
    const s = scoreSiteDay(r);
    return { ...r, class: s.finalClass, points: s.points, season: s.season };
  });

  const score = rows.reduce((sum, r) => sum + (r.points ?? 0), 0);
  return { score, rows };
}

// ───────────────────────────────────────────────
// Helper for smooth flyTo
function FlyTo({ position }) {
  const map = useMap();

  useEffect(() => {
    if (position) map.flyTo(position, 8, { duration: 1.2 });
  }, [position, map]);

  return null;
}

// ───────────────────────────────────────────────
// Custom pin icon with colored dot
function scorePinIcon(color, isSelected = false) {
  const width = isSelected ? 30 : 24;
  const height = isSelected ? 42 : 34;
  const outline = isSelected ? 4 : 3;

  return L.divIcon({
    className: "",
    iconSize: [width + 10, height + 10],
    iconAnchor: [(width + 10) / 2, height + 8],
    popupAnchor: [0, -height],
    html: `
      <div style="
        position: relative;
        width: ${width + 10}px;
        height: ${height + 10}px;
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          position: relative;
          width: ${width}px;
          height: ${height}px;
          background: ${color};
          border: ${outline}px solid rgba(255,255,255,0.95);
          border-radius: ${width}px ${width}px ${width}px 0;
          transform: rotate(-45deg);
          box-shadow: 0 4px 10px rgba(0,0,0,0.28);
        ">
          <div style="
            position: absolute;
            top: 50%;
            left: 50%;
            width: ${isSelected ? 10 : 8}px;
            height: ${isSelected ? 10 : 8}px;
            background: rgba(255,255,255,0.95);
            border-radius: 999px;
            transform: translate(-50%, -50%) rotate(45deg);
          "></div>
        </div>
      </div>
    `,
  });
}

// ───────────────────────────────────────────────
// Main map component
export default function MapView({
  campsites,
  selectedId,
  onSelect,
  userLocation,
  lang = "en",
  t,
  theme = "light",
}) {
  const [forecastById, setForecastById] = useState({});
  const [loadingById, setLoadingById] = useState({});
  const [errorById, setErrorById] = useState({});
  const [mapReady, setMapReady] = useState(false);
  const [mapFailed, setMapFailed] = useState(false);
  const [tileLoaded, setTileLoaded] = useState(false);
  const [tileErrorCount, setTileErrorCount] = useState(0);
  const [showWeatherOverlay, setShowWeatherOverlay] = useState(true);

  useEffect(() => {
    if (mapFailed) return;

    const timeoutMs = 5000;
    const timer = setTimeout(() => {
      if (!mapReady || (!tileLoaded && tileErrorCount > 0)) {
        setMapFailed(true);
      }
    }, timeoutMs);

    return () => clearTimeout(timer);
  }, [mapReady, tileLoaded, tileErrorCount, mapFailed]);

  // Preload a first batch so overlay is useful immediately
  useEffect(() => {
    const initialSites = campsites.slice(0, 120);
    initialSites.forEach((site) => {
      if (!forecastById[site.id] && !loadingById[site.id]) {
        loadForecast(site);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campsites]);

  const isDark = theme === "dark";

  const tileUrl = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
  const tileAttribution = "&copy; OpenStreetMap";

  const iconCreateFunction = (cluster) => {
    const markers = cluster.getAllChildMarkers();

    let sum = 0;
    let n = 0;

    for (const m of markers) {
      const id = m?.options?.siteId;
      const s = forecastById[id]?.score;
      if (typeof s === "number") {
        sum += s;
        n += 1;
      }
    }

    const avg = n ? sum / n : null;
    const overlayColor = avg != null ? colorForScore(avg) : "#94a3b8";
    const color = showWeatherOverlay ? overlayColor : "#3b82f6";

    const count = cluster.getChildCount();
    const size = count < 10 ? 34 : count < 50 ? 40 : count < 100 ? 46 : 52;

    return L.divIcon({
      html: `
        <div style="
          width:${size}px;height:${size}px;
          border-radius:999px;
          background:${color};
          display:flex;align-items:center;justify-content:center;
          color:#0b1220;
          font-weight:800;
          font-size:${Math.max(12, Math.min(16, size / 3))}px;
          box-shadow: 0 6px 14px rgba(0,0,0,.25);
          border: 3px solid rgba(255,255,255,.95);
        ">
          ${count}
        </div>
      `,
      className: "",
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    });
  };

  const selectedSite = campsites.find((c) => c.id === selectedId);

  async function loadForecast(site) {
    if (loadingById[site.id] || forecastById[site.id]) return;

    setLoadingById((s) => ({ ...s, [site.id]: true }));

    try {
      const data = await fetchForecastAndScore({ lat: site.lat, lon: site.lon });
      setForecastById((s) => ({ ...s, [site.id]: data }));
    } catch (e) {
      setErrorById((s) => ({ ...s, [site.id]: String(e?.message || e) }));
    } finally {
      setLoadingById((s) => ({ ...s, [site.id]: false }));
    }
  }

  return (
    <div
      className={`relative z-0 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden h-[500px] ${
        isDark ? "map-dark-mode" : ""
      }`}
    >
      <MapContainer
        center={[64.9, -18.6]}
        zoom={6}
        style={{ width: "100%", height: "100%" }}
        whenReady={() => setMapReady(true)}
      >
        <TileLayer
          attribution={tileAttribution}
          url={tileUrl}
          eventHandlers={{
            tileload: () => {
              setTileLoaded(true);
              if (mapFailed) setMapFailed(false);
            },
            tileerror: () => {
              setTileErrorCount((n) => n + 1);
            },
          }}
        />

        {selectedSite && <FlyTo position={[selectedSite.lat, selectedSite.lon]} />}

        {userLocation && (
          <CircleMarker
            center={[userLocation.lat, userLocation.lon]}
            radius={7}
            pathOptions={{ color: "#2563eb", fillColor: "#3b82f6", fillOpacity: 0.7 }}
          >
            <Popup>{typeof t === "function" ? t("mapYouAreHere") : "You are here"}</Popup>
          </CircleMarker>
        )}

        <MarkerClusterGroup
          chunkedLoading
          showCoverageOnHover={false}
          maxClusterRadius={50}
          iconCreateFunction={iconCreateFunction}
        >
          {campsites.map((site) => {
            const fdata = forecastById[site.id];
            const hasScore = fdata != null && typeof fdata.score === "number";
            const score = fdata?.score ?? 0;
            const overlayColor = hasScore ? colorForScore(score) : "#94a3b8"; // gray = not yet loaded
            const color = showWeatherOverlay ? overlayColor : "#3b82f6";
            const scoreLabel = hasScore ? labelForScore(score, t) : "…";

            const isSelected = site.id === selectedId;
            const icon = scorePinIcon(color, isSelected);

            const loading = loadingById[site.id];
            const err = errorById[site.id];
            const season = fdata?.rows?.[0]?.season ?? null;

            return (
              <Marker
                key={site.id}
                position={[site.lat, site.lon]}
                icon={icon}
                siteId={site.id}
                eventHandlers={{
                  click: async () => {
                    onSelect?.(site.id);
                    if (!forecastById[site.id] && !loadingById[site.id]) {
                      await loadForecast(site);
                    }
                  },
                }}
              >
                <Popup>
                  <div className="text-sm">
                    <div className="font-semibold mb-1">{site.name}</div>

                    {loading && (
                      <div className="text-slate-600">
                        {typeof t === "function" ? t("mapLoadingForecast") : "Loading forecast…"}
                      </div>
                    )}
                    {err && (
                      <div className="text-red-600">
                        {typeof t === "function" ? t("mapErrorPrefix") : "Error:"} {err}
                      </div>
                    )}

                    {!loading && !err && (
                      <div>
                        <div className="text-slate-700">
                          {typeof t === "function" ? t("mapWeeklyScore") : "Weekly score"}:{" "}
                          <b>{score}</b>
                        </div>

                        {season === "winter" ? (
                          <div className="mt-1 text-xs text-slate-500">
                            ❄️ {typeof t === "function" ? t("mapWinterMode") : "Winter mode"}
                          </div>
                        ) : null}

                        <div className="mt-1 text-xs text-slate-500">
                          {typeof t === "function" ? t("mapCondition") : "Condition"}:{" "}
                          <b>{scoreLabel}</b>
                          <div className="text-xs text-slate-500 mt-1">
                            {typeof t === "function"
                              ? t("mapBasedOnNext7Days")
                              : "Based on next 7 days combined"}
                          </div>
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          {showWeatherOverlay
                            ? typeof t === "function"
                              ? t("mapOverlayOn")
                              : "Weather colors are on"
                            : typeof t === "function"
                              ? t("mapOverlayHint")
                              : "Turn on weather colors to color-code campsites"}
                        </div>
                      </div>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MarkerClusterGroup>
      </MapContainer>

      {mapFailed && (
        <div className="absolute inset-0 z-[500] flex items-center justify-center bg-slate-100/90 px-4 text-center dark:bg-slate-900/90">
          <div>
            <div className="text-sm font-medium text-slate-700 dark:text-slate-200">
              {typeof t === "function" ? t("mapLoadFailedTitle") : "Unable to load map."}
            </div>
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {typeof t === "function"
                ? t("mapLoadFailedText")
                : "Please refresh the page or check your connection."}
            </div>
          </div>
        </div>
      )}

      {selectedSite && !mapFailed && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-white/80 backdrop-blur-sm px-4 py-1 rounded-full shadow text-sm font-medium text-slate-700">
          📍 {selectedSite.name}
        </div>
      )}

      {!mapFailed && (
        <button
          type="button"
          onClick={() => setShowWeatherOverlay((v) => !v)}
          className="absolute right-3 top-3 z-[500] rounded-full border border-slate-200 bg-white/90 px-3 py-2 text-xs font-semibold text-slate-700 shadow backdrop-blur-sm hover:bg-white"
        >
          {showWeatherOverlay
            ? typeof t === "function"
              ? t("mapHideWeatherColors")
              : "Hide weather colors"
            : typeof t === "function"
              ? t("mapShowWeatherColors")
              : "Show weather colors"}
        </button>
      )}

      {showWeatherOverlay && !mapFailed && (
        <div className="absolute bottom-3 right-3 z-[500] rounded-2xl border border-slate-200 bg-white/90 px-3 py-3 text-xs text-slate-700 shadow backdrop-blur-sm">
          <div className="mb-2 font-semibold">
            {typeof t === "function" ? t("mapWeatherConditions") : "Weather conditions"}
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block h-3 w-3 rounded-full bg-[#22c55e]" />
            <span>{typeof t === "function" ? t("mapConditionGood") : "Good"}</span>
          </div>
          <div className="mt-1 flex items-center gap-2">
            <span className="inline-block h-3 w-3 rounded-full bg-[#facc15]" />
            <span>{typeof t === "function" ? t("mapConditionFair") : "Fair"}</span>
          </div>
          <div className="mt-1 flex items-center gap-2">
            <span className="inline-block h-3 w-3 rounded-full bg-[#ef4444]" />
            <span>{typeof t === "function" ? t("mapConditionRough") : "Rough"}</span>
          </div>
        </div>
      )}
    </div>
  );
}
