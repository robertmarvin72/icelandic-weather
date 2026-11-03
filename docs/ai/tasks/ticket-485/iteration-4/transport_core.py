"""#485 iteration-4 -- shared low-level transport primitive.

Pure mechanics: DNS resolution, TCP connect, optional TLS, HTTP/1.1 GET,
bounded decompressed read -- parameterised by host/port/path because that
is what makes it a reusable, independently testable primitive. This module
has NO notion of "provider" vs "test": `child_worker.py` (production)
always calls it with `provider_target`'s fixed constants; `test/
test_transport_child.py` (test-only) calls the SAME function with a
loopback address. Neither file exposes this parameterisation to an
external caller -- see those two files for how each fixes its own target.

Uses only Python's standard library (socket/ssl/http.client/zlib) so the
raw streaming/decompression limits are directly controllable, as required
-- no `requests`, no install.
"""
import gzip
import http.client
import io
import socket
import ssl
import time
import zlib


class TransportError(Exception):
    """Carries only a fixed safe category string -- never a raw message
    from an underlying exception, which can embed host/URL/secret-bearing
    text. CORRECTION v7 (R4): also carries `bytes_decoded_so_far` -- the
    honestly observed decoded-byte count at the moment of failure (0 if
    nothing had been read yet, e.g. a connect/TLS failure). This is
    reporting only -- it is never used to charge LESS than the full
    reserved cap for an incomplete/failed transfer (see `ledger.py`'s
    `_apply_outcome`); it exists so a cooperative partial-transfer
    failure (server sends part of the body then resets) is recorded
    truthfully instead of silently as 0."""
    def __init__(self, category, bytes_decoded_so_far=0):
        super().__init__(category)
        self.category = category
        self.bytes_decoded_so_far = bytes_decoded_so_far


CATEGORY_DNS_TIMEOUT = "DNS_TIMEOUT"
CATEGORY_CONNECT_TIMEOUT = "CONNECT_TIMEOUT"
CATEGORY_CONNECT_FAILURE = "CONNECT_FAILURE"
CATEGORY_TLS_FAILURE = "TLS_FAILURE"
CATEGORY_READ_TIMEOUT = "READ_TIMEOUT"
CATEGORY_TRANSPORT_FAILURE = "TRANSPORT_FAILURE"
CATEGORY_DEADLINE_EXCEEDED = "DEADLINE_EXCEEDED"


def _remaining(deadline_monotonic):
    rem = deadline_monotonic - time.monotonic()
    if rem <= 0:
        raise TransportError(CATEGORY_DEADLINE_EXCEEDED)
    return rem


def _create_tls_context():
    """Correction v6 (R5/R6): the shared `request()` function below no
    longer accepts a `ca_file`/`verify` parameter of any kind -- that was
    a seam a careless caller (or a future refactor) could have passed a
    non-default value through. A custom trust root for the TLS self-test
    is now ENTIRELY test-side: `test/test_transport_child.py` (which runs
    in its own separate OS process, never the production one) may
    monkeypatch THIS specific function object before calling `request()`;
    nothing in `request()`'s own signature exposes the override, and
    `child_worker.py` (production) never touches this function at all."""
    return ssl.create_default_context()


def request(host, port, path, query, headers, use_tls, deadline_monotonic,
            decoded_cap):
    """Performs ONE GET request. `query` is the full, already-built query
    string (schema-validated params + the secret appended by the caller --
    this function treats it as an opaque string, never logs or returns it).
    `decoded_cap`: hard cap on DECODED bytes read (separate from wire/
    compressed size). Returns (status, decoded_body_bytes, truncated_bool,
    content_encoding_str_or_None). Raises TransportError with a fixed
    category on any failure -- never leaks the raw underlying exception.

    Every blocking step checks remaining time against `deadline_monotonic`
    first and uses that remaining time as its own socket-level timeout, so
    a single slow step cannot silently consume the whole budget unnoticed.
    """
    try:
        rem = _remaining(deadline_monotonic)
        try:
            addrinfo = socket.getaddrinfo(host, port, type=socket.SOCK_STREAM)
        except socket.gaierror:
            raise TransportError(CATEGORY_CONNECT_FAILURE)
        if not addrinfo:
            raise TransportError(CATEGORY_CONNECT_FAILURE)
        family, socktype, proto, _, sockaddr = addrinfo[0]

        rem = _remaining(deadline_monotonic)
        sock = socket.socket(family, socktype, proto)
        sock.settimeout(rem)
        try:
            sock.connect(sockaddr)
        except socket.timeout:
            sock.close()
            raise TransportError(CATEGORY_CONNECT_TIMEOUT)
        except OSError:
            sock.close()
            raise TransportError(CATEGORY_CONNECT_FAILURE)

        if use_tls:
            rem = _remaining(deadline_monotonic)
            ctx = _create_tls_context()
            # Explicit, fixed: default hostname+cert verification, never
            # relaxed by any caller-supplied flag -- there is no parameter
            # here for a caller to pass verify=False.
            sock.settimeout(rem)
            try:
                tls_sock = ctx.wrap_socket(sock, server_hostname=host)
            except ssl.SSLCertVerificationError:
                sock.close()
                raise TransportError(CATEGORY_TLS_FAILURE)
            except (ssl.SSLError, socket.timeout):
                sock.close()
                raise TransportError(CATEGORY_TLS_FAILURE)
            active_sock = tls_sock
        else:
            active_sock = sock

        try:
            rem = _remaining(deadline_monotonic)
            active_sock.settimeout(rem)
            full_path = f"{path}?{query}" if query else path
            req_lines = [
                f"GET {full_path} HTTP/1.1",
                f"Host: {host}",
                "Accept-Encoding: gzip",
                "Connection: close",
                "",
                "",
            ]
            active_sock.sendall("\r\n".join(req_lines).encode("ascii"))

            status, decoded, truncated, encoding = _read_response(
                active_sock, deadline_monotonic, decoded_cap)
            return status, decoded, truncated, encoding
        except socket.timeout:
            raise TransportError(CATEGORY_READ_TIMEOUT)
        except TransportError:
            raise
        except OSError:
            raise TransportError(CATEGORY_TRANSPORT_FAILURE)
        finally:
            try:
                active_sock.close()
            except OSError:
                pass
    except TransportError:
        raise
    except Exception:
        # Catch-all: never let a raw exception (which can embed the query
        # string, and therefore the secret) propagate past this function.
        raise TransportError(CATEGORY_TRANSPORT_FAILURE)


def _read_response(sock, deadline_monotonic, decoded_cap):
    """Reads the raw HTTP response, parses status + headers with
    http.client's own parser (fed from a buffered-socket shim), then
    streams the body, decompressing gzip if declared, stopping at
    `decoded_cap` DECODED bytes regardless of wire size."""
    raw_chunks = []
    total_wire = 0
    WIRE_SAFETY_CAP = decoded_cap * 4 + 65536  # generous bound on compressed input size alone

    class _Sock:
        """Minimal file-like shim so http.client.HTTPResponse can parse
        status/headers from bytes we read ourselves with our own deadline
        checks -- avoids pulling in a full HTTPConnection (which does its
        own connect, duplicating what we already did above)."""
        def __init__(self, raw_sock):
            self._raw = raw_sock
            self._buf = b""

        def makefile(self, *a, **kw):
            return self

        def close(self):
            pass  # the underlying socket is closed by the caller's `finally`, not by http.client

        def flush(self):
            pass

        def readline(self, limit=-1):
            while b"\n" not in self._buf:
                rem = _remaining(deadline_monotonic)
                self._raw.settimeout(rem)
                chunk = self._raw.recv(4096)
                if not chunk:
                    break
                self._buf += chunk
            if b"\n" in self._buf:
                line, self._buf = self._buf.split(b"\n", 1)
                return line + b"\n"
            line, self._buf = self._buf, b""
            return line

        def read(self, n=-1):
            while len(self._buf) < n or n == -1:
                rem = _remaining(deadline_monotonic)
                self._raw.settimeout(rem)
                chunk = self._raw.recv(4096)
                if not chunk:
                    break
                self._buf += chunk
                if n != -1 and len(self._buf) >= n:
                    break
            if n == -1:
                data, self._buf = self._buf, b""
                return data
            data, self._buf = self._buf[:n], self._buf[n:]
            return data

    shim = _Sock(sock)
    resp = http.client.HTTPResponse(shim)
    resp.begin()
    status = resp.status
    encoding = resp.getheader("Content-Encoding")

    decompressor = zlib.decompressobj(16 + zlib.MAX_WBITS) if encoding == "gzip" else None
    decoded_total = 0
    truncated = False
    out = []
    # CORRECTION v7 (R4): this loop's body is wrapped so that ANY failure
    # partway through (connection reset, read timeout, decompression
    # error) still reports the honestly observed `decoded_total` at the
    # moment of failure, via TransportError.bytes_decoded_so_far --
    # instead of silently losing that count to an exception that just
    # propagated out with no byte information at all (v6's defect: a
    # server sending 1.9 MB then resetting was reported as 0 bytes).
    try:
        while True:
            rem = _remaining(deadline_monotonic)
            sock.settimeout(rem)
            chunk = resp.read(8192)
            if not chunk:
                break
            total_wire += len(chunk)
            if total_wire > WIRE_SAFETY_CAP:
                truncated = True
                break
            if decompressor is not None:
                try:
                    piece = decompressor.decompress(chunk, decoded_cap - decoded_total + 1)
                except zlib.error:
                    raise TransportError(CATEGORY_TRANSPORT_FAILURE, bytes_decoded_so_far=decoded_total)
            else:
                piece = chunk
            remaining_cap = decoded_cap - decoded_total
            if len(piece) > remaining_cap:
                out.append(piece[:remaining_cap])
                decoded_total += remaining_cap
                truncated = True
                break
            out.append(piece)
            decoded_total += len(piece)
            if decoded_total >= decoded_cap:
                truncated = True
                break
    except socket.timeout:
        raise TransportError(CATEGORY_READ_TIMEOUT, bytes_decoded_so_far=decoded_total)
    except TransportError:
        raise
    except OSError:
        raise TransportError(CATEGORY_TRANSPORT_FAILURE, bytes_decoded_so_far=decoded_total)
    return status, b"".join(out), truncated, encoding
