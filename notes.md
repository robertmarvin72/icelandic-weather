# Project Notes

---

## 2026-04-09 — Retro: Issue #221 (Draft Preview + Preview Button)

### What was built
- **Issue #221**: Draft blog posts accessible via `/blog/:slug?preview=draft`, admin-only (server-side guard via `requireAdmin`). Non-admins see generic not-found UI — draft existence not leaked.
- **Preview button**: Added to `BlogEditorCard` in `AdminDashboard.jsx`, opens draft URL in new tab, i18n-aware (EN/IS), only shown when `post.status === "draft"`.
- **Tests**: 3 new tests in `src/pages/BlogPostPage.test.jsx` covering published, draft-admin, and draft-non-admin cases. `vitest.config.js` updated to support `.jsx` test files.
- **Translations**: `blogDraftPreviewBanner` and `blogPreviewButton` keys added to both `en` and `is`.

### What went well

**Subagent pattern (Plan → Code → Test)**
- Clean separation of concerns. The plan agent explored the codebase independently and produced an accurate, detailed spec (correct file paths, correct helper names, correct SQL pattern). The code agent followed it without drift. The test agent caught the missing `vitest.config.js` JSX support and fixed it autonomously.
- Security analysis happened at the planning stage, not retrofitted — the "don't leak draft existence on 403" requirement was identified before a line of code was written.

**CLAUDE.md constraints**
- The `No git operations` constraint (original) correctly blocked an inappropriate push attempt. When the constraint was updated to allow staging/committing (but not pushing), the agent respected the new scope immediately.

**Test coverage**
- The test agent wrote meaningful integration-style tests (mocked fetch, real component render) rather than trivial unit tests. All 65 tests passed on first run.

**Security approach**
- Admin gate is entirely server-side. The two-step fetch pattern (published first, draft fallback only on 404) avoids leaking draft existence to unauthenticated clients.

### What could be improved

**`gh` CLI not installed**
- Issue details had to be fetched via `WebFetch` (unauthenticated GitHub HTML), which is fragile and loses comments/labels. Installing `gh` CLI in the dev environment would make issue lookup reliable and allow closing issues on merge.

**Preview button was out of initial scope**
- The plan agent and code agent implemented the API + BlogPostPage correctly, but neither flagged that the admin UI had no way to reach the new URL. The preview button was a follow-up request. A future planning step should ask: "Is there a UI entrypoint for this feature?"

**Terminal paste visibility**
- The `claude --model haiku` git command was typed into the prompt, meaning commit messages and commands were visible in conversation history. For repos with sensitive branch names or commit conventions, this is fine — but worth noting that `!` prefix in the Claude Code prompt runs commands in-session and keeps output in context.

### Suggestions for rules / conventions

- Add `gh` CLI to dev setup instructions in CLAUDE.md or README.
- Add a planning checklist item: "Does the feature need a UI entrypoint?" to catch missing admin/navigation affordances earlier.
- Consider adding `skills/` to `.gitignore` if these files are personal workflow notes rather than project docs.
