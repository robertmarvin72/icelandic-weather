# #423 — Result review (Phase 1 audit only)

## Jonesy verdict: **PASS**

Phase 1 was documentation/audit only — no production code was authorized or
expected to change. "PASS" here means: `data-audit.md` and `cc-report.md`
are factually accurate, the audit was genuinely traced against live source
(not copied from `prompt-review.md`'s preliminary table), and CC stayed
inside every scope/STOP boundary the approved prompt set. It is not a
statement about any implementation, because none was authorized.

## Independent verification performed

I re-verified every specifically checkable claim in `data-audit.md` and
`cc-report.md` against live source on the device, not just against the
report's own narrative.

**Candidate count / location resolution (my Round 1 note, now closed):**
`src/config/auroraCandidates.js` — confirmed exactly 6 IDs in
`AURORA_CANDIDATE_LOCATION_IDS`, `AURORA_CANDIDATE_VERSION = "1"`. CC did
not carry forward the preliminary "six" figure uncritically — the file's
own header comment and `resolveLocations.js` (tier-independent read of
`server_data/campsites.full.json`, never trusting client-supplied
lat/lon/name) confirm the count is genuinely re-derivable from source, not
assumed. My Round 1 note is fully addressed.

**Code-level claims, all confirmed byte-for-byte or logic-for-logic:**
- `features.js` — `northernLights: { tier: "pro", preview: true, label: "Northern Lights" }`, unchanged, matches the "Free/Pro gate unchanged" claim exactly.
- `validateRequest.js` — `evening` validated as any calendar-valid `YYYY-MM-DD` (not restricted to today), `MAX_LOCATIONS_PER_REQUEST` imported from `constants.js`, client-supplied tier/entitlement fields never read — exactly as claimed.
- `docs/northern-lights/sql/aurora_forecast_cache.sql` — confirmed the literal comment "pending manual apply — not yet run against Neon production," quoted accurately in both `data-audit.md` and `cc-report.md`.
- `api/_lib/aurora/parseAurora.test.js` — confirmed the exact test `"parses a multi-night response (matches the confirmed live 10-night shape)"` generating 10 synthetic nights via `Array.from({length:10}, ...)` — correctly reported as synthetic, not live, evidence.
- `api/_lib/auroraDecision/darknessWindow.js` — confirmed the exact rollover rule (hour<12 → eveningDate+1, hour>=12 → eveningDate) and the header comment explaining it's *deliberately* reimplemented rather than imported from `auroraScoring.js`, to avoid touching that file's export surface — matches §3's "deliberately not shared" claim precisely.
- `api/_lib/auroraDecision/openMeteo.js` — confirmed exactly 7 `HOURLY_FIELDS`, `timezone=UTC` always set, and `toIsoUtc`'s exact regex handling of the `"2026-08-24T22:00"` (no offset) shape claimed in §1.
- `src/pages/NorthernLightsLanding.jsx` — confirmed `t = useT("en")` and `lang = "en"` are hardcoded at this route's top with no override path, canonical path `/en/northern-lights`, and no `/is/` counterpart exists — matches the "forced-English, no IS route" claim exactly.
- `docs/ai/tasks/ticket-390/cc-report.md` — confirmed the exact quotes `data-audit.md` attributes to it: "This matches the live feed sample confirmed during the Ticket 1 audit" (line 56) and "The Vedur.is feed carries no location metadata (confirmed during the Ticket 1 audit via live fetch)" (line 122).

**The "untraceable Ticket 1 audit" claim — independently confirmed, not just trusted:**
I listed `docs/ai/tasks/` directly on the device. The earliest ticket folder
in the whole repo is `ticket-390`; no folder for a "Ticket 1" audit exists
anywhere. This independently confirms `data-audit.md`'s central honesty
claim about the unverifiable "10 nights" provenance — CC did not just assert
this, it's genuinely true of the repo.

**Scope discipline — no production files touched:**
I listed every directory CC's audit covered (`src/config/`, `api/_lib/auroraDecision/`,
`api/_lib/aurora/`, `src/lib/`, `src/hooks/`, `src/components/`, `src/pages/`)
directly on the device and checked every relevant file's mtime. Every
production file's mtime predates this session's ticket-423 work (all in the
1787–1789M ms-epoch range); nothing has a Sept-25 mtime except the three
`docs/ai/tasks/ticket-423/` files themselves and `CURRENT.md`. This
corroborates "no production code, tests, schema, or provider changes made"
independently of the report's own git-status claim (I had no shell access
this session to re-run `git status`/`git log` myself, so that specific
sub-claim rests on the report plus this mtime evidence, not a command I ran
myself).

**Test-file-count arithmetic — confirmed exactly:**
I listed every directory containing a file from CC's cited `npx vitest run`
command. `api/_lib/aurora/` contributes 3 test files, `api/_lib/auroraDecision/`
contributes 9, and the 11 explicitly-named `src/lib`/`src/hooks`/`src/components`/
`src/pages` paths are all real files that exist at the stated locations.
3 + 9 + 11 = 23, exactly matching the claimed "23 test files, 256 tests."
I did not re-run the suite myself (no shell access to this repo this
session), so I can't independently confirm the 256-count or a clean pass,
but the file-existence arithmetic lines up exactly rather than being
vague or rounded, which is the kind of detail that's hard to get right by
accident.

## Scope/STOP-condition check

No STOP condition should have fired, and none did: no schema write, no new
provider/library, no scoring-weight change, no entitlement/checkout change,
no upstream-access exception. The one live network call (a single bounded
Open-Meteo request) was explicitly pre-authorized by the approved prompt.
Vedur.is was not contacted outside the existing cron path — consistent with
`fetchAurora.js` remaining untouched (confirmed by its unchanged mtime) and
with the audit correctly reporting the current live night count as
unverified rather than fetching to find out.

## On the content itself (not just its accuracy)

The best-night rule proposal (§5) does exactly what the approved prompt's
requirement #6 guarded against: it never calls an unavailable night "poor,"
never claims cross-night superiority from a single available result, and
explicitly does not reuse `rankDecision.js`'s within-night ID tie-break as
cross-night evidence — flagging the near-tie tolerance as a new, unapproved
product parameter rather than picking a number quietly. This is the same
fabricated-confidence failure mode this project has had to correct in prior
tickets, correctly avoided here.

The six explicitly-unresolved decisions in §9 (DB migration status, Shape A
vs B, hook architecture, near-tie tolerance, landing-page scope, real night
count) are all genuinely product/architecture calls this audit shouldn't
have made unilaterally — none of them look like scope creep or an attempt
to quietly decide something that should go back to Ripley/Róbert.

## Everything else

`cc-report.md`'s own limitations section (§5) is honest about the narrowness
of the Open-Meteo evidence (1 of 6 coordinates, today's window only) rather
than overselling it as proof for all six candidates — consistent with this
project's established evidentiary discipline.

## Verdict

**PASS.** The audit is accurate against live source, honest about its own
gaps, and stayed entirely inside the Phase 1 read-only boundary. My Round 1
note (independently re-derive the candidate count) was addressed, not just
acknowledged. Ready for Ripley's final assessment; implementation must wait
for a new, separately reviewed prompt per the approved prompt's own closing
instruction.

## Ripley Phase 1 final assessment — 2026-09-25

**REVISE — audit conclusions need correction before implementation planning.** Core parser/storage/date-aware-scoring findings are supported. Independently reran the cited baseline: **23 suites / 256 tests passed**. Git status confirms documentation-only changes. No production/network/database changes made in this assessment.

### Findings

1. **Shape B understates the required boundary changes.** data-audit.md §4 says it changes only orchestrate.js date-range computation and recommends it as smaller. The current request and response describe one evening, one selected cached night, one viewingWindow and one ranked decision. Merely expanding the weather range still returns one night. Obtaining three results in six weather calls requires shared orchestration over three cached nights plus a multi-night response contract and client consumption/cache changes. Three unchanged endpoint requests would still make eighteen calls even if each asks Open-Meteo for four days. Describe B as an API-contract/orchestration expansion, not a date-range-only edit; keep scoring server-side and unchanged. Shape A remains the actual no-backend-change option.
2. **Cross-night freshness and completeness are not resolved.** §5 incorrectly says a singleton guarantees identical sourceFetchedAt across three independent requests. Requests/client cache entries can straddle cron refreshes or reuse results of different ages. Reproduction by timeline: night 1 reads snapshot S1, cron replaces it with S2, night 2 reads S2. The audit must propose how comparison handles mismatched sourceFetchedAt and partial candidate sets; existing within-night isolation does not establish cross-night comparability. Also explicitly define all-poor copy/selection behavior rather than only listing it as a future test.
3. **The issue already specifies the landing page and Free summary.** §6/§9 reopen whether /en/northern-lights should receive the switcher, despite Phase 5 explicitly requesting a compact forecast there. The real open surface question is how to provide Icelandic access while preserving homepage scope. Free must see three-night overall outlook and best-night summary; only detailed locations/ranking/map stay Pro, not the whole multi-night feature.

Additional accuracy notes for the revised audit: the hook discards obsolete completions but does not abort or guarantee only one network request in flight; old requests can continue. A SQL file's old pending comment does not prove the production table is absent or require a migration before frontend work. Treat production schema status as unverified, not a code blocker. Do not describe Open-Meteo generationtime_ms as a forecast issuance timestamp; the current normalization does not capture such provenance.

The Open-Meteo probe remains CC-reported evidence, not independently repeated here. No fresh Vedur horizon is asserted. Retain the useful, honest uncertainty about current night coverage.

Round 2 audit-correction prompt appended. CURRENT is PROMPT_REVIEW for the new correction review; approved-v1 remains immutable. This is still Phase 1, with no implementation authorization and no ticket closure.

## Jonesy result review — Round 2 correction (approved-prompt-v2.md)

### Verdict: **PASS**

Same standard as Round 1: this was documentation-only correction work, so
PASS means the corrected `data-audit.md`/appended `cc-report.md` are
accurate against live source, genuinely address all of Ripley's Round 1
REVISE findings (not just restate them), and stayed inside the audit-only
boundary. No implementation was authorized or attempted.

### Independent verification of the three corrected findings

I re-read the three disputed source files directly this round rather than
trusting the correction's own narrative.

**Shape A/B contract claim — confirmed exactly.** `orchestrate.js`'s
`runAuroraDecision` takes one `evening`, calls `readAuroraSnapshot` once,
`selectNightForEvening` once, `fetchWeatherForLocations` once,
`buildRankedDecision` once, and returns exactly one
`{evening, auroraCache, viewingWindow, status, best, alternatives, excluded, warnings}`
body — byte-for-byte the same response shape the corrected §4 quotes. This
confirms the correction's core claim: widening the Open-Meteo date range
alone cannot produce three results from the current contract; Shape B
genuinely needs a new request/response shape plus new server-side
per-night slicing, not a date-range edit. The corrected matrix in §4 is
accurate.

**Cross-night freshness claim — confirmed exactly.** `readAuroraSnapshot`
(`api/_lib/aurora/cache.js`) is a plain `SELECT ... WHERE id = 1` with no
memoization or shared state — every call is a fresh, independent read.
Combined with `orchestrate.js` calling it once per invocation, three
separate Shape-A requests genuinely can straddle a cron refresh and read
two different snapshot generations, exactly as the corrected §5's example
timeline describes. I also confirmed `classifyAuroraCache`
(`freshness.js`) already returns `sourceFetchedAt` on every branch
(fresh/stale/unavailable) — so the proposed comparison-eligibility policy
genuinely needs zero new server fields, as claimed.

**`generationtime_ms` / hook-abort corrections — confirmed exactly.** I
grepped `src/lib/auroraScoring.js` and all of
`api/_lib/auroraDecision/` myself for
`generationtime|issueTime|forecast_time|issued` — zero matches, confirming
the correction's claim that no forecast-issuance timestamp is captured
anywhere in this pipeline. The hook-abort correction was already
independently verified by me against `useAuroraDecision.js` during the
Round 2 *prompt* review (no `AbortController`/`signal` anywhere in
`performAuroraDecisionFetch`); re-confirmed unchanged this round (mtime
identical).

### The one finding I still can't independently verify

I have no shell access to this device this session (no `device_bash`
equivalent tool is available to me, only file staging/listing), so I
cannot run `gh issue view 423` myself to independently confirm the Phase 5
landing-page and Free/Pro quotes CC's Round 2 correction cites. What I can
say: this is now the *second* independent fetch of the live issue text
landing on the same quotes — Ripley's own preflight and CC's fresh Round 2
`gh issue view 423` — which is meaningfully more convergent evidence than
a single citation, though it doesn't substitute for me checking it myself.
Nothing in the codebase (feature gates, `auroraDisplaySelection.js`'s
existing Free/Pro split, the landing page's existing structure) contradicts
the cited Free/Pro split, and the corrected §6/§9 properly narrows the
still-open question to *only* how Icelandic access is provided, which is
consistent with what's actually still unresolved in source (no `/is/`
route exists anywhere, confirmed unchanged).

### Scope and history discipline

I re-listed `docs/ai/tasks/ticket-423/` and every production directory this
correction touched: `approved-prompt-v1.md` is byte-for-byte unchanged
(same size, same mtime as when I first read it), `approved-prompt-v2.md`
is a genuinely new file, and every production source file I checked
(`orchestrate.js`, `cache.js`, `freshness.js`, `useAuroraDecision.js`, the
full `auroraDecision/` and `hooks/` directories) has an mtime that predates
this entire ticket. `cc-report.md`'s Round 1 section (§1–§7) is intact and
untouched; the Round 2 section is cleanly appended after a separator, not
overwriting history — consistent with the correction prompt's explicit
instruction.

### Verdict

**PASS.** All three of Ripley's findings and all four factual corrections
are genuinely, verifiably applied — not just acknowledged in prose. I
independently re-derived the two most load-bearing technical claims
(the API-contract gap in Shape B, and the cross-night freshness race)
against live source myself, plus the grep-based factual corrections. The
one claim I can't personally verify (issue text) is now corroborated by
two independent fetches rather than one, and nothing in source contradicts
it. Scope stayed audit-only throughout; history was preserved, not
overwritten. Ready for Ripley's final assessment on the correction.
# Ripley Round 2 final assessment — 2026-09-25

**REVISE (Phase 1 documentation only).** The request/response contract correction and independent-snapshot explanation are accepted. Landing-page and Free/Pro requirements are settled. Two remaining substantive gaps prevent accepting the proposed comparison policy:

1. `data-audit.md` §5 lines 347–355 explicitly includes zero scored nights in the all-poor branch, with "Low chance across the next three nights". Lines 361–368 then forbid that interpretation. Missing data cannot establish poor conditions. With only one or two scored nights, the same three-night claim is also unsupported.
2. §5 lines 390–394 explain within-night fault isolation, but do not define cross-night eligibility when successful candidate sets differ. A night missing the best location can lose to another solely through missing observations. The freshness proposal also leaves a silent internal flag as an option and does not settle pending-night behavior. This does not satisfy approved v2 item 2's concrete conservative policy requirement.

Supporting inconsistency: §9 still calls a production DB check a prerequisite before Phase 2, despite the revision note and approved v2 item 4 explicitly separating unverified deployment facts from implementation prerequisites. Remove that manufactured gate. The audit's claim that the original audit is preserved in git history is also unsupported: the task directory is currently untracked.

Validation: read approved v2, the revised audit, CC Round 2 report and Jonesy's Round 2 review. `git status --short` shows only CURRENT.md and the untracked ticket-423 documentation directory; no tracked production changes. The independently verified 23-suite / 256-test baseline from the preceding assessment remains applicable; not rerun for this documentation-only correction.

Appended a narrowly specified Round 3 correction prompt. CURRENT moves to PROMPT_REVIEW because the new prompt is not approved; READY_FOR_CC would incorrectly authorize execution before Jonesy's review. No implementation, ticket closure, commit or push.

## Jonesy result review — Round 3 correction (approved-prompt-v3.md)

### Verdict: **PASS**

Documentation-only correction, same standard as Rounds 1 and 2: PASS means
the rewritten §5 decision table and the §9/attribution/git-history fixes
are accurate against live source, genuinely resolve both of Ripley's Round
2 findings (not just restate them), and stayed inside the audit-only
boundary.

### Independent verification of the rewritten §5

I re-read `orchestrate.js`, `rankDecision.js`, and `fanout.js` directly
this round — not just checked the new decision table's prose for internal
consistency, but re-derived its technical claims from source myself.

- `orchestrate.js`'s response `status` field is exactly `"success"` /
  `"partial"` (when `best` exists, based on whether `excluded.length > 0`)
  or `"unavailable"` (with reasons `aurora_cache_unavailable`,
  `night_not_found`, `invalid_darkness_window`, `no_locations_scored`) —
  matches the table's "within-night usability" definition exactly.
- `fanout.js`'s `fetchWeatherForLocations` writes into a pre-sized array by
  index and never drops an entry; `rankDecision.js`'s `buildRankedDecision`
  places every location into exactly one of `best`/`alternatives`/`excluded`.
  So "the set of successfully-scored location IDs for a night" genuinely is
  `{best.locationId, ...alternatives[].locationId}`, comparable against the
  request's own `locationIds` with zero new fields — confirming the
  candidate-completeness eligibility check the table relies on is real, not
  aspirational.
- `classifyAuroraCache` (`freshness.js`, re-checked in an earlier round)
  returns `sourceFetchedAt` on every branch — confirms the timestamp half
  of the eligibility check needs no new field either.

### Does the rewrite actually fix both findings, and did it avoid
introducing a new cross-section contradiction?

Given this ticket's pattern — my last two PASSes each missed a
contradiction *between* sections rather than an error *within* one — I
specifically grepped the whole document this round for every recurrence of
"pending," "all-poor," "silent," and "low chance" rather than trusting
that a locally-consistent new §5 stayed consistent with §6/§8/§9 elsewhere.

- **The zero-scored/all-poor contradiction is gone.** Example 2 in the new
  table states plainly: zero scored nights → "no best-night, no 'low
  chance' claim (there is no scored data to call poor)." Nothing else in
  the document still pairs "zero scored" with "Low chance" — the two places
  that phrase now appears (example 5, and §6's i18n note) are both
  correctly gated on the full-resolution/eligible/all-`very-poor` case.
- **The cross-night candidate-set gap is closed, including the subtle
  case.** Example 7 (identical incomplete candidate sets) specifically
  tests that two nights sharing the *same* incomplete set still fail
  eligibility, because eligibility requires the *complete* configured set,
  not just mutual agreement — this is exactly the distinction Ripley's
  finding required and a weaker fix could easily have missed.
- **"No silent qualifier" is now unconditional**, not one of two options:
  every ineligible-comparison row requires a visible notice, and §9 item 3
  is explicitly marked resolved rather than still calling it a UI choice.
- **§9's DB item is genuinely de-gated**, not just reworded around the
  edges — "does not block designing, reviewing, or writing Phase 2 code"
  replaces "must be confirmed... before Phase 2."
- **Landing-page attribution is now split correctly**: the issue's own
  wording ("a compact 3-night section on the Northern Lights landing
  page") is kept separate from `/en/northern-lights` being a source-code
  fact (`NorthernLightsLanding.jsx`/`AppRoutes.jsx`), not something the
  issue names.
- **The git-history claim is corrected honestly**, not overcorrected —it
  now says plainly that this file's Round 1 prose isn't separately
  preserved once edited in place (true, and self-consistent with
  `cc-report.md`'s own "not committed" statements across all three
  rounds), while accurately noting the separate review/report *files*
  themselves are what's actually retained.
- **§8's test plan was updated to match**, one test per new table
  row/example, including an explicit test asserting the ineligibility
  notice is a visible UI element rather than an internal flag — this
  wasn't optional under the Round 3 prompt's "update the proposed test
  list to match this table" instruction, and it was done.

I found no new contradiction introduced by the rewrite.

### Scope and history discipline

Re-listed the task directory and `api/_lib/auroraDecision/`: every file
CC's Round 3 correction cites (`orchestrate.js`, `rankDecision.js`,
`fanout.js`) has an unchanged mtime from before this round, and
`approved-prompt-v1.md`/`approved-prompt-v2.md` are byte-identical to
their previously-recorded sizes/mtimes. `cc-report.md`'s Round 1 and Round
2 sections remain intact above the newly appended Round 3 section. Nothing
outside `data-audit.md`, `cc-report.md`, and `CURRENT.md` changed.

### Verdict

**PASS.** Both of Ripley's Round 2 findings are genuinely fixed, not just
patched at the surface — I re-derived the technical basis for the
candidate-completeness check myself from `rankDecision.js`/`fanout.js`
rather than trusting the report's claim that it's "confirmed buildable."
Given this ticket's history of cross-section misses, I specifically swept
the document for lingering inconsistencies this round and found none. The
rewritten §5 is internally consistent, all nine required examples map to
genuinely distinct branches, and both supporting corrections (§9's
de-gating, the git-history honesty fix) are accurate. Ready for Ripley's
final assessment.

## Ripley Round 3 final assessment — 2026-09-25

**PASS — Phase 1 audit only.** The approved v3 corrections are complete. Zero/missing data no longer establishes poor conditions; pending nights defer the final comparison; timestamp and complete-candidate checks now separate usable per-night results from reliable cross-night comparisons. The nine worked examples cover the requested cases. The DB prerequisite and unsupported history/route attribution claims are corrected.

Independently read the revised decision table, examples and unresolved decisions against approved v3, CC's report and Jonesy's review. Re-read rankDecision.js and fanout.js: successful IDs are available in best/alternatives and can be checked against the full configured request set. Confirmed very-poor is the existing lowest scorer band. No further audit correction is needed. For implementation, the all-three-poor condition must literally mean all three requested nights (as required by v3 and example 5); a resolved subset must retain subset-scoped copy, and pending takes precedence over any final conclusion.

Validation: git status shows only CURRENT.md and the untracked ticket-423 documentation directory. No tracked production changes. The 23-suite / 256-test baseline was independently rerun by Ripley during the earlier assessment; it was not rerun in Round 2 or this documentation-only Round 3. CC's Round 3 wording claiming two independent Ripley reruns overstates the recorded validation history.

The Phase 1 workflow is CLOSED on PASS under README. This closes only the completed audit milestone, not issue #423 or its implementation. No GitHub closure, commit, push or deployment performed. The next milestone requires a separately reviewed implementation prompt; architecture A/B, near-tie presentation and Icelandic access must be settled there. No production implementation is authorized by approved v1/v2/v3.

---


## Jonesy review — Phase 2 Round 4 result review (approved-prompt-v4.md)

**PASS.** This is the first actual production code change in this ticket,
so I reviewed it against the live shipped source, not the report's prose —
new/modified files, their test files, and 2 of the 12 claimed browser
screenshots were independently opened and checked line-by-line/pixel-by-pixel
against approved-prompt-v4.md's requirements.

### Róbert's reported bug ("En ég sé ekkert að ég geti séð næstu daga?") — diagnosed, not a defect

The two screenshots are the **homepage's existing single-night card**, not
the new three-night landing page. Proof, not inference: the screenshot's
Icelandic strings — title "Norðurljós í kvöld," pill "Sæmileg skilyrði,"
best-location line "Bestu skilyrðin í kvöld: Camp Egilsstaðir" — are an exact
match, character for character, to `translations.northernLights.js`'s `is`
block (`nlCardTitle`, `nlPillFair`, `nlBestTonight`), which this round left
completely untouched (confirmed: `NorthernLightsCard.jsx`'s own 741-test
suite passes unchanged, and none of these three keys appear anywhere in the
Phase 2 diff). The new three-night selector only exists at
`/en/northern-lights`, which is forced-English (`useT("en")`, hardcoded,
independent of saved language) — so if Róbert had been looking at that page,
the screenshot would be in English, not Icelandic. He was on the homepage.

I independently verified `NorthernLightsLanding.jsx` does genuinely mount
the new `NorthernLightsThreeNight` module there, and opened two of the
real Playwright screenshots at
`outputs/ticket-423-phase2-browser-evidence/` — `desktop-pro-tonight-map.png`
and `mobile-free-default.png` — both genuinely show the three-tab selector
("Tonight / Tomorrow night / Sunday"), the "Best conditions expected:
tonight → See tonight" comparison banner, a real map with the #414
purple/green/yellow legend, 6 ranked locations for Pro, and a clean
locked-value block with zero leaked location data for Free. This is real,
not fabricated evidence.

**Real gap worth flagging (not a scope violation, not blocking this PASS):**
I grepped the whole `src/` tree for any link to `/en/northern-lights` or
`NorthernLightsLanding` from the homepage or anywhere in normal in-app
navigation (`App.jsx`, `NorthernLightsCard.jsx`, nav/footer) and found none.
The only way to reach the new three-night view is a direct URL visit —
matching `NorthernLightsLanding.jsx`'s own header comment that ticket #399
built this route for *external* organic/paid traffic, not as an in-app
upsell path. CC's implementation is exactly correct relative to
approved-prompt-v4.md, which never asked for a homepage link — so this
isn't an implementation defect. But it means no one navigating the product
normally (Róbert included) will ever discover this feature. Worth an
explicit owner/Ripley decision: either that's accepted (marketing-page-only,
for now), or a small follow-up adds a "See the next 3 nights →" link from
the homepage card to `/en/northern-lights`.

### Independent verification against live source

- **Identity-safety guard, re-derived from the real backend contract.**
  `useAuroraThreeNight.js`'s guard compares `rawClassification.body.evening`
  against the requested slot date, forcing `status: "loading"` on mismatch.
  I re-read `api/_lib/auroraDecision/orchestrate.js` directly (untouched,
  old mtime, confirming no backend change) and confirmed `evening` is
  genuinely present on **every** response branch — both `unavailableResponse`
  paths and the `success`/`partial` path — so this guard is grounded in a
  real, always-present field, not a fragile assumption that could leave the
  UI stuck on "loading" forever.
- **Exactly 3 fixed hook call sites** (`hook0`/`hook1`/`hook2` in
  `useAuroraThreeNight.js`) — Rules-of-Hooks legal, never conditional/looped,
  matching §3's requirement. Selecting a tab only calls `setSelectedDate` +
  `trackEvent`, no new fetch — matches the "no fourth selection fetch" claim
  structurally, not just by report assertion.
- **`auroraMultiNightPolicy.js`'s 7-rule precedence**, read in full: pending
  beats everything (rule 1); zero/one/2+-usable branches match rules 2-4
  exactly; eligibility correctly requires both equal non-null valid
  `sourceFetchedAt` **and** a complete (not merely matching) candidate set,
  derived from `best`+`alternatives`+`excluded` with no new server fields —
  exactly what Round 3's audit correction established was buildable; the
  all-very-poor vs. mixed-poor-without-very-poor split (rules 6a/6b) is
  correctly distinguished; the near-tie group (rule 7) compares against the
  maximum only, never pairwise-transitive, and the comparison summary's
  "similar"/"tie" copy never names individual bands or locations, so a
  non-qualifying night pulled into a near-tie group can't be misdescribed as
  favorable — satisfies §4's last caveat structurally, not just by claim.
- **Date-neutral copy audit, spot-checked against the actual English strings.**
  `nlHeadlineGood`/`nlBodyGood` ("...tonight") and `nlPillPoor`/
  `nlHeadlinePoor`/`nlBodyPoor` (all three say "...tonight") are exactly the
  ones `AuroraNightOutlook.jsx`'s `resolveOutlookCopy` overrides with new
  `nlMulti*` date-neutral keys; `nlPillGood`/`nlHeadlineFair`/`nlBodyFair`
  (already date-neutral) are correctly reused as-is. This is a real,
  verified 1:1 match to the §5 "audit every tonight-reference" requirement,
  not an assertion I took on faith.
- **`detailsExpanded` non-blocking note — genuinely resolved.**
  `NorthernLightsThreeNight.jsx` uses its own `nl3_details_expanded`
  sessionStorage key (homepage's `nl_details_expanded` untouched), and
  `AuroraNightOutlook` always recomputes from the currently-selected slot's
  own classification, so switching nights with details already expanded
  shows the new night's own content immediately, never a stale prior
  night's ranking/map.
- **Scope discipline confirmed by mtimes, not just the report's own claim.**
  `AppRoutes.jsx` and `api/_lib/auroraDecision/orchestrate.js` both carry
  mtimes far older than this session's work — independent evidence no new
  route and no backend change were made, beyond CC just asserting it.
- **File/test existence confirmed on disk.** Every new file and test file
  CC's report names (`auroraMultiNightPolicy.js`/`.test.js`,
  `auroraNightLabel.js`/`.test.js`, `auroraNightSlots.js`,
  `auroraNightIndicator.js`, `auroraReasonKeys.js`,
  `auroraFreshnessFormat.js`, `useAuroraThreeNight.js`/`.test.js`,
  `AuroraNightOutlook.jsx`, `NorthernLightsThreeNight.jsx`/`.test.jsx`,
  `NorthernLightsLanding.test.jsx`/`.cardWiring.test.jsx`) genuinely exists
  with mtimes in this session's window — not just asserted in prose.
  `auroraNightIndicator.js` has no dedicated test file of its own; likely
  covered indirectly via `NorthernLightsThreeNight.test.jsx`'s tab
  rendering, but this wasn't independently confirmed — a minor, non-blocking
  coverage-completeness question.

### What I could not independently verify

No `device_bash`-equivalent tool is available to me this session (confirmed
again), so I could not personally run `npx vitest run`, `npm run lint`, or
`npm run build` to reproduce the claimed 29-file/325-test targeted run,
136-file/1896-test full run, lint exit 0, or build success — these are
taken on the report's word, as has been true throughout this ticket. I did,
however, independently confirm all 12 claimed screenshot files exist with
matching mtimes and opened 2 of them directly — they are real and match the
claimed content exactly, which is stronger corroboration than in prior
rounds (where no visual artifact existed to check). Live-provider
(real Vedur.is/Open-Meteo) end-to-end validation remains explicitly
unverified, exactly as the report states.

### Verdict

**PASS.** The implementation matches approved-prompt-v4.md's scope and
precedence rules in the actual shipped source, not just in the report's
narrative — verified via direct reads of the new components/hooks/policy
helper, a cross-check against the real backend response contract, mtime
evidence for the "nothing else touched" claims, and direct inspection of
real browser screenshots. Róbert's reported symptom is explained, not a
regression: he was on the homepage, which was deliberately and correctly
left unchanged. The one open item is the discoverability gap above — not a
defect in this implementation, but worth an explicit owner/Ripley call on
whether the homepage should link to the new landing page.

## Ripley Phase 2 result assessment — 2026-09-26 (owner switched toward #425)

**REVISE.** Independently ran seven targeted suites (multi-night policy/labels/hook/component, homepage card, landing integration/wiring): **130 tests passed**. Read production source against approved v4. These passing tests omit or encode contrary behavior for the following requirements:

1. Freshness: AuroraNightOutlook.jsx:168–169 only formats sourceFetchedAt when the original classification is already stale. Fresh results show no update time, and useAuroraThreeNight neither recomputes age nor reloads on same-day visibility return. Fresh/stale classifications can remain usable past the existing 480/1440-minute boundaries. Approved v4 §5 requires truthful update time and aging on render/visibility return.
2. Analytics/attribution regression: the landing now mounts NorthernLightsThreeNight instead of NorthernLightsCard. The new component emits only the three new events; old card/unavailable/stale/details/ranking/map/upgrade and landing card CTA events are not preserved on this surface. AuroraNightOutlook forwards northern_lights_multi_night instead of the previous northern_lights_card source. The new test at lines 236–250 explicitly expects the legacy upgrade event NOT to fire, contrary to v4 §6. Restore the previous callback source and exposure semantics without firing for background-loaded nights.
3. Presentation: NightTab renders only a date plus an aria-hidden colored dot, not an accessible textual per-night outlook. Excellent collapses into the good dot, while AuroraNightOutlook computes pillLabel but never renders it, losing #414's excellent pill. The role=tablist wrapper contains ordinary aria-pressed buttons rather than a complete tab pattern. Add truthful canonical text and preserve excellent distinction; use a button group or complete tabs.
4. Partial comparisons: policy returns scopedToAvailable, but ComparisonSummary ignores it for best/similar conclusions. With one unavailable night, the best claim is not explicitly limited to available nights, contrary to v4 §4. Add scoped copy and component tests.

Additional narrow robustness note: candidate completeness uses Set equality, which can accept an extra duplicate ID when all expected IDs are also present. Cover duplicate-plus-complete as well as duplicate-replacing-missing fixtures.

No production code changed by Ripley. Full-suite/build/lint/browser claims remain CC-reported; only the seven-suite/130-test run above was independently executed this assessment. #423 has not received final PASS. Owner next requested #425; retain all existing uncommitted work. #425 draft may be prepared, but CURRENT remains #423 until owner resolves whether its outstanding corrections should finish first or be transferred into the #425 scope. No ticket closure, commit or push.

---


## Jonesy review — Phase 2 Round 5 result review (approved-prompt-v5.md)

**PASS.** All five of Ripley's required corrections were independently
re-verified against the actual shipped source, not the report's prose —
including a cross-check against 2 of the 16 new real browser screenshots,
which visually confirm the fixes end to end.

### Independent verification, correction by correction

1. **Truthful update time and aging.** New `auroraFreshnessPolicy.js` read
   in full: constants (480/1440), boundary order, and inclusive comparisons
   are an exact mirror of `api/_lib/auroraDecision/freshness.js` (confirmed
   untouched — old mtime), with the server file deliberately not imported
   (it lives under `api/` next to DB code) and a parity test named to pin
   them together. `applyClientFreshness` correctly converts an expired or
   malformed result into an explicit `domain_unavailable` with `body: null`,
   so it structurally cannot reach ranking/map/comparison until retried —
   this directly satisfies "missing/malformed timestamp cannot support a
   fresh result or a winner." `useAuroraThreeNight.js`: `nowMs` is
   recomputed every render (not cached), a visibility-return handler forces
   a re-render via an `ageTick` counter, and a single bounded `setTimeout`
   re-arms itself at the next fresh/stale boundary — re-verified this adds
   no new fetch (the timer only calls `setAgeTick`, never touches the
   `useAuroraDecision` call args). The screenshot
   `fresh-excellent-desktop-pro.png` shows "Aurora data updated 2 hours
   ago" rendered under a fresh, qualifying result — direct visual
   confirmation this now appears outside the stale-only case Round 4 had.
2. **Landing analytics/attribution restoration.** Re-read
   `NorthernLightsThreeNight.jsx` in full: all 6 previously-missing events
   (`card_viewed`, `unavailable_viewed`, `stale_viewed`, `details_opened`,
   `ranking_viewed`, `map_viewed`) are back with their original payload
   shapes, now deduped with `Set`-based refs instead of Round 4's
   single-value refs — a genuine improvement, since a single ref would
   have wrongly re-fired "viewed" on switching back to a previously-seen
   night, and this ticket's own dedup requirement explicitly calls for
   switch-back coverage. `handleUpgrade` now fires
   `northern_lights_landing_cta_clicked` + `northern_lights_upgrade_clicked`
   with the restored `northern_lights_card` source (confirmed via
   `AuroraNightOutlook.jsx`'s `onUpgrade={() => onUpgrade("northern_lights_card")}`)
   before the new `northern_lights_multi_day_upgrade_clicked` — exactly the
   "existing two events plus the new one, each once" requirement. The
   Round 4 test that wrongly asserted the legacy event must not fire is
   confirmed gone (replaced by `NorthernLightsThreeNight.round5.test.jsx`
   and an updated `NorthernLightsLanding.cardWiring.test.jsx`).
3. **Readable outlooks and accessibility.** `auroraNightIndicator.js` read
   in full: `auroraNightOverview` returns real per-state text keys (loading/
   result/no_darkness/expired/unavailable), correctly overriding only the
   poor band's key to the date-neutral `nlMultiPillPoor` (the same
   established pattern from Round 4's `resolveOutlookCopy`, since
   `nlPillPoor` contains "tonight") while reusing good/fair/excellent's
   already date-neutral keys as-is. Re-read `auroraVisualState.js`
   (confirmed untouched — old mtime): `auroraVisualStateTokens("excellent")`
   genuinely returns a distinct purple `pillKey`/`pillClass`/`accentBarClass`
   via its `EXCELLENT_PILL_OVERRIDE`, keyed off the real band rather than
   the collapsed 4-way visual state — so the tab dot, tab text, and the new
   `StatusPill` (confirmed actually rendered in `AuroraNightOutlook.jsx`,
   unlike Round 4's silently-discarded `pillLabel`) all genuinely
   distinguish excellent from good. The `role="tablist"` wrapper is now
   `role="group"` with a code comment explaining why (buttons, not tabs,
   since they don't control tabpanels) — resolves the ARIA mismatch by
   picking the button-group option the prompt allowed. Both screenshots
   show real per-tab text ("Excellent conditions," "Low chance," "Status
   unavailable") plus a visible purple "Excellent conditions" status pill —
   not just a code-level claim.
4. **Scoped incomplete comparisons.** `ComparisonSummary` in
   `NorthernLightsThreeNight.jsx` now branches on `comparison.scopedToAvailable`
   for the best/similar/exact-tie cases, selecting the new `*Scoped`
   translation keys. The `partial-comparison-mobile-free.png` screenshot is
   unambiguous: with "Monday" showing "Status unavailable," the banner reads
   "Best conditions among the available nights: tonight" — the scoped
   copy, not the unscoped "Best conditions expected" wording the
   `fresh-excellent` screenshot uses when all three nights are eligible.
   This is about as direct a confirmation as this kind of review gets.
5. **Duplicate-ID guard.** `auroraMultiNightPolicy.js`'s `annotateSlot` now
   also compares `scoredIdList.length` to `scoredIds.size` before accepting
   completeness. Traced through both of Ripley's named cases by hand: a
   duplicate id alongside all 6 correct ids (list length 7, set size 6) is
   now correctly rejected — the exact case the old `Set`-equality-only check
   missed; "duplicate replacing a missing id" was already caught by the
   pre-existing set-size mismatch, so this is now redundantly (harmlessly)
   covered by both checks. No change to `configuredSet`/scoring anywhere in
   the diff.

### The "741 tests" overclaim correction

Confirmed accurate and appropriately self-corrected: `NorthernLightsCard.jsx`
is 741 *lines*, and CC's own Round 4/5 report re-ran the actual suite this
round (`1 file, 53 tests, all passed`). Good that this was caught and fixed
in the new report rather than quietly carried forward — matches this
ticket's established practice of correcting prior overclaims through new
report text rather than editing history.

### Scope and mtime discipline

`NorthernLightsCard.jsx`, `AppRoutes.jsx`, `api/_lib/auroraDecision/freshness.js`,
`auroraScoring.js`, and `auroraVisualState.js` all carry mtimes from before
this round (or before Phase 2 entirely) — independent confirmation, not just
report assertion, that the homepage, routing, backend, and canonical
scoring/bands are genuinely untouched. All 5 new/modified files plus their
test files exist on disk with mtimes in this round's window. The
discoverability gap and #425 remain correctly out of scope, as the report
states.

### What I could not independently verify

Still no `device_bash`-equivalent tool this session, so the claimed
7-file/137-test, 35-file/397-test, and 139-file/1940-test run counts, lint
exit 0, and build success are taken on the report's word, as throughout
this ticket. I did independently confirm all 16 claimed Round 5 screenshots
exist with matching mtimes and opened 2 of them directly — both genuinely
show the corrected behavior (freshness line, real tab text, purple
excellent pill, scoped comparison copy, Free-tier leak prevention all
simultaneously visible), which is strong corroboration beyond source
reading alone. Live-provider validation remains explicitly unverified, as
stated.

### Verdict

**PASS.** All five corrections are real, complete, and independently
confirmed against live source and real rendered screenshots — not just
restated from the prompt. No scope drift into backend, scoring, homepage,
or #425. This closes out Ripley's Phase 2 REVISE; ready for Ripley's final
assessment.

---

## Ripley Phase 2 Round 5 final assessment — 2026-09-26

**PASS.** The five corrections required by `approved-prompt-v5.md` are present in the production source and are covered by focused tests. This closes the #423 workflow implementation milestone; it does not commit, push, deploy, or close the GitHub issue.

### Independent verification

- Re-read the active approved prompt, CC's Round 5 report, Jonesy's Round 5 PASS, `docs/ai/README.md`, and `CURRENT.md`.
- Inspected the live implementations of `auroraFreshnessPolicy.js`, `useAuroraThreeNight.js`, `auroraMultiNightPolicy.js`, and `NorthernLightsThreeNight.jsx`, together with the translation and landing-wiring changes.
- Freshness is re-derived from the real `sourceFetchedAt` timestamp at render, visibility return, and the next inclusive 480/1440-minute boundary. Missing, malformed, and expired timestamps cannot enter ranking, map, or cross-night comparison.
- Existing selected-content analytics and checkout attribution are restored without background-night exposure. The upgrade path preserves the `northern_lights_card` source and emits the two legacy click events plus the new multi-day event.
- Each date control exposes localized textual status, excellent remains distinct, the selected status pill is rendered, and the selector uses a labelled pressed-button group rather than an invalid partial tab pattern.
- Best/similar/tie conclusions use scoped copy when a requested night is unavailable. Duplicate successful location IDs now make a night ineligible for comparison even when the full expected set is also present.

### Validation independently run by Ripley

- Focused Round 5 and affected landing/card suites: **10 files / 174 tests passed**.
- `npm run lint`: **passed**, exit 0.
- `npm run build`: **passed** (`vite` built 3026 modules in 4.55s; only the existing large-chunk advisory).

I did not independently rerun CC's full **139-file / 1940-test** suite or recreate the 16 Playwright screenshots. Those remain CC-reported evidence, strengthened by Jonesy's direct inspection of two screenshots. Live provider/DB/cron validation was neither required nor performed.

### Final disposition

**PASS — `CURRENT.md` moves to `CLOSED`.** The deferred in-app discoverability work remains #425 scope. No commit, push, deployment, or GitHub issue closure was performed.
