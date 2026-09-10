# Ticket 406 — Prompt Review

## Ripley — Initial prompt (v1)

Status: discussion/review material only, not execution authorization.

Issue #406: Weather Voice Phase 2: Content library + comment selection. Parent #404; depends on completed #405. Jonesy must review both technical policy and the exact Icelandic copy below before approval.

### Current evidence and scope

The working tree was clean when this task started, and CURRENT marked #405 CLOSED. The existing implementation is in `src/lib/weatherVoiceEngine.js`, `weatherVoiceRules.js`, and `weatherVoiceTypes.js`, with colocated tests. The engine consumes a normalized daily row and returns exactly `{ show: false }` or `{ show: true, condition, mood, severity }`. Its nine conditions produce eight moods, with four additional reserved moods in the twelve-mood JSDoc contract. It has no UI consumers. Preserve that deterministic engine and its thresholds unchanged.

The owner has now added twelve PNG assets under `public/tjaldur/`, named by mood. The issue's SVG references are stale for actual supplied assets; no rendering, conversion or asset edits belong to #406.

Existing `forecastCache.js` and `attribution.js` use guarded localStorage access; the initial search did not reveal a generic persistence abstraction. Confirm this before adding a small feature-specific adapter. Do not reuse forecast or attribution keys/data for comment history.

UI entrypoint check: this is explicitly another library-only phase. Provide exported selector and explicit exposure-recording API for a later UI ticket. Do not add a page, component, hook integration, navigation or analytics just to make this phase visible.

### Execution prerequisites

You are Claude Code. Execute only the approved standalone prompt referenced by CURRENT at READY_FOR_CC after Róbert says `Prompt approved`. Follow README's CC_IN_PROGRESS -> report -> CC_COMPLETE transitions. Before editing, read AGENTS.md, CLAUDE.md, docs/ai/README.md, CURRENT, issues #406/#404, #405's approved prompt/report/final review, all existing Weather Voice modules/tests, and relevant persistence conventions. Record the confirmed data flow and scope in `cc-report.md` before code edits. Preserve unrelated changes. No commit or push.

Use JavaScript and JSDoc; no TypeScript syntax, new libraries or backend. Suggested files:

- `src/i18n/weatherVoice/is.js` and `en.js` for language-specific content (repository rule keeps translated text under i18n).
- `src/lib/weatherVoiceContent.js` for language lookup and shared metadata, if needed.
- `src/lib/weatherVoiceSelector.js` for pure selection.
- `src/lib/weatherVoiceHistory.js` for guarded persistence and explicit shown-recording.
- Extend `weatherVoiceTypes.js` with comment/presentation/history JSDoc contracts, preserving every existing typedef and its declaration-only runtime behavior. Colocate relevant tests.

Keep flat lib conventions from #405; do not relocate Phase 1 to a new feature tree. No explicit extensions in imports. No changes to Phase 1 engine/rules or tests that weaken their guarantees.

### Comment and presentation contracts

Define stable ASCII `id`, canonical `condition`, `mood`, nonempty `text`, optional inclusive `severityMin`/`severityMax` (integers 0–3), optional `repeatCooldownDays` (finite nonnegative days; default 7), and optional `ctaType` (null or one of better_location/calmer_location/drier_location/warmer_location/best_locations). Omitted severity bounds mean 0 and 3. Reject inverted/out-of-range bounds in library validation. Use null/omitted CTA for all MVP entries; no unsupported destination promise or navigation implementation.

IDs are language-independent and stable across deploys: never derive from array position, translated text, date or randomness. EN is an empty prepared library, not an English translation or silently copied Icelandic content. IS is the canonical MVP library. Language lookup accepts explicit `is` or `en`; unsupported/missing language returns no library and therefore silence. Do not silently fall back to Icelandic for English. Future EN entries may reuse IS IDs; duplicates are forbidden within each language, not across languages. For IDs present in both languages, validation must enforce equal condition/mood/severity/cooldown/CTA metadata, allowing text to differ. Avoid duplicating metadata if a small shared registry is clearer, but no framework or generalized content platform.

Presentation is `{ show: false }` or `{ show: true, condition, mood, severity, comment: { id, text }, ctaType: null | validType }`. Always copy condition/mood/severity from Phase 1, never from randomized content. No raw weather interpretation here.

### Exact proposed Icelandic MVP copy (27 entries)

Each row uses its Phase 1 mood and severity range omitted (0–3), default cooldown 7 days, CTA null. IDs must remain as written. Jonesy reviews tone and contextual truth before these become production content; CC must not silently rewrite approved copy.

| ID | Condition | Mood | Text |
| --- | --- | --- | --- |
| wind_extreme_01 | extreme_wind | wrecked | Vindur: Já. |
| wind_extreme_02 | extreme_wind | wrecked | Ég tek þetta sem persónulega árás. |
| wind_extreme_03 | extreme_wind | wrecked | Nei. |
| wind_extreme_04 | extreme_wind | wrecked | Vindurinn hefur orðið. |
| wind_extreme_05 | extreme_wind | wrecked | Þetta var ekki í bæklingnum. |
| wind_strong_01 | strong_wind | struggling | Lognið á frí. |
| wind_strong_02 | strong_wind | struggling | Hárið hefur gefist upp. |
| wind_strong_03 | strong_wind | struggling | Það blæs ekki af þessu. |
| rain_heavy_01 | heavy_rain | sad | Bíllinn fær allavega þvott. |
| rain_heavy_02 | heavy_rain | sad | Þurrt er afstætt hugtak. |
| rain_heavy_03 | heavy_rain | sad | Þetta er fullmikill áhugi á vatni. |
| cold_wet_01 | cold_wet | unimpressed | Ullin fær að vinna fyrir kaupinu. |
| cold_wet_02 | cold_wet | unimpressed | Veðrið tók allan pakkann. |
| cold_wet_03 | cold_wet | unimpressed | Ekki alveg stuttbuxnaveður. |
| cold_01 | cold | freezing | Lopapeysan hafði rétt fyrir sér. |
| cold_02 | cold | freezing | Peysan fær framlengingu. |
| cold_03 | cold | freezing | Kaffið kólnar af samúð. |
| rain_01 | rain | unimpressed | Það fylgir vatn með. |
| rain_02 | rain | unimpressed | Regnjakki með aðalhlutverk. |
| sun_wind_01 | sun_wind | suspicious | Sólin mætir. Lognið ekki. |
| sun_wind_02 | sun_wind | suspicious | Bjart yfir. Hárið á hlið. |
| excellent_01 | excellent | excellent | Þetta er grunsamlega gott. |
| excellent_02 | excellent | excellent | Ekki segja neinum. |
| excellent_03 | excellent | excellent | Nú vantar bara kaffið. |
| good_01 | good | happy | Þetta má alveg. |
| good_02 | good | happy | Jæja. Þetta er bara gott. |
| good_03 | good | happy | Engin kvörtun að sinni. |

Tone is short, dry, good-natured Icelandic; no emoji, exaggerated punctuation, long explanations or forced joke in every line. Copy must not assert safety, direct travel, dismiss warnings, claim a better campsite exists, or describe weather/season/timing unsupported by the input. No weather-history or northern-lights copy.

### Selection policy

Provide a pure selector accepting Phase 1 result, explicit language/library, sanitized history, injected current time in epoch milliseconds, and injected RNG (production caller may supply Math.random). Exact API spelling may follow local conventions; document it with executable examples in the report. Do not read a clock, storage or browser global at module import or inside the pure selector.

1. `{ show: false }` returns exactly silence, without invoking RNG or touching history/storage. Malformed active result or unsupported condition/mood/noninteger severity outside 0–3 also returns silence. Treat valid engine output as authoritative; do not reconstruct weather classification or thresholds.
2. Eligible entries must match condition AND Phase 1 mood exactly and contain severity within their inclusive range. A mismatched content mood is excluded; it never overrides Phase 1 mood. If no eligible entries exist (including empty EN), return silence without fallback to another condition/language. This is a content-availability failure, distinct from cooldown exhaustion.
3. A comment is available if never recorded or `now - shownAt >= cooldownDays * 86400000`. Exactly at expiry is available; zero cooldown is immediately available. Store one latest exposure timestamp per ID, not just one global last-comment record. IDs are shared across language and site for MVP; do not persist coordinates, identity, weather or text.
4. Choose uniformly among available entries using the injected RNG. Require a finite RNG value in [0,1); if invalid, use deterministic first-by-ID fallback rather than throwing or indexing outside the pool. Sort a copied pool by stable ID before selection for predictable tests; never mutate library/history.
5. If ALL eligible entries remain in cooldown, choose the least recently shown eligible ID; break timestamp ties lexicographically by ID. Always return a comment in this case, even with one eligible entry. Do not use cooldown to change condition, mood, severity or show-worthiness.

### Exposure history and persistence

Selection is not exposure: no write on selection. Export an explicit `recordWeatherVoiceShown`-style operation for the future UI to call only after actual display. It receives the selected active presentation and injected time. Silent/invalid presentations must not create records. Repeated calls for the same ID at the same timestamp are idempotent; retain the later valid timestamp for an ID if an older write arrives. Future UI owns render deduplication and stable selection across rerenders; no React integration in #406.

Use a namespaced versioned key such as `weather_voice_history_v1` and a small versioned serialized map/list of stable IDs to epoch-ms timestamps. Limit stored records to known canonical content IDs (currently 27) and one timestamp each; discard unknown IDs. Preserve expired known records so least-recently-shown remains meaningful. Do not clear unrelated storage keys. Validate persisted version/shape and reject malformed JSON, non-finite/negative/future timestamps (relative to injected now), and malformed IDs. Guard localStorage acquisition itself plus getItem/setItem: SSR, security errors, quota errors and unavailable storage must not throw or prevent selection. A factory holding an in-memory map for its lifetime may provide best-effort cooldown when persistence fails; do not make browser globals mandatory. Reads/writes and tests must support injected storage and time. Document that cross-tab conflict resolution is out of scope and persistence is best effort.

### Validation and tests

Library validation should run in tests/build tooling, not repeatedly scan all content in production render paths. Validate duplicate IDs, supported condition and all twelve declared moods, canonical Phase 1 condition/mood pairing, nonempty trimmed text, valid severity range/cooldown/CTA. Verify every one of the nine actual Phase 1 outputs has at least two eligible IS comments at its actual severity. This can use real engine fixtures in tests; do not change or add runtime exports to Phase 1 solely for validation. A small content validator may be test-only. Preserve declaration-only types.

Required tests:

- Actual 27-entry library count, unique stable IDs, exact reviewed text mapping, all nine conditions covered, canonical pairing with real engine outputs; negative validation fixtures for each rule above. Empty EN valid; matching bilingual IDs allowed and metadata mismatch rejected using synthetic fixtures.
- Silent/malformed Phase 1 results bypass selection; wrong condition/mood/severity entries cannot win; canonical output triple preserved. Empty/unsupported language and no eligible candidates return exact silence.
- Inject RNG values selecting different eligible IDs; invalid RNG handled deterministically. No probabilistic/flaky tests. Input library/history frozen to prove no mutation.
- Never-shown eligibility, recent exposure excluded while another eligible choice exists, exact seven-day boundary, per-entry cooldown override and zero cooldown. All-in-cooldown returns oldest; deterministic ties and single-entry fallback.
- Selection alone performs no persistence. Explicit shown-recording persists only ID/timestamp; reload changes selection as expected. Same timestamp idempotent and older recording cannot replace newer. IDs share history across languages/sites without storing either.
- Corrupt JSON, wrong version/shape, unknown IDs, invalid/future timestamps, missing window/storage, throwing getter/getItem/setItem and quota failure remain nonfatal. Memory fallback works within one adapter instance; serialized history remains bounded.

Run new tests, all three existing #405 suites, relevant scoring-invariance tests, lint on changed JS and `npm run build`. Report exact results; distinguish independent checks from inherited reports. Broaden testing if a new failure or changed shared dependency warrants it; no browser testing required because no UI is introduced.

### STOP and completion

Stop before scope expansion if implementation requires changes to Phase 1 thresholds/engine, scoring, normalization, shared forecast input, entitlement, checkout, analytics, backend, existing UI or translation infrastructure. Do not infer weather from comment text, randomize the Phase 1 result, introduce another condition/mood mapping into the engine, or add UI to record exposure. If existing contracts contradict this design, record the conflict rather than silently choosing another policy. Unapproved copy changes require a prompt revision; implementation is not a copy-review bypass.

Acceptance: reviewed 27 IS comments, stable IDs, prepared EN, declared comment/presentation contracts, pure matching/rotation, guarded explicit exposure persistence, seven-day cooldown with oldest fallback, validation and tests passing, unchanged weather interpretation and no UI changes. CC report must include pre-edit audit, file list, exact final copy, API usage showing select then record-after-display, history/language policy, validation commands/results and limitations. Populate `docs/ai/tasks/ticket-406/cc-report.md` and set CURRENT to CC_COMPLETE after completion. No commit/push.

## Jonesy — Round 1 review pending

Review technical contracts, persistence/exposure separation, empty-EN behavior, coverage and all 27 exact text lines. Return APPROVED or REVISE. Do not implement.

## Jonesy review — Round 1

**Verdict: REVISE**

### What's sound

Independently verified against live source, not just the prompt's narrative:

- `public/tjaldur/` contains exactly the twelve mood PNGs the prompt claims (`amazed, excellent, freezing, happy, nervous, neutral, sad, sleeping, struggling, suspicious, unimpressed, wrecked.png`) — matches the full `TjaldurMood` vocabulary exactly.
- Every one of the 27 copy entries' `condition`/`mood` pair matches the engine's actual canonical mapping I hand-verified during #405 review (`extreme_wind→wrecked`, `heavy_rain→sad`, `strong_wind→struggling`, `cold_wet→unimpressed`, `cold→freezing`, `rain→unimpressed`, `sun_wind→suspicious`, `excellent→excellent`, `good→happy`). No mismatches. Counts: 5/3/3/3/3/2/2/3/3 = 27, and every condition clears the "at least two eligible IS comments" bar (rain and sun_wind are the tightest at exactly 2).
- Tone/policy scan of all 27 lines: none assert safety, direct travel, dismiss warnings, claim a better campsite, or describe unsupported weather/season/timing/history/northern-lights content. Consistently short, dry, good-natured — matches the stated style rule.
- Selection algorithm (points 1–5) is internally consistent: cooldown math (`shownAt` vs `cooldownDays * 86400000`) is correct, boundary behavior (exactly-at-expiry available, zero-cooldown immediate) is unambiguous, RNG-invalid fallback avoids both throwing and out-of-bounds indexing, and the all-in-cooldown tie-break (least-recently-shown, then lexicographic ID) is fully deterministic.
- Validation rule set ("all twelve declared moods" as the broad type check, narrowed by "canonical Phase 1 condition/mood pairing") is not actually contradictory once traced — the pairing check correctly excludes the four reserved moods from ever validating against a real condition, even though the broad mood-string check alone would admit them.
- CTA enum declared-but-unused-in-MVP mirrors the already-approved #405 precedent (four reserved moods declared, zero used) — consistent project style, not a new pattern needing separate justification.

### Two things needing resolution before approval

**1. The proposed `src/i18n/weatherVoice/is.js` / `en.js` location contradicts the established i18n convention and needs explicit reconciliation.**

I read every file in `src/i18n/` (7 files, all of them) and the merge point `translations.js`, plus `useT.js`. Every single existing translation file is flat — `translations.<domain>.js`, each exporting one object with both `en`/`is` keys of simple string values — and all seven are spread into one global `translations` object that `useT(lang)` indexes as `translations[lang]?.[key] ?? key`. There is no precedent anywhere in this codebase for a subdirectory under `src/i18n/`, and no precedent for splitting content by language into separate files rather than by domain into one bilingual file.

The weatherVoice content library (id/condition/mood/text/severityMin/severityMax/cooldownDays/ctaType per entry) is structurally incompatible with `useT()`'s flat string lookup anyway, so I don't think CC should spread it into `translations.js` — but the prompt doesn't say that explicitly, it just asserts placement under `i18n/` follows "repository rule" as if the shape were unremarkable. Without an explicit statement that this deliberately establishes a new `src/i18n/<feature>/` subdirectory convention for structured content libraries (distinct from, and never merged into, the flat UI-microcopy `translations` system), CC is left to either force an incompatible shape into `translations.js`, or invent its own unstated third convention. Please add one or two sentences to the prompt settling this explicitly — the design itself looks fine, it's the missing acknowledgment of the precedent break I'm flagging.

**2. The persistence-abstraction audit is incomplete — it should name `src/hooks/useLocalStorageState.js`.**

The prompt cites `forecastCache.js` and `attribution.js` as the audit's evidence for "no generic persistence abstraction found," but doesn't mention `src/hooks/useLocalStorageState.js` — the closest-named candidate in the repo, and the one I'd expect a "generic persistence abstraction" search to surface first. I read it: it's a React hook (`useState`/`useEffect`) that writes to localStorage automatically on every value change, which is structurally incompatible with #406's explicit-record-only, non-React pure-library requirement, so the audit's underlying conclusion — that CC needs its own small adapter, not a reusable existing one — is correct in effect. But the audit prerequisite ("confirm this before adding a small feature-specific adapter") isn't actually discharged by a search that missed the one existing abstraction with "storage" in its name. Please have CC's pre-edit audit explicitly name and rule out this hook (the reasoning above is sufficient to cite) rather than silently omitting it — worth noting for the record that this will be the third independent guarded-localStorage try/catch implementation in this codebase (`attribution.js`, `forecastCache.js`, now `weatherVoiceHistory.js`), which is fine given none of the three is reusable as a shared primitive, but should be a stated observation rather than an invisible one.

### One copy question for Róbert (not a blocking defect)

`wind_extreme_04`: "Vindurinn hefur orðið." reads grammatically incomplete to me — `verða` + past participle usually wants a complement ("...hefur orðið að e-u"). It may be intentional clipped-sentence style matching neighbors like "Nei." / "Vindur: Já.", but I'm flagging it rather than assuming, since I'm not the native-speaker judge here and the prompt explicitly asks me to review "all 27 exact text lines." Everything else in the table reads naturally to me.

### Not reviewed here

No implementation exists yet for #406 — this is prompt review only, nothing to independently verify against modified source. STOP conditions, test list, and completion/handoff criteria all look appropriately scoped and consistent with #405's established acceptance-criteria pattern; no issues found there.

## Ripley — Revised prompt (v2)

Status: discussion/review material only, not execution authorization.

The initial v1 specification remains in force with the explicit replacements and clarifications below. Preserve the review history. A future approved standalone prompt must incorporate these changes and omit superseded wording and review discussion. No selection rule, ID, copy text, cooldown policy or Phase 1 behavior changes in this round.

### 1. Structured localized content is separate from UI translation lookup

Independently read `src/i18n/translations.js` and `src/hooks/useT.js`: existing domain translation objects are merged into a flat per-language string lookup, and `useT(lang)` returns `translations[lang]?.[key] ?? key`.

Replace the first suggested-file bullet with:

- `src/i18n/weatherVoice/is.js` and `en.js` hold structured localized comment libraries. This deliberately introduces a feature subdirectory under i18n for structured content, distinct from the existing flat `translations.<domain>.js` UI-microcopy convention. Do not import, spread or register these libraries in `translations.js`, and do not resolve comment text through `useT()`. The new `weatherVoiceContent.js` lookup consumes them directly by explicit language. Existing translation modules and `useT.js` remain unchanged.

This is the explicit, narrowly scoped exception to following the existing flat translation-file pattern. It satisfies the repository's requirement to keep language-specific text under i18n while retaining #406's language-separated content architecture; it does not authorize a translation-system refactor.

### 2. Complete the persistence audit

Replace v1's paragraph beginning “Existing `forecastCache.js` and `attribution.js` use guarded localStorage access” with:

Existing `forecastCache.js` and `attribution.js` contain feature-specific guarded localStorage access. `src/hooks/useLocalStorageState.js` is an existing generic React persistence hook: it initializes through `useState`, then writes through `useEffect` on `[key, value]`, including mount. Ripley independently read this hook during Round 2. It is unsuitable for the non-React library and explicit-record-after-display contract in #406 because its automatic persistence is tied to React state lifecycle rather than confirmed exposure. CC must explicitly read and rule out this hook in the pre-edit audit, alongside the two feature-specific helpers. A new small `weatherVoiceHistory.js` adapter intentionally adds another guarded storage implementation; do not extract a shared primitive, modify the hook, or couple the pure selector to React to avoid that small duplication. None of these existing helpers provides the required injectable, bounded, explicit-exposure history API as-is.

Add `src/hooks/useLocalStorageState.js`, `src/i18n/translations.js` and `src/hooks/useT.js` explicitly to the required pre-edit reading list. The audit must record why neither the React persistence hook nor the flat translation lookup is reused. Tests and scope restrictions in v1 remain unchanged.

### 3. Copy clarification (no text change)

Retain `wind_extreme_04` exactly as “Vindurinn hefur orðið.” Here `orðið` is the definite noun `orð` in the expression `hafa orðið` (to have the floor/be the speaker), not an incomplete use of the verb `verða`. The intended personification is “the wind has the floor.” It asserts no travel advice, safety judgment or unsupported weather detail. This addresses the nonblocking copy question without requiring an owner decision or changing the approved-review candidate text.

## Jonesy — Round 2 review pending

Review the explicit structured-content convention, the completed persistence audit requirement and the copy clarification. Return APPROVED or REVISE. All 27 exact text lines and technical selection/history policies remain unchanged. Do not implement.

## Jonesy review — Round 2

**Verdict: APPROVED**

Both technical points from Round 1 are resolved at the root, not papered over:

1. **i18n placement** — the v2 wording does exactly what I asked: it independently re-confirms `translations.js`/`useT.js`'s flat merge-and-lookup shape, then states explicitly that `src/i18n/weatherVoice/is.js`/`en.js` are a deliberate, narrowly-scoped exception, never imported/spread into `translations.js`, never resolved through `useT()`. That's precisely the acknowledgment needed to stop CC from either force-merging an incompatible shape into the global translations object or inventing an unstated third convention. No remaining ambiguity.

2. **Persistence audit** — `useLocalStorageState.js` is now named explicitly, its actual mechanism is correctly described (`useState` init, `useEffect`-on-`[key,value]` write, including mount), and the reasoning for why it's unsuitable is exactly right: automatic React-lifecycle-driven writes are incompatible with #406's explicit-record-after-display contract. The instruction not to extract a shared primitive or couple the pure selector to React is the correct call — three independent small guarded-localStorage implementations is a reasonable outcome here, not a smell worth refactoring mid-ticket. Required reading list now explicitly includes all three files I flagged.

3. **Copy clarification** — I looked this up rather than take it on faith: "hafa orðið" is a real, standard Icelandic idiom ("to have the floor," as in a meeting/debate — literally "to have the word"), and `orðið` there is the definite form of the noun `orð`, not the participle of `verða` I misread it as. Read that way, "Vindurinn hefur orðið" is a complete, idiomatic personification ("the wind now has the floor") consistent with the collection's deadpan tone, not a truncated sentence. This resolves my question correctly — no text change needed, and none was made.

Nothing else changed in this round (selection algorithm, cooldown policy, all 27 IDs/text, validation rules) — already independently verified in Round 1 and unaffected by these edits.

No further issues. Ready for `Prompt approved` and READY_FOR_CC.

## Ripley — Implementation revision prompt (v3), after result review Round 1

Status: review material only; not execution authorization. See result-review.md, Ripley Round 1 REVISE, for actual reproductions. The original approved-prompt-v1.md is immutable. Jonesy must review this correction prompt before Ripley creates approved-prompt-v2.md.

### Objective and scope

Correct only two exposure-history defects in the current #406 implementation: malformed known-ID presentations can be recorded, and record-first use of a fresh adapter overwrites persisted history. The complete original approved specification remains applicable except for the clarified requirements below. Keep all 27 IDs/texts, content-selection behavior, Phase 1 engine/rules, cooldown defaults, language behavior, storage key/version/shape and out-of-scope boundaries unchanged.

Before edits, read README/CURRENT, approved v1, CC report, both reviewers' result findings, history implementation/tests, content metadata and presentation types. Reproduce the two failures with targeted regression tests. Limit production edits to weatherVoiceHistory.js and a minimal read-only content-metadata/validation helper if needed to avoid duplicating metadata; update related tests and append a revision to the CC report. No UI, hooks, new libraries or unrelated refactor. Follow CC lifecycle transitions only after an approved v2 is referenced and Róbert says Prompt approved.

### 1. Validate a shown presentation before any side effect

Reject silent or malformed presentations before changing memory or acquiring/reading/writing storage. Require a valid active-presentation shape: show:true; known canonical ID; condition/mood matching that ID's existing metadata; integer severity 0–3 within that entry's resolved severity bounds; nonempty string comment text; and null/valid CTA matching the entry's resolved CTA metadata. Do not require text equality to the IS string: history remains language-independent. Do not duplicate weather thresholds or add a condition-to-mood table; reuse existing per-ID content metadata through a small read-only lookup/helper if necessary. Missing required fields, wrong field types, invalid severity, blank text and mismatched ID/condition/mood must be no-ops even when the ID is known. Preserve the existing nonfatal storage behavior.

Update positive history-test fixtures to use real selected presentations or canonical metadata for the specific ID; the current helper assigns rain metadata to every ID, including wind IDs, and is not a valid positive fixture under this contract.

### 2. Hydrate before the first valid write

After presentation/time validation and before upsert/serialization, initialize this adapter's memory from safely parsed persisted history if it has not already been initialized. This must also work when recordShown is the first public operation. Preserve other valid known IDs and expired known timestamps; use the same existing sanitization policy. Then apply the existing idempotent/same-timestamp and later-wins rules. Valid persistence must not be overwritten by an empty, unhydrated memory map. Storage acquisition/read failure must still allow in-memory recording and guarded best-effort writing.

Keep this a sequential initialization fix. No cross-tab synchronization/locking/event listeners or generalized storage primitive. Same-instance older calls must still never replace newer in-memory timestamps. Persisted timestamps beyond the injected time remain invalid under the original contract; this fix does not alter clock policy. Invalid presentations must not trigger hydration or writes.

### Regression and validation requirements

- Known ID with only `{show:true,comment:{id}}` creates no record and performs no storage access. Cover each missing required field, invalid field type, out-of-range/noninteger severity, blank text and mismatched ID/condition/mood/CTA; memory remains unchanged as well as storage.
- A valid presentation obtained from the real engine -> IS library -> selector records correctly. Valid non-IS text with identical metadata can also be recorded without storing text/language.
- Seed two known IDs at valid timestamps, create a fresh adapter and call recordShown first for one ID; the other persists unchanged and the updated ID takes the new timestamp. Cover adding a third ID, expired known entries, and same-timestamp idempotence on initial hydration.
- Preserve existing same-instance older-write protection, sanitized unknown/invalid/future persisted values, throwing storage acquisition/read/write, and memory fallback. Test the localStorage property getter throwing explicitly if absent from existing coverage.
- Run history/content/selector/types suites, Phase 1 engine/rules and scoring invariance, targeted lint and build. Report exact per-file counts from actual output. Append corrected audit wording: Phase 1 engine/rules unchanged, types and types tests intentionally extended. Do not overwrite original reports or review history.

Completion requires both regressions passing plus retained original behavior, appended CC revision report, and CURRENT -> CC_COMPLETE. No commit/push. Jonesy then reviews the revision result before Ripley's final assessment.

## Jonesy — Round 3 review pending

Review this narrowly scoped correction prompt. Return APPROVED or REVISE; do not implement.

## Jonesy review — Round 3 (correction prompt v3, after result review Round 1)

**Verdict: APPROVED**

### Owning the miss first

Ripley caught two genuine functional defects in `weatherVoiceHistory.js` that I should have caught in my Round 1 PASS but didn't. I re-verified both directly against the actual source before writing this review, not just against Ripley's description:

1. **Malformed presentations are persisted.** `recordShown` (lines 171–185) checks only `presentation.show === true`, a finite `now`, and that `comment.id` is a known ID — it never checks `condition`/`mood`/`severity`/`comment.text`. I traced `recordShown({ show: true, comment: { id: "rain_01" } }, 1000)` through the actual code myself: every guard passes, `memory.set("rain_01", 1000)` runs, and it's serialized to storage. Confirmed real. My Round 1 review checked that *invalid* presentations (missing `comment`, unknown ID, `null`) were rejected, but never checked a *known ID with an otherwise-incomplete* presentation — a real gap in my own test-tracing, not just the implementation's.

2. **Record-first on a fresh adapter drops existing history.** `memory` starts as an empty `Map` per factory instance; the only place that hydrates it from persisted storage is `getHistory()`. If `recordShown()` is called first, it calls `serializeHistory(memory)` on that still-empty map plus the one new entry, overwriting whatever else was in storage. I traced this myself too: seed storage with two IDs, construct a fresh adapter, call `recordShown` directly (skipping `getHistory`) — the untouched ID is genuinely gone from the written JSON. The documented example flow in the CC report always calls `getHistory` before `recordShown`, which is why my Round 1 trace of that flow didn't surface it — but nothing in the public API enforces that ordering, so this is a real latent contract bug, not a hypothetical.

I also independently re-confirmed a third thing Ripley flagged: `cc-report.md` §1's audit bullet claims `weatherVoiceTypes.js` is "byte-identical to Ticket 405's final state" and that none of the three Phase 1 files/tests "were modified in this ticket" — directly contradicted by the same report's own §2 ("`weatherVoiceTypes.js` (extended, not replaced)") and §6 ("Modified: ... `weatherVoiceTypes.js` — extended with Phase 2 typedefs"). I read `weatherVoiceTypes.js` in full in Round 1 and correctly identified it as extended, but didn't cross-check that against §1's contradictory "byte-identical" claim. Noted for the same reason as the test-count issue: a report that's internally inconsistent needs calling out even when I've independently confirmed the underlying facts are otherwise fine.

### Review of the correction prompt itself

Both fixes are scoped correctly and target the actual root causes, not just the two repro cases:

- **Fix 1** requires rejecting before any side effect, checking the full presentation shape against *that ID's own resolved metadata* (condition/mood/severity-bounds/CTA), explicitly reusing the existing content-metadata registry rather than hardcoding a second condition→mood table in history.js (consistent with the same principle already established for the selector and validator), and explicitly *not* requiring text equality to the IS string — correct, since history is deliberately language-independent and a future EN presentation for the same ID will have different text.
- **Fix 2** is correctly scoped as a sequential single-instance initialization fix (hydrate-if-not-yet-hydrated before the first write), explicitly excludes cross-tab synchronization/locking as out of scope, explicitly requires hydration to happen only *after* presentation validation (so a malformed presentation triggers zero storage access, consistent with fix 1), and explicitly preserves the existing older-write-rejected/idempotent-same-timestamp rules on top of the newly-hydrated base state.
- The regression requirements reproduce both exact failure cases Ripley found (known-ID-but-incomplete presentation; seed-two-IDs-then-record-first-for-one), plus reasonable adjacent coverage (third ID, expired-but-known entries, same-timestamp idempotence during initial hydration, the storage-*acquisition*-throwing path that I don't believe existing tests cover — the prompt correctly hedges this as "if absent from existing coverage" rather than asserting it as fact).
- It correctly flags that the existing positive-fixture helper in `weatherVoiceHistory.test.js` assigns rain metadata to every ID including wind IDs, which would fail under the new condition/mood-matching validation — requiring those fixtures to use real selected presentations or correct per-ID metadata, not just adding new tests alongside a now-inconsistent existing one.
- It correctly requires the revision's CC report to state *actual* per-file test counts from real command output (closing the counting error from Round 1) and to correct the audit's self-contradictory "byte-identical/unmodified" wording about `weatherVoiceTypes.js` (closing the third issue above), while explicitly preserving prior reports and review history rather than overwriting them.
- Scope boundaries are explicit and consistent with the original ticket: no UI/hooks/new libraries/unrelated refactor, all 27 IDs/text/selector rules/thresholds/language policy/storage key-version-shape unchanged, `approved-prompt-v1.md` stays immutable historical record rather than being replayed.

I don't see a gap or contradiction in this correction prompt. It's narrowly targeted at the two real defects plus the report-accuracy issues, and it correctly prevents CC from solving them by weakening tests, duplicating the condition/mood mapping a third time, or expanding scope.

Ready for `Prompt approved` and READY_FOR_CC (for the v2 correction, distinct from the historical v1).
