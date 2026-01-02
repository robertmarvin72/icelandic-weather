import { useEffect, useState } from "react";

/**
 * Props:
 *  - show: boolean   → true = visible; false = fade out & unmount
 *  - minMs?: number  → optional minimum time to show (default 600ms)
 *  - fadeMs?: number → fade-out duration (default 500ms)
 */
export default function Splash({ show, minMs = 600, fadeMs = 500 }) {
  const [visible, setVisible] = useState(true); // whether the DOM is mounted
  const [ready, setReady] = useState(false);   // min display time satisfied
  const [isDark, setIsDark] = useState(() =>
    typeof document !== "undefined"
      ? document.documentElement.classList.contains("dark")
      : false
  );

  // Minimum display time
  useEffect(() => {
    const t = setTimeout(() => setReady(true), minMs);
    return () => clearTimeout(t);
  }, [minMs]);

  // Fade-out + unmount
  useEffect(() => {
    if (!show && ready) {
      const t = setTimeout(() => setVisible(false), fadeMs);
      return () => clearTimeout(t);
    }
  }, [show, ready, fadeMs]);

  // Watch <html class="dark"> so splash logo swaps correctly
  useEffect(() => {
    if (typeof document === "undefined") return;

    const el = document.documentElement;

    const sync = () => setIsDark(el.classList.contains("dark"));
    sync();

    const observer = new MutationObserver(sync);
    observer.observe(el, { attributes: true, attributeFilter: ["class"] });

    return () => observer.disconnect();
  }, []);

  if (!visible) return null;

  const logoSrc = isDark ? "/campcast-dark.png" : "/campcast-light.png";

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center z-[9999] transition-opacity
                 bg-white text-slate-700 dark:bg-slate-950 dark:text-slate-200"
      style={{
        opacity: !show && ready ? 0 : 1,
        transitionDuration: `${fadeMs}ms`,
      }}
    >
      <img
        src={logoSrc}
        alt="CampCast"
        className="h-12 w-auto mb-3 animate-bounce-slow"
        loading="eager"
        decoding="async"
      />
      <p className="font-medium tracking-tight">
        Fetching forecasts…
      </p>
    </div>
  );
}
