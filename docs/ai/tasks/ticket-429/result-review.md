# #429 — Result review (Jonesy)

2026-10-27. Reviewer: Jonesy. Reviewed: `cc-report.md`, `research-report.md`, `coverage.csv`, `source-register.md`, `samples/manifest.md`, `next-task-proposal.md`, `pre-sample-plan.md`, against `approved-prompt-v1.md` and the retained samples.

## Verdict: REVISE (MEDIUM; mostly re-analysis of samples already retained plus documentation; no production concern)

The research is real and valuable: the samples are genuine, hashes match, the key joins and the Hellisheiði name collision are correct. But the first-page grades rest on several statements that the retained data contradicts, closure semantics are reported wrongly, no analysis scripts were delivered, and "budget" is used to explain gaps the ledger shows were not budget-limited. Almost every fix below uses files CC already has; no new network request is required unless Ripley chooses to spend part of the unused reserve (R5).

## Independently verified (sandbox, on staged copies of the retained files)

- **Sample integrity:** SHA256 of the 10 retained JSON/XML/HTML samples I recomputed equals `samples/_hashes.txt`/manifest; `pre-sample-plan.md` SHA256 equals `48f1934d…`. The first new request (19:06:35Z) is after the plan's last write (file time 19:06:21Z).
- **Road-state feed:** 708 segments, 708 unique `IdButur`, one `DagsKeyrtUt` (19:05:51Z) for all. All 23 corridor segments I looked up exist with the names and states in `coverage.csv` (all GREIDFAERT).
- **Name collision:** `910330037` is "Hlíðarvegur: Hellisheiði eystri"; its geometry bbox is ISN93 E 703,826–710,914 / N 584,716–589,347, i.e. East Iceland. Correctly excluded. CRS is `urn:ogc:def:crs:EPSG::3057`; 108 features for 9 IDs.
- **DATEX temperatures:** air/road-surface pairs for MP_1, MP_4, MP_38, MP_36, MP_142 equal the §5 table (and the differences are arithmetically right). Site names/IDs: MP_1 Hellisheiði, MP_4 Öxnadalsheiði, MP_38 Blönduós, MP_36 Kjalarnes, MP_142 Hella, MP_1181 Borgarnes, MP_2190 Selfoss, MP_2191 Akureyri – Krossanesbraut.
- **Borgarnes:** the #450 station catalog (778 rows) has Borgarnes (142) with `ending: 1988`, and no Bifröst/Varmahlíð station by name. Correct as an exact-name finding (see R3 for why exact-name is not enough).
- **routeRisk scope map (J9):** `routeRisk.js` SHA256 is `0b7c9c1a…`, which equals the value in cc-report, and the description matches the source I read last round. (The cc-report labels these as git blob SHA-1; see R8.)
- No `apikey`/`bearer`/`authorization` strings in the samples or the CC deliverables; the only hits are in prompt text.

## Required fixes

**R1 — MEDIUM-HIGH. No analysis scripts or outputs were delivered.** The approved prompt requires "bounded reproducible analysis scripts/output" and validation "with retained scripts". The task directory has none; the manifest cites `node -e` ad hoc commands. Every derived number (708/108/counts, freshness, collision bbox, coverage.csv cells) is therefore not reproducible from the package. Add read-only task-local scripts over the retained samples, with saved output, for: corridor filter of the road-state feed, WFS join counts and per-ID extents, DATEX site matching and measured values, freshness calculations, and a consistency check of `coverage.csv` against the report's counts.

**R2 — MEDIUM. Closure semantics are misreported (research-report §4/§6/§9, source-register V1, cc-report).** The report says `LOKAD` "did not occur" and that closure behaviour is untested "because no closure was in the sample", and that `OTHEKKT` occurred 3 times. The retained road-state sample shows:

- `LOKAD`: 1 segment (`903270037` Nesjavallaleið, `AstandVidbotaruppl: ALLUR_AKSTUR_BANN`, `Snjomokstursregla: EKKI_MOKAD`, `DagsSkrad` 02:55:00Z).
- `OTHEKKT`: 49 in `AstandYfirbord` (and 49 in `AstandVidbotaruppl`), not 3. Others: OFAERT_ANNAD 63, EKKI_I_THJONUSTU 89, HALKUBLETTIR 21, HALKA 20, SNJOTHEKJA 8, FAERT_FJALLABILUM 6, OFAERT_VEDUR 6, THUNGFAERT 2.
- The DATEX RoadCondition sample (271 situations) contains 80 `roadClosed`, 89 `closedPermanentlyForTheWinter`, "Not known" records and a "Storm conditions" record. The report read it only for ID structure.

None of the 23 corridor segments I checked has a closure or a DATEX situation record at that snapshot, so the corridor-level statement "no closure observed on the three corridors at 19:05Z" stands. What must change is the statement that closure semantics were not observable. Direction and validity-time semantics remain genuinely untested.

**R3 — MEDIUM. Observation coverage is understated because of exact-name matching.** The retained DATEX site table (205 sites, with names, WGS84 coordinates and `measurementSiteIdentification`) contains, with live values already in the retained MeasureData sample:

- Sandskeið `IRCA_MP_17` (id 31488): air 3.576, road 1.38, max wind 3.822.
- Holtavörðuheiði `IRCA_MP_3` (32097): 1.747 / 0.488, max wind 14.01.
- Vatnsskarð `IRCA_MP_24` (33431): 2.117 / 0.263, max wind 10.68.
- Mýrdalssandur `IRCA_MP_6`, and Steinar `IRCA_MP_29` / Hvammur `IRCA_MP_53` undir Eyjafjöllum, which lie between Hvolsvöllur and Skógar on Route 1.

`coverage.csv` marks Sandskeið, Holtavörðuheiði and Vatnsskarð DATEX values "UNKNOWN (not matched by name search)", and the report says Hvolsvöllur/Skógar have no station "in any network found". `source-register.md` V3 itself says 11 sites matched, while the CSV carries 8. Also, `vedur_station_distance_m = 0` is true only by construction, because checkpoint coordinates were taken from the station records; it is not a distance to the road. Fix the CSV from the retained data, compute real distances to route geometry where geometry exists (Route A), and keep representativeness a separate judgement. Note that DATEX `measurementSiteIdentification` equals Veðurstofa/Vegagerðin station numbers (31392, 33357, 31579, 6300, 3471), which is a usable join CC did not use.

**R4 — MEDIUM. First-page claims contradict the CSV, and route grades are not rubric grades.**

- "All 9 Route A checkpoints have confirmed live road state": the CSV has 7 of 9 (Reykjavík not queried, Sandskeið "not matched").
- "5 of 9 have an active station with live measurement": measured values exist at 3 (Hellisheiði, Selfoss air only, Hella); one Veðurstofa observation was sampled (Hellisheiði).
- §9 "9 of 17 checkpoints": the CSV has 21 rows, 20 unique; 9 rows have DATEX values.
- "PASS/PARTIAL" is not one of PASS/PARTIAL/FAIL, and the approved prompt asks for one grade per route. By the plan's own criteria (capability 2 PARTIAL if the join is shown for some but not all segments; a route is PASS only if capabilities 1–4 and 6–7 reach at least PARTIAL for every critical checkpoint with no unacknowledged gap), B and C have no geometry join shown, and A has untested critical checkpoints. All three look PARTIAL. Ripley decides, but a single grade with its criterion cited is required.
- Forecast: coverage exists for 4 of 9 Route A checkpoints; "all 4 main points" should say so.

**R5 — MEDIUM. "Budget" explanations are contradicted by the ledger.** CC used 14 of 30 data requests and 4 of 20 documentation requests (its own ledger), and `pre-sample-plan.md` allocated up to 6 observation requests (1 used) and 2 geometry feature fetches (1 used), with observations and history ranked above forecast. Yet the CSV says Route B/C geometry was "not re-fetched … budget was spent confirming Route A", the report says Sandskeið, history and Point Incidents were not tested because of budget, and geodesic length is "UNKNOWN within budget" even though it is a local calculation (my sandbox sums of the retained fragments give plausible per-ID planar lengths, but some, such as the Hellisheiði directions at ~65 km inside a ~13×5 km extent, look odd, so geometry semantics may be the real obstacle). Either relabel these as "not attempted" with the true reason, or Ripley authorizes a v2 that names specific additional requests (suggested: Route B and C geometry in one query, 3–4 observation samples for Sandskeið/Holtavörðuheiði/Vatnsskarð/Vík, one bounded history window, DATEX closures reading from the existing sample first). I would do the re-analysis in R1–R4 first, since it may change which requests are still worth making.

**R6 — LOW-MEDIUM. Freshness statement is wrong and misses a real finding.** The report says `DagsSkrad` ranges 05:2x–13:3x UTC. In the sample, 340 of 708 segments (48%) have `DagsSkrad` of exactly 02:55:00Z or 02:55:01Z (~16 h before the fetch), including corridor segments Kjalarnes, Selfoss–Hveragerði and Hvalfjarðargöng (the CSV shows 02:55:00Z for them). Whether this is a nightly batch or reset is UNKNOWN, but a freshness policy based on `DagsSkrad` must account for it. Correct the range and add this as a finding.

**R7 — LOW-MEDIUM. The DATEX-to-legacy ID crosswalk is stated as "UNKNOWN, superficially similar" without using available evidence.** All 271 `IRCA_ROADCONDITIONS_<n>` IDs and all 271 `IRCA_PredefinedLocation_segments_<n>` suffixes in the retained DATEX sample are members of the 708 legacy `IdButur` values (a local set intersection, which I ran). Report it as strong sample-level overlap, keep semantic equivalence INFERRED because the PredefinedLocation service was not reached, and keep the "no coincident-ID assumption" caution in the proposal.

**R8 — LOW. Provenance labelling.** cc-report's "Blob SHA-1 (git hash-object)" values are 64 hex characters, i.e. SHA-256 of the file bytes (my SHA256 of the staged `routeRisk.js` equals the reported one; a git blob hash would be 40 hex). Relabel. The plan says "frozen 19:05:26Z" but the device file time is 19:06:21Z; the SHA matches and the ordering before the first request holds, so note the discrepancy rather than assert the earlier time as measured.

**R9 — MEDIUM. `next-task-proposal.md` is not implementable as written and omits blockers.**

- It says exactly 11 coordinate-verified checkpoints; the CSV has 13 rows, 12 unique. The AC says "all 9 Route A checkpoints with VERIFIED SAMPLE coordinates", but the CSV has 5 on Route A; Route B has 6 (AC says 5); Route C 2.
- Checkpoint coordinates come from the station records, so the proposed hardcoded config would define "the checkpoint" as "where a station is".
- It lists "no dependencies", but Vegagerðin reuse terms (both systems) are UNKNOWN and Open-Meteo production rights remain unconfirmed (#453). The rubric says PARTIAL must name the exact remaining blockers. Make confirmation of Vegagerðin terms (owner or Ripley action; the DATEX spec names a contact address) a prerequisite or an explicit accepted risk.
- It fetches `http://gagnaveita.vegagerdin.is/...` server-side over plain HTTP; note that and test whether HTTPS works.
- The corridor spans between checkpoints (for example Reykjavík–Sandskeið–Hellisheiði, Selfoss–Hella gaps, Skógar–Vík) are not listed as unmatched spans, which the approved prompt asked for.

## Notes (non-blocking)

- J6(b) size probe was nominal: the HEAD probe returned 405 with no size, then the full 360 KB feed was fetched with a max-filesize guard; the WFS query was bounded by 9 IDs but had no feature limit. Totals were small, so no harm.
- "Hvalfjarðargöng has no station by nature" is an inference, not a sourced finding.
- J8: no synthetic fixtures were created. Given R2 (a real LOKAD record exists), a parsing test on that real record is now possible and would be better than a synthetic one.
- None of the 23 corridor segments (all GREIDFAERT in the legacy feed) has a DATEX RoadCondition record, so absence of a DATEX record must not be read as "open" or as "checked". Worth one sentence.
- The old-comment discrepancy (HARMONIE 2 km/72 h vs #450's 2.5 km/66 h) is correctly kept as historical and unresolved (#456).
- Report language is Icelandic with English technical terms; fine.

## Checked and fine

Pre-sample freeze ordering; J1 hash list (identical to the values I verified last round for research-report and source-register; provider-matrix and cc-report not recomputed by me); SafeTravel not contacted; Open-Meteo public host only, bundled counts logged (4+5+2); no secrets in the package; both ledgers under their caps; 14 failed/successful exchanges listed with hashes; the DATEX PredefinedLocation timeout recorded honestly as a blocker, not as ACCESS-BLOCKED; the explicit statement that routeRisk does not transfer to road safety; overall PARTIAL for the reduced-scope information view and no approval of the original advisor is a defensible position pending R4.

## Limits of this review

Staged snapshots only; I ran nothing on your machine (no git, tests, browser or network). My checks are synthetic Python over copies of the retained samples, run in my sandbox; they test the files, not the live services, and I did not re-fetch anything. CC-attributed and not verified by me: HEAD, `git status`, `git diff --check`, the timestamps and HTTP codes in the manifest, the DATEX PredefinedLocation timeouts, provider-matrix and cc-report hashes for #450, and the Vegagerðin documentation text beyond what the retained HTML shows. I did not read every row of the DATEX or WFS data or the full PDF text. Station representativeness, licence meaning and IS wording are not assessed. Product intent is UNKNOWN. This review authorizes nothing: no commit, push, deploy, issue change or new request. A later PASS would mean the bounded research is delivered accurately, not that any part of the Winter Route Advisor is approved for implementation; #429 closure is never automatic.

## Next

Ripley: send R1–R4 and R6–R9 to CC as a documentation and re-analysis correction using only the retained samples (approved-prompt-v2), and decide R5 (relabel as not attempted, or authorize named additional requests with a stated budget). Then a short Jonesy re-check and Ripley's final assessment.

## Ripley final assessment — 2026-10-27: REVISE

Accepted Jonesy R1–R9. Independently parsed retained legacy JSON and CSV with Python built-ins:708 rows,49 OTHEKKT,1 LOKAD(id903270037),340 records at02:55:00/01Z; DagsSkrad range02:55:00Z–18:19:41Z. CSV21 rows(A9/B9/C3). These are retained-snapshot checks, not fresh live service verification. Other DATEX/hash findings remain Jonesy-attributed until CC retains reproducible analysis. No application tests needed for this research-only assessment.

R5 decision: NO additional network requests; repair evidence/scripts/claims using existing samples first. Unperformed observation/history/geometry/licence/HTTPS work must be recorded truthfully, not excused as exhausted budget. Created approved-prompt-v2.md with all corrections, singular rubric grades and revised next-task prerequisites. CURRENT READY_FOR_CC; owner sends Prompt approved to CC then Jonesy re-check. No production/GitHub change or MVP approval.

---

## Jonesy re-check of correction v2 (2026-10-27)

**Verdict: REVISE (very narrow, LOW-MEDIUM).** Substance of v2 is largely resolved and accurate; two required fixes remain, both documentation/CSV relabelling, no new requests needed.

### Verification basis
- Read `approved-prompt-v2.md`, CURRENT handoffs, `cc-report.md` (v2 appendix + v1 body), `research-report.md` (page 1, tables, 9b, 10), `source-register.md`, `next-task-proposal.md`, `coverage.csv`, `harness/README.md`, `_shared.py` and all `-output.txt` files.
- Sandbox only (not the owner's machine): I re-ran `harness/01`-`05` with `python3 -I` against the staged samples. Output is byte-identical to CC's saved outputs. I did not re-run 06.
- Independent checks matching CC's v2 claims: LOKAD x1 (903270037), OTHEKKT x49, DagsSkrad 02:55:00Z-18:19:41Z with 340/708 at 02:55:00-01Z, DATEX RoadCondition 271 situations/273 records, none of the corridor IdButur values has a DATEX record.

### Resolved
- R1 scripts delivered with saved output and README (reproducible).
- R2 closure semantics corrected (LOKAD/OTHEKKT counts, DATEX closure counts, absence-is-not-open stated).
- R3 station distance relabelled (not a measured distance to road; UNKNOWN with stated blocker).
- R5 honoured: report states zero new external requests; no new files in `samples/`.
- R6 DagsSkrad range corrected, cohort cause UNKNOWN.
- R7 DATEX site matching by ID shown, representativeness not claimed.
- R8 file-byte SHA256 vs git blob SHA-1 relabelled.
- R9 next-task proposal has licence prerequisites.
- R4 partly: single PARTIAL/FAIL grades per route, `PASS/PARTIAL` removed, 9b rubric table added, row counts corrected (21 rows / 20 unique).

### Required fixes (REVISE)
1. **coverage.csv / script 05 contradict report 9b (MEDIUM-LOW).** Research-report 9b and page 1 state that no WFS geometry was fetched for Routes B and C (cap.1 FAIL). But `coverage.csv` `geometry_join_result` is "VERIFIED SAMPLE" for all 9 Route B rows and all 3 Route C rows (three of them annotated "road-state only"), with `geometry_crs` = EPSG:3057. `harness/05` counts them, so its table shows geometry_join VERIFIED SAMPLE A=6, B=9, C=3 (18 total) while the report says B/C = none. A reader of the CSV or the script output gets the opposite of the grade. Fix: relabel B/C `geometry_join_result` to e.g. `NOT TESTED - road-state only; WFS geometry not fetched for this route` and `geometry_crs` to `n/a`; make script 05 count geometry only where the cell starts with VERIFIED SAMPLE and the retained WFS sample actually contains that IDBUTUR (A=6, B=0, C=0); re-run and save the output; update the coverage.csv sha256 wherever it is cited (research-report, cc-report, harness README).
2. **Stale v1-body statements remain unmarked in `cc-report.md` (LOW-MEDIUM).** The v2 appendix corrects them, but the v1 sections still read as current: J4 says corridor length is UNKNOWN because stitching was "not completed within this round's budget" (v2 reason is no verified transform/unreliable fragment sums, not budget); J8 says "no LOKAD state actually observed" (one LOKAD was observed). Add a short "superseded by v2 appendix" marker or rewrite those two sentences. Same budget wording: `source-register.md` row "Point-specific road-state endpoint" ("this round's budget prioritized...") and the research-report section 10 heading "(fjarhagsaaetlun)" - align with the R5 statement that budget was not the reason.

### Notes (LOW, optional)
- `harness/` contains `__pycache__/` and `_tmp_legacy_check.txt`; remove or exclude them before the owner commits.
- Fix 1 changes no grade: A/B/C stay PARTIAL/PARTIAL/PARTIAL overall PARTIAL; it only makes the CSV match the already-stated grades.

### Checked and fine
- Overall PARTIAL and reduced-scope framing; original Winter Route Advisor remains unapproved.
- routeRisk scope map (campsite points, linear interpolation, no road safety transfer).
- Hash relabelling; HEAD/status/`git diff --check` are CC-attributed and not re-run by me.

### Limits of this review
Staged snapshots only. I ran only sandbox Python re-runs of CC's scripts 01-05; nothing on the owner's machine (no git, tests, lint, build, browser, network). CC-attributed and not independently verified: HEAD/status/`git diff --check`, original timeouts, manifest HTTP codes, #450 provider-matrix and cc-report hashes. I did not independently verify Vegagerdin documentation text, licence/reuse meaning, station representativeness or the Icelandic wording. A PASS here would mean bounded research delivered accurately, not approval of the Winter Route Advisor. No commit, push, deploy, issue change or new request is implied; #429 closure is not automatic.

### Next
CC applies fixes 1-2 (no new requests), re-runs script 05, reports hashes; Jonesy confirms (text/CSV-level check), then Ripley's final assessment.

## Ripley final assessment — 2026-10-27: REVISE (narrow v2 re-check)

Accepted resolved v2 findings and Jonesy's two remaining corrections. Independently parsed coverage.csv: VERIFIED SAMPLE geometry claims A6/B9/C3, despite report's B/C no-geometry caveat. Retained WFS has108 features with IDBUTUR field; this confirms the inputs for the required script fix, not route completeness. Jonesy's full harness01–05 reruns remain reviewer-attributed; I did not duplicate those yet.

Created approved-prompt-v3.md to correct B/C geometry provenance, actual-ID-backed harness05 counts/updated hashes, stale closure/budget prose. No new requests or production work. Existing PARTIAL/PARTIAL/PARTIAL and overall PARTIAL are retained as research limitations, no development approval. CURRENT READY_FOR_CC; owner -> CC Prompt approved, then Jonesy confirmation.

---

## Jonesy confirmation of correction v3 (2026-10-28)

**Verdict: PASS with 2 text-only conditions (LOW).** The v2 REVISE items (CSV/script-05 geometry contradiction; stale J4/J8/budget text) are fixed in substance. Nothing requires new requests or a script/CSV change.

### Verification basis
- Read `approved-prompt-v3.md`, CURRENT (CC v3 handoff), `cc-report.md` (J4, J8, v3 section), `coverage.csv`, `research-report.md` (page 1, s3, s9b, s10), `source-register.md`, `next-task-proposal.md`, `harness/05` script + output, harness README and `06` output.
- Sandbox only (not the owner's machine): re-ran harness `01`, `02`, `03` and `05` with `python3 -B -I` against the staged samples; outputs byte-identical to CC's saved outputs (05 included, A=6, B=0, C=0). `04` needs the #450 station file and `06` needs git; I did not re-run them (04's script is unchanged since v2, where I confirmed identical output; 06 output is CC's).
- Independently checked: coverage.csv sha256 `c2454ef197dfc2499545919063804fc3563e8e8c9ae495f0649b217fdfa25f17`, 15,828 bytes, matches the hash printed by script 05; 21 rows, 20 unique; all 12 B/C rows now `NOT TESTED -- road-state only...` with `geometry_crs=n/a`, road-state IDs and station/forecast columns preserved; the 6 counted A rows are Hellisheidi, Selfoss, Hella, Hvolsvollur, Skogar, Vik (each has a used IDBUTUR in the 9-ID WFS sample); A-Hveragerdi stays PARTIAL and uncounted; decoy 910330037 excluded. Script 05 logic (VERIFIED SAMPLE prefix AND used-ID membership in the WFS ID set, decoy mentions excluded, live mismatch warning) is sound. Other counts (coord 5/6/2, road-state 6/9/3, measured 4/6/2, forecast 4/6/2) unchanged from v2.
- J4 and J8 in cc-report carry visible superseding corrections (stitching "NOT ATTEMPTED"; one real LOKAD, behaviour over time untested). source-register "Point-specific road-state endpoint" corrected. Research-report s9b, page-1 B/C grades and s5 table agree with the CSV. Grades unchanged: A/B/C PARTIAL, overall PARTIAL. The v3 section says zero new requests; samples directory mtimes are unchanged since the v1 fetch (my listing).

### Conditions (text-only, LOW)
1. **Stale budget sentence remains in `research-report.md` s3 (line ~63, "Geodesic vegalengd"):** "...sem var ekki gert innan fjarhagsaaetlunar thessarar lotu". cc-report v3 row 2a/2c implies all such wording was fixed, so this sentence is both misleading and contradicts the report's own statement. Replace with "NOT ATTEMPTED in either round (not budget-limited)". Optional same-style tidy: s5 row "DATEX section-geometry | Timathurrd" - the retained fact is two 10 s timeouts, not time scarcity.
2. **The new coverage.csv sha256 is not cited in the v3 section of `cc-report.md`** (v3 asked for per-route geometry counts and hash). Add one line: coverage.csv sha256 `c2454ef1...a25f17`, 15,828 bytes, geometry A=6/B=0/C=0, superseding the v2 `36c7115f...` value. The hash is already in `harness/05` output, so this is a citation gap, not missing evidence.

### Checked and fine
- Frozen `pre-sample-plan.md` and `samples/` untouched; no new files in `samples/`.
- Housekeeping: `harness/` listing shows no `__pycache__` or `_tmp_legacy_check.txt` (my listing of the owner's folder via the file bridge).
- routeRisk scope map and hash relabelling unchanged and still correct (06 output is CC's).
- HEAD `349ff688...`, status and `git diff --check` clean are CC-attributed.

### Limits of this review
Staged snapshots only; I ran no git, tests, lint, build or browser and made no network request on the owner's machine. Sandbox re-runs of harness 01, 02, 03, 05 only. CC-attributed and not independently verified: HEAD/status/`git diff --check`, original timeouts, manifest HTTP codes, #450 hashes, harness 06 output. I did not verify Vegagerdin documentation text, licence/reuse meaning, station representativeness or Icelandic wording. PASS means the bounded research was delivered accurately with its PARTIAL limits stated; it is not approval of the Winter Route Advisor or of any reduced-scope product. No commit, push, deploy, issue change or new request is implied; #429 closure is not automatic.

### Next
CC (or Ripley, at Ripley's choice) applies conditions 1-2 as a two-line text edit; then Ripley's final assessment.

## Ripley final assessment — 2026-10-28: PASS (bounded research delivered)

Accepted Jonesy's v3 PASS and directly applied its two low-risk text conditions: section3 length now says NOT ATTEMPTED, not budget-limited; cc-report v3 now cites the actual CSV SHA256/bytes and geometryA6/B0/C0. Also clarified the optional ambiguous DATEX timeout wording. No executable code, CSV, frozen plan or sample altered.

Independently inspected current harness05 and shared read-only helpers, ran `python -B 05_coverage_consistency_check.py` from the task harness directory (exit0), and independently SHA256-hashed coverage.csv. Confirmed c2454ef197dfc2499545919063804fc3563e8e8c9ae495f0649b217fdfa25f17,15828 bytes; route rows9/9/3, geometry6/0/0, measured4/6/2 and forecast4/6/2,22 used legacy IDs with no corresponding DATEX situation record at the retained snapshot. Absence is not open/checked. No external request. Earlier independent legacy49 unknown/1 closed/340 early records checks stand. Other scripts' reruns and network provenance remain CC/Jonesy-attributed; no live availability or road-safety validation claimed.

All three route outcomes PARTIAL, overall PARTIAL for a potential narrower information product only. Full winter advisor and reduced-scope development remain unapproved. Outstanding geometry/route alignment, history/freshness/closure-validity, representativeness, licence/access/transport and forecast contract prerequisites must be resolved or explicitly bounded in a separately approved task. SafeTravel remains optional/unconfirmed. Read next-task proposal as unpublished proposal with prerequisites, not implementation authorization.

CURRENT CLOSED marks completed research review only. No production/source/API/DB/config/test/instruction changes (status only CURRENT and task429), no commit/push/deploy/GitHub mutation or issue closure. Owner reviews report and chooses any next scope.
