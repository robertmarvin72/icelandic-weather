# #429 — CC report

2026-10-27. CC. Executed `approved-prompt-v1.md` (bounded coverage/gap research, J1–J10 incorporated). No production implementation, commit, push, deploy, or GitHub mutation performed.

## Scope actually executed

All 7 items of the investigation contract, the full decision rubric, both distinct 8/10-item checklists (J10), and J1–J10 were addressed. Deliverables produced: `pre-sample-plan.md` (J2, frozen before any new request), `research-report.md` (Icelandic, first-page GO/PARTIAL/NO-GO memo), `source-register.md`, `coverage.csv`, `samples/manifest.md`, `samples/` (14 new retained network exchanges), `next-task-proposal.md`, this `cc-report.md`.

## Headline result

**Overall: PARTIAL** (reduced-scope information view only; original full Winter Route Advisor remains unauthorized for implementation regardless). **Route A (Vík): PARTIAL. Route B (Akureyri): PARTIAL. Route C (Borgarnes): PARTIAL.** Full rationale in `research-report.md` page 1 and §9b.

**Correction v2 note:** the v1 round reported Route A and C as "PASS/PARTIAL" — not a valid grade under the rubric's own PASS/PARTIAL/FAIL scale. Jonesy's R4 review caught this; the v2 correction round (below) applies the rubric capability-by-capability and lands all three routes on a single, defensible PARTIAL, with the specific blocking capability named per route (see `research-report.md` §9b and `harness/05_coverage_consistency_check-output.txt`).

## Status

- Baseline HEAD (start of this round): `349ff6889111f5d91021cf0de4033e5c17042f0f`.
- HEAD at end of this round: `349ff6889111f5d91021cf0de4033e5c17042f0f` (unchanged — no commit made).
- `git status --short` at end: ` M docs/ai/CURRENT.md`, `?? docs/ai/tasks/ticket-429/` — identical in shape to the status recorded at the start (same two paths); no other file touched.
- `git diff --check`: clean.
- No `.env`/`.vercel`/secret access. No account/registration/key used for any new request (all public hosts). No npm install. No application/test/config/instruction file touched.

## J1 — #450 hash verification

Recomputed all four SHA256 values independently on this checkout; all four match the approved prompt's pinned values exactly:

| File | SHA256 |
|---|---|
| `docs/ai/tasks/ticket-450/research-report.md` | `6ba7ab002225578bc647543d3fa4c242c4b72250d20164c5ec7319ea27e9e464` |
| `docs/ai/tasks/ticket-450/provider-matrix.csv` | `25e3d4f451d2823b4176165f574641aa0fe0262a89f3dfebabbd978286706883` |
| `docs/ai/tasks/ticket-450/source-register.md` | `c962369bed1e34228bbbc8d2d8a7ab4847ccca5d4621a5d355425c104a6dea00` |
| `docs/ai/tasks/ticket-450/cc-report.md` | `2f9c80be8ec334113a085730c1294d6194d498ff7f15a865013ffc03ea3da84d` |

No mismatch. #450's artifacts were not modified; reused by citation only.

## J2 — pre-sample freeze

`pre-sample-plan.md` was written and its own SHA256 computed (`48f1934d8211c960fc2dbe7bb12354a5e2c000724145dafcf7431474016f1384`, frozen 2026-10-27T19:05:26Z) **before** any new external HTTP request in this round. All 14 new network exchanges followed it.

## J3 — forecast source discipline

Every route grade and every `coverage.csv` row states the forecast source as "Open-Meteo (product identity unconfirmed)" or equivalent. Direct DMI is recorded as "not assessed here (#456)" throughout. No alternative provider was approved by CC. All new Open-Meteo requests used the public `api.open-meteo.com` host, no key; the 3 bundled multi-point requests (4+5+2 = 11 checkpoints) are logged with their point counts in `samples/manifest.md`. `src/lib/routeRisk.js`'s own `getForecast` caller (`useRoutePlanner.js`) was traced by content search and confirmed to use the same public-proxy mechanism (`research-report.md` §8).

## J4 — geometry/coordinate provenance

All checkpoint coordinates graded `VERIFIED SAMPLE` in `coverage.csv` come from the already-retained #450 Veðurstofa station catalog (WGS84 lat/lon) — zero new request for these. Checkpoints without an official coordinate source are marked `UNKNOWN`, not guessed. Vatnsskarð was added to the Akureyri corridor per J4 and received a full row in `coverage.csv` with a real `IdButur` (`908020037`) and active station (`33431`). Geodesic corridor length is `UNKNOWN` — **corrected v3 (R2): this is NOT a "within budget" limitation (the v1 wording was stale/misleading and is superseded by this note, not current guidance).** The true reason is that stitching the 108+ LineString fragments per `IdButur` into ordered, continuous geometry was NOT ATTEMPTED in any round — the CRS, `EPSG:3057`, is confirmed, but the fragment-ordering/stitching step itself was never started, regardless of remaining request/byte allowance.

## J5 — access findings

The one genuinely blocked endpoint (`PredefinedLocationsPublicationService`) failed by timeout (`curl: (28)`, not a 401/403/registration prompt) after 2 attempts — recorded as a blocker, not as ACCESS-BLOCKED in the registration/key sense, since no access barrier was actually encountered (the failure mode is a server-side timeout, distinguished in `source-register.md`). No registration-required or undocumented private endpoint was attempted anywhere in this round. Licence/reuse terms for Vegagerðin (both legacy and DATEX) are recorded as UNKNOWN — no clause found, no legal conclusion drawn.

## J6 — budget ledgers

Two separate ledgers maintained throughout (`samples/manifest.md`): data (12 successful + 2 failed-attempt exchanges, ≈2.4 MB, cap 30 req/20 MiB) and documentation/catalog (4 exchanges, ≈790 KB, cap 20 req/10 MiB — WFS `GetCapabilities`/`DescribeFeatureType` were logged in the data ledger instead, as a disclosed judgment call, since they query the live geometry service rather than a separate doc page). Every feature-service query was either a stated-field CQL filter (Route A geometry, bounded to 9 known IDs) or a full-feed fetch with `--max-filesize` as an abort safeguard — no unbounded download was attempted blind. No retry beyond the stated 2-attempt cap for the one failed endpoint. No bulk/GRIB/national-archive download.

## J7 — observation scope / #456 isolation

Stations were predeclared from the already-retained #450 catalog (`pre-sample-plan.md`) before any new observation request. No forecast-vs-observation accuracy comparison was made (that remains #456's scope, untouched). #456's own four starting stations (Keflavík, Ísafjörður, Hveravellir, Egilsstaðir) were not extended into a study — this round used a disjoint set of route-corridor stations. `coverage.csv` keeps observed/history, forecast and DATEX-measurement columns separate.

## J8 — synthetic fixtures

None were needed or created in this round — every closure-semantics finding (`OTHEKKT`/`LOKAD`/etc.) came from either the live documentation's own fixed-value enumeration (VERIFIED DOCUMENTATION) or the real live sample (VERIFIED SAMPLE). **Corrected v3 (superseding the v1 claim that "no `LOKAD` state actually observed"):** the v2 correction round's re-analysis of this same retained sample found ONE real `LOKAD` record (`IdButur` 903270037, "Nesjavallaleið", `harness/01_road_state_counts-output.txt`) — the v1 statement was wrong, not merely incomplete. What remains genuinely untested is `LOKAD`'s *behaviour over time* (e.g. whether `DagsSkrad` freezes across a closure/reopen cycle, which a single snapshot cannot show) — that distinction is the one that should have been drawn, not "no closure was in the sample" at all.

## J9 — routeRisk scope map

`src/lib/routeRisk.js` (blob `0b7c9c1a9f03eb68153797c543bdd4adc689c8be673b9ae4ca001f8fa67a1b79`) read in full. Caller confirmed by content search (`grep` for `estimateRouteRisk`, not filename): the sole production caller is `src/hooks/useRoutePlanner.js:200-205`, passing campsite coordinates (not road checkpoints) and the shared `forecastCache.js` `getForecast`. `samples: 7` (default, matches `Math.max(2, Number(samples)||7)` at line 61), `TOMORROW_INDEX = 1`, rain tracked (`rainMax`) but excluded from `classifyRouteRisk`, `dateVerified = anyDateSeen && !dateMismatch`, sequential `for...of` loop with per-point `try/catch` and no own timeout wrapper. Stated once, explicitly, in `research-report.md` §8: none of this transfers to road safety.

## J10 — the "8 items" and checklist mapping

Resolved as the 8 acceptance checkboxes in the current, live `#429` issue body (fetched via the retained `github-evidence-2026-10-27.json`, not re-fetched live this round — no GitHub API call was budget-relevant here since the evidence file was already current-session material from the prompt-review stage). Mapped individually in `research-report.md` §7. The preserved spike's 10 criteria are listed separately in §7b as historical, non-governing.

## Source provenance (file-byte SHA256, this checkout, same HEAD throughout)

**Corrected v2 (R8): these are SHA256 of the raw file bytes, NOT git blob SHA-1.** The v1 label "Blob SHA-1 (git hash-object)" was wrong — a real `git hash-object` run on the same three files gives 40-hex values that do NOT match the table below; the table's 64-hex values are plain `hashlib.sha256` of the file contents. Verified independently in `harness/06_provenance_label_check-output.txt`.

| File | SHA256 (file bytes) | git hash-object (SHA-1, for comparison — does NOT match) |
|---|---|---|
| `src/lib/routeRisk.js` | `0b7c9c1a9f03eb68153797c543bdd4adc689c8be673b9ae4ca001f8fa67a1b79` | `ba9a8a16233c4717dabb9cd00318bbedaf0c88ca` |
| `api/forecast.js` | `1c81af478fec1b34a2e97b26fc3cec1e1d1911d699c30a23a720a9e439b508fe` | `d0307cf7f80befc4c613b91e13e5d57166a599b0` |
| `docs/open-meteo-auth.md` | `106ce6d3b635baba5489935c91dcbe647d3c3d21393e68ff4629186ca351ca9d` | `f16a62ae2a566631930e175fd7140225729b8025` |

(New external samples' SHA256 hashes are in `samples/manifest.md` and `samples/_hashes.txt`, not repeated here.)

## Known limitations carried forward (updated v2)

- Several checkpoints (Hveragerði, Hvolsvöllur, Skógar, Bifröst/Baulan, Varmahlíð, the two tunnel checkpoints) have no official coordinate source identified across either round — `UNKNOWN`, not guessed, in `coverage.csv`. (Sandskeið's coordinate was always VERIFIED SAMPLE; only its DATEX match was previously missed — now fixed, R3.)
- Route B and Route C WFS geometry was never fetched in either round (not a timeout — genuinely not attempted; R5 forbade a new request this round to fix it). This is now an explicit capability-1 FAIL for those two routes in `research-report.md` §9b, not a silent gap.
- DATEX `PredefinedLocationsPublicationService` could not be reached (2 timeouts, v1) and was not retried (R5) — the DATEX-native section geometry representation remains unverified.
- Geodesic corridor length is `UNKNOWN` — the WFS geometry fragments were retrieved and their CRS confirmed, but stitching them into a continuous, measurable corridor was not attempted.
- A verified WGS84↔ISN93 (EPSG:3057) coordinate transform is `UNKNOWN`/not implemented — no dependency-free, independently-verifiable tool was available; hand-implementing the Lambert Conformal Conic projection without a precise verification point would itself have been a guessed transform, which the v2 correction explicitly prohibits. Station-to-road distances therefore stay `UNKNOWN` rather than the misleading `0` v1 used.
- DATEX-to-legacy ID crosswalk: numeric-suffix membership is now VERIFIED SAMPLE (full overlap, R7); semantic equivalence (same segment, same direction) remains `INFERRED`, not assumed or upgraded.
- Licence/reuse terms for Vegagerðin data (both systems) are `UNKNOWN` — no clause found on the fetched pages; now named as an explicit prerequisite in `next-task-proposal.md` (R9), not folded into "no dependencies".
- Open-Meteo production-rights (#453) and plain-HTTP-vs-HTTPS for the Vegagerðin hosts are both untested — named explicitly in `next-task-proposal.md` (R9).
- SafeTravel: not contacted, not fetched, per the owner's binding instruction.

## Correction round v2 (approved-prompt-v2.md, Jonesy R1–R9 incorporated per Ripley)

Executed entirely as a **re-analysis of retained samples already on disk** — per R5 (Ripley's decision), **no new external request of any kind** (data, documentation, GitHub, HTTPS probe, or retry) was made in this round. Every number below is reproducible from `harness/*.py` + `harness/*-output.txt` (new in this round) against the samples retained in v1.

| # | Required fix | What changed | Evidence |
|---|---|---|---|
| R1 | No analysis scripts existed; every number was a `node -e` ad hoc command | Added 6 read-only, task-local Python scripts (`harness/01`–`06`) covering road-state counts, WFS join/extents, DATEX RoadCondition parsing, DATEX site/measured-value matching, `coverage.csv` consistency, and provenance-label verification. Each prints its own input filenames + SHA256 before any finding. | `harness/*.py` + `harness/*-output.txt` |
| R2 | Closure semantics misreported (`LOKAD` "did not occur", `OTHEKKT` "3 times") | Corrected: `OTHEKKT` is 49 (not 3), `LOKAD` is 1 real record (`IdButur` 903270037). DATEX RoadCondition sample has 80 `roadClosed` + 89 `closedPermanentlyForTheWinter`. None of the 3 corridors' 22 real checkpoint segments has a closure record at this snapshot — that corridor-level statement stands; the "semantics were untestable" statement was wrong and is retracted. | `harness/01_road_state_counts-output.txt`, `harness/03_datex_roadcondition_analysis-output.txt` |
| R3 | Observation coverage understated by exact-name search | Sandskeið (`IRCA_MP_17`), Holtavörðuheiði (`IRCA_MP_3`), Vatnsskarð (`IRCA_MP_24`) all have real, live DATEX measured values, found by coordinate/ID match, not name search. `measurementSiteIdentification` confirmed to equal the Vedurstofa station number for 147 of 148 identified DATEX sites — a usable join v1 didn't use. `vedur_station_distance_m=0` cells (misleading — true only because checkpoint coordinates were copied from the station record) relabelled `N/A (by construction)` or `UNKNOWN` with a stated blocker (no verified WGS84↔ISN93 transform tool without adding a dependency; implementing one by hand without an independent verification point would itself be a guessed transform, which this round's instructions explicitly forbid). | `harness/04_datex_sites_match_analysis-output.txt`, `coverage.csv` diff |
| R4 | Page-1 counts contradicted `coverage.csv`; "PASS/PARTIAL" is not a rubric grade | `coverage.csv` consistency script gives the authoritative counts (21 rows, 20 unique checkpoints, 13 rows/12 unique with `coord_grade=VERIFIED SAMPLE`: A=5/B=6/C=2). Route grades corrected to single values: **A=PARTIAL, B=PARTIAL, C=PARTIAL** (capability-by-capability rationale in `research-report.md` §9b, new this round). Also discovered during re-analysis that Route A's geometry/join actually covers 6 of 9 checkpoints, not the 4 implied by v1's "(road-state only)" label on the Hvolsvöllur/Skógar rows — that label was itself wrong and is corrected upward, with evidence. | `harness/05_coverage_consistency_check-output.txt`, `research-report.md` §9b |
| R5 | "Budget" used to explain gaps the ledger shows were not budget-limited | Ripley decision: no additional requests. Every v1 "not tested — budget" statement was re-examined; where retained samples could resolve it (R2/R3/R6/R7), it was fixed from existing data. What remains genuinely unattempted (Route B/C WFS geometry, geodesic corridor length, Vík/Reykjavík DATEX coordinate matching, licence confirmation, HTTPS test) is now labelled "NOT ATTEMPTED" with its real reason, not "within budget". | this document; `research-report.md` §10 |
| R6 | `DagsSkrad` freshness range wrong | Corrected from the wrong "05:2x–13:3x UTC" to the real `02:55:00Z`–`18:19:41Z`, with the newly-found 340-of-708 (48%) `02:55:00/01Z` cohort reported as its own finding (cause UNKNOWN, not inferred). | `harness/01_road_state_counts-output.txt` |
| R7 | DATEX/legacy ID overlap not computed | Full set-intersection run: all 271 DATEX situation-ID suffixes and all 271 unique `PredefinedLocation` suffixes are members of the 708 legacy `IdButur` set. Reported as VERIFIED SAMPLE numeric-suffix overlap; semantic equivalence stays INFERRED (not upgraded) because `PredefinedLocationsPublicationService` geometry was never reached. | `harness/03_datex_roadcondition_analysis-output.txt` |
| R8 | SHA labelled "git blob SHA-1"; freeze-timestamp discrepancy unexamined | Relabelled to file-byte SHA256 (confirmed by running real `git hash-object` alongside, which gives different 40-hex values). `pre-sample-plan.md`'s filesystem mtime (`19:06:21Z`) does not equal its own claimed freeze time (`19:05:26Z`); both precede the first new request (`19:06:35Z`), so the required ordering still holds — the earlier time is no longer asserted as measured. | `harness/06_provenance_label_check-output.txt` |
| R9 | `next-task-proposal.md` not implementable as written; blockers omitted | Checkpoint count corrected (13 rows/12 unique, not "exactly 11"; Route A=5 not 9, Route B=6 not 5). Added Vegagerðin licence and Open-Meteo production-rights (#453) as named prerequisites, not "no dependencies". Added the plain-HTTP/HTTPS-untested caveat. Added the unmatched-span list between checkpoints. Effort estimate reframed explicitly as assumption-based. | `next-task-proposal.md` diff |

**Unperformed work, stated honestly (not relabelled as success):** Route B/C WFS geometry was not fetched (no new request this round, per R5); geodesic corridor length was not computed (fragment-stitching not attempted); a verified WGS84↔ISN93 coordinate transform was not implemented (would have been a guessed transform without an independent verification point, which this round's own instructions forbid); Vegagerðin licence terms remain unconfirmed; Open-Meteo HTTPS-vs-HTTP was not tested for the DATEX/legacy hosts; DATEX `PredefinedLocationsPublicationService` was not retried.

**Status (end of v2 round):** baseline HEAD and HEAD at end of round both `349ff6889111f5d91021cf0de4033e5c17042f0f` (unchanged). `git status --short`: ` M docs/ai/CURRENT.md`, `?? docs/ai/tasks/ticket-429/` (same two paths as before). `git diff --check`: clean. No `.env`/secret access, no new npm install, no application/test/config/instruction file touched, no commit/push/deploy/GitHub mutation. Zero new external network requests (R5).

## Correction round v3 (approved-prompt-v3.md, Jonesy's very narrow v2 re-check)

**Final citation correction (Ripley, 2026-10-28):** coverage.csv SHA256 `c2454ef197dfc2499545919063804fc3563e8e8c9ae495f0649b217fdfa25f17`, 15,828 bytes; demonstrated geometry-checkpoint counts A=6/B=0/C=0. This supersedes the v2 coverage hash/counts. Independently reproduced with harness/05 by Ripley; no new network request.


Jonesy's v2 re-check (sandbox re-runs of `harness/01`–`05`, byte-identical to CC's own output) found the v2 correction round's own fix was itself incomplete in one specific way: `coverage.csv` and `harness/05`'s counts still marked Route B and Route C's `geometry_join_result` as `VERIFIED SAMPLE` (B=9 rows, C=3 rows), directly contradicting `research-report.md`'s own new §9b, which correctly says no Route B/C WFS geometry was ever fetched (a stated capability-1 FAIL for those two routes). Two stale text passages were also flagged. **No new external request of any kind. No grade change** — all three routes remain PARTIAL, overall PARTIAL.

| # | Fix | What changed | Evidence |
|---|---|---|---|
| 1 | `coverage.csv` geometry cells for B/C said VERIFIED SAMPLE with no real WFS sample behind them | All 12 Route B/C rows' `geometry_join_result` relabelled `NOT TESTED -- road-state only; WFS geometry not fetched/demonstrated for this route`, `geometry_crs` relabelled `n/a` (was `EPSG:3057 (ISN93)`, which implied a CRS confirmation that never happened for these rows). Road-state/observation/forecast evidence in those rows is untouched — only the geometry cell was wrong. | `coverage.csv` diff |
| 1b | `harness/05`'s geometry count took a text-label match at face value | Strengthened: added `real_ids_in_cell()` (extracts actually-used IdButur values from a cell, excluding decoy-exclusion mentions, shared by both the geometry check and the corridor/closure check so the two can't drift apart) and `geometry_confirmed()` (a row counts only if its label says VERIFIED SAMPLE **and** at least one of its real IdButur values is an actual member of the retained Route A WFS sample's `IDBUTUR` set). Also added a live mismatch warning that fires if the label-only count and the evidence-backed count ever disagree again. Re-run result: **A=6, B=0, C=0** — matches Jonesy's expected correction exactly. Other counts (rows, coord grades, road-state matches, measured values, forecast) are unchanged from the v2 run, confirmed by diffing the two outputs. | `harness/05_coverage_consistency_check.py` + `-output.txt` |
| 2a | cc-report.md J4 said geodesic length was "not completed within this round's budget" | Corrected: budget was never the actual constraint (the v2 round already showed 14/30 and 4/20 requests used) — the true reason is that fragment-stitching was simply never attempted, in either round. Marked as a superseding correction, not a silent rewrite. | `cc-report.md` J4 (this file) |
| 2b | cc-report.md J8 said "no `LOKAD` state actually observed" | Corrected: the v2 round's own re-analysis of this same sample found one real `LOKAD` record. The v1/early statement was wrong, not incomplete — relabelled, with the genuinely-untested part (closure *behaviour over time*) now stated precisely. | `cc-report.md` J8 (this file) |
| 2c | `source-register.md`'s "Point-specific road-state endpoint" (V1) and `research-report.md` §10 used "budget" framing for gaps the ledger didn't actually constrain | See the diffs to those two files (same fix pattern: "NOT ATTEMPTED, true reason" replacing "within budget"). | `source-register.md`, `research-report.md` §10 |

**Housekeeping:** `harness/__pycache__/` and `harness/_tmp_legacy_check.txt` removed (both confirmed to resolve inside `docs/ai/tasks/ticket-429/harness/` before deletion, via PowerShell `Remove-Item -LiteralPath`, no recursive/broad search). All six harness scripts re-run with `python -B` to avoid regenerating bytecode; all exited 0.

**Status (end of v3 round):** HEAD unchanged `349ff6889111f5d91021cf0de4033e5c17042f0f`. `git status --short`: same two paths as every prior round (` M docs/ai/CURRENT.md`, `?? docs/ai/tasks/ticket-429/`). `git diff --check`: clean. Zero new network requests, zero commits, zero application/test/config/instruction files touched.

## Next in the workflow

Per `docs/ai/README.md`, this stage now goes to Jonesy for a re-check of this correction round, then Ripley for final assessment. A PASS here means the bounded research was delivered to the acceptance criteria — it does not mean the reduced-scope information product (or any part of the original Winter Route Advisor) is approved for implementation, and no GitHub issue was closed or created.
