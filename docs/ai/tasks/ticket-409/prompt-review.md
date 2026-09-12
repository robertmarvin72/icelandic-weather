# Ticket 409 — Weather Voice analytics and production validation

## Ripley — Initial prompt, Round 1 (2026-09-12)

Review material only. Jonesy: append APPROVED or REVISE, particularly addressing impression identity, safety-validation limitations and the multi-stage completion contract. No implementation from this file.

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

## Jonesy review — Initial prompt, Round 1 (Initial prompt tilbúið)

**Verdict: APPROVED**

### Verification against live source

Read `src/lib/analytics.js`, `useWeatherVoice.js`, `WeatherVoiceCard.jsx`, `weatherVoicePresentation.js`, `weatherVoiceContent.js`, and grepped every `trackEvent(` call site in `src/`. Every "Verified current source" claim holds exactly:

- `analytics.js`'s `trackEvent(name, data = {})` sends via `ReactGA.event(name, data)` only `if (gaId)` (i.e. `VITE_GA_MEASUREMENT_ID` present), and always `console.log`s in DEV — confirmed line-for-line. No `weather_voice_*` event exists anywhere today (grepped `trackEvent\(` across the whole `src/` tree — 20+ call sites, none Weather Voice).
- `WeatherVoiceCard.jsx`'s intersection observer uses `INTERSECTION_THRESHOLD = 0.5`, checks `document.visibilityState === "visible"`, and each effect instance's local `cancelled` flag invalidates a torn-down observer's queued callback — all confirmed by direct re-read (unchanged since my ticket-412 review). `onVisible(observedEpisodeKey)` is the exact call passed up.
- `useWeatherVoice.js`'s `onVisible` rejects a mismatched `observedEpisodeKey`, a mid-selection state, a non-`show` presentation, and an already-recorded episode (`recordedEpisodesRef`) before calling `historyRef.current.recordShown(current, now())` — this is genuinely the single validated exposure boundary, confirmed unchanged from #408's Revision 3 and untouched by #412. `SURFACE_HOMEPAGE_DECISION = "homepage_decision"` is already a defined constant in this file, directly reusable for the event's `surface` field rather than a new literal.
- `WEATHER_VOICE_COMMENT_METADATA`'s 27 entries (verified again directly) all omit `ctaType`, so every real entry resolves to `DEFAULT_CTA_TYPE = null` via `normalizeMetadata`. `resolveWeatherVoiceCta` returns `null` whenever `ctaType` is falsy, so `WeatherVoiceCard`'s optional button never renders for any of today's 27 IS/EN comments — confirmed "no authored Weather Voice interaction" is accurate, not assumed.
- No `voice_level` field or safety-classification signal exists anywhere in the Weather Voice runtime (consistent with my own direct verification across #413/#412) — severity remains expressive-intensity-only, and `HAZARDS_V1.rainWarn`'s reuse as `RAIN_HEAVY_MM` is a shared numeric threshold, not a safety-classification result flowing into selection (re-confirmed architecture from #413's corrected Bible).

### Consistency with established codebase conventions

Grepped every `trackEvent(` call site: the codebase already uses a consistent `*_viewed` naming convention for exposure events (`northern_lights_card_viewed`, `recommendation_viewed`, `aurora_landing_viewed`) and reserves `*_clicked`/interaction-style names strictly for real, authored interactions (`better_location_upgrade_clicked`, `northern_lights_upgrade_clicked`). `weather_voice_viewed` fits this convention exactly, and requirement 5's refusal to fabricate a `weather_voice_interacted` event for a CTA-less card is the correct continuation of that same discipline, not an invented rule.

`docs/analytics/` already contains two prior GA4 production-readiness audits (`free-tier-measurement-readiness-audit.md`, `free-to-pro-ga4-audit.md`), so `docs/analytics/weather-voice-production-validation.md` fits an established documentation pattern rather than inventing a new one, and there's no naming collision.

### Trigger-boundary correctness (the specific thing I was asked to scrutinize)

`docs/lessons/lesson-04-analytics-semantics-trigger-boundary.md` records a hard-won prior-ticket rule: an analytics event must fire at the same semantic layer where the *canonical* (actually-displayed) state becomes final — never at a raw/intermediate engine verdict — and must dedupe on that canonical value itself. The approved prompt's design is a correct, direct application of that rule: it explicitly forbids emitting from render, selection, asset load, or "a general effect," and requires the event to fire only at the already-validated `onVisible` boundary, which is downstream of every rejection check (mismatched episode, mid-selection, non-`show`, already-recorded). This is exactly "the canonical state the user actually sees," not the engine's raw result — the same distinction lesson-04 warns against getting wrong. Placing the actual `trackEvent` call alongside the existing `historyRef.current.recordShown()` call inside `onVisible` (rather than a second observer) is architecturally the only correct location, and the approved prompt says exactly that.

### Impression-identity assessment

The proposed event payload (`voice_id`, `language`, `severity`, `weather_type`, `surface`) is a safe derived subset of the episode identity, not the raw key: `episodeKey` itself (site/day/lang/condition/mood/severity, joined) is never sent, and no site name/coordinates/timestamp/free text is included — consistent with the constraint against transmitting `location_id`/raw forecast/full episode key. Reusing GA4's built-in device/user dimensions instead of a new identifier avoids inventing an ad hoc fingerprint. This is a sound, minimal, privacy-conscious event shape that still answers the issue's stated questions (language/device/severity/surface distribution, repeated IDs).

### Safety-validation limitations (the second thing I was asked to scrutinize)

The prompt is explicit and correctly conservative: no classifier, no `voice_level`, no relabeling severity as a safety signal, and — critically — an explicit instruction not to mark the safety-compliance acceptance item PASS "without adequate evidence," which does not exist and cannot be manufactured by this ticket. This is a direct, honest continuation of #413's corrected position (compliance "neither confirmed nor refuted") rather than a new claim, and correctly treats "we now have analytics" as orthogonal to "we now have a safety classifier" — the two are not conflated anywhere in the prompt.

### Multi-stage completion contract (the third thing I was asked to scrutinize)

Verified against `docs/ai/README.md` directly: `BLOCKED` is a real canonical stage (line 114's stage list), set by Ripley's final assessment exactly as the prompt describes ("Ripley reads that file, performs the final assessment... `CLOSED` on `PASS`... or `BLOCKED`" — README line 109). The prompt's completion contract — CC can deliver a code-level PASS on requirement A while requirement B (real deployment + ≥7 days of live GA4 data + owner-controlled access) remains genuinely pending, and the workflow's correct terminal state for that combination is `BLOCKED`, not a fabricated `CLOSED` — is not inventing a new stage or bypassing the single-active-task rule; it's using the existing stage exactly as documented. The instruction to distinguish "accepted implementation" from "unfinished Phase 4" gives Ripley (and Róbert) a clean signal rather than forcing an artificial full-PASS or false REVISE.

### Scope discipline

The expected-changes list (narrow hook/event adapter, targeted tests, documentation) and STOP list (no safety classification/routing, no GA4 admin changes, no scoring/threshold/entitlement changes, no new text library) are consistent with everything I verified in source — nothing in section A requires touching the engine, selector, rules, or metadata registry, and section B is explicitly read-only/documentation work with no commit/push/deploy permitted. The test list (no event on selection/below-threshold/hidden/invalid/silent, exact-payload on valid exposure, no duplicate across rerender/StrictMode, stale-callback rejection after locale/site change, helper-throw isolation, no PII/free-text fields) mirrors the same evidence discipline that caught real problems earlier in this session (#408, #412) and would genuinely catch a wrong-trigger-boundary regression, not just restate the implementation.

### Conclusion

**APPROVED.** Every "verified current source" claim holds up against direct inspection, the instrumentation design correctly applies this codebase's own hard-won trigger-boundary lesson, the event payload is a safe minimal derivation of episode identity, the safety-validation limitations are handled with the same honesty #413's correction cycle established, and the multi-stage completion contract uses `BLOCKED` exactly as `docs/ai/README.md` defines it rather than inventing new workflow semantics. Proceed as normal: Róbert's "Prompt approved" moves `CURRENT.md` to `READY_FOR_CC`.
