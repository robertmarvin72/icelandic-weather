# #432 — Weather Voice safety tone — Approved prompt v1

Date: 2026-10-03. Author: Ripley. Jonesy APPROVED Round 2 in prompt-review.md.
Issue: https://github.com/robertmarvin72/icelandic-weather/issues/432

This is the consolidated execution prompt. It incorporates Round 2 replacements and Jonesy's final notes; superseded proposals in prompt-review.md are not execution instructions.

## Workflow and preflight

Read AGENTS.md, CLAUDE.md, docs/ai/README.md, docs/ai/CURRENT.md and docs/weather-voice/character-and-voice-bible.md in full. Verify CURRENT is READY_FOR_CC and points here, then set CC_IN_PROGRESS before implementation. Preserve unrelated work and all review history. #431 is CLOSED locally; its deployment/live GA4 verification remains unverified by this task.

Perform a read-only audit before editing: engine/rules/contracts, content/language validation, selector, history, hook episode lifecycle, renderer/accessibility, analytics, share policy/snapshot/dialog/image/Facebook/catalogue/export/generated manifest and actual callers. Record the existing homepage Weather Voice UI entrypoint and complete data flow. Inspect current source rather than relying on this prompt's description alone.

## Objective and scope

Add explicit voice_level (sarcastic/cautious/serious), separate from mood, severity, language and assets. Route serious and cautious text through a separate bilingual safety library, never through jokes. Preserve current weather scoring, normalization, condition priority, thresholds, mood/assets and recommendation behavior.

The engine currently strictly validates normalized tmax/windMax/rain/code and returns exactly {show:false} for invalid/unmatched inputs. extreme_wind uses windMax > 15; strong_wind > 10; heavy_rain requires liquid-family evidence plus RAIN_HEAVY_MM; cold_wet requires cold plus liquid evidence/amount. Preserve all existing boundaries and invalid-input behavior.

This is content routing for the existing nine conditions, not a comprehensive hazard classifier or official warning system. Document that cold can match snow/freezing precipitation/thunder days while retaining sarcastic tone, and windMax is normalized/time-weighted daily wind, not gusts or an official warning feed. Absence of serious text must never certify safe travel. No new input/threshold/hazard policy is authorized.

## 1. Explicit tone contract

Use one pure, exhaustive condition-to-voice_level policy:

| Condition | voice_level |
| --- | --- |
| extreme_wind | serious |
| heavy_rain | cautious |
| strong_wind | cautious |
| cold_wet | cautious |
| cold | sarcastic |
| rain | sarcastic |
| sun_wind | sarcastic |
| excellent | sarcastic |
| good | sarcastic |

Add voice_level to active engine outcomes and selected presentation contracts; keep condition/mood/severity unchanged. Update JSDoc, validators and fixtures. Do not infer tone from severity, mood, asset, locale or selected text. Missing, unknown, non-string, malformed or condition-mismatched tone fails closed, including legacy/injected selector inputs; never default to sarcastic. Silence is acceptable when no valid presentation exists.

## 2. Separate safety library and deterministic selection

Create weatherSafetyMessages with four entries containing message_id, condition, voice_level, text_is and text_en. Use globally unique ASCII IDs matching ^[A-Za-z0-9_]+$, distinct from every active or reserved joke ID. Each message has one shared ID across IS/EN, faithfully adapted to comment.id and analytics voice_id. Keep ctaType null; no new external link, CTA integration or safety upsell.

Use this approved copy:

- extreme_wind / serious:
  - IS: Mjög hvassviðri er í spánni. Aðstæður geta verið varasamar. Athugaðu opinberar veðurviðvaranir áður en þú leggur af stað.
  - EN: Very strong winds are forecast. Conditions may be hazardous. Check official weather warnings before setting out.
- strong_wind / cautious:
  - IS: Hvassviðri er í spánni. Skoðaðu aðstæður vel áður en þú ákveður næsta áfangastað.
  - EN: Strong winds are forecast. Check conditions carefully before choosing your next destination.
- heavy_rain / cautious:
  - IS: Mikil rigning er í spánni. Það gæti þurft að endurskoða planið.
  - EN: Heavy rain is forecast. You may need to reconsider your plans.
- cold_wet / cautious:
  - IS: Kalt og blautt er í spánni. Taktu mið af því þegar þú skipuleggur daginn.
  - EN: Cold and wet conditions are forecast. Take this into account when planning your day.

These describe forecasts, not a claim an official warning has been issued. Select the valid localized safety message deterministically by condition and voice level, independently of RNG, cooldown and joke history. Do not call joke-history recordShown for safety messages and do not add safety IDs to the joke registry/KNOWN_IDS. Repeated safety exposure or arbitrary history must not suppress valid safety text. Missing/empty/malformed/wrong-level/missing-language safety content or unsupported locale yields silence, never a personality fallback. Even matching mood/condition/severity cannot make a joke eligible for cautious/serious selection. Sarcastic selection/history behavior stays unchanged.

## 3. Retire conflicting jokes and reserve IDs

Verify and remove these 14 entries from the active metadata registry and both language lists:

- wind_extreme_01 through wind_extreme_05
- wind_strong_01 through wind_strong_03
- rain_heavy_01 through rain_heavy_03
- cold_wet_01 through cold_wet_03

Keep a single module-level reserved-ID constant; never reuse or repurpose these IDs. Remaining 13 personality entries (cold 3, rain 2, sun_wind 2, excellent 3, good 3) retain their exact IDs/text and become explicitly sarcastic. Audit the issue's cited high-wind/rain jokes as part of removal.

Active KNOWN_IDS, validators, catalogue and current manifest exclude retired IDs. Validate condition/voice-level consistency and collisions among active, reserved and safety IDs. Existing history hydration discards unknown persisted IDs; no storage migration. Safety content remains separate from joke history.

## 4. Lifecycle, rendering and analytics

Preserve stable episode selection, actual-exposure semantics and deduplication. Include voice_level in identity/dependencies where necessary; site/date/language/tone changes must not restore stale jokes or snapshots. Existing episodeKey already includes condition, so avoid unnecessary lifecycle churn. Locales share IDs but never mix text.

Keep existing mood assets, including wrecked for extreme_wind. Serious text is primary; supporting copy and accessible labels must not add a punchline. Inspect the mascot beside serious text and report residual tone concerns; do not redesign or create assets.

Add voice_level to relevant Weather Voice viewed and actual-share analytics, preserving baseline voice_id, language, severity, weather_type, surface and existing event semantics. Condition/mood may be bounded metadata where useful; no free text/PII. Safety impressions emit weather_voice_viewed only on real exposure under episode deduplication, independently of history. No viewed event merely on selection or for invisible/missing-message output.

Document GA4's active voice_id change: 14 joke IDs retired, 4 safety viewed IDs added. Historical GA4 data is unaffected. Safety IDs must never appear in successful share events.

## 5. Sharing and released artifacts

This ticket supersedes #410 universal sharing for BOTH cautious and serious content. Sharing requires an affirmative voice_level === "sarcastic" plus all existing validity/locale checks and condition-tone consistency. Do not implement merely a serious/cautious denylist. Missing/unknown/non-string/mismatched tone is ineligible.

Enforce policy at snapshot, dialog, image/export and catalogue entrypoints as well as the UI. No cautious image-sharing exception or safety static pages. Preserve valid sarcastic sharing. An open joke dialog followed by cautious/serious transition must not retain stale share eligibility. Audit direct generator bypasses and preserve Facebook manifest lookup's fail-closed unknown_entry/mismatch behavior.

Active catalogue and generated manifest contain 26 entries (13 jokes x 2 languages). Update existing generation tooling/contracts/tests; do not hand-edit the generated manifest independently of its generator.

All released public/share/tjaldur/v1 files are immutable. Do not delete, alter, overwrite, redirect, repurpose or version-bump them. Preserve retained active files AND the 28 retired language-specific HTML pages and their 28 PNGs byte-for-byte. Exclude retired entries from active generation/catalogue/manifest while retaining legacy files on disk. Distinguish active assertions from legacy preservation assertions.

The existing exporter needs a running dev server and Playwright; retained pairs must re-render byte-identically for reuse. If it aborts with a mismatch, STOP and report the exact conflict: no overwrite, manual generated-manifest edit or WEATHER_VOICE_SHARE_VERSION bump. Adapting current repo tooling to separate active and legacy artifacts is in scope and is not automatically a backend/hosting blocker.

Report plainly that old URLs remain publicly reachable (noindex, follow) and their text is not retroactively corrected. Do not claim hosted files, CDN/Facebook caches or published posts were removed. Deletion/redirect of published URLs is a separate owner decision, not an automatic action.

## 6. Tests and validation

Add targeted coverage, preserving existing behavior assertions:

- Exhaustive nine-condition policy, independent of mood/severity/locale; existing boundaries, priority, strict input validation and show:false behavior unchanged. Demonstrate unchanged weather scoring for identical inputs.
- Real engine -> selector -> hook/card for IS/EN and all three levels. Shared IDs, library parity, approved text, reserved/active/safety collision checks and safety ID regex.
- Empty/malformed/missing/wrong-level safety pools, missing language/unsupported locale and old/injected missing voice_level fail closed. Arbitrary cooldown/history/bad RNG cannot suppress valid safety content or select a joke. Safety never calls joke-history recordShown; sarcastic history still works.
- Site/date/locale/rerender transitions, real exposure, analytics voice_level, same-episode dedupe, stale history/snapshot/dialog protection after cautious and serious transitions.
- Policy/snapshot/dialog/image/export/catalogue direct entrypoints deny cautious/serious/unknown/missing/mismatched tone; valid sarcastic paths remain functional. Active catalogue/manifest parity is 26. All retired HTML/PNG files still exist and are inactive.
- Update bounded existing fixture churn (retired IDs, old 27/54 counts and missing tone in share/snapshot/card fixtures). Use remaining IDs or appropriate synthetic entries and explicit sarcastic metadata; do not weaken policy/assertions or delete coverage to pass.

Run affected engine/content/selector/history/hook/card/share/export suites, lint and production build. Run generation via existing tooling. Include git status/diff evidence showing no modifications under public/share/tjaldur/v1; existence tests alone do not prove unchanged bytes.

Browser-check mobile and desktop in IS and EN with deterministic fixtures for extreme_wind, all three cautious conditions and a sarcastic control. Verify long copy readability, secondary mood asset, no cautious/serious share entrypoint or supporting punchline, and stale-dialog handling. Inspect the actual hook parsing contract when stubbing. No live dangerous weather is needed. Record evidence and limitations honestly.

## Documentation, STOP conditions and handoff

Update voice bible/contracts/share-policy/analytics documentation narrowly for implemented mapping, retirement, #410 supersession and concrete input/legacy-public-file/mascot limitations. Preserve historical task reports. No new jokes for cautious/serious and no 100-text expansion.

No scoring, normalization, threshold, recommendation, entitlement, Free/Pro gating, payment or backend changes; no new libraries, TypeScript, explicit import extensions, assets or UI redesign. Stop with evidence and request an owner decision if the audit shows required work beyond this scope, or an actual unresolved immutable-artifact conflict. Do not silently expand scope.

No git commit, push, deployment, automated posting or GitHub issue closure.

Write docs/ai/tasks/ticket-432/cc-report.md covering changes, read-only audit/data flow/UI entrypoint, exact commands/results, browser evidence, artifact-preservation diff evidence, deviations and residual limits. Populate CURRENT's CC report path and set CC_COMPLETE only after writing the report. If blocked, follow canonical workflow and record the exact blocker rather than claiming completion. Result review path: docs/ai/tasks/ticket-432/result-review.md. This approved file becomes immutable once execution begins.
