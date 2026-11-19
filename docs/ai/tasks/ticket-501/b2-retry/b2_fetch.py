#!/usr/bin/env python3
"""
#501 B2-LOCAL-GEOMETRY-ATTEMPT-2 -- bounded-fetch wrapper, stdlib only.

This is a from-scratch rewrite (not an edit of b2-geometry/b2_fetch.py,
which stays untouched/immutable) addressing every gap Jonesy's result
review of the first attempt found (JG1-JG4) via the owner-approved R1-R3
minimum fix, plus O1-O4:

  R1 / JG4 -- persistence that cannot be lost to a crash. The ledger is
  written atomically (temp file + os.replace) at THREE checkpoints: (i)
  right after the dispatch marker is created, before connecting; (ii)
  right after getresponse() returns (status/headers known); (iii) in a
  `finally` that always runs, with whatever body bytes were captured --
  even zero. bounded_get() catches BaseException (not just OSError), so
  an HTTPException subclass (IncompleteRead, BadStatusLine -- JG2) can
  never again escape uncaught and crash the caller before anything is
  saved. KeyboardInterrupt/SystemExit are recorded as outcome
  "interrupted" and then re-raised (never swallowed into a retry).

  R2 / JG3 -- "complete" is no longer just "read() returned empty".
  classify_response() (a pure function, independently testable -- O4)
  requires: byte_count matches Content-Length when the header is
  present; the body parses as JSON; crs.properties.name equals the
  expected EPSG:3057 URN; numberReturned equals len(features); and
  numberReturned != 100 (still a truncation signal regardless of the
  other fields, carried over from the first attempt's own N3). Only
  then is the outcome "complete_usable". Every other case is
  "transport_complete_unusable" (parsed but failed a check),
  "partial" (transport itself incomplete/capped/truncated), or
  "failed" (no usable response at all).

  R3 -- see mock_self_test(): 8 required local scenarios (connection
  close, truncated chunked/IncompleteRead, bad status line, short
  body vs Content-Length, slow trickle wall-deadline, exact byte-cap
  overflow, dispatch-marker resend refusal, redirect not followed),
  run on THIS machine before any dispatch is attempted, all built on
  127.0.0.1 / in-memory fixtures only.

  O1 -- every self-test case calls this file's own bounded_get()/
  classify_response() directly (imported, never copied).
  O2 -- fixed outcome vocabulary: complete_usable / transport_complete_unusable
  / partial / failed / interrupted. Ledger writes are atomic; a ledger
  write failure itself is loud (raises, non-zero exit), never silent.
  O4 -- classify_response() fixture tests, independent of any socket.

Stdlib only: http.client/socket/ssl/os/time/threading/hashlib/json/
urllib.parse. No new dependency, no new test framework.
"""
import hashlib
import http.client
import json
import os
import socket
import ssl
import sys
import threading
import time
from urllib.parse import urlsplit

# Writes are allowed only inside this b2-retry/ folder (approved-prompt-v1.md).
# Importing a retained .py file by path elsewhere must never leave a
# __pycache__ behind outside this folder (a real slip in the first attempt).
sys.dont_write_bytecode = True

HERE = os.path.dirname(os.path.abspath(__file__))

OUTCOMES = {"complete_usable", "transport_complete_unusable", "partial", "failed", "interrupted"}
EXPECTED_CRS_URN = "urn:ogc:def:crs:EPSG::3057"


def _now_iso():
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())


class BoundedFetchError(Exception):
    def __init__(self, reason):
        super().__init__(reason)
        self.reason = reason


def _remaining_or_raise(deadline):
    remaining = deadline - time.monotonic()
    if remaining <= 0:
        raise BoundedFetchError("wall_timeout_exceeded")
    return remaining


def _atomic_write_bytes(path, data):
    tmp = path + ".tmp"
    with open(tmp, "wb") as f:
        f.write(data)
        f.flush()
        os.fsync(f.fileno())
    os.replace(tmp, path)


def _atomic_write_json(path, obj):
    """Loud on failure, per O2 -- never swallow a ledger-write error."""
    tmp = path + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(obj, f, indent=2, ensure_ascii=False)
        f.write("\n")
        f.flush()
        os.fsync(f.fileno())
    os.replace(tmp, path)


# ---------------------------------------------------------------------------
# R2/O4 -- pure, independently-testable evidence-usability classifier.
# Never touches a socket. Takes exactly what a completed/partial transport
# attempt produced and decides the outcome. Reused by BOTH the real/mock
# fetch path (bounded_get) and the offline validator fixtures below.
# ---------------------------------------------------------------------------
def classify_response(http_status, content_length_header, byte_count, body, transport_error=None):
    """Returns (outcome, failure_reason, parsed_info_dict_or_None).
    `transport_error` is a short string if the transport itself ended
    abnormally (timeout/cap/incomplete read/bad status line/etc.) -- in
    that case this always returns "partial" (if byte_count > 0) or
    "failed" (if byte_count == 0), never attempting to parse."""
    if transport_error is not None:
        return ("partial" if byte_count > 0 else "failed"), transport_error, None

    if http_status is None:
        return "failed", "no_response_status", None
    if 300 <= http_status < 400:
        return "failed", f"redirect_not_followed_status_{http_status}", None
    if http_status != 200:
        return "failed", f"http_status_{http_status}", None

    if content_length_header is not None:
        try:
            expected_len = int(content_length_header)
        except ValueError:
            expected_len = None
        if expected_len is not None and expected_len != byte_count:
            return "partial", f"content_length_mismatch_expected_{expected_len}_got_{byte_count}", None

    try:
        parsed = json.loads(body)
    except Exception as e:
        return "transport_complete_unusable", f"json_parse_failed:{type(e).__name__}:{e}", None

    if not isinstance(parsed, dict):
        return "transport_complete_unusable", "json_not_an_object", None

    crs_name = None
    crs_block = parsed.get("crs")
    if isinstance(crs_block, dict):
        crs_name = (crs_block.get("properties") or {}).get("name")

    features = parsed.get("features")
    number_returned = parsed.get("numberReturned")
    if number_returned is None and isinstance(features, list):
        number_returned = len(features)

    info = {
        "crs_name": crs_name,
        "number_returned": number_returned,
        "number_matched_or_total_features": parsed.get("numberMatched", parsed.get("totalFeatures")),
        "features_len": len(features) if isinstance(features, list) else None,
    }

    if crs_name != EXPECTED_CRS_URN:
        return "transport_complete_unusable", f"unexpected_crs:{crs_name!r}", info
    if not isinstance(features, list) or number_returned != len(features):
        return "transport_complete_unusable", "numberReturned_mismatch_features_length", info
    if number_returned == 100:
        return "partial", "numberReturned_100_possible_truncation", info
    return "complete_usable", None, info


def bounded_get(
    url,
    marker_path,
    ledger_path,
    body_path,
    allowed_hosts,
    max_body_bytes,
    wall_seconds=20,
    require_https=True,
    user_agent="EltumVedridResearch/1.0 (ticket-501 b2-retry; contact: research-only)",
):
    """One GET, bounded on every axis, persisted on every path (R1).
    Returns a result dict whose "outcome" is always one of OUTCOMES.
    Raises only for a genuine precondition error (bad scheme/host),
    before the marker is written -- and re-raises KeyboardInterrupt/
    SystemExit AFTER persisting what it can (never swallowed)."""
    parts = urlsplit(url)
    if require_https and parts.scheme != "https":
        raise ValueError("only https is supported for the real dispatch")
    if parts.scheme not in ("http", "https"):
        raise ValueError(f"unsupported scheme {parts.scheme!r}")
    host = parts.hostname
    if host not in allowed_hosts:
        raise ValueError(f"host {host!r} not in allowlist {sorted(allowed_hosts)}")
    port = parts.port
    path_and_query = parts.path + (("?" + parts.query) if parts.query else "")

    state = {
        "request_url": url,
        "client_start_utc": _now_iso(),
        "client_end_utc": None,
        "http_status": None,
        "headers": None,
        "server_date_header": None,
        "content_length_header": None,
        "byte_count": 0,
        "outcome": None,
        "failure_reason": None,
        "parsed_info": None,
        "sha256_of_retained_bytes": None,
        "body_file": os.path.basename(body_path),
        "wall_time_ms": None,
    }

    # (b) atomic exclusive dispatch marker -- created before any socket
    # activity. If it already exists, refuse to send, and record that
    # refusal in its own ledger write (distinct from a dispatched attempt).
    try:
        fd = os.open(marker_path, os.O_CREAT | os.O_EXCL | os.O_WRONLY)
        with os.fdopen(fd, "w") as f:
            f.write(json.dumps({"url": url, "dispatch_started_utc": state["client_start_utc"]}))
    except FileExistsError:
        state["outcome"] = "failed"
        state["failure_reason"] = "dispatch_marker_already_exists_refusing_resend"
        state["client_end_utc"] = _now_iso()
        _atomic_write_json(ledger_path, state)
        return state

    start_monotonic = time.monotonic()
    deadline = start_monotonic + wall_seconds
    _atomic_write_json(ledger_path, state)  # checkpoint (i)

    conn = None
    timer = None
    sock_box = [None]
    watchdog_fired = threading.Event()
    body_chunks = []
    transport_error = None

    def _abort_on_deadline():
        watchdog_fired.set()
        sock = sock_box[0]
        if sock is not None:
            try:
                sock.shutdown(socket.SHUT_RDWR)
            except OSError:
                pass
            try:
                sock.close()
            except OSError:
                pass

    try:
        timer = threading.Timer(max(0.0, deadline - time.monotonic()), _abort_on_deadline)
        timer.daemon = True
        timer.start()

        connect_timeout = _remaining_or_raise(deadline)
        if parts.scheme == "https":
            context = ssl.create_default_context()
            conn = http.client.HTTPSConnection(host, port, timeout=connect_timeout, context=context)
        else:
            conn = http.client.HTTPConnection(host, port, timeout=connect_timeout)
        conn.connect()
        sock_box[0] = conn.sock

        sock_box[0].settimeout(_remaining_or_raise(deadline))
        conn.putrequest("GET", path_and_query, skip_accept_encoding=True)
        conn.putheader("Host", parts.netloc)
        conn.putheader("User-Agent", user_agent)
        conn.putheader("Accept", "*/*")
        # JG1: deliberately NOT sending "Connection: close" -- that header
        # is what made getresponse() null conn.sock in the first attempt.
        # sock_box already protects against that regardless, but removing
        # the self-inflicted trigger removes one whole failure path.
        conn.endheaders()

        sock_box[0].settimeout(_remaining_or_raise(deadline))
        resp = conn.getresponse()
        state["http_status"] = resp.status
        state["headers"] = dict(resp.getheaders())
        state["server_date_header"] = resp.getheader("Date")
        state["content_length_header"] = resp.getheader("Content-Length")
        _atomic_write_json(ledger_path, state)  # checkpoint (ii)

        total = 0
        READ_CHUNK = 4096
        while True:
            if sock_box[0] is not None:
                try:
                    sock_box[0].settimeout(_remaining_or_raise(deadline))
                except OSError:
                    pass
            else:
                _remaining_or_raise(deadline)
            chunk = resp.read(READ_CHUNK)
            if not chunk:
                break
            total += len(chunk)
            if total > max_body_bytes:
                allowed_here = max_body_bytes - (total - len(chunk))
                if allowed_here > 0:
                    body_chunks.append(chunk[:allowed_here])
                transport_error = f"response_exceeded_{max_body_bytes}_bytes"
                break
            body_chunks.append(chunk)

    except (KeyboardInterrupt, SystemExit):
        state["outcome"] = "interrupted"
        state["failure_reason"] = "keyboard_interrupt_or_system_exit"
        body = b"".join(body_chunks)
        state["byte_count"] = len(body)
        state["sha256_of_retained_bytes"] = hashlib.sha256(body).hexdigest() if body else None
        _atomic_write_bytes(body_path, body)
        state["client_end_utc"] = _now_iso()
        state["wall_time_ms"] = round((time.monotonic() - start_monotonic) * 1000, 1)
        _atomic_write_json(ledger_path, state)
        if timer is not None:
            timer.cancel()
        if conn is not None:
            try:
                conn.close()
            except Exception:
                pass
        raise
    except BoundedFetchError as e:
        transport_error = e.reason
    except (socket.timeout, TimeoutError):
        transport_error = "wall_timeout_exceeded"
    except http.client.HTTPException as e:
        # JG2: IncompleteRead, BadStatusLine, etc. -- previously uncaught.
        transport_error = f"{type(e).__name__}:{e}"
    except OSError as e:
        transport_error = "wall_timeout_exceeded" if watchdog_fired.is_set() else f"transport_error:{type(e).__name__}:{e}"
    except Exception as e:  # noqa: BLE001 -- intentional last-resort catch-all, see module docstring R1
        transport_error = f"unexpected:{type(e).__name__}:{e}"
    finally:
        if timer is not None:
            timer.cancel()
        if conn is not None:
            try:
                conn.close()
            except Exception:
                pass

    body = b"".join(body_chunks)
    state["byte_count"] = len(body)
    state["sha256_of_retained_bytes"] = hashlib.sha256(body).hexdigest() if body else None
    _atomic_write_bytes(body_path, body)

    outcome, failure_reason, parsed_info = classify_response(
        state["http_status"], state["content_length_header"], state["byte_count"], body, transport_error
    )
    state["outcome"] = outcome
    state["failure_reason"] = failure_reason
    state["parsed_info"] = parsed_info
    state["client_end_utc"] = _now_iso()
    state["wall_time_ms"] = round((time.monotonic() - start_monotonic) * 1000, 1)
    _atomic_write_json(ledger_path, state)  # checkpoint (iii) -- always reached unless interrupted above
    assert state["outcome"] in OUTCOMES
    return state


# ---------------------------------------------------------------------------
# O4 -- offline classify_response() fixtures. No socket, no server, not
# a real B2 answer -- pure function tests of the evidence-usability logic.
# ---------------------------------------------------------------------------
_GOOD_BODY = json.dumps({
    "type": "FeatureCollection",
    "crs": {"type": "name", "properties": {"name": EXPECTED_CRS_URN}},
    "numberReturned": 2,
    "totalFeatures": 2,
    "features": [{"id": "x.1"}, {"id": "x.2"}],
}).encode("utf-8")


def _fixture_cases():
    cases = []

    # positive
    cases.append(("good_body", 200, str(len(_GOOD_BODY)), len(_GOOD_BODY), _GOOD_BODY, None, "complete_usable"))

    # negative: wrong CRS
    bad_crs = json.dumps({
        "crs": {"type": "name", "properties": {"name": "urn:ogc:def:crs:EPSG::4326"}},
        "numberReturned": 1, "features": [{"id": "x.1"}],
    }).encode("utf-8")
    cases.append(("wrong_crs", 200, str(len(bad_crs)), len(bad_crs), bad_crs, None, "transport_complete_unusable"))

    # negative: numberReturned == 100 (possible truncation) even though internally consistent
    hundred = json.dumps({
        "crs": {"type": "name", "properties": {"name": EXPECTED_CRS_URN}},
        "numberReturned": 100,
        "features": [{"id": f"x.{i}"} for i in range(100)],
    }).encode("utf-8")
    cases.append(("number_returned_100", 200, str(len(hundred)), len(hundred), hundred, None, "partial"))

    # negative: numberReturned != len(features)
    mismatch = json.dumps({
        "crs": {"type": "name", "properties": {"name": EXPECTED_CRS_URN}},
        "numberReturned": 3,
        "features": [{"id": "x.1"}],
    }).encode("utf-8")
    cases.append(("count_mismatch", 200, str(len(mismatch)), len(mismatch), mismatch, None, "transport_complete_unusable"))

    # negative: not JSON at all
    not_json = b"<html>not json</html>"
    cases.append(("not_json", 200, str(len(not_json)), len(not_json), not_json, None, "transport_complete_unusable"))

    return cases


def classifier_fixture_test():
    ok = True
    report = []
    for name, status, cl, byte_count, body, transport_error, expected_outcome in _fixture_cases():
        outcome, reason, info = classify_response(status, cl, byte_count, body, transport_error)
        passed = outcome == expected_outcome
        ok = ok and passed
        report.append(f"fixture[{name}]: outcome={outcome} (expected {expected_outcome}) reason={reason} -> {'PASS' if passed else 'FAIL'}")
    return ok, report


# ---------------------------------------------------------------------------
# R3 -- local self-test, 8 required scenarios + marker-refusal, all on
# 127.0.0.1 or in-memory only. O1: calls bounded_get()/classify_response()
# directly, never a copy.
# ---------------------------------------------------------------------------
_TMP = os.path.join(HERE, ".selftest-tmp")


def _tmp_paths(name):
    return (
        os.path.join(_TMP, f"{name}.marker.json"),
        os.path.join(_TMP, f"{name}.ledger.json"),
        os.path.join(_TMP, f"{name}.body.bin"),
    )


def _cleanup_tmp(name):
    for p in _tmp_paths(name):
        if os.path.exists(p):
            os.remove(p)
        tmp = p + ".tmp"
        if os.path.exists(tmp):
            os.remove(tmp)


def _run_fixed_response_server(raw_bytes, mid_body_sleep_s=None):
    """Starts a tiny raw-socket server on 127.0.0.1 that sends exactly
    `raw_bytes` once to a single connecting client, then closes. If
    `mid_body_sleep_s` is given, splits raw_bytes roughly in half and
    sleeps between the two halves (for the slow-trickle test)."""
    srv = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    srv.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    srv.bind(("127.0.0.1", 0))
    srv.listen(1)
    port = srv.getsockname()[1]

    def _serve_one():
        try:
            srv.settimeout(10)
            client, _ = srv.accept()
            try:
                client.settimeout(10)
                client.recv(65536)
                if mid_body_sleep_s:
                    mid = len(raw_bytes) // 2
                    client.sendall(raw_bytes[:mid])
                    time.sleep(mid_body_sleep_s)
                    client.sendall(raw_bytes[mid:])
                else:
                    client.sendall(raw_bytes)
            finally:
                try:
                    client.close()
                except OSError:
                    pass
        except OSError:
            pass
        finally:
            srv.close()

    t = threading.Thread(target=_serve_one, daemon=True)
    t.start()
    return port


def _run_trickle_server(total_seconds, n_chunks, chunk_bytes=b"z" * 10):
    """Dribbles `n_chunks` tiny chunked-encoding chunks over `total_seconds`,
    never idle long enough on any single gap to trip a per-read timeout,
    but long enough overall to blow a short wall deadline (same scenario
    the first attempt's own self-test caught)."""
    srv = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    srv.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    srv.bind(("127.0.0.1", 0))
    srv.listen(1)
    port = srv.getsockname()[1]
    gap = total_seconds / max(1, n_chunks)

    def _serve_one():
        try:
            srv.settimeout(10)
            client, _ = srv.accept()
            try:
                client.settimeout(10)
                client.recv(65536)
                header = b"HTTP/1.1 200 OK\r\nTransfer-Encoding: chunked\r\n\r\n"
                client.sendall(header)
                for _ in range(n_chunks):
                    client.sendall(b"%x\r\n" % len(chunk_bytes))
                    client.sendall(chunk_bytes + b"\r\n")
                    time.sleep(gap)
                client.sendall(b"0\r\n\r\n")
            finally:
                try:
                    client.close()
                except OSError:
                    pass
        except OSError:
            pass
        finally:
            srv.close()

    t = threading.Thread(target=_serve_one, daemon=True)
    t.start()
    return port


def _case_connection_close_response():
    body = _GOOD_BODY
    raw = (
        b"HTTP/1.1 200 OK\r\n"
        b"Content-Type: application/json\r\n"
        b"Connection: close\r\n"
        b"Content-Length: " + str(len(body)).encode("ascii") + b"\r\n\r\n" + body
    )
    port = _run_fixed_response_server(raw)
    marker, ledger, bodyp = _tmp_paths("close")
    _cleanup_tmp("close")
    r = bounded_get(f"http://127.0.0.1:{port}/", marker, ledger, bodyp, {"127.0.0.1"}, 10_000, wall_seconds=5, require_https=False)
    passed = r["outcome"] == "complete_usable" and r["byte_count"] == len(body)
    _cleanup_tmp("close")
    return passed, f"(1) connection_close_response: outcome={r['outcome']} reason={r.get('failure_reason')} bytes={r['byte_count']} -> {'PASS' if passed else 'FAIL'}"


def _case_truncated_chunked():
    # A chunked response that announces a chunk then the connection dies
    # before the chunk's data (or the terminator) ever arrives.
    raw = b"HTTP/1.1 200 OK\r\nTransfer-Encoding: chunked\r\n\r\n" + b"a\r\n0123456789\r\n" + b"5\r\n12"  # cut mid-chunk, no terminator
    port = _run_fixed_response_server(raw)
    marker, ledger, bodyp = _tmp_paths("truncated")
    _cleanup_tmp("truncated")
    r = bounded_get(f"http://127.0.0.1:{port}/", marker, ledger, bodyp, {"127.0.0.1"}, 10_000, wall_seconds=5, require_https=False)
    ledger_written = os.path.exists(ledger)
    passed = r["outcome"] in ("partial", "failed") and ledger_written
    _cleanup_tmp("truncated")
    return passed, f"(2) truncated_chunked_incomplete_read: outcome={r['outcome']} reason={r.get('failure_reason')} ledger_written={ledger_written} -> {'PASS' if passed else 'FAIL'}"


def _case_bad_status_line():
    raw = b"GARBAGE NOT AN HTTP STATUS LINE\r\n\r\n"
    port = _run_fixed_response_server(raw)
    marker, ledger, bodyp = _tmp_paths("badstatus")
    _cleanup_tmp("badstatus")
    r = bounded_get(f"http://127.0.0.1:{port}/", marker, ledger, bodyp, {"127.0.0.1"}, 10_000, wall_seconds=5, require_https=False)
    ledger_written = os.path.exists(ledger)
    passed = r["outcome"] == "failed" and ledger_written
    _cleanup_tmp("badstatus")
    return passed, f"(3) bad_status_line: outcome={r['outcome']} reason={r.get('failure_reason')} ledger_written={ledger_written} -> {'PASS' if passed else 'FAIL'}"


def _case_short_body_vs_content_length():
    raw = b"HTTP/1.1 200 OK\r\nContent-Length: 50\r\n\r\n12345"  # claims 50, sends 5, then closes
    port = _run_fixed_response_server(raw)
    marker, ledger, bodyp = _tmp_paths("shortbody")
    _cleanup_tmp("shortbody")
    r = bounded_get(f"http://127.0.0.1:{port}/", marker, ledger, bodyp, {"127.0.0.1"}, 10_000, wall_seconds=5, require_https=False)
    passed = r["outcome"] == "partial" and (r.get("failure_reason") or "").startswith("content_length_mismatch")
    _cleanup_tmp("shortbody")
    return passed, f"(4) short_body_vs_content_length: outcome={r['outcome']} reason={r.get('failure_reason')} -> {'PASS' if passed else 'FAIL'}"


def _case_wall_deadline_trickle():
    port = _run_trickle_server(total_seconds=9, n_chunks=6)
    marker, ledger, bodyp = _tmp_paths("trickle")
    _cleanup_tmp("trickle")
    t0 = time.monotonic()
    r = bounded_get(f"http://127.0.0.1:{port}/", marker, ledger, bodyp, {"127.0.0.1"}, 10_000, wall_seconds=3, require_https=False)
    elapsed = time.monotonic() - t0
    passed = r["outcome"] in ("partial", "failed") and elapsed < 9.0
    _cleanup_tmp("trickle")
    return passed, f"(5) wall_deadline_trickle: outcome={r['outcome']} elapsed={elapsed:.2f}s (unbounded would be ~9s) -> {'PASS' if passed else 'FAIL'}"


def _case_byte_cap_exact():
    body = b"q" * 1000
    raw = b"HTTP/1.1 200 OK\r\nContent-Length: 1000\r\n\r\n" + body
    port = _run_fixed_response_server(raw)
    marker, ledger, bodyp = _tmp_paths("bytecap")
    _cleanup_tmp("bytecap")
    r = bounded_get(f"http://127.0.0.1:{port}/", marker, ledger, bodyp, {"127.0.0.1"}, 999, wall_seconds=5, require_https=False)
    passed = r["outcome"] == "partial" and r["byte_count"] == 999
    _cleanup_tmp("bytecap")
    return passed, f"(6) byte_cap_1_over: outcome={r['outcome']} bytes={r['byte_count']} (cap 999 of 1000 sent) -> {'PASS' if passed else 'FAIL'}"


def _case_dispatch_marker_blocks_resend():
    marker, ledger, bodyp = _tmp_paths("resend")
    _cleanup_tmp("resend")
    fd = os.open(marker, os.O_CREAT | os.O_EXCL | os.O_WRONLY)
    os.close(fd)
    r = bounded_get("http://127.0.0.1:1/", marker, ledger, bodyp, {"127.0.0.1"}, 100, wall_seconds=1, require_https=False)
    passed = r["outcome"] == "failed" and r["failure_reason"] == "dispatch_marker_already_exists_refusing_resend"
    _cleanup_tmp("resend")
    return passed, f"(7) dispatch_marker_blocks_resend: outcome={r['outcome']} reason={r.get('failure_reason')} -> {'PASS' if passed else 'FAIL'}"


def _case_redirect_not_followed():
    raw = b"HTTP/1.1 302 Found\r\nLocation: https://example.invalid/moved\r\nContent-Length: 0\r\n\r\n"
    port = _run_fixed_response_server(raw)
    marker, ledger, bodyp = _tmp_paths("redirect")
    _cleanup_tmp("redirect")
    r = bounded_get(f"http://127.0.0.1:{port}/", marker, ledger, bodyp, {"127.0.0.1"}, 1000, wall_seconds=5, require_https=False)
    passed = r["outcome"] == "failed" and (r.get("failure_reason") or "").startswith("redirect_not_followed_status_")
    _cleanup_tmp("redirect")
    return passed, f"(8) redirect_not_followed: outcome={r['outcome']} reason={r.get('failure_reason')} -> {'PASS' if passed else 'FAIL'}"


def mock_self_test():
    os.makedirs(_TMP, exist_ok=True)
    ok = True
    report = []
    for fn in (
        _case_connection_close_response,
        _case_truncated_chunked,
        _case_bad_status_line,
        _case_short_body_vs_content_length,
        _case_wall_deadline_trickle,
        _case_byte_cap_exact,
        _case_dispatch_marker_blocks_resend,
        _case_redirect_not_followed,
    ):
        passed, msg = fn()
        ok = ok and passed
        report.append(msg)

    fixt_ok, fixt_report = classifier_fixture_test()
    ok = ok and fixt_ok
    report.extend(fixt_report)

    if os.path.isdir(_TMP) and not os.listdir(_TMP):
        os.rmdir(_TMP)
    return ok, report


# ---------------------------------------------------------------------------
# Real dispatch (the one owner-authorized new call) -- only runs with
# --dispatch, and only after mock_self_test() passes in this same process.
# ---------------------------------------------------------------------------
def main():
    if "--self-test" not in sys.argv and "--dispatch" not in sys.argv:
        print("usage: b2_fetch.py --self-test | --dispatch")
        sys.exit(2)

    ok, report = mock_self_test()
    for line in report:
        print("[self-test]", line)
    if not ok:
        print("[self-test] FAILED -- refusing to proceed to any real dispatch.")
        sys.exit(1)
    print(f"[self-test] all {len(report)} local cases PASS.")

    if "--self-test" in sys.argv:
        return

    manifest_path = os.path.join(HERE, "request-manifest.json")
    with open(manifest_path, encoding="utf-8") as f:
        manifest = json.load(f)
    url = manifest["url"]

    basis = "GET " + url
    actual_sha = hashlib.sha256(basis.encode("utf-8")).hexdigest()
    if actual_sha != manifest["encoded_request_sha256"]:
        print(f"[precheck] FAILED sha mismatch: {actual_sha} != {manifest['encoded_request_sha256']}")
        sys.exit(1)
    parts = urlsplit(url)
    reassembled = parts.scheme + "://" + parts.netloc + parts.path + (("?" + parts.query) if parts.query else "")
    if reassembled != url:
        print("[precheck] FAILED urlsplit/reassembly mismatch -- refusing to dispatch.")
        sys.exit(1)
    print(f"[precheck] sha256 and urlsplit/reassembly verified OK: {actual_sha}")

    marker_path = os.path.join(HERE, "dispatch-marker-B2-LOCAL-GEOMETRY-ATTEMPT-2.json")
    ledger_path = os.path.join(HERE, "request-ledger.json")
    body_path = os.path.join(HERE, "raw-B2-LOCAL-GEOMETRY-ATTEMPT-2.bin")

    result = bounded_get(
        url,
        marker_path=marker_path,
        ledger_path=ledger_path,
        body_path=body_path,
        allowed_hosts={"gagnaveita.vegagerdin.is"},
        max_body_bytes=manifest["max_body_bytes"],
        wall_seconds=manifest["wall_seconds"],
    )

    print(json.dumps({
        "outcome": result["outcome"],
        "http_status": result["http_status"],
        "byte_count": result["byte_count"],
        "failure_reason": result["failure_reason"],
        "parsed_info": result["parsed_info"],
    }))


if __name__ == "__main__":
    main()
