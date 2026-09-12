# Ticket 409 — Approved prompt v1

Approved by Jonesy in Initial prompt, Round 1. Execute only after the owner's Prompt approved handoff, with CURRENT.md at READY_FOR_CC and referencing this file. Follow docs/ai/README.md: set CC_IN_PROGRESS before implementation, write the execution report and set CC_COMPLETE. This approved file remains immutable.

Issue: https://github.com/robertmarvin72/icelandic-weather/issues/409 (OPEN, no comments when fetched). This is Phase 4: analytics plus actual production validation, including at least seven days of data. A local implementation PASS cannot establish the issue's full Definition of Done.

### Audit first

Read AGENTS.md, CLAUDE.md, docs/ai/README.md, CURRENT.md, the #413 Character & Voice Bible, #408 exposure correction and #412 locale implementation/report. Confirm current analytics and Weather Voice data flow before writing.

Verified current source:
- src/lib/analytics.js exposes trackEvent(name, data) through react-ga4; it sends only when VITE_GA_MEASUREMENT_ID exists and logs in DEV. No Weather Voice events currently originate in useWeatherVoice.
- WeatherVoiceCard already observes intersection >=0.5 plus document visibility, invalidates stale observers, and supplies an observed episode key to useWeatherVoice.onVisible.
- The hook validates the observed key against the current/resolved episode and deduplicates per mounted episode before recording history. Keys include site/day/language/engine outcome. Selection alone is not exposure.
- Both languages now contain 27 shared IDs; all CTA types remain null. The current homepage card offers no authored Weather Voice interaction. No fabricated interaction event or clickable mascot should be added.
- Engine severity 0–3 is expressive intensity. No situation safety classifier, voice_level field or separate safety-message routing exists. #413 explicitly leaves these unresolved. Shared HAZARDS_V1.rainWarn does not establish a safety signal.

Existing UI entrypoint is the standalone homepage card between the verdict and Northern Lights. Reuse it; do not add a surface.

### A. Implement reviewable instrumentation

1. Emit one canonical weather_voice_viewed event at the already-validated visible-exposure boundary. Reuse trackEvent; do not create a second observer or emit from render, selection, asset load, or a general effect. Both history and analytics must correspond to the actual observed/current presentation.
2. Explicit event contract: voice_id = displayed comment.id; language = is/en of that episode; severity = unchanged numeric 0–3; weather_type = canonical condition; surface = homepage_decision. No free text, site names, coordinates, user identity, raw forecast, full episode key or timestamps in the custom payload. Omit optional location_id and variant unless a concrete measurement need is demonstrated and reviewed; neither is required to answer this issue's core questions. Use GA4's existing users/device dimensions rather than sending a new identifier or viewport fingerprint. Do not label severity as safety level or manufacture a tone field from mood/severity.
3. At-most-once semantics are per observed episode within one mounted session, consistent with existing history: repeated intersection, rerender and StrictMode replay do not duplicate; genuine locale/site/day/outcome changes require their own observation. Revisiting an already-recorded episode in that mount remains deduplicated. Document this definition and the fact a real remount/page visit may produce a new impression. GA4 SDK invocation is not guaranteed network delivery; do not invent delivery acknowledgements or retry loops.
4. Ensure event context cannot drift to latest locale/site while observing old content. Keep #408's key validation, canceled-observer handling, hidden-document suppression, ratio threshold and provenance gates. Keep analytics failure isolated from rendering/history; a thrown analytics helper must not break visibility handling or cause repeated emission. Do not change cooldown or selection semantics to get cleaner metrics.
5. No weather_voice_interacted event while all authored CTAs are null. Record interaction measurement as not applicable, rather than reporting a zero interaction rate for a UI with no interaction. If live audit finds a real existing Weather Voice interaction, describe it before adding instrumentation; unrelated homepage buttons are not Weather Voice interactions.
6. Reuse existing configuration and internal/dev traffic conventions. Do not change global analytics filtering, consent, account settings or entitlement. Never transmit fake fixture events into live production GA4 merely to obtain a green screenshot. Local tests must mock the analytics helper/transport.

### B. Production validation artifact and execution boundaries

Create docs/analytics/weather-voice-production-validation.md with an event dictionary, exact exposure definition, known limitations and evidence tables. Distinguish local fixtures, observed live production data, and pending checks. Include build/revision/date provenance when verifiable; never treat local code as already deployed.

- Document required live matrix: desktop/mobile, IS/EN, light/dark, language switch and site switch, readable asset/comment, layout shift/overflow checks. Preserve existing silent conditions. Use real production forecast examples for the issue's weather categories and record forecast source/time, normalized daily inputs where available, current comment ID/language, expressive severity, assessment and evidence. Do not put this rich manual audit data into the analytics event.
- Record missing weather categories as not observed. Do not change thresholds, manufacture dangerous weather, or pass a fixture off as a production example. Tone review must use #413 and distinguish comfort/expressive severity from real hazard evidence. If a material mismatch is seen, record a concrete finding rather than silently tuning all 27 texts.
- Safety is a known outstanding dependency: absence of a classifier/routing means dangerous-weather safety compliance is not established by adding events or sampling benign conditions. Do not mark that acceptance item PASS without adequate evidence. Do not implement a safety classifier or relabel severity=3 during this task; report the exact blocker/needed separate scope decision.
- Provide a post-deployment GA4 checklist: DebugView, actual collected event parameters, duplicate checks, is/en, numeric severity, surface, desktop/mobile device categories and internal/admin traffic impact. Verify available access first; missing GA4 credentials/property access is pending external validation, not a reason to fabricate results or send data elsewhere. Browser network/SDK evidence alone does not prove GA4 report ingestion.
- Propose only useful event-scoped custom dimensions: language, weather_type, surface and severity if needed for categorical reports. Consider voice_id cardinality (currently 27) for repeat analysis. Do not create admin configuration automatically during code implementation; record property identity, intended changes and current state for a concrete later owner-controlled step. Built-in device/user fields need no duplicate custom dimensions.
- Define the observation window to begin after deployment AND instrumentation verification, with recorded UTC start/end and at least seven complete days. Keep results pending until elapsed time and real data substantiate them. Analyze impressions/users, impressions per user, language/device/severity/surface distribution, repeated IDs, sample size and manual weather mismatches; interaction rate is N/A until an interaction exists. Low sample is a limitation, not a product conclusion.

The owner controls commit/push/deployment. Do not push, deploy, wait seven days in a tool call, schedule an automation, or claim this window has elapsed during implementation. Gather read-only production evidence that is actually available and record remaining external steps. Do not send issue comments or create follow-up issues automatically: prepare concrete findings/draft issue text for the owner's later publishing handoff. The current request starts the workflow, not a recurring monitoring service.

### Scope and STOP conditions

Expected runtime changes: narrow hook/event adapter and targeted tests using the existing analytics helper. Documentation/workflow artifacts may be added. No scoring, weather thresholds/rules, raw/shared forecast, entitlements, checkout, assets, UI redesign, new libraries/backend, new text library, AI runtime copy or personalization. Existing root-cause-specific visibility bugs may be reported with a minimal proposed fix; do not use the broad production-validation wording to bypass these boundaries.

STOP and report before implementing safety classification/routing, changing existing event semantics outside Weather Voice, collecting location/user data, modifying GA4 admin settings or broadening into an unreviewed product change. Continue independent authorized instrumentation/documentation work while external validation remains pending.

### Tests and evidence

- Add real hook/card analytics integration tests: no event on selection, below-threshold/hidden observations, invalid data/provenance or silent content; one exact-payload event on valid exposure; no duplicate rerender/StrictMode; stale callbacks after locale/site change or unmount rejected; new observed episode gets correct language/ID; revisiting a recorded episode follows the documented dedup policy. Test helper-throw isolation and absence of PII/free text fields. Do not derive every expected assertion from the same implementation function.
- Run Weather Voice hook/card/App/exposure/content/engine/history/selector regressions and provenance/scoring-invariance tests. Run affected analytics tests, lint/build and diff whitespace checks. Keep SDK delivery tests distinct from GA4 ingestion verification.
- Retain reproducible local browser proof with mocked analytics transport for visible event counts/context, IS/EN switching and mobile/desktop under outputs/ticket-409-weather-voice-analytics-evidence/. Separately label any read-only live-production screenshots/observations. Missing access or deployed instrumentation must remain explicit.
- cc-report.md must list exact changes and commands, implementation outcome, each production acceptance item's evidence/pending status, safety blocker, and observation window status. Never summarize Phase 4 as complete merely because tests pass.

### Workflow completion contract

After approval and owner handoff CC follows READY_FOR_CC -> CC_IN_PROGRESS -> CC_COMPLETE for its execution report. Jonesy reviews implementation AND the honesty of pending acceptance items; Ripley performs final assessment. Full task CLOSED/PASS requires #409's production acceptance and >=7-day evidence, not just code readiness. If external deployment/access/observation or unresolved safety criteria prevent full completion, record the blocker and use the canonical BLOCKED workflow stage at final assessment, while distinguishing accepted implementation from unfinished Phase 4. Do not introduce a new stage or silently activate another ticket under the single-active-task rule. The owner can decide subsequent sequencing once these dependencies are concrete.
