# UI Test Agent — Playwright Best Practices (CampCast)

Use this when briefing a UI test subagent to write or run Playwright end-to-end tests for this repo.

---

## Stack

- **Playwright** (`@playwright/test`) — Chromium only for now
- Test files: `tests/e2e/**/*.spec.js`
- Config: `playwright.config.js` — baseURL `http://localhost:5173`, screenshots on failure
- Run: `npm run test:e2e`
- The `webServer` block in config starts Vite automatically if it is not already running; `reuseExistingServer` is enabled locally so a running `npm run dev` is reused

---

## Key patterns

### Route interception (preferred over real API calls)

Playwright intercepts network at the browser level with `page.route()`. Use this instead of running
a real backend:

```js
// Broad stub registered first — catches all /api/* calls from App-level hooks
await page.route("**/api/**", (route) =>
  route.fulfill({ status: 200, contentType: "application/json", body: "{}" })
);

// Specific stub registered after — takes precedence (last-in/first-out evaluation)
await page.route("**/api/admin**", (route) => {
  const url = route.request().url();
  if (url.includes("preview=draft")) {
    route.fulfill({ status: 403, ... });
  } else {
    route.fulfill({ status: 404, ... });
  }
});
```

**Rule:** Register broad catch-all stubs first in `beforeEach`, then per-test specific stubs.
Playwright evaluates routes in reverse registration order (newest wins).

### Bootstrap stub helper

App-level hooks (`useForecast`, `useCampsites`, `useMe`, etc.) fire on every page load even for
non-home routes. Always suppress them in `beforeEach` to avoid noise:

```js
async function stubAppBootstrapApis(page) {
  await page.route("**/api/**", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: "{}" })
  );
}

test.beforeEach(async ({ page }) => {
  await stubAppBootstrapApis(page);
});
```

### Assertions

Prefer role-based selectors — they survive class/markup refactors:

```js
await expect(page.getByRole("heading", { name: /article not found/i })).toBeVisible();
await expect(page.getByText(/draft preview/i)).not.toBeVisible();
```

Use `level` on `getByRole("heading", ...)` when the heading level matters for SEO assertions.

---

## What the test agent should do

### 1. Review the component before writing tests

Read the page component and identify:
- Which API endpoints it fetches
- What HTTP status codes drive each UI branch (404 → not-found, 403 → no data leak, 200 → happy path)
- What text/roles uniquely identify each branch in the DOM

### 2. Cover the three standard cases per feature

| Case | API stub | Expected UI |
|------|----------|-------------|
| Happy path | 200 with real-shaped data | Content renders, no error state |
| Auth-gated (non-admin) | 403 on sensitive endpoint | Generic fallback, no sensitive data |
| Not found | 404 | Not-found heading, no content |

### 3. Assert absence of sensitive UI

For access-control tests, always assert that the protected element is **not** visible — not just that
the fallback is visible. Example: `expect(page.getByText(/draft preview/i)).not.toBeVisible()`.

### 4. Run the suite before and after

```bash
npm run test:e2e
```

Report: total tests, pass/fail count. A regression in existing tests is a blocker.

---

## Common pitfalls

- **Route order matters:** Broad stubs in `beforeEach`, specific stubs per-test. If the order is
  reversed, the catch-all swallows the specific stub.
- **`**/api/**` glob vs `**/api/admin**`:** The `**` prefix matches any protocol/host.
  `**/api/admin**` matches `http://localhost:5173/api/admin?action=...`.
- **`webServer` reuse:** Locally, Playwright reuses a running `npm run dev` process. In CI it
  starts one fresh. Do not hardcode ports or assume a specific startup order.
- **App-level hooks fire on every route:** Even `/blog/:slug` triggers `useForecast`, `useMe`, etc.
  Stub them all to avoid flaky network errors that mask the real assertion.
- **`not.toBeVisible()` vs `not.toBeAttached()`:** Use `not.toBeVisible()` unless you specifically
  need to assert the element is absent from the DOM entirely.

---

## Relationship to Vitest tests

Vitest (`*.test.js` / `*.test.jsx`) covers unit and component logic.
Playwright (`tests/e2e/**/*.spec.js`) covers real browser rendering and route interception.
They are complementary — do not replace one with the other.
