import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, useMap } from "react-leaflet";
import L from "leaflet";
import { getForecast } from "./lib/forecastCache";
import MarkerClusterGroup from "react-leaflet-cluster";


// ───────────────────────────────────────────────
// New scoring logic (same as in App.jsx)
function basePointsFromTemp(tmax) {
  const temp = tmax ?? -999;
  if (temp > 14) return 10;
  if (temp >= 12) return 8;
  if (temp >= 8)  return 5;
  if (temp >= 6)  return 2;
  return 0;
}

function windPenaltyPoints(wind) {
  const w = wind ?? 0;
  if (w <= 5)  return 0;
  if (w <= 10) return 2;
  if (w <= 15) return 5;
  return 10;
}

function rainPenaltyPoints(mm) {
  const r = mm ?? 0;
  if (r < 1)  return 0;
  if (r < 4)  return 2;
  return 5;
}

function pointsToClass(points) {
  if (points >= 9) return "Best";
  if (points >= 7) return "Good";
  if (points >= 4) return "Ok";
  if (points >= 1) return "Fair";
  return "Bad";
}

function scoreDay({ tmax, rain, windMax }) {
  const base = basePointsFromTemp(tmax);
  const penalty = windPenaltyPoints(windMax) + rainPenaltyPoints(rain);
  const points = Math.max(0, Math.min(10, base - penalty));
  const finalClass = pointsToClass(points);
  return { basePts: base, penalty, points, finalClass };
}

// ───────────────────────────────────────────────
// Color mapping by average score
function colorForScore(score) {
  if (score >= 60) return "#22c55e";   // bright green
  if (score >= 45) return "#84cc16";   // green-yellow
  if (score >= 30) return "#facc15";   // yellow
  if (score >= 15) return "#f97316";   // orange
  return "#ef4444";                    // red
}

// ───────────────────────────────────────────────
// Fetch forecast and compute weekly score
async function fetchForecastAndScore({ lat, lon }) {
  const data = await getForecast({ lat, lon }); // cached
  if (!data?.daily?.time) return { score: 0, rows: [] };

  const rows = data.daily.time.map((t, i) => {
    const r = {
      date: t,
      tmax: data.daily.temperature_2m_max?.[i],
      rain: data.daily.precipitation_sum?.[i],
      windMax: data.daily.wind_speed_10m_max?.[i],
    };
    const s = scoreDay(r); // your existing scoring
    return { ...r, class: s.finalClass, points: s.points };
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
  }, [position]);
  return null;
}

// ───────────────────────────────────────────────
// Custom pin icon with colored dot
function scorePinIcon(color, isSelected = false) {
  const size = isSelected ? 44 : 34;
  const dot = isSelected ? 16 : 12;

  return L.divIcon({
    className: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size + 6],
    html: `
      <div style="
        position: relative;
        width: ${size}px;
        height: ${size}px;
        display: grid;
        place-items: center;
        transform: translateY(2px);
      ">
        <div style="
          position: absolute;
          bottom: 6px;
          width: ${dot}px;
          height: ${dot}px;
          border-radius: 999px;
          background: ${color};
          box-shadow: 0 0 0 3px rgba(255,255,255,0.9);
        "></div>
        <img
          src="https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png"
          style="
            width: ${isSelected ? 30 : 25}px;
            height: auto;
            filter: drop-shadow(0 2px 3px rgba(0,0,0,.25));
          "
        />
      </div>
    `,
  });
}
// ───────────────────────────────────────────────

// Main map component
export default function MapView({ campsites, selectedId, onSelect, userLocation }) {
  const [forecastById, setForecastById] = useState({});
  const [loadingById, setLoadingById] = useState({});
  const [errorById, setErrorById] = useState({});

  const iconCreateFunction = (cluster) => {
    const markers = cluster.getAllChildMarkers();

    // average score across markers in this cluster (0..70)
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

    const avg = n ? sum / n : 0;
    const color = colorForScore(avg);

    const count = cluster.getChildCount();
    const size =
      count < 10 ? 34 :
      count < 50 ? 40 :
      count < 100 ? 46 : 52;

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

  const defaultIcon = new L.Icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [0, -30],
  });

  const highlightIcon = new L.Icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [35, 55],
    iconAnchor: [17, 55],
    popupAnchor: [0, -40],
  });

  async function loadForecast(site) {
    if (loadingById[site.id] || forecastById[site.id]) return;
    setLoadingById((s) => ({ ...s, [site.id]: true }));
    try {
      const data = await fetchForecastAndScore({ lat: site.lat, lon: site.lon });
      setForecastById((s) => ({ ...s, [site.id]: data }));
    } catch (e) {
      setErrorById((s) => ({ ...s, [site.id]: String(e.message || e) }));
    } finally {
      setLoadingById((s) => ({ ...s, [site.id]: false }));
    }
  }



  return (
    <div className="rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden h-[500px] relative">
      <MapContainer center={[64.9, -18.6]} zoom={6} style={{ width: "100%", height: "100%" }}>
        <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {selectedSite && <FlyTo position={[selectedSite.lat, selectedSite.lon]} />}

        {/* User location marker */}
        {userLocation && (
          <CircleMarker
            center={[userLocation.lat, userLocation.lon]}
            radius={7}
            pathOptions={{ color: "#2563eb", fillColor: "#3b82f6", fillOpacity: 0.7 }}
          >
            <Popup>You are here</Popup>
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
            const score = fdata?.score ?? 0;
            const color = colorForScore(score);

            const isSelected = site.id === selectedId;
            const icon = scorePinIcon(color, isSelected);

            const loading = loadingById[site.id];
            const err = errorById[site.id];

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
                    {loading && <div className="text-slate-600">Loading forecast…</div>}
                    {err && <div className="text-red-600">Error: {err}</div>}
                    {!loading && !err && (
                      <div>
                        <div className="text-slate-700">
                          Weekly score: <b>{score}</b>
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          Color = weather score (green=best, red=worst)
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

      {selectedSite && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-white/80 backdrop-blur-sm px-4 py-1 rounded-full shadow text-sm font-medium text-slate-700">
          📍 {selectedSite.name}
        </div>
      )}
    </div>
  );
}
