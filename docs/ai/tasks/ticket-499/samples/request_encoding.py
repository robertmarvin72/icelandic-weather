#!/usr/bin/env python3
"""
#499 base endpoints -- copy of ticket-493-endpoint-acquisition/samples/
request_encoding.py (same encode_query/build_path, byte-identical),
with REQUESTS/ORDER trimmed to this round's own two authorized calls
(E1-WGS84 is retained from #493, never re-fetched; its entry is kept
here ONLY so its own encoded_request_sha256 can be cross-cited against
the prior request-manifest.json, never sent). approved-prompt-v1.md
step 3 requires the S2-WGS84 encoded URL be used verbatim from the
prior request-manifest.json, not a newly derived filter class -- the
params below are copied from that file's own decoded_params, in the
same order, and the resulting encoded_request_sha256 is checked
against the prior manifest's own recorded value before any call is
made (see samples/verify_encoding_unchanged.py).
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
        # Retained from #493 -- NEVER called this round. Kept only as
        # a cross-reference target for encoded_request_sha256.
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
ORDER = ["S2-WGS84", "ACCESS-CAPABILITIES"]  # E1 excluded from this round's own call order -- retained, not re-fetched (JA1a)
