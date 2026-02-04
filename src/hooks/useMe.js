// src/hooks/useMe.js
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * useMe
 * - Fetches session/user/subscription state from /api/me (cookie-based).
 * - Returns a stable shape so the UI can gate features without guessing.
 */
export function useMe() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const abortRef = useRef(null);

  const fetchMe = useCallback(async () => {
    // Cancel any in-flight request
    try {
      abortRef.current?.abort?.();
    } catch {
      // ignore
    }

    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/me", {
        method: "GET",
        credentials: "include",
        headers: { Accept: "application/json" },
        signal: controller.signal,
      });

      const json = await res.json().catch(() => null);

      // Normalize to a stable shape even if the server misbehaves
      const normalized = {
        ok: !!json?.ok,
        user: json?.user ?? null,
        subscription: json?.subscription ?? null,
        entitlements: {
          pro: !!json?.entitlements?.pro,
          proUntil: json?.entitlements?.proUntil ?? null,
        },
      };

      setData(normalized);
      return normalized;
    } catch (e) {
      if (e?.name === "AbortError") return null;
      setError(e);
      setData({
        ok: false,
        user: null,
        subscription: null,
        entitlements: { pro: false, proUntil: null },
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMe();
    return () => {
      try {
        abortRef.current?.abort?.();
      } catch {
        // ignore
      }
    };
  }, [fetchMe]);

  return {
    me: data,
    loadingMe: loading,
    meError: error,
    refreshMe: fetchMe,
  };
}
