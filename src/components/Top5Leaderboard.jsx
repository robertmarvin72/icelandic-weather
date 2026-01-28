import React from "react";
import LoadingShimmer from "./LoadingShimmer";
import ScoreLegend from "./ScoreLegend";
import { scorePillClass } from "../ui/scoreStyles";
import { convertDistanceKm, formatNumber, DIST_UNIT_LABEL } from "../lib/scoring";
import RequirePro from "./RequirePro";
import UpgradeHint from "./UpgradeHint";
import { oppositeCompass } from "../lib/windUtils";
import { translateCompass } from "../lib/compassUtils";

function shelterPillClass(score) {
  if (score < 30) return "shelter-pill--bad";
  if (score <= 70) return "shelter-pill--fair";
  return "shelter-pill--good";
}

export default function Top5Leaderboard({
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
}) {
  // TEMP: Mock until we wire real forecast data into this card
  // When we have forecast daily data available here, compute real shelter:
  const sheltered = windDir?.compass ? oppositeCompass(windDir.compass) : null;
  return (
    <div className="card hover-lift rounded-2xl shadow-sm border border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-700 p-4">
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
              {top5.map((item, idx) => (
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
            </tbody>
          </table>

          <ScoreLegend t={t} />
        </div>
      )}

      <div className="mt-3 text-xs text-slate-500 dark:text-slate-300">{t?.("sortedBy")}</div>

      <hr></hr>
      <div className="pro-card">
        <div className="pro-label">{t("proPreview")}</div>
      </div>
      <RequirePro
        fallback={
          <UpgradeHint
            title={t("windDirectionShelterTitle")}
            text={t("windDirectionShelterSubtitle")}
            actionLabel={t("seePro")}
            hintLines={[
              {
                icon: "🧭",
                label: t("windLabel"),
                value: windDir ? (
                  <div className="wind-row">
                    <span className="wind-pill wind-pill--wind">
                      {translateCompass(windDir.compass, lang)}
                    </span>

                    <span className="wind-arrow">→</span>

                    <span className="wind-pill wind-pill--shelter" title={t("shelteredFrom")}>
                      {translateCompass(sheltered, lang)}
                    </span>
                  </div>
                ) : (
                  "—"
                ),
              },
              {
                icon: "🛡️",
                label: t("shelterLabel"),
                value: shelter ? (
                  <div className="flex items-center justify-end">
                    <span
                      className={`shelter-pill ${shelterPillClass(shelter.score)}`}
                      title={`${t("shelterTooltipPrefix")}: ${t(`shelter${shelter.label}`)}`}
                      aria-label={`${t(`shelter${shelter.label}`)}`}
                    >
                      {shelter.score} / 100
                    </span>
                  </div>
                ) : (
                  "—"
                ),
              },
            ]}
          />
        }
      >
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-3">
          Pro content goes here
        </div>
      </RequirePro>
    </div>
  );
}
