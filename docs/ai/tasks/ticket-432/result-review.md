# Ticket 432 — Result Review (Jonesy)

Reviewer: Jonesy (technical peer review). Read-only; nothing was implemented, committed, pushed or deployed.

## Round 1 verdict: PASS (with one minor documentation defect and three non-blocking notes)

Basis: approved-prompt-v1.md, cc-report.md, then every claimed file read in full or grepped against live source on the user's machine (not the report). mtime sweep done; scope-drift files unchanged.

## 1. Verified against live source (all match cc-report)

| Requirement | Evidence |
|---|---|
| One explicit, exhaustive policy source | `weatherVoiceRules.js`: frozen `CONDITION_VOICE_LEVELS`; extreme_wind=serious; heavy_rain/strong_wind/cold_wet=cautious; cold/rain/sun_wind/excellent/good=sarcastic. `voiceLevelForCondition` uses own-property lookup, returns `null` for unknown/non-string (test covers `__proto__`, `constructor`). Thresholds untouched. |
| Engine only adds `voiceLevel` | `weatherVoiceEngine.js`: `active()` gains `voiceLevel`; priority order, thresholds and validation identical to pre-ticket. |
| Separate safety library | `i18n/weatherVoice/safety.js`: 4 entries, IS/EN copy verbatim vs approved prompt. `weatherVoiceSafety.js`: requires safety tone AND policy match, lowest `message_id` wins, no RNG/clock/history, `ctaType:null`, fail-closed (blank text, bad lang, legacy result without level, sarcastic-claimed-for-cautious, bad severity/mood → `{show:false}`). Validator rejects ID collisions with active and retired jokes. |
| Joke selector cannot serve safety conditions | `weatherVoiceSelector.js`: sarcastic-only in `isActiveEngineResult` and `isEligible`; new `selectWeatherVoicePresentation` dispatcher; legacy/injected results without level → silence, never defaulted to sarcastic. |
| 14 jokes retired, IDs reserved | `RETIRED_JOKE_IDS` = exactly the 14 IDs; `is.js`/`en.js` hold 13 entries each; validator errors if a retired ID is active; `getWeatherVoiceLibrary` also drops tone-inconsistent entries. Stale "untouched" header comment in content.js is already fixed. |
| Safety never touches joke history | `useWeatherVoice.js`: `recordShown` only when `voiceLevel === "sarcastic"`; `weatherVoiceHistory.js` `isValidActivePresentation` additionally requires sarcastic on presentation and registry metadata. Hook test asserts `storage.setItem` not called for cautious/serious and called once for the sarcastic control. |
| Sarcastic-only sharing at every entrypoint | One allowlist in `weatherVoiceSharePolicy.js`; enforced at snapshot builder, `WeatherVoiceShareDialog.jsx` (returns null after all hooks — hook order intact), `renderWeatherVoiceShareImage` (throws before assets/canvas), `weatherVoiceShareCatalogue.js`, `weatherVoiceFacebookShare.js` (`not_shareable` before manifest lookup). Entrypoint test uses otherwise-valid snapshots that differ only in tone (cautious, serious, missing, mismatched). |
| Analytics | `voice_level` added to `weather_voice_viewed`, `weather_voice_share_clicked`, `tjaldur_facebook_share_clicked`. Traced each call site individually: viewed event still sits behind every existing guard (stale key, mid-selection, non-show, dedupe) and `recordedEpisodesRef.add` still precedes the call. Payload asserted exactly in hook test. |
| Released artifacts immutable | `public/share/tjaldur/v1`: 108 files listed (27 IDs x HTML+PNG x 2 languages); all 28 retired HTML + 28 PNG present; every mtime predates #432 work (latest 1790198154311 vs #432 edits ≥1791041959408). Manifest has 26 `lang|id` keys and zero retired/safety IDs. Exporter change is header comment only (mtime 1791041963353). |
| Scope drift | `scoring.js`, `forecastNormalize.js`, `hazards.js`, `weatherPresentation.js`, `useForecast.js`, `WeatherVoiceCard.jsx`, `weatherVoiceShareHtml.js`, `weatherVoiceOgImage.js`, `weatherVoiceShareUrl.js`, `weatherVoicePresentation.js`: mtimes unchanged. |
| Docs | Bible §12, share-pilot §10 (marks §4a superseded for cautious/serious), production-validation §12 (GA4 discontinuity, local-evidence-only, custom dimension pending owner) all present and consistent with code. |
| Browser evidence | `results.json`: 20 matrix runs + stale-dialog check; all 16 cautious/serious runs have `hasShareButton:false`, no buttons, correct IS/EN safety text, `horizontalOverflow:false`, `gaRequestCount:0`; 4 sarcastic controls show the share button. Stale dialog: open on sarcastic `excellent_03`, after transition to heavy_rain `dialogOpenAfter:false`, share button gone. Screenshots opened (mobile IS extreme_wind, desktop stale-dialog-2): text and layout as recorded. |

## 2. Findings

**F1 (minor, documentation-only, not reported by CC): required JSDoc update missing.** Approved prompt §1 says "Update JSDoc, validators and fixtures." `src/lib/weatherVoiceTypes.js` is unchanged (mtime 1789064331319) and contains zero occurrences of `voiceLevel`/`voice_level`. `WeatherVoiceActiveResult`, `WeatherVoiceCommentMetadata`, `WeatherVoiceCommentEntry` and `WeatherVoiceActivePresentation` therefore do not describe the new field, and there is no `WeatherVoiceVoiceLevel` typedef. The `buildWeatherVoiceShareSnapshot` JSDoc return type also omits `voiceLevel`. No runtime effect (validators and tests do cover the field), but it was an explicit requirement and the cc-report does not mention skipping it. Recommend a micro-fix by CC before Róbert commits; whether that warrants a formal REVISE round is Ripley's call.

**F2 (note): browser-evidence event strings omit `voice_level`.** The `viewedEvents` lines in `results.json` print `{voice_id, language, severity, weather_type, surface}` only. The field itself is proven by the unit test (exact payload equality), not by the browser run. Not a defect, but the browser evidence should not be cited as proof of `voice_level` emission.

**F3 (note, product decision, not a code defect): tone of the serious card.** CC flagged this itself and I agree: extreme_wind shows the wrecked/dizzy, tongue-out mascot under the label "TJALDUR SEGIR" next to hazard text. The prompt fixed mood as unchanged, so CC was correct not to alter it, but this is the most visible remaining tone mismatch. Suggest Ripley/Róbert decide on a follow-up ticket (mood or label for serious level).

**F4 (note): historic doc line.** `weather-voice-production-validation.md` line 131 still says no `voice_level` exists. It is the preserved #413/#412 audit text and §12 supersedes it, so acceptable; optionally add "(superseded by §12)".

## 3. Limits of this review

No shell on the user's machine: I did not run the full suite, lint, build or `share:export`. "151 files / 2081 tests, lint clean, build succeeds, 26 pairs byte-identical" are CC's figures. I verified the new tests by reading them and checked that every behaviour they assert exists in source; preservation of `public/share` was verified by directory listing and mtimes, not `git status`. Please run the suite and `git status --short public/share` before committing.

## 4. Verdict

PASS. All approved behavioural requirements are implemented and independently verified; F1 is a small documentation gap I recommend fixing before commit. No commit, push, deploy or GitHub closure performed. Canonical CLOSED/BLOCKED is Ripley's call.

---

## Ripley final assessment — Round 1 (2026-10-03)

**Verdict: REVISE — narrow JSDoc completion only.** Jonesy's behavioural PASS is supported by my source review and independent tests. F1 is nevertheless an explicit unmet v1 requirement (update JSDoc), so complete it before closing #432. No runtime defect is established by this assessment.

Read canonical workflow/CURRENT, approved v1, CC report and Jonesy's result review. Inspected safety selection/validation, share allowlist and snapshot, engine/selector/hook diffs and the missing shared typedefs. Runtime camelCase voiceLevel and analytics/library snake_case are consistent with the documented adaptation. No threshold/scoring change appears in the reviewed engine diff.

Independent validation: `node node_modules/vitest/vitest.mjs run src/lib/weatherVoice src/hooks/useWeatherVoice src/components/WeatherVoice src/App.weatherVoiceIntegration` passed **26 files / 534 tests**. Initial sandbox attempt could not load config because directory access was denied; the elevated retry passed. `git status --short public/share` returned no changes. Full-suite 2081 tests, lint/build, export byte-identical reuse and browser matrix remain attributed to CC; I did not independently rerun those. Jonesy's browser evidence qualification stands: event strings omit voice_level, while exact-payload tests establish it.

F1 verified: weatherVoiceTypes.js lacks voiceLevel in four shared contracts and has no tone typedef; snapshot JSDoc omits the new input/output field. Issued approved-prompt-v2.md for comments-only completion and targeted validation. CURRENT moves to READY_FOR_CC under the canonical final-assessment REVISE transition. Preserve v1 and all prior reports.

Accepted residual limits remain unchanged: old released URLs stay reachable, the serious mascot can read as comedic, and the condition policy is not comprehensive hazard detection. No commit, push, deployment or GitHub closure performed.

---

## Jonesy Round 2 — corrective v2 (JSDoc completion) — 2026-10-03

**Verdict: PASS.** F1 is closed. The correction is comment-only, accurate against the implemented runtime, and nothing else changed.

Read fresh: CURRENT.md (CC_COMPLETE), approved-prompt-v2.md, cc-report.md v2 section, then both modified files in full.

### Required correction vs. live source

| v2 requirement | Evidence |
|---|---|
| `WeatherVoiceVoiceLevel` typedef | `weatherVoiceTypes.js` l.54-63: `"sarcastic"\|"cautious"\|"serious"`; states tone is determined by condition via `voiceLevelForCondition`, separate from severity/mood/text/asset; sarcastic = joke pool with history; cautious/serious = deterministic safety library, no history, never shareable. Matches the code I verified in Round 1. |
| Required `voiceLevel` on `WeatherVoiceActiveResult` | l.70, typed with the shared typedef, "derived from `condition` alone". |
| Required `voiceLevel` on `WeatherVoiceActivePresentation` | l.130, shared typedef; says sarcastic comes from the joke pool, cautious/serious from the safety library, only sarcastic is history-recorded/shareable. `comment.id` note (l.132) covers safety `message_id`s. |
| `"sarcastic"` on `WeatherVoiceCommentMetadata` and `WeatherVoiceCommentEntry` | l.96 and l.112. Accurate: the registry is joke-only, `getWeatherVoiceLibrary` drops tone-inconsistent entries, and the validator rejects non-sarcastic entries. |
| Presentation-result description covers the dispatcher/safety path | `WeatherVoicePresentation` (l.136-145) lists both `selectWeatherVoiceComment` and `selectWeatherVoicePresentation` → `selectWeatherSafetyPresentation` (no RNG, cooldown or history). |
| Snapshot JSDoc | `weatherVoiceShareSnapshot.js` l.35 input gains `voiceLevel` via `import("./weatherVoiceTypes").WeatherVoiceVoiceLevel`; l.44 return gains `voiceLevel: "sarcastic"`; description (l.27-32) states cautious/serious/missing/mismatched tone returns `null`. Matches `evaluateWeatherVoiceShareEligibility` gating. |
| No TypeScript syntax | Confirmed: plain JSDoc only. |

### Scope and non-drift

- The only non-comment line in `weatherVoiceShareSnapshot.js` touched by the diff, `voiceLevel: presentation.voiceLevel` (l.73), is v1's runtime line I already verified in Round 1; the function body is otherwise identical to what I read then. CC states this explicitly in v2.2, and my read agrees.
- mtime sweep: only `weatherVoiceTypes.js` (1791043040658) and `weatherVoiceShareSnapshot.js` (1791043046437) are newer than the v1 report (1791042548671) across `src/lib`, `src/components`, `src/hooks`, `src/i18n/weatherVoice`, `scripts`, and the generated manifest. Engine, selector, safety, content, policy, history, hook, dialog, image, exporter and all tests are unchanged since v1. `public/share/tjaldur/v1` was not touched in v2 (re-listed the `is/` directory: mtimes identical to my Round 1 listing, all pre-#432; `en/` was not re-listed).
- `scripts/.tmp-export-lib-test` exists but is empty; harmless, not part of this ticket.

### Report accuracy

v2.4 attributes results correctly: Ripley's 26 suites / 534 tests are Ripley's; the full suite (151 files / 2081 tests), build, `share:export` and the 20-run browser matrix remain CC's v1 evidence and were not re-run, as v2 allowed. It also records my F2 qualification (browser event strings do not prove `voice_level`; the exact-payload hook tests do). F3 (serious mascot tone) and F4 were correctly left out of scope.

### Limits

No shell on the user's machine. CC's v2 results (2 suites / 23 tests, `npm run lint` exit 0) are CC's word; I did not run them. For comment-only edits the risk is low, but `weatherVoiceTypes.test.js` exists to guard this file's typedef declarations, so run it, plus lint, before committing.

### Disposition

All F1 conditions satisfied. No open blocking or required items. Accepted residuals unchanged (released URLs stay reachable; serious mascot can read as comedic; policy is not comprehensive hazard detection). No commit, push, deploy or GitHub closure performed; canonical CLOSED is Ripley's call.

---

## Ripley final assessment — Round 2 (2026-10-03)

**Verdict: PASS. #432 CLOSED locally.** F1 is resolved; no required correction remains.

Read the canonical workflow, CURRENT, approved-prompt-v2.md, CC's v2 report and Jonesy's Round 2 review. Independently inspected the live diff for weatherVoiceTypes.js and weatherVoiceShareSnapshot.js. The shared tone typedef, required engine/presentation fields, sarcastic-only joke metadata and snapshot input/output documentation accurately describe the runtime. Compared the snapshot body with the prior Round 1 read: its voiceLevel assignment is the already-reviewed v1 change; v2 is comment-only.

Independent v2 validation:
- `node node_modules/vitest/vitest.mjs run src/lib/weatherVoiceTypes.test.js src/lib/weatherVoiceShareSnapshot.test.js`: 2 suites / 23 tests passed.
- `npm run lint`: exit 0.
- `git status --short public/share`: no changes.

The prior independent 26-suite / 534-test Weather Voice run remains applicable to the unchanged runtime. Full-suite/build/export/browser results remain CC's v1 evidence, not newly rerun or independently claimed here. The browser analytics qualification and accepted legacy-URL, mascot-tone and hazard-classification limitations remain as recorded above.

CURRENT transitions RESULT_REVIEW -> CLOSED. No commit, push, deployment or GitHub issue closure performed.
