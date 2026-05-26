import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { trackPageView } from "../lib/analytics";

export default function AnalyticsTracker() {
  const location = useLocation();
  const lastTracked = useRef(null);

  useEffect(() => {
    const path = location.pathname + location.search;
    // Guard against StrictMode double-fire and duplicate navigations
    if (path === lastTracked.current) return;
    lastTracked.current = path;
    trackPageView(path);
  }, [location.pathname, location.search]);

  return null;
}
