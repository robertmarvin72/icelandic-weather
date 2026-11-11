#!/usr/bin/env python3
"""
#493 access-points (approved-prompt-v1.md, G1-G8). Offline connectivity
status + endpoint candidates for the 72 work-list places, built from
data already retained by prior rounds. No network access.
"""
import csv
import hashlib
import json
import re
import unicodedata
from pathlib import Path

TASK_DIR = Path(__file__).resolve().parent.parent
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


def whole_word_contains(haystack, needle):
    """Word-boundary containment, not bare substring -- 'Laugar' must not
    match inside 'Laugardælavegur'."""
    pattern = rf"(?<![{ICELANDIC_WORD_CHARS}]){re.escape(needle)}(?![{ICELANDIC_WORD_CHARS}])"
    return re.search(pattern, haystack) is not None


def sha_size_eol(path):
    data = path.read_bytes()
    return {"sha256": hashlib.sha256(data).hexdigest(), "size_bytes": len(data), "line_ending": "CRLF" if b"\r\n" in data else "LF"}


def record_input_hashes():
    return [{"label": label, "path": str(p.relative_to(REPO_ROOT)), **sha_size_eol(p)} for label, p in INPUT_FILES]


# ---------------------------------------------------------------------
# G5 -- schema validator (numeric-or-empty; v3's own text row must fail)
# ---------------------------------------------------------------------

NUMERIC_FIELDS = ["cum_km_incl_1436", "cum_km_excl_1436"]


def schema_validate_row(row):
    for f in NUMERIC_FIELDS:
        v = row.get(f)
        if v is not None and not isinstance(v, (int, float)):
            raise AssertionError(f"schema violation: {f} holds non-numeric value {v!r} (place={row.get('name')})")
    return True


def run_schema_validator_negative_test():
    """The literal v3 SEYDISFJORDUR row (place-inventory-v3.csv) packs a
    length-comparison SENTENCE into a numeric column. MUST fail."""
    v3_literal_bad_row = {
        "name": "Seyðisfjörður",
        "cum_km_incl_1436": None,
        "cum_km_excl_1436": "26.9266 (from EGILSSTADIR_JUNCTION, now 675.0743 excl / 677.6344 incl at its own correct basis) / 27.8536 (from EGILSSTADIR_PHASE1_NODE via piece 2345's own 927.0346 m)",
    }
    rejected = False
    try:
        schema_validate_row(v3_literal_bad_row)
    except AssertionError:
        rejected = True
    assert rejected, "schema validator failed to reject the literal v3 text-in-numeric-column row"

    cleaned_row = {"name": "Seyðisfjörður", "cum_km_incl_1436": None, "cum_km_excl_1436": None, "notes": v3_literal_bad_row["cum_km_excl_1436"]}
    schema_validate_row(cleaned_row)  # must NOT raise
    return {"v3_literal_row_rejected": rejected, "cleaned_row_accepted": True}


# ---------------------------------------------------------------------
# G5 -- independent distance validator (same method as phase2 v3)
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
                "direction": s["direction"],
                "entry_coord": s["entry"],
                "exit_coord": s["exit"],
                "entry_cum_km_incl_1436": entry_incl / 1000,
                "entry_cum_km_excl_1436": (entry_incl - p1436) / 1000,
                "exit_cum_km_incl_1436": exit_incl / 1000,
                "exit_cum_km_excl_1436": (exit_incl - p1436) / 1000,
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
                "direction": s["direction"],
                "entry_coord": s["entry"],
                "exit_coord": s["exit"],
                "entry_cum_km_incl_1436": entry_incl / 1000,
                "entry_cum_km_excl_1436": (entry_incl - p1436) / 1000,
                "exit_cum_km_incl_1436": exit_incl / 1000,
                "exit_cum_km_excl_1436": (exit_incl - p1436) / 1000,
            }
    return None


def _close(a, b, tol_m=0.1):
    return ((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2) ** 0.5 <= tol_m


def validate_node(record, idferill, cw, stored):
    expected = validator_expected_node(cw, idferill)
    assert expected is not None, f"idferill {idferill} not in cw_long"
    se = stored[idferill]
    exp_entry_role, exp_exit_role = (se["end"], se["start"]) if expected["direction"] == "rev" else (se["start"], se["end"])
    assert _close(record["entry_coord"], exp_entry_role), f"entry coord mismatch for {idferill}"
    assert _close(record["exit_coord"], exp_exit_role), f"exit coord mismatch for {idferill}"
    for field in ("entry_cum_km_incl_1436", "entry_cum_km_excl_1436", "exit_cum_km_incl_1436", "exit_cum_km_excl_1436"):
        assert abs(record[field] - expected[field]) <= 0.0001, f"{field} mismatch for {idferill}: {record[field]} != {expected[field]}"
    return True


def cw_long_validated_node(idferill, cw, stored):
    """Returns the validated node record, or None if idferill is not a
    cw_long step at all (NOT_VALIDATED upstream)."""
    rec = production_node(cw, idferill)
    if rec is None:
        return None
    validate_node(rec, idferill, cw, stored)
    return rec


def run_multi_piece_mutation_tests(cw, stored, idferills):
    """G5: same 4 mutation tests as phase2 v3, repeated on MORE than one
    piece this round. All must be rejected by the SAME validate_node."""
    results = {}
    for idf in idferills:
        correct = production_node(cw, idf)
        if correct is None:
            continue
        validate_node(correct, idf, cw, stored)  # sanity: must pass first
        per_piece = {"correct_record_accepted": True}

        def expect_fail(name, mutate):
            rec = dict(correct)
            mutate(rec)
            try:
                validate_node(rec, idf, cw, stored)
                per_piece[name] = False
            except AssertionError:
                per_piece[name] = True

        expect_fail("entry_exit_coord_swap", lambda r: (r.__setitem__("entry_coord", correct["exit_coord"]), r.__setitem__("exit_coord", correct["entry_coord"])))
        expect_fail("incl_excl_field_swap", lambda r: (
            r.__setitem__("entry_cum_km_incl_1436", correct["entry_cum_km_excl_1436"]),
            r.__setitem__("entry_cum_km_excl_1436", correct["entry_cum_km_incl_1436"]),
            r.__setitem__("exit_cum_km_incl_1436", correct["exit_cum_km_excl_1436"]),
            r.__setitem__("exit_cum_km_excl_1436", correct["exit_cum_km_incl_1436"]),
        ))
        p1436_km = cw["piece_1436_length_m"] / 1000
        expect_fail("double_counted_1436", lambda r: (
            r.__setitem__("entry_cum_km_incl_1436", correct["entry_cum_km_incl_1436"] + p1436_km),
            r.__setitem__("exit_cum_km_incl_1436", correct["exit_cum_km_incl_1436"] + p1436_km),
        ))
        for k in ("entry_exit_coord_swap", "incl_excl_field_swap", "double_counted_1436"):
            assert per_piece[k], f"mutation test {k} should be rejected for piece {idf}"
        results[idf] = per_piece

    # the literal wrong v2 values, as a regression case specifically on 2345
    wrong = dict(production_node(cw, 2345))
    wrong["entry_cum_km_incl_1436"] = 680.1945
    wrong["entry_cum_km_excl_1436"] = 677.6344
    try:
        validate_node(wrong, 2345, cw, stored)
        results["literal_v2_wrong_values_2345"] = False
    except AssertionError:
        results["literal_v2_wrong_values_2345"] = True
    assert results["literal_v2_wrong_values_2345"]

    return results


# ---------------------------------------------------------------------
# G1 -- 72-place connectivity table
# ---------------------------------------------------------------------


def load_72_names_and_matching():
    d = json.loads((PHASE2_DIR / "samples/worklist_matching-v3.json").read_bytes())
    rows = d["hagstofa_matching"]
    names = [r["work_list_name"] for r in rows]
    assert len(names) == 72, f"expected 72 work-list names, got {len(names)}"
    assert len(set(names)) == 72, "duplicate name in work list"
    return names, {r["work_list_name"]: r for r in rows}


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


def load_phase1_inventory():
    with open(NETWORK_DIR / "place-inventory.csv", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))
    by_name = {}
    for r in rows:
        canonical = ALIAS_PHASE1_TO_WORKLIST.get(r["name"], r["name"])
        by_name[canonical] = r
    return rows, by_name


PHASE1_STATUS_MAP = {
    "AKUREYRI_C_OWNER_DECISION": "OWNER_APPROVED_ANCHOR",
    "ON_RING_NAME_MATCH_INFERRED": "NAME_MATCH_INFERRED",
    "BORGARNES_PER_PRIOR_ROUND_RULE": "NAME_MATCH_INFERRED",
    "NODE_UNDETERMINED": "NODE_UNDETERMINED",
    "INFERRED_OUTSIDE_VEGNR1": "NODE_UNDETERMINED",
    "CONNECTING_ROAD_NEEDED_PHASE2": "NODE_UNDETERMINED",
}

REGRESSION_NAMES = ["Hveragerði", "Kirkjubæjarklaustur", "Höfn", "Djúpivogur", "Breiðdalsvík", "Fellabær", "Varmahlíð", "Blönduós", "Mosfellsbær"]


def name_search_vegnr1(place_name, road_links):
    name_nfc = nfc(place_name)
    out = []
    for r in road_links:
        if r["vegnr"] != "1":
            continue
        if whole_word_contains(nfc(r["name"]), name_nfc) or whole_word_contains(nfc(r["desc"]), name_nfc):
            out.append(r)
    out.sort(key=lambda r: (-r["n_vertices"], r["objectid_canonical"]))
    return out


def build_connectivity_table(names, matching_by_name, road_links, phase1_by_name, cw, stored, akureyri_wgs84):
    rows = []
    gap_list = []
    mutation_pieces = set()

    for name in names:
        hm = matching_by_name[name]
        row = {
            "name": name,
            "hagstofa_pairing": hm["status"],
            "hagstofa_match_type": hm["match_type"],
            "hagstofa_codes": [c["code"] for c in hm["candidates"]],
            "road_connection": None,
            "coordinate_source": None,
            "native_x": None,
            "native_y": None,
            "native_source_piece": None,
            "native_source_field": None,
            "cum_km_incl_1436": None,
            "cum_km_excl_1436": None,
            "direction_status": "NOT_APPLICABLE",
            "gap_id": None,
            "notes": "",
        }

        p1 = phase1_by_name.get(name)
        name_match_candidates = None

        if name == "Reykjavík":
            row["road_connection"] = "NODE_UNDETERMINED"
            row["coordinate_source"] = "NO_COORDINATE_SOURCE"
            row["notes"] = "REY-CORE: no VEGNR=1 piece represents the city core itself (INFERRED_OUTSIDE_VEGNR1, phase-1). See endpoint-candidates.json for the piece-1436-based leg definitions and the Rauðavatn comparison anchor (candidate/INFERRED, never a confirmed core)."
        elif name == "Akureyri":
            row["road_connection"] = "OWNER_APPROVED_ANCHOR"
            row["coordinate_source"] = "OWNER_APPROVED_RETAINED"
            row["native_x"], row["native_y"] = 540259.2615, 577843.7582
            row["native_source_piece"] = 2940
            row["native_source_field"] = "end of 2940 = start of 3876 (road-links.csv), native xy sourced from akureyri-endpoint-decision.md"
            nd = cw_long_validated_node(3876, cw, stored)
            mutation_pieces.add(3876)
            if nd:
                row["cum_km_incl_1436"] = round(nd["exit_cum_km_incl_1436"], 4)
                row["cum_km_excl_1436"] = round(nd["exit_cum_km_excl_1436"], 4)
                row["direction_status"] = "INFERRED"
            row["notes"] = f"OWNER_APPROVED (2026-11-06). WGS84 {akureyri_wgs84} copied verbatim from akureyri-endpoint-decision.md, not recomputed. cum validated via piece 3876's own exit (= 2940's own end, 0.0 m shared coordinate)."
        elif name == "Egilsstaðir":
            row["road_connection"] = "MAPPED_CONTACT_VERIFIED"
            row["coordinate_source"] = "RETAINED_GEOMETRY"
            nd = cw_long_validated_node(2345, cw, stored)
            mutation_pieces.add(2345)
            row["native_x"], row["native_y"] = stored[2345]["end"]
            row["native_source_piece"] = 2345
            row["native_source_field"] = "stored end of 2345 (road-links.csv) = ring/road93 junction, verified 0.0 m contact with road93's own piece 2344"
            if nd:
                row["cum_km_incl_1436"] = round(nd["entry_cum_km_incl_1436"], 4)
                row["cum_km_excl_1436"] = round(nd["entry_cum_km_excl_1436"], 4)
                row["direction_status"] = "INFERRED"
            row["notes"] = "Two distinct candidate nodes exist (ring/road93 junction vs phase-1's own node); this row reports the JUNCTION node only (phase2 EGILSSTADIR_JUNCTION). See endpoint-candidates.json for both, unselected, per G4."
        elif name == "Seyðisfjörður":
            row["road_connection"] = "MAPPED_CONTACT_VERIFIED"
            row["coordinate_source"] = "NO_COORDINATE_SOURCE"
            row["notes"] = "The CONNECTING ROAD (road 93)'s own contact to the ring is verified (0.0 m, via Egilsstaðir junction) -- the SETTLEMENT's own representative coordinate is NOT chosen (several unpicked pier/town-entrance candidates; see endpoint-candidates.json, PROPOSAL per release-definition-proposal.md). No retained WGS84 exists for road 93 at all (gap)."
        elif name == "Borgarnes":
            row["road_connection"] = "NAME_MATCH_INFERRED"
            row["coordinate_source"] = "RETAINED_GEOMETRY"
            row["native_x"], row["native_y"] = stored[2819]["end"]
            row["native_source_piece"] = 2819
            row["native_source_field"] = "stored end of 2819 (road-links.csv); own name/desc ('Borgarnes-Baulan'/'Borgarnes') plus #491's own prior-round rule (PRIOR_ROUND_REFERENCE, not OWNER_APPROVED)"
            row["notes"] = "cum not validated this round: piece 2819 is on ccw_short, not cw_long -- out of this round's validator scope (see evidence.md). direction_status UNKNOWN, not INFERRED."
            row["direction_status"] = "UNKNOWN"
        elif p1 is not None:
            mapped = PHASE1_STATUS_MAP.get(p1["status"], "NODE_UNDETERMINED")
            row["road_connection"] = mapped
            idf = p1["access_node_idferill"]
            idf = int(idf) if idf not in ("NONE", "", None) else None
            if idf is not None:
                row["coordinate_source"] = "RETAINED_GEOMETRY"
                se = stored.get(idf)
                if se:
                    row["native_x"], row["native_y"] = se["end"]
                    row["native_source_piece"] = idf
                    row["native_source_field"] = f"stored end of {idf} (road-links.csv), via phase-1's own {p1['status']}"
                nd = cw_long_validated_node(idf, cw, stored)
                if nd:
                    mutation_pieces.add(idf)
                    row["cum_km_incl_1436"] = round(nd["exit_cum_km_incl_1436"], 4)
                    row["cum_km_excl_1436"] = round(nd["exit_cum_km_excl_1436"], 4)
                    row["direction_status"] = "INFERRED"
                else:
                    row["direction_status"] = "UNKNOWN"
                    row["notes"] = "NOT_VALIDATED: piece not found in cw_long this round."
            else:
                row["coordinate_source"] = "NO_COORDINATE_SOURCE"
                row["direction_status"] = "NOT_APPLICABLE"
                row["notes"] = f"phase-1 status carried forward unchanged: {p1['status']}."
        else:
            candidates = name_search_vegnr1(name, road_links)
            name_match_candidates = candidates
            if candidates:
                row["road_connection"] = "NAME_MATCH_INFERRED"
                row["coordinate_source"] = "RETAINED_GEOMETRY"
                best = candidates[0]
                row["native_x"], row["native_y"] = best["end"]
                row["native_source_piece"] = best["idferill"]
                row["native_source_field"] = f"stored end of {best['idferill']} (road-links.csv), name/desc search match ('{best['name']}' / '{best['desc']}')"
                nd = cw_long_validated_node(best["idferill"], cw, stored)
                if nd:
                    mutation_pieces.add(best["idferill"])
                    row["cum_km_incl_1436"] = round(nd["exit_cum_km_incl_1436"], 4)
                    row["cum_km_excl_1436"] = round(nd["exit_cum_km_excl_1436"], 4)
                    row["direction_status"] = "INFERRED"
                else:
                    row["direction_status"] = "UNKNOWN"
                row["notes"] = f"{len(candidates)} VEGNR=1 name/desc candidate(s) found this round (never assessed individually before); unselected, not an access point. See name_match_candidates.json."
            else:
                row["road_connection"] = "NODE_UNDETERMINED"
                row["coordinate_source"] = "NO_COORDINATE_SOURCE"
                row["direction_status"] = "NOT_APPLICABLE"
                row["notes"] = "No VEGNR=1 name/desc match found this round; never assessed individually before."

        schema_validate_row(row)

        if row["road_connection"] not in ("MAPPED_CONTACT_VERIFIED", "OWNER_APPROVED_ANCHOR") or row["coordinate_source"] == "NO_COORDINATE_SOURCE":
            gap_id = f"GAP-{len(gap_list) + 1:03d}"
            row["gap_id"] = gap_id
            gap_list.append(make_gap_entry(gap_id, name, row))

        rows.append(row)
        if name_match_candidates is not None and len(name_match_candidates) > 0:
            row["_name_match_candidates"] = name_match_candidates

    assert len(rows) == 72
    for n in REGRESSION_NAMES:
        r = next(x for x in rows if x["name"] == n)
        assert r["road_connection"] in ("NODE_UNDETERMINED", "NAME_MATCH_INFERRED"), f"regression test failed for {n}: {r['road_connection']}"

    return rows, gap_list, mutation_pieces


def make_gap_entry(gap_id, name, row):
    if row["road_connection"] == "NODE_UNDETERMINED" and row["coordinate_source"] == "NO_COORDINATE_SOURCE":
        missing = f"no VEGNR=1 (or known connecting-road) piece identified as {name}'s own access point"
        required = "retained VEGNR/connecting-road geometry naming or touching this place, OR an owner-provided reference point"
    elif row["road_connection"] == "NAME_MATCH_INFERRED":
        missing = f"{name}'s own candidate piece is a text-mention match only, not a verified contact or owner-approved anchor"
        required = "a verified multi-line contact point, or an owner decision selecting one candidate as the access point"
    else:  # MAPPED_CONTACT_VERIFIED but settlement coordinate not chosen (Seyðisfjörður)
        missing = f"{name}'s own road connection is verified, but no single coordinate represents the settlement itself"
        required = "an owner decision among the already-documented candidate nodes (endpoint-candidates.json)"
    return {
        "gap_id": gap_id,
        "place": name,
        "missing_fact": missing,
        "purpose": "to establish this place's own weather/route access point",
        "required_data": {"fields": ["geometry (LineString or Point)", "name/description", "CRS"], "crs": "EPSG:3057 (native) or EPSG:4326 (WGS84), whichever the source actually provides", "precision": "sufficient to identify a specific node, not just a route segment"},
        "proposed_host": {"existence": "UNKNOWN", "layer": "UNKNOWN", "licence": "UNKNOWN", "crs": "UNKNOWN", "status": "UNVERIFIED_PROPOSAL", "note": "nothing fetched this round; a host used by a prior round is not automatically re-authorised"},
        "authorisation": "NOT_AUTHORISED",
    }


# ---------------------------------------------------------------------
# G3/G4 -- Reykjavík legs + Egilsstaðir/Seyðisfjörður node comparison
# ---------------------------------------------------------------------


def _dist(a, b):
    return ((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2) ** 0.5


def _planar_len(coords):
    return sum(_dist(coords[i][:2], coords[i + 1][:2]) for i in range(len(coords) - 1))


def build_reykjavik_legs(stored):
    p1436 = stored[1436]
    return {
        "basis": "named by piece 1436's own stored endpoints (road-links.csv), never by compass words",
        "piece_1436_length_m": 2560.1497,
        "short_western_leg": {
            "starts_at": "piece 1436's own stored END", "coord": p1436["end"],
            "leads_toward": "Borgarnes (candidate/NAME_MATCH_INFERRED, see place-access-status.csv)",
            "cum_offset_km_excl_1436": 0.0, "cum_offset_km_incl_1436": round(2560.1497 / 1000, 4),
        },
        "long_eastern_leg": {
            "starts_at": "piece 1436's own stored START", "coord": p1436["start"],
            "leads_toward": "traverses piece 1436 itself backward before continuing around the ring",
            "cum_offset_km_excl_1436": round(-2560.1497 / 1000, 4), "cum_offset_km_incl_1436": 0.0,
        },
        "raudavatn_comparison_anchor": {
            "status": "candidate/INFERRED, never a confirmed Reykjavík core",
            "coord": p1436["start"],
            "note": "identical to the long/eastern leg's own start coordinate; retained from prior rounds as a comparison anchor only",
        },
        "rey_core": {"coordinate_source": "NO_COORDINATE_SOURCE", "note": "no VEGNR=1 piece represents the city core; no distance claim is made between Rauðavatn and the core because no core coordinate is retained"},
    }


EGILSSTADIR_SEYDISFJORDUR_NODES = [
    (2345, "end", "ring/road93 junction -- VERIFIED 0.0 m contact with road93 piece 2344"),
    (2344, "end", "end of road93's own first piece"),
    (3410, "end", "end of road93's own second piece"),
    (3409, "end", "= start of 2894; STADARLYSING names this 'kirkjugarðshorn'"),
    (2892, "start", "junction 2894/2892 (start of 2892 = end of 2894)"),
    (2891, "start", "junction 2892/2891 (start of 2891 = end of 2892)"),
    (2891, "end", "ferry pier (end of 2891) -- 'Vestdalseyrarvegur - Ferjubryggja'"),
]


def build_egilsstadir_seydisfjordur_table(road_links_by_idferill, wfs93_raw_path):
    d = json.loads(wfs93_raw_path.read_bytes())
    by_tier = {}
    for f in d["features"]:
        p = f["properties"]
        by_tier.setdefault(p["IDFERILL"], {})[p["NAKVAEMNIFERLIS"]] = f
    order = [2344, 3410, 3409, 2894, 2892, 2891]

    def cum_at(tier, upto_idferill, role):
        cum = 0.0
        for i, idf in enumerate(order):
            coords = by_tier[idf][tier]["geometry"]["coordinates"]
            if i > 0:
                prev_coords = by_tier[order[i - 1]][tier]["geometry"]["coordinates"]
                cum += _dist(prev_coords[-1][:2], coords[0][:2])
            if idf == upto_idferill and role == "start":
                return cum
            cum += _planar_len(coords)
            if idf == upto_idferill and role == "end":
                return cum
        raise AssertionError(f"{upto_idferill}/{role} not found")

    nodes = []
    for idferill, role, desc in EGILSSTADIR_SEYDISFJORDUR_NODES:
        if idferill == 2345:
            # the ring junction itself: VEGNR=1, sourced from road-links.csv, not wfs93-raw.json
            r = road_links_by_idferill.get(2345)
            nodes.append({
                "idferill": 2345, "role": role, "coord": r["end"],
                "piece_name_verbatim": r["name"], "piece_desc_verbatim": r["desc"],
                "cum_km_tier_minus1": "see place_nodes-v3.json (ring basis, 677.6344/675.0743 km incl/excl 1436) -- not road93's own 0-based count",
                "cum_km_tier_2": "not computed for the ring at tier 2 this round",
                "description": desc,
            })
            continue
        tier_minus1_feature = by_tier[idferill][-1]
        coords = tier_minus1_feature["geometry"]["coordinates"]
        coord = coords[0][:2] if role == "start" else coords[-1][:2]
        nodes.append({
            "idferill": idferill, "role": role, "coord": coord,
            "piece_name_verbatim": tier_minus1_feature["properties"].get("STUTTNAFNLEIDAR"),
            "piece_desc_verbatim": tier_minus1_feature["properties"].get("STADARLYSING"),
            "cum_km_tier_minus1": round(cum_at(-1, idferill, role) / 1000, 4),
            "cum_km_tier_2": round(cum_at(2, idferill, role) / 1000, 4),
            "description": desc,
        })

    return {
        "selection": "UNSELECTED -- every node below is a candidate; the choice of Egilsstaðir/Seyðisfjörður access point is an owner decision",
        "exit_length_variants_km": {"from_ring_junction_2345": 26.9266, "from_phase1_node_via_2345_927m": 27.8536},
        "spelling_note": "piece 2894's own STADARLYSING says 'Hánefsstaðavegur'; piece 2892's says 'Hánesstaðavegur' -- preserved verbatim, not normalised",
        "wgs84_note": "no retained WGS84 geometry exists for road 93 -- this is a data gap (see gap_list.json), not a failure",
        "nodes": nodes,
    }


def build_endpoint_candidates(stored, road_links_by_idferill, akureyri_wgs84):
    return {
        "reykjavik": build_reykjavik_legs(stored),
        "egilsstadir_seydisfjordur": build_egilsstadir_seydisfjordur_table(road_links_by_idferill, PHASE2_DIR / "samples/wfs93-raw.json"),
        "akureyri": {
            "status": "OWNER_APPROVED (owner decision 2026-11-06, akureyri-endpoint-decision.md) -- not reopened this round",
            "idferill": 2940, "native_coord": [540259.2615, 577843.7582], "wgs84": akureyri_wgs84,
            "wgs84_source": "akureyri-endpoint-decision.md (copied verbatim, not recomputed)",
        },
    }


if __name__ == "__main__":
    forbidden = {"socket", "http", "urllib", "requests", "ssl"}
    src = Path(__file__).read_text(encoding="utf-8")
    used = {m for m in forbidden if re.search(rf"^\s*(import {m}\b|from {m}\b)", src, re.MULTILINE)}
    assert not used, f"forbidden network-capable import(s) found: {used}"
    print("static import check: PASS")

    input_hashes = record_input_hashes()
    with open(TASK_DIR / "samples/input_hashes.json", "w", encoding="utf-8", newline="\n") as f:
        json.dump(input_hashes, f, ensure_ascii=False, indent=1)
        f.write("\n")
    print(f"recorded {len(input_hashes)} input file hashes")

    schema_neg_test = run_schema_validator_negative_test()
    print("schema validator negative test:", schema_neg_test)

    cw = _load_cw_long()
    road_links = load_road_links()
    stored = _stored_endpoints(road_links)

    # G5: confirm equality with place_nodes-v3.json for the four phase-2 pieces
    place_nodes_v3 = json.loads((PHASE2_DIR / "samples/place_nodes-v3.json").read_bytes())
    equality_checks = {}
    for idf_str, expected_node in place_nodes_v3["nodes_by_idferill"].items():
        idf = int(idf_str)
        got = production_node(cw, idf)
        validate_node(got, idf, cw, stored)
        for field in ("entry_cum_km_incl_1436", "entry_cum_km_excl_1436", "exit_cum_km_incl_1436", "exit_cum_km_excl_1436"):
            assert abs(got[field] - expected_node[field]) <= 0.0001, f"mismatch vs place_nodes-v3.json for {idf}.{field}"
        equality_checks[idf] = True
    print("equality with place_nodes-v3.json (4 phase-2 pieces):", equality_checks)

    names, matching_by_name = load_72_names_and_matching()
    _, phase1_by_name = load_phase1_inventory()
    akureyri_wgs84 = "65.69570405 N, 18.12371406 W"

    rows, gap_list, mutation_pieces = build_connectivity_table(names, matching_by_name, road_links, phase1_by_name, cw, stored, akureyri_wgs84)

    mutation_results = run_multi_piece_mutation_tests(cw, stored, sorted(mutation_pieces))
    print(f"mutation tests run on {len(mutation_results) - 1} pieces (plus the literal-v2-wrong-values regression):", {k: v for k, v in mutation_results.items() if k == "literal_v2_wrong_values_2345"})
    for idf, res in mutation_results.items():
        if idf == "literal_v2_wrong_values_2345":
            continue
        assert all(res.values()), f"a mutation test failed to be rejected for piece {idf}: {res}"

    name_match_candidates_out = {}
    for row in rows:
        cands = row.pop("_name_match_candidates", None)
        if cands:
            name_match_candidates_out[row["name"]] = [{"idferill": c["idferill"], "name": c["name"], "desc": c["desc"], "start": c["start"], "end": c["end"], "n_vertices": c["n_vertices"]} for c in cands]

    status_counts = {}
    for r in rows:
        status_counts[r["road_connection"]] = status_counts.get(r["road_connection"], 0) + 1
    print("road_connection counts:", status_counts)
    print("gap entries:", len(gap_list))

    fieldnames = ["name", "hagstofa_pairing", "hagstofa_match_type", "hagstofa_codes", "road_connection", "coordinate_source", "native_x", "native_y", "native_source_piece", "native_source_field", "cum_km_incl_1436", "cum_km_excl_1436", "direction_status", "gap_id", "notes"]
    with open(TASK_DIR / "place-access-status.csv", "w", encoding="utf-8", newline="") as f:
        w = csv.writer(f, lineterminator="\n")
        w.writerow(fieldnames)
        for r in rows:
            out = []
            for fn in fieldnames:
                v = r[fn]
                if fn == "hagstofa_codes":
                    v = "|".join(v)
                out.append("" if v is None else v)
            w.writerow(out)

    with open(TASK_DIR / "samples/name_match_candidates.json", "w", encoding="utf-8", newline="\n") as f:
        json.dump(name_match_candidates_out, f, ensure_ascii=False, indent=1)
        f.write("\n")

    with open(TASK_DIR / "samples/gap_list.json", "w", encoding="utf-8", newline="\n") as f:
        json.dump(gap_list, f, ensure_ascii=False, indent=1)
        f.write("\n")

    road_links_by_idferill = {r["idferill"]: r for r in road_links}
    endpoint_candidates = build_endpoint_candidates(stored, road_links_by_idferill, akureyri_wgs84)
    with open(TASK_DIR / "endpoint-candidates.json", "w", encoding="utf-8", newline="\n") as f:
        json.dump(endpoint_candidates, f, ensure_ascii=False, indent=1)
        f.write("\n")
    print("endpoint-candidates.json written")

    print("place-access-status.csv, samples/name_match_candidates.json, samples/gap_list.json written")
    print("regression test passed for all 9 names:", REGRESSION_NAMES)
