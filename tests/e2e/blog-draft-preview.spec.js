import { test, expect } from "@playwright/test";

// Stub all /api/* calls that fire from App-level hooks (useForecast, useCampsites, useMe, etc.)
// so the tests don't depend on a real backend. The specific /api/admin handler is
// registered per-test and takes precedence because Playwright evaluates routes last-in/first-out.
async function stubAppBootstrapApis(page) {
  await page.route("**/api/**", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: "{}" })
  );
}

test.describe("BlogPostPage — draft preview access control", () => {
  test.beforeEach(async ({ page }) => {
    await stubAppBootstrapApis(page);
  });

  test("non-admin visiting a draft slug sees not-found UI, no draft banner", async ({ page }) => {
    const slug = "my-unpublished-draft";

    // Published lookup → 404; draft fallback → 403 (not an admin)
    await page.route("**/api/admin**", (route) => {
      const url = route.request().url();
      if (url.includes("preview=draft")) {
        route.fulfill({
          status: 403,
          contentType: "application/json",
          body: JSON.stringify({ ok: false, error: "Forbidden" }),
        });
      } else {
        route.fulfill({
          status: 404,
          contentType: "application/json",
          body: JSON.stringify({ ok: false, error: "Not found" }),
        });
      }
    });

    await page.goto(`/blog/${slug}`);

    // Not-found UI must be shown
    await expect(page.getByRole("heading", { name: /article not found/i })).toBeVisible();

    // Draft banner must not appear — 403 means no draft data was received
    await expect(page.getByText(/draft preview/i)).not.toBeVisible();
  });

  test("published post renders title correctly, no draft banner shown", async ({ page }) => {
    const slug = "best-campsites-iceland-summer";

    await page.route("**/api/admin**", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          ok: true,
          post: {
            id: 1,
            slug,
            title: "Best Campsites in Iceland for Summer",
            excerpt: "Top picks for camping in Iceland this summer.",
            content: "## Introduction\n\nIceland is stunning in summer.",
            status: "published",
            publishedAt: "2025-06-01T00:00:00.000Z",
            coverImage: "",
            ctaHint: "",
            metaTitle: "",
            metaDescription: "",
          },
        }),
      })
    );

    await page.goto(`/blog/${slug}`);

    // Post title must be visible
    await expect(
      page.getByRole("heading", { name: "Best Campsites in Iceland for Summer", level: 1 })
    ).toBeVisible();

    // Draft banner must not appear for a published post
    await expect(page.getByText(/draft preview/i)).not.toBeVisible();
  });
});
