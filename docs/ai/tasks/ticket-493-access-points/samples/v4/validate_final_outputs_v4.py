#!/usr/bin/env python3
"""
#493 access-points v4 -- validator-closure round (I1-I6/AA1-AA6).
Reads the AUTHORITATIVE v3 outputs directly (place-access-status-v3.csv,
endpoint-candidates-v3.json, samples/v3/place-node-references-v3.json)
-- no fourth copy of the data tables, no import of build_access_points_v3.py.
Closes six gaps v3's own validator left open: (I1) required-field
enforcement on VALIDATED rows (not just "field present if we happen to
check it"); (I2) Borgarnes verified by its own empty-field contract,
not by name; (I3) full provenance/G4 coverage (all 7 G4 nodes, CRS/
source_field tied to the coordinate itself, missing-source-file
failure); (I4) role_divergence/record_source/coordinate_source/
direction_status defended against a retained-source derivation or a
frozen map, never against the file under test; (I5) stem classification
documented as a labelled limitation, not reclassified; (I6) wording
corrected elsewhere (evidence-v4.md/cc-report.md), not here. Offline
only -- no network, no import of the build script.
"""
import csv
import hashlib
import json
import re
from pathlib import Path

DEFAULT_TASK_DIR = Path(__file__).resolve().parent.parent.parent
DEFAULT_REPO_ROOT = DEFAULT_TASK_DIR.parent.parent.parent.parent
DEFAULT_NETWORK_DIR = DEFAULT_REPO_ROOT / "docs/ai/tasks/ticket-493-place-network"
DEFAULT_PHASE2_DIR = DEFAULT_REPO_ROOT / "docs/ai/tasks/ticket-493-place-data-phase2"
DEFAULT_TICKET493_DIR = DEFAULT_REPO_ROOT / "docs/ai/tasks/ticket-493"

VALID_CRS = {"EPSG:3057", "EPSG:4326"}
ISN93_BOX = {"x": (300000.0, 800000.0), "y": (300000.0, 650000.0)}
WGS84_IS_BOX = {"lat": (63.0, 67.0), "lon_w": (13.0, 25.0)}
COORD_TOL_M = 0.1
CUM_TOL_KM = 0.0001

REQUIRED_NONEMPTY_FOR_VALIDATED = [
    "road_connection", "coordinate_source", "node_role", "stored_field",
    "record_source", "reference_status", "role_divergence", "final_validation_outcome",
    "native_x", "native_y", "source_path", "source_hash_key", "piece_id", "source_field", "crs",
    "native_source_piece", "native_source_field",
    "cum_km_incl_1436", "cum_km_excl_1436", "direction_status", "notes",
]
REQUIRED_EMPTY_FOR_BORGARNES = ["node_role", "stored_field", "cum_km_incl_1436", "cum_km_excl_1436"]
REQUIRED_EMPTY_FOR_NO_NODE_OR_PAIR = ["node_role", "stored_field", "native_x", "native_y", "cum_km_incl_1436", "cum_km_excl_1436", "source_path", "source_hash_key", "piece_id", "source_field", "crs"]
VALIDATED_NAMES = {"Akureyri", "Egilsstaðir", "Vík", "Fáskrúðsfjörður", "Reyðarfjörður", "Reykjahlíð"}
PAIR_NAMES = {"Selfoss", "Hella", "Hvolsvöllur"}
DUAL_RECORD_PLACES = {"Selfoss": 2138, "Hella": 3591, "Hvolsvöllur": 3593}
PHASE1_EXIT_REFERENCE_PLACES = {"Vík": 3849, "Fáskrúðsfjörður": 2536, "Reyðarfjörður": 2520, "Reykjahlíð": 3566}
ROAD_COMPOUND_SUFFIXES = ("vegur", "braut", "stígur", "gata")


# ---------------------------------------------------------------------
# Independent suffix-sum (fresh implementation, not imported from
# build_access_points_v3.py or validate_final_outputs_v3.py)
# ---------------------------------------------------------------------

def suffix_sum_node(cw, idferill):
    steps = cw["steps"]
    S = cw["total_cost_m_incl_1436"]
    p1436 = cw["piece_1436_length_m"]

    def suffix(i):
        return sum(s["gap_into_m"] + s["piece_cost_m"] for s in steps[i:])

    for i, s in enumerate(steps):
        if s["idferill"] == idferill:
            entry_incl = S - suffix(i) + s["gap_into_m"]
            exit_incl = S - suffix(i + 1)
            return {
                "direction": s["direction"], "entry_coord": s["entry"], "exit_coord": s["exit"],
                "entry_cum_km_incl_1436": entry_incl / 1000, "entry_cum_km_excl_1436": (entry_incl - p1436) / 1000,
                "exit_cum_km_incl_1436": exit_incl / 1000, "exit_cum_km_excl_1436": (exit_incl - p1436) / 1000,
            }
    return None


def close(a, b, tol_m=COORD_TOL_M):
    return ((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2) ** 0.5 <= tol_m


def role_from_access_node_end(access_node_end, direction):
    if access_node_end not in ("end", "start"):
        return None, None
    stored_field = "END" if access_node_end == "end" else "START"
    if direction == "rev":
        node_role = "ENTRY" if stored_field == "END" else "EXIT"
    elif direction == "fwd":
        node_role = "ENTRY" if stored_field == "START" else "EXIT"
    else:
        node_role = None
    return node_role, stored_field


def expected_role_coord_stored_field_cum(cw, stored, idferill, role):
    node = suffix_sum_node(cw, idferill)
    assert node is not None, f"{idferill} not in cw_long"
    se = stored[idferill]
    if node["direction"] == "rev":
        role_coord = {"ENTRY": se["end"], "EXIT": se["start"]}
        role_stored_field = {"ENTRY": "END", "EXIT": "START"}
    else:
        role_coord = {"ENTRY": se["start"], "EXIT": se["end"]}
        role_stored_field = {"ENTRY": "START", "EXIT": "END"}
    role_cum = {"ENTRY": (node["entry_cum_km_incl_1436"], node["entry_cum_km_excl_1436"]), "EXIT": (node["exit_cum_km_incl_1436"], node["exit_cum_km_excl_1436"])}
    return role_coord[role], role_stored_field[role], role_cum[role]


def check_role_coord_cum_field(cw, stored, idferill, role, stored_field, coord, cum_incl, cum_excl):
    failures = []
    exp_coord, exp_stored_field, (exp_incl, exp_excl) = expected_role_coord_stored_field_cum(cw, stored, idferill, role)
    if not close(coord, exp_coord):
        failures.append("ROLE_COORD_MISMATCH")
    if stored_field != exp_stored_field:
        failures.append("STORED_FIELD_MISMATCH")
    if abs(cum_incl - exp_incl) > CUM_TOL_KM or abs(cum_excl - exp_excl) > CUM_TOL_KM:
        failures.append("ROLE_CUM_MISMATCH")
    return failures


def load_stored_endpoints(network_dir):
    out = {}
    with open(network_dir / "samples/road-links.csv", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            out[int(row["idferill"])] = {"start": [float(row["start_x"]), float(row["start_y"])], "end": [float(row["end_x"]), float(row["end_y"])]}
    return out


def load_phase1_inventory(network_dir):
    with open(network_dir / "place-inventory.csv", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))
    alias = {"Reykjavík (city core)": "Reykjavík", "Reykjahlíð (Mývatn)": "Reykjahlíð"}
    return {alias.get(r["name"], r["name"]): r for r in rows}


# ---------------------------------------------------------------------
# I3/AA3 -- provenance, now tied to the coordinate's own CRS/source_field
# ---------------------------------------------------------------------

def _in_box(coord, box):
    x, y = coord
    return box["x"][0] <= x <= box["x"][1] and box["y"][0] <= y <= box["y"][1]


def check_provenance_strict(repo_root, input_hashes_by_label, source_path, source_hash_key, crs, coord, expected_stored_field=None, is_wgs84=False):
    """coord: [x,y] for native, or [lat_deg_n, lon_deg_w] for WGS84.
    expected_stored_field: 'END'/'START'/None (role-less, e.g. WGS84).
    Accumulates every applicable failure (does not stop at the first),
    so a mutation that disturbs more than one invariant surfaces all
    of them -- a test only needs ONE of its expected IDs to appear."""
    if coord is None:
        return []
    failures = []
    if not source_path or not source_hash_key or not crs:
        return ["PROVENANCE_MISSING"]
    entry = input_hashes_by_label.get(source_hash_key)
    if entry is None:
        return ["PROVENANCE_HASH_KEY_INVALID"]
    if entry["path"] != source_path:
        failures.append("PROVENANCE_PATH_MISMATCH")
    live_path = repo_root / source_path
    if not live_path.exists():
        failures.append("PROVENANCE_SOURCE_FILE_MISSING")
    else:
        live_sha = hashlib.sha256(live_path.read_bytes()).hexdigest()
        if live_sha != entry["sha256"]:
            failures.append("PROVENANCE_HASH_KEY_INVALID")
    if crs not in VALID_CRS:
        failures.append("PROVENANCE_CRS_INVALID")
    elif is_wgs84:
        if crs != "EPSG:4326":
            failures.append("PROVENANCE_CRS_INVALID")
        else:
            lat, lon_w = coord
            if not (WGS84_IS_BOX["lat"][0] <= lat <= WGS84_IS_BOX["lat"][1] and WGS84_IS_BOX["lon_w"][0] <= lon_w <= WGS84_IS_BOX["lon_w"][1]):
                failures.append("PROVENANCE_CRS_INVALID")
    else:
        if crs != "EPSG:3057":
            failures.append("PROVENANCE_CRS_INVALID")
        elif not _in_box(coord, ISN93_BOX):
            failures.append("PROVENANCE_CRS_INVALID")
    return failures


def check_source_field(source_field, expected_stored_field, is_wgs84=False):
    if is_wgs84:
        return [] if (source_field and "pars" in source_field.lower()) else ["PROVENANCE_SOURCE_FIELD_MISMATCH"]
    if expected_stored_field is None:
        return []
    expected_prefix = "end" if expected_stored_field == "END" else "start"
    return [] if (source_field or "").lower().startswith(expected_prefix) else ["PROVENANCE_SOURCE_FIELD_MISMATCH"]


# ---------------------------------------------------------------------
# I3/AA3 -- independent G4 tier-length recomputation (fresh impl.)
# ---------------------------------------------------------------------

ORDER93 = [2344, 3410, 3409, 2894, 2892, 2891]


def _dist(a, b):
    return ((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2) ** 0.5


def _planar_len(coords):
    return sum(_dist(coords[i][:2], coords[i + 1][:2]) for i in range(len(coords) - 1))


def make_cum93_fn(wfs93_raw):
    by_tier = {}
    for f in wfs93_raw["features"]:
        p = f["properties"]
        by_tier.setdefault(p["IDFERILL"], {})[p["NAKVAEMNIFERLIS"]] = f

    def cum93_at(tier, upto_idferill, role):
        cum = 0.0
        for i, idf in enumerate(ORDER93):
            coords = by_tier[idf][tier]["geometry"]["coordinates"]
            if i > 0:
                prev_coords = by_tier[ORDER93[i - 1]][tier]["geometry"]["coordinates"]
                cum += _dist(prev_coords[-1][:2], coords[0][:2])
            if idf == upto_idferill and role == "start":
                return cum
            cum += _planar_len(coords)
            if idf == upto_idferill and role == "end":
                return cum
        raise AssertionError(f"{upto_idferill}/{role} not found in road-93 order")
    return by_tier, cum93_at


def check_g4_node(node, by_tier, cum93_at, cw, stored):
    failures = []
    idferill, role = node["idferill"], node["role"]
    if idferill == 2345:
        exp_coord = stored[2345]["end"]
        if not close(node["coord"], exp_coord):
            failures.append("G4_COORD_MISMATCH")
        exp_ring = suffix_sum_node(cw, 2345)
        exp_incl, exp_excl = exp_ring["entry_cum_km_incl_1436"], exp_ring["entry_cum_km_excl_1436"]
        if abs(node["ring_cum_km_incl_1436"] - exp_incl) > CUM_TOL_KM or abs(node["ring_cum_km_excl_1436"] - exp_excl) > CUM_TOL_KM:
            failures.append("G4_CUM_MISMATCH")
        if node["cum_km_tier_minus1"] != 0.0 or node["cum_km_tier_2"] != 0.0 or node.get("origin_marked") is not True:
            failures.append("G4_CUM_MISMATCH")
        return failures
    tier_feature = by_tier[idferill][-1]
    coords = tier_feature["geometry"]["coordinates"]
    exp_coord = coords[0][:2] if role == "start" else coords[-1][:2]
    if not close(node["coord"], exp_coord):
        failures.append("G4_COORD_MISMATCH")
    exp_t_minus1 = cum93_at(-1, idferill, role) / 1000
    exp_t_2 = cum93_at(2, idferill, role) / 1000
    if abs(node["cum_km_tier_minus1"] - exp_t_minus1) > CUM_TOL_KM or abs(node["cum_km_tier_2"] - exp_t_2) > CUM_TOL_KM:
        failures.append("G4_CUM_MISMATCH")
    return failures


# ---------------------------------------------------------------------
# I4/AA2 -- derived / frozen columns
# ---------------------------------------------------------------------

def derive_record_source_coordsource_divergence(name, phase1_by_name, cw):
    if name in DUAL_RECORD_PLACES:
        return {"record_source": "PHASE1_AND_PHASE2_PAIR", "coordinate_source": "RETAINED_GEOMETRY", "role_divergence": "NONE"}
    if name == "Akureyri":
        return {"record_source": "OWNER_APPROVED", "coordinate_source": "OWNER_APPROVED_RETAINED", "role_divergence": "NONE"}
    if name == "Egilsstaðir":
        p1 = phase1_by_name["Egilsstaðir"]
        node = suffix_sum_node(cw, 2345)
        p1_role, _ = role_from_access_node_end(p1["access_node_end"], node["direction"])
        return {"record_source": "PHASE2_V3_NODE", "coordinate_source": "RETAINED_GEOMETRY", "role_divergence": "ROLE_SOURCE_DIVERGENCE" if p1_role != "ENTRY" else "NONE"}
    if name == "Borgarnes" or name in PHASE1_EXIT_REFERENCE_PLACES:
        return {"record_source": "PHASE1_ACCESS_NODE_END", "coordinate_source": "RETAINED_GEOMETRY", "role_divergence": "NONE"}
    if name in ("Reykjavík", "Seyðisfjörður"):
        return {"record_source": "", "coordinate_source": "NO_COORDINATE_SOURCE", "role_divergence": "NONE"}
    p1 = phase1_by_name.get(name)
    if p1 is not None and p1["access_node_idferill"] not in ("NONE", "", None):
        idf = int(p1["access_node_idferill"])
        if suffix_sum_node(cw, idf) is not None:
            return {"record_source": "PHASE1_ACCESS_NODE_END", "coordinate_source": "RETAINED_GEOMETRY", "role_divergence": "NONE"}
    return {"record_source": "", "coordinate_source": "NO_COORDINATE_SOURCE", "role_divergence": "NONE"}


def derive_reference_record(place, role, phase1_by_name, cw):
    idf = DUAL_RECORD_PLACES[place]
    p1 = phase1_by_name[place]
    node = suffix_sum_node(cw, idf)
    p1_role, _ = role_from_access_node_end(p1["access_node_end"], node["direction"])
    if role == "ENTRY":
        return {"record_source": "PHASE1_ACCESS_NODE_END", "role_divergence": "NONE"}
    return {"record_source": "PHASE2_V3_NODE", "role_divergence": "ROLE_SOURCE_DIVERGENCE" if p1_role != "EXIT" else "NONE"}


def load_direction_status_frozen_map(task_dir):
    p = task_dir / "samples/v4/direction_status_frozen_map.json"
    data = p.read_bytes()
    live_sha = hashlib.sha256(data).hexdigest()
    expected_sha = "be5466db74a832597387f2abdfbe505d654b88c9e7c837663122b9deeeae34c0"
    assert live_sha == expected_sha, f"direction_status_frozen_map.json has drifted from its registered sha256 ({live_sha} != {expected_sha}) -- refusing to use as a validation lock"
    return json.loads(data)


# ---------------------------------------------------------------------
# I5/AA6(d) -- "7 of 15" informative-compound analysis (read-only)
# ---------------------------------------------------------------------

def compute_7_of_15(stem_hints):
    informative = []
    for name, v in stem_hints.items():
        bare = name
        for m in v["matches"]:
            tok = m["matched_token"]
            if tok.endswith(ROAD_COMPOUND_SUFFIXES) and len(tok) > len(bare):
                informative.append(m)
    swallowed_by_rule1 = [m for m in informative if m["mention_category"] == "HOME_PIECE_OR_ROUTE_ENDPOINT"]
    correctly_rule2 = [m for m in informative if m["mention_category"] == "ROAD_NAME_COMPOUND_MENTION"]
    return {"informative_compound_count": len(informative), "swallowed_by_rule1_count": len(swallowed_by_rule1), "correctly_rule2_count": len(correctly_rule2)}


# ---------------------------------------------------------------------
# I1/AA1 -- required-field checks
# ---------------------------------------------------------------------

def check_validated_row_required_fields(row):
    for field in REQUIRED_NONEMPTY_FOR_VALIDATED:
        if not row.get(field):
            return ["VALIDATED_ROW_MISSING_REQUIRED_FIELD"]
    return []


def check_borgarnes_required_empty(row):
    failures = []
    for field in REQUIRED_EMPTY_FOR_BORGARNES:
        if row.get(field):
            failures.append("BORGARNES_FIELD_NOT_EMPTY")
            break
    if row.get("final_validation_outcome") != "NOT_VALIDATED_OUTSIDE_CW_LONG":
        failures.append("BORGARNES_FIELD_NOT_EMPTY")
    if not ("ccw_short" in row.get("notes", "") or "cw_long" in row.get("notes", "")):
        failures.append("BORGARNES_FIELD_NOT_EMPTY")
    return failures


def check_no_node_or_pair_required_empty(row):
    for field in REQUIRED_EMPTY_FOR_NO_NODE_OR_PAIR:
        if row.get(field):
            return ["NO_NODE_OR_PAIR_FIELD_NOT_EMPTY"]
    return []


# ---------------------------------------------------------------------
# Main run()
# ---------------------------------------------------------------------

def run(task_dir=None, network_dir=None, repo_root=None, phase2_dir=None, ticket493_dir=None, verbose=True):
    task_dir = Path(task_dir) if task_dir else DEFAULT_TASK_DIR
    network_dir = Path(network_dir) if network_dir else DEFAULT_NETWORK_DIR
    repo_root = Path(repo_root) if repo_root else DEFAULT_REPO_ROOT
    phase2_dir = Path(phase2_dir) if phase2_dir else DEFAULT_PHASE2_DIR
    ticket493_dir = Path(ticket493_dir) if ticket493_dir else DEFAULT_TICKET493_DIR

    src = Path(__file__).read_text(encoding="utf-8")
    forbidden = {"socket", "http", "urllib", "requests", "ssl"}
    used = {m for m in forbidden if re.search(rf"^\s*(import {m}\b|from {m}\b)", src, re.MULTILINE)}
    assert not used, f"forbidden import(s): {used}"
    assert not re.search(r"^\s*(import|from)\s+build_access_points_v3\b", src, re.MULTILINE), "v4 validator must not import the build script"
    assert not re.search(r"^\s*(import|from)\s+validate_final_outputs_v3\b", src, re.MULTILINE), "v4 validator must be self-contained, not import v3's own validator"
    if verbose:
        print("static import check: PASS (no network, no build-script import, no v3-validator import)")

    cw = json.loads((network_dir / "samples/chain-walks-v4.json").read_bytes())["cw_long"]
    stored = load_stored_endpoints(network_dir)
    phase1_by_name = load_phase1_inventory(network_dir)
    input_hashes = json.loads((task_dir / "samples/v3/input_hashes_v3.json").read_bytes())
    input_hashes_by_label = {h["label"]: h for h in input_hashes}
    direction_status_map = load_direction_status_frozen_map(task_dir)

    failures = []  # list of (location, [check_ids])

    def fail(location, check_ids):
        if check_ids:
            failures.append((location, check_ids))

    # ---- Main CSV: 72 rows ----
    with open(task_dir / "place-access-status-v3.csv", encoding="utf-8") as f:
        csv_rows = list(csv.DictReader(f))
    assert len(csv_rows) == 72, f"expected 72 rows, got {len(csv_rows)}"

    outcome_counts = {"VALIDATED": 0, "NOT_VALIDATED_OUTSIDE_CW_LONG": 0, "NO_NODE": 0, "PAIR_REFERENCE": 0}
    blank_field_test_surface = 0
    coverage_coords_found = []
    any_required_field_failure = False  # a VALIDATED row's own required-field contract, or Borgarnes/NO_NODE/PAIR's own required-empty contract, was already violated -- the row-count-based assertions below (distribution, coverage) are skipped as redundant for this run, not bypassed; the violation itself is already recorded in `failures`.

    for r in csv_rows:
        name = r["name"]
        outcome_counts[r["final_validation_outcome"]] = outcome_counts.get(r["final_validation_outcome"], 0) + 1

        if name in VALIDATED_NAMES:
            blank_field_test_surface += len(REQUIRED_NONEMPTY_FOR_VALIDATED)
            required_field_failures = check_validated_row_required_fields(r)
            fail(f"csv:{name}:required_fields", required_field_failures)
            if required_field_failures:
                # AA1: a VALIDATED row missing a required field fails HERE,
                # cleanly, with its own check-ID -- it must never fall
                # through into the downstream checks below (which assume
                # the fields are populated) and crash with an unbound
                # exception; a blank field is a found defect, not a reason
                # to skip checking.
                any_required_field_failure = True
                coverage_coords_found.append(f"csv:{name}")
                continue
            idf = int(r["piece_id"])
            coord = [float(r["native_x"]), float(r["native_y"])]
            fail(f"csv:{name}:role_coord_cum", check_role_coord_cum_field(cw, stored, idf, r["node_role"], r["stored_field"], coord, float(r["cum_km_incl_1436"]), float(r["cum_km_excl_1436"])))
            fail(f"csv:{name}:provenance", check_provenance_strict(repo_root, input_hashes_by_label, r["source_path"], r["source_hash_key"], r["crs"], coord))
            fail(f"csv:{name}:source_field", check_source_field(r["source_field"], r["stored_field"]))
            coverage_coords_found.append(f"csv:{name}")
        elif name == "Borgarnes":
            borgarnes_failures = check_borgarnes_required_empty(r)
            fail("csv:Borgarnes:required_empty", borgarnes_failures)
            if borgarnes_failures:
                any_required_field_failure = True
                coverage_coords_found.append("csv:Borgarnes")
                continue
            coord = [float(r["native_x"]), float(r["native_y"])]
            fail("csv:Borgarnes:provenance", check_provenance_strict(repo_root, input_hashes_by_label, r["source_path"], r["source_hash_key"], r["crs"], coord))
            fail("csv:Borgarnes:source_field", check_source_field(r["source_field"], r["stored_field"] or "END"))
            coverage_coords_found.append("csv:Borgarnes")
        else:
            no_node_failures = check_no_node_or_pair_required_empty(r)
            fail(f"csv:{name}:required_empty", no_node_failures)
            if no_node_failures:
                any_required_field_failure = True

        # AA2 derived/frozen columns, every one of the 72 rows
        derived = derive_record_source_coordsource_divergence(name, phase1_by_name, cw)
        if r["record_source"] != derived["record_source"]:
            fail(f"csv:{name}:record_source", ["RECORD_SOURCE_MISMATCH"])
        if r["coordinate_source"] != derived["coordinate_source"]:
            fail(f"csv:{name}:coordinate_source", ["COORDINATE_SOURCE_MISMATCH"])
        if r["role_divergence"] != derived["role_divergence"]:
            fail(f"csv:{name}:role_divergence", ["ROLE_DIVERGENCE_MISMATCH"])
        expected_dstatus = direction_status_map.get(name)
        if r["direction_status"] != expected_dstatus:
            fail(f"csv:{name}:direction_status", ["DIRECTION_STATUS_MISMATCH"])

    if any_required_field_failure:
        # A VALIDATED row was already found missing a required field (and
        # recorded in `failures` with its own check-ID above); the blank
        # value may also have corrupted this tally (e.g. an empty
        # final_validation_outcome), so the strict distribution/name-set
        # assertions below are skipped as redundant, not bypassed -- the
        # run still fails via `failures` at the end of this function.
        pass
    else:
        assert sum(outcome_counts.values()) == 72, outcome_counts
        assert outcome_counts == {"VALIDATED": 6, "NOT_VALIDATED_OUTSIDE_CW_LONG": 1, "NO_NODE": 62, "PAIR_REFERENCE": 3}, outcome_counts
        validated_rows_found = {r["name"] for r in csv_rows if r["final_validation_outcome"] == "VALIDATED"}
        assert validated_rows_found == VALIDATED_NAMES, (validated_rows_found, VALIDATED_NAMES)
    if verbose:
        print(f"main CSV: 72 rows checked, outcome distribution {outcome_counts} matches pre-registered 6/1/62/3, VALIDATED name set matches pre-registered set. Blank-field test surface: {blank_field_test_surface} (6 rows x {len(REQUIRED_NONEMPTY_FOR_VALIDATED)} fields).")

    # ---- place-node-references-v3.json: 6 records ----
    refs = json.loads((task_dir / "samples/v3/place-node-references-v3.json").read_bytes())
    ref_count = 0
    for place, recs in refs.items():
        for rec in recs:
            fail(f"reference:{place}:{rec['node_role']}:role_coord_cum", check_role_coord_cum_field(cw, stored, rec["idferill"], rec["node_role"], rec["stored_field"], rec["coord"], rec["cum_km_incl_1436"], rec["cum_km_excl_1436"]))
            fail(f"reference:{place}:{rec['node_role']}:provenance", check_provenance_strict(repo_root, input_hashes_by_label, rec.get("source_path"), rec.get("source_hash_key"), rec.get("crs"), rec["coord"]))
            fail(f"reference:{place}:{rec['node_role']}:source_field", check_source_field(rec.get("source_field"), rec["stored_field"]))
            derived_ref = derive_reference_record(place, rec["node_role"], phase1_by_name, cw)
            if rec["record_source"] != derived_ref["record_source"]:
                fail(f"reference:{place}:{rec['node_role']}:record_source", ["RECORD_SOURCE_MISMATCH"])
            if rec["role_divergence"] != derived_ref["role_divergence"]:
                fail(f"reference:{place}:{rec['node_role']}:role_divergence", ["ROLE_DIVERGENCE_MISMATCH"])
            ref_count += 1
            coverage_coords_found.append(f"reference:{place}:{rec['node_role']}")
    assert ref_count == 6, ref_count
    if verbose:
        print(f"place-node-references-v3.json: {ref_count} records checked (role/coord/cum/stored_field/provenance/record_source/role_divergence).")

    # ---- endpoint-candidates-v3.json ----
    ec = json.loads((task_dir / "endpoint-candidates-v3.json").read_bytes())
    wfs93 = json.loads((phase2_dir / "samples/wfs93-raw.json").read_bytes())
    by_tier, cum93_at = make_cum93_fn(wfs93)

    g4_nodes = ec["egilsstadir_seydisfjordur"]["nodes"]
    assert len(g4_nodes) == 7
    for node in g4_nodes:
        fail(f"g4:{node['idferill']}:{node['role']}:geometry", check_g4_node(node, by_tier, cum93_at, cw, stored))
        if node["idferill"] == 2345:
            fail(f"g4:{node['idferill']}:{node['role']}:provenance", check_provenance_strict(repo_root, input_hashes_by_label, node.get("source_path"), node.get("source_hash_key"), node.get("crs"), node["coord"]))
            fail(f"g4:{node['idferill']}:{node['role']}:source_field", check_source_field(node.get("source_field"), "END"))
        else:
            fail(f"g4:{node['idferill']}:{node['role']}:provenance", check_provenance_strict(repo_root, input_hashes_by_label, node.get("source_path"), node.get("source_hash_key"), node.get("crs"), node["coord"]))
        coverage_coords_found.append(f"g4:{node['idferill']}:{node['role']}")
    if verbose:
        print(f"endpoint-candidates-v3.json: all 7 G4 nodes independently re-derived (fresh cum93_at(), not imported) and provenance-checked.")

    ak = ec["akureyri"]
    exp_coord, exp_sf, _ = expected_role_coord_stored_field_cum(cw, stored, 3876, "EXIT")
    if not close(ak["coord"], exp_coord):
        fail("akureyri:native:coord", ["ROLE_COORD_MISMATCH"])
    fail("akureyri:native:provenance", check_provenance_strict(repo_root, input_hashes_by_label, ak.get("source_path"), ak.get("source_hash_key"), ak.get("crs"), ak["coord"]))
    coverage_coords_found.append("akureyri:native")

    decision_text = (ticket493_dir / "akureyri-endpoint-decision.md").read_text(encoding="utf-8")
    m = re.search(r"(\d+\.\d+)\s*°\s*N,\s*(\d+\.\d+)\s*°\s*V", decision_text)
    assert m, "could not parse Akureyri WGS84 from decision text"
    parsed_lat, parsed_lon = float(m.group(1)), float(m.group(2))
    wgs = ak["wgs84"]
    if abs(parsed_lat - wgs["lat_deg_n"]) > 1e-9 or abs(parsed_lon - wgs["lon_deg_w"]) > 1e-9:
        fail("akureyri:wgs84:value", ["AKUREYRI_WGS84_MISMATCH"])
    fail("akureyri:wgs84:provenance", check_provenance_strict(repo_root, input_hashes_by_label, wgs.get("source_path"), wgs.get("source_hash_key"), wgs.get("crs"), [wgs["lat_deg_n"], wgs["lon_deg_w"]], is_wgs84=True))
    fail("akureyri:wgs84:source_field", check_source_field(wgs.get("source_field"), None, is_wgs84=True))
    coverage_coords_found.append("akureyri:wgs84")
    if verbose:
        print("Akureyri native + WGS84 pair independently re-validated (coord, value, provenance, CRS/source_field).")

    rj = ec["reykjavik"]
    for leg_key, role in (("short_western_leg_ENTRY_stored_END", "ENTRY"), ("long_eastern_leg_EXIT_stored_START", "EXIT"), ("raudavatn_candidate_ENTRY_stored_END", "ENTRY"), ("raudavatn_candidate_EXIT_stored_START", "EXIT")):
        leg = rj[leg_key]
        fail(f"reykjavik:{leg_key}:role_coord_cum", check_role_coord_cum_field(cw, stored, 1436, role, leg["stored_field"], leg["coord"], leg["cum_offset_km_incl_1436"], leg["cum_offset_km_excl_1436"]))
        fail(f"reykjavik:{leg_key}:provenance", check_provenance_strict(repo_root, input_hashes_by_label, leg.get("source_path"), leg.get("source_hash_key"), leg.get("crs"), leg["coord"]))
        fail(f"reykjavik:{leg_key}:source_field", check_source_field(leg.get("source_field"), leg["stored_field"]))
        coverage_coords_found.append(f"reykjavik:{leg_key}")
    assert "raudavatn_comparison_anchor" not in rj
    if verbose:
        print("Reykjavik legs + both Rauðavatn candidates independently re-validated.")

    # ---- AA4: generic coverage walk -- every coord in the outputs must be one we specifically checked ----
    def walk_coords(obj, path="$"):
        found = []
        if isinstance(obj, dict):
            if "coord" in obj and obj["coord"] is not None:
                found.append(path)
            if "lat_deg_n" in obj and "lon_deg_w" in obj and obj["lat_deg_n"] is not None and obj["lon_deg_w"] is not None:
                found.append(f"{path}.wgs84_pair")
            for k, v in obj.items():
                if k == "coord":
                    continue
                found += walk_coords(v, f"{path}.{k}")
        elif isinstance(obj, list):
            for i, v in enumerate(obj):
                found += walk_coords(v, f"{path}[{i}]")
        return found

    generic_json_coords = walk_coords(ec) + walk_coords(refs)
    csv_coord_rows = [r["name"] for r in csv_rows if r["native_x"]]
    total_found = len(generic_json_coords) + len(csv_coord_rows)
    total_checked = len(coverage_coords_found)
    if any_required_field_failure:
        # A required-field failure already blanked a coordinate column on
        # a VALIDATED row (e.g. native_x) -- the 26-pair coverage count is
        # necessarily off by exactly that row and is not re-asserted here;
        # the run still fails via `failures` (the required-field check-ID
        # already recorded above), not via this unrelated count mismatch.
        pass
    else:
        assert total_found == 26, f"AA4 coverage: generic walk found {total_found} non-null coordinate pairs, expected 26 -- {generic_json_coords}, csv rows={csv_coord_rows}"
        assert total_checked == 26, f"AA4 coverage: only {total_checked} coordinate pairs were specifically checked, expected 26: {coverage_coords_found}"
    if verbose:
        print(f"AA4 coverage: generic walk found {total_found} non-null coordinate pairs; {total_checked} were specifically checked -- equal, nothing unchecked.")

    # ---- v1-verbatim negative tests (kept from v2/v3) ----
    baseline = json.loads((task_dir / "samples/v3/v1_v2_and_input_baseline.json").read_bytes())

    def baseline_sha(suffix):
        return next(x["sha256"] for x in baseline if x["path"].endswith(suffix))

    v1_csv_path = task_dir / "place-access-status.csv"
    assert hashlib.sha256(v1_csv_path.read_bytes()).hexdigest() == baseline_sha("ticket-493-access-points/place-access-status.csv")
    with open(v1_csv_path, encoding="utf-8") as f:
        v1_rows = {row["name"]: row for row in csv.DictReader(f)}
    v1_selfoss = v1_rows["Selfoss"]
    v1_coord = [float(v1_selfoss["native_x"]), float(v1_selfoss["native_y"])]
    v1fails = check_role_coord_cum_field(cw, stored, 2138, "ENTRY", "END", v1_coord, float(v1_selfoss["cum_km_incl_1436"]), float(v1_selfoss["cum_km_excl_1436"]))
    assert "ROLE_CUM_MISMATCH" in v1fails, f"v1-verbatim negative test 1 should fail ROLE_CUM_MISMATCH, got {v1fails}"
    if verbose:
        print(f"v1-verbatim negative test 1 PASS: {v1fails}")

    v1_ec_path = task_dir / "endpoint-candidates.json"
    assert hashlib.sha256(v1_ec_path.read_bytes()).hexdigest() == baseline_sha("ticket-493-access-points/endpoint-candidates.json")
    v1_ec = json.loads(v1_ec_path.read_bytes())
    node1436 = suffix_sum_node(cw, 1436)
    v1_short, v1_long = v1_ec["reykjavik"]["short_western_leg"], v1_ec["reykjavik"]["long_eastern_leg"]
    short_wrong = abs(v1_short["cum_offset_km_incl_1436"] - node1436["entry_cum_km_incl_1436"]) > CUM_TOL_KM
    long_wrong = abs(v1_long["cum_offset_km_incl_1436"] - node1436["exit_cum_km_incl_1436"]) > CUM_TOL_KM
    assert short_wrong and long_wrong, "v1-verbatim negative test 2 should both mismatch"
    if verbose:
        print("v1-verbatim negative test 2 PASS.")

    if failures:
        raise AssertionError(f"FINAL OUTPUT VALIDATION FAILED ({len(failures)} location(s)): {failures}")

    result = {"rows_checked": 72, "outcome_counts": outcome_counts, "reference_records_checked": ref_count, "coverage_total": total_checked, "blank_field_test_surface": blank_field_test_surface}
    if verbose:
        print(f"\nALL FINAL-OUTPUT VALIDATION CHECKS PASSED (72 rows, {ref_count} references, 7 G4 nodes, Akureyri native+WGS84, Reykjavík+Rauðavatn, {total_checked} coordinate pairs, 2 v1-verbatim negative tests).")
    return result


if __name__ == "__main__":
    run()
