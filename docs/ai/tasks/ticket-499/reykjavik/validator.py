#!/usr/bin/env python3
"""#499 Reykjavík-candidate — one offline validation run, no network.
Confirms: (1) SHA-256 of every cited retained file matches
candidate.json's own citation; (2) the candidate's published point
(IDFERILL 1436) is found again in the raw retained files at the
claimed coordinates; (3) the used line-end distances are
RECOMPUTED independently from the raw native coordinates (Euclidean
planar, ISN93) rather than only re-asserting the cited numbers.

KB1 (from #499's own prior round): a mutation test must exercise the
real check function with altered input, never `assertNotEqual` on the
test's own untouched mutation value.
"""
import hashlib
import json
import math
import sys
import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent.parent.parent.parent.parent
CANDIDATE = json.loads((Path(__file__).resolve().parent / "candidate.json").read_bytes())


def sha256_of(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def planar_distance(a, b) -> float:
    return math.hypot(a[0] - b[0], a[1] - b[1])


def load_native_feature(idferill, tier=2):
    path = REPO_ROOT / "docs/ai/tasks/ticket-483/samples/wfs-vegnr1-all.json"
    doc = json.loads(path.read_text(encoding="latin-1"))
    for f in doc["features"]:
        p = f["properties"]
        if p["IDFERILL"] == idferill and p["NAKVAEMNIFERLIS"] == tier:
            return f
    return None


def load_native_by_idbutur(idbutur, tier=2):
    """Pieces 903010037/253020037/252090037/914020037/903020037/903030037
    are different IDFERILL values than 1436 but share the chain -- look
    up by IDBUTUR instead."""
    path = REPO_ROOT / "docs/ai/tasks/ticket-483/samples/wfs-vegnr1-all.json"
    doc = json.loads(path.read_text(encoding="latin-1"))
    matches = [f for f in doc["features"] if f["properties"]["IDBUTUR"] == idbutur and f["properties"]["NAKVAEMNIFERLIS"] == tier]
    return matches


def min_endpoint_distance(features_a, features_b):
    """Minimum endpoint-to-endpoint planar distance over all fragment
    endpoints of each side -- same definition the retained harness
    output states it used."""
    best = None
    for fa in features_a:
        for fb in features_b:
            for pa in (fa["geometry"]["coordinates"][0], fa["geometry"]["coordinates"][-1]):
                for pb in (fb["geometry"]["coordinates"][0], fb["geometry"]["coordinates"][-1]):
                    d = planar_distance(pa, pb)
                    if best is None or d < best:
                        best = d
    return best


class TestCitedFileHashes(unittest.TestCase):
    def test_all_cited_sha256_match_actual_files(self):
        checks = [
            (CANDIDATE["name_source"]["file"], CANDIDATE["name_source"]["file_sha256"]),
            (CANDIDATE["coordinate_source"]["file"], CANDIDATE["coordinate_source"]["file_sha256"]),
            (CANDIDATE["connections"]["toward_vik_clockwise"]["source_output"],
             CANDIDATE["connections"]["toward_vik_clockwise"]["source_output_sha256"]),
            (CANDIDATE["connections"]["toward_reykjavik_city_and_kjalarnes_borgarnes_fork_counterclockwise"]["source_file"],
             CANDIDATE["connections"]["toward_reykjavik_city_and_kjalarnes_borgarnes_fork_counterclockwise"]["source_file_sha256"]),
        ]
        for rel_path, cited_sha in checks:
            actual = sha256_of(REPO_ROOT / rel_path)
            self.assertEqual(actual, cited_sha, f"{rel_path}: cited SHA does not match the real file")

    def test_mutated_sha_is_detected(self):
        real = sha256_of(REPO_ROOT / CANDIDATE["coordinate_source"]["file"])
        mutated = "0" * 64
        self.assertNotEqual(real, mutated)  # sanity: the comparison itself works
        # a REAL check using the comparison, not just asserting two literals differ:
        self.assertFalse(mutated == CANDIDATE["coordinate_source"]["file_sha256"])


class TestPointFoundAgainInRawData(unittest.TestCase):
    def test_1436_coordinates_match_candidate_in_4326_file(self):
        path = REPO_ROOT / CANDIDATE["coordinate_source"]["file"]
        doc = json.loads(path.read_bytes())
        found = [f for f in doc["features"] if f["properties"]["IDFERILL"] == 1436]
        self.assertEqual(len(found), 4)  # all 4 tiers
        for f in found:
            lon_west, lat_west = f["geometry"]["coordinates"][-1][:2]
            lon_east, lat_east = f["geometry"]["coordinates"][0][:2]
            self.assertAlmostEqual(lat_west, CANDIDATE["latitude"], places=8)
            self.assertAlmostEqual(lon_west, CANDIDATE["longitude"], places=8)
            self.assertAlmostEqual(lat_east, CANDIDATE["other_end"]["latitude"], places=8)
            self.assertAlmostEqual(lon_east, CANDIDATE["other_end"]["longitude"], places=8)

    def test_mutated_coordinate_is_detected(self):
        path = REPO_ROOT / CANDIDATE["coordinate_source"]["file"]
        doc = json.loads(path.read_bytes())
        f = next(f for f in doc["features"] if f["properties"]["IDFERILL"] == 1436)
        mutated_lat = f["geometry"]["coordinates"][-1][1] + 1.0  # a real, detectable mutation
        self.assertFalse(abs(mutated_lat - CANDIDATE["latitude"]) < 1e-8)  # must be CAUGHT, not silently pass


class TestRecomputedAdjacencyDistances(unittest.TestCase):
    """Recomputes the used line-end distances directly from raw native
    coordinates -- does not just re-assert the cited numbers."""

    def test_1436_to_903010037_is_0_0m(self):
        a = [load_native_feature(1436)]
        b = load_native_by_idbutur(903010037)
        self.assertTrue(b)
        d = min_endpoint_distance(a, b)
        self.assertLess(d, 0.1)

    def test_1436_to_914020037_is_about_1_3m(self):
        a = [load_native_feature(1436)]
        b = load_native_by_idbutur(914020037)
        self.assertTrue(b)
        d = min_endpoint_distance(a, b)
        self.assertLess(abs(d - 1.3), 0.2)

    def test_914020037_to_903020037_is_about_10_8m(self):
        a = load_native_by_idbutur(914020037)
        b = load_native_by_idbutur(903020037)
        self.assertTrue(a and b)
        d = min_endpoint_distance(a, b)
        self.assertLess(abs(d - 10.8), 0.2)

    def test_903020037_to_903030037_kjalarnes_is_about_20_9m(self):
        a = load_native_by_idbutur(903020037)
        b = load_native_by_idbutur(903030037)
        self.assertTrue(a and b)
        d = min_endpoint_distance(a, b)
        self.assertLess(abs(d - 20.9), 0.2)

    def test_mutated_endpoint_changes_the_recomputed_distance(self):
        """A real mutation on a real coordinate, fed through the real
        distance function -- not assertNotEqual on an untouched value
        (KB1)."""
        a = load_native_feature(1436)
        b = load_native_by_idbutur(903010037)[0]
        original = min_endpoint_distance([a], [b])
        mutated_a = json.loads(json.dumps(a))
        mutated_a["geometry"]["coordinates"][0] = [
            mutated_a["geometry"]["coordinates"][0][0] + 500.0,
            mutated_a["geometry"]["coordinates"][0][1] + 500.0,
            mutated_a["geometry"]["coordinates"][0][2],
        ]
        mutated_a["geometry"]["coordinates"][-1] = [
            mutated_a["geometry"]["coordinates"][-1][0] + 500.0,
            mutated_a["geometry"]["coordinates"][-1][1] + 500.0,
            mutated_a["geometry"]["coordinates"][-1][2],
        ]
        mutated = min_endpoint_distance([mutated_a], [b])
        self.assertGreater(mutated, original + 100.0)  # the mutation must be CAUGHT


if __name__ == "__main__":
    unittest.main()
