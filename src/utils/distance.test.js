import {
  haversineKm,
  distanceKm,
  withDistanceFrom,
  sitesWithinRadius,
  nearestSites,
} from "./distance";

describe("distance utils", () => {
  test("haversineKm returns ~0 for identical coordinates", () => {
    const d = haversineKm(64.1466, -21.9426, 64.1466, -21.9426);
    expect(d).toBeGreaterThanOrEqual(0);
    expect(d).toBeLessThan(0.001);
  });

  test("haversineKm Reykjavik -> Keflavik is roughly in expected range", () => {
    // Reykjavík center-ish -> Keflavík airport-ish
    const d = haversineKm(64.1466, -21.9426, 63.985, -22.6056);
    // real is roughly ~38-55 km depending on points chosen
    expect(d).toBeGreaterThan(25);
    expect(d).toBeLessThan(70);
  });

  test("distanceKm returns null if inputs are missing/invalid", () => {
    expect(distanceKm(null, { lat: 1, lon: 2 })).toBeNull();
    expect(distanceKm({ lat: 1 }, { lat: 1, lon: 2 })).toBeNull();
    expect(distanceKm({ lat: "nope", lon: 2 }, { lat: 1, lon: 2 })).toBeNull();
  });

  test("withDistanceFrom adds distanceKm field", () => {
    const origin = { id: "a", lat: 64.1466, lon: -21.9426 };
    const sites = [
      { id: "a", name: "Origin", lat: 64.1466, lon: -21.9426 },
      { id: "b", name: "Somewhere", lat: 64.2, lon: -21.9 },
    ];

    const out = withDistanceFrom(origin, sites);
    expect(out).toHaveLength(2);
    expect(out[0]).toHaveProperty("distanceKm");
    expect(out[1]).toHaveProperty("distanceKm");
    expect(out[0].distanceKm).toBeLessThan(0.001);
    expect(out[1].distanceKm).toBeGreaterThan(0);
  });

  test("sitesWithinRadius filters within radius and sorts ascending", () => {
    const origin = { id: "a", lat: 64.1466, lon: -21.9426 };
    const sites = [
      { id: "a", name: "Origin", lat: 64.1466, lon: -21.9426 },
      { id: "near", name: "Near", lat: 64.147, lon: -21.94 },
      { id: "mid", name: "Mid", lat: 64.2, lon: -21.9 },
      { id: "far", name: "Far", lat: 65.0, lon: -20.0 },
    ];

    const within = sitesWithinRadius(origin, sites, 20, { excludeSelf: true });
    expect(within.map((s) => s.id)).toContain("near");
    expect(within.map((s) => s.id)).toContain("mid");
    expect(within.map((s) => s.id)).not.toContain("far");
    expect(within.map((s) => s.id)).not.toContain("a");

    // sorted by distance
    expect(within[0].distanceKm).toBeLessThanOrEqual(within[1].distanceKm);
  });

  test("sitesWithinRadius respects limit", () => {
    const origin = { id: "a", lat: 64.1466, lon: -21.9426 };
    const sites = [
      { id: "a", lat: 64.1466, lon: -21.9426 },
      { id: "1", lat: 64.147, lon: -21.94 },
      { id: "2", lat: 64.148, lon: -21.94 },
      { id: "3", lat: 64.149, lon: -21.94 },
    ];

    const within = sitesWithinRadius(origin, sites, 5, { limit: 2 });
    expect(within).toHaveLength(2);
  });

  test("nearestSites returns N nearest (excluding self by default)", () => {
    const origin = { id: "a", lat: 64.1466, lon: -21.9426 };
    const sites = [
      { id: "a", lat: 64.1466, lon: -21.9426 },
      { id: "1", lat: 64.147, lon: -21.94 },
      { id: "2", lat: 64.148, lon: -21.94 },
      { id: "3", lat: 64.149, lon: -21.94 },
    ];

    const near2 = nearestSites(origin, sites, 2);
    expect(near2).toHaveLength(2);
    expect(near2.find((s) => s.id === "a")).toBeFalsy();
    expect(near2[0].distanceKm).toBeLessThanOrEqual(near2[1].distanceKm);
  });
});
