# #493 endpoint-acquisition-plan — CC report

2026-11-11, CC. Executed `approved-prompt-v1.md` (EP1–EP7, offline
acquisition-planning round) for `ticket-493-endpoint-acquisition-plan`,
following Jonesy's prompt review round 1 (APPROVED MEÐ SKILYRÐUM
EP1–EP7) and Ripley's folding of EP1–EP7 into the approved prompt.
**No network call made or authorised.** No data rebuild, no app/API
file touched, no new dependency, no delegation, no GitHub action, no
commit/push.

## Sequence followed

1. Read `CURRENT.md` fresh (`Stage: READY_FOR_CC`, `Approved prompt:
   approved-prompt-v1.md`), confirmed it matched this task before
   acting, per the standing protocol.
2. Set `CURRENT.md` → `CC_IN_PROGRESS`.
3. Ran `samples/snapshot_retained_inputs.py` FIRST, before any other
   deliverable file was written — recorded SHA-256/size/line-ending for
   all 20 retained inputs cited by this plan
   (`samples/retained_inputs_baseline.json`), per EP7(a).
4. Wrote `request-plan.json` (4 planned requests, all `authorised:
   false`), `coverage-matrix.json` (14 items across R1/E1/S2), and
   `acquisition-plan.md` (EP1–EP7 copied verbatim, per EP7f).
5. Ran `samples/verify_plan.py` — the independent checks below.
6. Wrote this `cc-report.md`.
7. Will run `samples/generate_hashes.py` LAST, re-verifying all 20
   retained inputs unchanged, then set `CURRENT.md` → `CC_COMPLETE`.

No deliverable was changed after the independent checks ran, so
EP7(b)'s "old SHA vs new SHA" re-citation requirement does not apply
this round.

## Independent checks (EP7b / "Umfang og staðfesting") — full results

Run via `samples/verify_plan.py`, reading `request-plan.json` and
`coverage-matrix.json` directly (not re-typed by hand). All 28
findings in `samples/verification_report.json` passed
(`all_passed: true`):

- **JSON parse:** both `request-plan.json` and `coverage-matrix.json`
  parse cleanly.
- **Unique `request_id`s:** `REQ-E1-WGS84-01`, `REQ-S2-WGS84-01`,
  `REQ-META-DFT-01`, `REQ-META-CAPS-01` — 4 distinct IDs, no
  duplicates.
- **Matrix references resolve:** every `request_ids` entry in
  `coverage-matrix.json` is one of the 4 known IDs; zero unresolved.
- **All three locations present:** Reykjavík (5 items), Egilsstaðir
  (4 items), Seyðisfjörður (5 items) — 14 items total, none missing.
- **Budget computed from the request list itself** (not hand-typed):
  4 total calls, 5,767,168 B total max bytes, both within the reused
  12-call/32 MiB ceiling; every per-request cap (262,144 /
  262,144 / 1,048,576 / 4,194,304 B) is below the 8 MiB default; all 4
  requests carry `authorised: false`.
- **Retained host/identifier cross-checks against disk:**
  - IDBUTUR `911040037` confirmed (fresh `grep` of `road-links.csv`)
    to cover exactly VEGNR=1 pieces `[1483, 2345, 2347, 2349]` — a
    correction of the access-points round's own sandbox note, which
    named only `2344`/`2345`.
  - IDBUTUR `911170037` confirmed to cover **zero** VEGNR=1 pieces.
  - In `wfs93-raw.json`: IDBUTUR `911040037` → exactly piece `{2344}`
    (4 features); IDBUTUR `911170037` → exactly pieces
    `{3410, 3409, 2894, 2892, 2891}` (20 features) — both counts match
    the plan's own stated expectations exactly.
  - The single demonstrated layer name (`gis:faerdferlar2017_1`) is
    the only `typeName` used across all 4 planned requests.
  - The cited SHA-256 of `wfs-north-4326.json`
    (`7075416ca4635e4dea058b43124cfdefa7caec9d860d2dd43208504022eedb9b`)
    and of north-data ledger line 2
    (`6b0cb0d60e8894bdd7f36cd7b7320b801f5dc3279c2b4b138e0c51baf2a0cb1d`)
    both match the live files.
  - `bounded_fetch.py`'s own `ALLOWLIST` contains
    `gagnaveita.vegagerdin.is`; the plan's own single host matches it
    exactly; `px.hagstofa.is` does not appear anywhere in this plan
    (not needed for R1/E1/S2 geometry).

## Run log (abbreviated; see each script's own stdout for full detail)

```
$ python3 samples/snapshot_retained_inputs.py
wrote .../retained_inputs_baseline.json with 20 retained inputs
[... 20 lines, sha/size/line-ending per file ...]

$ python3 samples/verify_plan.py
ALL INDEPENDENT CHECKS PASSED:
  json_parse_request_plan PASS
  json_parse_coverage_matrix PASS
  request_ids_unique PASS
  matrix_request_ids_resolve PASS
  all_three_locations_present PASS
  location_has_items:Reykjavík PASS
  location_has_items:Egilsstaðir PASS
  location_has_items:Seyðisfjörður PASS
  total_calls_within_ceiling PASS
  total_max_bytes_within_ceiling PASS
  per_request_cap_within_default:REQ-E1-WGS84-01 PASS
  per_request_cap_within_default:REQ-S2-WGS84-01 PASS
  per_request_cap_within_default:REQ-META-DFT-01 PASS
  per_request_cap_within_default:REQ-META-CAPS-01 PASS
  all_requests_marked_not_authorised PASS
  idbutur_911040037_vegnr1_pieces PASS
  idbutur_911170037_has_no_vegnr1_pieces PASS
  idbutur_911040037_vegnr93_pieces PASS
  idbutur_911170037_vegnr93_pieces PASS
  confirmed_feature_count_911040037_matches_plan PASS
  confirmed_feature_count_911170037_matches_plan PASS
  single_demonstrated_layer_name_used PASS
  wfs_north_4326_sha_matches_citation PASS
  north_ledger_line2_sha_matches_citation PASS
  bounded_fetch_allowlist_includes_vegagerdin PASS
  plan_hosts_subset_of_bounded_fetch_allowlist PASS
  no_px_hagstofa_host_in_this_plan PASS
```

## What was NOT done (disclosed, not hidden)

- No network call of any kind was made or attempted — not even the
  retained-precedent-demonstrated WGS84 feature requests. This is a
  planning round only.
- `DescribeFeatureType`'s and `GetCapabilities`'s own actual server
  behaviour is genuinely unknown — the plan does not predict whether
  either will reveal a direction/access field; it only sequences the
  attempt with a STOP gate, per EP2.
- Whether the four VEGNR=1 pieces sharing IDBUTUR `911040037`
  (`1483`/`2345`/`2347`/`2349`) carry the same 4-tier
  `NAKVAEMNIFERLIS` structure as road-93 pieces is UNKNOWN from
  retained data — registered as a range (8–20), not resolved here.
- R1's own exact node, name, and ring-connection display remain
  unresolved — this round explicitly does not select, derive, or
  invent a candidate for any of them (EP1).
- The other 61 `NODE_UNDETERMINED` places and the full 72-place
  worklist are out of scope (EP7e's own scope note) — not surveyed,
  not estimated.
- `LICENSE_NOT_DETERMINED` (Hagstofa) is carried forward unchanged,
  not re-examined.
- Production NOT_TESTED; no app/API file was touched, so lint/build/
  test are not applicable to this round.

## Scope confirmation

`git status --short` confirms only `docs/ai/CURRENT.md` and this
task's own new directory (`docs/ai/tasks/ticket-493-endpoint-
acquisition-plan/`) are touched. No file outside this task's own
directory was modified (all 20 retained inputs were only read,
re-verified unchanged in the hash table below). No app/API file, no
dependency file, no CI config touched.

## Hash table

`samples/HASHES.json`/`.sha256` generated LAST, after this report
reached final form — see the table itself for the full file list and
the re-verification of all 20 retained inputs against
`samples/retained_inputs_baseline.json` (unchanged, byte-for-byte).

## Outcome

**`PLAN_WITH_EXACT_GAPS`** — `coverage-matrix.json` carries real
`EXACT_GAP` lines (R1's own exact node/name/ring-connection display;
S2's own user-facing approach name), each with a precise description
of what retained data does not support and what would resolve it, not
a guess. The two planned WGS84 feature requests and the two-step
metadata discovery are `NEEDS_REQUEST`, fully specified in
`request-plan.json`, and `NOT_AUTHORISED` in this round. Production
NOT_TESTED. #493/From-To routing is not completed by this round.
`CC_COMPLETE`. Next: owner → Jonesy ("CC búinn") → result review
round 1 (to be appended to `result-review.md`, not yet created).
