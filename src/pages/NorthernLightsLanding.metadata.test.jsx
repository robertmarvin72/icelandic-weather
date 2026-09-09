import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import NorthernLightsLanding from "./NorthernLightsLanding";

vi.mock("../hooks/useMe", () => ({ useMe: () => ({ me: null, loadingMe: true, refetchMe: vi.fn() }) }));

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn(() => new Promise(() => {})));
});

// The canonical/OG/Twitter URLs are built from window.location.origin plus
// a hardcoded CANONICAL_PATH constant — never from the actually-visited
// path/query — so they are query-free by construction even when the real
// visited URL (asserted via MemoryRouter's initialEntries below) carries
// UTM params. No window.location stubbing needed: whatever origin this
// jsdom test environment uses, the assertions compare against it directly
// rather than hardcoding a guessed value.
function renderWithRealHelmet() {
  return render(
    <HelmetProvider>
      <MemoryRouter initialEntries={["/en/northern-lights?utm_source=google&utm_campaign=aurora"]}>
        <NorthernLightsLanding />
      </MemoryRouter>
    </HelmetProvider>,
  );
}

describe("NorthernLightsLanding — metadata (real react-helmet-async)", () => {
  it("sets a concise English title targeting Northern Lights conditions tonight", async () => {
    renderWithRealHelmet();
    await waitFor(() => expect(document.title).toContain("Northern Lights"));
    expect(document.title.toLowerCase()).toContain("iceland");
  });

  it("sets a truthful English meta description", async () => {
    renderWithRealHelmet();
    await waitFor(() => expect(document.querySelector('meta[name="description"]')).not.toBeNull());
    const description = document.querySelector('meta[name="description"]').getAttribute("content");
    expect(description).toMatch(/cloud cover|aurora|darkness/i);
    // Truthful — no unsupported real-time-precision/coverage claims.
    expect(description.toLowerCase()).not.toMatch(/real-time|guarantee|100%|always accurate/);
  });

  it("the canonical URL is query-free even though the visited URL carried UTM params", async () => {
    renderWithRealHelmet();
    await waitFor(() => expect(document.querySelector('link[rel="canonical"]')).not.toBeNull());
    const canonical = document.querySelector('link[rel="canonical"]').getAttribute("href");
    expect(canonical).toBe(`${window.location.origin}/en/northern-lights`);
    expect(canonical).not.toContain("?");
    expect(canonical).not.toContain("utm_");
  });

  it("Open Graph title/description/url match the primary metadata and are query-free", async () => {
    renderWithRealHelmet();
    await waitFor(() => expect(document.querySelector('meta[property="og:url"]')).not.toBeNull());

    const ogTitle = document.querySelector('meta[property="og:title"]').getAttribute("content");
    const ogDescription = document.querySelector('meta[property="og:description"]').getAttribute("content");
    const ogUrl = document.querySelector('meta[property="og:url"]').getAttribute("content");

    expect(ogTitle).toBe(document.title);
    expect(ogDescription).toBe(document.querySelector('meta[name="description"]').getAttribute("content"));
    expect(ogUrl).toBe(`${window.location.origin}/en/northern-lights`);
    expect(ogUrl).not.toContain("?");
  });

  it("Twitter card metadata is present with matching title/description", async () => {
    renderWithRealHelmet();
    await waitFor(() => expect(document.querySelector('meta[name="twitter:card"]')).not.toBeNull());

    expect(document.querySelector('meta[name="twitter:card"]').getAttribute("content")).toBe("summary");
    expect(document.querySelector('meta[name="twitter:title"]').getAttribute("content")).toBe(document.title);
    expect(document.querySelector('meta[name="twitter:description"]').getAttribute("content")).toBe(
      document.querySelector('meta[name="description"]').getAttribute("content"),
    );
  });

  it("signals English as the document language", async () => {
    renderWithRealHelmet();
    await waitFor(() => expect(document.documentElement.lang).toBe("en"));
  });
});
