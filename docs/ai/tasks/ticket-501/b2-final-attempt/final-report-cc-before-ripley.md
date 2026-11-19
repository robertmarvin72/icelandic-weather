# #501 B2-LOCAL-GEOMETRY-ATTEMPT-3 — final result

## Short conclusion: the request succeeded, 20 real features were returned, one previously-unknown road piece was found 16.45 m from the gap — but no literal connector bridges the 34.748670 m 2117↔2135 gap. B2 pursuit stops here.

The Host-header fix worked: this is the **first B2 attempt across three
rounds to actually complete** — `HTTP 200`, `outcome: complete_usable`,
36,267 bytes, CRS and feature counts all internally consistent and
**not truncated** (`numberReturned == totalFeatures == 20`, well under
the 100-feature cap). This is a genuine, complete, evidence-usable
answer — not a lost response, not a rejection.

**B2 itself is still not demonstrated**: no feature's endpoint is a
literal (0.0 m) match to the other B2 point, even in this wider,
unfiltered query that surfaced a road this project's retained VEGNR=1-
only searches never covered. Per the owner's own standing instruction,
**B2 pursuit stops after this attempt, regardless of outcome.**

## O1 proof that the fix actually addresses a real bug — not just a plausible theory

Before any dispatch, a byte-level, network-free test installed a fake
socket on `http.client.HTTPSConnection.connect` for the exact real URL
and host, and captured what would actually be sent:

- **RED** (attempt-2's own unmodified `bounded_get`, imported
  read-only, never edited): **2** `Host:` header lines.
- **GREEN** (this attempt's `bounded_get`, one line deleted): exactly
  **1** `Host: gagnaveita.vegagerdin.is` line, request line byte-for-byte
  equal to the manifest URL, no `Connection:` header, no other
  duplicated header name.

This reproduces Jonesy's finding mechanically, not just by inspection,
and the subsequent real dispatch below confirms it was the actual
cause: the exact same URL that got `HTTP 400` twice now returns `HTTP
200` with a real, valid WFS response.

## The one final request — dispatched exactly once

- `dispatch-marker-B2-LOCAL-GEOMETRY-ATTEMPT-3.json` created
  (before any socket activity), then the GET was sent.
- `request-ledger.json`: `http_status: 200`, `Content-Type:
  application/json`, CRS `urn:ogc:def:crs:EPSG::3057` (matches
  expected exactly), `numberReturned: 20`, `totalFeatures: 20`
  (equal — not a truncation signal), `byte_count: 36267` (matches
  `Content-Length`), `outcome: complete_usable`.
- `raw-B2-LOCAL-GEOMETRY-ATTEMPT-3.bin`, SHA-256
  `34bd1d011ee5a5433ee1394825650c212951c611847393cb68337d0765a70123`.

## What the 20 returned features actually are

5 distinct `IDFERILL` values, each present across the 4 retained
precision tiers (2/1/0/−1) → 5 × 4 = 20, exactly matching
`numberReturned`. Coordinates identical across tiers for the same
`IDFERILL` (confirmed directly, not assumed).

| IDFERILL | IDBUTUR | VEGNR | VEGHLUTI | Start (EPSG:3057) | End (EPSG:3057) | Status vs. retained baseline-16 |
|---|---|---|---|---|---|---|
| 2117 | 252090037 | 1 | 7 | (380053.5716, 395170.5039) | **(392674.357, 389846.132) = B2 point A** | Retained (already known — this is the 2117 exit itself) |
| 2134 | 902020037 | 1 | 6 | (392687.724, 389866.716) | (380059.7979, 395174.0714) | Retained (already known from the b2-geometry round's own N2 finding) |
| 2135 | 902030037 | 1 | 1 | (400974.332, 384785.129) | **(392703.5, 389865.057) = B2 point B** | Retained (already known — this is the 2135 entry itself) |
| **2310** | **902410037** | **38** | **1** | **(392682.8404, 389832.0355)** | (384182.43, 382549.23) | **NEW** — not in the retained baseline-16, not found by any prior VEGNR=1-only search. A different numbered road (38, not the Hringvegur/VEGNR 1 corridor). |
| 36807 | 902030037 | 1 | 5 | (392703.5, 389865.057) | (392703.5, 389865.057) | Retained (already known — degenerate/zero-length piece touching point B exactly) |

All coordinates re-extracted directly from the retained response this
round, not copied from any prior document.

## The connector question, answered precisely — literal equality only, no snapping

- **36807's own start/end is a literal, exact (0.0 m) match to B2
  point B (2135's end)** — already known from prior rounds, confirmed
  again here. It does **not** touch point A.
- **2310's start vertex is 16.452336849488617 m from point A** (2117's
  end) and **38.95174623054542 m from point B** (2135's end) —
  computed directly from the retained coordinates this round (not
  estimated). This is **closer to point A than any previously-known
  feature** (2134 was 24.5 m away, per the prior round's own finding),
  but it is a **measured gap, not a contact** — 16.45 m is not 0.0 m.
- **No feature anywhere in this response has a literal exact-coordinate
  match to both B2 points, or forms any zero-gap chain between them.**
  No coordinate snapping, tolerance, epsilon, or tier-mixing was used
  to reach this — every comparison above is exact literal equality or
  an honestly reported Euclidean distance.
- 2310's own road number (VEGNR 38) and the fact it was invisible to
  every prior VEGNR=1-restricted search in this project confirms the
  bbox's own design rationale (no VEGNR/IDBUTUR/role filter, so
  "retained excluded connectors may appear") did real work this round
  — it just didn't happen to produce a literal connector.

**Answer: B2 does not demonstrate a connector between the 2117 and
2135 endpoints in this data.** This is the same honest conclusion
`offline-gap-check.md` reached by a different method (scanning
already-retained files) — now independently confirmed by a live,
complete, untruncated query against the actual service, which also
turned up one genuinely new, previously-undocumented nearby road piece
or that didn't exist in the sense of being found by prior searches,
without changing the answer.

## Status: B2 pursuit stops here, per the owner's own standing instruction

Three attempts, two distinct real bugs found and fixed (the lost-
response crash in attempt-1, the duplicate Host header in attempt-2),
and one attempt that finally completed cleanly and gave a real,
complete, honest answer: **no connector, but one new fact** (the
VEGNR 38 piece's measured 16.45 m proximity to point A). Per the
approved prompt, **no fourth attempt, no root-cause follow-up on
anything else, and no automatic gap-bridging are proposed** — this is
the final data point for B2 under this exact request. The
34.748670 m gap stays exactly as `offline-gap-check.md` and the prior
rounds already described it: a specific, honestly documented data gap
in the retained road register, now reinforced by a live check rather
than resolved by one.

Any further action — accepting this gap as a permanent product
limitation, or separately authorizing a differently-scoped
investigation (e.g. a dedicated query for VEGNR 38's own full extent,
or a wider bbox) — is a new product/owner decision, not a continuation
of this B2 effort.
