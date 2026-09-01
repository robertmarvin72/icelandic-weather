// src/components/NorthernLightsCard.jsx
//
// Ticket 4 (#392) — compact, secondary Northern Lights decision surface.
// Consumes Ticket 3's canonical response unchanged: no scoring, ranking, or
// reinterpretation happens here (see src/lib/auroraDecisionClassify.js).
// Gating (RequireFeature-equivalent isFeatureAvailable check) is
// presentation-only — the request/response is identical for Free and Pro.

import React, { useEffect, useMemo, useRef, useState } from "react";
import { isFeatureAvailable } from "../config/features";
import { trackEvent } from "../lib/analytics";
import { useAuroraDecision } from "../hooks/useAuroraDecision";
import { classifyAuroraOutcome } from "../lib/auroraDecisionClassify";
import { isAuroraSeason, todayEveningUtc } from "../lib/auroraSeason";
import { AURORA_CANDIDATE_LOCATION_IDS } from "../config/auroraCandidates";
import { selectAuroraDisplay } from "../lib/auroraDisplaySelection";
import { auroraBandLabelKey } from "../lib/auroraBandPresentation";
import NorthernLightsMap from "./NorthernLightsMap";

const REASON_KEYS = {
  meaningful_activity: "nlReasonMeaningfulActivity",
  low_activity: "nlReasonLowActivity",
  clear_sky: "nlReasonClearSky",
  partial_cloud: "nlReasonPartialCloud",
  heavy_cloud: "nlReasonHeavyCloud",
  cloud_hard_cap_applied: "nlReasonCloudHardCap",
  precipitation_reduced_visibility: "nlReasonPrecipitation",
  moonlight_reduced_visibility: "nlReasonMoonlight",
};

const DETAILS_EXPANDED_KEY = "nl_details_expanded";

function formatAgo(iso, t, nowMs) {
  if (!iso) return null;
  const ms = nowMs - new Date(iso).getTime();
  if (!Number.isFinite(ms) || ms < 0) return null;
  const hours = Math.round(ms / 3600000);
  if (hours <= 0) return t("nlAgeLessThanHour");
  if (hours === 1) return t("nlAgeOneHour");
  return t("nlAgeHours").replace("{hours}", String(hours));
}

export default function NorthernLightsCard({ t, lang, entitlements, onUpgrade, theme, fetchImpl, now }) {
  const seasonActive = isAuroraSeason(now ? now() : undefined);
  const evening = todayEveningUtc(now ? now() : undefined);

  const gate = isFeatureAvailable("northernLights", entitlements);
  const isPro = !!gate.available;

  const { status, outcome, retry, requestKey } = useAuroraDecision({
    enabled: seasonActive,
    evening,
    locationIds: AURORA_CANDIDATE_LOCATION_IDS,
    fetchImpl,
  });

  const classification = status === "resolved" ? classifyAuroraOutcome(outcome) : null;

  const [detailsExpanded, setDetailsExpanded] = useState(() => {
    try {
      return sessionStorage.getItem(DETAILS_EXPANDED_KEY) === "true";
    } catch {
      return false;
    }
  });

  function toggleDetails() {
    setDetailsExpanded((prev) => {
      const next = !prev;
      try {
        sessionStorage.setItem(DETAILS_EXPANDED_KEY, String(next));
      } catch {
        /* unavailable */
      }
      return next;
    });
  }

  // Ticket 397 (#397): pure, testable presentation selection — filters to
  // qualifying (excellent/good/fair) bands only, in canonical order, capped
  // at six, with no backfill. Computed unconditionally so both the analytics
  // effects below and the render branch read the exact same derived state —
  // a persisted detailsExpanded=true can never cause ranking/map exposure
  // (or their analytics) when there is nothing qualifying to show.
  const display = useMemo(
    () =>
      selectAuroraDisplay({
        best: classification?.body?.best ?? null,
        alternatives: classification?.body?.alternatives,
        isPro,
      }),
    [classification, isPro],
  );

  // ── Analytics: exactly once per meaningful (requestKey, primary) identity ──
  const cardViewedRef = useRef(null);
  useEffect(() => {
    if (!classification || !requestKey) return;
    const key = `${requestKey}:${classification.primary}`;
    if (cardViewedRef.current === key) return;
    cardViewedRef.current = key;

    const isResultOutcome = classification.primary === "success" || classification.primary === "partial";

    trackEvent("northern_lights_card_viewed", {
      outcome: classification.primary,
      freshness: classification.freshness,
      band: classification.body?.best?.band ?? null,
      tier: isPro ? "pro" : "free",
      // Low-cardinality coarse result-state, only meaningful for
      // success/partial — genuinely improves observability of the #397
      // fix (was every request effectively "qualifying" before this ticket).
      resultState: isResultOutcome ? (display.hasQualifyingLocations ? "qualifying" : "all_poor") : null,
    });

    if (classification.primary === "domain_unavailable" || classification.primary === "no_darkness" || classification.primary === "contract_defect") {
      trackEvent("northern_lights_unavailable_viewed", { outcome: classification.primary, tier: isPro ? "pro" : "free" });
    }
    if (classification.freshness === "stale") {
      trackEvent("northern_lights_stale_viewed", { outcome: classification.primary, tier: isPro ? "pro" : "free" });
    }
  }, [classification, requestKey, isPro, display.hasQualifyingLocations]);

  // Aligned with actual rendered exposure (approved prompt §7): fires only
  // when the corresponding surface is genuinely shown, never merely because
  // details are expanded — display.showRanking/showMap already fold in
  // isPro, hasQualifyingLocations, and (for the map) the >=2-locations/
  // >=2-distinct-bands rule, so an all-poor state or a single/same-band
  // qualifying result can never fire these, expanded or not.
  const rankingViewedRef = useRef(null);
  useEffect(() => {
    if (!detailsExpanded || !requestKey || !display.showRanking) return;
    if (rankingViewedRef.current === requestKey) return;
    rankingViewedRef.current = requestKey;
    trackEvent("northern_lights_ranking_viewed", { tier: "pro" });
  }, [detailsExpanded, requestKey, display.showRanking]);

  const mapViewedRef = useRef(null);
  useEffect(() => {
    if (!detailsExpanded || !requestKey || !display.showMap) return;
    if (mapViewedRef.current === requestKey) return;
    mapViewedRef.current = requestKey;
    trackEvent("northern_lights_map_viewed", { tier: "pro" });
  }, [detailsExpanded, requestKey, display.showMap]);

  function handleDetailsToggle() {
    if (!detailsExpanded) trackEvent("northern_lights_details_opened", { tier: isPro ? "pro" : "free" });
    toggleDetails();
  }

  function handleUpgrade(source) {
    trackEvent("northern_lights_upgrade_clicked", { source, tier: "free" });
    if (typeof onUpgrade === "function") onUpgrade(source);
  }

  // Every hook above must run unconditionally on every render (Rules of
  // Hooks) — the seasonal early return happens only here, after all of them.
  if (!seasonActive) return null;

  return (
    <div className="mb-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-slate-700 dark:bg-slate-900" data-testid="nl-card">
      <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{t("nlCardTitle")}</h2>
      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{t("nlCardSubtitle")}</p>

      <div className="mt-2" role="status" aria-live="polite">
        {status !== "resolved" && (
          <div className="h-16 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" data-testid="nl-loading">
            <span className="sr-only">{t("nlLoading")}</span>
          </div>
        )}

        {status === "resolved" && classification?.primary === "transport_error" && (
          <div data-testid="nl-transport-error">
            <p className="text-sm text-slate-700 dark:text-slate-300">{t("nlTransportErrorBody")}</p>
            <button type="button" onClick={retry} className="mt-2 text-xs font-semibold underline">
              {t("nlRetry")}
            </button>
          </div>
        )}

        {status === "resolved" && classification?.primary === "contract_defect" && (
          <div data-testid="nl-contract-defect">
            <p className="text-sm text-slate-700 dark:text-slate-300">{t("nlContractDefectBody")}</p>
            <button type="button" onClick={retry} className="mt-2 text-xs font-semibold underline">
              {t("nlRetry")}
            </button>
          </div>
        )}

        {status === "resolved" && classification?.primary === "no_darkness" && (
          <div data-testid="nl-no-darkness">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{t("nlNoDarknessTitle")}</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{t("nlNoDarknessBody")}</p>
          </div>
        )}

        {status === "resolved" && classification?.primary === "domain_unavailable" && (
          <div data-testid="nl-unavailable">
            <p className="text-sm text-slate-700 dark:text-slate-300">{t("nlUnavailableBody")}</p>
            <button type="button" onClick={retry} className="mt-2 text-xs font-semibold underline">
              {t("nlRetry")}
            </button>
          </div>
        )}

        {status === "resolved" && (classification?.primary === "success" || classification?.primary === "partial") && (
          <AuroraResult
            t={t}
            lang={lang}
            theme={theme}
            classification={classification}
            isPro={isPro}
            detailsExpanded={detailsExpanded}
            onToggleDetails={handleDetailsToggle}
            onUpgrade={handleUpgrade}
            display={display}
            nowMs={now ? now().getTime() : Date.now()}
          />
        )}
      </div>
    </div>
  );
}

function AuroraResult({ t, lang, theme, classification, isPro, detailsExpanded, onToggleDetails, onUpgrade, display, nowMs }) {
  const body = classification.body;
  const isPartial = classification.primary === "partial";
  const isStale = classification.freshness === "stale";
  const staleAgo = isStale ? formatAgo(body.auroraCache?.sourceFetchedAt, t, nowMs) : null;

  if (!display.hasQualifyingLocations) {
    return (
      <AllPoorResult
        t={t}
        isPro={isPro}
        isPartial={isPartial}
        isStale={isStale}
        staleAgo={staleAgo}
        bestAvailable={display.bestAvailable}
        detailsExpanded={detailsExpanded}
        onToggleDetails={onToggleDetails}
      />
    );
  }

  const best = display.qualifyingLocations[0];
  const bandKey = auroraBandLabelKey(best?.band);
  const flags = Array.isArray(best?.flags) ? best.flags : [];
  const hasHighWind = flags.includes("high_wind");

  return (
    <div>
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{t(bandKey)}</span>
      </div>

      {(isPartial || isStale) && (
        <div className="mt-1 space-y-0.5">
          {isPartial && <p className="text-xs text-amber-700 dark:text-amber-300">{t("nlWarningPartial")}</p>}
          {isStale && staleAgo && (
            <p className="text-xs text-amber-700 dark:text-amber-300">{t("nlWarningStale").replace("{ago}", staleAgo)}</p>
          )}
        </div>
      )}

      {!isPro && (
        <div className="mt-2">
          <p className="text-xs text-slate-600 dark:text-slate-300">{t("nlFreeHint")}</p>
          <button
            type="button"
            onClick={() => onUpgrade("northern_lights_card")}
            className="mt-2 inline-flex items-center rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
          >
            {t("nlUpgradeCta")}
          </button>
        </div>
      )}

      {isPro && (
        <div className="mt-2">
          <p className="text-sm text-slate-700 dark:text-slate-300">
            <span className="font-semibold">{best.name}</span>
          </p>
          {hasHighWind && <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">{t("nlHighWindNote")}</p>}

          <button
            type="button"
            onClick={onToggleDetails}
            aria-expanded={detailsExpanded}
            aria-controls="nl-details-panel"
            className="mt-2 text-xs font-semibold text-slate-500 underline decoration-dotted underline-offset-2 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          >
            {detailsExpanded ? t("nlDetailsHide") : t("nlDetailsShow")}
          </button>

          {detailsExpanded && (
            <div id="nl-details-panel" className="mt-3 space-y-3">
              {Array.isArray(best.reasons) && best.reasons.length > 0 && (
                <ul className="list-disc pl-4 text-xs text-slate-700 dark:text-slate-300">
                  {best.reasons.map((r) => (
                    <li key={r}>{t(REASON_KEYS[r] || r)}</li>
                  ))}
                </ul>
              )}

              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t("nlViewingWindowLabel")} {t("nlNationalReferenceCaveat")}
              </p>

              <div>
                {/* #397: heading describes actual recommended/worthwhile
                    places — never "all locations checked" framing. */}
                <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300">{t("nlQualifyingHeading")}</h3>
                <ol className="mt-1 space-y-1 text-xs text-slate-700 dark:text-slate-300" aria-label={t("nlQualifyingHeading")}>
                  {display.qualifyingLocations.map((loc, idx) => (
                    <li key={loc.locationId} className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 px-2 py-1 dark:border-slate-700">
                      <span>
                        {idx + 1}. {loc.name}
                      </span>
                      <span className="text-slate-500 dark:text-slate-400">{t(auroraBandLabelKey(loc.band))}</span>
                    </li>
                  ))}
                </ol>
                {Array.isArray(body.excluded) && body.excluded.length > 0 && (
                  <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">{t("nlSomeExcludedNote")}</p>
                )}
              </div>

              {display.showMap && (
                <NorthernLightsMap
                  locations={display.qualifyingLocations.map((l) => ({ id: l.locationId, name: l.name, lat: l.lat, lon: l.lon, band: l.band }))}
                  selectedId={best.locationId}
                  onSelect={() => {}}
                  lang={lang}
                  t={t}
                  theme={theme}
                />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// #397: at most one canonical bestAvailable location, clearly labeled as the
// best of the checked poor options — never phrased/styled as a
// recommendation. Ranking list and map are always fully absent here,
// regardless of any persisted details-expanded preference.
function AllPoorResult({ t, isPro, isPartial, isStale, staleAgo, bestAvailable, detailsExpanded, onToggleDetails }) {
  const reasons = Array.isArray(bestAvailable?.reasons) ? bestAvailable.reasons : [];

  return (
    <div data-testid="nl-all-poor">
      <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{t("nlAllPoorTitle")}</p>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{t("nlAllPoorBody")}</p>

      {(isPartial || isStale) && (
        <div className="mt-1 space-y-0.5">
          {isPartial && <p className="text-xs text-amber-700 dark:text-amber-300">{t("nlWarningPartial")}</p>}
          {isStale && staleAgo && (
            <p className="text-xs text-amber-700 dark:text-amber-300">{t("nlWarningStale").replace("{ago}", staleAgo)}</p>
          )}
        </div>
      )}

      {/* Free: coarse guidance only, no identity, no upgrade CTA — nothing
          here would honestly entice an upgrade when no place qualifies. */}

      {isPro && bestAvailable && (
        <div className="mt-2">
          <button
            type="button"
            onClick={onToggleDetails}
            aria-expanded={detailsExpanded}
            aria-controls="nl-all-poor-details-panel"
            className="text-xs font-semibold text-slate-500 underline decoration-dotted underline-offset-2 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          >
            {detailsExpanded ? t("nlDetailsHide") : t("nlDetailsShow")}
          </button>

          {detailsExpanded && (
            <div id="nl-all-poor-details-panel" className="mt-2 space-y-1">
              <p className="text-xs text-slate-600 dark:text-slate-300">
                {t("nlAllPoorBestLabel")} <span className="font-semibold">{bestAvailable.name}</span> —{" "}
                {t(auroraBandLabelKey(bestAvailable.band))}
              </p>
              {reasons.length > 0 && (
                <ul className="list-disc pl-4 text-xs text-slate-700 dark:text-slate-300">
                  {reasons.map((r) => (
                    <li key={r}>{t(REASON_KEYS[r] || r)}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
