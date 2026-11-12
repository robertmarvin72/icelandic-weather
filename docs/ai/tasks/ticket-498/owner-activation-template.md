# ⚠️ TEMPLATE — NOT AN AUTHORIZATION ⚠️

**This file is a blank form, prepared 2026-11-12 by CC per the
approved `activation-prep` prompt (AP6). It authorizes nothing by
existing. Every field below is empty and is never filled in by CC —
only the owner (Róbert) fills this in, on the actual date of a real
decision, and only once they have read `activation-plan.md` and
`activation-checklist.md` in full.**

The real, dated, owner-signed activation record — once it exists —
belongs in a **new** file, e.g.
`docs/ai/tasks/ticket-498/owner-authorisation.md` (same naming
pattern as `ticket-493-endpoint-acquisition/owner-authorisation.md`),
**never this template file itself** (this one stays blank, as the
reusable form). `"Prompt approved"` on any `#498` prompt — this one
included — does **not** constitute or imply this record; per NT1,
only a separate, explicit, dated statement naming the exact files,
exact hook command, backup path, and test-count/time/byte limits
counts.

---

## Owner decision record (blank — fill in only on the real activation date)

**Date:** _______________
**Name:** _______________
**I have read:** `activation-plan.md` ☐ `activation-checklist.md` ☐
`dedup-rules-addendum-1.md`/`-2.md`/`-3.md` ☐

### Per-surface approval (each may be approved independently — approving one does not approve the others)

- ☐ **Claude Code CLI hooks** (`.claude/settings.local.json`) — approved for activation via `apply_config_patch.py claude apply --apply --python-exe "<path>"`.
- ☐ **Codex CLI chain** (`~/.codex/config.toml`) — approved for activation via `apply_config_patch.py codex apply --apply --python-exe "<path>"`.
- ☐ **Codex desktop app** — no separate config (shares the CLI's entry); approved to observe per AC-8 once the above is active.
- ☐ **Claude Code VSCode** — no separate config (shares the CLI's own `.claude/settings.local.json`); approved to observe per AC-9.
- ☐ **ntfy / iPhone** — approved ONLY if one path below is also checked:
  - ☐ Paid/reserved ntfy.sh topic (owner's own account/billing decision — CC makes no price/terms claim; see `activation-plan.md`)
  - ☐ Self-hosted ntfy server (out of scope for this feature as built; requires its own separate task)
  - ☐ Windows-only for now — iPhone stays `NOT_ACTIVATED`, revisit later

### Exact files this record authorizes touching (fill in real paths — never left as the placeholder text below in a REAL filled-in record)

- Claude settings file (real path): _______________
- Codex config file (real path): _______________
- Backup directory/convention accepted: _______________ (default: sibling `.bak-<UTC timestamp>`, as `apply_config_patch.py` already creates)

### Exact hook/notify command approved (as it will actually appear in the config — copy from the real `plan` output, not retyped)

```
(paste the exact command here on the real activation date)
```

### Test-count / time / byte limits for this activation window

- Max ntfy test calls (AC-10, both unauthenticated-rejection and authenticated): _______
- Max elapsed time for this activation session: _______
- Max request/response bytes per ntfy call: _______

### ntfy secret input (if ntfy approved above)

The token is entered via **hidden interactive input on the owner's
own machine** at activation time — never typed into chat, never
passed as a command-line argument, never committed to a tracked
file, and never left in shell history. `secret_store.write_secret_file()`
(DPAPI, current-user scope) is the only place it is written, and only
returns a boolean success/failure — never echoes the value back.

### Signature

By filling in the fields above with today's real date and my name, I
confirm I am authorizing exactly the surfaces checked above, exactly
the files and commands named above, within the limits stated above —
and nothing beyond that. This record does not authorize any future
change to this feature; a new round requires its own new record.

**Signed:** _______________ **Date:** _______________

---

## Status of this file right now

`PREPARED_NOT_ACTIVATED`. No field above has been filled in. No
command referenced above has been run by CC. `#498` remains open.
