"""Bounded ntfy publish client -- POST only, stdlib only (http.client),
0 retries, 0 redirects followed, host allowlist checked before
connecting, token sent only to the allowlisted host, per NT2 and
docs/ai/tasks/ticket-498/audit-report.md's own ntfy findings (GET/
/send//trigger are a different, publish-via-URL feature this client
deliberately never uses).
"""
import hashlib
import http.client
import ssl
import time
from datetime import datetime, timezone
from typing import Optional


class NtfyError(Exception):
    pass


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%fZ")


def publish(host: str, topic: str, title: str, text: str, *, token: Optional[str] = None,
            timeout_s: float = 5.0, allowlist=frozenset({"ntfy.sh"}), allow_insecure_for_local_test: bool = False,
            port: Optional[int] = None) -> dict:
    """POST only, to https://<host>/<topic>. Returns a ledger-style dict,
    never raises for an HTTP-level error or a redirect -- those are
    recorded with their own status. Raises NtfyError only for a
    pre-flight violation that must stop before any connection."""
    if host not in allowlist:
        raise NtfyError(f"host {host!r} not in allowlist {sorted(allowlist)} -- STOP before connecting")
    if not topic:
        raise NtfyError("no topic configured -- refusing to publish without an explicit topic")

    body = text.encode("utf-8")
    headers = {"Title": title, "Content-Type": "text/plain; charset=utf-8"}
    if token:
        headers["Authorization"] = f"Bearer {token}"

    started = _utc_now_iso()
    t0 = time.monotonic()
    entry = {"started_at_utc": started, "method": "POST", "host": host, "path": f"/{topic}", "allowlisted": True, "redirect_followed": False}
    conn = None
    try:
        if allow_insecure_for_local_test:
            conn = http.client.HTTPConnection(host, port or 80, timeout=timeout_s)
        else:
            ctx = ssl.create_default_context()
            conn = http.client.HTTPSConnection(host, port or 443, timeout=timeout_s, context=ctx)
        conn.request("POST", f"/{topic}", body=body, headers=headers)
        resp = conn.getresponse()
        data = resp.read(1024 * 1024)  # response body is tiny (ntfy ack); 1 MiB is a generous, still-bounded cap
        entry.update({
            "ended_at_utc": _utc_now_iso(), "elapsed_s": time.monotonic() - t0, "status": resp.status,
            "bytes_sent": len(body), "bytes_received": len(data), "sha256_of_body_sent": hashlib.sha256(body).hexdigest(),
            "is_redirect": resp.status in (301, 302, 303, 307, 308),
            "redirect_location": resp.headers.get("Location") if resp.status in (301, 302, 303, 307, 308) else None,
            "error": None,
        })
    except Exception as e:
        entry.update({"ended_at_utc": _utc_now_iso(), "elapsed_s": time.monotonic() - t0, "status": None, "bytes_sent": len(body), "bytes_received": 0, "sha256_of_body_sent": hashlib.sha256(body).hexdigest(), "is_redirect": False, "redirect_location": None, "error": f"{type(e).__name__}: {e}"})
    finally:
        if conn is not None:
            try:
                conn.close()
            except Exception:
                pass
    return entry
