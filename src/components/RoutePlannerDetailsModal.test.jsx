// Ticket #436 — RoutePlannerDetailsModal had NO test file before this
// ticket (F6(2)): Car icon for routeRisk, exactly one HazardSourceNote
// above RouteCompareTable (covers the advanced table too, per F2 — "no
// second note there"), and the advanced table's badges keyed off
// badge.level rather than the old emoji.
import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import RoutePlannerDetailsModal from "./RoutePlannerDetailsModal";
import { translations } from "../i18n/translations";

const t = (k) => translations.en[k] ?? k;

function day(dateISO, overrides = {}) {
  return {
    date: dateISO,
    points: 7,
    pointsRaw: 7,
    baseSitePoints: 5,
    baseSitePointsRaw: 5,
    windPen: 0,
    gustPen: 0,
    rainPen: 0,
    rainStreakPen: 0,
    shelter: 0.5,
    shelterBonus: 0.2,
    basePts: 5,
    warnings: [],
    baseSiteWarnings: [],
    ...overrides,
  };
}

function candidate(overrides = {}) {
  return {
    siteId: "site-fludir",
    siteName: "Flúðir",
    distanceKm: 25,
    betterDays: 1,
    sameDays: 0,
    worseDays: 0,
    deltaVsBase: 2,
    reasons: [],
    aggregateType: "better",
    windowDays: [day("2026-10-20")],
    ...overrides,
  };
}

describe("RoutePlannerDetailsModal — mount guards", () => {
  it("renders nothing when closed", () => {
    render(<RoutePlannerDetailsModal open={false} candidate={candidate()} t={t} lang="en" onClose={vi.fn()} />);
    expect(screen.queryByText(t("routeDetailsDayByDay"))).toBeNull();
  });

  it("renders nothing with no candidate", () => {
    render(<RoutePlannerDetailsModal open candidate={null} t={t} lang="en" onClose={vi.fn()} />);
    expect(screen.queryByText(t("routeDetailsDayByDay"))).toBeNull();
  });
});

describe("RoutePlannerDetailsModal — single HazardSourceNote (F2)", () => {
  it("exactly one note above the day-by-day table, and it stays exactly one after opening the advanced table", () => {
    render(
      <RoutePlannerDetailsModal
        open
        candidate={candidate({ windowDays: [day("2026-10-20", { warnings: [{ type: "wind", level: "high", value: 20 }] })] })}
        t={t}
        lang="en"
        onClose={vi.fn()}
      />
    );
    expect(screen.getAllByText(t("hazardSourceNoteHeading"))).toHaveLength(1);

    fireEvent.click(screen.getByText(t("routeDetailsShowAdvanced")));
    expect(screen.getAllByText(t("hazardSourceNoteHeading"))).toHaveLength(1);
  });

  it("the note's vedur.is link opens in a new tab with safe rel", () => {
    render(<RoutePlannerDetailsModal open candidate={candidate()} t={t} lang="en" onClose={vi.fn()} />);
    const link = screen.getByRole("link", { name: "vedur.is" });
    expect(link.getAttribute("href")).toBe("https://www.vedur.is/");
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toBe("noopener noreferrer");
  });
});

describe("RoutePlannerDetailsModal — routeRisk uses the Car icon, never a site-caution icon", () => {
  it("HIGH route risk: Car icon renders in the route-risk block", () => {
    // The modal renders via createPortal(..., document.body), so icon
    // lookups must go through baseElement, not the render() container.
    const { baseElement } = render(
      <RoutePlannerDetailsModal
        open
        candidate={candidate()}
        t={t}
        lang="en"
        onClose={vi.fn()}
        showRouteRisk
        routeRiskData={{ routeRisk: "HIGH" }}
      />
    );
    expect(screen.getByText(t("routeRiskHigh"), { exact: false })).toBeInTheDocument();
    expect(baseElement.querySelectorAll("svg.lucide-car").length).toBeGreaterThan(0);
  });

  it("LOW route risk: no route-risk block at all", () => {
    render(
      <RoutePlannerDetailsModal
        open
        candidate={candidate()}
        t={t}
        lang="en"
        onClose={vi.fn()}
        showRouteRisk
        routeRiskData={{ routeRisk: "LOW" }}
      />
    );
    expect(screen.queryByText(t("routeRiskLabel"), { exact: false })).toBeNull();
  });

  it("showRouteRisk false: route-risk block is suppressed even with HIGH data", () => {
    render(
      <RoutePlannerDetailsModal
        open
        candidate={candidate()}
        t={t}
        lang="en"
        onClose={vi.fn()}
        routeRiskData={{ routeRisk: "HIGH" }}
      />
    );
    expect(screen.queryByText(t("routeRiskLabel"), { exact: false })).toBeNull();
  });
});

describe("RoutePlannerDetailsModal — advanced table badges use badge.level, not an emoji icon key", () => {
  it("a high-level per-day warning renders a TriangleAlert badge in the advanced table; a warn-level one renders CircleAlert", () => {
    render(
      <RoutePlannerDetailsModal
        open
        candidate={candidate({
          windowDays: [
            day("2026-10-20", { warnings: [{ type: "wind", level: "high", value: 20 }] }),
            day("2026-10-21", { warnings: [{ type: "rain", level: "warn", value: 13 }] }),
          ],
        })}
        t={t}
        lang="en"
        onClose={vi.fn()}
      />
    );

    fireEvent.click(screen.getByText(t("routeDetailsShowAdvanced")));

    const table = screen.getByText(t("routeDetailsWarnings")).closest("table");
    expect(table.querySelectorAll("svg.lucide-triangle-alert").length).toBeGreaterThan(0);
    expect(table.querySelectorAll("svg.lucide-circle-alert").length).toBeGreaterThan(0);
    expect(table.textContent).not.toContain("🚨");
    expect(table.textContent).not.toContain("⚠️");
  });

  it("a day with no warnings shows the em-dash placeholder, not an empty badge row", () => {
    render(
      <RoutePlannerDetailsModal
        open
        candidate={candidate({ windowDays: [day("2026-10-20", { warnings: [] })] })}
        t={t}
        lang="en"
        onClose={vi.fn()}
      />
    );
    fireEvent.click(screen.getByText(t("routeDetailsShowAdvanced")));
    const table = screen.getByText(t("routeDetailsWarnings")).closest("table");
    expect(within(table).getByText("—", { selector: "td span" })).toBeInTheDocument();
  });
});

describe("RoutePlannerDetailsModal — close affordances", () => {
  it("clicking the footer close button calls onClose", () => {
    const onClose = vi.fn();
    render(<RoutePlannerDetailsModal open candidate={candidate()} t={t} lang="en" onClose={onClose} />);
    fireEvent.click(screen.getByText(t("close")));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("pressing Escape calls onClose", () => {
    const onClose = vi.fn();
    render(<RoutePlannerDetailsModal open candidate={candidate()} t={t} lang="en" onClose={onClose} />);
    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
