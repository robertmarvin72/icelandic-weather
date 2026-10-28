# #429 correction round v2 — reproducible analysis scripts (R1)

All scripts are pure-stdlib Python 3, read-only, and take only the samples already retained in `../samples/` (plus, for `04` and `06`, the already-retained `#450` station catalog and this checkout's own tracked source files) as input. None performs a network request; `06` runs `git hash-object` (no `-w`, so it only reads/hashes, never writes a git object).

Run from this directory: `python3 <script>.py > <script>-output.txt`. `_shared.py` is a helper module, not a standalone script.

| Script | Covers |
|---|---|
| `01_road_state_counts.py` | Legacy `faerd2017_1` feed: `AstandYfirbord`/`AstandVidbotaruppl` distributions, the real `LOKAD` record, `DagsSkrad`/`DagsKeyrtUt` freshness (R2, R6) |
| `02_wfs_join_analysis.py` | WFS `GetFeature` geometry: per-`IDBUTUR` fragment/vertex counts and bbox extents, the Hellisheiði East-Iceland decoy's actual presence in the Route A response (R1, R3, R4) |
| `03_datex_roadcondition_analysis.py` | DATEX `RoadConditionService` sample: situation/record type and closure-type counts, DATEX-vs-legacy `IdButur` set overlap (R2, R7) |
| `04_datex_sites_match_analysis.py` | DATEX measurement sites/measured values: coordinate- and ID-based matching (not name search) for Sandskeið/Holtavörðuheiði/Vatnsskarð and the corridor sites, `measurementSiteIdentification`-to-Vedurstofa-station-number join (R3) |
| `05_coverage_consistency_check.py` | Single source of truth for every `coverage.csv` count used on research-report.md's page 1 and in `next-task-proposal.md` (R4, R9) |
| `06_provenance_label_check.py` | Confirms the cc-report.md hash table is file-byte SHA256, not git blob SHA-1; checks `pre-sample-plan.md`'s filesystem mtime against its claimed freeze time (R8) |

Every script prints its own input filenames and their SHA256 before any finding, so a reviewer can re-run `python3 <script>.py` against the same retained samples and get byte-identical output.
