# #499 — Evidence

2026-11-13, CC. Real network run against `gagnaveita.vegagerdin.is`
(2 GET calls, per approved-prompt-v1.md + owner "Prompt approved"
handoff on `READY_FOR_CC`). All WGS84 values are produced by the
server, not independently derived (EA5d, reused from
`pairing-rules.md`, unchanged) — pairing below is a construction/
consistency check against retained native data, never proof of the
values themselves.

## What was called

| request_id | status | bytes | sha256 | stop |
|---|---|---|---|---|
| S2-WGS84 | 200 | 36943 | `b1b8aa63571d6377de742a02b4e2e4f35860182191846e4a88afabddf463628a` | none |
| ACCESS-CAPABILITIES | 200 | 38416 | `bd10b61e53902d01d9ba7c54d634805ee3b0f965a9baec6b5d88dcfec17a4a1d` | none |

Total 75359 bytes of 4456448 authorized (2 of 2 calls). Ledger:
`samples/exchange-ledger.jsonl`. `E1-WGS84` was NOT called — retained
from `#493` per the approved prompt's own step 1.

Encoded URL verbatim-reuse confirmed before either call: both
`encoded_request_sha256` values match
`ticket-493-endpoint-acquisition/request-manifest.json`'s own
recorded values exactly (asserted in `samples/build_manifest.py`,
passed).

## S2-WGS84 result

20/20 expected features (`idferill` ∈ {2891,2892,2894,3409,3410} ×
`nakvaemniferlis` ∈ {-1,0,1,2}, `IDBUTUR 911170037`) — clean: 0
missing, 0 extra (same or other `IDBUTUR`), 0 duplicates, correct
CRS (`urn:ogc:def:crs:EPSG::4326`). `numberMatched == numberReturned
== len(features) == 20`. Unlike `#493`'s own E1 response, there were
no extra features at all this time — JA1(b)'s "finding, not stop"
handling for a same-`IDBUTUR` extra was exercised offline (see
`validator_499.py`), not by this real response.

Published: all 4 tiers × 2 roles (END=2894, START=2892) = 8 entries,
`tier_consistency_flag: true` for every one (all 4 tiers of the same
role agree exactly). Junction cross-check: END's native/WGS84 values
equal START's, within EA5(c)'s own tolerances (native ≤0.0001m,
WGS84 ≤1e-8°) — both `true`. Full entries: `endpoint-registry.json`
→ `s2_seydisfjordur.entries`.

## ACCESS-CAPABILITIES result

200, 38416 bytes, safety-gate clean (no `<!DOCTYPE`/`<!ENTITY`). 61
`FeatureType`s enumerated, 28 flagged `discovery_candidate` per
`metadata-classification-rule.md`'s own keyword rule (reused
verbatim, SHA confirmed unchanged). None establish driving access by
themselves (EA7's own explicit limit) — `driving_access_both_directions`
stays `EXACT_GAP` for every place in this registry. Full listing:
`discovery-gaps.json`.

**Bug found and fixed before this call was even processed**: the
first implementation of `classify_capabilities.py` used
`element.find(a) or element.find(b)` to try a namespaced tag then a
bare one. `ElementTree.Element.__bool__` reflects CHILD COUNT, not
whether `find()` matched — a found leaf element like `<Name>text
</Name>` has zero children and is falsy, so the `or` silently skipped
past it, returning `None` for every `name`/`title`. Caught by an
offline test against a synthetic capabilities snippet BEFORE the
real call; fixed with an explicit `is not None` check.

## R1 Reykjavík — unresolved, as expected

No coordinate, no selected candidate. The only retained candidate
(`endpoint-candidates-v3.json`'s `reykjavik` block, piece 1436's two
Rauðavatn ends) is explicitly `"unselected comparison candidate (D6)
-- never a confirmed Reykjavík core"` in its own source, and the
owner's own 2026-11-11 decision says neither end is automatically
approved. This round does not search for a new candidate (out of
scope per the approved prompt's own step 5) — the gap and the
smallest proposed next step are recorded in
`endpoint-registry.json` → `r1_reykjavik`.

## E1/C — retained, not re-fetched

Both reused from prior rounds with their own citations/hashes
(`endpoint-registry.json` → `e1_egilsstadir`/`c_akureyri`). Three
factual corrections from `ticket-493-endpoint-acquisition/result-review.md`'s
own ER3 are incorporated into how this round *describes* E1 (chunked,
24 properties, not 28) without touching the old `#493` files
themselves.

## Validation

`samples/validator_499.py` — 17 tests, all passing, against retained
raw/fixtures only (no network re-run): provenance SHA/native-reference
mismatch detected; a missing required tier detected; junction
inconsistency detected; a same-`IDBUTUR` extra feature confirmed to
never stop or falsely register as an endpoint; a different-`IDBUTUR`/
wrong-layer extra, a duplicate, a missing pair, wrong CRS, and a
300-feature limit-hit each confirmed to stop with their own specific
`deviation_type`.

## Status

`endpoint-registry.json` is usable: E1/S2/C are traceable with
hashes/ledger lines; R1 is an honest, clearly-labeled gap, not a
guessed coordinate. **#499 is PARTIAL** — R1 has no owner-selected
candidate, so the product scope (one Reykjavík option in the UI with
both ring directions) is not yet deliverable end to end. Driving
access remains `EXACT_GAP` for every place. No app/UI/API change was
made. `#498`/Windows-first history is unrelated and untouched.
