"""
#493-north-data -- v3 correction (Y1/Y2/L1/L2). Adds to the v2 version of
this script:

- Y1/L2: per-step `exact_xy_equal` (bool, compared on the FULL float xy
  tuple, not rounded) and the UNROUNDED measured gap distance, as two
  separate fields -- not just a rounded distance. The two named roundabout
  bridge constants (1.77 m, 42.84 m) are compared against the actual
  unrounded measurement and the deviation is printed explicitly: this is
  documentation of correspondence to the already-recorded evidence, NOT a
  new proximity threshold, and does not change the bridge's own grade
  ("bridged by pre-registered rule", never "VERIFIED driving connection").
- Y2/L1: sample age is computed from the file-level `DagsKeyrtUt` export
  timestamp of each of the four retained feed files (not `DagsSkrad`, which
  is a separate per-record field), after first asserting each file carries
  exactly ONE such timestamp across all its rows. Ages are computed to the
  second against this round's own reference instant, 2026-11-05T18:57:23Z.
- Also carries over (W5, now retained as script+output rather than ad hoc
  shell one-liners): notice 73688's nearest-vertex haversine distance to the
  chain, and the side-road tier0 pieces that share a target IDBUTUR key but
  are not on VEGNR=1.

No network call. No new dependency (stdlib only).
"""
import json
import math
from datetime import datetime, timezone

R = 6371008.8
NATIVE_PATH = "docs/ai/tasks/ticket-483/samples/wfs-vegnr1-all.json"
WGS_PATH = "docs/ai/tasks/ticket-493-north-data/samples/wfs-north-4326.json"
START_IDFERILL = 2819
EXCLUDED_IDBUTUR_BOUNDARY = 909000037  # Vadlaheidargong -- out of scope (N3)
# Named, documented roundabout-bridge constants (rounded; compared against
# the unrounded measurement below, not used as a new threshold):
DOCUMENTED_ROUNDABOUT_GAPS_M = {30401: 1.77, 2816: 42.84}
REFERENCE_UTC = datetime(2026, 11, 5, 18, 57, 23, tzinfo=timezone.utc)

TARGET_IDBUTUR = [904040037, 904050037, 904060037, 907150037, 907160037, 770040037,
                  907210037, 908010037, 908020037, 908030037, 908040037, 909010037,
                  909020037, 909030037, 909350037, 909360037]


def euclid(a, b):
    return math.hypot(a[0] - b[0], a[1] - b[1])


def haversine_m(lon1, lat1, lon2, lat2):
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dl = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * R * math.asin(math.sqrt(a))


def line_len_planar(coords):
    return sum(euclid(coords[i], coords[i + 1]) for i in range(len(coords) - 1))


def line_len_haversine(coords):
    return sum(haversine_m(coords[i][0], coords[i][1], coords[i + 1][0], coords[i + 1][1]) for i in range(len(coords) - 1))


def load_tier0_vegnr1(native_path):
    with open(native_path, encoding="utf-8") as f:
        data = json.load(f)
    feats = [f for f in data["features"] if f["properties"].get("NAKVAEMNIFERLIS") == 0 and f["properties"].get("VEGNR") == "1"]
    out = []
    for f in feats:
        p = f["properties"]
        c = f["geometry"]["coordinates"]
        out.append({
            "idferill": p["IDFERILL"], "idbutur": p["IDBUTUR"], "veghluti": p["VEGHLUTI"], "kaflanr": p["KAFLANR"],
            "start": (c[0][0], c[0][1]), "end": (c[-1][0], c[-1][1]), "coords": c, "len_planar": line_len_planar(c),
        })
    return out


def discover_chain(pieces, start_idferill, excluded_idbutur_boundary):
    """Greedy nearest-unused-endpoint walk. Returns the ordered piece list plus
    per-step diagnostics: rounded gap (legacy field), exact_xy_equal (bool,
    full-precision tuple compare), unrounded gap distance, orientation, and
    the next-nearest competing candidate's own distance."""
    by_idferill = {p["idferill"]: p for p in pieces}
    start = by_idferill[start_idferill]
    cur = start["end"]
    used = {start_idferill}
    chain = [{"piece": start, "gap_m": 0.0, "exact_xy_equal": None, "unrounded_gap_m": None, "orientation": "fwd", "next_competitor_m": None}]
    steps = []
    for _ in range(200):
        candidates = []
        for p in pieces:
            if p["idferill"] in used:
                continue
            d_fwd = euclid(cur, p["start"])
            d_rev = euclid(cur, p["end"])
            candidates.append((min(d_fwd, d_rev), d_fwd <= d_rev, p))
        if not candidates:
            break
        candidates.sort(key=lambda x: x[0])
        best_d, fwd, best_p = candidates[0]
        next_d = candidates[1][0] if len(candidates) > 1 else None
        if best_p["idbutur"] == excluded_idbutur_boundary:
            steps.append({"idferill": best_p["idferill"], "idbutur": best_p["idbutur"], "stopped_at_excluded_boundary": True, "gap_m": round(best_d, 3)})
            break
        entry_point = best_p["start"] if fwd else best_p["end"]
        exact = (cur == entry_point)
        used.add(best_p["idferill"])
        chain.append({
            "piece": best_p, "gap_m": round(best_d, 3), "exact_xy_equal": exact, "unrounded_gap_m": best_d,
            "orientation": "fwd" if fwd else "rev", "next_competitor_m": round(next_d, 3) if next_d is not None else None,
        })
        cur = best_p["end"] if fwd else best_p["start"]
    return chain, steps


def section_chain_discovery_and_gaps():
    pieces = load_tier0_vegnr1(NATIVE_PATH)
    print(f"Loaded {len(pieces)} tier0 VEGNR=1 pieces nationwide (reused, unchanged, re-verify hash separately).")

    chain, stop_log = discover_chain(pieces, START_IDFERILL, EXCLUDED_IDBUTUR_BOUNDARY)
    print(f"\nDiscovered chain length: {len(chain)} pieces (from-scratch nearest-unused-endpoint search, not a replay of a hardcoded list).")
    if stop_log:
        print(f"Stopped at excluded-boundary piece: {stop_log[0]}")

    print("\n# idferill idbutur veghluti kaflanr exact_xy_equal unrounded_gap_m orientation next_competitor_m")
    exact_count = 0
    non_exact = []
    for i, step in enumerate(chain):
        p = step["piece"]
        exact = step["exact_xy_equal"]
        if exact is True:
            exact_count += 1
        elif exact is False:
            non_exact.append((p["idferill"], step["unrounded_gap_m"]))
        ug = step["unrounded_gap_m"]
        print(i + 1, p["idferill"], p["idbutur"], p["veghluti"], p["kaflanr"], exact,
              ("%.6f" % ug) if ug is not None else None, step["orientation"], step["next_competitor_m"])

    print(f"\nExact-contact count (exact_xy_equal==True): {exact_count} of {len(chain) - 1} inter-piece transitions.")
    print("Non-exact transitions (idferill, unrounded_gap_m):", non_exact)

    print("\n=== Y1/L2: roundabout bridge constants vs. unrounded measurement (documentation of correspondence, NOT a new threshold) ===")
    for idf, documented_m in DOCUMENTED_ROUNDABOUT_GAPS_M.items():
        measured = next(ug for i, ug in non_exact if i == idf)
        deviation = measured - documented_m
        print(f"  idferill {idf}: documented={documented_m}m, measured(unrounded)={measured:.6f}m, deviation={deviation:+.6f}m")
        assert abs(deviation) < 0.01, f"documented roundabout gap for {idf} deviates from measurement by more than 1cm -- investigate before treating as the same evidence"
    print("  Assertion passed: both documented constants are within 1cm of their own unrounded measurement -- same evidence, rounded for display. Grade remains 'bridged by pre-registered rule', not 'VERIFIED driving connection' (K1).")

    discovered_idferill_order = [s["piece"]["idferill"] for s in chain]
    EXISTING_CANDIDATE_ORDER = [2819, 30401, 2816, 2800, 2775, 2753, 3103, 3406, 3407, 3408, 2243, 1481,
                                3828, 3827, 3826, 3825, 3584, 3570, 52490, 3569, 2594, 2593, 3221, 2423,
                                2456, 2478, 3237, 3238, 2477, 2734, 2733, 2736, 2718, 3233, 3258, 3275,
                                3016, 3015, 2995, 2940, 3876, 3505, 3504, 2727, 2726, 2725, 32964]
    print("\nDiscovered order == existing candidate chain_order (build_candidate.py)?", discovered_idferill_order == EXISTING_CANDIDATE_ORDER)
    if discovered_idferill_order != EXISTING_CANDIDATE_ORDER:
        print("MISMATCH -- this is a disclosed blocker, not auto-resolved. Discovered:", discovered_idferill_order)

    vh_counts = {}
    idb_set = set()
    for s in chain:
        p = s["piece"]
        vh_counts[p["veghluti"]] = vh_counts.get(p["veghluti"], 0) + 1
        idb_set.add(p["idbutur"])
    print("\nVEGHLUTI role counts across the", len(chain), "evidence pieces (incl. reference piece 2819):", vh_counts)
    print("Distinct IDBUTUR:", len(idb_set), sorted(idb_set))

    with open(WGS_PATH, encoding="utf-8") as f:
        wgs = json.load(f)
    wgs_t0 = {f["properties"]["IDFERILL"]: f for f in wgs["features"] if f["properties"].get("NAKVAEMNIFERLIS") == 0}

    mismatches = []
    total_nodes = 0
    zero_z_nodes = 0
    zero_z_pieces = []
    max_z_overall = None
    per_piece_maxz = []
    for s in chain:
        p = s["piece"]
        idf = p["idferill"]
        nc = p["coords"]
        wc = wgs_t0[idf]["geometry"]["coordinates"]
        if len(nc) != len(wc):
            mismatches.append((idf, len(nc), len(wc)))
        zs = [pt[2] if len(pt) > 2 else 0.0 for pt in nc]
        piece_zero = sum(1 for z in zs if z == 0.0)
        total_nodes += len(nc)
        zero_z_nodes += piece_zero
        if piece_zero == len(nc):
            zero_z_pieces.append((idf, p["idbutur"], len(nc)))
        pm = max(zs)
        per_piece_maxz.append((idf, p["idbutur"], pm))
        if max_z_overall is None or pm > max_z_overall[0]:
            max_z_overall = (pm, idf, p["idbutur"])

    print("\nNode-count mismatches (native vs WGS84):", mismatches if mismatches else "NONE")
    print("Total vertices across", len(chain), "evidence pieces:", total_nodes)
    print("Zero-z vertices:", zero_z_nodes, "of", total_nodes)
    print("Pieces entirely zero-z (no elevation recorded at all):")
    for idf, idb, n in zero_z_pieces:
        print("  ", idf, idb, n, "vertices")
    print("\nOverall max z:", max_z_overall)
    print("Top 5 local maxima by piece:")
    for idf, idb, z in sorted(per_piece_maxz, key=lambda t: -t[2])[:5]:
        print("  idferill", idf, "idbutur", idb, "max_z_m", z)

    ring = next(p for p in pieces if p["idferill"] == 30401)
    ring_wgs = wgs_t0[30401]["geometry"]["coordinates"]
    print("\nRoundabout 30401 own closed-loop length: planar=%.3fm haversine=%.3fm (EXCLUDED from route-distance totals below; evidence of feature existence only)" % (
        ring["len_planar"], line_len_haversine(ring_wgs)))

    north_pieces = [s for s in chain if s["piece"]["idferill"] not in (2819, 30401)]
    sum_planar = sum(s["piece"]["len_planar"] for s in north_pieces)
    sum_hav = sum(line_len_haversine(wgs_t0[s["piece"]["idferill"]]["geometry"]["coordinates"]) for s in north_pieces)
    gaps_sum = sum(ug for i, ug in non_exact)  # unrounded, both bridges, each counted exactly once
    print("\nNorth-only route-distance (excl. piece 2819 AND ring 30401's own loop, incl. the two disclosed bridging gaps once each, UNROUNDED):")
    print("  planar ISN93 km:", round((sum_planar + gaps_sum) / 1000, 4))
    print("  haversine WGS84 km:", round((sum_hav + gaps_sum) / 1000, 4))

    return pieces, chain, wgs_t0


def section_b_measurement():
    with open(NATIVE_PATH, encoding="utf-8") as f:
        native = json.load(f)
    nat_feats = {f["properties"]["IDFERILL"]: f for f in native["features"] if f["properties"].get("NAKVAEMNIFERLIS") == 0}
    piece_32964 = nat_feats[32964]["geometry"]["coordinates"]
    b_point = nat_feats[33604]["geometry"]["coordinates"][0]

    total_len = line_len_planar(piece_32964)
    best = None
    cum = 0.0
    for i in range(len(piece_32964) - 1):
        seg_a, seg_b = piece_32964[i], piece_32964[i + 1]
        seg_len = euclid(seg_a, seg_b)
        if seg_len > 0:
            t = ((b_point[0] - seg_a[0]) * (seg_b[0] - seg_a[0]) + (b_point[1] - seg_a[1]) * (seg_b[1] - seg_a[1])) / (seg_len ** 2)
            t_clamped = max(0.0, min(1.0, t))
            proj = (seg_a[0] + t_clamped * (seg_b[0] - seg_a[0]), seg_a[1] + t_clamped * (seg_b[1] - seg_a[1]))
            dist_to_line = euclid(b_point, proj)
            along = cum + t_clamped * seg_len
            if best is None or dist_to_line < best[0]:
                best = (dist_to_line, along)
        cum += seg_len

    dist_to_line, along_from_start = best
    along_from_end = total_len - along_from_start
    chord_to_start = euclid(b_point, piece_32964[0])
    chord_to_end = euclid(b_point, piece_32964[-1])

    print("\n=== B (roundabout 33604) measurement vs. piece 32964 (total length %.3fm) ===" % total_len)
    print("Point-to-line distance (perpendicular, planar ISN93):", round(dist_to_line, 3), "m")
    print("Along-line distance from piece start:", round(along_from_start, 3), "m")
    print("Along-line distance from piece end:", round(along_from_end, 3), "m")
    print("Chord (straight-line) distance to piece start:", round(chord_to_start, 3), "m")
    print("Chord (straight-line) distance to piece end:", round(chord_to_end, 3), "m")
    print("Fraction of piece length from start:", round(along_from_start / total_len * 100, 1), "%")


def section_feed_ages_y2_l1():
    print("\n=== Y2/L1: feed-file export-timestamp ages, reference = %s ===" % REFERENCE_UTC.isoformat())
    feed_files = [
        ("docs/ai/tasks/ticket-483/samples/legacy-faerd-fresh.json", "DagsKeyrtUt", "faerd2017_1, 2026-10-28 capture"),
        ("docs/ai/tasks/ticket-485/samples/legacy-faerd-https.json", "DagsKeyrtUt", "faerd2017_1, 2026-11-02 capture"),
        ("docs/ai/tasks/ticket-483/samples/legacy-faerdpunktar.json", "DagsKeyrtUt", "faerdpunktar2017_1, 2026-10-28 capture"),
        ("docs/ai/tasks/ticket-485/samples/legacy-faerdpunktar-https.json", "DagsKeyrtUt", "faerdpunktar2017_1, 2026-11-02 capture"),
    ]
    ages = []
    for path, field, label in feed_files:
        with open(path, encoding="utf-8") as f:
            rows = json.load(f)
        vals = set(r.get(field) for r in rows)
        assert len(vals) == 1, f"{path} does not carry a single file-level {field} value: {vals}"
        ts = next(iter(vals))
        dt = datetime.fromisoformat(ts.replace("Z", "+00:00"))
        age = REFERENCE_UTC - dt
        days, rem = age.days, age.seconds
        h, m, s = rem // 3600, (rem % 3600) // 60, rem % 60
        print(f"  {label}: file={path}, field={field}, export_ts={ts}, age={days}d {h}h {m}m {s}s (total_seconds={age.total_seconds():.0f}), n_rows={len(rows)}")
        ages.append(age.total_seconds())
    min_d, max_d = min(ages) / 86400, max(ages) / 86400
    print(f"  Age range across all 4 feed files: {min_d:.4f} to {max_d:.4f} days -> stated range '3-8 days' (not '3-7 days').")
    print("  DagsSkrad (per-record registration time) is a SEPARATE field from DagsKeyrtUt (file-level export time) and is not conflated here.")


def section_notice_73688_and_side_roads(pieces, chain, wgs_t0):
    print("\n=== W5 (retained, not ad hoc): notice 73688 nearest-vertex distance, side-road pieces sharing target IDBUTUR ===")
    for path in ["docs/ai/tasks/ticket-483/samples/legacy-faerdpunktar.json", "docs/ai/tasks/ticket-485/samples/legacy-faerdpunktar-https.json"]:
        with open(path, encoding="utf-8") as f:
            rows = json.load(f)
        for r in rows:
            if r.get("IdPunktur") in (73688, 73688.0):
                notice_lon, notice_lat = r["Lengd"], r["Breidd"]
                print(f"  Found notice 73688 in {path}: IdButur={r['IdButur']}, Astand={r['Astand']}, GildirTil={r.get('GildirTil')}, lon={notice_lon}, lat={notice_lat}")

    chain_idferill = [s["piece"]["idferill"] for s in chain]
    best = None
    for idf in chain_idferill:
        c = wgs_t0[idf]["geometry"]["coordinates"]
        for v in c:
            d = haversine_m(notice_lon, notice_lat, v[0], v[1])
            if best is None or d < best[0]:
                best = (d, idf)
    print(f"  Nearest-vertex haversine distance from notice 73688 to the 47-piece WGS84 chain: {best[0]:.1f} m (piece idferill {best[1]}).")
    print("  This is an UPPER BOUND on point-to-line distance (nearest-vertex >= nearest-point-on-line), not a precise point-to-line measurement, and is never used to infer route relevance either way.")

    with open(WGS_PATH, encoding="utf-8") as f:
        wgs_full = json.load(f)
    non1 = [f for f in wgs_full["features"] if f["properties"]["VEGNR"] != "1" and f["properties"].get("NAKVAEMNIFERLIS") == 0]
    print(f"\n  Side-road tier0 pieces sharing a target IDBUTUR but NOT on VEGNR=1 ({len(non1)} pieces):")
    total_side = 0.0
    seen = set()
    for f in non1:
        p = f["properties"]
        key = (p["IDFERILL"], p["VEGNR"])
        if key in seen:
            continue
        seen.add(key)
        L = line_len_haversine(f["geometry"]["coordinates"])
        total_side += L
        print(f"    idferill={p['IDFERILL']} idbutur={p['IDBUTUR']} vegnr={p['VEGNR']} kaflanr={p['KAFLANR']} length_m={L:.1f}")
    print(f"  Sum of distinct side-road tier0 piece lengths: {total_side / 1000:.3f} km -- NOT part of the Hringvegur chain, not added to it.")


if __name__ == "__main__":
    pieces, chain, wgs_t0 = section_chain_discovery_and_gaps()
    section_b_measurement()
    section_feed_ages_y2_l1()
    section_notice_73688_and_side_roads(pieces, chain, wgs_t0)
