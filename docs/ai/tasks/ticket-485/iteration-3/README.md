# #485 iteration-3 scripts

> ## ⚠ `client.py` / `do_fetch.py` / `client_selftest.py` are **NOT FIT FOR KEYED USE** — DO NOT run them against the real customer host or with `OPEN_METEO_API_KEY` set.
>
> **Correction v4.** Jonesy's review of this round found real, confirmed secret-leak paths in this code, none of which the 8 passing self-tests actually exercised:
> - `client.py:139` — `reserve()` persists the **full, raw request `url`** (whatever the caller passed, including any query string) into the durable `samples/ledger.json` file **before any redaction runs**. If a caller ever built a keyed URL as `https://customer-api.open-meteo.com/v1/forecast?apikey=<real key>` and passed it in here, the key would be written straight into the ledger on disk.
> - `do_fetch.py:38` — `except Exception as e: print(f"FAILED: {type(e).__name__}: {e}")` prints the **raw exception string**. `requests` exceptions commonly embed the full request URL in their own message — for a keyed request, that again means the key could be printed to stdout/stderr.
> - `allowed_exact_urls` (`client.py:195`) is **optional**, not enforced structurally — nothing stops a caller from omitting it. `build_keyed_url()` only returns a fixed URL *string*; there is **no actual locked "keyed request" code path** that forces an allowlist, forces `never_redirect`, or guarantees the ledger only ever sees a redacted URL. The self-test suite's "keyed-client constructor refuses..." check (#7) only tested the URL-builder helper in isolation — it never tested a real request going through `fetch_once` with a key attached, so it could not and did not catch either leak above.
>
> This code remains **historical** evidence of this round's research, not a reusable client. **No repair is authorised by this correction round** — a future keyed run requires a *separately reviewed* prompt, a corrected client with a real locked-down keyed path (mandatory allowlist, redacted-by-construction ledger writes, no raw-exception printing, split-chunk reflection coverage), and independent review **before** any real key is ever read. The self-test results below remain true for exactly what they tested (nonsecret loopback mechanics) — they do **not** demonstrate that secrets are handled safely end-to-end, and this client must not be treated as fit for a keyed run; do not read them that way.

Run with `python3 -B <script>.py` from this directory. `python` (the Windows-launcher default) lacks `requests` in this environment — use `python3`, same note as round-2's `harness/README.md`.

| File | Purpose |
|---|---|
| `client.py` | A bounded HTTP client used for this round's 5 **nonsecret doc-only** exchanges. It does enforce (and self-test [1]–[6] below do genuinely prove): a hard total exchange deadline, remaining-global decoded-byte stream stop, a crash-safe reserve-before-network ledger count, and unconditional Location query/fragment stripping. It does **not** enforce a mandatory allowlist or any secret-safe request path end-to-end — see the warning above. Never used this round with any secret. |
| `client_selftest.py` | **Loopback self-tests — banned from re-execution in this correction round (no network of any kind, including loopback, per `approved-prompt-v4.md`).** Its 8/8 PASS result from the prior round is carried forward as historical evidence of exactly what it tested (listed above); it did not and could not test the two leak paths in the warning above, since neither a full keyed-style URL-with-query nor an exception raised *by `do_fetch.py`'s own outer handler* was ever exercised by any of its 8 checks. |
| `do_fetch.py` | One real, ledgered doc exchange per invocation. Its own `except Exception as e: print(...)` (line 38) is one of the two confirmed leak paths above — fine for this round's nonsecret URLs, unsafe for any future keyed URL. |
| `geometry_analysis.py` | Retained-data-only (zero new WFS fetch) span-0 endpoint/oriented-path/ring-bridge analysis. **Correction v4:** matches entry/exit points to the ring geometry by **nearest-stored-vertex**, not a true point-to-segment line projection — an approximation, disclosed here, not the "fully satisfied projection method" the research report previously implied. Output: `geometry_analysis-output.txt` (exit 0, unchanged this round — no network, not re-run). |
| `validate_iteration3.py` | Cross-document validation with real nonzero-exit assertions. **Correction v4:** these checks confirm internal consistency of already-written artifacts (CSV numbers match script output, no keyed URLs appear in the ledger, etc.) — passing it does **not** and cannot establish client/secret-handling readiness; that requires inspecting the actual request/ledger/exception code paths, which is what Jonesy's review (and this correction) did instead. Updated this round with additional assertions (see `validate_iteration3-output.txt`, re-run offline, no network). |

Real provider ledger: `samples/ledger.json` (5 attempts/5 outcomes, doc-class only — see `samples/manifest-iteration-3.md`).

Commands actually run this round, in order:

```
python3 -B client_selftest.py                                                          # exit 0, 8/8 PASS (BEFORE key-presence check)
python3 -B -c "import os; print(bool((os.environ.get('OPEN_METEO_API_KEY') or '').strip()))"  # False -> all keyed work skipped
python3 -B geometry_analysis.py > geometry_analysis-output.txt                         # exit 0, zero new WFS fetch
python3 -B do_fetch.py https://open-meteo.com/en/docs doc openmeteo-docs.html
python3 -B do_fetch.py https://gagnaveita.vegagerdin.is/vefthjonustur/faerd-gagnasnid doc vegagerdin-faerd-gagnasnid.html
python3 -B do_fetch.py "https://www.vegagerdin.is/upplysingar-og-utgafa/gagnaveita-vegagerdarinnar/" doc vegagerdin-gagnaveita-redirect-target.html   # manual redirect hop, allowed host
python3 -B do_fetch.py https://epsg.org/crs_3057/ISN93-Lambert-1993.html doc epsg-crs-3057.html
python3 -B do_fetch.py https://epsg.org/method_9802/Lambert-Conic-Conformal-2SP.html doc epsg-method-9802.html   # 404, not re-guessed
python3 -B validate_iteration3.py > validate_iteration3-output.txt                     # exit 0
```

No `npm install`, no production file touched, no account/key/provider contact of any kind beyond the 5 nonsecret doc exchanges above.

## Correction v4 — provenance disclosure (R3)

The round-2/3 plan (`pre-sample-plan-iteration-3.md`) froze at **2026-11-02T15:18:43Z** but did **not** pin `client.py`/`do_fetch.py`'s own hashes at that moment — a gap, confirmed here rather than silently carried forward. Both files were edited **after** that freeze, each time in direct response to something found during the live run, not pre-planned:

| File | Observed mtime (UTC, this filesystem — not a cryptographic timestamp, not a complete revision history) | What changed, and why |
|---|---|---|
| `do_fetch.py` | 2026-11-02T15:20:51Z | `ALLOWED` set extended to include the Vegagerðin redirect's actual target URL, discovered only once the 302 response arrived — an undocumented-in-advance deviation, not a pre-registered allowlist entry |
| `client.py` | 2026-11-02T15:21:16Z | The `dict(resp.headers)` → `requests.structures.CaseInsensitiveDict(resp.headers)` fix (R4 below), made **after** the 308 redirect that exposed the bug had already been fetched and misread |

Current post-hoc SHA256 (snapshot taken 2026-11-02T15:38:19Z during this correction round — a **snapshot now**, not a reconstructed pre-request or pre-freeze hash; no earlier version of either file was separately hashed, so no before/after diff can be proven, only the single surviving current state):

| File | SHA256 |
|---|---|
| `client.py` | `d048c3af3633ebdcbf88d365187c62daf296db770eb0668c14a2995a5523f7d8` |
| `do_fetch.py` | `c5a4d12ff348921ef7612c3e5953ce6cac95d56b0e5a12be8bcdd25578889c02` |
| `client_selftest.py` | `009bb234f90bffa210132105ada79b159600677358481c2a3011323b579c823a` |
| `validate_iteration3.py` (pre-v4-correction version) | `44ac524f978ed6ca3ebbdbdc693f0a4b958d10ccf98149f9ab89ae2ccae3c790` |
| `geometry_analysis.py` | `d41a3afe49f631d7c84cf3736c3ef0034da7672db049bf622ee108a404540484` |
| `pre-sample-plan-iteration-3.md` | `1eab5588637475bc5417675e68da11c5a36ff999675fc40a698c20c64078b4a6` (unchanged since its own freeze — confirmed, not merely assumed) |
| `samples/ledger.json` | `62c5337ca4f63783d5c395dfb8fd81f056580a617ee55645b86f9cc3d00db820` (unchanged — this correction made zero new requests) |

**Correct statement, replacing "all v3 freeze requirements were satisfied":** the *plan document itself* was frozen before the first request, as claimed. The *client/test code* was not hash-pinned at that freeze point, was edited twice afterward for real reasons found mid-run, and that deviation went unrecorded until this correction. Both edits are judged reasonable in isolation (a redirect-allowlist addition and a genuine bug fix), but the process gap — no amendment note, no before/after pin — is real and is what this section corrects.
