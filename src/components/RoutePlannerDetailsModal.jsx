import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

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
  windowDaysCount, // ✅ NEW: keep modal in sync with slider
}) {
  const [showAdvanced, setShowAdvanced] = useState(false);

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

  // ✅ Keep day list synced with slider
  const allDays = Array.isArray(candidate.windowDays) ? candidate.windowDays : [];
  const days = typeof windowDaysCount === "number" ? allDays.slice(0, windowDaysCount) : allDays;

  // Verdict thresholds (tune later if needed)
  const THRESH = 0.2;

  function getVerdict(deltaDay) {
    if (deltaDay > THRESH) return "better";
    if (deltaDay < -THRESH) return "worse";
    return "same";
  }

  function verdictLabel(v) {
    if (v === "better") return t?.("routeDayBetter") || "Betra";
    if (v === "worse") return t?.("routeDayWorse") || "Lakara";
    return t?.("routeDaySame") || "Svipað";
  }

  function verdictPillClass(v) {
    if (v === "better")
      return "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-200";
    if (v === "worse")
      return "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900/40 dark:bg-rose-950/40 dark:text-rose-200";
    return "border-slate-200 bg-slate-50 text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200";
  }

  const verdictRows = days.map((d) => {
    const basePts = d?.basePts ?? 0;
    const candPts = d?.points ?? 0;
    const dlt = candPts - basePts;
    return {
      date: d?.date || "—",
      delta: dlt,
      verdict: getVerdict(dlt),
      raw: d,
    };
  });

  const betterCount = verdictRows.filter((r) => r.verdict === "better").length;
  const sameCount = verdictRows.filter((r) => r.verdict === "same").length;
  const worseCount = verdictRows.filter((r) => r.verdict === "worse").length;

  // Camper-first overall: majority rules
  let overallVerdict = "same";
  if (betterCount > worseCount && betterCount > sameCount) overallVerdict = "better";
  else if (worseCount > betterCount && worseCount > sameCount) overallVerdict = "worse";
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
                {verdictLabel(overallVerdict)}
              </span>

              <span className="text-sm text-slate-700 dark:text-slate-200">
                ({t?.("routeOverallNextNDays") || "næstu"} {windowDaysCount ?? days.length}{" "}
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

          {/* DAY BY DAY (decision list) */}
          <div className="mt-5">
            <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {t?.("routeDetailsDayByDay") || "Dag-fyrir-dag"}
            </div>

            {verdictRows.length === 0 ? (
              <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                {t?.("routeDetailsNoDays") || "Engin dagleg sundurliðun tiltæk."}
              </div>
            ) : (
              <ul className="mt-3 space-y-2">
                {verdictRows.map((r, i) => (
                  <li
                    key={`${r.date}_${i}`}
                    className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-800"
                  >
                    <div className="text-sm text-slate-900 dark:text-slate-100">{r.date}</div>

                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${verdictPillClass(
                        r.verdict
                      )}`}
                    >
                      {verdictLabel(r.verdict)}
                    </span>
                  </li>
                ))}
              </ul>
            )}

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
                <table className="w-full min-w-[900px] text-left text-sm">
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
                    </tr>
                  </thead>
                  <tbody>
                    {days.map((d, i) => {
                      const rowDelta = (d?.points ?? 0) - (d?.basePts ?? 0);

                      return (
                        <tr
                          key={`${d?.date || "day"}_${i}`}
                          className="border-t border-slate-200 text-slate-800 dark:border-slate-800 dark:text-slate-100"
                        >
                          <td className="px-3 py-2">{d?.date || "—"}</td>
                          <td className="px-3 py-2">{fmt(d?.basePts, 1)}</td>
                          <td className="px-3 py-2">{fmt(d?.points, 1)}</td>
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
