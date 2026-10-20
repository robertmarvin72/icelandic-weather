// api/_lib/openMeteoAuth.test.js
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { resolveOpenMeteoAuth, OPEN_METEO_PUBLIC_HOST, OPEN_METEO_CUSTOMER_HOST } from "./openMeteoAuth.js";

describe("resolveOpenMeteoAuth — key present (every environment)", () => {
  it("selects the customer host and the trimmed key regardless of VERCEL_ENV", () => {
    for (const vercelEnv of [undefined, "development", "preview", "production"]) {
      const result = resolveOpenMeteoAuth({ OPEN_METEO_API_KEY: "sentinel-fake-key", VERCEL_ENV: vercelEnv });
      expect(result).toEqual({ host: OPEN_METEO_CUSTOMER_HOST, apiKey: "sentinel-fake-key", failClosed: false });
    }
  });

  it("trims surrounding whitespace from the configured key", () => {
    const result = resolveOpenMeteoAuth({ OPEN_METEO_API_KEY: "  sentinel-fake-key  " });
    expect(result.apiKey).toBe("sentinel-fake-key");
  });

  it("treats a whitespace-only key as missing, not as a valid credential", () => {
    const result = resolveOpenMeteoAuth({ OPEN_METEO_API_KEY: "   ", VERCEL_ENV: "development" });
    expect(result.apiKey).toBeNull();
    expect(result.host).toBe(OPEN_METEO_PUBLIC_HOST);
    expect(result.failClosed).toBe(false);
  });
});

describe("resolveOpenMeteoAuth — key missing/blank, per environment (Q1)", () => {
  it("fails closed only when VERCEL_ENV is exactly 'production'", () => {
    const result = resolveOpenMeteoAuth({ VERCEL_ENV: "production" });
    expect(result).toEqual({ host: null, apiKey: null, failClosed: true });
  });

  it("permits the public host for preview", () => {
    const result = resolveOpenMeteoAuth({ VERCEL_ENV: "preview" });
    expect(result).toEqual({ host: OPEN_METEO_PUBLIC_HOST, apiKey: null, failClosed: false });
  });

  it("permits the public host for development", () => {
    const result = resolveOpenMeteoAuth({ VERCEL_ENV: "development" });
    expect(result).toEqual({ host: OPEN_METEO_PUBLIC_HOST, apiKey: null, failClosed: false });
  });

  it("permits the public host when VERCEL_ENV is undefined (plain local/vitest run)", () => {
    const result = resolveOpenMeteoAuth({});
    expect(result).toEqual({ host: OPEN_METEO_PUBLIC_HOST, apiKey: null, failClosed: false });
  });

  it("an unrecognized VERCEL_ENV value is treated the same as undefined (never fails closed on anything but the literal string 'production')", () => {
    const result = resolveOpenMeteoAuth({ VERCEL_ENV: "staging" });
    expect(result).toEqual({ host: OPEN_METEO_PUBLIC_HOST, apiKey: null, failClosed: false });
  });
});

describe("resolveOpenMeteoAuth — nonsecret warning log (Q1)", () => {
  let warnSpy;
  beforeEach(() => {
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  });
  afterEach(() => {
    warnSpy.mockRestore();
  });

  it("warns once for missing key in preview, naming the environment but never a key or URL", () => {
    resolveOpenMeteoAuth({ VERCEL_ENV: "preview" });
    expect(warnSpy).toHaveBeenCalledTimes(1);
    const [message] = warnSpy.mock.calls[0];
    expect(message).toContain("preview");
    expect(message).not.toMatch(/https?:\/\//);
    expect(message).not.toContain("OPEN_METEO_API_KEY=");
  });

  it("warns once for missing key in development", () => {
    resolveOpenMeteoAuth({ VERCEL_ENV: "development" });
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });

  it("does NOT warn for undefined VERCEL_ENV (ordinary local/test run, not a deployed misconfiguration)", () => {
    resolveOpenMeteoAuth({});
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it("does NOT warn for production (the failClosed path has its own caller-side diagnostic instead)", () => {
    resolveOpenMeteoAuth({ VERCEL_ENV: "production" });
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it("does NOT warn at all when a key is present, in any environment", () => {
    resolveOpenMeteoAuth({ OPEN_METEO_API_KEY: "sentinel-fake-key", VERCEL_ENV: "preview" });
    expect(warnSpy).not.toHaveBeenCalled();
  });
});

describe("resolveOpenMeteoAuth — reads configuration at call time, not import time", () => {
  it("reflects process.env mutated between two calls, with no explicit env argument", () => {
    const ORIGINAL_KEY = process.env.OPEN_METEO_API_KEY;
    const ORIGINAL_VERCEL_ENV = process.env.VERCEL_ENV;
    try {
      delete process.env.OPEN_METEO_API_KEY;
      delete process.env.VERCEL_ENV;
      expect(resolveOpenMeteoAuth().host).toBe(OPEN_METEO_PUBLIC_HOST);

      process.env.OPEN_METEO_API_KEY = "sentinel-fake-key";
      expect(resolveOpenMeteoAuth().host).toBe(OPEN_METEO_CUSTOMER_HOST);
    } finally {
      if (ORIGINAL_KEY === undefined) delete process.env.OPEN_METEO_API_KEY;
      else process.env.OPEN_METEO_API_KEY = ORIGINAL_KEY;
      if (ORIGINAL_VERCEL_ENV === undefined) delete process.env.VERCEL_ENV;
      else process.env.VERCEL_ENV = ORIGINAL_VERCEL_ENV;
    }
  });
});

describe("resolveOpenMeteoAuth — never accepts a caller-supplied host/key override", () => {
  it("ignores unrelated properties on the env object (e.g. an attempted host/apikey/url override) — only OPEN_METEO_API_KEY and VERCEL_ENV are ever read", () => {
    const result = resolveOpenMeteoAuth({ host: "https://evil.example", apikey: "attacker-key", url: "https://evil.example" });
    expect(result).toEqual({ host: OPEN_METEO_PUBLIC_HOST, apiKey: null, failClosed: false });
  });
});
