import { useEffect, useState } from "react";

/**
 * Props:
 *  - show: boolean   → true = visible; false = fade out & unmount
 *  - minMs?: number  → optional minimum time to show (default 600ms)
 *  - fadeMs?: number → fade-out duration (default 500ms)
 */
export default function Splash({ show, minMs = 600, fadeMs = 500 }) {
  const [visible, setVisible] = useState(true);   // whether the DOM is mounted
  const [fading, setFading] = useState(false);    // whether we’re in fade-out
  const [ready, setReady] = useState(false);      // min display time satisfied

  useEffect(() => {
    const t = setTimeout(() => setReady(true), minMs);
    return () => clearTimeout(t);
  }, [minMs]);

  useEffect(() => {
    if (!show && ready) {
      // trigger fade-out, then unmount after fadeMs
      setFading(true);
      const t = setTimeout(() => setVisible(false), fadeMs);
      return () => clearTimeout(t);
    }
  }, [show, ready, fadeMs]);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 flex flex-col items-center justify-center bg-white z-[9999] transition-opacity`}
      style={{ opacity: !show && ready ? 0 : 1, transitionDuration: `${fadeMs}ms` }}
    >
      <img
        src="/logo.png"
        alt="Iceland Camping Weather"
        className="h-12 w-auto mb-3 animate-bounce-slow"
      />
      <p className="text-slate-600 font-medium tracking-tight">
        Fetching forecasts…
      </p>
    </div>
  );
}
