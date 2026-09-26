# #423 — Phase 1 data audit / prompt review

Issue: https://github.com/robertmarvin72/icelandic-weather/issues/423
Date: 2026-09-25
Role: Ripley. Discussion only; no implementation authorization.

## Initial read-only findings

Working tree clean. #417 locally CLOSED; its external Facebook/Vercel/GA4 checks remain pending independently. The issue explicitly requires a Phase 1 audit result before implementation, so this task's first execution prompt is AUDIT ONLY. Do not proceed straight into Phases 2–5.

| Area | Current source evidence | Preliminary change needed |
|---|---|---|
| Upstream | api/_lib/aurora/fetchAurora.js uses https://xmlweather.vedur.is/aurora?op=xml&type=index, timeout 8s, only authenticated cron may fetch | No new provider/fetch path |
| Parser | parseAuroraSnapshot extracts every night_data block with valid evening_date, preserves nullable activity, sun and moon fields | No obvious multi-night parser rewrite |
| Night count | parseAurora.test.js documents a previously confirmed 10-night response and tests 10 synthetic nights | Historical evidence, NOT verification of today's upstream horizon |
| Storage | cache.js persists the complete {nights} array in singleton JSON snapshot; source_fetched_at records batch retrieval time | No obvious table/schema change |
| Cron | refresh-aurora.js parses/persists all returned nights; vercel.json has 0 8,14,20 * * * | Preserve schedule and lease/auth/last-known-good |
| API | runAuroraDecision accepts evening, selects exact cached eveningDate, no match -> unavailable | Existing date-aware API can likely be reused |
| Weather | Open-Meteo request uses start_date=evening, end_date=following day, timezone UTC; normalized hourly cloud layers, wind, rain and visibility | Dates already supported; actual horizon/coverage needs verification |
| Darkness | computeNationalDarknessWindow uses each night's eveningDate + darknessStart/dawn, hours before noon map to following date | Already date-aware national reference, NOT location-specific astronomy |
| Scoring | buildRankedDecision invokes unchanged scoreAuroraVisibility({night,hourlyRows,viewingWindow}); sorted score descending then ID | Reuse unchanged; comparison semantics between nights still need design |
| Client cache | auroraDecisionCache is keyed by evening and normalized IDs with 5-minute reuse | Already supports independent date identities |
| UI | NorthernLightsCard internally fixes evening=todayEveningUtc; landing reuses it with variant=landing | Add date orchestration/selected result while preserving homepage tonight behavior |
| Entitlement | Hook/API requests identical Free/Pro; selectAuroraDisplay gates presentation, map also requires >=2 qualifying sites and >=2 bands | Preserve those gates; Free summary must not reveal location detail |
| Freshness | source_fetched_at drives <=480min fresh, <=1440min stale, older unavailable | Preserve; batch timestamp is honestly shared, not per-night forecast issue time |

The initial audit has not queried production DB, triggered cron, fetched live XML or measured current Open-Meteo coverage. Do not turn historical comments/synthetic fixtures into current-provider evidence. The current source retains all nights already; implementation should preferentially be frontend orchestration and presentation, with no backend changes unless the completed audit proves a need.

## Round 1 — proposed audit-only execution prompt

### Workflow

Read AGENTS.md, CLAUDE.md, docs/ai/README.md and CURRENT.md. Execute only approved-prompt-v1.md once READY_FOR_CC. Set CC_IN_PROGRESS before audit work. Create docs/ai/tasks/ticket-423/data-audit.md and cc-report.md; set CC_COMPLETE for review. This milestone completes only Phase 1, not the entire feature. Do not implement production code or automatically start Phase 2. No commit, push, deploy, database writes, cron trigger or schedule change.

### Audit requirements

1. Independently trace actual XML -> parser -> singleton snapshot -> freshness/night selector -> Open-Meteo date range -> darkness/scoring -> request cache/hook -> card/landing/map. Record exact file/function references and supported contracts. Read existing tests and related rules; verify the initial findings rather than copying them.
2. Confirm how many distinct dates are present in available real source evidence and which have usable activity/darkness fields. Prefer existing retained raw responses or authorized read-only cache evidence; timestamp and label evidence. Never call Vedur directly outside the existing controlled cron path or invoke refresh merely to audit. If no fresh capture is available, clearly leave CURRENT horizon unverified, distinguishing historical 10-night documentation and synthetic parser tests. Do not expose credentials or raw personal/session data.
3. Verify Open-Meteo's documented supported forecast horizon using primary documentation, and, where permitted, one bounded read-only request for the existing candidate coordinates and three-evening/four-calendar-day interval. Report actual hourly completeness and UTC boundaries separately from documentation. Do not fetch weather repeatedly per test; retain a small nonpersonal evidence summary. If network evidence is unavailable, record the missing fact rather than assuming coverage.
4. Verify per-night sun/moon semantics, midnight/month/year rollover, missing/null vs activity=0, stale/partial/no-darkness states and exact scorer date handling. Confirm no duplicated forecast value between nights is needed. Source retrieval time is not provider forecast issue time; distinguish those from weather fetch time and client cache time. Shared batch retrieval time is legitimate when provenance is genuinely shared.
5. Propose the smallest implementation boundary: reuse one date-aware endpoint and existing scorer/candidate set, aggregate up to three date-keyed results without three visible maps. Assess request volume (six locations per evening may mean eighteen weather calls), existing concurrency/TTL, race cancellation and transient stale outcome display on date switching. Do not quietly add server batching or new caching infrastructure.
6. Specify a REVIEWABLE best-night rule proposal using existing comparable scores/bands without altering weights/thresholds. Cover ties/near-ties, all-poor, absent nights, partial candidate sets, stale mixtures and inconsistent retrieval ages. Do not choose an arbitrary near-tie tolerance without explicitly presenting it as a proposed product parameter. Never call an unavailable night poor, claim all-three-night superiority from one available result, or use deterministic ID/date ordering as evidence of better conditions.
7. Trace Free/Pro through real feature gates and map eligibility, including existing details disclosure. Enumerate required date-aware labels and selected-night ranking/reasons/map updates. Landing is currently forced EN at /en/northern-lights; state how both languages will be supported without inventing an IS route or unintentionally expanding homepage scope. Present any unresolved surface decision for review.
8. Define proposed analytics timing and bounded parameter values for northern_lights_night_selected, northern_lights_best_night_viewed and northern_lights_multi_day_upgrade_clicked: selected_date, days_ahead, forecast_status, user_tier. Explicitly distinguish user selection from default/render and truthful viewed exposure from repeated async completions. Preserve existing events and checkout attribution.

### Evidence and deliverables

Run relevant existing parser/cache/cron, date-validation/darkness/orchestration/scoring, hook/cache and display tests once. Record commands, counts and failures accurately. No production-code edits or new tests needed merely to restate existing implementation. Documentation/evidence files only.

Deliver a concise data-audit.md with: confirmed vs unverified facts; parser/storage/scorer/UI change matrix; recommended data shape reusing canonical contracts; missing/partial/stale/tie behavior proposal; request-volume assessment; test/acceptance plan; and explicitly unresolved decisions. cc-report.md summarizes findings and limitations for Jonesy/Ripley. Implementation must wait for a separate reviewed prompt following this audit handoff.

STOP on any need for schema writes, new provider/library, scoring-weight changes, entitlement/checkout changes or an upstream-access exception. Explain the concrete need rather than executing it. Routine read-only audit work and documentation need no additional owner approval.

## Jonesy review — Round 1

**APPROVED, with 1 minor note.**

### Independent verification performed

This is a large surface area — the full Aurora/Northern-Lights decision pipeline — so I traced it end to end against live source rather than sampling. Every claim in the "Initial read-only findings" table checked out exactly, with zero discrepancies:

- `api/_lib/aurora/fetchAurora.js` — confirmed `https://xmlweather.vedur.is/aurora?op=xml&type=index`, `FETCH_TIMEOUT_MS = 8000`, and it's imported only by `api/cron/refresh-aurora.js`, which rejects any request without a matching `Authorization: Bearer $CRON_SECRET` header before touching the lease, DB, or upstream at all.
- `api/_lib/aurora/parseAurora.js` — confirmed every `<night_data>` block with a valid `evening_date` is kept, every other field (activity/sun/moon) degrades independently to `null` on its own, and `activity_forecast: 0` is preserved as a real distinct value, never coerced to null.
- `api/_lib/aurora/parseAurora.test.js` — confirmed the exact claim: `it("parses a multi-night response (matches the confirmed live 10-night shape)")`, generating 10 synthetic nights. This is historical/synthetic evidence, correctly NOT treated by the prompt as proof of today's live horizon.
- `api/_lib/aurora/cache.js` / `refresh-aurora.js` — confirmed the singleton-row UPDATE, the atomic lease claim/release, and that a failed fetch/parse never overwrites last-known-good.
- `api/_lib/auroraDecision/freshness.js` + `constants.js` — confirmed the exact thresholds: `AURORA_FRESH_MAX_AGE_MINUTES = 480`, `AURORA_STALE_MAX_AGE_MINUTES = 1440`, based on `source_fetched_at` (never `updated_at`).
- `api/_lib/auroraDecision/orchestrate.js` / `darknessWindow.js` / `rankDecision.js` / `openMeteo.js` — confirmed `selectNightForEvening` returns `null` (never fabricates) on no match; `computeNationalDarknessWindow`'s hour-before-noon-rolls-to-next-day rule; `buildRankedDecision` imports `scoreAuroraVisibility` unchanged and sorts score-desc then locationId-asc; Open-Meteo is requested with `start_date=evening`, `end_date=evening+1`, `timezone=UTC` — confirming the *current* code only ever spans one evening's own window, never a multi-night range.
- `src/lib/auroraDisplaySelection.js` — confirmed `showRanking` differs by tier (`isPro` gate) but `qualifyingLocations` itself is computed identically for both, and the map's `>=2 locations, >=2 bands` gate.
- `src/components/NorthernLightsCard.jsx` — confirmed `const evening = todayEveningUtc(now ? now() : undefined)` is the *only* evening computation in the file, with no prop to override it. This is the concrete architectural fact behind "add date orchestration while preserving homepage tonight behavior" — today's component genuinely has no plumbing for any night but tonight.
- `src/lib/auroraDecisionCache.js` — confirmed the 5-minute TTL and evening+locationIds-keyed reuse.

I did not re-verify every remaining file (`resolveLocations.js`, `validateRequest.js`, `fanout.js`'s concurrency wiring, `NorthernLightsLanding.jsx`'s exact JSX) in the same depth, but nothing I read contradicted the table, and the audit prompt itself requires CC to re-verify all of it against live source rather than copy the table forward — which is the right instruction regardless.

### Note (non-blocking)

Requirement #5's request-volume estimate ("six locations per evening may mean eighteen weather calls") is currently a carried-over assumption from the preliminary table, not something I independently confirmed against the actual candidate-location list this feature will use. Requirement #1's general "verify rather than copy" instruction already covers this, but given request-volume/cost is exactly what #5 asks CC to assess, it's worth CC explicitly re-deriving that number from the real candidate set rather than treating "six" as already-established.

### Everything else

The requirements correctly bound this to audit-only: no schema writes, no live Vedur calls outside the existing cron path, no scoring-weight changes, one bounded read-only Open-Meteo probe (not per-test spam) for horizon verification, explicit STOP conditions for anything needing new infrastructure. Requirement #6's best-night-rule guardrails are particularly good — barring an arbitrary near-tie tolerance without flagging it as a product parameter, barring "poor" as a stand-in for "unavailable," and barring a claim of cross-night superiority from a single available result are exactly the kind of fabricated-confidence failure mode this project has had to correct before elsewhere. Requirement #7 correctly flags the forced-`/en/northern-lights`-only landing route (which I've independently confirmed in a prior review) as an unresolved surface decision rather than letting CC silently invent an `/is/` route. Requirement #8's analytics plan correctly distinguishes user-initiated selection from default render and guards against double-counting on async retries, consistent with this project's established analytics discipline.

### Verdict

**APPROVED.** Ready for READY_FOR_CC.

## Ripley handoff — 2026-09-25

Jonesy APPROVED Round 1. Incorporated the single minor note into approved-prompt-v1.md: independently count and resolve the real configured candidate set before deriving three-night request volume; the preliminary six/eighteen figure is not an established input. CURRENT.md is READY_FOR_CC for Phase 1 audit only. No production implementation, commit, push, deployment or upstream refresh performed.

## Round 2 — Ripley audit correction prompt, 2026-09-25

Discussion only, pending Jonesy. Correct Phase 1 documentation according to Ripley's findings in result-review.md; do not implement production code. Preserve approved-v1 and prior reviews. Once approved, create approved-v2 and follow READY_FOR_CC -> CC_IN_PROGRESS -> CC_COMPLETE, appending a Round 2 cc-report rather than replacing history.

1. Correct Shape A/B comparison with explicit request, response, server orchestration and client cache/hook change matrices. A reuses the current single-evening API with up to eighteen weather calls. B can use six calls only by sharing a wider fetch across three separately scored nights and returning multiple decisions, which requires a contract change even without a new URL. No client-side scorer or claim that extending dates alone yields three API results. Keep backend changes as a proposal requiring reviewed implementation scope, not authorized work.
2. Give a concrete comparison policy proposal for mismatched sourceFetchedAt (including calls straddling refresh and cached entries of different ages), stale results, different successful candidate sets, all-poor, missing and pending nights. Identify comparison eligibility versus within-night usability. Do not assume a singleton means all independent responses share a snapshot. Present example timelines/tables and a conservative rule recommendation; near-tie tolerance remains a proposed product choice, not an existing threshold.
3. Correct surface/entitlement discussion: landing-page multi-night UI is already requested; Free sees general three-night outlook and best-night summary, Pro retains detailed location/ranking/map access. Limit the open language/surface decision to how Icelandic access is provided without silently expanding the homepage or inventing a route. Keep existing map visibility constraints and season behavior explicit.
4. Correct supporting factual wording: hook keyRef rejects obsolete results but does not abort requests; no actual forecast issue timestamp is captured by the current weather normalization and generationtime_ms is not one; an old pending-migration comment is not current production evidence. Distinguish unverified deployment facts from implementation prerequisites.

Read relevant source to substantiate each correction. Update data-audit.md's current recommendations and add a revision note preserving what changed; append cc-report Round 2 with exact evidence and remaining uncertainty. No additional live provider probes, DB reads/writes or cron invocations are required or authorized by this correction. The independent 23-suite / 256-test rerun already establishes the unchanged baseline; repeat only if new evidence justifies it. No new tests, libraries, backend, scoring changes, commit, push or deployment. This correction remains audit-only; Phase 2 waits for its own reviewed prompt.


## Jonesy review — Round 2

**APPROVED.**

### Independent verification of Ripley's three findings

I did not just trust Ripley's REVISE — I re-read the disputed sections of
`data-audit.md` myself and, where possible, checked the underlying source,
before agreeing the correction prompt is warranted and sufficient.

**Finding 1 (Shape B undersells the boundary) — confirmed, and this is a
miss in my own Round 1 PASS.** Re-reading §4's exact words: "Shape B is the
smaller, still-boundary-respecting option (it changes `orchestrate.js`'s
date-range computation only...)". That's internally inconsistent with the
same paragraph's own plan to slice the wider fetch into "three per-night
windows" and get three scored results back. The current contract
(`runAuroraDecision` → `buildRankedDecision`) returns exactly one ranked
decision for one evening — I confirmed this again this round via
`orchestrate.js`'s single-`evening` signature. Widening the Open-Meteo date
range alone still yields one call → one scorer pass → one decision; getting
three decisions from six calls requires the response to carry three
date-keyed decisions, which is a contract change, not a date-range edit. I
read this exact §4 paragraph in my own Round 1 result review and called it
one of the audit's stronger points ("changes `orchestrate.js`'s date-range
computation only... adds no new endpoint, provider, or cache layer")
without stress-testing whether "date-range computation only" was actually
sufficient to produce three results. It wasn't, and I should have caught the
contradiction between "one call → one decision" and "get three decisions"
myself. Not a fabricated-file type of error — a real reasoning gap on my
part.

**Finding 2 (cross-night freshness assumption) — confirmed, and this is
also a miss in my own Round 1 PASS.** §5's exact claim: "since all 3
nights' aurora-activity data come from the *same* singleton cache row...
aurora-activity freshness is identical across all 3 nights by
construction." That's only true if all three requests read the row at the
same instant. Under Shape A (three separate `/api/aurora-decision` calls,
which is what exists today), the cron schedule (`0 8,14,20 * * *`,
confirmed unchanged in `vercel.json` earlier this ticket) can fire between
request 1 and request 2/3, replacing the singleton row's contents — so two
requests genuinely can read two different `source_fetched_at` values
despite reading "the same singleton row," just at different times. This is
a real gap in the audit's reasoning, not an edge case Ripley invented. I
read this section and judged it sound because the *architecture* is a
singleton (true), without separately checking whether *temporal
separation between requests* could still produce a skew (also true, and
the actual risk). Same category of miss as Finding 1 — I verified the
static fact and missed the timeline argument.

**Finding 4 (hook doesn't abort in-flight requests) — independently
confirmed against source, not just taken on Ripley's word.** I read
`src/hooks/useAuroraDecision.js` this round: `keyRef.current !== requestKey`
only gates whether the *result* is applied to state (`return;` before
`setOutcome`/`setStatus`) — the underlying `fetch` in
`performAuroraDecisionFetch` has no `AbortController`/`signal` at all, so
the network request itself keeps running to completion even after the
component has moved on to a different key. Ripley's correction ("rejects
obsolete results but does not abort requests") is exactly right, and it's
a fair catch — nothing in `data-audit.md` explicitly claimed abort
behavior, but the "race cancellation" framing in §4 could read that way if
not checked against the actual hook body.

**Finding 3 (issue already specifies landing/Free scope) — could not
independently verify this round.** `WebFetch` on the issue URL
(`github.com/robertmarvin72/icelandic-weather/issues/423`) was blocked by
a provenance/approval gate I couldn't clear in this session (same category
of restriction encountered earlier on ticket-417's live-site checks), and
I have no `gh` CLI access on this device. I can't independently confirm
"Phase 5" text or the exact Free/Pro split Ripley describes. What I *can*
confirm: the correction's requested Free/Pro split (Free: general 3-night
outlook + best-night summary; Pro: detailed locations/ranking/map) is
architecturally plausible against existing code — `selectAuroraDisplay`
already separates `qualifyingLocations` (computed identically for both
tiers) from `showRanking` (Pro-gated presentation only), which is exactly
the kind of split a "coarse-for-Free, detailed-for-Pro" multi-night summary
would reuse. This doesn't prove Ripley's issue-text claim, but it means the
correction isn't asking for something structurally foreign to the codebase.
I'm treating this finding as Ripley's to stand behind (issue-text access is
Ripley's side of this workflow's division of labor), and flag only that I
personally couldn't cross-check it.

### Does the Round 2 correction prompt actually fix all four items?

- **Item 1** (Shape A/B matrices) directly targets Finding 1: requires
  explicit request/response/orchestration/cache-hook change matrices,
  states A is the real zero-backend-change option (≤18 calls), states B
  needs a genuine contract change to return multiple decisions from six
  calls, and explicitly bars "no client-side scorer or claim that
  extending dates alone yields three API results" — this closes the exact
  gap I missed.
- **Item 2** (comparison policy) directly targets Finding 2: asks for a
  concrete policy for mismatched `sourceFetchedAt` including "calls
  straddling refresh," explicitly bars assuming singleton implies shared
  snapshot across independent responses, and asks for example
  timelines/tables — this will force the corrected audit to reproduce the
  exact request-interleaving scenario Ripley (and I, on review) identified.
- **Item 3** (surface/entitlement correction) narrows the open question
  correctly — from "should landing get multi-night at all" to "how is
  Icelandic access provided" — while explicitly preserving existing map
  visibility constraints and barring an invented route or homepage-scope
  expansion. Properly scoped even though I can't verify the issue-text
  premise myself.
- **Item 4** (factual wording) matches my own independent read of the hook
  exactly, and separately corrects the Open-Meteo `generationtime_ms` and
  SQL-comment overclaims — both narrow, accurate, non-speculative asks.

### Scope discipline

The prompt stays audit-only throughout: no new provider probes, DB
reads/writes, or cron invocations; no new tests/libraries/backend/scoring
changes; no commit/push/deploy; explicitly instructs appending a Round 2
cc-report rather than overwriting history, and preserving `approved-v1` as
immutable with `approved-v2` created fresh. This is the same
two-round-correction pattern already used successfully on ticket-417.

### Verdict

**APPROVED.** Ripley's three substantive findings are real — I
independently re-derived two of them from the audit text and source myself
(and own that I missed both in my own Round 1 PASS), confirmed the fourth
factual correction directly against `useAuroraDecision.js`, and could not
independently check the third (issue-text) but found nothing in the
codebase that contradicts it. The correction prompt's four items map
cleanly onto all four findings, stay inside the Phase 1 read-only boundary,
and correctly preserve rather than erase review history. Ready for
`approved-prompt-v2.md` and `READY_FOR_CC`.

## Ripley Round 2 handoff — 2026-09-25

Jonesy APPROVED. Created approved-prompt-v2.md from the approved four-item correction, preserving v1. The issue's landing-page/Free-summary requirements were verified by Ripley's successful gh issue view during preflight; Jonesy's access limitation does not change those requirements.

Process note: Jonesy had already set CURRENT to READY_FOR_CC while it still referenced executed v1 and a not-yet-created v2. Completed the required Ripley consolidation now and replaced that incomplete pointer with the actual v2 file before handoff. No CC execution was inferred from the premature stage label. No production changes made.
## Ripley Round 3 — bounded comparison-policy correction — 2026-09-25

Discussion/review only. Do not execute until Jonesy APPROVED and Ripley creates approved-prompt-v3.md. The accepted architecture and surface findings are not reopened. Documentation only; no production changes, new tests, provider probes, DB access, cron, commit, push or deployment. Preserve approved v1/v2 and prior reports/reviews.

Correct data-audit.md §5 into one internally consistent decision table. Use this concrete conservative recommendation for Phase 2 review (not implementation authorization):

- Pending requested nights: preserve each resolved night's usable details, but show comparison pending and emit no final best-night or all-three-poor conclusion/event.
- Zero scored nights: show unavailable/no-darkness reasons, never low chance or best night.
- One scored night: show its outlook as the only available result; no cross-night winner. Missing nights remain unknown.
- Two or more scored nights: a definitive comparison requires equal non-null aurora sourceFetchedAt and the same complete configured candidate set successfully scored in every compared night. Compare existing scores/bands only after those checks. Keep stale data within existing validity rules and visibly identify stale results; never infer Open-Meteo issuance consistency from aurora timestamps.
- Mismatched snapshot timestamps or incomplete/different successful candidate sets: keep per-night results, visibly say a reliable best-night comparison is unavailable, and suppress definitive winner/all-three-poor claims. No silent warning-only qualifier. This deliberately separates useful per-night results from comparable nights; no rescoring or new backend fields assumed.
- All-three-poor copy is permitted only when all three requested nights are resolved, scored, comparable as above, and each has the existing poorest band. If only a subset is available, copy must explicitly limit its claim to those available nights; unknown nights never count as poor. Preserve no-darkness as its own state.
- Keep exact/near-tie product policy explicitly proposed and unresolved; do not introduce a tolerance constant or modify scoring in this audit.

Include table examples for: all pending; zero scored; one poor plus two missing; two scored plus one pending; three poor with complete comparable data; a missing candidate on one night; identical incomplete candidate sets; refresh-straddling timestamps; and comparable but stale results. Distinguish final comparison eligibility from within-night usability in every row. Update the proposed test list to match this table, without running or adding tests.

Remove the contradictory production-DB prerequisite from §9: schema deployment remains unverified operational context, not a gate to writing/reviewing Phase 2 code. Remove unsupported git-history preservation claims; prior approved prompts and review/report history are retained, not necessarily the original audit text. Attribute the literal landing-page requirement to the issue and `/en/northern-lights` route identification to source inspection.

Read existing source only where needed to verify fields/bands. If the existing response cannot support the proposed candidate-completeness check, document the exact missing evidence and required Phase 2 contract consideration instead of claiming it can. Append CC Round 3 report with corrections and remaining decisions. Follow READY_FOR_CC → CC_IN_PROGRESS → CC_COMPLETE when executing the eventual approved v3. Phase 2 still needs its own reviewed implementation prompt.

## Jonesy review — Round 3

**APPROVED.**

### Independent verification of Ripley's Round 2 findings

I re-checked both substantive findings and both supporting inconsistencies
against the exact text I'd already read in `data-audit.md`, rather than
taking the REVISE at face value.

**Finding 1 (contradictory zero-data/all-poor rule) — confirmed, and this
is a miss in my own Round 2 PASS.** The "All-poor state" subsection reads:
"If all 3 nights that reach 'scored' fall in the lowest band(s) (**or if
zero nights reach 'scored' at all — see below**), the surface must say so
plainly... e.g. 'Low chance across the next three nights'." A few
paragraphs later, the cross-night rule states the opposite: "If zero
nights reached 'scored', there is no best-night claim at all — show each
night's own unavailable/no-darkness reason, never a synthesized 'best of
nothing.'" These two sections directly contradict each other — one says
zero data still produces the substantive claim "low chance," the other
says zero data produces no claim at all. I read both sections in my Round
2 review and evaluated each in isolation against source/logic; I didn't
cross-check them against each other. That's exactly the kind of gap a
single-pass, section-by-section read misses.

**Finding 2 (incomplete cross-night eligibility for differing candidate
sets) — confirmed, and also a miss on my part.** The "Partial candidate
sets" bullet only restates *within-night* isolation ("a night can still
be scored from whichever locations succeeded... needs no new logic") and
never addresses the case where night A's full 6-location set succeeds
while night B loses exactly the location that would have scored best —
comparing A's best against B's best in that case isn't a fair comparison,
and the document never says so. I re-read `rankDecision.js` and
`fanout.js` this round specifically to check whether this is even
detectable: `buildRankedDecision` returns `excluded` as
`{locationId, name, status, reasons}` per failed location, alongside
`best`/`alternatives` each carrying `locationId` — so a client comparing
two nights' responses genuinely can compute "did the same full candidate
set succeed in both," using fields that already exist today. That matters
for evaluating the Round 3 prompt below: it isn't asking for something
technically unsupported.

**Supporting inconsistency 1 (DB-check still framed as a prerequisite) —
confirmed.** §9 item 1 says "Must be confirmed against real Neon
production before Phase 2, **as an implementation prerequisite check**" —
that's still gating language, despite the same revision explicitly saying
elsewhere that production schema status shouldn't be treated as a Phase 2
blocker. A real wording contradiction, and one I read past without
noticing the "prerequisite" framing was itself the leftover gate.

**Supporting inconsistency 2 (unsupported git-history claim) — confirmed,
and this one I should have caught without needing device access.** The
revision note says Round 1's original text "remains available via git
history." But `cc-report.md`'s own Round 1 *and* Round 2 sections both
explicitly state "Not committed. Not pushed." — nothing in this task
directory has ever been added to git, so "git history" cannot be
preserving anything. I had already read both of those facts earlier in
this same review chain; catching the contradiction didn't need `git
status`, just comparing two things I'd already read against each other. I
missed it.

### Does the Round 3 correction prompt fully fix all four?

- **Zero/one/pending/two-or-more scored-night rules** are now mutually
  exclusive and exhaustive, with "pending" added as its own state (not
  previously named): pending nights show usable per-night detail but
  explicitly emit no best-night/all-poor conclusion. Zero scored nights is
  now unambiguously "never low chance or best night." This directly
  resolves Finding 1 — there's no longer a version of "zero data" that
  produces a substantive claim.
- **The "≥2 scored nights" comparability gate** — "equal non-null aurora
  `sourceFetchedAt` **and** the same complete configured candidate set
  successfully scored in every compared night" — directly resolves
  Finding 2, and (per my check above) is buildable from fields the
  response already returns, not a fabricated capability. The explicit
  fallback instruction ("if the existing response cannot support the
  proposed check, document the exact missing evidence instead of claiming
  it can") is the right honesty guard even though, in this case, the
  check is actually supported.
- **"No silent warning-only qualifier"** for mismatched timestamps or
  incomplete/differing candidate sets directly closes the "leaves a
  silent internal flag as an option" gap Ripley named — visible disclosure
  is now the only allowed treatment, not a choice deferred to Phase 2.
- **All-three-poor gated on full resolution+scoring+comparability+poorest
  band, with partial subsets required to explicitly scope their claim** —
  closes the remaining edge case (e.g. one poor night plus two missing)
  that the old rule didn't distinguish from a genuine three-night poor
  verdict.
- **§9 DB-prerequisite wording and the git-history claim** are both
  directly targeted for removal, with correct replacement language given
  inline ("not a gate to writing/reviewing Phase 2 code"; "prior approved
  prompts and review/report history are retained, not necessarily the
  original audit text") — accurate given what's actually true here.
- The nine required table examples (all pending; zero scored; one poor +
  two missing; two scored + one pending; three poor complete comparable; a
  missing candidate on one night; identical incomplete candidate sets;
  refresh-straddling timestamps; comparable-but-stale) map onto real
  distinct branches of the corrected rule, not padding — each one forces a
  genuinely different combination of the eligibility checks above.

### Scope discipline

Explicitly does not reopen the already-accepted Shape A/B and
landing-page/Free-Pro findings from Round 2. Documentation-only throughout:
no new tests, provider probes, DB access, cron, commit, push, or
deployment; "read existing source only where needed to verify
fields/bands" keeps this bounded rather than re-running the full audit.
Requires `approved-prompt-v3.md` and preserves v1/v2 and all prior
review/report history, consistent with the pattern used in both earlier
rounds.

### A note on the pattern here

This is the third time in this ticket that Ripley's final assessment has
caught something my review missed. The first two (Shape B's contract gap,
the cross-night freshness race) were reasoning gaps in single sections;
this round's misses were both cross-section consistency gaps — text that
was individually defensible but contradicted something stated elsewhere
in the same document. For a document this dense (40KB+, many interacting
rules), I'm going to explicitly cross-check related claims against each
other, not just against source, going forward — not just re-read harder.

### Verdict

**APPROVED.** Both substantive findings are real and independently
reconfirmed against the exact document text; both supporting
inconsistencies are real, one of them checkable purely from things already
stated elsewhere in this task's own files. The Round 3 correction prompt's
decision table resolves the contradiction cleanly, closes the cross-night
candidate-completeness gap with a rule I've confirmed is technically
buildable from the existing response contract, and correctly narrows
scope rather than reopening settled findings. Ready for
`approved-prompt-v3.md` and `READY_FOR_CC`.

## Ripley Round 3 handoff — 2026-09-25

Jonesy APPROVED without required changes. Created approved-prompt-v3.md from the reviewed Round 3 correction, preserving v1/v2. CURRENT now points to v3 as the sole active execution prompt. Phase 1 documentation only; Phase 2 implementation is not authorized.

Process note: Jonesy had prematurely set READY_FOR_CC while v3 did not yet exist. Ripley completed the required approved-file creation and pointer consolidation before handoff; no execution was inferred from the premature stage.


## Ripley Phase 2 implementation prompt — Round 4 — 2026-09-25

**Discussion/review only.** Phase 1 is PASS. Owner requested implementation-prompt preparation and explicitly approved: (1) near ties mean at most 5 points out of 100, presentation only; (2) ship the three-night view on the existing English landing page first, preserve homepage tonight behavior, provide EN/IS translation keys. Await Jonesy's review; no approved implementation prompt exists yet. Eventual approval must create approved-prompt-v4.md; never execute v1/v2/v3 again.

Issue: https://github.com/robertmarvin72/icelandic-weather/issues/423

### 1. Scope and audited implementation choice

Implement issue Phases 2–5 using **Shape A**, three existing single-evening API requests, the same six configured candidates for both tiers, canonical server scoring unchanged. Existing parser/storage/date-aware orchestrator already support each evening. Up to eighteen Open-Meteo requests on a cold complete three-night load is an accepted cost of this proposed scope, not six; existing five-minute per-key promise reuse remains. No backend batching, new endpoint, provider, library, SQL, cron or forecast-input changes. Do not refetch merely because a user switches tabs. Do not copy the scorer into the browser.

Preflight evidence re-read by Ripley: useAuroraDecision.js, auroraDecisionCache.js, auroraDecisionClassify.js, auroraDisplaySelection.js, NorthernLightsCard.jsx, NorthernLightsLanding.jsx, auroraSeason.js, auroraVisualState.js; issue fetched with gh issue view 423. The actual translation file is src/i18n/translations.northernLights.js (earlier audit suggestions of translations.common.js are not the current owner of these strings). Existing hook rejects obsolete completions but returns old outcome/status until its effect runs after a key change; this requires identity-safe presentation for date rollover, not an assumption that keyRef alone solves it.

Read AGENTS.md, CLAUDE.md, docs/ai/README.md, CURRENT.md, accepted data-audit.md and Ripley's final Phase 1 assessment before implementation. Confirm current source still matches these data-flow assumptions before writing. If it would require backend/entitlement/scoring changes, stop and report the specific conflict instead of broadening scope.

### 2. Reachability and UI composition

Existing entrypoint: /en/northern-lights in AppRoutes.jsx. The page remains forced-English regardless of saved language; no new route or homepage expansion. Add compact three-night controls to its current Northern Lights module. Preserve the default homepage card's one-night request and presentation, existing seasonal visibility, dark card design and upgrade wiring. Outside the existing current-date Aurora season, no Aurora request is made and the existing off-season landing state remains. When currently in season, the three requested evenings may cross a month/year/season boundary; evaluate their real API outcomes rather than inventing darkness from the month.

Prefer a small landing-only controller/view with reusable existing selected-night rendering. Do not mount three full NorthernLightsCards (three maps and duplicate effects), and do not mount an extra fetch-owning selected card that repeats the controller's requests. Refactor the shared card narrowly into data-owning wrappers and reusable presentation if needed; preserve homepage defaults and callbacks. One set of ranked results and at most one map instance are rendered for the selected night. Keep React hooks unconditional; three fixed hook calls are allowed, hooks inside a loop are not.

The selector contains tonight, tomorrow night, and localized weekday/date for day 2. All three slots remain selectable, including pending/unavailable, so their reason/retry can be reached. Default to tonight; async completion never changes a user's selection to the best night. Use real buttons with aria-pressed and visible keyboard focus (or a complete accessible tabs implementation). Selected heading, overall band, reasons, best location, ranking, map and timestamp must all reflect the same selected evening. A summary CTA may select a unique recommended night and open its existing details; its label must name that night. Do not introduce a second paywall or three large cards.

### 3. Date-aware client model and request identity

Build three consecutive UTC evening dates from one captured clock reading: today + 0/1/2 calendar days, using existing todayEveningUtc conventions. Model each slot as its date, request identity, loading/resolved state, canonical classification/body and retry action. This is an adapter over existing responses, not the illustrative TypeScript issue model; do not fabricate auroraActivity, updatedAt, score or viewingWindow fields absent from the response. The server already selects each night's own XML activity, darkness and weather window by evening.

Reuse the six AURORA_CANDIDATE_LOCATION_IDS and existing cache key normalization/TTL. Entitlement must never affect dates, candidates, requests or aggregation. Inactive homepage extra slots must cause zero extra requests. A selected slot's loading/error state must never display another slot's prior success. An outcome is usable only when bound to its exact current request identity; fix the shared hook's returned identity if necessary with targeted regressions, or isolate controller instances by the full three-date/candidate identity. Match success bodies to requested evening as an additional guard. Old completion after rollover/unmount/retry must not replace newer results; cover same-key retry ordering if hook changes touch it.

Handle UTC day rollover while the page stays open: recompute on a bounded next-midnight timer and on tab visibility return, with cleanup and injectable clock for tests. Preserve a selected calendar date if still in the new window, otherwise reset to tonight. No periodic forecast polling; use existing caching and explicit retry. A retry invalidates only the intended key; while it loads, final comparison is pending. No automatic refresh loop attempting to force equal snapshot timestamps.

### 4. Pure cross-night presentation policy

Create a small pure helper consuming canonical classified responses and configured IDs. It never changes scores, canonical bands, within-night ordering, weather input or server verdicts. Each night's comparison value is its canonical best.score/band. Validate usable finite score/known band/date before comparing; missing/malformed data cannot win. Use raw best + alternatives for completeness (not the Pro-gated qualifying display list), requiring exactly the complete expected ID set with no excluded candidates for every compared night.

Apply this precedence explicitly:

1. Any requested slot pending: per-night results remain usable but final comparison says pending. No winner or final all-three-poor event/copy.
2. All resolved, zero usable scored nights: own unavailable/no-darkness/error states; never low chance.
3. Exactly one usable scored night: its outlook only, explicitly the only available result, no cross-night winner.
4. Two or more usable nights: require equal non-null valid auroraCache.sourceFetchedAt AND complete configured candidate sets in every usable night. If either fails, visibly say a reliable best-night comparison is unavailable; retain each night's own result. Do not silently drop an incomplete scored night to manufacture a winner among the others.
5. Eligible comparison: unavailable nights remain unknown. With only two usable nights, label conclusions as among available nights. Stale-but-usable results retain current stale policy and visible disclosure. Matching Aurora retrieval timestamps do not prove matching weather-model issuance.
6. If all three nights are eligible and very-poor, the issue's all-three low-chance copy is allowed. Also handle the distinct case where all eligible nights are poor/very-poor with no fair/good/excellent: show no favorable conditions among available nights, never promote the least bad night as a recommendation. Only claim all three when all three are usable and eligible. This presentation rule reuses existing non-qualifying bands; no thresholds change.
7. Otherwise, the top-score group contains every eligible night whose score is within **5 points inclusive of the maximum**. Compare against maximum, not transitive pairwise chaining. Two or more in this group -> similar conditions, list their dates without a unique winner; 0 difference is an exact tie. A sole top night -> best conditions expected on its date, qualified to available nights when needed. Never claim guaranteed visibility. Canonical bands stay unchanged even when a near tie crosses a band boundary. If a near-tie group includes a non-qualifying night, neutral similarity wording must not describe that night as favorable.

The accepted audit's nine examples remain acceptance cases; clarify that all-three means literally all three requested slots and pending always wins over any final subset conclusion.

### 5. Selected-night display, Free/Pro and freshness

Free sees all three coarse canonical outlooks and comparison summary. Pro gets the existing selected-night detail presentation. Preserve isFeatureAvailable/features.js and selectAuroraDisplay's existing limits: only fair/good/excellent qualify, cap six, map only with at least two qualifying locations and two distinct canonical bands. Poor-state Pro details remain the existing clearly labeled best-of-poor treatment; no new poor rankings/map. Free must not leak location names, coordinates, ranked items, detailed reasons or map data through DOM, attributes, accessibility labels or hidden content. No entitlement/payment/checkout attribution changes.

Audit every reused visible string for tonight references: title, subtitle, headline/body, best-location label, no-darkness copy, CTA and any map labels. Future-night selections must read the correct date or date-neutral wording. Add EN and IS keys in translations.northernLights.js; do not globally replace tonight copy used by the homepage. Preserve excellent pill styling from #414.

Show the actual Aurora sourceFetchedAt for each resolved night's data, labeled as Aurora data update time (not weather issuance). Never use fetch completion/Date.now as source update time. Unavailable timestamp stays absent or clearly unknown. Show existing stale treatment on usable stale results; avoid presenting expired cached classification as fresh merely because the browser stayed open. Do not alter server freshness thresholds; make freshness presentation truthful on subsequent render/visibility return using existing policy or invalidate/reload expired local presentation without new polling. If this cannot be achieved within the existing contract, report the exact limitation rather than inventing a timestamp.

### 6. Analytics

Use trackEvent only. Keep existing event names, click forwarding and homepage behavior. Existing selected-detail exposure events must correspond to the selected visible content, never background-loaded other nights. New events are landing multi-night only:

- northern_lights_night_selected: once on deliberate selection of a different date (including summary CTA selection), not initial/default/rollover selection or repeat click. Params selected_date, days_ahead (0/1/2), forecast_status (canonical classification.primary, or loading for pending), user_tier (free/pro).
- northern_lights_best_night_viewed: only when a unique eligible favorable best-night statement is actually displayed. No event for pending, tie/similar, unavailable, sole-available or no-favorable state. selected_date identifies the recommended date, not an unrelated selected tab. Deduplicate by displayed recommendation identity (date, comparison tone, available-date set) during this mounted view; no duplicate on rerender, individual fetch completion, tier resolution or tab switching. Do not use raw snapshot timestamp alone to generate another view event.
- northern_lights_multi_day_upgrade_clicked: once per actual existing upgrade click inside this multi-night module, with the selected slot's date/status and real tier. Preserve existing upgrade events and source callback; those are separate semantic events. Do not attach this event to unrelated page CTAs outside the module.

Resolve entitlement loading truthfully before new viewed events; do not record a premature free guess while useMe is loading. Keep metadata bounded and free of PII. Tests must distinguish recommendation date from selected date where relevant.

### 7. Verification and deliverables

Add meaningful tests for new behavior; do not rewrite working scorer/parser tests merely to mirror unchanged implementation. Reuse existing fixtures following the actual hook response contract. Required checks:

- Three distinct dates and POST evening payloads, identical Free/Pro requests, correct each-night canonical score/window association, no fourth selection fetch, cache/StrictMode reuse. December 31 rollover and midnight/visibility reset, delayed old responses, error/retry, season disabled -> zero requests, homepage -> one night only.
- All nine accepted audit table examples plus two usable/one unavailable, invalid/missing timestamp, duplicate/missing candidate IDs, timestamp refresh boundary, no-favorable poor + very-poor combination, score gaps 0/5/>5, near-tie across canonical bands, non-transitive grouping, sole available night and pending overriding every final result.
- Real component integration: selecting dates changes headline, reasons, rank list and map props atomically; at most one map; visibility constraints unchanged; unavailable selection never retains prior map; Free DOM contains no detailed location data; forced EN with saved IS; both new translation dictionaries populated; default homepage unchanged.
- New analytics exact payloads/counts, no mount selection event, no false winner events, rerender/StrictMode/completion dedupe, selected-vs-recommended date distinction, actual upgrade callback/source preservation.
- Run targeted Aurora suites (existing Phase 1 baseline was 23 files /256 tests; report actual new totals), including any new suites. Run npm run build and lint changed JS/JSX files. Run broader existing checks only if dependencies/refactoring justify it; document pre-existing failures separately.
- Browser verification with deterministic API stubs and real components on /en/northern-lights: 375px mobile and desktop, Free and Pro, three distinct dates, keyboard selection, overflow, map synchronization, loading/unavailable/stale/tie. Inspect the browser result; capture useful screenshots. Never claim a browser check from unit tests. No live provider/DB/cron needed for fixture validation; record live-provider validation as unverified if not run.

Keep changes limited to Aurora frontend components/helpers/hooks, existing translations, targeted tests and this task's docs. Tests may exercise existing server/date code without modifying production backend. No new libraries/TypeScript/import extensions. No unrelated refactors. Update outdated comments about landing/default behavior when changing that behavior. Report exact changed files, tests/commands, request cost, browser evidence and remaining limits.

### 8. Workflow and STOP conditions

Only execute after Jonesy APPROVED and CURRENT references approved-prompt-v4.md at READY_FOR_CC. Set CC_IN_PROGRESS first; append Phase 2 implementation report to cc-report.md preserving Phase 1 history; set CC_COMPLETE with report path. Jonesy appends Phase 2 result review to result-review.md. No commit, push, deployment or GitHub closure.

STOP if implementation requires changing canonical scoring/bands/thresholds (the owner-approved 5-point comparison-only tolerance is explicitly allowed), backend contract/parser/storage/provider/cron, shared weather inputs, candidates, entitlement/pricing/checkout, a new language route/homepage expansion, or scope beyond these frontend boundaries. State evidence and smallest proposed revision. Unverified production DB status alone is not an implementation blocker. Do not rerun the completed Phase 1 audit. No further owner approval gate for routine frontend implementation choices within this prompt after Jonesy's approval.

## Jonesy review — Round 4 (Phase 2 implementation prompt)

**APPROVED, with 1 non-blocking note.**

This is the first prompt in this ticket that authorizes actual production
implementation, so I reviewed it more heavily than a documentation-only
correction — independently reading the component/hook/lib source this
prompt is built on, not just checking the prose for internal consistency.

### Independent verification against live source

- **`NorthernLightsCard.jsx` (read in full).** Confirms the proposed
  controller/wrapper architecture is genuinely supported, not hand-waved:
  `AuroraResult`/`AllPoorResult`/`LandingLockedValue`/`StaleParialNotices`
  are already pure presentational components driven by derived props
  (`classification`, `display`, `visualTokens`, `isPro`, `variant`), not
  raw hook state — so a landing controller computing those same derived
  values per selected night and handing them to the *same* components,
  rather than mounting three full cards, is architecturally real, not
  aspirational. Confirms `seasonActive = isAuroraSeason(now())` gates the
  hook's `enabled` and the component returns `null` entirely when out of
  season — exactly matches "outside the existing season, no Aurora request
  is made." Confirms `AURORA_CANDIDATE_LOCATION_IDS` and
  `isFeatureAvailable("northernLights", ...)` are used exactly as the
  prompt describes reusing them.
- **`useAuroraDecision.js` (re-checked).** The prompt's preflight claim —
  "rejects obsolete completions but returns old outcome/status until its
  effect runs after a key change" — is accurate: `outcome`/`status` are
  plain `useState`, only reset inside the `useEffect` keyed on `key`, so
  there's a real render where the key has changed but the previous night's
  `outcome`/`status` are still what's displayed, before the effect fires.
  This is a genuine one-frame stale-data risk the prompt correctly
  requires "identity-safe presentation" to cover, not something `keyRef`
  alone solves (`keyRef` only protects which *result* eventually gets
  written to state, not what's shown in the render before that happens).
- **`auroraDecisionClassify.js`/`auroraSeason.js` (read in full).**
  `isAuroraSeason` is evaluated once against "now," not per-evening — so a
  client-side per-night season gate genuinely doesn't exist today, and the
  prompt's instruction to "evaluate real API outcomes rather than
  inventing darkness from the month" for a 3-night span crossing a
  season/month boundary is the technically correct call, not an
  arbitrary caution.
- **`auroraScoring.js`'s `BANDS`** (very-poor ≤20, poor ≤40, fair ≤60,
  good ≤80, excellent ≤100 — 20-21 points wide each) confirms the §4
  item 7 near-tie caveat is grounded in real numbers, not theoretical: a
  5-point tolerance window genuinely can straddle a band boundary (e.g.
  58 vs 61) and genuinely can include a non-qualifying `poor`/`very-poor`
  night alongside a qualifying one near the 40/41 boundary — exactly the
  two cases the prompt explicitly calls out and guards against.
- **`AppRoutes.jsx`** confirms `/en/northern-lights` is a single existing
  route with no `/is/` counterpart nearby — matches "no new route."
- **`translations.northernLights.js`** genuinely contains the card's
  existing keys (`nlCardTitle`, `nlBestTonight`, etc.) — confirmed via
  grep that these don't also live in `translations.common.js` — so the
  prompt's correction of the earlier audit's file-path suggestion is
  accurate, not just asserted.

### Consistency with the closed Phase 1 audit

Every previously-open decision from `data-audit.md` §9 is now explicitly
resolved rather than left ambiguous, and none of the resolutions
contradict the accepted audit findings: Shape A is chosen explicitly (18
calls, zero backend changes — matches the audit's corrected Shape A/B
matrix exactly); the near-tie tolerance is the owner's own explicit
5-point decision, not something this prompt invented; landing scope is
narrowed to "EN first, no new route, no homepage expansion," matching what
Ripley's Round 3 assessment said still needed settling; hook architecture
is resolved as "3 fixed call sites... or isolate controller instances by
full identity," consistent with the audit's Shape A framing. The DB-status
STOP-condition wording ("not an implementation blocker") matches the
Round 3 correction exactly rather than reintroducing the gate Ripley had
removed. The precedence rules in §4 are the accepted nine-example decision
table translated into implementation language, not a rewrite of it.

### Non-blocking note

`NorthernLightsCard.jsx`'s `detailsExpanded` state is a single boolean
persisted under one fixed `sessionStorage` key
(`DETAILS_EXPANDED_KEY = "nl_details_expanded"`), shared across the whole
card — not keyed per night. The prompt doesn't say whether switching the
selected night should reset this (so a Pro user who expanded night 1's
ranking doesn't see a stale-context "expanded" panel snap open for night 2
before its own data is ready) or intentionally persist it. Given
§3's identity-safety requirements should prevent this from becoming a
data-correctness bug (the content inside, once shown, will be tied to the
correct identity), this is a UX-polish gap, not an architectural one — but
worth CC making an explicit, stated choice about rather than leaving it as
an accidental side effect of reusing the existing component unchanged.

### Everything else

Scope is unusually explicit for a prompt this size: §7's boundary ("Aurora
frontend components/helpers/hooks, existing translations, targeted tests
and this task's docs... no unrelated refactors") and §8's STOP conditions
(scoring/bands, backend contract, candidates, entitlement/pricing, new
route/homepage expansion) leave little room for scope drift, and the
"stop and report the specific conflict instead of broadening scope"
instruction in §1 is exactly the right failure mode given this ticket's
history. The analytics section correctly extends the existing
`(requestKey, primary)`-style dedup pattern already used by
`northern_lights_card_viewed` rather than inventing a new one. The
acceptance-test list in §7 maps directly onto the nine accepted audit
examples plus the additional edge cases §4 introduces (band-boundary near
ties, non-transitive grouping) — nothing in the test plan is disconnected
from a specific rule stated earlier in the prompt.

### Verdict

**APPROVED.** This is a large, first-time production-implementation
prompt, and I verified its architectural claims against the actual
component/hook/lib source rather than trusting the prose — the proposed
controller/wrapper approach, the identity-safety concern, the season-
gating nuance, and the band-boundary near-tie caveat are all grounded in
real code, not asserted. It correctly resolves every previously-open
Phase 1 decision without contradicting the accepted audit, and scope/STOP
discipline is thorough. Ready for `approved-prompt-v4.md` and
`READY_FOR_CC`. Given this will be the first actual code change in this
ticket, I'll review CC's result report against source at least as
rigorously as this prompt review, not more lightly just because the audit
phase is behind us.

## Ripley Round 4 handoff — 2026-09-25

Jonesy APPROVED with one non-blocking disclosure-state note. Created approved-prompt-v4.md from the reviewed implementation prompt. Consolidated that note by explicitly preserving expanded/collapsed preference across landing night changes while guarding all rendered content by the selected identity; homepage persistence remains unchanged. This is a routine UI choice within the approved scope, not a new approval gate.

Process note: Jonesy again set READY_FOR_CC before the approved file existed. Ripley created v4 and consolidated CURRENT to its actual path before handoff; no execution was inferred from the premature stage. v1/v2/v3 remain historical audit prompts.


## Ripley Round 5 — Phase 2 implementation corrections — 2026-09-26

Discussion/review only. Owner confirmed returning to Jonesy review for the #423 corrections before #425. Read approved-prompt-v4.md and Ripley's Phase 2 REVISE in result-review.md. Preserve v1–v4 and all previous history. The implementation exists in the uncommitted working tree: correct it narrowly, do not restart it or implement #425. After Jonesy approval Ripley must create approved-prompt-v5.md; this section is not executable by itself.

### Required corrections

1. **Truthful update time and aging.** Show each resolved slot's actual auroraCache.sourceFetchedAt as Aurora data update time, including fresh and poor results, with truthful unavailable/unknown handling. A selected-night timestamp must switch with its date. Do not invent weather issuance or use fetch completion as source time. On render and visibility return, derive presentation usability from actual current age using the existing inclusive <=480 fresh / <=1440 stale / >1440 unavailable policy. A bounded timer at the next freshness boundary is allowed, with cleanup; no periodic provider polling or refresh loop. Keep server response immutable, existing backend constants/semantics unchanged, and expired data out of comparison/ranking/map until refreshed via existing retry. Reuse policy through a safe client-compatible boundary or prove parity with existing server boundaries; do not bundle server/DB code into the frontend. Missing/malformed timestamp cannot support a fresh result or a winner. Add fake-clock tests for boundaries, same-day visibility return, selected-date timestamp and expired comparison suppression.

2. **Restore the existing landing analytics and checkout attribution.** The replaced landing card previously emitted northern_lights_card_viewed, northern_lights_unavailable_viewed, northern_lights_stale_viewed, northern_lights_details_opened, northern_lights_ranking_viewed, northern_lights_map_viewed, northern_lights_upgrade_clicked and northern_lights_landing_cta_clicked. Restore their actual selected-content/click exposure semantics and original payload fields, with meaningful request/date identity dedupe and no firing for background nights or hidden ranking/map. Preserve truthful entitlement loading. The module upgrade CTA must forward the existing northern_lights_card source and emit the two existing upgrade/landing-card-click events plus the new multi-day click event once each. Keep the separate lower-page value-section CTA unchanged. Correct the test that currently asserts the legacy event must not fire. Reuse shared event handling where practical without broad refactoring. Add integration tests for selected exposure, retry/rerender dedupe, gated map/ranking, source forwarding and all click event payloads. The homepage behavior remains unchanged in #423.

3. **Readable canonical outlooks and accessibility.** Render visible localized coarse outlook text for each of the three dates, including loading/unavailable/no-darkness. Color alone (currently aria-hidden dots) does not satisfy the overview requirement. Preserve the precise excellent label/purple styling from #414 in the selected-night pill and overview; do not collapse excellent into a generic good indicator. The computed pillLabel must actually be rendered. Keep EN/IS translation parity, compact mobile layout and Free location-data restrictions. Use a labelled button group with aria-pressed, or a complete keyboard/ARIA tabs pattern; do not retain role=tablist containing ordinary toggle buttons. Test accessible names/status text, excellent distinction, keyboard selection and <=1 map. Inspect actual mobile/desktop screenshots after these changes.

4. **Scope incomplete comparisons honestly.** Consume comparison.scopedToAvailable in best/similar/tie UI copy. If one requested night is unavailable, explicitly limit the conclusion to the available nights; never imply the unavailable night lost. Preserve pending precedence, sole-available handling, all-poor rules and the owner-approved inclusive 5-point comparison-only tolerance. Add real translated component tests with two usable/one unavailable for both unique-best and similar outcomes.

5. **Narrow completeness guard.** Reject duplicated successful location IDs even when the response also includes every expected ID (Set equality alone misses this). Keep per-night usability distinct from cross-night eligibility. Add duplicate-plus-complete and duplicate-replacing-missing cases; no change to canonical candidate roster or scoring.

### Validation, evidence and limits

Run the seven targeted suites independently rerun by Ripley (auroraMultiNightPolicy, auroraNightLabel, useAuroraThreeNight, NorthernLightsThreeNight, NorthernLightsCard, NorthernLightsLanding and NorthernLightsLanding.cardWiring), plus any new freshness/analytics tests and affected existing Aurora tests. Ripley's current baseline is 7 suites /130 passing tests; this does not prove the missing behavior. Run changed-file lint and production build. Browser-check deterministic fresh/stale/expired, partial comparison, excellent overview and Free/Pro states at 375px and desktop. Record commands and exact results, distinguish new browser checks from old screenshots and unit tests, retain useful evidence. Live provider/DB/cron validation is not required or authorized here. No claim of a 741-test NorthernLightsCard suite: report actual counts from the command executed.

Append Round 5 to cc-report.md, with each correction mapped to source/tests and explicit remaining limitations. Preserve prior reports verbatim; correct earlier overclaims through the new report, not rewriting history. No production backend, scoring weights/bands, provider/cron, candidate, entitlement/pricing changes; no homepage three-night UI/link/query handoff (#425), new routes, libraries or TypeScript. No commit/push/deploy/issue closure. Follow READY_FOR_CC -> CC_IN_PROGRESS -> CC_COMPLETE only after v5 exists and CURRENT references it. Jonesy reviews this prompt only and must leave CURRENT at PROMPT_REVIEW; Ripley creates the approved file and READY_FOR_CC handoff.

---


## Jonesy review — Round 5 (Phase 2 correction prompt)

**APPROVED.**

I re-verified all four of Ripley's REVISE findings plus the robustness note
directly against the actual shipped source I already had from Round 4 —
not on Ripley's word — before approving corrections for them. All five
check out exactly as described; none is an edge case or an overread.

### Independent re-verification of Ripley's findings

1. **Freshness.** `AuroraNightOutlook.jsx:168-169` — `staleAgo` is computed
   only `isStale ? formatAuroraDataAge(...) : null`, so a fresh or poor
   resolved night renders no update-time line at all; this is a byte-for-byte
   copy of `NorthernLightsCard.jsx`'s own pre-existing pattern, not a new
   bug — but approved-prompt-v4.md §5 explicitly asked for *more* than the
   homepage ever did ("show the actual sourceFetchedAt for each resolved
   night's data... labeled as Aurora data update time," for every resolved
   night, not only stale ones). `useAuroraThreeNight.js`'s two effects only
   handle date rollover (`slotDates` recompute) — neither reevaluates
   freshness against current wall-clock time nor forces any reload on a
   same-day visibility return. Confirmed real and confirmed new to Phase 2's
   own requirement, not something Round 4 could have inherited as "already
   accepted homepage behavior."
2. **Analytics/attribution regression.** Confirmed `NorthernLightsThreeNight.jsx`
   only ever calls `trackEvent` for the 3 new events — none of the 8 existing
   `northern_lights_*` events fire on this surface anymore now that
   `/en/northern-lights` mounts it instead of `NorthernLightsCard`. Confirmed
   `AuroraNightOutlook.jsx`'s `onUpgrade={() => onUpgrade("northern_lights_multi_night")}`
   forwards a different checkout-attribution source than the previous
   `"northern_lights_card"` — a real attribution-split regression, not
   cosmetic. cc-report.md §5's claim that "none of the 8 existing events...
   were touched" is true only for the homepage; it's false for the landing
   page's own traffic, which used to fire the same 8 events via the card's
   `variant="landing"` path and now fires none of them. This is the sharpest
   finding of the four — a silent breaking change to existing analytics/
   attribution on live traffic, not a missing nice-to-have.
3. **Presentation/accessibility.** Confirmed `NightTab` renders only a date
   label plus an `aria-hidden` colored dot — no textual per-night outlook
   anywhere, so the "readable overview" requirement is met by color alone,
   which fails for both screen-reader users and colorblind users. Confirmed
   `AURORA_VISUAL_STATE_TOKENS` only has GOOD/FAIR/POOR/NEUTRAL buckets, so
   an excellent night's dot is indistinguishable from a merely-good night's
   dot — the #414 excellent/purple distinction is genuinely lost at the tab
   level. Confirmed `resolveOutlookCopy` computes `pillLabel` but
   `AuroraNightOutlook.jsx`'s JSX never renders it anywhere — unlike
   `NorthernLightsCard.jsx`'s `CardHeader`, which explicitly renders its
   `pill` prop. I also re-checked the real Playwright screenshot
   (`desktop-pro-tonight-map.png`, which I opened directly in Round 4): it
   shows no status pill anywhere near the title, corroborating the code-level
   finding with the actual rendered output, not just static analysis.
   Separately confirmed the `role="tablist"` wrapper around plain
   `aria-pressed` buttons (not `role="tab"`/`aria-selected` children) is a
   genuine ARIA-pattern mismatch, not a style nitpick — assistive tech reads
   `role="tablist"` as a promise of full tab semantics that these children
   don't deliver.
4. **Partial comparisons.** Confirmed `classifyMultiNightComparison` computes
   `comparison.scopedToAvailable` for the `no_favorable`/`similar`/
   `best_night` outcomes, but `ComparisonSummary` never reads that field —
   every branch's copy is worded identically whether all 3 nights or only 2
   contributed to the conclusion. Confirmed real: the policy already carries
   the information the presentation layer silently discards.
5. **Robustness note.** Confirmed `setEquals` compares two `Set`s built from
   `[best.locationId, ...alternatives]`; because the `Set` constructor
   silently collapses a duplicate ID, a malformed response containing every
   correct ID plus one extra duplicate would still pass the completeness
   check by coincidence of matching set *size*. Narrow (requires a
   duplicate-producing data anomaly the backend contract shouldn't normally
   produce) but a real defensive gap, correctly scoped as "no change to
   canonical candidate roster or scoring."

### Why I missed all five in my own Round 4 PASS

Worth stating plainly, matching this ticket's established practice of
self-flagging rather than letting it pass silently: my Round 4 review spent
its verification budget on the *architectural* claims — the identity-safety
guard, the 3-fixed-hooks Rules-of-Hooks legality, the 7-rule precedence
policy's logic, the date-neutral copy audit — and confirmed all of those
correctly. What I didn't do was a systematic line-by-line checklist against
every individual micro-requirement in §2/§5/§6 of approved-prompt-v4.md
(exact pill rendering, exact freshness display for non-stale states, exact
preservation of each of the 8 existing analytics events, exact use of
`scopedToAvailable`). This is a different failure mode than the
cross-section-contradiction misses from the Phase 1 rounds — those were
about internal consistency of a document; this is about verifying
architecture soundness while under-verifying literal requirement-by-
requirement completeness on a large multi-section prompt. Worth carrying
forward: for an implementation this size, do an explicit final pass matching
every prompt bullet to a specific rendered/tested behavior, not just to the
overall design.

### On the Round 5 prompt itself

Scope is tight and consistent with the accepted architecture: no backend/
scoring/candidate/entitlement change, homepage explicitly untouched, #425
explicitly excluded ("no homepage three-night UI/link/query handoff"),
v1-v4 history preserved, and each of the 5 corrections maps to a specific
required test addition. Item 2 correctly instructs *fixing* the existing
wrong test (which currently asserts the legacy event must NOT fire) rather
than leaving it as a passing-but-wrong regression guard — consistent with
this ticket's prior practice of correcting incorrect claims rather than
working around them. Item 1 correctly avoids prescribing exactly how to
reuse the server's 480/1440-minute constants (parity-tested duplication vs.
a shared boundary), leaving that implementation choice open while fixing
the correctness bar. The workflow section is explicit that I review the
prompt only and leave `CURRENT` at `PROMPT_REVIEW` — Ripley creates
`approved-prompt-v5.md` and performs the `READY_FOR_CC` handoff.

### Verdict

**APPROVED.** All five items Ripley's REVISE and this correction prompt
describe are real, independently confirmed against live source (including
one cross-check against an actual browser screenshot), not overclaimed or
invented. The proposed corrections are narrowly scoped to exactly these
gaps, preserve all prior approved history, correctly exclude the
homepage-discoverability question and #425 from this round, and specify
concrete new test coverage for each fix. Ready for `approved-prompt-v5.md`
and `READY_FOR_CC`.

## Ripley Round 5 handoff — 2026-09-26

Jonesy APPROVED all five corrections without required changes. Created approved-prompt-v5.md from the reviewed Round 5 correction and set CURRENT to READY_FOR_CC with v5 as the sole active execution prompt. v1-v4 and all prior history are preserved. #425 remains a draft pending completion of #423. No production changes, commit or push performed by this handoff.

