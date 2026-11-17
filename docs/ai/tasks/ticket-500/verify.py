"""#500 round-1 offline verification.

Small, targeted checks only (approved-prompt-v1.md's own "Markviss
sannprofun" section) -- not a general validator framework. Run:
    python docs/ai/tasks/ticket-500/verify.py
"""
import hashlib
import json
import copy
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent.parent.parent.parent
TASK_DIR = Path(__file__).resolve().parent

PLACES = json.loads((TASK_DIR / "places-v1.json").read_text(encoding="utf-8"))
R1 = json.loads((TASK_DIR / "r1-north-connection.json").read_text(encoding="utf-8"))
CHAIN_SOURCE = json.loads(
    (REPO_ROOT / "docs/ai/tasks/ticket-491/final-validation/route-data-candidate.json")
    .read_text(encoding="utf-8")
)


def sha256_of(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


# ---- real, callable checks (used by both the "real data" calls and the mutation tests) ----

def find_duplicate_ids(places: list) -> list:
    """Returns the list of ids that appear more than once. Real duplicate-detection logic."""
    seen = {}
    for p in places:
        seen[p["id"]] = seen.get(p["id"], 0) + 1
    return [pid for pid, count in seen.items() if count > 1]


def sha_matches_file(repo_root: Path, rel_path: str, recorded_sha: str) -> bool:
    """Recomputes the real file's SHA-256 and compares against the recorded value."""
    actual = sha256_of(repo_root / rel_path)
    return actual == recorded_sha


def is_wrongly_promoted(r1_data: dict) -> bool:
    """True if the data claims a supported/confirmed status despite H1 being INFERRED.
    This is the real gate: #501 must never read this contract as 'supported'."""
    status_for_501 = r1_data["driving_direction_and_access"]["status_for_501"]
    h1_status = r1_data["driving_direction_and_access"]["h1_status"]
    says_unsupported = "unsupported" in status_for_501.lower()
    says_inferred_not_proven = "inferred" in h1_status.lower() and "proven legal traffic direction" in h1_status.lower()
    # Wrongly promoted = claims something other than unsupported, OR drops the INFERRED caveat.
    return not (says_unsupported and says_inferred_not_proven)


# ---- 1. four unique place IDs ----

def test_four_unique_ids():
    places = PLACES["places"]
    assert len(places) == 4, f"expected 4 places, got {len(places)}"
    dupes = find_duplicate_ids(places)
    assert dupes == [], f"unexpected duplicates in real data: {dupes}"

    # Real mutation: duplicate one real id and confirm the SAME function catches it.
    mutated = copy.deepcopy(places)
    mutated[1]["id"] = mutated[0]["id"]
    dupes_after_mutation = find_duplicate_ids(mutated)
    assert dupes_after_mutation == [mutated[0]["id"]], (
        f"duplicate-detection failed to catch injected duplicate: {dupes_after_mutation}"
    )
    print("PASS test_four_unique_ids")


# ---- 2. coordinates match owner choice / raw data (cross-checked against the real raw files) ----

RAW_CHECKS = [
    # (place id, raw file, idferill, role 'END'=last vertex/'START'=first vertex, expected lat, expected lon)
    ("egilsstadir", "docs/ai/tasks/ticket-493-endpoint-acquisition/samples/raw-E1-WGS84.json", 2345, "END", 65.25861764, -14.39028964),
    ("seydisfjordur", "docs/ai/tasks/ticket-499/samples/raw-S2-WGS84.json", 2894, "END", 65.26021788, -14.00953135),
]


def test_coordinates_match_raw_data():
    by_id = {p["id"]: p for p in PLACES["places"]}
    for place_id, raw_rel, idferill, role, exp_lat, exp_lon in RAW_CHECKS:
        raw = json.loads((REPO_ROOT / raw_rel).read_text(encoding="utf-8"))
        feature = next(
            f for f in raw["features"]
            if f["properties"]["IDFERILL"] == idferill and f["properties"]["NAKVAEMNIFERLIS"] == -1
        )
        coords = feature["geometry"]["coordinates"]
        vertex = coords[-1] if role == "END" else coords[0]
        lon, lat = vertex[0], vertex[1]
        assert abs(lat - exp_lat) < 1e-6 and abs(lon - exp_lon) < 1e-6, (
            f"{place_id}: raw file coordinate {lat},{lon} does not match expected {exp_lat},{exp_lon}"
        )
        recorded = by_id[place_id]["coordinates"]
        assert abs(recorded["latitude"] - exp_lat) < 1e-6 and abs(recorded["longitude"] - exp_lon) < 1e-6, (
            f"{place_id}: places-v1.json coordinate does not match raw source"
        )
    print("PASS test_coordinates_match_raw_data")


# ---- 3. SHA references match -- and a real mismatch is actually caught ----

SHA_CHECKS = [
    ("docs/ai/tasks/ticket-483/samples/wfs-chain-4326.json", "966848554f0ce205c919625c3e6209da1fe05bcc50e7e8084ae96840ad519af4"),
    ("docs/ai/tasks/ticket-493-endpoint-acquisition/endpoint-wgs84.json", "916ac90bbb9677dce8ea67bd1408d13ae22f139b864947d1294710a9c569fa6d"),
    ("docs/ai/tasks/ticket-499/samples/raw-S2-WGS84.json", "b1b8aa63571d6377de742a02b4e2e4f35860182191846e4a88afabddf463628a"),
    ("docs/ai/tasks/ticket-491/final-validation/route-data-candidate.json", "ec56c43cbaf207bf1958b7b6e3bbfdad51c7dbb63bb50ff84bcd49d71f143087"),
]


def test_sha_references():
    for rel_path, recorded_sha in SHA_CHECKS:
        assert sha_matches_file(REPO_ROOT, rel_path, recorded_sha), f"SHA mismatch for real file {rel_path}"

    # Real mutation: corrupt one recorded SHA and confirm the SAME function catches it.
    rel_path, real_sha = SHA_CHECKS[0]
    wrong_sha = "0" * 64
    assert wrong_sha != real_sha
    assert not sha_matches_file(REPO_ROOT, rel_path, wrong_sha), (
        "sha_matches_file failed to detect an injected wrong SHA"
    )
    print("PASS test_sha_references")


# ---- 4. R1 extract preserves order/endpoints from #491, and cannot be wrongly promoted ----

def test_r1_extract_matches_source_chain():
    source_pieces = CHAIN_SOURCE["chain_pieces"][:15]  # indices 0..14: IDFERILL 1477 .. 49285
    extract = R1["chain_segments"]
    assert len(extract) == len(source_pieces) == 15

    for src, seg in zip(source_pieces, extract):
        assert src["idferill"] == seg["idferill"], (src["idferill"], seg["idferill"])
        assert src["idbutur"] == seg["idbutur"]
        assert src["veghluti"] == seg["veghluti"]
        assert src["orientation"] == seg["orientation"]
        assert abs(src["gap_from_prev_m"] - seg["gap_from_prev_m"]) < 1e-6
        assert src["native_entry_3057"] == seg["native_entry_3057"]
        assert src["native_exit_3057"] == seg["native_exit_3057"]

    # Terminal point must match #491's own P1 four_points entry exactly.
    p1 = next(p for p in CHAIN_SOURCE["four_points"] if p["id"] == "P1")
    term = R1["terminal_reference_point"]
    assert term["idferill"] == p1["idferill"] == 3025
    assert term["native_3057"] == p1["native_3057"]
    assert abs(term["wgs84"]["lat"] - p1["wgs84"]["lat"]) < 1e-6
    assert abs(term["wgs84"]["lon"] - p1["wgs84"]["lon"]) < 1e-6

    # First gap must match the source's own piece-0 gap_from_prev_m (37.39 m).
    assert abs(R1["first_gap"]["gap_m"] - CHAIN_SOURCE["chain_pieces"][0]["gap_from_prev_m"]) < 1e-6
    print("PASS test_r1_extract_matches_source_chain")


def test_access_gap_cannot_be_promoted_to_supported():
    # Real data must report unsupported + carry the INFERRED caveat.
    assert not is_wrongly_promoted(R1), "real data incorrectly flagged as wrongly-promoted"

    # Real mutation: force the status to claim 'supported' and confirm the SAME
    # checker function (not a fresh comparison) rejects it.
    mutated = copy.deepcopy(R1)
    mutated["driving_direction_and_access"]["status_for_501"] = "supported for #501 -- confirmed route"
    assert is_wrongly_promoted(mutated), "checker failed to catch an attempted promotion to 'supported'"

    # Real mutation 2: drop the INFERRED wording while keeping 'unsupported' -- still must be caught.
    mutated2 = copy.deepcopy(R1)
    mutated2["driving_direction_and_access"]["h1_status"] = "VERIFIED legal traffic direction"
    assert is_wrongly_promoted(mutated2), "checker failed to catch a dropped INFERRED caveat"
    print("PASS test_access_gap_cannot_be_promoted_to_supported")


if __name__ == "__main__":
    test_four_unique_ids()
    test_coordinates_match_raw_data()
    test_sha_references()
    test_r1_extract_matches_source_chain()
    test_access_gap_cannot_be_promoted_to_supported()
    print("ALL PASS")
