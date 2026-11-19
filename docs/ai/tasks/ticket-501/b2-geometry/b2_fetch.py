#!/usr/bin/env python3
"""
#501 B2-LOCAL-GEOMETRY -- bounded-fetch wrapper, stdlib only.

Satisfies N1(a)-(e) from docs/ai/tasks/ticket-501/b2-geometry/approved-prompt-v1.md:
  (a) a real 20s WHOLE-REQUEST wall deadline (DNS/connect/TLS/header/read).
      A per-read socket timeout alone is NOT enough -- this round's own
      local self-test caught that empirically on a first draft: CPython's
      chunked-transfer decoder can issue several blocking socket reads
      inside one high-level resp.read(n) call, so a slow-but-steady
      trickle sailed through a per-read settimeout() untouched (it took
      9s against an intended 3s test deadline). The real guarantee here
      is a watchdog timer, armed before connecting, that shuts the
      socket down -- unblocking whatever recv() the main thread is stuck
      in, in any phase -- the instant the wall budget is spent; the
      per-read settimeout() calls remain as cheap defense-in-depth.
  (b) an atomic O_EXCL dispatch marker created BEFORE connecting -- if it
      already exists, the function refuses to send anything.
  (c) a host allowlist checked before connecting (the local self-test
      points it at 127.0.0.1, never at the production host, and the one
      real dispatch in main() hard-codes the production allowlist).
  (d) a streaming byte cap enforced while reading (never trusts
      Content-Length), verified exact to a single byte over the cap.
  (e) a local self-test (mock_self_test()) against the retained
      ticket-493-endpoint-acquisition/samples/test_server.py localhost
      server, run and shown to pass BEFORE any real dispatch -- no
      network beyond 127.0.0.1, and entirely separate from the one real
      upstream call in main().

One single bounded_get() implementation is used for BOTH the plain-HTTP
local self-test and the one real HTTPS dispatch (same watchdog/cap/
deadline code path in both -- not two parallel copies that could drift
apart silently). Stdlib only: http.client/socket/ssl/os/time/threading/
hashlib/json/urllib.parse. No new dependency.
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

# This script is only allowed to write inside this same b2-geometry/
# folder (approved-prompt-v1.md). Importing the retained
# test_server.py by file path would otherwise leave a __pycache__/*.pyc
# behind next to IT, outside this folder -- disabled.
sys.dont_write_bytecode = True

HERE = os.path.dirname(os.path.abspath(__file__))


class BoundedFetchError(Exception):
    def __init__(self, outcome, reason):
        super().__init__(reason)
        self.outcome = outcome  # "failed" | "partial_overflow"
        self.reason = reason


def _now_iso():
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())


def _remaining_or_raise(deadline):
    remaining = deadline - time.monotonic()
    if remaining <= 0:
        raise BoundedFetchError("failed", "wall_timeout_exceeded")
    return remaining


def bounded_get(
    url,
    marker_path,
    allowed_hosts,
    max_body_bytes,
    wall_seconds=20,
    user_agent="EltumVedridResearch/1.0 (ticket-501 b2-geometry; contact: research-only)",
    require_https=True,
):
    """One GET, bounded on every axis. Returns a result dict; never raises
    for an ordinary failure (timeout/cap/non-200/etc.) -- those come back
    as outcome="failed"/"partial_overflow" in the result. Only a genuine
    precondition error (bad scheme, host not allowlisted) raises, before
    any marker is written or socket touched.

    `require_https=False` exists ONLY for the local self-test against the
    plain-HTTP localhost test server; the one real dispatch in main()
    never passes it.
    """
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

    # (b) atomic exclusive dispatch marker -- created before any socket
    # activity. If this exact request was already marked dispatched
    # (e.g. a prior run was interrupted after send but before the ledger
    # was written), refuse to send it again.
    try:
        fd = os.open(marker_path, os.O_CREAT | os.O_EXCL | os.O_WRONLY)
        with os.fdopen(fd, "w") as f:
            f.write(json.dumps({"url": url, "dispatch_started_utc": _now_iso()}))
    except FileExistsError:
        return {
            "outcome": "failed",
            "failure_reason": "dispatch_marker_already_exists_refusing_resend",
            "http_status": None,
            "headers": None,
            "byte_count": 0,
            "body": b"",
            "client_start_utc": None,
            "client_end_utc": None,
            "wall_time_ms": 0,
        }

    client_start_utc = _now_iso()
    start_monotonic = time.monotonic()
    deadline = start_monotonic + wall_seconds

    result = {
        "outcome": None,
        "failure_reason": None,
        "http_status": None,
        "headers": None,
        "byte_count": 0,
        "body": b"",
        "client_start_utc": client_start_utc,
        "client_end_utc": None,
    }

    conn = None
    timer = None
    watchdog_fired = threading.Event()

    # Captured once, right after connect(), and reused for every later
    # settimeout()/shutdown() call -- NEVER re-read conn.sock after this
    # point. This is the fix for a real bug this round's own live dispatch
    # attempt hit: http.client.HTTPConnection.getresponse() sets
    # conn.sock = None itself (inside its own self.close() call) the
    # instant it determines the response `will_close` (e.g. the server
    # answers without keep-alive) -- documented in CPython's own
    # getresponse() docstring/source, independently confirmed this round.
    # The response's own `resp.fp` keeps the real socket readable
    # regardless; only the now-stale `conn.sock` attribute goes away.
    sock_box = [None]

    def _abort_on_deadline():
        # The real guarantee for the WHOLE request -- see module docstring
        # (a). Shutting the socket down from this watchdog thread
        # unblocks whatever recv() the main thread is stuck in, in any
        # phase, immediately; a bare settimeout() cannot do that once
        # execution is already inside a multi-chunk internal read.
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
        # (a) armed BEFORE connecting, so DNS/connect/TLS are covered too.
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

        # Header phase: recompute remaining budget, apply to the captured
        # socket directly (http.client's own `timeout=` ctor arg only
        # seeds the initial connect; it does not re-arm itself per
        # operation). This per-call settimeout is defense-in-depth; the
        # watchdog above is the actual guarantee for the whole request.
        sock_box[0].settimeout(_remaining_or_raise(deadline))
        conn.putrequest("GET", path_and_query, skip_accept_encoding=True)
        conn.putheader("Host", parts.netloc)
        conn.putheader("User-Agent", user_agent)
        conn.putheader("Accept", "*/*")
        conn.putheader("Connection", "close")
        conn.endheaders()

        sock_box[0].settimeout(_remaining_or_raise(deadline))
        resp = conn.getresponse()
        result["http_status"] = resp.status
        result["headers"] = dict(resp.getheaders())
        # getresponse() may have already set conn.sock = None itself (see
        # comment on sock_box above) if it determined the response
        # will_close -- resp.fp still wraps the real, still-open socket,
        # so reading continues to work; we just stop touching conn.sock.

        # (d) streaming cap: read in small chunks so the cap is checked
        # well before any single read could run far past it.
        chunks = []
        total = 0
        overflow = False
        READ_CHUNK = 4096
        while True:
            if sock_box[0] is not None:
                try:
                    sock_box[0].settimeout(_remaining_or_raise(deadline))
                except OSError:
                    pass  # already closed by the watchdog or the peer -- next read() will surface it
            else:
                _remaining_or_raise(deadline)  # still enforce the deadline even with no socket handle to re-arm
            chunk = resp.read(READ_CHUNK)
            if not chunk:
                break
            total += len(chunk)
            if total > max_body_bytes:
                overflow = True
                allowed_here = max_body_bytes - (total - len(chunk))
                if allowed_here > 0:
                    chunks.append(chunk[:allowed_here])
                break
            chunks.append(chunk)

        body = b"".join(chunks)
        result["byte_count"] = len(body)
        result["body"] = body

        if overflow:
            result["outcome"] = "partial_overflow"
            result["failure_reason"] = f"response_exceeded_{max_body_bytes}_bytes_truncated_and_aborted"
        elif 300 <= resp.status < 400:
            result["outcome"] = "failed"
            result["failure_reason"] = f"redirect_not_followed_status_{resp.status}"
        elif resp.status != 200:
            result["outcome"] = "failed"
            result["failure_reason"] = f"http_status_{resp.status}"
        else:
            result["outcome"] = "complete"

    except BoundedFetchError as e:
        result["outcome"] = e.outcome
        result["failure_reason"] = e.reason
    except (socket.timeout, TimeoutError):
        result["outcome"] = "failed"
        result["failure_reason"] = "wall_timeout_exceeded"
    except OSError as e:
        if watchdog_fired.is_set():
            result["outcome"] = "failed"
            result["failure_reason"] = "wall_timeout_exceeded"
        else:
            result["outcome"] = "failed"
            result["failure_reason"] = f"transport_error:{e}"
    finally:
        if timer is not None:
            timer.cancel()
        if conn is not None:
            try:
                conn.close()
            except Exception:
                pass

    result["client_end_utc"] = _now_iso()
    result["wall_time_ms"] = round((time.monotonic() - start_monotonic) * 1000, 1)
    return result


# ---------------------------------------------------------------------------
# (e) Local mock self-test -- no network beyond 127.0.0.1, no real
# dispatch. Reuses the retained
# ticket-493-endpoint-acquisition/samples/test_server.py localhost server,
# imported by file path so no new sample file is created. These simulated
# call counts are entirely separate from the one real upstream call made
# by main().
# ---------------------------------------------------------------------------
def _load_test_server():
    import importlib.util

    path = os.path.normpath(os.path.join(HERE, "..", "..", "ticket-493-endpoint-acquisition", "samples", "test_server.py"))
    spec = importlib.util.spec_from_file_location("test_server", path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def mock_self_test():
    """Returns (ok: bool, report: list[str]). Must be called and shown to
    pass before the real dispatch in main()."""
    ts = _load_test_server()
    server, port = ts.start_server()
    report = []
    ok = True
    try:
        ok1, msg1 = _mock_case_wall_deadline(port)
        report.append(msg1)
        ok = ok and ok1

        ok2, msg2 = _mock_case_byte_cap_exact(port)
        report.append(msg2)
        ok = ok and ok2

        ok3, msg3 = _mock_case_allowlist_rejects_unknown_host()
        report.append(msg3)
        ok = ok and ok3

        ok4, msg4 = _mock_case_dispatch_marker_blocks_resend(port)
        report.append(msg4)
        ok = ok and ok4

        ok5, msg5 = _mock_case_redirect_not_followed(port)
        report.append(msg5)
        ok = ok and ok5
    finally:
        ts.stop_server(server)

    # Regression case for the real bug this round's own first live-dispatch
    # attempt actually hit (see cc-report.md/b2-report.md): a response
    # that makes http.client auto-close the connection (conn.sock = None)
    # as soon as getresponse() returns, confirmed against CPython's own
    # documented behaviour. Not covered by test_server.py (its responses
    # don't trigger will_close), so a tiny raw-socket server is used here
    # instead -- still 127.0.0.1 only, still no new sample file.
    ok6, msg6 = _mock_case_connection_close_response()
    report.append(msg6)
    ok = ok and ok6

    return ok, report


def _start_raw_close_server():
    """A minimal hand-written HTTP/1.1 server on 127.0.0.1 that always
    answers with an explicit `Connection: close` header -- the one
    response shape that makes http.client null out conn.sock inside
    getresponse() itself. threading + socket only, stdlib."""
    import threading as _threading

    srv = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    srv.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    srv.bind(("127.0.0.1", 0))
    srv.listen(1)
    port = srv.getsockname()[1]
    body = b'{"ok":true}'
    response = (
        b"HTTP/1.1 200 OK\r\n"
        b"Content-Type: application/json\r\n"
        b"Connection: close\r\n"
        b"Content-Length: " + str(len(body)).encode("ascii") + b"\r\n"
        b"\r\n" + body
    )

    def _serve_one():
        try:
            srv.settimeout(5)
            client, _ = srv.accept()
            try:
                client.settimeout(5)
                client.recv(65536)  # drain the request, ignore its content
                client.sendall(response)
            finally:
                client.close()
        except OSError:
            pass
        finally:
            srv.close()

    t = _threading.Thread(target=_serve_one, daemon=True)
    t.start()
    return port, body


def _mock_case_connection_close_response():
    port, expected_body = _start_raw_close_server()
    marker = os.path.join(HERE, ".self-test-marker-connclose")
    if os.path.exists(marker):
        os.remove(marker)
    r = bounded_get(
        f"http://127.0.0.1:{port}/",
        marker_path=marker,
        allowed_hosts={"127.0.0.1"},
        max_body_bytes=1000,
        wall_seconds=5,
        require_https=False,
    )
    if os.path.exists(marker):
        os.remove(marker)
    passed = r["outcome"] == "complete" and r["body"] == expected_body and r["failure_reason"] is None
    return passed, (
        f"connection_close_response: outcome={r['outcome']} reason={r.get('failure_reason')} "
        f"body_matches={r.get('body') == expected_body} -> {'PASS' if passed else 'FAIL'}"
    )


def _mock_case_wall_deadline(port):
    # /mid-body-stall sleeps 1.5s between each of 6 tiny chunks (9s total),
    # never idle long enough to trip a per-socket timeout on its own -- but
    # a 3s WHOLE-REQUEST deadline must still cut it off well before the
    # server finishes, proving (a).
    marker = os.path.join(HERE, ".self-test-marker-walldeadline")
    if os.path.exists(marker):
        os.remove(marker)
    t0 = time.monotonic()
    r = bounded_get(
        f"http://127.0.0.1:{port}/mid-body-stall",
        marker_path=marker,
        allowed_hosts={"127.0.0.1"},
        max_body_bytes=10_000,
        wall_seconds=3,
        require_https=False,
    )
    elapsed = time.monotonic() - t0
    if os.path.exists(marker):
        os.remove(marker)
    passed = r["outcome"] == "failed" and r["failure_reason"] == "wall_timeout_exceeded" and elapsed < 9.0
    return passed, f"wall_deadline: outcome={r['outcome']} reason={r.get('failure_reason')} elapsed={elapsed:.2f}s (server would take ~9s unbounded) -> {'PASS' if passed else 'FAIL'}"


def _mock_case_byte_cap_exact(port):
    # /over-cap-chunked sends exactly 10*100 = 1000 bytes. Cap set to 999
    # -- a single byte over the cap must be caught (not rounded/approximate).
    marker = os.path.join(HERE, ".self-test-marker-bytecap")
    if os.path.exists(marker):
        os.remove(marker)
    r = bounded_get(
        f"http://127.0.0.1:{port}/over-cap-chunked",
        marker_path=marker,
        allowed_hosts={"127.0.0.1"},
        max_body_bytes=999,
        wall_seconds=10,
        require_https=False,
    )
    if os.path.exists(marker):
        os.remove(marker)
    passed = r["outcome"] == "partial_overflow" and r["byte_count"] == 999
    return passed, f"byte_cap_1_over: server_sends=1000B cap=999B outcome={r['outcome']} retained_bytes={r['byte_count']} -> {'PASS' if passed else 'FAIL'}"


def _mock_case_allowlist_rejects_unknown_host():
    marker = os.path.join(HERE, ".never-written-marker")
    if os.path.exists(marker):
        os.remove(marker)
    raised = False
    try:
        bounded_get(
            "https://example.invalid/x",
            marker_path=marker,
            allowed_hosts={"gagnaveita.vegagerdin.is"},
            max_body_bytes=100,
            wall_seconds=1,
        )
    except ValueError:
        raised = True
    passed = raised and not os.path.exists(marker)
    return passed, f"allowlist_rejects_unknown_host -> {'PASS' if passed else 'FAIL'}"


def _mock_case_dispatch_marker_blocks_resend(port):
    marker = os.path.join(HERE, ".self-test-marker-resend")
    try:
        if os.path.exists(marker):
            os.remove(marker)
        fd = os.open(marker, os.O_CREAT | os.O_EXCL | os.O_WRONLY)
        os.close(fd)
        # Marker now exists -- a bounded_get with the SAME marker path
        # must refuse to send, even though host/scheme are otherwise
        # fine -- the marker check happens before any socket is touched.
        r = bounded_get(
            f"http://127.0.0.1:{port}/ok-small",
            marker_path=marker,
            allowed_hosts={"127.0.0.1"},
            max_body_bytes=100,
            wall_seconds=1,
            require_https=False,
        )
        passed = r["outcome"] == "failed" and r["failure_reason"] == "dispatch_marker_already_exists_refusing_resend"
        return passed, f"dispatch_marker_blocks_resend: outcome={r['outcome']} reason={r.get('failure_reason')} -> {'PASS' if passed else 'FAIL'}"
    finally:
        if os.path.exists(marker):
            os.remove(marker)


def _mock_case_redirect_not_followed(port):
    marker = os.path.join(HERE, ".self-test-marker-redirect")
    if os.path.exists(marker):
        os.remove(marker)
    r = bounded_get(
        f"http://127.0.0.1:{port}/redirect",
        marker_path=marker,
        allowed_hosts={"127.0.0.1"},
        max_body_bytes=1000,
        wall_seconds=5,
        require_https=False,
    )
    if os.path.exists(marker):
        os.remove(marker)
    passed = r["outcome"] == "failed" and (r.get("failure_reason") or "").startswith("redirect_not_followed_status_")
    return passed, f"redirect_not_followed: outcome={r['outcome']} reason={r.get('failure_reason')} -> {'PASS' if passed else 'FAIL'}"


# ---------------------------------------------------------------------------
# Real dispatch (the one authorized call) -- only runs if invoked with
# --dispatch, and only after mock_self_test() has already passed in the
# same process.
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
    print("[self-test] all local mock cases PASS.")

    if "--self-test" in sys.argv:
        return

    manifest_path = os.path.join(HERE, "request-manifest.json")
    with open(manifest_path, encoding="utf-8") as f:
        manifest = json.load(f)
    url = manifest["url"]

    # Verify the manifest's own encoded_request_sha256 before dispatch --
    # no "fixing" the query on the fly.
    basis = "GET " + url
    actual_sha = hashlib.sha256(basis.encode("utf-8")).hexdigest()
    if actual_sha != manifest["encoded_request_sha256"]:
        print(f"[precheck] FAILED sha mismatch: {actual_sha} != {manifest['encoded_request_sha256']}")
        sys.exit(1)
    # urlsplit/reassembly check -- the reconstructed URL must equal the
    # original byte-for-byte.
    parts = urlsplit(url)
    reassembled = parts.scheme + "://" + parts.netloc + parts.path + (("?" + parts.query) if parts.query else "")
    if reassembled != url:
        print("[precheck] FAILED urlsplit/reassembly mismatch -- refusing to dispatch.")
        sys.exit(1)
    print(f"[precheck] sha256 and urlsplit/reassembly verified OK: {actual_sha}")

    marker_path = os.path.join(HERE, "dispatch-marker-B2-LOCAL-GEOMETRY.json")
    result = bounded_get(
        url,
        marker_path=marker_path,
        allowed_hosts={"gagnaveita.vegagerdin.is"},
        max_body_bytes=manifest["max_body_bytes"],
        wall_seconds=manifest["wall_seconds"],
    )

    body = result.pop("body")
    ext = "json" if result["outcome"] in ("complete", "partial_overflow") else "bin"
    body_path = os.path.join(HERE, f"raw-B2-LOCAL-GEOMETRY.{ext}")
    with open(body_path, "wb") as f:
        f.write(body)
    result["sha256_of_retained_bytes"] = hashlib.sha256(body).hexdigest()
    result["body_file"] = os.path.basename(body_path)
    result["request_id"] = manifest["request_id"]
    result["url"] = url
    result["server_date_header"] = (result.get("headers") or {}).get("Date")

    ledger_path = os.path.join(HERE, "request-ledger.json")
    with open(ledger_path, "w", encoding="utf-8") as f:
        json.dump(result, f, indent=2, ensure_ascii=False)
        f.write("\n")

    print(json.dumps({
        "outcome": result["outcome"],
        "http_status": result["http_status"],
        "byte_count": result["byte_count"],
        "failure_reason": result["failure_reason"],
    }))


if __name__ == "__main__":
    main()
