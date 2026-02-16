// api/campsites.js
import { getMeFromRequest } from "./_lib/getMe.js";
import fs from "fs/promises";
import path from "path";

async function readJson(relPath) {
  const filePath = path.join(process.cwd(), relPath);
  const raw = await fs.readFile(filePath, "utf8");
  return JSON.parse(raw);
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    const me = await getMeFromRequest(req);
    const isPro = !!me?.entitlements?.pro;

    const rel = isPro
      ? "server_data/campsites.full.json"
      : "server_data/campsites.limited.json";

    const data = await readJson(rel);
    const campsites = Array.isArray(data) ? data : [];

    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Cache-Control", "private, no-store");
    res.setHeader("Vary", "Cookie");

    return res.status(200).json({
      ok: true,
      tier: isPro ? "pro" : "free",
      campsites,
    });
  } catch (e) {
    return res.status(500).json({
      ok: false,
      error: String(e?.message || e),
    });
  }
}
