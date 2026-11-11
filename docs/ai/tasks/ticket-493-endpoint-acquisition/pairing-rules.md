# #493 endpoint-acquisition — Pairing rules (EA5/EA6)

2026-11-11, CC. Written and hashed (`pairing-rules.sha256`) BEFORE the
first network call, per EA1(4). No results from the live run are
folded into this file afterward — it governs the comparison, the
comparison does not govern it.

## RP1/RP2/RP3 corrections (from `ticket-493-endpoint-acquisition-plan/result-review.md`, folded in as Ripley's own binding final-assessment proviso)

- **RP1:** The expected feature count for `IDBUTUR IN (911040037)` (E1) is **20**, not an "unknown 8–20 range" — confirmed from `ticket-483/samples/wfs-vegnr1-all.json` (the retained national VEGNR=1 register, EPSG:3057, 996 features): pieces `1483`, `2345`, `2347`, `2349` each carry exactly 4 `NAKVAEMNIFERLIS` tiers (`-1, 0, 1, 2`), confirmed again here (see `samples/rp1_native_reference.json`). `wfs-vegnr1-all.json` is this round's own named native per-tier reference for these four pieces (not `road-links.csv`, which holds only tier `-1`); `wfs93-raw.json` remains the native per-tier reference for piece `2344`. Combined E1 expected set: 4 pieces × 4 tiers (VEGNR=1) + 1 piece × 4 tiers (VEGNR=93) = **20**.
- **RP2:** Driving access (R1/E1/S2) is `EXACT_GAP`, not `NEEDS_REQUEST` — the metadata calls are a **discovery step** for a possible future source, not a request that itself resolves access. The authority for "no retained field encodes direction/access" is `wfs93-raw.json → features[].properties` (the actual feature-set schema), not `evidence-v4.md`'s own regression-lock note.
- **RP3:** `DescribeFeatureType` is skipped this round (the approved prompt's own decision) because the retained `GetFeature` precedent (north-data ledger line 2, phase2 ledger line 3) carries no `propertyName` restriction, so the already-retained responses already contain the layer's full feature schema — a schema-description call would not plausibly add a field neither retained response already shows.

## EA5(a) — coordinate arity and axis handling

- Every retained raw coordinate (checked in `wfs-vegnr1-all.json`, `wfs93-raw.json`, `wfs-north-4326.json`) is **3-valued**: `[x, y, z]` (native EPSG:3057) or `[lon, lat, z]` (EPSG:4326). This round's own live responses are expected to be the same arity.
- Pairing and every value comparison use **only the first two values** (x/y or lon/lat). The third value (`z`) is **excluded from every comparison and from every published value** — `z = 0` in a 4326 response is not a height (confirmed: 689 of 705 retained 4326 vertices have `z = 0`); native `z` is left unchanged in the saved raw file but never compared or republished.
- A coordinate array with an arity other than 3 is a **finding**, not a silent accommodation: that pair is `null`/unpaired, with the arity recorded as the reason. No code "fixes" a 2-valued or 4-valued coordinate by assumption.

## EA5(b) — pairing keys

A raw 4326 feature is paired to its native counterpart only if **all** of the following match exactly:

1. `OBJECTID` (native) ↔ the numeric suffix of `id` (`faerdferlar2017_1.<OBJECTID>`) in the 4326 response.
2. `IDFERILL`.
3. `IDBUTUR`.
4. `NAKVAEMNIFERLIS` (tier).
5. Geometry type (`LineString` in every retained precedent).
6. Vertex count (array length) — identical between the native and 4326 feature for the same `OBJECTID`.

A mismatch in **any single key** → unpaired, `null`, no fallback key, no retry with a different key. This is a direct, pre-registered consequence of EA5(b)'s own instruction, not a new design choice.

## EA5(c) — tolerances (registered before any response is seen)

| Comparison | Tolerance | Basis |
|---|---|---|
| Same native junction point reached via two different pieces (E1: 2345 END vs 2344 START; S2: 2894 END vs 2892 START) | ≤ 0.0001 m | Retained-data exactness — these are the SAME retained vertex, already confirmed identical to the displayed precision in `endpoint-candidates-v3.json`; this is a consistency check on retained data, not a live tolerance. |
| Same WGS84 endpoint across the 4 `NAKVAEMNIFERLIS` tiers of the same piece/role | ≤ 1 × 10⁻⁸ degrees | A "moderate" tolerance per EA5(c)'s own wording; expected value is exactly 0 (the server's own answer for the identical underlying vertex should not vary by tier at the junction end). |
| Native↔WGS84 cross-CRS comparison | **Not performed as a value proof** — EA5(d) below. A gross Iceland sanity box only: `longitude ∈ [-25, -12]`, `latitude ∈ [63, 67.5]` — a plausibility check, never proof of correct pairing. |

## EA5(d) — explicit limitation (stated, not hidden)

The WGS84 values this round publishes are **produced by the server**, not independently derived. The pairing above is a **construction/consistency check** (do the response's own keys/geometry match the native record we already hold), not an independent proof of the WGS84 values themselves — reprojection is prohibited, so no offline computation can verify them. `evidence.md` states this plainly.

## EA6 — which tier(s) publish the value

**Decision, registered before the call:** publish **all four tiers** (`-1, 0, 1, 2`) for each of the four endpoint roles (E1 END, E1 START, S2 END, S2 START) — 16 published entries total (4 roles × 4 tiers) — each carrying its own `tier_consistency_flag` (true only if all 4 tiers for that role agree within the EA5(c) tolerance). Rationale: a single "representative" tier would silently discard the cross-tier consistency check itself required by EA5(c); publishing all four, flagged, keeps that check visible in the delivered data rather than only in a side report. `endpoint-candidates-v3.json`'s own prior rounds already treated `NAKVAEMNIFERLIS=-1` as the finest retained precision for native data — this round does not silently pick that same convention for the WGS84 publication without saying so, hence all four are published with the flag.

Each published entry (`endpoint-wgs84.json`) carries, verbatim per EA6: `role` (`START`/`END`), piece `IDFERILL`, `NAKVAEMNIFERLIS`, `OBJECTID`/`id`, `latitude`/`longitude` as received (no re-rounding), a native reference (file, SHA, pointer) for that same junction, the raw response's own SHA-256, the ledger line, `DAGSFERILS`. Unresolved values are `null` with a reason. All published numbers are finite (never `NaN`/`Infinity`).

## Negative test variants (pre-registered check-ID mapping; run on `tempfile` copies outside the repo)

| Variant | Expected check-ID |
|---|---|
| lat/lon swapped | `LATLON_SWAP_DETECTED` |
| a published coordinate value altered | `VALUE_MISMATCH` |
| END/START swapped for a role | `ROLE_FIELD_MISMATCH` |
| wrong piece or wrong tier referenced | `PIECE_TIER_MISMATCH` |
| a required feature missing from the raw set | `MISSING_FEATURE` |
| a duplicate feature (same OBJECTID twice) | `DUPLICATE_FEATURE` |
| vertex-count (arity-of-geometry) mismatch between native and 4326 for the same OBJECTID | `VERTEX_COUNT_MISMATCH` |
| wrong SHA-256 or ledger line cited in a published entry's own provenance | `PROVENANCE_REFERENCE_MISMATCH` |
| inconsistent endpoint across the 4 tiers of the same piece/role | `TIER_CONSISTENCY_MISMATCH` |
| `z` present in a published value | `Z_IN_PUBLISHED_VALUE` |
| coordinate arity ≠ 3 in a raw feature | `INVALID_COORDINATE_ARITY` |
| `OBJECTID` inconsistent with the numeric suffix of `id` | `OBJECTID_ID_MISMATCH` |
| `DAGSFERILS` missing from a feature that should publish a value | `MISSING_DAGSFERILS` |

Clean (unmutated) data must pass every check above; each variant must fail with exactly its own registered check-ID — a failure on an unrelated ID, a silent pass, or an unhandled exception does not count as the test passing.
