#!/usr/bin/env python3
"""Exchange #3 (pre-sample-plan.md): VEGNR=93 WFS GetFeature, EPSG:3057."""
import bounded_fetch as bf

URL = (
    "https://gagnaveita.vegagerdin.is/geoserver/gis/ows"
    "?service=WFS&version=1.0.0&request=GetFeature"
    "&typeName=gis:faerdferlar2017_1"
    "&CQL_FILTER=VEGNR='93'"
    "&srsName=EPSG:3057"
    "&outputFormat=application/json"
    "&maxFeatures=1000"
)

if __name__ == "__main__":
    e = bf.bounded_fetch("GET", URL, headers={"Accept": "application/json"})
    bf.append_ledger("exchange-ledger.jsonl", e)
    body = e["_body_bytes"]
    print("status:", e["status"], "bytes:", e["bytes_received"], "truncated:", e["truncated"], "error:", e["error"])
    if body:
        with open("wfs93-raw.json", "wb") as f:
            f.write(body)
        print("wrote wfs93-raw.json")
