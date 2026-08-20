import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import CampsitePicker from "./CampsitePicker";

vi.mock("../config/availability", () => ({
  getSiteAvailability: () => ({ status: "open" }),
}));

const t = (k) => k;

const siteList = [
  { id: "site-1", name: "Þórsmörk" },
  { id: "site-2", name: "Skaftafell" },
];

describe("CampsitePicker — initial-state placeholder (Samanburður UX fix)", () => {
  it("shows the real campsite name when siteId matches an entry", () => {
    render(<CampsitePicker siteList={siteList} siteId="site-1" onSelectSite={vi.fn()} t={t} />);
    expect(screen.getByText("Þórsmörk")).toBeDefined();
  });

  it("shows the placeholder — not siteList[0] — when siteId is null", () => {
    render(<CampsitePicker siteList={siteList} siteId={null} onSelectSite={vi.fn()} t={t} />);
    expect(screen.getByText("selectCampsite")).toBeDefined();
    expect(screen.queryByText("Þórsmörk")).toBeNull();
    expect(screen.queryByText("Skaftafell")).toBeNull();
  });

  it("shows the placeholder — not siteList[0] — when siteId does not match any entry (stale id)", () => {
    render(<CampsitePicker siteList={siteList} siteId="does-not-exist" onSelectSite={vi.fn()} t={t} />);
    expect(screen.getByText("selectCampsite")).toBeDefined();
    expect(screen.queryByText("Þórsmörk")).toBeNull();
  });

  it("does not show a closed-lock icon next to the placeholder when nothing is selected", () => {
    render(<CampsitePicker siteList={siteList} siteId={null} onSelectSite={vi.fn()} t={t} />);
    // getSiteAvailability is mocked to always return open, so a lock icon
    // here can only come from selectedClosed defaulting true for a null
    // selection — the regression this test guards against.
    expect(screen.queryByTitle("Closed")).toBeNull();
  });
});
