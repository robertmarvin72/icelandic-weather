# LOCAL AI REVIEW EXPERIMENT — #430

Ripley validation, 2026-10-14, after Jonesy's independent blind result-review was written. This comparison is based on raw qwen-review.md, candidate code/test inspection, Jonesy's written review and CC run metadata. No model suggestions executed or source changes made.

Model: qwen3-coder:30b, Ollama 0.40.0, num_ctx=4096, num_predict=800 (reported). 12/13 planned chunks, 12-chunk cap; approximately 90.1 seconds inference total (reported, not timed again). 14/15 candidate files represented; landing holder test omitted. Qwen report's “12 of 15 files” is inconsistent with its own coverage table. stoppedOnBudget wording must distinguish chunk cap from wall-clock (900 seconds not exhausted). Token estimates/counts corroborate small input fit but caching defeat and pessimistic bytes/3 bound are not independently proven universal guarantees.

Input asymmetry: Qwen received correctness-focused chunked diff slices without the full approved requirements/evidence; Jonesy received full candidate, prompt and CC evidence. This is a limited first-pass experiment, not a controlled like-for-like benchmark. Jonesy was blind until its result was written; its post-review addendum is explicitly separate. No new model run performed by Ripley.

## Findings validation

Raw Qwen output contains 20 numbered statements. Classification below is Ripley's code-based assessment; “false/not defect” includes intentional behavior and vague unsupported assertions, not merely demonstrably incorrect syntax.

| Chunk/item | Assessment | Reason |
|---|---|---|
| 1.1 | False/not defect | Stable callback reads current holder ref; instance is initialized once. |
| 1.2 | Potential risk, low | Render-time mutable visit state is a real smell under discarded renders; memo dependency claim alone establishes no wrong event. Partly overlaps Jonesy R1, not F4. |
| 1.3 | False/not defect | Lookup uses primitive date on every render, not stale selectedSlot object closure. |
| 1.4 | False/not defect | Derived usability changes on render; no independently cached asynchronous boolean. |
| 2.1 | False/not defect | Generic mock criticism does not establish a broken tested flow. |
| 2.2 | False/not defect | Observer instances are reset by test setup; incomplete slice context. |
| 2.3 | Info/test suggestion | Payload assertions can strengthen a count-focused test; payload covered elsewhere. No identified wrong data. |
| 2.4 | False/not defect | Rerender/remount distinction is relevant, but this claim does not identify the actual in-place pathname coverage gap F4. |
| 4.1 | False/not defect | Stable callback reads stable current ref. |
| 4.2 | False/not defect | useCallback with empty deps is stable; object useMemo does not recreate every render as claimed. |
| 4.3 | False/not defect | Global visit uniqueness across tabs is not required for isolated per-owner holders. |
| 4.4 | False/not defect | Holder owns plain local data; unmount releases references, no external resource to clean up. |
| 9.1 | False/not defect | Captured token intentionally rejects stale visit; effect reruns and cleanup guards old callback. |
| 9.2 | False/not defect | Native navigation on GA failure and distinct rapid clicks are explicitly desired. |
| 9.3 | False/not defect | Middle-only auxclick and context-menu undercount are specified. |
| 9.4 | False/not defect | React cleans the previous effect; cancelled guard plus disconnect/listener removal exists. |
| 11.1 | False/not defect | == null intentionally rejects null AND undefined. |
| 11.2 | False/not defect | Primitive string equality compares values, not object references. |
| 11.3 | Info/bounded-lifetime growth | Set retains consumed visits during holder lifetime; storage grows with in-place visits, but is garbage-collected at owner unmount. Not a demonstrated resource leak. |
| 11.4 | False/not defect | Existing tests exercise startVisit/reset/stale ids; no multithreaded access model. |

Totals: 0 confirmed production defects; 1 potential risk partly shared with Jonesy R1; 2 Info observations; 17 false/not defects. No confirmed Qwen-only defect. Jonesy's confirmed F1–F5 were not identified by Qwen. F1/F4 were in its available code/test input, but requirement-driven F1 evidence was not in its prompt. Jonesy's findings include contract/evidence/documentation gaps rather than a broken booking or scoring path; do not imply it found five runtime bugs.

Ripley independently confirmed F1 text-[11px], F3 screenshot-before-count/presence-only weaknesses and F4 unmount-based navigation test; ran 5 files / 52 tests successfully, which does not close those coverage gaps. Also found a runbook chronology error: pre-deployment baseline must not be relabelled first post-deploy affiliate window. Recorded for correction, not attributed to either review.

Conclusion: in this configuration local Qwen produced useful review prompts to inspect but mostly noise, and missed the actionable narrow corrections. It is unsuitable as an approval gate on this evidence. A future optional experiment could provide requirements and better dependency grouping, but this task does not authorize a new model/run or make local review mandatory. Partial coverage and different reviewer inputs limit general conclusions about Qwen itself.
