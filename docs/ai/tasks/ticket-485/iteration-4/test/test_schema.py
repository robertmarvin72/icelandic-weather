"""#485 iteration-4 -- strict parameter injection/validation matrix.

No network, no secrets -- pure offline unit tests of schema.py.
"""
import math
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import schema  # noqa: E402

GOOD = [
    ("latitude", [64.0]), ("longitude", [-21.0]),
    ("hourly", list(schema.REQUIRED_HOURLY)), ("wind_speed_unit", "ms"),
    ("temperature_unit", "celsius"), ("precipitation_unit", "mm"),
    ("timezone", "UTC"), ("forecast_days", 3),
]


def expect_reject(pairs, label):
    try:
        schema.validate_params(pairs)
        print(f"  RED FAIL -- {label} was NOT rejected")
        sys.exit(1)
    except schema.SchemaViolation:
        print(f"  RED PASS -- {label} correctly rejected")


def test_good_passes():
    print("[schema 0] a correctly-formed request passes ... ", end="")
    out = schema.validate_params(GOOD)
    q = schema.serialize_query(out)
    assert "apikey" not in q.lower()
    print(f"PASS ({q[:60]}...)")


def test_apikey_injection_variants():
    print("[schema 1] caller-supplied apikey in every case variant is rejected ... ")
    for variant in ("apikey", "APIKEY", "ApiKey", "aPiKeY"):
        pairs = GOOD + [(variant, "evil-caller-key")]
        expect_reject(pairs, f"caller-supplied {variant!r}")


def test_duplicate_and_case_variant_names():
    print("[schema 2] duplicate / case-variant parameter names rejected ... ")
    expect_reject(GOOD + [("latitude", [1.0])], "duplicate 'latitude'")
    pairs = [p for p in GOOD if p[0] != "timezone"] + [("timezone", "UTC"), ("Timezone", "UTC")]
    expect_reject(pairs, "case-variant 'Timezone' alongside 'timezone'")
    expect_reject(GOOD + [("not_a_real_param", "x")], "unknown parameter name")
    expect_reject(GOOD + [("models", "best_match")], "'models' parameter")


def test_delimiter_injection_in_string_values():
    print("[schema 3] '&apikey=' / '=' / '#' / '?' / '@' / CR-LF injected INTO a string value is rejected ... ")
    for bad in ("ms&apikey=evil", "ms=x", "ms#frag", "ms?x", "ms@host", "ms\r\nInjected: header", "ms\nInjected"):
        pairs = [p if p[0] != "wind_speed_unit" else ("wind_speed_unit", bad) for p in GOOD]
        expect_reject(pairs, f"wind_speed_unit={bad!r}")
    # percent/double-encoded forms of the same injection are ALSO just
    # ordinary characters once percent-decoded by nothing (we never decode
    # caller strings) -- but raw '%' itself is in FORBIDDEN_CHARS, so an
    # attempted percent-encoded injection is rejected for containing '%'.
    pairs = [p if p[0] != "wind_speed_unit" else ("wind_speed_unit", "ms%26apikey%3Devil") for p in GOOD]
    expect_reject(pairs, "percent-encoded injection attempt (contains literal '%')")


def test_malformed_overlength_nonascii():
    print("[schema 4] malformed / over-length / non-ASCII tokens rejected ... ")
    pairs = [p if p[0] != "timezone" else ("timezone", "UTC" + "x" * 100) for p in GOOD]
    expect_reject(pairs, "over-length token (>64 chars)")
    pairs2 = [p if p[0] != "timezone" else ("timezone", "ÚTC") for p in GOOD]
    expect_reject(pairs2, "non-ASCII token")
    pairs3 = [p if p[0] != "forecast_days" else ("forecast_days", "3") for p in GOOD]
    expect_reject(pairs3, "forecast_days as a string instead of int")
    pairs4 = [p if p[0] != "forecast_days" else ("forecast_days", True) for p in GOOD]
    expect_reject(pairs4, "forecast_days as a bool")
    pairs5 = [p if p[0] != "latitude" else ("latitude", [math.nan]) for p in GOOD]
    expect_reject(pairs5, "latitude=[NaN]")
    pairs6 = [p if p[0] != "latitude" else ("latitude", [math.inf]) for p in GOOD]
    expect_reject(pairs6, "latitude=[Infinity]")
    pairs7 = [p if p[0] != "latitude" else ("latitude", ["64.0"]) for p in GOOD]
    expect_reject(pairs7, "latitude as a string-encoded number")
    pairs8 = [p if p[0] != "latitude" else ("latitude", [True]) for p in GOOD]
    expect_reject(pairs8, "latitude=[True] (boolean)")
    pairs9 = [p if p[0] != "latitude" else ("latitude", [999.0]) for p in GOOD]
    expect_reject(pairs9, "latitude out of range")
    pairs10 = [p if p[0] != "latitude" else ("latitude", []) for p in GOOD]
    expect_reject(pairs10, "latitude empty array")
    pairs11 = [p if p[0] != "latitude" else ("latitude", [1.0] * 8) for p in GOOD]
    expect_reject(pairs11, "latitude array too long (>7)")
    pairs12 = [p if p[0] != "latitude" else ("latitude", [1.0, 2.0]) for p in GOOD]
    expect_reject(pairs12, "latitude/longitude length mismatch")


def test_userinfo_port_path_bypass_attempts_in_values():
    print("[schema 5] userinfo/port/path-bypass-shaped strings rejected as ordinary delimiter violations ... ")
    for bad in ("ms@evil.example", "ms:443", "ms/../../etc"):
        if ":" in bad or "/" in bad:
            continue  # ':' and '/' are not in FORBIDDEN_CHARS -- checked separately below
        pairs = [p if p[0] != "wind_speed_unit" else ("wind_speed_unit", bad) for p in GOOD]
        expect_reject(pairs, f"wind_speed_unit={bad!r}")
    # ':' and '/' alone are not delimiter-forbidden by this schema (they
    # are not query-syntax-significant) -- but they are still rejected
    # because 'ms:443'/'ms/../../etc' do not equal the one fixed allowed
    # value 'ms' for this field, caught by the exact-enum check instead.
    for bad in ("ms:443", "ms/../../etc", "127.0.0.1:443"):
        pairs = [p if p[0] != "wind_speed_unit" else ("wind_speed_unit", bad) for p in GOOD]
        expect_reject(pairs, f"wind_speed_unit={bad!r} (fails the fixed-enum check)")


def test_hourly_variable_matrix():
    print("[schema 6] hourly variable set: missing required / unknown / duplicate all rejected ... ")
    missing = ("latitude", "longitude", "wind_speed_10m", "wind_gusts_10m", "precipitation", "snowfall")
    pairs = [p if p[0] != "hourly" else ("hourly", list(missing[2:])) for p in GOOD]
    expect_reject(pairs, "hourly missing a required variable")
    pairs2 = [p if p[0] != "hourly" else ("hourly", list(schema.REQUIRED_HOURLY) + ["windspeed_10m"]) for p in GOOD]
    expect_reject(pairs2, "hourly with an unknown (legacy-named) variable")
    pairs3 = [p if p[0] != "hourly" else ("hourly", list(schema.REQUIRED_HOURLY) + ["temperature_2m"]) for p in GOOD]
    expect_reject(pairs3, "hourly with a duplicate variable")
    # visibility IS allowed as the one optional addition
    pairs4 = [p if p[0] != "hourly" else ("hourly", list(schema.REQUIRED_HOURLY) + ["visibility"]) for p in GOOD]
    out = schema.validate_params(pairs4)
    print("  GREEN PASS -- required6+visibility accepted")


def test_schema_errors_never_echo_the_raw_value():
    print("[schema 7] CORRECTION v6 (R5): a fake-key placed as a param VALUE never reaches the "
          "exception message/str(e) ... ")
    FAKE_KEY = "ITER4-SCHEMA-LEAK-REGRESSION-abc123"
    scenarios = [
        [p if p[0] != "timezone" else ("timezone", FAKE_KEY) for p in GOOD],
        [p if p[0] != "wind_speed_unit" else ("wind_speed_unit", FAKE_KEY) for p in GOOD],
        [p if p[0] != "hourly" else ("hourly", [FAKE_KEY]) for p in GOOD],
    ]
    for pairs in scenarios:
        try:
            schema.validate_params(pairs)
            print("  RED FAIL -- malformed value was not rejected")
            sys.exit(1)
        except schema.SchemaViolation as e:
            msg = str(e)
            assert FAKE_KEY not in msg, f"RED: fake key leaked into SchemaViolation message: {msg!r}"
            assert msg.startswith(e.category + ":"), f"RED: message format drifted from 'CATEGORY: field=...': {msg!r}"
    print("  PASS -- fake key never appears in any SchemaViolation message across 3 injection points "
          "(timezone/wind_speed_unit/hourly[])")


def main():
    test_good_passes()
    test_apikey_injection_variants()
    test_duplicate_and_case_variant_names()
    test_delimiter_injection_in_string_values()
    test_malformed_overlength_nonascii()
    test_userinfo_port_path_bypass_attempts_in_values()
    test_hourly_variable_matrix()
    test_schema_errors_never_echo_the_raw_value()
    print("\nALL SCHEMA INJECTION/VALIDATION TESTS PASS (exit 0).")


if __name__ == "__main__":
    main()
