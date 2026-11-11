# #493 endpoint-acquisition — Owner authorisation record (EA1)

**Date:** 2026-11-11.

Per `approved-prompt-v1.md`'s own header instruction and EA1, this
file records the dated owner handoff that authorises this task's
bounded network exchange, written BEFORE any external HTTP call is
made.

## Record

- The owner (Róbert) sent the literal, canonical message **"Prompt
  approved"** to this Claude Code execution session, with
  `docs/ai/CURRENT.md` at that moment pointing to:
  - Task: `ticket-493-endpoint-acquisition`
  - Stage: `READY_FOR_CC`
  - Approved prompt: `docs/ai/tasks/ticket-493-endpoint-acquisition/approved-prompt-v1.md`
- That approved prompt's own SHA-256, independently computed by CC
  before acting: `6f13b4cff953352b72f77b04663cf3aa108d64ed43bb6d6ced70b58ec95bd8dc`
  (21,054 bytes) — recorded identically in `docs/ai/CURRENT.md`'s own
  handoff entry for this date.
- Per the single-active-task invariant (`docs/ai/README.md`), only
  this task was active in `docs/ai/CURRENT.md` at the moment of that
  handoff.
- This quote is exactly what the owner said. The path and SHA above
  are CC's own mechanical link between that message and the active
  prompt — not words the owner used, and not a paraphrase presented as
  a quote.

## What is authorised, and only this

- **Host:** `gagnaveita.vegagerdin.is` — HTTPS, standard TLS
  verification, GET only. No key, cookie, session, or environment
  secret sent.
- **Path:** `/geoserver/gis/ows` only.
- **Requests, in this exact order, each exactly once** (see
  `request-manifest.json` for the full encoded form):
  1. `E1-WGS84` — `GetFeature`, `typeName=gis:faerdferlar2017_1`,
     `CQL_FILTER=IDBUTUR IN (911040037)`, `srsName=EPSG:4326`,
     `outputFormat=application/json`, `maxFeatures=300`. Per-body cap
     262,144 B.
  2. `S2-WGS84` — same form, `CQL_FILTER=IDBUTUR IN (911170037)`.
     Per-body cap 262,144 B.
  3. `ACCESS-CAPABILITIES` — `GetCapabilities`. Per-body cap
     4,194,304 B.
- **Budget ceiling, exactly as computed from `request-manifest.json`
  and matching the approved prompt's own stated limits:**
  - 3 HTTP exchanges total.
  - 2 × 262,144 + 4,194,304 = **4,718,592 B** total response bytes.
  - 20 s socket timeout **and** 20 s wall-clock cap per call
    (EA2a — the wall-clock cap is enforced by this task's own driver,
    not by `bounded_fetch.py` itself, which only has a socket
    timeout).
  - 30-minute acquisition window from the first call.
  - 0 retries, 0 redirects followed.
- **Scope:** this task only (`ticket-493-endpoint-acquisition`); not a
  standing allowlist entry for any other task — mirrors
  `ticket-493-place-data-phase2/owner-authorisation.md`'s own
  explicit precedent wording.
- **Also already-authorised, from prior rounds, unchanged by this
  record:** `gagnaveita.vegagerdin.is` itself has prior-round
  precedent (north-data, phase2) — this record does not re-authorise
  a new host, only this task's own three bounded calls to it.

## What is explicitly NOT authorised by this record

- Any other host, path, method, or parameter — `propertyName`,
  `sortBy`, `bbox`, `startIndex`, or any parameter not listed above.
- `DescribeFeatureType` (skipped this round, RP3's own reasoning).
- Any feature call, `DescribeFeatureType`, or follow-up request built
  from the `ACCESS-CAPABILITIES` response — EA7 is explicit that no
  schema-/feature-followup happens this round regardless of outcome.
- A fourth call of any kind, a repeated `request_id`, or any call
  outside the 30-minute window from the first call (EA2c — refused
  before connecting, ledgered as `refused`).
- Following a redirect, retrying a failed call, or widening a filter
  after a disappointing result.
- `px.hagstofa.is` or any other host.
- Treating a successful response as proof of driving access, a
  confirmed R1 point, a confirmed S2 approach name, or a licence
  determination for Hagstofa (`LICENSE_NOT_DETERMINED` stands).
- Any candidate promotion, release-list approval, weather-point
  selection, route graph, or app/API/entitlement change.

This record does not itself perform any network action — it is the
dated confirmation required before the first one is attempted, per
EA1's own gating sequence (steps 1–5 of which this record closes;
step 6, the EA2 driver tests against localhost, follows next).
