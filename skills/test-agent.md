# Test Agent — Best Practices (CampCast)

Use this when briefing a test subagent to verify a feature in this repo.

---

## Stack

- **Vitest** + **@testing-library/react**
- Test files: `*.test.js` / `*.test.jsx` alongside the module they test
- Coverage configured for `src/utils/**/*.js` (but tests elsewhere are valid)
- Run: `npm test -- --run` (single pass, no watch)

## What the test agent should do

### 1. Code review first
Before writing tests, read the changed files and verify:
- The happy path works as described
- Edge cases are handled (null dates, missing fields, 403 vs 404 distinctions)
- No security regressions (e.g. draft data not leaked on 403)

### 2. Check vitest config
If adding `.jsx` test files for the first time in a directory, verify `vitest.config.js`:
- `@vitejs/plugin-react` must be included as a plugin for JSX transform to work
- `include` glob must cover `*.test.jsx` and `*.spec.jsx`
- Fix config issues before writing tests, not after.

### 3. Write meaningful tests — not trivial ones
Prefer render-level tests (mount the component, assert on the DOM) over pure unit tests for page components. Mock `fetch` globally with `vi.fn()`.

**For each feature, cover at minimum:**
- Happy path (data loads and renders)
- Auth-gated path (e.g. 403 → shows generic not-found, no sensitive info leaked)
- Not-found path (404 → correct fallback UI)

**Example mock pattern:**
```js
vi.stubGlobal("fetch", vi.fn());
fetch.mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ ok: true, post }) });
```

### 4. Run all tests, not just new ones
Always run the full suite (`npm test -- --run`) and report the total count. A regression in existing tests is a blocker.

## What to report back

- Code review findings (issues found, confirmed correct)
- Whether existing tests passed (count)
- New tests written (file, case names)
- Any config fixes made and why
- Final pass/fail count

## Common pitfalls

- **JSX in test files**: requires `@vitejs/plugin-react` in vitest config — check before adding `.jsx` tests.
- **`fetch` not defined in jsdom**: use `vi.stubGlobal("fetch", vi.fn())` in `beforeEach`.
- **Null `publishedAt` for drafts**: test that the published date is absent in draft render, not that it renders `Invalid Date`.
- **`credentials: "include"`**: assert the second (draft fallback) fetch was called with this option to confirm the auth cookie is sent.
