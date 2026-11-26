// @vitest-environment node
//
// Ticket #492, direct-flow, C1/C3 — parity test for the two fixed-route-
// adapter pairs' own point-id and idButur ORDER, cross-checked against
// the real backend definitions (api/_lib/winterRoute/segments.js for
// Rauðavatn–Vík, api/_lib/winterRoute/routes.js for Rauðavatn–Borgarnes).
// Runs under Node/Vitest only, never bundled into the shipped frontend —
// same convention as winterRouteRoutes.test.js's own backend-import
// parity test (which already covers routeId/expectedPointCount parity;
// this file covers the newer pointIdOrder/idButurOrder fields C3 added).
import { describe, it, expect } from "vitest";
import { WINTER_ROUTE_OPTIONS, WINTER_ROUTE_DIRECT_PAIRS, resolveDirectPairRouteId } from "./winterRouteRoutes.js";
import { WINTER_ROUTE_IDBUTUR_LIST, WINTER_ROUTE_FORECAST_POINTS } from "../../api/_lib/winterRoute/segments.js";
import { BORGARNES_IDBUTUR_LIST, BORGARNES_FORECAST_POINTS } from "../../api/_lib/winterRoute/routes.js";

function frontendRoute(routeId) {
  return WINTER_ROUTE_OPTIONS.find((o) => o.routeId === routeId);
}

describe("Ticket #492, direct-flow, C1/C3 — fixed-route point-id/idButur order parity", () => {
  it("raudavatn-vik: idButurOrder matches api/_lib/winterRoute/segments.js's own WINTER_ROUTE_IDBUTUR_LIST exactly, in order", () => {
    expect(frontendRoute("raudavatn-vik").idButurOrder).toEqual(WINTER_ROUTE_IDBUTUR_LIST);
  });

  it("raudavatn-vik: pointIdOrder matches segments.js's own WINTER_ROUTE_FORECAST_POINTS ids exactly, in order", () => {
    expect(frontendRoute("raudavatn-vik").pointIdOrder).toEqual(WINTER_ROUTE_FORECAST_POINTS.map((p) => p.id));
  });

  it("raudavatn-borgarnes: idButurOrder matches api/_lib/winterRoute/routes.js's own BORGARNES_IDBUTUR_LIST exactly, in order", () => {
    expect(frontendRoute("raudavatn-borgarnes").idButurOrder).toEqual(BORGARNES_IDBUTUR_LIST);
  });

  it("raudavatn-borgarnes: pointIdOrder matches routes.js's own BORGARNES_FORECAST_POINTS ids exactly, in order", () => {
    expect(frontendRoute("raudavatn-borgarnes").pointIdOrder).toEqual(BORGARNES_FORECAST_POINTS.map((p) => p.id));
  });

  // C1 "Festar ákvarðanir" -- exactly these two direct pairs, no more.
  it("exactly the two direct pairs resolve, both using explicit routeId (never a default-omission match)", () => {
    expect(Object.keys(WINTER_ROUTE_DIRECT_PAIRS).sort()).toEqual(
      ["reykjavik-raudavatn|borgarnes", "reykjavik-raudavatn|vik"].sort()
    );
    expect(resolveDirectPairRouteId("reykjavik-raudavatn", "vik")).toBe("raudavatn-vik");
    expect(resolveDirectPairRouteId("reykjavik-raudavatn", "borgarnes")).toBe("raudavatn-borgarnes");
  });

  // The reverse direction and every other combination involving these
  // two places stay unsupported -- never an invented reversal.
  it("the reverse direction and any other combination of the two direct places is NOT a resolvable pair", () => {
    expect(resolveDirectPairRouteId("vik", "reykjavik-raudavatn")).toBeNull();
    expect(resolveDirectPairRouteId("borgarnes", "reykjavik-raudavatn")).toBeNull();
    expect(resolveDirectPairRouteId("vik", "borgarnes")).toBeNull();
    expect(resolveDirectPairRouteId("borgarnes", "vik")).toBeNull();
    expect(resolveDirectPairRouteId("vik", "vik")).toBeNull();
    expect(resolveDirectPairRouteId("borgarnes", "borgarnes")).toBeNull();
  });
});
