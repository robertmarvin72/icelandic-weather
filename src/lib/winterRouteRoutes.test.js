// @vitest-environment node
//
// Ticket #491, B3 — "jafnræðispróf" (equality test) between the backend's
// own allowlist (api/_lib/winterRoute/routes.js) and this frontend's own
// separately-maintained table (winterRouteRoutes.js). This test file is
// allowed to import both sides (it runs under Node/Vitest, never bundled
// into the shipped frontend) — only the PRODUCTION frontend bundle must
// never import backend code (src/pages/WinterRoute.jsx does not).
import { describe, it, expect } from "vitest";
import { WINTER_ROUTE_OPTIONS, DEFAULT_WINTER_ROUTE_ID } from "./winterRouteRoutes.js";
import { ROUTE_DEFS, DEFAULT_ROUTE_ID } from "../../api/_lib/winterRoute/routes.js";

describe("Ticket #491, B3 — frontend/backend routeId table parity", () => {
  it("has exactly the same set of routeIds on both sides", () => {
    const frontendIds = WINTER_ROUTE_OPTIONS.map((o) => o.routeId).sort();
    const backendIds = [...ROUTE_DEFS.keys()].sort();
    expect(frontendIds).toEqual(backendIds);
  });

  it("agrees on expectedPointCount for every routeId", () => {
    for (const opt of WINTER_ROUTE_OPTIONS) {
      const backendRoute = ROUTE_DEFS.get(opt.routeId);
      expect(backendRoute).toBeDefined();
      expect(opt.expectedPointCount).toBe(backendRoute.expectedPointCount);
    }
  });

  it("agrees on the default routeId", () => {
    expect(DEFAULT_WINTER_ROUTE_ID).toBe(DEFAULT_ROUTE_ID);
  });
});
