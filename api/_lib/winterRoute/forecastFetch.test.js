// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { resolveWinterRouteForecastAuth, computeForecastWindow, fetchWinterRouteForecast } from "./forecastFetch.js";
import { OPEN_METEO_CUSTOMER_HOST } from "../openMeteoAuth.js";

describe("resolveWinterRouteForecastAuth — key missing stops forecast sourcing in every environment (S6a)", () => {
  it("is available with a real key, regardless of VERCEL_ENV", () => {
    for (const vercelEnv of ["production", "preview", "development", undefined]) {
      const auth = resolveWinterRouteForecastAuth({ OPEN_METEO_API_KEY: "real-key", VERCEL_ENV: vercelEnv });
      expect(auth.available).toBe(true);
      expect(auth.host).toBe(OPEN_METEO_CUSTOMER_HOST);
    }
  });

  it("is unavailable when the key is absent, in every environment — never falls back to the public host", () => {
    for (const vercelEnv of ["production", "preview", "development", undefined]) {
      const auth = resolveWinterRouteForecastAuth({ OPEN_METEO_API_KEY: undefined, VERCEL_ENV: vercelEnv });
      expect(auth.available).toBe(false);
      expect(auth.host).toBeNull();
    }
  });

  it("blank/whitespace-only key counts as missing", () => {
    expect(resolveWinterRouteForecastAuth({ OPEN_METEO_API_KEY: "   " }).available).toBe(false);
    expect(resolveWinterRouteForecastAuth({ OPEN_METEO_API_KEY: "" }).available).toBe(false);
  });
});

describe("fetchWinterRouteForecast — zero fetch when key missing", () => {
  let fetchSpy;

  beforeEach(() => {
    fetchSpy = vi.fn();
    global.fetch = fetchSpy;
  });

  it("makes no network request at all when the key is missing", async () => {
    const result = await fetchWinterRouteForecast({ env: { OPEN_METEO_API_KEY: undefined } });
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("key_missing");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("never falls back to the public host when the key is missing in development/undefined either", async () => {
    await fetchWinterRouteForecast({ env: { OPEN_METEO_API_KEY: "", VERCEL_ENV: "development" } });
    await fetchWinterRouteForecast({ env: { OPEN_METEO_API_KEY: "", VERCEL_ENV: undefined } });
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe("computeForecastWindow — 24 hours starting at the next full UTC hour strictly after now", () => {
  it("rolls to the next hour when now is exactly on an hour boundary", () => {
    const window = computeForecastWindow(new Date("2026-11-04T14:00:00.000Z"));
    expect(window.startHour).toBe("2026-11-04T15:00");
    expect(window.endHour).toBe("2026-11-05T14:00");
    expect(window.expectedHours).toHaveLength(24);
    expect(window.expectedHours[0]).toBe("2026-11-04T15:00");
    expect(window.expectedHours[23]).toBe("2026-11-05T14:00");
  });

  it("rolls to the next hour when now is one second before the boundary", () => {
    const window = computeForecastWindow(new Date("2026-11-04T13:59:59.000Z"));
    expect(window.startHour).toBe("2026-11-04T14:00");
  });

  it("rolls to the next hour when now is one second after the boundary", () => {
    const window = computeForecastWindow(new Date("2026-11-04T14:00:01.000Z"));
    expect(window.startHour).toBe("2026-11-04T15:00");
  });
});
