import React, { useMemo } from "react";
import LoadingShimmer from "./LoadingShimmer";
import ScoreLegend from "./ScoreLegend";
import { scorePillClass } from "../ui/scoreStyles";
import { convertDistanceKm, formatNumber, DIST_UNIT_LABEL } from "../lib/scoring";
import { oppositeCompass } from "../lib/windUtils";
import { translateCompass } from "../lib/compassUtils";
import RequireFeature from "./RequireFeature";
import { getFeatureLimit } from "../config/features";

function shelterPillClass(score) {
  if (score < 30) return "shelter-pill--bad";
  if (score <= 70) return "shelter-pill--fair";
  return "shelter-pill--good";
}

export default function Top5Leaderboard({
  entitlements,
  top5,
  scoredCount,
  loadingWave1,
  loadingBg,
  units,
  onSelectSite,
  t,
  lang,
  shelter,
  windDir,

  // ✅ new (optional) props for CTA + messaging
  me,
  onUpgrade,
  proUntil,
  subscription,
}) {
  const sheltered = windDir?.compass ? oppositeCompass(windDir.compass) : null;

  // Top 3 vs Top 5 gating
  const visibleCount = getFeatureLimit("topSitesCount", entitlements) ?? 3;

  const visibleTop = useMemo(() => top5.slice(0, visibleCount), [top5, visibleCount]);
  const lockedTop = useMemo(
    () => (visibleCount >= 5 ? [] : top5.slice(visibleCount, 5)),
    [top5, visibleCount]
  );

  const isPro = !!entitlements?.isPro;
  const subStatus = (subscription?.status || "").toLowerCase();
  const isCanceled = subStatus === "canceled" || subStatus === "cancelled";
  const showProUntil = isPro && isCanceled && !!proUntil;

  // Reusable (Pro) display blocks
  const windDisplay = (
    <div className="wind-row">
      <span className="wind-pill wind-pill--wind">
        {windDir ? translateCompass(windDir.compass, lang) : "—"}
      </span>

      <span className="wind-arrow">→</span>

      <span className="wind-pill wind-pill--shelter" title={t("shelteredFrom")}>
        {sheltered ? translateCompass(sheltered, lang) : "—"}
      </span>
    </div>
  );

  const shelterDisplay = (
    <div className="flex items-center justify-end">
      {shelter ? (
        <span
          className={`shelter-pill ${shelterPillClass(shelter.score)}`}
          title={`${t("shelterTooltipPrefix")}: ${t(`shelter${shelter.label}`)}`}
          aria-label={`${t(`shelter${shelter.label}`)}`}
        >
          {shelter.score} / 100
        </span>
      ) : (
        "—"
      )}
    </div>
  );

  // Locked (Free teaser) blocks — NO real data
  const lockedWind = (
    <div className="flex items-center gap-2">
      <span className="opacity-70 text-xs">🔒 {t("seePro")}</span>
      <div className="wind-row">
        <span className="wind-pill wind-pill--wind">—</span>
        <span className="wind-arrow">→</span>
        <span className="wind-pill wind-pill--shelter">—</span>
      </div>
    </div>
  );

  const lockedShelter = (
    <div className="flex items-center gap-2">
      <span className="opacity-70 text-xs">🔒 {t("seePro")}</span>
      <div className="flex items-center justify-end">
        <span className="shelter-pill shelter-pill--fair" aria-label={t("seePro")}>
          — / 100
        </span>
      </div>
    </div>
  );

  const getProLabel = () => {
    if (!me?.user) return "Fá Pro aðgang";
    if (me?.entitlements?.pro) return "Pro virkt ✓";
    return "Uppfæra í Pro";
  };

  return (
    <div className="card rounded-2xl shadow-sm border border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-700 p-4">
      <h3 className="text-base font-semibold mb-1">
        {t("top5Title")}
        <span className="ml-2 text-xs font-normal text-slate-500 dark:text-slate-400">
          ({t("from")} {scoredCount} {t("scored")})
        </span>
      </h3>

      {/* Show shimmer only if we have nothing yet */}
      {top5.length === 0 && loadingWave1 && <LoadingShimmer rows={5} height={20} />}

      <div className="mb-3 text-xs text-slate-500 dark:text-slate-400">
        {loadingBg ? t("loadingMoreCampsites") : t("upToDate")}
      </div>

      {top5.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-100/80 backdrop-blur-sm text-slate-700 dark:bg-slate-900/80 dark:text-slate-300">
              <tr>
                <th className="px-3 py-2 font-semibold w-10 text-center">#</th>
                <th className="px-3 py-2 font-semibold">{t("campsite")}</th>
                <th className="px-3 py-2 font-semibold text-right">{t("distance")}</th>
                <th className="px-3 py-2 font-semibold text-right">{t("score")}</th>
              </tr>
            </thead>

            <tbody className="[&>tr:nth-child(even)]:bg-slate-50 dark:[&>tr:nth-child(even)]:bg-slate-800/40">
              {/* Visible rows (Free: 3, Pro: 5) */}
              {visibleTop.map((item, idx) => (
                <tr
                  key={item.site.id}
                  className="hover:bg-sky-50/60 cursor-pointer transition dark:hover:bg-slate-800/60"
                  onClick={() => onSelectSite(item.site.id)}
                  title={t?.("selectOnMap")}
                >
                  <td className="px-3 py-2 text-center font-semibold text-slate-700 dark:text-slate-200">
                    {idx + 1}
                  </td>
                  <td className="px-3 py-2 font-medium text-slate-800 dark:text-slate-100">
                    {item.site.name}
                  </td>
                  <td className="px-3 py-2 text-right text-slate-600 dark:text-slate-300">
                    {item.dist == null
                      ? "—"
                      : `${formatNumber(convertDistanceKm(item.dist, units), 1)} ${
                          DIST_UNIT_LABEL[units]
                        }`}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <span
                      className={`pill-pop inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-semibold ${scorePillClass(
                        item.score
                      )}`}
                      title={`${t?.("weeklyScore")}: ${item.score} / 70`}
                    >
                      {item.score}
                    </span>
                  </td>
                </tr>
              ))}

              {/* Locked rows (only shown when Free is limited) */}
              {lockedTop.map((item, i) => {
                const rank = visibleCount + i + 1;
                return (
                  <tr
                    key={`locked-${item.site.id}`}
                    className="cursor-not-allowed opacity-80"
                    title={t?.("seePro") ?? "See Pro"}
                    onClick={(e) => e.preventDefault()}
                  >
                    <td className="px-3 py-2 text-center font-semibold text-slate-700 dark:text-slate-200">
                      {rank}
                    </td>
                    <td className="px-3 py-2 font-medium text-slate-800 dark:text-slate-100">
                      <span className="inline-flex items-center gap-2">
                        <span className="opacity-70">🔒 {t?.("seePro") ?? "Pro"}</span>
                        <span className="text-slate-500 dark:text-slate-400">(#{rank})</span>
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right text-slate-600 dark:text-slate-300">—</td>
                    <td className="px-3 py-2 text-right">
                      <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-semibold opacity-60 border border-slate-300 dark:border-slate-600">
                        —
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <ScoreLegend t={t} />
        </div>
      )}

      <div className="mt-3 text-xs text-slate-500 dark:text-slate-300">{t?.("sortedBy")}</div>

      <hr />

      {/* ✅ CTA / Status */}
      {showProUntil ? (
        <div className="mt-3 rounded-xl border border-slate-200 dark:border-slate-700 p-3 text-sm">
          <div className="font-semibold">{t("proActive")}</div>
          <div className="text-slate-600 dark:text-slate-300">
            {t("proUntil")}{" "}
            <span className="font-semibold">
              {new Date(proUntil).toLocaleDateString(lang === "is" ? "is-IS" : "en-US", {
                year: "numeric",
                month: "short",
                day: "2-digit",
              })}
            </span>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => {
            if (typeof onUpgrade === "function") onUpgrade(); // App.jsx sér um login/checkout flæði
          }}
          className="
      mt-3 w-full inline-flex flex-col items-center justify-center gap-1
      rounded-2xl px-4 py-3 text-sm font-semibold
      bg-emerald-600 text-white
      shadow-sm shadow-emerald-600/20
      hover:bg-emerald-500 hover:shadow-md
      active:translate-y-[1px]
      focus:outline-none focus:ring-2 focus:ring-emerald-400/60
      dark:bg-emerald-500 dark:hover:bg-emerald-400
    "
          title={t?.("proCtaTooltip") ?? "Skráðu þig inn og opnaðu Pro"}
          aria-label={t?.("proCtaLabel") ?? "Opna Pro"}
        >
          <span className="inline-flex items-center gap-2">
            <span aria-hidden>✨</span>
            <span>{getProLabel()}</span>
            <span className="opacity-90" aria-hidden>
              →
            </span>
          </span>

          <span className="text-xs font-normal opacity-95">
            {t?.("proCtaSubtitle") ?? "Skráðu þig inn til að kaupa aðgang og opna Pro-fídusa."}
          </span>
        </button>
      )}

      {/* Wind + Shelter section gated via feature matrix */}
      <div className="mt-3 rounded-xl border border-slate-200 dark:border-slate-700 p-3">
        <div className="text-sm font-semibold mb-2">{t("windDirectionShelterTitle")}</div>

        <div className="text-xs text-slate-600 dark:text-slate-300 mb-2">
          {t("windDirectionShelterSubtitle")}
        </div>

        <div className="text-xs text-slate-500 dark:text-slate-400 mb-3">
          Í Pro færðu vindátt + skjólstuðul.
        </div>

        <div className="grid gap-2">
          {/* Wind row */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span aria-hidden>🧭</span>
              <span className="text-sm">{t("windLabel")}</span>
            </div>

            <RequireFeature
              feature="windDirection"
              entitlements={entitlements}
              fallback={lockedWind}
            >
              {windDisplay}
            </RequireFeature>
          </div>

          {/* Shelter row */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span aria-hidden>🛡️</span>
              <span className="text-sm">{t("shelterLabel")}</span>
            </div>

            <RequireFeature
              feature="shelterIndex"
              entitlements={entitlements}
              fallback={lockedShelter}
            >
              {shelterDisplay}
            </RequireFeature>
          </div>
        </div>
      </div>
    </div>
  );
}
