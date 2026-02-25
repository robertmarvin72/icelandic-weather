import { useEffect, useState, useCallback } from "react";

/**
 * InstallPWA
 * - Shows a button when `beforeinstallprompt` fires (Chrome/Edge).
 * - Hides itself when the app is already installed or on unsupported browsers.
 * - Optional: show a tiny “installed!” toast on success.
 */
export default function InstallPWA({ className = "" }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [canInstall, setCanInstall] = useState(false);

  // Hide on iOS Safari (no beforeinstallprompt) and if already standalone
  const isStandalone =
    (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) ||
    window.navigator.standalone === true;

  useEffect(() => {
    if (isStandalone) return; // already installed, don’t show

    const onBeforeInstallPrompt = (e) => {
      e.preventDefault(); // don’t let Chrome show its own mini-infobar
      setDeferredPrompt(e); // stash the event
      setCanInstall(true); // show our button
    };

    const onInstalled = () => {
      setCanInstall(false);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, [isStandalone]);

  const handleClick = useCallback(async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();

    await deferredPrompt.userChoice;
    // outcome: 'accepted' | 'dismissed'
    setDeferredPrompt(null);
    setCanInstall(false);
    // (Optional) you could toast outcome here
    // e.g., console.log(`PWA install: ${outcome}`);
  }, [deferredPrompt]);

  if (!canInstall || isStandalone) return null;

  return (
    <button
      onClick={handleClick}
      className={
        className ||
        "inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-300 " +
          "bg-white text-slate-900 shadow-sm hover:bg-slate-50 " +
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 transition " +
          "dark:bg-slate-900 dark:text-slate-100 dark:border-slate-600 dark:hover:bg-slate-800"
      }
      aria-label="Install CampCast as an app"
      title="Install CampCast on this device"
    >
      <span>📲</span>
      <span className="font-medium">Install</span>
    </button>
  );
}
