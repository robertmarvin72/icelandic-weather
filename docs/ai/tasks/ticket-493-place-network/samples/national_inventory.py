#!/usr/bin/env python3
"""
#493 place-network, phase 1 (offline, 0 exchanges).

Reads the retained nationwide VEGNR=1 dataset (ticket-483/samples/
wfs-vegnr1-all.json, EPSG:3057/ISN93, fetched 2026-10-28) and produces:
  - road-links.csv: one row per canonical piece (E2d selection)
  - continuity-pairs.csv: every endpoint-pair within the E2a gap threshold
  - chain-walks.json: greedy nearest-unused-endpoint walks from the
    Rauðavatn anchor, one per declared direction (west/south)

Rules applied (see ../rules.md, written before this script was run):
  E2a contact bands, E2b direction-by-VEGHLUTI, E2c tunnel handling,
  E2d canonical-instance selection.

Deterministic, reproducible from a clean tree; no network access.
"""
import json
import math
import csv
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[5]  # repo root
SRC = ROOT / "docs/ai/tasks/ticket-483/samples/wfs-vegnr1-all.json"
OUT_DIR = Path(__file__).resolve().parent

GAP_BANDS = [
    ("exact", 0.0),
    ("contact_5m", 5.0),
    ("contact_25m", 25.0),
    ("contact_100m", 100.0),
]


def band_for(distance):
    if distance == 0.0:
        return "exact"
    for name, limit in GAP_BANDS[1:]:
        if distance <= limit:
            return name
    return "gap"


def planar_length(coords):
    total = 0.0
    for (x0, y0, *_), (x1, y1, *_) in zip(coords, coords[1:]):
        total += math.hypot(x1 - x0, y1 - y0)
    return total


def load_pieces():
    with open(SRC, encoding="utf-8") as f:
        data = json.load(f)
    feats = data["features"]
    assert len(feats) == 996, f"expected 996 features, got {len(feats)}"

    by_idferill = {}
    for feat in feats:
        p = feat["properties"]
        by_idferill.setdefault(p["IDFERILL"], []).append(feat)

    assert len(by_idferill) == 249, f"expected 249 IDFERILL, got {len(by_idferill)}"
    for idferill, copies in by_idferill.items():
        assert len(copies) == 4, f"IDFERILL {idferill} has {len(copies)} copies, expected 4"

    pieces = []
    for idferill, copies in by_idferill.items():
        # E2d: most vertices wins; tie -> lowest OBJECTID.
        canonical = sorted(
            copies,
            key=lambda f: (-len(f["geometry"]["coordinates"]), f["properties"]["OBJECTID"]),
        )[0]
        coords = canonical["geometry"]["coordinates"]
        p = canonical["properties"]
        pieces.append(
            {
                "idferill": idferill,
                "idbutur": p["IDBUTUR"],
                "vegnr": p["VEGNR"],
                "kaflanr": p["KAFLANR"],
                "veghluti": p["VEGHLUTI"],
                "name": p["STUTTNAFNLEIDAR"],
                "desc": p["STADARLYSING"],
                "objectid": p["OBJECTID"],
                "n_vertices": len(coords),
                "start": tuple(coords[0][:2]),
                "end": tuple(coords[-1][:2]),
                "length_planar_m": planar_length(coords),
            }
        )
    return pieces


def continuity_pairs(pieces):
    """Every endpoint-pair across DIFFERENT idferill within contact_100m."""
    endpoints = []
    for pc in pieces:
        endpoints.append((pc["idferill"], "start", pc["start"]))
        endpoints.append((pc["idferill"], "end", pc["end"]))

    pairs = []
    n = len(endpoints)
    for i in range(n):
        id_i, which_i, (xi, yi) = endpoints[i]
        for j in range(i + 1, n):
            id_j, which_j, (xj, yj) = endpoints[j]
            if id_i == id_j:
                continue
            d = math.hypot(xi - xj, yi - yj)
            if d <= 100.0:
                pairs.append(
                    {
                        "idferill_a": id_i,
                        "end_a": which_i,
                        "idferill_b": id_j,
                        "end_b": which_j,
                        "distance_m": d,
                        "band": band_for(d),
                    }
                )
    return pairs


def find_pieces_by_name(pieces, needle):
    needle = needle.lower()
    return [pc for pc in pieces if needle in (pc["name"] or "").lower() or needle in (pc["desc"] or "").lower()]


def nearest_unused(pieces_by_id, used, from_point, exclude_idferill):
    best = None
    bx, by = from_point
    for idferill, pc in pieces_by_id.items():
        if idferill in used or idferill == exclude_idferill:
            continue
        for which in ("start", "end"):
            px, py = pc[which]
            d = math.hypot(px - bx, py - by)
            if best is None or d < best[0]:
                best = (d, idferill, which)
    return best


def opposite_direction_name(name, outbound_is_east_or_south):
    """#483 research-report.md convention: STUTTNAFNLEIDAR sometimes names
    a piece explicitly 'til austurs' (eastbound) or 'til vesturs'
    (westbound) when it has a same-IDBUTUR opposite-direction twin at the
    SAME location. When our declared travel direction is eastbound/
    southbound (outbound_is_east_or_south=True), a piece named 'til
    vesturs' is its own twin's opposite and is excluded UNLESS it is the
    only candidate at that step (a forced single-carriageway merge)."""
    n = (name or "").lower()
    if outbound_is_east_or_south:
        return "til vesturs" in n
    return "til austurs" in n


def walk(pieces_by_id, start_idferill, start_end, max_steps=400, gap_threshold=100.0, outbound_is_east_or_south=True):
    """Greedy nearest-unused-endpoint walk. Returns (sequence, stop_reason)."""
    used = {start_idferill}
    seq = [{"idferill": start_idferill, "entered_at": start_end, "cum_m": 0.0}]
    current_pc = pieces_by_id[start_idferill]
    # the "far" end of the current piece is where we look for the next hop
    far_end = "end" if start_end == "start" else "start"
    cum = 0.0
    for _ in range(max_steps):
        from_point = current_pc[far_end]
        candidates = []
        bx, by = from_point
        for idferill, pc in pieces_by_id.items():
            if idferill in used:
                continue
            for which in ("start", "end"):
                px, py = pc[which]
                d = math.hypot(px - bx, py - by)
                if d <= gap_threshold:
                    candidates.append((d, idferill, which))
        if not candidates:
            nxt = nearest_unused(pieces_by_id, used, from_point, None)
            return seq, {
                "reason": "gap",
                "at_idferill": current_pc["idferill"],
                "at_end": far_end,
                "nearest_unused_distance_m": nxt[0] if nxt else None,
                "nearest_unused_idferill": nxt[1] if nxt else None,
            }
        # Exclude the explicitly-opposite-direction-named twin unless it is
        # the ONLY candidate (a forced single-carriageway merge) — #483's
        # own "til vesturs"/"til austurs" naming convention.
        non_opposite = [
            c for c in candidates if not opposite_direction_name(pieces_by_id[c[1]]["name"], outbound_is_east_or_south)
        ]
        if non_opposite:
            candidates = non_opposite
        candidates.sort(key=lambda c: c[0])
        # Prefer VEGHLUTI 1 (undivided, the vast majority of the ring),
        # then 7 (outbound carriageway member, #483 convention), then
        # anything else, among candidates within 5m of the single nearest
        # distance (treats near-ties as "same junction", not a random pick
        # by float noise).
        d0 = candidates[0][0]
        near_ties = [c for c in candidates if c[0] <= d0 + 5.0]
        branch_ids = [c[1] for c in near_ties]

        def pref_key(c):
            pc2 = pieces_by_id[c[1]]
            vh = pc2["veghluti"]
            order = {1: 0, 7: 1, 3: 2, 4: 2, 5: 3, 6: 4, 8: 5}.get(vh, 6)
            return (order, c[0])

        near_ties.sort(key=pref_key)
        chosen_d, chosen_id, chosen_end = near_ties[0]
        other_branches = [b for b in branch_ids if b != chosen_id]

        used.add(chosen_id)
        cum += chosen_d  # the bridged gap itself (0 for exact contact)
        chosen_pc = pieces_by_id[chosen_id]
        cum += chosen_pc["length_planar_m"]
        seq.append(
            {
                "idferill": chosen_id,
                "idbutur": chosen_pc["idbutur"],
                "name": chosen_pc["name"],
                "desc": chosen_pc["desc"],
                "veghluti": chosen_pc["veghluti"],
                "entered_at": chosen_end,
                "bridge_m": chosen_d,
                "piece_length_m": chosen_pc["length_planar_m"],
                "cum_m": cum,
                "other_branches_not_taken": other_branches,
            }
        )
        current_pc = chosen_pc
        far_end = "end" if chosen_end == "start" else "start"
    return seq, {"reason": "max_steps_reached"}


def main():
    pieces = load_pieces()
    pieces_by_id = {pc["idferill"]: pc for pc in pieces}

    with open(OUT_DIR / "road-links.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f, lineterminator="\n")
        w.writerow(
            [
                "idferill",
                "idbutur",
                "vegnr",
                "kaflanr",
                "veghluti",
                "name",
                "desc",
                "objectid_canonical",
                "n_vertices",
                "start_x",
                "start_y",
                "end_x",
                "end_y",
                "length_planar_m",
            ]
        )
        for pc in sorted(pieces, key=lambda p: p["idferill"]):
            w.writerow(
                [
                    pc["idferill"],
                    pc["idbutur"],
                    pc["vegnr"],
                    pc["kaflanr"],
                    pc["veghluti"],
                    pc["name"],
                    pc["desc"],
                    pc["objectid"],
                    pc["n_vertices"],
                    f"{pc['start'][0]:.4f}",
                    f"{pc['start'][1]:.4f}",
                    f"{pc['end'][0]:.4f}",
                    f"{pc['end'][1]:.4f}",
                    f"{pc['length_planar_m']:.4f}",
                ]
            )

    pairs = continuity_pairs(pieces)
    with open(OUT_DIR / "continuity-pairs.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f, lineterminator="\n")
        w.writerow(["idferill_a", "end_a", "idferill_b", "end_b", "distance_m", "band"])
        for pr in sorted(pairs, key=lambda x: x["distance_m"]):
            w.writerow(
                [pr["idferill_a"], pr["end_a"], pr["idferill_b"], pr["end_b"], f"{pr['distance_m']:.4f}", pr["band"]]
            )

    band_counts = {}
    for pr in pairs:
        band_counts[pr["band"]] = band_counts.get(pr["band"], 0) + 1

    raudavatn = find_pieces_by_name(pieces, "rauðavatn")
    hadegismoar = find_pieces_by_name(pieces, "hádegismó")
    vesturlandsvegur = [pc for pc in pieces if "vesturlandsvegur" in (pc["name"] or "").lower()]
    sudurlandsvegur = [pc for pc in pieces if "suðurlandsvegur" in (pc["name"] or "").lower()]

    print("Rauðavatn matches:", [(pc["idferill"], pc["idbutur"], pc["name"], pc["desc"]) for pc in raudavatn])
    print("Hádegismóar matches:", [(pc["idferill"], pc["idbutur"], pc["name"], pc["desc"]) for pc in hadegismoar])
    print("Vesturlandsvegur count:", len(vesturlandsvegur))
    print("Suðurlandsvegur count:", len(sudurlandsvegur))
    print("Band counts:", band_counts)
    print("Total pieces:", len(pieces))
    print(
        "VEGHLUTI counts (canonical pieces):",
        {v: sum(1 for p in pieces if p["veghluti"] == v) for v in sorted({p["veghluti"] for p in pieces})},
    )

    # Egilsstaðir / Seyðisfjörður / road 93 presence check (VEGNR=1 only
    # dataset -> expect NOT present; phase-1 scope check).
    egilsstadir = find_pieces_by_name(pieces, "egilsstaðir")
    seydisfjordur = find_pieces_by_name(pieces, "seyðisfjörð")
    road93 = [pc for pc in pieces if pc["vegnr"] == "93"]
    print("Egilsstaðir matches on VEGNR=1:", [(pc["idferill"], pc["idbutur"], pc["name"]) for pc in egilsstadir])
    print("Seyðisfjörður matches on VEGNR=1:", [(pc["idferill"], pc["idbutur"], pc["name"]) for pc in seydisfjordur])
    print("VEGNR=93 pieces in this dataset:", len(road93))

    for needle in ["göng", "hvalfjarð", "vaðlaheið", "fáskrúðsfjarð"]:
        matches = find_pieces_by_name(pieces, needle)
        print(f"'{needle}' matches:", [(pc["idferill"], pc["idbutur"], pc["name"], pc["desc"]) for pc in matches])

    for needle in ["selfoss", "hella", "hveragerð", "vík", "höfn", "mývatn", "akureyri", "borgarnes"]:
        matches = find_pieces_by_name(pieces, needle)
        print(f"'{needle}' matches ({len(matches)}):", [(pc["idferill"], pc["name"]) for pc in matches][:10])

    raudavatn_id = raudavatn[0]["idferill"]
    walks_out = {}
    for label, start_end, outbound_east in [
        ("south_via_nesjavallaleid", "end", True),
        ("south_via_sudurlandsvegur", "start", True),
    ]:
        seq, stop = walk(pieces_by_id, raudavatn_id, start_end, outbound_is_east_or_south=outbound_east)
        walks_out[label] = {"sequence": seq, "stop": stop}
        print(f"\n=== walk {label} (len={len(seq)}, stop={stop}) ===")
        for step in seq[:400]:
            print(
                "  ",
                step.get("idferill"),
                step.get("name"),
                step.get("desc"),
                "veghluti=" + str(step.get("veghluti")) if "veghluti" in step else "",
                f"cum={step.get('cum_m', 0):.1f}m",
                ("branches_not_taken=" + str(step["other_branches_not_taken"])) if step.get("other_branches_not_taken") else "",
            )

    with open(OUT_DIR / "chain-walks.json", "w", encoding="utf-8", newline="\n") as f:
        json.dump(walks_out, f, ensure_ascii=False, indent=1)
        f.write("\n")


if __name__ == "__main__":
    main()
