import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import RouteCompareTable from "./RouteCompareTable";
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

  useEffect(() => {
    if (!open) return;

    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;

    const prevOverflow = document.body.style.overflow;
    const prevPaddingRight = document.body.style.paddingRight;
    const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = "hidden";
    if (scrollBarWidth > 0) {
      document.body.style.paddingRight = `${scrollBarWidth}px`;
    }

    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.paddingRight = prevPaddingRight;
    };
  }, [open]);

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
      <button aria-label="Close" className="absolute inset-0 bg-black/60" onClick={onClose} />

      <div className="relative z-10 w-full max-w-3xl max-h-[85vh] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-950">
        <div className="flex items-start justify-between gap-3 p-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</div>

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

        <div className="p-4 overflow-y-auto overscroll-contain">
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

            {routeRiskSummary ? (
              <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50/70 px-3 py-2 dark:border-amber-800/50 dark:bg-amber-900/20">
                <div className="text-xs font-semibold text-amber-800 dark:text-amber-200">
                  <span className="mr-1 text-sm">🚐</span>{" "}
                  {t?.("routeRiskLabel") || "Áhætta á leið"}: {routeRiskSummary.level}
                </div>

                {routeRiskSummary.tooltip ? (
                  <div className="mt-1 text-xs text-amber-700 dark:text-amber-300">
                    {routeRiskSummary.tooltip}
                  </div>
                ) : null}
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

            <div className="mt-3">
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
                                  {warningBadges.map((badge) => (
                                    <span
                                      key={badge.key}
                                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${badge.className}`}
                                      title={badge.title}
                                    >
                                      {badge.icon} {badge.label}
                                    </span>
                                  ))}
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

        <div className="flex justify-end gap-2 p-4 border-t border-slate-200 dark:border-slate-800">
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
