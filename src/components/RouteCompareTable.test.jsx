// Ticket #436 — RouteCompareTable had NO test file before this ticket (per
// the approved prompt's F6(2)); this adds real-fixture coverage for both
// standalone and host-provided-note usage, dedup/order, base-vs-candidate,
// normalization (unchanged, F5), and the own-assessment icon/copy swap.
import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import RouteCompareTable from "./RouteCompareTable";
import { translations } from "../i18n/translations";

const t = (k) => translations.en[k] ?? k;

function day(dateISO, { warnings, baseSiteWarnings } = {}) {
  return {
    date: dateISO,
    points: 7,
    pointsRaw: 7,
    baseSitePoints: 5,
    baseSitePointsRaw: 5,
    warnings,
    baseSiteWarnings,
  };
}

describe("RouteCompareTable — standalone note (F2)", () => {
  it("renders its own single note by default, even with an all-empty own-assessment result", () => {
    render(<RouteCompareTable t={t} lang="en" windowDays={[day("2026-10-20", { warnings: [], baseSiteWarnings: [] })]} />);
    expect(screen.getAllByText(t("hazardSourceNoteHeading"))).toHaveLength(1);
    expect(screen.getAllByText(t("routeCompareNoWarnings"))).toHaveLength(2); // base + candidate columns
  });

  it("hostProvidesNote suppresses the table's own note (no duplicate)", () => {
    render(
      <RouteCompareTable
        t={t}
        lang="en"
        windowDays={[day("2026-10-20", { warnings: [], baseSiteWarnings: [] })]}
        hostProvidesNote
      />
    );
    expect(screen.queryByText(t("hazardSourceNoteHeading"))).toBeNull();
  });
});

describe("RouteCompareTable — icons and copy (own assessment, never an official warning)", () => {
  it("high-level candidate: TriangleAlert badge, exact chosen EN label, no emoji", () => {
    const { container } = render(
      <RouteCompareTable
        t={t}
        lang="en"
        windowDays={[day("2026-10-20", { warnings: [{ type: "wind", level: "high", value: 20 }], baseSiteWarnings: [] })]}
        hostProvidesNote
      />
    );
    expect(container.querySelectorAll("svg.lucide-triangle-alert").length).toBeGreaterThan(0);
    expect(container.textContent).not.toContain("🚨");
    expect(container.textContent).not.toContain("⚠️");
    expect(screen.getByText(t("routeWarnTypeWind"))).toBeInTheDocument();
  });

  it("warn-level base: CircleAlert badge, exact chosen EN label", () => {
    const { container } = render(
      <RouteCompareTable
        t={t}
        lang="en"
        windowDays={[day("2026-10-20", { warnings: [], baseSiteWarnings: [{ type: "rain", level: "warn", value: 14 }] })]}
        hostProvidesNote
      />
    );
    expect(container.querySelectorAll("svg.lucide-circle-alert").length).toBeGreaterThan(0);
    expect(screen.getByText(t("routeWarnTypeRain"))).toBeInTheDocument();
  });

  it("IS dictionary: exact IS labels, never the old Hættuveður/Veðurviðvörun wording", () => {
    const tIs = (k) => translations.is[k] ?? k;
    render(
      <RouteCompareTable
        t={tIs}
        lang="is"
        windowDays={[day("2026-10-20", { warnings: [{ type: "gust", level: "high", value: 25 }], baseSiteWarnings: [] })]}
        hostProvidesNote
      />
    );
    expect(screen.getByText(translations.is.routeWarnTypeGust)).toBeInTheDocument();
    expect(screen.queryByText("Hættuveður")).toBeNull();
    expect(screen.queryByText("Veðurviðvörun")).toBeNull();
  });
});

describe("RouteCompareTable — SeverityBadge accessible name (F-C, correction v2)", () => {
  // Jonesy condition E2: hard-coded literal strings, not translations.*
  // lookups — a dictionary-sourced assertion is a tautology that would hide
  // a regression the same way it hid F-A originally.
  it("EN warn: severity badge exposes accessible name 'Weather caution'", () => {
    render(
      <RouteCompareTable
        t={t}
        lang="en"
        windowDays={[day("2026-10-20", { warnings: [{ type: "rain", level: "warn", value: 14 }], baseSiteWarnings: [] })]}
        hostProvidesNote
      />
    );
    expect(screen.getByRole("img", { name: "Weather caution" })).toBeInTheDocument();
  });

  it("EN high: severity badge exposes accessible name 'Challenging weather conditions'", () => {
    render(
      <RouteCompareTable
        t={t}
        lang="en"
        windowDays={[day("2026-10-20", { warnings: [{ type: "wind", level: "high", value: 20 }], baseSiteWarnings: [] })]}
        hostProvidesNote
      />
    );
    expect(screen.getByRole("img", { name: "Challenging weather conditions" })).toBeInTheDocument();
  });

  it("IS warn: severity badge exposes accessible name 'Varúð vegna veðurs'", () => {
    const tIs = (k) => translations.is[k] ?? k;
    render(
      <RouteCompareTable
        t={tIs}
        lang="is"
        windowDays={[day("2026-10-20", { warnings: [{ type: "rain", level: "warn", value: 14 }], baseSiteWarnings: [] })]}
        hostProvidesNote
      />
    );
    expect(screen.getByRole("img", { name: "Varúð vegna veðurs" })).toBeInTheDocument();
  });

  it("IS high: severity badge exposes accessible name 'Erfiðar veðuraðstæður'", () => {
    const tIs = (k) => translations.is[k] ?? k;
    render(
      <RouteCompareTable
        t={tIs}
        lang="is"
        windowDays={[day("2026-10-20", { warnings: [{ type: "wind", level: "high", value: 20 }], baseSiteWarnings: [] })]}
        hostProvidesNote
      />
    );
    expect(screen.getByRole("img", { name: "Erfiðar veðuraðstæður" })).toBeInTheDocument();
  });
});

describe("RouteCompareTable — all chips render, no '+N' title-only overflow (F8/F10)", () => {
  it("three distinct warning types on the same day: all three chips are visible, no '+N' overflow chip", () => {
    const { container } = render(
      <RouteCompareTable
        t={t}
        lang="en"
        showScoreDelta={false}
        windowDays={[
          day("2026-10-20", {
            warnings: [
              { type: "wind", level: "warn", value: 15 },
              { type: "rain", level: "warn", value: 13 },
              { type: "tempLow", level: "warn", value: -9 },
            ],
            baseSiteWarnings: [],
          }),
        ]}
        hostProvidesNote
      />
    );
    expect(screen.getByText(t("routeWarnTypeWind"))).toBeInTheDocument();
    expect(screen.getByText(t("routeWarnTypeRain"))).toBeInTheDocument();
    expect(screen.getByText(t("routeWarnTypeTempLow"))).toBeInTheDocument();
    // All three distinct-type chips render as individual icon+label pills —
    // never collapsed into a "+N" overflow indicator. (The severity badge
    // contributes one extra circle-alert icon of its own, hence 4 not 3.)
    expect(container.querySelectorAll("svg.lucide-circle-alert").length).toBe(4);
    expect(screen.queryByText(/^\+\d/)).toBeNull();
  });

  it("dedup: the same type repeated at the same level renders only once; high sorts before warn", () => {
    render(
      <RouteCompareTable
        t={t}
        lang="en"
        windowDays={[
          day("2026-10-20", {
            warnings: [
              { type: "wind", level: "high", value: 20 },
              { type: "wind", level: "high", value: 22 }, // duplicate type+level
              { type: "rain", level: "warn", value: 13 },
            ],
            baseSiteWarnings: [],
          }),
        ]}
        hostProvidesNote
      />
    );
    const windChips = screen.getAllByText(t("routeWarnTypeWind"));
    expect(windChips).toHaveLength(1);
  });
});

describe("RouteCompareTable — normalization unchanged (F5)", () => {
  it("undefined windowDays warnings/baseSiteWarnings normalize to [] — the existing no-caution wording, not a provenance claim", () => {
    render(
      <RouteCompareTable
        t={t}
        lang="en"
        windowDays={[day("2026-10-20", { warnings: undefined, baseSiteWarnings: undefined })]}
        hostProvidesNote
      />
    );
    expect(screen.getAllByText(t("routeCompareNoWarnings"))).toHaveLength(2);
  });

  it("an unknown warning type falls back to the raw type string, never raw meteorology or a crash", () => {
    render(
      <RouteCompareTable
        t={t}
        lang="en"
        windowDays={[day("2026-10-20", { warnings: [{ type: "fog", level: "warn", value: 1 }], baseSiteWarnings: [] })]}
        hostProvidesNote
      />
    );
    expect(screen.getByText("fog")).toBeInTheDocument();
  });

  it("an invalid level is excluded from chips without crashing the row", () => {
    render(
      <RouteCompareTable
        t={t}
        lang="en"
        windowDays={[day("2026-10-20", { warnings: [{ type: "wind", level: "severe", value: 30 }], baseSiteWarnings: [] })]}
        hostProvidesNote
      />
    );
    expect(screen.queryByText(t("routeWarnTypeWind"))).toBeNull();
    expect(screen.getAllByText(t("routeCompareNoWarnings")).length).toBeGreaterThan(0);
  });
});

describe("RouteCompareTable — base vs candidate contrast and reason text", () => {
  it("base has a high caution, candidate has none: reason says fewer caution indicators (not 'warnings')", () => {
    render(
      <RouteCompareTable
        t={t}
        lang="en"
        windowDays={[
          day("2026-10-20", {
            warnings: [],
            baseSiteWarnings: [{ type: "wind", level: "high", value: 20 }],
          }),
        ]}
        hostProvidesNote
      />
    );
    // "Why" column reason cell — reachable via the row.
    expect(screen.getByText(t("routeCompareReasonLessSevere"))).toBeInTheDocument();
  });
});
