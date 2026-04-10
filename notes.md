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

---

## 2026-04-10 — Retro: #232 + #233 (Scoring precision) + Playwright e2e setup

### What was built

- **#232**: Rounded `rain`, `wind`, `gust`, and `tmax` to 1 decimal in `scoreSiteDay()` so the scoring engine evaluates exactly what the user sees in the forecast table. Added 63-line test coverage in `src/lib/scoring.test.js`.
- **#233**: Fixed `MapView.jsx` to use `normalizeDailyToScoreInput` (same pipeline as `ForecastTable`), eliminating score divergence between map pins and the table. Added gray pins for sites not yet loaded to replace misleading red (score-0) pins.
- **Playwright e2e**: Installed `@playwright/test`, added `playwright.config.js` (Chromium-only, `webServer` block), wrote `tests/e2e/blog-draft-preview.spec.js` covering non-admin draft access and published post rendering. Added `test:e2e` script to `package.json`. Created `skills/ui-test-agent.md`.

### What went well

**Tight, targeted fixes**
- Both #232 and #233 were minimal diffs (< 25 lines each) that solved real user-visible inconsistencies. No scope creep, no refactoring of unrelated code.

**UX improvement surfaced during a bug fix**
- The gray-pin change (#233) was not in the original issue but was the correct thing to do once the scoring alignment was understood. The fix revealed a UX gap (misleading red pins) and closed it in the same commit. Good pattern: bug fixes sometimes expose adjacent UX issues worth addressing immediately.

**Playwright setup was clean on first run**
- 2/2 tests passed without any config iteration. The `stubAppBootstrapApis` + per-test `page.route()` pattern worked correctly first time.

**`ui-test-agent.md` created proactively**
- The skill file was authored alongside the tests, capturing route-order gotchas while they were fresh. This avoids a future agent rediscovering the LIFO route evaluation behaviour from scratch.

### What could be improved

**#232 and #233 are conceptually one fix**
- Both address UI/engine scoring alignment and could have been a single commit. Two separate commits is fine for blame purposes, but the PR descriptions should cross-reference each other to make the connection clear.

**Scoring regression not caught by existing tests**
- The rounding issue (#232) was caught by manual comparison, not an existing test. The new tests now guard against this, but the gap existed for a while. Adding boundary-condition tests (e.g. value at exactly the penalty threshold) earlier would have caught this sooner.

### Suggestions for rules / conventions

- When a bug fix reveals an adjacent UX gap (e.g. misleading pins), fix it in the same commit if the change is small and self-contained — note it in the commit message.
- Cross-reference related issue numbers in commit messages when two fixes address the same root cause.

---

## 2026-04-10 — Retro: Footer Blog link + e2e test + doc updates

### What was built

- **CLAUDE.md**: Added `## Dev Setup` section near the top (`npm install`, `npx playwright install chromium`, `gh auth login`). Appended three convention rules (UI entrypoint check, adjacent UX gap fix policy, cross-reference commit rule).
- **skills/feature-agent.md**: Appended cross-reference rule to "What NOT to do".
- **Footer Blog link**: Added `blogNav: "Blog"` translation key to both `en` and `is` blocks in `translations.common.js`. Added Blog link to `Footer.jsx` between "About" and "Terms", linking to `/blog`, matching existing link styling.
- **Playwright e2e**: `tests/e2e/footer-blog-link.spec.js` — navigates to `/`, waits for Splash to clear, asserts Blog link visible, clicks, asserts URL `/blog`.
- **skills/ui-test-agent.md**: Appended "Simple nav link pattern" section.

### What went well

**Footer change was clean and minimal**
- Three-file change (Footer, translations ×2 language blocks) with no ambiguity. Translation key placed adjacent to other footer keys in both blocks.

**Retro conventions from the previous session were applied immediately**
- The CLAUDE.md convention additions (`< 25 lines UX gap fix`, `cross-reference issue numbers`) came directly from the prior retro suggestions — closing the loop in the same session.

**e2e test diagnosed Splash blocking correctly**
- The overlay intercept error was informative. The Splash-clearing root cause (needs `!loading && rowsLength > 0`) was traced correctly through `useBooting` → `useForecast` → `useCampsites`.

### What caused friction

**Campsites stub shape was wrong on first attempt**
- The stub returned a bare array; the hook expects `{ ok: true, campsites: [...], tier: "free" }`. Required reading `useCampsites.js` to find the contract. Cost two extra test runs (total 3 runs to green).
- This is a common trap: API stubs must match the hook's response parsing contract, not the raw endpoint output shape.

**`claude --model haiku` subagent can't commit non-interactively**
- Both times the subagent was invoked for git ops, it either got permissions blocked or asked for interactive confirmation. The user ended up running git commands manually each time. This pattern doesn't work without a TTY.

### Suggestions for rules / conventions

- Add a note to `skills/ui-test-agent.md` under the bootstrap stub section: stub shapes must match the hook's response parsing contract — check the hook source, not just the endpoint URL.
- The `claude --model haiku` git commit flow needs a `--yes` / non-interactive flag or an alternative approach. Consider documenting in `retro-agent.md` that git ops via subagent don't work without a TTY.
