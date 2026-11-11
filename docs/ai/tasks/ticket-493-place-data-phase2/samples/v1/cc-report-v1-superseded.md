# CC report — ticket-493-place-data-phase2

Executed `approved-prompt-v1.md` (P1-P9) — the first NETWORK-EXCHANGE
round of #493's data work: Hagstofa settlement population (MAN030106)
and VEGNR=93 (Egilsstaðir–Seyðisfjörður) geometry. **Real external HTTP
requests were made this round**, 3 of the 12 permitted, under the
bounded-fetch enforcement described below.

## Reading list

`AGENTS.md`, `CLAUDE.md`, `docs/ai/README.md`/`CURRENT.md`,
`docs/ai/tasks/ticket-493/owner-decisions-2026-11-05.md`,
`docs/ai/tasks/ticket-493-place-network/result-review.md` (v4 final
assessment, PASS with U1-U5 caveats), `approved-prompt-v1.md`,
`prompt-review.md` (P1-P9 in full).

## Sequence actually followed (P1-P3, before any external call)

1. `owner-authorisation.md` — the dated P1 record that the owner's
   literal "Prompt approved" message, addressed to this exact approved
   prompt, is the in-repo confirmation authorising `px.hagstofa.is`/
   MAN030106 for this task only, within the stated budget.
2. `pre-sample-plan.md` — the frozen request table (≤6 planned, ≥6
   reserve), budget ceiling, year-selection rule, settlement-matching
   rule, and WFS contact-band rules, self-hashed
   (`samples/pre-sample-plan.sha256`) before any request.
3. `samples/bounded_fetch.py` — a small, stdlib-only (no new
   dependency) fetch wrapper: hostname allowlist checked before
   connecting, TLS verification never disabled, no automatic redirects
   or retries, a streamed read capped at `min(per_body_cap,
   remaining_total)`, a ledger entry written for every call (success or
   failure) with UTC start/end, status, bytes received, truncated-flag,
   SHA-256 of the bytes actually read, and the full request.
4. `samples/local_enforcement_test.py` — ran AGAINST 127.0.0.1 (never
   an external host) BEFORE any real request: a chunked response
   exceeding the cap (truncated correctly, confirmed `bytes_received <=
   cap` and `truncated=True`), a timeout (returned in ~1s against a
   1s limit, did not hang), a redirect (ledgered as its own 302 status,
   never followed), an HTTP error status (503, ledgered as such), a
   hostname-allowlist rejection (raised before connecting), and a ledger
   write (confirmed all required fields present). **6/6 passed** —
   `samples/local-test-ledger.json`. This is the proof north-data's own
   round could not produce (body-cap enforcement was `NOT_DOCUMENTED`
   there); here it is demonstrated, locally, with no network use.

## Real exchanges (P2/P4/P6, after the local test passed)

| # | Purpose | Result |
|---|---|---|
| 1 | GET Hagstofa MAN030106 metadata | 200, 5,055 B — Ripley's candidate API path worked on the first try, no correction needed |
| 2 | POST Hagstofa MAN030106 data (2023-2025, all settlements, total pop.) — payload frozen as a dated plan addendum (`pre-sample-plan.md` "Addendum 1") AFTER seeing #1's own metadata, BEFORE sending | 200, 6,091 B |
| 3 | GET VEGNR=93 WFS, EPSG:3057, `maxFeatures=1000` | 200, 37,991 B, `totalFeatures=numberMatched=numberReturned=24` (complete, no `resultType=hits`) |

**Total: 3/12 exchanges, 49,137/33,554,432 B (0.15%) of budget.** No
reserve slot was used — no path correction, no WGS84 re-fetch (planar
sufficed, matching this task's own established basis), no retry.

## Key findings (full detail in `evidence.md`)

- Hagstofa table confirmed: "Meðalmannfjöldi..." = **average
  population**, not a census date. Licence `LICENSE_NOT_DETERMINED` (no
  terms/contact field in any response); no population figure from this
  round enters the app. Year **2025** selected per the pre-registered
  rule (0 nulls out of 360 data points, no provisional flag). Bracket
  counts from real data: **≥200: 74, ≥500: 49, ≥1000: 32** settlements.
- **Road 93 exists and is complete in the retained WFS layer**: 24
  features, 6 canonical pieces, **every inter-piece gap exactly 0.0 m**,
  total **26.9266 km** (planar). The Egilsstaðir ring junction (piece
  2345) is now **VERIFIED exact-contact** (0.0 m) to road 93's own first
  piece — previously only an "expectation zone" inferred from a
  description string in phase 1. Both directions validated with the
  reused, unchanged phase-1 `validate_route` logic.
- **P5 fix**: phase-1's own `SELFOSS`/`HELLA`/`HVOLSVOLLUR` inventory
  rows had recorded the piece's own ENTRY coordinate next to an EXIT
  distance — two different points, 1.3-2.0 km apart. Corrected in this
  task's own `place-inventory.csv`, with explicit `piece`/`instance`/
  `point`/`coord`/`cum_km_incl_1436` fields; **phase-1's own file is
  unchanged** (confirmed by hash).
- **A real data anomaly found, not resolved or hidden**: Hagstofa code
  `70` ("Mosfellsbær") shows exactly 0 population for 2023-2025, despite
  real-world Mosfellsbær having a substantial population and two
  adjacent sub-area codes in the same table showing real numbers — flagged
  `DATA_ANOMALY_NOT_RESOLVED`, not guessed.

## A real mistake caught and fixed before this report was written

A first draft of `place-inventory.csv` assigned Hagstofa codes 210/250/
240 to Selfoss/Hella/Hvolsvöllur, with plausible-looking population
numbers, **without actually checking them against the fetched data**.
Before finalizing, every row was cross-checked programmatically against
`samples/hagstofa_settlements_2023_2025.csv` — all three were WRONG
(210=Hellissandur, 250=Búðardalur, 240=Stykkishólmur in the real table).
Found the real codes by name search (1150=Selfoss, 1120=Hella,
1110=Hvolsvöllur), corrected all three rows, then re-verified the ENTIRE
file programmatically against the raw retained data (every row's claimed
name and population checked against the source CSV) before writing this
report. This is disclosed here, not silently fixed and left unmentioned.

## Run log

```
python3 samples/local_enforcement_test.py        -> 6/6 passed (local only, no network)
python3 samples/exchange1_metadata.py             -> 200, 5055 B
python3 samples/exchange2_data.py                 -> 200, 6091 B
python3 samples/exchange3_wfs93.py                -> 200, 37991 B
python3 samples/build_road93_candidate.py         -> 26,926.55 m, all gaps 0.0 m
python3 samples/generate_hashes.py                -> samples/HASHES.json, samples/HASHES.sha256 (run LAST)
sha256sum -c samples/HASHES.sha256                -> 18/18 OK
```
Independent cross-check of every `place-inventory.csv` row's claimed
Hagstofa code/name/population against `hagstofa_settlements_2023_2025.
csv` (see above): all rows pass after the correction.

## Scope discipline

```
git status --short
```
Touched by this round: `docs/ai/CURRENT.md`, the new
`docs/ai/tasks/ticket-493-place-data-phase2/` directory (all files
listed above). **Confirmed byte-unchanged** (hash table,
`samples/HASHES.json`'s own `confirmed_unchanged_prior_files` section):
`ticket-493-place-network`'s own `place-inventory.csv`, `evidence.md`,
`cc-report.md`, `rules.md`, `rules-addendum-v4.md`, `road-links.csv`,
`chain-walks-v4.json`; `ticket-483/samples/wfs-vegnr1-all.json`
(`305f60d6…`); `ticket-493-north-data/route-data-candidate.json`
(`094fb5d3…`). No product/app/API file touched.

## Not done / out of scope (P9)

- No full nationwide work-list-to-Hagstofa-code matching pass (only the
  towns this round's own examples needed, plus the three ferry
  candidates and the Mosfellsbær anomaly already visible in the data).
- No Hagstofa licence/terms determination (`www.hagstofa.is` not
  fetched — different host, not authorised, not needed this round).
- No resolution of the Mosfellsbær-class zero-value code anomalies.
- No WGS84/haversine figure for road 93 (planar sufficed).
- No new road-condition/notice sample (item 5 excludes this; retained
  legacy samples checked, neither road-93 IDBUTUR present —
  `NOT_AVAILABLE`, not guessed).
- No app/UI/API/commit/push. Production NOT_TESTED.

**Outcome: `EVIDENCE_READY_FOR_OWNER_REVIEW`.** No `BLOCKED_WITH_EXACT_
GAPS` sub-item was triggered — every planned item (metadata, data,
VEGNR=93 geometry, the route example, the P5 fix) completed
successfully within budget.
