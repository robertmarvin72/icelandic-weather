// src/components/AuroraNightOutlook.jsx
//
// Ticket #423 Phase 2 / #425 — the selected-night presentation body for the
// shared three-night controller (NorthernLightsThreeNight.jsx), used on both
// the homepage and the landing page. Reuses the same canonical pure helpers
// the retired single-night NorthernLightsCard used
// (selectAuroraDisplay, auroraVisualState, auroraBandLabelKey,
// selectAuroraReasonSummaries, NorthernLightsMap) unchanged — no scoring,
// ranking, or reinterpretation happens here either. This is a sibling of
// NorthernLightsCard's internal AuroraResult/AllPoorResult, not a copy of
// its JSX: every string that would say "tonight" for a night that is not
// tonight uses a date-neutral or {when}-parameterized key instead (see
// translations.northernLights.js's "Ticket #423 Phase 2" section). The
// retired card's own copy/keys are untouched. `surface` only chooses the Free
// upgrade block: landing shows the locked-value marketing block, the
// homepage shows the compact hint plus a single upgrade button.

import React from "react";
import { Lock } from "lucide-react";
import { selectAuroraDisplay } from "../lib/auroraDisplaySelection";
import { auroraBandLabelKey } from "../lib/auroraBandPresentation";
import { auroraVisualState, auroraVisualStateTokens, AURORA_VISUAL_STATES } from "../lib/auroraVisualState";
import { selectAuroraReasonSummaries } from "../lib/auroraReasonSummaries";
import { AURORA_REASON_KEYS as REASON_KEYS } from "../lib/auroraReasonKeys";
import { formatAuroraDataAge } from "../lib/auroraFreshnessFormat";
import NorthernLightsMap from "./NorthernLightsMap";

// Date-neutral/when-parameterized text for the two visual states whose
// homepage keys hardcode "tonight" (GOOD, POOR). FAIR and NEUTRAL's
// existing headline/body keys are already date-neutral and are reused
// as-is — see translations.northernLights.js.
function resolveOutlookCopy(t, band) {
  const state = auroraVisualState(band);
  const tokens = auroraVisualStateTokens(band);
  if (state === AURORA_VISUAL_STATES.GOOD) {
    return { pillLabel: t(tokens.pillKey), pillClass: tokens.pillClass, headline: t("nlMultiHeadlineGood"), body: t("nlMultiBodyGood") };
  }
  if (state === AURORA_VISUAL_STATES.POOR) {
    return { pillLabel: t("nlMultiPillPoor"), pillClass: tokens.pillClass, headline: t("nlMultiHeadlinePoor"), body: t("nlMultiBodyPoor") };
  }
  if (state === AURORA_VISUAL_STATES.FAIR) {
    return { pillLabel: t(tokens.pillKey), pillClass: tokens.pillClass, headline: t(tokens.headlineKey), body: t(tokens.bodyKey) };
  }
  return { pillLabel: t(tokens.pillKey), pillClass: tokens.pillClass, headline: t(tokens.headlineKey), body: t("nlMultiBodyNeutral") };
}

function StaleParialNotices({ t, isPartial, isStale, staleAgo }) {
  if (!isPartial && !(isStale && staleAgo)) return null;
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {isPartial && (
        <span className="rounded-full bg-amber-400/15 px-2 py-0.5 text-[11px] font-medium text-amber-200 ring-1 ring-inset ring-amber-400/30">
          {t("nlMultiWarningPartial")}
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

// The computed pill is always rendered (Round 5): excellent keeps #414's
// purple treatment via auroraVisualStateTokens' override, never collapsed
// into "good".
function StatusPill({ copy }) {
  return (
    <span data-testid="nl3-status-pill" className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${copy.pillClass}`}>
      {copy.pillLabel}
    </span>
  );
}

// Truthful Aurora data update time: the response's own sourceFetchedAt only
// (never fetch completion time, never weather issuance). Missing/malformed
// stays explicitly unknown rather than invented.
function DataUpdatedLine({ t, sourceFetchedAt, nowMs }) {
  const fetchedMs = typeof sourceFetchedAt === "string" ? Date.parse(sourceFetchedAt) : NaN;
  const ago = Number.isFinite(fetchedMs) ? formatAuroraDataAge(sourceFetchedAt, t, Math.max(nowMs, fetchedMs)) : null;
  return (
    <p data-testid="nl3-data-updated" className="mt-2 text-[11px] text-slate-400">
      {ago ? t("nlMultiDataUpdated").replace("{ago}", ago) : t("nlMultiDataUpdatedUnknown")}
    </p>
  );
}

// Structurally identical to NorthernLightsCard's LandingLockedValue —
// receives no location/result data, so it cannot leak Pro-only content
// regardless of what the canonical result contains. Only the "best
// location" line's key differs (date-neutral here).
function LockedValue({ t, onUpgrade }) {
  const items = ["nlMultiLandingLockedBestLocation", "nlLandingLockedAlternatives", "nlLandingLockedReasons", "nlLandingLockedMap"];
  return (
    <div>
      <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-300/90">
        <Lock aria-hidden="true" className="h-3 w-3" />
        {t("nlLandingLockedHeading")}
      </p>
      <ul className="mt-1.5 space-y-1">
        {items.map((key) => (
          <li key={key} className="text-xs text-slate-300/80">
            {t(key)}
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={onUpgrade}
        className="mt-2 inline-flex items-center rounded-full bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-slate-950 hover:bg-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
      >
        {t("nlMultiLandingCtaPrimary")}
      </button>
      <p className="mt-1 text-[11px] text-slate-400">{t("nlLandingCtaNote")}</p>
    </div>
  );
}

/**
 * The selected-night body. Every prop describes ONLY the currently selected
 * slot — the caller (NorthernLightsThreeNight) is responsible for ensuring
 * `status`/`classification` are identity-matched to `when`/`date` (never a
 * stale prior slot's result) before rendering this component.
 */
export default function AuroraNightOutlook({
  t,
  lang,
  theme,
  status,
  classification,
  isPro,
  detailsExpanded,
  onToggleDetails,
  onUpgrade,
  onRetry,
  nowMs,
  when,
  surface = "landing",
}) {
  if (status !== "resolved") {
    return (
      <div className="h-16 animate-pulse rounded-lg bg-slate-800/60" data-testid="nl3-loading">
        <span className="sr-only">{t("nlLoading")}</span>
      </div>
    );
  }

  if (classification?.expired) {
    return (
      <div data-testid="nl3-expired">
        <p className="text-sm text-slate-200">{t("nlMultiExpiredBody")}</p>
        <DataUpdatedLine t={t} sourceFetchedAt={classification.sourceFetchedAt} nowMs={nowMs} />
        <button type="button" onClick={onRetry} className="mt-2 text-xs font-semibold text-slate-200 underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300">
          {t("nlRetry")}
        </button>
      </div>
    );
  }

  if (classification?.primary === "transport_error") {
    return (
      <div data-testid="nl3-transport-error">
        <p className="text-sm text-slate-200">{t("nlTransportErrorBody")}</p>
        <button type="button" onClick={onRetry} className="mt-2 text-xs font-semibold text-slate-200 underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300">
          {t("nlRetry")}
        </button>
      </div>
    );
  }

  if (classification?.primary === "contract_defect") {
    return (
      <div data-testid="nl3-contract-defect">
        <p className="text-sm text-slate-200">{t("nlContractDefectBody")}</p>
        <button type="button" onClick={onRetry} className="mt-2 text-xs font-semibold text-slate-200 underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300">
          {t("nlRetry")}
        </button>
      </div>
    );
  }

  if (classification?.primary === "no_darkness") {
    return (
      <div data-testid="nl3-no-darkness">
        <p className="text-sm font-medium text-slate-100">{t("nlMultiNoDarknessTitle")}</p>
        <p className="mt-1 text-xs text-slate-300/80">{t("nlNoDarknessBody")}</p>
        {classification.body && <DataUpdatedLine t={t} sourceFetchedAt={classification.body.auroraCache?.sourceFetchedAt} nowMs={nowMs} />}
      </div>
    );
  }

  if (classification?.primary === "domain_unavailable") {
    return (
      <div data-testid="nl3-unavailable">
        <p className="text-sm text-slate-200">{t("nlUnavailableBody")}</p>
        {classification.body && <DataUpdatedLine t={t} sourceFetchedAt={classification.body.auroraCache?.sourceFetchedAt} nowMs={nowMs} />}
        <button type="button" onClick={onRetry} className="mt-2 text-xs font-semibold text-slate-200 underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300">
          {t("nlRetry")}
        </button>
      </div>
    );
  }

  const isResultState = classification?.primary === "success" || classification?.primary === "partial";
  if (!isResultState) return null;

  const body = classification.body;
  const isPartial = classification.primary === "partial";
  const isStale = classification.freshness === "stale";
  const staleAgo = isStale ? formatAuroraDataAge(body.auroraCache?.sourceFetchedAt, t, nowMs) : null;

  const display = selectAuroraDisplay({ best: body.best, alternatives: body.alternatives, isPro });

  if (!display.hasQualifyingLocations) {
    const bestAvailable = display.bestAvailable;
    const copy = resolveOutlookCopy(t, bestAvailable?.band);
    const reasons = Array.isArray(bestAvailable?.reasons) ? bestAvailable.reasons : [];
    return (
      <div data-testid="nl3-all-poor">
        <StatusPill copy={copy} />
        <p className="mt-1 text-lg font-bold leading-tight text-slate-50">{copy.headline}</p>
        <p className="mt-1 text-sm text-slate-200">{copy.body}</p>
        <StaleParialNotices t={t} isPartial={isPartial} isStale={isStale} staleAgo={staleAgo} />
        <DataUpdatedLine t={t} sourceFetchedAt={body.auroraCache?.sourceFetchedAt} nowMs={nowMs} />
        {isPro && bestAvailable && (
          <div className="mt-2">
            <button
              type="button"
              onClick={onToggleDetails}
              aria-expanded={detailsExpanded}
              aria-controls="nl3-all-poor-details-panel"
              className="text-xs font-semibold text-slate-300 underline decoration-dotted underline-offset-2 hover:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
            >
              {detailsExpanded ? t("nlDetailsHide") : t("nlDetailsShow")}
            </button>
            {detailsExpanded && (
              <div id="nl3-all-poor-details-panel" className="mt-2 space-y-1">
                <p className="text-xs text-slate-300">
                  {t("nlAllPoorBestLabel")} <span className="font-semibold text-slate-100">{bestAvailable.name}</span> — {t(auroraBandLabelKey(bestAvailable.band))}
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

  const best = display.qualifyingLocations[0];
  const copy = resolveOutlookCopy(t, best.band);
  const flags = Array.isArray(best?.flags) ? best.flags : [];
  const hasHighWind = flags.includes("high_wind");
  const reasonSummaries = isPro ? selectAuroraReasonSummaries(best?.reasons) : [];
  const isGood = auroraVisualState(best?.band) === AURORA_VISUAL_STATES.GOOD;

  return (
    <div data-testid="nl3-result">
      <StatusPill copy={copy} />
      <p className="mt-1 text-lg font-bold leading-tight text-slate-50">{copy.headline}</p>
      <p className="mt-1 text-sm text-slate-200">{isPro ? t("nlMultiBestOn").replace("{when}", when).replace("{name}", best.name) : copy.body}</p>

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
      <DataUpdatedLine t={t} sourceFetchedAt={body.auroraCache?.sourceFetchedAt} nowMs={nowMs} />

      {!isPro && (
        <div className="mt-2">
          {surface === "homepage" ? (
            <>
              <p className="text-xs text-slate-300/80">{t("nlMultiFreeHint")}</p>
              <button
                type="button"
                onClick={() => onUpgrade("northern_lights_card")}
                className="mt-2 inline-flex items-center rounded-full bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-slate-950 hover:bg-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
              >
                {t("nlUpgradeCta")}
              </button>
            </>
          ) : (
            <LockedValue t={t} onUpgrade={() => onUpgrade("northern_lights_card")} />
          )}
        </div>
      )}

      {isPro && (
        <div className="mt-3">
          <button
            type="button"
            onClick={onToggleDetails}
            aria-expanded={detailsExpanded}
            aria-controls="nl3-details-panel"
            className="inline-flex items-center rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-slate-100 ring-1 ring-inset ring-white/15 hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
          >
            {detailsExpanded ? t("nlDetailsHide") : t(isGood ? "nlCtaGood" : "nlCtaFair")}
          </button>

          {detailsExpanded && (
            <div id="nl3-details-panel" className="mt-3 space-y-3">
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
                <h3 className="text-xs font-semibold text-slate-300">{t("nlMultiQualifyingHeading")}</h3>
                <ol className="mt-1 space-y-1 text-xs text-slate-200" aria-label={t("nlMultiQualifyingHeading")}>
                  {display.qualifyingLocations.map((loc, idx) => (
                    <li key={loc.locationId} className="flex items-center justify-between gap-2 rounded-lg bg-white/5 px-2 py-1 ring-1 ring-inset ring-white/10">
                      <span>
                        {idx + 1}. {loc.name}
                      </span>
                      <span className="text-slate-400">{t(auroraBandLabelKey(loc.band))}</span>
                    </li>
                  ))}
                </ol>
                {Array.isArray(body.excluded) && body.excluded.length > 0 && <p className="mt-1 text-[11px] text-slate-400">{t("nlSomeExcludedNote")}</p>}
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
