// src/components/RouteCompareTable.jsx
import React, { useMemo } from "react";

// ---------- helpers ----------
function fmtDateShort(dateISO, lang) {
  // dateISO: "YYYY-MM-DD"
  const d = new Date(`${dateISO}T00:00:00Z`);
  try {
    return new Intl.DateTimeFormat(lang === "is" ? "is-IS" : "en-GB", {
      weekday: "short",
      day: "2-digit",
      month: "2-digit",
    }).format(d);
  } catch {
    return dateISO;
  }
}

function pickLevel(warnings) {
  // returns "high" | "warn" | null
  if (!Array.isArray(warnings) || warnings.length === 0) return null;
  if (warnings.some((w) => w?.level === "high")) return "high";
  if (warnings.some((w) => w?.level === "warn")) return "warn";
  return null;
}

function warningChips(warnings, t) {
  // Keep it simple: show unique types, high first.
  if (!Array.isArray(warnings) || warnings.length === 0) return [];
  const order = { high: 0, warn: 1 };
  const uniq = new Map();

  for (const w of warnings) {
    const type = String(w?.type || "");
    const level = String(w?.level || "");
    if (!type || (level !== "high" && level !== "warn")) continue;

    const key = `${type}:${level}`;
    if (!uniq.has(key)) uniq.set(key, { type, level });
  }

  const items = Array.from(uniq.values()).sort((a, b) => {
    if (order[a.level] !== order[b.level]) return order[a.level] - order[b.level];
    return String(a.type).localeCompare(String(b.type));
  });

  function typeLabel(type) {
    const k =
      type === "wind"
        ? "routeWarnTypeWind"
        : type === "gust"
          ? "routeWarnTypeGust"
          : type === "rain"
            ? "routeWarnTypeRain"
            : type === "tempLow"
              ? "routeWarnTypeTempLow"
              : type === "tempHigh"
                ? "routeWarnTypeTempHigh"
                : null;

    return k && typeof t === "function" ? t(k) : type;
  }

  return items.map((x) => ({
    level: x.level,
    label: typeLabel(x.type),
  }));
}

function diffLabel(delta, t) {
  if (typeof delta !== "number" || Number.isNaN(delta))
    return { key: "same", text: t?.("routeDaySame") || "Same" };

  if (delta >= 0.75) return { key: "better", text: t?.("routeImproveBetter") || "Better" };
  if (delta >= 0.1) return { key: "slight", text: t?.("routeImproveSlight") || "Slightly better" };
  if (delta <= -0.75) return { key: "worse", text: t?.("routeDayWorse") || "Worse" };
  if (delta <= -0.1) return { key: "slightWorse", text: t?.("routeDayWorse") || "Worse" };

  return { key: "same", text: t?.("routeDaySame") || "Same" };
}

function topReasonFromWarnings(baseWarnings, candWarnings, diffKey, t) {
  // If daily verdict is "same", do not show a positive/negative reason.
  if (diffKey === "same") return null;

  const b = pickLevel(baseWarnings);
  const c = pickLevel(candWarnings);

  if (!Array.isArray(baseWarnings)) {
    if (c === "high") return t?.("routeCompareReasonHighHazard") || "Hættuveður";
    if (c === "warn") return t?.("routeCompareReasonWarnHazard") || "Veðurviðvörun";
    return t?.("routeCompareReasonNoHazards") || "Engar viðvaranir";
  }

  if (b === "high" && c !== "high") return t?.("routeCompareReasonLessSevere") || "Minni hætta";
  if (b === "warn" && c == null) return t?.("routeCompareReasonClearer") || "Færri viðvaranir";
  if (b === "high" && c === "high") return t?.("routeCompareReasonStillBad") || "Enn slæmt veður";
  if (b === "warn" && c === "warn")
    return t?.("routeCompareReasonSimilar") || "Svipaðar viðvaranir";
  if (b == null && c != null) return t?.("routeCompareReasonWorse") || "Fleiri viðvaranir";

  return t?.("routeCompareReasonGeneral") || "Betri skilyrði";
}

function pillClassByKey(k) {
  if (k === "better" || k === "slight") {
    return "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-200 dark:border-emerald-900/40";
  }
  if (k === "worse" || k === "slightWorse") {
    return "bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/30 dark:text-rose-200 dark:border-rose-900/40";
  }
  return "bg-slate-50 text-slate-800 border-slate-200 dark:bg-slate-900/40 dark:text-slate-200 dark:border-slate-700";
}

function severityIcon(level) {
  if (level === "high") return "🚨";
  if (level === "warn") return "⚠️";
  return null; // ✅ no "•"
}

function SeverityBadge({ level, title }) {
  const icon = severityIcon(level);
  if (!icon) return null; // ✅ show nothing when no warnings

  const isHigh = level === "high";

  return (
    <span
      title={title}
      className={[
        "inline-flex items-center justify-center rounded-full leading-none select-none",
        isHigh ? "w-[20px] h-[20px] text-[12px]" : "w-[18px] h-[18px] text-[12px]",
        "bg-white/95 dark:bg-slate-50/90",
        isHigh
          ? "ring-2 ring-rose-500 dark:ring-rose-400"
          : "ring-1 ring-amber-400/60 dark:ring-amber-400/70",
        isHigh
          ? "shadow-sm drop-shadow-[0_0_10px_rgba(244,63,94,0.50)]"
          : "shadow-sm drop-shadow-[0_0_2px_rgba(245,158,11,0.14)]",
      ].join(" ")}
      aria-label={title}
    >
      {icon}
    </span>
  );
}

function WarningChip({ level, label }) {
  const isHigh = level === "high";

  const cls = isHigh
    ? "bg-rose-50 text-rose-900 border-rose-200 dark:bg-rose-950/35 dark:text-rose-100 dark:border-rose-900/40"
    : "bg-amber-50/60 text-amber-900 border-amber-200/70 dark:bg-amber-950/25 dark:text-amber-100 dark:border-amber-900/30";

  return (
    <span
      className={[
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold",
        cls,
      ].join(" ")}
      title={label}
    >
      <span aria-hidden>{isHigh ? "🚨" : "⚠️"}</span>
      <span className="opacity-90">{label}</span>
    </span>
  );
}

function NoWarningsChip({ label }) {
  return (
    <span
      className="
        inline-flex items-center rounded-full
        border border-slate-200 dark:border-slate-700
        bg-slate-50 text-slate-700 dark:bg-slate-900/40 dark:text-slate-200
        px-2 py-0.5 text-[11px] font-semibold
      "
      title={label}
    >
      {label}
    </span>
  );
}

// ---------- main ----------
export default function RouteCompareTable({
  t = (k) => k,
  lang = "is",
  baseSiteLabel = "",
  candidateLabel = "",
  windowDays = [],
  windowDaysCount = 3,
  showScoreDelta = true,
}) {
  const rows = useMemo(() => {
    const days = Array.isArray(windowDays) ? windowDays.slice(0, windowDaysCount) : [];

    return days.map((d) => {
      const dateISO = String(d?.date ?? "").slice(0, 10);

      const basePts =
        typeof d?.baseSitePoints === "number"
          ? d.baseSitePoints
          : typeof d?.baseSitePointsRaw === "number"
            ? d.baseSitePointsRaw
            : null;

      const candPts =
        typeof d?.points === "number"
          ? d.points
          : typeof d?.pointsRaw === "number"
            ? d.pointsRaw
            : null;

      const delta =
        typeof candPts === "number" && typeof basePts === "number" ? candPts - basePts : null;

      // ✅ base warnings now available from engine injection
      const baseWarnings = Array.isArray(d?.baseSiteWarnings) ? d.baseSiteWarnings : [];
      const candWarnings = Array.isArray(d?.warnings) ? d.warnings : [];

      const diff = diffLabel(delta, t);
      const reason = topReasonFromWarnings(baseWarnings, candWarnings, diff.key, t);

      return {
        dateISO,
        dateLabel: fmtDateShort(dateISO, lang),

        basePts,
        candPts,
        delta,
        diff,

        baseLevel: pickLevel(baseWarnings),
        candLevel: pickLevel(candWarnings),

        baseChips: warningChips(baseWarnings, t),
        candChips: warningChips(candWarnings, t),

        reason,
      };
    });
  }, [windowDays, windowDaysCount, lang, t]);

  const noWarnLabel = t("routeCompareNoWarnings") || "No warnings";

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 dark:bg-slate-900/70">
            <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-200">
              <th className="py-3 pl-4 pr-3 font-semibold">{t("routeCompareDay") || "Day"}</th>
              <th className="py-3 pr-3 font-semibold">
                {baseSiteLabel || t("routeCompareBase") || "Current"}
              </th>
              <th className="py-3 pr-3 font-semibold">
                {candidateLabel || t("routeCompareCandidate") || "Option"}
              </th>
              <th className="py-3 pr-3 font-semibold">{t("routeCompareDiff") || "Difference"}</th>
              <th className="py-3 pr-4 font-semibold">{t("routeCompareWhy") || "Why"}</th>
            </tr>
          </thead>

          <tbody className="[&>tr:nth-child(even)]:bg-slate-50 dark:[&>tr:nth-child(even)]:bg-slate-800/30">
            {rows.map((r) => (
              <tr
                key={r.dateISO}
                className="border-b last:border-0 border-slate-100 dark:border-slate-800 hover:bg-sky-50/50 dark:hover:bg-slate-800/60"
              >
                {/* Day */}
                <td className="py-2 pl-4 pr-3 whitespace-nowrap font-semibold text-slate-900 dark:text-slate-100">
                  {r.dateLabel}
                </td>

                {/* Base */}
                <td className="py-2 pr-3">
                  <div className="flex items-center gap-2">
                    <SeverityBadge
                      level={r.baseLevel}
                      title={
                        r.baseLevel === "high"
                          ? t("routeWarningHigh") || "Dangerous weather"
                          : r.baseLevel === "warn"
                            ? t("routeWarning") || "Weather warning"
                            : ""
                      }
                    />

                    {/* ✅ if base has warnings -> chips, else show grey "No warnings" chip */}
                    {r.baseChips.length > 0 ? (
                      <div className="flex flex-wrap items-center gap-1">
                        {r.baseChips.slice(0, 2).map((c, idx) => (
                          <WarningChip
                            key={`${r.dateISO}:base:${idx}:${c.label}`}
                            level={c.level}
                            label={c.label}
                          />
                        ))}
                        {r.baseChips.length > 2 ? (
                          <span
                            className="
                              inline-flex items-center rounded-full
                              border border-slate-200 dark:border-slate-700
                              bg-slate-50 text-slate-700 dark:bg-slate-900/40 dark:text-slate-200
                              px-2 py-0.5 text-[11px] font-semibold
                            "
                            title={r.baseChips
                              .map((x) => `${x.level === "high" ? "🚨" : "⚠️"} ${x.label}`)
                              .join("\n")}
                          >
                            +{r.baseChips.length - 2}
                          </span>
                        ) : null}
                      </div>
                    ) : (
                      <NoWarningsChip label={noWarnLabel} />
                    )}

                    {/* optional numeric scores (usually off in modal) */}
                    {showScoreDelta && typeof r.basePts === "number" ? (
                      <span className="ml-2 text-xs text-slate-600 dark:text-slate-300 tabular-nums">
                        {r.basePts.toFixed(1)}
                      </span>
                    ) : null}
                  </div>
                </td>

                {/* Candidate */}
                <td className="py-2 pr-3">
                  <div className="flex items-center gap-2">
                    <SeverityBadge
                      level={r.candLevel}
                      title={
                        r.candLevel === "high"
                          ? t("routeWarningHigh") || "Dangerous weather"
                          : r.candLevel === "warn"
                            ? t("routeWarning") || "Weather warning"
                            : ""
                      }
                    />

                    {r.candChips.length > 0 ? (
                      <div className="ml-1 flex flex-wrap items-center gap-1">
                        {(() => {
                          const shown = r.candChips.slice(0, 2);
                          const more = r.candChips.length - shown.length;

                          const tooltip = r.candChips
                            .map((x) => `${x.level === "high" ? "🚨" : "⚠️"} ${x.label}`)
                            .join("\n");

                          return (
                            <>
                              {shown.map((c, idx) => (
                                <WarningChip
                                  key={`${r.dateISO}:cand:${idx}:${c.label}`}
                                  level={c.level}
                                  label={c.label}
                                />
                              ))}

                              {more > 0 ? (
                                <span
                                  className="
                                    inline-flex items-center rounded-full
                                    border border-slate-200 dark:border-slate-700
                                    bg-slate-50 text-slate-700 dark:bg-slate-900/40 dark:text-slate-200
                                    px-2 py-0.5 text-[11px] font-semibold
                                  "
                                  title={tooltip}
                                  aria-label={tooltip}
                                >
                                  +{more}
                                </span>
                              ) : null}
                            </>
                          );
                        })()}
                      </div>
                    ) : (
                      <NoWarningsChip label={noWarnLabel} />
                    )}

                    {showScoreDelta && typeof r.candPts === "number" ? (
                      <span className="ml-2 text-xs text-slate-600 dark:text-slate-300 tabular-nums">
                        {r.candPts.toFixed(1)}
                      </span>
                    ) : null}
                  </div>
                </td>

                {/* Difference */}
                <td className="py-2 pr-3">
                  {typeof r.delta === "number" && Number.isFinite(r.delta) ? (
                    <span
                      className={`inline-flex items-center rounded-full border px-2 py-1 text-xs font-semibold ${pillClassByKey(
                        r.diff.key
                      )}`}
                      title={`${t?.("routeCompareDiff") || "Munur"}: ${r.delta >= 0 ? "+" : ""}${r.delta.toFixed(
                        1
                      )}`}
                    >
                      {r.diff.text}
                      {showScoreDelta ? (
                        <span className="ml-2 opacity-80 tabular-nums">
                          {r.delta >= 0 ? "+" : ""}
                          {r.delta.toFixed(1)}
                        </span>
                      ) : null}
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-300">
                      {t?.("routeCompareDiffNA") || "—"}
                    </span>
                  )}
                </td>

                {/* Why */}
                <td className="py-2 pr-4 text-slate-700 dark:text-slate-200 text-sm">
                  {r.reason ? (
                    r.reason
                  ) : (
                    <span className="text-slate-400 dark:text-slate-500">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
