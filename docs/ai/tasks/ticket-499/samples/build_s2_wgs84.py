#!/usr/bin/env python3
"""
#499 base endpoints -- pairs the real S2-WGS84 response against the
retained native reference (rp1_native_reference.json, byte-identical
copy of #493's own file) per EA5(a)-(d)/EA6 (pairing-rules.md, SHA
a83a8ff28b9b438d9d0810f6f2b2135404433ca9193c06d2934667e1a90b8b60,
reused verbatim -- not reproduced or redefined here). Publishes all 4
NAKVAEMNIFERLIS tiers for both S2 roles (END=2894, START=2892), each
with its own tier_consistency_flag.
"""
import hashlib
import json
from pathlib import Path

TASK_DIR = Path(__file__).resolve().parent.parent
TIER_TOLERANCE_DEG = 1e-8
JUNCTION_TOLERANCE_DEG = 1e-8  # same point reached from two pieces -- expect exact server agreement

S2_END_IDFERILL = 2894
S2_START_IDFERILL = 2892
EXPECTED_IDBUTUR = 911170037


def main():
    raw_path = TASK_DIR / "samples" / "raw-S2-WGS84.json"
    raw_bytes = raw_path.read_bytes()
    raw_sha256 = hashlib.sha256(raw_bytes).hexdigest()
    doc = json.loads(raw_bytes)

    ref = json.loads((TASK_DIR / "samples" / "rp1_native_reference.json").read_bytes())
    native_by_key = {(r["idferill"], r["nakvaemniferlis"]): r for r in ref["s2_features"]}

    by_role_tier = {}
    for f in doc["features"]:
        p = f["properties"]
        key = (p["IDFERILL"], p["NAKVAEMNIFERLIS"])
        if p["IDFERILL"] == S2_END_IDFERILL:
            role = "END"
        elif p["IDFERILL"] == S2_START_IDFERILL:
            role = "START"
        else:
            continue  # other pieces in this response (3409/3410/2891) are not S2 endpoint roles
        coords = f["geometry"]["coordinates"]
        # EA5(a): exclude z, use only [lon, lat]. END's own junction vertex is its
        # LAST coordinate (piece runs INTO the junction); START's is its FIRST
        # (piece runs OUT of the junction) -- confirmed against native_xy below.
        lon, lat = (coords[-1][0], coords[-1][1]) if role == "END" else (coords[0][0], coords[0][1])
        by_role_tier[(role, p["NAKVAEMNIFERLIS"])] = {
            "role": role, "idferill": p["IDFERILL"], "nakvaemniferlis": p["NAKVAEMNIFERLIS"],
            "idbutur": p["IDBUTUR"], "objectid": p["OBJECTID"], "id": f["id"],
            "latitude": lat, "longitude": lon, "dagsferils": p.get("DAGSFERILS"),
            "native_key": key,
        }

    entries = []
    for role, idferill in (("END", S2_END_IDFERILL), ("START", S2_START_IDFERILL)):
        tier_values = [by_role_tier[(role, t)] for t in (-1, 0, 1, 2) if (role, t) in by_role_tier]
        lats = {round(v["latitude"], 10) for v in tier_values}
        lons = {round(v["longitude"], 10) for v in tier_values}
        base_lat, base_lon = tier_values[0]["latitude"], tier_values[0]["longitude"]
        tier_consistent = all(
            abs(v["latitude"] - base_lat) <= TIER_TOLERANCE_DEG and abs(v["longitude"] - base_lon) <= TIER_TOLERANCE_DEG
            for v in tier_values
        )
        for v in tier_values:
            native = native_by_key.get(v["native_key"])
            native_xy = native["last_xy"] if role == "END" else native["first_xy"]
            entries.append({
                "role": role,
                "place": "Seyðisfjörður (S2)",
                "idferill": v["idferill"],
                "nakvaemniferlis": v["nakvaemniferlis"],
                "objectid": v["objectid"],
                "id": v["id"],
                "latitude": v["latitude"],
                "longitude": v["longitude"],
                "tier_consistency_flag": tier_consistent,
                "null_reason": None,
                "native_reference": {
                    "file_label": native["source_label"],
                    "file_path": "docs/ai/tasks/ticket-499/samples/rp1_native_reference.json (byte-identical copy of ticket-493-endpoint-acquisition/samples/rp1_native_reference.json, SHA bc1a6dbc2b50cfb3020d6dca705e96b7809648e828de6b5802900a1731e036cf)",
                    "idferill": native["idferill"],
                    "nakvaemniferlis": native["nakvaemniferlis"],
                    "native_xy": native_xy,
                    "note": "native reference is the retained tier-2 vertex at the junction (first_xy for START, last_xy for END); the WGS84 value above is the server's own answer for this (idferill, tier) pair, not reprojected from this native value.",
                },
                "raw_response_sha256": raw_sha256,
                "ledger_line": 1,
                "dagsferils": v["dagsferils"],
            })

    junction_end = by_role_tier[("END", 2)]
    junction_start = by_role_tier[("START", 2)]
    junction_wgs84_agree = (
        abs(junction_end["latitude"] - junction_start["latitude"]) <= JUNCTION_TOLERANCE_DEG
        and abs(junction_end["longitude"] - junction_start["longitude"]) <= JUNCTION_TOLERANCE_DEG
    )
    native_end_xy = native_by_key[junction_end["native_key"]]["last_xy"]
    native_start_xy = native_by_key[junction_start["native_key"]]["first_xy"]
    junction_native_agree = (
        abs(native_end_xy[0] - native_start_xy[0]) <= 0.0001 and abs(native_end_xy[1] - native_start_xy[1]) <= 0.0001
    )

    out = {
        "entries": entries,
        "junction_cross_check": {
            "end_idferill": S2_END_IDFERILL, "start_idferill": S2_START_IDFERILL,
            "native_xy_agree_within_0_0001m": junction_native_agree,
            "wgs84_agree_within_1e-8deg": junction_wgs84_agree,
            "note": "EA5(c): same native junction point reached via two different pieces; construction/consistency check only, not independent proof of the WGS84 values (EA5d).",
        },
        "raw_response_sha256": raw_sha256,
    }
    out_path = TASK_DIR / "samples" / "s2-wgs84-paired.json"
    with open(out_path, "w", encoding="utf-8", newline="\n") as f:
        json.dump(out, f, ensure_ascii=False, indent=1)
        f.write("\n")
    print("wrote", out_path)
    print("junction native agree:", junction_native_agree, "wgs84 agree:", junction_wgs84_agree)
    for role in ("END", "START"):
        flags = {e["tier_consistency_flag"] for e in entries if e["role"] == role}
        print(role, "tier_consistency_flag set:", flags)


if __name__ == "__main__":
    main()
