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
vi.mock("@vercel/blob", () => ({ head: vi.fn() }));

import { getMeFromRequest } from "./_lib/getMe.js";
import { head } from "@vercel/blob";
import handler from "./admin.js";

const ADMIN_EMAIL = "admin@example.com";

function makeReq(body) {
  return { method: "POST", body, query: {} };
}

function makeRes() {
  return {
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
}

function makeHeadResult(overrides = {}) {
  return {
    url: "https://abc123.public.blob.vercel-storage.com/blog-media/photo-x1y2z3.jpg",
    downloadUrl: "https://abc123.public.blob.vercel-storage.com/blog-media/photo-x1y2z3.jpg?download=1",
    pathname: "blog-media/photo-x1y2z3.jpg",
    contentType: "image/jpeg",
    contentDisposition: "inline",
    size: 12345,
    uploadedAt: new Date("2026-01-01"),
    cacheControl: "public, max-age=31536000",
    etag: "abc",
    ...overrides,
  };
}

function makeMediaRow(overrides = {}) {
  return {
    id: "media-1",
    blog_post_id: null,
    storage_key: "blog-media/photo-x1y2z3.jpg",
    public_url: "https://abc123.public.blob.vercel-storage.com/blog-media/photo-x1y2z3.jpg",
    original_filename: "photo.jpg",
    mime_type: "image/jpeg",
    file_size_bytes: 12345,
    width: null,
    height: null,
    alt_text: "",
    caption: null,
    status: "active",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  sqlQueue.responses = [];
  sqlQueue.idx = 0;
  process.env.ADMIN_EMAILS = ADMIN_EMAIL;
});

describe("createBlogMedia — auth guard", () => {
  it("rejects a non-admin with 403", async () => {
    getMeFromRequest.mockResolvedValue({ user: { email: "not-admin@example.com" } });
    const req = makeReq({ action: "createBlogMedia", url: "https://x.blob.vercel-storage.com/blog-media/a.jpg" });
    const res = makeRes();
    await handler(req, res);
    expect(res.statusCode).toBe(403);
    expect(head).not.toHaveBeenCalled();
  });
});

describe("createBlogMedia — validation", () => {
  beforeEach(() => {
    getMeFromRequest.mockResolvedValue({ user: { email: ADMIN_EMAIL } });
  });

  it("rejects a missing url", async () => {
    const req = makeReq({ action: "createBlogMedia" });
    const res = makeRes();
    await handler(req, res);
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/url/i);
  });
});

describe("createBlogMedia — untrusted client metadata is not accepted as-is", () => {
  beforeEach(() => {
    getMeFromRequest.mockResolvedValue({ user: { email: ADMIN_EMAIL } });
  });

  it("rejects a url that head() can't find in our store (forged/external URL)", async () => {
    head.mockRejectedValueOnce(new Error("The requested blob does not exist"));

    const req = makeReq({
      action: "createBlogMedia",
      url: "https://evil.example.com/not-our-blob.jpg",
    });
    const res = makeRes();
    await handler(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/not found|inaccessible/i);
  });

  it("rejects a real blob asset outside the blog-media/ namespace", async () => {
    head.mockResolvedValueOnce(makeHeadResult({ pathname: "some-other-namespace/x.jpg" }));

    const req = makeReq({
      action: "createBlogMedia",
      url: "https://abc123.public.blob.vercel-storage.com/some-other-namespace/x.jpg",
    });
    const res = makeRes();
    await handler(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/namespace/i);
  });

  it("rejects an asset whose real content type is not an allowed image type", async () => {
    head.mockResolvedValueOnce(makeHeadResult({ contentType: "application/pdf", pathname: "blog-media/doc.pdf" }));

    const req = makeReq({
      action: "createBlogMedia",
      url: "https://abc123.public.blob.vercel-storage.com/blog-media/doc.pdf",
    });
    const res = makeRes();
    await handler(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/content type/i);
  });

  it("persists head()'s own size/contentType, ignoring any client-supplied mimeType/fileSizeBytes in the payload", async () => {
    head.mockResolvedValueOnce(makeHeadResult({ contentType: "image/png", size: 999 }));
    sqlQueue.responses = [[makeMediaRow({ mime_type: "image/png", file_size_bytes: 999 })]];

    const req = makeReq({
      action: "createBlogMedia",
      url: "https://abc123.public.blob.vercel-storage.com/blog-media/photo-x1y2z3.jpg",
      // Forged/irrelevant client-supplied fields — must be ignored, not persisted.
      mimeType: "application/x-forged",
      fileSizeBytes: 1,
    });
    const res = makeRes();
    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.media.mimeType).toBe("image/png");
    expect(res.body.media.fileSizeBytes).toBe(999);
  });
});

describe("createBlogMedia — valid create", () => {
  beforeEach(() => {
    getMeFromRequest.mockResolvedValue({ user: { email: ADMIN_EMAIL } });
  });

  it("persists media with blog_post_id = null for a pre-save upload", async () => {
    head.mockResolvedValueOnce(makeHeadResult());
    sqlQueue.responses = [[makeMediaRow({ blog_post_id: null })]];

    const req = makeReq({
      action: "createBlogMedia",
      url: "https://abc123.public.blob.vercel-storage.com/blog-media/photo-x1y2z3.jpg",
      originalFilename: "photo.jpg",
    });
    const res = makeRes();
    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.media.blogPostId).toBeNull();
    expect(res.body.media.status).toBe("active");
  });

  it("persists media with a real blog_post_id when provided", async () => {
    head.mockResolvedValueOnce(makeHeadResult());
    sqlQueue.responses = [[makeMediaRow({ blog_post_id: "post-42" })]];

    const req = makeReq({
      action: "createBlogMedia",
      url: "https://abc123.public.blob.vercel-storage.com/blog-media/photo-x1y2z3.jpg",
      blogPostId: "post-42",
    });
    const res = makeRes();
    await handler(req, res);

    expect(res.body.media.blogPostId).toBe("post-42");
  });
});

describe("generateDraft/updateBlogPost — unaffected regression check", () => {
  it("unrelated action still dispatches normally", async () => {
    getMeFromRequest.mockResolvedValue({ user: { email: ADMIN_EMAIL } });
    const req = makeReq({ action: "notARealAction" });
    const res = makeRes();
    await handler(req, res);
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe("Unknown action");
    expect(head).not.toHaveBeenCalled();
  });
});
