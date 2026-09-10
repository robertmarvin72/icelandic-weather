# Ticket 406 — Approved implementation prompt v1

Approved by Jonesy in Round 2; consolidates Ripley v1 with the approved v2 revisions.

Execution requires Róbert's `Prompt approved` instruction and CURRENT.md at READY_FOR_CC.

Issue #406: Weather Voice Phase 2: Content library + comment selection. Parent #404; depends on completed #405. Jonesy approved the technical policy and exact Icelandic copy below in Round 2.

### Current evidence and scope

The working tree was clean when this task started, and CURRENT marked #405 CLOSED. The existing implementation is in `src/lib/weatherVoiceEngine.js`, `weatherVoiceRules.js`, and `weatherVoiceTypes.js`, with colocated tests. The engine consumes a normalized daily row and returns exactly `{ show: false }` or `{ show: true, condition, mood, severity }`. Its nine conditions produce eight moods, with four additional reserved moods in the twelve-mood JSDoc contract. It has no UI consumers. Preserve that deterministic engine and its thresholds unchanged.

The owner has now added twelve PNG assets under `public/tjaldur/`, named by mood. The issue's SVG references are stale for actual supplied assets; no rendering, conversion or asset edits belong to #406.

Existing `forecastCache.js` and `attribution.js` contain feature-specific guarded localStorage access. `src/hooks/useLocalStorageState.js` is an existing generic React persistence hook: it initializes through `useState`, then writes through `useEffect` on `[key, value]`, including mount. Ripley independently read this hook during Round 2. It is unsuitable for the non-React library and explicit-record-after-display contract in #406 because its automatic persistence is tied to React state lifecycle rather than confirmed exposure. CC must explicitly read and rule out this hook in the pre-edit audit, alongside the two feature-specific helpers. A new small `weatherVoiceHistory.js` adapter intentionally adds another guarded storage implementation; do not extract a shared primitive, modify the hook, or couple the pure selector to React to avoid that small duplication. None of these existing helpers provides the required injectable, bounded, explicit-exposure history API as-is. Do not reuse forecast or attribution keys/data for comment history.

UI entrypoint check: this is explicitly another library-only phase. Provide exported selector and explicit exposure-recording API for a later UI ticket. Do not add a page, component, hook integration, navigation or analytics just to make this phase visible.

### Execution prerequisites

You are Claude Code. Execute only the approved standalone prompt referenced by CURRENT at READY_FOR_CC after Róbert says `Prompt approved`. Follow README's CC_IN_PROGRESS -> report -> CC_COMPLETE transitions. Before editing, read AGENTS.md, CLAUDE.md, docs/ai/README.md, CURRENT, issues #406/#404, #405's approved prompt/report/final review, all existing Weather Voice modules/tests, and relevant persistence conventions, explicitly including `src/hooks/useLocalStorageState.js`, `src/i18n/translations.js` and `src/hooks/useT.js`. The audit must record why neither the React persistence hook nor the flat translation lookup is reused. Record the confirmed data flow and scope in `cc-report.md` before code edits. Preserve unrelated changes. No commit or push.

Use JavaScript and JSDoc; no TypeScript syntax, new libraries or backend. Suggested files:

- `src/i18n/weatherVoice/is.js` and `en.js` hold structured localized comment libraries. This deliberately introduces a feature subdirectory under i18n for structured content, distinct from the existing flat `translations.<domain>.js` UI-microcopy convention. Do not import, spread or register these libraries in `translations.js`, and do not resolve comment text through `useT()`. The new `weatherVoiceContent.js` lookup consumes them directly by explicit language. Existing translation modules and `useT.js` remain unchanged.

This is the explicit, narrowly scoped exception to following the existing flat translation-file pattern. It satisfies the repository's requirement to keep language-specific text under i18n while retaining #406's language-separated content architecture; it does not authorize a translation-system refactor.
- `src/lib/weatherVoiceContent.js` for language lookup and shared metadata, if needed.
- `src/lib/weatherVoiceSelector.js` for pure selection.
- `src/lib/weatherVoiceHistory.js` for guarded persistence and explicit shown-recording.
- Extend `weatherVoiceTypes.js` with comment/presentation/history JSDoc contracts, preserving every existing typedef and its declaration-only runtime behavior. Colocate relevant tests.

Keep flat lib conventions from #405; do not relocate Phase 1 to a new feature tree. No explicit extensions in imports. No changes to Phase 1 engine/rules or tests that weaken their guarantees.

### Comment and presentation contracts

Define stable ASCII `id`, canonical `condition`, `mood`, nonempty `text`, optional inclusive `severityMin`/`severityMax` (integers 0–3), optional `repeatCooldownDays` (finite nonnegative days; default 7), and optional `ctaType` (null or one of better_location/calmer_location/drier_location/warmer_location/best_locations). Omitted severity bounds mean 0 and 3. Reject inverted/out-of-range bounds in library validation. Use null/omitted CTA for all MVP entries; no unsupported destination promise or navigation implementation.

IDs are language-independent and stable across deploys: never derive from array position, translated text, date or randomness. EN is an empty prepared library, not an English translation or silently copied Icelandic content. IS is the canonical MVP library. Language lookup accepts explicit `is` or `en`; unsupported/missing language returns no library and therefore silence. Do not silently fall back to Icelandic for English. Future EN entries may reuse IS IDs; duplicates are forbidden within each language, not across languages. For IDs present in both languages, validation must enforce equal condition/mood/severity/cooldown/CTA metadata, allowing text to differ. Avoid duplicating metadata if a small shared registry is clearer, but no framework or generalized content platform.

Presentation is `{ show: false }` or `{ show: true, condition, mood, severity, comment: { id, text }, ctaType: null | validType }`. Always copy condition/mood/severity from Phase 1, never from randomized content. No raw weather interpretation here.

### Exact approved Icelandic MVP copy (27 entries)

Each row uses its Phase 1 mood and severity range omitted (0–3), default cooldown 7 days, CTA null. IDs must remain as written. Jonesy reviewed tone and contextual truth; CC must not silently rewrite approved copy.

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

For `wind_extreme_04`, “Vindurinn hefur orðið.” uses `hafa orðið` (to have the floor/be the speaker): `orðið` is the definite noun `orð`, not an incomplete use of `verða`. Retain this approved personification exactly.

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
