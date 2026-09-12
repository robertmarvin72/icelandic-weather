// src/hooks/useWeatherVoice.js
//
// Ticket 408 (#408) — data/lifecycle layer for the homepage Weather Voice
// integration. Owns: today's-row resolution (Atlantic/Reykjavik), the
// Phase 1 engine call, the stable per-mount history adapter, episode-keyed
// client-side selection (Phase 2), and explicit visible-exposure
// recording. Never fetches or normalizes forecast data itself — reads
// only what useForecast.js already produced — and never renders anything
// (src/components/WeatherVoice.jsx is the pure renderer).

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { evaluateWeatherVoice } from "../lib/weatherVoiceEngine";
import { getWeatherVoiceLibrary, devWarnEmptyEligiblePool } from "../lib/weatherVoiceContent";
import { selectWeatherVoiceComment } from "../lib/weatherVoiceSelector";
import { createWeatherVoiceHistory } from "../lib/weatherVoiceHistory";
import { resolveWeatherVoiceCta } from "../lib/weatherVoicePresentation";

const SURFACE_HOMEPAGE_DECISION = "homepage_decision";
const MIDNIGHT_POLL_MS = 60000;

/**
 * getReykjavikDateString(epochMs) -> "YYYY-MM-DD"
 * The calendar date in Atlantic/Reykjavik for the given instant — never
 * the browser's local timezone or UTC-by-assumption.
 * @param {number} epochMs
 * @returns {string}
 */
export function getReykjavikDateString(epochMs) {
  // "en-CA" formats as YYYY-MM-DD directly, matching normalized rows'
  // `date` field shape exactly — no separate parsing/reformatting needed.
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Atlantic/Reykjavik" }).format(new Date(epochMs));
}

/**
 * findTodayRow(rows, dateString) -> row | null
 * The exact matching row for `dateString`, or null. Never rows[0], never
 * a substitute (e.g. tomorrow) when today's row is missing.
 * @param {Array<Object>} rows
 * @param {string} dateString
 * @returns {Object | null}
 */
export function findTodayRow(rows, dateString) {
  if (!Array.isArray(rows) || typeof dateString !== "string" || dateString.length === 0) return null;
  return rows.find((r) => r?.date === dateString) ?? null;
}

/**
 * buildWeatherVoiceEpisodeKey({ surface, siteId, dateString, lang, engineResult })
 * -> string | null
 * Stable string key identifying one "episode": the same site, day,
 * language, and Phase 1 outcome. Built from primitive VALUES only (never
 * object identity), so object-identity-only row/result rebuilds with the
 * same underlying values never change the key. `null` whenever there's no
 * genuinely active engine result to key.
 */
export function buildWeatherVoiceEpisodeKey({ surface, siteId, dateString, lang, engineResult }) {
  if (!engineResult?.show) return null;
  if (siteId == null || !dateString || !lang) return null;
  return [surface, siteId, dateString, lang, engineResult.condition, engineResult.mood, engineResult.severity].join("|");
}

/**
 * useWeatherVoice(args) -> { presentation, action, episodeKey, onVisible }
 *
 * `episodeKey` identifies the current episode (site/date/language/Phase-1-
 * outcome) and must be passed through to WeatherVoiceCard's `episodeKey`
 * prop — it's what lets a real exposure observation be bound to the
 * specific episode it was actually watching, not just "whatever happens
 * to be current when the callback fires" (see `onVisible` below).
 *
 * @param {{
 *   enabled: boolean,
 *   site: { id: string|number, lat: number, lon: number } | null,
 *   rows: Array<Object>,
 *   requestedFor: { lat: number, lon: number } | null,
 *   loading: boolean,
 *   error: unknown,
 *   lang: string,
 *   t: Function,
 *   onExplore?: Function,
 *   now?: () => number,
 *   rng?: () => number,
 *   storage?: { getItem: Function, setItem: Function },
 * }} args
 */
export function useWeatherVoice({
  enabled = false,
  site = null,
  rows = [],
  requestedFor = null,
  loading = false,
  error = null,
  lang,
  t,
  onExplore,
  now = Date.now,
  rng = Math.random,
  storage,
} = {}) {
  // Stable for the mounted session — never recreated on rerender, never
  // touches localStorage at creation (createWeatherVoiceHistory only
  // touches storage when its own methods are called).
  const historyRef = useRef(null);
  if (!historyRef.current) {
    historyRef.current = createWeatherVoiceHistory(storage ? { storage } : undefined);
  }

  const [todayDate, setTodayDate] = useState(() => getReykjavikDateString(now()));

  useEffect(() => {
    if (!enabled) return undefined;
    const id = setInterval(() => {
      setTodayDate((prev) => {
        const next = getReykjavikDateString(now());
        return prev === next ? prev : next;
      });
    }, MIDNIGHT_POLL_MS);
    return () => clearInterval(id);
  }, [enabled, now]);

  const siteReady = enabled && site?.id != null && Number.isFinite(site?.lat) && Number.isFinite(site?.lon);
  const provenanceMatches = siteReady && requestedFor != null && requestedFor.lat === site.lat && requestedFor.lon === site.lon;
  const dataReady = siteReady && provenanceMatches && !loading && !error;

  const todayRow = useMemo(() => (dataReady ? findTodayRow(rows, todayDate) : null), [dataReady, rows, todayDate]);

  const engineResult = useMemo(() => {
    if (!todayRow) return { show: false };
    return evaluateWeatherVoice({ tmax: todayRow.tmax, windMax: todayRow.windMax, rain: todayRow.rain, code: todayRow.code });
  }, [todayRow]);

  const episodeKey = useMemo(
    () => buildWeatherVoiceEpisodeKey({ surface: SURFACE_HOMEPAGE_DECISION, siteId: site?.id, dateString: todayDate, lang, engineResult }),
    [site?.id, todayDate, lang, engineResult]
  );

  // Selection happens here (an effect — never render/useMemo), guarded so
  // a given episodeKey is only ever selected ONCE per mount, even across
  // React StrictMode's synthetic double-invoke of this same effect (the
  // ref survives that replay; the RNG/history call inside the guard does
  // not run twice).
  const selectionCacheRef = useRef({ key: null, presentation: { show: false } });
  const [resolvedKey, setResolvedKey] = useState(null);

  useEffect(() => {
    if (!episodeKey) return;
    if (selectionCacheRef.current.key !== episodeKey) {
      const library = getWeatherVoiceLibrary(lang);
      const history = historyRef.current.getHistory(now());
      const selected = selectWeatherVoiceComment({ engineResult, library, history, now: now(), rng });
      // Ticket 412 (#412): the engine wanted to show something, but this
      // language's resolved library had zero eligible entries for that
      // exact condition/mood — the approved prompt's "exceptional"
      // wholly-absent-pool case. selectWeatherVoiceComment already fails
      // closed (show:false) on its own; this only adds a bounded,
      // dev-only diagnostic on top of that already-conservative behavior
      // — the selector itself stays pure, untouched.
      if (engineResult.show && !selected.show) {
        devWarnEmptyEligiblePool(lang, engineResult.condition, engineResult.mood);
      }
      selectionCacheRef.current = { key: episodeKey, presentation: selected };
    }
    setResolvedKey(episodeKey);
  }, [episodeKey, lang, engineResult, now, rng]);

  // Synchronous, render-time derivation — never the lagging `resolvedKey`
  // state alone. The instant episodeKey changes (site/date/language/
  // outcome change, or data becomes invalid/loading), this expression
  // evaluates to {show:false} on THIS SAME render, before the selection
  // effect above has even run — so even the very first render after a
  // change cannot show (or later record) a stale episode's content.
  const presentation = episodeKey && resolvedKey === episodeKey ? selectionCacheRef.current.presentation : { show: false };

  // Exposure recording reads everything through refs (always the LATEST
  // value at call time), so `onVisible` itself can stay a stable callback
  // reference and a late/queued visibility callback can never record a
  // stale episode that has since changed.
  const recordedEpisodesRef = useRef(new Set());
  const episodeKeyRef = useRef(episodeKey);
  const resolvedKeyRef = useRef(resolvedKey);
  const presentationRef = useRef(presentation);
  episodeKeyRef.current = episodeKey;
  resolvedKeyRef.current = resolvedKey;
  presentationRef.current = presentation;

  // Revision 3 (#408, Ripley Revision 2 REVISE) — `onVisible` now REQUIRES
  // the caller (WeatherVoiceCard's observer) to report WHICH episode it
  // actually observed, captured at the observer's own creation time. A
  // bare "something became visible" signal is not evidence that TODAY's
  // episode was seen — a still-connected observer that never restarted
  // (e.g. because two different site/day episodes happened to select the
  // same comment id) can go on firing with a stale captured identity even
  // though it's still a live, non-stale connection. Comparing the
  // reported identity against the CURRENT episode (via the same
  // always-latest refs as before) rejects that case explicitly, not by
  // coincidence of value equality.
  const onVisible = useCallback(
    (observedEpisodeKey) => {
      const key = episodeKeyRef.current;
      if (!key) return; // suppressed/invalid/hidden episode
      if (observedEpisodeKey !== key) return; // stale/mismatched episode identity
      if (resolvedKeyRef.current !== key) return; // mid-selection or stale
      const current = presentationRef.current;
      if (!current?.show) return; // selection landed on content-unavailable silence
      if (recordedEpisodesRef.current.has(key)) return; // already recorded this episode this mount
      recordedEpisodesRef.current.add(key);
      historyRef.current.recordShown(current, now());
    },
    [now]
  );

  const action = useMemo(
    () => resolveWeatherVoiceCta({ ctaType: presentation.show ? presentation.ctaType : null, t, onExplore }),
    [presentation.show, presentation.ctaType, t, onExplore]
  );

  // Revision 2 (#408, Jonesy Round 1 BLOCKED) — a nine-condition
  // "supportingText" auto-hookup was built here in an earlier pass without
  // review; it's removed. WeatherVoiceCard.jsx still accepts an optional
  // `supportingText` prop (the seam stays available for a future,
  // deliberately-reviewed content source), but this hook does not supply
  // one — production support is genuinely absent until that content is
  // authored and approved on its own terms.

  return { presentation, action, episodeKey, onVisible };
}
