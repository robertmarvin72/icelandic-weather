# #493 phase2 — Pre-sample plan

2026-11-09, CC. Written and SHA-256'd (self-recorded at the bottom)
**before any network request of any kind is sent** — including the
localhost enforcement self-tests (P3), which are a separate, local-only
ledger and do not count against this plan's own exchange budget.

## 0. Allowlist (hostname, exact match, case-insensitive on scheme/host only)

- `px.hagstofa.is` — newly authorised for THIS task only, per
  `owner-authorisation.md` (P1). Read-only (GET metadata, POST data
  query).
- `gagnaveita.vegagerdin.is` — already authorised by prior rounds
  (#429/#483/#491/north-data/phase1), reused unchanged here for the
  VEGNR=93 WFS request.

No other host. No redirect is ever followed automatically to any host,
including these two — a redirect response is itself a completed,
ledgered exchange that counts against budget (P2/P6), and the plan is
re-frozen with a dated addendum before any follow-up request to a
corrected path (max one such correction per host, per P2).

## 1. Budget ceiling (item 6)

| Limit | Value |
|---|---|
| Max HTTP exchanges | 12 |
| Max total bytes received | 32 MiB (33,554,432 B) |
| Max bytes per response body | 8 MiB (8,388,608 B), streamed, capped at `min(8 MiB, remaining total)` |
| Max time per request | 20 s |
| Max total acquisition window | 30 minutes |

Metadata, POST, schema reads, redirects, and probes all count. No
automatic redirects or retries. TLS verified (no disabled verification).
Hostname checked against the allowlist above for every call, before it
is sent.

## 2. Planned requests (≤6 planned, ≥6 reserve — table frozen now)

| # | Purpose | Host | Method | Path/query (exact, frozen) | Est. max bytes | Reserve use? |
|---|---|---|---|---|---|---|
| 1 | Hagstofa MAN030106 metadata (dimensions, codes, scale/measure type, available years) | px.hagstofa.is | GET | `/pxis/api/v1/is/Ibuar/mannfjoldi/2_byggdir/Byggdakjarnar/MAN030106.px` — Ripley's own candidate endpoint, **unverified for this exact table**, per `approved-prompt-v1.md`'s own "Forskrift" section | ≤200 KB (typical PxWeb metadata JSON) | No — planned |
| 2 | Hagstofa MAN030106 data query: last 2-3 years (exact years fixed from #1's own metadata, per the year-selection rule below — **payload itself gets a dated addendum to this plan before this request is sent**, not decided after seeing data), ALL byggðakjarnir, total population only (not split by sex/age) | px.hagstofa.is | POST | same path as #1, JSON `query`/`response` body per PxWeb's own API convention — exact payload added in the dated addendum below, before this request | ≤2 MiB (nationwide settlement-level table, few years, one measure) | No — planned |
| 3 | VEGNR=93 geometry, native CRS, winter-service/road-condition layer | gagnaveita.vegagerdin.is | GET | `https://gagnaveita.vegagerdin.is/geoserver/gis/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=gis:faerdferlar2017_1&CQL_FILTER=VEGNR='93'&srsName=EPSG:3057&outputFormat=application/json&maxFeatures=1000` | ≤1 MiB (VEGNR=1 nationwide, 996 features, was 1,242,779 B; a single VEGNR is expected far smaller) | No — planned |
| 4 (reserve) | One retry of #1 at a corrected path, IF #1 returns 404/redirect/wrong-table (max one such correction per host, P2) | px.hagstofa.is | GET | path TBD from #1's own error/redirect response, added as a dated plan addendum before sending | ≤200 KB | Yes |
| 5 (reserve) | WGS84 re-fetch of the exact VEGNR=93 IDBUTUR set from #3, ONLY if haversine length measurement actually requires it (P6: "aðeins ef lengdarmælingin krefst þess") | gagnaveita.vegagerdin.is | GET | `…&CQL_FILTER=IDBUTUR IN (…)&srsName=EPSG:4326&outputFormat=application/json&maxFeatures=<matched from #3>` — IDBUTUR list filled in from #3's own result, frozen as a dated addendum before sending | ≤500 KB | Yes |
| 6 (reserve) | One retry of #3 at a corrected typeName/filter, IF #3 returns 0 features or an error (BLOCKED is also an acceptable outcome per P6 — this reserve slot exists only if a genuine correction, not a different question, is identified) | gagnaveita.vegagerdin.is | GET | TBD, dated addendum before sending | ≤1 MiB | Yes |
| 7-12 (reserve) | Unallocated | — | — | — | Yes |

Planned total (#1-3): ≤3.2 MiB. Full reserve use (#1-6): ≤5.9 MiB. Both
far under the 32 MiB ceiling and the 12-exchange ceiling, leaving real
headroom, per item 6's own "leave a reserve" instruction.

## 3. Year-selection rule (P4), fixed before metadata is read

"Fullgilt ár" (a valid year) = the newest year for which (a) a total/
summary row, if the table has one, is not empty/provisional per its own
metadata, AND (b) at least 95% of individual settlement rows have a
real numeric value (not a metadata-flagged provisional/placeholder
marker). The highest-numbered year available is NOT automatically
chosen if it fails this test — the rule is applied mechanically against
whatever the metadata/data actually show, not chosen after looking at
which year "looks right." If the schema/metadata doesn't support
evaluating this rule at all, that is a named BLOCKED sub-item for year
selection specifically (not for the whole task), with the raw data still
retained and a provisional-year note recorded.

## 4. Settlement-matching rule (P4), fixed before data is read

Work-list settlements (`national-place-coverage.md`) are matched to the
Hagstofa table's own CODE (not just name string). A work-list place with
no matching code in the table's own dimension is marked `UNMATCHED` —
never filled from memory, never assumed to be "probably the same as
some other row."

## 5. WFS contact-band and traversal rules (P6), reused unchanged from phase 1

Canonical-instance selection: `rules.md` E2(d) (most vertices, tie →
lowest OBJECTID) — reused as-is; any case where this round's own data
shape doesn't cleanly support it is logged as a stated deviation, not a
silent re-derivation of the rule itself. VEGHLUTI role/direction model,
the 100 m gap-threshold bands (exact/≤5/≤25/≤100 — a measurement
classification, never proof of driving permission), the lexicographic
tie-break signature, and `validate_route()` are all reused unchanged
from `rules.md`/`rules-addendum-v2/v3/v4.md`, not re-derived. New this
round (because a T-junction mid-piece connection, not just endpoint-to-
endpoint, may be what links VEGNR=93 to the ring): a THIRD contact
category, "endpoint-to-interior-vertex" (a road-93 endpoint sitting on a
VEGNR=1 piece's own interior vertex, not at that piece's own recorded
start/end) — requires an INFERRED derived node (logged, with which
VEGNR=1 piece and which of its own vertices) or a named BLOCKED gap; this
is decided here, before the WFS response is read, not invented afterward
to make a connection "work."

## 6. Local enforcement self-test (P3) — separate, local-only, no exchange-budget impact

Before request #1 above is sent, the bounded-fetch wrapper itself is
tested against `127.0.0.1` (never an external host) for: a chunked
response exceeding the 8 MiB cap (must truncate at `min(8 MiB,
remaining)`, not read unbounded), a request that exceeds the 20 s
timeout, a redirect response (must be rejected, never auto-followed),
an HTTP error status (4xx/5xx, must be ledgered as such, not silently
retried), and a ledger write for each. These are recorded in their own
`local-test-ledger.json`, separate from `exchange-ledger.jsonl`. A
failure of any of these is a STOP before request #1 is ever sent.

## 7. STOP conditions (P9), fixed before any request

BLOCKED_WITH_EXACT_GAPS, not a retry or a new approach, on: any PxWeb
4xx/429/"too many cells" response; a redirect to a different HOST (not
just a different path on the same host); a response that would exceed
the per-body or total-budget cap (the truncated/incomplete data is
recorded as evidence of the fact, not used as if complete); metadata
showing the candidate table doesn't actually fit this task's own need
(e.g. municipality-level only, no settlement breakdown); 0 features on
the VEGNR=93 WFS query; an unresolvable T-junction/interior-vertex
connection with no derivable node. Each such BLOCKED is scoped to the
specific sub-item it affects — an unrelated, independently-obtainable
result (e.g. the WFS geometry, if the Hagstofa leg is blocked, or vice
versa) is still delivered if budget allows.

---

## Addendum 1 (dated 2026-11-09, after exchange #1's own metadata response, before exchange #2)

Exchange #1 (GET, the candidate metadata URL) **succeeded**: HTTP 200,
5,055 bytes, not truncated. Table title: "Meðalmannfjöldi eftir
þéttbýlisstöðum, kyni og aldri 1998-2025" (average population by
settlement, sex, and age, 1998-2025) — confirms the measure is
**average population** (not a specific-date census), per item 1's own
requirement to record this. Four dimensions, no separate contents/
measure dimension: `Þéttbýlisstaðir` (120 codes, code `"0"` = `"Alls"`,
the ALL-SETTLEMENTS total — excluded from the per-settlement list,
kept only as a cross-check sum); `Aldur` (age, code `"-1"` = `"Alls"`,
all ages); `Kyn` (sex, code `"0"` = `"Alls"`, both/all); `Ár` (year,
1998-2025 inclusive, 28 values, the latest being 2025 — a complete past
year as of 2026-11-09, no `elimination`/provisional flag present in the
metadata itself for any year).

**Exchange #2 payload, frozen now, before it is sent:**

```json
{
  "query": [
    {"code": "Þéttbýlisstaðir", "selection": {"filter": "all", "values": ["*"]}},
    {"code": "Aldur", "selection": {"filter": "item", "values": ["-1"]}},
    {"code": "Kyn", "selection": {"filter": "item", "values": ["0"]}},
    {"code": "Ár", "selection": {"filter": "item", "values": ["2023", "2024", "2025"]}}
  ],
  "response": {"format": "json-stat2"}
}
```

Rationale: `Aldur=-1`/`Kyn=0` selects the ALREADY-TOTALED (all ages, all
sexes) rows — this is "heildarmannfjöldi" (total population), not a
sex/age multiple, per item 2's own instruction. `Þéttbýlisstaðir=all`
returns every settlement row, including the `"0"`/`Alls` nationwide
total (used only as a validation cross-check, never counted as a
"settlement" in the inventory). `Ár` = the last 3 available years
(2023-2025), per the pre-registered year-selection rule (§3) — the ACTUAL
valid year is still determined from the DATA response itself (≥95% of
settlement rows numeric and non-placeholder), not assumed to be 2025
just because it's the newest.

No change to the planned max-byte estimate for exchange #2 (≤2 MiB) or
to the overall budget table in §2 above.

---

**Self-hash of this plan** (computed and recorded after writing, before
any network request — the file is not re-edited after this hash is
taken except via a dated addendum, which gets its own addendum-specific
hash recorded separately, never silently folded into this one):
see `samples/pre-sample-plan.sha256` (written immediately after this
file, by the same no-network step).
