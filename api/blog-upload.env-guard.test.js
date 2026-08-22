// @vitest-environment node
//
// Regression coverage for the "Failed to retrieve the client token" incident:
// blog-upload.test.js mocks @vercel/blob/client's handleUpload entirely, so
// none of those tests ever exercise the real SDK's own token resolution
// (getReadWriteBlobTokenFromOptionsOrEnv), which runs before
// onBeforeGenerateToken and is what actually failed in the real environment
// (a long-running dev server process started before BLOB_READ_WRITE_TOKEN
// was added to the local env files never picked it up). This file
// deliberately does NOT mock @vercel/blob/client, so the real SDK dispatch
// (including its synchronous, network-free token-presence check) runs.
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("./_lib/getMe.js", () => ({ getMeFromRequest: vi.fn() }));

import { getMeFromRequest } from "./_lib/getMe.js";
import handler from "./blog-upload.js";

function makeReq(body) {
  return { method: "POST", body, headers: {} };
}

function makeRes() {
  return {
    statusCode: 200,
    body: null,
    setHeader() {},
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

const ORIGINAL_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  if (ORIGINAL_TOKEN === undefined) delete process.env.BLOB_READ_WRITE_TOKEN;
  else process.env.BLOB_READ_WRITE_TOKEN = ORIGINAL_TOKEN;
});

describe("blog-upload — real SDK boundary: BLOB_READ_WRITE_TOKEN missing from process.env", () => {
  it("returns 400 with a diagnosable error when the token is absent — this is the exact failure that reached production and was masked by the client SDK's generic message", async () => {
    delete process.env.BLOB_READ_WRITE_TOKEN;

    const req = makeReq({ type: "blob.generate-client-token", payload: { pathname: "blog-media/x.jpg", clientPayload: null, multipart: false } });
    const res = makeRes();
    await handler(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/read-write token/i);
    // Never reached onBeforeGenerateToken — token resolution fails first.
    expect(getMeFromRequest).not.toHaveBeenCalled();
  });
});

describe("blog-upload — real SDK boundary: BLOB_READ_WRITE_TOKEN present", () => {
  it("proceeds past token resolution into the real onBeforeGenerateToken auth check, and correctly rejects an unauthenticated request", async () => {
    process.env.BLOB_READ_WRITE_TOKEN = "vercel_blob_rw_test_0000000000000000";
    getMeFromRequest.mockResolvedValue(null);

    const req = makeReq({ type: "blob.generate-client-token", payload: { pathname: "blog-media/x.jpg", clientPayload: null, multipart: false } });
    const res = makeRes();
    await handler(req, res);

    expect(res.statusCode).toBe(403);
    expect(res.body).toEqual({ ok: false, error: "Forbidden" });
    // Proves execution reached the real onBeforeGenerateToken this time.
    expect(getMeFromRequest).toHaveBeenCalledOnce();
  });
});
