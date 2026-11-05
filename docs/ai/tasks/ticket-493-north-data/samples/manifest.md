# #493-north-data — Sample manifest

Per-exchange detail (purpose/host/query/UTC/status/bytes/SHA256/redirects) lives in `exchange-ledger.jsonl`. This file is the human-readable summary. Full budget: 12 exchanges / 32 MiB total / 8 MiB per response / 30 min collection window / 20 s per-request timeout (`pre-sample-plan.md` §4).

## Exchanges

| # | Purpose | Host | HTTP | Bytes | SHA256 | Saved as |
|---|---|---|---|---|---|---|
| 1 | Connectivity probe (disclosed deviation — sent before `pre-sample-plan.md` was frozen; see its §0) | gagnaveita.vegagerdin.is | 200 | 0 (body discarded, `-o /dev/null`) | n/a | not saved |
| 2 | WGS84 geometry, 16 IDBUTUR, ID-filtered (not bbox/nationwide) | gagnaveita.vegagerdin.is | 200 | 302,849 | `7075416ca4635e4dea058b43124cfdefa7caec9d860d2dd43208504022eedb9b` | `wfs-north-4326.json` (+ `headers-wfs-north-4326.txt`) |

**Totals: 2 of 12 exchanges used, 302,849 B of 32 MiB used, 0 redirects, no timeouts, no truncation** (`numberMatched=numberReturned=totalFeatures=212` on exchange 2 — complete, not capped by `maxFeatures=300`). ~10 exchanges and ~31.7 MiB of reserve genuinely unused (**upper bound, see v2/v3 dated corrections below — not confirmed**). **Collection-window sentence RETRACTED (v3, Y3/L3): "both exchanges completed within the same minute" was an unsupported guess for exchange 1's own time, which is UNKNOWN — see the v3 dated correction below.** The 30-minute cap is confirmed only for exchange 2 (occurred at 2026-11-05T18:57:23Z).

## Reused (not re-fetched) retained samples

| File | Task | SHA256 (re-verified this round, unchanged) | Use |
|---|---|---|---|
| `docs/ai/tasks/ticket-483/samples/wfs-vegnr1-all.json` | #483 | `305f60d6f1f17918c058cbd047735681e56d6f9aad99f9e16f50de9419d6983a` | Nationwide tier0 `VEGNR='1'` native-ISN93 inventory (C2 offline chain-walk) |
| `docs/ai/tasks/ticket-483/samples/legacy-faerd-fresh.json` | #483 | (unchanged, see #483 manifest) | 2026-10-28 nationwide road-state snapshot, all 16 target IDBUTUR present |
| `docs/ai/tasks/ticket-485/samples/legacy-faerd-https.json` | #485 | (unchanged, see #485 manifest) | 2026-11-02 nationwide road-state snapshot, all 16 target IDBUTUR present |
| `docs/ai/tasks/ticket-483/samples/legacy-faerdpunktar.json` | #483 | (unchanged) | 2026-10-28 nationwide point-notice snapshot (1 hit on target IDBUTUR) |
| `docs/ai/tasks/ticket-485/samples/legacy-faerdpunktar-https.json` | #485 | (unchanged) | 2026-11-02 nationwide point-notice snapshot (0 hits on target IDBUTUR) |
| `docs/ai/tasks/ticket-491/final-validation/route-data-candidate.json` | #491 | `ec56c43cbaf207bf1958b7b6e3bbfdad51c7dbb63bb50ff84bcd49d71f143087` | Exact #491 Borgarnes exit anchor (IDFERILL 2819, native ISN93 coordinate) this round continues from |

No fresh legacy `faerd2017_1`/`faerdpunktar2017_1` fetch was made this round — both already-retained nationwide snapshots fully cover all 16 target IDBUTUR with zero missing/duplicate entries (see `evidence-north.md` §4), so a new fetch was judged unnecessary per the plan's own "only if necessary" rule.

## Rights/retention basis

Unchanged from #483/#491: Vegagerðin's own "Skilmálar vefþjónustur" page (CC BY 4.0, per #483 `research-report.md` §6, independently grep-verified against the raw HTML in #493's v2 audit round) — reused as a documented fact, not re-fetched this round. No key, no account, anonymous WFS access, same as every prior round touching this host.

## Dated correction, 2026-11-05 (v2 round, W3/K3) — added, not rewritten in place above

- Exchange 1's row above says "Bytes: 0 (body discarded, `-o /dev/null`)" — this is the **retained** byte count (correct: genuinely 0, nothing was written to disk or examined). It is NOT a confirmed **received** byte count: the shell invocation used for exchange 1 did not request curl's `%{size_download}` field, so the actual number of bytes that crossed the wire for that one request is UNKNOWN and cannot be recovered now without sending a new request (not done this round).
- The totals line above ("302,849 B of 32 MiB used... ~31.7 MiB of reserve genuinely unused") is therefore corrected as follows: **302,849 B is a LOWER BOUND on this round's total received bytes** (exchange 2's confirmed count + exchange 1's unknown-but-nonnegative count). The "~31.7 MiB reserve" figure is consequently an **UPPER BOUND on the possible remaining reserve** against the 32 MiB (33,554,432 B) cap, not a guaranteed/confirmed remaining budget — the unknown exchange-1 byte count can only ever reduce it further, never increase it.
- Exchange 2's actual enforcement command is now recorded in `exchange-ledger.jsonl`'s dated correction line, with an explicit note that it was not written to any retained file at execution time (recorded now from this session's own execution history, not reconstructed/guessed, and not claimed as contemporaneous documentation).
- No new request was sent to fill either gap. See `exchange-ledger.jsonl`'s correction line and `evidence-north.md`'s v2 banner for the full account.

## Dated correction, 2026-11-05 (v3 round, Y3/L3) — added, not rewritten in place above

- **"Both exchanges completed within the same minute (2026-11-05T18:57Z)" (the §Exchanges totals line above) is RETRACTED.** Exchange 1's own UTC time is UNKNOWN (unchanged from the v2 correction's own finding) — there was never retained evidence it happened in the same minute as exchange 2, only an unsupported inference. The one fact actually on file is an ORDERING, not a time: `pre-sample-plan.md`'s own file mtime (18:57:10Z, per Jonesy's result-review round-1 sandbox observation, not a fresh measurement here) is later than exchange 1 (which `pre-sample-plan.md` §0 itself says preceded the plan's own writing) — this supports only "exchange 1 happened before 18:57:10Z," not any specific minute for exchange 1 itself.
- **The 30-minute collection-window cap is UNCONFIRMED for exchange 1** (its time is unknown) and remains confirmed only for exchange 2 alone.
- **"Enforcing the 20s timeout and 8 MiB per-response cap" (exchange-ledger.jsonl line 3's own wording) is corrected:** retained response headers for exchange 2 (`headers-wfs-north-4326.txt`) show `Transfer-Encoding: chunked` with no `Content-Length` — curl's own documented behaviour is that `--max-filesize` does not reliably cap a chunked response of undeclared size. The flags were sent (CC-attributed recollection of the command) and the response did complete cleanly within the cap (302,849 B, SHA256-verified, not truncated) — but that observed outcome is not proof the cap MECHANISM itself enforced anything here. Full C1 budget enforcement (byte cap specifically) is NOT_DOCUMENTED beyond the outcome actually observed. See `exchange-ledger.jsonl`'s own v3 dated correction line for the complete statement.
