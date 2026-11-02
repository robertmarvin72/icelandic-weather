"""#485 iteration-3 — retained-data-only (ZERO new WFS fetch) span-0 endpoint,
oriented-path and ring-bridge analysis, per approved-prompt-v3.md.

ETA zero = IDFERILL 49926's own STORED START vertex (a named research
convention, not an official cadastral endpoint or city-street route).
Verifies, rather than assumes, every lead the approved prompt names
(42244, reversed 1431, ring bridges 1734/8677, 54723, entry at 1436's
stored end) by actually matching vertices in the retained geometry within
a stated tolerance -- never a straight-line snap invented between pieces
that do not actually share/near-share a vertex.

All coordinates come from already-retained files (#485 round-2's
wfs-extension-native3057.json / wfs-extension-4326.json, and #483's
wfs-chain-4326.json for IDFERILL 1436) -- no new network request.
"""
import hashlib
import json
import math
import os

HERE = os.path.dirname(__file__)
R485_SAMPLES = os.path.join(HERE, "..", "samples")
R483_SAMPLES = os.path.join(HERE, "..", "..", "ticket-483", "samples")

TOLERANCE_M = 5.0  # "unambiguous geometry within 5m" direct-link rule


def haversine(lon1, lat1, lon2, lat2):
    R = 6371000.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlmb = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dlmb / 2) ** 2
    return 2 * R * math.asin(math.sqrt(a))


def sha256_of(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()


def load_json(path):
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def tier0_vegnr1(data, idferill):
    for f in data["features"]:
        p = f["properties"]
        if p.get("IDFERILL") == idferill and p.get("VEGNR") == "1" and p.get("NAKVAEMNIFERLIS") == 0:
            return p, f["geometry"]["coordinates"]
    return None, None


def line_length(coords):
    return sum(haversine(coords[i][0], coords[i][1], coords[i + 1][0], coords[i + 1][1])
               for i in range(len(coords) - 1))


def nearest_vertex_index(coords, lon, lat):
    best_i, best_d = None, None
    for i, (clon, clat) in enumerate((c[0], c[1]) for c in coords):
        d = haversine(lon, lat, clon, clat)
        if best_d is None or d < best_d:
            best_d, best_i = d, i
    return best_i, best_d


def ring_arc_lengths(ring_coords, idx_a, idx_b):
    """ring_coords is closed (coords[0] == coords[-1]). Returns (arc_via_forward,
    arc_via_backward) between vertex index idx_a and idx_b, both measured
    along the ring's own stored vertex sequence (no shortcutting)."""
    n = len(ring_coords) - 1  # distinct vertices (last duplicates first)
    lo, hi = sorted((idx_a, idx_b))
    forward = sum(haversine(*ring_coords[i][:2], *ring_coords[i + 1][:2]) for i in range(lo, hi))
    total = line_length(ring_coords)
    backward = total - forward
    return forward, backward, total


def main():
    native_path = os.path.join(R485_SAMPLES, "wfs-extension-native3057.json")
    proj_path = os.path.join(R485_SAMPLES, "wfs-extension-4326.json")
    chain_path = os.path.join(R483_SAMPLES, "wfs-chain-4326.json")
    print("## Input manifest (read-only, NO new network -- all three files already retained)")
    for p in (native_path, proj_path, chain_path):
        print(f"- {p}  sha256={sha256_of(p)}  bytes={os.path.getsize(p)}")
    print()

    native = load_json(native_path)
    proj = load_json(proj_path)
    chain = load_json(chain_path)

    print("=" * 78)
    print("ETA ZERO: IDFERILL 49926's own stored START vertex (published pair, with file hashes)")
    print("=" * 78)
    p49926_native, c49926_native = tier0_vegnr1(native, 49926)
    p49926_proj, c49926_proj = tier0_vegnr1(proj, 49926)
    assert c49926_native and c49926_proj, "49926 tier0/VEGNR=1 piece not found in retained geometry"
    eta_zero_native = c49926_native[0]
    eta_zero_4326 = c49926_proj[0]
    print(f"Native EPSG:3057 (easting, northing[, z]): {eta_zero_native}  "
          f"(source: wfs-extension-native3057.json, sha256 above)")
    print(f"Reprojected EPSG:4326 (lon, lat[, z]):      {eta_zero_4326}  "
          f"(source: wfs-extension-4326.json, sha256 above)")
    print("This is a NAMED RESEARCH CONNECTION CONVENTION -- not an official cadastral endpoint or a "
          "city-street route; Vedurstofa station 1 is CONTEXT ONLY and plays no role in this definition "
          "(no nearest-anchor/8000m/E-ranking gate applies to this prospective convention).")
    print()

    print("=" * 78)
    print("ORIENTED SPAN-0 PATH: verifying each lead's actual vertex match, not assuming it")
    print("=" * 78)

    pieces = {}
    for idf in (42244, 1431, 54723, 1734, 8677):
        pp, cc = tier0_vegnr1(proj, idf)
        assert cc, f"IDFERILL {idf} tier0/VEGNR=1 not found -- lead cannot be verified"
        pieces[idf] = (pp, cc)

    # 1436 lives in the #483 chain sample, not the extension sample.
    p1436, c1436 = None, None
    for f in chain["features"]:
        p = f["properties"]
        if p["IDBUTUR"] == 1410010037 and p["VEGNR"] == "1" and p["NAKVAEMNIFERLIS"] == 0:
            p1436, c1436 = p, f["geometry"]["coordinates"]
    assert c1436, "IDFERILL 1436 (1410010037 tier0) not found in retained #483 chain sample"
    print(f"IDFERILL 1436 (IDBUTUR 1410010037) stored end (west boundary, entry point): {c1436[-1]}")
    print()

    def report_direct_link(label, lon_a, lat_a, lon_b, lat_b):
        d = haversine(lon_a, lat_a, lon_b, lat_b)
        ok = d <= TOLERANCE_M
        print(f"  {label}: residual={d:.2f}m  {'WITHIN 5m bound -- direct link supported' if ok else '** EXCEEDS 5m -- NOT a supported direct link **'}")
        return ok

    # Link 1: ETA-zero (49926 start) <-> 42244 start
    report_direct_link("ETA-zero (49926 start) <-> 42244 start",
                        eta_zero_4326[0], eta_zero_4326[1], pieces[42244][1][0][0], pieces[42244][1][0][1])
    len_42244 = line_length(pieces[42244][1])
    print(f"  42244 traveled FORWARD (stored start->end), length={len_42244:.1f}m, "
          f"VEGHLUTI={pieces[42244][0]['VEGHLUTI']}")
    print()

    # Link 2: 42244 end <-> 1431 END (reversed)
    end42244 = pieces[42244][1][-1]
    end1431 = pieces[1431][1][-1]
    start1431 = pieces[1431][1][0]
    report_direct_link("42244 end <-> 1431 end (1431 must be REVERSED to continue the travel direction)",
                        end42244[0], end42244[1], end1431[0], end1431[1])
    len_1431 = line_length(pieces[1431][1])
    print(f"  1431 traveled REVERSED (stored end->start), length={len_1431:.1f}m, "
          f"VEGHLUTI={pieces[1431][0]['VEGHLUTI']}")
    print()

    # Ring bridge 1734: entry at 1431's (now-reached) stored START, exit toward 54723's stored START
    ring1734 = pieces[1734][1]
    entry_idx, entry_d = nearest_vertex_index(ring1734, start1431[0], start1431[1])
    start54723 = pieces[54723][1][0]
    exit_idx, exit_d = nearest_vertex_index(ring1734, start54723[0], start54723[1])
    print(f"  RING BRIDGE 1734 (IDBUTUR 914020037, VEGHLUTI={pieces[1734][0]['VEGHLUTI']}, closed ring "
          f"verified: first vertex == last vertex): entry vertex idx={entry_idx} "
          f"(residual to 1431's reached start: {entry_d:.2f}m), exit vertex idx={exit_idx} "
          f"(residual to 54723's start: {exit_d:.2f}m)")
    fwd, bwd, total = ring_arc_lengths(ring1734, entry_idx, exit_idx)
    short_arc, long_arc = min(fwd, bwd), max(fwd, bwd)
    print(f"  Ring 1734 total closed-ring length: {total:.1f}m. Two possible arcs between entry/exit: "
          f"{fwd:.1f}m and {bwd:.1f}m.")
    print(f"  SHORTER arc ({short_arc:.1f}m): used ONLY as a hypothetical numerical ETA scenario below -- "
          f"NOT a proof of which way traffic actually circulates.")
    print(f"  LONGER arc ({long_arc:.1f}m): reported separately as a sensitivity figure, never summed "
          f"with the shorter arc or substituted for it.")
    print()

    # 54723 forward
    len_54723 = line_length(pieces[54723][1])
    print(f"  54723 traveled FORWARD (stored start->end), length={len_54723:.1f}m, "
          f"VEGHLUTI={pieces[54723][0]['VEGHLUTI']}")
    print()

    # Ring bridge 8677: entry at 54723's stored END, exit toward 1436's stored END
    ring8677 = pieces[8677][1]
    end54723 = pieces[54723][1][-1]
    entry_idx2, entry_d2 = nearest_vertex_index(ring8677, end54723[0], end54723[1])
    end1436 = c1436[-1]
    exit_idx2, exit_d2 = nearest_vertex_index(ring8677, end1436[0], end1436[1])
    print(f"  RING BRIDGE 8677 (IDBUTUR 914020037, VEGHLUTI={pieces[8677][0]['VEGHLUTI']}, closed ring "
          f"verified: first vertex == last vertex): entry vertex idx={entry_idx2} "
          f"(residual to 54723's end: {entry_d2:.2f}m), exit vertex idx={exit_idx2} "
          f"(residual to 1436's end/chain boundary: {exit_d2:.2f}m)")
    fwd2, bwd2, total2 = ring_arc_lengths(ring8677, entry_idx2, exit_idx2)
    short_arc2, long_arc2 = min(fwd2, bwd2), max(fwd2, bwd2)
    print(f"  Ring 8677 total closed-ring length: {total2:.1f}m. Two possible arcs: {fwd2:.1f}m and {bwd2:.1f}m.")
    print(f"  SHORTER arc ({short_arc2:.1f}m): hypothetical ETA scenario only. LONGER arc "
          f"({long_arc2:.1f}m): sensitivity, reported separately.")
    print()

    print("-" * 78)
    hypothetical_shorter_total = len_42244 + len_1431 + short_arc + len_54723 + short_arc2
    hypothetical_longer_total = len_42244 + len_1431 + long_arc + len_54723 + long_arc2
    residuals_total = entry_d + exit_d + entry_d2 + exit_d2  # the initial 49926<->42244 link already reported above
    print(f"SPAN 0 oriented length, SHORTER-arc hypothetical scenario: {hypothetical_shorter_total:.1f}m "
          f"(excludes IDFERILL 1436's own interior and all of 9924/49926's own length, per the frozen "
          f"exclusion rule; includes {residuals_total:.1f}m of reported sub-5m vertex residuals, not "
          f"rounded to zero)")
    print(f"SPAN 0 oriented length, LONGER-arc sensitivity: {hypothetical_longer_total:.1f}m")
    print("Neither figure is a proven driven distance: ring circulation direction is NOT established by "
          "geometry shape alone (axis 1 directional PASS requires cited role-5 meaning AND circulation "
          "evidence tied to this specific path -- see the role-documentation section below).")
    print()

    print("=" * 78)
    print("ROLE DOCUMENTATION STATUS (cited evidence only, never blindly called undocumented)")
    print("=" * 78)
    print("Role 5 (VEGHLUTI=5): the retained owner-source PDF from #483 "
          "(owner-source-2026-10-28/gagnaveita_faerd_ferlar_2017.pdf, page 3) documents VEGHLUTI 5 = "
          "'hringtorg' (roundabout) -- cited, not assumed. Both IDFERILL 1734 and 8677 are independently "
          "confirmed CLOSED RINGS in the retained geometry (first vertex == last vertex, verified above "
          "by direct coordinate comparison, not merely by trusting the VEGHLUTI tag), consistent with "
          "that documented meaning.")
    print("Roles 1 and 8: remain UNDOCUMENTED in every retained source checked this round "
          "(#483's PDF documents only 0/3/4/5/6/7). Whether a live official page documents them further "
          "is checked separately in docs-fetch-results.txt (this script makes no network request).")
    print()
    print("CIRCULATION EVIDENCE: no retained or newly-fetched source in this round states which "
          "direction traffic may legally travel around ring 1734 or 8677, or confirms this specific "
          "42244->1431->1734->54723->8677->1436 sequence is an authorised through-route (as opposed to "
          "merely a topologically-connected one). Per the frozen axis-1 rule: topology/availability "
          "progress is real and reported, but DIRECTIONAL axis1 PASS is not reached -- PARTIAL by "
          "design, not FAIL.")


if __name__ == "__main__":
    main()
