# #485 — Sample/attempt manifest

Freeze as-of (UTC): **2026-11-02T13:16:55Z**. `pre-sample-plan.md` itself last written **2026-11-02T13:19:52Z**, SHA256 `4c05ce469d41fd8bd68f70d12e89718157789c3822fba764c39b1c57772a4a61`, 19416 bytes — both precede the first provider request below.

Per-exchange detail (attempt + outcome, UTC + monotonic, class/byte accounting, redirect/TLS/truncation handling) lives in the durable JSON ledger `ledger.json` (SHA256 `ea7f36f9b13d115348d6800988e73490fd4729d5f382ceef5a2247cceb381c44`, 15382 bytes, 8 attempts/8 outcomes), written by `harness/wrapper.py` before and after every attempt. This file is the human-readable summary.

## Window/budget summary (final, end of Phase B)

- Provider-request window started: **2026-11-02T13:20:22Z** (first attempt). All 8 exchanges completed within ~90 seconds of that — far inside the 45-minute window.
- Cumulative network wait: **0.53s** (cap: 10 min).
- Data-class exchanges: **6 of 16** used, **835,559 of 20,971,520 decoded bytes** used.
- Doc-class exchanges: **2 of 8** used, **87,985 of 8,388,608 decoded bytes** used.
- No truncation, no redirects, no TLS failures, no timeouts occurred against the real provider ledger (all 5 of those failure modes were exercised and proven to work correctly against synthetic/local-loopback fixtures only — see `harness/selftest-output.txt`).
- Stopped by deliberate decision gates (§8/§9 of `pre-sample-plan.md`), not by exhaustion. 10 data + 6 doc reserve slots were left genuinely unused, not reallocated to new-feed exploration.

## Retained raw bodies

| # | File | Class | SHA256 | Bytes | Status |
|---|---|---|---|---|---|
| 0 | `openmeteo-pricing.html` | doc | `5ae5693b97572e2388022ce63772a2c863545a066f209c385778754f8fe6e200` | 49314 | 200 |
| 1 | `openmeteo-terms.html` | doc | `771b6832feb8d3ac9b2a29e8a04e468bb7911e59684d1ee1691f24041d928ce8` | 38671 | 200 |
| 2 | `legacy-faerdpunktar-https.json` | data | `788c712aa9e1a5ef8059f77444e868d52a29ca3e981d163fdd54dc8d94db325c` | 13012 | 200 — **first-ever confirmed HTTPS success for this feed** (#483 only ever tried plain HTTP for it) |
| 3 | `legacy-faerd-https.json` | data | `1b6ff2c5f074b6f9ec2d9c9addecfef1471762c110730388275b3b4a3537c3ee` | 360657 | 200 |
| 4 | `wfs-extension-native3057.json` | data | **PERMANENTLY UNAVAILABLE — evidence loss, see below** | 78,517 (ledger size only) | 200, incomplete (100/172 features) |
| 5 | `wfs-extension-4326.json` | data | **PERMANENTLY UNAVAILABLE — evidence loss, see below** | 79,750 (ledger size only) | 200, incomplete (100/172 features) |
| 6 | `wfs-extension-native3057.json` | data | `23c4225a8021cc33867ba38558c87c805c9b7e1a40ae3fdf5fabb56fd90aa34f` | 149985 | 200, complete (172/172 features) |
| 7 | `wfs-extension-4326.json` | data | `84e560e3303f655779b09b1f43949032b238d5c18c4ad3679416161003b8222e` | 153638 | 200, complete (172/172 features) |

**Evidence loss, disclosed not hidden (corrected v2, R5 — was previously understated as merely "superseded"):** exchanges #4/#5 used `maxFeatures=100` and the WFS server reported `totalFeatures=172` — an incomplete response caused by my own query parameterization, not a server failure or a byte-level truncation (both bodies were well under the 4MiB/body cap, `truncated=False` in the ledger). Correction v2 (R3): using 4 WFS exchanges against the plan's original 3-slot allocation for this purpose was a **deviation paid from the reserve allocation, not a specifically preregistered check** — a larger `maxFeatures` or a `resultType=hits` count-first query would have avoided it; this is stated plainly, not framed as something the plan already anticipated. The two incomplete (#4/#5) response BODIES were then overwritten on disk by the complete retries (#6/#7) under the same filenames — their raw bytes and SHA256 hashes are **permanently unavailable now**, a real evidence loss. The ledger (`ledger.json`) still retains all 4 outcomes' sizes/timestamps distinctly (nothing was overwritten THERE), but the files themselves cannot be reconstructed, and the complete 172/172 payload (#6/#7) must never be described as if it were the earlier (#4/#5) body — it is a separate, later, successful retry.

**TLS result (R5):** no dedicated certificate-chain diagnostic (comparable to #483/#453's `openssl s_client` inspection) was captured for any real request this round. All 8 exchanges returned HTTP 200 under `requests`' default certificate+hostname verification with no `SSLError` raised — this supports a successful TLS handshake for each one, but is not the same as a retained, explicit certificate inspection.

Reused (not re-fetched), SHA256 recomputed this round — see `pre-sample-plan.md` §2 for the full table and `docs/ai/tasks/ticket-450/samples/vedur-openapi.json` (sha256 `0359db043464be96e9f176a857cb961c8e6e31bc90862d87ccbfde30879d0406`, 287307 bytes, independently re-read this round — `info.license` still `CC BY 4.0`, confirming no new fetch was needed for the optional Veðurstofa licence check).
