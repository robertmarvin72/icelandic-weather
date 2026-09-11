import React, { useEffect, useRef } from "react";
import { getTjaldurMoodAssetPath } from "../lib/weatherVoicePresentation";

const INTERSECTION_THRESHOLD = 0.5;

// Weather Voice — pure presentational card. Never interprets weather,
// selects comment text, or touches storage/analytics — it only renders an
// already-resolved result/action and reports actual viewport visibility
// via `onVisible`. All selection/history/CTA-mapping logic lives in
// src/hooks/useWeatherVoice.js and src/lib/weatherVoicePresentation.js.
//
// A standalone card of its own — placed directly below the primary
// verdict card and above the Northern Lights module (see App.jsx), never
// inside the verdict card. Tjaldur is meant to feel like a small
// character who occasionally has something worth saying, not another
// status icon: `show:false`, an invalid `result`, or an unknown mood all
// render nothing at all — no wrapper, no reserved space, no neutral
// filler appearance.
//
// Revision 3 (#408, Ripley Revision 2 REVISE) — exposure lifecycle fix.
// Every piece of "have I fired yet / am I still the active observer"
// state (`cancelled`, `notified`, `lastEligible` below) is now a plain
// variable LOCAL to one `useEffect` invocation's closure, never a shared
// component-level ref. Each render's effect gets its own private copy;
// `disconnect()` alone does not retract an already-queued browser
// callback in every environment, so cleanup ALSO flips this effect
// instance's own `cancelled` flag, which the callback checks first —
// a stale callback from a torn-down observer can then neither notify nor
// mutate any state a live observer depends on, because it has none to
// share. `episodeKey` (identifying the specific episode this particular
// observer was created to watch, captured once at effect-creation time)
// is threaded through to `onVisible(episodeKey)` so the hook can verify
// the observation it received actually corresponds to the CURRENT
// episode — a bare "onVisible fired" signal is not by itself evidence
// that today's episode, specifically, was seen; provenance travels with
// the call, not a same-value-coincidence "must still be current" guess.
export default function WeatherVoiceCard({ result, surface, episodeKey, action = null, supportingText, t, onVisible }) {
  const nodeRef = useRef(null);

  const isActive = !!result?.show;
  const moodAssetPath = isActive ? getTjaldurMoodAssetPath(result.mood) : null;
  const canRender = isActive && !!moodAssetPath && typeof result.comment?.text === "string";
  // Falls back to the comment id only when no explicit episodeKey is
  // supplied (e.g. an isolated unit test of this component alone) — real
  // production callers (App.jsx, via useWeatherVoice) always pass the
  // hook's true episode key, which distinguishes two episodes that
  // happen to select the same comment id (different site/day, same text).
  const watchedEpisodeKey = episodeKey ?? result?.comment?.id ?? null;

  useEffect(() => {
    if (!canRender) return undefined;
    const node = nodeRef.current;
    if (!node) return undefined;
    if (typeof IntersectionObserver !== "function") return undefined;

    let cancelled = false;
    let notified = false;
    let lastEligible = false;
    const observedEpisodeKey = watchedEpisodeKey;

    function isDocumentVisible() {
      return typeof document === "undefined" || document.visibilityState === "visible";
    }

    function isEligible(entry) {
      return !!entry && !!entry.isIntersecting && (entry.intersectionRatio ?? 0) >= INTERSECTION_THRESHOLD;
    }

    function fireIfEligible() {
      if (cancelled || notified) return;
      if (!lastEligible) return;
      if (!isDocumentVisible()) return;
      notified = true;
      onVisible?.(observedEpisodeKey);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (cancelled) return;
        for (const entry of entries) {
          lastEligible = isEligible(entry);
        }
        fireIfEligible();
      },
      { threshold: INTERSECTION_THRESHOLD }
    );

    function handleVisibilityChange() {
      if (cancelled) return;
      fireIfEligible();
    }

    observer.observe(node);
    if (typeof document !== "undefined" && typeof document.addEventListener === "function") {
      document.addEventListener("visibilitychange", handleVisibilityChange);
    }

    return () => {
      cancelled = true;
      observer.disconnect();
      if (typeof document !== "undefined" && typeof document.removeEventListener === "function") {
        document.removeEventListener("visibilitychange", handleVisibilityChange);
      }
    };
  }, [canRender, watchedEpisodeKey, onVisible]);

  if (!canRender) return null;

  const label = t?.("weatherVoiceLabel") || "TJALDUR SEGIR";

  return (
    <div
      ref={nodeRef}
      data-weather-voice-surface={surface}
      className="mb-3 flex items-center gap-3 rounded-2xl border border-amber-200/70 bg-amber-50/80 px-4 py-2.5 shadow-sm dark:border-amber-900/40 dark:bg-amber-950/20"
    >
      <img
        src={moodAssetPath}
        alt=""
        aria-hidden="true"
        className="h-20 w-20 shrink-0 object-contain md:h-[100px] md:w-[100px]"
      />
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-bold uppercase tracking-wide text-amber-700 dark:text-amber-400">{label}</p>
        <p className="mt-0.5 min-w-0 break-words text-[19px] font-semibold leading-snug text-slate-900 dark:text-slate-100">
          „{result.comment.text}“
        </p>
        {supportingText && <p className="mt-1 text-sm leading-snug opacity-70">{supportingText}</p>}
        {action && (
          <button
            type="button"
            onClick={action.onClick}
            className="mt-1.5 text-xs font-semibold underline decoration-dotted underline-offset-2 opacity-75 transition-opacity hover:opacity-100"
          >
            {action.label}
          </button>
        )}
      </div>
    </div>
  );
}
