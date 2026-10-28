"""R3 — DATEX II measurement sites and measured values: coordinate-based
(not exact-name) matching of corridor-relevant sites, plus the
measurementSiteIdentification <-> Vedurstofa station-number join R7/Jonesy
pointed out was available but unused.

Method: regex-extract each <q1:measurementSite> block (id, Icelandic name,
measurementSiteIdentification, WGS84 lat/lon) from the retained
measurementSiteTable sample, and each <q1:siteMeasurements> block (site
id, available physical quantities) from the retained measuredData sample.
Cross-reference measurementSiteIdentification against the already-retained
#450 Vedurstofa station catalog (778 rows, read-only, not modified) by
exact station-number match -- this is a numeric-ID join, not a name search,
which is the fix R3 asked for.
"""
import re
import sys
import os
sys.path.insert(0, ".")
from _shared import print_input_manifest, load_text, sample_path, sha256_of

SITES_INPUT = "datex-measurementsites.xml"
DATA_INPUT = "datex-measureddata.xml"
STATIONS_450 = os.path.join(os.path.dirname(__file__), "..", "..", "ticket-450", "samples", "vedur-stations-all-v2.json")

# Sites named in Jonesy's R3 review as examples of coordinate-matchable but
# exact-name-mismatched corridor sites, plus the corridor sites already used
# in coverage.csv. Listed here because the review named them specifically;
# this script verifies each one against the retained samples rather than
# asserting the review's numbers.
SITES_OF_INTEREST = [
    "IRCA_MP_1", "IRCA_MP_4", "IRCA_MP_38", "IRCA_MP_36", "IRCA_MP_142",
    "IRCA_MP_1181", "IRCA_MP_2190", "IRCA_MP_2191",
    "IRCA_MP_17", "IRCA_MP_3", "IRCA_MP_24", "IRCA_MP_6", "IRCA_MP_29", "IRCA_MP_53",
]


def parse_sites(text):
    sites = {}
    for m in re.finditer(r'<q1:measurementSite id="([^"]+)"[^>]*>(.*?)</q1:measurementSite>', text, re.S):
        sid, block = m.group(1), m.group(2)
        name_m = re.search(r'<value lang="is">([^<]*)</value>', block)
        ident_m = re.search(r'<q1:measurementSiteIdentification>([^<]*)</q1:measurementSiteIdentification>', block)
        # The XML serializer assigns a different auto-generated namespace
        # prefix (q48, q112, ...) to the locationReferencing elements in
        # different site records -- confirmed by inspecting raw blocks for
        # several sites. Match any prefix on latitude/longitude rather than
        # hardcoding one, or most sites' coordinates are silently missed.
        lat_m = re.search(r'<\w+:latitude>([^<]+)</\w+:latitude>', block)
        lon_m = re.search(r'<\w+:longitude>([^<]+)</\w+:longitude>', block)
        sites[sid] = {
            "name": name_m.group(1) if name_m else None,
            "identification": ident_m.group(1) if ident_m and ident_m.group(1).strip() else None,
            "lat": float(lat_m.group(1)) if lat_m else None,
            "lon": float(lon_m.group(1)) if lon_m else None,
        }
    return sites


def parse_measured(text):
    out = {}
    for m in re.finditer(r'<q1:measurementSiteReference id="([^"]+)"[^/]*/>(.*?)(?=<q1:siteMeasurements>|$)', text, re.S):
        sid, block = m.group(1), m.group(2)
        vals = {}
        for tag in ["windSpeed", "maximumWindSpeed", "airTemperature", "roadSurfaceTemperature",
                    "dewPointTemperature"]:
            mm = re.search(rf'<{tag}[^>]*><temperature>([^<]+)</temperature>', block) \
                if "Temperature" in tag else \
                re.search(rf'<{tag}[^>]*><windSpeed>([^<]+)</windSpeed>', block)
            if mm:
                vals[tag] = float(mm.group(1))
        hum = re.search(r'<relativeHumidity[^>]*><percentage>([^<]+)</percentage>', block)
        if hum:
            vals["relativeHumidity"] = float(hum.group(1))
        out[sid] = vals
    return out


def main():
    print_input_manifest([SITES_INPUT, "datex-measurementsites-headers.txt",
                           DATA_INPUT, "datex-measureddata-headers.txt"])
    print(f"external read-only reference (not modified, already retained by #450): "
          f"vedur-stations-all-v2.json  sha256={sha256_of(STATIONS_450)}")
    print()

    sites_text = load_text(SITES_INPUT)
    data_text = load_text(DATA_INPUT)
    sites = parse_sites(sites_text)
    measured = parse_measured(data_text)

    print(f"measurementSite records parsed: {len(sites)}")
    print(f"siteMeasurements blocks parsed: {len(measured)}")
    with_ident = {k: v for k, v in sites.items() if v["identification"]}
    print(f"sites with a non-empty measurementSiteIdentification: {len(with_ident)}")
    print()

    import json
    with open(STATIONS_450, encoding="utf-8") as f:
        stations = json.load(f)
    station_numbers = {str(r["station"]) for r in stations if r.get("station") is not None}
    print(f"#450 Vedurstofa station catalog: {len(stations)} rows, "
          f"{len(station_numbers)} distinct station numbers")

    matched = {sid: v for sid, v in with_ident.items() if v["identification"] in station_numbers}
    print(f"DATEX sites whose measurementSiteIdentification matches a #450 station number: "
          f"{len(matched)} of {len(with_ident)} identified sites")
    print()

    print("Sites of interest (named in Jonesy's R3 review) -- verified directly from the "
          "retained samples, coordinate- and ID-based, not name search:")
    for sid in SITES_OF_INTEREST:
        s = sites.get(sid)
        if not s:
            print(f"  {sid}: NOT FOUND in retained measurementSiteTable sample")
            continue
        m = measured.get(sid, {})
        station_match = "yes" if s["identification"] in station_numbers else (
            "no (identification empty)" if not s["identification"] else "no (not in #450 catalog)")
        print(f"  {sid}  name={s['name']!r}  lat={s['lat']}  lon={s['lon']}  "
              f"measurementSiteIdentification={s['identification']}  "
              f"matches #450 station number: {station_match}")
        if m:
            print(f"      measured values in retained sample: {m}")
        else:
            print(f"      measured values in retained sample: NONE (no siteMeasurements block for this id)")
    print()
    print("NOTE: a site having measured wind/temperature values in this retained sample does "
          "not by itself establish representativeness for a specific checkpoint's road "
          "conditions -- that remains a product judgement, not computed here.")


if __name__ == "__main__":
    main()
