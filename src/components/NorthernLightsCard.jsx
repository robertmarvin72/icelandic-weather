// src/components/NorthernLightsCard.jsx
//
// Ticket 4 (#392) — compact, secondary Northern Lights decision surface.
// Ticket 397 (#397) — qualifying/all-poor presentation selection, canonical
// Aurora map consistency.
// Ticket 398 (#398) — dark "evening sky" visual identity, visual-state
// hierarchy, reason-summary tiles, temporary "New" badge.
//
// Consumes Ticket 3's canonical response unchanged: no scoring, ranking, or
// reinterpretation happens here. Gating (isFeatureAvailable) is
// presentation-only — the request/response is identical for Free and Pro.

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Sparkles } from "lucide-react";
import { isFeatureAvailable } from "../config/features";
import { trackEvent } from "../lib/analytics";
import { useAuroraDecision } from "../hooks/useAuroraDecision";
import { classifyAuroraOutcome } from "../lib/auroraDecisionClassify";
import { isAuroraSeason, todayEveningUtc } from "../lib/auroraSeason";
import { AURORA_CANDIDATE_LOCATION_IDS } from "../config/auroraCandidates";
import { selectAuroraDisplay } from "../lib/auroraDisplaySelection";
import { auroraBandLabelKey } from "../lib/auroraBandPresentation";
import { auroraVisualState, auroraVisualStateTokens, AURORA_VISUAL_STATES } from "../lib/auroraVisualState";
import { selectAuroraReasonSummaries } from "../lib/auroraReasonSummaries";
import { AURORA_NEW_BADGE_ENABLED } from "../config/auroraNewBadge";
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

// Dark "evening sky" surface — identical background/text in both page
// themes; only shadow/border separate the card from its surroundings
// (approved prompt §3). Never swaps to a light background in light mode.
const CARD_SHELL_CLASS =
  "relative overflow-hidden rounded-2xl border px-4 py-3 " +
  "bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 text-slate-100 " +
  "border-slate-800/70 shadow-lg " +
  "dark:border-slate-500/40 dark:shadow-md";

function formatAgo(iso, t, nowMs) {
  if (!iso) return null;
  const ms = nowMs - new Date(iso).getTime();
  if (!Number.isFinite(ms) || ms < 0) return null;
  const hours = Math.round(ms / 3600000);
  if (hours <= 0) return t("nlAgeLessThanHour");
  if (hours === 1) return t("nlAgeOneHour");
  return t("nlAgeHours").replace("{hours}", String(hours));
}

function CardHeader({ t, pill }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
      <div className="flex items-center gap-1.5">
        {/* Decorative — the adjacent title already names the feature, so
            the icon carries no independent meaning for assistive tech. */}
        <Sparkles aria-hidden="true" className="h-4 w-4 text-indigo-300" />
        <h2 className="text-sm font-semibold text-slate-100">{t("nlCardTitle")}</h2>
        {AURORA_NEW_BADGE_ENABLED && (
          <span className="rounded-full bg-indigo-400/20 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-indigo-200 ring-1 ring-inset ring-indigo-400/40">
            {t("nlNewBadge")}
          </span>
        )}
      </div>
      {pill && (
        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${pill.pillClass}`}>{t(pill.pillKey)}</span>
      )}
    </div>
  );
}

// Restrained, non-interactive, clipped-within-surface decorative glow.
// Unnecessary for understanding state — status pill/headline always carry
// the meaning in text.
function AccentGlow({ glowClass }) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full blur-2xl ${glowClass}`}
    />
  );
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

  const isResultState = status === "resolved" && (classification?.primary === "success" || classification?.primary === "partial");

  // Ticket 398: the visual-state pill only applies to usable success/partial
  // outcomes (approved prompt §5's hierarchy is explicitly scoped to those).
  // The band feeding it is always the canonical band actually being shown —
  // qualifyingLocations[0] when qualifying, bestAvailable (still poor) in
  // the all-poor case — never a fabricated or re-derived value.
  const resultBand = isResultState
    ? display.hasQualifyingLocations
      ? display.qualifyingLocations[0]?.band
      : display.bestAvailable?.band
    : undefined;
  const visualTokens = isResultState ? auroraVisualStateTokens(resultBand) : null;

  return (
    <div className={`mb-3 ${CARD_SHELL_CLASS}`} data-testid="nl-card">
      {visualTokens && <AccentGlow glowClass={visualTokens.accentGlowClass} />}
      <div className="relative">
        <CardHeader t={t} pill={visualTokens} />
        <p className="mt-0.5 text-xs text-slate-300/80">{t("nlCardSubtitle")}</p>

        <div className="mt-2" role="status" aria-live="polite">
          {status !== "resolved" && (
            <div className="h-16 animate-pulse rounded-lg bg-slate-800/60" data-testid="nl-loading">
              <span className="sr-only">{t("nlLoading")}</span>
            </div>
          )}

          {status === "resolved" && classification?.primary === "transport_error" && (
            <div data-testid="nl-transport-error">
              <p className="text-sm text-slate-200">{t("nlTransportErrorBody")}</p>
              <button type="button" onClick={retry} className="mt-2 text-xs font-semibold text-slate-200 underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300">
                {t("nlRetry")}
              </button>
            </div>
          )}

          {status === "resolved" && classification?.primary === "contract_defect" && (
            <div data-testid="nl-contract-defect">
              <p className="text-sm text-slate-200">{t("nlContractDefectBody")}</p>
              <button type="button" onClick={retry} className="mt-2 text-xs font-semibold text-slate-200 underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300">
                {t("nlRetry")}
              </button>
            </div>
          )}

          {status === "resolved" && classification?.primary === "no_darkness" && (
            <div data-testid="nl-no-darkness">
              <p className="text-sm font-medium text-slate-100">{t("nlNoDarknessTitle")}</p>
              <p className="mt-1 text-xs text-slate-300/80">{t("nlNoDarknessBody")}</p>
            </div>
          )}

          {status === "resolved" && classification?.primary === "domain_unavailable" && (
            <div data-testid="nl-unavailable">
              <p className="text-sm text-slate-200">{t("nlUnavailableBody")}</p>
              <button type="button" onClick={retry} className="mt-2 text-xs font-semibold text-slate-200 underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300">
                {t("nlRetry")}
              </button>
            </div>
          )}

          {isResultState && (
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
              visualTokens={visualTokens}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function StaleParialNotices({ t, isPartial, isStale, staleAgo }) {
  if (!isPartial && !(isStale && staleAgo)) return null;
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {isPartial && (
        <span className="rounded-full bg-amber-400/15 px-2 py-0.5 text-[11px] font-medium text-amber-200 ring-1 ring-inset ring-amber-400/30">
          {t("nlWarningPartial")}
        </span>
      )}
      {isStale && staleAgo && (
        <span className="rounded-full bg-amber-400/15 px-2 py-0.5 text-[11px] font-medium text-amber-200 ring-1 ring-inset ring-amber-400/30">
          {t("nlWarningStale").replace("{ago}", staleAgo)}
        </span>
      )}
    </div>
  );
}

function AuroraResult({ t, lang, theme, classification, isPro, detailsExpanded, onToggleDetails, onUpgrade, display, nowMs, visualTokens }) {
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
        visualTokens={visualTokens}
      />
    );
  }

  const best = display.qualifyingLocations[0];
  const flags = Array.isArray(best?.flags) ? best.flags : [];
  const hasHighWind = flags.includes("high_wind");
  const reasonSummaries = isPro ? selectAuroraReasonSummaries(best?.reasons) : [];
  const isGood = auroraVisualState(best?.band) === AURORA_VISUAL_STATES.GOOD;

  return (
    <div>
      <p className="text-lg font-bold leading-tight text-slate-50">{t(visualTokens.headlineKey)}</p>
      <p className="mt-1 text-sm text-slate-200">
        {isPro ? t("nlBestTonight").replace("{name}", best.name) : t(visualTokens.bodyKey)}
      </p>

      {hasHighWind && <p className="mt-1 text-xs text-amber-300">{t("nlHighWindNote")}</p>}

      {reasonSummaries.length > 0 && (
        <div className="mt-2 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
          {reasonSummaries.map((code) => (
            <div key={code} className="rounded-lg bg-white/5 px-2 py-1.5 text-xs text-slate-200 ring-1 ring-inset ring-white/10">
              {t(REASON_KEYS[code] || code)}
            </div>
          ))}
        </div>
      )}

      <StaleParialNotices t={t} isPartial={isPartial} isStale={isStale} staleAgo={staleAgo} />

      {!isPro && (
        <div className="mt-2">
          <p className="text-xs text-slate-300/80">{t("nlFreeHint")}</p>
          <button
            type="button"
            onClick={() => onUpgrade("northern_lights_card")}
            className="mt-2 inline-flex items-center rounded-full bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-slate-950 hover:bg-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
          >
            {t("nlUpgradeCta")}
          </button>
        </div>
      )}

      {isPro && (
        <div className="mt-3">
          <button
            type="button"
            onClick={onToggleDetails}
            aria-expanded={detailsExpanded}
            aria-controls="nl-details-panel"
            className="inline-flex items-center rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-slate-100 ring-1 ring-inset ring-white/15 hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
          >
            {detailsExpanded ? t("nlDetailsHide") : t(isGood ? "nlCtaGood" : "nlCtaFair")}
          </button>

          {detailsExpanded && (
            <div id="nl-details-panel" className="mt-3 space-y-3">
              {Array.isArray(best.reasons) && best.reasons.length > 0 && (
                <ul className="list-disc pl-4 text-xs text-slate-300">
                  {best.reasons.map((r) => (
                    <li key={r}>{t(REASON_KEYS[r] || r)}</li>
                  ))}
                </ul>
              )}

              <p className="text-xs text-slate-400">
                {t("nlViewingWindowLabel")} {t("nlNationalReferenceCaveat")}
              </p>

              <div>
                {/* #397: heading describes actual recommended/worthwhile
                    places — never "all locations checked" framing. */}
                <h3 className="text-xs font-semibold text-slate-300">{t("nlQualifyingHeading")}</h3>
                <ol className="mt-1 space-y-1 text-xs text-slate-200" aria-label={t("nlQualifyingHeading")}>
                  {display.qualifyingLocations.map((loc, idx) => (
                    <li key={loc.locationId} className="flex items-center justify-between gap-2 rounded-lg bg-white/5 px-2 py-1 ring-1 ring-inset ring-white/10">
                      <span>
                        {idx + 1}. {loc.name}
                      </span>
                      <span className="text-slate-400">{t(auroraBandLabelKey(loc.band))}</span>
                    </li>
                  ))}
                </ol>
                {Array.isArray(body.excluded) && body.excluded.length > 0 && (
                  <p className="mt-1 text-[11px] text-slate-400">{t("nlSomeExcludedNote")}</p>
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

// #397/#398: at most one canonical bestAvailable location, clearly labeled
// as the best of the checked poor options — never phrased/styled as a
// recommendation, never promoted into the collapsed headline/supporting
// sentence. Ranking list and map are always fully absent here, regardless
// of any persisted details-expanded preference.
function AllPoorResult({ t, isPro, isPartial, isStale, staleAgo, bestAvailable, detailsExpanded, onToggleDetails, visualTokens }) {
  const reasons = Array.isArray(bestAvailable?.reasons) ? bestAvailable.reasons : [];

  return (
    <div data-testid="nl-all-poor">
      <p className="text-lg font-bold leading-tight text-slate-50">{t(visualTokens.headlineKey)}</p>
      <p className="mt-1 text-sm text-slate-200">{t(visualTokens.bodyKey)}</p>

      <StaleParialNotices t={t} isPartial={isPartial} isStale={isStale} staleAgo={staleAgo} />

      {/* Free: coarse guidance only, no identity, no upgrade CTA — nothing
          here would honestly entice an upgrade when no place qualifies. */}

      {isPro && bestAvailable && (
        <div className="mt-2">
          <button
            type="button"
            onClick={onToggleDetails}
            aria-expanded={detailsExpanded}
            aria-controls="nl-all-poor-details-panel"
            className="text-xs font-semibold text-slate-300 underline decoration-dotted underline-offset-2 hover:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
          >
            {detailsExpanded ? t("nlDetailsHide") : t("nlDetailsShow")}
          </button>

          {detailsExpanded && (
            <div id="nl-all-poor-details-panel" className="mt-2 space-y-1">
              <p className="text-xs text-slate-300">
                {t("nlAllPoorBestLabel")} <span className="font-semibold text-slate-100">{bestAvailable.name}</span> —{" "}
                {t(auroraBandLabelKey(bestAvailable.band))}
              </p>
              {reasons.length > 0 && (
                <ul className="list-disc pl-4 text-xs text-slate-300">
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
