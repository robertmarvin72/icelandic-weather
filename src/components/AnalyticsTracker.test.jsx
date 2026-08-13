import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { MemoryRouter, useNavigate } from "react-router-dom";
import AnalyticsTracker from "./AnalyticsTracker";
import { trackPageView } from "../lib/analytics";

vi.mock("../lib/analytics", () => ({ trackPageView: vi.fn() }));

function NavButtons() {
  const navigate = useNavigate();
  return (
    <>
      <button onClick={() => navigate("/pricing")}>to-pricing</button>
      <button onClick={() => navigate("/pricing?src=blog")}>to-pricing-src</button>
      <button onClick={() => navigate("/about")}>to-about</button>
    </>
  );
}

function renderTracker(initialEntry = "/") {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <AnalyticsTracker />
      <NavButtons />
    </MemoryRouter>
  );
}

describe("AnalyticsTracker — exactly-once page view baseline (#217 pre-upgrade regression gate)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("fires once for the initial pathname+search on mount", () => {
    renderTracker("/pricing");
    expect(trackPageView).toHaveBeenCalledTimes(1);
    expect(trackPageView).toHaveBeenCalledWith("/pricing");
  });

  it("does not refire on a rerender with an unchanged location", () => {
    const { rerender } = renderTracker("/pricing");
    expect(trackPageView).toHaveBeenCalledTimes(1);
    rerender(
      <MemoryRouter initialEntries={["/pricing"]}>
        <AnalyticsTracker />
        <NavButtons />
      </MemoryRouter>
    );
    expect(trackPageView).toHaveBeenCalledTimes(1);
  });

  it("navigating to a new pathname fires exactly one new event", () => {
    const { getByText } = renderTracker("/pricing");
    expect(trackPageView).toHaveBeenCalledTimes(1);
    fireEvent.click(getByText("to-about"));
    expect(trackPageView).toHaveBeenCalledTimes(2);
    expect(trackPageView).toHaveBeenLastCalledWith("/about");
  });

  it("a search-string-only change on the same pathname fires a new event", () => {
    const { getByText } = renderTracker("/pricing");
    expect(trackPageView).toHaveBeenCalledTimes(1);
    fireEvent.click(getByText("to-pricing-src"));
    expect(trackPageView).toHaveBeenCalledTimes(2);
    expect(trackPageView).toHaveBeenLastCalledWith("/pricing?src=blog");
  });

  it("navigating to the same destination twice in a row does not double-fire", () => {
    const { getByText } = renderTracker("/");
    expect(trackPageView).toHaveBeenCalledTimes(1);
    fireEvent.click(getByText("to-pricing"));
    expect(trackPageView).toHaveBeenCalledTimes(2);
    fireEvent.click(getByText("to-pricing"));
    expect(trackPageView).toHaveBeenCalledTimes(2);
  });
});
