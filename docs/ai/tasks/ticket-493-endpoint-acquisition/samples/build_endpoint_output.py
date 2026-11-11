#!/usr/bin/env python3
"""
#493 endpoint-acquisition -- builds endpoint-wgs84.json from the raw
E1-WGS84 response ONLY (S2-WGS84 was never called, per EA4(ii)'s own
STOP; those entries are null with a stated reason). Publishes ONLY the
20 expected E1 features -- the 12 extra features (IDFERILL 1985/2899/
19524, VEGNR 931/941/95) found in the raw response are EXCLUDED from
publication per EA4(ii), recorded only as a finding elsewhere. z is
excluded from every published value (EA5a). All four tiers published
per role, each with its own tier_consistency_flag (EA6). No network.
"""
import hashlib
import json
from pathlib import Path

TASK_DIR = Path(__file__).resolve().parent.parent
REPO_ROOT = TASK_DIR.parent.parent.parent.parent

E1_RAW_PATH = TASK_DIR / "samples/raw-E1-WGS84.json"
NATIVE_REF_PATH = TASK_DIR / "samples/rp1_native_reference.json"
LEDGER_PATH = TASK_DIR / "samples/exchange-ledger.jsonl"

ROLES = [
    {"role": "END", "place": "Egilsstaðir (E1)", "idferill": 2345, "native_file_label": "wfs-vegnr1-all.json (#483)", "endpoint": "end"},
    {"role": "START", "place": "Egilsstaðir (E1)", "idferill": 2344, "native_file_label": "wfs93-raw.json (phase2)", "endpoint": "start"},
]


def main():
    raw_bytes = E1_RAW_PATH.read_bytes()
    raw_sha = hashlib.sha256(raw_bytes).hexdigest()
    doc = json.loads(raw_bytes)
    by_key = {}
    for f in doc["features"]:
        p = f["properties"]
        by_key[(p["IDFERILL"], p["NAKVAEMNIFERLIS"])] = f

    with open(LEDGER_PATH, encoding="utf-8") as f:
        ledger_lines = f.readlines()
    e1_ledger_line_no = next(i + 1 for i, line in enumerate(ledger_lines) if json.loads(line).get("request_id") == "E1-WGS84")

    native_ref = json.loads(NATIVE_REF_PATH.read_bytes())
    native_by_key = {(r["idferill"], r["nakvaemniferlis"]): r for r in native_ref["e1_features"]}

    entries = []
    for role_spec in ROLES:
        idferill = role_spec["idferill"]
        tier_values = {}
        for tier in (-1, 0, 1, 2):
            key = (idferill, tier)
            feat = by_key.get(key)
            if feat is None:
                tier_values[tier] = None
                continue
            coords = feat["geometry"]["coordinates"]
            point = coords[-1] if role_spec["endpoint"] == "end" else coords[0]
            lon, lat = point[0], point[1]  # z (point[2]) excluded, EA5a
            tier_values[tier] = {"longitude": lon, "latitude": lat, "objectid": feat["properties"]["OBJECTID"], "id": feat.get("id"), "dagsferils": feat["properties"].get("DAGSFERILS")}

        present = [v for v in tier_values.values() if v is not None]
        consistent = len({(round(v["longitude"], 10), round(v["latitude"], 10)) for v in present}) == 1 if present else False

        native_tier_minus1 = native_by_key.get((idferill, -1))

        for tier in (-1, 0, 1, 2):
            v = tier_values[tier]
            entries.append({
                "role": role_spec["role"], "place": role_spec["place"], "idferill": idferill,
                "nakvaemniferlis": tier,
                "objectid": v["objectid"] if v else None, "id": v["id"] if v else None,
                "latitude": v["latitude"] if v else None, "longitude": v["longitude"] if v else None,
                "tier_consistency_flag": consistent if v else None,
                "null_reason": None if v else "feature not present in raw response for this (idferill, tier)",
                "native_reference": {
                    "file_label": role_spec["native_file_label"],
                    "idferill": idferill, "nakvaemniferlis": -1,
                    "native_xy": native_tier_minus1["first_xy" if role_spec["endpoint"] == "start" else "last_xy"] if native_tier_minus1 else None,
                    "note": "native reference is the retained tier -1 vertex (finest retained precision); the WGS84 value above is the server's own answer for this (idferill, tier) pair, not reprojected from this native value.",
                },
                "raw_response_sha256": raw_sha, "ledger_line": e1_ledger_line_no, "dagsferils": v["dagsferils"] if v else None,
            })

    s2_note = "S2-WGS84 was never called this run: the E1-WGS84 response deviated (EA4(ii): 12 extra features beyond the expected set of 20, from IDFERILL 1985/2899/19524 on VEGNR 931/941/95 sharing IDBUTUR 911040037), which per the approved prompt's own documented choice stops all further calls for this run. No S2 value can be published; this is null, not a failed pairing."
    for role_spec in [{"role": "END", "idferill": 2894}, {"role": "START", "idferill": 2892}]:
        for tier in (-1, 0, 1, 2):
            entries.append({
                "role": role_spec["role"], "place": "Seyðisfjörður (S2)", "idferill": role_spec["idferill"], "nakvaemniferlis": tier,
                "objectid": None, "id": None, "latitude": None, "longitude": None, "tier_consistency_flag": None,
                "null_reason": s2_note, "native_reference": None, "raw_response_sha256": None, "ledger_line": None, "dagsferils": None,
            })

    out = {
        "note": "E1 values are produced by the server; pairing here is a construction/consistency check against retained native data, not an independent proof of the WGS84 values themselves (EA5d) -- reprojection is prohibited. z is excluded from every value above (EA5a). All four tiers are published per role, each carrying its own tier_consistency_flag (EA6).",
        "entries": entries,
    }
    out_path = TASK_DIR / "endpoint-wgs84.json"
    with open(out_path, "w", encoding="utf-8", newline="\n") as f:
        json.dump(out, f, ensure_ascii=False, indent=1)
        f.write("\n")
    print(f"wrote {out_path.relative_to(REPO_ROOT).as_posix()} with {len(entries)} entries")
    for e in entries:
        if e["latitude"] is not None:
            print(" ", e["role"], e["idferill"], e["nakvaemniferlis"], e["latitude"], e["longitude"], "consistent=", e["tier_consistency_flag"])


if __name__ == "__main__":
    main()
