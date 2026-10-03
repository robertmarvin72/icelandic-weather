# #432 — Weather Voice safety tone — Round 1

Date: 2026-10-03. Ripley. Discussion/review only, not executable.
Issue: https://github.com/robertmarvin72/icelandic-weather/issues/432

## Objective and preflight

Add explicit voice_level (sarcastic/cautious/serious), separate from mood, severity, locale and assets. Serious content must come only from a separate bilingual safety library and never fall back to personality jokes. No scoring/threshold change, asset expansion, redesign or 100-text library expansion.

#431 CLOSED/PASS locally; clean working tree at preflight. Its deployment/GA4 status remains unverified by this task. Read docs/weather-voice/character-and-voice-bible.md in full before implementation.

Current engine validates four normalized fields strictly and returns one of nine conditions in priority order. extreme_wind uses windMax > 15; strong_wind > 10; heavy_rain needs liquid-family evidence plus RAIN_HEAVY_MM; cold_wet needs cold plus liquid evidence/amount. These are expressive thresholds, NOT a validated comprehensive hazard classifier. Hook uses normalized inputs, not an official warning feed. Preserve this data flow and exact thresholds; never label the absence of a serious voice as proof travel is safe.

Current selector filters condition/mood/severity then applies cooldown/history and RNG; there is no tone field. Content metadata/language assembly is in weatherVoiceContent and i18n/weatherVoice. Hook records weather_voice_viewed only on actual exposure, freezes episode selection, and builds share snapshots. weatherVoiceSharePolicy currently allows every active supported-language presentation (owner's #410 override); #432 deliberately supersedes this for serious content. Public static catalogue/export/generated manifest and share URLs exist too: hiding the card's share button alone is insufficient to audit the full feature.

## Proposed explicit policy (for Jonesy review)

Use an exhaustively mapped condition -> voice_level policy independent of numeric severity/mood:
- extreme_wind -> serious.
- heavy_rain, strong_wind, cold_wet -> cautious.
- cold, rain, sun_wind, excellent, good -> sarcastic.

This is a conservative content-routing decision for the existing nine conditions, not a declaration of meteorological safety or complete danger detection. Do not introduce a new raw-wind/gust/warning classifier or infer a hazard from missing fields. Unknown/malformed classification fails closed (no personality text). Existing invalid/unmatched engine inputs remain show:false. If audit shows this scope cannot meet the requirement without broader hazard inputs/threshold changes, stop and present evidence for an owner decision rather than silently expanding it.

## Required design and implementation

1. Read-only audit first: engine/rules/types, library validation, selector, history, hook episode lifecycle, renderer, analytics, share policy/snapshot/dialog/image/catalogue/export/manifest and actual callers. Record UI entrypoint and data flow. Keep forecast normalization, condition priority, weather scores, hazards and recommendation decisions unchanged.
2. Add voice_level to active outcome and selected presentation contracts, driven by one pure explicit classification source. Keep condition/mood/severity unchanged. No UI derivation from mood, asset, locale or comment. Update JSDoc (no TS), validators and fixtures consistently. Missing/unknown/mismatched tone must not default to sarcastic, including legacy/injected selector input. Silence is acceptable.
3. Create a separate weatherSafetyMessages library with stable shared message_id, condition, voice_level and text_is/text_en. Start small: serious extreme_wind and cautious entries for the three mapped conditions, keeping level eligibility explicit. Adapt to the existing comment.id/text presentation contract without duplicating inconsistent IDs. Proposed copy:
   - extreme_wind (serious): IS "Mjög hvassviðri er í spánni. Aðstæður geta verið varasamar. Athugaðu opinberar veðurviðvaranir áður en þú leggur af stað." EN "Very strong winds are forecast. Conditions may be hazardous. Check official weather warnings before setting out."
   - strong_wind (cautious): IS "Hvassviðri er í spánni. Skoðaðu aðstæður vel áður en þú ákveður næsta áfangastað." EN "Strong winds are forecast. Check conditions carefully before choosing your next destination."
   - heavy_rain (cautious): IS "Mikil rigning er í spánni. Það gæti þurft að endurskoða planið." EN "Heavy rain is forecast. You may need to reconsider your plans."
   - cold_wet (cautious): IS "Kalt og blautt er í spánni. Taktu mið af því þegar þú skipuleggur daginn." EN "Cold and wet conditions are forecast. Take this into account when planning your day."
   These refer to the existing forecast context, not a claim an official warning has been issued. No new external-link/CTA integration required. Keep ctaType null for new safety messages; no safety upsell.
4. Enforce eligible library AND voice level at selection: serious never selects from personality, even if an entry has the same mood/condition/severity. Cautious never selects old sarcastic entries. Mark existing personality entries explicitly sarcastic and audit the issue's cited extreme_wind/heavy_rain/strong_wind lines. Preserve safe-condition IDs/text and selection behavior. Missing safety message/language, empty library, invalid metadata, cooldown exhaustion and RNG failure must never cross tone pools. Safety guidance must not disappear merely because its sole valid message is in cooldown; reuse within the allowed pool using existing deterministic fallback principles. If no valid message exists, return silence.
5. Preserve actual-exposure history/analytics rules and stable episode semantics; include voice_level in identity/dependencies where needed so a stale cached joke/share snapshot cannot survive a serious transition or old storage. Locale changes retain shared message IDs and never mix language. Keep the existing mood asset; serious text is primary with no joke/punchline added by supporting copy or accessible labels. No card redesign/new assets.
6. Sharing policy: serious presentations are ineligible for Tjaldur sharing/export. Cautious may remain eligible only with their actual approved cautious text; sarcastic sharing stays as before. Fail closed on missing/invalid tone. Enforce at snapshot/export entrypoints as well as UI; opening a share dialog before a tone transition must not allow stale inappropriate content to be shared as the new episode. Audit direct public share catalogue/URL generation so retired high-severity jokes are not newly exported as current eligible content. Do not change an existing joke ID's meaning to new safety text. Document already-deployed static links/assets and the distinction between local generation and removal from hosting/CDN. If proper handling requires backend/hosting changes, stop and report that dependency; do not claim existing public URLs were removed. Preserve unrelated safe share URLs and feature behavior.
7. Add voice_level to Weather Voice analytics where relevant (viewed and actual share events), preserving voice_id, language, severity, weather_type, surface and exposure deduplication. Include condition/mood where useful with bounded metadata, no free text/PII. No event for invisible or missing-message output. Do not rename baseline fields gratuitously or fabricate a viewed event on selection.
8. Update the voice bible/contracts/share-policy documentation narrowly to reflect the new implemented mapping, #410 exception and known input limitations. Preserve task history. No new jokes for serious/cautious conditions and no ~100-text expansion.

## Validation

- Exhaustive nine-condition mapping independent of mood/severity/locale; existing threshold boundaries/priority and invalid-input behavior unchanged. Demonstrate unchanged weather scoring for identical inputs.
- Real engine -> selector -> hook/card tests for IS/EN serious/cautious/sarcastic; shared IDs and content validation. Missing/malformed/empty serious pool, wrong-level injected entry, unsupported locale, exhausted cooldown and bad RNG cannot yield a joke. Test old/missing voice_level inputs conservatively.
- Lifecycle: rerender, site/date/language transition, stale selection/history, only genuine visible impression, analytics payload voice_level, same episode dedupe. Serious transition cannot retain prior joke or share eligibility.
- Share policy/snapshot/dialog/export/catalogue tests: serious denied, cautious faithful, safe unchanged, direct generator bypass prevented, old public artifact limitations explicitly reported. Follow existing export tooling; do not manually edit generated files independently of their source generator.
- Run affected engine/content/selector/history/hook/card/share/export suites, lint and build. Browser-check mobile/desktop in both languages with deterministic weather fixtures for extreme_wind and the cautious cases plus a safe control; verify long serious copy readable, mood secondary, no share entrypoint for serious and no inappropriate supporting text. No live dangerous-weather scenario needed.

## Scope / STOP / handoff

Read AGENTS.md, CLAUDE.md, docs/ai/README.md and CURRENT. This is a content safety-layer change only, not a comprehensive official alert system. No scoring/normalization/threshold/gating/payment/backend change, new libraries, TS, explicit import extensions, new assets or redesign. Stop for explicit owner approval if audit finds a required change outside this scope. No commit, push, deployment, automated post or GitHub closure.

Jonesy reviews this proposal at PROMPT_REVIEW. Following APPROVED Ripley creates approved-prompt-v1.md and READY_FOR_CC. CC verifies pointer, sets CC_IN_PROGRESS before implementation, writes docs/ai/tasks/ticket-432/cc-report.md with evidence, audit findings and limitations, populates CURRENT and sets CC_COMPLETE. Result review: docs/ai/tasks/ticket-432/result-review.md. Preserve prior histories.

---

## Jonesy review — Round 1 (2026-10-03)

**Verdict: REVISE.** The direction is right and the scope discipline (no threshold change, no classifier, no new assets, fail-closed) is good. But three design decisions that CC would otherwise have to invent are left open or contradict each other, and one STOP condition is mis-framed. All verified against live source, not the draft's narrative. None needs a scope expansion — they need explicit answers.

### What I verified (draft claims that hold)

- Engine (`weatherVoiceEngine.js`/`weatherVoiceRules.js`): nine conditions, priority order, thresholds (`windMax > 15` extreme, `> 10` strong, `RAIN_HEAVY_MM = HAZARDS_V1.rainWarn`, liquid-family evidence) and strict four-field validation all match the draft. `{show:false}` on invalid input confirmed.
- Selector (`weatherVoiceSelector.js`) has no tone field; it filters on condition/mood/severity only, then cooldown/RNG. `isActiveEngineResult` does not check any tone, so "legacy/injected input must not default to sarcastic" is a real new requirement, not already satisfied.
- Hook (`useWeatherVoice.js`): `onVisible` already gates history + `weather_voice_viewed` on exposure; `weather_voice_viewed` payload is `voice_id/language/severity/weather_type/surface`. Draft's analytics description is accurate.
- `weatherVoiceSharePolicy.js` is structural-only (active + is/en) — the #410 override. Snapshot builder routes through it, so a policy check there covers the snapshot entrypoint.
- Facebook path (`weatherVoiceFacebookShare.js`) is already fail-closed by manifest lookup (`unknown_entry` / `mismatch`), so a new-text message with no manifest entry cannot get a Facebook link. Useful defense-in-depth; worth stating.

### Required changes

**1. [P1] Contradiction: "mark existing personality entries sarcastic" vs. mapping extreme_wind/strong_wind/heavy_rain/cold_wet away from sarcastic.** There are 14 existing jokes in those four conditions (wind_extreme 01-05, wind_strong 01-03, rain_heavy 01-03, cold_wet 01-03). If they are marked `sarcastic` while their condition maps to serious/cautious, they become permanently ineligible but *still present*. That matters because `buildWeatherVoiceShareCatalogue()` is built from `getWeatherVoiceLibrary()` — the catalogue, manifest, generated export test and `WEATHER_VOICE_KNOWN_IDS`/completeness validators would keep treating them as current content, which is exactly what item 6 says must not happen ("retired high-severity jokes … not newly exported as current eligible content"). Also any validator that checks `voice_level == level(condition)` would fail on them. Decide explicitly, one of:
   - **(recommended)** Remove the 14 from the active registry and both language files (13 sarcastic entries remain: cold 3, rain 2, sun_wind 2, excellent 3, good 3). Reserve the 14 IDs permanently: never reuse, never repurpose (consistent with "do not change an existing joke ID's meaning"). Persisted history for removed IDs is already discarded by `history.js` (`isKnownId`), so no migration is needed. Catalogue shrinks to 13×2; manifest and generated test must be regenerated/updated through the existing export tooling.
   - Or keep them as explicitly `retired`/ineligible and make catalogue, KNOWN_IDS, completeness validators and manifest all exclude them. More code, more drift risk; I don't recommend it.

**2. [P1] Safety messages vs. history/cooldown — the draft is internally inconsistent.** `weatherVoiceHistory.js` `isValidActivePresentation` accepts only IDs in `WEATHER_VOICE_KNOWN_IDS` and checks condition/mood against the joke metadata registry. New safety message IDs outside that registry are silently *not recorded* (and not persisted). So item 5 ("preserve actual-exposure history") and item 4 ("must not disappear because its sole message is in cooldown … reuse using existing deterministic fallback") cannot both mean what they appear to mean. State the rule: **safety messages are not cooldown-gated and not written to joke history** (they are one message per condition/language; cooldown has no purpose and only adds a way to go silent). `weather_voice_viewed` still fires on genuine exposure, independent of history. If Ripley instead wants history to cover safety IDs, that is a history-validator change that must be listed and tested. I recommend the first.

**3. [P1] Cautious sharing: "may remain eligible" has no defined implementation path.** In-app image share works off the snapshot, so cautious text could share as an image. But the Facebook static page/manifest only exists for catalogue entries, and the catalogue is built from the joke library — the three cautious messages would get no static page, so Facebook correctly shows unavailable (`unknown_entry`). Making cautious Facebook-shareable means extending catalogue/export/manifest/PNG generation (6 new artifacts, Playwright-driven export). That is real scope. Decide explicitly:
   - **(recommended)** Cautious *and* serious are not share-eligible in this ticket (fail closed on every non-sarcastic level). Revisit as a follow-up if wanted.
   - Or cautious in-app image share only, Facebook explicitly unavailable, with tests for both.
   - Or full cautious static-share coverage (needs its own acceptance criteria and STOP rules).
   "May" is not an instruction CC can execute without guessing.

**4. [P2] The "backend/hosting dependency" STOP condition is mis-framed.** `public/share/tjaldur/v1/**` is checked into the repo (I confirmed wind_extreme_01-05, wind_strong_01-03, rain_heavy_01-03, cold_wet_01-03 in both `is/` and `en/`) and shipped by the normal build. Removing them is a repo change plus redeploy, not a backend/hosting change. The real constraint is #417's own policy: `exportWeatherVoiceShare.mjs` states released artifacts are immutable and are *never deleted* even when no longer in the catalogue, and posted Facebook links would 404. So: tell CC the default is **do not delete or alter existing v1 files; stop generating/manifesting them; document that the old URLs remain publicly reachable (they are `noindex, follow`)** and present the delete-or-redirect option as an owner decision in the report. Without that, CC may either delete released files or wrongly stop and report a "hosting dependency".

**5. [P2] Safety message IDs must match `^[A-Za-z0-9_]+$` and be globally unique.** `weatherVoiceShareUrl.js` `assertValid` throws on anything else, and history/analytics key on ID. Require ASCII-underscore IDs, no collision with any joke ID (including the 14 reserved ones), and one ID shared across is/en (as drafted).

### Notes (no change required, but record them)

- `episodeKey` already contains `condition`; since `voice_level` is a pure function of condition, adding it to the key is redundant but harmless. The real stale-content protection is that `shareSnapshot`/`WeatherVoiceCard` already compare `episodeKey`; keep that and test the serious-after-joke transition on the dialog, as drafted.
- The mascot for extreme_wind stays `wrecked` per "no new assets". Serious copy next to a comedic-looking mascot is a residual tone risk; CC must view it in the browser evidence and report it plainly rather than redesign. If it looks wrong, that is an owner decision (asset change), not an in-ticket fix.
- Known limitation to document explicitly: `cold` (tmax < 6) is sarcastic regardless of weather family, so snow, freezing precipitation or thunder on a cold day still gets a joke; `windMax` is time-weighted/daily, not gusts. Already in the "not a hazard classifier" framing — just make the docs list them.
- Proposed IS/EN safety copy reads fine and avoids claiming an official warning exists. No change requested.
- New `voice_id` values will appear in `weather_voice_viewed` and share events; note in the analytics doc that the GA4 `voice_id` set changes (14 retired, 4 added).

### Approval path

Resolve 1–3 with explicit choices, restate STOP #4 as above, add the ID rule (#5). No other changes needed; I do not expect a second REVISE for anything else. No `device_bash` this round; everything above is from reading live source and listing `public/share`.

— Jonesy

## Ripley revision — Round 2 (2026-10-03)

Discussion/review only. Accept Jonesy's five requested clarifications with the explicit choices below. These replace conflicting Round 1 requirements; all other mapping, copy, tests, boundaries and handoff requirements remain.

1. **Retire the 14 jokes from active content.** Remove wind_extreme_01–05, wind_strong_01–03, rain_heavy_01–03 and cold_wet_01–03 from the active metadata registry and both language lists. Verify exact IDs against source before editing. Keep a documented reserved-ID list; never reuse or repurpose them. The remaining 13 personality entries are explicitly sarcastic and retain their IDs/text. Active KNOWN_IDS, completeness validation, catalogue and current manifest must exclude retired entries. Persisted joke history can discard removed IDs through its existing known-ID validation; no storage migration. Validate the active library's condition/voice-level consistency.
2. **Safety text bypasses joke history and cooldown.** The four new messages live in weatherSafetyMessages, not the personality registry or joke-history known-ID set. Serious and cautious selection uses the condition's valid localized safety message deterministically, independent of RNG/history/cooldown. Do not call joke-history recordShown for safety messages. Actual visible safety exposure still emits weather_voice_viewed under existing episode deduplication. Missing/malformed/wrong-level/missing-language safety content yields silence, never a joke. Add tests proving arbitrary joke history and repeated safety exposure cannot suppress safety text or write safety IDs into joke history. Existing sarcastic history behavior remains unchanged.
3. **Only sarcastic content is share-eligible in #432.** Cautious AND serious are denied at policy, snapshot, dialog and export entrypoints. This deliberately replaces Round 1's cautious-sharing option and supersedes #410 universal sharing for both non-sarcastic levels. No cautious static-share pages or image-sharing exception in this ticket. Missing/unknown/mismatched tone fails closed. Preserve valid safe-content sharing and test an open joke-share dialog followed by cautious/serious transition. Catalogue/current manifest contain only the 13 active sarcastic entries in each language; use existing generation tooling and update its tests/contracts as needed, without adding safety content to the share catalogue.
4. **Preserve released v1 artifacts.** Do not delete, alter, overwrite, redirect or repurpose existing public/share/tjaldur/v1 files, including the 28 language-specific retired-joke pages and their images. They are released immutable artifacts under #417. Exclude them from current catalogue/manifest and future generation while keeping them as legacy files; distinguish active catalogue assertions from preserved historical artifacts in generated-export tests/tooling. This repository-level adaptation is explicitly in scope and is not by itself a hosting blocker. Report that old public URLs remain reachable and their text is not retroactively corrected by this change; do not claim CDN/Facebook caches or published content were removed. Present retirement/deletion/redirect of already-published URLs as a separate owner decision, not an automatic action. If tooling cannot preserve historical artifacts while excluding them from active generation, stop with the exact conflict before modifying released files.
5. **IDs:** new message_id values must be globally unique ASCII identifiers matching ^[A-Za-z0-9_]+$, distinct from all active AND reserved historical joke IDs. Use one shared ID across IS/EN and map it faithfully to comment.id/analytics voice_id. Validate collisions and shape. Analytics documentation must record 14 retired active joke IDs and 4 new viewed-message IDs; new safety IDs never appear in successful share events because they are ineligible.

### Additional documentation and verification

Document the existing input limits concretely: cold can match snow/freezing precipitation/thunder family days and still receives sarcastic tone under the preserved condition mapping; windMax is normalized/time-weighted daily wind, not raw gusts or official warnings. This ticket does not solve those broader hazard-detection gaps or certify safety. No new threshold/input policy is authorized.

Keep the wrecked asset for extreme_wind, inspect it beside the serious copy on mobile/desktop in both languages, and report any residual visual-tone concern. No new asset/redesign without owner direction.

Required tests include the revised active counts/ID parity, reserved IDs, filtered manifest/catalogue with retained immutable v1 artifacts, cautious/serious sharing denial including direct exporter calls, safety-history bypass, real exposure analytics and stale-dialog transitions. Historical task reports remain unchanged.

Jonesy: review this Round 2 with unchanged Round 1 requirements. CURRENT remains PROMPT_REVIEW; no execution prompt until APPROVED.

---

## Jonesy review — Round 2 (2026-10-03)

**Verdict: APPROVED.** All five Round 1 items are resolved with explicit, executable choices, and the replaced requirements no longer conflict with the rest of the draft. No further required clarifications.

### Checked against live source

- **Retired IDs are exact and complete.** `weatherVoiceContent.js` registry holds exactly the 14 named IDs (wind_extreme_01–05, wind_strong_01–03, rain_heavy_01–03, cold_wet_01–03); the remaining 13 are cold 3, rain 2, sun_wind 2, excellent 3, good 3, all mapped to conditions Round 2 keeps sarcastic. `is.js`/`en.js` each contain the same 14 (matching counts in the three source files).
- **"28 language-specific retired-joke pages" is correct:** `public/share/tjaldur/v1/{is,en}/` contains all 14 HTML+PNG pairs per language (14 × 2 = 28 pages, 28 images).
- **History needs no migration:** `weatherVoiceHistory.js` already discards persisted IDs not in `WEATHER_VOICE_KNOWN_IDS` on hydrate, and `recordShown` rejects unknown IDs — so shrinking KNOWN_IDS to 13 is safe and a safety presentation could not be written to joke history even by accident (still skip the call explicitly, as Round 2 says).
- **Catalogue/manifest/generated test follow the library:** catalogue is built from `getWeatherVoiceLibrary()`, and the generated test and manifest-parity assertions iterate the catalogue only. Removing the 14 from the library therefore shrinks catalogue and manifest to 26 (13 × 2) without any code path touching the retired files on disk. The exporter header confirms unreferenced released files are never deleted.
- **Facebook path stays fail-closed** (`unknown_entry` for any ID absent from the manifest), a second barrier behind the share-eligibility policy.

### Notes for CC (record in the approved prompt; none requires another round)

1. **Test churn is real but bounded.** In `src/` tests, retired IDs/counts appear in `weatherVoiceContent.test.js` (~30 references, 27/54 expectations), `weatherVoiceShareSnapshot.test.js`, and a count comment in `weatherVoiceShareCatalogue.test.js`. Update fixtures to remaining IDs or synthetic entries; do not weaken assertions or delete coverage. Presentations built without `voice_level` in existing share/snapshot/card fixtures will correctly become ineligible — give those fixtures an explicit `voice_level: "sarcastic"` rather than loosening the policy.
2. **Sharing eligibility must be an allowlist:** `voice_level === "sarcastic"` affirmatively, not a deny-list of serious/cautious. Missing, unknown or non-string tone must be ineligible.
3. **Manifest regeneration is the one practical risk.** The existing exporter needs a running dev server and Playwright, and its "reuse" path requires the 26 retained pairs to re-render byte-identically; any drift is reported as `mismatch` and the script aborts before writing. If that happens, follow Round 2 item 4 (stop with the exact conflict; do not bump `WEATHER_VOICE_SHARE_VERSION`, do not overwrite released files). Do not hand-edit the generated manifest independently of the generator.
4. **Preservation evidence for released v1 files:** besides a test that the 28 retired pages/images still exist and are absent from catalogue/manifest, include `git status`/diff evidence in the report showing no modifications under `public/share/tjaldur/v1`. A test cannot prove bytes unchanged without a baseline; the diff can.
5. **Reserved-ID list:** keep it in a single module-level constant with a test asserting no active joke ID and no safety `message_id` collides with it, and that all safety IDs match `^[A-Za-z0-9_]+$` (the share URL builder throws otherwise).
6. **Analytics documentation:** record the GA4 `voice_id` change (14 retired, 4 safety IDs added) and that safety IDs never appear in successful share events. Historical GA4 data for the retired IDs is unaffected.
7. Residual items already recorded and accepted: `wrecked` mascot beside serious copy (report, don't redesign); `cold` sarcastic on snow/freezing/thunder days; `windMax` is daily time-weighted wind, not gusts.

No `device_bash` this round; verification is from reading source, tests and the `public/share` listing.

— Jonesy
