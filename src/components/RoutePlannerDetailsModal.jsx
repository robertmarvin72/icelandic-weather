import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Car, CircleAlert, TriangleAlert } from "lucide-react";
import RouteCompareTable from "./RouteCompareTable";
import HazardSourceNote from "./HazardSourceNote";
import {
  buildVerdictRows,
  fmt,
  getDayDelta,
  getHazardBlockInfo,
  getHazardWindowNarrative,
  getOverallVerdict,
  getOverallVerdictLabel,
  getRouteRiskSummary,
  getVerdictPillClass,
  getWarningBadges,
  interpolate,
  signFmt,
} from "./routePlannerDetailsHelpers";

// Ticket #440 — same pattern as WeatherVoiceShareDialog.jsx's own focus
// trap (the only prior focus-trap precedent in this codebase): a real
// tabbable element, excluding anything explicitly removed from the tab
// order (tabindex="-1") or disabled. The content scroll region itself is
// deliberately given tabIndex={-1} so it is a valid *initial focus* target
// (via .focus()) without becoming part of this normal Tab sequence.
const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function getFocusableElements(container) {
  if (!container) return [];
  return Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR));
}

export default function RoutePlannerDetailsModal({
  open,
  onClose,
  t,
  lang,
  baseSiteLabel,
  candidate,
  windowDaysCount,
  adaptiveUsedKm,
  adaptiveMaxKm,
  escapeSuggestion,
  routeRiskData,
  showRouteRisk = false,
}) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const showAdaptiveLine =
    typeof adaptiveUsedKm === "number" &&
    typeof adaptiveMaxKm === "number" &&
    adaptiveUsedKm < adaptiveMaxKm;

  const [radiusGlow, setRadiusGlow] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (!showAdaptiveLine) return;

    setRadiusGlow(true);
    const tt = setTimeout(() => setRadiusGlow(false), 1200);
    return () => clearTimeout(tt);
  }, [open, adaptiveUsedKm, adaptiveMaxKm, showAdaptiveLine]);

  // Ticket #440 — rendered output requires `open && candidate` (see the
  // guard near the bottom of this component); every lifecycle effect below
  // keys off this SAME derived flag, never off `open` alone, so a body
  // lock/focus trap can never be set up while nothing is actually visible
  // (e.g. open=true with candidate=null).
  const isRendered = open && !!candidate;

  const titleId = useId();
  const panelRef = useRef(null);
  const contentRef = useRef(null);
  const previouslyFocusedRef = useRef(null);

  // Latest onClose, read from a ref inside the effect below — the real
  // caller (RoutePlannerCard) passes a new inline `onClose` identity on
  // every render, and this must never re-run the trap/lock effect, which
  // would re-steal focus and recapture "previously focused" as an element
  // inside the dialog.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  // Ticket #440 (J5–J8) — focus capture/initial focus/Tab containment/
  // Escape/body scroll lock, all in one effect keyed only on `isRendered`.
  // Kept as ONE effect (and ONE `window` keydown listener, matching the
  // pre-existing Escape-only listener this replaces) rather than splitting
  // trap/Escape into separate listeners, per J8's "exactly one Escape
  // listener" — the existing test expects `onClose` exactly once per
  // Escape press.
  useEffect(() => {
    if (!isRendered) return undefined;
    if (typeof document === "undefined") return undefined;

    previouslyFocusedRef.current = document.activeElement;

    // J6: initial focus lands on the scroll region itself (tabIndex={-1},
    // excluded from the normal Tab sequence by FOCUSABLE_SELECTOR) so
    // ArrowDown/PageDown/Space scroll the long content immediately, with no
    // click or extra Tab press needed first.
    contentRef.current?.focus?.({ preventScroll: true });

    const prevOverflow = document.body.style.overflow;
    const prevPaddingRight = document.body.style.paddingRight;
    const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = "hidden";
    if (scrollBarWidth > 0) {
      document.body.style.paddingRight = `${scrollBarWidth}px`;
    }

    function onKeyDown(e) {
      if (e.key === "Escape") {
        onCloseRef.current?.();
        return;
      }
      if (e.key !== "Tab") return;

      const panel = panelRef.current;
      if (!panel) return;
      // Recomputed on every keydown, not cached: the advanced disclosure
      // toggle changes which controls exist mid-session.
      const items = getFocusableElements(panel);
      if (items.length === 0) {
        e.preventDefault();
        return;
      }

      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;

      // Chromium makes a scrollable container with no focusable children
      // (the compare-table/advanced-table `overflow-x-auto` wrappers) its
      // own native Tab stop, even though it matches none of
      // FOCUSABLE_SELECTOR. Treating "not in our list" as "outside the
      // dialog" (the previous check here) hijacked Tab on those stops and
      // bounced focus back to `first`, so a keyboard user could never
      // reach controls after them (the advanced toggle, the footer Close).
      // "Outside the dialog" must instead mean genuinely outside the panel
      // element — anything the browser decided to make tabbable *inside*
      // the panel, listed or not, keeps native Tab/Shift+Tab traversal.
      if (!panel.contains(active)) {
        e.preventDefault();
        (e.shiftKey ? last : first).focus();
        return;
      }

      // Only intercept at the real edges, where unprevented native Tab
      // would escape the panel entirely; everything else (including native
      // scroll-container stops between these two) is left to the browser.
      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    }

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);

      document.body.style.overflow = prevOverflow;
      document.body.style.paddingRight = prevPaddingRight;

      // J7: restore focus to whatever had it before the dialog opened, only
      // if it is still a real, attached, focusable element — never throws,
      // and simply does nothing if the opener is gone.
      const target = previouslyFocusedRef.current;
      if (target && typeof target.focus === "function" && document.contains(target)) {
        target.focus({ preventScroll: true });
      }
    };
  }, [isRendered]);

  useEffect(() => {
    if (open) setShowAdvanced(false);
  }, [open, candidate?.siteId, candidate?.siteName]);

  const title = useMemo(() => {
    if (!candidate) return "";
    return candidate?.siteName || candidate?.name || t?.("routeDetailsTitle") || "Details";
  }, [candidate, t]);

  if (!open || !candidate) return null;
  if (typeof document === "undefined") return null;

  const deltaTotal = typeof candidate.deltaVsBase === "number" ? candidate.deltaVsBase : 0;
  const reasons = Array.isArray(candidate.reasons) ? candidate.reasons : [];

  const allDays = Array.isArray(candidate.windowDays) ? candidate.windowDays : [];
  const days = typeof windowDaysCount === "number" ? allDays.slice(0, windowDaysCount) : allDays;

  const verdictRows = buildVerdictRows(days);

  const betterCount =
    typeof candidate?.betterDays === "number"
      ? candidate.betterDays
      : verdictRows.filter((row) => row.verdict === "better").length;

  const sameCount =
    typeof candidate?.sameDays === "number"
      ? candidate.sameDays
      : verdictRows.filter((row) => row.verdict === "same").length;

  const worseCount =
    typeof candidate?.worseDays === "number"
      ? candidate.worseDays
      : verdictRows.filter((row) => row.verdict === "worse").length;

  const aggregateType = String(candidate?.aggregateType || "same");

  const { text: hazardBlockText, className: hazardBlockClass } = getHazardBlockInfo(candidate, t);
  const hazardWindowNarrative = getHazardWindowNarrative(candidate, t);

  const overallVerdict = getOverallVerdict({
    aggregateType,
    betterCount,
    worseCount,
  });

  const overallVerdictText = getOverallVerdictLabel({
    aggregateType,
    verdict: overallVerdict,
    t,
  });

  const overallVerdictClass = getVerdictPillClass({
    aggregateType,
    verdict: overallVerdict,
  });

  const routeRiskSummary =
    showRouteRisk && routeRiskData ? getRouteRiskSummary(routeRiskData, t) : null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3">
      {/* Ticket #440 (J4): a plain, non-focusable element — never a
          <button> — so it is not a tab stop and is not exposed as a second
          "Close" control to assistive tech. Click-to-close is preserved;
          the panel sits above it (z-10) so a click inside the panel always
          lands on the panel first, never on this backdrop. */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        // Ticket #440 (J2): `max-h-[85vh]` is the baseline; `max-h-[85dvh]!`
        // is the progressive enhancement, forced to `!important` because
        // Tailwind v4 emits utilities in its own internal order (here,
        // alphabetically — `dvh` before `vh`), NOT the order these two
        // classes are written in this string, so the later-in-source `vh`
        // rule would otherwise win the cascade even in browsers that do
        // support `dvh`. `!important` makes the dvh rule win whenever a
        // browser can parse it; a browser that can't simply drops that
        // whole (invalid) declaration and falls back to the plain `vh`
        // rule. Verified directly in the built dist/ CSS, not assumed.
        className="relative z-10 flex w-full max-w-3xl max-h-[85vh] max-h-[85dvh]! flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-950"
      >
        <div className="flex shrink-0 items-start justify-between gap-3 p-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div id={titleId} className="text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</div>

            {showAdaptiveLine ? (
              <div
                className={`
                  mt-2 inline-flex items-center gap-2
                  rounded-lg px-2.5 py-1
                  text-xs font-semibold
                  transition-all duration-300 ease-out
                  ${
                    radiusGlow
                      ? `
                        text-emerald-800 dark:text-emerald-200
                        bg-emerald-100/90 dark:bg-emerald-900/45
                        ring-2 ring-emerald-400/80 dark:ring-emerald-300/60
                        shadow-[0_0_22px_rgba(16,185,129,0.65)]
                        animate-pulse
                      `
                      : `
                        text-slate-600 dark:text-slate-300
                        bg-slate-100/70 dark:bg-slate-900/40
                        ring-1 ring-slate-200 dark:ring-slate-800
                      `
                  }
                `}
              >
                <span>{t?.("routeAdaptiveUsedShort") || "Used radius"}:</span>
                <span className="tabular-nums">
                  {adaptiveUsedKm} / {adaptiveMaxKm} km
                </span>
              </div>
            ) : null}

            <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              {t?.("routeDetailsComparedTo") || "Borið saman við"}:{" "}
              <span className="font-medium">
                {baseSiteLabel || t?.("routeBase") || "Grunnstaður"}
              </span>
              {" • "}
              {t?.("routeDetailsDelta") || "Mismunur"}:{" "}
              <span className="font-semibold">{signFmt(deltaTotal, 1)}</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-900"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        <div
          ref={contentRef}
          tabIndex={-1}
          data-testid="route-details-scroll-region"
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 outline-none [-webkit-overflow-scrolling:touch]"
        >
          <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
            <div className="text-sm text-slate-600 dark:text-slate-300 mb-2">
              {t?.("routeOverallResult") || "Heildarniðurstaða næstu daga"}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <span
                className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-semibold ${overallVerdictClass}`}
              >
                {overallVerdictText}
              </span>

              <span className="text-sm text-slate-700 dark:text-slate-200">
                ({t?.("routeOverallNextNDays") || "næstu"} {days.length}{" "}
                {t?.("routeOverallDays") || "daga"})
              </span>
            </div>

            <div className="mt-2 text-sm text-slate-700 dark:text-slate-200">
              {t?.("routeOverallTotalDelta") || "Heildarmismunur"}:{" "}
              <span className="font-semibold">{signFmt(deltaTotal, 1)}</span>{" "}
              <span className="text-slate-500 dark:text-slate-400">
                ({t?.("routeOverallSeeBreakdown") || "sjá sundurliðun"})
              </span>
            </div>

            {typeof candidate?.requiredDelta === "number" ? (
              <div className="mt-2 text-xs text-slate-600 dark:text-slate-300">
                {t?.("routeDetailsRequiredDelta") || "Lágmarksbæting miðað við fjarlægð"}:{" "}
                <span className="font-semibold">{candidate.requiredDelta.toFixed(1)}</span>
              </div>
            ) : null}

            {candidate?.hazardImproved && !candidate?.hazardBlocked ? (
              <div className="mt-2 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                {t?.("routeDetailsHazardImproved") || "Minni veðuráhætta á þessum stað"}
              </div>
            ) : null}

            {hazardBlockText ? (
              <div className={`mt-2 text-xs font-medium ${hazardBlockClass}`}>
                {hazardBlockText}
              </div>
            ) : null}

            {!hazardBlockText && hazardWindowNarrative ? (
              <div className="mt-2 text-xs text-slate-700 dark:text-slate-300">
                {hazardWindowNarrative}
              </div>
            ) : null}

            {escapeSuggestion ? (
              <div className="mt-2 rounded-lg border border-emerald-200 bg-emerald-50/70 px-3 py-2 dark:border-emerald-800/50 dark:bg-emerald-900/20">
                <div className="text-xs font-semibold text-emerald-800 dark:text-emerald-200">
                  {escapeSuggestion.title}
                </div>

                {escapeSuggestion?.baseWindow?.hasWindow ? (
                  <div className="mt-1 text-xs text-emerald-700 dark:text-emerald-300">
                    {interpolate(t?.("routeEscapeStormBaseWindow"), {
                      place: baseSiteLabel || "Current campsite",
                    })}
                  </div>
                ) : null}

                <div className="mt-1 text-xs text-emerald-700 dark:text-emerald-300">
                  {t?.("routeEscapeStormCalmerNearby") || "Calmer weather nearby."}
                </div>
              </div>
            ) : null}

            <div className="mt-2 text-xs text-slate-600 dark:text-slate-300">
              {betterCount} {t?.("routeDaysBetter") || "dagar betri"}, {sameCount}{" "}
              {t?.("routeDaysSame") || "svipaðir"}, {worseCount} {t?.("routeDaysWorse") || "verri"}.
            </div>

            {routeRiskSummary && !routeRiskSummary.unknown ? (
              <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50/70 px-3 py-2 dark:border-amber-800/50 dark:bg-amber-900/20">
                <div className="text-xs font-semibold text-amber-800 dark:text-amber-200">
                  <Car aria-hidden="true" size={14} className="mr-1 inline -mt-0.5" />
                  {t?.("routeRiskLabel") || "Áhætta á leið"}: {routeRiskSummary.level}
                  {routeRiskSummary.partial && (
                    <span className="font-normal">
                      {" "}
                      ({t?.("routeRiskPartialQualifier") || "based on partial route data"})
                    </span>
                  )}
                </div>

                {routeRiskSummary.tooltip ? (
                  <div className="mt-1 text-xs text-amber-700 dark:text-amber-300">
                    {routeRiskSummary.tooltip}
                  </div>
                ) : null}

                {routeRiskData?.dateVerifiedTomorrow ? (
                  <div className="mt-1 text-[11px] text-amber-600 dark:text-amber-400">
                    {t?.("routeRiskTomorrow")}
                  </div>
                ) : null}

                <div className="mt-1 text-[11px] text-amber-600/80 dark:text-amber-400/80">
                  {t?.("routeRiskBasedOn")}
                </div>
              </div>
            ) : routeRiskSummary?.unknown ? (
              // Ticket #460 J3 — UNKNOWN is a neutral information line: no
              // amber/caution styling, no Car icon, no #436 source note.
              <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-2 dark:border-slate-700 dark:bg-slate-900/40">
                <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  {t?.("routeRiskLabel") || "Áhætta á leið"}: {routeRiskSummary.level}
                </div>
                <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {t?.("routeRiskUnknownDetail") ||
                    "Route-weather data was insufficient to evaluate driving conditions on this route."}
                </div>
              </div>
            ) : null}
          </div>

          <div>
            <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {t?.("routeDetailsPositiveDrivers") || "Helstu jákvæðu ástæður"}
            </div>

            {reasons.length === 0 ? (
              <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                {t?.("routeDetailsNoReasons") || "Engin skýringargögn tiltæk."}
              </div>
            ) : (
              <ul className="mt-2 space-y-2">
                {reasons.map((reason, idx) => {
                  const key = reason?.type ? `routeReason_${reason.type}` : "";
                  const label =
                    (reason?.type && t?.(key)) ||
                    reason?.text ||
                    reason?.type ||
                    t?.("routeDetailsReason") ||
                    "Ástæða";

                  return (
                    <li
                      key={`${reason?.type || "r"}_${idx}`}
                      className="flex items-start justify-between gap-3 rounded-xl border border-slate-200 p-3 text-sm dark:border-slate-800"
                    >
                      <div className="min-w-0 text-slate-800 dark:text-slate-200">{label}</div>
                      <div className="shrink-0 tabular-nums font-semibold text-emerald-700 dark:text-emerald-300">
                        {signFmt(reason?.delta ?? 0, 1)}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="mt-5">
            <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {t?.("routeDetailsDayByDay") || "Dag-fyrir-dag"}
            </div>

            {/* #436 F2: one note for the whole modal (day-by-day table plus
                the advanced table below, if opened) — RouteCompareTable is
                told not to render its own, so there is never a duplicate. */}
            <div className="mt-3">
              <HazardSourceNote t={t} className="mb-3" />
              <RouteCompareTable
                t={t}
                lang={lang}
                baseSiteLabel={baseSiteLabel || t?.("routeCompareBase") || "Núverandi"}
                candidateLabel={
                  candidate?.siteName ||
                  candidate?.siteId ||
                  t?.("routeCompareCandidate") ||
                  "Valkostur"
                }
                windowDays={candidate?.windowDays || []}
                windowDaysCount={windowDaysCount}
                showScoreDelta={false}
                hostProvidesNote
              />
            </div>

            <div className="mt-3">
              <button
                type="button"
                onClick={() => setShowAdvanced((v) => !v)}
                className="text-xs font-semibold text-slate-700 underline decoration-dotted underline-offset-4 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100"
              >
                {showAdvanced
                  ? t?.("routeDetailsHideAdvanced") || "Fela stig og sundurliðun"
                  : t?.("routeDetailsShowAdvanced") || "Sýna stig og sundurliðun"}
              </button>
            </div>

            {showAdvanced ? (
              <>
                <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full min-w-[980px] text-left text-sm">
                    <thead className="bg-slate-50 text-slate-700 dark:bg-slate-900 dark:text-slate-200">
                      <tr>
                        <th className="px-3 py-2">{t?.("routeDetailsDate") || "Dagsetning"}</th>
                        <th className="px-3 py-2">{t?.("routeDetailsBasePts") || "Grunn stig"}</th>
                        <th className="px-3 py-2">
                          {t?.("routeDetailsCandPts") || "Stig valkosts"}
                        </th>
                        <th className="px-3 py-2">{t?.("routeDetailsDelta") || "Mismunur"}</th>
                        <th className="px-3 py-2">
                          {t?.("routeDetailsWindPen") || "Vind refsing"}
                        </th>
                        <th className="px-3 py-2">
                          {t?.("routeDetailsGustPen") || "Hviðu refsing"}
                        </th>
                        <th className="px-3 py-2">
                          {t?.("routeDetailsRainPen") || "Rigningar refsing"}
                        </th>
                        <th className="px-3 py-2">
                          {t?.("routeDetailsStreakPen") || "Rigning í röð refsing"}
                        </th>
                        <th className="px-3 py-2">{t?.("routeDetailsShelter") || "Skjól"}</th>
                        <th className="px-3 py-2">
                          {t?.("routeDetailsTempBase") || "Hita-grunnur"}
                        </th>
                        <th className="px-3 py-2">{t?.("routeDetailsWarnings") || "Viðvaranir"}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {days.map((day, i) => {
                        const basePts =
                          typeof day?.baseSitePoints === "number"
                            ? day.baseSitePoints
                            : typeof day?.baseSitePointsRaw === "number"
                              ? day.baseSitePointsRaw
                              : 0;

                        const candPts =
                          typeof day?.points === "number"
                            ? day.points
                            : typeof day?.pointsRaw === "number"
                              ? day.pointsRaw
                              : 0;

                        const rowDelta = getDayDelta(day);
                        const warningBadges = getWarningBadges(day?.warnings, t);

                        return (
                          <tr
                            key={`${day?.date || "day"}_${i}`}
                            className="border-t border-slate-200 text-slate-800 dark:border-slate-800 dark:text-slate-100"
                          >
                            <td className="px-3 py-2">{day?.date || "—"}</td>
                            <td className="px-3 py-2">{fmt(basePts, 1)}</td>
                            <td className="px-3 py-2">{fmt(candPts, 1)}</td>
                            <td className="px-3 py-2 font-semibold">{signFmt(rowDelta, 1)}</td>

                            <td className="px-3 py-2">{fmt(day?.windPen, 1)}</td>
                            <td className="px-3 py-2">{fmt(day?.gustPen, 1)}</td>
                            <td className="px-3 py-2">{fmt(day?.rainPen, 1)}</td>
                            <td className="px-3 py-2">{fmt(day?.rainStreakPen, 1)}</td>

                            <td className="px-3 py-2">
                              {fmt(day?.shelter, 2)}{" "}
                              <span className="text-slate-500 dark:text-slate-400">
                                ({signFmt(day?.shelterBonus ?? 0, 1)})
                              </span>
                            </td>

                            <td className="px-3 py-2">{fmt(day?.basePts, 1)}</td>
                            <td className="px-3 py-2">
                              {warningBadges.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                  {warningBadges.map((badge) => {
                                    const BadgeIcon = badge.level === "high" ? TriangleAlert : CircleAlert;
                                    return (
                                      <span
                                        key={badge.key}
                                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${badge.className}`}
                                        title={badge.title}
                                      >
                                        <BadgeIcon aria-hidden="true" size={11} />
                                        {badge.label}
                                      </span>
                                    );
                                  })}
                                </div>
                              ) : (
                                <span className="text-slate-400">—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  {t?.("routeDetailsRawHint") ||
                    "0.0 stig geta samt falið raunverulegan mun þegar bæði gildi eru sýnd sem 0 eða 10."}
                </div>
              </>
            ) : null}
          </div>
        </div>

        <div className="flex shrink-0 justify-end gap-2 p-4 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={onClose}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:opacity-95 dark:bg-white dark:text-slate-900"
          >
            {t?.("close") || "Loka"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
