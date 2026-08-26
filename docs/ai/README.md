# AI Collaboration Workflow

This directory is a lightweight, file-based workflow for coordinating Róbert, Ripley, Jonesy and Claude Code (CC) on implementation tasks — without long prompts/reports being copy-pasted by hand between systems.

**Source-of-truth rule:** Chat commands trigger actions. Repository files define the actual workflow state. Always read `docs/ai/CURRENT.md` before acting on any AI workflow task. Do not infer active workflow state solely from chat history.

**Discussion is not execution authorization:** `prompt-review.md` is discussion/review material only. Claude Code must never treat it as an execution prompt. Only the approved prompt referenced by `CURRENT.md` while stage is `READY_FOR_CC` may be executed.

**Git safety:** Default is no commit, no push. Only Róbert may explicitly override this default.

## Single active task invariant

`CURRENT.md` is a single global pointer. Only one task may be active in this workflow at a time. A new task must not become active until the current task reaches `CLOSED` or `CANCELLED`. Parallel task execution is out of scope for v1 — if that becomes a real need, it must be designed deliberately (e.g. per-task pointers), not allowed to happen by accident.

## Stale-pointer recovery (narrow)

*Added after the Ticket 390 pilot, where `CURRENT.md` was found still showing the immediately preceding stage after CC had already written `cc-report.md`.*

If the expected artifact exists but `CURRENT.md` reflects the immediately preceding stage, the receiving reviewer may reconcile the pointer only when repository evidence is unambiguous. The reviewer must record the process deviation in the relevant review file. Any other state mismatch requires stopping and asking Róbert rather than guessing.

This recovery is deliberately narrow. It must never be used to:
- skip required artifacts;
- infer state solely from chat history;
- jump across multiple stages;
- replace a missing review or verdict;
- silently repair ambiguous workflow state.

Jonesy and Ripley are the roles most likely to hit this during a handoff (reading `CURRENT.md` right after "CC búinn" or similar) — apply it there, and nowhere looser.

## Role routing

Shorthand commands are interpreted by the agent/session receiving them in its assigned role for this workflow — not inferred from session or application identity.

- Ripley commands must be sent to the Ripley session.
- Jonesy commands must be sent to the Jonesy session.
- `Prompt approved` must be sent to the Claude Code execution session.
- An agent must not redirect Róbert to "send this to" the same role/session he is already addressing.
- If the receiving session's role is genuinely unclear, it must state the ambiguity before modifying any workflow file — never guess and proceed.

Role is assigned per workflow/session, not inferred solely from the application name. For example, a Codex Desktop session is not automatically Ripley just because it runs Codex Desktop — the same caution applies to any other application. Two sessions of the same product can hold different roles, and the same role can run in different products.

## Roles

**Róbert — Project owner.** Chooses the ticket/task, triggers stage transitions with short commands, is the explicit handoff between agents, may override recommendations, controls commit/push permission, remains final human authority.

**Ripley — Prompt designer and final assessor.** Before implementation: reviews the ticket against current project context and prior decisions, checks staleness, creates the initial prompt (scope, constraints, acceptance criteria, validation, tests, STOP conditions). During review: acts only when told `Jonesy búinn að reviewa prompt`; on `REVISE`, incorporates feedback into a new prompt round; on `APPROVED`, **must** create `approved-prompt-vN.md` and set `CURRENT.md → READY_FOR_CC` — recognizing approval is not sufficient, the file and the stage update are required actions. After CC: acts when told `Jonesy búinn að reviewa CC`, performs the final assessment (`PASS` / `REVISE` / `BLOCKED`). When execution access is available, Ripley should independently rerun the most relevant targeted or high-risk tests before returning the final verdict — Ripley does not need to duplicate every validation command CC already ran when the risk does not justify it, but any command not independently rerun must remain attributed to CC's report, not restated as Ripley's own finding.

**Jonesy — Technical peer reviewer.** Two separate responsibilities, never overlapping with implementation:
- *Prompt review* — checks for architectural gaps, hidden dependencies, repo-specific conflicts, unsafe assumptions, unclear scope, missing acceptance criteria/tests/validation, incomplete STOP rules, contradictions with prior decisions. Verdict: `APPROVED` or `REVISE`.
- *Result review* — checks CC's execution against the approved prompt: scope compliance, completeness, tests, validation, STOP-condition compliance, deviations, unresolved risks. Verdict: `PASS` / `REVISE` / `BLOCKED`.

Jonesy must never implement anything during either review.

**Claude Code (CC) — Execution layer.** Consumes only the prompt approved by Jonesy and referenced by `CURRENT.md`. Audits, implements, tests, validates. Obeys STOP conditions. Never participates in prompt-design discussion, never executes `prompt-review.md`. Defaults to no commit / no push. CC owns the full `CURRENT.md` lifecycle for its part of the workflow — see "CC's required `CURRENT.md` transitions" below; producing `cc-report.md` alone is not a complete handoff.

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
    -> CC verifies CURRENT.md is READY_FOR_CC, sets CURRENT.md -> CC_IN_PROGRESS
    -> CC audits/implements/tests/validates, writes cc-report.md
    -> CC populates the CC report path and sets CURRENT.md -> CC_COMPLETE
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
| `Prompt approved` | Claude Code | Verify CURRENT.md is READY_FOR_CC. Set CURRENT.md -> CC_IN_PROGRESS. Execute only the approved prompt referenced by CURRENT.md. Do not commit. Do not push. Write cc-report.md, populate the CC report path in CURRENT.md, and set CURRENT.md -> CC_COMPLETE. |
| `CC búinn` | Jonesy | Read approved prompt + cc-report.md. Review CC's execution. Do not implement. Write result-review.md. |
| `Jonesy búinn að reviewa CC` | Ripley | Read approved prompt + cc-report.md + Jonesy's result review. Perform final assessment. Return PASS/REVISE/BLOCKED. |

### CC's required `CURRENT.md` transitions

*Added after the Ticket 390 pilot, where CC wrote `cc-report.md` but left `CURRENT.md` on the preceding stage.* Every `Prompt approved` execution requires CC to, in order:

1. verify `CURRENT.md` is at `READY_FOR_CC`;
2. set `CURRENT.md → CC_IN_PROGRESS` before implementation begins;
3. execute only the approved prompt referenced by `CURRENT.md`;
4. write `cc-report.md` after implementation and validation;
5. populate the CC report path in `CURRENT.md`;
6. set `CURRENT.md → CC_COMPLETE` after writing the report.

> Writing `cc-report.md` without updating `CURRENT.md` to `CC_COMPLETE` is an incomplete handoff.

## Locating `result-review.md`

*Added after a session guessed a machine-specific path instead of resolving `result-review.md` from `CURRENT.md`.*

- The `Result review:` field in `docs/ai/CURRENT.md` is the authoritative path for the active task — never guess it, and never ask Róbert for a path already recorded there.
- The path is always resolved relative to the repository root, never as a machine-specific absolute path.
- The default pattern is `docs/ai/tasks/<ticket-id>/result-review.md`.
- On `Jonesy búinn að reviewa CC`, Ripley reads that file, performs the final assessment, appends the assessment to it, and sets `CURRENT.md` accordingly: `CLOSED` on `PASS`, `READY_FOR_CC` on `REVISE` (new prompt iteration), or `BLOCKED`.
- If a session is not already rooted at the repository, it must locate the repository root first — this is a session-setup problem, not a reason to ask for a path `CURRENT.md` already records.

## Canonical stages

`PROMPT_DRAFT`, `PROMPT_REVIEW`, `READY_FOR_CC`, `CC_IN_PROGRESS`, `CC_COMPLETE`, `RESULT_REVIEW`, `CLOSED`, `CANCELLED`, `BLOCKED`.

`CANCELLED` is set by Róbert when a task is deliberately abandoned (not a technical blocker — that's `BLOCKED`). Do not introduce stages beyond this list.

## After CLOSED — human-controlled completion

Once Ripley returns `PASS` and sets `CURRENT.md → CLOSED`, everything that follows is Róbert's decision alone — no agent performs any of it automatically:

1. Ripley returns `PASS` and sets `CURRENT.md → CLOSED`.
2. Róbert reviews the implementation and the task's full audit history in `docs/ai/tasks/<task-id>/`.
3. Róbert commits the implementation together with the corresponding `docs/ai/tasks/<task-id>/` workflow history.
4. Róbert pushes manually.
5. After the push, Róbert may instruct Ripley to close the corresponding GitHub issue.

The existing git-safety rule still applies without exception: agents must not commit or push without Róbert's explicit permission. GitHub issue closure is never automatic — it happens only on Róbert's explicit instruction, and only after the push.

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
