# #420 — CC report (approved-prompt-v1.md)

Written for: the owner and the Jonesy/Ripley review. Working tree at start: clean apart from the ticket-420 workflow files. CURRENT.md moved READY_FOR_CC → CC_IN_PROGRESS before any edit. No commit, push, deployment, automated posting, GA4 change or GitHub closure was performed. The approved prompt is unchanged.

Companion document: `content-validation.md` (counts, per-ID dispositions, NOTE caveats, overlap review, sizes, browser evidence).

## 1. Read-only audit (before any runtime edit)

**Data flow confirmed** (prompt order): engine/rules (`weatherVoiceRules.js`, `weatherVoiceEngine.js`) → shared metadata registry plus separate `is.js`/`en.js` lists (`weatherVoiceContent.js`) → selector and safety dispatcher (`weatherVoiceSelector.js`, `weatherVoiceSafety.js`) → hook and exposure history (`useWeatherVoice.js`, `weatherVoiceHistory.js`) → homepage `WeatherVoiceCard` (`App.jsx` ~L267 and ~L406) → share snapshot, dialog, image and Facebook (`weatherVoiceShareSnapshot.js`, `WeatherVoiceShareDialog.jsx`, `weatherVoiceShareImage.js`, `weatherVoiceFacebookShare.js`) → static catalogue, export and manifest (`weatherVoiceShareCatalogue.js`, `scripts/exportWeatherVoiceShare.mjs`, `weatherVoiceShareManifest.generated.js`). The homepage is the only entrypoint. No route or CTA was added.

**Baseline production build (before edits):** main JS `index-DEFWrQue.js` 1,348.08 kB (gzip 401.40 kB); `MapView` 200.71 kB; CSS 129.47 kB; `dist/` 39,045,098 bytes.

**Baseline state:** 108 released share files tracked in git. Runtime library 13 personality entries per language. Manifest 26 entries. Git HEAD is `749fc5df` (#432).

**Canonical text source:** `issue-source.md` has no `wind_extreme` block (its 5 IDs were released by the parent commit). Released text for retired IDs therefore comes from `git show HEAD~1` (the last library before #432), which has all 27 released entries.

## 2. Ledger construction

The approved ledger was turned into a TEST-ONLY fixture by a one-off scratch generator at `scratchpad/gen420.mjs`, outside the repo. The generator parses the issue text and applies the owner-approved ranges, the reserve/retired/excluded lists and the three EN overrides. It asserts every count before writing anything. It is re-runnable and idempotent. Nothing was hand-copied into the fixture.

- `src/test-fixtures/weatherVoiceLedger.js`: 195 rows (every canonical ID once, plus the 5 `wind_extreme` retired IDs). Fields: `id`, `condition` (engine name), `status`, `is`, `en`, `issueEn`, `enOverride`, `note`. Also `WEATHER_VOICE_SAFETY_LEDGER` (4 messages, taken from the #432 approved prompt). No production module imports this file (verified by the bundle search in §5).

**Generator fixes made during the run (recorded for review):** (a) the retired-text source was corrected to `HEAD~1`; (b) the safety rows were given `message_id` (missed on the first run, caught by a failing test); (c) condition labels were mapped to engine names (`wind_strong`→`strong_wind`, `rain_heavy`→`heavy_rain`, `wind_extreme`→`extreme_wind`), caught by the per-condition count check.

## 3. Changes

**Runtime content**
- `src/i18n/weatherVoice/is.js`, `en.js`: 92 entries each, same IDs and order, generated from the ledger's active rows (`retained` + `new`).
- `src/lib/weatherVoiceContent.js`: `WEATHER_VOICE_COMMENT_METADATA` now lists the 92 active IDs, each `{ condition, mood, voiceLevel: "sarcastic" }`. `RETIRED_JOKE_IDS` has 16 entries, including `cold_02` and `excellent_02`. Its comment is updated to cover both the #432 and #420 retirements.
- Engine, rules, thresholds, scoring, normalization, safety texts and selector logic: **unchanged**.

**Generated artifacts**
- `npm run share:export` (see §4): 162 new HTML + PNG pairs, 22 reused unchanged, manifest regenerated to 184 entries. No file was hand-edited.

**Tests**
- Updated to the ledger, not to hand-copied maps: `weatherVoiceContent.test.js` (92/92 counts and text from the ledger, 27/54 comments removed), `weatherVoiceVoiceLevel.test.js` (retired 16, catalogue 184, legacy 32 pages and 32 PNGs, retained 11 pairs), `weatherVoiceShareCatalogue.test.js` (184 from the ledger), `WeatherVoiceCard.test.jsx` (`excellent_02` fixture replaced with `excellent_03`), `useWeatherVoice.voiceLevel.test.jsx` (narrow `/^excellent_0[1-3]$/` replaced by membership in the 21 active excellent IDs).
- New: `src/lib/weatherVoiceLedger.test.js` (status totals, per-condition counts, owner-listed retained/reserve sets, excluded counts, exactly three EN overrides and their wording, owner-confirmed lines, raw lists reconciled with the ledger in both directions, duplicates, ASCII IDs, registry metadata, resolved libraries, cross-language validator, retired/reserve/excluded absence, catalogue, manifest, artifacts, safety counts).
- New: `src/lib/weatherVoiceRotation.test.js` (pool sizes, all-but-one-recently-exposed forcing the last ID for every RNG value, the 7-day boundary both sides, least-recent fallback, lexical tie-break, persistence and rehydration, retired IDs discarded on hydration, safety bypass unchanged). No probabilistic distribution assertions.
- New: `src/lib/weatherVoiceContentGuards.test.js` (emoji, second person with the good_21 exception asserted explicitly, narrow imperatives, narrow time/season words, approved length maxima 59/50 as a regression check).
- New: `src/lib/weatherVoicePipeline.test.js` (real engine → content → selector for nine conditions in IS and EN; cautious and serious draw only from the four safety IDs; non-sarcastic or invalid tone never produces personality output).

**Docs**
- `docs/ai/tasks/ticket-420/content-validation.md` (new, §1–12).
- `docs/weather-voice/character-and-voice-bible.md`: narrow §13 record. Historical §3 imperative example is marked superseded, and §§1–12 are unchanged.
- `docs/analytics/weather-voice-production-validation.md`: §13 addendum (two more retired IDs, 81 new active IDs; no GA4 claims).
- `docs/analytics/weather-voice-share-pilot.md`: §11 addendum (184 pairs, 162 new pages, 32 legacy pages).

**Outputs**
- `outputs/ticket-420-browser-evidence/`: `verify-expanded-pool.cjs`, `verify-stale-episode.cjs`, `results.json`, `stale-results.json`, screenshots.

## 4. Commands and results

| Step | Command | Result |
| --- | --- | --- |
| Baseline | `npm run build` | exit 0; main JS 1,348.08 kB, `dist/` 39,045,098 bytes |
| Ledger generation | `node scratchpad/gen420.mjs` (run twice, idempotent) | 195 rows: retained 11, new 81, retired 16, reserve 24, excluded 63; max lengths IS 59, EN 50; NOTE derivation 25 |
| Pre-export tests | `npx vitest run` on the Weather Voice set, excluding the export test | expected failures only (manifest and artifacts not yet generated) |
| Export | `npm run share:export` against the verified dev server on :5173 | **184 pairs; 162 created, 22 reused unchanged**; no mismatch abort; manifest written by the generator |
| Post-export Weather Voice set | `npx vitest run` on Weather Voice, ledger, rotation, guards and pipeline (30 files) | **30 files, 767 tests passed**, incl. `weatherVoiceShareExport.generated.test.js` reading all 184 pairs |
| Lint | `npm run lint` | exit 0 |
| Final build | `npm run build` | exit 0; main JS **1,399.87 kB** (gzip 410.29 kB) |
| Full suite | `npx vitest run` | **155 files, 2,314 tests passed** (was 151 / 2,081 after #432) |
| Browser matrix | `verify-expanded-pool.cjs` | **36 cells, all as specified** (see §6) |
| Stale-episode | `verify-stale-episode.cjs` | dialog closes on cautious transition; no stale share; GA 0 |

Fix-run note: the first full-suite run (before the generator's condition-label fix) passed 155 / 2,314. The label fix changed only the fixture's `condition` strings and was re-verified by the ledger, guard and pipeline suites (88 tests), and the generator is idempotent.

## 5. Validation and artifact evidence

**Released-file preservation (git, not just existence):**
- `git status --short public/share`: **0 modified, 0 deleted** (`grep` for `^( M| D|D |M |R )` returned 0).
- `git ls-files public/share | wc -l` → **108** (all pre-existing released files still tracked and unchanged).
- New untracked files: **324** (162 HTML + 162 PNG), totalling **14,459,736 bytes**.
- Legacy retired inventory: 16 IDs × 2 languages = **32 HTML + 32 PNG** (ledger test reads them).
- Runtime manifest: `git diff --stat` shows the generated file rewritten (1,401 insertions, 137 deletions), consistent with 184 entries and regeneration. Its previous entries are the 26 pre-#420 pairs.

**Bundle searches (`dist/assets/*.js|css`):**
- Reserve and excluded IDs (27 quoted IDs, the exact string `"cold_04"` etc.): **0 hits**.
- `WEATHER_VOICE_LEDGER` / `weatherVoiceLedger`: **0 hits** (the fixture is not in production).
- Distinctive inactive text (13 probes): 0 leaks. Two probes returned hits because they are substrings of **active** lines (`Bjart og blásið` = sun_wind_04; `Hitinn er` = cold_07). This is a search-selection error, not a leak, and it is reported as such.
- Search scope: `dist/assets` only. Intentionally retained released legacy HTML and PNG files in `public/` and `dist/share/` are outside this scope and are not treated as leaks.

**Dist share check:** `dist/share/tjaldur/v1/is` lists 216 files (184 active + 32 legacy). Spot check of nine reserve or excluded IDs: none present.

## 6. Browser evidence

Setup: real Vite dev server (:5173, verified serving the expanded library), deterministic `/api/*` stubs (campsite, daily forecast, `/api/me` unauthenticated). Selection is **pinned** with `Math.random` to the index of the target ID in its sorted eligible pool, using the ledger's pool sizes. Pinning makes each run reproducible. It does not test the production random draw.

- **Matrix:** targets good_16, good_10, sun_wind_07, sun_wind_10, rain_14, excellent_10, cold_20, plus controls extreme_wind and heavy_rain; × IS/EN × desktop 1280×900 and mobile 390×844 = **36 cells**. Results in `results.json`.
- **Card text equals the ledger text:** 28/28 target cells.
- **Share button:** shown on all 28 sarcastic cells; absent on all 8 control cells.
- **Clipping and overflow:** none in any of the 36 cells.
- **In-app share image:** 14/14 mobile sarcastic cells rendered 1080×1080.
- **GA-domain requests:** 0 in every run.
- **Stale-episode (`stale-results.json`):** share dialog open on good_16 (IS, desktop). Site switched under the open dialog to a cautious site. Result: dialog closed; card shows the cautious safety text; no share button; two distinct `weather_voice_viewed` events (`good_16`, then `safety_heavy_rain`).

**Screenshots inspected:**
- `mobile-390-is-good_16-card.png`: the longest IS line (59 characters) wraps to three lines and stays inside the card.
- `mobile-390-is-good_16-share-dialog.png`: the in-app preview shows the whole text.
- `mobile-390-en-rain_14-share-dialog.png`: EN rain_14 renders completely.
- `public/share/tjaldur/v1/is/good_16.png` (static OG, 1200×630): readable.
- `public/share/tjaldur/v1/en/sun_wind_10.png` (static OG, 1200×630): readable.

**Exposure caveat:** the DEV-mode `[event]` strings in the browser output do not include `voice_level`. The browser run therefore does not prove `voice_level` emission. The exact-payload hook tests do, and they still pass.

## 7. Size delta

- **Static share output (new files):** 324 files, 14.46 MB (the prompt estimated about 15 MB).
- **Runtime source:** `is.js` +4,651 bytes; `en.js` +4,447 bytes; `weatherVoiceContent.js` +6,720 bytes; `weatherVoiceShareManifest.generated.js` +46,499 bytes.
- **Production main JS:** 1,348.08 kB → **1,399.87 kB** (+51.79 kB raw, +8.89 kB gzip). CSS and MapView unchanged.
- **`dist/` total:** 39,045,098 → 53,646,588 bytes (+14.60 MB). Dominated by the copied share pages and source maps, not by runtime code.
- Main-JS growth is mostly the manifest (184 entries with absolute URLs) and the expanded language lists.

## 8. Deviations and decisions

1. **Ledger source.** The approved ledger is a generated fixture (from the issue text plus the approved decisions), not a hand-typed table. The generator is a scratch file outside the repo. The runtime `is.js`/`en.js` and the metadata block were also written by the same generator, using a regex rewrite of the two blocks in `weatherVoiceContent.js`. Every count was asserted before writing, and the generator is idempotent.
2. **Retired text source.** Released texts for retired IDs come from `HEAD~1`, because the issue snapshot has no `wind_extreme` block and the released EN for `cold_wet_02` differs from the issue wording.
3. **Condition labels in the ledger** use engine names (`strong_wind`, `heavy_rain`, `extreme_wind`), not ID prefixes. This was corrected during execution (§2).
4. **Browser pinning.** Pinning `Math.random` selects a known target ID. Production selection is random, and the browser run does not claim otherwise.
5. **`voice_level` on share events.** Unchanged from #432. The #420 browser run does not show it (§6).
6. **Test-count churn.** Several test files moved from hand-copied expectations to ledger-driven ones. Coverage was added (ledger, rotation, guards, pipeline), not removed.
7. **Dev server.** The already-running Vite instance on :5173 was used, after confirming it serves the expanded library.

## 9. Newly found conflict (reported, not edited; RESOLVED 2026-10-03, see §12)

The prompt requires that any newly found conflict be reported, with its ID, the issue, and a proposed resolution, before any approved text is changed. The approved text has **not** been changed.

- **excellent_17 / rain_13:** the same joke ("the weather is very Icelandic"). excellent_17 IS "Þetta er ekki mjög íslenskt." (EN "This isn't very Icelandic."); rain_13 IS "Þetta er mjög íslenskt." (EN "Very Icelandic."). IS token overlap 0.75, EN 0.50. Both were accepted in Jonesy's review, and the overlap was not recorded there. It breaks the issue rule against multiple comments built on essentially the same joke.
  - **Proposed resolution (owner decision):** reserve one of the two IDs (never reuse it). The "not" version, excellent_17, is the cleaner one to keep. Reserving an ID would mean removing it from the active lists, the registry and the manifest, and regenerating. No rewording of either line is proposed.
- Two lower-level candidates (excellent_05 / good_02 shared opener; rain_04 / rain_21 one-word deadpan label) are recorded in `content-validation.md` §4 for the owner to note. They are not proposed for change.

## 10. Limitations

- No live GA4 ingestion, production deployment, or live share verification is claimed.
- Browser evidence is local, stubbed and pinned (§6). Two viewports only (390×844 and 1280×900).
- Heuristic guards (§5 of `content-validation.md`) are regression tripwires. They are not editorial proof.
- The owner-approved text includes three known caveats (good_21 ambiguity, good_16 length, sun_wind_04 IS check). They are documented, not fixed.
- Old public URLs for the 16 retired IDs remain reachable by design, and their text is not corrected. Hosted files, CDN or Facebook caches and old posts are not claimed as removed.
- The serious mascot tone carried from #432 is unchanged, as the prompt requires (no mascot or layout redesign).

## 11. Status

Not committed, not pushed, not deployed. No GitHub closure. CURRENT.md is set to CC_COMPLETE with this report's path. The result review is `docs/ai/tasks/ticket-420/result-review.md` (not created by CC).

## 12. Owner decision 2026-10-03: excellent_17 kept active, rain_13 permanently reserved

The owner decided on the §9 finding: **keep excellent_17 active** (the contrast between excellent conditions and what Tjaldur expects from Iceland is part of his established personality), and **move rain_13 to permanent reserve**. No other editorial change was made. Sections 1–11 above record the state before this decision and are kept as history. **The current numbers are the ones below.**

**Current state (supersedes the earlier counts in §§1–8):**
- Active personality entries: **91 per language** (good 22, excellent 21, rain 18, cold 14, sun_wind 16). Retained 11, new 80.
- Reserve: **25** (the 21 owner-approved reserves, rain_13 by this decision, and the 3 issue reserves rain_heavy_24/25/29). Excluded: 63. Retired: 16 (unchanged). Ledger rows: 195.
- Catalogue and manifest: **182 pairs** (91 × 2). Static share output: **320 new files, 14,276,508 bytes**.
- Released files: unchanged (108 tracked). The 32 HTML + 32 PNG legacy pages for the 16 retired IDs remain on disk.
- Main JS: 1,399,259 bytes (1,399.26 kB; gzip 410.23 kB).

**What changed:**
1. The TEST-ONLY ledger (`src/test-fixtures/weatherVoiceLedger.js`): rain_13 status `reserve`. Regenerated by the scratch generator with the approved rules: rain range 12–14 became 12 and 14 (13 removed), and the reserve list gained rain_13. The generator's assertions were updated to 91 active, 25 reserve, 80 new, and 66 accepted.
2. Runtime `is.js` and `en.js`: 91 entries each (rain_13 removed). `weatherVoiceContent.js`: 91 metadata entries (rain_13 removed). `RETIRED_JOKE_IDS` unchanged at 16. rain_13 is never released, so it is documentation-only and is not in the released-retired constant.
3. Generated artifacts: `rain_13.html` and `rain_13.png` in `public/share/tjaldur/v1/{is,en}` had been created by this ticket's first export. They were **untracked** (`git ls-files` returned nothing for them) and were deleted before the final export. No tracked file was touched. `npm run share:export` was re-run: **182 pairs, 0 created, 182 reused unchanged**; the manifest regenerated to 182 entries.
4. Tests moved to the new counts, all ledger-driven or hard-coded to the new values: `weatherVoiceLedger.test.js` (status totals 80/91/25; rain 18; reserve set including rain_13; raw lists 91; manifest and catalogue 182), `weatherVoiceContent.test.js` (91 IS and EN), `weatherVoiceRotation.test.js` (rain pool 18), `weatherVoiceVoiceLevel.test.js` (catalogue 182). The export test runs one case per catalogue entry, so the full-suite count dropped by two (2,314 → 2,312), exactly matching 184 → 182 pairs.
5. Docs updated to the same numbers: `content-validation.md` (rewritten for the final tree), bible §13, production-validation §13 (80 new, rain 16 new, 91 active, 25 reserves), share-pilot §11 (182 pairs, 160 new pages, 320 files).

**Re-verification on the final tree (run after the changes):**

| Step | Command | Result |
| --- | --- | --- |
| Generator | `node scratchpad/gen420.mjs` | 195 rows; active 91; reserve 25; NOTE 25; max lengths 59/50 |
| Export | `npm run share:export` | 182 pairs; 0 created; **182 reused unchanged** |
| Preservation | `git status --short public/share`, `git ls-files public/share` | 0 modified or deleted; 108 tracked; 320 new untracked |
| Affected suites | `npx vitest run` on Weather Voice + ledger + rotation + guards + pipeline | **30 files, 765 tests passed** |
| Lint | `npm run lint` | exit 0 |
| Build | `npm run build` | exit 0; main JS 1,399.26 kB |
| Bundle | search `dist/assets/*.js|css` for `"rain_13"`, reserve/excluded IDs, the rain_13 text `Þetta er mjög íslenskt.`, ledger symbols | all **0** |
| Full suite | `npx vitest run` | **155 files, 2,312 tests passed** |
| Browser matrix | `verify-expanded-pool.cjs` re-run (rain pin recomputed for the 18-entry pool) | 28/28 target texts match the ledger; 28/28 sarcastic cells show share; 8/8 controls show none; 0 clipped or overflow; 0 GA requests |
| Stale-episode | not re-run; good_16's pool is unchanged by this decision | previous result stands |

**Limits and notes:**
- The owner decision touched no approved wording apart from removing rain_13. excellent_17 is unchanged.
- The rain_13 search probe: its text `Þetta er mjög íslenskt.` is not a substring of the active excellent_17 line (`Þetta er ekki mjög íslenskt.`), so the zero-hit result is meaningful. The same is true of the ID `"rain_13"`.
- Browser evidence is local, stubbed and pinned. It does not prove `voice_level` emission (the exact-payload tests do).
- Nothing was committed, pushed, deployed or closed.

**Status:** CURRENT.md is set back to CC_COMPLETE with this report's path. The result review remains `docs/ai/tasks/ticket-420/result-review.md`.

---

# Part A — approved-prompt-v3: 113 primary personality entries

Sections 1–12 above record the earlier 91-entry state, kept as history. Part A supersedes their counts. Part B (the heavy-rain supplement) follows in its own section.

## A.1 Before and after

| Item | Before Part A (91-entry state) | After Part A |
| --- | --- | --- |
| Primary active per language | 91 (good 22, excellent 21, rain 18, cold 14, sun_wind 16) | **113** (good 23, excellent 22, rain 23, cold 23, sun_wind 22) |
| Retained / new | 11 / 80 | **11 / 102** |
| Reserve | 25 | **0** (the 22 primary reserves are active; rain_heavy_24/25/29 are supplemental) |
| Supplemental (heavy_rain) | 0 (they were reserves) | 3 in the ledger, `active_supplemental`; not in the runtime library yet (Part B) |
| Retired (released) / excluded | 16 / 63 | 16 / 63 (unchanged) |
| Ledger rows | 195 | 195 |
| Primary catalogue and manifest | 182 pairs | **226 pairs** |
| Public share files | 428 (108 tracked + 320 new) | **516** (108 tracked + 408 new) |

## A.2 Ledger and generated content

- The TEST-ONLY ledger was regenerated by the scratch generator from `issue-source.md` and the approved v3 rules. The generator asserts every count and the 46 non-accepted caveats before writing.
- Restored reserves carry their canonical IS/EN wording, unchanged. Owner EN overrides (cold_01, cold_03, excellent_03) are applied as before.
- Restored entries carry caveats in the ledger `note` field: the 12 HOLD lines and 9 RESERVE-group lines. The 25 NOTE caveats are unchanged. Caveats quote Jonesy's findings. The override record is Bible §14.
- `is.js` and `en.js` hold 113 entries each, with count-independent header comments. `weatherVoiceContent.js` holds 113 primary metadata entries, `RETIRED_JOKE_IDS` holds 16, and the header comments were corrected to avoid stale counts.
- Max primary lengths: IS 59 (good_16), EN 50. All 113 lines fit the approved maxima.

## A.3 Share export and immutability (hash evidence)

- Baseline: SHA-256 of all 428 existing share files and 22 runtime files, saved before any edit at `outputs/ticket-420-evidence/baseline-public-share-sha256.txt` and `baseline-runtime-sha256.txt`.
- `npm run share:export` (dev server on :5173, verified serving the expanded library): **226 pairs; 44 created, 182 reused unchanged**. The manifest was written by the generator (226 entries). No version bump, deletion or overwrite.
- `sha256sum -c` on the baseline: **428 OK**. No pre-existing file changed.
- Final inventory: `outputs/ticket-420-evidence/partA-public-share-sha256.txt`, **516 lines**. Git: 108 tracked, 0 modified or deleted, 408 untracked (84 cold, 80 excellent, 80 good, 84 rain, 80 sun_wind files, as expected for 42/40/40/42/40 new pairs).

## A.4 Validation (exact commands and results)

| Command | Result |
| --- | --- |
| `node scratchpad/gen420v3.mjs` | statuses 11 / 102 / 3 / 16 / 0 / 63; primary 113; max lengths 59 / 50; caveats 46 |
| `npm run share:export` | 44 created, 182 reused, 226 total |
| `sha256sum -c baseline` | 428 OK |
| `npx vitest run` (Weather Voice + ledger + rotation + guards + pipeline, incl. export test) | **30 files, 809 tests passed** |
| `npm run lint` | exit 0 |
| `npm run build` | exit 0; main JS **1,413.82 kB** (gzip 412.34 kB) |
| Bundle search: 63 excluded IDs (quoted) | **0** |
| Bundle search: `WEATHER_VOICE_LEDGER`, `weatherVoiceLedger`, `issueEn`, `enOverride`, `status: "reserve"`, `status: "excluded"` | **0** |
| Bundle search: excluded distinctive texts (4 probes) | **0** |
| Restored primary IDs present in bundle (`rain_10`, `cold_24`) | present |

Test-count changes: the export test runs one case per catalogue entry, so the primary catalogue change (182 → 226 pairs) changes the count of that test. Tests moved to derived or new counts: ledger status, per-condition, raw-list, manifest and catalogue checks; rotation pool sizes (23, 22, 23, 23, 22); content library counts; and the voice-level catalogue count. One hook test had a hard-coded excellent count (21) that was replaced with membership, not a new count.

## A.5 Sizes (Part A)

| Item | Before | After |
| --- | --- | --- |
| Main JS | 1,399.26 kB (gzip 410.23 kB) | **1,413.82 kB (gzip 412.34 kB)** |
| `dist/` total | 53,461,655 bytes | 57,600,578 bytes |
| New static share files | 320 files, 14,276,508 bytes | **408 files, 18,375,816 bytes** |
| Runtime manifest | 182 entries, 54,335 bytes | 226 entries, 67,340 bytes |
| `is.js` / `en.js` | 6,272 / 5,826 bytes | 7,481 / 7,143 bytes |

The pre-ticket baseline was 1,348.08 kB main JS.

## A.6 Deviations and decisions

1. **Override list derivation.** The owner's decision did not name the 12 HOLD IDs individually. The list is derived from Jonesy's HOLD set, and it is recorded as a derivation for owner confirmation (Bible §14, content-validation §4).
2. **Caveats on restored reserves.** Jonesy's reserve and HOLD findings are kept as caveats, not as editorial changes. Ledger `note` fields carry them.
3. **Stale-label cleanup (F2).** Comments and headers now avoid count words. Test titles were also made count-independent where they could go stale. Remaining counts live in assertions derived from the ledger.
4. **Generator change, not runtime change.** The v3 generator (scratch, outside the repo) was rerun from scratch. It only rewrote the primary lists and the two blocks in `weatherVoiceContent.js` (the primary metadata and `RETIRED_JOKE_IDS`). The retired texts still come from `HEAD~1`.

## A.7 Limits (Part A)

- Owner-activated lines are editorial choices with recorded caveats. They are not proof of safe or accurate tone.
- The guards are heuristics. They are not editorial proof.
- The owner override applies to 12 IDs only. It does not change the Bible rules for future text.
- Browser checks for the Part A content are run once, after Part B, so that both parts are covered by the same stubs and reading-order check.

**Part A status:** green on export, hash inventory, affected suites, lint, build and bundle search. Part B is started after this checkpoint.

---

# Part B — heavy-rain supplement (approved-prompt-v3)

## B.1 Before and after

| Item | After Part A | After Part B |
| --- | --- | --- |
| Primary library, catalogue, manifest | 113 per language; 226 pairs | **unchanged** |
| Supplement registry | none | 3 entries (`rain_heavy_24`, `rain_heavy_25`, `rain_heavy_29`), all heavy_rain, 7-day cooldown |
| Card | warning only | warning, plus the supplement beneath it when a heavy-rain episode is visible |
| Hook outputs | `presentation`, `action`, `episodeKey`, `onVisible`, `shareSnapshot` | + `supplement`, `onSupplementVisible` (separate outputs, never a field on `presentation`) |
| Exposure | primary `weather_voice_viewed` | + `weather_voice_supplement_viewed` (separate observer, ratio 0.9) |
| History | joke history only | + separate supplement history (`weather_voice_supplement_history_v1`) |

## B.2 Architecture (R1–R8)

- **R1, failure isolation.** The supplement is computed inside its own `try/catch` in the hook's selection effect. The registry is validated inside a `try` at mount, because it iterates at mount too. Any throw degrades to "no supplement". The primary selection and its path are unchanged.
- **R2, primary stays RNG-free.** `selectWeatherVoicePresentation` and `selectWeatherSafetyPresentation` are untouched. The supplement lives in `src/lib/weatherVoiceSupplement.js` and is called from the hook only.
- **R3, separate output.** `presentation` is the same frozen object as before. `supplement` is a separate hook output, and the card takes `supplement` and `onSupplementVisible` as props. The App.jsx change is the single `<WeatherVoiceCard>` call site, adding two props.
- **R4, derived eligibility.** Requires a heavy_rain cautious engine result, a visible primary `safety_heavy_rain` presentation (with a non-empty text), and lang is or en. Negatives are tested: extreme_wind, strong_wind, cold_wet, silence, sarcastic claims, mismatched condition or tone, missing text, unsupported language.
- **R5, separate observer.** The supplement observer is declared after the card observer, so the card observer is always instance 0. It is instance 1 only when a supplement is rendered. Threshold is 0.9. It has its own local `cancelled`/`notified`/`lastEligible` closure, and it repeats the visibility handling. The hook rejects a mismatched episode key or supplement ID, a mid-selection state, a non-cautious or non-safety primary, and a repeat for the same episode.
- **R6, separate history.** `src/lib/weatherVoiceSupplementHistory.js` has its own key, validates IDs against the supplement registry, and carries its own guarded storage. The three private helpers in `weatherVoiceSelector.js` (`pickUniform`, `pickLeastRecentlyShown`, `isAvailable`) are exported with the `export` keyword only. Their bodies are unchanged. **`src/lib/weatherVoiceHistory.js` is byte-unchanged** (SHA-256 identical to the baseline, `git diff` empty).
- **R7, narrowed assertions.** Listed in §B.5.
- **R8, no share path.** Listed in §B.6.
- **R11, documentation.** JSDoc typedefs (`WeatherVoiceSupplementEntry`, `WeatherVoiceSupplement`) in `weatherVoiceTypes.js`. Bible §15, the owner exception record. Addenda in production-validation §14 and share-pilot §12.

## B.3 Failure isolation and exposure tests (real hook and card)

`src/hooks/useWeatherVoice.supplement.test.jsx` (real `useWeatherVoice` and `WeatherVoiceCard`, fake observers):
- **R1:** a throwing registry; a throwing rng; a throwing `getItem` and `setItem`; malformed entries (blank IS text, blank EN text, duplicate ID, joke ID collision, retired collision, safety collision). Each keeps the warning visible and the primary event at exactly one. An empty registry produces a warning-only card with no supplement observer (the rollback path).
- **R4 in the hook:** extreme_wind, strong_wind and cold_wet show their own safety text and no supplement. An EN heavy-rain episode shows the English supplement.
- **R5:** the small-viewport case: a card line at 1.0 and a supplement at 0.5 gives one primary event, no supplement event and no supplement write. Then at 1.0 it gives one supplement event and one supplement history write, to the supplement key only, with the joke key never written. Exact payload: `supplement_id`, `parent_voice_id`, `language`, `weather_type`, `surface`. Mismatched episode key, mismatched supplement ID and a repeat are all rejected. A stale observer from a torn-down episode cannot notify after a site change.
- **R8:** the hook's share snapshot is null, no share button, and the presentation does not carry the supplement.

`src/lib/weatherVoiceSupplement.test.js` (pure): eligibility and negatives; validation of malformed entries and collisions; a throwing rng falls back to the first sorted ID; cooldown and boundary; least-recent fallback; the registry matches the ledger's `active_supplemental` rows in both languages. The supplement history: its own key; record and rehydrate; refuses joke, safety and unknown IDs; discards foreign records on hydration; a throwing `getItem` and `setItem` are non-fatal; an older record never replaces a newer one.

## B.4 Part B behaviour changes to existing tests (narrowed, not weakened)

- `useWeatherVoice.test.js`: the exact hook return keys now include `supplement` and `onSupplementVisible`. `supportingText` is still asserted absent.
- `useWeatherVoice.voiceLevel.test.jsx` (lines 103, 123): the assertion was "`storage.setItem` never called for cautious or serious episodes". It is now "never called with the joke-history key". The supplement's own key is asserted in the supplement suite.
- `weatherVoicePipeline.test.js`: the cautious and serious block is renamed "the primary presentation … is a safety message". The supplement is covered separately.
- `weatherVoiceLedger.test.js`: "personality counts are zero" is rewritten. Zero cautious or serious entries in the primary ledger, registry, KNOWN_IDS, catalogue and manifest; exactly three supplemental entries, all heavy_rain.

## B.5 Guards, rotation and ledger (R10)

- `weatherVoiceContentGuards.test.js`: the supplement lines go through the same heuristics. The only exception is `rain_heavy_29`'s English "you" (generic). It is asserted, not hidden. The length maxima (59 IS, 50 EN) still hold for all 113 primary lines.
- `weatherVoiceRotation.test.js`: pool sizes are good 23, excellent 22, rain 23, cold 23, sun_wind 22.
- The ledger test asserts the 113 / 102 / 3 / 16 / 0 / 63 statuses. Retired and excluded sets are asserted.
- Comments and test titles avoid count words that could go stale (F2).

## B.6 Share and Facebook absence (R8, tests and search)

`src/lib/weatherVoiceSupplementEntrypoints.test.js`: the active catalogue has no `rain_heavy` ID; the manifest has no `rain_heavy_` key; the Facebook resolver returns `not_shareable` or `unknown_entry` for each supplement ID; no share snapshot can be built from a heavy-rain presentation carrying a supplement; the image renderer rejects a heavy-rain snapshot before loading assets. Search: `public/share` and `dist/share` contain **no** `rain_heavy_24/25/29` HTML or PNG (checked, count 0). The retired `rain_heavy_01/02/03` legacy files remain untouched.

## B.7 Bundle search (R9, recalculated denylist)

| Probe (scope: `dist/assets/*.js|css`) | Result |
| --- | --- |
| 63 excluded IDs (quoted), including rain_heavy_26/27/28 | **0** |
| Excluded distinctive texts: `Nói hafði kannski punkt`, `Það mætti fara að huga að örkinni`, `Vindurinn hefur skoðanir`, `Kalt og blautt. Klassík`, `Þetta er metnaðarfull` | **0** each |
| `WEATHER_VOICE_LEDGER`, `weatherVoiceLedger`, `issueEn`, `enOverride` | **0** |
| Ledger status serialization (`status: "reserve"`, `"excluded"`, `"active_supplemental"`) | **0** |
| Supplement IDs (`"rain_heavy_24"`, `"rain_heavy_25"`, `"rain_heavy_29"`) | present (expected) |
| Supplement texts (`Is it time for the ark yet`, `Hvar er Nói`) | present (expected) |
| Supplement history key `weather_voice_supplement_history_v1` | present (expected) |

The distinctive-text probes are chosen from excluded lines and are not substrings of active text. Search is scoped to app JS and CSS. Legacy retired HTML outside JS and CSS is intentional and is not counted.

## B.8 Hashes and inventory (byte evidence)

- Baseline SHA-256 (before Part A): `outputs/ticket-420-evidence/baseline-public-share-sha256.txt` (428) and `baseline-runtime-sha256.txt` (22 runtime files).
- After Part B: `sha256sum -c` on the 428 baseline files gives **428 OK**. Final inventory `outputs/ticket-420-evidence/final-public-share-sha256.txt` has **516 files** (108 tracked + 408 new).
- Git: 108 tracked, **0 modified or deleted**, 408 untracked (new).
- Runtime changes against the baseline: `App.jsx`, `WeatherVoiceCard.jsx`, `useWeatherVoice.js`, `is.js`, `en.js`, `weatherVoiceContent.js`, `weatherVoiceSelector.js` (export keywords only), `weatherVoiceShareCatalogue.js` (comment only), `weatherVoiceShareManifest.generated.js` (exporter output), `weatherVoiceTypes.js` (JSDoc only), and the test-only ledger. **`weatherVoiceHistory.js` is not in this list.** Post-baseline hashes: `outputs/ticket-420-evidence/partB-runtime-sha256.txt`.

## B.9 Commands and results

| Command | Result |
| --- | --- |
| Hash baseline before any edit | recorded (see §B.8) |
| `npx vitest run` (all Weather Voice suites, incl. export test) | **33 files, 874 tests passed** |
| `npx eslint` (new and changed Part B files) | exit 0 |
| `npx vitest run` (full suite, final) | **158 files, 2,421 tests passed** |
| `npm run lint` | exit 0 |
| `npm run build` | exit 0; main JS **1,419.32 kB** (gzip 413.81 kB) |
| Bundle search (§B.7) | as stated |
| Browser (`verify-part-ab.cjs`) | as in §B.10 |

## B.10 Browser evidence (real browser, deterministic stubs, `Math.random` pinned to each target's pool index)

- **Primary: 32 cells**: good_16, good_10, sun_wind_07, sun_wind_10, rain_14, rain_10 (restored), cold_24 (restored long line), excellent_10 × IS/EN × desktop/mobile. **32/32 text matches the ledger**. In-app share images on mobile: **16/16 loaded at 1080 × 1080**. No clipping or overflow in any cell.
- **Supplement: 12 cells**: rain_heavy_24/25/29 × IS/EN × desktop/mobile. **12/12**: warning text matches, supplement text matches, the supplement follows the warning in DOM order, its font is 14 px vs the warning's 19 px, and there is no share button.
- **Controls: 12 cells**: extreme_wind (serious), strong_wind and cold_wet (cautious) × IS/EN × desktop/mobile. **No share button and no supplement in any control.**
- **Partial visibility** (mobile 390×520): the supplement was about 31% visible. **0 supplement events while partial, and 1 after it was fully visible.** The partial screenshot shows the warning with the ark line cut off at the bottom edge.
- **Language transition**: IS to EN via the toolbar toggle. The warning switches to EN. The supplement re-selects from the EN pool: rain_heavy_24 is in its 7-day cooldown, so rain_heavy_25 is shown. This is the rotation working as designed.
- **Site transition**: heavy-rain site to a sarcastic site. The supplement is removed; the sarcastic card shows, with a share button.
- **Stale dialog**: share dialog open on good_16, then switched to a heavy-rain site under the open dialog. Dialog closed, supplement shown, **no share button**.
- **GA-domain requests: 0** in every run.
- **Not exercised:** the midnight date transition. It is not covered by a browser check in this round. This is stated as a limitation, not claimed.
- **Event fields:** the DEV `[event]` strings show the supplement fields. They do not prove the primary `voice_level` (see the exact-payload tests).

**Screenshots inspected:** `part-ab/mobile-390-en-rain_heavy_25-card.png` (the warning leads and the ark line sits beneath it, smaller and lighter); `part-ab/partial-visibility-mobile-390-en-rain_heavy_25.png` (partial state); static OG `public/share/tjaldur/v1/is/cold_24.png` (readable long line).

## B.11 Sizes (Part B)

| Item | After Part A | After Part B |
| --- | --- | --- |
| Main JS | 1,413.82 kB (gzip 412.34 kB) | **1,419.32 kB (gzip 413.81 kB)**, +5.50 kB raw |
| `dist/` total | 57,600,578 bytes | 57,629,813 bytes |
| New static share files | 408 files, 18,375,816 bytes | unchanged (Part B adds no share files) |
| Supplement registry, selector, history | — | 1,259 + 5,164 + 3,082 bytes (source) |

## B.12 Deviations and decisions (Part B)

1. **Registry snapshot for history.** The supplement history validates IDs against the registry snapshot taken at mount. The selector validates the live registry per call. A supplement added to the registry after mount would therefore not be recordable until remount. Current behaviour is correct for the static registry. This is recorded as a known limit.
2. **Dependency on the registry identity.** The selection effect lists `supplementRegistry` in its dependencies. The default is a stable module constant, and tests pass stable references. A caller that builds a new array on every render would re-run the effect. The primary cache prevents repeat selection, so this is a performance note only.
3. **Test-script fixes (not product changes).** The browser script needed three fixes: the toolbar language toggle sits inside the collapsed Stillingar panel; the site picker is Icelandic, so that step runs in IS; and the partial-visibility screenshot was moved to the partial step. These are script corrections only.
4. **Hook return-shape test updated.** An exact-key list gained the two new keys (R3).
5. **Override list (Part A).** Unchanged. The HOLD list is still a derivation for owner confirmation (Bible §14).

## B.13 Limits (Part B)

- The supplement is an owner-authorised exception to the cautious-tone rules, for these three lines only. Jokes can weaken the caution next to a warning.
- Mixed hazards are not independently described. heavy_rain has priority over strong_wind, so cold or windy conditions can coincide with the supplement.
- The three lines repeat within a week under least-recent fallback.
- The midnight date transition was not browser-tested in this round.
- No live GA4, live share, or Facebook verification is claimed. The custom-dimension registration for the new event's parameters is pending, and owner-controlled.
- Old public URLs for the retired joke IDs remain reachable and are not corrected. No CDN, Facebook or post removal is claimed.

**Part B status:** green on the full suite (158 files, 2,421 tests), lint, build, bundle search, hash inventory, and the browser matrix. Part B is complete, so CURRENT.md moves to CC_COMPLETE after this report.

---

# v4 — documentation and comments correction (approved-prompt-v4.md)

## v4.1 Correction to earlier claims

Earlier sections of this report say that count-label cleanup was done (Part A §A.6 item 3, and Part B §B.5 "comments and test titles avoid count words that could go stale"). That claim was **premature**. Ripley's final assessment found stale labels still in the tree. The earlier sections are kept unchanged as history. This section records the fixes that are now applied and what remains.

## v4.2 Owner approval status (recorded accurately)

On 2026-10-03 the owner saw the complete 25-row list in direct chat and approved all of it ("Þessir textar mega allir vera virkir"). For the three ark lines the owner chose the supplement alongside the unchanged caution message. The 12 HOLD lines (cold_04, cold_05, cold_06, cold_13, cold_17, cold_24, good_12, rain_10, rain_15, sun_wind_06, sun_wind_21, sun_wind_22) are a subset of that explicit approval. No further owner approval is pending. sun_wind_04 and good_16 were approved unchanged earlier. Residual editorial caveats are kept.

Where the earlier documents described the 12-line override as a derivation awaiting confirmation, that wording is superseded. Bible §14 and `content-validation.md` §4 now record the approval. Earlier report text is unchanged.

## v4.3 Fixes applied (exact list)

| # | Location | Before | After |
| --- | --- | --- | --- |
| F1 | `docs/analytics/weather-voice-production-validation.md`, §13 Interpretation | "a voice_id distribution now spans 92 IDs instead of 13" | the primary voice_id set is the full active primary set (113 per language, per the current ledger), instead of the 13 IDs in place before #420; supplement IDs are reported only through `weather_voice_supplement_viewed` |
| F2a | `src/lib/weatherVoiceShareCatalogue.test.js`, comment above the catalogue sanity check | "92 active ids * 2 languages = 184" | "the active primary ids times 2 languages, derived from the ledger, not hard-coded" |
| F3 | `src/lib/weatherVoiceContent.test.js`, comment on the empty-array describe | "genuinely 27 entries now" | a historical #412 note: the real EN library is no longer empty, and its size is derived from the ledger |
| F4a | `docs/ai/tasks/ticket-420/content-validation.md`, §3 sun_wind_04 caveat | "IS 'blásið' needs an Icelandic-reader check. Not judged here." | the owner approved both lines unchanged; the factual stock-phrase note stays |
| F4b | `docs/ai/tasks/ticket-420/content-validation.md`, §4 | "Derivation note … the owner should confirm the list at review" | "Owner approval (2026-10-03, direct chat)" for the 25-row list, with the 12 HOLD lines as a subset; no further approval pending |
| F4c | `docs/weather-voice/character-and-voice-bible.md`, §14 | "the owner should confirm it at review" | the owner approved all 25 restored lines; nothing pending |
| F4d | `src/test-fixtures/weatherVoiceLedger.js`, note for sun_wind_04 (test-only data field) | "IS 'blásið' needs an Icelandic-reader check." | "Owner approved the IS and EN lines unchanged (2026-10-03)." The scratch generator string was updated to match. Ledger status and text are unchanged |

## v4.4 Source searches (before and after)

- `spans 92`, `92 active ids`, `genuinely 27`: none left in current docs or test comments.
- `Icelandic-reader`: now only in the prompt and result-review history files (`approved-prompt-v2.md`, `prompt-review.md`, `result-review.md`). These are preserved history. In current docs and the fixture it appears nowhere.
- `should confirm` / `confirm it at review` for the override list: none left in current docs.
- Count-word scan of test comments (`//` lines and describe/it titles for 27, 92, 91, 184, 182, 113, 54): no Weather Voice count remains. The matches are unrelated aurora or temporal comments.

**Historical snapshots left as written, intentionally.** The following are dated audit or addendum text. They are not current claims, and rewriting them would change history:
- `weather-voice-production-validation.md` §1 and §3 (2026-09-12 audit of 27 entries). This is the #409 record.
- `weather-voice-production-validation.md` §12 "Active joke IDs are now 13 per language" and `weather-voice-share-pilot.md` §10 "26 entries (13 sarcastic comments)". These are the #432 state, recorded at the time.
- The 91-entry and 182-pair sections of this cc-report (§§1–12). Their counts describe prior states.

This pass does not claim that every historic count is an error. It corrects current statements only.

## v4.5 Scope and validation

- **Scope:** comments, test labels and titles, docs, and one test-only data note. No runtime code, no text library entry, no ledger status, no test assertion, no generated manifest, no share artifact, no safety, selector, history or UI change. No regeneration, build, or browser rerun for this micro-pass.
- **Commands and results:**

| Command | Result |
| --- | --- |
| `npx vitest run src/lib/weatherVoiceContent.test.js src/lib/weatherVoiceShareCatalogue.test.js` | 2 files, **45 tests passed** |
| `npm run lint` | exit 0 |

- **Diff inspection:** this pass edited only comment lines, one test title comment, the fixture note field, and documentation. The working-tree diff against `HEAD` still shows the whole #420 history, so scope is evidenced by the exact edit list in §v4.3, not by that diff. No assertion line was edited in this pass.

## v4.6 Remaining limits (unchanged)

- The midnight date transition was not browser-tested (carried from Part B).
- Editorial caveats remain for the lines listed in `content-validation.md` §3, including good_21, good_16 length, and the stock-phrase note on sun_wind_04. These are factual notes, not open decisions.
- Old public URLs for the retired joke IDs remain reachable and are not corrected. No CDN, Facebook or post removal is claimed.
- Jokes can weaken the caution tone next to a warning, and mixed hazards are not independently described (Bible §15).

**v4 status:** documentation and comments corrected and checked. CURRENT.md moves to CC_COMPLETE with this report's path. Result review remains `docs/ai/tasks/ticket-420/result-review.md`.
