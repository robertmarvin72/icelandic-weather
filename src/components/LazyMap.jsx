import React, { useEffect, useRef, useState, lazy, Suspense } from "react";

const MapView = lazy(() => import("../MapView"));

/**
 * LazyMap
 * - Prefetches MapView chunk shortly after initial render
 * - Mounts MapView only when container is near viewport (IntersectionObserver)
 */
export default function LazyMap({ campsites, selectedId, onSelect, userLocation, lang, t }) {
  const mapRef = useRef(null);
  const [mapInView, setMapInView] = useState(false);

  // Prefetch MapView chunk after initial render
  useEffect(() => {
    const timer = setTimeout(() => {
      import("../MapView");
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // Mount map only when container is near viewport
  useEffect(() => {
    if (!mapRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting) {
          setMapInView(true);
          observer.disconnect();
        }
      },
      { root: null, rootMargin: "200px", threshold: 0.1 }
    );

    observer.observe(mapRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={mapRef}>
      {mapInView && (
        <Suspense
          fallback={
            <div className="p-6 text-center text-slate-600 dark:text-slate-300 text-sm">
              Loading map…
            </div>
          }
        >
          <MapView
            campsites={campsites}
            selectedId={selectedId}
            onSelect={onSelect}
            userLocation={userLocation}
            lang={lang}
            t={t}
          />
        </Suspense>
      )}
    </div>
  );
}
