"""#485 bounded, ledgered HTTP client wrapper.

Durable per-exchange ledger (JSON file), hard ceilings on exchange count,
decoded bytes, window/wait time, and redirect-chain length. Default TLS +
hostname validation always on; no insecure override; no auto-follow of
redirects (the caller decides, and only to an explicitly allowed HTTPS host).

This module is used BOTH for the real provider ledger (samples/ledger.json)
and, with a different ledger_path, for the self-tests in selftest.py -- the
self-test ledger is never the same file as the real provider ledger, so
self-test traffic never consumes real provider budget.

Every attempt (success, failure, timeout, redirect, retry, diagnostic)
reserves a ledger slot BEFORE the network call is made (durable write), and
appends its outcome after -- so a crash mid-request leaves a durably
recorded "planned, outcome unknown" attempt rather than silently vanishing.
"""
import json
import os
import ssl
import time
import urllib.parse
from datetime import datetime, timezone

import requests

DATA_MAX_COUNT = 16
DOC_MAX_COUNT = 8
DATA_MAX_BYTES = 20 * 1024 * 1024
DOC_MAX_BYTES = 8 * 1024 * 1024
DATA_PER_BODY_MAX = 4 * 1024 * 1024
DOC_PER_BODY_MAX = 2 * 1024 * 1024
WINDOW_MAX_S = 45 * 60
WAIT_MAX_S = 10 * 60
DEFAULT_TIMEOUT_S = 20
MAX_HOPS_PER_CHAIN = 3

CLASS_CAPS = {
    "data": {"count": DATA_MAX_COUNT, "bytes": DATA_MAX_BYTES, "per_body": DATA_PER_BODY_MAX},
    "doc": {"count": DOC_MAX_COUNT, "bytes": DOC_MAX_BYTES, "per_body": DOC_PER_BODY_MAX},
}


class BudgetExceeded(Exception):
    pass


def now_utc_iso():
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _empty_ledger():
    return {
        "window_start_utc": None,
        "window_start_monotonic": None,
        "cumulative_wait_seconds": 0.0,
        "data": {"count": 0, "bytes": 0},
        "doc": {"count": 0, "bytes": 0},
        "attempts": [],   # planned, written BEFORE network
        "outcomes": [],   # appended AFTER network, one per attempt seq
    }


def load_ledger(path):
    if not os.path.exists(path):
        return _empty_ledger()
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def save_ledger(path, ledger):
    """Atomic write: write to a temp file then os.replace, so a crash never
    leaves a half-written ledger file."""
    tmp = path + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(ledger, f, indent=2, ensure_ascii=False)
        f.flush()
        os.fsync(f.fileno())
    os.replace(tmp, path)


def _check_budget(ledger, cls):
    caps = CLASS_CAPS[cls]
    used = ledger[cls]
    if used["count"] >= caps["count"]:
        raise BudgetExceeded(f"{cls}: exchange count exhausted ({used['count']}/{caps['count']})")
    if used["bytes"] >= caps["bytes"]:
        raise BudgetExceeded(f"{cls}: decoded-byte budget exhausted ({used['bytes']}/{caps['bytes']})")
    if ledger["window_start_utc"] is not None:
        elapsed = time.monotonic() - ledger["window_start_monotonic"]
        if elapsed > WINDOW_MAX_S:
            raise BudgetExceeded(f"45-minute provider-request window exhausted ({elapsed:.0f}s elapsed)")
    if ledger["cumulative_wait_seconds"] > WAIT_MAX_S:
        raise BudgetExceeded(f"10-minute cumulative network-wait budget exhausted "
                              f"({ledger['cumulative_wait_seconds']:.1f}s used)")


def reserve(ledger_path, cls, url):
    """Durably record a PLANNED attempt before any network call. Returns
    (ledger, seq) -- caller must append_outcome(ledger_path, seq, ...) after
    the call completes (or crashes -- the planned record survives either
    way, since it is saved to disk before the network call starts)."""
    ledger = load_ledger(ledger_path)
    _check_budget(ledger, cls)
    if ledger["window_start_utc"] is None:
        ledger["window_start_utc"] = now_utc_iso()
        ledger["window_start_monotonic"] = time.monotonic()
    seq = len(ledger["attempts"])
    ledger["attempts"].append({
        "seq": seq,
        "class": cls,
        "url": url,
        "planned_utc": now_utc_iso(),
        "planned_monotonic": time.monotonic(),
    })
    save_ledger(ledger_path, ledger)
    return ledger, seq


def append_outcome(ledger_path, seq, cls, outcome):
    """outcome: dict with status, elapsed_s, bytes_decoded, truncated,
    final_url, redirect_location (or None), error (or None)."""
    ledger = load_ledger(ledger_path)
    outcome = dict(outcome)
    outcome["seq"] = seq
    outcome["done_utc"] = now_utc_iso()
    ledger["outcomes"].append(outcome)
    ledger[cls]["count"] += 1
    ledger[cls]["bytes"] += outcome.get("bytes_decoded", 0)
    ledger["cumulative_wait_seconds"] += min(outcome.get("elapsed_s", 0.0), DEFAULT_TIMEOUT_S)
    save_ledger(ledger_path, ledger)
    return ledger


def fetch_once(url, cls, ledger_path, timeout=DEFAULT_TIMEOUT_S, extra_headers=None, verify=True):
    """Single bounded HTTP attempt -- NOT a redirect chain. allow_redirects
    is always False (manual Location handling, never auto-followed). TLS
    verification is always on (verify defaults to True; a caller may only
    pass a CA bundle PATH for an explicitly-trusted test root, never False
    and never a hostname-check disable -- see selftest.py for the one
    legitimate use of this parameter, a self-signed TEST CA, not production
    traffic). No HTTP scheme is accepted for provider traffic -- see
    assert below.

    Reserves a ledger slot BEFORE the request; appends the outcome after,
    success or failure, so every attempt of any kind is counted exactly
    once against the appropriate class budget.
    """
    parsed = urllib.parse.urlsplit(url)
    if parsed.scheme != "https":
        raise ValueError(f"refusing non-HTTPS provider URL: {url!r}")

    ledger, seq = reserve(ledger_path, cls, url)
    headers = {"User-Agent": "icelandic-weather-research-485/1.0 (bounded research client)"}
    if extra_headers:
        headers.update(extra_headers)

    per_body_cap = CLASS_CAPS[cls]["per_body"]
    t0 = time.monotonic()
    try:
        resp = requests.get(
            url, headers=headers, timeout=timeout, allow_redirects=False,
            stream=True, verify=verify,
        )
        chunks = []
        total = 0
        truncated = False
        for chunk in resp.iter_content(chunk_size=8192):
            if not chunk:
                continue
            remaining = per_body_cap - total
            if remaining <= 0:
                truncated = True
                break
            take = chunk[:remaining]
            chunks.append(take)
            total += len(take)
            if len(take) < len(chunk):
                truncated = True
                break
        resp.close()
        elapsed = time.monotonic() - t0
        body = b"".join(chunks)
        redirect_location = None
        if 300 <= resp.status_code < 400:
            redirect_location = resp.headers.get("Location")
        outcome = {
            "status": resp.status_code,
            "elapsed_s": elapsed,
            "bytes_decoded": total,
            "truncated": truncated,
            "final_url": resp.url,
            "redirect_location": redirect_location,
            "error": None,
            "response_headers": dict(resp.headers),
        }
        append_outcome(ledger_path, seq, cls, outcome)
        return outcome, body
    except requests.exceptions.SSLError as e:
        elapsed = time.monotonic() - t0
        outcome = {"status": None, "elapsed_s": elapsed, "bytes_decoded": 0, "truncated": False,
                   "final_url": url, "redirect_location": None, "error": f"SSLError: {e}"}
        append_outcome(ledger_path, seq, cls, outcome)
        raise
    except requests.exceptions.Timeout as e:
        elapsed = time.monotonic() - t0
        outcome = {"status": None, "elapsed_s": elapsed, "bytes_decoded": 0, "truncated": False,
                   "final_url": url, "redirect_location": None, "error": f"Timeout: {e}"}
        append_outcome(ledger_path, seq, cls, outcome)
        raise
    except requests.exceptions.RequestException as e:
        elapsed = time.monotonic() - t0
        outcome = {"status": None, "elapsed_s": elapsed, "bytes_decoded": 0, "truncated": False,
                   "final_url": url, "redirect_location": None, "error": f"{type(e).__name__}: {e}"}
        append_outcome(ledger_path, seq, cls, outcome)
        raise
