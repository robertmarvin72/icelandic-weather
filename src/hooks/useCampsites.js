// src/hooks/useCampsites.js
import { useCallback, useEffect, useState } from "react";

export function useCampsites({ reloadKey } = {}) {
  const [campsites, setCampsites] = useState([]);
  const [tier, setTier] = useState("free");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch("/api/campsites", { credentials: "include" });
      const j = await r.json().catch(() => null);
      if (!r.ok || !j?.ok) {
        throw new Error(j?.error || `Failed to load campsites (${r.status})`);
      }
      setCampsites(Array.isArray(j.campsites) ? j.campsites : []);
      setTier(j.tier || "free");
    } catch (e) {
      setError(e);
      setCampsites([]);
      setTier("free");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, reloadKey]);

  return { campsites, tier, loading, error, reload: load };
}
