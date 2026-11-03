"""#485 iteration-4 -- PARENT-side orchestration (the "candidate client").
CORRECTION v7 (R2, R4, R6) -- see the inline notes below for exactly what
changed and why; the overall shape (validate -> reserve -> spawn child ->
leak-scan -> persist) is unchanged, but several of its parts were not
actually safe.

`run_request()`'s public signature is still ONLY `(param_pairs, secret)`
-- no `ledger_path`, no `_decoded_cap`/`_total_deadline_s` override, no
`_child_script_path` seam. A test that needs a different target does so
by running a TASK-LOCAL COPY of this whole module tree with ONLY
`provider_target.py` edited (see `test/test_e2e_loopback.py`), never by
passing a parameter into the real file.
"""
import json
import math
import os
import subprocess
import sys
import time
from datetime import datetime

import leak_scanner
import ledger
import limits
import provider_target
import schema
import secret_policy

HERE = os.path.dirname(os.path.abspath(__file__))
CHILD_WORKER_PATH = os.path.join(HERE, "child_worker.py")
LEDGER_PATH = os.path.join(HERE, "samples", "ledger.json")  # FIXED -- no caller override
SAMPLES_DIR = os.path.join(HERE, "samples")

SAMPLE_NOT_APPLICABLE = "NOT_APPLICABLE"
SAMPLE_VALID = "VALID"
# CORRECTION v8 (R1/R2): "invalid" used to mean one undifferentiated thing
# (any unexpected field, any missing data, any secret) and was ALWAYS
# terminal. Jonesy's Round-3 finding: that conflated "unsafe" with merely
# "unknown" or "not yet a usable forecast" -- a documented, genuinely
# normal 200 response (which includes utc_offset_seconds/timezone/
# timezone_abbreviation, not previously allowlisted) was rejected as if
# it were unsafe, burning the single-use ledger on the first real call.
# Three distinct, separately-classified outcomes replace the old single
# SAMPLE_INVALID:
SAMPLE_STRUCTURAL_FAILURE = "STRUCTURAL_FAILURE"  # terminal: secret, non-JSON, or an invalid stored-field type/value
SAMPLE_UNSUPPORTED_TOP_LEVEL_LIST = "UNSUPPORTED_TOP_LEVEL_LIST"  # non-terminal: multi-coordinate list response
SAMPLE_INCOMPLETE = "SAMPLE_INCOMPLETE"  # non-terminal: well-formed shape, but not a complete forecast


class SuspectedSecretDisclosure(Exception):
    pass


class CandidateRefusal(Exception):
    """Raised for any condition that must stop this run outright (bad
    params, suspected disclosure, budget exhausted, terminal ledger) --
    never silently degraded into a 'best effort' partial result."""


def _fixed_origin_string():
    return (f"{provider_target.PROVIDER_SCHEME}://{provider_target.PROVIDER_HOST}:"
            f"{provider_target.PROVIDER_PORT}{provider_target.PROVIDER_PATH}")


def _minimal_child_env():
    """No inherited real-key/environment access, and proxy/CA environment
    variables are never passed through to the child."""
    env = {}
    for k in ("PATH", "SYSTEMROOT", "WINDIR"):
        if k in os.environ:
            env[k] = os.environ[k]
    return env


def run_request(param_pairs, secret):
    """`param_pairs`: list of (name, value) tuples -- the caller's forecast
    request parameters, WITHOUT apikey. `secret`: the API key, held only
    in this function's local memory and the child's stdin pipe -- never
    written to the ledger, never printed, never logged.

    Returns a safe, already-sanitised outcome dict. Raises
    `CandidateRefusal` (never a bare Exception with secret-bearing text)
    if anything required cannot be satisfied safely, or one of
    `ledger.LedgerTerminal` / `ledger.LedgerIncomplete` if a prior run
    already put this ledger into a terminal or unresolved-incomplete
    state (R2) -- those exceptions are intentionally NOT caught here, so
    they are clearly distinguishable from an ordinary refusal.
    """
    # R5: reject a malformed/empty secret BEFORE any attempt/socket,
    # including before the ledger reservation itself -- not merely inside
    # the child, which is a second, defence-in-depth check, not the only one.
    try:
        secret_policy.validate_and_encode(secret)
    except secret_policy.MalformedSecret as e:
        raise CandidateRefusal(f"{e.category}")

    try:
        validated = schema.validate_params(param_pairs)
    except schema.SchemaViolation as e:
        raise CandidateRefusal(str(e))  # already "{category}: field={name}", never a raw value (R5)
    query_no_key = schema.serialize_query(validated)
    if leak_scanner.contains_secret(query_no_key, secret):
        # No attempt exists yet -- `mark_terminal()` alone is correct here
        # (there is nothing to tie a `finalize_attempt()` outcome to).
        ledger.mark_terminal(LEDGER_PATH, "SUSPECTED_SECRET_DISCLOSURE")
        raise SuspectedSecretDisclosure("validated query unexpectedly contains the secret")

    os.makedirs(SAMPLES_DIR, exist_ok=True)
    try:
        attempt_id = ledger.reserve_attempt(LEDGER_PATH)
    except ledger.BudgetExceeded as e:
        raise CandidateRefusal(f"BUDGET_EXCEEDED: {e}")
    # ledger.LedgerTerminal / LedgerIncomplete / LedgerAmbiguous / LedgerBusy
    # propagate unchanged -- a caller must be able to tell these apart from
    # an ordinary CandidateRefusal.
    ledger.set_target_origin(LEDGER_PATH, attempt_id, _fixed_origin_string())

    # R4: the real MIN(per-attempt cap, remaining global budget), computed
    # and durably stored by reserve_attempt() itself -- not the flat
    # per-attempt constant.
    decoded_cap = ledger.get_reserved_decoded_cap(LEDGER_PATH, attempt_id)

    deadline_epoch = time.time() + limits.TOTAL_DEADLINE_S
    stdin_obj = {"query_no_key": query_no_key, "secret": secret,
                 "deadline_epoch": deadline_epoch, "decoded_cap": decoded_cap}
    stdin_bytes = (json.dumps(stdin_obj) + "\n").encode("utf-8")

    try:
        outcome, validated_sample, sample_status, unknown_field_count = _dispatch_child_and_collect(
            stdin_bytes, secret, limits.TOTAL_DEADLINE_S, CHILD_WORKER_PATH)
    except SuspectedSecretDisclosure:
        # R2: ONE atomic write records both the outcome AND the terminal
        # flag for this attempt -- never two separate lock cycles (that
        # was v6's gap: a crash between record_outcome() and
        # mark_terminal() could leave a complete row with no terminal
        # flag). This also fixes the earlier "any direct call to the
        # private dispatch function corrupts the real ledger" defect,
        # since _dispatch_child_and_collect() itself still has zero
        # ledger coupling of its own.
        disclosure_outcome = {"category": "SUSPECTED_SECRET_DISCLOSURE", "status": None,
                               "bytes_decoded": 0, "truncated": False}
        ledger.finalize_attempt(LEDGER_PATH, attempt_id, disclosure_outcome,
                                 terminal_reason_category="SUSPECTED_SECRET_DISCLOSURE")
        raise

    # CORRECTION v8 (R1/R2): a 200 that is genuinely UNSAFE (secret
    # reflection, non-JSON body, or an invalid stored-field type/value)
    # must never be indistinguishable from an ordinary successful OK/200
    # -- its category is overridden before persistence, and it is
    # terminal. But a 200 that is merely UNSUPPORTED (a multi-coordinate
    # list response -- out of scope for this single-location candidate)
    # or INCOMPLETE (well-formed but not a usable forecast, e.g. missing
    # required hourly arrays) is NOT unsafe and must NOT be terminal and
    # must NOT have its category overridden -- the HTTP exchange itself
    # was clean, only the sample content wasn't fully usable. The ledger
    # still charges the real received bytes for these (category stays
    # "OK"), per R3's explicit decision to keep conservative-only-on-
    # real-failure charging.
    terminal_reason = None
    sample_written = None
    sample_reason = None
    status = outcome.get("status")
    if outcome["category"] == "PARENT_ENFORCED_TOTAL_DEADLINE":
        terminal_reason = "HARD_DEADLINE_KILL"
    elif status in (401, 403, 429):
        terminal_reason = f"AUTH_OR_RATE_FAILURE_{status}"
    elif outcome["category"] in ("CHILD_OUTPUT_UNPARSEABLE", "BAD_CHILD_INPUT"):
        terminal_reason = "MALFORMED_CHILD_OUTPUT"
    elif sample_status == SAMPLE_STRUCTURAL_FAILURE:
        outcome = dict(outcome)
        outcome["category"] = "UNSAFE_SAMPLE_REJECTED"
        terminal_reason = "UNSAFE_SAMPLE"
        sample_written = False
        sample_reason = "STRUCTURAL_FAILURE"
    elif sample_status == SAMPLE_UNSUPPORTED_TOP_LEVEL_LIST:
        sample_written = False
        sample_reason = "SAMPLE_UNSUPPORTED_TOP_LEVEL_LIST"
    elif sample_status == SAMPLE_INCOMPLETE:
        sample_written = False
        sample_reason = "SAMPLE_INCOMPLETE"
    elif sample_status == SAMPLE_VALID:
        # R6: written here, in the PARENT, after full classification --
        # unique per-attempt filename, never overwriting a prior sample.
        written_path = _write_unique_sample(attempt_id, validated_sample)
        sample_written = written_path is not None
        if not sample_written:
            sample_reason = "SAMPLE_WRITE_FAILED"
        elif unknown_field_count:
            # R1: additive, harmless unknown top-level fields are dropped
            # (never stored, never their names/values) but counted here --
            # NOT a terminal/unsafe condition by themselves.
            sample_reason = f"OK_UNKNOWN_FIELDS_DROPPED:{unknown_field_count}"
        else:
            sample_reason = "OK"

    ledger.finalize_attempt(LEDGER_PATH, attempt_id, outcome, terminal_reason_category=terminal_reason,
                             sample_written=sample_written, sample_reason=sample_reason)
    return outcome


def _dispatch_child_and_collect(stdin_bytes, secret, total_deadline_s, child_script_path):
    """Returns (safe_outcome_dict, validated_sample_dict_or_None,
    sample_status_str, unknown_field_count), or RAISES
    `SuspectedSecretDisclosure`. This
    function has NO ledger coupling of its own, and (R6, corrected)
    performs NO sample file I/O of its own either -- it only VALIDATES a
    candidate sample and returns it for the PARENT to classify and write.
    `child_script_path` is always `CHILD_WORKER_PATH` for the real
    `run_request()` above -- there is no override parameter on the public
    API for any caller to redirect it. (A test proving real end-to-end
    behaviour instead runs a task-local COPY of this whole file, with
    only `provider_target.py` edited in that copy -- see
    `test/test_e2e_loopback.py`. A test exercising narrower transport/
    leak-scan mechanics may still call this private function directly
    with a test-only script path -- see `test_adapter.py` -- which is
    safe to do because this function has no ledger OR sample-file side
    effects of its own to leak onto the real candidate state.)"""
    popen_kwargs = dict(
        stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
        env=_minimal_child_env(), cwd=HERE,
    )
    if sys.platform == "win32":
        popen_kwargs["creationflags"] = subprocess.CREATE_NO_WINDOW
    proc = subprocess.Popen([sys.executable, "-B", child_script_path], **popen_kwargs)
    killed = False
    try:
        # R6: NO added grace period -- the total deadline covers the whole
        # exchange including IPC; `communicate()`'s own timeout IS the cap.
        stdout_bytes, stderr_bytes = proc.communicate(input=stdin_bytes, timeout=total_deadline_s)
    except subprocess.TimeoutExpired:
        proc.kill()
        try:
            proc.wait(timeout=5)  # bounded join after kill -- disclosed cleanup latency, not unbounded
        except subprocess.TimeoutExpired:
            pass  # even this is bounded; the process is in the process of being reaped by the OS regardless
        try:
            stdout_bytes, stderr_bytes = proc.stdout.read() or b"", proc.stderr.read() or b""
        except Exception:
            stdout_bytes, stderr_bytes = b"", b""
        killed = True

    for label, blob in (("stdout", stdout_bytes), ("stderr", stderr_bytes)):
        if leak_scanner.contains_secret_bytes(blob, secret.encode("utf-8", "surrogateescape")):
            raise SuspectedSecretDisclosure(f"secret-shaped content found in child {label}")

    if killed:
        return ({"category": "PARENT_ENFORCED_TOTAL_DEADLINE", "status": None,
                  "bytes_decoded": 0, "truncated": False}, None, SAMPLE_NOT_APPLICABLE, 0)

    try:
        lines = stdout_bytes.decode("utf-8").splitlines()
        meta = json.loads(lines[0])
        body_obj = json.loads(lines[1]) if len(lines) > 1 else {"body_latin1": ""}
        body = body_obj.get("body_latin1", "").encode("latin1")
    except Exception:
        return ({"category": "CHILD_OUTPUT_UNPARSEABLE", "status": None,
                  "bytes_decoded": 0, "truncated": False}, None, SAMPLE_NOT_APPLICABLE, 0)

    safe_outcome = {
        "category": str(meta.get("category", "UNKNOWN"))[:64],
        "status": meta.get("status") if isinstance(meta.get("status"), int) else None,
        "bytes_decoded": int(meta.get("bytes_decoded", 0)) if isinstance(meta.get("bytes_decoded"), int) else 0,
        "truncated": bool(meta.get("truncated", False)),
    }

    # R1: the raw, complete, decoded-cap-bounded body is scanned for the
    # secret HERE, BEFORE any JSON parsing or field-dropping happens below
    # -- so a secret reflected inside a field this candidate does not even
    # recognise (and is about to silently drop) is still caught. Nothing
    # past this point ever sees the secret again.
    if leak_scanner.contains_secret_bytes(body, secret.encode("utf-8", "surrogateescape")):
        raise SuspectedSecretDisclosure("secret-shaped content found in child response body")

    if safe_outcome["category"] == "OK" and safe_outcome["status"] == 200:
        validated_sample, sample_status, unknown_field_count = _validate_and_scan_sample(body, secret)
        return safe_outcome, validated_sample, sample_status, unknown_field_count

    return safe_outcome, None, SAMPLE_NOT_APPLICABLE, 0


# --- R6/v8 R1/R2: safe forecast sample validation (write happens in run_request()) --
#
# Source for the documented response shape (v8 R1): `../iteration-3/
# samples/openmeteo-docs.html` (SHA256 7c63cb41859f759065a9ac85f919588d
# 16ccbba82d34c483587eec6606e32566, retained from an earlier round, no
# live docs fetch this round). Its JSON response example (lines ~179-194)
# reads:
#   {"latitude": 52.52, "longitude": 13.419, "elevation": 44.812,
#    "generationtime_ms": 2.2119, "utc_offset_seconds": 0,
#    "timezone": "Europe/Berlin", "timezone_abbreviation": "CEST",
#    "hourly": {"time": [...], "temperature_2m": [...]},
#    "hourly_units": {"temperature_2m": "°C"}}
# and its response-field table (lines ~196-199) documents
# `utc_offset_seconds` (Integer), `timezone` and `timezone_abbreviation`
# (String) as normal top-level fields of EVERY forecast response -- none
# of which the v7 allowlist recognised, so a genuinely normal 200 was
# rejected as unsafe (Jonesy's Round-3 R1 finding).

_SAMPLE_ALLOWED_TOP_FIELDS = {"latitude", "longitude", "elevation", "hourly_units", "hourly", "generationtime_ms",
                              "utc_offset_seconds", "timezone", "timezone_abbreviation"}
_SAMPLE_ALLOWED_HOURLY_FIELDS = set(schema.REQUIRED_HOURLY) | {schema.OPTIONAL_HOURLY, "time"}
_SAMPLE_MAX_ARRAY_LEN = 24 * 4  # bounded: a few days of hourly points at most
_SAMPLE_MAX_STR_LEN = 64


def _finite_number(v):
    return isinstance(v, (int, float)) and not isinstance(v, bool) and math.isfinite(v)


def _validate_sample_shape(payload):
    """Returns `(out_dict, unknown_field_count)` -- an allowlisted,
    type/count/bound-checked copy of `payload`, plus a COUNT of
    top-level fields that were present but not recognised (dropped,
    never stored by name or value -- v8 R1: an additive, harmless
    unknown field is no longer a structural failure by itself). Raises
    `ValueError` (caught by the caller, never persisted either way) ONLY
    for a genuine structural violation: a non-object body, or a stored
    (recognised) field with an invalid type/value."""
    if not isinstance(payload, dict):
        raise ValueError("not an object")
    unknown_field_count = len(set(payload.keys()) - _SAMPLE_ALLOWED_TOP_FIELDS)
    out = {}
    for k in ("latitude", "longitude", "elevation"):
        if k in payload:
            v = payload[k]
            if not _finite_number(v):
                raise ValueError(f"{k} not a finite number")
            out[k] = float(v)
    if "utc_offset_seconds" in payload:
        v = payload["utc_offset_seconds"]
        if not isinstance(v, int) or isinstance(v, bool):
            raise ValueError("utc_offset_seconds not an integer")
        out["utc_offset_seconds"] = v
    for k in ("timezone", "timezone_abbreviation"):
        if k in payload:
            v = payload[k]
            if not isinstance(v, str) or len(v) > _SAMPLE_MAX_STR_LEN:
                raise ValueError(f"{k} not a bounded string")
            out[k] = v
    if "hourly_units" in payload:
        units = payload["hourly_units"]
        if not isinstance(units, dict):
            raise ValueError("hourly_units not an object")
        out["hourly_units"] = {}
        for k, v in units.items():
            if k not in _SAMPLE_ALLOWED_HOURLY_FIELDS or not isinstance(v, str) or len(v) > 32:
                raise ValueError("bad hourly_units entry")
            out["hourly_units"][k] = v
    if "hourly" in payload:
        hourly = payload["hourly"]
        if not isinstance(hourly, dict):
            raise ValueError("hourly not an object")
        out["hourly"] = {}
        n = None
        prev_time = None
        for k, arr in hourly.items():
            if k not in _SAMPLE_ALLOWED_HOURLY_FIELDS:
                raise ValueError(f"unexpected hourly field {k}")
            if not isinstance(arr, list) or len(arr) > _SAMPLE_MAX_ARRAY_LEN:
                raise ValueError(f"hourly.{k} not a bounded list")
            if n is None:
                n = len(arr)
            elif len(arr) != n:
                raise ValueError("hourly array length mismatch")
            for v in arr:
                if k == "time":
                    # Bounded, ISO-like UTC hourly timestamp (the
                    # documented "YYYY-MM-DDTHH:MM" shape, no seconds),
                    # strictly increasing and unique -- a genuine
                    # structural failure, not mere incompleteness (v8 R2).
                    if not isinstance(v, str) or len(v) > 32:
                        raise ValueError("bad time entry")
                    try:
                        parsed_t = datetime.strptime(v, "%Y-%m-%dT%H:%M")
                    except ValueError:
                        raise ValueError("time entry not the documented ISO-like UTC hourly format")
                    if prev_time is not None and parsed_t <= prev_time:
                        raise ValueError("time entries not strictly increasing/unique")
                    prev_time = parsed_t
                else:
                    # v8 R2: a null is explicitly ALLOWED through (Open-
                    # Meteo may legitimately report a missing data point)
                    # -- it is preserved as-is, never claimed usable.
                    if v is not None and not _finite_number(v):
                        raise ValueError(f"bad numeric entry in {k}")
            out["hourly"][k] = arr
    return out, unknown_field_count


def _is_complete_forecast(safe):
    """v8 R2: a well-formed (structurally valid) sample may still not be
    a USABLE forecast -- `{}` passes `_validate_sample_shape` cleanly
    (nothing present is invalid) but contains no forecast at all.
    Requires `hourly.time` plus all six `schema.REQUIRED_HOURLY` arrays,
    non-empty, of equal length, with matching `hourly_units` entries for
    `time` and every required variable. The optional variable
    (`schema.OPTIONAL_HOURLY`) is not required to be present, but if
    present must already have passed the equal-length check above."""
    hourly = safe.get("hourly")
    if not isinstance(hourly, dict):
        return False
    time_arr = hourly.get("time")
    if not isinstance(time_arr, list) or len(time_arr) == 0:
        return False
    n = len(time_arr)
    for var in schema.REQUIRED_HOURLY:
        arr = hourly.get(var)
        if not isinstance(arr, list) or len(arr) != n or len(arr) == 0:
            return False
    units = safe.get("hourly_units")
    if not isinstance(units, dict) or "time" not in units:
        return False
    for var in schema.REQUIRED_HOURLY:
        if var not in units:
            return False
    return True


def _validate_and_scan_sample(body, secret):
    """Parses the (already decoded-byte-capped) response body as JSON.
    Returns `(validated_dict_or_None, sample_status_str,
    unknown_field_count)` -- performs NO file I/O; the caller
    (`run_request()`) does the actual write, after full classification.

    Classification precedence (v8 R1/R2, matching the approved prompt's
    exact order): the raw body was ALREADY scanned for the secret by the
    caller before this function is ever invoked (see
    `_dispatch_child_and_collect`), so nothing here can see an
    undetected secret first. Then: malformed JSON -> STRUCTURAL_FAILURE;
    a top-level JSON list -> UNSUPPORTED_TOP_LEVEL_LIST (this candidate
    only ever requests one coordinate; a list means the provider
    returned a multi-location response, out of scope, not unsafe); any
    other non-object body, or an invalid stored-field type/value ->
    STRUCTURAL_FAILURE; a secret reflected in a decoded value or the
    final serialised text -> STRUCTURAL_FAILURE (secret reflection is
    ALWAYS terminal, never merely "incomplete"); a well-formed shape
    missing the required forecast arrays/units -> SAMPLE_INCOMPLETE;
    otherwise -> VALID (with a count of harmlessly-dropped unknown
    top-level fields, never their names or values)."""
    try:
        parsed = json.loads(body.decode("utf-8"))
    except (json.JSONDecodeError, UnicodeDecodeError):
        return None, SAMPLE_STRUCTURAL_FAILURE, 0

    # R1: scan the FULL parsed structure -- including any field about to
    # be DROPPED as unknown, and regardless of top-level shape (dict,
    # list, or otherwise) -- for the secret BEFORE any classification or
    # dropping happens. This is deliberate defense in depth: the real
    # `run_request()` path already scans the raw whole-body BYTES before
    # this function is ever called (see `_dispatch_child_and_collect`),
    # but this function must independently be correct when called
    # directly/standalone too -- an unknown field's value must never
    # silently carry the secret past this point just because it is about
    # to be dropped and therefore never reaches the final allowlisted
    # dict a narrower scan would otherwise check.
    for v in _iter_leaf_strings(parsed):
        if leak_scanner.contains_secret(v, secret):
            return None, SAMPLE_STRUCTURAL_FAILURE, 0

    if isinstance(parsed, list):
        return None, SAMPLE_UNSUPPORTED_TOP_LEVEL_LIST, 0

    try:
        safe, unknown_field_count = _validate_sample_shape(parsed)
    except ValueError:
        return None, SAMPLE_STRUCTURAL_FAILURE, 0

    if not _is_complete_forecast(safe):
        return None, SAMPLE_INCOMPLETE, unknown_field_count

    serialized = json.dumps(safe, ensure_ascii=True, sort_keys=True)
    if leak_scanner.contains_secret(serialized, secret):
        return None, SAMPLE_STRUCTURAL_FAILURE, 0

    return safe, SAMPLE_VALID, unknown_field_count


def _write_unique_sample(attempt_id, validated_sample):
    """R6: writes the already-validated sample to a filename unique to
    this attempt (`forecast-sample-<attempt_id>.json`) -- never
    overwrites a different attempt's sample. Returns the path written, or
    `None` on a write failure (never raises -- a sample-write failure
    must not crash `run_request()`; it just means `sample_written=False`,
    recorded honestly in the ledger)."""
    serialized = json.dumps(validated_sample, ensure_ascii=True, sort_keys=True)
    sample_path = os.path.join(SAMPLES_DIR, f"forecast-sample-{attempt_id}.json")
    tmp = sample_path + ".tmp"
    try:
        with open(tmp, "w", encoding="utf-8") as f:
            f.write(serialized)
            f.flush()
            os.fsync(f.fileno())
        os.replace(tmp, sample_path)
        return sample_path
    except OSError:
        return None


def _iter_leaf_strings(obj):
    if isinstance(obj, str):
        yield obj
    elif isinstance(obj, dict):
        for v in obj.values():
            yield from _iter_leaf_strings(v)
    elif isinstance(obj, list):
        for v in obj:
            yield from _iter_leaf_strings(v)


# --- R6: cleanup path-safety ------------------------------------------------

def safe_recursive_delete_under_tmp(target_path):
    """Resolves `target_path` to a real absolute path and refuses to
    delete anything (returns False, deletes nothing) unless that resolved
    path is STRICTLY inside this candidate's own `tmp/` directory --
    guards against a symlink/junction escape or a computed-but-unverified
    path ever causing a recursive delete outside the intended scratch
    area. Only ever called on paths this task's own code created."""
    import shutil

    tmp_root = os.path.realpath(os.path.join(HERE, "tmp"))
    resolved = os.path.realpath(target_path)
    if resolved == tmp_root or not resolved.startswith(tmp_root + os.sep):
        return False
    shutil.rmtree(resolved, ignore_errors=False)
    return True
