# #420 — Content validation (Weather Voice personality library)

Written for: the owner, Ripley and Jonesy. Read with `cc-report.md` (execution record, Parts A and B) and `result-review.md` (review, to be written).

Sources: `issue-source.md` (canonical text), `approved-prompt-v3.md` (owner rules, including the 2026-10-03 override and the supplement), and the TEST-ONLY ledger `src/test-fixtures/weatherVoiceLedger.js` (machine-checked reference, never imported by production code). Jonesy's editorial findings (`prompt-review.md` §3) are used only as caveats for the entries they describe.

Counts below are derived from the ledger and cross-checked against the raw runtime lists. They are not hard-coded in tests or comments.

## 1. Primary personality library (Part A, current)

| Condition | Primary active IS = EN | Retained | New | Retired (released) | Excluded |
| --- | --- | --- | --- | --- | --- |
| good | 23 | 3 | 20 | 0 | 0 |
| excellent | 22 | 2 | 20 | 1 (excellent_02) | 0 |
| rain | 23 | 2 | 21 | 0 | 0 |
| cold | 23 | 2 | 21 | 1 (cold_02) | 0 |
| sun_wind | 22 | 2 | 20 | 0 | 0 |
| strong_wind | 0 | 0 | 0 | 3 (wind_strong_01–03) | 20 (wind_strong_04–23) |
| cold_wet | 0 | 0 | 0 | 3 (cold_wet_01–03) | 20 (cold_wet_04–23) |
| heavy_rain | 0 (see supplement, §5) | 0 | 0 | 3 (rain_heavy_01–03) | 23 (rain_heavy_04–23, 26–28) |
| extreme_wind | 0 | 0 | 0 | 5 (wind_extreme_01–05) | 0 |
| **Total** | **113** | **11** | **102** | **16** | **63** |

- Ledger: 195 rows. Statuses: retained 11, new 102, active_supplemental 3, retired 16, reserve 0, excluded 63.
- Primary active = retained + new = 113. Supplemental entries are not primary library entries and are not in `KNOWN_IDS` (§5).
- Personality inventory: 113 primary + 3 supplemental = 116 IDs. These are not 116 interchangeable primary messages.
- **Cautious and serious primary entries: 0.** The four bilingual safety messages are counted separately (§6).

## 2. Owner rules applied in Part A

- **Restored reserves (22) are primary active**, by owner request on 2026-10-03: cold_04, 05, 06, 08, 09, 11, 13, 17, 24; excellent_19; good_12; rain_10, 11, 13, 15, 19; sun_wind_05, 06, 08, 13, 21, 22. Their canonical IS/EN wording comes from the issue snapshot, unchanged.
- **Owner EN overrides (3), unchanged:** cold_01 `The sweater was right.`; cold_03 `The coffee cools out of sympathy.`; excellent_03 `All that's missing is the coffee.`
- **Owner-confirmed lines, unchanged:** sun_wind_04 `Bjart og blásið.` / `Bright and breezy.`; good_16 `Þetta verður ekki mikið betra án þess að verða grunsamlegt.` / `Much better than this would be suspicious.`; good_21 `Allt í lagi. Þú vinnur.` / `Fine. You win.` (the one approved second-person exception, see §4).
- **rain_13 is active again** (superseding the 2026-10-03 reserve decision, as the v3 owner decision requires). excellent_17 stays active. Both lines carry the same "very Icelandic" beat, and the owner accepts this.
- **Permanent released-retired IDs stay 16.** cold_02 and excellent_02 remain retired. wind_extreme_01–05, wind_strong_01–03, rain_heavy_01–03 and cold_wet_01–03 were retired by #432. Their legacy artifacts stay on disk, and no ID is reused.
- **Excluded proposals remain 63:** cold_wet_04–23, wind_strong_04–23, rain_heavy_04–23, rain_heavy_26–28. The owner selected rain_heavy_24, 25 and 29 as the supplement. rain_heavy_26–28 remain excluded (see §5).

## 3. Caveats for the 46 primary entries that Jonesy did not accept as written

Jonesy's Round 1 ACCEPT list (67 IDs) covers 67 of the 113 primary entries. The other 46 carry a caveat, recorded in the ledger `note` field:

- **25 NOTE entries** (accepted as written, with a caveat): good_06, good_08, good_14, good_16, good_20, good_21, good_23; excellent_07, excellent_18, excellent_21; rain_06, rain_14, rain_18; cold_10, cold_12, cold_14, cold_18, cold_20, cold_21, cold_22, cold_23; sun_wind_03, sun_wind_04, sun_wind_14, sun_wind_17.
- **21 restored reserves** (owner-activated 2026-10-03, with Jonesy's finding kept as the caveat):
  - *HOLD findings (owner override, §4):* cold_04, cold_05, cold_06, cold_13, cold_17, cold_24, good_12, rain_10, rain_15, sun_wind_06, sun_wind_21, sun_wind_22.
  - *RESERVE group findings (owner-activated, no override needed):* cold_08, cold_09, cold_11, excellent_19, rain_11, rain_19, sun_wind_05, sun_wind_08, sun_wind_13.

Caveats worth repeating here, without editorial change:
- **good_21**: "You win" can read as addressed to the user on a standalone card or share image. The issue explicitly approves it as addressed to the weather. This residual ambiguity is documented, not resolved.
- **good_16**: the longest IS line (59 characters, the approved maximum). Owner may trim later. Not trimmed.
- **sun_wind_04**: the owner approved `Bjart og blásið.` / `Bright and breezy.` unchanged. The factual note stays: "bright and breezy" is a stock phrase, slightly benign for 5–10 m/s.
- **cold_17**: "one way to wake up" is not a verified time-of-day claim. It is an editorial reading, and the caveat says so.

## 4. Owner override record for the restored HOLD lines (dated 2026-10-03)

The owner authorised the 12 HOLD lines in §3 on 2026-10-03, **as an override limited to these IDs**. For these lines only, the override relaxes the Bible rules that Jonesy cited:
- Bible §2: Tjaldur's humour is never aimed at how the user dresses (cold_06, cold_24).
- Bible §3 test 5: a line that could minimise a real danger is excluded (cold_04, cold_05, cold_13, rain_15, rain_10 and the others as Jonesy described them).
- The global rule against time-of-day inference (cold_17).

The override does **not** change those rules for any future text. Future text is still subject to the full Bible rules.

**Owner approval (2026-10-03, direct chat):** the owner saw the complete 25-row list and approved all of it ("Þessir textar mega allir vera virkir"). For the three ark lines the owner chose the supplement alongside the unchanged caution message. The 12 HOLD lines above are a subset of that explicit approval. No further approval is pending. Earlier drafts described this list as a derivation awaiting confirmation; that wording is superseded.

## 5. Supplement (Part B): heavy_rain only

The three ark lines are a separate, additive supplement to the cautious heavy-rain caution. They are not primary library entries. Their IDs are `rain_heavy_24`, `rain_heavy_25`, `rain_heavy_29`, and their status is `active_supplemental`. The supplement is documented in §10 of the Part B section of `cc-report.md`, and its texts appear in §6 below.

## 6. Safety messages (counted separately, unchanged)

Four bilingual messages from #432, unchanged: `safety_extreme_wind` (serious); `safety_strong_wind`, `safety_heavy_rain`, `safety_cold_wet` (cautious). The ledger safety fixture was checked against the #432 approved prompt text.

## 7. Duplicate and overlap review

- **Exact duplicates:** none within the raw IS list, within the raw EN list, or across the ledger (case-insensitive). Enforced by `weatherVoiceLedger.test.js`.
- **Overlap candidates** (heuristic: token overlap on content words, IS or EN, at or above 0.5). The owner has reviewed and accepted each one as documented below.
  - excellent_17 / rain_13: the same "very Icelandic" beat. Both active (owner decision). The contrast is part of Tjaldur's established personality.
  - excellent_05 / good_02: shared "Well. This is…" opener, with different beats. Accepted.
  - rain_04 / rain_21: one-word deadpan label structure. `Já já. Rigning.` (rain_04) and `Rigning. Klassískt.` (rain_21). Different beats (resignation vs "classic"). Accepted.
- **Accepted near-overlap groups** (Jonesy §3.2, now active by owner decision): warmth-is-absent (cold_12, cold_14, cold_21); rain-was-needed (rain_08, rain_18, rain_23); sun-arrives (sun_wind_01, sun_wind_03, sun_wind_05, sun_wind_13); bright-not-calm (sun_wind_02, sun_wind_08, sun_wind_12); dry-unavailable (rain_06, rain_11, rain_20); weather-chose-water (rain_09, rain_19); thermometer (cold_07, cold_09, cold_19); fresh (cold_08, cold_16); sweater/wool (cold_01, cold_11, cold_15); suspiciously good (excellent_01, excellent_05, excellent_19).
- Heuristic limits: a token-overlap check can miss semantic duplicates, and it can flag legitimate paraphrase. Its output is a documented review aid, not proof.

## 8. Guards (test-only, regression tripwires)

`src/lib/weatherVoiceContentGuards.test.js` applies emoji, second-person, imperative, time-of-day and length heuristics to the primary library.
- Emoji: none.
- Second person: only good_21, which is asserted as the approved exception.
- Imperatives and time-of-day words: none.
- Length: all 113 primary lines are within the approved maxima (59 IS, 50 EN). The longest IS line is good_16 at 59.

These guards are not editorial proof. Idiomatic or figurative wording can evade them, and legitimate metaphors can trip them.

## 9. Immutable released artifacts and share pages (Part A)

- Pre-ticket released files: 108, all unchanged. Baseline and final SHA-256 inventories are in `outputs/ticket-420-evidence/`. All 428 baseline files (108 tracked plus the 320 files from the 91-entry state) matched their baseline hashes after Part A.
- New files this part: 88 (44 pairs). Total inventory: 516 (108 + 408).
- Primary share catalogue and manifest: 226 pairs (113 × 2). Retained 22 pairs; new 204 pairs.
- Legacy: 32 HTML and 32 PNG for the 16 retired IDs, untouched and reachable. Old URLs stay public by design, and nothing here claims that they were removed from hosts, caches or posts.
- Excluded IDs and supplemental IDs have no generated page or image (verified by the ledger test).

## 10. Sizes (Part A, this environment)

| Item | Before this round | After Part A |
| --- | --- | --- |
| Main JS (`index-*.js`) | 1,399.26 kB (gzip 410.23 kB) | 1,413.82 kB (gzip 412.34 kB) |
| New static share files | 320 files, 14,276,508 bytes | 408 files, 18,375,816 bytes |
| `dist/` total | 53,461,655 bytes | 57,600,578 bytes |
| Runtime manifest | 182 entries, 54,335 bytes | 226 entries, 67,340 bytes |
| `is.js` / `en.js` | 6,272 / 5,826 bytes | 7,481 / 7,143 bytes |

The pre-ticket baseline was 1,348.08 kB main JS, with 13 personality IDs.

## 11. Commands and results (Part A checkpoint)

| Step | Result |
| --- | --- |
| SHA-256 baseline (428 share files plus 22 runtime files) | recorded before any edit |
| Generator `gen420v3.mjs` (scratch, asserts every count and the 46 caveats) | 113 primary; statuses 11/102/3/16/0/63; max lengths 59 / 50 |
| Export `npm run share:export` | 226 pairs; **44 created, 182 reused unchanged**; manifest 226 entries |
| Hash check of the 428 baseline files | **428 OK** |
| Final inventory | 516 files (108 tracked + 408 new) |
| Affected suites (incl. export test) | 30 files, **809 tests passed** |
| `npm run lint` | exit 0 |
| `npm run build` | exit 0; main JS 1,413.82 kB |
| Bundle search (scoped denylist): 63 excluded IDs; excluded texts `Nói hafði kannski punkt`, `Það mætti fara að huga að örkinni`, `Vindurinn hefur skoðanir`, `Kalt og blautt. Klassík` | **0 hits** |
| Bundle search: `WEATHER_VOICE_LEDGER`, `weatherVoiceLedger`, `issueEn`, `enOverride`, `status: "reserve"`, `status: "excluded"` | **0 hits** |
| Restored primary IDs present in the bundle (`rain_10`, `cold_24`) | present |
| Distinctive active text `Þetta er ekki mjög íslenskt` (excellent_17) | 2 hits, expected: it is active text, not a leak |

## 12. Limits (carried forward; see Part B for the supplement limits)

- Jokes can weaken the caution tone when they sit beside a cautious or serious message (Part B).
- The owner override covers the 12 HOLD lines in §4 only. Future text is still subject to the full Bible rules.
- Accepted overlap, clothing and context claims remain editorial choices.
- Do not treat "waking" as proof of morning, or figurative arrival as measured history.

## 13. Part B — heavy-rain supplement (additive, owner-authorised)

**What it is.** Three lines (`rain_heavy_24`, `rain_heavy_25`, `rain_heavy_29`) shown beneath the unchanged cautious `safety_heavy_rain` message, and only for a heavy-rain cautious episode in IS or EN. The ledger status is `active_supplemental`. They are not primary entries. They are not in `KNOWN_IDS`, the share catalogue or the manifest, and they are never shareable.

**Texts (IS / EN), taken from the ledger and matched by test to the registry:**
- rain_heavy_24: "Er ekki kominn tími á örkina?" / "Is it time for the ark yet?"
- rain_heavy_25: "Örkin hlýtur að vera í smíðum." / "The ark must be under construction."
- rain_heavy_29: "Hvar er Nói þegar maður þarf á honum að halda?" / "Where's Noah when you need him?"

**Eligibility, derived not assumed:** a heavy_rain cautious engine result, with a visible primary `safety_heavy_rain` presentation, in IS or EN. No supplement for extreme_wind, strong_wind, cold_wet, sarcastic claims, or forged presentations (tested as negatives). Primary selection is unchanged and RNG-free.

**Scope of the owner exception.** heavy_rain only. The exception is limited to these three lines. It does not change any rule for future text.

**Mixed hazards.** heavy_rain takes priority over strong_wind in the engine, so a heavy-rain episode can coincide with cold or wind. The supplement does not describe those mixed hazards, and no mixed-wind suppression was added. This is a limit, not a classifier.

**Rotation.** The supplement uses the same 7-day rules as the primary pool: a uniform choice among available sorted IDs, least-recently-shown fallback, and a deterministic fallback when rng throws. Its history is separate (`weather_voice_supplement_history_v1`). A repeat within seven days is therefore expected under the rules: the three ark lines can repeat within a week under least-recent fallback.

**Guards.** The supplement is held to the same heuristics. The only exception is rain_heavy_29's English "when you need him", which is a generic "you". That exception is asserted in `weatherVoiceContentGuards.test.js`, not hidden. The IS and EN lines have no emoji, imperatives, or time-of-day or season words.

**Limits.**
- Jokes can weaken the caution tone next to a warning. The owner accepted this for these three lines only.
- Mixed hazards are not independently described.
- The three lines repeat under the least-recent fallback.
- The date transition was not exercised in the browser (see §14).

## 14. Part B browser evidence (real browser, deterministic stubs, `Math.random` pinned to the target's pool index)

Script: `outputs/ticket-420-browser-evidence/verify-part-ab.cjs`. Results: `outputs/ticket-420-browser-evidence/part-ab/results.json`.

| Check | Result |
| --- | --- |
| Primary cells: good_16, good_10, sun_wind_07, sun_wind_10, rain_14, rain_10 (restored), cold_24 (restored long line), excellent_10 × IS/EN × desktop/mobile | **32/32 text matches the ledger**; no clipping or overflow |
| In-app share image (canvas), mobile, primary cells | **16/16 loaded, 1080 × 1080** |
| Supplement cells: rain_heavy_24/25/29 × IS/EN × desktop/mobile | **12/12**: warning text matches, supplement text matches, supplement follows the warning in DOM order, supplement font 14px vs warning 19px, no share button |
| Controls: extreme_wind (serious), strong_wind, cold_wet (cautious) × IS/EN × desktop/mobile | **12/12**: no share button, no supplement |
| Partial visibility (mobile 390×520, supplement about 31% visible) | **0 supplement events while partial**; **1** after the line is fully visible (ratio ≥ 0.9) |
| Language transition IS→EN (toolbar toggle, live) | warning switches to EN; supplement re-selects from the EN pool (rain_heavy_24 is in cooldown, so rain_heavy_25 is shown: the intended rotation) |
| Site transition heavy-rain → sarcastic site | supplement removed; sarcastic card shows; share button shown (sarcastic only) |
| Stale dialog: share dialog open on good_16, then switched to a heavy-rain site under the open dialog | dialog closed; supplement shown; **no share button** |
| GA-domain requests | **0** in every cell |

**Not exercised in the browser:** the midnight date transition (the Reykjavik date poll). It is not covered by a browser check in this round. Limitation stated, not claimed.

**Screenshots inspected:** `part-ab/mobile-390-en-rain_heavy_25-card.png` (the warning leads; the ark line sits beneath it, smaller and lighter); `part-ab/partial-visibility-mobile-390-en-rain_heavy_25.png` (the warning is visible and the ark line is cut off at the bottom edge, which is the case the 0.9 threshold must reject); `public/share/tjaldur/v1/is/cold_24.png` (static OG, restored long line, readable).

**Exposure caveat.** The DEV `[event]` strings in the browser output show the supplement fields, and the primary `voice_level` is not in those strings. Exact-payload tests prove the event fields; browser strings are not treated as proof of them.
