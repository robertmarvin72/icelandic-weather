// src/pages/BlogPostPage.test.jsx
import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import BlogPostPage from "./BlogPostPage";

// Stub heavy child components so tests stay fast
vi.mock("../components/Header", () => ({
  default: () => <div data-testid="header" />,
}));

vi.mock("../components/Footer", () => ({
  default: () => <div data-testid="footer" />,
}));

vi.mock("../components/blog/BlogPostCta", () => ({
  default: () => <div data-testid="blog-post-cta" />,
}));

// react-helmet-async HelmetProvider is not present in tests; stub Helmet to avoid warnings
vi.mock("react-helmet-async", () => ({
  Helmet: ({ children }) => <>{children}</>,
  HelmetProvider: ({ children }) => <>{children}</>,
}));

// A minimal translation function used by the component
function t(key) {
  const map = {
    backToBlog: "Back to blog",
    blogDraftPreviewBanner: "Draft preview — this post is not published.",
    blogPublishedLabel: "Published",
    blogPostNotFoundTitle: "Article not found",
    blogPostNotFoundText: "The article you tried to open does not exist or may have been removed.",
  };
  return map[key] ?? key;
}

function makePublishedPost(overrides = {}) {
  return {
    id: 1,
    slug: "test-post",
    title: "Test Post Title",
    excerpt: "A short excerpt.",
    content: "## Hello\n\nSome content here.",
    metaTitle: "Test Post Title | CampCast",
    metaDescription: "A short excerpt.",
    coverImage: "",
    ctaHint: "",
    status: "published",
    publishedAt: "2025-06-01T00:00:00Z",
    createdAt: "2025-06-01T00:00:00Z",
    updatedAt: "2025-06-01T00:00:00Z",
    ...overrides,
  };
}

function renderPage(slug = "test-post") {
  return render(
    <MemoryRouter initialEntries={[`/blog/${slug}`]}>
      <Routes>
        <Route
          path="/blog/:slug"
          element={<BlogPostPage t={t} lang="en" theme="dark" />}
        />
      </Routes>
    </MemoryRouter>
  );
}

describe("BlogPostPage", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders a published post without a draft banner", async () => {
    const post = makePublishedPost();

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ ok: true, post }),
      })
    );

    renderPage("test-post");

    await waitFor(() => {
      expect(screen.getByText("Test Post Title")).toBeInTheDocument();
    });

    expect(screen.queryByText(/Draft preview/i)).not.toBeInTheDocument();
    expect(screen.getByText("A short excerpt.")).toBeInTheDocument();

    // Published date label should be visible for a published post
    expect(screen.getByText(/Published/i)).toBeInTheDocument();

    // fetch should have been called once (published path, no fallback)
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch.mock.calls[0][0]).toContain("getPublishedBlogPostBySlug");
    expect(fetch.mock.calls[0][0]).not.toContain("preview=draft");
  });

  it("renders a draft post with the draft banner when admin fetch succeeds", async () => {
    const draftPost = makePublishedPost({ status: "draft", publishedAt: null });

    const fetchMock = vi
      .fn()
      // First call: published lookup → 404
      .mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ ok: false, error: "Blog post not found" }),
      })
      // Second call: draft preview → 200
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ ok: true, post: draftPost }),
      });

    vi.stubGlobal("fetch", fetchMock);

    renderPage("draft-slug");

    await waitFor(() => {
      expect(screen.getByText("Test Post Title")).toBeInTheDocument();
    });

    // Draft banner must be visible
    expect(
      screen.getByText(/Draft preview — this post is not published\./i)
    ).toBeInTheDocument();

    // Published date label must NOT appear for a draft (the label is "Published {date}")
    // Note: the banner itself contains "not published" — we match the standalone label
    expect(screen.queryByText(/^Published\s/i)).not.toBeInTheDocument();

    // Fetch should have been called twice; second call includes preview=draft
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1][0]).toContain("preview=draft");
    // Second fetch must include credentials
    expect(fetchMock.mock.calls[1][1]).toMatchObject({ credentials: "include" });
  });

  it("shows not-found UI when draft fetch returns 403 (non-admin), without leaking draft content", async () => {
    const fetchMock = vi
      .fn()
      // First call: published lookup → 404
      .mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ ok: false, error: "Blog post not found" }),
      })
      // Second call: draft preview → 403 (not admin)
      .mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({ ok: false, error: "Forbidden" }),
      });

    vi.stubGlobal("fetch", fetchMock);

    renderPage("secret-draft");

    await waitFor(() => {
      expect(screen.getByText(/Article not found/i)).toBeInTheDocument();
    });

    // No draft content or banner must leak through
    expect(screen.queryByText(/Draft preview/i)).not.toBeInTheDocument();

    // No error message (silent 403 — not-found without detail)
    expect(
      screen.queryByText("The article you tried to open does not exist or may have been removed.")
    ).toBeInTheDocument();

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
