"""#485 validation harness. Unlike #483's harness/05 (which could print
"** MISMATCH **" and still exit 0 -- a known, disclosed defect this round's
own approved prompt explicitly calls out: "485 assertions must fail
nonzero"), every check here either passes silently/prints PASS, or raises
AssertionError / calls sys.exit(1), so a CI-style `echo $?` catches a
regression. Run with: python3 -B validate.py
"""
import csv
import json
import math
import os
import shutil
import sys

HERE = os.path.dirname(__file__)
ROOT = os.path.join(HERE, "..")
SAMPLES = os.path.join(ROOT, "samples")


def point_to_segment_dist(px, py, ax, ay, bx, by):
    dx, dy = bx - ax, by - ay
    if dx == 0 and dy == 0:
        return math.hypot(px - ax, py - ay)
    t = ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)
    t = max(0.0, min(1.0, t))
    return math.hypot(px - (ax + t * dx), py - (ay + t * dy))


def point_to_polyline(px, py, coords):
    best = None
    for i in range(len(coords) - 1):
        d = point_to_segment_dist(px, py, coords[i][0], coords[i][1], coords[i + 1][0], coords[i + 1][1])
        if best is None or d < best:
            best = d
    return best


def self_check_midpoint():
    print("[1] synthetic midpoint self-check (point_to_segment_dist) ... ", end="")
    ax, ay, bx, by = 0.0, 0.0, 0.0, 100.0
    px, py = 7.0, 50.0
    line_dist = point_to_segment_dist(px, py, ax, ay, bx, by)
    vertex_dist = min(math.hypot(px - ax, py - ay), math.hypot(px - bx, py - by))
    assert abs(line_dist - 7.0) < 1e-6, f"RED: expected 7.0, got {line_dist}"
    assert line_dist < vertex_dist, "RED: regressed to nearest-vertex behaviour"
    print(f"PASS (line_distance={line_dist:.6f}, nearest_vertex={vertex_dist:.3f})")


CHAIN = [1410010037, 903010037, 253020037, 252090037, 902030037, 902040037,
         901130037, 901230037, 901220037, 901210037, 901050037, 901040037, 801100037]


def real_association_check():
    print("[2] real-data point-to-line association (fresh #485 point coords, reused #483 chain geometry) ... ")
    with open(os.path.join(SAMPLES, "legacy-faerdpunktar-https.json"), encoding="utf-8") as f:
        pts = json.load(f)
    with open(os.path.join(ROOT, "..", "ticket-483", "samples", "wfs-vegnr1-all.json"), encoding="utf-8") as f:
        nat = json.load(f)
    by_id = {}
    for feat in nat["features"]:
        p = feat["properties"]
        if p["VEGNR"] != "1" or p["NAKVAEMNIFERLIS"] != 0:
            continue
        by_id.setdefault(p["IDBUTUR"], []).append(feat["geometry"]["coordinates"])

    expected = {67861: (902030037, 0.089), 67862: (902040037, 0.138)}
    for ip, (idb, expected_m) in expected.items():
        r = [x for x in pts if int(x["IdPunktur"]) == ip][0]
        assert int(r["IdButur"]) == idb, f"RED: {ip} IdButur changed from {idb} to {r['IdButur']}"
        best = None
        for coords in by_id.get(idb, []):
            d = point_to_polyline(r["Austur"], r["Nordur"], coords)
            if best is None or d < best:
                best = d
        assert best < 50, f"RED: {ip} line-distance {best:.3f}m exceeds the 50m association bound"
        assert abs(best - expected_m) < 0.05, f"RED: {ip} distance drifted from {expected_m}m to {best:.3f}m"
        print(f"    {ip} own_IdButur={idb} line_distance={best:.3f}m -- PASS (own-ID AND distance<50m both hold)")

    r73801 = [x for x in pts if int(x["IdPunktur"]) == 73801]
    if r73801:
        assert int(r73801[0]["IdButur"]) not in CHAIN, "RED: 73801's IdButur unexpectedly joined the chain"
        print("    73801: own_IdButur not in chain -- correctly NOT associated (proximity alone insufficient)")
    else:
        print("    73801: not present in this fresh fetch (nationwide point-incident count has genuinely "
              "changed over time since #483 -- see research-report.md; absence is reported, not treated "
              "as a retrieval bug)")


def full_id_presence_check():
    print("[3] full-ID presence / no missing / no duplicate chain segment ... ", end="")
    with open(os.path.join(SAMPLES, "legacy-faerd-https.json"), encoding="utf-8") as f:
        segs = json.load(f)
    by_id = {}
    for r in segs:
        idb = int(r["IdButur"])
        by_id.setdefault(idb, []).append(r)
    missing = [idb for idb in CHAIN if idb not in by_id]
    dup = [idb for idb in CHAIN if len(by_id.get(idb, [])) > 1]
    assert not missing, f"RED: chain segment(s) missing from fresh export: {missing} -- must report UNAVAILABLE, not skip"
    assert not dup, f"RED: duplicate records for {dup} -- version/suffix ambiguity"
    not_greidfaert = [idb for idb in CHAIN if by_id[idb][0]["AstandYfirbord"] != "GREIDFAERT"]
    print(f"PASS (13/13 present, no duplicates; non-GREIDFAERT this fetch: {not_greidfaert or 'none'})")


def check_coverage(path):
    """Raises AssertionError (not a printed warning) on any violation --
    the #483 harness/05 defect this round's prompt explicitly requires
    fixing."""
    with open(path, encoding="utf-8") as f:
        rows = list(csv.DictReader(f))
    span0 = [r for r in rows if r["span"] == "0"][0]
    assert span0["axis1_geometry"] != "PASS", (
        "span 0 axis1_geometry must never read PASS this round -- the anchor ranking is a "
        "documented tie, not a resolved winner")
    for r in rows:
        assert r["axis6_rights_access"] != "PASS", (
            f"span {r['span']}: axis6_rights_access must never read PASS while owner-attestation "
            f"is absent -- found {r['axis6_rights_access']!r}")
        if r["span"] != "0":
            assert r["axis4_forecast_required"] == "NOT_TESTED", (
                f"span {r['span']}: axis4_forecast_required must read NOT_TESTED this round "
                f"(forecast request was deliberately omitted) -- found {r['axis4_forecast_required']!r}")


def coverage_red_green_demo():
    """#485 correction v2 (validation/delivery section): the original version
    of this check used a literal string-substitution on the span-0 text,
    which broke the moment the span-0 wording changed (R1's correction away
    from "UNKNOWN_TIED"). Rewritten to mutate the parsed CSV ROW instead --
    robust to any future wording change, since it only ever touches the
    `axis1_geometry` field value, never the surrounding text.

    Also: Ripley's sandbox run of the original version failed under the OS
    default temp directory (a sandbox permission restriction, not a bug in
    the logic) -- this version uses a task-local temp directory instead
    (`../tmp/`, created here, removed again after use), never the system
    temp dir, and cleans up only the paths it itself created."""
    print("[4] coverage.csv cross-check -- expected-RED (corrupted copy) then GREEN (real file) ... ")
    real_path = os.path.join(ROOT, "coverage.csv")
    tmpdir = os.path.join(ROOT, "tmp", "validate-coverage-demo")
    os.makedirs(tmpdir, exist_ok=True)
    try:
        corrupt_path = os.path.join(tmpdir, "coverage-corrupted.csv")
        with open(real_path, encoding="utf-8") as f:
            reader = csv.DictReader(f)
            fieldnames = reader.fieldnames
            rows = list(reader)
        mutated = False
        for row in rows:
            if row["span"] == "0":
                assert row["axis1_geometry"] != "PASS", (
                    "test setup bug: span 0 axis1_geometry is already PASS in the real file")
                row["axis1_geometry"] = "PASS"
                mutated = True
        assert mutated, "test setup bug: span 0 row not found in coverage.csv"
        with open(corrupt_path, "w", encoding="utf-8", newline="") as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(rows)

        red_raised = False
        try:
            check_coverage(corrupt_path)
        except AssertionError as e:
            red_raised = True
            red_msg = str(e)
        if not red_raised:
            print("    RED  FAIL -- corrupted coverage.csv was NOT caught. Aborting with nonzero exit.")
            sys.exit(1)
        print(f"    RED  PASS: corrupted span-0 PASS value correctly rejected ({red_msg[:90]})")

        check_coverage(real_path)  # must NOT raise
        print("    GREEN PASS: the real coverage.csv passes every assertion cleanly")
    finally:
        shutil.rmtree(tmpdir, ignore_errors=True)
        parent = os.path.dirname(tmpdir)
        try:
            os.rmdir(parent)  # only removes it if now empty -- never touches a non-empty dir
        except OSError:
            pass


def main():
    self_check_midpoint()
    real_association_check()
    full_id_presence_check()
    coverage_red_green_demo()
    print("\nALL VALIDATION CHECKS PASS (exit 0). Any AssertionError above would have exited nonzero.")


if __name__ == "__main__":
    main()
