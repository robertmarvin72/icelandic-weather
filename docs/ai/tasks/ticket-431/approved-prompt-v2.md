# #431 — Approved corrective execution prompt v2

Date: 2026-10-01. Ripley final-assessment REVISE. This implements missing requirements already approved in v1 items 4 and 6. Retain all v1 boundaries and existing completed work. Read v1 and result-review.md before proceeding; do not re-execute or replace the initial implementation.

## Required corrections

1. Keep all NL access usable during loadingMe. For immediate user interaction events (night selection, details toggle, recommended-night action, location click), record tier/user_tier as unknown while loadingMe is true; after loading resolves use getUserTier(entitlements). Preserve existing exposure guards/deduplication and experiment metadata. Do not emit a second copy or retroactively relabel prior unknown events after resolution. Do not alter global getUserTier or entitlement semantics.
2. Instrument the existing aurora map marker action through NorthernLightsMap's onSelect callback currently supplied as a no-op by AuroraNightOutlook. Use a narrow NL callback to the controller and an event such as northern_lights_location_selected, with canonical location_id, selected_date, days_ahead, source, actual/unknown user_tier and business_model_experiment. Only record an actual user marker selection, never initial selection, map render, popup mount or rerender. Preserve marker popup behavior and generic campsite map analytics; no new UI, ranking click or share feature. Use bounded canonical IDs, no PII or raw URL.
3. Add regression tests exercising night/details/recommended-night actions while loading with missing initial entitlements, then resolution to Pro and Free. Assert unknown during loading, correct resolved tiers afterward, no duplicate event from resolution, continued access and unchanged requests. Test the real NL callback wiring for map marker selection, one event per action with correct selected-night metadata, no emission on exposure alone, and unchanged generic map behavior.
4. Update experiment-note.md and append a v2 section to cc-report.md documenting these corrections, commands and limitations. Retain history. New location event has no previous comparable baseline; unknown interactions must remain explicitly distinguishable in reporting. Keep actual launch/GA4 configuration pending.

## Validation / workflow

Run the new targeted tests plus affected feature/module/homepage/landing/map suites, lint and production build. Check marker interaction in the browser with deterministic fixtures and record local event evidence; do not claim live GA4 ingestion. Preserve prior browser evidence.

Verify CURRENT references v2 at READY_FOR_CC; set CC_IN_PROGRESS before editing, append report after validation and set CC_COMPLETE with its existing report path. Jonesy appends the next result review. No scoring, candidate/freshness, unrelated premium gate, backend, checkout, library or global analytics changes. No commit, push, deployment, external GA4 changes or issue closure.
