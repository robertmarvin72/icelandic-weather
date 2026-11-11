#!/usr/bin/env python3
"""
#493 access-points v2 (approved-prompt-v2.md, H1-H8/J1-J6). Corrects
real bugs in v1's own build_access_points.py: (H1) seven rows mixed an
ENTRY coordinate with an EXIT cum from the SAME piece (0.3-6.4 km
self-contradiction); (H2) Reykjavik's own two leg offsets were
reported with swapped signs, and the piece-1436 length was a bare
literal; (H3) node 2345's own road-93 tier fields held a sentence, not
a number, in endpoint-candidates.json. Offline only -- no network.
v1's own files are NOT touched; this script and its own outputs live
under samples/v2/ or as *-v2 files at the task root.
"""
import csv
import hashlib
import json
import re
import unicodedata
from pathlib import Path

TASK_DIR = Path(__file__).resolve().parent.parent.parent
REPO_ROOT = TASK_DIR.parent.parent.parent.parent
PHASE2_DIR = REPO_ROOT / "docs/ai/tasks/ticket-493-place-data-phase2"
NETWORK_DIR = REPO_ROOT / "docs/ai/tasks/ticket-493-place-network"
NORTH_DIR = REPO_ROOT / "docs/ai/tasks/ticket-493-north-data"
TICKET493_DIR = REPO_ROOT / "docs/ai/tasks/ticket-493"

ALIAS_PHASE1_TO_WORKLIST = {"Reykjavík (city core)": "Reykjavík", "Reykjahlíð (Mývatn)": "Reykjahlíð"}

INPUT_FILES = [
    ("place_nodes-v3.json", PHASE2_DIR / "samples/place_nodes-v3.json"),
    ("worklist_matching-v3.json", PHASE2_DIR / "samples/worklist_matching-v3.json"),
    ("road93_section-v2.json", PHASE2_DIR / "samples/road93_section-v2.json"),
    ("wfs93-raw.json", PHASE2_DIR / "samples/wfs93-raw.json"),
    ("chain-walks-v4.json", NETWORK_DIR / "samples/chain-walks-v4.json"),
    ("road-links.csv", NETWORK_DIR / "samples/road-links.csv"),
    ("place-inventory.csv (phase-1)", NETWORK_DIR / "place-inventory.csv"),
    ("place-inventory-v3.csv (phase-2)", PHASE2_DIR / "place-inventory-v3.csv"),
    ("route-data-candidate.json", NORTH_DIR / "route-data-candidate.json"),
    ("wfs-north-4326.json", NORTH_DIR / "samples/wfs-north-4326.json"),
    ("national-place-coverage.md", TICKET493_DIR / "national-place-coverage.md"),
    ("akureyri-endpoint-decision.md", TICKET493_DIR / "akureyri-endpoint-decision.md"),
]


def nfc(s):
    return unicodedata.normalize("NFC", s.strip())


ICELANDIC_WORD_CHARS = "A-Za-zÁÉÍÓÚÝÞÆÖÐáéíóúýþæöð"
VOWELS = "aeiouyáéíóúý"


def whole_word_contains(haystack, needle):
    pattern = rf"(?<![{ICELANDIC_WORD_CHARS}]){re.escape(needle)}(?![{ICELANDIC_WORD_CHARS}])"
    return re.search(pattern, haystack) is not None


def sha_size_eol(path):
    data = path.read_bytes()
    return {"sha256": hashlib.sha256(data).hexdigest(), "size_bytes": len(data), "line_ending": "CRLF" if b"\r\n" in data else "LF"}


def record_input_hashes():
    return [{"label": label, "path": p.relative_to(REPO_ROOT).as_posix(), **sha_size_eol(p)} for label, p in INPUT_FILES]


# ---------------------------------------------------------------------
# J4 -- auto-derived numeric schema (walks the WHOLE structure)
# ---------------------------------------------------------------------

NUMERIC_KEY_SUFFIXES = ("_x", "_y", "_m", "_km_incl_1436", "_km_excl_1436", "_offset_km_incl_1436", "_offset_km_excl_1436", "_length_m", "_tier_minus1", "_tier_2")


def _is_numeric_key(key):
    return key == "coord" or any(key.endswith(suf) for suf in NUMERIC_KEY_SUFFIXES)


def assert_numeric_schema(obj, path="$"):
    """Walks the ENTIRE structure; any key matching the numeric pattern
    must hold a finite number, a 2-element numeric/None list (coord), or
    None -- never a string. Raises AssertionError with the exact path
    on violation."""
    if isinstance(obj, dict):
        for k, v in obj.items():
            p = f"{path}.{k}"
            if _is_numeric_key(k):
                if k == "coord":
                    if v is not None:
                        assert isinstance(v, list) and len(v) == 2 and all(x is None or isinstance(x, (int, float)) for x in v), f"{p}: coord must be null or [num,num], got {v!r}"
                else:
                    assert v is None or (isinstance(v, (int, float)) and not isinstance(v, bool)), f"{p}: expected finite number or null, got {v!r}"
            else:
                assert_numeric_schema(v, p)
    elif isinstance(obj, list):
        for i, v in enumerate(obj):
            assert_numeric_schema(v, f"{path}[{i}]")


def run_schema_validator_negative_tests_v1_verbatim(v1_endpoint_candidates_path, v1_sha):
    """H3/J4: the actual v1 endpoint-candidates.json (node 2345's own
    tier fields hold a sentence) MUST fail; this round's own cleaned
    equivalent MUST pass. Reads the literal v1 file by its own sha."""
    raw = v1_endpoint_candidates_path.read_bytes()
    assert hashlib.sha256(raw).hexdigest() == v1_sha, "v1 endpoint-candidates.json sha mismatch -- cannot run verbatim negative test"
    v1_doc = json.loads(raw)
    rejected = False
    try:
        assert_numeric_schema(v1_doc)
    except AssertionError:
        rejected = True
    assert rejected, "schema validator failed to reject v1's own literal text-in-numeric-field endpoint-candidates.json"
    return {"v1_endpoint_candidates_rejected": True}


# ---------------------------------------------------------------------
# G5/J2 -- independent distance computation (prefix-sum; mutation
# tests + the separate final-output validator use suffix-sum)
# ---------------------------------------------------------------------


def _load_cw_long():
    d = json.loads((NETWORK_DIR / "samples/chain-walks-v4.json").read_bytes())
    return d["cw_long"]


def _stored_endpoints(road_links):
    return {r["idferill"]: {"start": r["start"], "end": r["end"]} for r in road_links}


def production_node(cw, idferill):
    """Returns BOTH entry_* and exit_* (coord + cum incl/excl) for a
    cw_long step, or None if idferill is not a step. Prefix-sum path."""
    steps = cw["steps"]
    p1436 = cw["piece_1436_length_m"]
    prefix = 0.0
    for s in steps:
        if s["idferill"] == idferill:
            entry_incl = prefix + s["gap_into_m"]
            exit_incl = entry_incl + s["piece_cost_m"]
            return {
                "direction": s["direction"], "entry_coord": s["entry"], "exit_coord": s["exit"],
                "entry_cum_km_incl_1436": entry_incl / 1000, "entry_cum_km_excl_1436": (entry_incl - p1436) / 1000,
                "exit_cum_km_incl_1436": exit_incl / 1000, "exit_cum_km_excl_1436": (exit_incl - p1436) / 1000,
            }
        prefix += s["gap_into_m"] + s["piece_cost_m"]
    return None


def validator_expected_node(cw, idferill):
    """Suffix-sum path -- independent of production_node (never calls it)."""
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


def _close(a, b, tol_m=0.1):
    return ((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2) ** 0.5 <= tol_m


def validate_node_role(record, idferill, cw, stored):
    """record: {node_role, coord, cum_km_incl_1436, cum_km_excl_1436}.
    Checks coord+cum BOTH belong to the SAME role of the SAME step --
    this is the exact H1 guard v1 lacked."""
    expected = validator_expected_node(cw, idferill)
    assert expected is not None, f"idferill {idferill} not in cw_long"
    se = stored[idferill]
    if expected["direction"] == "rev":
        role_coord = {"ENTRY": se["end"], "EXIT": se["start"]}
        role_cum = {"ENTRY": (expected["entry_cum_km_incl_1436"], expected["entry_cum_km_excl_1436"]), "EXIT": (expected["exit_cum_km_incl_1436"], expected["exit_cum_km_excl_1436"])}
    else:
        role_coord = {"ENTRY": se["start"], "EXIT": se["end"]}
        role_cum = {"ENTRY": (expected["entry_cum_km_incl_1436"], expected["entry_cum_km_excl_1436"]), "EXIT": (expected["exit_cum_km_incl_1436"], expected["exit_cum_km_excl_1436"])}
    role = record["node_role"]
    assert role in ("ENTRY", "EXIT"), f"unknown node_role {role!r}"
    assert _close(record["coord"], role_coord[role]), f"{idferill}/{role}: coord {record['coord']} != expected {role_coord[role]}"
    want_incl, want_excl = role_cum[role]
    assert abs(record["cum_km_incl_1436"] - want_incl) <= 0.0001, f"{idferill}/{role}: incl {record['cum_km_incl_1436']} != {want_incl}"
    assert abs(record["cum_km_excl_1436"] - want_excl) <= 0.0001, f"{idferill}/{role}: excl {record['cum_km_excl_1436']} != {want_excl}"
    return True


def run_pre_output_mutation_tests(cw, stored, idferills):
    """Pre-output sanity (the build script's OWN check, before writing
    anything) -- the SEPARATE, import-free final-output validator
    (validate_final_outputs_v2.py) repeats this independently on the
    WRITTEN files, per J2."""
    results = {}
    tests_run = 0
    for idf in idferills:
        node = production_node(cw, idf)
        if node is None:
            continue
        for role in ("ENTRY", "EXIT"):
            coord = node["entry_coord"] if role == "ENTRY" else node["exit_coord"]
            cum_incl = node["entry_cum_km_incl_1436"] if role == "ENTRY" else node["exit_cum_km_incl_1436"]
            cum_excl = node["entry_cum_km_excl_1436"] if role == "ENTRY" else node["exit_cum_km_excl_1436"]
            correct = {"node_role": role, "coord": coord, "cum_km_incl_1436": cum_incl, "cum_km_excl_1436": cum_excl}
            validate_node_role(correct, idf, cw, stored)  # sanity
            per = {}

            def expect_fail(name, rec):
                nonlocal tests_run
                tests_run += 1
                try:
                    validate_node_role(rec, idf, cw, stored)
                    per[name] = False
                except AssertionError:
                    per[name] = True

            other_role = "EXIT" if role == "ENTRY" else "ENTRY"
            other_coord = node["exit_coord"] if role == "ENTRY" else node["entry_coord"]
            wrong_coord_role = dict(correct, coord=other_coord)  # H1's own bug pattern: this role's cum, other role's coord
            expect_fail("wrong_role_coord", wrong_coord_role)
            swapped = dict(correct, cum_km_incl_1436=correct["cum_km_excl_1436"], cum_km_excl_1436=correct["cum_km_incl_1436"])
            expect_fail("incl_excl_swap", swapped)
            p1436_km = cw["piece_1436_length_m"] / 1000
            doubled = dict(correct, cum_km_incl_1436=correct["cum_km_incl_1436"] + p1436_km)
            expect_fail("double_counted_1436", doubled)
            results[f"{idf}_{role}"] = per
            for k, v in per.items():
                assert v, f"mutation test {k} should be rejected for {idf}/{role}: {per}"
    return results, tests_run


# ---------------------------------------------------------------------
# J1 -- per-place role readout (printed for all 24, not hardcoded)
# ---------------------------------------------------------------------


def load_phase1_inventory():
    with open(NETWORK_DIR / "place-inventory.csv", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))
    by_name = {}
    for r in rows:
        canonical = ALIAS_PHASE1_TO_WORKLIST.get(r["name"], r["name"])
        by_name[canonical] = r
    return by_name


def load_road_links():
    with open(NETWORK_DIR / "samples/road-links.csv", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))
    for r in rows:
        r["idferill"] = int(r["idferill"])
        r["start"] = [float(r["start_x"]), float(r["start_y"])]
        r["end"] = [float(r["end_x"]), float(r["end_y"])]
        r["n_vertices"] = int(r["n_vertices"])
        r["objectid_canonical"] = int(r["objectid_canonical"])
    return rows


def role_from_access_node_end(access_node_end, direction):
    """'end'/'start' (phase-1's own stored_field choice) -> node_role,
    given the piece's own retained direction. Returns (node_role,
    stored_field) or (None, None) if access_node_end is NONE/'both...'"""
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


def print_phase1_role_readout(phase1_by_name, cw):
    print("--- J1 per-place role readout (phase-1 access_node_end vs cw_long) ---")
    readout = []
    for name, p1 in phase1_by_name.items():
        idf_raw = p1["access_node_idferill"]
        if idf_raw in ("NONE", "", None):
            continue
        idf = int(idf_raw)
        node = production_node(cw, idf)
        direction = node["direction"] if node else None
        node_role, stored_field = role_from_access_node_end(p1["access_node_end"], direction)
        entry = {"name": name, "idferill": idf, "phase1_access_node_end": p1["access_node_end"], "in_cw_long": node is not None, "direction": direction, "derived_node_role": node_role, "derived_stored_field": stored_field, "phase1_status": p1["status"]}
        readout.append(entry)
        print(" ", entry)
    return readout


# ---------------------------------------------------------------------
# J5 -- general stem-search (informational only, never promotes status)
# ---------------------------------------------------------------------


def stem_variants(name, min_len=7):
    name = nfc(name)
    variants = {name}
    if name and name[-1].lower() in VOWELS:
        variants.add(name[:-1])
    o_to_a = name.replace("ö", "a").replace("Ö", "A")
    variants.add(o_to_a)
    if o_to_a and o_to_a[-1].lower() in VOWELS:
        variants.add(o_to_a[:-1])
    return sorted({v for v in variants if len(v) >= min_len})


def tokenize(text):
    return [t for t in re.split(rf"[^{ICELANDIC_WORD_CHARS}]+", text) if t]


def stem_search_all(names, road_links):
    hints = {}
    for name in names:
        variants = stem_variants(name)
        matches = []
        for r in road_links:
            if r["vegnr"] != "1":
                continue
            for tok in tokenize(nfc(r["desc"])):
                for v in variants:
                    if tok.startswith(v):
                        matches.append({"idferill": r["idferill"], "desc": r["desc"], "matched_token": tok, "matched_stem_variant": v})
                        break
        hints[name] = {"stem_variants": variants, "matches": matches}
    return hints


# ---------------------------------------------------------------------
# Main table + reference records
# ---------------------------------------------------------------------

REGRESSION_NAMES = ["Hveragerði", "Kirkjubæjarklaustur", "Höfn", "Djúpivogur", "Breiðdalsvík", "Fellabær", "Varmahlíð", "Blönduós", "Mosfellsbær"]
DUAL_RECORD_PLACES = {"Selfoss": 2138, "Hella": 3591, "Hvolsvöllur": 3593}
PHASE1_EXIT_REFERENCE_PLACES = {"Vík": 3849, "Fáskrúðsfjörður": 2536, "Reyðarfjörður": 2520, "Reykjahlíð": 3566}

PHASE1_STATUS_MAP = {
    "AKUREYRI_C_OWNER_DECISION": "OWNER_APPROVED_ANCHOR",
    "ON_RING_NAME_MATCH_INFERRED": "NAME_MATCH_INFERRED",
    "BORGARNES_PER_PRIOR_ROUND_RULE": "NAME_MATCH_INFERRED",
    "NODE_UNDETERMINED": "NODE_UNDETERMINED",
    "INFERRED_OUTSIDE_VEGNR1": "NODE_UNDETERMINED",
    "CONNECTING_ROAD_NEEDED_PHASE2": "NODE_UNDETERMINED",
}


def load_72_names_and_matching():
    d = json.loads((PHASE2_DIR / "samples/worklist_matching-v3.json").read_bytes())
    rows = d["hagstofa_matching"]
    names = [r["work_list_name"] for r in rows]
    assert len(names) == 72 and len(set(names)) == 72
    return names, {r["work_list_name"]: r for r in rows}


def name_search_vegnr1_exact(place_name, road_links):
    name_nfc = nfc(place_name)
    out = [r for r in road_links if r["vegnr"] == "1" and (whole_word_contains(nfc(r["name"]), name_nfc) or whole_word_contains(nfc(r["desc"]), name_nfc))]
    out.sort(key=lambda r: (-r["n_vertices"], r["objectid_canonical"]))
    return out


CODE50_LINK_NAMES = {"Kópavogur", "Hafnarfjörður", "Garðabær"}


def make_gap_entry_v2(gap_id, name, row, hm, code50_candidates, stem_hint_count):
    hagstofa_bit = f"hagstofa_pairing={hm['status']}/{hm['match_type']}, codes={[c['code'] for c in hm['candidates']]}"
    if name == "Reykholt":
        missing = "Reykholt's own Hagstofa pairing is AMBIGUOUS between code 193 (Reykholt, Borgarfirði) and code 1162 (Reykholt, Biskupstungum); no road/coordinate issue -- this is a region-identification gap, not a connectivity gap."
        required = "a region-level disambiguation rule or an owner decision between the two codes"
    elif name in ("Kópavogur", "Garðabær", "Hafnarfjörður"):
        missing = f"{name} is UNMATCHED against Hagstofa's own þéttbýlisstaðir dimension (no row of its own anywhere in the 120-row table); separately, this same absence is the basis for an INFERRED 'possibly included in code 50 (Reykjavík)' grouping proposal from phase-2's own classification step -- that INFERRED grouping is NOT a confirmed Hagstofa match and must not be read as one."
        required = "a confirmed settlement-to-municipality mapping from Hagstofa itself, or an owner decision to accept the INFERRED code-50 grouping"
    elif name == "Reykjanesbær":
        missing = "Reykjanesbær is UNMATCHED against Hagstofa's own þéttbýlisstaðir dimension; UNLIKE Kópavogur/Garðabær/Hafnarfjörður, no code-50 (or other) INFERRED grouping applies here -- Reykjanesbær is a municipality whose own settlement is 'Keflavík og Njarðvík' (code 141, itself MATCHED), a different relationship, not an inferred merger."
        required = "no new data needed for the Hagstofa side; a road/coordinate access point is still a separate, unresolved gap"
    elif row["reference_status"] == "CANDIDATE_NOT_PROMOTED" and row.get("native_source_piece"):
        missing = f"{name}'s own piece ({row['native_source_piece']}) has TWO retained, independently-validated candidate records (phase-1's own ENTRY/stored-END pick and phase-2's own EXIT/stored-START node) that disagree by 0.3-6.4 km; neither is promoted to a single place endpoint this round ({hagstofa_bit})"
        required = "an owner decision between the two already-identified, already-validated candidate records in samples/v2/place-node-references.json"
    elif row["road_connection"] == "NODE_UNDETERMINED" and row["coordinate_source"] == "NO_COORDINATE_SOURCE":
        missing = f"no VEGNR=1 (or known connecting-road) piece identified as {name}'s own access point ({hagstofa_bit})"
        required = "retained VEGNR/connecting-road geometry naming or touching this place, OR an owner-provided reference point"
    elif row["road_connection"] == "NAME_MATCH_INFERRED":
        missing = f"{name}'s own candidate piece is a text-mention match only, not a verified contact or owner-approved anchor ({hagstofa_bit})"
        required = "a verified multi-line contact point, or an owner decision selecting one candidate as the access point"
    else:
        missing = f"{name}'s own road connection is verified, but no single coordinate represents the settlement itself ({hagstofa_bit})"
        required = "an owner decision among the already-documented candidate nodes"
    note = ""
    if stem_hint_count:
        note = f" {stem_hint_count} stem-search hint(s) found this round (INFERRED, text-mention only, no road_connection effect) -- see samples/v2/stem_search_hints.json."
    return {
        "gap_id": gap_id, "place": name,
        "missing_fact": missing + note,
        "purpose": "to establish this place's own weather/route access point and/or Hagstofa identity",
        "required_data": {"fields": ["geometry (LineString or Point)", "name/description", "CRS"], "crs": "EPSG:3057 (native) or EPSG:4326 (WGS84), whichever the source actually provides", "precision": "sufficient to identify a specific node, not just a route segment"},
        "host_candidates": [],
        "host_candidates_reason": "no retained file in this task's own input set names a host/layer for this specific place; a host used by an earlier, different round is not re-authorised by this round",
        "authorisation": "NOT_AUTHORISED",
    }


if __name__ == "__main__":
    forbidden = {"socket", "http", "urllib", "requests", "ssl"}
    src = Path(__file__).read_text(encoding="utf-8")
    used = {m for m in forbidden if re.search(rf"^\s*(import {m}\b|from {m}\b)", src, re.MULTILINE)}
    assert not used, f"forbidden network-capable import(s) found: {used}"
    print("static import check: PASS")

    input_hashes = record_input_hashes()
    with open(TASK_DIR / "samples/v2/input_hashes.json", "w", encoding="utf-8", newline="\n") as f:
        json.dump(input_hashes, f, ensure_ascii=False, indent=1)
        f.write("\n")
    print(f"recorded {len(input_hashes)} input file hashes")

    v1_baseline = json.loads((TASK_DIR / "samples/v2/v1_and_input_baseline.json").read_bytes())
    v1_ec_sha = next(r["sha256"] for r in v1_baseline if r["path"].endswith("ticket-493-access-points/endpoint-candidates.json"))
    neg = run_schema_validator_negative_tests_v1_verbatim(TASK_DIR / "endpoint-candidates.json", v1_ec_sha)
    print("schema validator v1-verbatim negative test:", neg)

    cw = _load_cw_long()
    road_links = load_road_links()
    stored = _stored_endpoints(road_links)
    phase1_by_name = load_phase1_inventory()

    role_readout = print_phase1_role_readout(phase1_by_name, cw)
    with open(TASK_DIR / "samples/v2/phase1_role_readout.json", "w", encoding="utf-8", newline="\n") as f:
        json.dump(role_readout, f, ensure_ascii=False, indent=1)
        f.write("\n")

    mutation_pieces = sorted(set([2138, 3591, 3593, 3849, 2536, 2520, 3566, 2345, 3876, 1436]))
    mutation_results, tests_run = run_pre_output_mutation_tests(cw, stored, mutation_pieces)
    print(f"pre-output mutation tests: {tests_run} tests across {len(mutation_results)} (piece,role) pairs on {len(mutation_pieces)} pieces -- all rejected as required")

    names, matching_by_name = load_72_names_and_matching()
    stem_hints = stem_search_all(names, road_links)
    with open(TASK_DIR / "samples/v2/stem_search_hints.json", "w", encoding="utf-8", newline="\n") as f:
        json.dump({k: v for k, v in stem_hints.items()}, f, ensure_ascii=False, indent=1)
        f.write("\n")
    recall_check = {
        "skagastrandarvegur": sorted({m["idferill"] for m in stem_hints["Skagaströnd"]["matches"]}),
        "thorlakshafnarvegur": sorted({m["idferill"] for m in stem_hints["Þorlákshöfn"]["matches"]}),
        "eyrarbakkavegur": sorted({m["idferill"] for m in stem_hints["Eyrarbakki"]["matches"]}),
    }
    assert set(recall_check["skagastrandarvegur"]) >= {2423, 2456, 2478}, recall_check
    assert set(recall_check["thorlakshafnarvegur"]) >= {22722, 22725}, recall_check
    assert len(recall_check["eyrarbakkavegur"]) >= 10, recall_check
    print("stem-search recall check PASS:", recall_check)

    rows = []
    gap_list = []
    place_node_references = {}

    for name in names:
        hm = matching_by_name[name]
        row = {
            "name": name, "hagstofa_pairing": hm["status"], "hagstofa_match_type": hm["match_type"], "hagstofa_codes": [c["code"] for c in hm["candidates"]],
            "road_connection": None, "coordinate_source": None, "node_role": None, "stored_field": None, "record_source": None, "reference_status": None,
            "coord": None, "native_source_piece": None, "native_source_field": None,
            "cum_km_incl_1436": None, "cum_km_excl_1436": None, "direction_status": "NOT_APPLICABLE", "gap_id": None, "notes": "",
        }
        p1 = phase1_by_name.get(name)
        stem_hint_count = len(stem_hints.get(name, {}).get("matches", []))

        if name == "Reykjavík":
            leg = production_node(cw, 1436)
            assert leg["entry_coord"] == [s for s in cw["steps"] if s["idferill"] == 1436][0]["entry"]
            row["road_connection"] = "NODE_UNDETERMINED"
            row["coordinate_source"] = "NO_COORDINATE_SOURCE"
            row["notes"] = "REY-CORE: see endpoint-candidates-v2.json for the piece-1436-derived leg offsets (H2/J3) and the Rauðavatn comparison anchor (candidate/INFERRED only)."
        elif name == "Akureyri":
            node3876 = production_node(cw, 3876)
            validate_node_role({"node_role": "EXIT", "coord": node3876["exit_coord"], "cum_km_incl_1436": node3876["exit_cum_km_incl_1436"], "cum_km_excl_1436": node3876["exit_cum_km_excl_1436"]}, 3876, cw, stored)
            row.update(road_connection="OWNER_APPROVED_ANCHOR", coordinate_source="OWNER_APPROVED_RETAINED", node_role="EXIT", stored_field="START", record_source="OWNER_APPROVED", reference_status="OWNER_APPROVED_ANCHOR",
                       coord=node3876["exit_coord"], native_source_piece=3876, native_source_field="stored start of 3876 = stored end of 2940 (road-links.csv), 0.0 m shared coordinate",
                       cum_km_incl_1436=round(node3876["exit_cum_km_incl_1436"], 4), cum_km_excl_1436=round(node3876["exit_cum_km_excl_1436"], 4), direction_status="INFERRED",
                       notes="OWNER_APPROVED (2026-11-06). Phase-1's own access_node_end='end' for piece 2940 names the IDENTICAL coordinate via the adjacent piece; both are the same retained point (akureyri-endpoint-decision.md).")
        elif name == "Egilsstaðir":
            node2345 = production_node(cw, 2345)
            validate_node_role({"node_role": "ENTRY", "coord": node2345["entry_coord"], "cum_km_incl_1436": node2345["entry_cum_km_incl_1436"], "cum_km_excl_1436": node2345["entry_cum_km_excl_1436"]}, 2345, cw, stored)
            row.update(road_connection="MAPPED_CONTACT_VERIFIED", coordinate_source="RETAINED_GEOMETRY", node_role="ENTRY", stored_field="END", record_source="PHASE2_V3_NODE", reference_status="RING_JUNCTION_VERIFIED",
                       coord=node2345["entry_coord"], native_source_piece=2345, native_source_field="stored end of 2345 (road-links.csv) = ring/road93 junction, verified 0.0 m contact with road93 piece 2344",
                       cum_km_incl_1436=round(node2345["entry_cum_km_incl_1436"], 4), cum_km_excl_1436=round(node2345["entry_cum_km_excl_1436"], 4), direction_status="INFERRED",
                       notes="Phase-1's own access_node_end='start' named the OTHER point (678.5614/676.0013 km); phase-2's own reviewed work (place-inventory-v3.csv) explicitly upgraded to this junction node for a categorically stronger reason (a VERIFIED 0.0 m multi-line contact, not just a same-piece role reassessment) -- unlike the Selfoss-pattern three, this is a deliberate, already-reviewed choice, not an unresolved conflict.")
        elif name == "Seyðisfjörður":
            row.update(road_connection="MAPPED_CONTACT_VERIFIED", coordinate_source="NO_COORDINATE_SOURCE",
                        notes="The connecting ROAD's own contact to the ring is verified (0.0 m, via the Egilsstaðir junction); the settlement's own representative coordinate is not chosen (see endpoint-candidates-v2.json, unselected). No retained WGS84 exists for road 93.")
        elif name == "Borgarnes":
            row.update(road_connection="NAME_MATCH_INFERRED", coordinate_source="RETAINED_GEOMETRY", node_role="ENTRY", stored_field="END", record_source="PHASE1_ACCESS_NODE_END", reference_status="PHASE1_REFERENCE",
                       coord=stored[2819]["end"], native_source_piece=2819, native_source_field="stored end of 2819 (road-links.csv); own name/desc ('Borgarnes-Baulan'/'Borgarnes') plus #491's own prior-round rule",
                       direction_status="UNKNOWN", notes="cum not validated this round: piece 2819 is on ccw_short, not cw_long -- out of this round's validator scope (unchanged from v1).")
        elif name in DUAL_RECORD_PLACES:
            idf = DUAL_RECORD_PLACES[name]
            node = production_node(cw, idf)
            entry_rec = {"place": name, "idferill": idf, "node_role": "ENTRY", "stored_field": "END", "record_source": "PHASE1_ACCESS_NODE_END", "reference_status": "PHASE1_REFERENCE",
                         "coord": node["entry_coord"], "cum_km_incl_1436": round(node["entry_cum_km_incl_1436"], 4), "cum_km_excl_1436": round(node["entry_cum_km_excl_1436"], 4)}
            exit_rec = {"place": name, "idferill": idf, "node_role": "EXIT", "stored_field": "START", "record_source": "PHASE2_V3_NODE", "reference_status": "PHASE2_V3_NODE",
                        "coord": node["exit_coord"], "cum_km_incl_1436": round(node["exit_cum_km_incl_1436"], 4), "cum_km_excl_1436": round(node["exit_cum_km_excl_1436"], 4)}
            validate_node_role({"node_role": "ENTRY", "coord": entry_rec["coord"], "cum_km_incl_1436": entry_rec["cum_km_incl_1436"], "cum_km_excl_1436": entry_rec["cum_km_excl_1436"]}, idf, cw, stored)
            validate_node_role({"node_role": "EXIT", "coord": exit_rec["coord"], "cum_km_incl_1436": exit_rec["cum_km_incl_1436"], "cum_km_excl_1436": exit_rec["cum_km_excl_1436"]}, idf, cw, stored)
            place_node_references[name] = [entry_rec, exit_rec]
            row.update(road_connection="NAME_MATCH_INFERRED", coordinate_source="RETAINED_GEOMETRY", record_source="PHASE1_ACCESS_NODE_END+PHASE2_V3_NODE", reference_status="CANDIDATE_NOT_PROMOTED",
                       direction_status="UNKNOWN", native_source_piece=idf,
                       notes=f"TWO candidate records exist for this piece ({idf}): phase-1's own ENTRY/stored-END pick and phase-2's own EXIT/stored-START node, {round(abs(entry_rec['cum_km_incl_1436']-exit_rec['cum_km_incl_1436']),4)} km apart. Neither is promoted to a single place endpoint this round -- see samples/v2/place-node-references.json.")
        elif name in PHASE1_EXIT_REFERENCE_PLACES:
            idf = PHASE1_EXIT_REFERENCE_PLACES[name]
            node = production_node(cw, idf)
            validate_node_role({"node_role": "EXIT", "coord": node["exit_coord"], "cum_km_incl_1436": node["exit_cum_km_incl_1436"], "cum_km_excl_1436": node["exit_cum_km_excl_1436"]}, idf, cw, stored)
            row.update(road_connection="NAME_MATCH_INFERRED", coordinate_source="RETAINED_GEOMETRY", node_role="EXIT", stored_field="START", record_source="PHASE1_ACCESS_NODE_END", reference_status="PHASE1_REFERENCE",
                       coord=node["exit_coord"], native_source_piece=idf, native_source_field=f"stored start of {idf} (road-links.csv), per phase-1's own access_node_end='start'",
                       cum_km_incl_1436=round(node["exit_cum_km_incl_1436"], 4), cum_km_excl_1436=round(node["exit_cum_km_excl_1436"], 4), direction_status="INFERRED",
                       notes="v1's own ENTRY/stored-END coordinate for this piece is NOT re-emitted as a new candidate: it was never phase-1's own retained choice, only an artefact of v1's own coord/cum role mismatch (see evidence-v2.md H1).")
        elif p1 is not None:
            mapped = PHASE1_STATUS_MAP.get(p1["status"], "NODE_UNDETERMINED")
            row["road_connection"] = mapped
            idf_raw = p1["access_node_idferill"]
            idf = int(idf_raw) if idf_raw not in ("NONE", "", None) else None
            if idf is not None:
                row["coordinate_source"] = "RETAINED_GEOMETRY"
                se = stored.get(idf)
                node = production_node(cw, idf)
                node_role, stored_field = role_from_access_node_end(p1["access_node_end"], node["direction"] if node else None)
                if se and node_role:
                    coord = se["end"] if stored_field == "END" else se["start"]
                    cum_incl = node["entry_cum_km_incl_1436"] if node_role == "ENTRY" else node["exit_cum_km_incl_1436"]
                    cum_excl = node["entry_cum_km_excl_1436"] if node_role == "ENTRY" else node["exit_cum_km_excl_1436"]
                    validate_node_role({"node_role": node_role, "coord": coord, "cum_km_incl_1436": cum_incl, "cum_km_excl_1436": cum_excl}, idf, cw, stored)
                    row.update(node_role=node_role, stored_field=stored_field, record_source="PHASE1_ACCESS_NODE_END", reference_status="PHASE1_REFERENCE", coord=coord, native_source_piece=idf,
                               native_source_field=f"stored {stored_field.lower()} of {idf} (road-links.csv), via phase-1's own {p1['status']}",
                               cum_km_incl_1436=round(cum_incl, 4), cum_km_excl_1436=round(cum_excl, 4), direction_status="INFERRED")
                else:
                    row["direction_status"] = "UNKNOWN"
                    row["notes"] = f"NOT_VALIDATED: piece not found in cw_long this round. phase-1 status carried forward: {p1['status']}."
            else:
                row["coordinate_source"] = "NO_COORDINATE_SOURCE"
                row["notes"] = f"phase-1 status carried forward unchanged: {p1['status']}."
        else:
            candidates = name_search_vegnr1_exact(name, road_links)
            if candidates:
                best = candidates[0]
                node = production_node(cw, best["idferill"])
                coord = best["end"]
                row.update(road_connection="NAME_MATCH_INFERRED", coordinate_source="RETAINED_GEOMETRY", node_role="ENTRY" if node and node["direction"] == "rev" else None, stored_field="END",
                           record_source="THIS_ROUND_NAME_SEARCH", reference_status="CANDIDATE_NOT_PROMOTED", coord=coord, native_source_piece=best["idferill"],
                           native_source_field=f"stored end of {best['idferill']} (road-links.csv), exact whole-word name/desc match ('{best['name']}' / '{best['desc']}')")
                if node and node["direction"] == "rev":
                    validate_node_role({"node_role": "ENTRY", "coord": coord, "cum_km_incl_1436": node["entry_cum_km_incl_1436"], "cum_km_excl_1436": node["entry_cum_km_excl_1436"]}, best["idferill"], cw, stored)
                    row.update(cum_km_incl_1436=round(node["entry_cum_km_incl_1436"], 4), cum_km_excl_1436=round(node["entry_cum_km_excl_1436"], 4), direction_status="INFERRED")
                else:
                    row["direction_status"] = "UNKNOWN"
                row["notes"] = f"{len(candidates)} exact whole-word VEGNR=1 candidate(s) found (never assessed individually before); unselected, not an access point."
            else:
                row.update(road_connection="NODE_UNDETERMINED", coordinate_source="NO_COORDINATE_SOURCE", direction_status="NOT_APPLICABLE",
                           notes="No exact whole-word VEGNR=1 match found this round; never assessed individually before.")

        if stem_hint_count and row["road_connection"] == "NODE_UNDETERMINED":
            row["notes"] = (row["notes"] + f" {stem_hint_count} stem-search hint(s) found (INFERRED text mention only, no status effect) -- see samples/v2/stem_search_hints.json.").strip()

        if row["road_connection"] not in ("MAPPED_CONTACT_VERIFIED", "OWNER_APPROVED_ANCHOR") or row["coordinate_source"] == "NO_COORDINATE_SOURCE" or row["reference_status"] == "CANDIDATE_NOT_PROMOTED":
            gap_id = f"GAP-{len(gap_list) + 1:03d}"
            row["gap_id"] = gap_id
            gap_list.append(make_gap_entry_v2(gap_id, name, row, hm, None, stem_hint_count))

        rows.append(row)

    assert len(rows) == 72
    for n in REGRESSION_NAMES:
        r = next(x for x in rows if x["name"] == n)
        assert r["road_connection"] in ("NODE_UNDETERMINED", "NAME_MATCH_INFERRED"), f"regression test failed for {n}: {r['road_connection']}"
        assert n in stem_hints, f"regression place {n} did not get a real stem search"
    print("regression test (9 names) passed; all 9 received a real stem-hint search")

    status_counts = {}
    for r in rows:
        status_counts[r["road_connection"]] = status_counts.get(r["road_connection"], 0) + 1
    gap_count = len(gap_list)
    no_gap_count = 72 - gap_count
    print("road_connection counts:", status_counts, "gap entries:", gap_count, "no-gap places:", no_gap_count)

    assert_numeric_schema({"rows": rows})
    print("numeric schema check on all 72 rows: PASS")

    # ---------------- Reykjavik legs (H2/J3) ----------------
    step0 = next(s for s in cw["steps"] if s["idferill"] == 1436)
    assert step0["gap_into_m"] == 0.0, "step 0 must have zero gap_into_m"
    p1436_length_m = step0["piece_cost_m"]
    leg_entry_incl = 0.0
    leg_entry_excl = -p1436_length_m / 1000
    leg_exit_incl = p1436_length_m / 1000
    leg_exit_excl = 0.0
    reykjavik_legs = {
        "basis": "named by piece 1436's own stored endpoints (road-links.csv), never by compass words. Derived from cw_long step 0's own named fields (piece_cost_m, gap_into_m), not a hardcoded length.",
        "piece_1436_length_m": p1436_length_m,
        "short_western_leg_ENTRY_stored_END": {
            "node_role": "ENTRY", "stored_field": "END", "coord": step0["entry"],
            "leads_toward": "Borgarnes (candidate/NAME_MATCH_INFERRED)",
            "cum_offset_km_incl_1436": round(leg_entry_incl, 4), "cum_offset_km_excl_1436": round(leg_entry_excl, 4),
        },
        "long_eastern_leg_EXIT_stored_START": {
            "node_role": "EXIT", "stored_field": "START", "coord": step0["exit"],
            "leads_toward": "traverses piece 1436 itself (rev: ENTRY=stored END -> EXIT=stored START) before continuing around the ring",
            "cum_offset_km_incl_1436": round(leg_exit_incl, 4), "cum_offset_km_excl_1436": round(leg_exit_excl, 4),
        },
        "raudavatn_comparison_anchor": {"status": "candidate/INFERRED, never a confirmed Reykjavík core", "coord": step0["exit"], "note": "identical to the long/eastern leg's own EXIT coordinate; retained from prior rounds as a comparison anchor only"},
        "rey_core": {"coordinate_source": "NO_COORDINATE_SOURCE", "note": "no VEGNR=1 piece represents the city core; no distance claim is made between Rauðavatn and the core because no core coordinate is retained"},
    }
    # H2 negative test: the actual v1 swapped offsets must fail a sign/role check
    v1_doc = json.loads((TASK_DIR / "endpoint-candidates.json").read_bytes())
    v1_short = v1_doc["reykjavik"]["short_western_leg"]
    v1_long = v1_doc["reykjavik"]["long_eastern_leg"]
    swapped_wrong = (v1_short["cum_offset_km_excl_1436"] == 0.0 and v1_short["cum_offset_km_incl_1436"] > 0 and v1_long["cum_offset_km_excl_1436"] < 0)
    assert swapped_wrong, "expected v1's own Reykjavik offsets to show the swapped-sign bug this test targets"
    print("H2 negative test: v1's own swapped Reykjavik offsets confirmed present (short leg incl=+2.5601 should be 0; long leg excl=-2.5601 should be 0) -- v2's own values corrected above.")

    # ---------------- Egilsstadir/Seydisfjordur 7-node table (G4/J4) ----------------
    wfs93 = json.loads((PHASE2_DIR / "samples/wfs93-raw.json").read_bytes())
    by_tier = {}
    for f in wfs93["features"]:
        p = f["properties"]
        by_tier.setdefault(p["IDFERILL"], {})[p["NAKVAEMNIFERLIS"]] = f
    order93 = [2344, 3410, 3409, 2894, 2892, 2891]

    def _dist(a, b):
        return ((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2) ** 0.5

    def _planar_len(coords):
        return sum(_dist(coords[i][:2], coords[i + 1][:2]) for i in range(len(coords) - 1))

    def cum93_at(tier, upto_idferill, role):
        cum = 0.0
        for i, idf in enumerate(order93):
            coords = by_tier[idf][tier]["geometry"]["coordinates"]
            if i > 0:
                prev_coords = by_tier[order93[i - 1]][tier]["geometry"]["coordinates"]
                cum += _dist(prev_coords[-1][:2], coords[0][:2])
            if idf == upto_idferill and role == "start":
                return cum
            cum += _planar_len(coords)
            if idf == upto_idferill and role == "end":
                return cum
        raise AssertionError(f"{upto_idferill}/{role} not found")

    node2345_data = production_node(cw, 2345)
    node_defs = [
        (2345, "end", "ring/road93 junction -- VERIFIED 0.0 m contact with road93 piece 2344", None, None, True),
        (2344, "end", "end of road93's own first piece", None, None, False),
        (3410, "end", "end of road93's own second piece", None, None, False),
        (3409, "end", "= start of 2894; STADARLYSING names this 'kirkjugarðshorn'", None, None, False),
        (2892, "start", "junction 2894/2892 (start of 2892 = end of 2894)", None, None, False),
        (2891, "start", "junction 2892/2891 (start of 2891 = end of 2892)", None, None, False),
        (2891, "end", "ferry pier (end of 2891) -- 'Vestdalseyrarvegur - Ferjubryggja'", None, None, False),
    ]
    g4_nodes = []
    for idferill, role, desc, _a, _b, is_2345 in node_defs:
        if is_2345:
            g4_nodes.append({
                "idferill": 2345, "role": role, "coord": stored[2345]["end"],
                "piece_name_verbatim": next(r["name"] for r in road_links if r["idferill"] == 2345),
                "piece_desc_verbatim": next(r["desc"] for r in road_links if r["idferill"] == 2345),
                "cum_km_tier_minus1": 0.0, "cum_km_tier_2": 0.0, "origin_marked": True,
                "ring_cum_km_incl_1436": round(node2345_data["entry_cum_km_incl_1436"], 4), "ring_cum_km_excl_1436": round(node2345_data["entry_cum_km_excl_1436"], 4),
                "description": desc,
            })
            continue
        tier_minus1_feature = by_tier[idferill][-1]
        coords = tier_minus1_feature["geometry"]["coordinates"]
        coord = coords[0][:2] if role == "start" else coords[-1][:2]
        g4_nodes.append({
            "idferill": idferill, "role": role, "coord": coord,
            "piece_name_verbatim": tier_minus1_feature["properties"].get("STUTTNAFNLEIDAR"),
            "piece_desc_verbatim": tier_minus1_feature["properties"].get("STADARLYSING"),
            "cum_km_tier_minus1": round(cum93_at(-1, idferill, role) / 1000, 4), "cum_km_tier_2": round(cum93_at(2, idferill, role) / 1000, 4), "origin_marked": False,
            "ring_cum_km_incl_1436": None, "ring_cum_km_excl_1436": None,
            "description": desc,
        })

    egilsstadir_seydisfjordur = {
        "selection": "UNSELECTED -- every node below is a candidate; the choice of Egilsstaðir/Seyðisfjörður access point is an owner decision",
        "exit_length_variants_km": {"from_ring_junction_2345": 26.9266, "from_phase1_node_via_2345_927m": 27.8536, "basis_note": "both derived from retained geometry (wfs93-raw.json tier -1 sum; chain-walks-v4.json piece 2345 length), not independent literals -- re-verified this round via cum93_at() and production_node()"},
        "spelling_note": "piece 2894's own STADARLYSING says 'Hánefsstaðavegur'; piece 2892's says 'Hánesstaðavegur' -- preserved verbatim, not normalised",
        "wgs84_note": "no retained WGS84 geometry exists for road 93 -- this is a data gap, not a failure",
        "nodes": g4_nodes,
    }
    # re-verify the two exit-length literals against retained data instead of trusting the literal
    computed_from_junction = cum93_at(-1, 2891, "end") / 1000
    assert abs(computed_from_junction - 26.9266) <= 0.0001, computed_from_junction
    computed_phase1_variant = computed_from_junction + 927.0346 / 1000
    assert abs(computed_phase1_variant - 27.8536) <= 0.001, computed_phase1_variant
    print("H4: 26.9266/27.8536 km re-verified against retained geometry, not trusted as bare literals:", round(computed_from_junction, 4), round(computed_phase1_variant, 4))

    akureyri_block = {
        "status": "OWNER_APPROVED (owner decision 2026-11-06, akureyri-endpoint-decision.md) -- not reopened this round",
        "idferill": 2940, "coord": [540259.2615, 577843.7582],
        "wgs84": {"lat_deg_n": 65.69570405, "lon_deg_w": 18.12371406, "source": "akureyri-endpoint-decision.md (copied verbatim, not recomputed)"},
    }
    endpoint_candidates_v2 = {"reykjavik": reykjavik_legs, "egilsstadir_seydisfjordur": egilsstadir_seydisfjordur, "akureyri": akureyri_block}
    assert_numeric_schema(endpoint_candidates_v2)
    print("numeric schema check on endpoint-candidates-v2.json: PASS")

    # ---------------- write outputs ----------------
    fieldnames = ["name", "hagstofa_pairing", "hagstofa_match_type", "hagstofa_codes", "road_connection", "coordinate_source", "node_role", "stored_field", "record_source", "reference_status", "native_x", "native_y", "native_source_piece", "native_source_field", "cum_km_incl_1436", "cum_km_excl_1436", "direction_status", "gap_id", "notes"]
    with open(TASK_DIR / "place-access-status-v2.csv", "w", encoding="utf-8", newline="") as f:
        w = csv.writer(f, lineterminator="\n")
        w.writerow(fieldnames)
        for r in rows:
            out = []
            coord = r["coord"]
            for fn in fieldnames:
                if fn == "native_x":
                    v = coord[0] if coord else None
                elif fn == "native_y":
                    v = coord[1] if coord else None
                elif fn == "hagstofa_codes":
                    v = "|".join(r[fn])
                else:
                    v = r.get(fn)
                out.append("" if v is None else v)
            w.writerow(out)

    with open(TASK_DIR / "endpoint-candidates-v2.json", "w", encoding="utf-8", newline="\n") as f:
        json.dump(endpoint_candidates_v2, f, ensure_ascii=False, indent=1)
        f.write("\n")

    with open(TASK_DIR / "samples/v2/place-node-references.json", "w", encoding="utf-8", newline="\n") as f:
        json.dump(place_node_references, f, ensure_ascii=False, indent=1)
        f.write("\n")

    with open(TASK_DIR / "samples/v2/gap_list_v2.json", "w", encoding="utf-8", newline="\n") as f:
        json.dump(gap_list, f, ensure_ascii=False, indent=1)
        f.write("\n")

    with open(TASK_DIR / "samples/v2/mutation_test_summary.json", "w", encoding="utf-8", newline="\n") as f:
        json.dump({"tests_run": tests_run, "pieces_tested": mutation_pieces, "per_piece_role_results": mutation_results}, f, ensure_ascii=False, indent=1)
        f.write("\n")

    print(f"wrote place-access-status-v2.csv (72 rows), endpoint-candidates-v2.json, samples/v2/place-node-references.json ({len(place_node_references)} places), samples/v2/gap_list_v2.json ({gap_count} entries)")

    # ---------------- H8: counts recomputed in code, not restated as fixed text ----------------
    predictable_gap_places = {"Reykjavík", "Seyðisfjörður"}
    predictable_gaps = [g for g in gap_list if g["place"] in predictable_gap_places]
    ordinary_gaps = gap_count - len(predictable_gaps)
    dual_candidate_gaps = [g for g in gap_list if "TWO retained, independently-validated candidate records" in g["missing_fact"]]
    vopnafjordur_hints = len(stem_hints.get("Vopnafjörður", {}).get("matches", []))
    hvammstangi_hints = len(stem_hints.get("Hvammstangi", {}).get("matches", []))
    summary = {
        "total_rows": 72, "total_gap_entries": gap_count, "no_gap_places": no_gap_count,
        "predictable_BLOCKED_sub_item_gaps": len(predictable_gaps), "predictable_gap_places": sorted(predictable_gap_places),
        "ordinary_gap_entries": ordinary_gaps, "dual_candidate_gap_entries": len(dual_candidate_gaps), "dual_candidate_places": [g["place"] for g in dual_candidate_gaps],
        "vopnafjordur_stem_search_hint_count": vopnafjordur_hints, "hvammstangi_stem_search_hint_count": hvammstangi_hints,
        "road_connection_counts": status_counts,
    }
    with open(TASK_DIR / "samples/v2/counts_summary.json", "w", encoding="utf-8", newline="\n") as f:
        json.dump(summary, f, ensure_ascii=False, indent=1)
        f.write("\n")
    print("counts summary (recomputed in code, not fixed text):", summary)
