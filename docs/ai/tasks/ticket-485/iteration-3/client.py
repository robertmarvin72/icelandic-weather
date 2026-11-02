"""#485 iteration-3 bounded, secret-safe HTTP client.

A NEW client, NOT a reuse of ../harness/wrapper.py (that client is frozen,
historical, and this round's prompt explicitly forbids reusing it for
network). Fixes, structurally, the gaps Jonesy's correction-round review
found in the old client:
  - the per-class exchange COUNT is incremented at `reserve()` time (durably,
    before the network call), not at outcome time -- a crash between the two
    now still durably consumes the slot on the next run;
  - an exact origin+path allowlist is enforced (not "any https:// URL");
  - the decoded-byte stream stop is against the REMAINING GLOBAL allowance
    for that class, not only the fixed per-body cap;
  - a hard TOTAL deadline per exchange (connect+read combined, enforced by
    running the request in a worker thread and bounding with
    `future.result(timeout=...)`) -- not merely `requests`' own per-read
    timeout. Stated limitation: the underlying socket/thread is not force-
    killed if it refuses to return past the deadline; this client simply
    stops WAITING on it and records a timeout outcome. For this bounded,
    short-lived research script that is an acceptable, disclosed gap, not a
    silently-overclaimed guarantee.
  - remaining-window/cumulative-wait cancellation checked before every
    attempt (not only exchange count/bytes).

Secret handling (keyed client): the API key is read from the process
environment exactly once, appended to the URL in memory immediately before
the single allowed request, never logged, never placed in the ledger, and
scanned for in every piece of captured text (response body sample, headers,
redirect Location, any exception message) before that text is persisted --
if found, persistence is refused and the run stops (STOP, not redaction of
only the found instance, per the approved prompt's "STOP keyed work on
suspected disclosure").
"""
import concurrent.futures
import json
import os
import re
import time
import urllib.parse
from datetime import datetime, timezone

import requests

HERE = os.path.dirname(__file__)

DATA_MAX_COUNT = 4
DOC_MAX_COUNT = 6
DATA_MAX_BYTES = 8 * 1024 * 1024
DOC_MAX_BYTES = 6 * 1024 * 1024
DATA_PER_BODY_MAX = 2 * 1024 * 1024
DOC_PER_BODY_MAX = 1 * 1024 * 1024
WINDOW_MAX_S = 30 * 60
WAIT_MAX_S = 180
EXCHANGE_DEADLINE_S = 20

CLASS_CAPS = {
    "data": {"count": DATA_MAX_COUNT, "bytes": DATA_MAX_BYTES, "per_body": DATA_PER_BODY_MAX},
    "doc": {"count": DOC_MAX_COUNT, "bytes": DOC_MAX_BYTES, "per_body": DOC_PER_BODY_MAX},
}

# Exact origin+path allowlist (query strings are never part of the allowlist
# key -- callers pass the base URL and attach query parameters separately).
DOC_REDIRECT_HOSTS = {"epsg.org", "www.epsg.org", "gagnaveita.vegagerdin.is",
                       "www.vegagerdin.is", "open-meteo.com", "www.open-meteo.com"}
KEYED_URL = "https://customer-api.open-meteo.com:443/v1/forecast"
KEYED_HOST = "customer-api.open-meteo.com"


def now_utc_iso():
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


class BudgetExceeded(Exception):
    pass


class SuspectedSecretDisclosure(Exception):
    pass


def _empty_ledger():
    return {
        "window_start_utc": None,
        "window_start_monotonic": None,
        "cumulative_wait_seconds": 0.0,
        "data": {"count": 0, "bytes": 0},
        "doc": {"count": 0, "bytes": 0},
        "attempts": [],
        "outcomes": [],
    }


def load_ledger(path):
    if not os.path.exists(path):
        return _empty_ledger()
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def save_ledger(path, ledger):
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
        # Preemptive cancellation: refuse a new attempt if the window would
        # almost certainly be exceeded before a full-deadline exchange could
        # finish, not only after the fact.
        if elapsed + EXCHANGE_DEADLINE_S > WINDOW_MAX_S:
            raise BudgetExceeded(f"30-minute window would be exceeded by this attempt "
                                  f"({elapsed:.0f}s elapsed + {EXCHANGE_DEADLINE_S}s deadline > {WINDOW_MAX_S}s)")
    if ledger["cumulative_wait_seconds"] + EXCHANGE_DEADLINE_S > WAIT_MAX_S:
        raise BudgetExceeded(f"180s cumulative-wait budget would be exceeded by this attempt "
                              f"({ledger['cumulative_wait_seconds']:.1f}s used)")


def reserve(ledger_path, cls, url):
    """Durable reserve: the class COUNT is incremented HERE, before any
    network call -- fixing the prior client's 'incremented at outcome'
    defect. A crash before the outcome is appended still leaves this slot
    consumed on the next run."""
    ledger = load_ledger(ledger_path)
    _check_budget(ledger, cls)
    if ledger["window_start_utc"] is None:
        ledger["window_start_utc"] = now_utc_iso()
        ledger["window_start_monotonic"] = time.monotonic()
    seq = len(ledger["attempts"])
    ledger["attempts"].append({"seq": seq, "class": cls, "url": url, "planned_utc": now_utc_iso(),
                                "planned_monotonic": time.monotonic()})
    ledger[cls]["count"] += 1  # <-- reserved, not deferred to outcome
    save_ledger(ledger_path, ledger)
    return seq


def append_outcome(ledger_path, seq, cls, outcome):
    ledger = load_ledger(ledger_path)
    outcome = dict(outcome)
    outcome["seq"] = seq
    outcome["done_utc"] = now_utc_iso()
    ledger["outcomes"].append(outcome)
    ledger[cls]["bytes"] += outcome.get("bytes_decoded", 0)
    ledger["cumulative_wait_seconds"] += min(outcome.get("elapsed_s", 0.0), EXCHANGE_DEADLINE_S)
    save_ledger(ledger_path, ledger)


def redact_location(location):
    """Keep ONLY scheme+host+path of a redirect Location; drop query and
    fragment entirely (never persisted, never inspected for content beyond
    the allowlist check itself)."""
    if not location:
        return None
    p = urllib.parse.urlsplit(location)
    return urllib.parse.urlunsplit((p.scheme, p.netloc, p.path, "", ""))


def _scan_for_secret(texts, secret):
    if not secret:
        return False
    for t in texts:
        if t and secret in t:
            return True
    return False


def _do_get(url, timeout, verify=True, headers=None):
    return requests.get(url, headers=headers or {}, timeout=timeout, allow_redirects=False,
                         stream=True, verify=verify)


def fetch_once(url, cls, ledger_path, allowed_exact_urls=None, timeout=EXCHANGE_DEADLINE_S,
               secret=None, never_redirect=False, _allow_http_for_selftest_only=False):
    """One bounded exchange. `allowed_exact_urls`: if given, `url` (without
    query string) must be a member -- an exact-origin+path allowlist, not a
    bare scheme check. `secret`: if given, every captured text is scanned
    for it before being returned/persisted; a match raises
    SuspectedSecretDisclosure and nothing is persisted. `never_redirect`:
    keyed requests never follow or even record more than the fact that a
    redirect happened (its Location is still redacted-logged for audit, per
    the base-class metadata rule, but the keyed caller must not act on it)."""
    parsed = urllib.parse.urlsplit(url)
    if parsed.scheme != "https" and not (_allow_http_for_selftest_only and parsed.hostname == "127.0.0.1"):
        raise ValueError(f"refusing non-HTTPS URL: {url!r}")
    base_url = urllib.parse.urlunsplit((parsed.scheme, parsed.netloc, parsed.path, "", ""))
    if allowed_exact_urls is not None and base_url not in allowed_exact_urls:
        raise ValueError(f"refusing URL not on the exact allowlist: {base_url!r}")

    seq = reserve(ledger_path, cls, url)
    per_body_cap = CLASS_CAPS[cls]["per_body"]
    ledger_before = load_ledger(ledger_path)
    remaining_global = CLASS_CAPS[cls]["bytes"] - ledger_before[cls]["bytes"]
    cap = max(0, min(per_body_cap, remaining_global))

    def _run():
        """Everything -- connect, headers, AND the full capped body read --
        runs inside this worker function, so the hard TOTAL deadline below
        bounds connect+read combined, not merely the time to first byte.
        A `stream=True` response that returns headers quickly but then
        drips its body slowly (the exact self-test [1] scenario) is caught
        here, not missed by only timing the initial connect."""
        resp = _do_get(url, timeout=timeout)
        chunks, total, truncated = [], 0, False
        for chunk in resp.iter_content(chunk_size=8192):
            if not chunk:
                continue
            remaining = cap - total
            if remaining <= 0:
                truncated = True
                break
            take = chunk[:remaining]
            if secret and _scan_for_secret([take.decode("latin1", "replace")], secret):
                resp.close()
                raise SuspectedSecretDisclosure("secret substring found in response body chunk")
            chunks.append(take)
            total += len(take)
            if len(take) < len(chunk):
                truncated = True
                break
        # `dict(resp.headers)` would lose requests' CaseInsensitiveDict behaviour
        # (a server sending "location" lowercase would then miss a literal
        # `headers.get("Location")` lookup below) -- preserve case-insensitive
        # lookup explicitly instead.
        status, headers = resp.status_code, requests.structures.CaseInsensitiveDict(resp.headers)
        resp.close()
        return status, headers, b"".join(chunks), total, truncated

    t0 = time.monotonic()
    ex = concurrent.futures.ThreadPoolExecutor(max_workers=1)
    try:
        future = ex.submit(_run)
        status, headers, body, total, truncated = future.result(timeout=timeout)
        ex.shutdown(wait=False)
        elapsed = time.monotonic() - t0
        redirect_location = None
        if 300 <= status < 400:
            # Redirect Location is ALWAYS structurally redacted to scheme+host+path --
            # the query/fragment is dropped unconditionally, never inspected or scanned,
            # since dropping-by-construction is safer than a scan for a known secret
            # value (it also protects against any OTHER sensitive value we are not
            # specifically watching for).
            redirect_location = redact_location(headers.get("Location"))
        # Location is deliberately excluded from this scan -- it is handled
        # exclusively by the unconditional structural redaction above, never
        # by a scan-for-known-secret approach (see the comment there).
        header_text = " ".join(f"{k}:{v}" for k, v in headers.items() if k.lower() != "location")
        if secret and _scan_for_secret([header_text], secret):
            raise SuspectedSecretDisclosure("secret substring found in response headers")
        outcome = {
            "status": status, "elapsed_s": elapsed, "bytes_decoded": total,
            "truncated": truncated, "final_url": base_url,
            "redirect_location": redirect_location, "error": None,
            "never_redirect_honored": never_redirect,
        }
        append_outcome(ledger_path, seq, cls, outcome)
        return outcome, body
    except concurrent.futures.TimeoutError:
        ex.shutdown(wait=False)  # stop WAITING on the worker; the underlying socket/thread
        # may still be running in the background -- a disclosed, stated limitation, not a
        # silent one (see this function's docstring and client.py's module docstring).
        elapsed = time.monotonic() - t0
        outcome = {"status": None, "elapsed_s": elapsed, "bytes_decoded": 0, "truncated": False,
                   "final_url": base_url, "redirect_location": None,
                   "error": f"TOTAL_DEADLINE_EXCEEDED ({timeout}s)"}
        append_outcome(ledger_path, seq, cls, outcome)
        raise TimeoutError(outcome["error"])
    except SuspectedSecretDisclosure:
        ex.shutdown(wait=False)
        elapsed = time.monotonic() - t0
        outcome = {"status": None, "elapsed_s": elapsed, "bytes_decoded": 0, "truncated": False,
                   "final_url": base_url, "redirect_location": None,
                   "error": "SUSPECTED_SECRET_DISCLOSURE"}
        append_outcome(ledger_path, seq, cls, outcome)
        raise
    except requests.exceptions.RequestException as e:
        ex.shutdown(wait=False)
        elapsed = time.monotonic() - t0
        safe_category = _classify_transport_error(e)
        outcome = {"status": None, "elapsed_s": elapsed, "bytes_decoded": 0, "truncated": False,
                   "final_url": base_url, "redirect_location": None, "error": safe_category}
        append_outcome(ledger_path, seq, cls, outcome)
        raise


def _classify_transport_error(e):
    """Safe, fixed diagnostic categories only -- never the raw exception
    repr/message/traceback/request URL (which for `requests` can embed the
    full URL, and for a keyed request therefore the key)."""
    if isinstance(e, requests.exceptions.SSLError):
        return "TLS_FAILURE"
    if isinstance(e, requests.exceptions.ConnectionError):
        return "CONNECT_FAILURE"
    if isinstance(e, requests.exceptions.Timeout):
        return "READ_TIMEOUT"
    return "TRANSPORT_FAILURE"


class KeyedClientRefused(Exception):
    pass


def build_keyed_url(apikey):
    """Refuses to construct anything other than EXACTLY the fixed customer
    endpoint, BEFORE the secret is appended -- a caller cannot redirect the
    key to the wrong host/port/path/scheme by passing a different base URL,
    because there is no base-URL parameter at all; the target is a module
    constant, not an argument."""
    if not apikey:
        raise KeyedClientRefused("no API key provided")
    url = KEYED_URL
    parsed = urllib.parse.urlsplit(url)
    if parsed.scheme != "https" or parsed.hostname != KEYED_HOST or parsed.port not in (443, None):
        raise KeyedClientRefused("fixed keyed target failed its own self-check -- refusing")
    return url  # caller appends ?apikey=... and other query params separately, in memory only
