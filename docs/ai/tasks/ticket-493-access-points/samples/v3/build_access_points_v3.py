#!/usr/bin/env python3
"""
#493 access-points v3 (approved-prompt-v3.md, D1-D7/F1-F6). Corrects
five real gaps Jonesy found in v2's own correction: (D1) Borgarnes'
node_role was hardcoded as ENTRY, contradicting ccw_short's own fwd
direction (stored END there is EXIT, not ENTRY); (D2) coordinates
carried no file/sha/CRS provenance despite H4's own requirement;
(D3) the numeric-schema suffix list missed four real fields (two of
them text could silently enter); (D4) the final validator never read
stored_field and never re-ran mutation tests against itself; (D5) the
stem-search hints carried no false-positive classification; (D6/D7)
Raudavatn was single-ended and several counts/vocabulary/index claims
in v2's own docs were wrong. v1 and v2's own files are NOT touched;
this script and its own outputs live under samples/v3/ or as *-v3
files at the task root. Offline only -- no network.
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
# F3(e) -- complete, allowlist-based numeric schema (D3 fix)
# ---------------------------------------------------------------------

TEXT_KEYS = {
    "name", "place", "hagstofa_pairing", "hagstofa_match_type", "road_connection", "coordinate_source",
    "node_role", "stored_field", "record_source", "reference_status", "role_divergence", "final_validation_outcome",
    "source_path", "source_hash_key", "source_field", "crs", "native_source_field", "direction_status", "gap_id",
    "notes", "mention_category", "missing_fact", "purpose", "host_candidates_reason", "authorisation", "basis",
    "basis_note", "leads_toward", "spelling_note", "wgs84_note", "selection", "piece_name_verbatim",
    "piece_desc_verbatim", "description", "desc", "direction", "matched_token", "matched_stem_variant", "label",
    "source", "status", "hagstofa_codes", "fields", "role", "note",
}
ID_EXEMPT_KEYS = {"idferill", "piece_id", "objectid_canonical", "n_vertices", "veghluti", "native_source_piece"}
BOOL_KEYS = {"origin_marked"}
NUMERIC_KEY_SUFFIXES = ("_x", "_y", "_m", "_km", "_km_incl_1436", "_km_excl_1436", "_offset_km_incl_1436", "_offset_km_excl_1436", "_length_m", "_tier_minus1", "_tier_2", "_deg_n", "_deg_w")


def _is_numeric_key(key):
    return any(key.endswith(suf) for suf in NUMERIC_KEY_SUFFIXES)


def assert_numeric_schema(obj, path="$"):
    """Complete (allowlist) walk: EVERY leaf's key must be accounted
    for -- a string under an undocumented or numeric-pattern key
    fails; a number under a key that is neither numeric-pattern nor
    ID-exempt fails; coord is special-cased; bool never allowed."""
    if isinstance(obj, dict):
        for k, v in obj.items():
            p = f"{path}.{k}"
            if isinstance(v, bool):
                assert k in BOOL_KEYS, f"NUMERIC_SCHEMA_VIOLATION at {p}: bool under undocumented key {k!r} = {v!r}"
                continue
            if k == "coord":
                if v is not None:
                    assert isinstance(v, list) and len(v) == 2 and all(x is None or (isinstance(x, (int, float)) and not isinstance(x, bool)) for x in v), f"NUMERIC_SCHEMA_VIOLATION at {p}: coord must be null or [num,num], got {v!r}"
                continue
            if isinstance(v, str):
                assert k in TEXT_KEYS, f"NUMERIC_SCHEMA_VIOLATION at {p}: string under undocumented key {k!r} = {v!r}"
            elif isinstance(v, (int, float)):
                assert _is_numeric_key(k) or k in ID_EXEMPT_KEYS, f"NUMERIC_SCHEMA_VIOLATION at {p}: number under undocumented key {k!r} = {v!r}"
                if k in ID_EXEMPT_KEYS:
                    assert isinstance(v, int), f"NUMERIC_SCHEMA_VIOLATION at {p}: id-exempt key {k!r} must be int, got {v!r}"
            elif v is None:
                pass
            else:
                assert_numeric_schema(v, p)
    elif isinstance(obj, list):
        for i, v in enumerate(obj):
            assert_numeric_schema(v, f"{path}[{i}]")


def run_schema_validator_negative_tests_v1_verbatim(v1_endpoint_candidates_path, v1_sha):
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


def run_d3_field_negative_tests(endpoint_candidates_v3):
    """D3: the exact four fields the v2 sandbox found escaping the old
    suffix list must each independently reject a string injection."""
    paths_and_values = [
        (("akureyri", "wgs84", "lat_deg_n"), "sixty-five point six nine"),
        (("akureyri", "wgs84", "lon_deg_w"), "eighteen point one two"),
        (("egilsstadir_seydisfjordur", "exit_length_variants_km", "from_ring_junction_2345_km"), "about twenty seven km"),
        (("egilsstadir_seydisfjordur", "exit_length_variants_km", "from_phase1_node_via_2345_927m_km"), "about twenty eight km"),
    ]
    results = {}
    for path_tuple, bad_value in paths_and_values:
        doc = json.loads(json.dumps(endpoint_candidates_v3))  # deep copy
        node = doc
        for k in path_tuple[:-1]:
            node = node[k]
        node[path_tuple[-1]] = bad_value
        rejected = False
        try:
            assert_numeric_schema(doc)
        except AssertionError:
            rejected = True
        key = ".".join(path_tuple)
        results[key] = rejected
        assert rejected, f"D3 negative test FAILED to reject string injected at {key}"
    return results


# ---------------------------------------------------------------------
# Independent distance computation (prefix-sum; mutation tests + the
# separate final-output validator use suffix-sum) -- unchanged from v2
# ---------------------------------------------------------------------


def _load_cw_long():
    d = json.loads((NETWORK_DIR / "samples/chain-walks-v4.json").read_bytes())
    return d["cw_long"]


def _stored_endpoints(road_links):
    return {r["idferill"]: {"start": r["start"], "end": r["end"]} for r in road_links}


def production_node(cw, idferill):
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


def expected_role(cw, stored, idferill, role):
    expected = validator_expected_node(cw, idferill)
    assert expected is not None, f"idferill {idferill} not in cw_long"
    se = stored[idferill]
    if expected["direction"] == "rev":
        role_coord = {"ENTRY": se["end"], "EXIT": se["start"]}
        role_stored_field = {"ENTRY": "END", "EXIT": "START"}
    else:
        role_coord = {"ENTRY": se["start"], "EXIT": se["end"]}
        role_stored_field = {"ENTRY": "START", "EXIT": "END"}
    role_cum = {"ENTRY": (expected["entry_cum_km_incl_1436"], expected["entry_cum_km_excl_1436"]), "EXIT": (expected["exit_cum_km_incl_1436"], expected["exit_cum_km_excl_1436"])}
    return role_coord[role], role_stored_field[role], role_cum[role]


def validate_node_role(record, idferill, cw, stored):
    """record: {node_role, stored_field, coord, cum_km_incl_1436,
    cum_km_excl_1436}. Checks coord+cum+stored_field ALL belong to the
    SAME role of the SAME step -- the H1/D4(a) guard."""
    role = record["node_role"]
    assert role in ("ENTRY", "EXIT"), f"unknown node_role {role!r}"
    exp_coord, exp_stored_field, (want_incl, want_excl) = expected_role(cw, stored, idferill, role)
    assert _close(record["coord"], exp_coord), f"{idferill}/{role}: coord {record['coord']} != expected {exp_coord}"
    assert record["stored_field"] == exp_stored_field, f"{idferill}/{role}: stored_field {record['stored_field']} != expected {exp_stored_field}"
    assert abs(record["cum_km_incl_1436"] - want_incl) <= 0.0001, f"{idferill}/{role}: incl {record['cum_km_incl_1436']} != {want_incl}"
    assert abs(record["cum_km_excl_1436"] - want_excl) <= 0.0001, f"{idferill}/{role}: excl {record['cum_km_excl_1436']} != {want_excl}"
    return True


def run_pre_output_mutation_tests(cw, stored, idferills):
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
            stored_field = "END" if (node["direction"] == "rev") == (role == "ENTRY") else "START"
            correct = {"node_role": role, "stored_field": stored_field, "coord": coord, "cum_km_incl_1436": cum_incl, "cum_km_excl_1436": cum_excl}
            validate_node_role(correct, idf, cw, stored)
            per = {}

            def expect_fail(name, rec):
                nonlocal tests_run
                tests_run += 1
                try:
                    validate_node_role(rec, idf, cw, stored)
                    per[name] = False
                except AssertionError:
                    per[name] = True

            other_coord = node["exit_coord"] if role == "ENTRY" else node["entry_coord"]
            expect_fail("wrong_role_coord", dict(correct, coord=other_coord))
            expect_fail("incl_excl_swap", dict(correct, cum_km_incl_1436=correct["cum_km_excl_1436"], cum_km_excl_1436=correct["cum_km_incl_1436"]))
            p1436_km = cw["piece_1436_length_m"] / 1000
            expect_fail("double_counted_1436", dict(correct, cum_km_incl_1436=correct["cum_km_incl_1436"] + p1436_km))
            other_field = "START" if stored_field == "END" else "END"
            expect_fail("stored_field_swap", dict(correct, stored_field=other_field))
            results[f"{idf}_{role}"] = per
            for k, v in per.items():
                assert v, f"mutation test {k} should be rejected for {idf}/{role}: {per}"
    return results, tests_run


# ---------------------------------------------------------------------
# F1 -- per-place role readout + record_source-scoped role assertions
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


def print_phase1_role_readout(phase1_by_name, cw, ccw_short):
    print("--- F1 per-place role readout (phase-1 access_node_end vs cw_long/ccw_short) ---")
    readout = []
    for name, p1 in phase1_by_name.items():
        idf_raw = p1["access_node_idferill"]
        if idf_raw in ("NONE", "", None):
            continue
        idf = int(idf_raw)
        node = production_node(cw, idf)
        in_cw_long = node is not None
        direction = node["direction"] if node else None
        if not in_cw_long:
            ccw_step = next((s for s in ccw_short["steps"] if s["idferill"] == idf), None)
            direction = ccw_step["direction"] if ccw_step else None
        node_role, stored_field = role_from_access_node_end(p1["access_node_end"], direction)
        entry = {
            "name": name, "idferill": idf, "phase1_access_node_end": p1["access_node_end"], "in_cw_long": in_cw_long,
            "direction": direction, "derived_node_role": node_role, "derived_stored_field": stored_field,
            "phase1_status": p1["status"], "written_into_main_table_node_role": None,
        }
        readout.append(entry)
        print(" ", entry)
    print(f"--- role readout: {len(readout)} entries (places with a retained access_node_idferill; the other 13 of 24 phase-1-individually-assessed places have access_node_idferill=NONE) ---")
    return readout


# ---------------------------------------------------------------------
# F4/D5 -- general stem-search + classification (informational only)
# ---------------------------------------------------------------------

ROAD_COMPOUND_SUFFIXES = ("vegur", "braut", "stígur", "gata")


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


def _first_segment_tokens(text):
    """Splits on ' - ' and bare '-' (both literal separator styles
    seen in road-links.csv's own name/desc fields), returns the first
    word-token of each resulting segment."""
    out = []
    for sep in (" - ", "-"):
        for seg in text.split(sep):
            seg = seg.strip()
            toks = tokenize(seg)
            if toks:
                out.append(toks[0])
    return out


def classify_mention(name_field, desc_field, matched_token, place_name):
    home_tokens = {nfc(t) for t in (_first_segment_tokens(name_field) + _first_segment_tokens(desc_field))}
    place_variants = set(stem_variants(place_name))
    if any(any(t.startswith(v) for v in place_variants) for t in home_tokens):
        return "HOME_PIECE_OR_ROUTE_ENDPOINT"
    if matched_token.endswith(ROAD_COMPOUND_SUFFIXES) and len(matched_token) > len(nfc(place_name)):
        return "ROAD_NAME_COMPOUND_MENTION"
    desc_tokens = tokenize(nfc(desc_field))
    if desc_tokens and nfc(matched_token) == desc_tokens[-1]:
        return "DESTINATION_MENTION"
    return "UNCLASSIFIED_TEXT_MENTION"


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
                        category = classify_mention(r["name"], r["desc"], tok, name)
                        matches.append({"idferill": r["idferill"], "desc": r["desc"], "matched_token": tok, "matched_stem_variant": v, "mention_category": category})
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


def grep_line_numbers(path, substring):
    lines = path.read_text(encoding="utf-8").splitlines()
    return [i + 1 for i, line in enumerate(lines) if substring in line]


def make_gap_entry_v3(gap_id, name, row, hm, category_counts, host_reason):
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
        diff_km = row.get("_dual_diff_km")
        missing = f"{name}'s own piece ({row['native_source_piece']}) has TWO retained, independently-validated candidate records (phase-1's own ENTRY/stored-END pick and phase-2's own EXIT/stored-START node) that disagree by {diff_km:.4f} km; neither is promoted to a single place endpoint this round ({hagstofa_bit})"
        required = "an owner decision between the two already-identified, already-validated candidate records in samples/v3/place-node-references-v3.json"
    elif name == "Borgarnes":
        missing = f"{name}'s own road connection is a name-match-inferred candidate (piece 2819, ccw_short); no node_role/cum is validated this round because that piece is outside this round's cw_long-based validator scope -- see notes ({hagstofa_bit})"
        required = "either a ccw_short-based validator extension (out of this round's scope) or an owner decision treating the retained coordinate as sufficient"
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
    if category_counts:
        cat_str = ", ".join(f"{k}={v}" for k, v in sorted(category_counts.items()))
        note = f" {sum(category_counts.values())} stem-search hint(s) found this round, by category: {cat_str} (INFERRED, text-mention only, no road_connection effect) -- see samples/v3/stem_search_hints_v3.json."
    return {
        "gap_id": gap_id, "place": name,
        "missing_fact": missing + note,
        "purpose": "to establish this place's own weather/route access point and/or Hagstofa identity",
        "required_data": {"fields": ["geometry (LineString or Point)", "name/description", "CRS"], "crs": "EPSG:3057 (native) or EPSG:4326 (WGS84), whichever the source actually provides", "precision": "sufficient to identify a specific node, not just a route segment"},
        "host_candidates": [],
        "host_candidates_reason": host_reason,
        "authorisation": "NOT_AUTHORISED",
    }


if __name__ == "__main__":
    forbidden = {"socket", "http", "urllib", "requests", "ssl"}
    src = Path(__file__).read_text(encoding="utf-8")
    used = {m for m in forbidden if re.search(rf"^\s*(import {m}\b|from {m}\b)", src, re.MULTILINE)}
    assert not used, f"forbidden network-capable import(s) found: {used}"
    print("static import check: PASS")

    input_hashes = record_input_hashes()
    with open(TASK_DIR / "samples/v3/input_hashes_v3.json", "w", encoding="utf-8", newline="\n") as f:
        json.dump(input_hashes, f, ensure_ascii=False, indent=1)
        f.write("\n")
    input_hashes_by_label = {h["label"]: h for h in input_hashes}
    print(f"recorded {len(input_hashes)} input file hashes")

    def prov(label, piece_id, source_field, crs):
        return {"source_path": input_hashes_by_label[label]["path"], "source_hash_key": label, "piece_id": piece_id, "source_field": source_field, "crs": crs, "native_source_piece": piece_id}

    def null_prov():
        return {"source_path": None, "source_hash_key": None, "piece_id": None, "source_field": None, "crs": None, "native_source_piece": None}

    v3_baseline = json.loads((TASK_DIR / "samples/v3/v1_v2_and_input_baseline.json").read_bytes())
    v1_ec_sha = next(r["sha256"] for r in v3_baseline if r["path"].endswith("ticket-493-access-points/endpoint-candidates.json"))
    neg = run_schema_validator_negative_tests_v1_verbatim(TASK_DIR / "endpoint-candidates.json", v1_ec_sha)
    print("schema validator v1-verbatim negative test:", neg)

    cw = _load_cw_long()
    ccw_short = json.loads((NETWORK_DIR / "samples/chain-walks-v4.json").read_bytes())["ccw_short"]
    road_links = load_road_links()
    stored = _stored_endpoints(road_links)
    phase1_by_name = load_phase1_inventory()

    role_readout = print_phase1_role_readout(phase1_by_name, cw, ccw_short)

    mutation_pieces = sorted(set([2138, 3591, 3593, 3849, 2536, 2520, 3566, 2345, 3876, 1436]))
    mutation_results, tests_run = run_pre_output_mutation_tests(cw, stored, mutation_pieces)
    print(f"pre-output mutation tests: {tests_run} tests across {len(mutation_results)} (piece,role) pairs on {len(mutation_pieces)} pieces -- all rejected as required (now including stored_field_swap, D4a)")

    names, matching_by_name = load_72_names_and_matching()
    stem_hints = stem_search_all(names, road_links)
    with open(TASK_DIR / "samples/v3/stem_search_hints_v3.json", "w", encoding="utf-8", newline="\n") as f:
        json.dump(stem_hints, f, ensure_ascii=False, indent=1)
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

    total_matches = sum(len(v["matches"]) for v in stem_hints.values())
    assert total_matches == 113, f"F4 expects the v2 match set unchanged (113), got {total_matches}"
    category_totals = {}
    for v in stem_hints.values():
        for m in v["matches"]:
            category_totals[m["mention_category"]] = category_totals.get(m["mention_category"], 0) + 1
    assert sum(category_totals.values()) == total_matches, "every match must get exactly one category"
    print("F4 classification totals (113 unchanged from v2, each match exactly one category):", category_totals)

    # host_candidates_reason: cite real file+lines, computed by grep, not hand-counted
    coverage_path = TICKET493_DIR / "national-place-coverage.md"
    hagstofa_lines = grep_line_numbers(coverage_path, "hagstofa.is")
    vegagerdin_lines = grep_line_numbers(coverage_path, "vegagerdin.is")
    p2_inventory_path = PHASE2_DIR / "place-inventory-v3.csv"
    px_lines = grep_line_numbers(p2_inventory_path, "px.hagstofa.is")
    host_reason = (
        f"no retained file in this task's own input set names a host/layer for this specific place. "
        f"national-place-coverage.md lines {min(hagstofa_lines)}-{max(hagstofa_lines)} and {min(vegagerdin_lines)}-{max(vegagerdin_lines)} "
        f"cite Hagstofa and Vegagerðin as general, project-wide reference sources (not a per-place host); "
        f"place-inventory-v3.csv lines {min(px_lines)}-{max(px_lines)} cite px.hagstofa.is the same general way. "
        f"Neither is a host or layer naming any one of the gap's own specific places; no new host is proposed."
    )
    print(f"host_candidates_reason sources: national-place-coverage.md hagstofa={hagstofa_lines} vegagerdin={vegagerdin_lines}; place-inventory-v3.csv px.hagstofa={px_lines}")

    rows = []
    gap_list = []
    place_node_references = {}
    role_divergences = []
    dual_diffs = {}

    for name in names:
        hm = matching_by_name[name]
        row = {
            "name": name, "hagstofa_pairing": hm["status"], "hagstofa_match_type": hm["match_type"], "hagstofa_codes": [c["code"] for c in hm["candidates"]],
            "road_connection": None, "coordinate_source": None, "node_role": None, "stored_field": None, "record_source": None, "reference_status": None, "role_divergence": "NONE",
            "coord": None, **null_prov(), "native_source_field": None,
            "cum_km_incl_1436": None, "cum_km_excl_1436": None, "direction_status": "NOT_APPLICABLE", "gap_id": None, "notes": "",
        }
        p1 = phase1_by_name.get(name)
        stem_hint_matches = stem_hints.get(name, {}).get("matches", [])
        cat_counts = {}
        for m in stem_hint_matches:
            cat_counts[m["mention_category"]] = cat_counts.get(m["mention_category"], 0) + 1

        if name == "Reykjavík":
            leg = production_node(cw, 1436)
            assert leg["entry_coord"] == [s for s in cw["steps"] if s["idferill"] == 1436][0]["entry"]
            row["road_connection"] = "NODE_UNDETERMINED"
            row["coordinate_source"] = "NO_COORDINATE_SOURCE"
            row["notes"] = "REY-CORE: see endpoint-candidates-v3.json for the piece-1436-derived leg offsets and BOTH unselected Rauðavatn candidates (D6)."
        elif name == "Akureyri":
            node3876 = production_node(cw, 3876)
            pr = prov("road-links.csv", 3876, "end_x/end_y" if node3876["direction"] == "rev" and False else "start_x/start_y", "EPSG:3057")
            validate_node_role({"node_role": "EXIT", "stored_field": "START", "coord": node3876["exit_coord"], "cum_km_incl_1436": node3876["exit_cum_km_incl_1436"], "cum_km_excl_1436": node3876["exit_cum_km_excl_1436"]}, 3876, cw, stored)
            row.update(road_connection="OWNER_APPROVED_ANCHOR", coordinate_source="OWNER_APPROVED_RETAINED", node_role="EXIT", stored_field="START", record_source="OWNER_APPROVED", reference_status="OWNER_APPROVED_ANCHOR",
                       coord=node3876["exit_coord"], **pr, native_source_field="stored start of 3876 = stored end of 2940 (road-links.csv), 0.0 m shared coordinate",
                       cum_km_incl_1436=round(node3876["exit_cum_km_incl_1436"], 4), cum_km_excl_1436=round(node3876["exit_cum_km_excl_1436"], 4), direction_status="INFERRED",
                       notes="OWNER_APPROVED (2026-11-06). Phase-1's own access_node_end='end' for piece 2940 names the IDENTICAL coordinate via the adjacent piece; both are the same retained point (akureyri-endpoint-decision.md). OWNER_APPROVED is compared against the owner-decision file and cw_long step 3876 directly (F1), not against phase-1's own access_node_end mapping for the different piece id 2940.")
        elif name == "Egilsstaðir":
            node2345 = production_node(cw, 2345)
            pr = prov("road-links.csv", 2345, "end_x/end_y", "EPSG:3057")
            validate_node_role({"node_role": "ENTRY", "stored_field": "END", "coord": node2345["entry_coord"], "cum_km_incl_1436": node2345["entry_cum_km_incl_1436"], "cum_km_excl_1436": node2345["entry_cum_km_excl_1436"]}, 2345, cw, stored)
            p1_role, p1_stored_field = role_from_access_node_end(phase1_by_name["Egilsstaðir"]["access_node_end"], node2345["direction"])
            divergence = "ROLE_SOURCE_DIVERGENCE" if p1_role != "ENTRY" else "NONE"
            role_divergences.append({"place": "Egilsstaðir", "record_source": "PHASE2_V3_NODE", "published_role": "ENTRY", "phase1_implied_role": p1_role, "divergence": divergence})
            row.update(road_connection="MAPPED_CONTACT_VERIFIED", coordinate_source="RETAINED_GEOMETRY", node_role="ENTRY", stored_field="END", record_source="PHASE2_V3_NODE", reference_status="RING_JUNCTION_VERIFIED", role_divergence=divergence,
                       coord=node2345["entry_coord"], **pr, native_source_field="stored end of 2345 (road-links.csv) = ring/road93 junction, verified 0.0 m contact with road93 piece 2344",
                       cum_km_incl_1436=round(node2345["entry_cum_km_incl_1436"], 4), cum_km_excl_1436=round(node2345["entry_cum_km_excl_1436"], 4), direction_status="INFERRED",
                       notes=f"ROLE_SOURCE_DIVERGENCE (F1): phase-1's own access_node_end='start' implies role={p1_role} on this piece (678.5614/676.0013 km); phase-2's own reviewed work (place-inventory-v3.csv) explicitly published role=ENTRY instead, for a categorically stronger reason (a VERIFIED 0.0 m multi-line contact, not just a same-piece role reassessment) -- unlike the Selfoss-pattern three, this is a deliberate, already-reviewed choice, not an unresolved conflict. Both values printed here, not a silently-skipped assertion.")
        elif name == "Seyðisfjörður":
            row.update(road_connection="MAPPED_CONTACT_VERIFIED", coordinate_source="NO_COORDINATE_SOURCE",
                        notes="The connecting ROAD's own contact to the ring is verified (0.0 m, via the Egilsstaðir junction); the settlement's own representative coordinate is not chosen (see endpoint-candidates-v3.json, unselected). No retained WGS84 exists for road 93.")
        elif name == "Borgarnes":
            p1_role, p1_stored_field = role_from_access_node_end(phase1_by_name["Borgarnes"]["access_node_end"], "fwd")
            assert p1_role == "EXIT" and p1_stored_field == "END", (p1_role, p1_stored_field)
            row.update(road_connection="NAME_MATCH_INFERRED", coordinate_source="RETAINED_GEOMETRY", node_role=None, stored_field=None, record_source="PHASE1_ACCESS_NODE_END", reference_status="PHASE1_REFERENCE",
                       coord=stored[2819]["end"], **prov("road-links.csv", 2819, "end_x/end_y", "EPSG:3057"),
                       native_source_field="stored end of 2819 (road-links.csv); own name/desc ('Borgarnes-Baulan'/'Borgarnes') plus #491's own prior-round rule",
                       direction_status="UNKNOWN",
                       notes=(f"D1: node_role/stored_field/cum left EMPTY (not EXIT) -- piece 2819 is on ccw_short, out of this round's cw_long-based role/coord/cum validator scope, and this round does not extend validation to a second (ccw_short) basis. For transparency: role_from_access_node_end('end','fwd') COMPUTES {p1_role} (stored_field={p1_stored_field}) -- printed here and in samples/v3/phase1_role_readout_v3.json, not published into node_role. cum not validated this round (unchanged from v1/v2)."))
        elif name in DUAL_RECORD_PLACES:
            idf = DUAL_RECORD_PLACES[name]
            node = production_node(cw, idf)
            p1_role, p1_stored_field = role_from_access_node_end(phase1_by_name[name]["access_node_end"], node["direction"])
            entry_pr = prov("road-links.csv", idf, "end_x/end_y", "EPSG:3057")
            exit_pr = prov("road-links.csv", idf, "start_x/start_y", "EPSG:3057")
            entry_rec = {"place": name, "idferill": idf, "node_role": "ENTRY", "stored_field": "END", "record_source": "PHASE1_ACCESS_NODE_END", "reference_status": "PHASE1_REFERENCE", "role_divergence": "NONE",
                         "coord": node["entry_coord"], **entry_pr, "cum_km_incl_1436": round(node["entry_cum_km_incl_1436"], 4), "cum_km_excl_1436": round(node["entry_cum_km_excl_1436"], 4)}
            exit_divergence = "ROLE_SOURCE_DIVERGENCE" if p1_role != "EXIT" else "NONE"
            role_divergences.append({"place": name, "record_source": "PHASE2_V3_NODE", "published_role": "EXIT", "phase1_implied_role": p1_role, "divergence": exit_divergence})
            exit_rec = {"place": name, "idferill": idf, "node_role": "EXIT", "stored_field": "START", "record_source": "PHASE2_V3_NODE", "reference_status": "PHASE2_V3_NODE", "role_divergence": exit_divergence,
                        "coord": node["exit_coord"], **exit_pr, "cum_km_incl_1436": round(node["exit_cum_km_incl_1436"], 4), "cum_km_excl_1436": round(node["exit_cum_km_excl_1436"], 4)}
            assert (p1_role, p1_stored_field) == ("ENTRY", "END"), (name, p1_role, p1_stored_field)
            validate_node_role({"node_role": "ENTRY", "stored_field": "END", "coord": entry_rec["coord"], "cum_km_incl_1436": entry_rec["cum_km_incl_1436"], "cum_km_excl_1436": entry_rec["cum_km_excl_1436"]}, idf, cw, stored)
            validate_node_role({"node_role": "EXIT", "stored_field": "START", "coord": exit_rec["coord"], "cum_km_incl_1436": exit_rec["cum_km_incl_1436"], "cum_km_excl_1436": exit_rec["cum_km_excl_1436"]}, idf, cw, stored)
            place_node_references[name] = [entry_rec, exit_rec]
            diff_km = round(abs(entry_rec["cum_km_incl_1436"] - exit_rec["cum_km_incl_1436"]), 4)
            dual_diffs[name] = diff_km
            row.update(road_connection="NAME_MATCH_INFERRED", coordinate_source="RETAINED_GEOMETRY", record_source="PHASE1_AND_PHASE2_PAIR", reference_status="CANDIDATE_NOT_PROMOTED",
                       direction_status="UNKNOWN", native_source_piece_unused=None)
            row["native_source_piece"] = idf
            row["_dual_diff_km"] = diff_km
            row["notes"] = f"TWO candidate records exist for this piece ({idf}): phase-1's own ENTRY/stored-END pick and phase-2's own EXIT/stored-START node (role_divergence={exit_divergence} on the EXIT record, see samples/v3/role_divergences_v3.json), {diff_km:.4f} km apart. Neither is promoted to a single place endpoint this round -- see samples/v3/place-node-references-v3.json."
        elif name in PHASE1_EXIT_REFERENCE_PLACES:
            idf = PHASE1_EXIT_REFERENCE_PLACES[name]
            node = production_node(cw, idf)
            p1_role, p1_stored_field = role_from_access_node_end(phase1_by_name[name]["access_node_end"], node["direction"])
            assert (p1_role, p1_stored_field) == ("EXIT", "START"), (name, p1_role, p1_stored_field)
            validate_node_role({"node_role": "EXIT", "stored_field": "START", "coord": node["exit_coord"], "cum_km_incl_1436": node["exit_cum_km_incl_1436"], "cum_km_excl_1436": node["exit_cum_km_excl_1436"]}, idf, cw, stored)
            row.update(road_connection="NAME_MATCH_INFERRED", coordinate_source="RETAINED_GEOMETRY", node_role="EXIT", stored_field="START", record_source="PHASE1_ACCESS_NODE_END", reference_status="PHASE1_REFERENCE",
                       coord=node["exit_coord"], **prov("road-links.csv", idf, "start_x/start_y", "EPSG:3057"),
                       native_source_field=f"stored start of {idf} (road-links.csv), per phase-1's own access_node_end='start'",
                       cum_km_incl_1436=round(node["exit_cum_km_incl_1436"], 4), cum_km_excl_1436=round(node["exit_cum_km_excl_1436"], 4), direction_status="INFERRED",
                       notes="v1's own ENTRY/stored-END coordinate for this piece is NOT re-emitted as a new candidate: it was never phase-1's own retained choice, only an artefact of v1's own coord/cum role mismatch (see evidence.md H1). Role assertion (F1): published EXIT/START == role_from_access_node_end output.")
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
                    assert (node_role, stored_field) == role_from_access_node_end(p1["access_node_end"], node["direction"]), "F1 assertion: published role must equal role_from_access_node_end"
                    validate_node_role({"node_role": node_role, "stored_field": stored_field, "coord": coord, "cum_km_incl_1436": cum_incl, "cum_km_excl_1436": cum_excl}, idf, cw, stored)
                    row.update(node_role=node_role, stored_field=stored_field, record_source="PHASE1_ACCESS_NODE_END", reference_status="PHASE1_REFERENCE", coord=coord,
                               **prov("road-links.csv", idf, "end_x/end_y" if stored_field == "END" else "start_x/start_y", "EPSG:3057"),
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
                row.update(road_connection="NAME_MATCH_INFERRED", coordinate_source="RETAINED_GEOMETRY", node_role="ENTRY" if node and node["direction"] == "rev" else None, stored_field="END" if node and node["direction"] == "rev" else None,
                           record_source="THIS_ROUND_NAME_SEARCH", reference_status="CANDIDATE_NOT_PROMOTED", coord=coord, **prov("road-links.csv", best["idferill"], "end_x/end_y", "EPSG:3057"),
                           native_source_field=f"stored end of {best['idferill']} (road-links.csv), exact whole-word name/desc match ('{best['name']}' / '{best['desc']}')")
                if node and node["direction"] == "rev":
                    validate_node_role({"node_role": "ENTRY", "stored_field": "END", "coord": coord, "cum_km_incl_1436": node["entry_cum_km_incl_1436"], "cum_km_excl_1436": node["entry_cum_km_excl_1436"]}, best["idferill"], cw, stored)
                    row.update(cum_km_incl_1436=round(node["entry_cum_km_incl_1436"], 4), cum_km_excl_1436=round(node["entry_cum_km_excl_1436"], 4), direction_status="INFERRED")
                else:
                    row["direction_status"] = "UNKNOWN"
                row["notes"] = f"{len(candidates)} exact whole-word VEGNR=1 candidate(s) found (never assessed individually before); unselected, not an access point."
            else:
                row.update(road_connection="NODE_UNDETERMINED", coordinate_source="NO_COORDINATE_SOURCE", direction_status="NOT_APPLICABLE",
                           notes="No exact whole-word VEGNR=1 match found this round; never assessed individually before.")

        if cat_counts and row["road_connection"] == "NODE_UNDETERMINED":
            cat_str = ", ".join(f"{k}={v}" for k, v in sorted(cat_counts.items()))
            row["notes"] = (row["notes"] + f" {sum(cat_counts.values())} stem-search hint(s) found, by category: {cat_str} (INFERRED text mention only, no status effect) -- see samples/v3/stem_search_hints_v3.json.").strip()

        if row["road_connection"] not in ("MAPPED_CONTACT_VERIFIED", "OWNER_APPROVED_ANCHOR") or row["coordinate_source"] == "NO_COORDINATE_SOURCE" or row["reference_status"] == "CANDIDATE_NOT_PROMOTED":
            gap_id = f"GAP-{len(gap_list) + 1:03d}"
            row["gap_id"] = gap_id
            gap_list.append(make_gap_entry_v3(gap_id, name, row, hm, cat_counts, host_reason))

        rows.append(row)

    assert len(rows) == 72
    for n in REGRESSION_NAMES:
        r = next(x for x in rows if x["name"] == n)
        assert r["road_connection"] in ("NODE_UNDETERMINED", "NAME_MATCH_INFERRED"), f"regression test failed for {n}: {r['road_connection']}"
        assert n in stem_hints, f"regression place {n} did not get a real stem search"
    print("regression test (9 names) passed; all 9 received a real stem-hint search")

    with open(TASK_DIR / "samples/v3/role_divergences_v3.json", "w", encoding="utf-8", newline="\n") as f:
        json.dump(role_divergences, f, ensure_ascii=False, indent=1)
        f.write("\n")
    assert len(role_divergences) == 4 and all(d["divergence"] == "ROLE_SOURCE_DIVERGENCE" for d in role_divergences), role_divergences
    print(f"F1 role_divergences: {len(role_divergences)} PHASE2_V3_NODE records, all pre-registered as ROLE_SOURCE_DIVERGENCE:", [d["place"] for d in role_divergences])

    status_counts = {}
    for r in rows:
        status_counts[r["road_connection"]] = status_counts.get(r["road_connection"], 0) + 1
    gap_count = len(gap_list)
    no_gap_count = 72 - gap_count
    print("road_connection counts:", status_counts, "gap entries:", gap_count, "no-gap places:", no_gap_count)

    # ---------------- F1: final_validation_outcome classification over all 72 rows ----------------
    classification_counts = {"VALIDATED": 0, "NOT_VALIDATED_OUTSIDE_CW_LONG": 0, "NO_NODE": 0, "PAIR_REFERENCE": 0}
    for r in rows:
        if r["reference_status"] == "CANDIDATE_NOT_PROMOTED" and r["name"] in DUAL_RECORD_PLACES:
            outcome = "PAIR_REFERENCE"
        elif r["name"] == "Borgarnes":
            outcome = "NOT_VALIDATED_OUTSIDE_CW_LONG"
        elif r["node_role"] is not None:
            outcome = "VALIDATED"
        else:
            outcome = "NO_NODE"
        r["final_validation_outcome"] = outcome
        classification_counts[outcome] += 1
    assert sum(classification_counts.values()) == 72, classification_counts
    print("F1 final_validation_outcome counts (sum=72, no silent continue):", classification_counts)

    # drop the internal-only helper key before schema/output
    for r in rows:
        r.pop("_dual_diff_km", None)
        r.pop("native_source_piece_unused", None)

    assert_numeric_schema({"rows": rows})
    print("numeric schema check (complete allowlist form) on all 72 rows: PASS")

    # ---------------- Reykjavik legs + BOTH Rauðavatn candidates (H2/D6) ----------------
    step0 = next(s for s in cw["steps"] if s["idferill"] == 1436)
    assert step0["gap_into_m"] == 0.0, "step 0 must have zero gap_into_m"
    p1436_length_m = step0["piece_cost_m"]
    leg_entry_incl, leg_entry_excl = 0.0, -p1436_length_m / 1000
    leg_exit_incl, leg_exit_excl = p1436_length_m / 1000, 0.0
    entry_pr_1436 = prov("road-links.csv", 1436, "end_x/end_y", "EPSG:3057")
    exit_pr_1436 = prov("road-links.csv", 1436, "start_x/start_y", "EPSG:3057")
    reykjavik_legs = {
        "basis": "named by piece 1436's own stored endpoints (road-links.csv), never by compass words. Derived from cw_long step 0's own named fields (piece_cost_m, gap_into_m), not a hardcoded length.",
        "piece_1436_length_m": p1436_length_m,
        "short_western_leg_ENTRY_stored_END": {
            "node_role": "ENTRY", "stored_field": "END", "coord": step0["entry"], **entry_pr_1436,
            "leads_toward": "Borgarnes (candidate/NAME_MATCH_INFERRED)",
            "cum_offset_km_incl_1436": round(leg_entry_incl, 4), "cum_offset_km_excl_1436": round(leg_entry_excl, 4),
        },
        "long_eastern_leg_EXIT_stored_START": {
            "node_role": "EXIT", "stored_field": "START", "coord": step0["exit"], **exit_pr_1436,
            "leads_toward": "traverses piece 1436 itself (rev: ENTRY=stored END -> EXIT=stored START) before continuing around the ring",
            "cum_offset_km_incl_1436": round(leg_exit_incl, 4), "cum_offset_km_excl_1436": round(leg_exit_excl, 4),
        },
        "raudavatn_candidate_ENTRY_stored_END": {
            "status": "unselected comparison candidate (D6) -- never a confirmed Reykjavík core", "node_role": "ENTRY", "stored_field": "END", "coord": step0["entry"], **entry_pr_1436,
            "cum_offset_km_incl_1436": round(leg_entry_incl, 4), "cum_offset_km_excl_1436": round(leg_entry_excl, 4),
            "note": "identical to the short/western leg's own ENTRY coordinate; both ends of piece 1436 are reported as unselected Rauðavatn candidates per D6 -- v2's own single-ended raudavatn_comparison_anchor field is superseded by this pair, not reused with different content.",
        },
        "raudavatn_candidate_EXIT_stored_START": {
            "status": "unselected comparison candidate (D6) -- never a confirmed Reykjavík core", "node_role": "EXIT", "stored_field": "START", "coord": step0["exit"], **exit_pr_1436,
            "cum_offset_km_incl_1436": round(leg_exit_incl, 4), "cum_offset_km_excl_1436": round(leg_exit_excl, 4),
            "note": "identical to the long/eastern leg's own EXIT coordinate (this is the same point v2's own single-ended raudavatn_comparison_anchor used); now reported alongside its own ENTRY counterpart above instead of alone.",
        },
        "rey_core": {"coordinate_source": "NO_COORDINATE_SOURCE", "note": "no VEGNR=1 piece represents the city core; no distance claim is made between Rauðavatn and the core because no core coordinate is retained"},
    }
    v1_doc = json.loads((TASK_DIR / "endpoint-candidates.json").read_bytes())
    v1_short = v1_doc["reykjavik"]["short_western_leg"]
    v1_long = v1_doc["reykjavik"]["long_eastern_leg"]
    swapped_wrong = (v1_short["cum_offset_km_excl_1436"] == 0.0 and v1_short["cum_offset_km_incl_1436"] > 0 and v1_long["cum_offset_km_excl_1436"] < 0)
    assert swapped_wrong, "expected v1's own Reykjavik offsets to show the swapped-sign bug this test targets"
    print("H2 negative test: v1's own swapped Reykjavik offsets confirmed present -- v3's own values corrected above (unchanged from v2, now with both Rauðavatn ends per D6).")

    # ---------------- Egilsstadir/Seydisfjordur 7-node table (G4), renamed _km fields (D3) ----------------
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
        (2345, "end", "ring/road93 junction -- VERIFIED 0.0 m contact with road93 piece 2344", True),
        (2344, "end", "end of road93's own first piece", False),
        (3410, "end", "end of road93's own second piece", False),
        (3409, "end", "= start of 2894; STADARLYSING names this 'kirkjugarðshorn'", False),
        (2892, "start", "junction 2894/2892 (start of 2892 = end of 2894)", False),
        (2891, "start", "junction 2892/2891 (start of 2891 = end of 2892)", False),
        (2891, "end", "ferry pier (end of 2891) -- 'Vestdalseyrarvegur - Ferjubryggja'", False),
    ]
    g4_nodes = []
    for idferill, role, desc, is_2345 in node_defs:
        if is_2345:
            g4_nodes.append({
                "idferill": 2345, "role": role, "coord": stored[2345]["end"], **prov("road-links.csv", 2345, "end_x/end_y", "EPSG:3057"),
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
            "idferill": idferill, "role": role, "coord": coord, **prov("wfs93-raw.json", idferill, f"geometry.coordinates[{'0' if role == 'start' else '-1'}] of tier -1", "EPSG:3057"),
            "piece_name_verbatim": tier_minus1_feature["properties"].get("STUTTNAFNLEIDAR"),
            "piece_desc_verbatim": tier_minus1_feature["properties"].get("STADARLYSING"),
            "cum_km_tier_minus1": round(cum93_at(-1, idferill, role) / 1000, 4), "cum_km_tier_2": round(cum93_at(2, idferill, role) / 1000, 4), "origin_marked": False,
            "ring_cum_km_incl_1436": None, "ring_cum_km_excl_1436": None,
            "description": desc,
        })

    computed_from_junction = cum93_at(-1, 2891, "end") / 1000
    computed_phase1_variant = computed_from_junction + 927.0346 / 1000

    egilsstadir_seydisfjordur = {
        "selection": "UNSELECTED -- every node below is a candidate; the choice of Egilsstaðir/Seyðisfjörður access point is an owner decision",
        "exit_length_variants_km": {"from_ring_junction_2345_km": round(computed_from_junction, 4), "from_phase1_node_via_2345_927m_km": round(computed_phase1_variant, 4), "basis_note": "both derived from retained geometry (wfs93-raw.json tier -1 sum; chain-walks-v4.json piece 2345 length) via cum93_at()/production_node(), not literals -- field names carry an explicit _km suffix (D3) so the numeric-schema completeness check cannot miss them"},
        "spelling_note": "piece 2894's own STADARLYSING says 'Hánefsstaðavegur'; piece 2892's says 'Hánesstaðavegur' -- preserved verbatim, not normalised",
        "wgs84_note": "no retained WGS84 geometry exists for road 93 -- this is a data gap, not a failure",
        "nodes": g4_nodes,
    }
    assert abs(computed_from_junction - 26.9266) <= 0.0001, computed_from_junction
    assert abs(computed_phase1_variant - 27.8536) <= 0.001, computed_phase1_variant
    print("26.9266/27.8536 km re-verified against retained geometry (unchanged from v2):", round(computed_from_junction, 4), round(computed_phase1_variant, 4))

    # ---------------- Akureyri WGS84: parsed from the file, not a literal (D2/F2) ----------------
    akureyri_decision_text = (TICKET493_DIR / "akureyri-endpoint-decision.md").read_text(encoding="utf-8")
    m = re.search(r"(\d+\.\d+)\s*°\s*N,\s*(\d+\.\d+)\s*°\s*V", akureyri_decision_text)
    assert m, "could not parse Akureyri WGS84 degrees from akureyri-endpoint-decision.md -- failing loudly, no hardcoded fallback"
    akureyri_lat = float(m.group(1))
    akureyri_lon = float(m.group(2))
    print(f"Akureyri WGS84 parsed from akureyri-endpoint-decision.md: {akureyri_lat} N, {akureyri_lon} V (not a bare literal)")

    akureyri_block = {
        "status": "OWNER_APPROVED (owner decision 2026-11-06, akureyri-endpoint-decision.md) -- not reopened this round",
        "idferill": 2940, "coord": [540259.2615, 577843.7582], **prov("road-links.csv", 2940, "end_x/end_y (shared with start of 3876)", "EPSG:3057"),
        "wgs84": {"lat_deg_n": akureyri_lat, "lon_deg_w": akureyri_lon, "source": "akureyri-endpoint-decision.md", **prov("akureyri-endpoint-decision.md", None, "parsed from markdown text ('<lat>° N, <lon>° V')", "EPSG:4326")},
    }
    endpoint_candidates_v3 = {"reykjavik": reykjavik_legs, "egilsstadir_seydisfjordur": egilsstadir_seydisfjordur, "akureyri": akureyri_block}
    assert_numeric_schema(endpoint_candidates_v3)
    print("numeric schema check on endpoint-candidates-v3.json: PASS")

    d3_results = run_d3_field_negative_tests(endpoint_candidates_v3)
    print("D3 field-specific negative tests (all 4 must reject):", d3_results)

    # ---------------- write outputs ----------------
    fieldnames = ["name", "hagstofa_pairing", "hagstofa_match_type", "hagstofa_codes", "road_connection", "coordinate_source", "node_role", "stored_field", "record_source", "reference_status", "role_divergence", "final_validation_outcome", "native_x", "native_y", "source_path", "source_hash_key", "piece_id", "source_field", "crs", "native_source_piece", "native_source_field", "cum_km_incl_1436", "cum_km_excl_1436", "direction_status", "gap_id", "notes"]
    with open(TASK_DIR / "place-access-status-v3.csv", "w", encoding="utf-8", newline="") as f:
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

    with open(TASK_DIR / "endpoint-candidates-v3.json", "w", encoding="utf-8", newline="\n") as f:
        json.dump(endpoint_candidates_v3, f, ensure_ascii=False, indent=1)
        f.write("\n")

    with open(TASK_DIR / "samples/v3/place-node-references-v3.json", "w", encoding="utf-8", newline="\n") as f:
        json.dump(place_node_references, f, ensure_ascii=False, indent=1)
        f.write("\n")
    assert_numeric_schema(place_node_references)
    print("numeric schema check on place-node-references-v3.json: PASS")

    with open(TASK_DIR / "samples/v3/gap_list_v3.json", "w", encoding="utf-8", newline="\n") as f:
        json.dump(gap_list, f, ensure_ascii=False, indent=1)
        f.write("\n")

    with open(TASK_DIR / "samples/v3/mutation_test_summary_v3.json", "w", encoding="utf-8", newline="\n") as f:
        json.dump({"tests_run": tests_run, "pieces_tested": mutation_pieces, "per_piece_role_results": mutation_results}, f, ensure_ascii=False, indent=1)
        f.write("\n")

    with open(TASK_DIR / "samples/v3/phase1_role_readout_v3.json", "w", encoding="utf-8", newline="\n") as f:
        json.dump(role_readout, f, ensure_ascii=False, indent=1)
        f.write("\n")

    print(f"wrote place-access-status-v3.csv (72 rows), endpoint-candidates-v3.json, samples/v3/place-node-references-v3.json ({len(place_node_references)} places), samples/v3/gap_list_v3.json ({gap_count} entries)")

    # ---------------- D7(b/c): counts recomputed correctly in code ----------------
    predictable_gap_places = {"Reykjavík", "Seyðisfjörður"}
    predictable_gaps = [g for g in gap_list if g["place"] in predictable_gap_places]
    dual_candidate_gaps = [g for g in gap_list if "TWO retained, independently-validated candidate records" in g["missing_fact"]]
    ordinary_gaps = gap_count - len(predictable_gaps) - len(dual_candidate_gaps)
    assert gap_count == len(predictable_gaps) + len(dual_candidate_gaps) + ordinary_gaps, (gap_count, predictable_gaps, dual_candidate_gaps, ordinary_gaps)
    vopnafjordur_hints = len(stem_hints.get("Vopnafjörður", {}).get("matches", []))
    hvammstangi_hints = len(stem_hints.get("Hvammstangi", {}).get("matches", []))
    summary = {
        "total_rows": 72, "total_gap_entries": gap_count, "no_gap_places": no_gap_count,
        "predictable_BLOCKED_sub_item_gaps": len(predictable_gaps), "predictable_gap_places": sorted(predictable_gap_places),
        "dual_candidate_gap_entries": len(dual_candidate_gaps), "dual_candidate_places": [g["place"] for g in dual_candidate_gaps],
        "ordinary_gap_entries": ordinary_gaps,
        "gap_breakdown_check": f"{gap_count} = {len(predictable_gaps)} predictable + {len(dual_candidate_gaps)} dual-candidate + {ordinary_gaps} ordinary",
        "vopnafjordur_stem_search_hint_count": vopnafjordur_hints, "hvammstangi_stem_search_hint_count": hvammstangi_hints,
        "road_connection_counts": status_counts,
        "final_validation_outcome_counts": classification_counts,
        "stem_search_total_matches": total_matches, "stem_search_category_totals": category_totals,
        "role_divergence_count": len(role_divergences), "role_divergence_places": [d["place"] for d in role_divergences],
        "role_readout_entry_count": len(role_readout),
    }
    with open(TASK_DIR / "samples/v3/counts_summary_v3.json", "w", encoding="utf-8", newline="\n") as f:
        json.dump(summary, f, ensure_ascii=False, indent=1)
        f.write("\n")
    print("counts summary (recomputed in code, D7b/c fixed):", summary)
