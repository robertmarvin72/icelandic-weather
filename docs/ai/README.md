# AI Collaboration Workflow

This directory is a lightweight, file-based workflow for coordinating Róbert, Ripley, Jonesy and Claude Code (CC) on implementation tasks — without long prompts/reports being copy-pasted by hand between systems.

**Source-of-truth rule:** Chat commands trigger actions. Repository files define the actual workflow state. Always read `docs/ai/CURRENT.md` before acting on any AI workflow task. Do not infer active workflow state solely from chat history.

**Discussion is not execution authorization:** `prompt-review.md` is discussion/review material only. Claude Code must never treat it as an execution prompt. Only the approved prompt referenced by `CURRENT.md` while stage is `READY_FOR_CC` may be executed.

**Git safety:** Default is no commit, no push. Only Róbert may explicitly override this default.

## Single active task invariant

`CURRENT.md` is a single global pointer. Only one task may be active in this workflow at a time. A new task must not become active until the current task reaches `CLOSED` or `CANCELLED`. Parallel task execution is out of scope for v1 — if that becomes a real need, it must be designed deliberately (e.g. per-task pointers), not allowed to happen by accident.

## Roles

**Róbert — Project owner.** Chooses the ticket/task, triggers stage transitions with short commands, is the explicit handoff between agents, may override recommendations, controls commit/push permission, remains final human authority.

**Ripley — Prompt designer and final assessor.** Before implementation: reviews the ticket against current project context and prior decisions, checks staleness, creates the initial prompt (scope, constraints, acceptance criteria, validation, tests, STOP conditions). During review: acts only when told `Jonesy búinn að reviewa prompt`; on `REVISE`, incorporates feedback into a new prompt round; on `APPROVED`, **must** create `approved-prompt-vN.md` and set `CURRENT.md → READY_FOR_CC` — recognizing approval is not sufficient, the file and the stage update are required actions. After CC: acts when told `Jonesy búinn að reviewa CC`, performs the final assessment (`PASS` / `REVISE` / `BLOCKED`).

**Jonesy — Technical peer reviewer.** Two separate responsibilities, never overlapping with implementation:
- *Prompt review* — checks for architectural gaps, hidden dependencies, repo-specific conflicts, unsafe assumptions, unclear scope, missing acceptance criteria/tests/validation, incomplete STOP rules, contradictions with prior decisions. Verdict: `APPROVED` or `REVISE`.
- *Result review* — checks CC's execution against the approved prompt: scope compliance, completeness, tests, validation, STOP-condition compliance, deviations, unresolved risks. Verdict: `PASS` / `REVISE` / `BLOCKED`.

Jonesy must never implement anything during either review.

**Claude Code (CC) — Execution layer.** Consumes only the prompt approved by Jonesy and referenced by `CURRENT.md`. Audits, implements, tests, validates. Obeys STOP conditions. Never participates in prompt-design discussion, never executes `prompt-review.md`. Defaults to no commit / no push. Produces `cc-report.md`.

## Canonical workflow

```
Ticket / task
    -> Ripley creates initial prompt
    -> Róbert -> Jonesy: "Initial prompt tilbúið"
    -> Jonesy verdict: REVISE or APPROVED
    -> if REVISE: Róbert -> Ripley: "Jonesy búinn að reviewa prompt"
       -> Ripley revises -> Róbert -> Jonesy: "Review uppfært" -> repeat as needed
    -> Jonesy APPROVED
    -> Ripley creates approved-prompt-vN.md, CURRENT.md -> READY_FOR_CC
    -> Róbert -> Claude Code: "Prompt approved"
    -> CC audits/implements/tests/validates, writes cc-report.md
    -> CURRENT.md -> CC_COMPLETE
    -> Róbert -> Jonesy: "CC búinn" -> Jonesy writes result-review.md
    -> Róbert -> Ripley: "Jonesy búinn að reviewa CC" -> Ripley final assessment
    -> PASS -> CLOSED | REVISE -> new prompt iteration | BLOCKED -> stop, record blocker
```

Jonesy's approval of the final implementation prompt is sufficient to send the prompt to Claude Code — no separate second Ripley approval gate is required after that. Do not add additional approval gates unless a future task explicitly requires them.

## Canonical shorthand commands

| Command | Audience | Meaning |
|---|---|---|
| `Initial prompt tilbúið` | Jonesy | Read CURRENT.md + active prompt-review.md. Review latest Ripley prompt. Do not implement. Append verdict (APPROVED/REVISE). |
| `Jonesy búinn að reviewa prompt` | Ripley | Read CURRENT.md + active prompt-review.md. Read Jonesy's latest review. If REVISE: revise and append a new round. If APPROVED: create approved-prompt-vN.md and set CURRENT.md -> READY_FOR_CC. |
| `Review uppfært` | Jonesy | Review the newest Ripley revision. Do not implement. Append a new verdict. |
| `Prompt approved` | Claude Code | Execute the approved prompt referenced by CURRENT.md. Do not commit. Do not push. Write cc-report.md. |
| `CC búinn` | Jonesy | Read approved prompt + cc-report.md. Review CC's execution. Do not implement. Write result-review.md. |
| `Jonesy búinn að reviewa CC` | Ripley | Read approved prompt + cc-report.md + Jonesy's result review. Perform final assessment. Return PASS/REVISE/BLOCKED. |

## Canonical stages

`PROMPT_DRAFT`, `PROMPT_REVIEW`, `READY_FOR_CC`, `CC_IN_PROGRESS`, `CC_COMPLETE`, `RESULT_REVIEW`, `CLOSED`, `CANCELLED`, `BLOCKED`.

`CANCELLED` is set by Róbert when a task is deliberately abandoned (not a technical blocker — that's `BLOCKED`). Do not introduce stages beyond this list.

## Repository structure

```
docs/ai/
├── README.md         (this file)
├── CURRENT.md         single active-workflow pointer — read this first, always
└── tasks/
    └── <task-id>/
        ├── prompt-review.md       full Ripley <-> Jonesy review history, never overwritten
        ├── approved-prompt-v1.md  immutable once CC has started executing it
        ├── approved-prompt-v2.md  created only after another full review loop, never overwrites v1
        ├── cc-report.md           CC's factual execution report
        └── result-review.md       Jonesy's result review + Ripley's final assessment
```

Do not overwrite another task's history. Once CC has started executing an approved prompt version, that file is immutable — a further iteration creates a new version file instead.

## What this system deliberately does not include (v1)

No GitHub Actions, hooks, watchers, APIs, background agents, custom orchestration software, automatic commits, or automatic pushes. This is a Markdown + directory-convention workflow only. Parallel task execution is also out of scope for v1 (see single active task invariant above).
