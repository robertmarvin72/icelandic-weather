## Jonesy review — Round 1 (CC búinn)

**Verdict: PASS** (implementation / result-review level — Section A). See closing note on the correct terminal stage for the FULL ticket.

### Scope check

Full recursive mtime sweep of `src/` confirms the changed set is exactly what `cc-report.md` claims and nothing more: `src/hooks/useWeatherVoice.js` (10480→12473 bytes) and new `src/hooks/useWeatherVoice.analytics.test.jsx` (15316 bytes). Every other Weather Voice/Aurora/App file retained its exact prior mtime. No unauthorized scope expansion.

### A. Instrumentation — verified against live source, not the report's narrative

Read the full current `useWeatherVoice.js`. The `trackEvent("weather_voice_viewed", {...})` call sits inside `onVisible`, after `recordedEpisodesRef.current.add(key)` and `historyRef.current.recordShown(current, now())`, wrapped in try/catch. It is gated by every one of `onVisible`'s six pre-existing rejection checks (no key, mismatched observed key, mid-selection, non-show, already-recorded) — there is no second observer and no new trigger path. Payload is exactly `{voice_id: current.comment.id, language: langRef.current, severity: current.severity, weather_type: current.condition, surface: SURFACE_HOMEPAGE_DECISION}` — matches the approved contract (req. A2) with no free text, coordinates, site id, date, or full episode key. `langRef` follows the same always-latest-ref pattern already used for `episodeKeyRef`/`resolvedKeyRef`/`presentationRef`, so a stale closure can't report the wrong language. `recordedEpisodesRef.add(key)` happens before the `trackEvent` call, so a thrown analytics helper can't cause a retry/duplicate — consistent with req. A4's isolation requirement. No `weather_voice_interacted` event exists anywhere in the diff (req. A5) — correct, since all 27 comments still have `ctaType: null`.

This is a correct application of `docs/lessons/lesson-04-analytics-semantics-trigger-boundary.md` (read in the prompt-review round): the event fires at the same already-validated exposure boundary as history, not at selection/render/raw-engine-result.

### Tests — read the full new file, not just the report's count

`useWeatherVoice.analytics.test.jsx` (318 lines) contains all 16 claimed tests, and they are genuine, not tautological:
- No-event cases: selection alone, below-threshold (0.1/0.49), hidden document, mismatched/no observer, legitimately silent weather — 5 tests, each with a real reason the event must not fire.
- Exact-payload test asserts `Object.keys(payload).sort()` equals exactly the 5 approved fields and checks the literal object; a second assertion explicitly greps the serialized payload for absence of the site id, lat/lon, date string, and a `"|"` (ruling out a leaked full episode key).
- Dedup/at-most-once: repeated intersection/visibilitychange, StrictMode double-invoke, unchanged rerender — 3 tests.
- Stale-callback rejection: site change, locale change (asserting the stale IS observer is rejected *and* the new EN observer correctly reports `language: "en"`), unmount — 3 tests.
- New-episode attribution (site switch → 2 independently correct events), and the IS→EN→IS dedup test asserting exactly 2 events, not 3 — matches the documented per-mount dedup policy.
- Throw-isolation test: a throwing `trackEvent` mock still lets history record, doesn't propagate, and is recorded as exactly 1 attempted call (not 0) — this is the correct assertion given Vitest records mock calls regardless of the implementation throwing; the report's own "errors and fixes" section documents CC catching its own wrong initial assumption here, and the fix is correctly reflected in the final file.

### Real-browser evidence — independently reviewed, not fabricated

Read `verify-weather-voice-analytics.cjs` and `results.json` directly. The script is real Playwright: stubs `/api/campsites` and `/api/forecast` matching the established daily-row contract, watches actual outgoing requests for GA/tag-manager domains, and reads real DEV-mode console output (`analytics.js`'s unconditional `console.log("[event]", ...)`), which is the correct way to observe this locally since `VITE_GA_MEASUREMENT_ID` is genuinely absent from both `.env.local` and `.env.development.local` (confirmed directly — I grepped both files myself rather than trusting the report's claim; neither defines it, so `trackEvent`'s `if (gaId)` branch is dead locally and `gaRequestCount: 0` is expected behavior, not evidence of a working integration).

The results are internally consistent in a way that's hard to fake by accident: `eventsBeforeScroll: 0` → `eventsAfterFirstScroll: 1` → `eventsAfterSecondScroll: 1` across all 4 fixtures (correct dedup on scroll-away/scroll-back); the site-switch session goes from 1→2 events and the second event's `weather_type` is `cold` (matching the COLD fixture actually assigned to Site B in the stub, not a copy-paste of Site A's `excellent`) — this is strong evidence the click-through-to-Site-B flow genuinely executed rather than the script just re-running the same fixture; the lang-switch session's second event correctly reports `language: en`. Severities (0 for excellent, 1 for cold) match the engine's own mapping. No PII/coordinate/date fields appear in any logged payload.

### Section B — production-validation document

Read `docs/analytics/weather-voice-production-validation.md` in full (218 lines, 11 sections). It is honest throughout: the live-production matrix (11 rows) and per-category production examples (9 rows) are explicitly "Pending"/"Not observed," the observation window section makes no elapsed-time claim, and Section 6 states unhedged that the dangerous-weather safety-compliance acceptance item "cannot be marked PASS by this ticket, under any evidence this ticket could gather." Section 10's acceptance table correctly separates "Implementation PASS (local)" from items that are genuinely not established. No fabricated production observation, GA4 access, or elapsed-time claim anywhere.

### Conclusion

Everything CC's report claims for Section A (the reviewable-instrumentation implementation) holds up against independent inspection of the live diff, the new tests, and the real-browser evidence — no discrepancies found. The report's own honesty about Section B (production validation) being genuinely unstarted is accurate, not a hedge to paper over missing work.

Per `docs/ai/README.md` and the approved prompt's "Workflow completion contract," setting the workflow to `BLOCKED` is Ripley's action at final assessment, not mine — but for Ripley's benefit: the correct terminal stage for the FULL ticket is `BLOCKED`, not `CLOSED`, since #409's Definition of Done requires the ≥7-day production observation window and GA4 access verification, neither of which has started. This result review is a PASS on CC's execution against the approved prompt; it is not a claim that ticket #409 itself is complete.

## Ripley — Final assessment, Round 1 (2026-09-12)

**Implementation verdict: PASS. Full task verdict: BLOCKED.** Independently reviewed the hook diff, approved event contract, Jonesy's review, CC report, production-validation artifact and retained local results.json. Instrumentation uses the existing validated exposure boundary and five-field payload, with deduplication before the isolated analytics call. No new observer, interaction, safety classification or product behavior was introduced.

Independently reran the 15-file targeted Weather Voice/provenance/scoring-invariance command listed in CC's report: **332 tests passed**, exit 0. git diff --check passed with only LF/CRLF conversion notices. Full-suite, lint, build and local browser execution remain CC-reported; I reviewed retained local event-count evidence but did not rerun those checks. Local DEV console events and zero GA requests are evidence of local trigger behavior, not GA4 ingestion.

The code and validation document are ready for owner-controlled commit/deployment. The FULL issue cannot be closed: deployed revision and production smoke matrix are unverified; GA4 DebugView/report ingestion and property configuration/access remain unverified; the seven-day observation window has not started; real-weather examples remain uncollected; dangerous-weather safety/tone compliance remains an unresolved dependency from #413. No scheduled monitoring or elapsed observation period is implied.

CURRENT.md set to BLOCKED in accordance with the approved workflow completion contract. Resume production validation after the owner supplies deployment/GA4 evidence or access and resolves the safety-validation scope dependency. No implementation edits, commit, push, deployment, GA4 admin changes, issue publication or issue closure performed by this assessment.
