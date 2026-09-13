// src/components/WeatherVoiceShareDialog.jsx
//
// Ticket 410 (#410) — compact, accessible secondary share preview/dialog.
// Sharing never becomes the primary card content: this is a separate
// overlay, opened only by the card's own "Deila Tjaldi"/"Share Tjaldur"
// button, never rendered inline in the card body.
//
// Lifecycle: the PNG is prepared as soon as this dialog mounts (one
// render per snapshot — a NEW snapshot means a fresh mount, since the
// parent unmounts/remounts this component whenever the episode is
// invalidated; see WeatherVoiceCard.jsx). An AbortController cancels
// in-flight rendering on unmount, so a late image promise can never
// resolve into a stale/replaced preview. `navigator.share` is invoked
// ONLY from the explicit "Share" button's own click handler, using the
// ALREADY-prepared File — never awaiting new rendering work inside that
// click, so the click's own transient user-activation is preserved.
//
// Focus: HourlyForecastModal.jsx (the only prior dialog in this codebase)
// provides role="dialog"/Escape/scroll-lock but NO focus trap or restore-
// on-close — both are genuinely new implementation here, not reused from
// an existing pattern.
import React, { useEffect, useRef, useState, useCallback } from "react";
import { renderWeatherVoiceShareImage } from "../lib/weatherVoiceShareImage";
import { getTjaldurMoodAssetPath } from "../lib/weatherVoicePresentation";
import { trackEvent } from "../lib/analytics";

const SURFACE_HOMEPAGE_DECISION = "homepage_decision";
const FOCUSABLE_SELECTOR = 'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

function brandingAssetPathFor(lang) {
  return lang === "is" ? "/eltumvedrid-light-is.png" : "/chasetheweather-light-en.png";
}

function emitShareClicked(snapshot, method) {
  try {
    trackEvent("weather_voice_share_clicked", {
      voice_id: snapshot.voiceId,
      language: snapshot.language,
      severity: snapshot.severity,
      weather_type: snapshot.condition,
      surface: SURFACE_HOMEPAGE_DECISION,
      share_method: method,
    });
  } catch {
    // Isolated: an analytics failure must never break sharing itself.
  }
}

export default function WeatherVoiceShareDialog({ snapshot, lang, t, onClose }) {
  const dialogRef = useRef(null);
  const previouslyFocusedRef = useRef(null);
  // Ticket 410 Revision 2 (#410, Ripley Round 1 finding #4) — a
  // SYNCHRONOUS ref guard, not React state. `busyMethod` state alone is
  // insufficient: two rapid invocations within the same script tick both
  // read the same pre-update `busyMethod` closure value (React batches
  // the state update), so a purely-synchronous handler (download) could
  // run twice before either render reflects the first click. The ref is
  // mutated immediately and checked first, and its release is BOUNDED to
  // the next microtask (not the same synchronous tick) specifically for
  // the download path, so a genuine rapid repeat click is suppressed
  // while a later, deliberate retry (after that tick) still works.
  const attemptInFlightRef = useRef(false);

  const [imageState, setImageState] = useState("generating"); // "generating" | "ready" | "error"
  const [file, setFile] = useState(null);
  const [objectUrl, setObjectUrl] = useState(null);
  const [canShareFile, setCanShareFile] = useState(false);
  const [busyMethod, setBusyMethod] = useState(null); // "native" | "download" | null
  const [shareNotice, setShareNotice] = useState(null); // "cancelled" | "share_error" | null

  // ── Image generation, cancelled on unmount (episode invalidation is
  // handled by the parent unmounting/remounting this whole component). ──
  useEffect(() => {
    const controller = new AbortController();
    setImageState("generating");
    setFile(null);
    setCanShareFile(false);

    renderWeatherVoiceShareImage(snapshot, {
      t,
      moodAssetPath: getTjaldurMoodAssetPath(snapshot.mood),
      brandingAssetPath: brandingAssetPathFor(snapshot.language),
      signal: controller.signal,
    })
      .then((blob) => {
        if (controller.signal.aborted) return;
        const generatedFile = new File([blob], `tjaldur-${snapshot.voiceId}.png`, { type: "image/png" });
        setFile(generatedFile);
        setObjectUrl(URL.createObjectURL(generatedFile));
        setImageState("ready");
        try {
          // Ripley Round 1 finding #4: BOTH navigator.share AND
          // navigator.canShare must exist — a browser can implement
          // canShare() without share() (or vice versa is meaningless),
          // and checking canShare alone previously let the button appear
          // in a browser that could not actually invoke sharing at all.
          setCanShareFile(
            typeof navigator !== "undefined" &&
              typeof navigator.share === "function" &&
              typeof navigator.canShare === "function" &&
              navigator.canShare({ files: [generatedFile] })
          );
        } catch {
          setCanShareFile(false);
        }
      })
      .catch((err) => {
        if (controller.signal.aborted || err?.name === "AbortError") return;
        setImageState("error");
      });

    return () => controller.abort();
    // Re-runs only if a genuinely different snapshot object is passed —
    // the parent guarantees a stable snapshot reference per open episode.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snapshot]);

  // Revoke the object URL on replacement/unmount, after consumers (the
  // preview <img>, a completed download) have had time to use it.
  useEffect(() => {
    if (!objectUrl) return undefined;
    return () => URL.revokeObjectURL(objectUrl);
  }, [objectUrl]);

  // ── Focus trap + restoration (new implementation — see file header) ──
  useEffect(() => {
    previouslyFocusedRef.current = typeof document !== "undefined" ? document.activeElement : null;
    const node = dialogRef.current;
    const focusable = node ? Array.from(node.querySelectorAll(FOCUSABLE_SELECTOR)) : [];
    (focusable[0] || node)?.focus?.();

    function onKeyDown(e) {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose?.();
        return;
      }
      if (e.key !== "Tab" || !node) return;
      const items = Array.from(node.querySelectorAll(FOCUSABLE_SELECTOR)).filter((el) => !el.disabled);
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown, true);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      document.body.style.overflow = prevOverflow;
      // Restore focus to the trigger if it's still a real, attached
      // element; otherwise fall back to the document body rather than
      // leaving focus on a detached node or throwing.
      const target = previouslyFocusedRef.current;
      if (target && typeof target.focus === "function" && document.contains(target)) {
        target.focus();
      } else if (document.body) {
        document.body.focus?.();
      }
    };
  }, [onClose]);

  const handleDownload = useCallback(() => {
    if (attemptInFlightRef.current || !file || !objectUrl) return;
    attemptInFlightRef.current = true;
    setBusyMethod("download");
    emitShareClicked(snapshot, "download");
    try {
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch {
      // Handle download exceptions without an uncaught error or a
      // completion claim — the save action itself simply failed; the
      // still-visible preview and (if supported) native button remain
      // available for the user to try again.
      setShareNotice("share_error");
    } finally {
      // Bounded release on the NEXT microtask, not the same synchronous
      // tick as the click itself — this is what actually suppresses a
      // genuinely rapid repeat click (two invocations arriving before
      // this tick resolves both see attemptInFlightRef.current === true),
      // while any later, deliberate click is a legitimate new attempt.
      Promise.resolve().then(() => {
        attemptInFlightRef.current = false;
        setBusyMethod(null);
      });
    }
  }, [file, objectUrl, snapshot]);

  const handleNativeShare = useCallback(async () => {
    if (attemptInFlightRef.current || !file) return;
    attemptInFlightRef.current = true;
    setBusyMethod("native");
    setShareNotice(null);
    emitShareClicked(snapshot, "native");
    try {
      // No await happens before this call within this handler — the file
      // was already prepared while the preview was open, preserving this
      // click's own transient user activation.
      await navigator.share({ files: [file], title: "Eltum Veðrið", text: "eltumvedrid.is" });
    } catch (err) {
      if (err?.name === "AbortError") {
        setShareNotice("cancelled"); // user cancellation — never a scary error or a completion claim
      } else {
        setShareNotice("share_error"); // save-image fallback remains available below
      }
    } finally {
      attemptInFlightRef.current = false;
      setBusyMethod(null);
    }
  }, [file, snapshot]);

  const title = t?.("weatherVoiceShareDialogTitle") || (lang === "is" ? "Deila Tjaldi" : "Share Tjaldur");

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-[2px] p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={dialogRef}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        // Ticket 410 Revision 2 (#410, Ripley Round 1 finding #4): bounded
        // to the viewport height with its own internal scrolling — a
        // short/landscape viewport (mobile landscape especially) could
        // otherwise leave the action buttons unreachable while the body's
        // own scroll stays locked. No layout redesign, just a height cap
        // and overflow so every control stays reachable by touch/keyboard.
        className="max-h-[90vh] w-full max-w-sm overflow-y-auto rounded-2xl border border-amber-200/70 bg-white p-5 shadow-xl outline-none dark:border-amber-900/40 dark:bg-slate-900"
      >
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            {t?.("close") || (lang === "is" ? "Loka" : "Close")}
          </button>
        </div>

        <div className="mt-3 flex items-center justify-center overflow-hidden rounded-xl bg-amber-50 dark:bg-amber-950/20" style={{ aspectRatio: "1 / 1" }}>
          {imageState === "generating" && (
            <p className="px-4 text-center text-sm text-slate-600 dark:text-slate-300" role="status" aria-live="polite">
              {t?.("weatherVoiceShareGenerating") || (lang === "is" ? "Undirbý mynd…" : "Preparing image…")}
            </p>
          )}
          {imageState === "error" && (
            <p className="px-4 text-center text-sm text-red-600 dark:text-red-400" role="alert">
              {t?.("weatherVoiceShareError") || (lang === "is" ? "Ekki tókst að útbúa mynd." : "Couldn't prepare the image.")}
            </p>
          )}
          {imageState === "ready" && objectUrl && (
            <img
              src={objectUrl}
              alt={t?.("weatherVoiceShareImageAlt") || (lang === "is" ? "Forskoðun myndar til að deila" : "Share image preview")}
              className="h-full w-full object-contain"
            />
          )}
        </div>

        {shareNotice === "cancelled" && (
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400" role="status">
            {t?.("weatherVoiceShareCancelled") || (lang === "is" ? "Deiling hætt við." : "Sharing cancelled.")}
          </p>
        )}
        {shareNotice === "share_error" && (
          <p className="mt-2 text-xs text-amber-700 dark:text-amber-400" role="status">
            {t?.("weatherVoiceShareUnavailable") ||
              (lang === "is" ? "Ekki tókst að deila beint — hægt er að vista myndina í staðinn." : "Direct sharing didn't work — you can still save the image.")}
          </p>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          {canShareFile && (
            <button
              type="button"
              onClick={handleNativeShare}
              disabled={imageState !== "ready" || !!busyMethod}
              className="inline-flex items-center rounded-full bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
            >
              {t?.("weatherVoiceShareNative") || (lang === "is" ? "Deila" : "Share")}
            </button>
          )}
          <button
            type="button"
            onClick={handleDownload}
            disabled={imageState !== "ready" || !!busyMethod}
            className="inline-flex items-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-900 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 disabled:opacity-50 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-600"
          >
            {t?.("weatherVoiceShareSave") || (lang === "is" ? "Vista mynd" : "Save image")}
          </button>
        </div>
      </div>
    </div>
  );
}
