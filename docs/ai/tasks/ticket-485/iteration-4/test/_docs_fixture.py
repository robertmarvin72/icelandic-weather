"""#485 iteration-4 correction v8 (R1/R2) -- shared, realistic synthetic
fixture used by every sample-success/e2e test, replacing the old minimal
`{}`/single-field fixtures Jonesy's Round-3 review found could not catch
R1/R2.

Built from the STRUCTURE of the retained `../../iteration-3/samples/
openmeteo-docs.html` JSON response example (SHA256 7c63cb41859f759065a9
ac85f919588d16ccbba82d34c483587eec6606e32566; no live docs fetch this
round) -- that example (its own lines ~179-194) reads:

    {"latitude": 52.52, "longitude": 13.419, "elevation": 44.812,
     "generationtime_ms": 2.2119, "utc_offset_seconds": 0,
     "timezone": "Europe/Berlin", "timezone_abbreviation": "CEST",
     "hourly": {"time": [...], "temperature_2m": [...]},
     "hourly_units": {"temperature_2m": "°C"}}

and its field table (lines ~196-199) documents `utc_offset_seconds`
(Integer), `timezone`/`timezone_abbreviation` (String) as normal fields
of every forecast response. This fixture includes ALL of those
documented top-level fields, PLUS this candidate's own six required
hourly variables (`schema.REQUIRED_HOURLY`) and the optional
`visibility`, for 72 hourly points (3 days) -- not the single
`temperature_2m` variable the docs example itself shows, since this
candidate's own schema requires more than that one variable.

LABELLED EXPLICITLY, per the approved prompt: this is a SYNTHETIC
EXPANSION built to match the DOCUMENTED STRUCTURE, never archived or
live API response data. It proves this candidate's sample-validation
logic tolerates the documented shape -- it says NOTHING about real
provider behaviour, actual value ranges, or real-world data quality
(still UNKNOWN / NOT TESTED, no real request ever made by this
candidate). Single location only: this candidate always requests
exactly one coordinate pair, so this fixture is never a multi-point
response; `build_list_response()` below covers the explicitly-documented
multi-coordinate list shape separately, for the one test that needs it.
"""
import json

POINT_COUNT = 72  # 72 hourly points = 3 days -- stated explicitly, not a 7-day/forecast_days claim

_REQUIRED_HOURLY_UNITS = {
    "temperature_2m": "°C", "wind_speed_10m": "m/s", "wind_gusts_10m": "m/s",
    "precipitation": "mm", "snowfall": "cm", "weather_code": "wmo code",
}
_OPTIONAL_HOURLY_UNITS = {"visibility": "m"}


def _hourly_time_strings(n=POINT_COUNT):
    """Deterministic, strictly increasing, documented-format
    ("YYYY-MM-DDTHH:MM") synthetic timestamps starting at the docs
    example's own first value, 2022-07-01T00:00."""
    out = []
    for h in range(n):
        day = 1 + h // 24
        hour = h % 24
        out.append(f"2022-07-{day:02d}T{hour:02d}:00")
    return out


def build_documented_sample_payload(point_count=POINT_COUNT, include_optional_visibility=True):
    """Returns the plain dict (not yet encoded) of a realistic,
    structurally complete sample -- every documented top-level field,
    all six required hourly arrays (+ optional `visibility` by default),
    matching `hourly_units`. A plausible Reykjavik-area
    location/elevation, labelled synthetic."""
    times = _hourly_time_strings(point_count)
    hourly = {
        "time": times,
        "temperature_2m": [round(5 + 3 * ((h % 12) / 12), 1) for h in range(point_count)],
        "wind_speed_10m": [round(2 + (h % 6) * 0.6, 1) for h in range(point_count)],
        "wind_gusts_10m": [round(4 + (h % 6) * 0.9, 1) for h in range(point_count)],
        "precipitation": [0.0 if h % 4 else 0.2 for h in range(point_count)],
        "snowfall": [0.0 for _ in range(point_count)],
        "weather_code": [h % 4 for h in range(point_count)],
    }
    hourly_units = {"time": "iso8601"}
    hourly_units.update(_REQUIRED_HOURLY_UNITS)
    if include_optional_visibility:
        hourly["visibility"] = [10000 for _ in range(point_count)]
        hourly_units.update(_OPTIONAL_HOURLY_UNITS)
    return {
        "latitude": 64.1265, "longitude": -21.8174, "elevation": 20.0,
        "generationtime_ms": 1.2345,
        "utc_offset_seconds": 0,
        "timezone": "GMT",
        "timezone_abbreviation": "GMT",
        "hourly_units": hourly_units,
        "hourly": hourly,
    }


def build_documented_sample_body(**kwargs):
    """The same payload, JSON-encoded to bytes (what a real child_worker
    response body would be)."""
    return json.dumps(build_documented_sample_payload(**kwargs)).encode("utf-8")


def build_documented_sample_with_extra_field(extra_key="experimental_field", extra_value="additive-test-value"):
    """The documented payload plus ONE additional, unrecognised top-level
    field -- for the 'additive unknown field is dropped, not unsafe' test."""
    payload = build_documented_sample_payload()
    payload[extra_key] = extra_value
    return json.dumps(payload).encode("utf-8")


def build_list_response():
    """Wraps one documented-shape sample in a single-element top-level
    JSON list -- the documented 'multiple coordinates' response shape.
    This single-location candidate must refuse this (non-terminally),
    since it never requests more than one coordinate."""
    single = build_documented_sample_payload()
    return json.dumps([single]).encode("utf-8")
