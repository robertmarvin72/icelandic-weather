# Ticket 420 — Result Review (Jonesy)

Reviewer: Jonesy (technical peer review). Read-only; nothing was implemented, committed, pushed or deployed.

## Round 1 verdict: PASS (with three minor documentation/label defects and four notes; none blocks)

Basis: `approved-prompt-v1.md` (as amended by the owner decision in `cc-report.md` §12), `cc-report.md`, `content-validation.md`, then the live files on the user's machine. CC's report was not trusted on its own. Live-source checks were done by parsing the files mechanically, not by sampling. mtime sweep done; no out-of-scope production file changed.

## 1. Verified against live source

| Requirement | Evidence |
|---|---|
| Ledger fixture is complete and exact | `src/test-fixtures/weatherVoiceLedger.js`: parsed all 195 rows, no duplicate IDs. Status totals retained 11, new 80, retired 16, reserve 25, excluded 63. Active per condition good 22, excellent 21, rain 18, cold 14, sun_wind 16; the four cautious/serious conditions hold 0 active. The reserve set equals the approved 21 + rain_13 + rain_heavy_24/25/29 exactly. The retired set equals the 14 from #432 + cold_02 + excellent_02. The excluded set is cold_wet 20, wind_strong 20, rain_heavy 23. Every row's `is` and `issueEn` equals my independent parse of `issue-source.md`. `enOverride` is true on exactly cold_01, cold_03 and excellent_03. 25 NOTE rows carry a `note`. The fixture is imported only by 5 test files; no production module or script imports it. |
| Runtime lists match the ledger | `is.js` and `en.js`: 91 entries each, no duplicates, no orphans, none missing. IS text equals the ledger; EN text equals the issue text plus the three owner overrides. |
| Registry and metadata | `weatherVoiceContent.js`: 91 rows whose IDs equal the ledger; conditions and moods correct (cold=freezing, rain=unimpressed, sun_wind=suspicious, excellent=excellent, good=happy); all `voiceLevel: sarcastic`. `RETIRED_JOKE_IDS` has 16 entries. rain_13 and the other reserves are not in it, which is correct because they were never released. |
| Manifest | `weatherVoiceShareManifest.generated.js`: 182 keys, none extra, none missing. Text and mood match the ledger for every pair. |
| Share files, released-file immutability | Listing of `public/share/tjaldur/v1/{is,en}`: exactly 91 active + 16 retired IDs, each as html + png (428 files = 108 released + 320 new). rain_13 and every reserve and excluded ID are absent. All 108 pre-existing files keep their old mtimes (latest 1790198154311); new files are about 1791048958xxx. No released file was rewritten. The released `en/cold_01`, `cold_03` and `excellent_03` pages already carry the override wording, so the "overrides" keep the released live text and cause no page/app mismatch. |
| Engine, rules, selector, safety, history, hook, dialog, image, exporter untouched | mtime sweep of all `src/`. Everything outside the #420 set is older than the end of #432 (1791043046437): `weatherVoiceEngine.js`, `Rules.js`, `Selector.js`, `Safety.js`, `History.js`, `ShareImage.js`, `SharePolicy.js`, `ShareSnapshot.js`, `ShareCatalogue.js`, `useWeatherVoice.js`, `WeatherVoiceShareDialog.jsx`, `WeatherVoiceCard.jsx`, `safety.js`; `scoring.js`, `forecastNormalize.js` and `config/hazards.js` are weeks older; `scripts/exportWeatherVoiceShare.mjs` (1791041963353) and `weatherVoiceShareExportLib.mjs` are also unchanged, and `scripts/.tmp-export-lib-test` is empty. Files changed by #420 under `src/` are exactly: `is.js`, `en.js`, `weatherVoiceContent.js`, the manifest, the ledger fixture, 4 new tests and 5 updated tests (below), plus docs. |
| New tests | Read in full: `weatherVoiceLedger.test.js` (counts, per-ID sets, overrides, raw/registry/library/catalogue/manifest/disk reconciliation, retired-file presence, safety separation), `weatherVoiceRotation.test.js` (real pool sizes, forced-remaining choice, exact 7-day boundary, least-recently-shown fallback with lexical tie-break, rehydration, retired IDs discarded from storage, safety bypass; deterministic, no probabilistic assertions), `weatherVoiceContentGuards.test.js` (emoji, second person, imperatives, time/season, length; good_21 asserted as the explicit exception), `weatherVoicePipeline.test.js` (all nine conditions in IS and EN through the real engine and selector; cautious/serious return only safety IDs). I re-ran the guard heuristics independently: the only second-person hit is good_21 (IS and EN), the longest IS is 59 (good_16) and the longest EN is 50 (sun_wind_07). |
| Updated stale tests | `weatherVoiceContent.test.js`, `weatherVoiceVoiceLevel.test.js`, `weatherVoiceShareCatalogue.test.js`, `WeatherVoiceCard.test.jsx` and `useWeatherVoice.voiceLevel.test.jsx` now derive counts from the ledger or from `WEATHER_VOICE_KNOWN_IDS`. The `excellent_02` fixture in the card test is gone (it uses excellent_01/03). The narrow `^excellent_0[1-3]$` regex is replaced by membership in the 21 active excellent IDs. The assertions are correct; see F2 for stale labels. |
| Docs | Bible §13, production-validation §13 and share-pilot §11 are narrow addenda that leave the history intact. They record 91 active, rain_13 reserved by owner decision, the retired cold_02 and excellent_02, 182 pairs, 160 new pairs / 320 files, the old URLs staying public, and that nothing is claimed about live GA4 or Facebook. `content-validation.md` §1–§12 reconcile with the fixture, including the 11/80/16/25/63 split and the 25 NOTE caveats. |
| Browser evidence | `results.json`: 36 cells (28 target, 8 control). Checked each cell mechanically: card text equals the ledger text in 28/28; the pinned pool size and index equal the sorted active pool (e.g. good_16 = index 14 of 22); a `weather_voice_viewed` event carries the target `voice_id` in all 28; share button present on all 28 targets and absent on all 8 controls (extreme_wind, heavy_rain), whose text is the safety copy; 0 GA requests in 36/36; no clipping, overflow or out-of-viewport quote; the 14 mobile share previews are all 1080 × 1080. I viewed `mobile-390-is-good_16-share-dialog.png` and `mobile-390-en-rain_14-share-dialog.png`: full text visible, no clipping. |
| Production bundle | Staged `dist/assets/index-RJ0BvVhl.js` (built after the final manifest write) and searched it myself: all 91 active IDs and texts are present; 0 hits for any reserve or excluded ID, 0 hits for any reserve or excluded text of 12+ characters, 0 hits for `WEATHER_VOICE_LEDGER`, `weatherVoiceLedger`, `issueEn`, `enOverride`. Bundle size 1,399,259 bytes (1,399.26 kB) matches CC's figure. |
| Safety unchanged | Four safety messages in the fixture equal the #432 copy; the pipeline test covers cautious and serious conditions in both languages; no safety-side source file changed. |

## 2. Findings

**F1 (minor, documentation, not reported by CC): stale count in the production-validation addendum.** `docs/analytics/weather-voice-production-validation.md` §13, "Interpretation" bullet, says the `voice_id` distribution "now spans 92 IDs instead of 13". Active is 91 since the rain_13 decision (the "13" before is correct: 11 retained + cold_02 + excellent_02). This is the one number the rain_13 follow-up pass missed. Fix: "91".

**F2 (minor, test labels/comments, no runtime effect, not reported by CC): three stale count labels.** (a) `weatherVoiceVoiceLevel.test.js:167`: the test title says "the 92 active personality entries"; the assertion is against `LEDGER_ACTIVE.length` (91), so it passes with a wrong title. (b) `weatherVoiceShareCatalogue.test.js:15`: the comment says "Today: 27 ids * 2 languages = 54"; the assertion is derived and correct. (c) `weatherVoiceContent.test.js:369`: the comment says real EN is "genuinely 27 entries now"; this is an older #412 comment, now also wrong. All three would mislead the next reader. Recommend a micro-fix by CC before commit; whether it warrants a formal REVISE is Ripley's call.

**F3 (minor, documentation): imprecise example in `content-validation.md` §4 item 3.** The rain_04 / rain_21 pair is described as a "one-word deadpan label ('Rigning.' vs 'Rigning. Klassískt.')". The live rain_04 IS is "Já já. Rigning." (EN "Yes, yes. Rain."). My own token scan does not reproduce an IS 0.50 overlap for this pair (it depends on the stopword handling CC used). The conclusion (different beats, keep both) stands; only the quoted evidence is off.

**N1 (note, process): the owner decision exists only in CC's own report.** The approved prompt (`approved-prompt-v1.md`) still lists 92 active and rain_13 as active. The 2026-10-03 decision (keep excellent_17, reserve rain_13) is recorded in `cc-report.md` §12 and `content-validation.md`, and there is no `approved-prompt-v2.md` or Ripley record in the task folder. I cannot verify the decision from here; I only checked that the implemented result is consistent with it. Ripley should confirm it in the task record before closing. CC also deleted its own untracked rain_13 html/png files before the final export; this was acceptable (no tracked file touched, directory listing confirms they are gone), but it was a deletion outside the approved prompt's steps.

**N2 (note, my own miss, owned): the excellent_17 / rain_13 overlap.** My Round 1 near-duplicate scan ran within one condition at a time, so it missed this cross-condition pair; CC found it during execution. I re-ran the scan across all 91 final lines. Pairs at token overlap ≥ 0.5 in IS or EN across conditions are all shared sentence frames, not the same joke: excellent_05/good_02 ("Well. This is … good."), excellent_01/good_02, excellent_13/good_23 ("Þetta er eiginlega …"), excellent_04/good_19, excellent_15/good_10, excellent_14/good_05 ("The weather is showing off / behaving"). Within a condition only excellent_01/excellent_05. I see no second excellent_17/rain_13 case. Frame repetition (many lines start "Þetta er …" / "This is …") is an owner taste question, not a defect.

**N3 (note): stale-episode browser check not re-run after the decision.** `stale-results.json` (mtime 1791049229473) predates the manifest rewrite (1791049572000). The result is still valid because good_16's pool is unchanged by the decision, and the 28-cell matrix was re-run on the final tree. CC states this honestly; I only confirm the timing.

**N4 (note, carried): browser evidence does not show `voice_level`.** The DEV `[event]` strings omit `voice_level` (same as #432 F2). Emission is proven by the exact-payload hook tests, not by the browser run.

## 3. Limits of this review

No shell on the user's machine: I did not run the full suite, lint, build or `share:export`. "155 files / 2,312 tests, lint clean, build succeeds, export 182 reused / 0 created, 30 files / 765 tests" are CC's figures. I verified the new and updated tests by reading them and by independently reproducing what they assert against live source; preservation of released files was verified by directory listing and mtimes, not `git status`. I did not read the editorial quality of the Icelandic lines beyond the checks above (sun_wind_04 "blásið" still needs an Icelandic-reader check, as the content validation says), and I did not check hosted files, CDN caches or GA4. The screenshots I viewed are two of the 36 cells. Please run the suite and `git status --short public/share` before committing; expect 320 untracked new files and no modified or deleted tracked ones.

## 4. Verdict

PASS. The ledger, runtime lists, registry, retired set, manifest, share files, tests, docs, browser evidence and production bundle all reconcile with the approved ledger as amended by the owner decision. F1–F3 are small and label-level; I recommend fixing them in one micro-pass before Róbert commits, and whether they justify a formal REVISE round is Ripley's call. N1 needs a Ripley record. No commit, push, deploy or GitHub closure performed. Canonical CLOSED/BLOCKED is Ripley's call.

---

## Ripley independent checks — 2026-10-03 (final disposition pending owner confirmation)

Read canonical workflow/CURRENT, approved prompt requirements, CC report including section 12, Jonesy's result review, current validation report, ledger/rotation tests and affected source diffs.

Independent run: `node node_modules/vitest/vitest.mjs run src/lib/weatherVoice src/hooks/useWeatherVoice src/components/WeatherVoice src/App.weatherVoiceIntegration` passed **30 suites / 765 tests**. `npm run lint` passed. `git diff --numstat -- public/share` returned no tracked changes; `git ls-files --others --exclude-standard public/share` counted **320 new files**. Reviewed ledger assertions and deterministic real-pool rotation coverage. Full-suite/build/export/browser evidence remains attributed to CC/Jonesy, not independently rerun here.

Confirmed documentation/label corrections needed:
- production-validation section 13 still says 92 instead of the current implemented 91.
- weatherVoiceVoiceLevel.test.js title says 92; weatherVoiceShareCatalogue.test.js comment actually says 92/184 (not 27/54 as Jonesy reported); weatherVoiceContent.test.js comment says 27. Assertions are ledger-driven and pass.
- content-validation section 4 must quote rain_04 accurately as `Já já. Rigning.` and avoid an unexplained similarity number. The accepted keep-both disposition does not change.
- content-validation section 12 still presents sun_wind_04 as awaiting an Icelandic-reader check; owner already confirmed its wording (and good_16) in this thread. Preserve caveats, but do not reopen resolved decisions.

N1 is not resolved by CC's own claim alone: asked Róbert directly to confirm the reported choice to reserve rain_13 and keep excellent_17 (91 active). The user's 'Continue with Jonesy búinn að reviewa CC' authorizes continuing the review, but is not an explicit answer to that editorial question. Do not represent it as approval. CURRENT stays RESULT_REVIEW pending the answer; no final PASS/CLOSED and no executable corrective prompt yet. The concrete correction scope is documented above and can be issued promptly once the ledger decision is confirmed. No runtime content was edited, committed, pushed or deployed.

---

## Ripley final assessment — Round 1, owner confirmation resolved (2026-10-03)

**Verdict: REVISE — documentation/test-label micro-pass only.** Runtime behavior passed the independent 30-suite / 765-test run and lint recorded above. No new runtime defect identified.

Róbert directly answered **"Já samþykkt"** to the explicit question whether rain_13 should remain inactive as currently implemented, leaving 91 active entries per language. This resolves N1 and ratifies the 91-entry ledger with excellent_17 retained. This is direct human confirmation, not reliance on CC's report. No editorial question remains pending.

Issued approved-prompt-v2.md for the verified F1–F3 count/label/quotation corrections and accurate recording of already-resolved wording approvals. Scope is comments/test titles/documentation only. All earlier runtime and artifact-preservation evidence remains applicable; no repeat broad validation is warranted before this small correction is made. CURRENT transitions RESULT_REVIEW -> READY_FOR_CC. No code implementation, commit, push, deployment or GitHub closure performed by Ripley.

---

## Jonesy — Round 2 result review of approved-prompt-v3 (Part A 113 primary, Part B heavy-rain supplement)

Reviewer: Jonesy (technical peer review). Read-only; nothing was implemented, committed, pushed or deployed.

**Verdict: REVISE — comment/documentation micro-pass only (3 stale items that v3 R10 explicitly required to be fixed, plus one wording inconsistency). No runtime, content, test-logic or artifact defect found. Everything else PASS.**

Basis: `approved-prompt-v3.md` (R1–R12), `cc-report.md` (history §1–12, Part A, Part B), `content-validation.md`, then live files re-staged this round (mtimes checked). CC's report was not trusted on its own; ledger, lists, manifest and bundle were checked by parsing, not sampling.

### 1. Verified against live source

| Area | Evidence |
|---|---|
| Ledger fixture | `weatherVoiceLedger.js` parsed: 195 rows; retained 11, new 102, active_supplemental 3, retired 16, reserve 0, excluded 63. Primary active 113 (good 23, excellent 22, rain 23, cold 23, sun_wind 22); the four cautious/serious conditions hold 0 primary. Every `is`/`issueEn` equals `issue-source.md`; `enOverride` only on cold_01, cold_03, excellent_03. |
| Runtime lists, registry, manifest | `is.js`/`en.js`: 113 each, equal to the ledger. `weatherVoiceContent.js`: 113 metadata rows, `RETIRED_JOKE_IDS` 16, no supplement ID in it. Manifest: 226 keys, text/mood/URLs equal to the ledger. |
| Share files and immutability | Baseline hash file has 428 entries, final has 516; **all 428 baseline hashes are unchanged, none missing, 88 new** (= 44 pairs). 108 + 408 = 516. Excluded and supplement IDs have no page or image. |
| Preservation of #432 machinery | `weatherVoiceHistory.js` sha256 equals the baseline. `weatherVoiceSelector.js`: exactly three `export` keywords added; stripping them reproduces the baseline sha256. `weatherVoiceEngine.js`, `Rules.js`, `Safety.js`, `ShareImage.js`, `SharePolicy.js`, `ShareSnapshot.js`, `WeatherVoiceShareDialog.jsx`, `safety.js`, `exportWeatherVoiceShare.mjs`, the export lib and `scoring.js` have mtimes older than the end of #432. The baseline-vs-Part B runtime hash diff lists only the expected files (is, en, Content, Selector, ShareCatalogue, Manifest, hook, card, App.jsx, Types, ledger). `weatherVoiceShareCatalogue.js` differs from the baseline by a rewritten doc comment; I could not diff it against the baseline from here (no git), but its logic filters `voiceLevel === "sarcastic"` and is covered by the ledger test. |
| Supplement architecture (R1–R8) | Read in full: `supplement.js` (3 entries, `condition: heavy_rain`, 7-day cooldown, IS/EN equal to the ledger), `weatherVoiceSupplement.js` (validation; eligibility derived from engine result and the visible `safety_heavy_rain` presentation, so forged tones and other conditions are refused; selection reuses the exported selector helpers; RNG failure falls back deterministically), `weatherVoiceSupplementHistory.js` (own key `weather_voice_supplement_history_v1`, known-ID filter, guarded storage), `useWeatherVoice.js` (supplement computed in its own try/catch after the primary; returned as `supplement` and `onSupplementVisible`, never on `presentation`; handler checks episode key, resolved key, cautious/heavy_rain/`safety_heavy_rain`, ID match and dedupe, records to its own history, then emits `weather_voice_supplement_viewed` with exactly the five fields), `WeatherVoiceCard.jsx` (second observer declared after the card observer, ratio 0.9 via `SUPPLEMENT_THRESHOLD`, own cancelled/notified state, visibility handling; `<p data-weather-voice-supplement>` below the warning, smaller, lighter), `App.jsx` (only the two new props at the call site). |
| Tests | Read in full: `useWeatherVoice.supplement.test.jsx` (throwing registry, rng, getItem/setItem; six malformed-registry cases; empty registry gives a warning-only card with one observer; extreme_wind/strong_wind/cold_wet get no supplement; 0.5 then 1.0 ratio gives one event and one write on the supplement key only; observer order; exact payload; mismatched key, ID and repeat rejected; stale observer after a site change; no share), `weatherVoiceSupplement.test.js`, `weatherVoiceSupplementEntrypoints.test.js` (catalogue, manifest, Facebook resolver, snapshot and image renderer all refuse), plus the changed assertions in `useWeatherVoice.voiceLevel.test.jsx` (narrowed to `not.toHaveBeenCalledWith("weather_voice_history_v1", …)`, key-specific) and the ledger/guards/pipeline counts (195/113/102/3/16/0/63; guards keep good_21 as the one primary second-person exception and assert rain_heavy_29's generic "you" as a documented, tested exception). |
| Production bundle | Staged `dist/assets/index-BK38Eq4-.js` (1,419,317 bytes, matches CC's 1,419.32 kB) and searched it myself: all 113 active IS and EN texts and the 3 supplement IS and EN texts are present; **0 hits** for any of the 63 excluded IDs or texts of 12+ characters; 0 hits for `WEATHER_VOICE_LEDGER`, `weatherVoiceLedger`, `issueEn`, `enOverride`; the 16 retired IDs appear, as expected (`RETIRED_JOKE_IDS`); the supplement history key and `data-weather-voice-supplement` are present. Event names (including the old `weather_voice_viewed`) are absent from the bundle because `trackEvent` is dead-code-eliminated when no GA ID is set at build time; this is existing behaviour, not a defect. |
| Browser evidence | `part-ab/results.json` checked mechanically: primary 32/32 text equals the ledger, target `voice_id` event in 32/32, no supplement on primary cells, 0 GA requests; supplement 12/12 (warning text, supplement text equal to the ledger, DOM order, supplement smaller than the warning, no share button, one primary and one supplement event); controls 12/12 (no supplement, no share, safety ID events); partial visibility at 30.5% gives 0 supplement events, 1 after full visibility; language IS→EN re-selects rain_heavy_25; site change to a sarcastic site removes the supplement and shows share; the stale dialog closes with no share button. I viewed `mobile-390-en-rain_heavy_29-card.png` (warning leads, Noah line beneath, smaller and lighter) and `partial-visibility-mobile-390-en-rain_heavy_25.png` (supplement cut off at the viewport edge, the case 0.9 must reject). |
| Docs | Bible §13 (updated), §14 (owner override limited to 12 IDs, with the rule it relaxes and the statement that it does not apply to future text), §15 (supplement: heavy_rain only, never shared, own history/observer/event, mixed-hazard limit, rollback, limits); production-validation §14 (new event, exact parameters, 90% rule, no live-GA claim, custom-dimension registration still an owner step); share-pilot §11/§12 (226 pairs, 204 new pairs / 408 files, supplement has no share path). `weatherVoiceTypes.js` has the supplement typedefs (R11). |
| 12 HOLD override list | The list in Bible §14 and `content-validation.md` §4 (cold_04, 05, 06, 13, 17, 24; good_12; rain_10, 15; sun_wind_06, 21, 22) equals my Round 1 HOLD set exactly. CC flags it as a derivation for owner confirmation, which is the right way to record it. |

### 2. Findings

**F1 (documentation, REVISE item; carried from Round 1 F1, required again by v3 R10/R11): production-validation §13 still says "now spans 92 IDs instead of 13".** The same section's "Current state" bullet says 113 primary IDs per language, so the section contradicts itself, and the v1 value 92 was never right for any shipped state. The "instead of 13" half is correct (11 retained + cold_02 + excellent_02). Fix: either "113" or a count-independent phrase ("now spans the full active primary set instead of 13").

**F2 (test comments, REVISE item; carried from Round 1 F2, required again by v3 R10; CC's report §A.6 states this cleanup was done but it is not complete):**
- `weatherVoiceShareCatalogue.test.js` lines 16–17: the comment still says "92 active ids * 2 languages = 184". It is wrong for the 113-entry state (226) and for the 91-entry state. File mtime 1791048818914, i.e. not touched in v3.
- `weatherVoiceContent.test.js` line 369: the comment still says real EN "is genuinely 27 entries now". It is an older #412 count and was never corrected.
- The third Round 1 item, the "92" in the `weatherVoiceVoiceLevel.test.js` test title, is fixed (no occurrence left).
Both are comments; the assertions around them are ledger-derived and correct. Fix: remove the numbers (v3 asked for count-independent wording; do not write "113" or "226").

**F3 (accuracy of the CC report, note tied to F2):** `cc-report.md` Part A/§A.6 says comments and headers "now avoid count words" and that test titles were made count-independent. Two comments and one doc sentence above contradict that. CC should either fix the three places or soften the claim; I checked only with `grep` for `92`, `184`, `27 `, `genuinely` over `src/`, so other stale wording that does not use those tokens would not show up.

**F4 (documentation, minor, new): `content-validation.md` §3 still lists "sun_wind_04: the IS 'blásið' needs an Icelandic-reader check. Not judged here" as a live caveat,** while §2 of the same file records sun_wind_04 as owner-confirmed. Ripley's Round 1 note said resolved wording approvals must not be reopened. Keep the caveat as history if wanted, but say it was confirmed by the owner.

Closed from Round 1: F3 (rain_04 is now quoted accurately as "Já já. Rigning." and the similarity number is gone from `content-validation.md` §7).

**Notes (none blocks):**
- **N1:** the 12-line override list is CC's derivation; the owner decision text did not name the IDs. It matches my HOLD set, but the owner (via Ripley) should confirm it before the override is treated as final.
- **N2:** the midnight/Reykjavik date transition was not browser-tested (CC says so in §14). I did not find a hook test for it either, but I did not read every existing exposure-lifecycle test for it.
- **N3:** the hook caches the supplement for the episode and reads `supplementRegistry` at selection time, so a registry change after mount is not picked up until the next selection (CC's B.12 states this). Fine for a static registry.
- **N4:** the browser event strings do not show the primary `voice_level`; the exact-payload hook tests prove it (same as #432 F2).
- **N5:** the English card quote uses the same opening quote glyph as before; unchanged and out of scope.
- **N6:** `weatherVoiceShareCatalogue.js` and `App.jsx` could not be diffed against baseline source; I verified them by reading the current code plus the hash lists. A `git diff --stat` before commit would settle it.

### 3. Limits of this review

No shell on the user's machine. I did not run the suite, lint, build, `share:export` or `git status`. "158 files / 2421 tests, lint clean, build succeeds, export 44 created / 182 reused" are CC's figures. I verified tests by reading them and by reproducing what they assert against live source; preservation by hash lists, mtimes and directory listing. I did not review the Icelandic wording quality beyond the ledger match, I did not check hosted files, CDN, GA4 or Facebook, and I viewed 2 of the browser screenshots.

### 4. Recommendation

REVISE as a micro-pass: F1, F2, F4 and (if CC agrees) a corrected claim for F3. Comment, test-label and doc text only; no code, no tests logic, no regeneration, no repeat of browser or export validation. After that, Parts A and B are PASS. Before Róbert commits: run the suite, `git diff --stat`, and `git status --short public/share` (expect 408 untracked new files, 0 modified or deleted tracked ones). Nothing has been committed, pushed or deployed. Whether this stays REVISE or is closed as PASS-with-notes, and CLOSED/BLOCKED, is Ripley's call.

---

## Ripley final assessment of v3 — 2026-10-03

**REVISE: documentation/comment micro-pass only.** Independently ran 33 Weather Voice suites / 874 tests and npm run lint: all passed. Inspected supplemental selector validation/eligibility and hook failure-isolated selection, separate exposure guards, and confirmed the reported stale documentation/comments. Independently checked all 428 baseline public/share SHA-256 entries: zero mismatches; final inventory 516 files. git diff --numstat for public/share and weatherVoiceHistory.js is empty. Full suite/build/export/browser evidence remains attributed to CC/Jonesy; not independently rerun here.

Owner confirmation note is resolved from direct conversation: all 25 listed reserves were explicitly approved active, which includes the 12 HOLD IDs. The three ark lines were explicitly approved alongside caution. No repeat owner question is necessary. sun_wind_04 and good_16 wording was already directly confirmed unchanged.

Issued approved-prompt-v4.md for the remaining stale 92/184/27 comments/count statement, sun_wind_04 approval wording, HOLD confirmation wording and an honest report addendum. No runtime changes requested. Midnight browser date transition remains a disclosed evidence limit. CURRENT moves to READY_FOR_CC; no commit, push, deployment or issue closure performed.

---

## Jonesy — Round 3 result review of approved-prompt-v4 (documentation and comments micro-pass)

Reviewer: Jonesy (technical peer review). Read-only; nothing was implemented, committed, pushed or deployed.

**Verdict: PASS.** F1, F2, F3 (report accuracy) and F4 from my Round 2 are corrected, the pass stayed inside the v4 scope, and I found no new defect. Runtime, content, assertions, manifest and share files are unchanged since the v3 state I already verified.

Basis: `approved-prompt-v4.md`, `cc-report.md` §v4.1–v4.6, then the live files re-staged this round (mtimes checked). CC's report was not trusted on its own.

### 1. Verified against live source

| Item | Evidence |
|---|---|
| F1: production-validation §13 | The "spans 92 IDs" sentence is gone. The Interpretation bullet now says the primary `voice_id` set is the full active primary set (113 per language, per the current ledger) instead of the 13 IDs before #420, states that supplement IDs are reported only through `weather_voice_supplement_viewed`, and keeps the discontinuity and unchanged-payload sentences. It agrees with the "Current state" bullet in the same section. Historical §1/§3/§12 text is untouched. |
| F2: `weatherVoiceShareCatalogue.test.js` | The "92 active ids * 2 languages = 184" comment is replaced by count-independent, ledger-based wording. The assertion lines I read (`expectedCount` reduce, `toHaveLength(expectedCount)`, `KNOWN_IDS.size` equals `ledgerActive.length`, `toHaveLength(ledgerActive.length * 2)`) are as before. |
| F2: `weatherVoiceContent.test.js` ~366–371 | "genuinely 27 entries now" is replaced by a historical #412 note (synthetic empty-array check; the real EN library is no longer empty; its size is derived from the ledger). The describe and the `{ valid: true, errors: [] }` assertion are unchanged. |
| F4: `content-validation.md` §3, §4 | sun_wind_04 now records the owner's approval of the IS and EN lines unchanged and keeps only the factual stock-phrase note. §4 has an "Owner approval (2026-10-03, direct chat)" paragraph: all 25 rows approved, the 12 HOLD lines a subset, nothing pending, the earlier "derivation awaiting confirmation" wording marked superseded. The override scope (those 12 IDs only, future text still bound by the Bible) is kept. |
| F4: Bible §14 | The "owner should confirm it at review" bullet is replaced with the owner approval of all 25 restored lines, the 12 as a subset, nothing pending. Scope sentences unchanged. |
| F4: ledger fixture | Only the `note` field of `sun_wind_04` changed ("…stock phrase, slightly benign for 5-10 m/s. Owner approved the IS and EN lines unchanged (2026-10-03)."). I re-parsed all 195 rows: id, status, IS and EN text still equal my earlier parse; the file grew by 12 bytes, which matches replacing the old 46-byte sentence with the new 58-byte one. No test asserts note text (grep). |
| Scope | mtime listing of `src/lib`, `src/hooks`, `src/i18n/weatherVoice`, `src/test-fixtures`, `src/` root and `public/share/.../is`: the only files newer than the v3 state are the two test files above and the ledger fixture. Runtime modules, supplement files, hook, `App.jsx`, `weatherVoiceShareManifest.generated.js`, selector, history, `weatherVoiceContent.js`, `is.js`, `en.js` all keep their v3 mtimes; no share file is newer than 1791061419065 (v3 export). |
| Searches | `grep` over `src/` test and fixture comments and titles for 27, 54, 91, 92, 182, 184: no Weather Voice hit. `spans 92`, `92 active ids`, `genuinely 27`: none in current docs or tests. `Icelandic-reader` survives only in the preserved history files (`prompt-review.md`, `result-review.md`, `approved-prompt-v2.md`, `approved-prompt-v4.md`) and the new report text that quotes it as "before". `should confirm`/`confirm it at review` for the override list: none. The remaining 320 / 182 / 91 figures in `content-validation.md` §9–§11 are before/after snapshot rows and the "91-entry state" label, which are correct as history. |
| F3: report accuracy | `cc-report.md` §v4.1 states plainly that the earlier "cleanup done" claim (Part A §A.6 item 3 and §B.5) was premature, keeps the earlier text as history, and lists the exact fixes in §v4.3 (F1, F2a, F3, F4a–F4d). The §v4.4 "no Weather Voice count remains" claim matches my own grep. |

### 2. Notes (none blocks)

- **N1:** I did not see the owner's direct chat. The "Þessir textar mega allir vera virkir" approval, including the 12 HOLD IDs, rests on Ripley's and CC's record. The ID list in the approval matches my own HOLD set, so the record is internally consistent.
- **N2:** the v4 validation figures (2 files / 45 tests, lint exit 0) are CC's. Ripley's record also reports an independent 33 suites / 874 tests and lint for v3. I did not run anything.
- **N3:** I listed `public/share/tjaldur/v1/is` only for mtimes this round, not `en`, and I did not re-hash the 516 share files; v4 does not touch them and Ripley recorded the 428 baseline hashes as matching for v3. I also did not re-list `src/components` this round.
- **N4:** the carried limits stand: the midnight date transition was not browser-tested; jokes can weaken the caution tone next to a warning; mixed hazards are not independently described; old retired URLs remain public.

### 3. Verdict

PASS for approved-prompt-v4, and with it Parts A and B of #420 as reviewed in Round 2 (the v3 findings I raised were all documentation/comment items, now closed). Before Róbert commits: run the Weather Voice suites and lint, `git diff --stat`, and `git status --short public/share` (expect 408 untracked new files, 0 modified or deleted tracked ones). Nothing has been committed, pushed or deployed. CLOSED/BLOCKED is Ripley's call.

---

## Ripley final assessment of v4 — 2026-10-03

**PASS — #420 CLOSED locally.** Read the approved v4 prompt, CC's v4 report and Jonesy's Round 3 PASS. Independently inspected the corrected production-validation interpretation, ledger-based test comments, owner-approval wording and report correction. F1–F4 are resolved. The direct owner approval of all 25 restored lines, including the 12 HOLD IDs, and the additive treatment of the three ark lines are confirmed from this conversation; no approval remains pending.

Independent validation: `node node_modules/vitest/vitest.mjs run src/lib/weatherVoiceContent.test.js src/lib/weatherVoiceShareCatalogue.test.js` passed (2 files / 45 tests); `npm run lint` passed. The prior independent v3 result (33 suites / 874 tests and all 428 baseline share hashes unchanged, 516 files total) remains recorded above. Full-suite, build, export and browser evidence remain attributed to CC; they were not rerun for this documentation/comment correction.

Final scope: 113 primary IDs per language plus 3 separate heavy-rain supplemental IDs alongside the unchanged warning; 226 primary share pairs. Carried limitations remain: midnight date transition not browser-tested, caution-tone and mixed-hazard limitations, and legacy retired share URLs remain public. These are disclosed limits, not unresolved v4 findings.

CURRENT moves to CLOSED. No commit, push, deployment or GitHub issue closure performed.
