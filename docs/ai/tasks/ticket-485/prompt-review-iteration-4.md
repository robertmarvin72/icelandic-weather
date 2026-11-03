# #485 — Iteration4: repair research client with fake credentials only

2026-11-02, Ripley. **FOR JONESY PROMPT REVIEW ONLY.** Owner's “Ok höldum áfram” accepts the proposed next step: client repair/fake-key verification only, followed by independent review. No live customer test in this iteration. Earlier iteration3 client remains NOT FIT FOR KEYED USE. Initial working tree clean, HEAD389430953e055be65fc7568a4dcb0a06d7b5fa40.

## Proposed execution prompt

### Authority, reuse, boundaries

Start only on owner Prompt approved with CURRENT READY_FOR_CC referencing a new immutable approved-prompt-v5.md after Jonesy approval. Read AGENTS.md/CLAUDE.md/docs/ai/README.md/CURRENT and iteration3 final result-review hard gates. Set CC_IN_PROGRESS before changes. Read historical client.py/do_fetch.py/client_selftest.py, source findings and owner clarification; don't execute old network entrypoints. Reuse453 host/auth policy read-only. No subscription reconfirmation or form prerequisite.

Write new implementation/tests/docs ONLY under ticket-485/iteration-4/, root cc-report-iteration-4.md and CURRENT. Jonesy owns result-review-iteration-4.md. Preserve all previous code/prompts/plans/raw samples/ledgers/reviews byte-for-byte. A new research-only client isn't application code; no API/UI/scoring/forecast-provider/DB/config/deploy changes, installs/dependencies, accounts/provider contact, subagents, GitHub mutation, commit/push/deploy, MVP proposal or publication.

**NO external network or real credential access of any kind:** not even OPEN_METEO_API_KEY presence, environment dump, .env/.vercel read, account/key retrieval or production/provider call. Do not arrange any real key for this run. Fake keys are generated synthetic fixtures passed directly to test functions in memory, never read from environment. Loopback/in-memory tests permitted; external HTTP/TLS/DNS forbidden. No proxy environment consumption by the test transport. Documentation read from retained files only. New research-client code may describe fixed future provider target but no live CLI/executable/env reader is authorised now. No localhost test switch in provider interface.

### Required architecture / finite scope

One corrected request pipeline builds in-memory keyed request for fixed https://customer-api.open-meteo.com:443/v1/forecast with required apikey query handling, default TLS/hostname verification, no redirects/retries/fallback. Mandatory fixed origin/path/port, no userinfo/alternate host/scheme/path or caller override. No credential in arbitrary caller URL; reject caller-provided apikey or duplicate query parameters. Normalisation tests for trailing-dot/encoding/userinfo/subdomain/port/path bypasses. Public metadata never stores full request query/URL. No generic do_fetch clone that prints arbitrary URL/errors. No public fallback from keyed failure.

Separate transport capability from provider pipeline: provider target policy fixed and immutable; test adapter maps already-validated logical target to loopback transport in test harness without exposing URL/verify/allowlist override on the provider-facing object. Shared actual request/stream/deadline/sanitisation/ledger logic, disclosed exactly what is shared or simulated. A constant build_keyed_url alone is NOT the pipeline proof. No live provider transport launch command this iteration; future reviewed probe supplies that capability only after independent source assessment. If practical runtime constraints prevent proof, state BLOCKED/PARTIAL client acceptance, no weakened gate.

### Secret-safe handling, including request and exceptions

Request secret enters function only as fake fixture here; append in memory after destination/parameter validation. No key length/prefix/hash in output, request ledger or errors. Permit legitimate SHA256 of synthetic/response artifacts, never fingerprint a real credential. Reject blank/malformed key with fixed error category without repr/echo; tests synthetic only.

Before every persistence boundary project to allowlisted metadata: sequence, fixed base origin/path (no query/fragment/userinfo), category, safe status/timing/count, approved nonsecret test/request parameters as separate fields only. Defensively scan attempted row BEFORE durable write, outcome, safe samples, stdout/stderr and handled exception surface for fake-key value including URL-encoded form; recursive structured strings and cross-chunk overlaps included. A response/header/Location may reflect a key: retain no raw headers, raw Location/query/fragment/body/error reason. Redirect metadata scheme/host/path only if individually validated/non-reflecting; otherwise omit. Don't retain raw exception strings/tracebacks/request.response URLs from libraries or worker subprocesses.

Allowlist expected forecast response fields/metadata; validate types and recursively reject secret reflection before safe sample save, including malformed JSON, error fields, reflected numeric/string values and fake-key split across chunks. Joined payload scan within bounded memory or streaming overlap >=secret length-1; test every split offset and chunk-boundary encoded reflection. Unparseable/error body saved only as fixed safe category/byte count, not raw text. Suppress HTTP debug/proxy logs. Child-process stderr must be captured/sanitised before user display/persistence. Secret-suspected=>terminal run refusal; don't claim post-fact redaction makes original leak safe. Use safe error objects/messages (`raise ... from None` where appropriate), no str(e)/repr(e) on output paths.

Synthetic regression proof must place fake key in **request URL before transport** to catch old reserve() leak, not only response body. Inject fake URL-bearing exceptions through actual error path and assert absence from ledger/outcome/stdout/stderr/exception str/repr/formatted traceback. Mutation tests temporarily reintroduce raw-URL ledger and raw-error output in task-local copied code, show RED/nonzero, restore/prove GREEN and unchanged final source hash. No lost temporary mutations.

### Durable budget and total termination

Design for future bounded test profile (not authorisation to run it): at most2 provider attempts, <=2MiB decoded/attempt and4MiB total, hard20s TOTAL exchange deadline and60s run window. Fake tests can use shorter durations/smaller caps but same machinery. Prewrite/fsync attempted slot and capacity BEFORE network; failure/crash consumes attempt, no outcome-count-only bug. Persist attempted-but-incomplete state on abrupt termination and refuse further attempts after terminal deadline/disclosure/auth/rate failure. Counter exhaustion prevents opening socket. Remaining-global decoded cap enforced during streaming independent of perbody cap, compressed wire vs decoded counts separate. Account for partial decoded bytes on timeout/failure conservatively; no reset on restart. Atomic ledger and no sample overwrite (unique attempt IDs).

No worker merely abandoned after future timeout. Use cancellable/terminable transport worker/process with bounded join, socket closure and no alive request worker after total deadline. Run-ending refusal is durable. On Windows any helper processes hidden and cleanup bounded to test-owned process IDs/paths; never kill unrelated processes. Forced termination may leave response incomplete: record safe terminal state without invented bytes/outcome. No dependency install; existing Python/runtime libraries only. Threads acceptable only if demonstrably stopped, not just daemon/wait=False.

### Mandatory local real-socket and policy tests

Before declaring candidate client acceptance, test actual shared transport on loopback HTTP (only separate test adapter):

1. Slow-drip response that exceeds TOTAL deadline despite frequent chunks; full read stall; connect stall if deterministically simulatable, otherwise classify simulation and demonstrate hard worker termination independent of requests connect timeout.
2. Oversized plain and compressed expanding body stops at remaining DECODED allowance, including perbody greater than global remainder and decompression memory bounded; no over-limit complete sample.
3. Redirect carrying fake key not followed; zero request to destination; no Location query/fragment reflection retained.
4. Kill worker after durable attempted record, restart new client over same ledger and prove slot consumed; crash-incomplete recovery conservative.
5. Actual pipeline refuses alternate origin/port/path/http/loopback before append/socket; record transport request count0 for rejected inputs. Test adapter not reachable through public constructor/runtime flag.
6. Request/error/response leakage matrix above, fake-key request URL and split chunks, encoded form, expected-red mutations. Security scan only reports booleans/counts, no matching fake text in retained stdout except fixture source deliberately labelled synthetic.
7. TLS verification path fixed/no verify=False/CA override in provider API; if existing local cert tooling available separate local TLS adapter proves default rejection. Otherwise synthetic SSL failure through actual safe-error terminal path acceptable, labelled not real provider TLS evidence. No missing-tool install or external cert request.

All tests local-only, bounded: each stub/test deadline <=10s, total test run ceiling180s (offline code work uncapped); failures stop suite and preserve diagnostics rather than hang. Test processes/listeners cleaned in finally, no helpers left running. All temporary files under iteration4/tmp with resolved path checks before own recursive cleanup. Assertions must exit nonzero; ordinary unsupported environment reported explicitly, not skipped-as-PASS. Avoid tests merely mirroring constants. Use targeted mutation and real-socket failures to substantiate protections.

### Delivery and acceptance

Before implementation baseline SHA256 manifest of old clients/ledgers/plans/approved prompts and HEAD; after implementation same table, explicit before/after independently computed. New files: candidate pipeline/transport with small focused tests, acceptance plan, README threat/failure boundary and no-live-use warning, exact reproducible commands/output, test/mutation evidence and final hashes. Include requirements-to-code/test evidence table; distinguish static reasoning/synthetic/socket tests and remaining unknown provider/account facts. Freeze final client/test artifact hashes in report after last change, not fabricate pre-run pins. Any later changes invalidate prior source approval.

Acceptance verdict CLIENT CANDIDATE PASS only if all hard gates demonstrated; PARTIAL/BLOCKED if runtime/proof gaps. This is not productGO or actual customer success. Historical iteration3 client remains NOT FIT FOR KEYED USE even if new candidate tests pass. New candidate remains **FAKE-KEY/LOCAL TEST ONLY pending Jonesy independent source review + Ripley final assessment**, then still needs a separately reviewed live-probe scope and owner handoff before a real key can be read. No live probe command/next task auto-created here. Product Route PARTIAL / Overall PARTIAL and paid forecast NOT_TESTED unchanged. Geometry/direction/ETA repair excluded.

No app suite/lint/build/browser needed, only targeted research tests. Check final scope/status/HEAD/diff--check and test helpers/temp cleanup; don't claim tests not run. Write root cc-report-iteration-4.md; set CURRENT CC_COMPLETE with path; owner->Jonesy source/result review->Ripley. No production/publication/commit/push.

## Jonesy request

Review whether fake-only scope, pipeline/test-adapter isolation, complete request/exception persistence protection and real termination/durable accounting tests close iteration3 hard gates without smuggling a real-key run. Check existing-runtime feasibility and minimal repair scope. APPROVED/REVISE only; no execution or provider access. No approved-v5 exists yet.


---

## Jonesy review - Round 1 - 2026-11-02

**Verdict: APPROVED, with five conditions to fold into `approved-prompt-v5.md`.** The prompt answers the hard gate I carried from iteration 3 almost point for point, keeps the scope fake-key and local only, and does not smuggle in a real-key run. The five conditions close gaps that would otherwise let the "candidate PASS" overstate what was proven; none changes the design. Prompt review only: no provider, key, network or owner-machine action.

### Hard-gate coverage (my iteration-3 list)
(1) base-URL-only persistence: covered ("allowlisted metadata before every persistence boundary", attempted row scanned before the durable write). (2) no raw exception output: covered (`from None`, no `str(e)`/`repr(e)`, URL-bearing exception injection). (3) one keyed entry point with a mandatory allowlist: covered (fixed origin/path/port, caller `apikey` rejected, no override on the provider object). (4) fake key in the request URL plus split chunks: covered, including every split offset and expected-red mutations of the old `reserve()` leak. (5) real-socket tests on the corrected client with run-ending behaviour: covered (slow drip, stalls, decoded cap, kill-and-restart, "no worker merely abandoned"). (6) independent source review before any key read: stated as pending. (7) key only in the launching process: correctly deferred, nothing real is read now.

### Verified (staged snapshots)
- CURRENT is PROMPT_REVIEW and points at `prompt-review-iteration-4.md`; no approved-v5 exists; scope is limited to `ticket-485/iteration-4/`, `cc-report-iteration-4.md` and CURRENT; `result-review-iteration-4.md` is reserved for Jonesy.
- The proposed future profile (<=2 attempts, <=2 MiB per attempt, 4 MiB total, 20 s deadline, 60 s window) is tighter than iteration 3's (4 data exchanges, 8 MiB, 180 s wait) and consistent with the approved "<=2 customer requests"; a 7-location, 3-day, 7-variable response is far below 2 MiB.
- The leak facts the prompt builds on match my Round 1 sandbox findings (raw URL in `reserve()`, raw exception print, optional allowlist, test flag on the shared function). Nothing in the prompt reads the environment, checks key presence, or contacts a host.

### Conditions to fold into `approved-prompt-v5.md`
1. **Bound every blocking call, DNS included.** Socket timeouts do not cover `getaddrinfo`, which cannot be interrupted from another thread; closing a socket does not reliably unblock a pending `connect` on Windows. State the mechanism: per-call remaining-time timeouts for connect/send/recv *plus* a terminable worker (child process killed at the deadline) for name resolution, or the whole exchange in a child process. Add a DNS-stall test (patched resolver that outlasts the deadline) asserting the worker is gone, the run-ending refusal is durable and no thread is left alive, next to the connect-stall item.
2. **Secret channel and single ledger writer if a child process is used.** The key reaches the child only through an inherited pipe or stdin, never argv, environment or a temp file; the child returns only fixed-schema safe records over the pipe; its stdout/stderr are never displayed raw; the parent is the only ledger writer (avoids Windows file contention and half-written rows). Add a test that kills the child between receiving the request and returning, and one that kills the writer between temp-file write and replace, leaving a valid ledger.
3. **Make the transport isolation concrete.** The provider module hard-binds the destination as a module constant; the transport interface receives a logical target plus an already-validated query, never a caller URL. The loopback adapter lives in a test-only module that the provider module never imports; prove it with an import-graph or source test. Any production transport class has no entry point and no launch command in this iteration, and the report says so.
4. **Ignore proxy and CA environment.** The client must not consume `HTTP(S)_PROXY`, `NO_PROXY`, `REQUESTS_CA_BUNDLE`, `SSL_CERT_FILE` or the platform proxy settings (for `requests`, `trust_env=False`; for the standard library, no `ProxyHandler`). Run the loopback suite with dummy proxy variables set to prove they are ignored; otherwise a fake key (and later a real one) can leave the machine through a proxy. This is the one way the "no external network" rule can fail silently.
5. **Strict parameter allowlist and encoded forms.** Forecast parameter names and values are validated, not just the `apikey` name: numeric latitude/longitude with ranges, fixed enumerations for the variable list, units, timezone and `forecast_days`; reject `& = # % ? @`, CR/LF, non-ASCII and over-length values, duplicate names and case variants such as `APIKEY`; test injection attempts (a value containing `&apikey=`, percent-encoded and double-encoded forms). The leak scan covers the raw, percent-encoded (both hex cases) and JSON-escaped forms of the fake key, including inside re-serialised safe samples, and itself prints only booleans and counts.

### Notes (non-blocking)
- The standard library (`http.client`, `ssl`, `socket`, `zlib` with `max_length`) gives more direct control of sockets and decoded-byte limits than `requests`; either is within "existing runtime libraries", but one choice should be stated and its exception surface treated as hostile.
- Report the Python version, OS and library versions actually tested, and keep static reasoning, synthetic tests, real-socket tests and "not tested" in separate columns, as the prompt already asks.
- "CLIENT CANDIDATE PASS" is CC's own verdict; it does not substitute for my source review of the final hashes, and any change after the freeze invalidates that review (the prompt says so).
- Nothing is needed from the owner for this iteration: no key, no environment change.

### Limits of this review
Prompt review only against staged snapshots of README, CURRENT, this file and my own earlier sandbox findings; no code of iteration 4 exists yet, so feasibility statements are design judgments. No execution, provider, key, network or git action. No legal advice.

### Next
Róbert -> Ripley: "Jonesy búinn að reviewa prompt". Ripley folds conditions 1-5 into an immutable `approved-prompt-v5.md` and sets READY_FOR_CC; then owner "Prompt approved". Stage stays PROMPT_REVIEW until then.
