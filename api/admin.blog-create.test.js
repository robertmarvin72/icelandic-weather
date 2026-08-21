// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

const sqlQueue = { responses: [], idx: 0 };

vi.mock("postgres", () => ({
  default: () => {
    const fn = async () => {
      const r = sqlQueue.responses[sqlQueue.idx] ?? [];
      sqlQueue.idx++;
      return r;
    };
    fn.json = (v) => v;
    return fn;
  },
}));

vi.mock("./_lib/getMe.js", () => ({ getMeFromRequest: vi.fn() }));
vi.mock("./_lib/buildBlogPrompt.js", () => ({ buildBlogPrompt: vi.fn(), BLOG_POST_TYPES: [] }));

import { getMeFromRequest } from "./_lib/getMe.js";
import handler from "./admin.js";

const ADMIN_EMAIL = "admin@example.com";

function makeReq(body) {
  return { method: "POST", body, query: {} };
}

function makeRes() {
  const res = {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
  return res;
}

function makeBlogRow(overrides = {}) {
  return {
    id: "post-1",
    slug: "my-manual-post",
    title: "My manual post",
    excerpt: "",
    content: "Hello world",
    meta_title: "My manual post",
    meta_description: "",
    cover_image: null,
    cta_hint: null,
    source_type: "manual",
    topic: null,
    cta_title: null,
    cta_text: null,
    cta_button: null,
    cta_target: null,
    nearby_highlights: null,
    nearby_attractions: null,
    status: "draft",
    published_at: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    language: "is",
    translation_group_id: "11111111-1111-1111-1111-111111111111",
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  sqlQueue.responses = [];
  sqlQueue.idx = 0;
  process.env.ADMIN_EMAILS = ADMIN_EMAIL;
});

describe("createBlogPost — auth guard", () => {
  it("rejects with 403 when the requester is not an admin", async () => {
    getMeFromRequest.mockResolvedValue({ user: { email: "not-admin@example.com" } });

    const req = makeReq({ action: "createBlogPost", title: "T", content: "C", language: "is" });
    const res = makeRes();
    await handler(req, res);

    expect(res.statusCode).toBe(403);
    expect(res.body.ok).toBe(false);
  });

  it("rejects with 403 when there is no session at all", async () => {
    getMeFromRequest.mockResolvedValue(null);

    const req = makeReq({ action: "createBlogPost", title: "T", content: "C", language: "is" });
    const res = makeRes();
    await handler(req, res);

    expect(res.statusCode).toBe(403);
  });
});

describe("createBlogPost — validation", () => {
  beforeEach(() => {
    getMeFromRequest.mockResolvedValue({ user: { email: ADMIN_EMAIL } });
  });

  it("rejects missing title", async () => {
    const req = makeReq({ action: "createBlogPost", content: "C", language: "is" });
    const res = makeRes();
    await handler(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/title/i);
  });

  it("rejects missing content", async () => {
    const req = makeReq({ action: "createBlogPost", title: "T", language: "is" });
    const res = makeRes();
    await handler(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/content/i);
  });

  it("rejects an invalid language", async () => {
    const req = makeReq({ action: "createBlogPost", title: "T", content: "C", language: "fr" });
    const res = makeRes();
    await handler(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/language/i);
    expect(res.body.allowedLanguages).toEqual(["is", "en"]);
  });

  it("rejects a missing language", async () => {
    const req = makeReq({ action: "createBlogPost", title: "T", content: "C" });
    const res = makeRes();
    await handler(req, res);

    expect(res.statusCode).toBe(400);
  });
});

describe("createBlogPost — valid create", () => {
  beforeEach(() => {
    getMeFromRequest.mockResolvedValue({ user: { email: ADMIN_EMAIL } });
  });

  it("creates a draft, single-language row with source_type='manual' and no counterpart insert", async () => {
    // deduplicateSlug's SELECT finds nothing, then the INSERT returns the new row.
    sqlQueue.responses = [[], [makeBlogRow()]];

    const req = makeReq({
      action: "createBlogPost",
      title: "My manual post",
      content: "Hello world",
      language: "is",
    });
    const res = makeRes();
    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.post.status).toBe("draft");
    expect(res.body.post.sourceType).toBe("manual");
    expect(res.body.post.language).toBe("is");
    // Exactly 2 sql calls: one SELECT (dedup check), one INSERT — no second
    // language row is ever attempted, unlike the generate flow.
    expect(sqlQueue.idx).toBe(2);
  });

  it("appends -2 to the slug when the base slug already exists (dedup reused from generate flow)", async () => {
    sqlQueue.responses = [
      [{ id: "existing" }], // first dedup check: taken
      [], // second dedup check (slug-2): free
      [makeBlogRow({ slug: "my-manual-post-2" })],
    ];

    const req = makeReq({
      action: "createBlogPost",
      title: "My manual post",
      content: "Hello world",
      language: "is",
    });
    const res = makeRes();
    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.post.slug).toBe("my-manual-post-2");
  });

  it("returns a fresh translation_group_id independent of any other post", async () => {
    sqlQueue.responses = [[], [makeBlogRow()]];

    const req = makeReq({
      action: "createBlogPost",
      title: "My manual post",
      content: "Hello world",
      language: "en",
    });
    const res = makeRes();
    await handler(req, res);

    expect(res.body.post.translationGroupId).toBeTruthy();
  });
});

describe("generateDraft — unaffected regression check", () => {
  it("unknown action still returns 400 (router registration didn't break existing dispatch)", async () => {
    getMeFromRequest.mockResolvedValue({ user: { email: ADMIN_EMAIL } });
    const req = makeReq({ action: "notARealAction" });
    const res = makeRes();
    await handler(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe("Unknown action");
  });
});
