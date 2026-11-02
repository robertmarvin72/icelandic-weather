# #485 iteration-3 — CC report

2026-11-02. CC. Executed `approved-prompt-v3.md` (Jonesy iteration-3 Round-2 APPROVED, 5 conditions folded in by Ripley). No production code/API/UI/DB/config change, no commit, no push, no deploy, no GitHub mutation, no accounts/purchases/installs, no subagents, no MVP proposal.

**CORRECTION v4 NOTICE:** this round's execution is PARTIAL in a stronger sense than first reported — real secret-leak paths exist in the client code described below, and several claims below (Phase A item 3, the validation count, "Known limitations," and the closing line) are superseded. See **"Correction v4 (R1–R5)"** appended at the end of this file before relying on anything above it.

## Headline

**Route: PARTIAL. Overall: PARTIAL. Not GO, not NO-GO.** Frozen as the ceiling before any request: no `OPEN_METEO_API_KEY` present (boolean-only check, §1), and no circulation evidence yet found for the new span-0 ring bridges (§3). See `iteration-3/research-report-iteration-3.md` for the full writeup.

## Phase A — credential boundary, new client, self-test (all before any provider request)

1. **Key-presence check (boolean only, value never read/printed/logged):** `OPEN_METEO_API_KEY` **absent** in this process's environment. Per the approved prompt's own fallback rule, every keyed/paid portion of this round is skipped entirely — no customer-host request attempted, no secret ever entered this process beyond this boolean check (`iteration-3/key-presence-check.txt`).
2. **New iteration-3 client** (`iteration-3/client.py`, NOT a reuse of round-2's `harness/wrapper.py` for network, per the approved prompt): structurally fixes the three gaps Jonesy's prior correction-round review found — the per-class count is now incremented at `reserve()` time (crash-safe), an exact origin+path allowlist is enforced, the decoded-byte stop is against the remaining GLOBAL allowance (not only the per-body cap), and a hard TOTAL exchange deadline (connect+full capped read, via a worker-thread future) replaces the old per-read-only timeout.
3. **Mandatory self-test suite**, run before even the key-presence check was examined (`iteration-3/client_selftest.py`, `client_selftest-output.txt`, exit 0, **8/8 PASS**), entirely against local-loopback/synthetic fixtures and a throwaway scratch ledger: slow drip past the total deadline; full stall bounded either way; an expanding gzip body stopped at the DECODED cap, not wire size; a fake-key redirect never followed with its query unconditionally dropped (never scanned-and-redacted — structurally safer); a simulated crash-before-outcome still durably consumes its slot on "restart"; a fake-key leak in a response body detected and nothing persisted containing it, with the identical mechanism passing a clean response through; the keyed-URL constructor refusing anything but the one fixed customer-host target before any secret append; and a real local self-signed certificate rejected under this client's hardcoded default-TLS-only design (no `verify=` override exists anywhere in it).
4. **One real bug found and fixed during Phase B** (disclosed, not hidden): the worker thread converted `requests`' case-insensitive header dict with a plain `dict()`, which silently lost case-insensitive `Location` lookup for a lowercase `location` header — caught via a real 308 response (exchange #3, below), fixed to use `requests.structures.CaseInsensitiveDict` explicitly, verified offline without spending another network exchange.

## Phase B — geometry/direction analysis (ZERO new WFS fetch) + 5 nonsecret doc exchanges

`iteration-3/geometry_analysis.py` (`geometry_analysis-output.txt`, exit 0) computes the new span-0 endpoint, oriented path and ring-bridge arcs entirely from already-retained files (round-2's `wfs-extension-*.json`, #483's `wfs-chain-4326.json`) — confirmed by hash, zero new network. Every one of the approved prompt's named leads (42244, reversed 1431, ring bridges 1734/8677, 54723, entry at 1436) was independently vertex-matched against the retained geometry, not assumed from the review text: residuals 2.34m / 3.59m / 0.00m / 0.00m / 0.00m / 1.31m, all within the frozen 5m bound. Both bridge rings are independently confirmed genuine closed rings (first vertex == last vertex, checked directly, not merely trusted from the VEGHLUTI=5 tag). Span 0 oriented length: **3057.4m (shorter-arc)** / **3106.1m (longer-arc sensitivity)**. No circulation-direction evidence was found for either ring — axis 1 stays PARTIAL (topology real, direction unproven), by design, not FAIL.

5 doc-class exchanges (of 6 allowed; 0 of 4 data-class used — state-feed refresh judged optional and skipped this round, disclosed as a tradeoff):
1. `https://open-meteo.com/en/docs` (200) — **independently confirms** the current documented parameter names are `wind_speed_10m`/`wind_gusts_10m`/`weather_code`; the legacy names used in production do not appear in current docs at all, validating the alias table frozen in advance.
2–3. `https://gagnaveita.vegagerdin.is/vefthjonustur/faerd-gagnasnid` (302) → `https://www.vegagerdin.is/.../gagnaveita-vegagerdarinnar/` (308, bare redirect stub, 49 bytes) — no readable VEGHLUTI role-1/8 documentation reached within budget; not chased further (judgment call, disclosed, consistent with the "404/JS=>UNKNOWN, no search" rule).
4. `https://epsg.org/crs_3057/ISN93-Lambert-1993.html` (200) — official EPSG:3057 definition, Scope "Topographic mapping (medium and small scale)"; citation only, no new transform, no projection constants used.
5. `https://epsg.org/method_9802/Lambert-Conic-Conformal-2SP.html` (404) — real CMS 404, not re-guessed.

`openmeteo-terms.html`/`openmeteo-pricing.html` deliberately reused unchanged from round-2 (terms explicitly forbidden to re-fetch; pricing judged identical same-day content, re-fetching would waste a slot for zero new information — disclosed, not silently assumed).

## Validation (per the approved prompt's nonzero-exit requirement)

`iteration-3/validate_iteration3.py` (`validate_iteration3-output.txt`, exit 0): coverage-CSV-vs-script-output cross-check, ring-closure-count check, zero-keyed-exchange check against the real ledger, ceiling-compliance check, a scan confirming the synthetic fake-key VALUE never leaked into any retained data/output artifact, and a grade-cap check (axis 4 `NOT_TESTED` and axis 6 never `PASS` across every span in `coverage-iteration-3.csv`). **Extended in the v4 correction round** with checks that `axis1_direction`/`axis5_keyed_safety_contract` never read PASS, `eta_route_status` is always `HYPOTHETICAL_NOT_ROUTE_VALID`, and no client-readiness language remains — see "Correction v4" below. All checks raise `AssertionError`/exit nonzero on a real violation — demonstrated during development (two genuine bugs in my own first draft of this validator were caught and fixed by these very assertions firing, not discovered afterward). **This validator checks internal consistency of written artifacts; passing it does not and cannot establish that the client is safe for a keyed request — that requires inspecting the request/ledger/exception code paths directly, which is what found the R1 defects below.**

## AC mapping

| Deliverable | Status |
|---|---|
| Plan + freeze receipt/hashes | `iteration-3/pre-sample-plan-iteration-3.md` |
| Endpoint contract + native/4326 pair hashes | §3 of the plan + `geometry_analysis-output.txt` |
| Oriented path/ring arcs/CRS evidence | `geometry_analysis-output.txt`, §4 of the plan |
| Long-form span-variable-point-valid-time/ETA coverage | `iteration-3/coverage-iteration-3.csv` (ETA columns; forecast variables NOT_TESTED, no key, so no variable-level rows beyond that status) |
| Source/rights/operational register | Unchanged from round-2's `../blocker-rights-register.md`; nothing in this round lifts or changes it |
| Secret-safe samples/ledger/hashes | `iteration-3/samples/manifest-iteration-3.md`, `iteration-3/samples/ledger.json` |
| Scripts/tests/commands/stdout | `iteration-3/README.md` + every `*-output.txt` |
| research-report + root cc-report | `iteration-3/research-report-iteration-3.md`, this file |
| Nonzero-exit assertions | `validate_iteration3.py`, `client_selftest.py` |
| Synthetic vs real evidence explicit | Labelled throughout; every synthetic self-test result says so in its own output |

## Status

- Baseline HEAD (start of this round): `ea6d28731983c04f90a822a7750589e496e7a5b5`.
- HEAD at end: `ea6d28731983c04f90a822a7750589e496e7a5b5` (unchanged — no commit made).
- `git status --short`: limited to this `CURRENT.md` edit, new files under `docs/ai/tasks/ticket-485/iteration-3/` and `docs/ai/tasks/ticket-485/cc-report-iteration-3.md` — no production/application/test/config/instruction file touched. (The two pre-existing uncommitted edits to `blocker-rights-register.md`/`research-report.md` from the owner-clarification note remain exactly as they were; this round did not touch either.)
- `git diff --check`: clean.
- No `.env`/`.vercel` read, no Vercel CLI, no account/keyed probe, no npm install, no env dump.
- `client_selftest.py`, `geometry_analysis.py`, and `validate_iteration3.py` all re-run fresh with `python3 -B` immediately before this report: exit 0 each. No stray `__pycache__`/`.pyc` left under `docs/ai/tasks/ticket-485/`.

## Known limitations carried forward

- `OPEN_METEO_API_KEY` presence is checked fresh at run time, never cached — a future authorised run with the key actually set would exercise the paid path this round's plan already froze the mechanics for (client, 400-classifier, alias table), without needing to redo Phase A.
- No circulation-direction evidence for ring bridges 1734/8677 — a specific, nameable gap, not a claim that "nothing further can be investigated."
- VEGHLUTI roles 1/8 remain undocumented after this round's own live-page attempt (redirect led to a stub, not role content).
- The EPSG Lambert-Conformal-Conic method accuracy page returned 404 this round; not re-guessed.
- Axis 2 (state/closures) fresh refresh was not attempted this round — disclosed tradeoff; round-2's confirmation stands as historical, not re-verified.
- All items already listed in `blocker-rights-register.md` from round-2, unchanged by this round.

## Correction v4 (R1–R5) — 2026-11-02, offline only, ZERO network (not even loopback or a key-presence check)

Executed `approved-prompt-v4.md` (Ripley REVISE after Jonesy's iteration-3 result-review R1–R5). Scope: report/grade/provenance/geometry-narrative corrections ONLY — no code repair, no new sampling, no network of any kind, not even re-checking `OPEN_METEO_API_KEY` presence. `client.py`/`do_fetch.py`/`client_selftest.py`/`samples/ledger.json`/`pre-sample-plan-iteration-3.md` all preserved byte-for-byte (reconfirmed by hash below).

**R1 (the real finding) — carried as a hard prohibition, not repaired.** `client.py:139`'s `reserve()` persists the full raw request URL (any query string included) into the durable ledger before any redaction; `do_fetch.py:38` prints the raw exception string on failure, which for `requests` exceptions typically embeds the full URL. `allowed_exact_urls` is optional, not enforced, and `build_keyed_url()` is only a URL-string helper with no real locked keyed-request path behind it — self-test [7] tested the helper in isolation and could not have caught either leak. `iteration-3/README.md` now carries a conspicuous warning; the client remains historical, not reusable, and is explicitly **not fit for keyed use** — repair and independent review are deferred to a future, separately-approved round. No real key or request was used to find this; it is a source-code finding, attributed to Jonesy's review, not reenacted here.

**R2.** Axis 5 corrected PASS→**PARTIAL** (the forward-looking keyed-safety contract is not proven); axis 6 stays PARTIAL with corrected reasoning (unfit client, not merely "unexercised"); axis 4 stays NOT_TESTED; route/overall stay PARTIAL. "Executed … in full" (opening line above) and "both delivered and proven" (this file's prior closing line) are corrected by this section, not deleted from the historical record above.

**R3 — provenance.** `client.py`/`do_fetch.py` were never hash-pinned at the plan's freeze instant and were each edited afterward in direct response to the live run (do_fetch.py 2026-11-02T15:20:51Z, allowlist addition; client.py 2026-11-02T15:21:16Z, the header-casing fix) — undocumented deviations until now. Current post-hoc SHA256 (snapshot taken 2026-11-02T15:38:19Z, explicitly **not** a reconstructed pre-request hash):

| File | SHA256 |
|---|---|
| `client.py` | `d048c3af3633ebdcbf88d365187c62daf296db770eb0668c14a2995a5523f7d8` |
| `do_fetch.py` | `c5a4d12ff348921ef7612c3e5953ce6cac95d56b0e5a12be8bcdd25578889c02` |
| `client_selftest.py` | `009bb234f90bffa210132105ada79b159600677358481c2a3011323b579c823a` |
| `geometry_analysis.py` | `d41a3afe49f631d7c84cf3736c3ef0034da7672db049bf622ee108a404540484` |
| `pre-sample-plan-iteration-3.md` | `1eab5588637475bc5417675e68da11c5a36ff999675fc40a698c20c64078b4a6` (unchanged, reconfirmed) |
| `samples/ledger.json` | `62c5337ca4f63783d5c395dfb8fd81f056580a617ee55645b86f9cc3d00db820` (unchanged, reconfirmed — zero new requests this round) |

Full detail in `iteration-3/README.md`'s "Correction v4 — provenance disclosure" section.

**R4.** The Vegagerðin role-documentation target was **not reached** because of the client's header-casing bug (it misread a genuine further-redirect response as having none), not because the doc/redirect budget ran out (one slot, one hop both remained unused) and not because the target is known to lack role-1/8 content. "Not obtained," corrected from language that implied exhaustion or absence.

**R5.** Spans 1–6's lengths are the reused #483 per-IDBUTUR tier sums — "recomputed" and the exact-match-as-validation framing are withdrawn as circular (same data, same arithmetic). `coverage-iteration-3.csv` now carries `length_status=INHERITED_PROVISIONAL` for those spans and `HYPOTHETICAL_APPROXIMATE` for span 0, a `topology_evidence_basis` column distinguishing span 0's unevidenced circulation from spans 1–6's reused #483 adjacency/role citations, and `eta_route_status=HYPOTHETICAL_NOT_ROUTE_VALID` on every row. Span 0's ring-arc projection vs. spans 2/3's cruder without/with-ring sum is disclosed as a real methodological inconsistency, not reconciled this round. Span 0's ring entry/exit matching is nearest-stored-vertex, not a true line projection — disclosed. No per-span `axis1_direction` reads PASS anywhere in the corrected CSV.

**Validation.** `validate_iteration3.py` extended with assertions that fail nonzero if `axis1_direction`/`axis5_keyed_safety_contract` ever reads PASS, `eta_route_status` is ever not `HYPOTHETICAL_NOT_ROUTE_VALID`, a keyed-host URL appears in the ledger, or forbidden client-readiness language remains in `README.md`/the research report/the samples manifest/this file — each demonstrated with an expected-RED mutation on a task-local in-memory copy of the real CSV, then a GREEN pass on the real file, no network. Re-run fresh offline immediately before this correction: exit 0 (`validate_iteration3-output.txt`).

**Status (end of v4 round):** HEAD unchanged `ea6d28731983c04f90a822a7750589e496e7a5b5`. `git status --short`: this correction adds no new files outside existing paths already tracked as untracked from round-3 (edits only to `coverage-iteration-3.csv`, `README.md`, `research-report-iteration-3.md`, `samples/manifest-iteration-3.md`, `validate_iteration3.py`, this file, and `CURRENT.md`). `git diff --check`: clean. Zero network requests of any kind, including no `OPEN_METEO_API_KEY` presence check. No `__pycache__`/`.pyc` left behind.

## Next in the workflow

Per `docs/ai/README.md`: Róbert → Jonesy "CC búinn" (reading `approved-prompt-v4.md` + this report's correction section) → Jonesy writes a new round in `result-review-iteration-3.md` → Róbert → Ripley "Jonesy búinn að reviewa CC" → Ripley final assessment. PARTIAL here means the bounded research was delivered and the client's genuine leak-defects were found and clearly documented — it is not implementation permission, the client remains unfit for keyed use pending separate repair and review, and no MVP proposal accompanies this report regardless of outcome.
