// src/hooks/useCampsites.js
import { useCallback, useEffect, useRef, useState } from "react";

export function useCampsites({ reloadKey } = {}) {
  const [campsites, setCampsites] = useState([]);
  const [tier, setTier] = useState("free");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Only the most recent load may write state, so a slow earlier response
  // (for example a Pro list that lands after a Free reload) is ignored.
  const requestIdRef = useRef(0);

  const load = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);
    try {
      const r = await fetch("/api/campsites", { credentials: "include" });
      const j = await r.json().catch(() => null);
      if (requestId !== requestIdRef.current) return;
      if (!r.ok || !j?.ok) {
        throw new Error(j?.error || `Failed to load campsites (${r.status})`);
      }
      setCampsites(Array.isArray(j.campsites) ? j.campsites : []);
      setTier(j.tier || "free");
    } catch (e) {
      if (requestId !== requestIdRef.current) return;
      setError(e);
      setCampsites([]);
      setTier("free");
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, reloadKey]);

  useEffect(() => {
    return () => {
      requestIdRef.current += 1;
    };
  }, []);

  return { campsites, tier, loading, error, reload: load };
}
