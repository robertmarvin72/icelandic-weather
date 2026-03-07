// src/components/RoutePlannerDetailsModal.jsx
import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import RouteCompareTable from "./RouteCompareTable";

function fmt(n, digits = 1) {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  return Number(n).toFixed(digits);
}

function signFmt(n, digits = 1) {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  const v = Number(n);
  const s = v > 0 ? "+" : "";
  return `${s}${v.toFixed(digits)}`;
}

export default function RoutePlannerDetailsModal({
  open,
  onClose,
  t,
  baseSiteLabel,
  candidate,
  windowDaysCount, // keep modal in sync with slider
  adaptiveUsedKm,
  adaptiveMaxKm,
}) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  // ✅ Only show when used < max
  const showAdaptiveLine =
    typeof adaptiveUsedKm === "number" &&
    typeof adaptiveMaxKm === "number" &&
    adaptiveUsedKm < adaptiveMaxKm;

  // ✅ More obvious glow: triggers when modal opens AND when used/max changes
  const [radiusGlow, setRadiusGlow] = useState(false);
  useEffect(() => {
    if (!open) return;
    if (!showAdaptiveLine) return;

    setRadiusGlow(true);
    const tt = setTimeout(() => setRadiusGlow(false), 1200);
    return () => clearTimeout(tt);
  }, [open, adaptiveUsedKm, adaptiveMaxKm, showAdaptiveLine]);

  // Close on ESC
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Lock body scroll while modal is open
  useEffect(() => {
    if (!open) return;

    const prevOverflow = document.body.style.overflow;
    const prevPaddingRight = document.body.style.paddingRight;

    const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = "hidden";
    if (scrollBarWidth > 0) document.body.style.paddingRight = `${scrollBarWidth}px`;

    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.paddingRight = prevPaddingRight;
    };
  }, [open]);

  // Reset advanced toggle when opening
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

  // Keep day list synced with slider
  const allDays = Array.isArray(candidate.windowDays) ? candidate.windowDays : [];
  const days = typeof windowDaysCount === "number" ? allDays.slice(0, windowDaysCount) : allDays;

  // Verdict thresholds (match card)
  const THRESH = 0.75;

  function getVerdict(deltaDay) {
    if (deltaDay > THRESH) return "better";
    if (deltaDay < -THRESH) return "worse";
    return "same";
  }

  function overallVerdictLabel(v) {
    if (aggregateType === "slight") {
      return t?.("routeAggregateSlight") || "Lítil heildarbæting";
    }
    if (v === "better") return t?.("routeDayBetter") || "Betra";
    if (v === "worse") return t?.("routeDayWorse") || "Lakara";
    return t?.("routeDaySame") || "Svipað";
  }

  function verdictPillClass(v) {
    if (aggregateType === "slight") {
      return "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-200";
    }
    if (v === "better")
      return "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-200";
    if (v === "worse")
      return "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900/40 dark:bg-rose-950/40 dark:text-rose-200";
    return "border-slate-200 bg-slate-50 text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200";
  }

  // ✅ Base site points to compare against (camper-first 0..10, fallback raw)
  function getBasePts(d) {
    if (typeof d?.baseSitePoints === "number") return d.baseSitePoints;
    if (typeof d?.baseSitePointsRaw === "number") return d.baseSitePointsRaw;
    return 0;
  }

  // ✅ Candidate points (camper-first 0..10, fallback raw)
  function getCandPts(d) {
    if (typeof d?.points === "number") return d.points;
    if (typeof d?.pointsRaw === "number") return d.pointsRaw;
    return 0;
  }

  // ✅ Delta resolver (RAW fallback when clamping hides delta)
  function getDayDelta(d) {
    const basePts =
      typeof d?.baseSitePoints === "number"
        ? d.baseSitePoints
        : typeof d?.baseSitePointsRaw === "number"
          ? d.baseSitePointsRaw
          : 0;

    const candPts =
      typeof d?.points === "number" ? d.points : typeof d?.pointsRaw === "number" ? d.pointsRaw : 0;

    const baseRaw =
      typeof d?.baseSitePointsRaw === "number"
        ? d.baseSitePointsRaw
        : typeof d?.baseSitePoints === "number"
          ? d.baseSitePoints
          : 0;

    const candRaw =
      typeof d?.pointsRaw === "number" ? d.pointsRaw : typeof d?.points === "number" ? d.points : 0;

    const deltaPts = candPts - basePts;
    const deltaRaw = candRaw - baseRaw;

    const useRaw =
      (candPts === basePts && (candPts <= 0.0001 || candPts >= 9.9999)) ||
      Math.abs(deltaPts) < 0.0001;

    return useRaw ? deltaRaw : deltaPts;
  }

  const verdictRows = days.map((d) => {
    const basePts = getBasePts(d);
    const candPts = getCandPts(d);
    const dlt = getDayDelta(d);

    return {
      date: d?.date || "—",
      delta: dlt,
      verdict: getVerdict(dlt),
      basePts,
      candPts,
      raw: d,
    };
  });

  const betterCount =
    typeof candidate?.betterDays === "number"
      ? candidate.betterDays
      : verdictRows.filter((r) => r.verdict === "better").length;

  const sameCount =
    typeof candidate?.sameDays === "number"
      ? candidate.sameDays
      : verdictRows.filter((r) => r.verdict === "same").length;

  const worseCount =
    typeof candidate?.worseDays === "number"
      ? candidate.worseDays
      : verdictRows.filter((r) => r.verdict === "worse").length;

  const aggregateType = String(candidate?.aggregateType || "same");

  let overallVerdict = "same";
  if (aggregateType === "better") overallVerdict = "better";
  else if (worseCount > betterCount) overallVerdict = "worse";
  else overallVerdict = "same";

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3">
      {/* Backdrop */}
      <button aria-label="Close" className="absolute inset-0 bg-black/60" onClick={onClose} />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-3xl max-h-[85vh] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-950">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 p-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</div>

            {/* ✅ Adaptive line sits cleanly under title (OBVIOUS glow) */}
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

            {/* Normal header meta line */}
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

        {/* Content */}
        <div className="p-4 overflow-y-auto overscroll-contain">
          {/* OVERALL */}
          <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
            <div className="text-sm text-slate-600 dark:text-slate-300 mb-2">
              {t?.("routeOverallResult") || "Heildarniðurstaða næstu daga"}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <span
                className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-semibold ${verdictPillClass(
                  overallVerdict
                )}`}
              >
                {overallVerdictLabel(overallVerdict)}
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

            {candidate?.hazardImproved ? (
              <div className="mt-2 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                {t?.("routeDetailsHazardImproved") || "Minni veðuráhætta á þessum stað"}
              </div>
            ) : null}

            <div className="mt-2 text-xs text-slate-600 dark:text-slate-300">
              {betterCount} {t?.("routeDaysBetter") || "dagar betri"}, {sameCount}{" "}
              {t?.("routeDaysSame") || "svipaðir"}, {worseCount} {t?.("routeDaysWorse") || "verri"}.
            </div>
          </div>

          {/* REASONS */}
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
                {reasons.map((r, idx) => {
                  const key = r?.type ? `routeReason_${r.type}` : "";
                  const label =
                    (r?.type && t?.(key)) ||
                    r?.text ||
                    r?.type ||
                    t?.("routeDetailsReason") ||
                    "Ástæða";

                  return (
                    <li
                      key={`${r?.type || "r"}_${idx}`}
                      className="flex items-start justify-between gap-3 rounded-xl border border-slate-200 p-3 text-sm dark:border-slate-800"
                    >
                      <div className="text-slate-800 dark:text-slate-200">{label}</div>
                      <div className="shrink-0 font-semibold text-slate-900 dark:text-slate-100">
                        {signFmt(r?.delta ?? 0, 1)}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* DAY BY DAY */}
          <div className="mt-5">
            <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {t?.("routeDetailsDayByDay") || "Dag-fyrir-dag"}
            </div>

            {/* ✅ NEW: camper-first compare table */}
            <div className="mt-3">
              <RouteCompareTable
                t={t}
                lang="is"
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

            {/* Toggle advanced */}
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

            {/* ADVANCED TABLE */}
            {showAdvanced && (
              <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full min-w-[980px] text-left text-sm">
                  <thead className="bg-slate-50 text-slate-700 dark:bg-slate-900 dark:text-slate-200">
                    <tr>
                      <th className="px-3 py-2">{t?.("routeDetailsDate") || "Dagsetning"}</th>
                      <th className="px-3 py-2">{t?.("routeDetailsBasePts") || "Grunn stig"}</th>
                      <th className="px-3 py-2">{t?.("routeDetailsCandPts") || "Stig valkosts"}</th>
                      <th className="px-3 py-2">{t?.("routeDetailsDelta") || "Mismunur"}</th>
                      <th className="px-3 py-2">{t?.("routeDetailsWindPen") || "Vind refsing"}</th>
                      <th className="px-3 py-2">{t?.("routeDetailsGustPen") || "Hviðu refsing"}</th>
                      <th className="px-3 py-2">
                        {t?.("routeDetailsRainPen") || "Rigningar refsing"}
                      </th>
                      <th className="px-3 py-2">
                        {t?.("routeDetailsStreakPen") || "Rigning í röð refsing"}
                      </th>
                      <th className="px-3 py-2">{t?.("routeDetailsShelter") || "Skjól"}</th>
                      <th className="px-3 py-2">{t?.("routeDetailsTempBase") || "Hita-grunnur"}</th>
                      <th className="px-3 py-2">{t?.("routeDetailsWarnings") || "Viðvaranir"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {days.map((d, i) => {
                      const basePts = getBasePts(d);
                      const candPts = getCandPts(d);
                      const rowDelta = getDayDelta(d);

                      return (
                        <tr
                          key={`${d?.date || "day"}_${i}`}
                          className="border-t border-slate-200 text-slate-800 dark:border-slate-800 dark:text-slate-100"
                        >
                          <td className="px-3 py-2">{d?.date || "—"}</td>
                          <td className="px-3 py-2">{fmt(basePts, 1)}</td>
                          <td className="px-3 py-2">{fmt(candPts, 1)}</td>
                          <td className="px-3 py-2 font-semibold">{signFmt(rowDelta, 1)}</td>

                          <td className="px-3 py-2">{fmt(d?.windPen, 1)}</td>
                          <td className="px-3 py-2">{fmt(d?.gustPen, 1)}</td>
                          <td className="px-3 py-2">{fmt(d?.rainPen, 1)}</td>
                          <td className="px-3 py-2">{fmt(d?.rainStreakPen, 1)}</td>

                          <td className="px-3 py-2">
                            {fmt(d?.shelter, 2)}{" "}
                            <span className="text-slate-500 dark:text-slate-400">
                              ({signFmt(d?.shelterBonus ?? 0, 1)})
                            </span>
                          </td>

                          <td className="px-3 py-2">{fmt(d?.basePts, 1)}</td>
                          <td className="px-3 py-2">
                            {Array.isArray(d?.warnings) && d.warnings.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {d.warnings.map((w, idx) => (
                                  <span
                                    key={`${w.type}_${idx}`}
                                    className={`
                                      inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold
                                      ${
                                        w.level === "high"
                                          ? "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-200"
                                          : "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
                                      }
                                    `}
                                    title={`${w.type}: ${fmt(w.value, 0)}`}
                                  >
                                    {w.level === "high" ? "🚨" : "⚠️"} {w.type}
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
            )}
          </div>
        </div>

        {/* Footer */}
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
