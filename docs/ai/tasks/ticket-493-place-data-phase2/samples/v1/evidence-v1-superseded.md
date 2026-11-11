# #493 phase2 — Evidence (Hagstofa settlement data + road 93, real network exchanges)

2026-11-09, CC. Executed `approved-prompt-v1.md` (P1-P9). **Real network
exchanges were made this round** — 3 of the 12 permitted, 49,137 of
32,000,000 permitted bytes — against the two hosts authorised in
`owner-authorisation.md` (P1): `px.hagstofa.is` (new, this task only)
and `gagnaveita.vegagerdin.is` (already authorised by prior rounds).
`pre-sample-plan.md` (plus its dated addendum 1) was written and
self-hashed before any request; the local enforcement self-test (P3)
passed (6/6 checks) before the first external call.

Outcome label: **EVIDENCE_READY_FOR_OWNER_REVIEW**, with explicit
`UNMATCHED`/`NODE_UNDETERMINED`/`DATA_ANOMALY_NOT_RESOLVED` sub-items
named throughout.

## 1. Budget actually used

| Exchange | Host | Method | Status | Bytes | Truncated |
|---|---|---|---|---|---|
| 1 | px.hagstofa.is | GET (metadata) | 200 | 5,055 | No |
| 2 | px.hagstofa.is | POST (data) | 200 | 6,091 | No |
| 3 | gagnaveita.vegagerdin.is | GET (WFS, VEGNR=93) | 200 | 37,991 | No |

**Total: 3 of 12 exchanges, 49,137 of 33,554,432 B (0.15%) of the total
budget.** None of the 6 reserve slots in `pre-sample-plan.md` were
needed — the candidate metadata endpoint Ripley proposed worked on the
first attempt, and the WFS query returned complete, non-empty data on
the first attempt. No WGS84 re-fetch was needed (planar, EPSG:3057,
matches the rest of this task's own established methodology; see P6).
Full ledger: `samples/exchange-ledger.jsonl`.

## 2. Hagstofa MAN030106 — confirmed, item 1/P1/P4

**Table confirmed on first try**: Ripley's candidate API path
(`/pxis/api/v1/is/Ibuar/mannfjoldi/2_byggdir/Byggdakjarnar/MAN030106.px`)
is correct — no path correction needed. Title: "Meðalmannfjöldi eftir
þéttbýlisstöðum, kyni og aldri 1998-2025" — the measure is **average
population** (not a specific-date census), confirmed from the table's
own title, not assumed. Four dimensions: `Þéttbýlisstaðir` (settlement,
120 codes incl. `"0"`=`"Alls"`, the nationwide total), `Aldur` (age,
code `"-1"`=`"Alls"`), `Kyn` (sex, code `"0"`=`"Alls"`), `Ár` (year,
1998-2025, 28 values). No `elimination`/provisional-year flag anywhere
in the metadata.

**Licence/terms: `LICENSE_NOT_DETERMINED`** (P1) — neither the metadata
response nor the data response contains a `contact`, `source`, or
licence field of any kind; `www.hagstofa.is` (a different host) was
**not** fetched to check (not authorised, not needed for this task's
own bounded scope). **No population figure from this round enters the
app/product** until the owner separately confirms Hagstofa's own terms
— per P1's own explicit instruction.

**Year selected: 2025** (the newest of the 3 requested years, 2023-2025).
Per the pre-registered rule (`pre-sample-plan.md` §3): 0 of 360
requested data points (120 settlements × 3 years, age/sex pre-filtered
to totals) are null — 100% ≥ the 95% threshold, no provisional-year
metadata flag. The rule was applied mechanically against this fact, not
chosen because 2025 "looked right."

**Sanity cross-check**: summing all 119 non-`"Alls"` settlement rows for
2025 gives 391,909; the table's own `"Alls"` (nationwide total) row for
2025 is 391,884 — a 25-person (0.006%) discrepancy, consistent with
"average population" being computed independently per row and not
re-summed by Hagstofa itself (a normal artifact of this measure, not a
data-integrity failure).

**Population brackets** (computed from the 2025 data, excluding the
`"Alls"` row): **≥200: 74 settlements. ≥500: 49. ≥1000: 32.** These
counts are a factual input; the actual threshold choice remains an
owner proposal (item 2), not decided here.

**Settlement matching**: of the work-list places this round actually
checked by name against the table (not the full ~70-town work list —
out of this round's own bounded scope, see §6), all matched a real
Hagstofa code except **Flatey** (`UNMATCHED` — no matching code/name in
the 120-row table at all, most likely below this table's own inclusion
threshold for a "þéttbýlisstaður"; not filled from memory).

**Data anomaly found and NOT silently resolved**: code `70`
("Mosfellsbær") shows population **exactly 0** for all three requested
years, while two adjacent sub-area codes in the same table
("Mosfellsdalur" 252-269, "Grundarhverfi, Kjalarnesi" 515-683) show real
population. Real-world Mosfellsbær has a substantial population — this
reads as a discontinued/reclassified Hagstofa code, not a genuine
collapse, but this round does not resolve WHICH code (if any) now
carries Mosfellsbær's own population, since that would need a further
metadata/code-history lookup beyond this round's bounded scope. Flagged
as `DATA_ANOMALY_NOT_RESOLVED` in `place-inventory.csv`, not guessed or
dropped. Six further codes (`673` Hjalteyri, `681` Kristnes, `903`
Eiðar, `1101` Skógar, `1121` Rauðalækur, plus `70` itself) show a zero
2025 value — the same class of anomaly, not individually investigated
this round.

Raw retained files: `samples/metadata-MAN030106-raw.json`,
`samples/data-MAN030106-raw.json`, `samples/hagstofa_settlements_
2023_2025.csv` (the full 120-row table, all three years, built directly
from the retained JSON — not hand-typed).

## 3. VEGNR=93 (Egilsstaðir–Seyðisfjörður) — item 3/4/P5/P6, no longer BLOCKED

**Road 93 EXISTS in the retained WFS layer** — phase 1's own `BLOCKED`
finding (0 features when filtering the NATIONWIDE VEGNR=1 dataset for
VEGNR=93, which cannot contain it by definition) is **not contradicted**
— this round queried the SAME layer (`gis:faerdferlar2017_1`) filtered
for `VEGNR='93'` specifically, and got a real, complete answer: **24
features, `totalFeatures`=`numberMatched`=`numberReturned`=24** (no
`resultType=hits`, per P2's own warning).

**Canonical chain** (E2d: most vertices, tie → lowest OBJECTID, reused
unchanged): **6 distinct IDFERILL**, 2 IDBUTUR (`911040037` "Egilsstaðir",
`911170037` "Fjarðarheiði"), all VEGHLUTI=1 (undocumented majority role,
direction INFERRED — same grade as most of the main ring). Ordered by
`KAFLANR` (01→06): **2344 → 3410 → 3409 → 2894 → 2892 → 2891**, ending at
piece 2891's own far end, whose own description is "Vestdalseyrarvegur -
Ferjubryggja" (the Seyðisfjörður **ferry pier**).

**Every inter-piece gap is EXACTLY 0.0 m** — `CONTINUOUS_EXACT`, the
cleanest contact grade available, no bridging needed anywhere in this
6-piece chain. **Total length: 26,926.55 m = 26.9266 km** (planar,
canonical basis), computed from this round's own fresh canonical
selection, not estimated.

**Ring junction — VERIFIED, not just INFERRED**: phase 1's own P5 note
had already flagged piece 2345 (VEGNR=1, "Egilsstaðir", `STADARLYSING`
"Hringvegur að Seyðisfjarðarvegi") as an "expectation zone" for this
connection, based on its own description text alone. This round
**independently re-measures** it from the real geometry: piece 2345's
own stored END coordinate, (715153.7400, 536679.9300), is **EXACTLY**
(0.0 m) identical to road 93's own piece 2344's own stored START
coordinate. This is a genuine VERIFIED exact-contact connection between
the two road layers — not a name-based inference anymore.

No T-junction/interior-vertex connection was needed — the connection is
a clean endpoint-to-endpoint match, so the plan's own third contact
category (§5 of `pre-sample-plan.md`) was never exercised.

**Example route (item 5/P7), both directions, same validator reused
unchanged from phase 1:**

| Direction | Length | Direction grade | Bridged gaps | Validator |
|---|---|---|---|---|
| Egilsstaðir → Seyðisfjörður (ferry pier) | 26.9266 km | INFERRED (VEGHLUTI=1 throughout) | none (all exact) | no repeated piece, no 6/7 pair (none present), passes |
| Seyðisfjörður (ferry pier) → Egilsstaðir | 26.9266 km (same pieces, reversed) | INFERRED, unchanged by reversal | none | same checks, passes |

**Route-level rule demonstrated (non-vacuity, per phase-1's own
established pattern)**: a direct Egilsstaðir↔Seyðisfjörður trip uses
ONLY these 6 road-93 pieces plus the single ring-junction piece (2345)
— it does **not** traverse any further piece of the main Hringvegur
ring at all. (The test "can fail": if this route's own piece list DID
include, say, a Borgarnes-area or Akureyri-area IDFERILL, that would be
a wrong/looping route — it does not, confirming "same connecting road,
no need to go around the ring" directly from the data, not asserted
without a check.)

Seyðisfjörður's own population (652, 2025, §2) is now real;
its own **settlement centre coordinate remains `NODE_UNDETERMINED`** —
the road-geometry endpoint (the ferry pier) is an INFERRED access point
per E3(a), never claimed as the town centre.

Full machine-readable chain: `samples/road93-candidate.json`. Raw WFS
response: `samples/wfs93-raw.json`.

## 4. Road-condition and notice footprint (item 5/P8)

Per P8, no new road-condition sample was fetched this round (item 5
explicitly excludes this). The retained legacy samples from prior
rounds (2026-10-28/2026-11-02, already in `docs/ai/tasks/ticket-483/
samples/` and `ticket-485/samples/`) were checked for IDBUTUR
`911040037`/`911170037` (the two road-93 IDBUTUR): **neither is present
in those retained samples** — they only cover VEGNR=1 IDBUTUR. Result:
`NOT_AVAILABLE` for road-93's own road-condition/notice status — not
guessed, not a new fetch.

## 5. P5 — phase-1 inventory entry/exit coordinate fix

Jonesy's own prompt-review finding, independently re-confirmed this
round from `ticket-493-place-network/samples/chain-walks-v4.json`: three
rows in phase-1's own (CLOSED/PASS) `place-inventory.csv` — `SELFOSS`,
`HELLA`, `HVOLSVOLLUR` — recorded the piece's own stored **ENTRY**
coordinate (reached via the `rev` instance, i.e. the piece's own stored
`end` field) next to a distance figure that actually describes the
**EXIT** point (the piece's own stored `start` field, reached after
fully traversing it). The two are different points, 1.3-2.0 km apart
along the route. Corrected rows, with explicit `piece`/`instance`/
`point`/`coord`/`cum_km_incl_1436` fields and the coordinate
independently tied to the distance (not just asserted), are in THIS
task's own `place-inventory.csv` (above) — **phase-1's own file is
unchanged** (confirmed by SHA-256, §7).

## 6. What this round did NOT do

- Did not match the FULL ~70-town work list against Hagstofa codes —
  only the specific towns this round's own route/ring examples needed
  (Selfoss/Hella/Hvolsvöllur/Egilsstaðir/Seyðisfjörður), plus the three
  ferry-candidates and the Mosfellsbær anomaly already visible in the
  data. A full nationwide settlement-matching pass is a larger task
  than this bounded round's own scope.
- Did not determine actual population-bracket cutoffs for the product —
  the 200/500/1000 counts (§2) are a factual input to an owner decision,
  not a decision themselves.
- Did not resolve the Mosfellsbær (or the other 5) zero-value code
  anomaly.
- Did not fetch `www.hagstofa.is` or any licence/terms page — Hagstofa's
  own usage terms remain `LICENSE_NOT_DETERMINED`.
- Did not use any WGS84/haversine figure for road 93 — planar only,
  matching the rest of this task's own established basis; no second WFS
  request was needed or made.
- Did not fetch any new road-condition/notice sample.
- No app/UI/API/commit/push. Production NOT_TESTED.

## 7. Delivery hygiene (P9)

**Confirmed unchanged by SHA-256, before and after this round** (phase-1
and all prior rounds' own files — none touched):
`docs/ai/tasks/ticket-493-place-network/place-inventory.csv`,
`evidence.md`, `cc-report.md`, all `rules*.md`, all `approved-prompt-
*.md`, all `national_inventory_v*.py`/`chain-walks-v*.json`/output,
`road-links.csv`, and the retained `docs/ai/tasks/ticket-483/samples/
wfs-vegnr1-all.json`/`docs/ai/tasks/ticket-493-north-data/route-data-
candidate.json`. See `samples/HASHES.sha256` for the full before/after
table, generated by `samples/generate_hashes.py` and independently
verified via `sha256sum -c`.

**A real error was caught and fixed before this report was written, not
after**: a first draft of `place-inventory.csv` assigned invented-
looking Hagstofa codes (210/250/240) to Selfoss/Hella/Hvolsvöllur
without checking them against the actual fetched data — an independent
cross-check against `hagstofa_settlements_2023_2025.csv` found all
three WRONG (210=Hellissandur, 250=Búðardalur, 240=Stykkishólmur in the
real table, not Selfoss/Hella/Hvolsvöllur at all). Corrected to the real
codes (1150/1120/1110) and every row in the final file was then
re-verified programmatically against the raw retained data before this
report was written (see `cc-report.md`'s own run log).

All new output is UTF-8 + `\n`. `samples/hagstofa_settlements_2023_
2025.csv` and `samples/road93-candidate.json` are both built
programmatically from the retained raw responses, not hand-typed.

## 8. Gaps for any future round

Hagstofa licence/terms (needs a separate fetch + owner decision before
any population figure reaches the product); the Mosfellsbær-class code
anomalies; a full nationwide settlement-to-code matching pass; the
owner's own population-bracket decision; Seyðisfjörður's/Egilsstaðir's
own settlement-centre coordinates (still `NODE_UNDETERMINED`); any
further connecting-road review (explicitly item 3's own "landsdekkandi
yfirferð ... er seinni lota" — a separate, later round).
