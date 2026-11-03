# #485 iteration-4 — CC report

2026-11-02. CC. Executed `approved-prompt-v5.md` (Jonesy iteration-4 Round-1 APPROVED, 5 conditions folded in by Ripley). FAKE CREDENTIALS / LOCAL TESTS ONLY. No real key, no real network, no account/provider contact of any kind. No production code/API/UI/DB/config change, no commit, no push, no deploy, no GitHub mutation, no installs/dependencies, no subagents, no MVP proposal, no publication.

## Headline

**Candidate verdict: CLIENT CANDIDATE PASS** for the hard gates demonstrable offline — all 8 mandatory local real-socket/policy test categories pass, with real local OS processes, sockets, a real self-signed TLS certificate, and real crash/recovery scenarios genuinely exercised (not mocked). This is **not** product GO and does **not** lift the historical iteration-3 client's NOT-FIT-FOR-KEYED-USE status. **Product Route PARTIAL / Overall PARTIAL / axis 4 NOT_TESTED — unchanged.** Full detail in `iteration-4/README.md` and `iteration-4/acceptance-plan.md`.

## What was built (new, under `iteration-4/` only)

A from-scratch candidate replacement for the iteration-3 client, using only Python's stdlib (`socket`/`ssl`/`http.client`/`zlib` — no `requests`, no install):

- `provider_target.py` — the one fixed destination as module constants, no function, nothing to override.
- `schema.py` — strict parameter allowlist (exact canonical names, types, enums, ASCII/length/delimiter checks), run before any socket/ledger attempt; rejects a caller-supplied `apikey` in every case variant.
- `leak_scanner.py` — bounded secret-leak detection across raw/percent(any case)/double-percent/JSON-escaped forms, with cross-chunk-boundary coverage for streamed bodies.
- `transport_core.py` — the shared, parameterised DNS+TCP+TLS+HTTP+bounded-decompression primitive.
- `child_worker.py` — the PRODUCTION child-process entry point: reads secret+query via stdin only, imports only `provider_target`/`transport_core`, never `test/` code.
- `ledger.py` — durable, atomic, **parent-only** ledger; the child never imports it. `reserve_attempt()` takes **no URL parameter at all** — the structural fix for the exact defect Jonesy found in the old client.
- `pipeline.py` — the parent orchestrator (`run_request()`): validates, reserves the ledger attempt BEFORE spawning the child, spawns it as a real OS subprocess with a hard total deadline (kills+joins on expiry), leak-scans everything the child returns (and its stderr) before persisting. Its public signature carries **no** host/port/path/url/verify parameter — confirmed by direct signature inspection, not by a comment's claim.
- `test/` — test-only code (never imported by any of the above, proven by a static `ast`-based import-graph check, not a comment): a test-only child entry point that reads its target from stdin instead of `provider_target`, a test adapter that calls `pipeline.py`'s *private* dispatch function with that test child, and the three test files below.

## Mandatory tests (`test/test_pipeline.py`, 8/8 categories, `test_pipeline-output.txt`, exit 0)

1. Slow drip + full stall + real worker-termination proof — each bounded near its 1.5s test deadline despite a 15–30s misbehaving local server; a directly-spawned stalled child is confirmed actually dead (`proc.poll() is not None`) after the parent's kill+wait, not merely abandoned.
2. Oversized plain (2MB) and gzip-compressed (3MB decoded) bodies both stop at the DECODED cap, not wire size; separately, the ledger's global-remainder byte accounting is exercised directly (1400/1500 used, 100 remaining, correctly tracked).
3. A redirect carrying a fake key in its Location is never followed — the redirect target's own hit-counter stays at zero, and the persisted outcome contains no Location field and no trace of the key.
4. A durably-reserved-then-"crashed" ledger attempt still consumes its budget slot on a fresh ("restart") load; a second, separate test manually recreates the exact "`.tmp` written+fsynced but never replaced" crash state and confirms `load_ledger()` completes that durable intent (2/2 attempts recovered) rather than silently dropping it.
5. `pipeline.run_request()`'s actual signature is inspected directly and contains none of `host`/`port`/`path`/`url`/`verify`/`target` — structurally, not merely by policy, there is nothing to point elsewhere.
6. The leakage matrix: (a) `ledger.reserve_attempt()`'s signature has no `url` parameter at all (confirmed), and a real loopback dispatch leaves zero trace of the key in the ledger file; (b) a response with the fake key split exactly across a streamed-chunk boundary is caught and the run is refused; (c) a response with the raw key in full is caught and refused; (d) a clean response passes through normally (green, not just red); (e) percent/double-percent/JSON-escaped forms of the key are all independently detected by the scanner.
7. TLS: a real local `openssl`-issued self-signed certificate is rejected under this candidate's hardcoded default verification (no `verify=` parameter exists anywhere to bypass it).
8. DNS-stall: a test-only child process has `socket.getaddrinfo` patched to sleep 10s; the parent still kills/joins it within ~1.5s and confirms no live process remains. Separately, dummy `HTTP_PROXY`/`HTTPS_PROXY`/`SSL_CERT_FILE`/etc. environment variables are set in the parent process and confirmed absent from the child's actual environment, with a real loopback request still succeeding unaffected.

Additional: `test/test_schema.py` (parameter-injection matrix — apikey case variants, duplicates, delimiter injection including `&apikey=`, malformed/over-length/non-ASCII, enum-bypass attempts, hourly-variable-set edge cases — 7 groups, all pass) and `test/test_import_isolation.py` (static proof no production module imports test code, and `run_request()` exposes no override parameter).

## Mutation (regression) proof — actually performed, not merely described

Per the approved prompt's explicit requirement, the old defect was reintroduced in a throwaway scratch copy (`tmp/mutation_test/ledger_mutated.py`, never the real `ledger.py`), confirmed to reproduce the exact real leak (the fake key appeared verbatim in the resulting ledger file — RED), then the scratch copy was deleted entirely and the real `ledger.py` was re-inspected directly (signature `(path)`, no `url` parameter; SHA256 unchanged) — GREEN, with the real source confirmed never touched. Full detail in `iteration-4/acceptance-plan.md`'s "Mutation demonstration" section.

## Hash manifest

**Historical iteration-3 files, reconfirmed byte-for-byte unchanged this round** (this round touched none of them):

| File | SHA256 |
|---|---|
| `iteration-3/client.py` | `d048c3af3633ebdcbf88d365187c62daf296db770eb0668c14a2995a5523f7d8` |
| `iteration-3/do_fetch.py` | `c5a4d12ff348921ef7612c3e5953ce6cac95d56b0e5a12be8bcdd25578889c02` |
| `iteration-3/client_selftest.py` | `009bb234f90bffa210132105ada79b159600677358481c2a3011323b579c823a` |
| `iteration-3/geometry_analysis.py` | `d41a3afe49f631d7c84cf3736c3ef0034da7672db049bf622ee108a404540484` |
| `iteration-3/pre-sample-plan-iteration-3.md` | `1eab5588637475bc5417675e68da11c5a36ff999675fc40a698c20c64078b4a6` |
| `iteration-3/samples/ledger.json` | `62c5337ca4f63783d5c395dfb8fd81f056580a617ee55645b86f9cc3d00db820` |
| `approved-prompt-v5.md` | `5567a5e534e9cf90b1e1edff0bf3e825061a9e6619866a189a096e0e0a7192ad` |

**New iteration-4 files, frozen after the last change this round** (not a fabricated pre-run pin — this round built new code, so there is no meaningful "before" for it; the historical files above are what "before" means here):

| File | SHA256 |
|---|---|
| `iteration-4/provider_target.py` | `642cff07ee23ca3175f0f62acfbde4c6ddab16226da2eb1e1c79bd4eb07a659f` |
| `iteration-4/schema.py` | `37b62b516b27d5fd6cb429a2e097ccdfb3b07d1753d9e995bd1ce74c20d272a5` |
| `iteration-4/leak_scanner.py` | `610f8d73f8512c813c8873f187e5d1423fea56642aee71d9c4e6da118fc5bf04` |
| `iteration-4/transport_core.py` | `ff20fe41eb6ae5f59ebff883347dce897580116b099dda542125a0d903c73d27` |
| `iteration-4/ledger.py` | `2bf15af6f1c242b8bcdda7452f7efe1f3b10ad72f803b6748209ac20bbb4c4b3` |
| `iteration-4/child_worker.py` | `b963ba93cf4686810ec33854407329cf01398671a7e00493ae146331d14d3e59` |
| `iteration-4/pipeline.py` | `33936ac8a4b1132bc2434c0171e9e1626dd33feadc6cfb9faa6d60b3e8cc8da5` |
| `iteration-4/test/test_transport_child.py` | `c4f5522db14abe4624119add6fc3a2d1b188b62da3939e48fd6f4d4fc54ffa25` |
| `iteration-4/test/test_adapter.py` | `a1fcf624cd3133b6a8039f84281a35a61acfc545b34304d942d6ec08bb95deee` |
| `iteration-4/test/test_import_isolation.py` | `ea031f1e9fbc024bec3698d9c52926b4c5d6ffb7fa54e8aafa9391d7aa731680` |
| `iteration-4/test/test_pipeline.py` | `1b64ef2bdc52dfbb7367224299a88126091b26e64e6c4442e6ba7016bdbe800a` |
| `iteration-4/test/test_schema.py` | `412f0ae8b3a3657e22977e4c180a8d90ce778d7a4e59f8886f34b753d77bfd47` |
| `iteration-4/README.md` | `f1c7f5fc1d58b09fb59fbc075df762638d49b6f7946d8b4497e775cd239484af` |
| `iteration-4/acceptance-plan.md` | `fdb50f047b944c7ef2283e8380d47fb091a47c64890b9808baf401794d43c1f7` |

**Any later change to any iteration-4 file invalidates this hash table and the acceptance verdict above**, per the approved prompt's explicit rule — a future round must re-freeze and re-verify, not assume these numbers still apply.

## Disclosed side-effect (found and cleaned, not hidden)

Running the local self-signed-certificate test via the system `openssl` binary under this Windows/Git-Bash environment deterministically created a stray directory literally named `%SystemDrive%\ProgramData\Microsoft\Windows\Caches\...` inside the task working directory each time it ran — a known OpenSSL-for-Windows/MSYS path-expansion quirk, unrelated to this candidate's own code, containing only generic Windows CryptoAPI cache files (no secrets). Removed after every run; disclosed in `iteration-4/README.md`.

## Status

- Baseline HEAD (start of this round): `389430953e055be65fc7568a4dcb0a06d7b5fa40`.
- HEAD at end: unchanged (no commit made).
- `git status --short`: limited to this `CURRENT.md` edit and new files under `docs/ai/tasks/ticket-485/iteration-4/` plus this `cc-report-iteration-4.md` — no production/application/test/config/instruction file touched, no historical ticket-485 file modified.
- `git diff --check`: clean.
- No `.env`/`.vercel` read, no account/keyed probe, no npm/pip install, no env dump, no `OPEN_METEO_API_KEY` read anywhere in this round.
- `test/test_import_isolation.py`, `test/test_schema.py`, `test/test_pipeline.py` all re-run fresh with `python3 -B` immediately before this report: exit 0 each. No stray `__pycache__`/`.pyc`/`%SystemDrive%` artifact left under `docs/ai/tasks/ticket-485/` (the latter cleaned after this final run too).

## Known limitations carried forward

- No real provider request has ever been attempted with this candidate — `customer-api.open-meteo.com`'s actual behaviour against this candidate's raw-socket HTTP/1.1 construction is unverified. A live probe needs its own, separately reviewed scope, per the approved prompt.
- The leak scanner is bounded (raw/percent/double-percent/JSON-escape, depth-limited) — not a claim of covering every conceivable encoding.
- `transport_core._read_response`'s minimal HTTP-response shim is tested against a local `http.server` only, not an exhaustive HTTP/1.1 edge-case suite.
- Geometry/direction/ETA repair remains explicitly excluded from this round, unchanged from iteration-3/v4.
- All items in `blocker-rights-register.md` from round-2/3, unchanged.

## Next in the workflow

Per `docs/ai/README.md`: Róbert → Jonesy "CC búinn" (independent source review of this candidate, plus result review) → Róbert → Ripley "Jonesy búinn að reviewa CC" → Ripley final assessment. This candidate remains **FAKE-KEY/LOCAL-TEST ONLY pending Jonesy's independent source review and Ripley's final assessment**, and even after that, needs a separately reviewed live-probe scope and explicit owner handoff before any real key is ever read. No live-probe command or next task is created by this report. No implementation/publication permission; no MVP proposal.

---

## CORRECTION — 2026-11-02 — Round 2 (`approved-prompt-v6.md` execution)

**This section corrects the Headline and verdict above. It does not delete or edit them — per this task's "visible correction, not silent rewrite" convention, everything above this divider is preserved exactly as originally written, including the now-withdrawn "CLIENT CANDIDATE PASS" claim.**

### Why this round exists

Jonesy's independent review of Round 1 (`result-review-iteration-4.md`, "Jonesy result review - Round 1 - 2026-11-02") found **"CLIENT CANDIDATE PASS" is not supported**. Verdict: REVISE (not BLOCKED — no real key/provider/network was ever touched, nothing disclosed, every defect fixable offline). Ripley's own independent inspection (same file, "Ripley final assessment of v5") accepted Jonesy's R1–R7 findings and additionally reproduced the scanner fail-open defect directly. Ripley issued `approved-prompt-v6.md` to repair R1–R7; this report covers that execution.

### R1–R7 → fix mapping (own findings vs. Jonesy/Ripley-attributed, kept distinct)

| # | Finding (attributed to Jonesy/Ripley, `result-review-iteration-4.md`) | Fix (this round) |
|---|---|---|
| R1 | No durable terminal refusal — a disclosure/parent-kill/401/403/429/malformed-output event did not stop a subsequent `run_request()` call; only the plain count cap eventually did. | `ledger.py`: a durable `terminal`/`terminal_reason_category`/`terminal_utc` flag, set via `mark_terminal()`, checked by `_check_not_terminal()` inside `reserve_attempt()` — persists across process restarts. Terminal-marking now happens in exactly one place, `pipeline.run_request()`, for all four reasons. Proven with a real, separate second OS process in `test_e2e_loopback.py` [e2e 4] (real 401 → terminal → second real process refused, zero new socket calls) and unit-level in `test_ledger.py` [1]. |
| R2 | The claimed pipeline evidence was not executed evidence — no test ever called `run_request()`/`child_worker.py`; the "worker termination" test's child exited cooperatively (exit 0), not via a real parent kill; v5's promised mutation tests were not persisted, and the raw-exception-output one did not exist at all. | New `test/e2e_copy_helper.py` + `test/test_e2e_loopback.py`: a task-local copy of the whole tree, only the copy's `provider_target.py` edited, running the copy's own real, unmodified `pipeline.run_request()` in a fresh OS process against a real loopback server. New `test/test_real_kill.py`: forces the real `proc.kill()` branch against a deliberately uncooperative test child, confirms via the OS that it's genuinely dead with a non-zero/non-cooperative returncode. New `test/test_mutation_regressions.py`: both mutations (raw-URL ledger, raw-exception-output) persisted and run, each RED-on-mutated/GREEN-on-real/hash-unchanged. New `test/test_url_leak_injection.py`: a real low-level exception with an embedded URL+secret, run through the real unmodified `child_worker.py`, confirmed absent from stdout/stderr/outcome/ledger. New `test/test_import_isolation.py` addition: an AST call-site check (not just signature/import), confirming `run_request()`'s dispatch call passes the literal `CHILD_WORKER_PATH` name. |
| R3 | Leak scanner fail-open: a malformed escape (`\x`, etc.) elsewhere in the same text caused `contains_secret()` to silently skip that whole layer, potentially hiding a validly-escaped real secret. `StreamScanner` unused by production, its cross-chunk claim untested for encoded forms. | `leak_scanner.py`: `_safe_json_unescape` now returns an `UNDECIDABLE` sentinel on any decode failure, and `contains_secret()` treats `UNDECIDABLE` as a match (fail closed), never a skip. `StreamScanner` removed entirely. New `test/test_leak_scanner.py` (5 tests) including a direct reproduction of Jonesy's exact finding. |
| R4 | Ledger durability: (a) any `OSError` reading a `.tmp` (not just corruption) deleted a valid reservation; (b) no mutual exclusion — 6 concurrent reservers could race/lose updates; (c) `run_window_start_monotonic` persisted and meaningless across a restart, and a future-looking stored value passed the window check (fail-open); (d) `ledger_path` was caller-supplied, resettable; (e) killed/failed attempts charged 0 bytes, undercounting the budget. | `ledger.py` rewritten: (a) only a confirmed-corrupt (successfully read, then `JSONDecodeError`) `.tmp` is discarded; an `OSError` reading it raises `LedgerAmbiguous` and changes nothing. (b) `_ExclusiveLock` (`O_CREAT\|O_EXCL`, PID-stamped, calibrated dead-owner reclaim) guards every mutation; proven with 6 real racing OS processes in `test_ledger_concurrency.py`. (c) persisted window start is wall-clock UTC (`now_utc_iso()`), never `time.monotonic()`; a malformed or future timestamp raises `LedgerAmbiguous`. (d) `LEDGER_PATH` is now a fixed module constant in `pipeline.py`, not a parameter. (e) `record_outcome(..., bytes_known=False)` charges the full reserved per-attempt cap, not zero. |
| R5 | Secret handling: (a) a CRLF/control/non-ASCII/overlong key was accepted and appended unencoded; (b) `SchemaViolation`'s message echoed the caller's raw rejected value; (c) `run_request()` exposed unclamped `_decoded_cap`/`_total_deadline_s` overrides; (d) `_dispatch_child_and_collect(..., _child_script_path=)` was a public-shaped override seam with no call-site check. | (a) new `secret_policy.py`: `validate_and_encode()` rejects malformed secrets with a fixed category before any attempt, else percent-encodes via `urllib.parse.quote`; shared by `child_worker.py` and the test child. (b) `schema.py` rewritten: `SchemaViolation(category, field)`, `str()` always exactly `"{category}: field={field}"`, never the caller's value; new `test_schema.py` test injects a fake key at 3 points and confirms it never appears in any message. (c)/(d) `run_request(param_pairs, secret)` is the entire public signature now — every former override is a fixed module constant (`pipeline.LEDGER_PATH`, `limits.py`); `_dispatch_child_and_collect`'s `child_script_path` is a plain positional, and `test_import_isolation.py`'s new AST check confirms the one real caller always passes the literal `CHILD_WORKER_PATH`. |
| R6 | (a) no safe-sample path existed; (b) the "hard 20s" deadline was actually 25s (an undisclosed 5s grace); (c) README falsely claimed `transport_core.request()` had no `ca_file`/CA-override parameter — it did; (d) `fresh_tmp_dir`'s recursive delete had no resolved-path safety check. | (a) `pipeline._write_safe_sample_if_clean()`: allowlisted-field/type/bound validation, scans decoded values and final serialized text for the secret, atomic write; new `test_sample_and_cleanup_safety.py` covers malformed/disallowed-field/oversized/secret-reflected rejection and the clean-write success case. (b) the 5s grace is removed; `communicate(timeout=limits.TOTAL_DEADLINE_S)`'s own timeout is the entire cap. (c) `ca_file`/`verify` parameter removed from `transport_core.request()` entirely; the TLS test-CA now installs via monkeypatching the separate `_create_tls_context()` function, from test-only code in a separate process — the README statement is now actually true. (d) `pipeline.safe_recursive_delete_under_tmp()`: resolves the real path, refuses (returns `False`, deletes nothing) unless it is strictly inside `iteration-4/tmp/`; covered by `test_sample_and_cleanup_safety.py`. |
| R7 | Wording/hygiene: acceptance-plan rows claimed a stronger evidence kind (SYNTHETIC/SOCKET) than what was actually run; several CC-attributed claims (OS/Python/OpenSSL versions, the stray-path cleanup, git status, HEAD, `git diff --check`, the 180s ceiling) were unverified by Jonesy. | `acceptance-plan.md` fully rewritten: every row re-assessed under three explicit evidence kinds (STATIC/SYNTHETIC/REAL_SOCKET), with v5's claimed kind shown alongside the honest v6 kind and an explanation wherever they differ. The "CLIENT CANDIDATE PASS" claim is explicitly withdrawn in both `README.md` and `acceptance-plan.md` (preserved, not deleted, per the task's correction convention). This report's own CC-attributed facts (below) are stated as CC-attributed, not re-asserted as independently verified by anyone else. |

### Two further defects found while building this round's own tests (not in Jonesy/Ripley's list — found by CC, disclosed here, not folded silently into the R1–R7 table above)

1. **`_dispatch_child_and_collect()`'s own disclosure-leak-scan mutated the real production ledger as a side effect.** It called `ledger.mark_terminal(LEDGER_PATH, ...)` directly, against the hardcoded `pipeline.LEDGER_PATH` constant, regardless of what ledger path (if any) the caller actually cared about. The very first time this round's own `test_adapter.py`-style direct call triggered a leak-detection branch, it crashed (`samples/` didn't exist outside `run_request()`'s own setup) and — had it not crashed — would have durably and permanently terminal-marked the real candidate's ledger file, blocking every future real `run_request()` call. **Fixed**: terminal-marking moved entirely into `run_request()`, after `_dispatch_child_and_collect()` returns or raises; that function now has zero ledger coupling of its own. Covered by `test_pipeline.py` [6] and `test_url_leak_injection.py` (both call the private function directly and would reproduce this immediately if it regressed).
2. **`ledger.py`'s exclusive lock misclassified resolved contention as ambiguous.** Under real 6-process concurrency, a lock file that disappeared between `os.open()`'s `FileExistsError` and the subsequent owner-PID read (because another process had just released it normally) raised `LedgerAmbiguous` — a false positive; the state was fully determinable. **Fixed**: that specific disappearance now triggers a retry, distinguished from genuinely unparseable lock content. Observed directly: 1 `LedgerAmbiguous` error across an early run of `test_ledger_concurrency.py`, 0 errors across every run afterward.
3. **`_validate_sample_shape()` silently dropped unrecognised top-level fields instead of rejecting them** — not a leak, but inconsistent with the stricter reject-on-unknown behaviour already used one level down for `hourly` subfields. **Fixed**: any top-level field outside `_SAMPLE_ALLOWED_TOP_FIELDS` now raises `ValueError` (no sample written).

All three are own findings, surfaced and fixed during this execution — not attributed to Jonesy or Ripley, and not folded into the R1–R7 numbering above so that attribution stays clean.

### What is now REAL_SOCKET (genuinely executed), not merely claimed

New this round, each driven through a real OS process/socket/ledger file via the actual public `run_request()` (or an injected real kill/crash against the real dispatch/ledger code), not a signature inspection or a private-function seam:

- `test_e2e_loopback.py` — 4 tests: a real 200 OK end-to-end (incl. the new safe-sample write), a schema-rejected input causing zero socket calls, a malformed-secret rejection causing zero socket calls, and — the hardest property — a real 401 from a real server durably terminal-marking the ledger, verified by a **second, separate real OS process** being refused with zero new socket calls.
- `test_real_kill.py` — a deliberately uncooperative child is genuinely `kill()`ed; confirmed via the OS (`tasklist`, not just Python's `wait()`) that the PID no longer exists, with a non-zero/non-cooperative returncode.
- `test_ledger_crash_injection.py` — a real, separate OS process is really killed at the exact instant its ledger write has been fsynced but not yet `os.replace()`'d (via a dedicated test-only hook, `ledger._post_fsync_pre_replace_hook`); a second, separate fresh process recovers it from genuine on-disk state.
- `test_ledger_concurrency.py` — 6 real racing OS processes against one ledger file; cap respected, zero errors, zero duplicate/lost attempt IDs (across repeated runs after the lock-contention fix above).
- `test_url_leak_injection.py` / `test_mutation_regressions.py` — real low-level exceptions (via `socket.socket.connect` monkeypatching, confined to a throwaway test process) carrying a full fake URL+secret, run through the real, unmodified `child_worker.py`/`transport_core.py`, confirmed absent from every output surface.

### Full combined suite, this round

12 test files, run sequentially: `test_leak_scanner.py`, `test_ledger.py`, `test_ledger_concurrency.py`, `test_ledger_crash_injection.py`, `test_schema.py`, `test_import_isolation.py`, `test_pipeline.py`, `test_e2e_loopback.py`, `test_real_kill.py`, `test_sample_and_cleanup_safety.py`, `test_url_leak_injection.py`, `test_mutation_regressions.py`. **All exit 0. Combined measured runtime: 16 seconds** (well inside the 180s ceiling this round actually measured, not merely assumed as in v5/R7). Raw output persisted to each suite's own `test/<name>-output.txt`.

### Final hash manifest (iteration-4 tree, after every edit in this round — supersedes the table above, which only covers Round 1)

Historical iteration-3/pre-existing ticket-485 files: unchanged (not touched this round; see Round-1 table above, still valid for those).

| File | SHA256 | Bytes | Changed this round? |
|---|---|---|---|
| `README.md` | `87df5f193995b2f7f08da344e9e97725227b2fd40aac64e47653291861c51119` | 20591 | yes (R6/R7 rewrite) |
| `acceptance-plan.md` | `dabd58b493882d81ece4f9701346e2a9afb10a0ed5eb96a15554fca551a331be` | 14384 | yes (R7 rewrite) |
| `before-hashes-v6.txt` | `83eafff921e43a29c3d65d3587dc485c0100709f308bd3e477772124fd016dc1` | 1809 | no (frozen checkpoint from before this round's edits began) |
| `child_worker.py` | `ffb5305c4ee3d56f3783f699d6a7ea2f66c18b402167ed67c5282470007929e8` | 3698 | yes (R5) |
| `leak_scanner.py` | `f491f8ab30289703bf66a00b727363e7c61118234fec3da07ef477aef1745d8f` | 4210 | yes (R3) |
| `ledger.py` | `e7b51dee2e59026b05cda357cb804e475b1918c3223738fcd59d51e03c83d262` | 15881 | yes (R1/R4, + the lock-contention fix) |
| `limits.py` | `4c6424f585935c397a6ea0c3aebf280f7d57a0f1aff03291af76256cc095a9a2` | 931 | new file |
| `pipeline.py` | `8e39a7d90d929927832724c08708b4305db747dc0387f6170c01e9a0807f8307` | 15782 | yes (R1/R5/R6, + the ledger-side-effect fix) |
| `provider_target.py` | `642cff07ee23ca3175f0f62acfbde4c6ddab16226da2eb1e1c79bd4eb07a659f` | 852 | no |
| `schema.py` | `03b82bd5b60e2daf4683e6c18ac06feef955f15b9505d6993575f8f3f4bf3f08` | 7910 | yes (R5) |
| `secret_policy.py` | `ce3486800fcd5f7735fe638681e75927c1479a9c22e5c65c6c98e5898f78222b` | 2515 | new file |
| `transport_core.py` | `686e69317d31389c03d479ed92a2bb2567d96324ab2189af8a2ba0776981546d` | 9546 | yes (R6) |
| `test/_concurrent_reserve_worker.py` | `c6a12b109f226b7c5b8e708e789f911d4bd167c0fab30375c231976ecdfc01c6` | 726 | no |
| `test/_crash_injection_worker.py` | `94cdff457b30a5ea8856faab28cd3f9475b3cc27c9d213c1b1c1e0d44a2215b2` | 1535 | new file |
| `test/_load_ledger_worker.py` | `be9bbdcde533b05fdf93f8c8279f275a82d6074c8a815cc0365818efa72c5396` | 697 | new file |
| `test/_mutation2_runner.py` | `f8e09b7c9d6652fe16275b8d2c5843cd63dd9c0c72905d94ee90c0e021ca478b` | 2332 | new file |
| `test/_url_leak_injection_runner.py` | `757b0fd2cb8b3f1fd291bfcb0aa808f9eb4bad25b806b362f38f834c7588c0df` | 2176 | new file |
| `test/e2e_copy_helper.py` | `79251ae1d1274517849baf41964ff267bd54f5570b5abbca9e11766c4c7ba80c` | 3877 | new file |
| `test/test_adapter.py` | `d67a3b485bf60661dce5125856467393817833bf973685f09159aeaa4835697f` | 4552 | yes (positional call-site fix, scope note) |
| `test/test_e2e_loopback.py` | `0e9bd24fa698b5327a695540502cd5c660051ca3c6c810e7b8f6c9aee86a0fb8` | 7406 | new file |
| `test/test_import_isolation.py` | `6ae68ecbea550ea09c094f464a95d4926b56cbd68fbd8b2907b0d580219af4b9` | 4653 | yes (AST call-site check added) |
| `test/test_leak_scanner.py` | `a486c8da29717d014b1627bb977ed96f16ef8ec8d8d110fb2cdad0e40006abda` | 3096 | new file |
| `test/test_ledger.py` | `6ea1d6f0f729b12bda916f66ddad682298c49edbdcb91f5432807612bb20f80b` | 10252 | new file |
| `test/test_ledger_concurrency.py` | `d064d1ee6b310fe09e35651443abffb7d74da56000566f21c54d4a2ce5503fba` | 3691 | new file |
| `test/test_ledger_crash_injection.py` | `b92d055adeceeb6608ca24e4fb8d449b1ab5fcbd0d27f2759663fcb7c96b707b` | 5679 | new file |
| `test/test_mutation_regressions.py` | `8aedbd1e4c9e92d6dada501fb711e6a5190498eade04ae6c9985974bcc4d26e4` | 13590 | new file |
| `test/test_pipeline.py` | `f700db27d036c4d5fec2b496ee83eb0d9fe539e7af62bb8c466218eb75db45d4` | 23533 | yes (API-change fixes) |
| `test/test_real_kill.py` | `310e788fb8c888cb6dcba4b544ef33c196d9e60aa01486481e129f461d90f6db` | 5146 | new file |
| `test/test_sample_and_cleanup_safety.py` | `4d063b3fc7b2f9401863269f5dd846909f974ca6fd89067f93829af9efe5765c` | 7692 | new file |
| `test/test_schema.py` | `bca4699acc468238bf6a22ea1837f62d191273199cdda6b0c5a09acaac85a36c` | 8204 | yes (R5(b) test added, pre-dates visible window of this round) |
| `test/test_transport_child.py` | `feb12b334d59a9f8379d30d835b84ff2ca727aab5744b3d812fd653417ce76b5` | 5061 | yes (R5/R6: secret_policy, _create_tls_context, ignore_deadline) |
| `test/test_url_leak_injection.py` | `f68e62b8f383497353458043a8b30511f3e223b961142fcec61209396627b56a` | 5667 | new file |
| `test/*-output.txt` (12 files) | see each file directly | — | regenerated this round, all exit 0 |

**Any later change to any iteration-4 file invalidates this table** — the same rule as Round 1, restated.

### Status (this round)

- Baseline HEAD at the start of this round: `389430953e055be65fc7568a4dcb0a06d7b5fa40`. HEAD at end: **unchanged** (no commit made this round either).
- `git status --short` at the end of this round: `docs/ai/CURRENT.md` (modified, this round's stage transitions), `docs/ai/tasks/ticket-464/harness/HourlyForecastModal.ticket464.spec.jsx` (modified — an unrelated, separately-requested CI lint fix for ticket-464, explicitly out of this round's scope and not touched by this round), and the pre-existing untracked `docs/ai/tasks/ticket-485/` files from earlier rounds (`approved-prompt-v5.md`, `approved-prompt-v6.md`, `cc-report-iteration-4.md`, `iteration-4/`, `previous-current-before-iteration-4.md`, `prompt-review-iteration-4.md`, `result-review-iteration-4.md`). Nothing outside this scope.
- `git diff --check`: clean (only LF→CRLF line-ending warnings on `CURRENT.md` and the ticket-464 file, no conflict markers or trailing-whitespace errors).
- No `.env`/`.vercel` read, no account/keyed probe, no npm/pip install, no env dump, no `OPEN_METEO_API_KEY` read anywhere in this round. No commit, push, deploy, DB mutation, or GitHub action.
- No stray `__pycache__`/`.pyc`/`%SystemDrive%` artifact left under `iteration-4/` at the end of this round (`samples/` and `tmp/` both confirmed empty).

### Verdict (this round)

**Candidate: PARTIAL, FAKE-KEY/LOCAL-TEST ONLY — "CLIENT CANDIDATE PASS" remains withdrawn as a CC self-assessment.** Every R1–R7 finding plus the 3 own-found defects above is fixed and covered by a persisted, passing test, several newly at REAL_SOCKET strength (real end-to-end `run_request()` execution, a real parent kill, a real crash-injection kill, real 6-process lock concurrency). This is CC's own re-execution result, not an independent review — per the workflow, it still requires Jonesy's independent source review of this exact hash table and Ripley's final assessment before any status change, and even a fully accepted candidate needs a separately reviewed live-probe scope and explicit owner handoff before a real key is ever read. **Product Route PARTIAL / Overall PARTIAL / axis 4 NOT_TESTED — unchanged, as it was always going to be regardless of this round's outcome.**

### Next in the workflow (this round)

Unchanged in shape from Round 1: Róbert → Jonesy "CC búinn" (independent source review against the hash table above, plus result review) → Róbert → Ripley "Jonesy búinn að reviewa CC" → Ripley final assessment. No live-probe command or next task is created by this report. No implementation/publication permission; no MVP proposal; no automatic GO.

---

## CORRECTION — 2026-11-02 — Round 3 (`approved-prompt-v7.md` execution)

**This section corrects Round 2 above. It does not delete or edit it — everything above this divider is preserved exactly as originally written, including Round 2's own "every R1–R7 finding... fixed" claim, which Jonesy's Round-2 review found still had real holes.**

### Why this round exists

Jonesy's Round-2 result review (`result-review-iteration-4.md`, "Jonesy result review - Round 2 - 2026-11-02") verdict: **REVISE**. Not BLOCKED (no real key, provider contact, or disclosure; every item fixable offline). Jonesy confirmed Round 1's fixes hold under independent re-testing (terminal persistence, scanner fail-closed, schema no-echo, secret encoding/rejection, ledger locking/crash-injection/concurrency) but found three classes of remaining problems: (1) a genuine hard-rule breach — Round 2's OWN new tests caused a real DNS lookup against the real provider host; (2) durable terminal state still had holes at the in-flight-reservation and wrong-shape-sample edges; (3) some evidence claims (the "real kill" test, byte accounting) didn't match what the code actually did. Ripley's final assessment of Round 2 accepted all of Jonesy's findings, independently inspected the source references (confirming the separate record_outcome/mark_terminal writes, discarded sample_written, the `os.kill(pid,0)` liveness probe, the always-full-cap dispatch), and created `approved-prompt-v7.md` to address R1–R6 (R7 being evidence/reporting hygiene).

### R1–R7 → fix mapping (own findings vs. Jonesy/Ripley-attributed, kept distinct)

| # | Finding (attributed to Jonesy/Ripley, `result-review-iteration-4.md` Round 2) | Fix (this round) |
|---|---|---|
| R1 | HIGH, hard-rule breach + invalid evidence: Round 2's own `test_url_leak_injection.py` and `test_mutation_regressions.py` mutation 2 ran the REAL `child_worker.py` against the REAL `provider_target` host, patching only `socket.socket.connect` — `transport_core.request()` still called `socket.getaddrinfo("customer-api.open-meteo.com", 443)` for real first. Jonesy's own probe (stubbed `getaddrinfo` to raise, no network) confirmed exactly that call happens. Consequence: on a machine where that name resolves, at least 3 real (connection-less) DNS lookups of the provider host occurred per suite run; offline, the evidence was vacuous (mutation 2's RED step could only fail its own setup assertion) or accidentally-right-for-the-wrong-reason (`gaierror` happening to map to the same category the injected fault would have). | New `test/_network_guard.py`: replaces `socket.getaddrinfo`/`socket.socket.connect`/`connect_ex`/`create_connection` with versions that refuse any non-literal-loopback target BEFORE the real function is ever called — the real resolver is provably never invoked for a non-loopback name (verified via the guard's own call-count instrumentation, not just "no exception"). Installed first in every test entry/spawned-child script. New `test_network_guard.py` + `_guard_child_probe.py`: proves the block, proves loopback still works, and proves a genuinely separate OS child process (no shared memory with its parent) must install the guard itself — never assumed inherited. `_url_leak_injection_runner.py` and `_mutation2_runner.py` ALSO now retarget `provider_target` to a literal loopback address via a scratch `sys.path` entry (the same technique `test_e2e_loopback.py` already used) — belt-and-suspenders, not relying on the guard alone. |
| R2 | HIGH, forward-looking: (a) a crash-uncertain `reserved` row (ledger with `terminal: False`) did not block a subsequent `run_request()` — only the plain count cap eventually did. (b) `record_outcome`/`mark_terminal` were two separate locked writes; a crash between them could leave a `complete` deadline/401 row with no terminal flag. (c) `_dispatch_child_and_collect` returned `sample_written`, which `run_request` discarded — a 200 with a wrong-shape body returned the same `OK`/200 outcome as a real success, wrote no sample, was not terminal, and the ledger row couldn't tell the two cases apart. | `ledger.py`: `reserve_attempt()` now refuses with the new `LedgerIncomplete` if ANY existing attempt is not `status == "complete"` — unconditionally, not just when the ledger is `terminal`. New `finalize_attempt()` is the ONE atomic locked write `pipeline.run_request()` uses for its real dispatch outcome — sets the outcome AND (if given) the terminal flag together, never two separate lock cycles. `pipeline.run_request()` now overrides a wrong-shape-200's category to `UNSAFE_SAMPLE_REJECTED`, marks it terminal (`UNSAFE_SAMPLE`), and records `sample_written`/`sample_reason` on every attempt via `finalize_attempt()`. Proven with REAL killed processes, not simulation: `test_real_kill.py` [2] kills the real `run_request()` process right after the real child's request receipt (a non-secret sentinel-file marker) and confirms the resulting `reserved` row blocks a second real process with `LedgerIncomplete`; `test_e2e_loopback.py` adds a real malformed-200 test (`[e2e 6]`) against a real local server. |
| R3 | MED-HIGH, Windows, unverified by Jonesy's Linux sandbox: `ledger._process_is_alive()`'s `os.kill(pid, 0)` is not a safe passive existence check on Windows — CPython's own calibration in this candidate's code ("raises nothing" for a live owned process) is more consistent with something being *sent* than a no-op probe; used on a live lock owner during contention, this could signal the very process holding the lock mid-write. | `_process_is_alive()` and ALL automatic stale-lock reclaim logic REMOVED from `ledger.py` entirely. A lock file that exists (readable or not) is now unconditionally `LedgerBusy` — no liveness judgment of any kind, manual cleanup only, after a human confirms the owner has actually exited (documented as an explicit availability tradeoff in `README.md`). `test_ledger.py` [9] rewritten to prove exactly this (any readable lock content → `LedgerBusy`, never reclaimed; only manual `os.remove()` unblocks the next reservation). A further, related defect this fix's own testing surfaced is in the "own findings" section below. |
| R4 | MED: a server sending 1.9 MB then resetting produced outcome `TRANSPORT_FAILURE`/`bytes_known: True`/`bytes_charged: 0`/`bytes_total: 0`, not terminal — free budget for a misbehaving server, since only the killed/unparseable paths charged the reserved cap. `MIN(per-attempt cap, remaining global)` was never actually implemented; the child always received the flat per-attempt constant, and the bound held only because 2×2MiB=4MiB. | Byte charging in `ledger.py` (`_apply_outcome`) is now derived from the outcome's own `category`, never a caller-supplied `bytes_known` flag: only `"OK"` reconciles to the verified `bytes_decoded`; every other category charges the FULL reserved cap, regardless of any partial byte count reported. `transport_core.py`'s `TransportError` now carries `bytes_decoded_so_far` (honestly observed, attached inside `_read_response`'s own exception handling so the count survives to the caller); `child_worker.py` reports it as the outcome's `bytes_decoded` on failure instead of hardcoding 0 — pure honesty, never used to charge less. `ledger.reserve_attempt()` now computes and stores the REAL `min(per-attempt cap, remaining global budget)` as `reserved_decoded_cap`; `pipeline.run_request()` reads it back via the new `ledger.get_reserved_decoded_cap()` to size the actual child dispatch, not the flat constant. `test_ledger.py` [6]/[7b] prove both halves with a remaining-global figure deliberately smaller than the flat per-attempt cap. |
| R5 | MED: `test_real_kill.py` built its own `Popen`/`proc.kill()` and asserted on that directly — the real path works (Jonesy's own 8/8 trial run), but the v6 suite never exercised it; the acceptance table credited this as REAL_SOCKET regardless. "Kill after the child acknowledges request receipt while the parent holds a durable attempted row" was not present as such. The fault hook `_post_fsync_pre_replace_hook` sat in production `ledger.py` (low risk, default `None`, but still a production-side test seam). | `test_real_kill.py` REWRITTEN completely: both tests now drive the task-local copied tree's own, genuinely unmodified `pipeline.run_request()` — no test-local kill routine anywhere. Test 1 stalls a real local server past the real `TOTAL_DEADLINE_S`; the REAL production parent's own `TimeoutExpired`/kill branch fires, confirmed via the stalling server observing the TCP connection actually close (OS-level evidence the child process is genuinely gone, not merely abandoned) and via the elapsed time (~20–25s, bounded, including the declared cleanup latency). Test 2 kills the real driving process itself at the instant the real child's HTTP request is genuinely received by the real server (a sentinel file the server writes on first byte — a non-secret marker of receipt, not content), then confirms the resulting ledger row and a second real process's refusal. `_post_fsync_pre_replace_hook` REMOVED from the real `ledger.py` entirely; `test_ledger_crash_injection.py` now builds a task-local scratch COPY of `ledger.py` with the hook text-inserted into the copy only. |
| R6 | LOW-MED: the sample went to a fixed `forecast-sample.json`; a second attempt silently overwrote the first (against the original "no sample overwrite, unique attempt IDs" requirement). The sample write lived inside `_dispatch_child_and_collect` (direct calls to that function had file side effects). Fail-closed `UNDECIDABLE` means a harmless non-JSON error body containing `\x` or a Windows path is treated as a disclosure — Jonesy noted this is the spec'd cost, not a bug, but asked that it be stated plainly. | `pipeline.py`: sample writing moved OUT of `_dispatch_child_and_collect` (now genuinely side-effect-free regarding samples — `_validate_and_scan_sample` only validates, no file I/O) and INTO `run_request()` itself, writing to a filename unique per attempt ID (`_write_unique_sample`, `forecast-sample-<attempt_id>.json`) — never overwriting a different attempt's sample. `test_e2e_loopback.py` [e2e 5] proves two real successful attempts produce two real, co-existing, distinct sample files. The `UNDECIDABLE`-fail-closed cost is now stated explicitly in `README.md`'s limitations section (unchanged mechanism — R6's own text allowed, but did not require, a token-local rewrite, and none was made, since doing so risked weakening the existing fail-closed malformed-escape/encoded-secret tests for no required benefit). |
| R7 | LOW, hygiene: no single before/after preservation table (pointed back to Round 1's); `test_schema.py`'s changelog note was unclear ("pre-dates visible window"). | `acceptance-plan.md` gets a new "Correction v7" section listing exactly which rows changed evidence kind and why (not a full re-derivation, since most rows are unaffected); this report's own hash table below is the single current before/after reference, explicitly superseding Round 1's and Round 2's for the files that changed. |

### Two further things found while building THIS round's own tests (own findings, not Jonesy/Ripley's, disclosed the same way as Round 2's three)

1. **A new race in the lock's PID-content check, found immediately after implementing the R3 fix.** Removing the liveness probe still left the lock's `_acquire()` trying to *read and parse* the lock file's PID content to distinguish "vanished" (resolved contention, retry) from "unparseable" (`LedgerAmbiguous`). Under real 6-process concurrency, a concurrent reader could observe the lock file in the narrow window after `O_CREAT|O_EXCL` created it but *before* its owner finished writing+flushing the PID into it — an empty/partial read that fails `int()` parsing, misclassified as `LedgerAmbiguous` instead of ordinary busy contention. Observed directly: intermittent `ERROR LedgerAmbiguous` across repeated `test_ledger_concurrency.py` runs after the R3 change, before this second fix. **Fixed**: lock acquisition now checks the lock file's *existence* only, never reads or parses its content at all — correct because R3 already means the content is never used for any decision, so nothing needed reading in the first place. Verified: 0 errors across 5+ repeated runs after the fix.
2. **An intermittent, environment-specific `shutil.rmtree` artifact**, observed a handful of times across this round's many repeated full-suite runs: `shutil.rmtree(path, ignore_errors=True)` on this Windows/Git-Bash setup occasionally removes every file inside a scratch directory (e.g. under `tmp/e2e_copies/` or `tmp/mutation/`) but silently leaves the now-empty directory shell behind. Not a defect in this candidate's own logic — the same general class of quirk as the previously-disclosed OpenSSL `%SystemDrive%` side-effect from Round 1. Cleaned up manually each time it was noticed; disclosed in `README.md` rather than silently hidden.

Both are own findings, surfaced and fixed during this execution — not attributed to Jonesy or Ripley.

### Full combined suite, this round

13 test files, run sequentially: `test_leak_scanner.py`, `test_schema.py`, `test_ledger.py`, `test_ledger_concurrency.py`, `test_ledger_crash_injection.py`, `test_network_guard.py` (new), `test_import_isolation.py`, `test_pipeline.py`, `test_e2e_loopback.py`, `test_real_kill.py`, `test_sample_and_cleanup_safety.py`, `test_url_leak_injection.py`, `test_mutation_regressions.py`. **All exit 0. Combined measured runtime: 36 seconds** (well inside the 180s ceiling; up from Round 2's 16s because `test_real_kill.py` now genuinely waits out the real ~20s production deadline instead of a sub-second local reimplementation — a real cost of making that proof actually real, not a regression). Raw output persisted to each suite's own `test/<name>-output.txt`, regenerated fresh this round.

### Final hash manifest (iteration-4 tree, after every edit in this round — supersedes Round 2's table, which only covers through that round)

Historical iteration-3/pre-existing ticket-485 files, `provider_target.py`, `before-hashes-v6.txt`: unchanged (not touched this round).

| File | SHA256 | Bytes | Changed this round? |
|---|---|---|---|
| `README.md` | `ec310625864ee3583521c7fe195ecccd72ce379ac02cb77a6df7bfed4d5e397c` | 33590 | yes (R1–R7 correction writeup) |
| `acceptance-plan.md` | `72f0ecc2661a5a40e29d911da6c0127c6a015176125cbd98a0600396ad4187bb` | 20195 | yes (R7 correction writeup) |
| `child_worker.py` | `2723b282b5164750397a66b0e81e5faeceda96c7cc87bc8e3da0920c7e77bd2b` | 4244 | yes (R4: reports bytes_decoded_so_far on failure) |
| `leak_scanner.py` | `f491f8ab30289703bf66a00b727363e7c61118234fec3da07ef477aef1745d8f` | 4210 | no |
| `ledger.py` | `c140f86c6a23aa55b3c70970a560c73736b24aca288f3776298ddc76ad4be860` | 18643 | yes (R2 incomplete/atomic-finalize, R3 no-signal lock, R4 category-charging/real-MIN-cap, R5 hook removed) |
| `limits.py` | `4c6424f585935c397a6ea0c3aebf280f7d57a0f1aff03291af76256cc095a9a2` | 931 | no |
| `pipeline.py` | `d89db77d40c570e7b7425ccab97c3e016eaf666fa61529e8dbdfb62407c96efa` | 17578 | yes (R2/R6: sample write moved to parent, unique filename, wrong-shape-200 reclassification, R4 real-cap dispatch) |
| `provider_target.py` | `642cff07ee23ca3175f0f62acfbde4c6ddab16226da2eb1e1c79bd4eb07a659f` | 852 | no |
| `schema.py` | `03b82bd5b60e2daf4683e6c18ac06feef955f15b9505d6993575f8f3f4bf3f08` | 7910 | no |
| `secret_policy.py` | `ce3486800fcd5f7735fe638681e75927c1479a9c22e5c65c6c98e5898f78222b` | 2515 | no |
| `transport_core.py` | `b2cbd5e50500230555d16bfb034a001be942d82fe16befe3a5613d2c2838cb7f` | 11061 | yes (R4: TransportError.bytes_decoded_so_far) |
| `test/_concurrent_reserve_worker.py` | `92697d8326b7041d28a2a6028fd92a1f2bb9d8bf089759c70a66608d2cc34457` | 1166 | yes (new INCOMPLETE outcome branch) |
| `test/_crash_injection_worker.py` | `7f0ecac7f31d4ddb598d16c92a6b7fd87706c47f13f4e0b7d053bef8327dc8f2` | 2031 | yes (now loads a scratch ledger.py copy, R5) |
| `test/_guard_child_probe.py` | `ab971d1f73c84f8e63a693330ea018b9a2f3093c166d040f7135fbe0593968ad` | 1164 | new file (R1) |
| `test/_load_ledger_worker.py` | `35121839b31680da359030f0b2cdab1333ff0e6d1a39cc05a64b60467b914c91` | 1027 | yes (now loads a scratch ledger.py copy, R5) |
| `test/_mutation2_runner.py` | `09648019fbf31e197d790a7c85dd15969494005f6c1811be2b3144eb6ecac292` | 3714 | yes (R1: guard + loopback retarget) |
| `test/_network_guard.py` | `16a7a7af91d0ad2713bb3a2b85313b87fe0b91dc9d07f67a7d2f172c05081d6c` | 4767 | new file (R1) |
| `test/_url_leak_injection_runner.py` | `727929b5984b31186ad02a77b556e26a4ab2548c6e9863ab7868977ca29ca044` | 4630 | yes (R1: guard + loopback retarget) |
| `test/e2e_copy_helper.py` | `e86e8a2d044a768a9d3ccae551ba395f26d41d5fa58c03477b9073e705fc0056` | 4122 | yes (R1: guard installed in the copy's runner template) |
| `test/test_adapter.py` | `9abd211d083d520afc61fd455ef20d83d62569ac6c42651a5387a9ae9ddddc85` | 4556 | yes (3-tuple unpacking fix) |
| `test/test_e2e_loopback.py` | `2ddcbdda1d4be6bcb8826b8396c368b77a6d6b6f403c3af830a71f64f0f8493d` | 11435 | yes (unique sample filename, 2 new tests, R1 guard) |
| `test/test_import_isolation.py` | `1a545118041b7b3eab570e1ed0ed8ee99f729cb9002d3db13c1876ae2210aaed` | 4723 | yes (checks limits.py/secret_policy.py, _network_guard forbidden) |
| `test/test_leak_scanner.py` | `a486c8da29717d014b1627bb977ed96f16ef8ec8d8d110fb2cdad0e40006abda` | 3096 | no |
| `test/test_ledger.py` | `67b2f5df9cf80f3895eeb6e8a7849c3440692fba01da1e0acee9ef73a57b2c1d` | 15176 | yes (R2/R3/R4 new tests, stale-lock test replaced) |
| `test/test_ledger_concurrency.py` | `9322e7174a04df63ae9b721a59328ad2a6b14941cf6abe14a2f5fdbb75523745` | 4533 | yes (accepts INCOMPLETE, at-most-1 invariant) |
| `test/test_ledger_crash_injection.py` | `6094c451722370ad4212eb728e375ca9082516b0ea1bae2cec00af191fa75f69` | 8254 | yes (R5: builds scratch ledger.py copy) |
| `test/test_mutation_regressions.py` | `89fa3623d55b3f052424d42e43385989eee68fe9812532450a72a7dc27180d51` | 14262 | yes (R1 fix via retargeted copy; mutation 1 snippet updated) |
| `test/test_network_guard.py` | `ec0994a85a47b72e24e9f4047520e6f270dc3f8b4f9714bd9c8de95b7c501994` | 4400 | new file (R1) |
| `test/test_pipeline.py` | `4e0f457e1af538af590ade6bc3c6888e6eee3a477461178f4b4cc1295ebfc94e` | 23893 | yes (test [4] now expects LedgerIncomplete) |
| `test/test_real_kill.py` | `8867cb2438623e15a41655bea5cf2849c0f423e7d11f9182ec59df7ee57acd03` | 9119 | yes (R5: fully rewritten) |
| `test/test_sample_and_cleanup_safety.py` | `7119083952f4e1b120a8eaa5be18945fd31c9b1116aa3c41d01ae782e1a1ae23` | 8260 | yes (R6: validate/write API split) |
| `test/test_schema.py` | `bca4699acc468238bf6a22ea1837f62d191273199cdda6b0c5a09acaac85a36c` | 8204 | no |
| `test/test_transport_child.py` | `e28f73060fa98e402decd554d484c1da83c26aed94ef4c5c01870d0711df21b4` | 5232 | yes (installs the guard first) |
| `test/test_url_leak_injection.py` | `14f6735f29ee23e2c14b23705af5ac2f996a403492b894644be292f2c04adeea` | 6144 | yes (R1 fix via retargeted copy) |
| `test/*-output.txt` (13 files) | see each file directly | — | regenerated this round, all exit 0 |

**Any later change to any iteration-4 file invalidates this table** — the same rule as Rounds 1–2, restated.

### Status (this round)

- Baseline HEAD at the start of this round: `389430953e055be65fc7568a4dcb0a06d7b5fa40`. HEAD at end: **unchanged** (no commit made this round either).
- `git status --short` at the end of this round: `docs/ai/CURRENT.md` (modified, this round's stage transitions), `docs/ai/tasks/ticket-464/harness/HourlyForecastModal.ticket464.spec.jsx` (modified — the unrelated, separately-requested ticket-464 CI fix, still untouched by any ticket-485 round), and the pre-existing untracked `docs/ai/tasks/ticket-485/` files from earlier rounds (`approved-prompt-v5.md`/`v6.md`/`v7.md`, `cc-report-iteration-4.md`, `iteration-4/`, `previous-current-before-iteration-4.md`, `prompt-review-iteration-4.md`, `result-review-iteration-4.md`). Nothing outside this scope.
- `git diff --check`: clean (only LF→CRLF line-ending warnings on `CURRENT.md` and the ticket-464 file, no conflict markers or trailing-whitespace errors).
- No `.env`/`.vercel` read, no account/keyed probe, no npm/pip install, no env dump, no `OPEN_METEO_API_KEY` read anywhere in this round. No commit, push, deploy, DB mutation, or GitHub action. Zero real external network/DNS activity of any kind this round — the R1 fix specifically closes the one real gap where that was not true before.
- No stray `__pycache__`/`.pyc`/`%SystemDrive%` artifact left under `iteration-4/` at the end of this round. The intermittent empty-directory `shutil.rmtree` quirk described above was observed and cleaned up manually several times during this round's repeated test runs; `samples/`/`tmp/` both confirmed empty at the time of this report's final verification pass.

### Verdict (this round)

**Candidate: still PARTIAL, FAKE-KEY/LOCAL-TEST ONLY — "CLIENT CANDIDATE PASS" remains withdrawn.** Every R1–R7 finding from Jonesy's Round-2 review is fixed and covered by a persisted, passing test — critically including the actual hard-rule DNS breach in Round 2's own test suite, which is now closed by two independent mechanisms (the network guard and loopback retargeting). This is CC's own re-execution result, not an independent review — it requires Jonesy's independent source review of this exact hash table (a THIRD pass) and Ripley's final assessment before any status change, and even a fully accepted candidate still needs a separately reviewed live-probe scope and explicit owner handoff before a real key is ever read. **Product Route PARTIAL / Overall PARTIAL / axis 4 NOT_TESTED — unchanged, as it was always going to be regardless of this round's outcome.**

### Next in the workflow (this round)

Unchanged in shape: Róbert → Jonesy "CC búinn" (independent source review against the hash table above, plus result review) → Róbert → Ripley "Jonesy búinn að reviewa CC" → Ripley final assessment. No live-probe command or next task is created by this report. No implementation/publication permission; no MVP proposal; no automatic GO.

---

## CORRECTION — 2026-11-03 — Round 4 (`approved-prompt-v8.md` execution, narrow)

**This section corrects Round 3 above. It does not delete or edit it — everything above this divider is preserved exactly as originally written.**

### Why this round exists

Jonesy's Round-3 result review (`result-review-iteration-4.md`, "Jonesy result review - Round 3 - 2026-11-02") ran fully network-isolated this time (`unshare -rn`, loopback only, no DNS) and confirmed Round 3's R1–R7 fixes hold under independent re-testing — the network guard genuinely blocks the provider host, the url-leak and mutation-2 suites are no longer vacuous offline, and the ledger/lock/deadline machinery all reproduced correctly. Verdict: **REVISE**, narrow — one new HIGH defect: `pipeline.py`'s safe-sample allowlist rejected DOCUMENTED, normal Open-Meteo response fields (`utc_offset_seconds`, `timezone`, `timezone_abbreviation` — confirmed present in the retained docs sample) and treated that rejection as TERMINAL, so the first genuine 200 would be discarded and the single-use ledger burned with no usable data — defeating the only purpose of a probe. A second, MED finding: `_validate_sample_shape({})` returned a "valid" sample, conflating "harmless shape" with "usable forecast." A third, LOW item was a decision, not a defect: non-OK byte charging can exhaust the whole budget on two blips — Ripley's instruction was to retain this exactly, not loosen it. Ripley's final assessment of Round 3 accepted all three findings and issued `approved-prompt-v8.md`, explicitly narrow: only `pipeline.py`'s sample-validation logic and its tests/fixtures were in scope — no changes to the guard, terminal/lock/deadline machinery, or anything else Round 3 fixed.

### R1/R2/R3 → fix mapping (own findings vs. Jonesy/Ripley-attributed)

| # | Finding (attributed to Jonesy/Ripley, `result-review-iteration-4.md` Round 3) | Fix (this round) |
|---|---|---|
| R1 | HIGH: `_SAMPLE_ALLOWED_TOP_FIELDS` rejected documented, normal response fields, and the rejection was terminal. Jonesy's own test: the same 72-hour payload passed without `utc_offset_seconds`/`timezone`/`timezone_abbreviation`, failed terminally with them; the same payload wrapped in a one-element list also failed the same way. Consequence: the first real 200 would be discarded and the single-use ledger spent for nothing. | The 3 documented fields (sourced from `../iteration-3/samples/openmeteo-docs.html`, SHA256 `7c63cb41859f759065a9ac85f919588d16ccbba82d34c483587eec6606e32566` — its own JSON example, lines ~179–194, and field table, lines ~196–199; no live docs fetch) added to the allowlist with type checks. More fundamentally: `_validate_sample_shape()` no longer raises on an unrecognised field at all — it drops it (never storing name or value) and returns a count; `run_request()` records `sample_reason="OK_UNKNOWN_FIELDS_DROPPED:n"`, never terminal for this reason alone. The full parsed structure (including about-to-be-dropped fields) is scanned for the secret FIRST, before any dropping — own finding, see below. A top-level JSON list (the documented multi-coordinate shape) is now its own non-terminal `SAMPLE_UNSUPPORTED_TOP_LEVEL_LIST` outcome, distinct from a structural failure. |
| R2 | MED: a "valid" sample did not have to contain a forecast — `_validate_sample_shape({})` returned `{}` as valid (only fields that happen to be *present* were ever checked). | New `_is_complete_forecast()`: requires `hourly.time` plus all six `schema.REQUIRED_HOURLY` arrays (non-empty, equal length) and matching `hourly_units` entries for `time` and every required variable. Missing → non-terminal `SAMPLE_INCOMPLETE` (no sample, but a real second attempt may still proceed) — kept explicitly distinct from a genuine structural failure (an invalid type/value on a field that IS present, e.g. non-increasing `time` entries, stays terminal). |
| R3 | LOW, decision only: non-OK categories charging the full reserved cap means two blips can exhaust the 4 MiB budget. | Retained exactly as Round 3 designed it, per Ripley's explicit instruction — no code change. Documented plainly in `README.md`'s "Known, disclosed limitations": accepted bounded-research behaviour; any future live-probe scope must explicitly accept this cost. |

### One thing found while building THIS round's own tests (own finding, not Jonesy/Ripley's)

**`_validate_and_scan_sample()`'s own secret-scan only covered the already-allowlisted subset, not fields about to be dropped.** While writing the persisted test "the same additive unknown field, but containing the fake secret, is still terminal" (calling `_validate_and_scan_sample()` directly, bypassing its caller's upstream whole-body-byte scan — a legitimate thing for a unit-level test to do), the test failed: a secret placed ONLY inside an unrecognised field was silently dropped along with the field, before the function's own internal scan (which only ever checked the final allowlisted `safe` dict) ever saw it. In the real `run_request()` path this was already covered by `_dispatch_child_and_collect()`'s existing raw-whole-body-bytes scan (which runs before `_validate_and_scan_sample()` is ever called at all) — so this was not a reachable real-path leak — but the function was not independently correct when exercised on its own, which the approved prompt's own wording ("raw complete bounded body/parsed values must be secret-scanned BEFORE dropping anything") requires regardless of caller. **Fixed**: `_validate_and_scan_sample()` now scans the FULL parsed structure (every field, including ones about to be dropped, regardless of top-level shape) for the secret immediately after JSON parsing succeeds, before any classification or dropping. Covered by `test_sample_and_cleanup_safety.py`'s own additive-field-with-secret test (which initially caught this) and the mutation-3 test's own secret-safety invariants.

### New in this round

- **`test/_docs_fixture.py`** — the shared, realistic synthetic fixture (every documented top-level field, all six required hourly arrays + optional `visibility`, 72 hourly points), built from the retained docs sample's structure, labelled explicitly as a synthetic expansion. Used by every sample-path test from this round on, replacing the old minimal `{}`/single-field fixtures that could not have caught R1/R2.
- **`test/test_mutation_regressions.py` mutation 3** — a scratch copy of `pipeline.py` with its allowlist-enforcement reverted to raise on any unrecognised field (v7-style) and its completeness check disabled: RED against the realistic fixture (rejected, reproducing R1) and against `{}` (accepted as valid, reproducing R2); GREEN against the real, unmutated `pipeline.py` (fixture → `SAMPLE_VALID`; `{}` → `SAMPLE_INCOMPLETE`); `pipeline.py`'s own SHA-256 confirmed identical before and after.
- **`test_e2e_loopback.py` `[e2e 6]`–`[e2e 9]`** — four new real, copied-tree, real-loopback-server tests: a genuinely unsafe 200 (invalid type on a *recognised* field) is terminal and refuses restart; an additive unknown field is OK/non-terminal with the drop count recorded; a top-level list response is non-terminal and restart still succeeds; an incomplete-forecast 200 is non-terminal and restart still succeeds.
- **`test_sample_and_cleanup_safety.py`** — rewritten from 6 to 17 tests, covering the new four-way classification exhaustively at the pure-validator level (no file I/O, no sockets).

### Full combined suite, this round

13 test files (unchanged list from Round 3 — no new top-level test files beyond the fixture module, which isn't itself a `test_*.py` entry point), run sequentially. **All exit 0. Combined measured runtime: 39–40 seconds** (comparable to Round 3's 36s; `test_real_kill.py`'s real ~20s deadline wait still dominates). Raw output persisted to each suite's own `test/<name>-output.txt`, regenerated fresh this round.

### Final hash manifest (iteration-4 tree, after every edit in this round — supersedes Round 3's table, which only covers through that round)

Historical iteration-3/pre-existing ticket-485 files, `provider_target.py`/`limits.py`/`secret_policy.py`/`schema.py`/`leak_scanner.py`/`transport_core.py`/`child_worker.py`/`ledger.py`, `before-hashes-v6.txt`, and every unchanged `test/*.py` file not listed below as changed: unchanged (not touched this round, scope was narrow by design).

| File | SHA256 | Bytes | Changed this round? |
|---|---|---|---|
| `README.md` | `0c715e00b3bdd9bf1dab9ad11623f13c6244c5181af71bdeca9761a19c3dcd14` | 43662 | yes (R1/R2/R3 correction writeup) |
| `acceptance-plan.md` | `aaffc92586b754b83d9419d7b847c00897083a28df3a530417061d6a06057bdd` | 25673 | yes (R1/R2/R3 correction writeup) |
| `pipeline.py` | `8b0972fe28b9cb4e4f03f8af958a752f050cf2c279a311de53534809c51f2e2b` | 25721 | yes (R1/R2: four-way sample classification, full-structure secret scan, documented-field allowlist, completeness check) |
| `test/_docs_fixture.py` | `e3b263f845c132f8eb6087c513af0f1d65e10c6dc4d4bc6b7ba9cee096b1f7fe` | 5227 | new file |
| `test/test_adapter.py` | `19cf8c36eb0a745e6aba946d5709e17191d0846dab5f0e020fbf73f45be1e042` | 4577 | yes (4-tuple unpacking fix) |
| `test/test_e2e_loopback.py` | `4779a4afffdf71e54fe160f4919a20eac626d818bfcd7d16d8c7fdfb7d3c21ca` | 17034 | yes (realistic fixture, 4 new tests `[e2e 6]`–`[e2e 9]`) |
| `test/test_import_isolation.py` | `43128a40ce32b481206d9f7800ed749d68dd181ebf6132ee2eb784a6d9df93f1` | 4765 | yes (`_docs_fixture` added to forbidden-import list) |
| `test/test_mutation_regressions.py` | `cf0770857194fc67b645871a3eea9bb8600060e5e4e4d44c44754253e93c9ddb` | 20831 | yes (mutation 3 added) |
| `test/test_sample_and_cleanup_safety.py` | `027d8a356ca18f538b064ffeea79447cb0fd2d31c7029afa226458340c6e6d17` | 13864 | yes (rewritten, 6 → 17 tests) |
| `test/test_url_leak_injection.py` | `57c22c20144d635a1deb4ca3489dca12e04f2bf1b9ad24568c8703eb6528feb4` | 6165 | yes (4-tuple unpacking fix) |
| `test/*-output.txt` (13 files) | see each file directly | — | regenerated this round, all exit 0 |

**Any later change to any iteration-4 file invalidates this table.**

### Status (this round)

- Baseline HEAD at the start of this round: `389430953e055be65fc7568a4dcb0a06d7b5fa40`. HEAD at end: **unchanged**.
- `git status --short`: `docs/ai/CURRENT.md` (modified, this round's stage transitions), `docs/ai/tasks/ticket-464/harness/HourlyForecastModal.ticket464.spec.jsx` (modified — the unrelated ticket-464 CI fix, still untouched by any ticket-485 round), and the pre-existing untracked `docs/ai/tasks/ticket-485/` files from earlier rounds (now including `approved-prompt-v8.md`). Nothing outside this scope.
- `git diff --check`: clean (only LF→CRLF line-ending warnings, no conflict markers or trailing-whitespace errors).
- No `.env`/`.vercel` read, no account/keyed probe, no npm/pip install, no env dump, no `OPEN_METEO_API_KEY` read, no external network/DNS of any kind this round. No commit, push, deploy, DB mutation, or GitHub action.
- No stray `__pycache__`/`.pyc` artifact left under `iteration-4/` at the end of this round. The same intermittent, environment-specific `shutil.rmtree`-leaves-an-empty-directory quirk disclosed in Round 3 recurred a few times across this round's repeated test runs (under `tmp/e2e_copies/`, `tmp/mutation/`) and was cleaned up manually each time; `samples/`/`tmp/` both confirmed empty at the time of this report's final verification pass.

### Verdict (this round)

**Candidate: still PARTIAL, FAKE-KEY/LOCAL-TEST ONLY.** Both of Jonesy's Round-3 findings (R1, R2) are fixed and covered by persisted tests at both the pure-validator and real-copied-tree levels, plus a required mutation proof; R3 is retained by explicit decision, documented not loosened. This is CC's own re-execution result, not an independent review — it requires Jonesy's independent source review of this exact hash table (a FOURTH pass) and Ripley's final assessment before any status change, and even a fully accepted candidate still needs a separately reviewed live-probe scope and explicit owner handoff before a real key is ever read. **Product Route PARTIAL / Overall PARTIAL / axis 4 NOT_TESTED — unchanged.**

### Next in the workflow (this round)

Unchanged in shape: Róbert → Jonesy "CC búinn" (independent source review against the hash table above, plus result review) → Róbert → Ripley "Jonesy búinn að reviewa CC" → Ripley final assessment. No live-probe command or next task is created by this report. No implementation/publication permission; no MVP proposal; no automatic GO.
