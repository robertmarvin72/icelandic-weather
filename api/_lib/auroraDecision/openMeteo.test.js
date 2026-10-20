import { describe, it, expect, vi, afterEach } from "vitest";
import { format } from "node:util";
import { normalizeOpenMeteoHourly, fetchLocationWeather, buildOpenMeteoUrl } from "./openMeteo.js";
import { scoreAuroraVisibility } from "../../../src/lib/auroraScoring.js";

// Ticket #453 v2 (T1): captures console.* arguments through `util.format`,
// not `JSON.stringify` — see api/forecast.test.js's own copy of this helper
// for the full rationale (JSON.stringify(someError) renders as `{}`).
function formatConsoleCalls(spy) {
  return spy.mock.calls.map((call) => format(...call)).join(" ");
}

describe("buildOpenMeteoUrl", () => {
  it("requests UTC timezone explicitly and the fixed hourly field set", () => {
    const url = new URL(buildOpenMeteoUrl({ lat: 64.1, lon: -21.9, startDate: "2026-08-24", endDate: "2026-08-25" }));
    expect(url.searchParams.get("timezone")).toBe("UTC");
    expect(url.searchParams.get("start_date")).toBe("2026-08-24");
    expect(url.searchParams.get("end_date")).toBe("2026-08-25");
    expect(url.searchParams.get("hourly")).toContain("cloudcover");
    expect(url.searchParams.get("hourly")).toContain("visibility");
  });

  // Ticket #452: documented canonical parameter (https://open-meteo.com/en/docs,
  // read 2026-10-20) — exact "ms", never the legacy "windspeed_unit" name, and
  // every other previously-asserted param stays exactly as before.
  it("requests the documented canonical wind_speed_unit=ms parameter, with every other param unchanged", () => {
    const url = new URL(buildOpenMeteoUrl({ lat: 64.1, lon: -21.9, startDate: "2026-08-24", endDate: "2026-08-25" }));
    expect(url.searchParams.get("wind_speed_unit")).toBe("ms");
    expect(url.searchParams.get("windspeed_unit")).toBeNull();
    expect(url.searchParams.get("latitude")).toBe("64.1000");
    expect(url.searchParams.get("longitude")).toBe("-21.9000");
    expect(url.searchParams.get("timezone")).toBe("UTC");
    expect(url.searchParams.get("start_date")).toBe("2026-08-24");
    expect(url.searchParams.get("end_date")).toBe("2026-08-25");
    expect(url.searchParams.get("hourly")).toBe(
      "cloudcover,cloudcover_low,cloudcover_mid,cloudcover_high,precipitation,windspeed_10m,visibility",
    );
  });

  // Ticket #453 — optional host/apiKey, backward-compatible (Q4): every call
  // above (no host/apiKey given) keeps producing the exact same public,
  // keyless URL as before this ticket.
  it("accepts an optional host/apiKey (Ticket #453) and still defaults to the public, keyless URL when omitted", () => {
    const defaultUrl = new URL(buildOpenMeteoUrl({ lat: 64.1, lon: -21.9, startDate: "2026-08-24", endDate: "2026-08-25" }));
    expect(defaultUrl.origin).toBe("https://api.open-meteo.com");
    expect(defaultUrl.searchParams.has("apikey")).toBe(false);

    const customerUrl = new URL(
      buildOpenMeteoUrl({
        lat: 64.1,
        lon: -21.9,
        startDate: "2026-08-24",
        endDate: "2026-08-25",
        host: "https://customer-api.open-meteo.com",
        apiKey: "sentinel-fake-key",
      }),
    );
    expect(customerUrl.origin).toBe("https://customer-api.open-meteo.com");
    expect(customerUrl.searchParams.getAll("apikey")).toEqual(["sentinel-fake-key"]);
    // wind_speed_unit=ms (#452) and every other param stay present regardless of host/key.
    expect(customerUrl.searchParams.get("wind_speed_unit")).toBe("ms");
  });
});

describe("normalizeOpenMeteoHourly", () => {
  it("maps parallel arrays into row objects with explicit UTC timestamps", () => {
    const payload = {
      hourly: {
        time: ["2026-08-24T22:00", "2026-08-24T23:00"],
        cloudcover: [10, 90],
        cloudcover_low: [5, 80],
        cloudcover_mid: [3, 5],
        cloudcover_high: [2, 5],
        precipitation: [0, 1.2],
        windspeed_10m: [2, 3],
        visibility: [20000, 5000],
      },
    };
    const rows = normalizeOpenMeteoHourly(payload);
    expect(rows).toEqual([
      {
        time: "2026-08-24T22:00:00Z",
        cloudTotal: 10,
        cloudLow: 5,
        cloudMid: 3,
        cloudHigh: 2,
        precipitation: 0,
        windSpeed: 2,
        visibility: 20000,
      },
      {
        time: "2026-08-24T23:00:00Z",
        cloudTotal: 90,
        cloudLow: 80,
        cloudMid: 5,
        cloudHigh: 5,
        precipitation: 1.2,
        windSpeed: 3,
        visibility: 5000,
      },
    ]);
  });

  it("never coerces null/undefined/NaN to 0 — missing values stay missing", () => {
    const payload = {
      hourly: {
        time: ["2026-08-24T22:00"],
        cloudcover: [null],
        cloudcover_low: [undefined],
        cloudcover_mid: [NaN],
        cloudcover_high: [],
        precipitation: [null],
        windspeed_10m: [null],
        visibility: [null],
      },
    };
    const [row] = normalizeOpenMeteoHourly(payload);
    expect(row.cloudTotal).toBeNull();
    expect(row.cloudLow).toBeNull();
    expect(row.cloudMid).toBeNull();
    expect(row.cloudHigh).toBeNull();
    expect(row.precipitation).toBeNull();
    expect(row.windSpeed).toBeNull();
    expect(row.visibility).toBeNull();
  });

  it("returns an empty array for a missing/malformed hourly payload", () => {
    expect(normalizeOpenMeteoHourly({})).toEqual([]);
    expect(normalizeOpenMeteoHourly(null)).toEqual([]);
    expect(normalizeOpenMeteoHourly({ hourly: { time: "not-an-array" } })).toEqual([]);
  });

  // Ticket #452 (N2) — runtime guard on the provider's own reported unit.
  describe("wind-unit runtime guard (N2)", () => {
    const basePayload = {
      hourly: {
        time: ["2026-08-24T22:00"],
        cloudcover: [10],
        windspeed_10m: [5],
      },
    };

    it("passes windSpeed through unchanged when hourly_units.windspeed_10m is exactly 'm/s'", () => {
      const [row] = normalizeOpenMeteoHourly({ ...basePayload, hourly_units: { windspeed_10m: "m/s" } });
      expect(row.windSpeed).toBe(5);
    });

    it("passes windSpeed through unchanged when hourly_units is entirely absent (existing fixtures must keep passing)", () => {
      const [row] = normalizeOpenMeteoHourly(basePayload);
      expect(row.windSpeed).toBe(5);
    });

    it("passes windSpeed through unchanged when hourly_units is present but has no windspeed_10m key", () => {
      const [row] = normalizeOpenMeteoHourly({ ...basePayload, hourly_units: { temperature_2m: "°C" } });
      expect(row.windSpeed).toBe(5);
    });

    it("nulls windSpeed for every row when hourly_units.windspeed_10m is 'km/h' (the suspected regression case) — never converts, never throws", () => {
      const twoRowPayload = {
        hourly: { time: ["2026-08-24T22:00", "2026-08-24T23:00"], windspeed_10m: [5, 43] },
        hourly_units: { windspeed_10m: "km/h" },
      };
      const rows = normalizeOpenMeteoHourly(twoRowPayload);
      expect(rows.map((r) => r.windSpeed)).toEqual([null, null]);
    });

    it("nulls windSpeed when hourly_units.windspeed_10m is present but an invalid/null value", () => {
      const [row] = normalizeOpenMeteoHourly({ ...basePayload, hourly_units: { windspeed_10m: null } });
      expect(row.windSpeed).toBeNull();
    });

    it("the guard never nulls other fields — cloud/precipitation/visibility stay independently unaffected", () => {
      const [row] = normalizeOpenMeteoHourly({ ...basePayload, hourly_units: { windspeed_10m: "km/h" } });
      expect(row.cloudTotal).toBe(10);
    });
  });
});

describe("fetchLocationWeather", () => {
  const args = { lat: 64.1, lon: -21.9, startDate: "2026-08-24", endDate: "2026-08-25" };

  it("returns ok:true with normalized rows on a successful response", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        hourly: {
          time: ["2026-08-24T22:00"],
          cloudcover: [10],
          cloudcover_low: [5],
          cloudcover_mid: [3],
          cloudcover_high: [2],
          precipitation: [0],
          windspeed_10m: [2],
          visibility: [20000],
        },
      }),
    });
    const result = await fetchLocationWeather({ ...args, fetchImpl });
    expect(result.ok).toBe(true);
    expect(result.hourlyRows).toHaveLength(1);
  });

  it("isolates a non-ok upstream response as weather_fetch_failed, without throwing", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: false, json: async () => ({}) });
    const result = await fetchLocationWeather({ ...args, fetchImpl });
    expect(result).toEqual({ ok: false, reason: "weather_fetch_failed" });
  });

  it("isolates a network error as weather_fetch_failed, without throwing", async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new Error("network down"));
    const result = await fetchLocationWeather({ ...args, fetchImpl });
    expect(result).toEqual({ ok: false, reason: "weather_fetch_failed" });
  });

  it("isolates an abort/timeout as weather_timeout, without throwing", async () => {
    const abortError = new Error("aborted");
    abortError.name = "AbortError";
    const fetchImpl = vi.fn().mockRejectedValue(abortError);
    const result = await fetchLocationWeather({ ...args, fetchImpl });
    expect(result).toEqual({ ok: false, reason: "weather_timeout" });
  });

  it("isolates insufficient forecast coverage (empty normalized rows) without throwing", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ hourly: { time: [] } }) });
    const result = await fetchLocationWeather({ ...args, fetchImpl });
    expect(result).toEqual({ ok: false, reason: "insufficient_forecast_coverage" });
  });
});

// Ticket #452 (N3/N4) — real pipeline integration: fetchLocationWeather ->
// normalizeOpenMeteoHourly (both actual, imported functions) -> the actual
// scorer (scoreAuroraVisibility), never hand-built scorer rows. The mocked
// fetchImpl simulates provider contract (mocked fetch) honouring the
// requested spelling: it returns km/h-scaled values when the unit param is
// absent/wrong, "ms"-scaled when the request matches wind_speed_unit=ms —
// so the test genuinely fails if the parameter is ever dropped or
// misspelled in buildOpenMeteoUrl, not just when the response is malformed.
describe("real-pipeline wind-unit equivalence (Ticket #452, simulated provider contract — mocked fetch)", () => {
  const args = { lat: 64.1, lon: -21.9, startDate: "2026-08-24", endDate: "2026-08-25" };

  const EVENING_DATE = "2026-08-24";
  const night = {
    eveningDate: EVENING_DATE,
    auroraActivity: 9,
    sun: { sunset: "21:13", darknessStart: "22:00", dawn: "05:00", sunrise: "05:49" },
    moon: { ageDays: 0, rise: null, set: null, scheduleType: 1 },
  };
  const viewingWindow = { start: "2026-08-24T18:00:00Z", end: "2026-08-25T08:00:00Z" };
  const HOURLY_TIME = ["2026-08-24T22:00", "2026-08-24T23:00", "2026-08-25T00:00", "2026-08-25T01:00"];

  // Same cloud/activity on both sides — only the wind magnitude/unit differs
  // — so score/band must come out identical; only the `high_wind` flag may
  // differ between the two runs.
  function makePayload({ windValues, windUnit }) {
    return {
      hourly: {
        time: HOURLY_TIME,
        cloudcover: HOURLY_TIME.map(() => 0),
        windspeed_10m: HOURLY_TIME.map(() => windValues),
      },
      ...(windUnit ? { hourly_units: { windspeed_10m: windUnit } } : {}),
    };
  }

  // Simulates what an UNREQUESTED-unit response would honestly look like:
  // Open-Meteo's own documented default is km/h, so a provider that received
  // no wind_speed_unit parameter would report a physically-18km/h wind as
  // "18" — this is how the pre-fix code's request (missing the parameter
  // entirely) would have been answered.
  function honoringFetchImpl() {
    return vi.fn(async (url) => {
      const parsed = new URL(url);
      const requestedUnit = parsed.searchParams.get("wind_speed_unit");
      const requestedLegacyUnit = parsed.searchParams.get("windspeed_unit");
      if (requestedLegacyUnit) {
        throw new Error("test contract violation: a legacy windspeed_unit param must never be sent alongside/instead of wind_speed_unit");
      }
      const windValues = requestedUnit === "ms" ? 5 : 18; // 18 km/h is physically ~5 m/s
      const windUnit = requestedUnit === "ms" ? "m/s" : undefined; // unrequested case: no metadata, matches real unrequested behavior
      return { ok: true, json: async () => makePayload({ windValues, windUnit }) };
    });
  }

  it("before/after: identical score+band, but the wind flag only fires on the wrong-unit (pre-fix-equivalent) response", async () => {
    // "Before" run: simulate the OLD code's request by calling the fetchImpl
    // directly with a URL that has no wind_speed_unit param, bypassing
    // buildOpenMeteoUrl (which now always sets it) — this reproduces exactly
    // what the provider would have answered under the old, unfixed request.
    const fetchImplBefore = honoringFetchImpl();
    const beforeUrl = new URL(buildOpenMeteoUrl(args));
    beforeUrl.searchParams.delete("wind_speed_unit");
    const beforeResult = await fetchLocationWeather({ ...args, fetchImpl: (_url, opts) => fetchImplBefore(beforeUrl.toString(), opts) });
    expect(beforeResult.ok).toBe(true);
    const beforeScored = scoreAuroraVisibility({ night, hourlyRows: beforeResult.hourlyRows, viewingWindow });

    // "After" run: the actual current code path — buildOpenMeteoUrl always
    // includes wind_speed_unit=ms, exercised via the real fetchLocationWeather.
    const fetchImplAfter = honoringFetchImpl();
    const afterResult = await fetchLocationWeather({ ...args, fetchImpl: fetchImplAfter });
    expect(afterResult.ok).toBe(true);
    const afterScored = scoreAuroraVisibility({ night, hourlyRows: afterResult.hourlyRows, viewingWindow });

    // The captured URL genuinely carries the documented canonical parameter
    // — if buildOpenMeteoUrl ever drops or misspells it, this call receives
    // windValues=18 instead of 5 and the flag assertions below fail.
    const capturedUrl = new URL(fetchImplAfter.mock.calls[0][0]);
    expect(capturedUrl.searchParams.get("wind_speed_unit")).toBe("ms");

    // Before: 18 (raw, no unit correction) >= HIGH_WIND_MS_THRESHOLD(12) -> flagged.
    expect(beforeScored.flags).toContain("high_wind");
    // After: 5 m/s < 12 -> not flagged — the physically-equivalent wind no longer trips the comfort flag.
    expect(afterScored.flags).not.toContain("high_wind");

    // Score, band and reasons are driven entirely by cloud/activity here —
    // wind must never have touched them, in either run.
    expect(afterScored.score).toBe(beforeScored.score);
    expect(afterScored.band).toBe(beforeScored.band);
    expect(afterScored.reasons).toEqual(beforeScored.reasons);
  });

  it(">=12 m/s boundary (11.9/12/12.1) drives the flag identically through the real pipeline, with non-wind score parity", async () => {
    async function scoreAtWind(windValue) {
      const fetchImpl = vi.fn(async () => ({ ok: true, json: async () => makePayload({ windValues: windValue, windUnit: "m/s" }) }));
      const result = await fetchLocationWeather({ ...args, fetchImpl });
      return scoreAuroraVisibility({ night, hourlyRows: result.hourlyRows, viewingWindow });
    }

    const below = await scoreAtWind(11.9);
    const at = await scoreAtWind(12);
    const above = await scoreAtWind(12.1);

    expect(below.flags).not.toContain("high_wind");
    expect(at.flags).toContain("high_wind");
    expect(above.flags).toContain("high_wind");

    // Non-wind inputs are identical across all three — score/band must match.
    expect(at.score).toBe(below.score);
    expect(above.score).toBe(below.score);
    expect(at.band).toBe(below.band);
  });

  it("missing/invalid wind values stay null through the real pipeline and never trigger the flag", async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        hourly: { time: HOURLY_TIME, cloudcover: HOURLY_TIME.map(() => 0), windspeed_10m: HOURLY_TIME.map(() => null) },
        hourly_units: { windspeed_10m: "m/s" },
      }),
    }));
    const result = await fetchLocationWeather({ ...args, fetchImpl });
    expect(result.hourlyRows.every((r) => r.windSpeed === null)).toBe(true);
    const scored = scoreAuroraVisibility({ night, hourlyRows: result.hourlyRows, viewingWindow });
    expect(scored.flags).not.toContain("high_wind");
  });
});

// Ticket #453 — shared Open-Meteo host/key selection, exercised through the
// real fetchLocationWeather (not the helper's own unit tests in
// api/_lib/openMeteoAuth.test.js).
describe("fetchLocationWeather — Ticket #453: host/key selection and no-fallback behavior", () => {
  const args = { lat: 64.1, lon: -21.9, startDate: "2026-08-24", endDate: "2026-08-25" };
  const ORIGINAL_KEY = process.env.OPEN_METEO_API_KEY;
  const ORIGINAL_VERCEL_ENV = process.env.VERCEL_ENV;

  afterEach(() => {
    if (ORIGINAL_KEY === undefined) delete process.env.OPEN_METEO_API_KEY;
    else process.env.OPEN_METEO_API_KEY = ORIGINAL_KEY;
    if (ORIGINAL_VERCEL_ENV === undefined) delete process.env.VERCEL_ENV;
    else process.env.VERCEL_ENV = ORIGINAL_VERCEL_ENV;
  });

  function emptyHourlyPayload() {
    return { hourly: { time: ["2026-08-24T22:00"], windspeed_10m: [5] }, hourly_units: { windspeed_10m: "m/s" } };
  }

  it("with a configured (fake) key: requests the customer host with exactly one apikey, #452's wind_speed_unit=ms still present", async () => {
    process.env.OPEN_METEO_API_KEY = "sentinel-fake-key";
    delete process.env.VERCEL_ENV;
    const fetchImpl = vi.fn(async () => ({ ok: true, json: async () => emptyHourlyPayload() }));

    const result = await fetchLocationWeather({ ...args, fetchImpl });

    expect(result.ok).toBe(true);
    const requestedUrl = new URL(fetchImpl.mock.calls[0][0]);
    expect(requestedUrl.origin).toBe("https://customer-api.open-meteo.com");
    expect(requestedUrl.searchParams.getAll("apikey")).toEqual(["sentinel-fake-key"]);
    expect(requestedUrl.searchParams.get("wind_speed_unit")).toBe("ms");
  });

  it("without a key, VERCEL_ENV undefined: requests the public host, no apikey param (unchanged from before #453)", async () => {
    delete process.env.OPEN_METEO_API_KEY;
    delete process.env.VERCEL_ENV;
    const fetchImpl = vi.fn(async () => ({ ok: true, json: async () => emptyHourlyPayload() }));

    const result = await fetchLocationWeather({ ...args, fetchImpl });

    expect(result.ok).toBe(true);
    const requestedUrl = new URL(fetchImpl.mock.calls[0][0]);
    expect(requestedUrl.origin).toBe("https://api.open-meteo.com");
    expect(requestedUrl.searchParams.has("apikey")).toBe(false);
  });

  it("without a key, VERCEL_ENV='production': fails closed as a structured per-location result — NOT an exception, fetchImpl never called", async () => {
    delete process.env.OPEN_METEO_API_KEY;
    process.env.VERCEL_ENV = "production";
    const fetchImpl = vi.fn();

    const result = await fetchLocationWeather({ ...args, fetchImpl });

    expect(fetchImpl).not.toHaveBeenCalled();
    expect(result).toEqual({ ok: false, reason: "weather_fetch_failed" }); // existing reason, per Q3 — not a new string
  });

  it("the production fail-closed path never throws, so it never escapes a Promise.all fan-out", async () => {
    delete process.env.OPEN_METEO_API_KEY;
    process.env.VERCEL_ENV = "production";
    const fetchImpl = vi.fn();

    await expect(fetchLocationWeather({ ...args, fetchImpl })).resolves.toEqual({ ok: false, reason: "weather_fetch_failed" });
  });

  it("a 401 from the keyed host is NOT retried on the public host (no fallback after a keyed-request failure)", async () => {
    process.env.OPEN_METEO_API_KEY = "sentinel-fake-key";
    delete process.env.VERCEL_ENV;
    const fetchImpl = vi.fn(async () => ({ ok: false, status: 401 }));

    const result = await fetchLocationWeather({ ...args, fetchImpl });

    expect(fetchImpl).toHaveBeenCalledOnce(); // never a second, fallback request
    expect(result).toEqual({ ok: false, reason: "weather_fetch_failed" });
  });

  it("Q5: logs only the status code for a non-ok keyed response — never the body or the request URL", async () => {
    process.env.OPEN_METEO_API_KEY = "sentinel-fake-key";
    delete process.env.VERCEL_ENV;
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const fetchImpl = vi.fn(async () => ({ ok: false, status: 401 }));

    await fetchLocationWeather({ ...args, fetchImpl });

    const allLoggedText = formatConsoleCalls(errorSpy);
    expect(allLoggedText).not.toContain("sentinel-fake-key");
    expect(allLoggedText).not.toMatch(/https?:\/\//);
    expect(allLoggedText).toContain("401");
    errorSpy.mockRestore();
  });

  it("Q3: the production fail-closed path logs a static, nonsecret diagnostic naming the environment, never the key", async () => {
    delete process.env.OPEN_METEO_API_KEY;
    process.env.VERCEL_ENV = "production";
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const fetchImpl = vi.fn();

    await fetchLocationWeather({ ...args, fetchImpl });

    const allLoggedText = formatConsoleCalls(errorSpy);
    expect(allLoggedText).toContain("production");
    expect(allLoggedText).not.toMatch(/https?:\/\//);
    errorSpy.mockRestore();
  });

  // Ticket #453 v2 (T1): strengthened with util.format (see formatConsoleCalls
  // below) instead of JSON.stringify — JSON.stringify(someError) renders as
  // `{}`, so a test built on it would pass even if the implementation logged
  // a raw Error. Extended to cover name/stack too, not just message.
  it("Q5/T1: a thrown fetch error whose message, name, AND stack all embed the keyed URL/sentinel never reaches console output", async () => {
    process.env.OPEN_METEO_API_KEY = "sentinel-fake-key";
    delete process.env.VERCEL_ENV;
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const keyedUrlError = new Error("fetch failed: https://customer-api.open-meteo.com/v1/forecast?apikey=sentinel-fake-key");
    keyedUrlError.name = "sentinel-fake-key-in-name";
    keyedUrlError.stack = "sentinel-fake-key-in-stack\n" + keyedUrlError.stack;
    const fetchImpl = vi.fn().mockRejectedValue(keyedUrlError);

    const result = await fetchLocationWeather({ ...args, fetchImpl });

    expect(formatConsoleCalls(errorSpy)).not.toContain("sentinel-fake-key");
    expect(result).toEqual({ ok: false, reason: "weather_fetch_failed" });
    errorSpy.mockRestore();
  });

  // Ticket #453 v2 (D2-equivalent for the aurora path): a thrown value need
  // not even be an Error — its properties are entirely caller-controlled.
  it("Q5/D2: a thrown plain object (not an Error) with an attacker-controlled name/message is never logged", async () => {
    process.env.OPEN_METEO_API_KEY = "sentinel-fake-key";
    delete process.env.VERCEL_ENV;
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const thrownObject = { name: "sentinel-fake-key-name", message: "sentinel-fake-key-message", stack: "sentinel-fake-key-stack" };
    const fetchImpl = vi.fn().mockRejectedValue(thrownObject);

    const result = await fetchLocationWeather({ ...args, fetchImpl });

    expect(formatConsoleCalls(errorSpy)).not.toContain("sentinel-fake-key");
    expect(result).toEqual({ ok: false, reason: "weather_fetch_failed" });
    errorSpy.mockRestore();
  });

  // Ticket #453 v2 (T1): proves the capture method itself is sound.
  it("capture formatter sanity check: util.format exposes a sentinel embedded in a raw Error, where JSON.stringify would hide it", () => {
    const err = new Error("boom containing sentinel-fake-key");
    const viaJsonStringify = JSON.stringify(["label", err]);
    const viaUtilFormat = format("label", err);

    expect(viaJsonStringify).not.toContain("sentinel-fake-key"); // demonstrates why JSON.stringify was inadequate (T1)
    expect(viaUtilFormat).toContain("sentinel-fake-key"); // demonstrates the strengthened formatter actually catches it
  });
});
