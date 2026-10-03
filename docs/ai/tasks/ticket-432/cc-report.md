# #432 — CC report (approved-prompt-v1.md)

Written for: the Ripley/Jonesy review pass and the owner. Working tree at start: clean except the ticket-432 workflow files. CURRENT.md moved READY_FOR_CC → CC_IN_PROGRESS before any edit. No commit, push, deployment, GitHub closure, or GA4 change was performed.

## 1. Read-only audit (before any edit)

**Homepage UI entrypoint.** `src/App.jsx` calls `useWeatherVoice(...)` (line ~267, `enabled: !showCampsitesGate && page === "home"`) and renders `WeatherVoiceCard` (line ~406) directly below the primary verdict and above the Northern Lights module. No other Weather Voice mount point exists.

**Data flow (before this ticket).**
`useForecast` (`daily` only, no hourly required) → `rowsWithDay` → `findTodayRow(rows, todayDate)` (Atlantic/Reykjavik date) → `evaluateWeatherVoice({tmax, windMax, rain, code})` → `buildWeatherVoiceEpisodeKey` → `selectWeatherVoiceComment(getWeatherVoiceLibrary(lang), history)` → presentation → `WeatherVoiceCard` (mood asset, text, optional share button) → `onVisible` (IntersectionObserver ≥ 0.5 ratio) → `historyRef.recordShown` + `trackEvent("weather_voice_viewed")`. Share path: `buildWeatherVoiceShareSnapshot` → `WeatherVoiceShareDialog` → `renderWeatherVoiceShareImage` (in-app canvas) or `resolveWeatherVoiceFacebookShare` (manifest lookup).

**Static export path.** `scripts/exportWeatherVoiceShare.mjs` (Playwright against the Vite dev server) → `buildWeatherVoiceShareCatalogue()` → `renderWeatherVoiceOgImage` (in-browser) and `buildWeatherVoiceShareHtml` → two-phase byte comparison against `public/share/tjaldur/v1/` → writes `src/lib/weatherVoiceShareManifest.generated.js`.

**Direct generator bypasses found.** (a) The export script renders PNGs straight from catalogue entries, not from snapshots. Fixed by making the catalogue itself sarcastic-only. (b) `renderWeatherVoiceOgImage` has no tone check of its own. It is called only from the export script, which only receives catalogue entries, so this is contained. (c) The Facebook resolver's manifest lookup had no tone check. Fixed (see §2).

**Legacy inventory.** `public/share/tjaldur/v1/`: 54 HTML + 54 PNG tracked in git (108 files). Retired: 14 IDs × 2 languages = 28 HTML + 28 PNG. Retained: 13 × 2 = 26 HTML + 26 PNG.

**Test surface.** Fixture churn was concentrated in: `weatherVoiceEngine.test.js` (exact-match expectations), `weatherVoiceContent.test.js` (27/54 counts, nine-condition coverage), `weatherVoiceSelector.test.js` and `weatherVoiceHistory.test.js` (fixtures without a tone), `weatherVoiceSharePolicy.test.js` and `weatherVoiceShareSnapshot.test.js` (the retired #410 "every condition shareable" rule), `weatherVoiceFacebookShare.test.js` and `WeatherVoiceShareDialog.test.jsx` (snapshot fixtures and exact analytics payloads), `useWeatherVoice.shareSnapshot.test.js` and `useWeatherVoice.analytics.test.jsx`.

**Baseline before edits.** 23 Weather Voice files, 499 tests passing.

## 2. Changes

**Tone contract (`src/lib/weatherVoiceRules.js`).** New exhaustive `CONDITION_VOICE_LEVELS` table: `extreme_wind` → serious; `heavy_rain`, `strong_wind`, `cold_wet` → cautious; `cold`, `rain`, `sun_wind`, `excellent`, `good` → sarcastic. `voiceLevelForCondition()` returns `null` for anything unknown. No severity, mood, asset, locale, or text is consulted.

**Engine (`src/lib/weatherVoiceEngine.js`).** Each active result gains `voiceLevel`, derived from the condition alone. Priority order, thresholds, invalid-input behavior, and `{show:false}` are unchanged. The only removed line is the `active()` return, which now also includes the tone.

**Joke library (`src/i18n/weatherVoice/is.js`, `en.js`, `src/lib/weatherVoiceContent.js`).** Removed the 14 cautious/serious-condition jokes from both language lists and from the metadata registry. The 13 remaining entries keep their exact IDs and text, and each carries `voiceLevel: "sarcastic"`. `RETIRED_JOKE_IDS` is a module-level reserved set. `getWeatherVoiceLibrary()` drops any entry whose tone does not match policy. The validator rejects retired IDs, non-sarcastic joke tone, and policy mismatch, and checks cross-language tone parity.

**Safety library (`src/i18n/weatherVoice/safety.js`, new).** Four entries with `message_id`, `condition`, `voice_level`, `text_is`, `text_en`. IDs: `safety_extreme_wind` (serious), `safety_strong_wind`, `safety_heavy_rain`, `safety_cold_wet` (cautious). Copy was copied verbatim from the approved prompt. `ctaType` is `null` for every entry.

**Safety selection (`src/lib/weatherVoiceSafety.js`, new).** `selectWeatherSafetyPresentation()` is pure and deterministic: no RNG, cooldown, history, or clock. Among usable messages it picks the lowest `message_id`. Every failure returns `{show:false}`: unsupported locale, empty or non-array pool, blank language text, wrong level, wrong or missing condition, out-of-range severity, a legacy or injected result with no `voiceLevel`, or a sarcastic tone claimed for a cautious condition. `validateWeatherSafetyMessages()` checks ID shape, collisions with active and retired IDs, policy, text, and `ctaType: null`.

**Selector (`src/lib/weatherVoiceSelector.js`).** `selectWeatherVoiceComment()` accepts only an explicit, policy-consistent sarcastic result, and only sarcastic entries are eligible. Cautious and serious results return silence here. New dispatcher `selectWeatherVoicePresentation()` routes sarcastic results to the joke pool (cooldown and history unchanged) and cautious or serious results to the safety selector.

**History (`src/lib/weatherVoiceHistory.js`).** `isValidActivePresentation` additionally requires `voiceLevel === "sarcastic"` on both the presentation and the registry metadata. Persisted retired IDs are discarded by the existing known-ID hydration filter, so no storage migration is needed.

**Hook (`src/hooks/useWeatherVoice.js`).** Selection goes through the dispatcher. `onVisible` calls `historyRef.recordShown` only for sarcastic presentations. The `weather_voice_viewed` payload gains `voice_level`. Dedupe, exposure gating, and the episode lifecycle are unchanged. `episodeKey` is intentionally unchanged, because the voice level is a function of the condition that is already in the key, so adding it would only add lifecycle churn.

**Share policy (`src/lib/weatherVoiceSharePolicy.js`).** Allowlist: eligible only if `voiceLevel === "sarcastic"` and the condition's policy tone is also sarcastic. Missing, unknown, non-string, or mismatched tone is refused. Helpers: `evaluateWeatherVoiceShareEligibility` (presentation), `evaluateWeatherVoiceSnapshotEligibility` (snapshot, language included), and `evaluateWeatherVoiceToneEligibility` (tone only).

**Share entrypoints, each re-checking on its own.**
- Snapshot builder: returns null for non-sarcastic episodes. The snapshot carries `voiceLevel`.
- Dialog (`WeatherVoiceShareDialog.jsx`): renders nothing for a non-shareable snapshot. The check is placed after all hooks, so hook order is unchanged.
- Image renderer (`weatherVoiceShareImage.js`): rejects before loading assets or touching canvas.
- Catalogue (`weatherVoiceShareCatalogue.js`): sarcastic entries only, so the active catalogue is 26.
- Facebook resolver (`weatherVoiceFacebookShare.js`): tone check first, returning `not_shareable`. The manifest lookup is then unchanged, including `unknown_entry` for unsupported language and `mismatch` for drifted text or mood.
- Card: no share button when the snapshot is null. Verified in the browser for all cautious and serious cells.

**Analytics.** `weather_voice_viewed`, `weather_voice_share_clicked`, and `tjaldur_facebook_share_clicked` each gain `voice_level` (see §6 for the Facebook decision). No other field changed. Safety IDs cannot reach a share event.

**Generated artifacts.** `npm run share:export` was run through the existing tooling (§4). `weatherVoiceShareManifest.generated.js` was regenerated by the generator, not hand-edited. It now has 26 entries.

**Docs.** `docs/weather-voice/character-and-voice-bible.md` gains a narrow §12 recording the implementation and the remaining limits. §§1–11 are unchanged. `docs/analytics/weather-voice-share-pilot.md` gains §10 for sarcastic-only sharing, and §4a is marked superseded for cautious and serious content. `docs/analytics/weather-voice-production-validation.md` gains §12 for the voice-level field and the `voice_id` change. Its historical sections stay as they were.

## 3. Tests

**New files.**
- `src/lib/weatherVoiceVoiceLevel.test.js` covers the exhaustive policy, the four-message safety copy, the validator and its collision rules, retired IDs, deterministic safety selection under a hostile RNG that throws and under cooldown and history that mark every ID as just shown, fail-closed pools and locales, legacy and injected inputs, the joke selector refusing cautious and serious results, the tone-only sharing check, the 26-entry catalogue, and existence of the 28+28 retired and 26 retained artifacts on disk.
- `src/hooks/useWeatherVoice.voiceLevel.test.jsx` uses the real hook and card. Cautious and serious exposure emits one `weather_voice_viewed` with `voice_level`, deduplicates, shows no share button, and never calls `storage.setItem`. The sarcastic control still records history.
- `src/components/WeatherVoiceVoiceLevelEntrypoints.test.jsx` checks that the image renderer, the Facebook resolver, and the dialog each refuse non-sarcastic snapshots independently of the builder.

**Updated for the new contract.** Engine, content, selector, history, share policy, snapshot, Facebook, dialog, card, analytics, and shareSnapshot tests. Counts moved from 27/54 to 13/26. The retired "every condition shareable" assertions were replaced with the #432 allowlist assertions, not weakened. The nine-condition coverage now asserts that sarcastic conditions have at least two jokes and cautious or serious conditions have none.

## 4. Exact commands and results

| Command | Result |
|---|---|
| Baseline: `npx vitest run src/lib/weatherVoice src/hooks/useWeatherVoice src/components/WeatherVoice src/App.weatherVoiceIntegration` | 23 files, 499 tests passed (before edits) |
| `npx vitest run` (full suite, after all edits) | **151 files, 2081 tests passed** (was 148 / 2046 before this ticket) |
| Weather Voice subset (after all edits) | 24 files, 518 tests passed |
| `npm run lint` | exit 0, no output |
| `npm run build` | exit 0, `built in 7.84s` (pre-existing chunk-size warning) |
| `npm run share:export` (dev server on :5173) | `Catalogue: 26 entries`. `Loaded existing manifest`. `Done. 0 pair(s) created, 26 pair(s) reused unchanged, 26 total.` No mismatch abort. |

**Dev server note.** Port 5173 was already in use by a running Vite instance. Before using it, I confirmed via HTTP that it serves the updated modules (`RETIRED_JOKE_IDS` and the catalogue `voiceLevel` filter are present). I did not start a second server.

**Export determinism.** All 26 retained pairs re-rendered byte-identically under the existing two-phase comparison. The exporter never reached its abort path, and no released file was rewritten.

## 5. Artifact-preservation evidence

`git status --short public/share` → **empty** (no modified or untracked files).
`git ls-files public/share | wc -l` → **108** (all released files still tracked).
`git ls-files --others --exclude-standard public/share | wc -l` → **0**.
Retired HTML pages on disk: 28. Retired PNGs on disk: 28. Enforced by a test that reads the filesystem.
Manifest diff (`git diff --stat src/lib/weatherVoiceShareManifest.generated.js`): 1 insertion (the regenerated timestamp line), 225 deletions (the 28 retired entries). Each removed entry is one of the 14 IDs × 2 languages.

**Scope evidence.** `git diff --stat` over the whole tree: 31 files changed, 497 insertions, 459 deletions. Removed lines in `weatherVoiceRules.js` and `weatherVoiceEngine.js`: the single `active()` return line. No threshold line was removed. `src/lib/scoring.js`, `src/lib/forecastNormalize.js`, `src/config/hazards.js`, `src/lib/weatherPresentation.js`, `src/hooks/useForecast.js`, and `public/share/**` have **zero** diff lines. (The CRLF warnings in git output are pre-existing working-copy line-ending notices on every touched file.)

## 6. Browser evidence

Script: `outputs/ticket-432-browser-evidence/verify-voice-level.cjs`. Run against the real Vite dev server (`WV_BASE_URL=http://localhost:5173`). `/api/campsites`, `/api/forecast` (with a daily-only payload, as `forecastNormalize.js` allows), and `/api/me` are stubbed deterministically. Today's row is the only one that drives the card. Each run pins `lang` and the light theme via `localStorage`.

**Matrix: 2 viewports × 2 languages × 5 scenarios = 20 runs.** Results are in `outputs/ticket-432-browser-evidence/results.json`. Each row has a screenshot.

| Scenario (today's row) | Expected | Observed IS and EN, desktop 1280 and mobile 390 |
|---|---|---|
| extreme_wind (windMax 17) | serious, `safety_extreme_wind`, `wrecked` | Text matches the approved copy. Event `voice_id=safety_extreme_wind`, `voice_level=serious`. No share button. |
| heavy_rain | cautious, `safety_heavy_rain`, `sad` | Matches. No share button. |
| strong_wind (windMax 12) | cautious, `safety_strong_wind`, `struggling` | Matches. No share button. |
| cold_wet | cautious, `safety_cold_wet`, `unimpressed` | Matches. No share button. |
| excellent (sarcastic control) | sarcastic, `excellent_0x`, `excellent` | IS and EN joke text. Share button present (1 button). |

In all 20 runs: no horizontal page overflow, the quote is inside the viewport, quote font size is 19px, and the mood asset matches the condition.

**Stale-dialog check (desktop 1280, IS).** Open the share dialog on the sarcastic episode (site A), then switch the site to B (heavy_rain, cautious) while the dialog is open. The picker is driven by DOM click dispatch, because the overlay blocks normal pointer clicks. Result: dialog open before (`true`), dialog open after (`false`), card now shows the cautious safety text with no share button, and there are two separate `weather_voice_viewed` events (`excellent_03` sarcastic, then `safety_heavy_rain` cautious). Screenshots: `stale-dialog-1-sarcastic-open.png` and `stale-dialog-2-after-cautious-transition.png`.

**GA4 checks.** Every run recorded `gaRequestCount: 0`. No request reached any Google Analytics or tag-manager domain.

**Visual review.** I opened the mobile EN serious card, the desktop IS cautious card, and the stale-dialog screenshot. The text wraps cleanly, and the cautious and serious mascots match their conditions. Residual tone concern, recorded and not fixed: the `wrecked` cartoon beside the English serious message reads as comedic (wide open mouth, squinted eyes). The card also keeps the "TJALDUR SEGIR" label and „…“ quotes around the serious warning, which frames it as a character's remark rather than a plain notice. Neither was changed, because the prompt says to report and not redesign.

**Limitations.** This is DEV-mode `console.log` capture and local stubs only. It is not live GA4 ingestion and not production evidence. Real forecast data was not used. The cautious and serious paths were exercised only with the fixtures listed above.

## 7. Deviations and decisions

1. **`voice_level` added to `tjaldur_facebook_share_clicked`.** The #417 payload was documented as exact (`mood`, `language`, `source`). The prompt asks for `voice_level` on "actual-share analytics", and a Facebook click is an actual share. I added it and updated the one exact-payload test. The #417 section of the pilot doc now reads differently, and §10 of the same doc records the change.
2. **Runtime naming.** The joke registry and the engine use camelCase (`voiceLevel`), following the bible's §9 mapping of snake_case to runtime fields. The safety library uses the snake_case field names the prompt specified (`message_id`, `voice_level`, `text_is`, `text_en`). The analytics payload uses `voice_level`.
3. **Facebook resolver tone check.** The resolver uses a tone-only helper, not the full snapshot policy, so an unsupported language still returns `unknown_entry` and keeps the existing contract. The full snapshot check still runs at the dialog and image entrypoints.
4. **`episodeKey` unchanged.** Voice level is determined by condition, which is already in the key. Adding it would only add lifecycle churn, as the prompt warned.
5. **Export script.** Only its header comment changed (54 → 26). The catalogue is the single gate, so the script's logic was not touched. The two-phase byte check was used as-is.
6. **Test fixture changes.** All were mechanical (adding a tone, updating counts) or replaced an obsolete #410 assertion with the #432 allowlist assertion. No assertion was weakened, and no coverage was deleted to get green.
7. **Dev server.** Reused the already-running Vite instance on :5173, after verifying it serves the updated modules (§4).

## 8. Residual limits (not resolved here)

- No official warning feed or hazard classifier exists. The tone table is content routing for nine conditions, not a safety determination.
- Cold can match snow or freezing-precipitation days and still uses the sarcastic tone. Documented, not changed.
- `windMax` is the normalized daily wind, not gusts.
- Absence of a serious or cautious message never certifies safe travel.
- Released public share pages for the 14 retired jokes remain reachable (`noindex, follow`). Their text is not retroactively corrected. Hosted files, CDN and Facebook caches, and published posts were not removed. Deleting or redirecting those URLs is a separate owner decision.
- GA4: the `voice_id` set changed (14 retired, 4 added). Historical data is not restated. Registering `voice_level` as a custom dimension is a pending owner step.
- The `wrecked` mascot and the "TJALDUR SEGIR" label beside serious text are a residual tone concern (see §6).

## 9. Status

Not committed, not pushed, not deployed. No GitHub closure. CURRENT.md set to CC_COMPLETE with this report's path. Result review: `docs/ai/tasks/ticket-432/result-review.md` (not created by CC).

---

# v2 — documentation-only correction (approved-prompt-v2.md)

Scope: Ripley's REVISE from the v1 final assessment (`result-review.md`, Round 1) required the JSDoc that approved-prompt-v1.md §1 asked for ("Update JSDoc, validators and fixtures") and that was not written. The v1 section above is unchanged. `CURRENT.md` moved READY_FOR_CC (v2) → CC_IN_PROGRESS before any edit.

## v2.1 Files changed (comments only)

- `src/lib/weatherVoiceTypes.js`
  - New typedef `WeatherVoiceVoiceLevel = "sarcastic" | "cautious" | "serious"`, documenting that tone is determined by condition alone, separate from severity and mood, and that safety presentations share the presentation contract but bypass joke history.
  - `WeatherVoiceActiveResult` gains a required `voiceLevel` property.
  - `WeatherVoiceCommentMetadata` and `WeatherVoiceCommentEntry` each gain a required `"sarcastic"` `voiceLevel`, matching the joke-only registry.
  - `WeatherVoiceActivePresentation` gains `voiceLevel`. Its `comment.id` note now covers safety `message_id`s.
  - `WeatherVoicePresentation` now describes both production paths: the joke selector, and the dispatcher `selectWeatherVoicePresentation()` routing to `selectWeatherSafetyPresentation()`.
- `src/lib/weatherVoiceShareSnapshot.js`
  - The `presentation` input type gains `voiceLevel` (via `import("./weatherVoiceTypes").WeatherVoiceVoiceLevel`).
  - The return type gains `voiceLevel: "sarcastic"`. The description states that a cautious, serious, missing, or mismatched tone returns `null`.

No other file changed in v2. `approved-prompt-v2.md` and `result-review.md` are not edited by CC.

## v2.2 Scope check

`git diff -U0` on the two files, filtered for non-comment lines, shows one code line: `voiceLevel: presentation.voiceLevel,` in `buildWeatherVoiceShareSnapshot`. That line is **v1's runtime change** (recorded in the v1 section above), not a v2 edit. The other additions are JSDoc lines and blank separator lines between new typedef blocks. v2 added no runtime, copy, asset, manifest, `public/share`, threshold, scoring, or test change.

## v2.3 Commands and results

| Command | Result |
|---|---|
| `npx vitest run src/lib/weatherVoiceTypes.test.js src/lib/weatherVoiceShareSnapshot.test.js` | 2 files, 23 tests passed |
| `npm run lint` | exit 0, no output |

Per approved-prompt-v2.md, the export, browser matrix, full suite, and build were not rerun for this JSDoc-only change. Their v1 results remain as recorded in the v1 section.

## v2.4 Prior results, attributed correctly

- Ripley's independent run, per the result review: 26 Weather Voice suites, 534 tests, all passing. Ripley ran this; CC did not.
- The full suite (151 files, 2081 tests), the build, `share:export` (26 pairs reused byte-identical), and the 20-run browser matrix with the stale-dialog check are **CC's v1 evidence**, not re-run here.
- The browser evidence `viewedEvents` lines print `{voice_id, language, severity, weather_type, surface}` without `voice_level`. They do not prove that `voice_level` is emitted. The exact-payload assertions in `src/hooks/useWeatherVoice.analytics.test.jsx` and `src/hooks/useWeatherVoice.voiceLevel.test.jsx` are what prove it.

## v2.5 Status

Not committed, not pushed, not deployed. No GitHub closure. CURRENT.md set to CC_COMPLETE with this report's path. Result review stays `docs/ai/tasks/ticket-432/result-review.md`.
