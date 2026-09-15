# #416 — Approved correction prompt v2

Jonesy APPROVED Round 2 on 2026-09-15. This is a narrow correction to the already-executed v1, not authorization to reimplement it. Preserve v1 and all review/report history.

## Workflow

Read docs/ai/README.md and CURRENT.md. Verify READY_FOR_CC references this file; set CC_IN_PROGRESS before editing. After correction and validation, append a v2 correction section to docs/ai/tasks/ticket-416/cc-report.md, preserve its existing contents, populate its path in CURRENT.md and set CC_COMPLETE. No commit, push, deployment or issue closure.

## Verified defect

The new aboutAuroraBody incorrectly promises tonight's assessment at the user's campsite. NorthernLightsCard passes the constant AURORA_CANDIDATE_LOCATION_IDS to useAuroraDecision, independent of the selected site. Reread that call and src/config/auroraCandidates.js read-only before editing. Do not change the feature to make the old claim true.

## Exact correction

Change only aboutAuroraBody in the EN/IS blocks of src/i18n/translations.common.js:

- EN: `We assess Northern Lights activity together with local weather conditions to evaluate tonight's viewing conditions at the places we check.`
- IS: `Við metum norðurljósavirkni ásamt staðbundnum veðurskilyrðum til að meta aðstæður til norðurljósaskoðunar í kvöld á þeim stöðum sem við skoðum.`

Keep the existing bilingual links and all other content unchanged. Do not add implementation details about the roster to user-facing copy.

## Regression tests and validation

Add targeted tests in src/pages/About.test.jsx using the actual assembled translations. Assert each exact corrected literal string renders in its language, with expected literals independent of the imported dictionary values. Also reject the former personalized phrases `at your campsite` and `á þínu tjaldsvæði` in the Aurora body. A negative-only check or comparing rendered content solely against the dictionary is insufficient.

Run:
- About.test.jsx
- App.northernLightsAnchor.test.jsx
- PricingInfo.auroraSection.test.jsx
- Pricing.auroraFeature.test.jsx
- npm run lint
- git diff --check

Refresh and inspect About IS/EN mobile browser screenshots to confirm the longer sentence wraps correctly without clipping. Retain correction-specific evidence paths without overwriting v1 evidence. No need to repeat the unchanged full pricing/browser matrix.

Append exact changed files, commands/results and screenshot paths to the CC report. Preserve the documented production-provenance limitation; do not claim production verification from local fixtures.

## Scope and STOP rules

Only this translation pair, targeted About regression tests and correction evidence/report/workflow updates are authorized. No changes to candidates, selected-site wiring, gating, scoring, requests, pages/layout, prices, checkout or attribution. Preserve all other completed v1 behavior and unrelated changes. If a wider change appears necessary, STOP and report the reason before expanding scope.
