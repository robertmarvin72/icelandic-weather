# #501 direction-authority — authority report — 2026-11-18

Executed under `approved-prompt-v1.md` (Jonesy APPROVED, P1–P4 binding).
Document/metadata research only. No code, no `api/`/`src/`/`server_data/`
change, no runtime policy, no network data acquisition beyond the
budget below.

## Result table

| # | Question | Verdict | Authority / location | What it proves |
|---|---|---|---|---|
| Q1 | Is there an official, layer-specific definition of `AKSTURSSTEFNA` (incl. code values and relation to vertex order) for `gis:vegakerfi_ist120_2024_1`? | **PARTIAL** | `metadata-acquisition/raw-ROAD-REGISTER-SCHEMA.xml` (retained, this ticket's own prior round) + this round's own budgeted search (below) | Field confirmed to EXIST on this exact layer (`AKSTURSSTEFNA`, `xsd:decimal`, nillable). Its code-value meaning for THIS layer is still not directly documented. A sister layer's owner-provided PDF gives a strong, but not layer-confirmed, indicative code table (see Q1 detail). |
| Q2 | Is there a documented crosswalk/identity+orientation mapping between `vegakerfi_ist120_2024_1`'s `IDKAFLI` and `faerdferlar2017_1`'s `IDFERILL`/`IDBUTUR`? | **UNKNOWN** | Both retained schemas (same XML; `docs/ai/tasks/ticket-483/owner-source-2026-10-28/extracted-text.txt` pp.2–3) | Neither schema documents a from-ID/to-ID or cross-layer join field. Shared `VEGNR`/`KAFLANR` field NAMES alone are explicitly not proof of identity/orientation (per the approved prompt's own instruction) — no document found overrides that. |
| Q3 | Is `VEGHLUTI` (specifically codes 6/7) defined in the official `faerdferlar2017_1` documentation, and does that definition establish a travel direction? | **CONFIRMED** (field/code definition only) — **the travel-direction leap remains an INFERENCE, not confirmed** | `docs/ai/tasks/ticket-483/owner-source-2026-10-28/extracted-text.txt:108–114` (owner-provided Vegagerðin PDF `gagnaveita_faerd_ferlar_2017.pdf`, dated 4 March 2019, already retained — found by re-reading already-retained material, no new network action) | See Q3 detail below — this is a direct, verbatim, Vegagerðin-published definition of what VEGHLUTI's values denote, but it does not itself use "einstefna"/"tvístefna" (one-way/two-way) language the way the sister-layer `AKSTURSSTEFNA` table does. |

## Q1 detail — AKSTURSSTEFNA on `vegakerfi_ist120_2024_1`

**Direct wording already retained** (from `metadata-acquisition/metadata-report.md`,
this ticket's own prior round, re-confirmed here, no new fetch needed):
the `DescribeFeatureType` response for `vegakerfi_ist120_2024_1Type`
contains `<xsd:element name="AKSTURSSTEFNA" type="xsd:decimal" nillable="true"/>`
— the field exists, type confirmed, **no code-value list in that
response** (this retained response has no code-value definitions).

**This round's own budgeted search** (see "Web actions taken" below):
the retained landing page (`skjal 1`,
`https://www.vegagerdin.is/upplysingar-og-utgafa/gagnaveita-vegagerdarinnar/`)
lists Vegagerðin's web-service categories (DATEX II, Fastmerki, Færð og
veður, Námur, Umferðarteljarar, Vefmyndavélar, Veghelgunarsvæði, Vegir í
náttúru Íslands) but names none of them "Vegakerfi"/`ÍST120` and links
no field/code description document for this specific layer — the
retained path did not resolve `skjal 2`, which is what authorized the
two search queries used. Neither search query surfaced a Vegagerðin-
published or genuinely on-topic official-metadata-registry document for
`vegakerfi_ist120_2024_1` itself; the one metadata-registry record
opened as a candidate `skjal 2` turned out to describe an unrelated
dataset (Náttúrufræðistofnun bedrock geology — see below). **Direct
confirmation for this exact layer's code values was not found within
this round's authorized budget.**

**Indirect indication (inference, not confirmation, unchanged from the
prior round)**: the sister layer `gis:vegirinatturuislands_2022_1`
(owner-provided PDF, retained at
`docs/planning/nature-roads-source-2026-10-28/`) documents, verbatim,
on its own page 5 (`extracted-text.txt:224–229`):

> AKSTURSSTEFNA / Kóði Nafn Skilgreining / -1 Einstefna á móti stefnu
> línu — Stefna línu sýnir hvernig hún er teiknuð. / 0 Óþekkt / 1
> Einstefna með stefnu línu — Stefna línu sýnir hvernig hún er teiknuð.
> / 2 Tvístefna

Both layers share the field name `AKSTURSSTEFNA` and many other field
names verbatim, and `vegakerfi_ist120_2024_1`'s own Abstract cites the
same ÍST120:2012 standard family — a reasonably strong circumstantial
match, but per the approved prompt this is explicitly **not** sufficient
to call Q1 CONFIRMED for the actual layer in question.

## Q2 detail — identity/orientation crosswalk

No field in either retained schema plays a cross-layer join role.
`vegakerfi_ist120_2024_1`'s own field list (28 elements, re-counted by
an XML parser in the prior round) has `IDKAFLI` but no `IDFERILL`/
`IDBUTUR`-style reference. `faerdferlar2017_1`'s own owner-provided
field table (`extracted-text.txt:44–98`) has `IDFERILL`/`IDBUTUR` but
no `IDKAFLI`. `VEGNR`+`KAFLANR` appear in both, but the approved prompt
explicitly rules this out as proof of identity or orientation on its
own, and nothing found this round overrides that instruction.

## Q3 detail — VEGHLUTI in `faerdferlar2017_1`

**Direct wording, verbatim**, from the owner-provided Vegagerðin PDF
`gagnaveita_faerd_ferlar_2017.pdf` (dated on its own page 1: 4 March
2019; already retained at
`docs/ai/tasks/ticket-483/owner-source-2026-10-28/`, read/extracted by
Ripley on 2026-10-28, SHA-256 `ba4205e209a28bb19fd8f64d59cba81abb738c8a37378f747cc2df17cb3323aa`
per that round's own `source-note.md` — **no new network action was
needed or taken to find this; it was already in the repository** and
simply had not previously been cross-referenced against this specific
VEGHLUTI question):

> Dálkurinn VEGHLUTI innheldur föst gildi: / 0: Miðlína vegar / 3:
> Miðlína aðreinar / 4: Miðlína fráreinar / 5: Hringtorg / 6: Akbraut
> með kaflastefnu / 7: Akbraut á móti kaflastefnu

(`extracted-text.txt:108–114`; field itself described on p.2,
`extracted-text.txt:62`, as "Lýsing á gerð miðlínu" — "description of
centerline TYPE".)

**What this literally confirms:** VEGHLUTI categorizes what KIND of
centerline/carriageway geometry a piece represents (main centerline,
on-ramp, off-ramp, roundabout, or one of two carriageways of what is
presumably a divided/dual-carriageway section — 6 = "with" and 7 =
"against" `kaflastefna` (section direction). This source does not
define how section direction relates to the geometry vertex order).

**What this does NOT confirm (inference boundary — must be stated
explicitly per P2):** the document never uses "einstefna"/"tvístefna"
(one-way/two-way) wording for VEGHLUTI, unlike the sister layer's own
`AKSTURSSTEFNA` table above. The relationship between "kaflastefna" and the vertex ordering of
`faerdferlar2017_1` is NOT documented here. The sister-layer explanation
of line direction cannot supply that missing definition. It is also not
independently shown here that only one travel direction is permitted
on a type-6 or type-7 piece. Real-world divided highways do
physically carry opposite flows on their two carriageways, which makes
a travel-direction reading PLAUSIBLE, but that reading is this report's
own inference, not the document's own wording — exactly the same
caution this project already applies elsewhere (`H1`/
`direction_grade: INFERRED`, and the earlier "6/7 names and drawn
direction are an indication in the data, not an authority" finding
from Jonesy's own prompt-review sandbox). A confirmed code table does
not by itself close any B1/B2/C1 geometry gap or license a runtime
direction rule.

## Web actions taken (budget: ≤1 landing-page open, ≤1 linked
description document, ≤2 search queries only because the retained
path did not resolve document 2 — all used, none exceeded)

| # | Action | Target | Date | HTTP/bytes/SHA-256 |
|---|---|---|---|---|
| 1 | Open (skjal 1, pre-authorized) | `https://www.vegagerdin.is/upplysingar-og-utgafa/gagnaveita-vegagerdarinnar/` | 2026-11-18 | UNKNOWN — the fetch tool used returns AI-summarized page content, not raw bytes/status; per the approved prompt this may be recorded as UNKNOWN rather than re-fetched solely to measure it. |
| 2 | Search query 1/2 | `vegagerdin.is vegakerfi ist120 gagnalýsing lýsigögn PDF` | 2026-11-18 | n/a (search, not a document fetch) |
| 3 | Open (candidate skjal 2, from search result) | `https://gatt.lmi.is/geonetwork/srv/api/records/78ce2e5b-8400-4ca8-97aa-1a6e8483ecd4` | 2026-11-18 | UNKNOWN (same tool limitation as #1). **Result: wrong dataset** — this record describes Náttúrufræðistofnun bedrock geology (`j100v_vesturgosbelti_berggrunnur_1utg_fl`), not Vegagerðin road data. Not used as evidence for any question above. |
| 4 | Search query 2/2 | `"vegakerfi_ist120_2024_1" Vegagerðin` | 2026-11-18 | n/a (search). No matching page found for the exact layer identifier; no further document opened (budget of 2 documents already reached at #1/#3). |

No WFS/WMS/ArcGIS REST/`GetCapabilities`/`DescribeFeatureType`/data-package
link was opened, fetched, or probed at any point (P4). No message or
request was sent to Vegagerðin or any other institution. No redirect
was automatically followed beyond the fetch tool's own HTTP→HTTPS
upgrade (not a content redirect).

## Recommendation (single) — corrected by Ripley, 2026-11-18

Obtain a source-specific explanation of how `kaflastefna` relates to
vertex order in `faerdferlar2017_1`, and whether/how VEGHLUTI codes
describe permitted traversal. This is the most direct missing evidence
for the geometry already retained. No new search or acquisition is
authorized or started by this recommendation.

VEGHLUTI is already an attribute of those SAME IDFERILL/IDBUTUR features
and is carried on the geometry slices. Q2's missing cross-layer mapping
does NOT prevent reading VEGHLUTI on our own pieces. A data dictionary
for `vegakerfi_ist120_2024_1` would help Q1, but would not by itself
answer the VEGHLUTI/vertex-order question. Q1 remains PARTIAL; Q2 UNKNOWN.

Q3 CONFIRMED covers the literal definitions quoted for codes 3–7, not
driving authority or an exhaustive/current code list. The 2019 PDF lists
0/3/4/5/6/7, whereas the retained 255-line dataset has code 1 on 190
lines, code 8 on one line and no code 0. Codes 1 and 8 remain undocumented
by that list. Independently recounted by Ripley from the runtime pilot.

Decision test: only evidence establishing an allowed traversal relative
to actual vertex order can justify a future forward/reverse/both rule;
an unknown value permits none in directed mode. Jonesy's broader
sandbox assessment (not independently rerun here) finds relevant road
types on 18/20 ordered pilot pairs, including reverse roundabout slices
on 14/20. The previous 8/20 figure referred only to types 6/7 and must
not be presented as the full scope of direction uncertainty. Those
counts and geometric observations are not traffic-direction authority.
No real-piece policy test, GetFeature call or runtime rule is proposed
for execution in this round. UNKNOWN/PARTIAL are valid final results.

## Ripley evidence and process limits

Retained PDF hash and extracted wording were independently checked.
Web actions remain CC-reported: no raw request log was supplied and no
web request was repeated at final assessment. CC interpreted failure
to find a document link on the landing page as the fallback trigger
and opened a search-result candidate outside vegagerdin.is. This is a
minor deviation/ambiguity against the stricter retained-link wording;
it was a plain metadata page, was unrelated and supports no conclusion.
The reported two-document/two-search cap was not exceeded. No further
request is authorized as a result of accepting this completed round.
