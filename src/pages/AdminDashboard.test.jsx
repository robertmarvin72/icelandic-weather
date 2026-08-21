import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import AdminDashboard from "./AdminDashboard";

function jsonResponse(body) {
  return { ok: true, json: async () => body };
}

function mockFetchSequence(handlers) {
  global.fetch = vi.fn((url, opts) => {
    for (const h of handlers) {
      const result = h(url, opts);
      if (result) return Promise.resolve(result);
    }
    return Promise.resolve(jsonResponse({ ok: true }));
  });
}

const SUMMARY = {
  ok: true,
  users: { total: 1, new7d: 0, new30d: 0 },
  pro: { active: 0, expired: 0, conversionRate: 0 },
  revenue: { month: 0, last30d: 0, lifetime: 0 },
};

beforeEach(() => {
  vi.clearAllMocks();
  window.localStorage.clear();
  window.localStorage.setItem("lang", JSON.stringify("en"));
});

describe("AdminDashboard — manual blog creation", () => {
  it("defaults to Generate with AI mode; switching to Write manually swaps the card", async () => {
    mockFetchSequence([
      (url) => (typeof url === "string" && url.includes("listBlogPosts") ? jsonResponse({ ok: true, posts: [] }) : null),
      (url, opts) => (url === "/api/admin" && opts?.method !== "POST" ? jsonResponse(SUMMARY) : null),
    ]);

    render(<AdminDashboard />);
    await waitFor(() => expect(screen.queryByText("Hleð admin yfirliti...")).toBeNull());

    expect(screen.getByText("Generate blog draft")).toBeDefined();

    fireEvent.click(screen.getByText("Write manually"));

    expect(screen.queryByText("Generate blog draft")).toBeNull();
    expect(screen.getByText("Write blog post manually")).toBeDefined();
  });

  it("Create draft button is disabled until title and content are both filled", async () => {
    mockFetchSequence([
      (url) => (typeof url === "string" && url.includes("listBlogPosts") ? jsonResponse({ ok: true, posts: [] }) : null),
      (url, opts) => (url === "/api/admin" && opts?.method !== "POST" ? jsonResponse(SUMMARY) : null),
    ]);

    render(<AdminDashboard />);
    await waitFor(() => expect(screen.queryByText("Hleð admin yfirliti...")).toBeNull());
    fireEvent.click(screen.getByText("Write manually"));

    const createBtn = screen.getByText("Create draft");
    expect(createBtn.closest("button")).toBeDisabled();

    const titleField = screen.getByText("Title").parentElement.querySelector("input");
    fireEvent.change(titleField, { target: { value: "My post" } });
    expect(createBtn.closest("button")).toBeDisabled();

    const contentField = screen
      .getByText("Content (Markdown)")
      .closest("div").parentElement.querySelector("textarea");
    fireEvent.change(contentField, { target: { value: "Hello" } });
    expect(createBtn.closest("button")).not.toBeDisabled();
  });

  it("successful create posts to /api/admin with action=createBlogPost and the entered fields", async () => {
    let createCall = null;
    mockFetchSequence([
      (url) => (typeof url === "string" && url.includes("listBlogPosts") ? jsonResponse({ ok: true, posts: [] }) : null),
      (url, opts) => (url === "/api/admin" && opts?.method !== "POST" ? jsonResponse(SUMMARY) : null),
      (url, opts) => {
        if (typeof url === "string" && url === "/api/admin" && opts?.method === "POST") {
          const body = JSON.parse(opts.body);
          if (body.action === "createBlogPost") {
            createCall = body;
            return jsonResponse({
              ok: true,
              post: { id: "p1", title: body.title, status: "draft", language: body.language, slug: "my-post" },
            });
          }
        }
        return null;
      },
    ]);

    render(<AdminDashboard />);
    await waitFor(() => expect(screen.queryByText("Hleð admin yfirliti...")).toBeNull());
    fireEvent.click(screen.getByText("Write manually"));

    const titleField = screen.getByText("Title").parentElement.querySelector("input");
    fireEvent.change(titleField, { target: { value: "My post" } });
    const contentField = screen
      .getByText("Content (Markdown)")
      .closest("div").parentElement.querySelector("textarea");
    fireEvent.change(contentField, { target: { value: "Hello world" } });

    fireEvent.click(screen.getByText("Create draft"));

    await waitFor(() => expect(createCall).not.toBeNull());
    expect(createCall.action).toBe("createBlogPost");
    expect(createCall.title).toBe("My post");
    expect(createCall.content).toBe("Hello world");
    expect(createCall.language).toBe("is");

    await waitFor(() => expect(screen.getByText(/Draft created/)).toBeDefined());
  });

  it("preview toggle renders the content through the shared Markdown renderer", async () => {
    mockFetchSequence([
      (url) => (typeof url === "string" && url.includes("listBlogPosts") ? jsonResponse({ ok: true, posts: [] }) : null),
      (url, opts) => (url === "/api/admin" && opts?.method !== "POST" ? jsonResponse(SUMMARY) : null),
    ]);

    render(<AdminDashboard />);
    await waitFor(() => expect(screen.queryByText("Hleð admin yfirliti...")).toBeNull());
    fireEvent.click(screen.getByText("Write manually"));

    const contentField = screen
      .getByText("Content (Markdown)")
      .closest("div").parentElement.querySelector("textarea");
    fireEvent.change(contentField, { target: { value: "# Hello preview" } });

    fireEvent.click(screen.getByText("Preview"));

    expect(screen.getByRole("heading", { level: 1, name: "Hello preview" })).toBeDefined();
  });
});
