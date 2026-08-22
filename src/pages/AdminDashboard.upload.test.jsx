import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import AdminDashboard from "./AdminDashboard";

vi.mock("@vercel/blob/client", () => ({ upload: vi.fn() }));

import { upload } from "@vercel/blob/client";

function jsonResponse(body) {
  return { ok: true, json: async () => body };
}

const SUMMARY = {
  ok: true,
  users: { total: 1, new7d: 0, new30d: 0 },
  pro: { active: 0, expired: 0, conversionRate: 0 },
  revenue: { month: 0, last30d: 0, lifetime: 0 },
};

function mockFetchSequence(handlers) {
  global.fetch = vi.fn((url, opts) => {
    for (const h of handlers) {
      const result = h(url, opts);
      if (result) return Promise.resolve(result);
    }
    return Promise.resolve(jsonResponse({ ok: true }));
  });
}

function baseHandlers({ onCreateMedia } = {}) {
  return [
    (url) => (typeof url === "string" && url.includes("listBlogPosts") ? jsonResponse({ ok: true, posts: [] }) : null),
    (url, opts) => (url === "/api/admin" && opts?.method !== "POST" ? jsonResponse(SUMMARY) : null),
    (url, opts) => {
      if (url === "/api/admin" && opts?.method === "POST") {
        const body = JSON.parse(opts.body);
        if (body.action === "createBlogMedia" && onCreateMedia) {
          return onCreateMedia(body);
        }
      }
      return null;
    },
  ];
}

function makeImageFile(name = "photo.jpg", type = "image/jpeg", size = 1024) {
  const file = new File([new Uint8Array(size)], name, { type });
  return file;
}

async function renderManualMode() {
  render(<AdminDashboard />);
  await waitFor(() => expect(screen.queryByText("Hleð admin yfirliti...")).toBeNull());
  fireEvent.click(screen.getByText("Write manually"));
  return screen.getByText("Content (Markdown)").closest("div").parentElement.querySelector("textarea");
}

beforeEach(() => {
  vi.clearAllMocks();
  window.localStorage.clear();
  window.localStorage.setItem("lang", JSON.stringify("en"));
});

describe("AdminDashboard — image upload pipeline (file picker + paste, shared)", () => {
  it("file picker: valid image uploads via the shared pipeline and inserts Markdown", async () => {
    mockFetchSequence(
      baseHandlers({
        onCreateMedia: () =>
          jsonResponse({ ok: true, media: { id: "m1", publicUrl: "https://x.blob.vercel-storage.com/blog-media/photo-abc.jpg" } }),
      })
    );
    upload.mockResolvedValue({ url: "https://x.blob.vercel-storage.com/blog-media/photo-abc.jpg", pathname: "blog-media/photo-abc.jpg" });

    const textarea = await renderManualMode();
    const fileInput = document.querySelector('input[type="file"]');
    const file = makeImageFile();

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => expect(textarea.value).toContain("https://x.blob.vercel-storage.com/blog-media/photo-abc.jpg"));
    expect(textarea.value).toMatch(/^!\[\]\(https:\/\/x\.blob\.vercel-storage\.com\/blog-media\/photo-abc\.jpg\)/);

    expect(upload).toHaveBeenCalledOnce();
    const [pathname, , options] = upload.mock.calls[0];
    expect(pathname).toMatch(/^blog-media\//);
    expect(options.handleUploadUrl).toBe("/api/blob-upload");
    expect(options.access).toBe("public");
  });

  it("clipboard paste: an image item uses the exact same upload pipeline as the file picker", async () => {
    mockFetchSequence(
      baseHandlers({
        onCreateMedia: () =>
          jsonResponse({ ok: true, media: { id: "m2", publicUrl: "https://x.blob.vercel-storage.com/blog-media/pasted-image.png" } }),
      })
    );
    upload.mockResolvedValue({ url: "https://x.blob.vercel-storage.com/blog-media/pasted-image.png", pathname: "blog-media/pasted-image.png" });

    const textarea = await renderManualMode();
    const file = makeImageFile("clipboard.png", "image/png");
    const preventDefault = vi.fn();

    fireEvent.paste(textarea, {
      clipboardData: {
        items: [{ type: "image/png", getAsFile: () => file }],
      },
      preventDefault,
    });

    await waitFor(() => expect(textarea.value).toContain("pasted-image.png"));
    expect(upload).toHaveBeenCalledOnce();
  });

  it("clipboard paste: plain text (no image item) is left alone — preventDefault not called, no upload triggered", async () => {
    mockFetchSequence(baseHandlers());
    const textarea = await renderManualMode();
    const preventDefault = vi.fn();

    fireEvent.paste(textarea, {
      clipboardData: {
        items: [{ type: "text/plain", getAsFile: () => null }],
      },
      preventDefault,
    });

    expect(preventDefault).not.toHaveBeenCalled();
    expect(upload).not.toHaveBeenCalled();
  });

  it("rejects an unsupported file type client-side before ever calling upload()", async () => {
    mockFetchSequence(baseHandlers());
    await renderManualMode();
    const fileInput = document.querySelector('input[type="file"]');
    const file = new File(["not an image"], "doc.pdf", { type: "application/pdf" });

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => expect(screen.getByText(/Unsupported file type/)).toBeDefined());
    expect(upload).not.toHaveBeenCalled();
  });

  it("rejects a file over 10 MB client-side before ever calling upload()", async () => {
    mockFetchSequence(baseHandlers());
    await renderManualMode();
    const fileInput = document.querySelector('input[type="file"]');
    const file = makeImageFile("big.jpg", "image/jpeg", 11 * 1024 * 1024);

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => expect(screen.getByText(/too large/)).toBeDefined());
    expect(upload).not.toHaveBeenCalled();
  });

  it("Blob upload failure shows an error and does not insert Markdown", async () => {
    mockFetchSequence(baseHandlers());
    upload.mockRejectedValue(new Error("Network error"));

    const textarea = await renderManualMode();
    const fileInput = document.querySelector('input[type="file"]');
    fireEvent.change(fileInput, { target: { files: [makeImageFile()] } });

    await waitFor(() => expect(screen.getByText("Network error")).toBeDefined());
    expect(textarea.value).toBe("");
  });

  it("blog_media metadata persistence failure shows an error and does not insert Markdown, even though the Blob upload itself succeeded", async () => {
    mockFetchSequence(
      baseHandlers({
        onCreateMedia: () => ({ ok: false, json: async () => ({ ok: false, error: "Blob asset is outside the expected blog-media namespace" }) }),
      })
    );
    upload.mockResolvedValue({ url: "https://x.blob.vercel-storage.com/blog-media/photo-abc.jpg", pathname: "blog-media/photo-abc.jpg" });

    const textarea = await renderManualMode();
    const fileInput = document.querySelector('input[type="file"]');
    fireEvent.change(fileInput, { target: { files: [makeImageFile()] } });

    await waitFor(() => expect(screen.getByText(/outside the expected blog-media namespace/)).toBeDefined());
    expect(textarea.value).toBe("");
    expect(upload).toHaveBeenCalledOnce();
  });

  it("inserts Markdown at the current cursor position, preserving surrounding content", async () => {
    mockFetchSequence(
      baseHandlers({
        onCreateMedia: () => jsonResponse({ ok: true, media: { id: "m3", publicUrl: "https://x.blob.vercel-storage.com/blog-media/mid.jpg" } }),
      })
    );
    upload.mockResolvedValue({ url: "https://x.blob.vercel-storage.com/blog-media/mid.jpg", pathname: "blog-media/mid.jpg" });

    const textarea = await renderManualMode();
    fireEvent.change(textarea, { target: { value: "Before AFTER" } });
    // Place cursor right after "Before " (index 7), before "AFTER".
    textarea.setSelectionRange(7, 7);

    const fileInput = document.querySelector('input[type="file"]');
    fireEvent.change(fileInput, { target: { files: [makeImageFile()] } });

    await waitFor(() => expect(textarea.value).toContain("mid.jpg"));
    expect(textarea.value).toBe("Before ![](https://x.blob.vercel-storage.com/blog-media/mid.jpg)\nAFTER");
  });
});
