// Ticket #501 metadata-acquisition — the ONE authorized request.
// Built-in Node modules only (https, crypto, fs, url). No dependency
// installation. No retries, no redirect-following, no alternative URL.
// Writes only inside this same directory.
import https from "node:https";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const OUT_DIR = path.dirname(fileURLToPath(import.meta.url));
const URL_STRING =
  "https://gagnaveita.vegagerdin.is/geoserver/gis/ows?service=WFS&version=1.0.0&request=DescribeFeatureType&typeName=gis%3Avegakerfi_ist120_2024_1";
const MAX_BYTES = 262144;
const WALL_TIMEOUT_MS = 20000;
const USER_AGENT = "EltumVedridResearch/1.0 (ticket-501 metadata-acquisition; contact: research-only)";

function nowIso() {
  return new Date().toISOString();
}

async function run() {
  const url = new URL(URL_STRING);
  const clientStart = nowIso();
  const startedAtMs = Date.now();

  const result = {
    request_id: "ROAD-REGISTER-SCHEMA",
    method: "GET",
    url: URL_STRING,
    user_agent: USER_AGENT,
    client_start_utc: clientStart,
    client_end_utc: null,
    http_status: null,
    server_date_header: null,
    headers: null,
    byte_count: 0,
    max_bytes: MAX_BYTES,
    outcome: null, // "complete" | "partial_overflow" | "failed"
    failure_reason: null,
    sha256_of_retained_bytes: null,
    body_file: null,
  };

  await new Promise((resolve) => {
    let settled = false;
    const chunks = [];
    let totalBytes = 0;
    let overflowed = false;

    const req = https.request(
      {
        method: "GET",
        hostname: url.hostname,
        path: url.pathname + url.search,
        protocol: url.protocol,
        headers: { "User-Agent": USER_AGENT, Accept: "*/*" },
        // Node's https.request never follows redirects on its own —
        // a 3xx status simply arrives as the response below.
      },
      (res) => {
        result.http_status = res.statusCode;
        result.headers = res.headers;
        result.server_date_header = res.headers.date ?? null;

        res.on("data", (chunk) => {
          if (overflowed) return;
          totalBytes += chunk.length;
          if (totalBytes > MAX_BYTES) {
            overflowed = true;
            // Keep only up to the cap, then abort the connection.
            const allowed = MAX_BYTES - (totalBytes - chunk.length);
            if (allowed > 0) chunks.push(chunk.subarray(0, allowed));
            req.destroy(new Error("byte_cap_exceeded"));
            return;
          }
          chunks.push(chunk);
        });

        res.on("end", () => {
          if (settled) return;
          settled = true;
          const buf = Buffer.concat(chunks);
          result.byte_count = buf.length;
          result.sha256_of_retained_bytes = crypto.createHash("sha256").update(buf).digest("hex");
          if (overflowed) {
            result.outcome = "partial_overflow";
            result.failure_reason = "response_exceeded_262144_bytes_truncated_and_aborted";
          } else if (res.statusCode >= 300 && res.statusCode < 400) {
            result.outcome = "failed";
            result.failure_reason = `redirect_not_followed_status_${res.statusCode}`;
          } else if (res.statusCode !== 200) {
            result.outcome = "failed";
            result.failure_reason = `http_status_${res.statusCode}`;
          } else {
            result.outcome = "complete";
          }
          const ext = result.outcome === "failed" ? "bin" : "xml";
          const bodyPath = path.join(OUT_DIR, `raw-ROAD-REGISTER-SCHEMA.${ext}`);
          fs.writeFileSync(bodyPath, buf);
          result.body_file = path.basename(bodyPath);
          resolve();
        });

        res.on("error", (err) => {
          if (settled) return;
          settled = true;
          result.outcome = "failed";
          result.failure_reason = `response_stream_error:${err.message}`;
          resolve();
        });
      }
    );

    req.setTimeout(WALL_TIMEOUT_MS, () => {
      if (settled) return;
      settled = true;
      result.outcome = "failed";
      result.failure_reason = "wall_timeout_20s";
      req.destroy(new Error("timeout"));
      resolve();
    });

    req.on("error", (err) => {
      if (settled) return;
      settled = true;
      // If the cap-abort fired req.destroy() with our own Error, the
      // 'end'/'data' handler above has already set outcome -- only
      // record here if nothing was settled yet (a genuine transport error).
      if (!result.outcome) {
        result.outcome = "failed";
        result.failure_reason = `request_error:${err.message}`;
      }
      resolve();
    });

    req.end();
  });

  result.client_end_utc = nowIso();
  result.wall_time_ms = Date.now() - startedAtMs;

  const ledgerPath = path.join(OUT_DIR, "request-ledger.json");
  fs.writeFileSync(ledgerPath, JSON.stringify(result, null, 2) + "\n", "utf8");
  console.log(JSON.stringify({ outcome: result.outcome, http_status: result.http_status, byte_count: result.byte_count, failure_reason: result.failure_reason }));
}

run();
