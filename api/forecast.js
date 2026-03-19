// api/forecast.js
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

    const API_KEY = process.env.OPEN_METEO_API_KEY;

    const upstream = new URL(
      API_KEY
        ? "https://customer-api.open-meteo.com/v1/forecast"
        : "https://api.open-meteo.com/v1/forecast"
    );

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

    upstream.searchParams.set(
      "hourly",
      ["precipitation", "windspeed_10m", "windgusts_10m"].join(",")
    );

    upstream.searchParams.set("forecast_days", "7");
    upstream.searchParams.set("timezone", timezone);

    if (temperature_unit) upstream.searchParams.set("temperature_unit", temperature_unit);
    if (windspeed_unit) upstream.searchParams.set("windspeed_unit", windspeed_unit);
    if (precipitation_unit) upstream.searchParams.set("precipitation_unit", precipitation_unit);

    if (API_KEY) {
      upstream.searchParams.set("apikey", API_KEY);
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
      console.error("Forecast upstream failed:", r.status, text);

      return res.status(502).json({
        error: "forecast_failed",
        upstreamStatus: r.status,
      });
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch (parseErr) {
      console.error("Forecast upstream returned invalid JSON:", parseErr);

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

    console.error("Forecast proxy error:", err);
    return res.status(502).json({ error: "forecast_error" });
  }
}
