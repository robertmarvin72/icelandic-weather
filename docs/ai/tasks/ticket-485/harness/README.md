# #485 harness scripts

Run everything with `python3 -B <script>.py` from this directory (the
`-B` flag matches the convention used throughout #483/#485 — no compiled
`.pyc`/`__pycache__` left behind in the task directory). All scripts are
pure stdlib + `requests` (already present in this environment; no install
was performed or required).

| File | Purpose |
|---|---|
| `wrapper.py` | The bounded, ledgered HTTP client. Every real exchange goes through `fetch_once()`. Hard caps (exchange count, decoded bytes, window/wait time) are enforced *before* each network call via `reserve()`/`_check_budget()`, and every attempt's outcome is durably appended via `append_outcome()`, success or failure. |
| `selftest.py` | **Run this before any real request.** 5 checks against local-loopback/synthetic fixtures only (own throwaway ledger, never `../samples/ledger.json`): redirect-not-auto-followed, over-limit body truncation, timeout persists as a recorded failed attempt, exhausted budget blocks further attempts pre-flight, and TLS failure against a real local self-signed certificate is rejected (RED) then succeeds once given that cert as an explicit trusted test CA (GREEN) — never a disabled/insecure override. Output retained in `selftest-output.txt` (exit 0). |
| `do_fetch.py` | One real, ledgered exchange per invocation: `python3 -B do_fetch.py <https-url> <data\|doc> <output-filename>`. Saves the (possibly truncated) body and a headers/metadata sidecar under `../samples/`. |
| `validate.py` | Post-hoc validation: synthetic midpoint self-check, real-data point-to-line association re-derivation (67861/67862/73801), full-ID presence/duplicate check against the fresh state feed, and a `coverage.csv` cross-check that — unlike #483's `harness/05` — raises `AssertionError`/exits nonzero on a real violation, demonstrated with an expected-RED corrupted copy followed by a GREEN pass on the real file. **Correction v2:** the red/green demo now mutates the parsed CSV row (not a literal substring tied to the old "UNKNOWN_TIED" wording), and uses a task-local `../tmp/` directory instead of the OS default temp dir (which failed under Ripley's sandbox permissions) — created and fully removed again within this task's own directory. Output retained in `validate-output.txt` (exit 0). |
| `span0_path_analysis.py` | **New, correction v2 (R1).** Retained-data-only (zero network): computes the anchor-to-candidate distance ranking with a role-set sensitivity table ({1,6,7}/{1,7}/{7}-only), states exactly why the uncertainty bound E is unsupported for this comparison (not a re-use of #483's 61.9m DATEX figure), and traces a specific candidate connectivity path (IDFERILL 9924→49926→42244→1431→54723→1436) toward the retained 13-segment chain, reporting every hop's real gap distance rather than assuming continuity. Output retained in `span0_path_analysis-output.txt` (exit 0). |
| `time_quality_check.py` | **New, correction v2 (R2).** Retained-data-only (zero network): computes the real signed `DagsSkrad` age against both the acquisition and export reference times for all 13 chain segments and the 3 point events (67861/67862/73801), replacing `coverage.csv`'s previously-wrong, never-actually-computed "2-14590s" note with the real 96–37,575s range. Prints `NONE FOUND` explicitly when no missing/negative/inconsistent timestamp exists, never silently. Output retained in `time_quality_check-output.txt` (exit 0). |

Real provider traffic ledger: `../samples/ledger.json` (8 attempts/8 outcomes, final tallies in `../samples/manifest.md`) — **unchanged, byte-for-byte, by this correction round**: no new network request of any kind (provider, docs, or even loopback/selftest servers) was made; `wrapper.py` and `selftest.py` were not re-run and are not touched.

Commands actually run this round, in order:

```
python3 -B selftest.py                                            # exit 0, 5/5 PASS
python3 -B do_fetch.py https://open-meteo.com/en/pricing doc openmeteo-pricing.html
python3 -B do_fetch.py https://open-meteo.com/en/terms doc openmeteo-terms.html
python3 -B do_fetch.py https://gagnaveita.vegagerdin.is/api/faerdpunktar2017_1 data legacy-faerdpunktar-https.json
python3 -B do_fetch.py https://gagnaveita.vegagerdin.is/api/faerd2017_1 data legacy-faerd-https.json
python3 -B do_fetch.py "https://gagnaveita.vegagerdin.is/geoserver/gis/ows?...CQL_FILTER=IDBUTUR IN (914020037,903020037)...&maxFeatures=100" data wfs-extension-native3057.json   # incomplete, 100/172
python3 -B do_fetch.py "...&srsName=EPSG:4326&maxFeatures=100" data wfs-extension-4326.json                                                                                          # incomplete, 100/172
python3 -B do_fetch.py "...&maxFeatures=250" data wfs-extension-native3057.json          # complete retry, 172/172
python3 -B do_fetch.py "...&srsName=EPSG:4326&maxFeatures=250" data wfs-extension-4326.json  # complete retry, 172/172
python3 -B validate.py                                            # exit 0
```

Correction round v2 (offline only, zero network — none of the above re-run):

```
python3 -B span0_path_analysis.py > span0_path_analysis-output.txt   # exit 0
python3 -B time_quality_check.py > time_quality_check-output.txt     # exit 0
python3 -B validate.py > validate-output.txt                         # exit 0 (rewritten red/green demo)
```

No `npm install`, no other production file touched. `python` (the Windows-launcher default, 3.14) does **not** have `requests` installed in this environment — use `python3` (3.13, which does) for every command above; this is an environment quirk disclosed here so it is not silently rediscovered.
