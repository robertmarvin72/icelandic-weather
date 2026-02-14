// src/hooks/usePwaUpdateToast.js
import { useEffect, useRef } from "react";

/**
 * Shows a toast when a new SW is available.
 * Guards against infinite reload loops via a session flag.
 */
export function usePwaUpdateToast({
  needRefresh,
  updateServiceWorker,
  pushToast,
  dismissToast,
  t,
}) {
  const shownRef = useRef(false);
  const toastIdRef = useRef(null);

  useEffect(() => {
    if (!needRefresh) return;
    if (shownRef.current) return;

    // Prevent loops if something keeps triggering onNeedRefresh
    const alreadyReloaded = sessionStorage.getItem("cc_sw_reloaded") === "1";

    shownRef.current = true;

    const title = t?.("updateAvailableTitle") ?? "Update available";
    const msg =
      t?.("updateAvailableMsg") ??
      "A new version is ready. Refresh to get the latest improvements.";

    const refreshLabel = t?.("refreshNow") ?? "Refresh now";
    const laterLabel = t?.("later") ?? "Later";

    const id = pushToast({
      type: "info",
      title,
      message: msg,
      // If your ToastHub supports actions, use them:
      actions: [
        {
          label: refreshLabel,
          primary: true,
          onClick: async () => {
            try {
              // Mark that we initiated a reload
              sessionStorage.setItem("cc_sw_reloaded", "1");

              // Activate waiting SW then reload
              await updateServiceWorker?.(true);
              window.location.reload();
            } catch {
              // fallback
              window.location.reload();
            }
          },
          disabled: alreadyReloaded, // if already reloaded this session, don't spam
        },
        {
          label: laterLabel,
          onClick: () => {
            if (toastIdRef.current) dismissToast?.(toastIdRef.current);
          },
        },
      ],
      // Optional: don't auto-dismiss so user can decide
      persist: true,
    });

    toastIdRef.current = id ?? null;
  }, [needRefresh, updateServiceWorker, pushToast, dismissToast, t]);
}
