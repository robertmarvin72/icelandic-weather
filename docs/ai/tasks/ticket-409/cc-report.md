# Ticket 409 — CC report

Executed per `docs/ai/tasks/ticket-409/approved-prompt-v1.md` (Jonesy APPROVED, Initial prompt Round 1). **This ticket has two genuinely different completion levels and this report keeps them explicitly separate, per the approved prompt's own instruction: never summarize Phase 4 as complete merely because tests pass.**

- **Section A (implement reviewable instrumentation): implementation PASS, verified locally.**
- **Section B (production validation): the artifact is written; the actual production validation it describes has NOT occurred** — it requires deployment, GA4 access, and a ≥7-day observation window, none of which are available to CC in this session or controllable by CC at all (owner controls commit/push/deploy).

## Pre-edit audit (read-only, before any edit)

Read `AGENTS.md`, `CLAUDE.md`, `docs/ai/README.md`, `docs/ai/CURRENT.md`, `docs/weather-voice/character-and-voice-bible.md` (#413), the #408 exposure-lifecycle correction, and the #412 locale cc-report first. Then re-verified every "Verified current source" claim directly:

- `src/lib/analytics.js`'s `trackEvent(name, data = {})` sends via `ReactGA.event(name, data)` only `if (gaId)` (`VITE_GA_MEASUREMENT_ID` present), and unconditionally `console.log`s in DEV — confirmed line-for-line, unchanged.
- Grepped `trackEvent\(` across all of `src/` for any existing `weather_voice_*` event — **zero matches**, confirmed no such event exists today.
- `WeatherVoiceCard.jsx`'s intersection observer (`INTERSECTION_THRESHOLD = 0.5`, `document.visibilityState === "visible"` check, per-effect-closure `cancelled` flag invalidating a torn-down observer's queued callback) — confirmed unchanged since Ticket 412's own re-read.
- `useWeatherVoice.js`'s `onVisible` — confirmed it rejects a mismatched `observedEpisodeKey`, a mid-selection state, a non-`show` presentation, and an already-recorded episode, before calling `historyRef.current.recordShown(current, now())`. This is the single, already-validated exposure boundary — confirmed unchanged from #408 Revision 3 and untouched by #412.
- `weatherVoiceContent.js`'s `WEATHER_VOICE_COMMENT_METADATA` — all 27 entries (now translated into both languages by #412) omit `ctaType`, resolving to `null`; `resolveWeatherVoiceCta` returns `null` for falsy `ctaType` — confirmed no authored interaction exists on any of today's 27 comments.
- No `voice_level` field or safety-classification signal exists anywhere in the Weather Voice runtime — re-confirmed consistent with #413/#412.
- Read `docs/lessons/lesson-04-analytics-semantics-trigger-boundary.md` — the hard-won rule that an analytics event must fire at the same semantic layer where the canonical/actually-displayed state becomes final, never a raw/intermediate trigger, and must dedupe on that canonical value. `onVisible` is exactly that boundary here (downstream of every rejection check), so this is the only correct call site — confirmed before writing any code, not assumed.

No STOP condition was triggered: nothing required touching the engine, selector, rules, metadata registry, or GA4 admin settings; no safety classification was implemented; no existing event's semantics changed; no location/user data was collected.

## Section A — instrumentation implementation

### Exact changes

1. **`src/hooks/useWeatherVoice.js`**:
   - Imported `trackEvent` from `../lib/analytics`.
   - Added `langRef` (updated every render, same pattern as the existing `episodeKeyRef`/`resolvedKeyRef`/`presentationRef`) so `onVisible`'s stable callback always reads the CURRENT language at call time, consistent with how it already reads the current episode/resolved-state/presentation.
   - Inside `onVisible`, **after** `recordedEpisodesRef.current.add(key)` and `historyRef.current.recordShown(current, now())` (both unchanged), added a `try { trackEvent("weather_voice_viewed", {...}) } catch { /* isolated */ }` call. The dedup `.add(key)` happening BEFORE the analytics attempt means a thrown analytics helper can never cause a retry or duplicate emission for that episode — it only loses that one impression, isolated from history (already recorded) and rendering (unaffected).
   - Updated the file's header comment to describe the new event; no other logic changed. Episode-key validation, canceled-observer handling, hidden-document suppression, the 0.5 ratio threshold, and provenance gates are all byte-for-byte unchanged — confirmed by diff review before finalizing.
2. **No other runtime file changed.** `WeatherVoiceCard.jsx`, `App.jsx`, `weatherVoiceEngine.js`, `weatherVoiceRules.js`, `weatherVoiceSelector.js`, `weatherVoiceContent.js`, `weatherVoiceTypes.js`, and `weatherVoicePresentation.js` are untouched — no second observer was created, and nothing about selection/cooldown semantics changed to make metrics "cleaner."
3. **No `weather_voice_interacted` event was added** — verified (again) that every one of the 27 comments has `ctaType: null`; recorded as "not applicable" in the production-validation doc, never as a fabricated zero-interaction-rate claim.

### Event contract (delivered exactly as specified)

`voice_id` = displayed `comment.id`; `language` = `is`/`en` of that episode; `severity` = unchanged numeric 0–3; `weather_type` = canonical condition; `surface` = `"homepage_decision"` (the literal, already-existing `SURFACE_HOMEPAGE_DECISION` constant, not a new literal). No free text, site names, coordinates, user identity, raw forecast, full episode key, or timestamps. `location_id` and `variant` were omitted — neither is required to answer the issue's stated questions, and no concrete measurement need was identified for either. GA4's own built-in device/user dimensions are relied on rather than a new identifier or viewport fingerprint.

### Tests added

**New file `src/hooks/useWeatherVoice.analytics.test.jsx`** — real hook + real card integration, mocked `trackEvent`, deterministic fake `IntersectionObserver`/storage/time/RNG (mirrors `useWeatherVoice.exposureLifecycle.test.jsx`'s harness exactly, since the analytics call sits at the identical boundary). **16 tests**, deliberately not all derived from the same implementation function:

- No event on: selection alone; below-threshold intersection (0.1, 0.49); hidden document with an eligible intersection; mismatched provenance (no card/observer at all); legitimately silent/ordinary weather (no card/observer at all).
- Exact payload on valid exposure: asserts the literal `{voice_id, language, severity, weather_type, surface}` object (deterministic `rng: () => 0` → `"excellent_01"`, verified against real selector output before writing the assertion — see "errors and fixes" below), plus explicit substring checks that the payload contains none of the site ID, coordinates, date, or a `|`-joined episode key.
- History and analytics correspond to the same real observation (never diverge) — cross-checked against `storage`'s own persisted record.
- At-most-once: repeated intersection + `visibilitychange` triggers; StrictMode's synthetic double-invoke; an unchanged rerender.
- Stale-callback rejection: site change, locale change (with the NEW episode still firing correctly, asserting `language: "en"` specifically), unmount (no throw, no emission).
- A genuinely new episode (site change) gets its own independently-attributed second event.
- IS→EN→IS dedup policy: exactly 2 events (not 3) — the third step revisits the IDENTICAL episode key from step 1 (same site/day/language/outcome), which the documented policy correctly deduplicates rather than treating as a fresh impression.
- Analytics-helper-throw isolation: a throwing `trackEvent` still lets history record, does not throw out of the observer callback, and is not retried on a subsequent trigger for the same episode.

### Errors and fixes during this ticket

1. **Wrong assumed `voice_id` in the exact-payload test.** Initially wrote `"excellent_02"` as the expected deterministic selection for `rng: () => 0`, by analogy with an unrelated fixture ID from an earlier ticket, without checking this file's own default `Harness` `rng`. Verified the real selector's actual behavior with a temporary throwaway vitest check (`getWeatherVoiceLibrary("is")` + `selectWeatherVoiceComment` with the exact same inputs) before finalizing — the real deterministic result is `"excellent_01"` (first-by-ID-ascending fallback). Fixed the assertion to match; the temporary check file was deleted immediately after.
2. **Wrong expected call count in the helper-throw-isolation test.** Initially asserted `weatherVoiceViewedCalls()` would be `0` after the throwing call, reasoning the throw meant "no call happened" — incorrect: a Vitest mock records a call in `.mock.calls` regardless of whether its implementation throws, since the hook's own `try/catch` catches the throw internally. Fixed to assert exactly 1 recorded call (the one attempted, throwing, caught) and confirmed a second trigger for the same episode does not add a second attempt (dedup runs before the analytics call).

### Regression / lint / build / diff-check

1. Targeted Weather Voice regression set (15 files): `npx vitest run src/lib/weatherVoiceEngine.test.js src/lib/weatherVoiceRules.test.js src/lib/weatherVoiceSelector.test.js src/lib/weatherVoiceHistory.test.js src/lib/weatherVoiceTypes.test.js src/lib/weatherVoicePresentation.test.js src/lib/weatherVoiceContent.test.js src/hooks/useWeatherVoice.test.js src/hooks/useWeatherVoice.exposureLifecycle.test.jsx src/hooks/useWeatherVoice.analytics.test.jsx src/components/WeatherVoiceCard.test.jsx src/App.weatherVoiceIntegration.test.jsx src/hooks/useForecast.provenance.test.js src/hooks/useForecast.scoringInvariance.test.js src/components/HomeDecisionCard.test.jsx` → **15 files, 332 tests passed**.
2. Full suite: `npm test -- --run` → **110 files, 1439 tests passed** (up from 1423 before this ticket — +16 new tests, the new analytics file). No flakes.
3. `npm run lint` → exit 0, no output.
4. `npm run build` → succeeded, same pre-existing chunk-size advisory, no new errors.
5. `git diff --check` → exit 0, only pre-existing informational LF→CRLF autocrlf notices (`docs/ai/CURRENT.md`, `useWeatherVoice.js`) — no real whitespace errors.

## Section B — production validation artifact

Created `docs/analytics/weather-voice-production-validation.md` with: the full event dictionary (including the explicit `weather_voice_interacted` N/A recording); the exact exposure/impression definition (matching the code's actual six-condition gate, at-most-once-per-episode-per-mount semantics, and the explicit "GA4 SDK invocation ≠ delivery" caveat); a local-implementation evidence table clearly labeled as local, not production; the required live-production matrix (11 rows, all recorded PENDING); a per-condition table for all nine weather categories, all recorded "Not observed" rather than fabricated or substituted with a local fixture; an explicit, unhedged safety-compliance section stating this ticket cannot and does not establish dangerous-weather safety compliance; a post-deployment GA4 checklist (8 concrete steps, none run — no GA4 access this session); a custom-dimensions proposal (language/weather_type/surface always recommended, severity conditional, voice_id explicitly flagged as lower-priority given its cardinality) with an explicit note that no GA4 admin configuration was created; the observation-window definition (start/end left blank/pending, analysis plan specified for when real data exists); a full acceptance-item status table separating "implementation PASS (local)" from "PENDING"; and draft owner-facing text for a future issue comment, explicitly marked as **not sent**.

**Real production forecast examples were not collected** — this session had no deployed instance or live production API access; every one of the nine categories is honestly recorded as "Not observed" rather than substituted with a local fixture passed off as a production example.

**GA4 checklist items were not run** — no GA4 property credentials or dashboard access were available or used this session; every checklist item is recorded as pending, not skipped-and-assumed-fine.

**No GA4 admin configuration was created or modified.** No custom dimension was actually added — only proposed, with the property's exact identity flagged as unverified this session.

**No issue comment was posted and no follow-up issue was created.** Draft text is prepared in the document's final section for the owner's own later use.

## Safety blocker (restated, not resolved)

Unchanged from #413/#412: no `voice_level` field, no safety-classification signal, no `weatherSafetyMessages`-equivalent routing exists. This ticket's `severity` field in the analytics payload is the same expressive-intensity-only value — it is not, and must never be read as, a safety signal. Adding analytics or observing benign production weather examples (once collected) cannot establish dangerous-weather safety compliance; that remains an explicit, separately-scoped, unresolved dependency. No classifier was implemented and no severity relabeling occurred in this ticket, per the approved prompt's explicit instruction.

## Observation window status

**Not started.** Per the approved prompt, it can only begin after real deployment AND live instrumentation verification (GA4 DebugView, at minimum) — neither has happened. No UTC start/end time is recorded; none is estimated or implied. No claim is made that any window has elapsed, is elapsing, or will elapse on any particular schedule — that is entirely the owner's subsequent, external action.

## Local browser evidence (retained)

Script: `outputs/ticket-409-weather-voice-analytics-evidence/verify-weather-voice-analytics.cjs`. Real Chromium, real App/hook/card, stubbed `/api/*` routes (read `useForecast.js`'s parsing contract before writing the stub, matching this session's established convention). Analytics transport confirmed absent locally (no `VITE_GA_MEASUREMENT_ID` in either `.env.local`/`.env.development.local`) — zero real network requests to any Google Analytics/tag-manager domain occurred across every fixture (`gaRequestCount: 0` throughout). Evidence gathered from the DEV-only console log line instead, plus screenshots. Six fixtures run: desktop 1280×480 and mobile 390×480 (short height deliberately, so the card starts below the fold — a taller viewport put the card inside the initial view, making a "before scroll = no event" checkpoint meaningless, the same lesson learned in Ticket 408 Revision 3's own real-browser recheck) × IS/EN × light/dark; a real site-switch session (real `CampsitePicker` dropdown, scoped via a `role="dialog"` selector after a Leaflet-marker accessible-name collision was found and fixed mid-script — see below); a real language-switch session (real Settings-panel toggle). Every fixture showed: **zero** events before the card was genuinely visible, **exactly one** event immediately after real scroll-into-view with the correct payload, **no duplicate** after scrolling away and back, and a genuinely new, correctly-attributed second event after a real site or language switch. All screenshots and `results.json` retained under `outputs/ticket-409-weather-voice-analytics-evidence/`.

**Script debugging note:** the site-switch fixture's initial selector (`getByRole("button", { name: SITE_A.name })`) hit a strict-mode ambiguity against a real Leaflet map marker that now also carries an accessible name matching the site name (Ticket 414's own aria-label addition) — fixed by scoping to the `CampsitePicker`'s toggle button via its `title` attribute and the dropdown's own `role="dialog"` panel. This is a script-robustness fix only; no application code was touched by it.

## Exact changed/added files

- `src/hooks/useWeatherVoice.js` — instrumentation (above).
- `src/hooks/useWeatherVoice.analytics.test.jsx` — new, 16 tests.
- `docs/analytics/weather-voice-production-validation.md` — new.
- `docs/ai/CURRENT.md` — workflow stage.
- `outputs/ticket-409-weather-voice-analytics-evidence/` — new (script, screenshots, results.json).

No `src/components/WeatherVoiceCard.jsx`, `src/App.jsx`, scoring/threshold/forecast/entitlement/checkout/asset/UI-redesign/new-library/backend file was touched.

## Confirmation

`docs/ai/CURRENT.md` updated: `Stage: CC_COMPLETE` (this is CC's own execution-report completion for its authorized scope — see the workflow completion contract below for the FULL ticket's correct terminal state, which is not CC's to set). **Not committed. Not pushed. Not deployed. No GitHub issue comment posted. No follow-up issue created.**

## Workflow completion contract — explicit note for Jonesy/Ripley/the owner

Per the approved prompt: CC's `CC_COMPLETE` here reflects that Section A's implementation is done and locally verified, and Section B's artifact is written honestly with every unresolved item marked as such — **not** that Ticket 409 as a whole is finished. The issue's actual Definition of Done requires real deployment, real GA4 ingestion evidence, and ≥7 complete days of live data, none of which exist yet and none of which CC can produce (owner controls commit/push/deploy; GA4 access was unavailable this session). The correct final-assessment stage for the FULL ticket is **BLOCKED** (on external deployment/access/observation-window dependencies), distinguishing the accepted local implementation from unfinished Phase 4 — not a fabricated `CLOSED`, and not a new/invented workflow stage.
