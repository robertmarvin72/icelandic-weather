import React, { useEffect, useRef, useState, lazy, Suspense } from "react";

// Mirrors LazyMap.jsx's existing prefetch + IntersectionObserver pattern
// exactly (approved prompt §6: "reuse existing Leaflet patterns") — a
// second, Pro-only, secondary map fed by the SAME ranked Ticket 3 locations
// (best + alternatives), never an independent selection/order.
const MapView = lazy(() => import("../MapView"));

export default function NorthernLightsMap({ locations, selectedId, onSelect, lang, t, theme }) {
  const mapRef = useRef(null);
  const [mapInView, setMapInView] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      import("../MapView");
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setMapInView(true);
          observer.disconnect();
        }
      },
      { root: null, rootMargin: "200px", threshold: 0.1 },
    );
    observer.observe(mapRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={mapRef} data-testid="nl-map-container">
      {mapInView && (
        <Suspense
          fallback={
            <div className="p-4 text-center text-xs text-slate-600 dark:text-slate-300">
              {t("nlMapLoading")}
            </div>
          }
        >
          <MapView campsites={locations} selectedId={selectedId} onSelect={onSelect} userLocation={null} lang={lang} t={t} theme={theme} />
        </Suspense>
      )}
    </div>
  );
}
