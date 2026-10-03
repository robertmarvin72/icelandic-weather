# #420 — Expand Tjaldur personality library — Round 1

Date: 2026-10-03. Ripley. PROMPT REVIEW ONLY — not executable.
Issue: https://github.com/robertmarvin72/icelandic-weather/issues/420
Canonical issue text snapshot: docs/ai/tasks/ticket-420/issue-source.md.

## Preflight and owner decisions

#432 CLOSED/PASS before starting this task; working tree was clean. Read docs/ai/README.md, CURRENT.md, AGENTS.md, CLAUDE.md and the complete character-and-voice-bible.md, including §12's implemented policy (older sections describe historical gaps).

Owner explicitly approved during this session:
1. Preserve #432 tone mapping/safety rules. Expand only good, excellent, rain, cold, sun_wind. Keep the issue's cold_wet/strong_wind/heavy_rain proposed personality text inactive in documentation. Do not restore any of #432's permanently retired IDs, do not label jokes cautious to bypass policy, and do not modify the four safety messages. extreme_wind gains no jokes.
2. Preserve existing released text for cold_01, cold_03 and excellent_03 despite differing EN strings under the issue's 'Keep existing' heading. Specifically keep EN `The sweater was right.`, `The coffee cools out of sympathy.`, `All that's missing is the coffee.` and their existing IS strings. Preserve released share files.

The issue's 27-per-language baseline is stale: current runtime has 13 jokes per language and four separate bilingual safety messages. No production deployment claim is made here.

## Objective

Expand the five eligible personality pools using the issue's canonical ID/text pairs, with exact wording except explicitly approved owner decisions. Preserve dry/deadpan personality and natural IS/EN adaptations. There is no quota or arbitrary 100-comment cap. No silent editorial additions, deletions, shortening or retranslations.

Provisional counts before editorial decisions: good 23; excellent 22 (excellent_02 retired); rain 23; cold 23 (cold_02 retired); sun_wind 22 = 113 per language. 45/113 are good/excellent. This is 11 retained plus 102 new IDs; not a final acceptance count until review findings are resolved. Safety messages are counted separately. All four non-sarcastic conditions have zero active personality entries.

## Read-only audit already performed / execution must confirm

- UI entrypoint remains the existing homepage useWeatherVoice -> WeatherVoiceCard. No new page/route/CTA.
- weatherVoiceContent.js joins shared ID metadata to is.js/en.js. Runtime voiceLevel is camelCase; metadata defaults severityMin/Max 0/3, repeatCooldownDays 7, ctaType null. Preserve schema and canonical engine condition/mood pairings.
- weatherVoiceRules.js maps five conditions to sarcastic, three to cautious, extreme_wind to serious. weatherVoiceSelector dispatcher sends cautious/serious to deterministic safety selection independent of joke history. Keep this unchanged.
- Selector sorts IDs, picks from non-cooldown entries, falls back to least-recently-shown with lexical tie-break; invalid RNG uses deterministic fallback. History records actual exposure, not selection, and hydration discards IDs absent from KNOWN_IDS. More content reduces repetition opportunities but does not guarantee never repeating or change episode stability.
- Current validators cover IDs/metadata/parity but do not fully enforce exact text uniqueness or semantic editorial rules. Validate raw lists as well as resolved libraries so dropped/unregistered entries cannot hide an error.
- Catalogue automatically follows active library, so all new eligible pairs need real share artifacts and manifest entries. Existing exporter performs two-phase byte checks, leaves retired files intact and requires local Vite + Playwright. Build does not generate these artifacts.

## Editorial review BEFORE an executable prompt

The issue explicitly requires conflicts be reported before editorial changes. Jonesy: review the following concrete findings against the whole source snapshot, engine and Bible; propose precise ID-level dispositions. Do not implement or silently rewrite. Ripley will obtain owner decisions on actual editorial changes before issuing an execution prompt. Scope and EN preservation decisions above are already approved; do not ask them again.

| IDs | Concern to assess | Suggested disposition for review, NOT yet approved |
| --- | --- | --- |
| cold_04, cold_05, cold_06, cold_13, cold_24 | 'just refreshing', denial of cold, clothing explanation, 'at least' framing and 'bad clothing' can minimize cold or blame clothing. cold has no lower temperature bound and can match snow/freezing/thunder; sarcastic routing alone is not safety certification. | Hold these proposed additions inactive pending owner-approved wording or reservation. Do not change thresholds to make them fit. |
| excellent_01 / excellent_19 | Essentially the same 'suspiciously good' joke; the original is already released. | Prefer retain 01 and reserve proposed 19, subject to owner decision. |
| cold_07 / cold_09 / cold_19; cold_04 / cold_08 / cold_16; cold_01 / cold_11 / cold_15 | Closely related temperature ambition/freshness/wool concepts. | Flag and explain degree of overlap; do not prune just to reach a count. |
| sun_wind_01 / 03 / 05 / 13; sun_wind_08 / 12 | Repeated sun-arrives-with-wind / bright-but-not-calm beats. | Explicit semantic review; retaining variation may be reasonable, but document judgment. |
| sun_wind_06, sun_wind_21, sun_wind_22 | Headwind/side direction is not known; 'almost perfect' can overstate comfort because sun_wind has no temperature lower bound above the earlier cold branch. Sun language uses daily clear-family evidence, not current daylight. | Distinguish figurative speech from unsupported weather claims; report specific proposed changes/reservations for owner. |
| rain_10, rain_15, cold_17 | Arrival/on-time/as-always, 'now wetter', and waking can imply change/history/time-of-day the engine does not know. | Assess idiomatic intent vs literal unsupported context; do not invent temporal inputs. |
| good_12 | IS says 'no valid excuse', EN says 'no valid complaints'; assess intent/adaptation. | Preserve unless owner approves editorial correction. |

This list is not a completed editorial audit. Review ALL retained and proposed active IS/EN lines, including positive-weather and rain semantic overlaps, not only these examples. good_21 is explicitly approved in the issue as addressing the weather, not the user; do not automatically reject it for 'you'. Daily wording such as 'day off' is not automatically a time-of-day claim. Preserve the issue snapshot as evidence and keep an ID-level findings/disposition ledger. Check exact duplicate texts per language, not across translations/languages.

Do not claim all 113 satisfy the rules until this review is complete. If unresolved required editorial decisions remain, return REVISE with a concrete list for Ripley/owner, not an unconditional implementation approval.

## Intended implementation after editorial approval

1. Apply final owner-approved ID/text ledger to both language files and single shared metadata registry. Keep all remaining existing IDs/text unchanged; use source snapshot for new entries and explicit ledger overrides only. Preserve condition/mood pairs, sarcastic voiceLevel, 7-day cooldown, severity defaults and null CTA. No new content schema or runtime reserve pool is needed.
2. Retire excellent_02 and cold_02 from both active lists, metadata, KNOWN_IDS and current catalogue/manifest. Add these IDs to the existing single RETIRED_JOKE_IDS constant, preserving all 14 prior retired IDs. Never reuse/repurpose. Existing history hydration handles retirement; no migration or selector redesign.
3. Keep inactive proposed cautious-condition content and explicit issue reserve IDs rain_heavy_24/25/29 in source/disposition documentation only, never imported into runtime, selector, history or catalogue. Distinguish permanently retired released IDs from never-activated proposals/reserve text. Do not assert cautious jokes were implemented as active.
4. Extend appropriate content validation/tests to catch duplicate raw IDs, missing/extra translations, exact duplicate texts within a language, metadata inconsistencies and collisions with retired/safety IDs. Semantic checks are a documented editorial audit, not an unreliable claim of automated proof. Avoid new production scans/dependencies.
5. Update tests/count fixtures to final approved totals; preserve coverage for safety precedence, actual-exposure history, cooldown expiry, exhausted-pool fallback, deterministic tie-break and wrong/missing tone. No selector changes without concrete failing evidence and scoped review.
6. Regenerate complete active share catalogue/manifest with existing exporter. If all 113 candidates remained active, there would be 226 language/ID pairs: 22 retained pairs reused and 204 new pairs created. Final actual counts must derive from approved ledger. Retired excellent_02/cold_02's four language-specific HTML/PNG pairs remain as immutable legacy files, along with every earlier released file. New unique IDs may get new v1 paths; do not bump version or alter existing files. Any byte mismatch on retained files is a STOP with exact evidence, never manual manifest edits/overwrite.
7. Inspect long text in card and both share renderers (in-app image and static OG image), mobile/desktop and IS/EN. New content must not clip or overlap. If existing layout cannot accommodate approved text, report exact IDs and screenshots before changing copy or redesigning. New static assets are generated share outputs, not new mascot artwork.
8. Keep viewed/share analytics payloads and exposure deduplication unchanged; new IDs naturally appear and two retired IDs stop new active exposure. Do not send test events to live GA4. Document ID-set discontinuity without claiming production ingestion.

## Validation and acceptance

- Final ledger accounts for every canonical ID: retained, added, retired, reserve, excluded by #432, or pending; exact owner-approved text parity in both languages. Report active totals per condition/language separately from safety counts, reserve text and historical public files.
- Test real engine -> content -> selector for all nine conditions and both languages; four safety messages unchanged, personality never selected for cautious/serious or invalid tone.
- Rotation tests with expanded real pools: recent entries skipped if alternatives exist, seven-day boundary, all-in-cooldown fallback, lexical ties, history persistence/rehydration, retired IDs discarded, safety bypass unchanged. No RNG distribution promises or flaky probabilistic tests.
- Share catalogue/manifest exact active parity, retired/reserve IDs excluded, generated HTML+PNG coverage for every new language/ID pair. Show git status/diff proving zero modifications/deletions to pre-existing released files; new paths only. A test of existence alone is not byte-preservation evidence.
- Browser deterministic fixtures for five expanded conditions plus cautious/serious controls, both languages and mobile/desktop. Verify longest approved text/layout, actual visible impressions, no unintended share eligibility and stale-episode protections. Check hook response parsing before stubbing.
- Run affected Weather Voice content/selector/history/hook/card/share/export suites, lint and build. Run share:export against verified current local dev server; report actual command/results. Full-library exact duplicate and editorial validation covers retained and new lines, not only additions.
- Produce content-validation.md with per-ID findings/dispositions, final counts, semantic overlap decisions, natural EN adaptation review and any remaining limits. No silent editing while validating. Do not mark final acceptance while required editorial choices remain unresolved.

## Boundaries / STOP / handoff

No new conditions, weather thresholds, scoring, normalization, tone classification, safety text, gates, payment/backend, libraries, TS, import extensions, mascot assets, redesign, runtime LLM or admin interface. Do not use 'SAFE' as proof actual travel conditions are safe. Stop for required scope expansion, editorial conflict without an owner decision, or immutable export conflict.

No commit, push, deployment, automated posting or GitHub closure. Jonesy reviews at PROMPT_REVIEW; only after required decisions and APPROVED will Ripley create approved-prompt-v1.md and READY_FOR_CC. CC then verifies pointer, sets CC_IN_PROGRESS, implements, writes docs/ai/tasks/ticket-420/cc-report.md and sets CC_COMPLETE. Result review: docs/ai/tasks/ticket-420/result-review.md. Preserve prior task history.

---

# Jonesy — Round 1 review (2026-10-03)

**Verdict: REVISE.** The implementation plan (items 1-8, validation, boundaries) is sound and I have only additive corrections to it (§6). The blocker is exactly what Ripley anticipated: 12 of the 113 proposed lines carry a concrete editorial problem that needs an owner decision (HOLD), and 9 more are near-duplicates where the issue's own rule ("avoid multiple comments built around essentially the same joke") needs an owner call. Nothing here requires a scope change, a threshold change or a selector change. No code was touched, no wording was rewritten, nothing was committed.

Read fresh this round: CURRENT.md (PROMPT_REVIEW), prompt-review.md (Ripley Round 1), the complete issue-source.md, `weatherVoiceRules.js`, `weatherVoiceEngine.js`, `weatherVoiceContent.js`, `is.js`/`en.js`/`safety.js`, Bible §§1-4, the catalogue test in full, and the content, export and #432 voice-level tests by targeted search for ID and count assumptions. I did not read the exporter code (`weatherVoiceShareExportLib.mjs`/`exportWeatherVoiceShare.mjs`) this round; Ripley's description of it is taken as stated. I did not run anything on the machine (no shell). The mechanical audit in §1 was run on the staged issue snapshot only.

## 1. What I verified, and what I could only audit heuristically

Confirmed against live source and the snapshot:

- Ledger arithmetic is right: good 3+20=23, excellent 2+20=22 (excellent_02 retired), rain 2+21=23, cold 2+21=23 (cold_02 retired), sun_wind 2+20=22 → **113**; 11 retained + 102 new; 226 pairs = 22 retained + 204 new.
- The only three "Keep existing" lines whose EN differs from the live runtime are cold_01, cold_03 and excellent_03, as Ripley states. The other eight retained lines (good_01-03, rain_01-02, sun_wind_01-02, excellent_01) are identical in IS and EN to the live files. The owner's three EN overrides match the live `en.js` exactly.
- The 113-line ledger (with the three overrides applied) has **zero exact duplicate texts in IS and zero in EN**. A cross-language duplicate check is not required.
- The condition mix is consistent with `CONDITION_VOICE_LEVELS`: the five expanded conditions are exactly the five sarcastic ones; none of the cautious/serious proposals needs to be touched.

Heuristic scan (regex and similarity, **not proof**, used only to find candidates): second-person words, time/arrival words, sentence-initial templates, token/sequence similarity within a condition. Findings feed §3-§4 below. Two statistics worth Ripley/owner knowing: 20 of 113 IS lines start with "Þetta" and 14 with "Ég" (about 30% together), and 10 EN lines use "Apparently/apparent" (6 IS lines use "víst"). That is a stylistic-monotony signal for the owner, not a rule violation.

## 2. What each condition's engine predicate lets a line claim

Taken from `weatherVoiceEngine.js` (priority order applies), with what the engine does **not** know:

| Condition | Engine predicate (after higher-priority conditions are excluded) | A line must not claim |
| --- | --- | --- |
| cold | tmax < 6, wind ≤ 10, and not (liquid code and rain ≥ 1). **No lower temperature bound.** Matches snow, freezing precipitation, thunder, fog, clear and overcast, and a trace of drizzle. | Mildness or harmlessness ("refreshing", "no such thing as cold"), a dry/clear/calm day, or what the user is wearing. |
| rain | tmax ≥ 6, liquid code, 1 ≤ rain < 12, wind ≤ 10. Daily total, not "right now". | A before/after change ("now wetter"), habit/history ("as always"), or arrival time. |
| sun_wind | CLEAR family (codes 0/1) only, 5 < wind ≤ 10, rain < 1, tmax ≥ 6. Daily clear-family evidence, not current daylight. **No wind direction**, no upper temperature bound. | Direction (head/side wind), a position of the sun, "almost perfect" comfort. |
| excellent | CLEAR family, tmax > 14, wind ≤ 5, rain < 1. | Anything beyond warm, calm, clear and dry. |
| good | dry family (clear/partly cloudy/overcast), tmax ≥ 12, wind ≤ 5, rain < 1. **Overcast is allowed**, and so is any warm temperature. | Sun, blue sky or brightness. (No proposed line makes that claim; checked.) |

Bible rules that decide cases: §2 (humour never at the user, **explicitly not at how they are dressed**), §3 test 5 and its rejection rule (if a line could minimise real danger in *any* context it could appear in, it is excluded, not merely discouraged), §1 ("not ... belittling bad or dangerous weather"), and §3's list of non-Tjaldur examples (cosy "weather to snuggle under a blanket"). The issue's global rule "do not infer season, month or time of day" also applies.

## 3. ID-level findings and dispositions

Legend: **HOLD** = I recommend not activating until the owner approves wording or reserves it. **RESERVE** = near-duplicate; I recommend leaving it inactive (never-released ID, text kept in documentation only, not in KNOWN_IDS). **NOTE** = accept as written, with a documented caveat. All other IDs: **ACCEPT, no finding** (IS and EN intent match, deadpan, no addressee, no instruction, claim within the predicate).

### 3.1 HOLD (owner decision required)

| ID | Finding | Recommended default |
| --- | --- | --- |
| cold_04 | "Just refreshing" frames cold as pleasant; cold has no lower bound (Bible §3 test 5). | Reserve (agree with Ripley). |
| cold_05 | Denies that cold exists; same bound problem. | Reserve (agree). |
| cold_06 | Explains cold as a clothing matter; Bible §2 forbids teasing how the user dresses; reads as advice. | Reserve (agree). |
| cold_13 | "At least not too warm" is the same "at least" consolation that the issue itself used to retire rain_heavy_01. | Reserve (agree). |
| cold_24 | "No bad cold, only bad clothing" blames clothing/user; also the same family as cold_05/06 (three lines, one denial-plus-clothing idea). | Reserve (agree). |
| cold_17 | "One way to wake up" infers morning/time of day (global rule). Not fixable by trimming. | Reserve. |
| rain_10 | "Right on time. As always" claims a schedule and a habit the engine cannot know (arrival time, history). | Reserve; owner may instead approve the shorter IS "Rigningin mætti á réttum tíma." / EN "The rain arrived right on time." (drops only "as always"; still implies arrival). |
| rain_15 | "Everything is slightly wetter **now**" claims a change from before; the engine sees a daily total, and `weatherVoiceTypes.js` states Weather Voice is daily-scope, not suited to "right now" claims. | Reserve. |
| sun_wind_06 | "With a headwind": direction is unknown. | Reserve (agree). |
| sun_wind_21 | "Wind from the side": direction unknown; "sun above" is a daily clear-family flag, not a current sun position. | Reserve. |
| sun_wind_22 | "Almost perfect" overstates comfort: sun_wind covers 6 °C days with 10 m/s wind, and it blurs the line with good/excellent. | Reserve. |
| good_12 | IS "Engin gild **afsökun**" (no valid excuse) vs EN "No valid **complaints**". The IS does not say an excuse for what, so it is not self-explanatory. EN is the clearer joke. It also duplicates good_03/good_04 ("no complaints"). Ripley said preserve unless the owner approves a correction. | Owner choice: (A) reserve, my lean, given the overlap; (B) minimal fix: IS "afsökun" → "kvörtun", matching the EN intent. Owner to confirm the Icelandic reads naturally. |

That is 12 IDs (cold 6, rain 2, sun_wind 3, good 1), including Ripley's five cold IDs and sun_wind_06.

### 3.2 RESERVE (near-duplicate groups; owner call)

| Group (same joke) | IDs | Evidence | Recommended keep → reserve |
| --- | --- | --- | --- |
| "suspiciously good" | excellent_01 / 19 (also 05) | 19 is 01 with one word added: identical token set in IS and EN (similarity 1.0). 05 ("uncomfortably good") is a different adverb and the Bible lists it as "very Tjaldur", so it stays. | keep 01 (released) → reserve **excellent_19** (agree with Ripley). |
| sun arrives, wind comes too | sun_wind_01 / 03 / 05 / 13 | One joke four times in 22 lines. 05 is 03 with "is doing its thing" (similarity 0.78 in IS) and a ten-word EN. 13 is the same beat rephrased. | keep 01 (released) + 03 → reserve **05** and **13**. |
| bright but not calm | sun_wind_02 / 08 / 12 | 08 and 12 say the same thing; 08's IS ("Rólegt, síður") is clipped and the EN ("Calm, less so") is awkward. 02 (hair sideways) is a distinct released beat. | keep 02, 12 → reserve **08**. |
| dry is unavailable | rain_06 / 11 / 20 | 06 and 11 share one scheduling metaphor (day off / not on the agenda). 20 ("too simple") is a different beat. | keep 06, 20 → reserve **11**. |
| the weather chose water | rain_09 / 19 | Same structure ("weather chose water" / "took the wet route"). | keep 09 → reserve **19**. |
| rain was needed | rain_08 / 18 / 23 | Three "apparently this was necessary" lines (08 and 18 are 0.71 similar in EN). 23 is the issue's own "Icelandic cliché" exemplar. | keep 08, 23. Optional: 18 stays (NOTE) unless the owner wants fewer. |
| thermometer not trying | cold_07 / 09 / 19 | 09 and 19 both have the thermometer lacking ambition (EN similarity 0.72). | keep 07, 19 → reserve **09**. |
| "fresh" | cold_08 / 16 (04 on HOLD) | Same ironic-euphemism beat; 16 is shorter and more clearly ironic ("very"). | keep 16 → reserve **08**. |
| warmth is absent | cold_12 / 14 / 21 | "Didn't show up" / "went elsewhere" / "low profile": one personification three ways. | NOTE only; keep all three unless the owner wants fewer. |
| sweater / wool | cold_01 / 11 / 15 | 11 "sweater weather" is a stock cosy phrase that evokes autumn (Bible §3 lists cosy framing as *not* Tjaldur) and understates deep cold. | keep 01, 15 → reserve **cold_11**. |

RESERVE recommendations: excellent_19; sun_wind_05, 08, 13; rain_11, 19; cold_08, 09, 11 (**9 IDs**). Everything in §3.2 marked "NOTE only" or "optional" is intentionally left active.

### 3.3 NOTE (accepted, with a caveat to document in the validation report)

| ID | Caveat |
| --- | --- |
| good_21 | "You win" reads as addressed to the user on a standalone card or share image; the issue explicitly approves it as addressed to the weather. Accept per the issue and document the residual ambiguity. |
| good_08 | "No need for drama" can be read as a mild instruction. It still comments on the weather; accept. |
| good_16 | Longest IS line (10 words, 59 chars); "say it with fewer words" applies. Owner may want it trimmed; I am not a native speaker and will not propose Icelandic wording. It is also a layout-test priority ID. |
| good_06, good_20 | "It's been worse" and "forgot itself" refer to past/other weather generically; idiomatic. EN good_20 adds "for a moment", which the IS does not say; harmless. |
| good_23 | Close to good_02 ("just good" vs "actually pretty fine"), but both are in the issue's tone examples. Keep unless the owner wants fewer. |
| excellent_07, excellent_18 | "Something must be wrong" and "I checked twice" can read as doubting the forecast data; in character (suspicious), accept. |
| excellent_21 | "Frábært/excellent" is the nearest to hype; the "Fine." opener keeps it begrudging. Accept. |
| rain_14 | "The rain is here" asserts arrival, and the EN passive ("apparently it was missed") softens the IS ("everyone felt it was missing"). Idiomatic; accept, owner may reword. |
| rain_18 / cold_14 / cold_12 / cold_21 | Overlap noted in §3.2; kept. |
| sun_wind_04 | "Bright and breezy" is a stock phrase and slightly benign for 5-10 m/s; IS "blásið" should get an Icelandic-reader check. |
| sun_wind_17 | "The sun is trying" suggests the sun struggles, on a day the engine flags as clear. Figurative; accept. |
| sun_wind_14 | "Lovely from a distance" implies the reader is indoors; figurative; accept. |
| cold_10, cold_18, cold_20, cold_22, cold_23 | Understatement at tmax < 6 (cold_20 "Not exactly a heatwave", cold_23 "a few degrees missing") works only as irony; it passes Bible §3 test 5 because it never says the cold is harmless. Accept. |
| temporal idioms | "Mætti / showed up / kom / came" (cold_12, cold_22, good_14, sun_wind_03, 13) are the same idiom as the already-released sun_wind_01; not time-of-day claims. "Í dag / day off" (rain_06, cold_10) matches the daily row. |

### 3.4 ACCEPT, no finding (67 IDs)

- good: 01, 02, 03, 04, 05, 07, 09, 10, 11, 13, 15, 17, 18, 19, 22
- excellent: 01, 03, 04, 05, 06, 08, 09, 10, 11, 12, 13, 14, 15, 16, 17, 20, 22, 23
- rain: 01, 02, 03, 04, 05, 07, 08, 09, 12, 13, 16, 17, 20, 21, 22, 23
- cold: 01, 03, 07, 15, 16, 19
- sun_wind: 01, 02, 07, 09, 10, 11, 12, 15, 16, 18, 19, 20

Reconciliation: 67 ACCEPT + 25 NOTE + 12 HOLD + 9 RESERVE = 113. Active if all recommendations are approved: 67 + 25 = 92.

### 3.5 Counts if all my recommendations are approved

| Condition | Proposed | HOLD | RESERVE | Active |
| --- | --- | --- | --- | --- |
| good | 23 | 1 | 0 | 22 |
| excellent | 22 | 0 | 1 | 21 |
| rain | 23 | 2 | 2 | 19 |
| cold | 23 | 6 | 3 | 14 |
| sun_wind | 22 | 3 | 3 | 16 |
| **Total** | **113** | **12** | **9** | **92** |

If approved as a whole: 11 retained + 81 new IDs per language; 22 retained pairs + 162 new pairs. good+excellent = 43 of 92 (47%). Every condition is still far above the current 2-3 lines, and no count is a goal in itself; if the owner prefers more variety to fewer overlaps, any RESERVE line can return without affecting the others. The count in the final prompt must come from the owner-approved ledger, not from this table.

## 4. IS/EN adaptation and language notes

- Intent mismatches between IS and EN: good_12 (excuse vs complaints, §3.1); rain_14 (everyone vs passive); good_20 (EN adds "for a moment"); good_13 (EN adds "Apparently"); good_19 (fullorðinslegt "grown-up" → "responsible"); good_23 (fínt → "quite nice", slightly warmer). Only good_12 needs a decision; the rest are acceptable adaptations.
- EN lines that read awkward but are understandable: excellent_04 ("outdoor weather"), sun_wind_08 (on the reserve list).
- Icelandic naturalness I can't certify (I am not a native speaker; the owner is): sun_wind_04 ("blásið"), sun_wind_08 ("Rólegt, síður"), good_16 length, good_12's fix. Gender: Tjaldur speaks in the masculine consistently (undirbúinn, tilbúinn); no inconsistency found.
- Bible vs issue: Bible §3 lists the imperative "Út með þig. Ég meina það." as "very Tjaldur", while the issue bans commands. The issue is newer and governs; none of the 113 lines is an imperative. The Bible record for #420 should note this so the two don't contradict each other.

## 5. Safety and scope review of the issue as a whole

- Nothing in the 113 touches the four safety messages, `voice_level` policy or thresholds. The cautious/serious proposals (cold_wet_04+, wind_strong_04+, rain_heavy_04-29, the three reserve IDs, and the "Keep existing" headings for cold_wet_01-03, wind_strong_01-02, rain_heavy_02-03) must stay documentation-only. Note for the ledger: the issue's "Keep existing" and "Retire" headings for those conditions describe IDs that **#432 already retired permanently**, so the ledger should list them as retired-by-#432 / not activated, never as "kept".
- The issue's own validation item 9 (no serious outcome can select personality content) and 13 (reserve not eligible) are already enforced by #432's dispatcher and by KNOWN_IDS gating; the tests should show it with the real expanded library.

## 6. Required additions to the executable prompt (technical review of Ripley's plan)

These are corrections or concrete details; none changes the plan's direction.

1. **Tests with hard-coded #432 counts must be updated, not just "count fixtures".** Verified in the repo: `weatherVoiceVoiceLevel.test.js` asserts 13 library entries per language, a 26-entry catalogue, exactly 14 retired IDs, and 28 retired HTML/PNG files on disk; `weatherVoiceContent.test.js` has full expected-text maps (including `cold_02` and `excellent_02` and "has exactly 13 entries"); `weatherVoiceShareCatalogue.test.js` and `weatherVoiceContent.test.js` contain stale "27/54" comments; `WeatherVoiceCard.test.jsx` line 327 uses `excellent_02` as a fixture ID (harmless, but it should not use a retired ID); the regex `/^excellent_0[1-3]$/` in `useWeatherVoice.voiceLevel.test.jsx` no longer describes the pool (it would still pass only because `rng: () => 0` picks the first sorted ID). Retired set becomes 16 IDs; retired legacy files on disk become 32 HTML + 32 PNG (28 + 4).
2. **Ledger as data.** Ask CC to keep the owner-approved ledger as a single checked-in data fixture (for tests and for content-validation.md) and have tests compare runtime IS/EN to it. A hand-typed second copy in several test files is how the #432-era drift happened.
3. **Cheap mechanical guard test**, not a production scan: no emoji; no second-person word in IS/EN except an explicit allowlist (good_21); no sentence-initial imperative from a short IS/EN denylist; a length ceiling set from the owner-approved maximum. My scan found these checks workable on this content. Document that semantic review stays human.
4. **Reserve and HOLD IDs**: never in `WEATHER_VOICE_KNOWN_IDS`, never in the manifest, and covered by a test that proves it; ledger status must separate *retired-released* (reserved forever in `RETIRED_JOKE_IDS`) from *unreleased reserve/hold* (not in the constant, text in docs only). Update the `RETIRED_JOKE_IDS` comment, which currently says "jokes for cautious/serious conditions": after this ticket it also holds two sarcastic-condition retirements.
5. **Share asset volume.** Each language/ID pair adds one HTML (about 2.4 KB) and one PNG (about 75-105 KB). The full 113 means 204 new pairs, roughly 18-19 MB of new committed static files (about 15 MB for 162). Not a blocker, but the owner should know before approving, and it argues for settling the ledger first so the exporter runs once.
6. **Layout test targets.** Name the longest approved lines explicitly in the browser check, in both renderers (in-app image and static OG image): good_16 (IS 59 chars), sun_wind_07 and sun_wind_10 (EN 9 words), rain_14, good_10; they are the stress cases.
7. **Docs to update**, in addition to content-validation.md: a narrow #420 record in the Bible (as #432 did in §12, including the imperative-example note in §4 above), and the ID-set discontinuity note in `docs/analytics/weather-voice-production-validation.md` and `weather-voice-share-pilot.md` (two IDs retired, N new). No GA4 claims.
8. **Order of work:** ledger approved → content + registry + retired set → tests → exporter on the verified dev server → manifest/artifacts → byte-preservation evidence (`git status`/`git diff` showing no modified or deleted pre-existing file under `public/share`) → browser matrix. Any mismatch on a retained file is a STOP, as Ripley already wrote.
9. Existing rotation tests should keep the "no RNG distribution promise" rule; one extra deterministic case worth adding: with the real expanded pool, exposure of every ID except one leaves that one as the only non-cooldown pick.

## 7. Questions Ripley should put to the owner (minimum set)

1. **Cold HOLD group** (cold_04, 05, 06, 13, 24, 17): reserve all six, or supply approved replacement wording?
2. **rain_10 and rain_15**: reserve both, or approve the shorter rain_10 variant in §3.1?
3. **sun_wind_06, 21, 22**: reserve all three?
4. **good_12**: reserve, or minimal fix (afsökun → kvörtun)?
5. **Near-duplicate reserves** (§3.2: excellent_19; sun_wind_05, 08, 13; rain_11, 19; cold_08, 09, 11): approve as a set, or name the lines to keep active?
6. **Icelandic read-through** of sun_wind_04, sun_wind_08 (if kept), good_16 length: any wording the owner wants changed?
7. **Asset volume** (about 15-19 MB of generated files in the repo): acceptable?
8. Confirm good_21 stays as the issue approved it.

## 8. Disposition and state

**REVISE.** Not executable. Next step for Ripley: take §7 to the owner, record the decisions as an ID-level ledger in the approved prompt, add §6, and send back for a short Round 2; I expect to approve if the ledger reconciles with the engine predicates in §2. CURRENT.md stays at PROMPT_REVIEW; the approved prompt line stays "None yet". No commit, push, deploy or GitHub closure.

Limits: no shell on the machine (nothing run, including the existing test suite); Icelandic naturalness is flagged for the owner rather than certified; the similarity scan is a candidate finder, and the dispositions above are my editorial judgment, not an automated proof.

---

## Ripley revision — Round 2 preparation (2026-10-03)

Review material only; owner editorial answers pending. Jonesy's technical additions are accepted with the qualifications below. Do not execute this draft or interpret the proposed 92 count as owner approval.

### Editorial decision request

Asked the owner to decide the combined proposed inactive set (21 never-released IDs):
- Context/tone/adaptation holds: cold_04, cold_05, cold_06, cold_13, cold_17, cold_24; rain_10, rain_15; sun_wind_06, sun_wind_21, sun_wind_22; good_12.
- Near-duplicate reserves: excellent_19; sun_wind_05, sun_wind_08, sun_wind_13; rain_11, rain_19; cold_08, cold_09, cold_11.

Recommended disposition is documentation-only reserve for all 21, with original text retained; no replacement wording. If accepted, active counts are good 22, excellent 21, rain 19, cold 14, sun_wind 16 = 92 per language, comprising 11 retained and 81 new IDs. Four separate bilingual safety messages remain unchanged. Owner is also reviewing whether to preserve sun_wind_04 and good_16 exactly as authored. These decisions are not yet recorded as approved.

Do not re-request approval for good_21: the issue already explicitly approves its weather-directed address. Keep it active and document standalone-card ambiguity. The earlier owner approvals for #432 safety mapping and the three existing EN strings remain binding.

Jonesy's HOLD reasoning is editorial judgment, not an engine fact in every case: waking is not necessarily morning, and metaphorical arrival is not automatically a time claim. The owner is deciding whether these lines fit the product voice; do not claim the engine mechanically proves those editorial readings.

### Technical revisions to carry into the final consolidated prompt

1. Establish a single checked-in owner-approved content ledger fixture used by tests and the validation report, not imported into production. It must account for canonical IDs/statuses and exact IS/EN text with owner overrides. Avoid separately hand-copying expected text across many tests. Keep never-activated reserve/hold text distinct from permanently retired released IDs; only the latter belong in RETIRED_JOKE_IDS.
2. Update all stale concrete contract expectations: weatherVoiceVoiceLevel.test.js (13 entries, 26 catalogue, 14 retired IDs, 28 retired pages/images); weatherVoiceContent.test.js text maps/counts; stale 27/54 comments; WeatherVoiceCard.test.jsx's excellent_02 fixture; useWeatherVoice.voiceLevel.test.jsx's narrow /^excellent_0[1-3]$/ assertion. Use final ledger membership and independent behavioral assertions, not weakened tests. The retired released set becomes 16 IDs, with 32 legacy HTML and 32 legacy PNG files. Update the retired-set comment to include sarcastic-condition retirements.
3. Add cheap test-only editorial guardrails where useful: emoji, explicit second-person exceptions (good_21), and narrowly defined imperative checks. Treat these as heuristics with documented limits, not linguistic proof; avoid broad regexes that reject legitimate metaphors. A length regression guard may use the approved maximum, but is not a new editorial cap or authority to trim text. Whole-library semantic review remains documented judgment.
4. Prove inactive IDs are absent from raw active lists, KNOWN_IDS, resolved library and manifest. Preserve #432 reserved/safety collision tests. Add deterministic expanded-pool rotation coverage where all but one eligible ID are in cooldown and the remaining one must be chosen; retain existing expiry/fallback/tie-break tests.
5. New share outputs are required, not an optional follow-up. At the proposed 92 count: 184 active language/ID pairs, 22 reused pairs and 162 newly generated HTML/PNG pairs (roughly 15 MB additional files, estimate only). Owner has been informed of this expected repository footprint; record actual output sizes. Settle the ledger before generating. Every pre-existing released file stays byte-identical; no deletion, rewrite, redirect or version bump.
6. Explicit layout stress cases in both IS/EN and both share renderers: good_16, sun_wind_07, sun_wind_10, rain_14, good_10. Test approved wording unchanged on mobile/desktop; report clipping before changing wording/layout scope.
7. Add a narrow #420 Bible record explaining that this issue's no-user-commands rule supersedes historical imperative examples for new personality content. Preserve historical sections. Update analytics production-validation/share-pilot docs for two additional retired IDs and the final number of new IDs, without claiming live GA4 registration/ingestion.
8. Execution order: approved ledger -> content/metadata/retired set -> tests -> existing exporter on verified local server -> generated manifest/assets -> byte-preservation diff evidence -> browser checks and validation report. Any retained-file mismatch is a STOP with exact evidence.

All other Round 1 boundaries and validation requirements remain. Once owner responses arrive, append the exact decisions and produce a reconciled Round 2 for Jonesy's review. Until then CURRENT remains PROMPT_REVIEW, no approved execution prompt exists.

---

## Ripley revision — Round 2, owner decisions resolved (2026-10-03)

**Ready for Jonesy's Round 2 review. Discussion only, not executable.** This section replaces the pending editorial decisions and provisional counts above. Round 1's implementation/validation/boundaries and the Round 2 technical revisions apply with this final ledger. No outstanding owner question remains from Jonesy's Round 1 review.

### Owner authorization

Róbert answered **"Já við báðu"** after being asked to (1) keep the specified 21 proposed texts inactive, leaving 92 active per language, and (2) retain exactly `sun_wind_04` IS "Bjart og blásið." and `good_16` IS "Þetta verður ekki mikið betra án þess að verða grunsamlegt." No replacement wording was approved or requested. Preserve their canonical EN as well. The estimated roughly 15 MB of generated share artifacts was disclosed; generating the required artifacts is part of the planned implementation, not a new publishing authorization.

Earlier owner approvals still apply: #432 safety mapping remains unchanged; proposed cautious-condition jokes stay documentation-only; preserve the live EN strings for cold_01, cold_03, excellent_03. good_21 remains active under the issue's explicit weather-directed-address exception. No additional confirmation is needed for these already-resolved choices.

### Final ID-level active ledger

Numbers below are inclusive, zero-padded suffixes under the named prefix. Text comes verbatim from issue-source.md's canonical library, except the three explicitly listed EN overrides. Do not source text from tone examples elsewhere in the issue.

| Prefix / condition | Active suffixes | Count |
| --- | --- | --- |
| good | 01–11, 13–23 | 22 |
| excellent | 01, 03–18, 20–23 | 21 |
| rain | 01–09, 12–14, 16–18, 20–23 | 19 |
| cold | 01, 03, 07, 10, 12, 14–16, 18–23 | 14 |
| sun_wind | 01–04, 07, 09–12, 14–20 | 16 |
| **Total per language** | | **92** |

Retained active IDs (11): good_01/02/03, excellent_01/03, rain_01/02, cold_01/03, sun_wind_01/02. Preserve their existing IS/EN text. All other active IDs in the table (81) are new.

Exact EN overrides, preserving released runtime wording:
- cold_01: `The sweater was right.`
- cold_03: `The coffee cools out of sympathy.`
- excellent_03: `All that's missing is the coffee.`

### Final inactive ledger

**Unreleased editorial reserves (21), original IS/EN text retained in documentation/test ledger only:**
- cold_04, cold_05, cold_06, cold_08, cold_09, cold_11, cold_13, cold_17, cold_24 (9).
- rain_10, rain_11, rain_15, rain_19 (4).
- sun_wind_05, sun_wind_06, sun_wind_08, sun_wind_13, sun_wind_21, sun_wind_22 (6).
- excellent_19 (1).
- good_12 (1).

There are no remaining pending HOLD entries in this set: all 12 former HOLD recommendations are now owner-approved inactive reserves, alongside the nine near-duplicate reserves. Do not rewrite good_12 or shorten rain_10; neither alternative was selected.

**Newly retired released IDs (2):** cold_02 and excellent_02. Remove from active content and reserve forever in RETIRED_JOKE_IDS; preserve released files.

**Previously retired by #432 (14):** wind_extreme_01–05, wind_strong_01–03, rain_heavy_01–03, cold_wet_01–03. Remain permanently retired, regardless of stale 'Keep existing' headings in #420.

**Excluded by unchanged #432 policy, never activated:** cold_wet_04–23, wind_strong_04–23, rain_heavy_04–23 and rain_heavy_26–28. Preserve as documentation-only proposals. The issue's explicit reserve rain_heavy_24/25/29 likewise remains documentation-only, distinct from retired-released IDs. No personality text is added for extreme_wind. Four bilingual safety messages remain unchanged and outside the 92 count.

### Reconciled acceptance figures and review request

- 92 active personality IDs per language = 11 retained + 81 new; 43/92 good or excellent.
- 184 active share pairs = 22 reused pairs + 162 new pairs; each pair is one HTML plus one PNG.
- 16 permanently retired released IDs; their legacy artifacts total 32 HTML + 32 PNG. Preserve all 108 pre-existing released files, including retained active ones; only new paths may be created (324 new files if export completes as specified).
- Tests and the non-production ledger fixture must independently reconcile these exact sets/counts with raw language lists, metadata, selector eligibility and generated manifest. Do not regenerate expected wording from runtime content and call that validation.
- Carry forward every technical revision from the preceding Round 2 preparation, including specific fixture fixes, deterministic rotation case, no silent editorial changes, both share-renderer layout checks, immutable artifact STOP, and docs/analytics updates. Mechanical wording guards remain limited heuristics; owner-approved text is authoritative.
- Jonesy's NOTE entries remain active as written; include their caveats and the accepted overlap groups in content-validation.md. Owner approval of this reserve set is not authorization to trim further or impose a quota.

Jonesy: verify this ledger against issue-source.md and the owner decisions, check technical revisions and count reconciliation, then append APPROVED or REVISE. CURRENT remains PROMPT_REVIEW until Jonesy's approval; Ripley will then create the consolidated executable approved-prompt-v1.md. No implementation, commit, push, deployment or GitHub closure in this turn.

---

# Jonesy — Round 2 review (2026-10-03)

**Verdict: APPROVED.** The final ledger reconciles with issue-source.md, the live runtime, the engine predicates and my Round 1 recommendations. Ripley's technical revisions carry every Round 1 correction. The four small additions below are non-blocking; Ripley can fold them into approved-prompt-v1.md without another round.

Read fresh: CURRENT.md (PROMPT_REVIEW, Ripley Round 2 pointer), prompt-review.md from the start of Ripley's Round 2 preparation to the end, and issue-source.md. The ledger was checked mechanically against the parsed issue snapshot. I ran no tests and have no shell on the machine.

## 1. Ledger verification

| Check | Result |
| --- | --- |
| Active suffix ranges expanded | good 01-11, 13-23 = 22; excellent 01, 03-18, 20-23 = 21; rain 01-09, 12-14, 16-18, 20-23 = 19; cold 01, 03, 07, 10, 12, 14-16, 18-23 = 14; sun_wind 01-04, 07, 09-12, 14-20 = 16; total **92**. |
| Active set vs my Round 1 recommended set | **Identical** (12 HOLD + 9 RESERVE removed from the 113; no ID differs). |
| Inactive set | Exactly the 21 IDs Ripley lists (cold 9, rain 4, sun_wind 6, excellent 1, good 1); none is also active, none is retired. |
| Retained vs new | 11 retained (good_01-03, excellent_01/03, rain_01/02, cold_01/03, sun_wind_01/02) + 81 new = 92. |
| Exact duplicates in the final text | None within IS, none within EN, none across languages (so the generated export test's unique-title assertion cannot trip on cross-language collisions). |
| Characters | Only ASCII plus Icelandic letters (á é í ó ú ý ð þ æ ö); no `<`, `>`, `&` or `"`, so no HTML-escaping surprises in the 162 new pages. Longest line: IS 59 chars (good_16), EN 50 (sun_wind_07), the layout stress cases Ripley names. |
| Newly retired released IDs | cold_02, excellent_02 (both live in the registry, `is.js`/`en.js` and the generated manifest today). Total retired 14 + 2 = **16**. |
| Excluded by #432, never activated | cold_wet_04-23, wind_strong_04-23, rain_heavy_04-23 and 26-28, plus the explicit reserves rain_heavy_24/25/29: matches issue-source.md (the 'Keep existing' headings for cold_wet_01-03, wind_strong_01-02 and rain_heavy_02-03 are #432-retired and stay so). |
| Share arithmetic | 92 × 2 = 184 active pairs; 22 reused (11 retained × 2) + 162 new; 162 × 2 = **324** new files. Pre-existing 108 = 27 IDs (13 active + 14 retired) × 2 languages × (HTML + PNG). Retired legacy files after the ticket: 16 IDs × 2 × 2 = 32 HTML + 32 PNG. Reconciles: 64 legacy + 44 retained-active = 108. |
| Text source | Verbatim from the issue canonical library; the three EN overrides match the live `en.js`; the other eight retained lines are identical in IS and EN to the live files (verified in Round 1). |

The owner's "Já við báðu" answer (21 inactive; keep sun_wind_04 and good_16 as authored, with their EN) is recorded in Ripley's section. I cannot see that conversation, so I rely on Ripley's record for it; nothing in the ledger contradicts it, and no replacement wording was introduced. Ripley's clarification that my HOLD readings (cold_17 waking, metaphorical arrival) are editorial judgment and not engine facts is correct; the owner's decision rests on product voice, and the ledger does not depend on the engine proving those readings.

## 2. Technical revisions: all Round 1 items are carried

Confirmed present in Ripley's eight items: single test-only ledger fixture (no hand-copied text across tests); concrete stale-fixture list (weatherVoiceVoiceLevel.test.js, weatherVoiceContent.test.js, stale 27/54 comments, the `excellent_02` Card fixture, the narrow `/^excellent_0[1-3]$/` regex); retired set becomes 16 with 32 + 32 legacy files; retired-set comment updated; inactive IDs proven absent from raw lists, KNOWN_IDS, resolved library and manifest; deterministic "all but one in cooldown" rotation case; mechanical guardrails limited to heuristics with the length guard explicitly not an editorial cap; asset footprint disclosed and ledger settled before generation; layout stress cases in both renderers; Bible and analytics docs; execution order with the immutable-artifact STOP. Nothing is missing from my Round 1 §6.

## 3. Non-blocking additions for the consolidated prompt

1. **Prove the inactive text does not ship.** The ledger fixture holds the 21 reserve texts. After `npm run build`, CC should search the build output for one or two distinctive inactive strings (for example a reserve line that is not a substring of any active line) and for the reserve IDs, and report zero matches; also confirm no `public/share/tjaldur/v1/*/<inactive id>.html|png` exists. This is cheap and turns "not imported into production" from a claim into evidence. The fixture must live in a test-only location that no non-test module imports.
2. **Report the bundle delta.** The generated manifest is imported at runtime by the Facebook resolver. At 26 entries it is 8,399 bytes, so 184 entries is roughly 59 KB raw, plus the larger IS/EN text lists. Not a blocker; ask CC to record the production bundle size before and after in the report.
3. **Run order detail.** `weatherVoiceShareExport.generated.test.js` reads real HTML/PNG files for every catalogue entry, so it must run after the exporter, not with the earlier test batch. Say so explicitly, otherwise CC may chase a failure that is only "export not run yet".
4. **Ledger-first acceptance.** The final report's count tables (per condition and language: active, reserve, retired, excluded; safety messages separately) should be produced from the fixture and independently re-derived from the raw `is.js`/`en.js` lists, as Ripley already requires. I add only that the report should mark which active IDs are NOTE entries so the caveats travel with the IDs. My Round 1 §3.3 NOTE list has 25 IDs, none of them in the inactive set, so all 25 are active (67 ACCEPT + 25 NOTE = 92, matching the ledger).

## 4. Residual limits to carry into content-validation.md

- good_21 reads as addressed to the user on a standalone card or share image (approved by the issue; document it).
- The mechanical guardrails are heuristics; whole-library semantic review is human judgment.
- Icelandic naturalness of the retained wording was left to the owner, who confirmed sun_wind_04 and good_16 as authored.
- Released legacy URLs (including the two newly retired ones, one of which is the imperative "Ekki segja neinum") stay reachable by design.
- Full suite, lint, build, exporter and browser results will be CC's evidence until independently checked at result review.

## 5. Disposition

**APPROVED.** Ripley can create approved-prompt-v1.md from the Round 1 boundaries, the Round 2 technical revisions, the final ledger and §3 above, and move CURRENT to READY_FOR_CC. CURRENT stays PROMPT_REVIEW until then. No implementation, commit, push, deployment or GitHub closure was performed.

---

## Ripley scope revision — owner activates all 25 reserves (2026-10-03)

Owner, after seeing the complete 25-row reserve list in Icelandic, instructed: **"Þessir textar mega allir vera virkir"**. This supersedes the earlier editorial reserve decisions, including rain_13. It applies to the 25 explicitly listed reserve entries, NOT to the 16 released-retired IDs or 63 excluded proposals mentioned separately. No further approval of the wording/overlap of those 25 is needed.

Restore as active proposals with their canonical IS/EN text: cold_04/05/06/08/09/11/13/17/24; excellent_19; good_12; rain_10/11/13/15/19; sun_wind_05/06/08/13/21/22; rain_heavy_24/25/29. The first 22 bring the five existing sarcastic pools back to 113 (good 23, excellent 22, rain 23, cold 23, sun_wind 22). Three heavy_rain entries are also explicitly requested active; their presentation integration needs resolution below, so do not silently leave them as reserves or relabel them cautious.

Read-only audit confirms weatherVoiceRules.js still assigns heavy_rain=cautious. Current safety dispatcher intentionally bypasses jokes/history and share policy allows sarcastic content only. Making the three ark jokes visible therefore requires a deliberate change beyond content-only #420; do not merely add unreachable rows or silently replace the safety message. Asked owner whether the three should appear alongside the existing heavy-rain caution message (recommended) or replace it. Prior explicit instruction to preserve #432 safety behavior conflicts with an unspecified replacement; resolve this presentation choice before producing the executable revision. No runtime edits now.

approved-prompt-v2.md is superseded for future execution by this new scope request; preserve it as history. Its count-only corrections must be recalculated after the new behavior is settled, not applied as 91-count fixes. The accurate quotation and already-resolved-owner-decision corrections remain relevant. Return CURRENT to PROMPT_REVIEW with no executable prompt until the new scope is specified and Jonesy reviews it. No commit/push/deploy/issue closure.

---

## Ripley revision — Round 3: all 25 active, heavy-rain supplement (2026-10-03)

**Ready for Jonesy review; not executable.** Owner confirmed all 25 previously listed reserve texts may be active, then chose **"Auk varúðartextans (ráðlagt)"** for the three ark lines. This supersedes previous editorial exclusions and extends the former content-only scope narrowly to support a secondary heavy-rain remark. Do not ask again whether these texts are acceptable. Preserve their exact canonical IS/EN wording. Do not reactivate any of the 16 retired released IDs or 63 separately excluded proposals.

### Final intended content

- Main sarcastic pools: 113 IDs per language, good 23, excellent 22, rain 23, cold 23, sun_wind 22. Restore the 22 named reserves from the preceding scope revision, including rain_13. Existing three EN preservation overrides still apply.
- Secondary heavy-rain pool: rain_heavy_24, rain_heavy_25, rain_heavy_29, canonical IS/EN text. These are three active supplemental personality messages, NOT safety messages or primary sarcastic presentations.
- Total personality content: 116 bilingual IDs (113 primary + 3 supplemental). Four existing bilingual safety messages unchanged; 16 released-retired and 63 excluded IDs unchanged. Ledger statuses must explicitly distinguish active supplemental from active primary. No remaining reserve IDs from the listed 25.
- The 116 count is an ID inventory, not 116 simultaneously interchangeable primary messages. Show one selected supplemental line per eligible heavy-rain episode, not all three.

### Explicit exception to #432: additive only

1. Leave the engine tone map and thresholds unchanged: heavy_rain remains cautious. Its current localized safety message stays the primary text, first in visual and reading order, unchanged and always shown when valid. Place the selected ark line beneath it as secondary text within the same card, visually subordinate. No new mascot, CTA, navigation or redesign.
2. Attach supplemental content through a distinct optional presentation field, not by replacing primary comment.id/text, changing voiceLevel to sarcastic, or concatenating text into the safety message. Update JSDoc and validators for this distinction.
3. Only actual heavy_rain + cautious + valid localized safety presentation can receive a supplement. Missing primary safety text, unsupported locale, invalid/mismatched tone, serious/extreme_wind, strong_wind or cold_wet must never display it. Missing/malformed supplement leaves valid primary caution text visible. Failure of supplemental selection/history must not suppress the warning.
4. Keep supplemental content in a separate small bilingual content source/registry. Do not loosen the main joke-library condition/tone validator, main selector or KNOWN_IDS to accept sarcastic heavy_rain. Do not put the three lines in weatherSafetyMessages or falsely label them cautious. Validate ID uniqueness against primary, safety and retired IDs.
5. Retain seven-day cooldown and least-recently-shown fallback for the three-line supplemental pool, selected once per stable episode, with deterministic tie-break/invalid RNG behavior. Use separate supplemental history storage/ID validation (new namespaced key), leaving existing joke-history contract and primary safety bypass intact. Prefer reuse of pure rotation/storage helpers if practical without altering existing semantics. No history writes on selection. Record supplement exposure only when the secondary line itself is observed visible with the current episode; the existing whole-card 50% observer alone is not proof the lower line was seen. Keep stale-callback, hidden-document, rerender and StrictMode protections. Any necessary helper extraction must retain regression coverage.
6. Primary weather_voice_viewed remains exactly one safety impression for heavy_rain, with primary safety voice_id and cautious voice_level. If measuring the new secondary line, use a distinct weather_voice_supplement_viewed event on its actual exposure with bounded supplement_id, parent_voice_id, language, weather_type and surface. No duplicate primary event, no free text/PII and no live GA4 test traffic. Document the separate semantics.
7. The entire cautious episode remains NOT shareable, including its secondary joke. Do not generate standalone ark-joke pages/images or add them to the manifest. Enforce absence in snapshot/dialog/image/Facebook/catalogue paths; supplemental content must never accidentally authorize a primary sarcastic snapshot.

This is a specifically owner-authorized exception to the earlier 'no personality on cautious conditions' rule: secondary jokes may accompany heavy_rain caution text only. It does not authorize other cautious/serious jokes, removal of warnings or broader hazard/classification changes. Update Bible and scope docs to state the exception accurately instead of claiming #432 remained entirely unchanged.

### Artifact and count reconciliation

113 primary IDs produce 226 share pairs. Three supplemental IDs produce zero share pairs. Preserve all 108 pre-ticket released files byte-for-byte, including two newly retired IDs. Final expected new primary share files vs pre-ticket baseline: 102 new IDs x 2 languages x 2 files = 408 (22 retained share pairs plus 204 new pairs). Current 91-entry output has 320 new files; the 22 restored primary IDs add 88. Never delete/overwrite existing artifacts or bump versions. Generate manifest via existing exporter; byte mismatch remains a STOP. Report actual sizes/build delta.

### Tests and documentation

Carry forward v1's exact source/ledger parity, test-only fixture, rotation, manifest, immutable-artifact, bundle-leak and browser requirements, adjusted to the final primary/supplemental/status counts. Previously reserved text is now authorized content and must not remain on a production-leak denylist. Excluded/retired constraints stay; supplemental text is expected in the app bundle but never in share exports. Owner acceptance supersedes heuristic editorial rejection; adjust guard expectations/explicit exceptions to preserve approved text, not silently rewrite it.

Add targeted real hook/card tests in IS/EN for all three ark IDs with primary warning unchanged; precedence to extreme_wind; missing safety/supplement/lang; separate cooldown/history; visible-only supplemental exposure; stale callbacks/site/date/locale changes; no sharing and no duplicate primary analytics. Verify secondary line exposure separately from card exposure, including a small viewport where primary is visible and supplement is not yet visible. Verify malformed supplemental content cannot make the safety message disappear.

Browser evidence: heavy_rain with warning plus each ark line, both languages/mobile and desktop; warning-first hierarchy, full text, no share control. Serious and other cautious controls have no supplement. Recheck primary longest restored lines and share renderers without truncating approved wording. Run affected suites, lint/build and exporter/generated tests in correct order; broad runtime integration changes justify broader regression testing than the superseded docs-only v2.

Carry forward v2's accurate rain_04 quotation correction and historical-versus-current count cleanup, recalculated to this scope. Preserve all earlier reports/prompts as history; do not globally replace historical counts. Append a new report for the later execution.

### Jonesy review request / boundaries

Review the explicit dual-text contract, separation of selection/history/exposure, warning-preserving failure behavior, non-sharing and count reconciliation. Confirm whether helper reuse can stay bounded; propose concrete corrections rather than silently broadening this exception. No implementation until APPROVED and a new consolidated approved-prompt-v3.md is referenced by READY_FOR_CC. v1/v2 are historical and must not be executed now.

No scoring, normalization, threshold, entitlement/payment/backend, new libraries, TypeScript or import-extension changes; no new mascot or broader redesign, commit, push, deployment or issue closure. Existing CC report/result paths remain unchanged and append-only for history.

---

# Jonesy — Round 3 review (2026-10-03)

Reviewer: Jonesy (technical peer review). Read-only; nothing implemented, committed, pushed or deployed. Basis: `CURRENT.md` (fresh), this file through Ripley's Round 3, `approved-prompt-v2.md`, `issue-source.md`, and live source on the user's machine: `useWeatherVoice.js`, `WeatherVoiceCard.jsx`, `App.jsx` (call site), `weatherVoiceSelector.js`, `weatherVoiceSafety.js`, `weatherVoiceHistory.js`, `weatherVoiceSharePolicy.js`, `weatherVoiceShareSnapshot.js`, `weatherVoiceRules.js`, `weatherVoiceEngine.js`, `i18n/weatherVoice/safety.js`, `analytics.js`, the #420 ledger fixture. Owner statements ("Þessir textar mega allir vera virkir", "Auk varúðartextans (ráðlagt)") reach me only through Ripley's text; I did not see them directly, and I do not re-open them.

## 1. Disposition

**APPROVED, on condition that required additions R1–R12 below are folded into `approved-prompt-v3.md`.** The design is sound and fits the live code: the dual-text contract, the separate registry and history, the exposure rule and the non-sharing rule can all be built without touching the engine, the tone map, the safety text or the share policy. The additions are specification gaps, not design errors. R1 (failure isolation) and R5 (second observer) are the two a CC session would most likely get wrong. Ripley may prefer to show me the v3 draft before READY_FOR_CC; I am happy to re-check it quickly, but I do not require another round if R1–R12 are carried over as written.

## 2. Content and count reconciliation (verified)

Recomputed from the ledger fixture and `issue-source.md` (final lists derived mechanically, not assumed):

| Item | Round 3 | My check |
| --- | --- | --- |
| Reserves restored to primary | 22 named IDs | All 22 are `reserve` in the fixture today, with canonical text. Per condition: cold +9, rain +5, sun_wind +6, excellent +1, good +1. |
| Primary pools | good 23, excellent 22, rain 23, cold 23, sun_wind 22 = **113** | Matches (22+1, 21+1, 18+5, 14+9, 16+6). |
| Retained / new | 11 retained, **102 new** (80 + 22) | New per condition: good 20, excellent 20, rain 21, cold 21, sun_wind 20 = 102. |
| Supplemental | rain_heavy_24, 25, 29 | Exist in the fixture as `reserve` (issue text: "Is it time for the ark yet?", "The ark must be under construction.", "Where's Noah when you need him?"). |
| Ledger statuses (195 rows) | not stated | Expect: retained 11, new 102, **active_supplemental 3**, retired 16, **reserve 0**, excluded 63 = 195. |
| Share pairs | 226 | 113 × 2 = 226. |
| New share files vs pre-ticket baseline | 408 | 102 × 2 × 2 = 408 (320 today + 88). Total files in `public/share/tjaldur/v1`: 113 + 16 = 129 IDs × 4 = **516** (108 released + 408 new). |
| Retired / excluded | unchanged | **rain_heavy_26/27/28 stay excluded.** The issue calls them the canonical active ark jokes and calls 24/25/29 the reserve; the owner chose the opposite three. State this in v3 so CC does not "correct" it back. |

The ledger statuses and the count formulas should be spelled out in v3 as acceptance figures; the current text only gives the totals.

## 3. Required additions to the executable prompt

**R1 — Supplement failure must never reach the warning (safety-critical).** In `useWeatherVoice.js` the selection effect has no try/catch, so any throw inside it unmounts the card and the warning disappears. The supplement selection (registry read, history read, RNG, validation) must run inside its own `try/catch` and degrade to "no supplement". Tests, with the real hook and card: a throwing registry, a throwing `rng`, throwing `getItem` and `setItem`, and a malformed supplement entry (blank text, wrong language field, duplicate ID, collision with a joke, safety or retired ID). Each leaves the safety message visible and the primary `weather_voice_viewed` event unchanged. Also test an empty or absent registry (this is the rollback path: deleting the three rows must leave a warning-only card).

**R2 — Keep selection pure and RNG-free for the primary path.** Do not put supplement logic inside `selectWeatherVoicePresentation` or `selectWeatherSafetyPresentation`. Existing tests (`weatherVoiceRotation.test.js`, `weatherVoicePipeline.test.js`) deliberately pass an RNG that throws to prove safety selection never touches it. A new pure `selectWeatherVoiceSupplement({ engineResult, presentation, lang, library, history, now, rng })`, called from the hook only, keeps those proofs intact.

**R3 — Supplement is a separate hook output, not a field on `presentation`.** Ripley allowed "a distinct optional presentation field"; I recommend the hook return `{ presentation, supplement, onSupplementVisible, ... }` and the card take `supplement` and `onSupplementVisible` props. The selector's frozen output then stays exactly as it is, and `buildWeatherVoiceShareSnapshot`, `recordShown`, `weather_voice_viewed` and `shareSnapshot` never see it by construction. Wiring needs one `App.jsx` edit (the single `<WeatherVoiceCard …>` call site, lines 406–415). List it as an allowed file. If Ripley prefers the field-on-presentation form, the same tests must prove the snapshot, history and primary event ignore it.

**R4 — Eligibility is derived, not assumed.** The supplement exists only when all hold: `engineResult.condition === "heavy_rain"`, `engineResult.voiceLevel === "cautious"`, the primary presentation is `show:true` with `comment.id === "safety_heavy_rain"` and a non-empty localized text, and `lang` is `is` or `en`. Test the negatives: `extreme_wind` (windMax > 15 takes precedence over heavy rain in the engine), `strong_wind`, `cold_wet`, a heavy-rain result with the safety text missing for the language, and a forged presentation (sarcastic tone claimed for heavy_rain, a cautious tone with a different condition).

**R5 — Exposure needs its own observer node; the card observer proves nothing about the lower line.** Today `WeatherVoiceCard.jsx` has one `IntersectionObserver` on the card root at threshold 0.5. A second effect, with its own local `cancelled`/`notified`/`lastEligible` closure (the existing pattern), observes the supplement element and calls `onSupplementVisible(observedEpisodeKey, supplementId)`. Requirements: the effect depends on `episodeKey` and supplement ID so an episode change tears the observer down; `visibilitychange` handling is repeated; a late callback from a torn-down observer cannot notify; the hook rejects a mismatched episode key or supplement ID, mid-selection state, a non-cautious presentation, and a repeat for the same episode. Use a stricter eligibility ratio than 0.5 for this one-line node (I suggest 0.9; a half-visible line has not been read) and say so. The effect declaration order must keep the card observer first, so existing tests that use `FakeIntersectionObserver.instances[0]` still address the card observer; the supplement observer is `instances[1]` and exists only when a supplement is rendered. Test the small-viewport case in the hook with fake ratios: card eligible, supplement not eligible → primary event once, no supplement event, no supplement history write; later supplement eligible → one supplement event and one history write.

**R6 — History: a separate small module, not a parameterised change to `createWeatherVoiceHistory`.** `weatherVoiceHistory.js` is bound to `WEATHER_VOICE_KNOWN_IDS`, joke metadata and `voiceLevel === "sarcastic"`, so reuse means parameterising a module whose #406/#432 tests are strict. Bounded alternative: a new `weatherVoiceSupplementHistory.js` with its own key (for example `weather_voice_supplement_history_v1`), its own ID validation against the supplement registry, and its own guarded storage helpers (the repo already tolerates this: #406 added a deliberate third independent guarded-storage implementation). Leave `weatherVoiceHistory.js` byte-unchanged and say so; the mtime sweep will prove it. For rotation, the three pure helpers in `weatherVoiceSelector.js` (`pickUniform`, `pickLeastRecentlyShown`, `isAvailable`) are file-private. Either add `export` to them with no body change (my preference, one-word edits, selector tests unchanged and green), or duplicate about 25 lines. Do not extract a new shared rotation module in this ticket. Supplement entries carry `id` and `repeatCooldownDays: 7` so `isAvailable` works unchanged.

**R7 — Existing #432 assertions are narrowed, not deleted.** These live assertions become false as worded and must be rewritten precisely, not weakened: the ledger test "personality counts for cautious and serious conditions are zero" and the per-condition `count(...) === 0` loop; the pipeline test "cautious/serious draw only from the four safety messages … and never personality"; the hook test `useWeatherVoice.voiceLevel.test.jsx` (lines 103 and 123) that asserts `storage.setItem` is not called for cautious and serious episodes (keep it for the joke-history key; any supplement write goes to its own key and is asserted separately); and `content-validation.md` §1/§7 and Bible §13 sentences "Cautious and serious personality count stays at 0". New wording: zero cautious/serious entries in the primary library, registry, `KNOWN_IDS`, share catalogue and manifest; exactly three supplemental entries, all `heavy_rain`; primary safety selection still never reads supplements.

**R8 — Share and Facebook absence, by test and by search.** Reuse the entrypoint test pattern from #432 with a heavy_rain presentation that carries a supplement: `shareSnapshot === null`, no share button, `buildWeatherVoiceShareSnapshot` null, dialog returns null, `renderWeatherVoiceShareImage` throws before assets, `buildWeatherVoiceShareCatalogue` and the manifest hold no `rain_heavy_*` ID, Facebook resolver returns `not_shareable`/`unknown_entry`. After the exporter: no `rain_heavy_24/25/29` file under `public/share` or `dist/share`.

**R9 — Bundle search denylist, recalculated.** The previous reserve denylist is gone. New denylist: the 63 excluded IDs and their texts (including rain_heavy_26/27/28), `WEATHER_VOICE_LEDGER`, `weatherVoiceLedger`, `issueEn`, `enOverride`, and any `reserve` status string. Expected in the bundle: all 113 primary and 3 supplemental IDs and texts. Expected absent from share exports: the 3 supplemental IDs.

**R10 — Guards and ledger test updates, named.** `weatherVoiceContentGuards.test.js`: rain_heavy_29's EN "you" ("Where's Noah when you need him?") trips the second-person guard, because the guard's only exception is good_21. Decide in the prompt: supplemental rows are guarded by the same heuristics with a documented, test-asserted exception for rain_heavy_29 (generic "you"), or they are excluded from the guard set with an explicit note. My recommendation is the first, so a future edit cannot silently add direct address. The length maxima (59 IS / 50 EN) still hold for all 113 primary lines; I measured it. Rotation test pool sizes become 23/22/23/23/22. Ledger test: statuses, the 102/3/0 counts, and the retired and excluded sets as above. The v1 requirement to derive counts from the ledger rather than hard-code comments stays, and the F2 stale-label cleanup from my Round 1 result review is applied count-independently (do not write "113" into comments that will go stale again).

**R11 — JSDoc and docs.** `weatherVoiceTypes.js` needs a typedef for the supplement and its registry entry (the #432 F1 miss was exactly a skipped JSDoc requirement). Bible §13 and the share-pilot and production-validation addenda must describe the exception accurately: heavy_rain only, additive, never shared, separate history and event. Because several owner-accepted lines conflict with the Bible's own §2 (humour never at how the user dresses) and §3 test 5 (a line that could minimise real danger is excluded), the Bible addendum must say explicitly that the owner authorised these lines on 2026-10-03 as an override of those rules for those lines, and that the rules still apply to future text. Otherwise the Bible and the live library contradict each other with no record of why. `content-validation.md` records the residual limits in §4 below. GA documentation adds `weather_voice_supplement_viewed` (parameters `supplement_id`, `parent_voice_id`, `language`, `weather_type`, `surface`) and states that registering these as custom dimensions is a pending owner step; no live GA4 claim.

**R12 — Sequence the work in two checkpoints.** Part A: 22 primary activations, ledger, tests, docs, export (226 pairs, 408 new files), bundle search, suite. Part B: the supplement feature. CC reports Part A as complete and green before starting Part B. Reason: Part B touches the hook, the card and `App.jsx`, all of which carry #432 safety guarantees; if B has a problem, A is still shippable. Separate report sections, so my result review can be split too.

## 4. Challenges and residual limits (not blockers; to be recorded, not re-asked)

1. **A joke under a caution can undercut the caution.** That was the rationale for the #432 policy. Ripley's contract mitigates it well (warning first, unchanged, subordinate type, heavy_rain only, never shared). I approve it as an explicit owner exception. If a real flood or landslide event coincides with a heavy-rain forecast, the ark lines will read as tone-deaf; the rollback is deleting three registry rows, and R1's empty-registry test proves that leaves a clean warning-only card.
2. **Co-occurring hazards are not named in the card.** The engine gives heavy_rain priority over strong_wind, so a day with rain ≥ 12 mm and wind in the 10–15 m/s range shows only the rain warning, and with this change a joke under it. The same applies to freezing temperatures. This is an existing #432 limit, but the supplement makes it more visible. **Recommended, optional:** suppress the supplement when `todayRow.windMax > WIND_STRONG_MS` (import the existing constant from `weatherVoiceRules.js`; do not hard-code 10). It is a conservative narrowing, available in the hook, and reduces jokes only on mixed-hazard days. Ripley or the owner decides; if declined, record the limit in the docs.
3. **A three-line, one-concept pool.** All three supplemental lines are the ark/Noah joke, which is the "too many Noah/ark concepts" the issue warned about for the active pool. With a 7-day cooldown and least-recently-shown fallback, a user with three or more heavy-rain days in a week sees repeats. Acceptable and consistent with the owner's choice; just note it.
4. **Accepted editorial overlap and factual-claim limits among the 22 restored lines.** These were my Round 1 HOLD/RESERVE items. The owner has authorised them, so I record the facts only: excellent_19 has the same token set as excellent_01 in IS and EN (two near-identical lines in one 22-line pool); rain_13 and excellent_17 pair ("Very Icelandic" / "This isn't very Icelandic"); cold_05, cold_06 and cold_24 are one denial-plus-clothing idea, and cold has no lower temperature bound, so they can appear on snow days (Bible §2 and §3 test 5); cold_04 and cold_11 frame cold as pleasant; cold_17 implies morning; sun_wind_06 and sun_wind_21 claim wind direction, which the engine does not have; rain_10 ("as always") and rain_15 ("now") claim habit or change from a daily row; sun_wind_22 and good_12 as previously noted. None of the guard heuristics flags them, and the guards must not be loosened to "explain" them.
5. **Starting point is an uncommitted tree.** The verified 91-entry implementation (and 320 untracked share files) is not committed. v3 builds on it. Without a baseline commit, `git diff` cannot separate the reviewed 91-entry state from v3's changes, and the exporter's "never overwrite" check has no committed reference for the 320 new files. Róbert's call; I recommend committing the 91-entry state as a baseline before CC starts, or accepting that my sweep will rely on mtimes (everything older than the v3 start time is the baseline).
6. **Process:** v1 and v2 are historical. The result-review's Round 1 PASS stands for the 91-entry state only; the F1–F3 label fixes carry into v3 recalculated, not as v2's 91-count edits. The CURRENT.md text already says this correctly.

## 5. What I would check at result review

The Part A and Part B reconciliations above (ledger by status and ID, runtime lists, registry, manifest, share files 516 on disk with the 108 released unchanged, no `rain_heavy_*` share artifact); `weatherVoiceHistory.js`, the engine, rules, safety text and share policy unchanged by mtime and content; selector changes limited to `export` keywords if R6's option is chosen; every R1/R4/R5/R8 test read in full; the browser evidence matrix (heavy_rain with each ark line, IS and EN, mobile and desktop; serious and other cautious controls without a supplement; no share control; no GA requests); and an independent bundle search.

## 6. State

CURRENT stays PROMPT_REVIEW. No executable prompt exists until Ripley issues `approved-prompt-v3.md` and CURRENT moves to READY_FOR_CC. No commit, push, deployment or GitHub closure performed.
