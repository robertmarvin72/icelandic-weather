"""#485 iteration-4 -- strict forecast-input schema validation. CORRECTION
v6 (R5): every rejection message now carries a FIXED category string plus
the allowlisted FIELD NAME only -- never the caller-supplied raw value,
never `repr(e)`/traceback text. v5's `_reject()` embedded the raw value
in every message (e.g. "latitude: value {v} out of range"); if a caller
ever (even by test-harness accident) passed the secret as a param value,
that value would have been echoed straight into the exception text and
from there into any log/print of `str(e)`. Fixed structurally: `_reject`
now only ever accepts a fixed category constant and a field name.

Runs BEFORE any socket or ledger attempt. Accepts a list of (name, value)
PAIRS, not a dict -- a dict silently collapses duplicate keys, which is
exactly the kind of injection this schema must catch (e.g. a caller trying
to smuggle a second `hourly` or an `apikey` alongside the real params).
"""
import math

CANONICAL_ORDER = [
    "latitude", "longitude", "hourly", "wind_speed_unit",
    "temperature_unit", "precipitation_unit", "timezone", "forecast_days",
]
REQUIRED_HOURLY = ["temperature_2m", "wind_speed_10m", "wind_gusts_10m",
                   "precipitation", "snowfall", "weather_code"]
OPTIONAL_HOURLY = "visibility"
ALLOWED_HOURLY = set(REQUIRED_HOURLY) | {OPTIONAL_HOURLY}

TOKEN_MAX_LEN = 64
FORBIDDEN_CHARS = set("&=#%?@") | {"\r", "\n"}

# Fixed categories only -- never a raw value, never a caller-controlled string.
CAT_NON_STRING_NAME = "NON_STRING_PARAMETER_NAME"
CAT_CALLER_APIKEY = "CALLER_SUPPLIED_APIKEY_REJECTED"
CAT_FORBIDDEN_NAME = "FORBIDDEN_PARAMETER_NAME"
CAT_DUPLICATE_NAME = "DUPLICATE_PARAMETER_NAME"
CAT_CASE_VARIANT = "CASE_VARIANT_DUPLICATE_NAME"
CAT_UNKNOWN_NAME = "UNKNOWN_PARAMETER_NAME"
CAT_MISSING_PARAM = "MISSING_REQUIRED_PARAMETER"
CAT_WRONG_TYPE = "WRONG_TYPE"
CAT_LENGTH_OUT_OF_BOUNDS = "LENGTH_OUT_OF_BOUNDS"
CAT_LENGTH_MISMATCH = "LENGTH_MISMATCH"
CAT_BOOLEAN_NUMERIC = "BOOLEAN_NOT_ACCEPTABLE_NUMERIC"
CAT_STRING_NUMERIC = "STRING_ENCODED_NUMBER_NOT_ACCEPTABLE"
CAT_NOT_A_NUMBER = "NOT_A_REAL_NUMBER"
CAT_NAN_INF = "NAN_OR_INFINITY_NOT_ACCEPTABLE"
CAT_OUT_OF_RANGE = "VALUE_OUT_OF_RANGE"
CAT_TOKEN_LEN = "TOKEN_LENGTH_OUT_OF_BOUNDS"
CAT_NON_ASCII = "NON_ASCII_TOKEN"
CAT_FORBIDDEN_CHAR = "FORBIDDEN_CHARACTER_IN_TOKEN"
CAT_INVALID_ENUM = "INVALID_ENUM_VALUE"
CAT_DUPLICATE_HOURLY = "DUPLICATE_HOURLY_VARIABLE"
CAT_MISSING_HOURLY = "MISSING_REQUIRED_HOURLY_VARIABLE"
CAT_UNEXPECTED_HOURLY = "UNEXPECTED_HOURLY_VARIABLE"
CAT_FIXED_ENUM_MISMATCH = "FIXED_ENUM_VALUE_MISMATCH"


class SchemaViolation(Exception):
    """`str(this)` is always exactly `"{category}: field={field}"` -- a
    fixed category constant and an allowlisted field name, NEVER the
    caller's raw value, NEVER a wrapped lower-level exception's own
    message/repr/traceback."""

    def __init__(self, category, field):
        self.category = category
        self.field = field
        super().__init__(f"{category}: field={field}")


def _reject(category, field):
    raise SchemaViolation(category, field)


def _check_token_text(name, value):
    if not isinstance(value, str):
        _reject(CAT_WRONG_TYPE, name)
    if len(value) == 0 or len(value) > TOKEN_MAX_LEN:
        _reject(CAT_TOKEN_LEN, name)
    try:
        value.encode("ascii")
    except UnicodeEncodeError:
        _reject(CAT_NON_ASCII, name)
    if any(ch in FORBIDDEN_CHARS for ch in value):
        _reject(CAT_FORBIDDEN_CHAR, name)


def _check_finite_number(name, value):
    if isinstance(value, bool):
        _reject(CAT_BOOLEAN_NUMERIC, name)
    if isinstance(value, str):
        _reject(CAT_STRING_NUMERIC, name)
    if not isinstance(value, (int, float)):
        _reject(CAT_NOT_A_NUMBER, name)
    if isinstance(value, float) and (math.isnan(value) or math.isinf(value)):
        _reject(CAT_NAN_INF, name)


def validate_params(pairs):
    """`pairs`: list of (name, value) tuples, exactly as the caller supplied
    them (no pre-deduplication). Returns a normalised, ordered dict of
    validated values on success. Raises SchemaViolation (category+field
    only, never the raw value) on ANY violation. Never partially accepts."""
    seen_names = set()
    by_name = {}
    for name, value in pairs:
        if not isinstance(name, str):
            _reject(CAT_NON_STRING_NAME, "<non-string-name>")
        lname = name.lower()
        if lname == "apikey":
            _reject(CAT_CALLER_APIKEY, "apikey")
        if lname == "models":
            _reject(CAT_FORBIDDEN_NAME, "models")
        if name in seen_names:
            _reject(CAT_DUPLICATE_NAME, name)
        if any(n.lower() == lname for n in seen_names):
            _reject(CAT_CASE_VARIANT, name)
        if name not in CANONICAL_ORDER:
            _reject(CAT_UNKNOWN_NAME, name)
        seen_names.add(name)
        by_name[name] = value

    missing = [n for n in CANONICAL_ORDER if n not in by_name]
    if missing:
        _reject(CAT_MISSING_PARAM, missing[0])

    out = {}
    for axis, lo, hi in (("latitude", -90.0, 90.0), ("longitude", -180.0, 180.0)):
        arr = by_name[axis]
        if not isinstance(arr, (list, tuple)):
            _reject(CAT_WRONG_TYPE, axis)
        if not (1 <= len(arr) <= 7):
            _reject(CAT_LENGTH_OUT_OF_BOUNDS, axis)
        for v in arr:
            _check_finite_number(axis, v)
            if not (lo <= v <= hi):
                _reject(CAT_OUT_OF_RANGE, axis)
        out[axis] = list(arr)
    if len(out["latitude"]) != len(out["longitude"]):
        _reject(CAT_LENGTH_MISMATCH, "latitude/longitude")

    hourly = by_name["hourly"]
    if not isinstance(hourly, (list, tuple)):
        _reject(CAT_WRONG_TYPE, "hourly")
    for v in hourly:
        _check_token_text("hourly[]", v)
        if v not in ALLOWED_HOURLY:
            _reject(CAT_INVALID_ENUM, "hourly[]")
    if len(set(hourly)) != len(hourly):
        _reject(CAT_DUPLICATE_HOURLY, "hourly")
    hourly_set = set(hourly)
    if not set(REQUIRED_HOURLY).issubset(hourly_set):
        _reject(CAT_MISSING_HOURLY, "hourly")
    if hourly_set - set(REQUIRED_HOURLY) - {OPTIONAL_HOURLY}:
        _reject(CAT_UNEXPECTED_HOURLY, "hourly")
    out["hourly"] = list(hourly)

    fixed = {"wind_speed_unit": "ms", "temperature_unit": "celsius",
             "precipitation_unit": "mm", "timezone": "UTC"}
    for name, expected in fixed.items():
        v = by_name[name]
        _check_token_text(name, v)
        if v != expected:
            _reject(CAT_FIXED_ENUM_MISMATCH, name)
        out[name] = v

    fd = by_name["forecast_days"]
    if isinstance(fd, bool) or not isinstance(fd, int):
        _reject(CAT_WRONG_TYPE, "forecast_days")
    if fd != 3:
        _reject(CAT_FIXED_ENUM_MISMATCH, "forecast_days")
    out["forecast_days"] = fd

    return out


def serialize_query(validated):
    """Builds the query string from an ALREADY-validated dict, in the
    frozen canonical order, using only `,`/numeric punctuation generated by
    this function itself -- user-controlled strings (already ASCII/
    delimiter-free, checked above) are placed verbatim but can never inject
    query syntax because `&`/`=`/etc. were already rejected by the schema.
    Never includes `apikey` -- that is appended by the pipeline afterward,
    never by this function."""
    parts = [
        "latitude=" + ",".join(_fmt_num(v) for v in validated["latitude"]),
        "longitude=" + ",".join(_fmt_num(v) for v in validated["longitude"]),
        "hourly=" + ",".join(validated["hourly"]),
        "wind_speed_unit=" + validated["wind_speed_unit"],
        "temperature_unit=" + validated["temperature_unit"],
        "precipitation_unit=" + validated["precipitation_unit"],
        "timezone=" + validated["timezone"],
        "forecast_days=" + str(validated["forecast_days"]),
    ]
    return "&".join(parts)


def _fmt_num(v):
    return repr(float(v))
