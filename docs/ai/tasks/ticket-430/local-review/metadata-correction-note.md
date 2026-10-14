# #430 v2 — local-review metadata correction note

Per the approved v2 correction prompt's F5/D6: this corrects two metadata inaccuracies Jonesy's result review flagged, **without overwriting** `qwen-review.md`, `run-meta.json`, `chunk-budget.json`, or any `chunk-NN-{prompt,response}.txt` file — all of those stay exactly as they were written during the original v1 experiment. This note is the correction; the originals are the historical record.

## Correction 1 — file count

`qwen-review.md`'s "Coverage" section opens with **"12 of 15 candidate files were reviewed"**. That is an arithmetic error. Counting directly from that same section's own coverage table (chunk → file mapping):

- Chunk 1: 2 files
- Chunks 2–3: 1 file
- Chunk 4: 2 files
- Chunks 5–6: 1 file
- Chunks 7–8: 1 file
- Chunk 9: 1 file
- Chunk 10: 2 files
- Chunk 11: 2 files
- Chunk 12: 2 files

Total: **14 files**, not 12. The correct statement is: **14 of 15 candidate files were reviewed; `src/pages/NorthernLightsLanding.affiliateHolder.test.jsx` (chunk 13) was not reviewed.** This matches what `cc-report.md`'s own v1 text already said ("one file... was not reviewed by Qwen", i.e. 14 of 15) — only `qwen-review.md`'s own headline sentence had the wrong number; its coverage table itself was always correct.

## Correction 2 — `run-meta.json`'s `stoppedOnBudget` field

`run-meta.json` records `"stoppedOnBudget": true`. Read literally against the two budgets named in the approved prompt (a 15-minute/900,000 ms wall-clock budget and a 12-chunk cap), this is misleading: the run used **90.1 of 900 seconds (10%) of the wall-clock budget** — it was the **12-chunk cap**, not the wall-clock budget, that stopped chunk 13 from running. The harness script's own variable name conflated "stopped early for any reason" with "stopped on the wall-clock budget specifically." Both `qwen-review.md`'s prose and `cc-report.md`'s v1 text already correctly describe the real reason ("the 12-chunk cap was reached, not the wall-clock budget — ample time remained"); only the raw JSON field's name is imprecise. Read `run-meta.json`'s `stoppedOnBudget: true` as "stopped early (chunk cap reached)," not "wall-clock budget exceeded."

No other figures in `local-review/` are affected. No new Qwen run was made to produce this note; it is a correction to how the existing, frozen run's metadata is described, not a re-run.
