// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

const capturedOptions = { current: null };

vi.mock("@vercel/blob/client", () => ({
  handleUpload: vi.fn(async (options) => {
    capturedOptions.current = options;
    return { type: "blob.generate-client-token", clientToken: "mock-token" };
  }),
}));

vi.mock("./_lib/getMe.js", () => ({ getMeFromRequest: vi.fn() }));

import { getMeFromRequest } from "./_lib/getMe.js";
import { handleUpload } from "@vercel/blob/client";
import handler from "./blog-upload.js";

const ADMIN_EMAIL = "admin@example.com";

function makeReq(body) {
  return { method: "POST", body, headers: {} };
}

function makeRes() {
  return {
    statusCode: 200,
    body: null,
    headers: {},
    setHeader(name, value) {
      this.headers[name] = value;
      return this;
    },
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

beforeEach(() => {
  vi.clearAllMocks();
  capturedOptions.current = null;
  process.env.ADMIN_EMAILS = ADMIN_EMAIL;
});

describe("blog-upload — method guard", () => {
  it("rejects non-POST requests", async () => {
    const res = makeRes();
    await handler({ method: "GET" }, res);
    expect(res.statusCode).toBe(405);
  });
});

describe("blog-upload — wiring", () => {
  it("passes request/body through to handleUpload and returns its response", async () => {
    getMeFromRequest.mockResolvedValue({ user: { email: ADMIN_EMAIL } });
    const req = makeReq({ type: "blob.generate-client-token", payload: {} });
    const res = makeRes();
    await handler(req, res);

    expect(handleUpload).toHaveBeenCalledOnce();
    expect(capturedOptions.current.body).toBe(req.body);
    expect(capturedOptions.current.request).toBe(req);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ type: "blob.generate-client-token", clientToken: "mock-token" });
  });

  it("does not pass an explicit token — relies on the SDK's own BLOB_READ_WRITE_TOKEN env default, never echoes a secret itself", async () => {
    getMeFromRequest.mockResolvedValue({ user: { email: ADMIN_EMAIL } });
    const req = makeReq({});
    const res = makeRes();
    await handler(req, res);

    expect(capturedOptions.current.token).toBeUndefined();
  });

  it("does not pass onUploadCompleted — blog_media is never persisted from the Vercel-infra callback in v1", async () => {
    getMeFromRequest.mockResolvedValue({ user: { email: ADMIN_EMAIL } });
    const req = makeReq({});
    const res = makeRes();
    await handler(req, res);

    expect(capturedOptions.current.onUploadCompleted).toBeUndefined();
  });
});

describe("blog-upload — onBeforeGenerateToken (browser trust boundary)", () => {
  it("throws Forbidden for a non-admin session — auth decision itself is exercised, not mocked away", async () => {
    getMeFromRequest.mockResolvedValue({ user: { email: "not-admin@example.com" } });
    const res = makeRes();
    await handler(makeReq({}), res);

    await expect(
      capturedOptions.current.onBeforeGenerateToken("blog-media/photo.jpg", null, false)
    ).rejects.toThrow("Forbidden");
  });

  it("throws Forbidden when there is no session at all", async () => {
    getMeFromRequest.mockResolvedValue(null);
    const res = makeRes();
    await handler(makeReq({}), res);

    await expect(
      capturedOptions.current.onBeforeGenerateToken("blog-media/photo.jpg", null, false)
    ).rejects.toThrow("Forbidden");
  });

  it("succeeds for an admin and returns the content-type/size constraints", async () => {
    getMeFromRequest.mockResolvedValue({ user: { email: ADMIN_EMAIL } });
    const res = makeRes();
    await handler(makeReq({}), res);

    const result = await capturedOptions.current.onBeforeGenerateToken("blog-media/photo.jpg", null, false);
    expect(result.allowedContentTypes).toEqual(["image/jpeg", "image/png", "image/webp"]);
    expect(result.maximumSizeInBytes).toBe(10 * 1024 * 1024);
    expect(result.addRandomSuffix).toBe(true);
  });

  it("rejects a pathname outside the blog-media/ namespace even for an admin", async () => {
    getMeFromRequest.mockResolvedValue({ user: { email: ADMIN_EMAIL } });
    const res = makeRes();
    await handler(makeReq({}), res);

    await expect(
      capturedOptions.current.onBeforeGenerateToken("other-namespace/photo.jpg", null, false)
    ).rejects.toThrow("Invalid upload pathname");
  });
});

describe("blog-upload — handleUpload dispatch error propagation", () => {
  it("maps a Forbidden throw to 403", async () => {
    handleUpload.mockImplementationOnce(async () => {
      throw new Error("Forbidden");
    });
    const res = makeRes();
    await handler(makeReq({}), res);
    expect(res.statusCode).toBe(403);
  });

  it("maps other thrown errors (e.g. invalid pathname, SDK signature failure) to 400", async () => {
    handleUpload.mockImplementationOnce(async () => {
      throw new Error("Invalid callback signature");
    });
    const res = makeRes();
    await handler(makeReq({}), res);
    expect(res.statusCode).toBe(400);
  });
});
