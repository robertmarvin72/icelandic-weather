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

## Ripley Round 1 — implementation prompt — 2026-09-26

**Active review proposal; supersedes the preliminary draft above. Not executable until Jonesy approves and Ripley creates approved-prompt-v1.md.** Owner requested #425 after #423 CLOSED/PASS. The prior dependency/transfer question is resolved: #423 corrections are complete according to its final assessment. Current git status is clean. Its recorded independent validation was 10 files/174 tests, lint and build; this is historical evidence, not a new test run for #425.

### Scope and preflight

Implement the issue's existing draft scope above, with these definitive decisions and refinements. Reuse #423's corrected NorthernLightsThreeNight, useAuroraThreeNight, auroraMultiNightPolicy, auroraFreshnessPolicy, dates/labels and AuroraNightOutlook. Read their current implementations before writing; do not recreate their functionality. Preserve exact five-point inclusive similarity, complete-candidate/snapshot comparability, scoped incomplete conclusions, visible timestamps, freshness expiration, precise excellent pill and accessible date controls. No new scoring, provider, candidate set or backend work.

Replace App.jsx's current NorthernLightsCard at #northern-lights with the shared three-night module, passing the real homepage t/lang/entitlements/theme/checkout callback. Locate the actual homepage authentication-loading signal (do not assume its name is loadingMe); forward it for truthful exposure analytics. Preserve the existing anchor and off-season sibling fallback. Keep the module below the primary homepage decision surface, compact and secondary. Mount exactly one data owner; do not keep the old card hidden alongside it. Default tonight, preserve selection across async results and valid midnight rollover using existing hook behavior. Reuse the three API calls/cache (up to 18 upstream calls on cold load), identical inputs for Free/Pro; no extra request on selection or a duplicate fetch owner on the same surface.

### Surface behavior and navigation

Add an explicit bounded surface prop (homepage/landing), with landing as the compatible default. Both home languages use the same canonical per-night display and Free/Pro gates. Preserve existing collapsed-detail behavior; avoid adding landing marketing copy or a second upgrade block to the homepage. Keep detail state storage intentional so navigation does not accidentally expose hidden content or reset user preferences. Shared components must not fork forecast logic.

Render a real router Link from the homepage selected-night module to `/en/northern-lights?date=YYYY-MM-DD`. Use the actual selected evening, including unavailable/expired slots, never the recommended date instead. On the IS homepage use translated link copy explicitly identifying the English detail page; on EN use normal detail-page copy. No new IS landing route in this issue. Landing remains forced English. Preserve canonical SEO URL without the date query and unrelated query parameters when updating navigation state.

Landing reads the date query as a selection input: require one exact valid ISO calendar date within the current three-slot window. Reject impossible dates, duplicate date parameters, malformed and out-of-window values; fall back to tonight. Missing date also defaults to tonight on route entry. Initial hydration and browser back/forward must select the matching date without a selection-click event. User selection on landing updates its query using router replace (avoids a history entry per tab); only actual external location/query changes resynchronize selection, never ordinary rerenders or data completion. Avoid URL/state effect loops. Preserve the chosen calendar date across midnight if still available, otherwise reset to tonight and normalize the query without emitting a user-selection event. A valid unavailable date remains selected to show its own explanation. An initial recommended-night computation must never override it.

### Analytics and attribution

Reuse northern_lights_night_selected on both surfaces, add `source: homepage|landing`, preserve selected_date/days_ahead/forecast_status/user_tier. Fire once per genuine different-date user selection (including existing recommendation CTA), never route hydration/back-forward/midnight/default or same-date clicks. The detail navigation link itself is navigation, not a second selection event. Source is analytics-only; checkout still receives northern_lights_card unchanged.

Important source finding: current shared handleUpgrade unconditionally fires northern_lights_landing_cta_clicked. Guard that event to landing only when generalizing; homepage must not pretend to be landing traffic. Preserve northern_lights_upgrade_clicked, multi-day upgrade event and legacy selected-content exposure behavior on each actual surface, with no background-night or gated-map exposures. Keep lower landing value-section CTA unchanged. Add source to the new multi-night best-viewed/upgrade events as well for consistent surface distinction; preserve all other existing fields and semantics. Each mounted visible surface may record its own first exposure; cache reuse must not suppress it. Entitlement loading must not produce a premature free viewed event.

### Verification and boundaries

All verification cases in the preliminary draft remain required, plus: corrected #423 freshness boundary regressions still pass; landing-only CTA event never fires on homepage; URL replace does not loop/refetch; duplicate/impossible query dates fall back; initial deep-link selection works before/after delayed results; unavailable selected date persists; exact same fixtures yield identical summary and selected canonical content across home and landing. Test IS and EN text, accessible date/status controls, no Free identity/coordinate/reason leaks, single map and one controller, anchor and off-season fallback. Use real shared components in integration tests, not mocks that merely assert a prop was passed.

Run focused new/affected home, route and shared Aurora suites, lint changed JS/JSX, npm run build. Do deterministic browser verification on 375px and desktop for both homepage languages and Free/Pro: choose tomorrow/day 2, follow the actual detail link, verify URL and selected content, return/back, keyboard selection, no overflow; include unavailable or stale case. Retain reproducible scenario steps and screenshots. Report exact commands, counts and limitations; don't restate #423's old checks as new evidence. No live-provider/DB/cron access is needed.

Allowed changes: homepage wiring, shared Aurora frontend/hooks/presentation, existing landing query handling, existing EN/IS translations and targeted tests/docs. No backend/schema/provider/cron, scoring/threshold/candidate changes, prices/entitlements/checkout logic, new libraries/routes/TypeScript, unrelated homepage redesign. If read-only preflight finds a required change beyond this scope, STOP and explain evidence and smallest scope correction. No commit, push, deployment or GitHub issue closure.

Read AGENTS.md, CLAUDE.md, docs/ai/README.md and CURRENT. Jonesy reviews only and leaves PROMPT_REVIEW. After approval, Ripley creates approved-prompt-v1.md and READY_FOR_CC. CC sets CC_IN_PROGRESS, implements the approved file only, writes docs/ai/tasks/ticket-425/cc-report.md and sets CC_COMPLETE. Jonesy writes docs/ai/tasks/ticket-425/result-review.md. Keep #423's completed history immutable; no second active task.

---


## Jonesy review — Round 1 (implementation prompt)

**APPROVED, with one required follow-through item** (not a full REVISE —
it's naturally in scope for the same files this prompt already touches, but
needs to be explicit rather than left to chance).

Confirmed #423 is genuinely CLOSED/PASS first: read Ripley's Round 5 final
assessment (independently ran 10 files/174 tests, lint, build) before
treating this prompt's dependency as resolved.

### Independent verification of this prompt's preflight claims

- **App.jsx:423-433** — read directly: the `#northern-lights` anchor and
  off-season fallback are exactly as described, a sibling `<div>` outside
  `NorthernLightsCard`, not a card prop/branch. This means replacing the
  card inside that div with `NorthernLightsThreeNight` genuinely doesn't
  disturb the anchor or the off-season logic — confirmed structurally, not
  just asserted.
- **"No selected-date query parsing exists on landing"** — confirmed:
  `NorthernLightsLanding.jsx` (unchanged since #423 Round 4) has no
  `useSearchParams`/query reading anywhere, and `useAuroraThreeNight`
  initializes `selectedDate` to tonight with no external-override input.
  This is genuinely new work, not something already half-built.
- **"Current shared handleUpgrade unconditionally fires
  northern_lights_landing_cta_clicked"** — re-read `NorthernLightsThreeNight.jsx`
  (Round 5 version) directly: confirmed, `handleUpgrade` fires this event
  with no surface/variant gate at all — a real, non-obvious regression risk
  if mounted on the homepage unmodified, and a genuine regression from the
  *old* `NorthernLightsCard.jsx`, which explicitly gated this same event on
  `variant === "landing"`. This is the sharpest catch in the prompt and it's
  accurate.
- **"Locate the actual homepage authentication-loading signal, don't assume
  its name is loadingMe"** — checked `useMe.js` and `App.jsx`: the hook
  genuinely returns a field called `loadingMe`, but `App.jsx`'s own
  `const { me, refetchMe } = useMe()` doesn't currently destructure it. The
  caution is well-calibrated: the signal exists under the same name the
  landing page already uses, but CC needs to verify that (not assume it)
  and add one destructured field to an existing hook call — low-risk,
  correctly scoped.

### A gap the prompt doesn't mention: NorthernLightsCard.jsx becomes orphaned

Grepped every production import of the default `NorthernLightsCard` export
across `src/`: **App.jsx is the only remaining production caller.** The
landing page already stopped using it in #423 (it renders
`NorthernLightsThreeNight` instead); `NorthernLightsThreeNight.jsx` only
imports its `CARD_SHELL_CLASS` named export, not the component. Once this
prompt replaces App.jsx's mount, `NorthernLightsCard.jsx`'s default-exported
component has **zero remaining production callers** — it becomes dead code,
kept alive only for that one shared constant, with its own 53-test suite
(`NorthernLightsCard.test.jsx`) and `NorthernLightsCard.landingVariant.test.jsx`
now exercising unreachable production code.

Worse, this makes two existing file-header comments actively false the
moment this ships: `NorthernLightsThreeNight.jsx`'s own header says
*"Homepage's NorthernLightsCard is completely unaffected: this is a new
sibling module, not a modification of it"*, and `AuroraNightOutlook.jsx`
says *"the homepage card's own copy/keys are completely untouched."* Both
statements would become wrong, not just outdated — a future reviewer
reading those comments (including a future Jonesy pass) would be misled
into thinking the homepage still runs the old single-night card.

This is squarely inside the prompt's own "Allowed changes" (shared Aurora
frontend/hooks/presentation, targeted tests/docs), so it doesn't need a
scope change — but the prompt should say so explicitly rather than leave it
to chance. **Required addition before CC executes:** update the two stale
header comments above once the homepage wiring changes, and have CC
explicitly report `NorthernLightsCard.jsx`'s new status in cc-report.md
(orphaned default export retained only for `CARD_SHELL_CLASS`; its own test
suites now cover unreachable production code) rather than silently leaving
it unaddressed. Also worth a specific mention: `App.northernLightsAnchor.test.jsx`
(pre-dates #423, asserts the old card mounts at the anchor) and
`NorthernLightsLanding.cardWiring.test.jsx` (imports the old card directly)
both need to be checked against the new reality — their names don't make
the connection obvious, so calling them out here avoids CC missing them.

### Everything else

Scope discipline is thorough and consistent with #423's established
boundaries: no backend/scoring/candidate/entitlement changes, no new routes
(a query param on the existing route, not a new one), explicit STOP
condition if preflight surfaces something beyond this. The analytics
section correctly treats `source` as analytics-only, explicitly preserving
checkout attribution (`northern_lights_card`) and requiring the landing-CTA
event to be surface-gated — directly fixing the regression risk found
above. The navigation section's handling of malformed/duplicate/out-of-window
dates, no-event-on-hydration, and "unavailable date stays selected rather
than silently swapped for the recommended night" all track directly onto
prior identity-safety and comparison-scoping work from #423 rather than
inventing new policy. Verification requirements are concrete and specific
(router integration, both languages, both tiers, keyboard, no duplicate
map, no Free leak) — nothing in the test plan is disconnected from a stated
requirement above it.

### Verdict

**APPROVED**, contingent on the one required addition above (stale-comment
correction and explicit `NorthernLightsCard.jsx` status reporting) being
folded into the prompt's requirements before `approved-prompt-v1.md` is
created — not a reason to send this back for a full revision round, since
it's a small, same-files addition, not an architectural gap. Everything
else — the preflight findings, the scope boundaries, the analytics/
attribution fix, and the navigation identity-safety rules — is accurate and
well-grounded in the actual current source, not just restated from the
issue.

## Ripley Round 1 handoff — 2026-09-26

Jonesy APPROVED with required same-scope follow-through. Created self-contained approved-prompt-v1.md, including the draft verification cases, corrected-header requirements, explicit reporting of the legacy default component's production-consumer status, and inspection of the named anchor/landing wiring tests. Retain the legacy component within this bounded change; do not mistake its tests for new homepage integration coverage. Set CURRENT to READY_FOR_CC. No implementation, commit or push performed.
