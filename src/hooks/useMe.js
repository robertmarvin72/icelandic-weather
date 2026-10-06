// src/hooks/useMe.js
import { useCallback, useEffect, useRef, useState } from "react";

const ANONYMOUS_ME = {
  ok: true,
  user: null,
  subscription: null,
  entitlements: { pro: false, proUntil: null },
};

/**
 * useMe
 * - Fetches session/user/subscription state from /api/me (cookie-based).
 * - Returns a stable shape so the UI can gate features without guessing.
 * - resetMe clears local state without a fetch (used after logout). Any
 *   response still in flight from before the reset is discarded.
 */
export function useMe() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const abortRef = useRef(null);
  const epochRef = useRef(0);

  const fetchMe = useCallback(async () => {
    // Cancel any in-flight request
    try {
      abortRef.current?.abort?.();
    } catch {
      // ignore
    }

    const controller = new AbortController();
    abortRef.current = controller;
    const epoch = epochRef.current;

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
      if (epoch !== epochRef.current) return null;

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
      if (epoch !== epochRef.current) return null;
      setError(e);
      setData({
        ok: false,
        user: null,
        subscription: null,
        entitlements: { pro: false, proUntil: null },
      });
      return null;
    } finally {
      if (epoch === epochRef.current) setLoading(false);
    }
  }, []);

  const resetMe = useCallback(() => {
    epochRef.current += 1;
    try {
      abortRef.current?.abort?.();
    } catch {
      // ignore
    }
    setData({ ...ANONYMOUS_ME, entitlements: { ...ANONYMOUS_ME.entitlements } });
    setLoading(false);
    setError(null);
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
    // Prefer `refetchMe` in the app; keep `refreshMe` for backwards compatibility.
    refetchMe: fetchMe,
    refreshMe: fetchMe,
    resetMe,
  };
}
