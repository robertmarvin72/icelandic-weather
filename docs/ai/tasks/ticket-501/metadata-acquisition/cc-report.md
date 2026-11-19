# #501 metadata-acquisition — CC report

## Authorization record

- Approved prompt: `docs/ai/tasks/ticket-501/metadata-acquisition/approved-prompt-v1.md`
  (Jonesy APPROVED the acquisition plan with N1–N3; owner explicitly
  approved the exact single-call proposal in chat, "Samþykkt").
- Owner handoff: "Prompt approved" on `CURRENT.md` while `Stage:
  READY_FOR_CC`, 2026-11-17.
- This round authorizes **exactly one** outbound network request. No
  route-engine implementation, no graph work, no product-data change,
  no GitHub action, no commit/push/deploy.

## Git state

- HEAD before and after: unchanged (no commits made this round).
- `git status --porcelain` before starting: `M docs/ai/CURRENT.md` (my
  `CC_IN_PROGRESS` edit) + `?? docs/ai/tasks/ticket-501/` (pre-existing
  untracked task directory from the prior audit round, plus the
  already-created `metadata-acquisition/approved-prompt-v1.md`).
- `git diff --check` after finishing: clean.
- `git status --porcelain` after finishing: same two entries — only
  new files added under `docs/ai/tasks/ticket-501/metadata-acquisition/`
  and the required `CURRENT.md` lifecycle edit. No `server_data/`,
  `src/`, `api/`, config, dependency, or prior-round file touched.

## Pre-dispatch verification (per the approved prompt's own instruction)

Read `docs/ai/tasks/ticket-499/samples/raw-ACCESS-CAPABILITIES.xml`
offline before sending anything. Confirmed the `FeatureType` entry for
`gis:vegakerfi_ist120_2024_1` ("Vegakerfi ist120"), Abstract text
citing vegalög nr. 80/2007 and the ÍST 120:2012 standard — matching
the approved prompt's own identification of this as the vegaskrá
(road register) layer. Did not re-fetch GetCapabilities or the
`faerdferlar2017_1` schema — both already retained per #499/#429, as
the prompt instructs.

## The one authorized request — dispatched exactly once

- Helper script: `fetch_schema.mjs` (built-in Node `https`/`crypto`/
  `fs` only, no dependency installed), written and left in
  `metadata-acquisition/` per the prompt's "may live here" allowance.
  No automatic retry logic; writes confined to its own directory.
- URL dispatched (verified byte-for-byte identical to the approved
  prompt's URL via a dry-run `URL` parse check before the real
  request, to confirm `%3A` encoding survives reconstruction):
  `https://gagnaveita.vegagerdin.is/geoserver/gis/ows?service=WFS&version=1.0.0&request=DescribeFeatureType&typeName=gis%3Avegakerfi_ist120_2024_1`
- Method: GET. User-Agent: `EltumVedridResearch/1.0 (ticket-501
  metadata-acquisition; contact: research-only)` — same descriptive,
  non-personal convention already used in #429 (`manifest.md`).
- Streaming 262144-byte cap enforced in code (not trusting
  Content-Length) — would truncate and abort on overflow; did not
  trigger, real body was 3815 bytes.
- 20-second wall timeout enforced via `req.setTimeout` — did not
  trigger; actual wall time 37 ms.
- Zero retries, zero redirects: Node's `https.request` never follows
  redirects on its own; a 3xx would have been recorded as a failure
  outcome, not followed. No such response occurred.
- Dispatched exactly once, not repeated after the fact.

## Outcome

- **Complete success.** HTTP 200, `Content-Type: text/xml`,
  `Content-Disposition: inline; filename=gis-vegakerfi_ist120_2024_1.xsd`,
  server `Date: Tue, 17 Nov 2026 18:10:16 GMT`.
- 3815 bytes received, well under the 262144 cap — no truncation.
- SHA-256 of retained bytes: `33b7405c11b4272382dcfd9f31e82f4ab0f15cab8d03ce25128a6af0468b72cb`
  — independently re-verified after the fact with `sha256sum` against
  the written file, matching the ledger's own computed value exactly.
- Full request/response metadata in `request-ledger.json` (exact URL,
  method, UTC client start/end, HTTP status, byte count, server `Date`
  header kept separately, outcome, SHA-256).
- Raw response bytes retained unmodified at `raw-ROAD-REGISTER-SCHEMA.xml`.

## What was found (full detail in `metadata-report.md`)

The schema describes 28 fields on `vegakerfi_ist120_2024_1Type`. Most
notably, a field named `AKSTURSSTEFNA` ("driving direction"),
`xsd:decimal`, nillable — the first directly direction-named field
found anywhere in this project's retained Vegagerðin data. Per the
approved prompt's own caution, a field name/type alone is not verified
semantics, so I checked (via `grep`, no new network call) whether any
other **already-retained** file in the repo documented this field's
actual code values. It does: `docs/planning/nature-roads-source-2026-10-28/`
(an owner-provided, SHA-256-verified PDF extract, read by Ripley on
2026-10-28, entirely pre-existing and unrelated to this round's own
dispatch) documents an identical-named field for a sibling WFS layer
(`vegirinatturuislands_2022_1`, not the exact layer queried here) with
an exact code table (−1/0/1/2 = against-line/unknown/with-line/
two-way, explicitly geometry-relative, not a compass direction or
legal-traffic proof). I reported this cross-layer evidence with its
precise caveat — it is strongly suggestive (near-identical field sets,
both citing the same ÍST 120:2012 standard) but **not** a confirmed
definition for `vegakerfi_ist120_2024_1` itself. No connection/node
(from-ID/to-ID) field was found in either layer's schema.

## Verification performed

- `sha256sum` on the retained XML file, matching the ledger's own
  computed hash exactly.
- `git diff --check` — clean.
- `git status --porcelain` — only the expected files.
- No app tests/lint/build run — no code changed, consistent with the
  approved prompt's own acceptance criteria.
- No process left running; the helper script runs to completion and
  exits (verified by its own synchronous write-then-exit structure).

## Status

The one authorized request was dispatched exactly once and succeeded
cleanly. The direction/connection question is answered **partially**:
a plausible field exists, with strong but not fully confirmed
cross-layer evidence for its code meaning. Two possible next steps are
proposed in `metadata-report.md`, both requiring separate owner
authorization — neither is executed here. No GitHub issue closed or
edited; no commit/push/deploy; no #501 implementation.


## Ripley correction note — JE1–JE3 — 2026-11-17

28 sequence elements, not 27. Overall A is PARTIAL: no node fields found
in inspected schemas; direction field exists but its semantics for this
exact layer remain UNKNOWN (sibling-layer documentation is a lead).
Any earlier wall-timeout-enforced statement is corrected: req.setTimeout
is idle-only. Ledger duration 37ms means no observed overrun, not a proven
wall-cap implementation. Helper is executed/non-rerunnable; no guard, do
not run it again or overwrite retained evidence. No script/app edit needed
to assess the completed request. Further acquisition is not authorized.
