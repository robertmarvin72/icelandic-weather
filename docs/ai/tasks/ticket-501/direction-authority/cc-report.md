# #501 direction-authority — CC report

## Authorization record

- Approved prompt: `docs/ai/tasks/ticket-501/direction-authority/approved-prompt-v1.md`
  (Jonesy APPROVED without blockers; Round 1 + Jonesy's binding P1–P4
  incorporated verbatim).
- Owner handoff: "Prompt approved" on `CURRENT.md` while `Stage:
  READY_FOR_CC`, 2026-11-18.
- Scope: document/metadata research only. No `api/`, `src/`,
  `server_data/`, config, or dependency change of any kind. No runtime
  policy created. Only new files: this ticket's own
  `direction-authority/authority-report.md` + `cc-report.md`, plus the
  `CURRENT.md` lifecycle update.

## What was done

1. Re-read the already-retained material the approved prompt pointed
   to: `directed-composition/result-review.md` (confirming CF1/OP1–OP4
   are closed, not reopened here), `metadata-acquisition/metadata-report.md`
   + its own `result-review.md` (JE1–JE3), the retained
   `raw-ROAD-REGISTER-SCHEMA.xml`, and
   `docs/planning/nature-roads-source-2026-10-28/source-note.md` +
   `extracted-text.txt`.
2. While re-reading retained material for the question-3 (VEGHLUTI)
   side-question, found that **`docs/ai/tasks/ticket-483/owner-source-2026-10-28/`**
   (an owner-provided Vegagerðin PDF for `faerdferlar2017_1` itself,
   already in the repo since 2026-10-28, not previously cross-checked
   against this specific question) contains a direct, verbatim,
   official definition of VEGHLUTI's code values — this answers
   question 3 from material already on disk, **no new network action
   needed for that question**.
3. For question 1 (AKSTURSSTEFNA on `vegakerfi_ist120_2024_1`), the
   retained schema only confirms the field's existence/type, not its
   code values, and no other retained document covers that exact
   layer. Per P1's own instruction, this authorized the budgeted web
   step: opened the retained landing page (`skjal 1`), found no
   layer-specific link there, ran 2 search queries (the authorized
   maximum), and opened one metadata-registry record as a candidate
   `skjal 2` — which turned out to describe an unrelated dataset. No
   third document was opened once the 2-document cap (skjal 1 + skjal
   2) was reached, even though the second search query also came back
   empty. Full action log with URLs/dates is in `authority-report.md`.
4. Wrote `authority-report.md`: a 3-row result table (CONFIRMED/
   PARTIAL/UNKNOWN for all three questions), with direct quotes kept
   separate from inference throughout, minimal necessary excerpts only
   (a handful of lines per source, never a full page), and one single
   final recommendation per the prompt's own format.

## Disposition per question

- **Q1 (AKSTURSSTEFNA, `vegakerfi_ist120_2024_1`): PARTIAL** — field
  confirmed to exist (retained schema); code-value meaning for this
  exact layer not found, in retained material or within this round's
  budgeted search. Sister-layer code table remains a strong but
  unconfirmed indication only.
- **Q2 (IDKAFLI↔IDFERILL/IDBUTUR crosswalk): UNKNOWN** — no documented
  join field in either retained schema; shared `VEGNR`/`KAFLANR` field
  names are explicitly insufficient proof per the approved prompt's own
  instruction.
- **Q3 (VEGHLUTI 6/7, `faerdferlar2017_1`): CONFIRMED for the literal
  field/code definition** (owner-provided Vegagerðin PDF, already
  retained) — **but the leap from that definition to "this confirms a
  one-way travel-direction authority" is explicitly flagged as this
  report's own inference, not the document's own wording**, since the
  source never uses "einstefna"/"tvístefna" for this field the way the
  sister layer's `AKSTURSSTEFNA` table does for that field.

## P1–P4 compliance

- **P1**: budget respected — skjal 1 (landing page) + ≤2 search
  queries (both used, both unproductive for Q1) + skjal 2 (one
  candidate document, opened, found irrelevant) = exactly 2 documents
  total opened via the web, never exceeded. HTTP status/bytes/SHA-256
  for the two web fetches are recorded as UNKNOWN (the fetch tool
  available in this session returns AI-summarized content, not raw
  bytes) — per P1's own explicit allowance, this is recorded as a
  limitation, not fabricated, and no document was re-fetched solely to
  try to measure it.
- **P2**: side-question 3 added to the same result table/budget;
  direct wording separated from inference throughout; no regex/role-
  name reading was used as an authority anywhere in this report.
- **P3**: Q2 defaulted to UNKNOWN (no verbatim crosswalk found, as
  required); the recommendation states which specific finding
  (Q1 moving from PARTIAL to CONFIRMED) would actually change anything,
  and does not propose a `GetFeature` call or any other data
  acquisition, since the prompt's own "both confirmed" trigger
  condition for that was not met.
- **P4**: no WFS/WMS/ArcGIS REST/`GetCapabilities`/`DescribeFeatureType`/
  data-package link was opened or probed at any point; the one dead-end
  metadata record found by search was a plain HTML description page,
  not a service endpoint, and its own WFS link was explicitly excluded
  from the fetch (confirmed in the tool's own response).

## Verification performed

- `git status --porcelain` / `git diff --check` — only this ticket's
  own new `direction-authority/` files and `docs/ai/CURRENT.md` are
  touched; no `api/`/`src/`/`server_data/`/config file appears.
- No app tests/lint/build run — not applicable to a document-research
  round, per the approved prompt's own instruction; none were
  fabricated as having run.
- No commit/push/deploy/GitHub action taken.

## Status

Document-research round complete. `UNKNOWN` (Q2) and `PARTIAL` (Q1)
are honest, final answers within this round's authorized budget — not
a reason for an automatic follow-up round. `CONFIRMED` (Q3, field
definition only) is a genuine new finding from already-retained
material, with its own inference boundary stated explicitly so it is
never mistaken for a travel-direction authority. No runtime direction
policy exists or is proposed; the directed-composition core
(`geometryComposition.js`) remains untouched and still requires an
explicit, separately-reviewed policy input for any real use.


## Ripley correction — 2026-11-18

Final assessment PASS; see result-review.md. authority-report corrected
for RA1/RA3: VEGHLUTI already belongs to the geometry features, Q2 is
not needed to read it; section direction is not confirmed vertex order.
The PDF code list is not exhaustive/current for this dataset (1 and 8
undocumented). Recommendation now targets that source-specific gap.
Web actions are CC-reported only, with fallback/link-scope ambiguity
recorded; no independent refetch or new authority granted.
