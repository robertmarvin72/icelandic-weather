#!/usr/bin/env python3
"""
#493 phase2 -- small, bounded, stdlib-only HTTP fetch wrapper (item 6 /
P2 / P3). NOT a general client framework -- one function, used for
exactly the planned requests in pre-sample-plan.md.

Enforces, before and during every call:
  - hostname allowlist (exact match), checked BEFORE connecting
  - TLS certificate verification (never disabled)
  - no automatic redirect following (a redirect is ledgered as its own
    completed exchange, then STOP -- never silently followed)
  - no automatic retries
  - a per-request timeout
  - a streamed read capped at min(per_body_cap, remaining_total_budget)
    -- never reads an unbounded body, even for a chunked response with
    no Content-Length
  - a ledger entry (UTC start/end, status, bytes received, truncated?,
    SHA-256 of the bytes actually read, the exact request method/url/
    headers/body) written for EVERY call, success or failure

Used two ways this round:
  1. Local self-test against 127.0.0.1 (P3) -- its own separate ledger,
     `local-test-ledger.json`, never touching the real exchange budget.
  2. The real, planned external calls -- `exchange-ledger.jsonl`.
"""
import hashlib
import http.client
import json
import ssl
import time
import urllib.parse
from datetime import datetime, timezone

ALLOWLIST = {"px.hagstofa.is", "gagnaveita.vegagerdin.is"}


class BoundedFetchError(Exception):
    pass


def _utc_now_iso():
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%fZ")


def bounded_fetch(
    method,
    url,
    *,
    body=None,
    headers=None,
    timeout_s=20,
    per_body_cap_bytes=8 * 1024 * 1024,
    remaining_total_budget_bytes=32 * 1024 * 1024,
    allowlist=ALLOWLIST,
    allow_insecure_for_local_test=False,
):
    """Returns a ledger-entry dict. Never raises for an HTTP-level error
    (4xx/5xx) or a redirect -- those are recorded as completed exchanges
    with their own status. Raises BoundedFetchError only for a pre-flight
    violation (disallowed host) that must stop BEFORE any connection."""
    parsed = urllib.parse.urlsplit(url)
    host = parsed.hostname
    if host not in allowlist:
        raise BoundedFetchError(f"host {host!r} not in allowlist {sorted(allowlist)} -- STOP before connecting")
    if parsed.scheme != "https" and not allow_insecure_for_local_test:
        raise BoundedFetchError(f"refusing non-HTTPS scheme {parsed.scheme!r} for external host {host!r}")

    cap = min(per_body_cap_bytes, remaining_total_budget_bytes)
    started_at = _utc_now_iso()
    t0 = time.monotonic()

    entry = {
        "started_at_utc": started_at,
        "method": method,
        "url": url,
        "request_headers": dict(headers or {}),
        "request_body": body if body is None else (body.decode("utf-8", "replace") if isinstance(body, bytes) else body),
        "host": host,
        "allowlisted": True,
    }

    try:
        if parsed.scheme == "https":
            ctx = ssl.create_default_context()  # TLS verification ON, never disabled
            conn = http.client.HTTPSConnection(host, parsed.port or 443, timeout=timeout_s, context=ctx)
        else:
            if not allow_insecure_for_local_test:
                raise BoundedFetchError("non-HTTPS only permitted for local self-test")
            conn = http.client.HTTPConnection(host, parsed.port, timeout=timeout_s)

        path = parsed.path or "/"
        if parsed.query:
            path += "?" + parsed.query

        req_body = body
        if isinstance(req_body, str):
            req_body = req_body.encode("utf-8")

        conn.request(method, path, body=req_body, headers=headers or {})
        resp = conn.getresponse()  # no automatic redirect following here

        status = resp.status
        truncated = False
        received = bytearray()
        remaining = cap
        try:
            while remaining > 0:
                chunk = resp.read(min(65536, remaining))
                if not chunk:
                    break
                received.extend(chunk)
                remaining -= len(chunk)
            if remaining == 0:
                # Confirm whether more data was actually available beyond
                # the cap (chunked/no-Content-Length-safe check).
                extra = resp.read(1)
                if extra:
                    truncated = True
        except TimeoutError:
            entry["timeout"] = True
            status = entry.get("status", status)
        finally:
            conn.close()

        elapsed_s = time.monotonic() - t0
        data = bytes(received)
        entry.update(
            {
                "ended_at_utc": _utc_now_iso(),
                "elapsed_s": elapsed_s,
                "status": status,
                "response_headers": dict(resp.headers.items()),
                "bytes_received": len(data),
                "truncated": truncated,
                "cap_applied_bytes": cap,
                "sha256_of_received_bytes": hashlib.sha256(data).hexdigest(),
                "is_redirect": status in (301, 302, 303, 307, 308),
                "redirect_location": resp.headers.get("Location") if status in (301, 302, 303, 307, 308) else None,
                "error": None,
            }
        )
        entry["_body_bytes"] = data  # not JSON-serialised into the ledger line itself
        return entry
    except Exception as e:  # noqa: BLE001 -- deliberately broad: always ledger the attempt
        entry.update(
            {
                "ended_at_utc": _utc_now_iso(),
                "elapsed_s": time.monotonic() - t0,
                "status": None,
                "bytes_received": 0,
                "truncated": False,
                "cap_applied_bytes": cap,
                "sha256_of_received_bytes": None,
                "is_redirect": False,
                "redirect_location": None,
                "error": f"{type(e).__name__}: {e}",
            }
        )
        entry["_body_bytes"] = b""
        return entry


def append_ledger(ledger_path, entry):
    to_write = {k: v for k, v in entry.items() if k != "_body_bytes"}
    with open(ledger_path, "a", encoding="utf-8", newline="\n") as f:
        f.write(json.dumps(to_write, ensure_ascii=False) + "\n")
