// api/forecast.js
export default async function handler(req, res) {
  try {
    // Basic CORS (not strictly needed for same-origin, but harmless)
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") return res.status(200).end();
    if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

    const url = new URL(req.url, `http://${req.headers.host}`);
    const q = url.searchParams;

    const latRaw = q.get("lat") ?? q.get("latitude");
    const lonRaw = q.get("lon") ?? q.get("longitude");

    if (!latRaw || !lonRaw) {
        return res.status(400).json({ error: "Missing required params: latitude/longitude" });
    }


    // Round lat/lon a bit -> better cache hit rate (same campsite coords)
    const lat = Number(latRaw);
    const lon = Number(lonRaw);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      return res.status(400).json({ error: "Invalid lat/lon" });
    }
    const latRounded = lat.toFixed(4);
    const lonRounded = lon.toFixed(4);

    // Allowlist optional params you might vary (keeps cache keys predictable)
    const timezone = q.get("timezone") || "auto";

    // If you later add units toggles, you can pass these through too.
    // Open-Meteo supports temperature_unit, windspeed_unit, precipitation_unit, etc.
    const temperature_unit = q.get("temperature_unit"); // "celsius" | "fahrenheit"
    const windspeed_unit = q.get("windspeed_unit");     // "ms" | "mph" | ...
    const precipitation_unit = q.get("precipitation_unit"); // "mm" | "inch"

    // Choose the payload your app needs (daily 7-day + codes)
    const upstream = new URL("https://api.open-meteo.com/v1/forecast");
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
        "winddirection_10m_dominant", // future: wind direction/shelter index
      ].join(",")
    );

    upstream.searchParams.set("forecast_days", "7");
    upstream.searchParams.set("timezone", timezone);

    if (temperature_unit) upstream.searchParams.set("temperature_unit", temperature_unit);
    if (windspeed_unit) upstream.searchParams.set("windspeed_unit", windspeed_unit);
    if (precipitation_unit) upstream.searchParams.set("precipitation_unit", precipitation_unit);

    // Timeout so we fail fast and your retry UI kicks in
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 8000);

    const r = await fetch(upstream.toString(), {
      headers: { "User-Agent": "CampCast (Vercel proxy)" },
      signal: controller.signal,
    }).finally(() => clearTimeout(t));

    const text = await r.text();

    // Shared edge caching:
    // - s-maxage: cache at CDN for 30 minutes
    // - stale-while-revalidate: allow serving stale while refreshing for 24h
    res.setHeader("Cache-Control", "public, s-maxage=1800, stale-while-revalidate=86400");

    // Pass through status + JSON (or return error wrapper if upstream isn't ok)
    if (!r.ok) {
      return res.status(r.status).send(text);
    }

    // Ensure JSON response type
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    return res.status(200).send(text);
  } catch (err) {
    const msg = err?.name === "AbortError" ? "Upstream timeout" : "Proxy error";
    return res.status(502).json({ error: msg });
  }
}
