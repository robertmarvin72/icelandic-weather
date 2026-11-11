# #493 endpoint-acquisition — Evidence

2026-11-11, CC. Executed `approved-prompt-v1.md` (EA1–EA8) for
`ticket-493-endpoint-acquisition` — the first round in this project
that makes **real** network calls. Three calls were planned
(`E1-WGS84`, `S2-WGS84`, `ACCESS-CAPABILITIES`); **exactly one was
made**, because `E1-WGS84`'s own real response deviated under EA4(ii),
which stops all further calls for this run (Ripley's own documented
choice in the approved prompt). This file states plainly what was
acquired, what was not, and why.

## RP1–RP4 corrections applied (from `ticket-493-endpoint-acquisition-plan/result-review.md`)

- **RP1 applied:** the expected E1 feature count is **20** (not an
  "unknown 8–20 range"), using `ticket-483/samples/wfs-vegnr1-all.json`
  as the native per-tier reference for pieces `1483/2345/2347/2349`
  and `wfs93-raw.json` for piece `2344` — re-confirmed in this round's
  own `samples/rp1_native_reference.json` before any call was made.
- **RP2 applied:** driving access (R1/E1/S2) is registered `EXACT_GAP`
  throughout (`coverage-matrix.json`'s own successor,
  `discovery-gaps.json`), not `NEEDS_REQUEST` — the authority is
  `wfs93-raw.json → features[].properties` (the real feature schema,
  re-confirmed in this round's own live response: 28 properties, none
  encoding direction/access), not `evidence-v4.md`'s regression-lock
  note.
- **RP3 applied:** `DescribeFeatureType` was not called — the retained
  `GetFeature` precedent already carries no `propertyName` restriction,
  so the schema was already fully visible in retained and in this
  round's own live responses.

## What was acquired: E1 WGS84

`E1-WGS84` (`CQL_FILTER=IDBUTUR IN (911040037)`) returned **HTTP 200,
28,056 bytes, not truncated**, SHA-256
`cb9382946098c2040dbc5c151985977974a1b7bf38aede520a7c1a312ee78355`
(`samples/raw-E1-WGS84.json`, ledger line 1 of
`samples/exchange-ledger.jsonl`).

The response contained **32 features**, not the expected 20. All 20
expected `(IDFERILL, NAKVAEMNIFERLIS)` pairs were present, correctly
matched to their native `OBJECTID`, vertex count, and geometry type
(`LineString`) — confirmed feature-by-feature, not merely counted.
The **12 extra** features are a genuine, previously-undocumented
finding, not a data error:

| IDFERILL | VEGNR | `STADARLYSING` |
|---|---|---|
| 1985 | 931 | Upphéraðsvegur að Ullartanga |
| 2899 | 941 | Flugvallarvegur Egilsstöðum |
| 19524 | 95 | Fellabær - Dagsverk |

Each of these three pieces also carries 4 `NAKVAEMNIFERLIS` tiers,
and **all three share `IDBUTUR 911040037`** with E1's own target
pieces despite being on entirely different `VEGNR` routes (931 and
941 are not in either retained VEGNR register this round reads;
95 is a different road number from the already-known VEGNR=1/93
pair). This extends — at a larger scale than previously documented —
the project's own repeated finding that `IDBUTUR` is not unique to a
single road: it is shared here across **five** distinct `VEGNR`
values (1, 93, 95, 931, 941), not just two. Per EA4(ii), this STOPPED
`S2-WGS84` and `ACCESS-CAPABILITIES` from being called at all — the
12 extra features are recorded here as a finding and are **never
published** in `endpoint-wgs84.json`.

**Published E1 value** (all 4 tiers, `tier_consistency_flag: true` for
both roles — see `endpoint-wgs84.json`):

- END (piece 2345) = START (piece 2344): **latitude 65.25861764,
  longitude -14.39028964** (EPSG:4326, as received, not re-rounded; z
  excluded per EA5a).
- Sanity box only (not proof): longitude ∈ [-25, -12] ✓, latitude ∈
  [63, 67.5] ✓.
- `DAGSFERILS` on the matched features: `2026-10-07T00:00:00Z` — an
  old retrieval-adjacent date, not live road-condition currency (per
  the approved prompt's own "gamall DAGSFERILS... jafngildir ekki
  live-færð" instruction).

**Independent validator** (`samples/validate_endpoint_output.py`, no
import of the build/fetch code) confirmed: every published value
matches its correct raw feature/endpoint, `OBJECTID`/`id` consistent,
provenance (SHA, `DAGSFERILS`) consistent, all 4 tiers agree for both
roles. **13 of 13** pre-registered negative tests (`pairing-rules.md`'s
own table) each failed with their own registered check-ID on
`tempfile` copies outside the repo, now cleaned up (confirmed none
left) — see `samples/negative_test_report.json`.

**EA5(d) limitation, stated plainly:** the WGS84 value above is
**produced by the server**, not independently derived — the pairing
and tier-consistency checks are a construction/consistency check
against retained native data, not an independent proof of the value
itself. Reprojection is prohibited, so no offline computation can
verify it further.

## What was NOT acquired

- **S2 WGS84 (Seyðisfjörður):** `S2-WGS84` was never called. All 8
  S2 entries in `endpoint-wgs84.json` are `null` with the stated
  reason (E1's own EA4(ii) deviation stopped further calls). This is
  not a failed pairing — it is an unattempted call.
- **Metadata/discovery:** `ACCESS-CAPABILITIES` was never called —
  `discovery-gaps.json` records `capabilities_status: NOT_RECEIVED`
  with the same reason. No `FeatureType` was enumerated; no
  `discovery_candidate` was ever evaluated against
  `metadata-classification-rule.md`'s own pre-registered rule
  (written and hashed before any call, never exercised this round).
- **Driving access (R1/E1/S2):** remains `EXACT_GAP`, unchanged —
  no metadata result could have changed this even if the call had
  been made (EA7), and in fact no such call was made at all.
- **R1 (Reykjavík):** no coordinate, no candidate, no connection claim
  — entirely unchanged by this round, exactly as the approved prompt
  required.
- **S2 approach name, licence determination for Hagstofa:** unchanged,
  still open.

## Budget actually used

**1 of 3 planned calls**, 28,056 of 4,718,592 planned bytes
(0.6%). `samples/exchange-ledger.jsonl` has exactly one real-call
entry (`E1-WGS84`) — no refusals were triggered (no 4th call, no
duplicate ID, no out-of-window call was ever attempted), because the
run stopped itself cleanly after the first call's own EA4 validation,
before any aggregate guard was even needed. `samples/live_run_summary.json`
records `calls_made: 1`, `bytes_received_total: 28056`.

## Licence / freshness

Vegagerðin's own "Skilmálar vefþjónustur" CC BY 4.0 reference stands,
unchanged, retained. Hagstofa remains `LICENSE_NOT_DETERMINED` — not
examined this round (no Hagstofa call was planned or made). No
`Fees`/`AccessConstraints` metadata was read (capabilities was never
received).

## Outcome

**`PARTIAL_WITH_EXACT_GAPS`** (EA8) — E1's own WGS84 value is fully
paired and has passed every defined test, but S2 did not (it was
never attempted), so the stricter `ACQUIRED_WITH_EXACT_GAPS` label
(which requires **both** E1 and S2 to reach fully-paired, passed
values) does not apply. `null` is used throughout for every
unresolved value — never a success assertion beyond what was actually
checked. No candidate promotion, no 72-place release approval, no
weather-point selection, no route graph, no app/API/entitlement
change. Dependencies/delegation/GitHub/deploy remain out of scope.
Production NOT_TESTED. `#493`/From-To routing is not completed by
this round. No further network call was made after the E1-WGS84 STOP
or after this report reached final form.
