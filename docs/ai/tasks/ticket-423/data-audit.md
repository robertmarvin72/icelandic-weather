# #423 — Phase 1 data audit: Northern Lights multi-night

Scope: read-only audit per `approved-prompt-v1.md`. No production code, tests,
schema, or provider changes made. All facts below were independently traced
against live source in this session (not copied from `prompt-review.md`).

## Revision note (Round 2 — approved-prompt-v2.md)

Ripley's Phase 1 result review (`result-review.md`) returned **REVISE** with
3 findings, addressed in place below (original Round 1 text is preserved
only where still accurate; this file is the current living audit, not a
diff — the approved prompts and review/report history in
`docs/ai/tasks/ticket-423/` are retained as separate files, but this file's
Round 1 prose itself is not separately preserved anywhere once edited in
place, since the task directory has not been committed to git):

1. **§4 (Shape A/B) corrected.** Round 1 understated Shape B as "changes
   only `orchestrate.js`'s date-range computation." It actually requires a
   request/response **contract change** (multiple evenings in, multiple
   decisions out) plus client cache/hook changes — not a same-shaped
   single-night call with a wider date range. Shape A (3 unchanged calls)
   is confirmed as the genuine zero-backend-change option and is 18 calls,
   not 6, unless B's contract change is built. Full matrix below.
2. **§5 corrected.** Round 1 incorrectly claimed the singleton cache row
   guarantees identical `sourceFetchedAt` across 3 independent requests.
   It does not — 3 separate `runAuroraDecision` calls (Shape A) each do
   their own `readAuroraSnapshot`, and a cron refresh (08:00/14:00/20:00)
   landing between them can hand different calls different snapshot
   generations. A concrete comparison-eligibility policy is now given,
   with an example timeline, instead of asserting the race away.
3. **§6/§9 corrected.** Round 1 treated "does the landing page get
   multi-night" as fully open. `gh issue view 423` (fetched fresh this
   round) confirms Phase 5 **explicitly** requests a compact 3-night
   section on the Northern Lights landing page (the issue's own wording;
   it does not itself name a URL), and the Free/Pro section explicitly
   specifies Free sees the general 3-night outlook + best-night summary
   while Pro keeps full per-night location ranking/map. Source inspection
   (`NorthernLightsLanding.jsx`, `AppRoutes.jsx`) separately identifies
   `/en/northern-lights` as that landing page's actual current route. The
   only genuinely open surface question is *how Icelandic access is
   provided* without a new `/is/` route or expanding homepage scope.

Additional factual corrections applied throughout: `useAuroraDecision`'s
`keyRef` check discards an obsolete *result* on arrival, it does not abort
the underlying request — an old fetch can keep running to completion
un-cancelled. Open-Meteo's `generationtime_ms` is not a forecast-issuance
timestamp and is not captured anywhere in this pipeline today (confirmed
by grep — not referenced in `api/_lib/auroraDecision/` or
`auroraScoring.js`). The SQL file's "pending manual apply" comment is
repo-code evidence only, not a live production check. **Round 3
correction**: production schema status is unverified operational context,
not a gate on Phase 2 code — it is not inferred from the old comment in
either direction, and checking it directly against Neon is worth doing at
some point but does not block designing/reviewing/writing Phase 2.

No live-network probes were re-run or newly executed this round, per the
Round 2 prompt's explicit instruction (the Round 1 Open-Meteo probe and
23-suite/256-test baseline stand as already-established evidence — Ripley
independently reran the test baseline during result review and confirmed
the same 23/256 count).

## Revision note (Round 3 — approved-prompt-v3.md)

Ripley's Round 2 final assessment returned **REVISE** on §5 only — the
Shape A/B contract correction and the landing-page/Free-Pro surface finding
from Round 2 were **accepted and are not reopened here**. Two remaining
gaps were found:

1. §5 was internally contradictory: one part of the all-poor branch
   included zero-scored nights, while another part forbade exactly that
   reading. Missing data cannot establish poor conditions, and a claim
   about "the next three nights" is unsupported when only one or two nights
   are actually known.
2. §5 defined within-night fault isolation (a location missing within one
   night) but never defined **cross-night** comparison eligibility when
   different nights have different successful candidate sets — a night
   missing its best location could lose a comparison purely through missing
   observations, not genuinely worse conditions. The freshness proposal
   also left "silent internal flag" as an acceptable option, which does not
   meet a concrete, visible policy requirement.

§5 is now **fully rewritten** as one internally consistent decision table
(pending / zero-scored / one-scored / eligible 2+-scored / ineligible
2+-scored / all-three-poor, each with an explicit within-night-usability
vs. cross-night-eligibility distinction) plus 9 worked examples, replacing
the earlier prose rule rather than patching it. The candidate-completeness
eligibility check was confirmed **buildable from existing response fields**
(`rankDecision.js`'s `best`/`alternatives`/`excluded` union against
`fanout.js`'s guaranteed one-result-per-requested-location contract) before
being written into the table — not assumed.

Two smaller corrections also applied per the approved prompt: §9's
production-DB item no longer reads as a Phase 2 prerequisite gate (it is
unverified operational context, not a blocker); and the landing-page
finding's attribution is split — the literal "add a 3-night section to the
landing page" requirement comes from the issue text, while the specific
`/en/northern-lights` route is a fact established by source inspection, not
by the issue itself. An unsupported claim that Round 1's prose was
"preserved via git history" was also removed — the task directory is
untracked, so only the separate file history in
`docs/ai/tasks/ticket-423/` (approved prompts, reviews, reports) is
actually retained; this file's own prose is edited in place, not
diffed/archived per round.

No new tests were added or run, no production code changed, no provider
probe repeated, no DB/cron access — per the Round 3 prompt's explicit
scope.

## 1. Confirmed vs unverified facts

**Confirmed (read from live source / real test run / real bounded request):**

- The XML→parser→cache→endpoint→client chain is already fully multi-night
  and date-parameterized end to end (see §2). No layer between the parser
  and the UI hardcodes "one night" except `NorthernLightsCard.jsx`'s own
  `evening` variable and its single `useAuroraDecision` call site.
- `parseAuroraSnapshot` returns an array of **all** `<night_data>` blocks
  found in the XML (`extractAllBlocks`), and `persistAuroraSnapshot` stores
  the full array (`{"nights":[...]}` jsonb) — never truncated to one night.
- `runAuroraDecision` already accepts an arbitrary validated `evening` and
  derives cache lookup, darkness window, and the Open-Meteo date range from
  it — nothing here is hardcoded to "today."
- Exactly **6** candidate location IDs exist in
  `src/config/auroraCandidates.js` (`AURORA_CANDIDATE_VERSION = "1"`), and
  all 6 independently resolve to real coordinates in
  `server_data/campsites.full.json` (242 total entries) — verified by direct
  lookup, not by reading `resolveLocations.js`'s logic alone. This grounds
  the naive "6 weather calls per night × 3 nights = 18" estimate in a real
  count, not the preliminary placeholder.
- Open-Meteo's documented max forecast horizon is **16 days**
  (`forecast_days` 0–16, default 7), independent of `start_date`/`end_date`,
  per open-meteo.com/en/docs (fetched this session). A 4-calendar-day
  request window is far inside this limit.
- A single bounded, read-only Open-Meteo request was made this session
  (Reykjavík candidate coordinate, `start_date=2026-09-25`,
  `end_date=2026-09-28`, same `hourly` field list and `timezone=UTC` as
  `buildOpenMeteoUrl`) and returned **96 hourly rows** (exactly 4×24, no
  gaps), **zero nulls** in any of the 7 requested fields, and timestamps in
  the exact `YYYY-MM-DDTHH:MM` (no offset) shape that
  `normalizeOpenMeteoHourly`'s `toIsoUtc` already parses
  (`utc_offset_seconds: 0`, `timezone: "GMT"`). This is real evidence for
  *today's* window only, from *one* candidate coordinate — not a guarantee
  for all 6 coordinates or all seasons, but it directly confirms the
  documented horizon comfortably covers a 3-evening/4-day span with no
  observed data-completeness problem.
- 256/256 existing tests pass across all Aurora-related suites (command and
  count in §10). No pre-existing failure.
- `docs/northern-lights/sql/aurora_forecast_cache.sql` contains its own
  comment: **"pending manual apply — not yet run against Neon production."**
  **Round 2/3 correction:** this comment is old repo-code evidence, not a
  live production check, and by itself proves neither that the table is
  missing nor that a migration is required before frontend work — it is
  simply outdated information of unknown current accuracy. Production
  schema status is **unverified** (this audit had no DB access) and is
  treated as unverified operational context, **not** a gate on writing or
  reviewing Phase 2 code — confirming it against real Neon is worth doing
  at some point, but it does not block Phase 2 design/review/implementation
  work, and is not assumed either way from this comment.

**Unverified / explicitly left open (per the prompt's instruction not to
assume or fabricate coverage):**

- **No genuinely retained real Vedur.is XML capture exists anywhere in the
  repo.** Searched for `*.xml` and `*vedur*xml*` files (none), checked
  `outputs/` (only unrelated ticket 411/414/416 evidence),
  `docs/northern-lights/` (only the SQL schema). The only artifact is
  `api/_lib/aurora/parseAurora.test.js`'s **synthetic** 10-night fixture
  (`Array.from({length:10}, ...)`, comment: *"matches the confirmed live
  10-night shape"*). Tracing that comment back: `docs/ai/tasks/ticket-390`
  cc-report references *"the live feed sample confirmed during the Ticket 1
  audit"* for single-field shape (sunset/darkness/dawn/sunrise/moon
  times) and for "the feed carries no location metadata" — but no
  `docs/ai/tasks/` folder for that "Ticket 1" audit exists in this repo, and
  no raw response from it was retained anywhere I can find. **Conclusion:
  the "10 nights" figure is documented only as an informal claim in a test
  name/comment from an earlier, untraceable session — it is not
  independently verifiable today and must be treated as unconfirmed for
  planning purposes**, distinct from the parser's confirmed *structural*
  capacity to handle an arbitrary number of nights (which is proven by
  `extractAllBlocks` and is not in question).
- The *current* real Vedur.is feed's actual night count, and which fields
  are populated for each night (vs. null), are unverified — the prompt
  explicitly forbids fetching Vedur outside the existing cron path or
  invoking a refresh merely to audit, so this was correctly not attempted.
  Phase 2 planning should assume the number of usable nights **could be
  fewer than 3** on any given day and must degrade per §7 below, not assume
  3 are always available.
- Whether `aurora_forecast_cache` actually exists in production Neon today
  (see above — code says "pending manual apply").
- Open-Meteo completeness for the other 5 candidate coordinates, and for
  windows further in the future than today+3 — only one location/window was
  probed, per the prompt's "do not fetch weather repeatedly" instruction.

## 2. Pipeline trace (file/function references, independently re-verified)

| Stage | File | Function/contract |
|---|---|---|
| Upstream fetch | `api/_lib/aurora/fetchAurora.js` | `fetchAuroraXml()` — IS-only endpoint, 8s timeout, no retry, only called from `api/cron/refresh-aurora.js` |
| Parse | `api/_lib/aurora/parseAurora.js` | `parseAuroraSnapshot(xml)` → array of `{eveningDate, auroraActivity, sun, moon}`, one entry per `<night_data>` block; invalid date drops only that night, other invalid fields null independently |
| Cache write | `api/_lib/aurora/cache.js` | `claimAuroraRefreshLease` / `persistAuroraSnapshot` / `releaseAuroraRefreshLease` — singleton row `id=1`, `snapshot jsonb = {"nights":[...]}` (full array, not truncated) |
| Cron auth/orchestration | `api/cron/refresh-aurora.js` | `CRON_SECRET` Bearer checked before lease claim; never persists an empty parse |
| Freshness | `api/_lib/auroraDecision/freshness.js` | `classifyAuroraCache(cacheRow, now)` — age vs `source_fetched_at`; `AURORA_FRESH_MAX_AGE_MINUTES=480`, `AURORA_STALE_MAX_AGE_MINUTES=1440` (`constants.js`) |
| Night selection | `api/_lib/auroraDecision/freshness.js` | `selectNightForEvening(nights, evening)` — exact-string `.find()`, already generic/date-agnostic |
| Request validation | `api/_lib/auroraDecision/validateRequest.js` | `validateAuroraDecisionBody(body)` — `evening` is any calendar-valid `YYYY-MM-DD` (not restricted to today); `locationIds` deduped, capped at `MAX_LOCATIONS_PER_REQUEST=8` |
| Location resolution | `api/_lib/auroraDecision/resolveLocations.js` | `loadCanonicalLocations()` reads `server_data/campsites.full.json` directly (tier-independent); `resolveLocationIds` never trusts client-supplied lat/lon/name |
| Darkness window | `api/_lib/auroraDecision/darknessWindow.js` | `computeNationalDarknessWindow(night)` — HH:MM→timestamp reconstruction, hour<12 → eveningDate+1, hour>=12 → eveningDate, pure UTC epoch-ms arithmetic |
| Weather fan-out | `api/_lib/auroraDecision/fanout.js`, `openMeteo.js` | `fetchWeatherForLocations({locations,startDate,endDate,...})`, bounded concurrency 4, one Open-Meteo call per location, results written by index (deterministic order) |
| Scoring | `src/lib/auroraScoring.js` | `scoreAuroraVisibility({night,hourlyRows,viewingWindow})` — pure, deterministic, only server-side consumer is `rankDecision.js` |
| Ranking | `api/_lib/auroraDecision/rankDecision.js` | `buildRankedDecision(...)` — score desc, then `locationId` asc tie-break (within-night only) |
| Orchestration | `api/_lib/auroraDecision/orchestrate.js` | `runAuroraDecision({body,sql,fetchImpl,now,canonicalLocations})` — single entry point tying all of the above together for one `evening` |
| HTTP handler | `api/aurora-decision.js` | POST handler, `Cache-Control: no-store` |
| Client request key | `src/lib/auroraCandidateRequest.js` | `buildAuroraRequestKey(evening, locationIds)` |
| Client cache | `src/lib/auroraDecisionCache.js` | module `Map`, `TTL_MS = 5*60*1000`, keyed by `(evening, locationIds)` — independent entries per night already, no change needed |
| Client hook | `src/hooks/useAuroraDecision.js` | `useAuroraDecision({enabled,evening,locationIds,fetchImpl})` — single `keyRef` per hook instance; on resolution, `if (keyRef.current !== requestKey) return` discards an **obsolete result**, but does **not** call `AbortController.abort()` or otherwise cancel the in-flight fetch — an old request can keep running to completion, its result simply unused (Round 2 correction) |
| Outcome classification | `src/lib/auroraDecisionClassify.js` | `classifyAuroraOutcome(outcome)` — `night_not_found` → `domain_unavailable`, never `no_darkness` |
| Presentation helpers | `src/lib/auroraBandPresentation.js`, `auroraReasonSummaries.js`, `auroraDisplaySelection.js` | shared by both `NorthernLightsCard.jsx` and `MapView.jsx`'s aurora mode — no divergence |
| Card | `src/components/NorthernLightsCard.jsx` | `evening = todayEveningUtc(...)`, exactly one `useAuroraDecision` call — **the single-night hardcode point** |
| Map (card) | `src/components/NorthernLightsMap.jsx` | thin lazy `MapView` wrapper, `mode="aurora"`, fed by `display.qualifyingLocations` |
| Map (homepage) | `src/MapView.jsx` | `isAuroraMode`, colors by `auroraBandColor`, legend via `auroraBandShortLabelKey` |
| Landing | `src/pages/NorthernLightsLanding.jsx` | forced `t = useT("en")`, renders same `NorthernLightsCard` with `variant="landing"`; no `/is/northern-lights` route exists |
| Feature gate | `src/config/features.js` | `northernLights: {tier:"pro", preview:true, label:"Northern Lights"}` |

## 3. Per-night semantics, rollover, states (requirement #4)

- **Sun/moon are national-reference times, not per-location astronomy** —
  explicit `national_reference_times` flag on every scored result
  (`auroraScoring.js`). This is unchanged by multi-night and must stay true
  for every night shown.
- **Rollover rule** (hour<12 → eveningDate+1, hour>=12 → eveningDate) is
  implemented identically in `darknessWindow.js` and `auroraScoring.js`
  (deliberately not shared, to avoid touching `auroraScoring.js`'s export
  surface), using UTC epoch-ms arithmetic only — no `getHours()` or other
  host-timezone-dependent calls anywhere in the chain. Empirically verified
  this session to roll over Dec 31 → Jan 1 correctly, but **no repo test
  covers that exact year-boundary case** in `darknessWindow.test.js` or
  `auroraScoring.test.js` (contrast with `auroraSeason.test.js`, which does
  have an explicit year-turnover test at lines 21–23). This is a
  pre-existing test-coverage gap, not a functional defect — worth adding in
  Phase 2 since multi-night surfaces this boundary more often (3 nights in
  view spans a month/year boundary far more frequently than 1).
- **`activityForecast: 0` vs `null`**: 0 is preserved as a real distinct
  value everywhere (parser test: *"activity_forecast value 0 stays 0, not
  null"*); missing/self-closing tags become `null`. This distinction must be
  preserved per-night in any multi-night aggregation — a night with real
  `activity: 0` is not the same as a night with no data.
- **Stale/partial/no-darkness are per-request, single-night concepts today**
  (`classifyAuroraCache`, `classifyAuroraOutcome`) — there is currently no
  concept of "night 2 stale while night 1 fresh" because only one night is
  ever requested. Multi-night must carry per-night freshness independently
  (see §5) rather than collapsing to one page-level state.
- **No duplicated forecast value between nights is needed**: each night's
  weather is a genuinely distinct Open-Meteo hourly slice (own
  `start_date`/`end_date` or own slice of a shared wider fetch — see §5); no
  night ever needs to reuse another night's rows.
- **Source retrieval time ≠ provider forecast issue time ≠ weather fetch
  time ≠ client cache time** — these are separate concepts and must stay
  separate: `source_fetched_at` (cron's Vedur.is XML fetch time, the
  canonical cache-freshness basis), the fan-out's per-call Open-Meteo fetch
  time (not persisted, ephemeral), and `auroraDecisionCache.js`'s 5-minute
  client TTL. **Round 2 correction:** Open-Meteo's `generationtime_ms` field
  is a server-side query-processing-duration metric, **not** a forecast
  issuance timestamp, and the current `normalizeOpenMeteoHourly` /
  `fetchLocationWeather` code does not capture or surface it at all
  (confirmed by grep — no reference anywhere in
  `api/_lib/auroraDecision/`). There is currently no captured "when did
  Open-Meteo generate this forecast" concept in this pipeline; if one is
  wanted it would be new scope, not an existing value being reinterpreted.
  **A shared batch retrieval time is legitimate only when the batch call
  genuinely covers multiple nights from one fetch** (i.e. the wide-window
  proposal in §4/§5) — it must not be presented as if each night was
  independently re-fetched when it wasn't.

## 4. Smallest implementation boundary (requirement #5) — Round 2 corrected

**Verified candidate/location facts**: 6 candidate IDs, all independently
resolved to real coordinates (§1). Today's single-night flow already issues
1 Open-Meteo call per location per `runAuroraDecision` invocation → 6 calls
total for one night, confirmed by reading `orchestrate.js` directly (one
`readAuroraSnapshot`, one `selectNightForEvening`, one
`fetchWeatherForLocations` call per invocation — no batching exists today).

**Round 2 correction to Round 1's framing**: Round 1 described Shape B as
changing only `orchestrate.js`'s date-range computation, implying the same
single-evening request/response shape with a wider window. That is
incorrect — the current contract is genuinely **one evening in, one scored
decision out** (`{evening, locationIds}` → `{evening, auroraCache,
viewingWindow, status, best, alternatives, excluded, warnings}`, confirmed
in `orchestrate.js`). Widening the Open-Meteo date range alone still
produces exactly one night's `best`/`alternatives` in the response; it does
not by itself yield three results. Below is the corrected matrix of what
each shape actually requires:

| Layer | Shape A (3 unchanged calls) | Shape B (1 wider batched call) |
|---|---|---|
| Request contract | Unchanged: `{evening, locationIds}`, called 3× (once per evening) | **Changed**: must accept multiple evenings, e.g. `{evenings: [e1,e2,e3], locationIds}` — a new request shape, not a wider `evening` |
| Response contract | Unchanged: one `{best, alternatives, excluded, ...}` per call | **Changed**: must return a keyed/array structure of 3 per-night decisions, e.g. `{nights: [{evening, best, alternatives, ...}, ...]}` — a new response shape |
| Server orchestration | Unchanged: `runAuroraDecision` called 3× as today | **New logic required**: read cache once, resolve all 3 nights via `selectNightForEvening` per evening, compute one wide Open-Meteo window, fetch once per location, then slice the normalized hourly rows into 3 per-night windows and call `buildRankedDecision` **separately per night** (scoring stays server-side and unchanged — no client-side scorer, matching the prompt's explicit constraint) |
| Open-Meteo calls | 6 locations × 3 calls = **18** (even if each of the 3 calls itself requests a wider date range — widening the range on an unchanged single-evening call does not reduce the call count) | 6 locations × 1 call = **6**, only once the batched request/response/orchestration above exists |
| Client cache (`auroraDecisionCache.js`) | Unchanged — 3 independent `(evening, locationIds)` keys, 3 independent cache entries | Needs a decision: either the client unpacks a batched response into 3 existing-shaped cache entries (keeping the rest of the client unchanged), or a new cache key shape for the batched request itself |
| Client hook (`useAuroraDecision.js`) | Unchanged — 3 fixed call sites of the existing hook (legal under Rules of Hooks, no new hook code) | Needs a **new hook** (or hook variant) that issues the one batched POST and exposes 3 per-night outcomes — the existing hook's single-request/single-outcome shape does not fit a batched response without a new consumer |

**Conclusion (corrected): Shape A is the genuine zero-backend-change,
zero-new-hook option today, at a real cost of 18 Open-Meteo calls. Shape B
is a real optimization down to 6 calls, but is an API-contract and
orchestration expansion — a new request/response shape, new server-side
per-night slicing logic, and a new or adapted client hook — not a
date-range-only edit.** Both remain proposals for a separately reviewed
implementation prompt; nothing here authorizes building either. If review
prefers to ship Phase 2 without the contract-expansion work, Shape A is the
correct fallback, explicitly at 18 calls, not a discounted estimate.

**Concurrency/TTL/race-cancellation assessment (Round 2 corrected)**:
`auroraDecisionCache.js`'s `(evening, locationIds)` keying already produces
independent, non-colliding cache entries per night with zero code change
under Shape A. Under Shape A, 3 simultaneous nights need 3 fixed call sites
of the existing hook (`useAuroraDecision({evening: night1})`, `..night2`,
`..night3` — legal under Rules of Hooks since call count is fixed, not
looped) — this needs no new hook code, only a new caller in
`NorthernLightsCard.jsx`. **Correction**: the hook's `keyRef` check discards
an obsolete *result* when it arrives after the identity has moved on, but
it does not abort the underlying fetch — a stale in-flight request keeps
running un-cancelled in the background; this is harmless for correctness
(its result is simply dropped) but means "in-flight request count" is not
bounded to 1 the way "displayed result count" is. A date-switch UI must not
show a transient stale/wrong-night result while a newly-selected night's
request is in flight — since each of the 3 fixed call sites resolves to its
own cache entry, switching *which night is displayed* is a pure render-time
concern once each night's own hook instance has resolved, not a
re-fetch-and-flash concern (still needs UI-level confirmation in Phase 2).

**Not proposed**: no server-side batching endpoint beyond what Shape B
would require if approved, no new caching infrastructure beyond adapting
existing keys/entries, no change to `MAX_LOCATIONS_PER_REQUEST` or the
6-location candidate set.

## 5. Missing/partial/stale/tie behavior proposal (requirement #6) — Round 3 corrected

**Round 3 revision note**: Ripley's Round 2 final assessment (REVISE) found
this section internally contradictory — it put "zero scored nights" inside
the all-poor branch in one place while forbidding exactly that
interpretation elsewhere — and found the candidate-completeness/pending-
night behavior underspecified, with the freshness policy leaving a "silent
internal flag" as an acceptable option where a concrete, visible policy was
required. This section is rewritten below as **one internally consistent
decision table**, replacing the earlier prose-only rule rather than
patching it further. Per-night state still stays exactly as today (`scored`
/ `insufficient_data` / `not_viewable_tonight`, plus the classify-layer's
`domain_unavailable` for `night_not_found`) — nothing here alters existing
weights/thresholds/bands or within-night scoring.

### Terms used below

- **Pending** — a requested night whose result has not yet resolved (its
  own in-flight request/hook instance hasn't completed). Distinct from
  every state below, all of which describe a *resolved* night.
- **Within-night usability** — whether a *resolved* night's own response has
  a `best` (i.e. `status` is `"success"` or `"partial"` in `orchestrate.js`'s
  response) vs. `"unavailable"` (no locations scored — covers
  `night_not_found`, `invalid_darkness_window`, `aurora_cache_unavailable`,
  `no_locations_scored`). This is a **per-night** fact and is always shown
  once a night resolves, regardless of comparison eligibility.
- **Comparison eligibility** — a **cross-night** fact, independent of
  within-night usability: whether 2+ resolved, scored nights may be
  compared against each other at all. Per the approved correction, eligible
  requires **both**: (a) equal, non-null `auroraCache.sourceFetchedAt`
  across every compared night, **and** (b) the same *complete* configured
  candidate set (every requested `locationId`, not merely an identical
  subset) successfully scored (present in `best` or `alternatives`, not
  `excluded`) in every compared night. Confirmed buildable from existing
  response fields, not a new contract: `fanout.js`'s `fetchWeatherForLocations`
  always returns exactly one result per requested location (pre-sized array,
  never dropped), and `rankDecision.js`'s `buildRankedDecision` places every
  location into exactly one of `best`/`alternatives`/`excluded` — so the set
  of successfully-scored location IDs for a night is
  `{best.locationId, ...alternatives[].locationId}`, comparable directly
  against the request's own `locationIds`, with zero new server fields.
  Matching `sourceFetchedAt` values say nothing about Open-Meteo weather-fetch
  consistency (that provenance is ephemeral/unpersisted per §3) — the
  eligibility check is about aurora-activity provenance and candidate
  completeness only, not about inferring Open-Meteo issuance consistency.

### Decision table

| Situation | Within-night usability | Comparison eligibility | Displayed result |
|---|---|---|---|
| Night still pending | Not yet known | N/A until resolved | Show "comparison pending" for that night's slot; that night contributes nothing to any final best-night or all-poor conclusion until it resolves. If other requested nights have already resolved, their own individual usable details are still shown — only the *final cross-night* conclusion (best night / all-three-poor) waits. |
| Resolved, zero scored (this night) | Unusable — show its own unavailable/no-darkness reason | Not eligible (nothing to compare) | That night's own unavailable/no-darkness state, shown plainly. Never "poor" — poor is a scored band, not an absence of data. |
| Resolved, exactly one scored across all compared nights | Usable for that one night | Not eligible — a comparison needs 2+ scored nights | Show that night's own outlook as the only available result. No cross-night winner is claimed. The other (unresolved/unavailable) nights remain explicitly unknown, never implied worse. |
| Resolved, 2+ scored, eligibility checks (timestamp + full candidate set) **pass** | Usable for each compared night | Eligible | Compare by existing score/band only (§ near-tie note below). Stale data (per `classifyAuroraCache`'s existing `stale` state) is still comparable but must be visibly marked stale using the existing stale-data UI treatment — staleness does not block eligibility by itself, only a genuine timestamp/candidate-set mismatch does. |
| Resolved, 2+ scored, eligibility checks **fail** (mismatched `sourceFetchedAt`, or incomplete/differing successful candidate sets, including two nights that happen to share an identical but incomplete set) | Each resolved night's own result is still shown, independently usable | **Not** eligible | Keep each night's own per-night result visible, but **visibly state** that a reliable best-night comparison is unavailable — never a silent-only internal flag. No definitive winner and no all-three-poor claim may be shown in this state, regardless of how the individual bands look. |
| All nights being compared resolved, scored, eligible, **and** every one of them is in the existing poorest band (`"very-poor"`) | Usable, each individually poor | Eligible | All-three-poor copy (e.g. "Low chance across the next three nights" — issue's own Phase 4 example copy) permitted, **only** under this full condition. |
| Only a subset of the 3 requested nights is resolved/scored/eligible and every one of *that subset* is `"very-poor"` | Usable for the subset | Eligible within the subset only | Copy must explicitly scope its claim to the available nights (e.g. "the nights checked so far" wording, not "the next three nights") — unknown/pending/unavailable nights are never counted toward an all-poor claim. |

**Near-tie/tie policy — still unresolved, unchanged in scope**: same numeric
score → no synthetic tie-break by ID or date; present both as equally good
(deliberately not reusing `rankDecision.js`'s within-night ID tie-break,
which answers a different question — best location within one night, not
best night). A near-tie tolerance (e.g. some ± score-point band) remains
explicitly **proposed and unresolved** — this correction does not introduce
a tolerance constant or otherwise touch scoring, per the prompt's explicit
instruction.

### Table examples (concrete scenarios)

| # | Scenario | Night 1 | Night 2 | Night 3 | Within-night usability | Comparison eligibility | Displayed conclusion |
|---|---|---|---|---|---|---|---|
| 1 | All pending | pending | pending | pending | none resolved yet | N/A | "Comparison pending" for all three; nothing else shown yet. |
| 2 | Zero scored (all unavailable) | unavailable (`night_not_found`) | unavailable (`aurora_cache_unavailable`) | unavailable (`invalid_darkness_window`) | unusable ×3 | not eligible | Each night's own unavailable reason shown; no best-night, no "low chance" claim (there is no scored data to call poor). |
| 3 | One poor + two missing | scored, `very-poor` | unavailable | unavailable | usable (N1 only) | not eligible (only 1 scored) | N1's own poor outlook shown as the only result; N2/N3 shown as unavailable, never implied worse than N1. |
| 4 | Two scored + one pending | scored, `fair` | scored, `good` | pending | usable ×2 | not eligible (only 2 of the 3 requested nights have resolved; the pending night still blocks a final 3-night conclusion) | N1 and N2's own outlooks shown; overall conclusion stays "comparison pending" until N3 resolves. |
| 5 | Three poor, complete comparable data | scored, `very-poor`, full 6/6 candidate set, `sourceFetchedAt = F` | scored, `very-poor`, full 6/6, `F` | scored, `very-poor`, full 6/6, `F` | usable ×3 | eligible (equal timestamp, complete identical candidate sets) | All-three-poor copy permitted: "Low chance across the next three nights." |
| 6 | A missing candidate on one night | scored, 6/6, `F` | scored, 5/6 (1 excluded), `F` | scored, 6/6, `F` | usable ×3 individually | **not** eligible (candidate sets differ: N2's successfully-scored set is a strict subset) | Each night's own result (including N2's own best-of-5) shown; comparison unavailable notice shown; no cross-night winner declared. |
| 7 | Identical incomplete candidate sets | scored, 5/6 (same 1 location excluded), `F` | scored, 5/6 (same 1 location excluded), `F` | scored, 5/6 (same 1 location excluded), `F` | usable ×3 | **not** eligible — identical across nights, but not the *complete* configured set, so the completeness half of the check still fails | Each night's own result shown; comparison-unavailable notice shown even though the sets matched each other, because they didn't match the full configured set. |
| 8 | Refresh-straddling timestamps | scored, 6/6, `sourceFetchedAt = F1` | scored, 6/6, `sourceFetchedAt = F2 (cron refreshed between N1 and N2)` | scored, 6/6, `F2` | usable ×3 | **not** eligible (F1 ≠ F2) | Each night's own result shown; comparison-unavailable notice shown; no winner declared even though every night individually looks complete. |
| 9 | Comparable but stale | scored, 6/6, `F` (stale, i.e. `classifyAuroraCache` returns `"stale"` for age) | scored, 6/6, `F` (stale) | scored, 6/6, `F` (stale) | usable ×3, each visibly marked stale per existing stale-data UI | eligible (equal timestamp, complete matching sets — staleness itself doesn't block eligibility) | Comparison proceeds and a best night may be shown, but every compared night is visibly marked stale using the existing stale behavior; never presented as if the data were fresh. |

## 6. Free/Pro, i18n, and surface trace (requirement #7) — Round 2 corrected

**Round 1 error**: this section previously treated "does the landing page
get multi-night" as an open product question. `gh issue view 423` was
fetched fresh this round and read in full — it explicitly resolves this:
Phase 5 says *"Bæta við compact 3-night forecast section á Northern Lights
landing page"* (add a compact 3-night forecast section to the Northern
Lights landing page) — this literal requirement is the issue's own wording,
which does not itself name a route. Separately, source inspection
(`NorthernLightsLanding.jsx`, `AppRoutes.jsx`, confirmed unchanged) is what
identifies `/en/northern-lights` as that landing page's actual current
route today. The Free/Pro section of the issue explicitly specifies:

> Free: sjá almennt outlook fyrir næstu þrjár nætur (general outlook for the
> next three nights); sjá hvaða nótt hefur hagstæðustu heildaraðstæður
> (which night has the most favorable overall conditions); **ekki** sjá
> locked location rankings eða nákvæmar Pro niðurstöður (not detailed
> per-location rankings or precise Pro results).
> Pro: full location ranking per night, best location, alternatives,
> explanations, map.

This is not a new decision to make — it is already specified in the source
issue and Ripley independently verified it via `gh issue view` during
preflight; this round's fresh fetch confirms the same text.

- Feature gate is unchanged: `northernLights: {tier:"pro", preview:true}`
  via `features.js` / `RequireFeature`. The issue's Free/Pro split is
  **within** the existing gate, not a new gate key: Free sees the 3-night
  general outlook + best-night summary (no `RequireFeature` block needed for
  that much), while the existing Pro-only detail (full per-night location
  ranking, alternatives, explanations, map) stays behind the existing
  `RequireFeature("northernLights", ...)` gate exactly as today's
  single-night detail already does — this is the same gate boundary,
  applied per-night instead of to one night.
- **Required new date-aware labels** (i18n, `translations.common.js`):
  per-night date label (e.g. "Tonight" / "Tomorrow" / actual weekday-date
  for the third night), a selected-night indicator, and the issue's own
  example copy ("Best conditions expected: Tonight", "Low chance across the
  next three nights" — see §5's all-poor state) as translation keys, not
  hardcoded strings, per this repo's i18n convention.
- Selected-night ranking/reasons/map must all re-derive from
  `display.qualifyingLocations` for the *currently selected* night only
  (reusing `auroraDisplaySelection.js`, `auroraReasonSummaries.js`,
  `NorthernLightsMap.jsx` exactly as today) — never mix locations/reasons
  from two different nights in one rendered list or map. The issue
  explicitly says not to build 3 separate maps ("Ekki búa til þrjú
  aðskilin kort") — this matches the existing single-map-per-selection
  design already in place.
- **The only genuinely open surface question (narrowed from Round 1):** how
  Icelandic-language access to this feature is provided. Today
  `/en/northern-lights` is the only standalone route and it is
  permanently forced-English (`t = useT("en")`, confirmed unchanged); no
  `/is/northern-lights` route exists, and the homepage IS surface is the
  card only. The issue does not specify a new IS route, and this audit
  does not propose inventing one or expanding homepage scope to
  compensate — how IS users reach the 3-night view (localized copy on the
  existing card, a future IS route, or another mechanism) is left for
  Ripley/Róbert to decide, not decided here.
- No entitlement/checkout logic changes are implied by any of the above.

## 7. Analytics proposal (requirement #8)

All three new events are additive; none of the 8 existing
`northern_lights_*` events, `stay_recommended`/`move_recommended`, or
checkout attribution (`upgrade_source`) are touched.

- **`northern_lights_night_selected`** — fires only on a genuine **user
  selection** action (tapping a different night), never on default mount or
  on the initial render of night 1. Params: `selected_date` (the chosen
  night's `eveningDate`, `YYYY-MM-DD`), `days_ahead` (0/1/2, integer,
  selected date minus today in the national/UTC evening sense already used
  by `todayEveningUtc`), `forecast_status` (one of the existing
  `classifyAuroraOutcome` `primary` values for that night at selection
  time), `user_tier` (`free`/`pro`).
- **`northern_lights_best_night_viewed`** — fires once per genuinely new
  best-night computation actually rendered to the user (deduped on the
  best-night's identity, e.g. `(selected best eveningDate, tone)`, the same
  "truthful viewed exposure, not repeated async completions" pattern
  `canonical_recommendation_viewed` already uses for the homepage decision
  card) — not on every re-render or every async resolution of a
  still-in-flight sibling night. Params: `selected_date` (the night judged
  best), `days_ahead`, `forecast_status`, `user_tier`.
- **`northern_lights_multi_day_upgrade_clicked`** — fires on the actual
  upgrade CTA click within the multi-night surface (mirrors the existing
  `northern_lights_upgrade_clicked` click-only semantics, not
  render/mount). Params: `selected_date` (whichever night was in view at
  click time), `days_ahead`, `forecast_status`, `user_tier` (expected
  `free` for this event by construction, but pass the real value rather
  than hardcoding).
- All three use `days_ahead` as a small bounded integer (0/1/2) and
  `forecast_status` as one of the existing small enum values already
  produced by `classifyAuroraOutcome` — no new unbounded string fields.

## 8. Test/acceptance plan (for Phase 2, not run in this audit)

- `darknessWindow.test.js` / `auroraScoring.test.js`: add an explicit
  Dec 31 → Jan 1 rollover case (currently only `auroraSeason.test.js` has
  an equivalent case) — flagged gap, not a defect.
- New tests for whichever request shape (A or B) is approved: if B, the new
  request/response contract needs its own validation tests, and per-night
  row-slicing must be tested against running the existing per-night window
  logic 3 separate times and asserting byte-identical `hourlyRows` per
  night (mirrors the two-phase-commit "prove no drift" discipline used in
  Ticket 417); if A, a test confirming 3 independent hook call sites each
  resolve to their own cache entry with no cross-talk.
- New tests for the §5 decision table (Round 3), one per row/example —
  no test may pass by accident since each scenario has a distinct expected
  `(within-night usability, comparison eligibility, displayed conclusion)`
  triple:
  - All pending (example 1): no final conclusion drawn, per-night "pending" shown.
  - Zero scored across all compared nights (example 2): no best-night, no
    all-poor claim — each night's own unavailable reason only.
  - One scored + others missing/unavailable (example 3): that one night's
    own outlook shown, no cross-night winner claimed.
  - Partial resolution with a pending night (example 4): resolved nights'
    own outlooks shown; final conclusion still withheld until all requested
    nights resolve.
  - Three poor, complete comparable data (example 5): all-three-poor copy
    **is** shown, and exactly matches the issue's own example string.
  - A missing candidate on one night (example 6): per-night results shown;
    comparison-unavailable notice shown; no winner declared.
  - Identical incomplete candidate sets (example 7): same as above even
    though the sets match each other — asserts the "complete" half of the
    eligibility check independently from the "identical" half.
  - Refresh-straddling timestamps (example 8): mismatched `sourceFetchedAt`
    → comparison-unavailable notice, even with full candidate sets on both
    sides.
  - Comparable but stale (example 9): comparison proceeds, but every
    compared night is visibly marked stale via the existing stale-data
    treatment.
  - The ineligibility notice itself must be asserted as a **visible** UI
    element in every relevant test, not merely an internal boolean/flag —
    directly testing the "no silent warning-only qualifier" requirement.
  - Near-tie/tie handling stays a tie-only assertion (equal score → both
    shown as equally good) — no test may assume or hardcode a near-tie
    tolerance value, since none is approved.
- New tests for the 3 new analytics events: user-selection-only firing for
  `northern_lights_night_selected` (not on mount), dedup-on-genuine-change
  firing for `northern_lights_best_night_viewed` (not on repeated async
  completions), and click-only firing for
  `northern_lights_multi_day_upgrade_clicked` — mirroring existing test
  patterns already used for `northern_lights_upgrade_clicked` etc.
- Existing 256 Aurora-related tests (§10) are the regression baseline —
  none should change behavior from Phase 2 changes to `NorthernLightsCard.jsx`
  alone if the data-layer contracts above are honored.

## 9. Explicitly unresolved decisions (for Ripley/Jonesy, not decided here) — Round 2 corrected

1. **Production DB migration status** — `aurora_forecast_cache.sql`'s
   "pending manual apply" comment is old and unverified either way; it
   proves neither that the table exists nor that it doesn't. **Round 3
   correction**: this is unverified operational context, not a gate on
   writing or reviewing Phase 2 code — the earlier framing ("must be
   confirmed... before Phase 2") manufactured a prerequisite the approved
   corrections explicitly reject. Checking real Neon production directly is
   still worth doing at *some* point before Phase 2 ships, but it does not
   block designing, reviewing, or writing Phase 2 code.
2. **Shape A vs Shape B** (§4, corrected) — Shape A is 18 calls with zero
   backend/hook changes; Shape B is 6 calls but requires a new
   request/response contract, new per-night server-side slicing logic, and
   a new or adapted client hook. This is now a real build-scope tradeoff to
   decide, not just a call-count choice.
3. ~~Cross-night freshness disclosure policy~~ — **resolved, not open**
   (Round 3): a `sourceFetchedAt` mismatch or incomplete/differing
   candidate set must produce a **visible** comparison-unavailable notice,
   never a silent-only internal flag — this is now settled in §5's decision
   table, not left as a UI-treatment choice. The detection mechanism uses
   only existing fields (no new server contract).
4. **Hook architecture for 3 concurrent nights** — 3 fixed call sites of
   the existing `useAuroraDecision` (Shape A) vs. a new multi-evening-aware
   hook (required for Shape B).
5. **Near-tie tolerance value** (§5) — a new proposed product parameter,
   not derived from any existing constant; needs explicit sign-off.
6. ~~Landing page scope~~ — **resolved, not open.** Confirmed via fresh
   `gh issue view 423`: Phase 5 explicitly requests the 3-night section on
   the Northern Lights landing page (the issue's own wording), which source
   inspection separately identifies as `/en/northern-lights` today. Free/Pro
   visibility there is explicitly specified in the issue (§6). The only
   remaining open item is item 7 below.
7. **How Icelandic-language access is provided** (§6, narrowed from the
   old "landing page scope" item) — no `/is/northern-lights` route is
   specified by the issue or proposed by this audit; the mechanism for IS
   users is left for review.
8. **Real current Vedur.is night count is unverified** — the only "10
   nights" reference in the repo is a synthetic test fixture/comment from an
   untraceable earlier session, not a retained live capture (§1). Phase 2
   must not assume 3 (or any fixed number ≥1) nights are always available
   from the real feed on a given day.

## 10. Commands actually run this session

- `npx vitest run api/_lib/aurora/ api/_lib/auroraDecision/ src/lib/auroraScoring.test.js src/lib/auroraCandidateRequest.test.js src/lib/auroraDecisionCache.test.js src/lib/auroraDecisionClassify.test.js src/lib/auroraBandPresentation.test.js src/lib/auroraReasonSummaries.test.js src/lib/auroraDisplaySelection.test.js src/lib/auroraSeason.test.js src/hooks/useAuroraDecision.test.js src/components/NorthernLightsCard.test.jsx src/pages/NorthernLightsLanding.test.jsx`
  → **23 test files, 256 tests, all passed.** No failures, no skips.
- One bounded `curl` GET to `https://api.open-meteo.com/v1/forecast`
  (Reykjavík candidate coordinate, `start_date=2026-09-25`,
  `end_date=2026-09-28`, the app's exact hourly field list, `timezone=UTC`)
  → HTTP 200, 96 hourly rows, 0 nulls in any of the 7 fields. Response
  evidence retained locally in the session scratchpad only (not committed
  to the repo — it is generic public weather data with no personal/session
  content, but is not needed as a permanent repo artifact).
- One `WebFetch` to `open-meteo.com/en/docs` for the documented forecast
  horizon (16 days max, default 7, `start_date`/`end_date` independent
  parameters).
- No Vedur.is fetch, no cron trigger, no DB read/write, no commit, no push.

**Round 2 (this correction) — commands run:**

- `gh issue view 423` — fetched the real GitHub issue in full, fresh (not
  relying on `prompt-review.md`'s summary), to independently verify the
  Phase 5 landing-page and Free/Pro claims corrected in §6/§9.
- Source re-reads (no writes): `useAuroraDecision.js`, `orchestrate.js`,
  `cache.js` (`persistAuroraSnapshot`/`readAuroraSnapshot`), `freshness.js`
  (`classifyAuroraCache`'s `sourceFetchedAt` field), and a grep confirming
  `generationtime_ms`/`issued`/`forecast_time`/`issueTime` are not
  referenced anywhere in `api/_lib/auroraDecision/` or
  `src/lib/auroraScoring.js`.
- No live provider probe was re-run or newly executed this round, per the
  Round 2 prompt's explicit instruction. The Round 1 baseline test run
  (23 files / 256 tests) was independently reproduced by Ripley during
  result review with the same count — not rerun again by CC this round
  since no new evidence required it.
- No Vedur.is fetch, no cron trigger, no DB read/write, no commit, no push.
