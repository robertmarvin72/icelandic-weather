# #425 — Homepage three-night Northern Lights — prompt draft

Issue: https://github.com/robertmarvin72/icelandic-weather/issues/425
Date: 2026-09-26
Role: Ripley. Discussion only; NOT executable or an active parallel task.

## Owner request and dependency

Owner selected #425 while Ripley's #423 final assessment was in progress. #423 shared three-night code exists in the uncommitted working tree, but final assessment is REVISE (see ticket-423/result-review.md). Await owner sequencing decision: finish #423 corrections first, or explicitly transfer them into #425 scope and cancel only the prior workflow iteration. Do not mark #423 complete or assume its defects are accepted. Preserve existing work/history. No production changes authorized by this draft.

## Read-only preflight

- App.jsx:423–433 mounts NorthernLightsCard in the stable #northern-lights anchor, with a sibling off-season fallback. This is the existing UI entrypoint to replace, not a second card to add.
- NorthernLightsLanding.jsx mounts NorthernLightsThreeNight; shared useAuroraThreeNight, auroraMultiNightPolicy and date/label helpers already exist from #423. Reuse these, not a new source/scorer/request path.
- No selected-date query parsing currently exists on the landing page. Add a validated date handoff on its existing /en/northern-lights route.
- Existing homepage callback is startCheckout with t/lang/entitlements/theme. Preserve existing feature gates and attribution. Three-night cold load can cause 18 upstream weather calls; do not mount both old and new data owners.
- Both IS and EN homepage use the same App surface. Landing remains English-only under the previous owner decision; the Icelandic homepage link must honestly identify the English detail page, unless owner explicitly expands language-route scope later.

## Proposed implementation scope (for the eventual reviewed prompt)

1. Generalize the shared NorthernLightsThreeNight UI with an explicit homepage/landing surface prop. Replace the old card at the existing homepage anchor, keeping the compact secondary position and season fallback. Reuse one hook/controller and policy; do not introduce homepage-only scoring, candidates, fetches or aggregation. Preserve five-point inclusive near ties, no false all-poor/winner, stale/unavailable and identical Free/Pro inputs. Keep shared fixes synchronized across surfaces.
2. Both homepage languages show up to three selectable dates with readable coarse outlook text, a truthful best/similar/unavailable summary and selected-night content. Reuse existing display gates for location details/rankings/map. Free receives no locked location data in visible/hidden DOM. Avoid duplicating large cards/maps or increasing homepage paywall dominance.
3. Add a real link to /en/northern-lights?date=YYYY-MM-DD for the currently selected evening, using the existing router. Landing validates exact ISO calendar date and membership in the current UTC three-night window; invalid/missing/out-of-range dates default to tonight. Read valid date on initial navigation and browser back/forward; do not reset user selections on unrelated rerenders. Preserve an unavailable selected date so its actual state is shown, rather than replacing it with the best night. Do not invent new routes. Keep midnight-window behavior from #423.
4. Reuse northern_lights_night_selected with a bounded source field: homepage or landing. Keep existing four params (selected_date, days_ahead, forecast_status, user_tier). Fire once per deliberate different-date selection, not initial URL hydration/default/rollover/back-forward restoration. New source metadata is analytics-only; do not use it to alter checkout attribution or entitlements. Shared viewed-event dedupe must not suppress actual first exposure on a different surface.
5. Keep all copy in existing EN/IS translation dictionaries and review actual Icelandic sentence/date grammar in the newly exposed homepage flow. Retain current canonical band distinctions and accessible button semantics.

## Required verification

- Real homepage wiring tests for IS and EN, same shared policy/results as landing for the same fixtures, one data owner/three requests, selection no extra fetch, season-off zero requests, #northern-lights anchor preserved.
- Router integration: select day 1/day 2 on each homepage language, follow details link, matching selected date and content on landing. Invalid date, impossible calendar date, out-of-window date, missing date, unavailable date and back/forward cases. Initial URL restoration emits no selection event.
- Free/Pro DOM gates, atomic date/ranking/map changes, no duplicate map; shared policy pending/tie/all-poor/freshness regressions.
- Analytics exact source+date metadata and no duplicates, unchanged checkout source/callback.
- 375px and desktop browser checks with real components and deterministic API fixtures, both languages/tiers, keyboard access, readable date/outlook text, no overflow. Keep reproducible evidence of handoff URL/selection.
- Targeted shared Aurora/homepage/router tests, lint changed files, production build. Report actual commands/results; live-provider validation is not implied by fixture tests.

## Boundaries and eventual workflow

No backend/provider/cron/parser/storage/scoring/candidate/price/entitlement changes, new libraries or TypeScript. No commit/push/deploy/issue closure. Inspect and preserve existing uncommitted #423 files; never reset them. Finalize dependency disposition before publishing an executable prompt. After scope is settled and Jonesy approves, create ticket-425/approved-prompt-v1.md and follow READY_FOR_CC → CC_IN_PROGRESS → CC_COMPLETE, with report and result-review paths under ticket-425.
