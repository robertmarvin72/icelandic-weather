"""#485 iteration-4 correction v7 (R1) -- TEST-ONLY, fail-closed network
guard. MUST be imported and have `install()` called as the very FIRST
thing in every test entry process and every test-spawned child process,
before `transport_core`/`socket` is touched for anything that could
reach a real resolver or a real connection.

Why this exists: Jonesy's Round-2 review found that `test_url_leak_
injection.py` and `test_mutation_regressions.py` (mutation 2) ran the
REAL `child_worker.py` against the REAL `provider_target` constants,
patching only `socket.socket.connect` -- so `transport_core.request()`
still called `socket.getaddrinfo("customer-api.open-meteo.com", 443)`
for real, BEFORE the patched `connect()` was ever reached. That is a
genuine breach of this task's "no external network, DNS included" hard
rule, even though no TCP connection or key ever left the process -- a
name-resolution-only breach is still a breach.

This guard replaces `socket.getaddrinfo`, `socket.socket.connect`,
`socket.socket.connect_ex`, and `socket.create_connection` with versions
that check the target host BEFORE ever touching the real resolver/socket
call. Only an explicit LITERAL loopback address (`127.0.0.1` or `::1` --
never a hostname, including `localhost`, since resolving even that name
is a real resolver call this guard refuses to make on principle) is
allowed through to the real underlying function. Any other host is
refused immediately with `NetworkGuardViolation` -- the real resolver/
connect function is NEVER invoked for a non-loopback target, so there is
no path left by which this guard's own enforcement could itself leak
network traffic.

Never imported by any production module -- `test_import_isolation.py`
checks this statically, the same as every other `test/` file.
"""
import socket

_LOOPBACK_LITERALS = {"127.0.0.1", "::1"}

installed = False
blocked_count = 0
allowed_count = 0
blocked_hosts = []

_real_getaddrinfo = socket.getaddrinfo
_real_connect = socket.socket.connect
_real_connect_ex = socket.socket.connect_ex
_real_create_connection = socket.create_connection


class NetworkGuardViolation(OSError):
    """Raised INSTEAD OF ever invoking the real resolver/connect function
    for a non-loopback target. Subclasses OSError so it safely maps
    through `transport_core.request()`'s own existing exception handling
    into a fixed TransportError category, exactly like any other real
    transport failure -- this guard adds a hard pre-check, it does not
    change what callers see when a violation is (correctly) refused."""
    category = "NETWORK_GUARD_BLOCKED_NONLOOPBACK"


def _host_of(address):
    return address[0] if isinstance(address, tuple) else address


def _check(host):
    global blocked_count, allowed_count
    if host in _LOOPBACK_LITERALS:
        allowed_count += 1
        return True
    blocked_count += 1
    blocked_hosts.append(host)
    return False


def _guarded_getaddrinfo(host, port, *args, **kwargs):
    if not _check(host):
        raise NetworkGuardViolation(
            f"network guard: refused getaddrinfo() for non-loopback host {host!r} -- "
            f"the real resolver was never called")
    return _real_getaddrinfo(host, port, *args, **kwargs)


def _guarded_connect(self, address):
    host = _host_of(address)
    if not _check(host):
        raise NetworkGuardViolation(
            f"network guard: refused connect() to non-loopback address {address!r} -- "
            f"the real connect() was never called")
    return _real_connect(self, address)


def _guarded_connect_ex(self, address):
    host = _host_of(address)
    if not _check(host):
        raise NetworkGuardViolation(
            f"network guard: refused connect_ex() to non-loopback address {address!r} -- "
            f"the real connect_ex() was never called")
    return _real_connect_ex(self, address)


def _guarded_create_connection(address, *args, **kwargs):
    host = _host_of(address)
    if not _check(host):
        raise NetworkGuardViolation(
            f"network guard: refused create_connection() to non-loopback address {address!r} -- "
            f"the real create_connection() was never called")
    return _real_create_connection(address, *args, **kwargs)


def install():
    """Idempotent: calling this more than once in the same process is
    safe (re-assigns the same guarded functions)."""
    global installed
    socket.getaddrinfo = _guarded_getaddrinfo
    socket.socket.connect = _guarded_connect
    socket.socket.connect_ex = _guarded_connect_ex
    socket.create_connection = _guarded_create_connection
    installed = True


def reset_counters():
    global blocked_count, allowed_count, blocked_hosts
    blocked_count = 0
    allowed_count = 0
    blocked_hosts = []
