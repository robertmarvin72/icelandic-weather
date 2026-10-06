// src/hooks/useLogout.js
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * useLogout
 * - POSTs /api/logout (cookie-based). Resolves true only when the server
 *   answered 2xx with ok:true; that includes the "revoke may have failed"
 *   note, which still means the browser cookie was cleared.
 * - On success calls resetMe so the UI drops to the anonymous state without a
 *   refetch. On failure shows a translated toast and resolves false so the
 *   caller keeps the signed-in state and the user can retry.
 * - A ref guards against overlapping requests (state alone is too slow for
 *   double clicks). Toasts and state updates are skipped after unmount.
 */
export function useLogout({ resetMe, pushToast, t }) {
  const [loggingOut, setLoggingOut] = useState(false);
  const inFlightRef = useRef(false);
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const logout = useCallback(async () => {
    if (inFlightRef.current) return false;
    inFlightRef.current = true;
    setLoggingOut(true);

    try {
      const res = await fetch("/api/logout", {
        method: "POST",
        credentials: "include",
        headers: { Accept: "application/json" },
      });
      const json = await res.json().catch(() => null);

      if (!res.ok || json?.ok !== true) {
        throw new Error("logout_failed");
      }

      resetMe?.();
      return true;
    } catch {
      if (mountedRef.current) {
        pushToast?.({
          type: "error",
          title: t?.("logoutLabel") ?? "Log out",
          message: t?.("logoutFailed") ?? "Could not log out. Please try again.",
        });
      }
      return false;
    } finally {
      inFlightRef.current = false;
      if (mountedRef.current) setLoggingOut(false);
    }
  }, [resetMe, pushToast, t]);

  return { logout, loggingOut };
}
