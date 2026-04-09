# Retro Agent — Best Practices (CampCast)

Use this when briefing a retro subagent after a feature is shipped.

---

## When to run

After a feature is committed and pushed. Triggered manually by the user at the end of a session.

---

## What to do

### 1. Read existing files first — always

Before writing anything, read:

- `notes.md`
- `skills/feature-agent.md`
- `skills/test-agent.md`

Never overwrite or restructure content that already exists. Append or refine only.

### 2. Write a retro entry in notes.md

Append a dated entry covering:

- What was built (issue number, files changed, tests added)
- What went well (patterns, agent behaviour, security approach)
- What was missed or caused friction
- Suggestions for improving CLAUDE.md, conventions, or agent skill files

Keep it factual and concise — this is a log, not an essay.

### 3. Update skill files only if there are genuine gaps

- **skills/feature-agent.md** — add only if today revealed a pattern not already documented
- **skills/test-agent.md** — add only if today revealed a testing pattern not already documented
- Do not pad or restate what is already there

### 4. Create new skill files if a new agent type was used

If a new kind of agent was used, create `skills/{agent-type}.md` documenting best practices.

---

## What NOT to do

- Do not rewrite or restructure existing skill files
- Do not add suggestions already documented
- Do not touch source code
- Do not run git operations — the user commits and pushes

---

## Report back

- Which files were updated and what was added
- Any suggestions too uncertain to add (flag for user to decide)
