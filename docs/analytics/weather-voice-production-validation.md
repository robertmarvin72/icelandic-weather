# Weather Voice Analytics — Production Validation (#409)

**Scope:** Instrumentation implementation (Section A of the approved prompt) plus the production-validation artifact and execution boundaries (Section B). This document is prepared by CC as part of Ticket 409's execution; it is **not** a claim that Phase 4 is complete. Full task closure requires the issue's own production acceptance criteria (real deployment, real GA4 ingestion, ≥7 complete days of live data) — none of which a local implementation pass can establish.

**Author/date:** CC, 2026-09-12 (UTC timestamps below are recorded at the moment each check was actually run, not backdated).

**Code provenance:** Instrumentation lives on top of git `HEAD` commit `abd73f50` ("fix: restore English Weather Voice content (#412)") at the time of this audit. **This code is uncommitted and undeployed as of this writing** — CC does not commit, push, or deploy. Whether Vercel's currently-live production deployment matches, precedes, or (after the owner commits/pushes) will include this work was **not independently verified** — no Vercel dashboard/API access was available or used this session. Do not read anything in this document as evidence that `weather_voice_viewed` is live in production; it establishes that the code exists, locally, and behaves as documented under local/browser testing.

---

## 1. Event dictionary

### `weather_voice_viewed`

The only event this ticket adds. Fires once per genuinely observed episode, from `src/hooks/useWeatherVoice.js`'s `onVisible` — the same, single, already-validated exposure boundary that `historyRef.current.recordShown()` uses (Ticket 408 Revision 3's exposure-lifecycle fix). Reuses the existing `trackEvent()` helper (`src/lib/analytics.js`) — no new transport, no second observer.

| Field | Type | Source | Example |
|---|---|---|---|
| `voice_id` | string | `presentation.comment.id` — the displayed comment's stable ID | `"excellent_02"` |
| `language` | string | the episode's own language (`is` \| `en`) | `"is"` |
| `severity` | number (0–3) | `presentation.severity` — unchanged numeric engine value, **expressive intensity only, not a safety level** | `0` |
| `weather_type` | string | `presentation.condition` — the canonical Phase 1 condition | `"excellent"` |
| `surface` | string | literal constant `"homepage_decision"` (the same `SURFACE_HOMEPAGE_DECISION` already used for the episode key) | `"homepage_decision"` |

**Explicitly excluded from the payload** (per the approved prompt): free text/comment body, site name, coordinates, user identity, raw forecast values, the full episode key string, timestamps, a viewport/device fingerprint, `location_id`, and a `variant` field. GA4's own built-in device/user/geo dimensions are used instead of inventing duplicates. `severity` is never relabeled as a safety level, and no derived "tone" field is manufactured from `mood`/`severity`.

### `weather_voice_interacted` — not implemented, recorded as N/A

**No such event exists, and none was added.** Verified directly against `weatherVoiceContent.js`'s `WEATHER_VOICE_COMMENT_METADATA`: all 27 entries omit `ctaType`, which resolves to `null` via `normalizeMetadata`'s default; `resolveWeatherVoiceCta` (`weatherVoicePresentation.js`) returns `null` whenever `ctaType` is falsy, so `WeatherVoiceCard`'s optional action button never renders for any of today's 27 IS/EN comments. There is no authored Weather Voice interaction to measure today. **Interaction rate must be recorded as "not applicable," never as "0% observed"** — a UI with no clickable element is not evidence of a zero interaction rate, it is evidence there is nothing to click. If a future ticket adds a real `ctaType`, this section (and the instrumentation) must be revisited then, not anticipated now.

---

## 2. Exact exposure ("impression") definition

An impression is recorded when, and only when, **all** of the following hold simultaneously, at the moment `WeatherVoiceCard`'s `IntersectionObserver` callback (or its `visibilitychange` re-check) fires:

1. The observed episode key **exactly matches** the hook's current `episodeKey` (site/day/language/condition/mood/severity, joined) — a stale observer from a torn-down effect (old site, old day, old language, or old engine outcome) can never credit a different, current episode.
2. The hook's selection has actually resolved for that key (`resolvedKey === key`) — not mid-selection.
3. The resolved presentation is a genuine `show:true` result — not silence.
4. This exact episode key has not already been recorded **during this mount** (`recordedEpisodesRef`).
5. The real intersection ratio was `>= 0.5` (not `isIntersecting` alone).
6. `document.visibilityState === "visible"` at the moment of the check.

**At-most-once semantics are per observed episode, within one mounted session** — repeated intersection events, rerenders, and React StrictMode's synthetic double-invoke never produce a duplicate for the same episode. **A genuine locale, site, day, or engine-outcome change is its own new episode and gets its own impression** — including the case where the same episode (same site/day/language/outcome) is revisited later in the same mount, which is deduplicated exactly like a repeat trigger (verified in `useWeatherVoice.exposureLifecycle.test.jsx`'s and this ticket's own `useWeatherVoice.analytics.test.jsx`'s IS→EN→IS tests). **A real page reload, remount, or new visit is a new mount and may legitimately produce a new impression for the same episode** — this is expected and by design, not a measurement defect.

**GA4 SDK invocation is not guaranteed network delivery.** `trackEvent()` calling `ReactGA.event(...)` only proves the SDK was invoked with the correct payload at the correct moment — it does not prove Google's collection endpoint received it, that it was not sampled/filtered/blocked (ad blockers, browser privacy modes, Do Not Track extensions), or that it appears in a GA4 report. No delivery acknowledgement or retry mechanism exists or was added; none is invented here.

---

## 3. Local implementation evidence (code-level, NOT production)

### Automated tests

New file `src/hooks/useWeatherVoice.analytics.test.jsx` — 16 tests, using the real hook + real card together (not a mock of either), a mocked `trackEvent`, and a deterministic fake `IntersectionObserver`/storage/time/RNG:

- No event on selection alone, below-threshold intersection, hidden document, mismatched provenance, or legitimately silent weather (5 tests).
- Exact payload on valid exposure — asserts the literal 5-key object and explicitly asserts the absence of site id/coordinates/date/full-episode-key substrings (2 tests).
- At-most-once semantics: repeated triggers, StrictMode replay, unchanged rerender (3 tests).
- Stale-callback rejection: site change, locale change (with the new episode still firing correctly with the right `language`), unmount (3 tests).
- A genuinely new episode (site change) gets its own independently-attributed event (1 test).
- IS→EN→IS dedup policy — exactly 2 events, not 3, since the final IS step revisits the identical episode key from step 1 (1 test).
- Analytics-helper-throw isolation — history still records, no exception escapes, no retry (1 test).

Full commands and pass counts are in `docs/ai/tasks/ticket-409/cc-report.md`.

### Local real-browser proof (mocked/absent transport — see below)

Script: `outputs/ticket-409-weather-voice-analytics-evidence/verify-weather-voice-analytics.cjs`. Real Chromium, real App/hook/card, stubbed `/api/*` routes (not a hand-built presentation mock). **Analytics transport is mocked by absence**: this local dev environment has no `VITE_GA_MEASUREMENT_ID` set (confirmed: grepped `.env.local` and `.env.development.local` — neither defines it), so `trackEvent()`'s `if (gaId) ReactGA.event(...)` branch never executes locally, and no real network call to Google can occur regardless of what the script does. The script also independently watched every outgoing network request for any `google-analytics.com` / `analytics.google.com` / `googletagmanager.com` URL — **zero such requests occurred in any fixture** (`gaRequestCount: 0` throughout `results.json`). Evidence was gathered instead from the DEV-only `console.log("[event]", ...)` line `trackEvent()` always emits.

| Fixture | Events before scroll | Events after scroll into view | After scroll away + back |
|---|---|---|---|
| Desktop 1280×480, IS, light | 0 | 1 (`excellent_02`, `is`) | 1 (no duplicate) |
| Desktop 1280×480, EN, dark | 0 | 1 (`excellent_03`, `en`) | 1 |
| Mobile 390×480, IS, light | 0 | 1 (`excellent_03`, `is`) | 1 |
| Mobile 390×480, EN, dark | 0 | 1 (`excellent_03`, `en`) | 1 |
| Site-switch session (A → B, real dropdown) | 1 (site A, `excellent`) | — | 2 total after B (`excellent`→`cold`, distinct event) |
| Language-switch session (IS → EN, real toggle) | 1 (`is`) | — | 2 total after EN (`en`, distinct event) |

Every payload matched the documented 5-field shape exactly (`voice_id`, `language`, `severity`, `weather_type`, `surface`). Screenshots and the full `results.json` are retained under `outputs/ticket-409-weather-voice-analytics-evidence/`.

**This table is local, code-level evidence only.** It proves the instrumentation fires correctly under controlled local conditions. It is not, and must never be read as, live production data.

---

## 4. Required live-production validation matrix — STATUS: NOT YET OBSERVED

None of the rows below have been checked against a real deployed production build. They remain pending until (a) this code is committed, pushed, and deployed by the owner, and (b) CC or the owner is granted a way to observe the deployed site (or GA4 DebugView) directly. Recorded here as the exact matrix still required, not as already-passed:

| Check | Status |
|---|---|
| Desktop, IS, light — card visible, correct asset/comment, no layout shift/overflow | Pending |
| Desktop, EN, light — same | Pending |
| Desktop, IS, dark — same | Pending |
| Desktop, EN, dark — same | Pending |
| Mobile, IS, light — same | Pending |
| Mobile, EN, light — same | Pending |
| Mobile, IS, dark — same | Pending |
| Mobile, EN, dark — same | Pending |
| Real language switch on a live page — no stale-language flash, no permanent suppression | Pending |
| Real site switch on a live page — new episode renders correctly, no stale content | Pending |
| Existing silent (non-comment-worthy) weather still renders no card in production | Pending |

Local-fixture equivalents of every row above (excluding true production forecast data) were exercised in Ticket 412's evidence (`outputs/ticket-412-weather-voice-locale-evidence/`) and this ticket's own evidence (§3) — those are **local**, not a substitute for this table.

---

## 5. Real production forecast examples per weather category — STATUS: NOT COLLECTED

The approved prompt requires real production forecast examples (forecast source/time, normalized daily inputs where available, current comment ID/language, expressive severity, assessment, evidence) for each of the engine's nine categories. **None were collected** — this requires either a deployed production instance or live production forecast/API access that was not available this session. Recording each category honestly as not observed, per the approved prompt's explicit instruction, rather than fabricating or substituting a local fixture as if it were a production example:

| Condition | Mood | Severity | Production example observed? |
|---|---|---|---|
| `extreme_wind` | wrecked | 3 | Not observed |
| `heavy_rain` | sad | 2 | Not observed |
| `strong_wind` | struggling | 2 | Not observed |
| `cold_wet` | unimpressed | 2 | Not observed |
| `cold` | freezing | 1 | Not observed |
| `rain` | unimpressed | 1 | Not observed |
| `sun_wind` | suspicious | 1 | Not observed |
| `excellent` | excellent | 0 | Not observed |
| `good` | happy | 0 | Not observed |

**Tone review, once real examples exist:** must be judged against `docs/weather-voice/character-and-voice-bible.md` (#413), explicitly distinguishing comfort/expressive severity (what Weather Voice's `severity` field means) from actual hazard evidence (which Weather Voice has no classifier for — see §6). If a real production observation shows a material mismatch between the displayed tone and the real weather, the correct response is to record that one concrete finding precisely (condition/mood/comment ID/observed weather/why it mismatches) — not to silently re-tune all 27 texts in response to a single observation.

---

## 6. Safety compliance — explicit outstanding blocker, not resolved by this ticket

**This ticket does not, and cannot, establish dangerous-weather safety compliance.** Restated plainly because analytics work can easily be mistaken for progress on this axis:

- No `voice_level` field, no safety-classification signal, and no `weatherSafetyMessages`-equivalent routing exists anywhere in the Weather Voice runtime — confirmed unchanged from #413's audit and #412's re-verification.
- `severity` (0–3) remains expressive-intensity-only. Nothing in this ticket relabels it as a safety level, and the analytics payload's own `severity` field must never be read by anyone as a hazard signal.
- The shared `HAZARDS_V1.rainWarn` reuse (as `RAIN_HEAVY_MM`, `weatherVoiceRules.js`) is a shared numeric threshold, not a safety-classification result flowing into selection — re-confirmed, unchanged.
- Adding `weather_voice_viewed`, or observing benign/excellent-weather production examples once they exist, **does not and cannot demonstrate** that dangerous-weather content is handled safely — sampling calm weather says nothing about what happens during a genuinely severe episode, and no such episode can be safely manufactured to test this.
- **No safety classifier or severity-relabeling was implemented in this ticket**, per the approved prompt's explicit instruction. The blocker is exactly what #413 already recorded: a situation-classification signal source and a separate reviewed safety-message collection are undecided, unimplemented, and out of this ticket's authorized scope. Resolving this requires its own, separately-scoped and separately-approved decision — not something this analytics ticket can or should resolve as a side effect.

**This acceptance item cannot be marked PASS by this ticket, under any evidence this ticket could gather.**

---

## 7. Post-deployment GA4 checklist (to run once deployed)

None of the following have been run — GA4 property/credential access was not available or used this session. Recorded here as the concrete checklist for whoever has that access next:

1. Open GA4 DebugView with a real or debug-mode session; trigger a real Weather Voice exposure on the live site; confirm `weather_voice_viewed` appears within DebugView in near-real-time.
2. Inspect the actual collected event parameters in DebugView/Realtime — confirm exactly `voice_id`, `language`, `severity` (numeric, not stringified oddly), `weather_type`, `surface` appear, with no extra automatically-appended PII-shaped parameter.
3. Trigger the same episode twice in one session (scroll away, scroll back) — confirm GA4 does not show it as two separate events server-side (client-side dedup was already proven in §3; this step confirms it survives real transport/whatever GA4-side deduping exists).
4. Confirm both `is` and `en` values appear correctly in the `language` parameter across two real sessions.
5. Confirm `severity` arrives as a real number (0–3) in GA4's parameter inspector, not a string.
6. Confirm `surface` is always exactly `"homepage_decision"` (this ticket adds no other surface).
7. Confirm GA4's own device category dimension (desktop/mobile/tablet) is populated for these events without any custom viewport field.
8. Check whether internal/admin/dev traffic (the owner's own browsing, `devPro` sessions) is being filtered by GA4's existing internal-traffic rules, or is inflating early counts — flag if no such filter exists yet, per the existing internal/dev traffic convention already used elsewhere in this codebase's analytics.

**Browser network/SDK evidence (§3) alone does not prove GA4 ingestion.** Only steps 1–8 above, run against the real deployed property, do.

---

## 8. Proposed event-scoped custom dimensions (proposal only — no admin change made)

No GA4 admin configuration was created or modified by this ticket — the approved prompt explicitly forbids that during code implementation. Recorded here as a concrete, owner-controlled proposal for later:

| Candidate dimension | Recommend? | Rationale |
|---|---|---|
| `language` | Yes | Needed for IS/EN distribution reports; GA4 has no built-in equivalent. |
| `weather_type` | Yes | Needed for condition-distribution reports; no built-in equivalent. |
| `surface` | Yes | Cheap to add now; only one value exists today (`homepage_decision`), but costs nothing and future-proofs a second Weather Voice surface without a schema change. |
| `severity` | Yes, if categorical reporting is actually wanted | Needed only if GA4 reports need to group/filter by severity value directly; if simple event-parameter exploration in GA4's UI is sufficient, a dedicated dimension may not be necessary — owner's call. |
| `voice_id` | Optional, lower priority | Useful for repeat-ID analysis (which of the 27 comments actually get shown), but cardinality (currently 27, will grow if content is later expanded) makes it a heavier dimension. GA4's standard event-parameter exploration can already answer "which voice_id appeared how often" without a dedicated custom dimension in many cases — recommend deferring unless a specific report requires it. |

**Property identity:** not independently verified this session (no GA4 access). The owner should confirm the exact GA4 property (`VITE_GA_MEASUREMENT_ID` value) this applies to before making any admin change. **Built-in device/user fields (device category, country, etc.) need no duplicate custom dimension** — reuse GA4's existing ones, as the approved prompt requires.

---

## 9. Observation window

**Not yet started.** Per the approved prompt, the window begins only after **both** (a) this instrumentation is deployed to production, and (b) instrumentation is verified live (§7's checklist, at minimum steps 1–2). Recording the definition now so it can be filled in truthfully later, not estimated or assumed:

- **UTC start:** _(pending — record the actual UTC timestamp instrumentation was confirmed live via §7)_
- **UTC end:** _(pending — start + at least 7 complete days)_
- **Status:** PENDING. No elapsed-time claim is made here, and none should be inferred from this document's own date.

**Once the window has genuinely elapsed, analyze:**
- Total impressions and unique users (GA4's own user dimension).
- Impressions per user (repeat-exposure rate).
- Distribution by `language`, device category, `severity`, `surface`.
- Repeated `voice_id` frequency (which of the 27 comments actually surface, and how evenly).
- Sample size, with low sample size recorded explicitly as **a limitation of the data**, never as a product conclusion ("Weather Voice isn't used" is not a valid inference from a low-traffic window).
- Any manual weather/tone mismatches found during the live matrix check (§4) or category sampling (§5).
- **Interaction rate: N/A** — no `weather_voice_interacted` event exists (§1); this must not be reported as 0%.

---

## 10. Acceptance-item status (issue #409's Definition of Done, honestly separated)

| Acceptance item | Status | Evidence / blocker |
|---|---|---|
| `weather_voice_viewed` implemented at the correct, single, already-validated boundary | **Implementation PASS (local)** | §3; `docs/ai/tasks/ticket-409/cc-report.md` |
| Event payload matches the approved contract, no PII/free text | **Implementation PASS (local)** | §1, §3 |
| At-most-once semantics, stale-callback rejection, StrictMode-safe | **Implementation PASS (local)** | §3 |
| No `weather_voice_interacted` while CTAs are null | **Implementation PASS (N/A recorded correctly)** | §1 |
| Production validation artifact created | **Done (this document)** | — |
| Live desktop/mobile × IS/EN × theme × switch matrix | **PENDING** | §4 — requires deployment |
| Real production forecast examples, all 9 categories | **PENDING / NOT COLLECTED** | §5 — requires deployment + live occurrence |
| Dangerous-weather safety compliance | **NOT ESTABLISHED — out of this ticket's authorized scope** | §6 |
| GA4 post-deployment checklist | **PENDING** | §7 — requires GA4 access |
| Custom dimensions | **Proposed only, no admin change** | §8 — owner decision |
| ≥7-day observation window with real data | **NOT STARTED** | §9 |

**Overall: implementation-level work for Section A is complete and locally verified. Section B's actual production validation has not occurred and cannot occur without deployment, access, and elapsed time this ticket does not control.** Per the approved prompt's workflow completion contract, the correct terminal state for the FULL ticket is `BLOCKED` (on external deployment/access/observation-window dependencies), not `CLOSED`, while the accepted local implementation is recorded as done.

---

## 11. Draft text for the owner's later publishing handoff (NOT sent)

The following is prepared for Róbert's own use if/when he chooses to comment on issue #409 or open a follow-up — **CC has not posted this or any issue comment, and has not opened any follow-up issue**, per the approved prompt's explicit constraint.

> Instrumentation for `weather_voice_viewed` is implemented and locally verified (tests + local browser evidence, both retained). No `weather_voice_interacted` event exists yet since no Weather Voice comment currently has an authored CTA — this is expected, not a gap. Production validation (live matrix across IS/EN/desktop/mobile/themes, real forecast-category examples, GA4 DebugView/ingestion confirmation, and a ≥7-day observation window) is still pending and requires deployment plus GA4 property access. Dangerous-weather safety compliance remains an open, separately-scoped dependency from #413/#412 — this ticket's analytics work does not and cannot resolve it. Recommend: deploy, verify via GA4 DebugView, then let ≥7 days elapse before drawing any usage conclusions.
