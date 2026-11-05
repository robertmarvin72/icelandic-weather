# #491 — CC report (final-validation, approved-prompt-v2.md)

## GO

Executed `approved-prompt-v2.md` in full (final-validation round). All four numbered items in the prompt (freeze start/end, directionally-correct pieces chain, lengths/CRS incl. 13-Vík control, four points) have traceable, independently-recomputed support within the approved bounds. **No item is BLOCKED.** One new network call was made (S3-authorized, see below); everything else is offline recomputation from already-retained files. No app code, backend, DB, UI, ETA rule, or operational config was touched.

Full citations, independently-recomputed figures, and per-item write-up: **`docs/ai/tasks/ticket-491/final-validation/evidence-table-final.md`**. Structured candidate data (coordinates, chain pieces, gaps, cumulative km, four points): **`docs/ai/tasks/ticket-491/final-validation/route-data-candidate.json`**.

## Item-by-item summary

| # | Item | Result |
|---|---|---|
| 1 | Freeze start (Rauðavatn) / end (Borgarnes) with a traceable rule | **GO** — Rauðavatn VERIFIED (same start as existing Vík route). Borgarnes: O3 rule ("first VEGHLUTI5 roundabout after north tunnel mouth 42573") checked exhaustively against the fresh WFS response for all 6 queried IDBUTUR — only 30401 qualifies, no contradiction. Entry point = 2819 end, 1.77m from the roundabout point (not centroid/first node). |
| 2 | Directionally-correct pieces chain (H1) | **GO (INFERRED topology)** — independently reproduced Jonesy's 16-piece H1 connector chain (Rauðavatn→Kjalarnes) from raw `wfs-vegnr1-all.json`; all 15 inter-piece gaps ≤41.45m (within the 50m rule), none ambiguous/BLOCKED. Rest of chain (3025→Borgarnes) already 0m-exact, re-confirmed directly. Opposite-carriageway/ramp pieces explicitly excluded with reasons. H1 is INFERRED (stored digital direction), not proven legal traffic direction — reported as such throughout. |
| 3 | Lengths and CRS | **GO** — 13-Vík length control reproduced (planar ISN93, tier0): my independent total 176.260km matches `#483/harness/02`'s own already-documented "ISN93 native planar length... 176.26 km" exactly; the ~0.35% gap vs. route-segments.csv's haversine-WGS84 figure (175.64km) is the already-documented ISN93 Lambert scale factor (≤1.0003), not an unexplained control failure. New route length Rauðavatn→Borgarnes = 70.780–70.782km (same method). Read `src/lib/winterRouteEta.js` directly: both candidate endpoints (2876 at 70.061km, chosen 2819/30401 at 70.78–70.782km) ceil to the same "2 hours" bucket under the unchanged `computeEta` model — no 1-vs-2-hour ambiguity for the point actually chosen. CRS: used the new official WGS84 response, paired to native by IDFERILL+tier+node-count (100% match on all checked pieces) — no offline formula/EPSG:9802 dependency needed. |
| 4 | Four WGS84 points | **GO** — P1 (Kjalarnes, 3025 start), P2 (north of tunnel, 3796 end), P4 (Borgarnes approach, 2819 end) reuse the owner's proposal areas directly. P3 is a CC-chosen (INFERRED) point within the approved 47042/3756 area — `47042 start`, chosen for materially better time/distance spread (20/9/17/14 min legs) than the withdrawn `3757 start` candidate (9/26/5 min, clumped). All four are DERIVED real line vertices (no interpolation needed), not stations/Open-Meteo snap points. forecastHour-sharing (P1–P3 all ceil to "+1h", only P4 to "+2h") is documented per the prompt's own "not a bug by itself" framing — inherent to the unchanged ceil-to-whole-hour `computeEta` model, not altered here. |
| 5 | Road-condition linking | **GO** — independently re-read both retained samples (2026-10-28, 2026-11-02) using the correct `IdButur` property key; exactly 1 match per sample for all 8 chain IDBUTUR, all GREIDFAERT at capture. Section-granularity caveat (904040037/904690037 records cover more than the actually-used sub-stretch) documented, not glossed over. |

## The one authorized network call (S3)

```
GET https://gagnaveita.vegagerdin.is/geoserver/gis/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=gis:faerdferlar2017_1&CQL_FILTER=IDBUTUR%20IN%20(903030037,904690037,904000037,904010037,804020037,904040037)&srsName=EPSG:4326&outputFormat=application/json&maxFeatures=500
```

- 2026-11-04T20:13:08Z, HTTP 200, 1 of the authorized 2 exchanges (no redirect occurred), 136,732 bytes of the authorized 4 MiB/8 MiB caps, well under the 30s/exchange and 30min session limits.
- `numberMatched=numberReturned=totalFeatures=132` — confirmed not truncated against the server's own count (also cross-checked feature-by-feature against the retained native sample; two previously-unseen tier0 pieces surfaced, both confirmed side-road branches, not through-route pieces — see evidence-table-final.md).
- Saved raw response + headers under `docs/ai/tasks/ticket-491/final-validation/samples/` with SHA256 (`5fb643b...0659f`, full hash in evidence-table-final.md). No key, no auth, public read-only GET, same endpoint/pattern already used in #483/#485.
- No other network/API/key/forecast/weather-knowledge request was made this round — the broader "8 exchanges/16MiB/weather-knowledge-source" access proposed earlier in the prompt text was explicitly superseded by this single narrower S3 call, per the approved prompt's own text ("Nýr heimildaaðgangur hér kemur Í STAÐ fyrri víðu...").

## What I did (read-only except the one call above)

- Re-read `AGENTS.md`, `CLAUDE.md` ("Umfang og aukaverkefni"), `docs/ai/README.md`, `CURRENT.md`, `approved-prompt-v2.md`, `prompt-review-final-validation.md` (Ripley+Jonesy rounds) in full before starting.
- Reused without re-deriving: `evidence-owner-scope-2026-11-04.md` (O1–O5 dispositions), `owner-scope-result-review.md`, `geometry-inventory-owner-scope.json`, `api/_lib/winterRoute/segments.js` (read, not modified).
- Independently re-extracted tier0 (NAKVAEMNIFERLIS=0) geometry for all relevant IDBUTUR/IDFERILL directly from `ticket-483/samples/wfs-vegnr1-all.json` via disposable Python scripts (own scratchpad, not committed to repo) — computing true polyline length (vertex-to-vertex summation), not straight endpoint distance, after catching and fixing that mistake in my own first draft of the calculation mid-round.
- Independently reproduced the 16-piece H1 connector chain and its 15 gap distances; independently reproduced and cross-validated the 13-Vík-segment length control against `#483/harness/02_srs_validation_and_length-output.txt`'s own already-documented figures (176.26km planar ISN93 / 175.64km haversine WGS84 — both matched exactly).
- Made the one S3-authorized WFS call (above), validated it against the native sample (node-count pairing, truncation check), used it to derive WGS84 for the four candidate points and the Borgarnes entry point.
- Independently re-read both retained road-condition samples (`legacy-faerd-fresh.json`, `legacy-faerd-https.json`) directly (correcting my own initial wrong-case property lookup) to re-verify the 1-match-per-IDBUTUR claim rather than trusting the prior review's restatement of it.
- Read `src/lib/winterRouteEta.js` directly (not assumed) to state the real `computeEta` ceil-to-hour behavior for the S2 ETA-sensitivity note.

## Deliverables

- `docs/ai/tasks/ticket-491/final-validation/evidence-table-final.md`
- `docs/ai/tasks/ticket-491/final-validation/route-data-candidate.json`
- `docs/ai/tasks/ticket-491/final-validation/samples/wfs-vesturland-4326.json` + `-headers.txt` (the one new call's raw evidence)
- This report.

## Scope discipline / limits

- Exactly one network call this round, exactly as specified in S3 (owner-approved via "Prompt approved"); no other network/API/key/Open-Meteo/weather-knowledge/map request.
- No new dependency, test framework, or reusable harness tool — only disposable one-off Python snippets run from the session scratchpad, not added to the repo.
- No app code, route selection, cache, ETA/coordinate/rule, frontend/backend/config/DB change of any kind. New files are confined to `docs/ai/tasks/ticket-491/final-validation/` plus this report and the `CURRENT.md` lifecycle edit, per the approved prompt's own allowance.
- No subagents used. No commit/push/GitHub/deploy. No production check — NOT_TESTED, not applicable to a data-only GO.
- B (route-selection implementation) is **not** started and is **not** authorized by this GO — a separately-approved B prompt is required, now that this round supplies the four previously-blocked technical items with traceable support.

## Status

- Baseline HEAD unchanged this round (no commit made by CC).
- New/modified: `docs/ai/tasks/ticket-491/final-validation/` (new directory, 4 files), this report, `docs/ai/CURRENT.md` (lifecycle).
- Next: owner → Jonesy result review (`result-review-final-validation.md`) → Ripley final assessment. Both GO and BLOCKED stop at CC_COMPLETE for review, per the approved prompt; this GO does not itself authorize B.

## Ráðandi lokayfirferð — Ripley, 2026-11-04

Frum-GO er afmarkað af Jonesy F1–F6/C1–C4 og Ripley lokamati í result-review-final-validation.md. H1 er INFERRED, hringbogar UNKNOWN, lengdaraðferð/tier/endi geta breytt ETA-klukkutíma. Planar-vs-CSV var ekki gild stýring; Jonesy haversine-stýring stenst. PASS gagnayfirferð heimilar undirbúning B-prompt með skýrum nálgunarskilyrðum, ekki appinnleiðingu eða fullyrðingu um sannaða akstursleið. Frumcandidate óbreytt rekjanlegt gögn, ekki tilbúið appconfig.
