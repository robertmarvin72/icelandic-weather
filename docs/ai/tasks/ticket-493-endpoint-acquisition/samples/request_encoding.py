#!/usr/bin/env python3
"""
#493 endpoint-acquisition -- EA3. The ONE named, pre-registered encode
function used to turn the approved prompt's own "un-URL-encoded view"
into a sendable path+query. http.client rejects a literal space in a
path (sandbox-confirmed: InvalidURL) and the retained curl-era ledgers
show un-encoded CQL, so this function exists specifically to close
that gap without changing bounded_fetch.py itself. Imported by both
samples/build_manifest.py (to produce request-manifest.json BEFORE any
call) and samples/live_driver.py (to actually send the call) -- the
same function, so manifest and live request can never silently drift.
"""
import urllib.parse


def encode_query(ordered_params):
    """ordered_params: list of (key, value) tuples, in the exact order
    they should appear in the query string. Returns the encoded query
    string (no leading '?'). Uses urllib.parse.quote (space -> %20,
    not '+'), matching OGC/WFS convention over form-encoding."""
    return urllib.parse.urlencode(ordered_params, quote_via=urllib.parse.quote)


def build_path(path, ordered_params):
    """Returns the full encoded path+query, e.g. '/geoserver/gis/ows?...'."""
    query = encode_query(ordered_params)
    return f"{path}?{query}" if query else path


REQUESTS = {
    "E1-WGS84": {
        "path": "/geoserver/gis/ows",
        "params": [
            ("service", "WFS"), ("version", "1.0.0"), ("request", "GetFeature"),
            ("typeName", "gis:faerdferlar2017_1"), ("CQL_FILTER", "IDBUTUR IN (911040037)"),
            ("srsName", "EPSG:4326"), ("outputFormat", "application/json"), ("maxFeatures", "300"),
        ],
        "per_body_cap_bytes": 262144,
    },
    "S2-WGS84": {
        "path": "/geoserver/gis/ows",
        "params": [
            ("service", "WFS"), ("version", "1.0.0"), ("request", "GetFeature"),
            ("typeName", "gis:faerdferlar2017_1"), ("CQL_FILTER", "IDBUTUR IN (911170037)"),
            ("srsName", "EPSG:4326"), ("outputFormat", "application/json"), ("maxFeatures", "300"),
        ],
        "per_body_cap_bytes": 262144,
    },
    "ACCESS-CAPABILITIES": {
        "path": "/geoserver/gis/ows",
        "params": [("service", "WFS"), ("version", "1.0.0"), ("request", "GetCapabilities")],
        "per_body_cap_bytes": 4194304,
    },
}

HOST = "gagnaveita.vegagerdin.is"
ORDER = ["E1-WGS84", "S2-WGS84", "ACCESS-CAPABILITIES"]
