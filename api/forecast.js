// api/forecast.js
import { resolveOpenMeteoAuth } from "./_lib/openMeteoAuth.js";

export default async function handler(req, res) {
  try {
    // Basic CORS (not strictly needed for same-origin, but harmless)
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") return res.status(200).end();
    if (req.method !== "GET") return res.status(405).json({ error: "method_not_allowed" });

    const url = new URL(req.url, `http://${req.headers.host}`);
    const q = url.searchParams;

    const latRaw = q.get("lat") ?? q.get("latitude");
    const lonRaw = q.get("lon") ?? q.get("longitude");

    if (!latRaw || !lonRaw) {
      return res.status(400).json({ error: "missing_lat_lon" });
    }

    const lat = Number(latRaw);
    const lon = Number(lonRaw);

    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      return res.status(400).json({ error: "invalid_lat_lon" });
    }

    // Round lat/lon a bit -> better cache hit rate
    const latRounded = lat.toFixed(4);
    const lonRounded = lon.toFixed(4);

    const timezone = q.get("timezone") || "auto";
    const temperature_unit = q.get("temperature_unit");
    const windspeed_unit = q.get("windspeed_unit");
    const precipitation_unit = q.get("precipitation_unit");

    // Ticket #453 (Q1/Q3): shared host/key selection; a missing/blank key
    // fails closed only in Production (defence in depth — Production is
    // owner-confirmed keyed), never silently falls back there, and never
    // retries on the public host after any keyed-request failure.
    const auth = resolveOpenMeteoAuth();
    if (auth.failClosed) {
      console.error("open-meteo: api key missing; failing closed for forecast proxy (environment: production)");
      res.setHeader("Cache-Control", "no-store");
      return res.status(502).json({ error: "forecast_error" });
    }

    const upstream = new URL(`${auth.host}/v1/forecast`);

    upstream.searchParams.set("latitude", latRounded);
    upstream.searchParams.set("longitude", lonRounded);

    upstream.searchParams.set(
      "daily",
      [
        "weathercode",
        "temperature_2m_max",
        "temperature_2m_min",
        "precipitation_sum",
        "windspeed_10m_max",
        "windgusts_10m_max",
        "winddirection_10m_dominant",
      ].join(",")
    );

    // Hourly fields are used by campsite hourly drill-down modal.
    // cloudcover/cloudcover_low/_mid/_high and visibility are additive
    // groundwork for Northern Lights Ticket 2/3 — not consumed by any
    // scoring/recommendation logic yet (Ticket 1 scope is data
    // availability only). Existing consumers are unaffected: this route
    // is a pure passthrough (no per-field processing), so new response
    // fields simply appear alongside the existing ones.
    upstream.searchParams.set(
      "hourly",
      [
        "temperature_2m",
        "weathercode",
        "precipitation",
        "precipitation_probability",
        "windspeed_10m",
        "windgusts_10m",
        "cloudcover",
        "cloudcover_low",
        "cloudcover_mid",
        "cloudcover_high",
        "visibility",
      ].join(",")
    );

    upstream.searchParams.set("forecast_days", "7");
    upstream.searchParams.set("timezone", timezone);

    if (temperature_unit) upstream.searchParams.set("temperature_unit", temperature_unit);
    if (windspeed_unit) upstream.searchParams.set("windspeed_unit", windspeed_unit);
    if (precipitation_unit) upstream.searchParams.set("precipitation_unit", precipitation_unit);

    if (auth.apiKey) {
      upstream.searchParams.set("apikey", auth.apiKey);
    }

    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 8000);

    const r = await fetch(upstream.toString(), {
      headers: { "User-Agent": "CampCast (Vercel proxy)" },
      signal: controller.signal,
    }).finally(() => clearTimeout(t));

    const text = await r.text();

    res.setHeader("Cache-Control", "no-store");

    if (!r.ok) {
      // Ticket #453 (Q5): status code only — the upstream body is never
      // logged (a keyed URL/apikey could appear inside an upstream error
      // message or echoed text).
      console.error("Forecast upstream failed", { status: r.status });

      return res.status(502).json({
        error: "forecast_failed",
        upstreamStatus: r.status,
      });
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      // Ticket #453 v2 (D1): static message + status only — never the raw
      // parse error or the unparsed upstream text, which could itself
      // contain an echoed keyed URL.
      console.error("Forecast upstream returned invalid JSON", { status: r.status });

      return res.status(502).json({ error: "forecast_invalid_json" });
    }

    if (!data || !data.daily || !Array.isArray(data.daily.time)) {
      console.error("Forecast upstream returned invalid payload shape");

      return res.status(502).json({ error: "forecast_invalid_payload" });
    }

    return res.status(200).json(data);
  } catch (err) {
    if (err?.name === "AbortError") {
      console.error("Forecast upstream timeout");
      return res.status(502).json({ error: "forecast_timeout" });
    }

    // Ticket #453 v2 (D2, Ripley's stricter decision): a fixed, fully
    // static diagnostic only — not even `err.name`, since a thrown value is
    // caller-controlled and could set `name` to anything (including a
    // sentinel/credential-bearing string); never the raw error object,
    // message, or stack, which for a fetch failure can include the request
    // URL (and therefore a keyed apikey) in some runtimes.
    console.error("Forecast proxy error");
    return res.status(502).json({ error: "forecast_error" });
  }
}
