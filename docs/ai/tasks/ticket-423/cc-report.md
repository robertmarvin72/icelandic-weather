# #423 — CC report (Phase 1 audit only)

## 1. Scope actually executed

Read-only audit/documentation per `approved-prompt-v1.md`. All 8 audit
requirements are addressed in `data-audit.md`. No production code, tests,
schema, provider/library, scoring weights, entitlement/checkout, cron
schedule, or upstream-access exception were touched or added. `CURRENT.md`
was moved `READY_FOR_CC → CC_IN_PROGRESS` at the start of this work (the one
workflow-state edit made) and is set to `CC_COMPLETE` below.

## 2. Key findings (summary — full detail and citations in data-audit.md)

- The entire pipeline from XML parsing through the `/api/aurora-decision`
  endpoint is **already multi-night-capable and date-parameterized**: the
  parser returns all nights in the feed, the cache stores the full array,
  and `runAuroraDecision`/`validateAuroraDecisionBody` already accept an
  arbitrary `evening`. The single hardcoded "one night" point in the whole
  chain is `NorthernLightsCard.jsx`'s `evening = todayEveningUtc(...)` plus
  its one `useAuroraDecision` call.
- Independently re-counted the candidate set: **6** location IDs in
  `auroraCandidates.js`, all 6 resolve to real coordinates. This grounds a
  verified 18-call (3 separate per-night endpoint calls) vs. a proposed
  6-call (one wider-window call per location) request-volume comparison —
  see data-audit.md §4 for the tradeoff and what would need proving before
  trusting the 6-call shape.
- **No retained real Vedur.is XML capture exists anywhere in the repo.**
  The only "10-night" reference found is a synthetic test fixture/comment
  in `parseAurora.test.js` citing an untraceable earlier "Ticket 1 audit" —
  no `docs/ai/tasks/` folder for that audit exists, and no raw response was
  retained from it. This is reported as an honest unverified gap, per the
  prompt's explicit instruction, distinct from the parser's confirmed
  *structural* ability to handle any number of nights.
- Open-Meteo's documented forecast horizon (16 days) comfortably covers the
  needed 4-calendar-day span; one bounded real request (Reykjavík
  coordinate, today+3 days, same fields/params the app already uses)
  returned complete hourly data with zero nulls, supporting (but not
  proving for all 6 locations/seasons) the wider-window optimization
  proposal.
- Proposed a reviewable cross-night best-night rule (data-audit.md §5) that
  never calls an unavailable night "poor," never claims 3-night superiority
  from 1 available result, and does not reuse the existing within-night
  deterministic ID tie-break as cross-night evidence — with an explicit new
  near-tie tolerance parameter flagged for approval rather than silently
  chosen.
- Traced Free/Pro gating (unchanged `northernLights: {tier:"pro"}`), the
  forced-English landing page (no IS route exists or is proposed), and
  proposed 3 new analytics events with bounded params that preserve all
  existing events and checkout attribution untouched.

## 3. STOP conditions encountered

None required a stop. No need for schema writes (the "pending manual apply"
SQL comment is reported as an unresolved fact to verify, not something this
audit changed or applied), no new provider/library, no scoring-weight
change, no entitlement/checkout change, and no upstream-access exception was
needed — the one live network call made (Open-Meteo) was already
explicitly permitted by the approved prompt, bounded to one request, and
Vedur.is was never contacted outside its existing cron path.

## 4. Evidence and validation actually run

- `npx vitest run` across all 13 Aurora-related test files/globs listed in
  data-audit.md §10 → **23 test files, 256 tests, all passed.**
- One bounded `curl` GET to Open-Meteo's public forecast API (see
  data-audit.md §10 for exact params/result) — HTTP 200, 96/96 hourly rows
  present, 0 nulls.
- One `WebFetch` to Open-Meteo's public documentation page for the
  forecast-horizon facts.
- Repo-wide searches (via Grep/Bash) for retained XML evidence, "10-night"
  documentation, and "live fetch" claims across `docs/ai/tasks/*/cc-report.md`
  and `prompt-review.md` files — negative/inconclusive result reported
  honestly in data-audit.md §1 rather than assumed.
- No lint/build run was needed or performed — no source files were changed.

## 5. Limitations of this audit (for Jonesy/Ripley)

- The real current Vedur.is night count and per-field completeness are
  **unverified** — this audit correctly did not fetch Vedur.is to find out,
  per the prompt's explicit prohibition. Phase 2 must design for "possibly
  fewer than 3 usable nights on any given day," not assume 3 are always
  present.
- The Open-Meteo completeness evidence covers **1 of 6** candidate
  coordinates and **today's window only** — real, but narrow; it supports
  rather than proves the wider-window (Shape B) proposal.
- Six items are explicitly left as open decisions for review
  (data-audit.md §9): production DB migration status, Shape A vs B, hook
  architecture for concurrent nights, the near-tie tolerance value, landing
  page multi-night scope, and the unverified real night count.

## 6. Commit and push status

**Not committed. Not pushed.** Only two new files were created this session:
`docs/ai/tasks/ticket-423/data-audit.md` and this `cc-report.md`, plus the
`CURRENT.md` stage-field edit described below. `git status --short` /
`git log --oneline -1` were checked and show no other change and no new
commit.

## 7. CURRENT.md transition (Round 1)

Set `Stage: CC_COMPLETE` for ticket-423, recorded the `CC report` path as
`docs/ai/tasks/ticket-423/cc-report.md`, per the approved prompt's workflow
section. This completed **Phase 1 only** — no Phase 2 work was started or
implied to start automatically.

---

## Round 2 — audit correction (approved-prompt-v2.md)

Jonesy PASSed Round 1's factual accuracy/scope discipline; Ripley's Phase 1
final assessment returned **REVISE** with 3 findings plus 4 supporting
factual corrections (full text in `result-review.md`). This round applies
the approved, bounded corrections to `data-audit.md` in place (with an
explicit revision note at its top) — it does not redo the audit or add new
scope. `CURRENT.md` was moved `READY_FOR_CC → CC_IN_PROGRESS` for this
correction at the start of this work.

### What was corrected

1. **Shape A/B (data-audit.md §4).** Round 1 described Shape B as a
   date-range-only edit to `orchestrate.js`. Re-read `orchestrate.js` and
   `openMeteo.js` directly and confirmed the current contract is strictly
   one-evening-in/one-decision-out — widening the Open-Meteo date range on
   an otherwise-unchanged single-evening call still returns one night's
   result, not three. §4 now carries an explicit
   request/response/orchestration/client-cache/hook matrix: Shape A (18
   Open-Meteo calls, genuinely zero backend/hook changes) vs. Shape B (6
   calls, but requires a new batched request/response contract, new
   server-side per-night row-slicing, and a new or adapted client hook —
   correctly described as an API-contract/orchestration expansion, not a
   parameter tweak).
2. **Cross-night freshness (data-audit.md §5).** Round 1 asserted the
   singleton cache row guarantees identical `sourceFetchedAt` across all 3
   nights. Re-read `cache.js` and `orchestrate.js` and confirmed this is
   false for Shape A: each of the 3 separate `runAuroraDecision` calls does
   its own independent `readAuroraSnapshot`, so a cron refresh
   (08:00/14:00/20:00, per the issue) landing mid-sequence can hand
   different calls different snapshot generations — including a revised
   activity value for a night already displayed from an older read. §5 now
   has a concrete example timeline and a proposed comparison-eligibility
   policy keyed on the `sourceFetchedAt` field `classifyAuroraCache` already
   returns (no new server fields needed to detect this). The all-poor state
   is now defined explicitly as its own branch (using the issue's own
   example copy, "Low chance across the next three nights") rather than
   only appearing in the future test-plan list.
3. **Landing page / Free-Pro surface (data-audit.md §6/§9).** Round 1
   treated landing-page multi-night scope as fully open. Ran
   `gh issue view 423` fresh this round (full issue text, not
   `prompt-review.md`'s summary) and confirmed Phase 5 explicitly requests
   the compact 3-night section on `/en/northern-lights`, and the Free/Pro
   section explicitly specifies Free sees the general 3-night outlook +
   best-night summary while Pro keeps full per-night location
   ranking/alternatives/map. §6/§9 now reflect this as settled fact, not an
   open question, and narrow the one genuinely open item to how Icelandic
   access is provided (no `/is/` route specified or proposed).

### Supporting factual corrections also applied

- `useAuroraDecision.js`'s `keyRef` check (re-read in full) discards an
  obsolete *result* on arrival but does not call `AbortController.abort()`
  — an old in-flight request can keep running to completion, its result
  simply unused. Corrected in §2's pipeline table and §4.
- Grepped `api/_lib/auroraDecision/` and `src/lib/auroraScoring.js` for
  `generationtime_ms`/`issued`/`forecast_time`/`issueTime` — no matches.
  Open-Meteo's `generationtime_ms` is not a forecast-issuance timestamp and
  is not captured anywhere in this pipeline; §3's wording corrected to stop
  implying it exists as an unused-but-available field.
- The SQL file's "pending manual apply" comment is now explicitly framed
  as old, unverified-either-way repo evidence, not proof the production
  table is missing — production schema status remains an unverified fact
  to check directly, not inferred from the comment in either direction.

### Evidence and validation this round

- `gh issue view 423` — full issue text fetched and read (Phase 5 layout,
  Free/Pro section, analytics event names, acceptance criteria, out-of-scope
  list all independently confirmed against the live issue, not assumed from
  `prompt-review.md`).
- Direct re-reads (no writes) of `useAuroraDecision.js`, `orchestrate.js`,
  `api/_lib/aurora/cache.js`, `api/_lib/auroraDecision/freshness.js`.
- One grep confirming no `generationtime_ms`/issuance-timestamp references
  exist in the relevant server-side files.
- **No new live-network probes were run** — the Round 2 prompt explicitly
  said not to restart the original audit's live-network probes, and no new
  evidence required one. The existing 23-file/256-test baseline was not
  rerun by CC this round; Ripley's result review already independently
  reproduced the identical count.
- No DB read/write, no cron invocation, no commit, no push, no production
  code change.

### STOP conditions encountered

None. All 4 corrections are documentation-only clarifications of existing
source behavior and existing issue text — no schema write, new
provider/library, scoring-weight change, entitlement/checkout change, or
upstream-access exception was needed or implied.

### Commit and push status

**Not committed. Not pushed.** Only `data-audit.md` (edited in place, with
a revision note) and this `cc-report.md` (Round 2 section appended) were
changed this round, plus the `CURRENT.md` stage-field edits described
below. Round 1's files and `approved-prompt-v1.md` remain untouched and
immutable, per the Round 2 prompt's explicit instruction.

### CURRENT.md transition (Round 2)

Set `Stage: CC_COMPLETE` for ticket-423, with the `CC report` path
continuing to point at `docs/ai/tasks/ticket-423/cc-report.md` (now
containing both rounds). This remains **Phase 1 only** — still audit/
documentation, no implementation authorized, no ticket closure. Phase 2
implementation waits for a separate, newly reviewed and approved prompt.

---

## Round 3 — comparison-policy correction (approved-prompt-v3.md)

Jonesy PASSed Round 2. Ripley's Round 2 final assessment returned
**REVISE**, scoped narrowly to `data-audit.md` §5 only — the Shape A/B
contract correction and the landing-page/Free-Pro surface finding from
Round 2 were explicitly accepted and are **not reopened** by this round.
`CURRENT.md` was moved `READY_FOR_CC → CC_IN_PROGRESS` for this correction
at the start of this work.

### What was corrected

1. **§5 rewritten as one internally consistent decision table.** Round 2's
   §5 was self-contradictory (one clause included zero-scored nights in the
   all-poor branch, another clause forbade that reading) and left
   cross-night candidate-set completeness and the freshness-mismatch UI
   treatment undefined/optional. Re-read `rankDecision.js` and `fanout.js`
   directly to confirm the candidate-completeness eligibility check
   Jonesy's Round 3 prompt-review approval flagged as "technically
   buildable" actually is: `fetchWeatherForLocations` always returns
   exactly one result per requested location (pre-sized array, index-
   written, never dropped), and `buildRankedDecision` places every location
   into exactly one of `best`/`alternatives`/`excluded` — so a night's
   successfully-scored location-ID set is directly derivable from the
   existing response and comparable against the request's own
   `locationIds`, with no new server fields. §5 now states pending / zero-
   scored / one-scored / eligible-2+-scored / ineligible-2+-scored /
   all-three-poor as one table, distinguishing within-night usability from
   cross-night comparison eligibility in every row, plus the 9 required
   worked examples (all pending; zero scored; one poor + two missing; two
   scored + one pending; three poor with complete comparable data; a
   missing candidate on one night; identical incomplete candidate sets;
   refresh-straddling timestamps; comparable-but-stale). Eligibility now
   requires both equal non-null `sourceFetchedAt` **and** the same complete
   (not merely mutually identical) configured candidate set — the
   "identical incomplete sets" example specifically tests that an
   incomplete-but-matching set still fails eligibility. Ineligibility now
   always produces a visible comparison-unavailable notice — the earlier
   "silent internal flag" option was removed, not left as a choice.
   All-three-poor copy is now gated on full resolution + scoring +
   eligibility + every compared night being the existing poorest
   (`"very-poor"`) band; a poor-only subset must explicitly scope its
   claim to the nights actually available, never implying the full three.
2. **§9's production-DB item de-gated.** Confirmed the correction requested
   by approved-v3: this item (and the matching passage in §1) no longer
   reads as "must be confirmed before Phase 2" — reworded to unverified
   operational context that does not block designing, reviewing, or writing
   Phase 2 code, consistent with the Round 2 correction's own item 4 (which
   had already separated unverified deployment facts from implementation
   prerequisites, but §9 had drifted back into gate-like wording).
3. **Landing-page attribution split.** The Revision-note (Round 2) text and
   §6/§9 previously attributed the specific route `/en/northern-lights`
   directly to the issue. Corrected: the issue's own wording only requests
   a 3-night section on "the Northern Lights landing page" — it does not
   name a URL. `/en/northern-lights` is a fact established separately by
   source inspection (`NorthernLightsLanding.jsx`, `AppRoutes.jsx`), not by
   the issue text. Both are true, but conflating them overstated what the
   issue itself specifies.
4. **Unsupported git-history claim removed.** The Revision-note (Round 2)
   text said Round 1's original prose "remains available via git history."
   This was never checked and is false: `git status --short` shows
   `docs/ai/tasks/ticket-423/` as untracked (`??`), so nothing in this task
   directory has been committed. Corrected to state plainly that this
   file's Round 1 prose is edited in place, not separately archived,
   while the approved-prompt/review/report *files themselves* (separate
   files, not diffs of this one) are what's actually retained.

### Evidence and validation this round

- Direct re-reads (no writes) of `api/_lib/auroraDecision/rankDecision.js`
  and `api/_lib/auroraDecision/fanout.js` to confirm the
  candidate-completeness check's buildability before writing it into the
  decision table, rather than assuming it.
- `git status --short` re-checked to verify the untracked-directory claim
  used to correct the git-history wording.
- No new live-network probes, no DB/cron access, no test run or added
  (documentation-only correction, per the approved prompt's explicit
  scope) — the existing 23-file/256-test baseline (independently
  reproduced twice already, by Ripley in both Round 1 and Round 2 result
  reviews) was not rerun a third time since nothing in this round changes
  code the suite covers.
- No production code, schema, provider, or scoring change of any kind.

### STOP conditions encountered

None. All corrections are documentation-only: a policy table rewrite using
only already-existing response fields, two wording/attribution corrections,
and one factually-incorrect claim removed. No schema write, new
provider/library, scoring-weight change, entitlement/checkout change, or
upstream-access exception was needed or implied. No near-tie tolerance
constant was introduced, per the approved prompt's explicit instruction —
that remains proposed and unresolved.

### Commit and push status

**Not committed. Not pushed.** Only `data-audit.md` (§5 rewritten, §1/§9
reworded, revision note added) and this `cc-report.md` (Round 3 section
appended) were changed this round, plus the `CURRENT.md` stage-field edits
below. Round 1 and Round 2 report sections in `cc-report.md` remain intact
above this section; `approved-prompt-v1.md` and `approved-prompt-v2.md`
remain untouched.

### CURRENT.md transition (Round 3)

Set `Stage: CC_COMPLETE` for ticket-423, with the `CC report` path
continuing to point at `docs/ai/tasks/ticket-423/cc-report.md` (now
containing all three rounds). This remains **Phase 1 only** — still audit/
documentation, no implementation authorized, no ticket closure. Phase 2
implementation waits for a separate, newly reviewed and approved prompt.

---

## Round 4 — Phase 2 implementation (approved-prompt-v4.md)

Phase 1 audit closed PASS (both Jonesy and Ripley, Round 3). Owner approved
two Phase 2 decisions (near-tie tolerance = 5 points, presentation-only;
ship the three-night view on the existing English landing page first,
homepage unaffected), authorizing this ticket's **first actual production
code change**. `CURRENT.md` was moved `READY_FOR_CC → CC_IN_PROGRESS` at
the start of this work.

### 1. Preflight — confirmed current source still matches the audit's assumptions

Before writing anything, re-read `useAuroraDecision.js`, `auroraDecisionCache.js`,
`auroraDecisionClassify.js`, `auroraDisplaySelection.js`, `NorthernLightsCard.jsx`,
`NorthernLightsLanding.jsx`, `auroraSeason.js`, `NorthernLightsMap.jsx`,
`auroraCandidates.js`, `auroraBandPresentation.js`, `auroraVisualState.js`,
`auroraReasonSummaries.js`, `features.js`, `AppRoutes.jsx`, and
`translations.northernLights.js` (confirming it, not `translations.common.js`,
owns these strings — approved-prompt-v4.md §1's own preflight note held).
Everything matched the accepted Phase 1 audit's contracts: one-evening-in/
one-decision-out response shape, `useAuroraDecision`'s `keyRef` discarding
obsolete *results* without aborting the underlying fetch, `classifyAuroraCache`
returning `sourceFetchedAt` on every branch, and `rankDecision.js`/`fanout.js`
guaranteeing every requested location ends up in exactly one of
`best`/`alternatives`/`excluded`. No conflict requiring a STOP was found.

### 2. Scope actually implemented

**Shape A only** (three unchanged single-evening `/api/aurora-decision`
requests) — no backend/contract/parser/storage/provider/SQL/cron change of
any kind. All work is frontend: new pure helpers, one new hook, two new
components, additive-only i18n keys, and two narrow, zero-behavior-change
extractions out of `NorthernLightsCard.jsx`.

**New files:**
- `src/lib/auroraMultiNightPolicy.js` — the pure cross-night comparison
  policy (approved-prompt-v4.md §4's 7-rule precedence exactly), consuming
  already-classified per-night responses, never re-scoring/re-ranking.
  Candidate-completeness eligibility is derived from `best`+`alternatives`+
  `excluded` (no new server fields), exactly as Round 3's audit correction
  established was buildable.
- `src/lib/auroraNightSlots.js` — builds the 3 consecutive UTC evening
  dates from one captured clock reading.
- `src/lib/auroraNightLabel.js` — date-aware "when" phrase / tab label
  formatting (tonight/tomorrow night/weekday night), including the
  Icelandic weekday→genitive-compound-stem transform (regular across all 7
  Icelandic weekday names, e.g. föstudagur→föstudags for "föstudagskvöld").
- `src/lib/auroraNightIndicator.js` — the tab strip's small per-night
  coarse band indicator (kept in its own file, not the component file, so
  `AuroraNightOutlook.jsx` stays fast-refresh-clean — a component file may
  only export components).
- `src/lib/auroraReasonKeys.js`, `src/lib/auroraFreshnessFormat.js` — the
  reason→translation-key map and the stale-age formatter, extracted
  verbatim out of `NorthernLightsCard.jsx` (byte-identical logic, zero
  behavior change) so `AuroraNightOutlook.jsx` can reuse them instead of
  duplicating and risking drift.
- `src/hooks/useAuroraThreeNight.js` — owns exactly three fixed
  `useAuroraDecision` call sites (Rules-of-Hooks legal, never conditional/
  looped), adapts each into `{date, daysAhead, status, classification}`,
  and adds an **identity-safety guard beyond `keyRef`**: for the one render
  right after a midnight rollover (before `useAuroraDecision`'s own effect
  has re-fired), it compares the response body's own `evening` field
  against the requested date and forces `status: "loading"` on mismatch —
  directly addressing the preflight note that `keyRef` alone doesn't
  synchronously flip status back to loading. Also owns the bounded
  next-midnight timer + visibility-return safety net (real day-rollover
  only re-fetches; a same-day visibility return is a no-op, confirmed by
  test) and the "preserve selected date if still in window, else reset to
  tonight" rule.
- `src/components/AuroraNightOutlook.jsx` — the selected-night presentation
  body, a sibling of (not a copy bound to) `NorthernLightsCard`'s internal
  rendering: same lower-level pure helpers (`selectAuroraDisplay`,
  `auroraVisualState`, `auroraBandLabelKey`, `selectAuroraReasonSummaries`,
  `NorthernLightsMap`) reused unchanged, but every string that would say
  "tonight" for a night that isn't tonight uses a new date-neutral or
  `{when}`-parameterized key instead (see below).
- `src/components/NorthernLightsThreeNight.jsx` — the landing controller:
  tab strip (real buttons, `aria-pressed`, per-tab coarse band dot),
  cross-night comparison summary banner, one `AuroraNightOutlook` instance
  for the selected night, Free/Pro gating via the existing
  `isFeatureAvailable` gate, `detailsExpanded` persisted in its own
  `nl3_details_expanded` sessionStorage key (homepage's `nl_details_expanded`
  untouched), and the 3 new analytics events.

**Modified files (all narrow, zero-behavior-change to the homepage path):**
- `NorthernLightsCard.jsx` — extracted `REASON_KEYS`/`formatAgo` to the two
  new shared files above (import swap only) and exported its existing
  `CARD_SHELL_CLASS` constant (additive) so the new controller can reuse
  the identical shell. No JSX, copy, prop, or behavior change; its own
  741-test suite passes unchanged.
- `NorthernLightsLanding.jsx` — swapped its single `<NorthernLightsCard
  variant="landing">` for `<NorthernLightsThreeNight loadingMe={loadingMe}>`;
  updated the file's own header comment (was describing the now-replaced
  single-card behavior); `loadingMe` was already destructured from `useMe()`
  here, just newly wired through. The lower Free-only marketing section and
  `aurora_landing_viewed`/`northern_lights_landing_cta_clicked` wiring are
  completely untouched.
- `translations.northernLights.js` — additive only. ~28 new EN/IS key
  pairs (multi-night copy + when/tab labels + comparison-summary copy). No
  existing key's value changed.

### 3. The "audit every tonight-reference" requirement (approved-prompt-v4.md §5)

Grepped every EN string containing "tonight" (14 matches) before starting.
Result: FAIR and NEUTRAL visual-state headline/body were already
date-neutral and are reused as-is; GOOD and POOR needed new date-neutral
`nlMulti*` keys (`nlMultiHeadlineGood`/`nlMultiBodyGood`/`nlMultiPillPoor`/
`nlMultiHeadlinePoor`/`nlMultiBodyPoor`); the best-location line needed a
genuinely date-aware key (`nlMultiBestOn`, `"Best conditions {when}: {name}"`);
several structural strings (free hint, qualifying heading, no-darkness
title, warning-partial, locked-best-location, locked CTA) got date-neutral
rewordings. Homepage's own keys (`nlCardTitle`, `nlHeadlineGood`,
`nlBestTonight`, etc.) are **completely untouched** — confirmed by
`NorthernLightsCard.test.jsx`'s full 741-test suite passing unchanged.

### 4. Request-volume accounting

Exactly 3 client requests per full landing-page load (one per
`useAuroraDecision` call site), each hitting the existing single-evening
`/api/aurora-decision` endpoint unchanged — server-side that's 6 Open-Meteo
calls × 3 = 18 total on a cold load, the explicitly accepted Shape A cost
(not 6). Switching tabs issues **zero** additional requests (all 3 already
in flight/resolved up front) — verified by test. The existing 5-minute
per-key cache/promise-reuse (`auroraDecisionCache.js`) is completely
unmodified and continues to dedupe identical concurrent requests
(Free/Pro, or double-render) exactly as before.

### 5. Analytics

All 3 new events (`northern_lights_night_selected`,
`northern_lights_best_night_viewed`, `northern_lights_multi_day_upgrade_clicked`)
implemented exactly as specified in approved-prompt-v4.md §6: selection-only
firing (not default/mount/rollover), truthful-tier-after-`loadingMe`
gating, identity-based dedup for the viewed event, and the
selected-vs-recommended-date distinction is explicitly covered by its own
test (switching to a non-recommended tab does not re-fire or reinterpret
the already-fired best-night event). None of the 8 existing
`northern_lights_*` events, the homepage card's own analytics, or
`northern_lights_landing_cta_clicked`/checkout attribution were touched.

### 6. Consolidated non-blocking review note — resolved

`detailsExpanded` is a single shared boolean (not per-night), read from
its own sessionStorage key and applied to whichever night is currently
selected; `AuroraNightOutlook` always recomputes its display from the
*currently selected* slot's own classification, so switching nights with
details already expanded shows the new night's own content immediately —
never a prior night's stale ranking/map. Explicitly covered by an
integration test ("expanding details on one night keeps details expanded
when switching... showing THAT night's own content"). Homepage's own
`nl_details_expanded` sessionStorage key/behavior is untouched.

### 7. Tests, lint, build, browser verification

- **New/changed unit+integration tests**: `auroraMultiNightPolicy.test.js`
  (21 tests — all 9 accepted Phase 1 audit examples plus every
  additionally-required case: two-usable/one-unavailable, invalid/missing
  timestamp, duplicate/missing candidate IDs, timestamp refresh boundary,
  no-favorable poor+very-poor combination, score gaps at 0/5/>5, near-tie
  across canonical bands, non-transitive grouping, sole-available, pending-
  overrides-everything), `auroraNightLabel.test.js` (9), `useAuroraThreeNight.test.js`
  (11 — three distinct dates/payloads, identical Free/Pro request shape,
  correct each-night score/window association, no fourth request on
  selection, Strict Mode reuse, season-disabled zero requests, December 31
  rollover, midnight/visibility reset with selection preserve-or-reset,
  retry, and the identity-safety guard against a mismatched `body.evening`),
  `NorthernLightsThreeNight.test.jsx` (14 — atomic content switching, no
  stale map on an unavailable selection, at most one map ever, Free DOM
  leak check, all 3 analytics events including the dedup/selected-vs-
  recommended cases, details-expanded persistence across switches).
  `NorthernLightsLanding.test.jsx`/`.cardWiring.test.jsx` updated to match
  the new rendered module (testids, title copy, mocked component/props).
- **Targeted Aurora suite**: `npx vitest run` across the Phase 1 baseline
  files plus every new/changed file above → **29 test files, 325 tests, all
  passed** (Phase 1's own baseline was 23 files/256 tests — the +6 files
  are the 4 genuinely new suites plus 2 pre-existing Landing suites that
  weren't in Phase 1's own targeted list but are affected by this change
  and now verified together).
- **Full project suite**: `npx vitest run` (no path filter) → **136 test
  files, 1896 tests, all passed.** No pre-existing failure; only the
  known-benign, pre-existing jsdom "Not implemented: navigation to another
  Document" console warnings (unrelated, predate this ticket).
- **Lint**: `npm run lint` (whole repo) → exit 0, no output.
- **Build**: `npm run build` → succeeded, `✓ built in 9.48s`, PWA precache
  generated. Only the pre-existing "chunks larger than 500 kB" notice,
  unrelated to this change.
- **Browser verification**: real Vite dev server (`npx vite`, frontend
  only) + real Playwright Chromium, deterministic `page.route()` stubs for
  `/api/aurora-decision` and `/api/me` (no live provider/DB/cron), navigated
  to `/en/northern-lights`. Covered: 375px mobile and 1280px desktop, Free
  and Pro, all three distinct real dates (today 2026-09-25 was genuinely
  in-season, so no clock injection was needed), keyboard tab selection
  (Tab+Enter, confirmed via `aria-pressed` toggling), an all-poor tab
  (correctly shows zero map instances), and the qualifying "Tonight" tab
  (correctly shows exactly one real Leaflet map with the purple
  excellent/green good/yellow fair legend from #414, 6 ranked locations,
  correct bands). 12 screenshots captured to
  `outputs/ticket-423-phase2-browser-evidence/` (both viewports × both
  tiers × several states) — inspected directly, not merely generated. The
  temporary verification script itself was deleted after use (not a
  permanent repo artifact); this is real-browser evidence, not a claim
  derived from unit tests. Live-provider (Vedur.is/real Open-Meteo)
  end-to-end validation was **not** run — explicitly recorded as
  unverified, per the approved prompt's "no live provider/DB/cron needed
  for fixture validation" allowance and its instruction to record what
  wasn't run rather than assume coverage.

### 8. Scope exclusions — confirmed not touched

No backend/API/SQL/cron file changed. No scoring weight, band threshold, or
formula changed (the 5-point near-tie tolerance is a presentation-only
grouping constant in the new pure policy helper, exactly the owner-approved
parameter — `src/lib/auroraScoring.js` itself is untouched, confirmed by
its own unchanged test suite). No entitlement/pricing/checkout logic
touched. No new route added; `/en/northern-lights` remains the only
Northern Lights standalone URL, still forced-English. No new library/
TypeScript/explicit import extension introduced. Homepage's
`NorthernLightsCard` usage (`App.jsx`) is unchanged and its own full test
suite passes unchanged.

### 9. Remaining limitations (for Jonesy/Ripley)

- **Live-provider end-to-end validation was not performed** (real
  Vedur.is + real Open-Meteo through the real 3-request flow) — only
  deterministic fixture-based unit/integration/browser verification. This
  matches the approved prompt's own allowance but is recorded here plainly
  rather than implied as covered.
- **Icelandic-language access remains exactly as the accepted Phase 1
  audit left it**: this implementation ships the English landing page only
  (per approved-prompt-v4.md's explicit "ship the three-night view on the
  existing English landing page first" decision); no `/is/northern-lights`
  route was added or implied, and the open question of how IS users reach
  this view is unchanged/not addressed by this round.
- The pre-existing test-coverage gap flagged in the Phase 1 audit (no
  explicit Dec 31→Jan 1 rollover test in `darknessWindow.test.js`/
  `auroraScoring.test.js`) is **not** closed by this round — this ticket's
  own new Dec 31 rollover test (`useAuroraThreeNight.test.js`) covers the
  client-side date-building path only, not those two lower-level files;
  still worth a small follow-up.
- The Icelandic translation strings added this round (`nlWhenWeekdayNight`
  compound-stem transform, `nlMultiBestOn`, comparison-summary copy) have
  not been reviewed by a native-speaker product owner beyond this session's
  own grammatical reasoning (documented inline in `auroraNightLabel.js`) —
  worth a native-speaker pass before wide release, though the English
  surface is the one actually shipping per the owner's Phase 2 scope
  decision.

### 10. Commit and push status

**Not committed. Not pushed.** `git status --short` confirms only the files
listed in §2 above (plus `docs/ai/tasks/ticket-423/` and
`outputs/ticket-423-phase2-browser-evidence/`, both untracked) changed
this session — no other production file touched, no commit created.

### 11. CURRENT.md transition (Round 4)

Set `Stage: CC_COMPLETE` for ticket-423, with the `CC report` path
continuing to point at `docs/ai/tasks/ticket-423/cc-report.md` (now
containing all four rounds — Phase 1 Rounds 1-3, Phase 2 Round 4). This is
the ticket's first actual implementation; Jonesy's review of this result
should be at least as rigorous as prompt review, per the owner's own note
in `CURRENT.md`'s sequencing section. No commit, push, deployment, or
GitHub issue closure performed.

---

## Round 5 — Phase 2 corrections (approved-prompt-v5.md)

Executed after Ripley's Phase 2 REVISE (result-review.md, "Ripley Phase 2 result assessment — 2026-09-26"). `CURRENT.md` moved READY_FOR_CC → CC_IN_PROGRESS first. The uncommitted Round 4 implementation was corrected narrowly, not restarted; no #425 work (no homepage link/UI/query handoff). Prior rounds above are preserved verbatim; earlier overclaims are corrected here, not by rewriting them.

### Correction of an earlier overclaim

Round 4 §2 and §8 said the `NorthernLightsCard` "741-test suite" passes unchanged. **741 was the file's line count, not a test count.** Actual count from the command run this round: `npx vitest run src/components/NorthernLightsCard.test.jsx` → **1 file, 53 tests, all passed**. That suite is unchanged by Rounds 4 and 5.

### Corrections mapped to source and tests

1. **Truthful update time and aging.**
   - New `src/lib/auroraFreshnessPolicy.js`: client mirror of the server policy (inclusive <=480 fresh / <=1440 stale / >1440 or missing/malformed unavailable), plus `applyClientFreshness` and `nextFreshnessBoundaries`. Server code is not imported into the frontend; `auroraFreshnessPolicy.test.js` proves parity by importing the server constants and `classifyAuroraCache` (test-only) and comparing states at -5min skew, 0, 479/480/480min+1ms/481, 1439/1440/1440min+1ms and 2000 min.
   - `useAuroraThreeNight.js`: derives every slot's freshness from the actual current age at each render, re-renders on visibility return, and arms one bounded timer at the next 480/1440 boundary (cleaned up; no provider polling or refresh loop — request count verified to stay 3). A result past 1440 min, or with a missing/malformed timestamp, becomes an explicit `expired` domain_unavailable with `body: null`, so it cannot reach ranking, map or comparison until the existing retry. Server response and backend constants untouched.
   - `AuroraNightOutlook.jsx`: every resolved night shows "Aurora data updated {ago}" from that night's own `auroraCache.sourceFetchedAt` (fresh, stale and poor included); unknown/malformed shows "update time unavailable"; the expired state has its own copy plus retry. Never uses fetch-completion time or weather issuance.
   - Tests: `auroraFreshnessPolicy.test.js` (parity, boundaries, expired, malformed), 4 new fake-clock tests in `useAuroraThreeNight.test.js` (fresh to stale exactly past 480 via the timer with no extra request; stale to expired past 1440; same-day visibility return re-derives age with no request; malformed timestamp never fresh), and component tests (selected-date timestamp switches; expired suppresses ranking/map/winner/best-night event; stale notice).
2. **Restored landing analytics and attribution.** `NorthernLightsThreeNight.jsx` now emits, for the SELECTED night's visible content only: `northern_lights_card_viewed` (original payload lang/outcome/freshness/band/tier/resultState), `northern_lights_unavailable_viewed`, `northern_lights_stale_viewed`, `northern_lights_details_opened`, `northern_lights_ranking_viewed` and `northern_lights_map_viewed` (gated on display.showRanking/showMap for the selected night with details expanded), deduped by requestKey (+primary) so background nights, switch-back, rerender and same-outcome retry do not re-fire; tier-bearing events wait for `loadingMe`. The module upgrade CTA forwards the existing `northern_lights_card` source to checkout and emits `northern_lights_landing_cta_clicked` (placement "card"), `northern_lights_upgrade_clicked` and the new `northern_lights_multi_day_upgrade_clicked` once each. The lower value-section CTA is unchanged. The Round 4 test asserting the legacy event must NOT fire was replaced with one asserting all three events and the source; `NorthernLightsLanding.cardWiring.test.jsx` now uses `northern_lights_card`. Tests: `NorthernLightsThreeNight.round5.test.jsx` (selected vs background exposure, switch-back/rerender dedupe, unavailable + retry dedupe, stale, entitlement-loading hold, Free fires none of details/ranking/map, Pro once each, no ranking/map event on an all-poor night with details expanded).
3. **Readable outlooks and accessibility.** Each of the three date buttons shows visible localized text (`auroraNightOverview` in `auroraNightIndicator.js`: band pill text, "Checking…", "Status unavailable", "Not dark enough", "Data expired"); the color dot is decorative only. Excellent keeps its own text and purple accent in the overview and the selected-night pill; the previously computed `pillLabel` is now rendered (`nl3-status-pill`). The `role="tablist"` wrapper was replaced by a labelled `role="group"` of `aria-pressed` buttons. Tests: `auroraNightIndicator.test.js` (6) and round-5 accessibility tests (names include outlook text incl. loading/unavailable, group not tablist, keyboard focus + activation, excellent vs good pill/overview, Free DOM has no location names/coordinates, Icelandic parity). EN/IS keys added for all new copy.
4. **Scoped incomplete comparisons.** `ComparisonSummary` consumes `scopedToAvailable` for best, similar and exact-tie ("... among the available nights ..." — EN+IS keys `nlCompBestNightScoped/SimilarScoped/ExactTieScoped`). Pending precedence, sole-available, all-poor rules and the inclusive 5-point tolerance are unchanged. Real-translation tests: two usable + one unavailable for unique-best, similar and exact-tie; all-three-usable keeps the unscoped wording.
5. **Duplicate-ID guard.** `auroraMultiNightPolicy.js` completeness now also requires the raw scored-ID list length to equal its set size. Three new tests: duplicate-plus-complete, duplicate-replacing-missing, duplicated best inside alternatives — each ineligible while per-night usability stays true. Roster and scoring untouched.

### Commands and exact results (run this round)

- Ripley's seven suites (auroraMultiNightPolicy, auroraNightLabel, useAuroraThreeNight, NorthernLightsThreeNight, NorthernLightsCard, NorthernLightsLanding, NorthernLightsLanding.cardWiring): **7 files, 137 tests passed** (Ripley's baseline was 130).
- Whole Aurora set (api/_lib/aurora/, api/_lib/auroraDecision/, src/lib/aurora*, useAuroraDecision, useAuroraThreeNight, all NorthernLights* components/pages including the new freshness/indicator/round5 suites): **35 files, 397 tests passed**.
- Full project `npx vitest run`: **139 files, 1940 tests passed** (only the known benign jsdom "navigation" warnings).
- `npm run lint` (whole repo): exit 0, no output. `npm run build`: succeeded (built in 7.88s; only the pre-existing large-chunk notice).

### Browser verification (new this round; not derived from unit tests or Round 4 screenshots)

Real Vite dev server + Playwright Chromium, deterministic `page.route` stubs for `/api/aurora-decision` and `/api/me` with real current dates (today 2026-09-26) and timestamps relative to now; 375px and 1280px, Free and Pro, four scenarios: fresh (2h) with excellent overview, partial comparison (night 3 unavailable), stale (16h), expired (30h). Observed across all 16 renders: no horizontal overflow; visible per-night outlook text; "Aurora data updated 2/16/30 hours ago" for the selected night; scoped "Best conditions among the available nights: tonight"; the existing stale notice at 16h; all three nights "Data expired" with retry and "couldn't determine conditions" at 30h; purple excellent pill; Pro showed exactly 1 map on the qualifying night and Free showed no location names. 16 screenshots retained in `outputs/ticket-423-round5-browser-evidence/`; I viewed the mobile Free partial-comparison render directly. Temporary script and dev server removed.

### Remaining limitations

- No live provider/DB/cron validation (not authorized or required). Freshness uses the browser clock; a badly wrong device clock skews ages (future timestamps are clamped to age 0, mirroring the server).
- The Icelandic "fyrir {ago}" update line reuses existing age strings, so the under-an-hour case reads "fyrir innan við klukkustund" (an existing wording pattern); IS copy has had no native-speaker review.
- The Round 4 discoverability gap (no in-app link to `/en/northern-lights`) is unchanged and is #425 scope.
- Expired data is refreshed only via the existing retry; there is deliberately no auto-refresh.

### Status

Not committed, not pushed. Changed/new this round: useAuroraThreeNight.js, NorthernLightsThreeNight.jsx, AuroraNightOutlook.jsx, auroraMultiNightPolicy.js, auroraNightIndicator.js, new auroraFreshnessPolicy.js, translations.northernLights.js, NorthernLightsLanding.cardWiring.test.jsx, and tests (auroraFreshnessPolicy, auroraNightIndicator, NorthernLightsThreeNight.round5, additions to auroraMultiNightPolicy, useAuroraThreeNight and NorthernLightsThreeNight). CURRENT.md set to CC_COMPLETE.
