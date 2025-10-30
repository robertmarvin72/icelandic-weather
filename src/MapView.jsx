import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, CircleMarker } from "react-leaflet";
import L from "leaflet";

// ───────────────────────────────────────────────
// Match the same scoring as App.jsx
const SCORE_BY_CLASS = { Best: 10, Good: 8, Ok: 5, Fair: 2, Bad: 0 };
const CLASS_ORDER = ["Best", "Good", "Ok", "Fair", "Bad"];

function windCapRank(wind) {
  if (wind == null) return 4;
  if (wind >= 22) return 4;
  if (wind >= 18) return 3;
  if (wind >= 14) return 2;
  if (wind >= 10) return 1;
  return 0;
}
function baseClassRank({ tmax, rain }) {
  const temp = tmax ?? -999;
  const prcp = rain ?? 99;
  if (prcp <= 0.5 && temp >= 12) return 0;
  if (prcp <= 2 && temp >= 8)   return 1;
  if (prcp <= 5 && temp >= 5)   return 2;
  if (prcp <= 10 || temp >= 2)  return 3;
  return 4;
}
function classifyDay({ tmax, windMax, rain }) {
  const base = baseClassRank({ tmax, rain });
  const wcap = windCapRank(windMax);
  const finalRank = Math.max(base, wcap);
  return CLASS_ORDER[finalRank];
}

// color scale for weekly score
function colorForScore(score) {
  if (score >= 60) return "#22c55e"; // green
  if (score >= 45) return "#84cc16"; // green-yellow
  if (score >= 30) return "#facc15"; // yellow
  if (score >= 15) return "#f97316"; // orange
  return "#ef4444";                  // red
}

// distance helper
function haversine(lat1, lon1, lat2, lon2) {
  const toRad = (x) => (x * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

// Fetch 7-day forecast and compute weekly score
async function fetchForecastAndScore({ lat, lon }) {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    timezone: "Atlantic/Reykjavik",
    temperature_unit: "celsius",
    wind_speed_unit: "ms",
    precipitation_unit: "mm",
    forecast_days: "7",
    daily: [
      "temperature_2m_max",
      "temperature_2m_min",
      "precipitation_sum",
      "wind_speed_10m_max",
      "weathercode",
    ].join(","),
  });

  const url = `https://api.open-meteo.com/v1/forecast?${params.toString()}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Forecast failed: ${res.status}`);
  const data = await res.json();

  if (!data?.daily?.time) return { score: 0, rows: [] };

  const rows = data.daily.time.map((t, i) => {
    const r = {
      date: t,
      tmax: data.daily.temperature_2m_max?.[i],
      rain: data.daily.precipitation_sum?.[i],
      windMax: data.daily.wind_speed_10m_max?.[i],
    };
    const cls = classifyDay(r);
    return { ...r, class: cls, points: SCORE_BY_CLASS[cls] ?? 0 };
  });

  const score = rows.reduce((sum, r) => sum + r.points, 0);
  return { score, rows };
}

// Smooth flyTo for selection
function FlyTo({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.flyTo(position, 8, { duration: 1.2 });
  }, [position]);
  return null;
}

export default function MapView({ campsites = [], selectedId, onSelect, userLocation }) {
  const list = Array.isArray(campsites) ? campsites : [];
  const [forecastById, setForecastById] = useState({});
  const [loadingById, setLoadingById] = useState({});
  const [errorById, setErrorById] = useState({});

  const icelandCenter = useMemo(() => [64.9, -18.6], []);
  const selectedSite = list.find((c) => c.id === selectedId);

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
    if (!site?.id) return;
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

  useEffect(() => {
    // pre-load (ok for ~50-100 sites). If you scale to 200+, consider lazy loading by viewport.
    list.forEach((s) => loadForecast(s));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list.length]);

  const distanceTo = (s) =>
    userLocation ? haversine(userLocation.lat, userLocation.lon, s.lat, s.lon) : null;

  return (
    <div className="rounded-2xl shadow-sm border border-slate-200 bg-white overflow-hidden h-[500px] relative">
      <MapContainer center={icelandCenter} zoom={6} style={{ width: "100%", height: "100%" }}>
        <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {selectedSite && <FlyTo position={[selectedSite.lat, selectedSite.lon]} />}

        {/* Your location marker */}
        {userLocation && (
          <CircleMarker
            center={[userLocation.lat, userLocation.lon]}
            radius={7}
            pathOptions={{ color: "#2563eb", fillColor: "#3b82f6", fillOpacity: 0.7 }}
          >
            <Popup>You are here</Popup>
          </CircleMarker>
        )}

        {list.map((site) => {
          const fdata = forecastById[site.id];
          const score = fdata?.score ?? 0;
          const color = colorForScore(score);
          const icon = site.id === selectedId ? highlightIcon : defaultIcon;
          const loading = loadingById[site.id];
          const err = errorById[site.id];
          const dist = distanceTo(site);

          return (
            <Marker
              key={site.id}
              position={[site.lat, site.lon]}
              icon={icon}
              eventHandlers={{ click: () => onSelect?.(site.id) }}
            >
              <Popup>
                <div className="text-sm">
                  <div className="font-semibold mb-1">{site.name}</div>
                  {dist != null && (
                    <div className="text-xs text-slate-500 mb-1">{dist.toFixed(1)} km from you</div>
                  )}
                  {loading && <div className="text-slate-600">Loading forecast…</div>}
                  {err && <div className="text-red-600">Error: {err}</div>}
                  {!loading && !err && (
                    <div>
                      <div className="text-slate-700">Weekly score: <b>{score}</b></div>
                      <div className="mt-1 text-xs text-slate-500">
                        Marker color: green (best) → red (worst)
                      </div>
                    </div>
                  )}
                </div>
              </Popup>

              {/* Colored halo under the pin */}
              <CircleMarker
                center={[site.lat, site.lon]}
                radius={10}
                pathOptions={{ color, fillColor: color, fillOpacity: 0.6, weight: 0 }}
              />
            </Marker>
          );
        })}
      </MapContainer>

      {selectedSite && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-white/80 backdrop-blur-sm px-4 py-1 rounded-full shadow text-sm font-medium text-slate-700">
          📍 {selectedSite.name}
        </div>
      )}
    </div>
  );
}
