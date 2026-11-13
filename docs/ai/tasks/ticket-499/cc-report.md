# #499 — CC report

## Authorization record (written BEFORE the first network call)

- Approved prompt: `docs/ai/tasks/ticket-499/approved-prompt-v1.md`, SHA-256
  `a0b7b1d5d51efaa27e1b7a9fb0f283f71a690c907ac20119416b9ba08220d4f4`.
- Owner handoff: "Prompt approved" on `CURRENT.md` while `Stage: READY_FOR_CC`,
  2026-11-13 (Ripley's own handoff entry: "Jonesy APPROVED JA1–JA3 felld
  orðrétt í approved-prompt-v1.md... Næst eigandi til CC: Prompt approved").
  This is a fresh, task-bound authorization — the old `#493`
  `owner-authorisation.md` is not reused, and no new owner signature file
  is created for this one (the approved prompt + this handoff is the
  binding record for exactly the two calls below, per the prompt's own
  "Afmörkuð netheimild" section).
- Scope: exactly 2 real HTTPS GET calls to `gagnaveita.vegagerdin.is`
  (`S2-WGS84`, `ACCESS-CAPABILITIES`), no auth/cookies/secrets, max
  4,456,448 response bytes total, 20s socket/wall-clock cap per call,
  10-minute acquisition window, TLS verified, 0 redirects, 0 retries.
  `E1-WGS84` is retained from `#493` and is explicitly NOT called this
  round.

## Pre-call verification (read-only, no network)

- `request-manifest.json` built from `samples/request_encoding.py`'s own
  `REQUESTS`/`ORDER` (trimmed to `S2-WGS84`/`ACCESS-CAPABILITIES`), via
  `samples/build_manifest.py`. The script asserts, before writing
  anything, that both entries' `full_url` and `encoded_request_sha256`
  are byte-identical to the PRIOR `ticket-493-endpoint-acquisition/
  request-manifest.json`'s own recorded values — confirmed: assertion
  passed, "verbatim-reuse check: PASSED for ['S2-WGS84',
  'ACCESS-CAPABILITIES']". This proves the URL is reused verbatim, not
  re-derived from a new filter class (approved-prompt-v1.md step 3).
- `samples/driver.py` and `samples/rp1_native_reference.json` are
  byte-identical copies of the `#493` originals (SHA-256 confirmed
  equal on both sides before use) — JA1's own "changes only on a copy,
  old file/hashes untouched" condition.
- `samples/live_driver.py` and `samples/request_encoding.py` are
  modified copies (JA1a/b/c — see "Driver changes" below).
- `samples/classify_capabilities.py` (EA7 reuse) written and tested
  offline against a synthetic WFS capabilities snippet BEFORE the real
  call: correctly extracts `Name`/`Title`/`DefaultSRS`/`Operations`,
  flags `discovery_candidate` via the metadata-classification-rule.md
  keyword list (reused verbatim, SHA-confirmed unchanged:
  `b3c18d67d09d5aa37c037a3768c6a275298af45fc4205954416a7c95e617510f`),
  and rejects a `<!DOCTYPE`/`<!ENTITY` body before parsing. **A real
  bug was found and fixed during this offline test**: the first
  implementation used `element.find(...) or element.find(...)` to try
  a namespaced tag then a bare one — `ElementTree.Element.__bool__`
  reflects CHILD COUNT, not whether `find()` matched, so a found leaf
  element like `<Name>text</Name>` (zero children) is falsy and the
  `or` skipped straight past it, silently returning `None` for every
  `name`/`title`. Fixed with an explicit `is not None` check
  (`_find_first`); re-tested, confirmed correct.

## Driver changes (JA1 — copy only, under `ticket-499/samples/`, old files/hashes untouched)

- **(a)** `E1-WGS84`'s own call block removed entirely from
  `live_driver.py`'s `main()`. `Driver(...)` instantiated with
  `max_calls=2, max_total_bytes=4456448, window_minutes=10` (this
  round's own bounds, not `#493`'s `3`/`4718592`/`30`).
- **(b)** `validate_response()`'s count-equality check no longer
  includes `len(expected_keys)` — it is now
  `number_matched == number_returned == len(features)` only. An extra
  feature sharing `IDBUTUR 911170037` (the SAME layer/road segment as
  the expected S2 set) is recorded as `extra_keys_same_idbutur` and is
  **never** itself a STOP reason — exactly the shape `#493`'s own E1
  response already showed (12 extra features, same `IDBUTUR`,
  different `IDFERILL`: 1985/2899/19524). An extra feature NOT sharing
  that `IDBUTUR`, or whose `id` doesn't start with
  `faerdferlar2017_1.`, is `extra_keys_other_idbutur_or_layer` and
  DOES stop (wrong layer/segment is a different, real problem).
- **(c)** `ACCESS-CAPABILITIES` is attempted unless `S2-WGS84` itself
  hit a TRANSPORT/SECURITY stop (`driver.py`'s own
  `entry["stop_reasons"]`: non-200, TLS/transport error, redirect,
  truncation, wall-clock-cap, budget exhaustion). A DATA-shape
  deviation on `S2-WGS84` (missing/duplicate pair, wrong CRS, wrong
  layer/IDBUTUR, paged/skewed response, limit hit, count mismatch)
  does **not** block `ACCESS-CAPABILITIES` — S2 is simply published as
  `null`/gap with that reason instead.

STOP conditions actually implemented in `validate_response()` (JA2a):
`WRONG_CRS`, `MISSING_EXPECTED_PAIR`, `DUPLICATE_PAIR`,
`WRONG_IDBUTUR_OR_LAYER`, `PAGED_OR_SKEWED_RESPONSE` (`numberMatched >
numberReturned`), `LIMIT_HIT` (`len(features) >= 300`),
`COUNT_FIELD_MISMATCH`. There is no arbitrary feature-count ceiling
(the old, removed "> 40 features" idea) anywhere in this file.

## Real network run

Both calls made, in order, via `samples/live_driver.py`:

| request_id | status | bytes_received | sha256_of_received_bytes | stop_reasons |
|---|---|---|---|---|
| S2-WGS84 | 200 | 36943 | `b1b8aa63571d6377de742a02b4e2e4f35860182191846e4a88afabddf463628a` | `[]` |
| ACCESS-CAPABILITIES | 200 | 38416 | `bd10b61e53902d01d9ba7c54d634805ee3b0f965a9baec6b5d88dcfec17a4a1d` | `[]` |

`calls_made: 2`, `bytes_received_total: 75359` (of 4,456,448
authorized). `data_stop_reason: null`, `transport_stop_reason: null`.
Full ledger: `samples/exchange-ledger.jsonl`. `E1-WGS84` was never
called. No redirect, no retry, TLS verified on both (`bounded_fetch.py`'s
own enforcement, SHA-checked unchanged before import:
`c2610ebfbfdc56fd11776df0511c68246a7a958486fda96fd2e8858cab259be6`).

### S2-WGS84 validation

Clean: 20/20 expected (`idferill` ∈ {2891,2892,2894,3409,3410} ×
`nakvaemniferlis` ∈ {-1,0,1,2}, `IDBUTUR 911170037`), 0 missing, 0
extra (neither same- nor other-`IDBUTUR`), 0 duplicates, correct CRS.
`numberMatched == numberReturned == len(features) == 20`. JA1(b)'s
"same-`IDBUTUR` extra is a finding, not a stop" behavior was NOT
exercised by this real response (it was clean) — it is exercised
offline in `validator_499.py` (`test_extra_same_idbutur_is_a_finding_never_a_stop`).

Paired against `rp1_native_reference.json` (byte-identical copy of
`#493`'s own file, SHA
`bc1a6dbc2b50cfb3020d6dca705e96b7809648e828de6b5802900a1731e036cf`,
confirmed equal to the original before use) per EA5(a)-(d)/EA6: all 8
published entries (4 tiers × 2 roles) carry `tier_consistency_flag:
true`; the END(2894)/START(2892) junction cross-check shows native
agreement (≤0.0001m) AND WGS84 agreement (≤1e-8°) — both `true`.
Published lat/lon for both roles, all tiers: `65.26021788,
-14.00953135`. Full entries: `endpoint-registry.json` →
`s2_seydisfjordur.entries`.

### ACCESS-CAPABILITIES result

200, 38416 bytes. `classify_capabilities.py`'s safety gate (reused
EA7 discipline) confirmed no `<!DOCTYPE`/`<!ENTITY` before any XML
parsing. 61 `FeatureType`s enumerated, 28 flagged
`discovery_candidate` per `metadata-classification-rule.md`'s own
keyword rule (SHA-confirmed unchanged:
`b3c18d67d09d5aa37c037a3768c6a275298af45fc4205954416a7c95e617510f`).
Per EA7's own explicit limit, this establishes nothing about content,
licence, or driving access by itself — `driving_access_both_directions`
stays `EXACT_GAP`. No further call was triggered by this
classification. Full listing: `discovery-gaps.json`.

**Real bug found and fixed BEFORE this response was processed**
(caught by an offline test against a synthetic capabilities snippet,
run before the real call): `classify_capabilities.py`'s first
implementation used `element.find(a) or element.find(b)` to try a
namespaced tag then a bare one. `ElementTree.Element.__bool__`
reflects CHILD COUNT, not whether `find()` matched — a found leaf
element like `<Name>text</Name>` has zero children and is therefore
falsy, so the `or` silently skipped past a real match, returning
`None` for every `name`/`title` regardless of the actual XML content.
Fixed with an explicit `_find_first()` helper using `is not None`;
re-tested against the synthetic snippet (name/title correctly
extracted, `discovery_candidate` correctly `True`/`False`) before
being run against the real 38KB response.

## R1 Reykjavík — confirmed EXACT_GAP (no new search performed)

Re-verified directly (not only via the research pass): `endpoint-
candidates-v3.json`'s own `reykjavik.raudavatn_candidate_*` entries
are explicitly `"unselected comparison candidate (D6) -- never a
confirmed Reykjavík core"`; `rey_core.coordinate_source:
"NO_COORDINATE_SOURCE"`; `ticket-493-access-points/evidence-v4.md`
lists `REY-CORE` among its own still-open gaps. `ticket-493/
endpoint-owner-decisions-2026-11-11.md`: owner approved R1 as product
SCOPE only ("Reykjavík fær nafngreinda aðkomu... Hvorugur
Rauðavatnsendi1436 er sjálfkrafa samþykktur Reykjavíkurendi"). No new
map/service search was started (approved-prompt-v1.md step 5's own
boundary). Recorded in `endpoint-registry.json` → `r1_reykjavik`,
including the smallest proposed-not-executed next step.

## E1/C — retained, re-verified directly, not re-fetched

- E1 (Egilsstaðir): confirmed directly against `ticket-493-
  endpoint-acquisition/samples/raw-E1-WGS84.json` — 32 features, 24
  properties per feature (not 28), `Transfer-Encoding: chunked` (per
  the retained ledger's own `response_headers`), SHA
  `cb9382946098c2040dbc5c151985977974a1b7bf38aede520a7c1a312ee78355`
  matches the ledger exactly. ER3's corrections are reflected in how
  this round's own registry *describes* E1; the old `#493` files
  themselves are untouched.
- C (Akureyri): confirmed directly against `ticket-493-north-data/
  route-data-candidate.json` (SHA
  `094fb5d3615c1d5f0e7b372706d134bf48e9c5e954ab3ec7af61fa825b0fb4a8`)
  — idferill 2940's `native_end_3057` exactly equals idferill 3876's
  `native_start_3057`: `[540259.2615, 577843.7582]`; WGS84
  `65.69570405, -18.12371406` on both sides. No new call (JA3).

## Validation

`samples/validator_499.py`, 17 tests, run against retained raw/
fixtures only (no network re-run) — **all passing**:
- Provenance: `S2-WGS84`'s registry-cited SHA matches the real raw
  file; a mutated SHA is shown to diverge (caught, not silently
  passed); Akureyri's native-file SHA matches; every S2 entry cites a
  ledger line + native reference.
- Required pairs: all 8 expected (role, tier) entries present;
  removing one is shown to be detected.
- Junction consistency: S2's own cross-check reports agreement; a
  mutated START coordinate is shown to fail the same check; Akureyri
  C's native END/START equality holds.
- Extra features: a clean synthetic response passes; a same-`IDBUTUR`
  extra is a finding and does NOT stop (JA1b, the binding condition);
  an other-`IDBUTUR`/wrong-layer extra, a duplicate, a missing pair,
  wrong CRS, and a 300-feature limit-hit each stop with their own
  specific `deviation_type` (`WRONG_IDBUTUR_OR_LAYER`,
  `DUPLICATE_PAIR`, `MISSING_EXPECTED_PAIR`, `WRONG_CRS`,
  `LIMIT_HIT`); the REAL S2 response itself is confirmed clean with
  zero extras of either kind.

One test fixture bug found and fixed during this same pass (not a
production bug): `test_limit_hit_stops`'s first version used feature
keys outside the expected set, so it hit `MISSING_EXPECTED_PAIR`
before ever reaching the length check — fixed by padding the real 20
expected keys with same-`IDBUTUR` extras up to 300, isolating the
intended `LIMIT_HIT` path.

## Scope confirmation (read-only)

```
$ git status --porcelain=v1
 M AGENTS.md
 M CLAUDE.md
 M docs/ai/CURRENT.md
 M docs/ai/README.md
?? docs/ai/tasks/ticket-498/...  (prior round's own files, unrelated to #499)
?? docs/ai/tasks/ticket-499/
```
`AGENTS.md`/`CLAUDE.md`/`docs/ai/README.md` were already modified
before this round began (the owner's own #498 steering intervention,
recorded in `CURRENT.md`'s own handoff history) — not touched by this
round. Nothing under `ticket-493*` was modified (only read); a stray
`__pycache__/` created by importing `bounded_fetch.py` was removed
before this check. No application/API/scoring/gating/payment code
touched. No commit/push/GitHub action. No new dependency.

## Round outcome

**PARTIAL** (not a false MVP-complete claim, per the approved
prompt's own explicit instruction): E1/S2/C are each traceable with
hashes/ledger lines and usable; R1 (Reykjavík) has no owner-selected
candidate, so the one-Reykjavík-option product scope is not yet
deliverable end to end. `driving_access_both_directions` is
`EXACT_GAP` for every place in this registry — not claimed resolved
anywhere. No app/UI/API/routing-engine change. `#498`/Windows-first
history is unrelated and untouched. Next owner decision needed: the
smallest next discovery step for a real Reykjavík candidate (see
`endpoint-registry.json` → `r1_reykjavik.smallest_next_step_proposed_not_executed`).
