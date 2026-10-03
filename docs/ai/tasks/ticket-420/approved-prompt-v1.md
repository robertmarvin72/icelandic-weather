# #420 — Expand Tjaldur personality library — Approved prompt v1

Date: 2026-10-03. Ripley. Jonesy Round 2 APPROVED.
Issue: https://github.com/robertmarvin72/icelandic-weather/issues/420
Canonical text reference: docs/ai/tasks/ticket-420/issue-source.md.

This consolidated prompt is executable only when referenced by CURRENT at READY_FOR_CC. Earlier proposals in prompt-review.md are review history, not alternative instructions.

## Workflow and audit

Read AGENTS.md, CLAUDE.md, docs/ai/README.md, CURRENT.md and the complete docs/weather-voice/character-and-voice-bible.md (including §12). Verify READY_FOR_CC points here; set CC_IN_PROGRESS before edits. Preserve unrelated changes and prior review/task history. #432 is CLOSED locally; no production deployment or live analytics verification is inferred.

Before writing runtime code, confirm the existing data flow read-only: engine/rules -> shared metadata plus language lists -> selector/safety dispatcher -> hook/exposure history -> homepage WeatherVoiceCard -> share snapshot/dialog/image/Facebook -> static catalogue/export/manifest. The homepage is the existing entrypoint; no new route or CTA. Capture baseline production bundle sizes before changes for comparison with the final build.

## Owner-approved scope and exact active ledger

Expand only the five sarcastic conditions. Preserve #432 mapping, thresholds, four safety messages and deterministic safety selection. The issue's 27-line baseline is stale: current runtime has 13 personality entries per language. There is no arbitrary 100-line quota.

Use the issue snapshot's CANONICAL LIBRARY text, not illustrative tone examples, verbatim for these IDs. Suffix ranges are inclusive and zero-padded:

| Prefix / condition | Active suffixes | Count per language |
| --- | --- | --- |
| good | 01–11, 13–23 | 22 |
| excellent | 01, 03–18, 20–23 | 21 |
| rain | 01–09, 12–14, 16–18, 20–23 | 19 |
| cold | 01, 03, 07, 10, 12, 14–16, 18–23 | 14 |
| sun_wind | 01–04, 07, 09–12, 14–20 | 16 |
| Total | | 92 |

The 11 retained IDs are good_01/02/03, excellent_01/03, rain_01/02, cold_01/03, sun_wind_01/02. Preserve their live IS/EN text. Three explicit owner-approved overrides to the issue's EN wording are:
- cold_01: `The sweater was right.`
- cold_03: `The coffee cools out of sympathy.`
- excellent_03: `All that's missing is the coffee.`

The other 81 active IDs are new. Owner explicitly confirmed sun_wind_04 IS `Bjart og blásið.` and good_16 IS `Þetta verður ekki mikið betra án þess að verða grunsamlegt.` unchanged, with their canonical EN. good_21 remains active: the issue explicitly interprets its 'you' as directed at the weather. Preserve the standalone-card ambiguity as a documented caveat, not an excuse to change it.

## Inactive and retired ledger

Owner approved these 21 NEVER-RELEASED editorial reserves, preserving original IS/EN text in documentation/test fixture only:
- cold_04, cold_05, cold_06, cold_08, cold_09, cold_11, cold_13, cold_17, cold_24.
- rain_10, rain_11, rain_15, rain_19.
- sun_wind_05, sun_wind_06, sun_wind_08, sun_wind_13, sun_wind_21, sun_wind_22.
- excellent_19; good_12.

No HOLD decision remains pending. Do not rewrite good_12 or shorten rain_10; those alternatives were not chosen.

Newly retired RELEASED IDs: cold_02 and excellent_02. Remove from active lists, metadata, KNOWN_IDS and current catalogue/manifest. Add to the single RETIRED_JOKE_IDS constant, permanently reserved, never repurposed.

Keep all 14 previously retired IDs: wind_extreme_01–05, wind_strong_01–03, rain_heavy_01–03, cold_wet_01–03. The issue's stale 'Keep existing' headings do not reactivate them. Update the constant's comment to include the two sarcastic-condition retirements.

Never-activated proposals excluded by unchanged #432 policy: cold_wet_04–23, wind_strong_04–23, rain_heavy_04–23 and rain_heavy_26–28. Keep documentation-only. Explicit issue reserves rain_heavy_24/25/29 also remain inactive. Do not add these unreleased IDs to the permanently retired released-ID constant. No new extreme_wind jokes. Cautious/serious personality counts are zero; count the four bilingual safety messages separately.

## Content architecture and validation ledger

Maintain shared per-ID metadata plus separate is.js/en.js lists, runtime voiceLevel camelCase, canonical engine condition/mood pairs, severity defaults 0–3, repeatCooldownDays 7 and ctaType null. No new runtime content schema, reserve pool or selector design. No silent wording changes, additions or further pruning.

Create one checked-in TEST-ONLY ledger fixture containing exact owner-approved text/statuses and editorial findings. No production module may import it. Use it in tests and to derive content-validation.md, not multiple hand-copied expected-text maps. Build it from the snapshot and decisions here, not from runtime output under test. Independently reconcile runtime raw lists/registry with it. Cover every canonical ID as retained/new/retired/reserve/excluded, plus separate safety counts.

Carry Jonesy's Round 1 NOTE caveats with their IDs in the fixture/report (25 active NOTE entries, 67 other accepted active entries). Include accepted near-overlap groups. Consult prompt-review.md for those editorial findings only; its superseded pending questions do not reopen decisions. Editorial readings such as waking implying morning are judgments, not facts proved by the engine.

Validate complete raw lists AND resolved libraries: one IS/EN counterpart per active ID, no missing/extra/duplicate IDs, no exact duplicate text within either language, ASCII ID shape, metadata parity, retired/safety collisions, and valid condition/mood/tone. Raw checks must catch orphan entries otherwise silently dropped during assembly. Semantic variety/natural EN review is documented judgment, not automated proof.

Add cheap test-only guards for emoji, second-person words with explicit good_21 exception, and narrowly defined imperatives where useful. Document heuristic limits and avoid rejecting legitimate metaphors. A regression length check may use approved maxima (IS 59 characters, EN 50, verify against fixture); it is not a new editorial cap or permission to trim text. Stop/report any newly discovered conflict with exact ID, issue and proposed resolution before altering approved text.

## Rotation, safety and analytics

Keep existing selector order, seven-day cooldown, uniform selection among available sorted IDs, least-recently-shown exhausted-pool fallback and lexical tie-break/invalid-RNG fallback. More lines do not guarantee no repeats. Preserve stable episode lifecycle and actual-exposure-only history/analytics. Existing KNOWN_IDS hydration discards newly retired IDs; no migration.

Cautious/serious selection remains deterministic, independent of joke RNG/history/cooldown, and never falls back to personality content. Unknown/missing/mismatched tone stays fail-closed. Preserve sarcastic-only sharing throughout every entrypoint. No changes to scoring, thresholds, normalized forecast input or condition priority.

Viewed/share event names, payloads, voice_level and deduplication remain unchanged. New IDs enter naturally; two old IDs cease active exposure. No test events to live GA4, no live ingestion claims. The condition policy does not certify safe travel; cold has no lower temperature bound and may match snow/freezing/thunder, and daily wind is not gust data.

## Share assets and immutability

Final active catalogue/manifest: 184 language/ID pairs = 22 reused plus 162 new. Each new pair requires an HTML and PNG file: 324 new files, estimated roughly 15 MB disclosed to owner. Report actual footprint. Generate through existing share:export tooling against a verified current local Vite server with Playwright; do not hand-edit the generated manifest.

Preserve ALL 108 pre-existing released files byte-for-byte, including newly retired cold_02/excellent_02 pairs. Final retired legacy inventory is 32 HTML + 32 PNG for 16 retired IDs; the other 44 old files serve retained-active pairs. Create only new unique v1 paths. Never delete, overwrite, redirect, repurpose or version-bump existing artifacts. Existing export's two-phase byte comparison is required; retained-file mismatch is a STOP with exact evidence, not permission to work around immutability.

Old public URLs, including 'Ekki segja neinum', stay reachable by design. Do not claim hosted files, CDN/Facebook caches or old posts were removed. Reserve/excluded never-released IDs must have no generated page/image and never appear in the active manifest.

## Tests, build and browser validation

Order: baseline build/size -> approved fixture -> content/metadata/retired set -> tests not requiring new artifacts -> exporter -> generated manifest/artifacts -> generated-export tests and final affected suites -> final build/size and preservation evidence -> browser checks/report. weatherVoiceShareExport.generated.test.js reads real files for every catalogue pair and MUST run after export. Do not chase missing-yet-to-be-generated assets as a runtime defect.

Update specific stale tests without weakening coverage:
- weatherVoiceVoiceLevel.test.js: old 13/26/14/28 counts become ledger-driven active counts, 16 retired IDs and 32 legacy pages/images.
- weatherVoiceContent.test.js: old full-text maps including two newly retired IDs, count assertions and stale 27/54 comments.
- weatherVoiceShareCatalogue.test.js: stale counts/comments.
- WeatherVoiceCard.test.jsx: replace excellent_02 fixture with a valid active ID.
- useWeatherVoice.voiceLevel.test.jsx: replace narrow /^excellent_0[1-3]$/ with real eligible active-ID membership, keeping behavioral assertions.

Required meaningful tests:
- Exact ledger-to-raw-lists/metadata/manifest parity and inactive absence, all final counts and text overrides.
- Real engine -> content -> selector for nine conditions and both languages; four safety messages unchanged, no personality output for non-sarcastic/invalid tone.
- Expanded real-pool rotation: all but one eligible ID recently exposed forces that remaining choice; expiry boundary, all-in-cooldown least-recent fallback, ties, persistence/rehydration and retired removal. Safety-history bypass unchanged. No probabilistic distribution assertions.
- Preserve hook/card real-exposure analytics, locale/site/date/rerender behavior and stale share-dialog protections.
- Generated manifest/HTML/PNG coverage for every active pair; no reserve/excluded IDs or files. Preserve legacy files. Record git status/diff evidence of zero modifications/deletions of pre-existing released files, not merely their existence.

Run affected Weather Voice content/selector/history/hooks/card/share/export suites, npm run lint and npm run build. After build, confirm no production import of the ledger and search built JS/CSS bundles for unreleased reserve IDs and distinctive inactive text (choose strings not substrings of active text), expecting zero. Do not misclassify intentionally retained released legacy HTML as leaked unreleased reserve content: report search scope explicitly. Check absent public/share paths for all never-released reserve/excluded IDs. Record comparable production bundle sizes before/after, including runtime manifest growth and language lists; static share output size is separate.

Browser-check deterministic fixtures for all five expanded conditions plus cautious/serious controls in IS/EN, mobile/desktop. Match hook response parsing when stubbing. Inspect actual cards, in-app share images and static OG images, especially good_16, sun_wind_07, sun_wind_10, rain_14, good_10. Verify readability/no clipping or overlap, correct text/mood, genuine visible impressions, appropriate share eligibility and stale-episode protections. Report exact IDs/screenshots if approved text exceeds layout; do not silently shorten or redesign.

## Documentation and handoff

Write docs/ai/tasks/ticket-420/content-validation.md: per-condition/language active/reserve/retired/excluded counts from fixture and independently from raw lists where applicable; safety counted separately; per-ID editorial findings/dispositions and NOTE caveats; exact-duplicate results; natural adaptation and semantic overlap review; immutable legacy URL limitations; actual asset and bundle sizes; commands/results and browser evidence. No required editorial decision is pending in this prompt; newly found conflicts still need reporting before editing.

Add a narrow #420 Bible record: newer no-user-commands rule supersedes historical imperative examples for new personality text; preserve history. Update docs/analytics/weather-voice-production-validation.md and weather-voice-share-pilot.md for two additional retired IDs and 81 new active IDs; no GA4 registration/production claims.

No new conditions, thresholds, scoring, normalization, safety policy/text, gating/payment/backend, libraries, TypeScript, explicit import extensions, mascot assets, UI redesign, runtime LLM or admin interface. Stop for necessary scope expansion, unapproved editorial changes or immutable export conflict. No commit, push, deployment, automated posting or GitHub closure.

Write docs/ai/tasks/ticket-420/cc-report.md with read-only audit, changes, exact commands/results, validation/artifact evidence, size delta, deviations and limitations. Populate CURRENT's report path and set CC_COMPLETE after the report. Result review: docs/ai/tasks/ticket-420/result-review.md. Preserve this prompt once execution begins.
