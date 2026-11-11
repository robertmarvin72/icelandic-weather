#!/usr/bin/env python3
"""
#493 endpoint-acquisition -- RP1 native per-tier reference. Reads
ticket-483/samples/wfs-vegnr1-all.json (VEGNR=1 pieces 1483/2345/2347/
2349) and phase2/samples/wfs93-raw.json (VEGNR=93 piece 2344, plus S2's
5 pieces 3410/3409/2894/2892/2891), and records, per (IDFERILL, tier),
the OBJECTID, vertex count, geometry type, and first/last native [x,y]
(z excluded per EA5a) -- the native-viewpoint ground truth this round's
live 4326 response will be paired against. Computed from retained
properties, not trusted from the prompt's own bare numbers (RP1).
No network. Writes exactly one file.
"""
import json
from pathlib import Path

TASK_DIR = Path(__file__).resolve().parent.parent
REPO_ROOT = TASK_DIR.parent.parent.parent.parent

VEGNR1_PATH = REPO_ROOT / "docs/ai/tasks/ticket-483/samples/wfs-vegnr1-all.json"
WFS93_PATH = REPO_ROOT / "docs/ai/tasks/ticket-493-place-data-phase2/samples/wfs93-raw.json"

E1_VEGNR1_PIECES = [1483, 2345, 2347, 2349]
E1_VEGNR93_PIECES = [2344]
S2_VEGNR93_PIECES = [3410, 3409, 2894, 2892, 2891]


def collect(data, idferill_set, source_label, source_path):
    out = []
    for feat in data["features"]:
        p = feat["properties"]
        if p["IDFERILL"] in idferill_set:
            coords = feat["geometry"]["coordinates"]
            assert all(len(c) == 3 for c in coords), f"arity != 3 at IDFERILL={p['IDFERILL']} tier={p.get('NAKVAEMNIFERLIS')}"
            out.append({
                "idferill": p["IDFERILL"], "idbutur": p.get("IDBUTUR"), "nakvaemniferlis": p.get("NAKVAEMNIFERLIS"),
                "objectid": p.get("OBJECTID"), "geometry_type": feat["geometry"]["type"], "vertex_count": len(coords),
                "first_xy": coords[0][:2], "last_xy": coords[-1][:2],
                "source_label": source_label, "source_path": str(source_path.relative_to(REPO_ROOT).as_posix()),
            })
    return out


def main():
    vegnr1 = json.loads(VEGNR1_PATH.read_bytes())
    wfs93 = json.loads(WFS93_PATH.read_bytes())

    e1_from_vegnr1 = collect(vegnr1, set(E1_VEGNR1_PIECES), "wfs-vegnr1-all.json (#483)", VEGNR1_PATH)
    e1_from_wfs93 = collect(wfs93, set(E1_VEGNR93_PIECES), "wfs93-raw.json (phase2)", WFS93_PATH)
    s2_from_wfs93 = collect(wfs93, set(S2_VEGNR93_PIECES), "wfs93-raw.json (phase2)", WFS93_PATH)

    e1_all = e1_from_vegnr1 + e1_from_wfs93
    s2_all = s2_from_wfs93

    assert len(e1_all) == 20, f"E1 expected 20, got {len(e1_all)}"
    assert len(s2_all) == 20, f"S2 expected 20, got {len(s2_all)}"
    assert len({(r["idferill"], r["nakvaemniferlis"]) for r in e1_all}) == 20, "duplicate (idferill,tier) in E1 set"
    assert len({(r["idferill"], r["nakvaemniferlis"]) for r in s2_all}) == 20, "duplicate (idferill,tier) in S2 set"

    e1_junction = next(r for r in e1_all if r["idferill"] == 2345 and r["nakvaemniferlis"] == -1)["last_xy"]
    e1_junction_2 = next(r for r in e1_all if r["idferill"] == 2344 and r["nakvaemniferlis"] == -1)["first_xy"]
    assert e1_junction == e1_junction_2, f"E1 junction native mismatch: {e1_junction} vs {e1_junction_2}"

    s2_junction = next(r for r in s2_all if r["idferill"] == 2894 and r["nakvaemniferlis"] == -1)["last_xy"]
    s2_junction_2 = next(r for r in s2_all if r["idferill"] == 2892 and r["nakvaemniferlis"] == -1)["first_xy"]
    assert s2_junction == s2_junction_2, f"S2 junction native mismatch: {s2_junction} vs {s2_junction_2}"

    out = {
        "e1_expected_feature_count": len(e1_all), "e1_pieces": sorted({r["idferill"] for r in e1_all}),
        "e1_junction_native_xy": e1_junction, "e1_features": e1_all,
        "s2_expected_feature_count": len(s2_all), "s2_pieces": sorted({r["idferill"] for r in s2_all}),
        "s2_junction_native_xy": s2_junction, "s2_features": s2_all,
    }
    out_path = TASK_DIR / "samples/rp1_native_reference.json"
    with open(out_path, "w", encoding="utf-8", newline="\n") as f:
        json.dump(out, f, ensure_ascii=False, indent=1)
        f.write("\n")
    print(f"E1: {len(e1_all)} features across pieces {out['e1_pieces']}, junction native (x,y) = {e1_junction}")
    print(f"S2: {len(s2_all)} features across pieces {out['s2_pieces']}, junction native (x,y) = {s2_junction}")
    print(f"wrote {out_path.relative_to(REPO_ROOT).as_posix()}")


if __name__ == "__main__":
    main()
