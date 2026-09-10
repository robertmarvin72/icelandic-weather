
## Jonesy review — Round 1 (CC búinn)

**Verdict: PASS** (one reporting-accuracy correction noted below — no code or test change needed)

### Scope verification (file-level)

`device_list_dir` sweep of `src/lib`, `src/hooks`, and recursive `src/i18n` confirms exactly the claimed file set: four new/extended files in `src/lib` (`weatherVoiceContent.js`/`.test.js`, `weatherVoiceSelector.js`/`.test.js`, `weatherVoiceHistory.js`/`.test.js`, and `weatherVoiceTypes.js`/`.test.js` with fresh mtimes on the last pair), a new `src/i18n/weatherVoice/` directory with `is.js`/`en.js`. Every other file I checked — `weatherVoiceEngine.js`/`.test.js`, `weatherVoiceRules.js`/`.test.js` (Phase 1, byte-identical mtimes to #405's final state), `useLocalStorageState.js`, `useT.js`, `translations.js`, `forecastCache.js`, `attribution.js`, `scoring.js`, every other translation file — retained its exact pre-ticket mtime. Matches the report's `git status` claim precisely.

### Implementation verification (content-level, read in full)

- **`src/i18n/weatherVoice/is.js`** — all 27 entries transcribed byte-for-byte against the approved copy table, same IDs, same order, same text (including `wind_extreme_04`'s approved "Vindurinn hefur orðið."). **`en.js`** — genuinely `export const en = [];`, not a copy or partial translation.
- **`weatherVoiceContent.js`** — `WEATHER_VOICE_COMMENT_METADATA` pairs all 27 IDs to the exact canonical condition/mood I independently verified during #405 and re-confirmed here; every entry uses the stated MVP defaults. `getWeatherVoiceLibrary(lang)` correctly returns `null` for anything but exactly `"is"`/`"en"` (case-sensitive, no fuzzy match, no Icelandic fallback), and a real empty array for `"en"`. `validateWeatherVoiceLibrary` takes `canonicalPairs` as an injected parameter rather than hardcoding the condition→mood mapping a second time — correctly avoids re-declaring engine logic — and its rule checks (duplicate-id, known condition/mood, canonical pairing, nonempty/trimmed text, integer severity 0–3 non-inverted, finite nonnegative cooldown, valid-or-null CTA, cross-language metadata equality) all trace correctly against the approved contract; hand-verified several boundary cases directly (e.g. the injected-`canonicalPairs` rejection path only fires once both condition and mood are individually valid strings, so it can't mask a more basic error).
- **`weatherVoiceSelector.js`** — hand-traced the full pipeline: malformed/silent engine results short-circuit before touching `library`/`history`/`rng` (verified against a test that passes throwing stubs for both, per your point 1); eligibility filters on exact condition+mood+severity-range; empty/null library returns silence without any language fallback; `pickUniform`'s RNG validation and index math is correct at the exact boundaries (traced `rng()→0/0.34/0.99` against a deliberately-unsorted 3-entry library and got `a/b/c` exactly as expected); the all-in-cooldown fallback's tie-break naturally falls out of sorted-order iteration with a strictly-less-than comparison, correctly producing lexicographic-smallest-ID-wins without a separate comparator; `condition`/`mood`/`severity` in the return are destructured directly from `engineResult`, never from the chosen content entry.
- **`weatherVoiceHistory.js`** — the three-candidate audit (`useLocalStorageState.js`, `forecastCache.js`, `attribution.js`) is accurately described and correctly ruled out for the reasons given. Storage *acquisition* itself is guarded (not just `getItem`/`setItem`), matching the approved prompt's specific requirement. `recordShown`'s idempotent/no-older-overwrites-newer logic (`now <= existing` rejected) is exactly right. `parseStoredHistory` correctly discards unknown IDs, non-finite/negative/future timestamps, and malformed shape, while deliberately *not* pruning expired-but-known records — matching "preserve expired known records so least-recently-shown remains meaningful." Persisted shape contains only `{version, records: {id: epochMs}}` — no coordinates/identity/weather/text/language/site, confirmed by both reading the serializer and the test that inspects raw persisted JSON directly.
- **`weatherVoiceTypes.js`** — every Phase 1 typedef preserved verbatim (byte-identical to what I verified in #405); new Phase 2 typedefs added cleanly; still zero runtime exports.

### Test verification (read in full, hand-traced key cases against actual code — not the report's narrative)

All four test files are genuinely discriminating: negative fixtures target one validation rule at a time, the RNG/cooldown boundary tests hit exact edges (7-day boundary ±1ms, zero-cooldown, tie-breaking), the history tests inject fake storage/time throughout (no real `localStorage`/`Date.now()` dependency) and specifically probe throwing `getItem`/`setItem`, corrupt JSON, wrong version, array-shaped `records`, and future/negative timestamps. `weatherVoiceContent.test.js`'s canonical-pairing check reuses the *same* nine real `evaluateWeatherVoice()` fixtures from `weatherVoiceEngine.test.js`, not a re-derived or hardcoded set — genuinely engine-derived, with a guard (`expect(result.show).toBe(true)`) against a stale fixture silently going inactive.

**One correction to the report's numbers, not to the code:** I counted every `it(...)`/`it.each(...)` case directly in each file (necessary since `it.each` expands into multiple vitest-reported tests). Actual per-file counts are `weatherVoiceContent.test.js` = 23, `weatherVoiceSelector.test.js` = 28 (two `it.each` blocks of 8 and 6 cases each), `weatherVoiceHistory.test.js` = 20, `weatherVoiceTypes.test.js` = 7 (5 preexisting Phase 1 + 2 new). That's 23+28+20+7 = 78 total — the report's stated *total* ("4 files, 78 tests passed") is correct, and cross-checks cleanly against the full-suite delta (78 − 5 preexisting = 73 new tests, matching the reported +73 from 1218→1291) — but the report's parenthetical breakdown "(20 + 23 + 23 + 12)" doesn't correspond to any individual file's real count; it's a scrambled permutation that happens to sum correctly. Worth a note for CC's future reports, since a breakdown that sums right while being wrong per-file is exactly the kind of error a quick sanity check on the total won't catch. This doesn't affect PASS — every actual test is real, correctly targeted, and (as far as I traced) passing for the right reasons.

### STOP conditions / scope

No Phase 1 engine/rules file touched (confirmed by mtime, and by full re-read of both — byte-identical to #405). No hook/UI/analytics/backend touched. No condition→mood mapping duplicated into production code (the `canonicalPairs` injection pattern correctly avoids this). No copy silently rewritten. Nothing here to flag.

### Conclusion

Implementation and tests match `approved-prompt-v1.md` exactly: 27-entry IS library verbatim, empty-but-real EN library, pure selector with correct eligibility/RNG/cooldown/fallback semantics, guarded explicit-record-only history with the audited three-candidate rule-out, extended types preserving Phase 1 verbatim. One cosmetic test-count mislabeling in the report noted for the record; nothing else found.

## Ripley — Final assessment, Round 1 (2026-09-10)

**Verdict: REVISE**

Two independently reproduced history-contract defects prevent PASS despite the existing tests passing. No implementation changed during this assessment.

### Findings

1. **Malformed presentations are persisted.** `recordShown` checks only `show === true`, finite nonnegative time and a known `comment.id`. Calling it with `{ show: true, comment: { id: "rain_01" } }` at 1000 persists `{"version":1,"records":{"rain_01":1000}}`, although condition, mood, severity and comment text are absent. This violates the approved requirement that silent/invalid presentations create no records and can consume cooldown without a valid display result. The existing malformed-input test covers an unknown ID and missing comment, but not a known ID in an otherwise invalid presentation. Several positive fixtures also assign rain metadata to extreme-wind IDs, so they cannot demonstrate full presentation validation.

2. **Record-first use of a fresh adapter drops existing persisted history.** Seed storage with `{version:1,records:{rain_01:900,rain_02:950}}`, create a fresh adapter and record a valid `rain_01` presentation at 1000 without calling `getHistory` first. Actual storage becomes `{version:1,records:{rain_01:1000}}`: `rain_02` disappears. `recordShown` serializes only its initially empty memory; hydration happens only in `getHistory`. The public API has no required read-before-write precondition. Preserving known records must also hold when recording is the first operation. This is a sequential single-instance initialization bug, not the explicitly excluded cross-tab conflict problem.

Both reproductions executed the actual source modules through Node's `vm.SourceTextModule` with a file-based linker and injected in-memory fake storage; no browser storage or repository implementation files were changed.

### Independent verification and report accuracy

`node node_modules/vitest/vitest.mjs run src/lib/weatherVoiceContent.test.js src/lib/weatherVoiceSelector.test.js src/lib/weatherVoiceHistory.test.js src/lib/weatherVoiceTypes.test.js src/lib/weatherVoiceEngine.test.js src/lib/weatherVoiceRules.test.js src/hooks/useForecast.scoringInvariance.test.js` — **7 files, 136 tests passed**, rerun by Ripley with approved elevated access. Passing suites do not cover the two failing branches above. Full-project lint/build/1291-test results remain CC-reported, not independently rerun here.

Read the implementation, history tests, typedef diff, CC report and Jonesy review against the approved contracts. Git scope inspection agrees that Phase 1 engine/rules and existing product surfaces are untouched. Jonesy's correction to per-file counts stands. CC's pre-edit audit also incorrectly says none of the three Phase 1 modules/tests were modified, whereas the report's later file list correctly identifies the authorized types/types-test extensions; fix that contradictory report wording in the revision report.

### Required follow-up

Append a narrowly scoped prompt revision for Jonesy review, covering strict shown-presentation validation, safe initial hydration before a valid write and regression tests. Preserve all copy, selector rules, thresholds, language policy and storage format. Do not weaken tests or add UI work.

Per README's final-REVISE transition, CURRENT is set to READY_FOR_CC for a new prompt iteration, but its approved-prompt pointer is explicitly cleared pending Jonesy's approval of that iteration. **This stage alone is not execution authorization.** Approved v1 remains immutable historical evidence and must not be replayed as the fix prompt. No commit, push or issue closure performed.

## Jonesy review — Round 2 (CC búinn, Revision 2 / approved-prompt-v2.md correction)

**Verdict: PASS**

### Scope verification (file-level)

`device_list_dir` on `src/lib` confirms exactly the claimed scope: `weatherVoiceHistory.js` (6821→9934 bytes, fresh mtime) and `weatherVoiceHistory.test.js` (9744→20068 bytes, fresh mtime) both changed; `weatherVoiceContent.js` grew by a small, expected amount (10302→11126 bytes, fresh mtime) for the one new export. Every other Weather Voice file — including `weatherVoiceContent.test.js`, which was *not* touched — retained its exact prior mtime, as did Phase 1's engine/rules, the selector, types, and both i18n content files. Matches the v2 prompt's explicit scope limit exactly.

### Both defects verified fixed, by direct code trace

**Defect 1 (malformed known-ID presentations persisted):** `isValidActivePresentation()` now looks up the presentation's own claimed ID against `getWeatherVoiceCommentMetadataById(id)` (the new, minimal, read-only export from `weatherVoiceContent.js` — correctly reuses the single existing metadata registry rather than adding a second condition/mood table) and requires `condition`/`mood` to match that ID's real metadata exactly, `severity` to be an integer within that entry's resolved bounds, `comment.text` to be non-blank, and `ctaType` to match. I hand-traced the exact repro case (`{show:true, comment:{id:"rain_01"}}`) through the actual code: `presentation.condition` is `undefined`, which fails the `!== meta.condition` check immediately — rejected, exactly as required, before any storage access. I also traced several of the new test's other branches (wrong field types, out-of-range/non-integer severity, mismatched condition/mood/CTA for a genuinely known ID) directly against the implementation and confirmed each rejects for the stated reason, not by accident.

**Defect 2 (record-first drops other persisted history):** a single `hydrated` boolean plus `ensureHydrated(now)`, called by both `getHistory` and `recordShown`, performs the persisted-state merge exactly once per instance, whichever method is called first. I traced the exact repro (seed `{rain_01:900, rain_02:950}}`, fresh adapter, `recordShown` for `rain_01` at `1000` with no prior `getHistory` call) through the code myself: `ensureHydrated` correctly merges both seeded IDs into `memory` before the upsert runs, so the serialized output now correctly contains `{rain_01:1000, rain_02:950}}` — the other ID survives. I also traced the "hydration only happens once" test (second `recordShown` call performs zero additional `getItem` calls) and the "invalid presentation never triggers hydration" test (rejection happens in `isValidActivePresentation`, before `ensureHydrated` is ever reached) — both match the actual code order exactly.

**The audit self-contradiction** (§1 previously claimed `weatherVoiceTypes.js` was "byte-identical"/unmodified while §2/§6 correctly said it was extended) is now corrected in place, with the correction explicitly marked rather than silently rewritten — good practice for a document Ripley and I both need to keep trusting.

### Test verification

Recounted every `it(...)` in the rewritten `weatherVoiceHistory.test.js` directly: 2 + 9 + 7 + 6 + 11 = **35**, matching the report's claim exactly this time (unlike Revision 1's scrambled breakdown) — and the full-suite delta (1291→1306, +15) matches 35−20 exactly. The old `activePresentation()` fixture (hardcoded `rain`/`unimpressed` for every ID, including wind IDs) is gone, replaced by `realPresentation(id)`, which looks up each ID's actual metadata — correctly fixing what would otherwise have been silently-broken positive fixtures under the new strict validation. The new "strict presentation validation" (7 tests) and "hydrate before the first valid write" (6 tests) blocks target exactly the two reported repro cases plus reasonable adjacent coverage (third ID, expired-but-known entry, same-timestamp idempotence during hydration, hydration call-count, invalid-presentation-triggers-nothing). The new real-`evaluateWeatherVoice()`-through-`selectWeatherVoiceComment()` end-to-end test and the non-IS-text test both confirm the fix doesn't reject legitimate real-world presentations while enforcing the stricter contract. The new storage-property-getter-throwing test (`Object.defineProperty` on `window.localStorage` itself, not just a throwing `getItem`) closes exactly the coverage gap I'd guessed was missing in Round 1.

Both reported red→green proofs (reverting each fix in turn and confirming exactly the expected tests fail, and only those) are the right way to demonstrate the tests actually exercise the fix rather than passing vacuously — I take the report's word on this specific mechanic since it describes a temporary revert-and-rerun I can't replay from a static read, but the *tests themselves*, which I did read and trace, would genuinely fail against the pre-fix code as I understand it (I confirmed this by tracing the pre-fix logic from Round 1 against these exact new assertions).

**One minor observation, not blocking:** the new `getWeatherVoiceCommentMetadataById` export has no direct standalone test in `weatherVoiceContent.test.js` (untouched this revision) — its unregistered-ID branch is reachable but never actually exercised directly, since every caller in `weatherVoiceHistory.js` already gates on `isKnownId()` first. It's a trivial, low-risk pure function and I read it and confirmed it's correct by inspection, so this doesn't affect the verdict — just worth a direct unit test if `weatherVoiceContent.test.js` is touched again.

### Conclusion

Both defects Ripley found are genuinely fixed at the root, verified by my own trace against the actual code rather than the report's narrative. Scope stayed exactly where the v2 prompt limited it. Report accuracy (test counts, audit wording) is corrected. Nothing else to flag.

## Ripley — Final assessment, Revision 2 (2026-09-10)

**Verdict: PASS**

The two blocking history defects from Round 1 are resolved. Read the revised history implementation, regression cases, metadata lookup helper, CC revision report and Jonesy Round 2 review against approved-prompt-v2.md and the inherited v1 requirements. Validation now precedes storage access and uses per-ID metadata; first-operation recording hydrates persisted history before upsert. Real and language-independent valid presentations remain supported, with no change to weather interpretation or content selection.

### Independent verification

- Reran the exact two original reproductions against actual source modules using Node VM modules and injected fake storage. `{show:true,comment:{id:"rain_01"}}` at 1000 now produces **zero reads, zero writes and no persisted record**. With persisted `{rain_01:900,rain_02:950}`, recording a valid rain_01 presentation at 1000 as the first adapter operation now produces **{rain_01:1000,rain_02:950}**, retaining the other entry. Both assertions passed.
- `node node_modules/vitest/vitest.mjs run src/lib/weatherVoiceHistory.test.js src/lib/weatherVoiceContent.test.js src/lib/weatherVoiceSelector.test.js src/lib/weatherVoiceTypes.test.js src/lib/weatherVoiceEngine.test.js src/lib/weatherVoiceRules.test.js src/hooks/useForecast.scoringInvariance.test.js` — **7 files, 151 tests passed**, independently rerun with approved elevated access.
- `node node_modules/eslint/bin/eslint.js src/lib/weatherVoiceHistory.js src/lib/weatherVoiceHistory.test.js src/lib/weatherVoiceContent.js` — passed.
- `git diff --check` — passed with informational LF/CRLF notices. Working-tree scope remains limited to #406 code/types/tests and workflow documents; no existing UI, scoring, Phase 1 engine/rules or translation-system edits.

Full-project lint, the 1306-test suite, production build and CC's temporary revert/red-to-green experiments remain **CC-reported validation**, not independently rerun by Ripley. The targeted run and direct regression reproductions provide sufficient independent evidence for this correction.

No blocking finding remains. Persistence is still best effort and per-instance initialization intentionally does not provide cross-tab synchronization. UI integration, exposure deduplication in React and English content remain later-phase work as scoped. Set CURRENT to CLOSED. No commit, push or GitHub issue closure performed.
