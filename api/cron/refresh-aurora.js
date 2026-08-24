// api/cron/refresh-aurora.js
//
// The ONLY code path in this project allowed to call Vedur.is. Triggered
// exclusively by Vercel Cron (see vercel.json's "crons" entry), which
// automatically sends `Authorization: Bearer $CRON_SECRET` — the exact same
// auth pattern already proven by api/cron/generate-blog-draft.js, reused
// here unchanged.
//
// Required order (auth before anything else): an unauthorized request must
// never claim the lease, never touch the DB, and never call Vedur.is. A
// single-flight lease is a concurrency guard, not an authentication
// mechanism — it does not protect against an unauthorized caller hitting
// this endpoint repeatedly.

import postgres from "postgres";
import { claimAuroraRefreshLease, releaseAuroraRefreshLease, persistAuroraSnapshot } from "../_lib/aurora/cache.js";
import { fetchAuroraXml } from "../_lib/aurora/fetchAurora.js";
import { parseAuroraSnapshot } from "../_lib/aurora/parseAurora.js";

const sql = postgres(process.env.POSTGRES_URL, { ssl: "require", max: 1 });

export default async function handler(req, res) {
  const authHeader = req.headers?.authorization;
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    console.warn("[cron/refresh-aurora] unauthorized request rejected");
    return res.status(401).json({ ok: false, error: "Unauthorized" });
  }

  let claimed = false;

  try {
    claimed = await claimAuroraRefreshLease(sql);

    if (!claimed) {
      console.log("[cron/refresh-aurora] lease not acquired — refresh already in progress, skipping");
      return res.status(200).json({ ok: true, skipped: true, reason: "lease_not_acquired" });
    }

    console.log("[cron/refresh-aurora] lease acquired, refresh started");

    const xml = await fetchAuroraXml();
    const nights = parseAuroraSnapshot(xml);

    if (!nights.length) {
      throw new Error("Parsed aurora snapshot was empty");
    }

    await persistAuroraSnapshot(sql, { nights, sourceFetchedAt: new Date().toISOString() });

    console.log(`[cron/refresh-aurora] refresh succeeded, nights=${nights.length}`);
    return res.status(200).json({ ok: true, refreshed: true, nights: nights.length });
  } catch (err) {
    console.error("[cron/refresh-aurora] fetch failed, retaining last-known-good:", err?.message);

    if (claimed) {
      await releaseAuroraRefreshLease(sql).catch((releaseErr) => {
        console.error("[cron/refresh-aurora] failed to release lease:", releaseErr?.message);
      });
    }

    return res.status(500).json({ ok: false, error: "refresh_failed" });
  }
}
