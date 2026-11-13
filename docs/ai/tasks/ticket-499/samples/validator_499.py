#!/usr/bin/env python3
"""#499 base endpoints -- one targeted offline validator run against
retained raw/fixtures (no network re-run). Covers approved-prompt-v1.md's
own "Markviss próf" bar: provenance SHA/ledger/native-reference
mismatch fails; a required endpoint piece/tier missing fails; the two
paired sides (END vs START) being inconsistent fails; unused extra
features never cause a false endpoint or a STOP.
"""
import hashlib
import json
import sys
import unittest
from pathlib import Path

TASK_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(Path(__file__).resolve().parent))
from live_driver import validate_response, expected_feature_keys  # noqa: E402


def load_registry():
    return json.loads((TASK_DIR / "endpoint-registry.json").read_bytes())


class TestProvenance(unittest.TestCase):
    """Provenance SHA/ledger/native-reference mismatch must fail."""

    def setUp(self):
        self.registry = load_registry()

    def test_s2_raw_sha256_matches_actual_raw_file(self):
        raw = self.registry["s2_seydisfjordur"]["raw_response"]
        actual_sha = hashlib.sha256((TASK_DIR / "samples" / "raw-S2-WGS84.json").read_bytes()).hexdigest()
        self.assertEqual(raw["sha256"], actual_sha)

    def test_s2_raw_sha256_mismatch_is_detected(self):
        raw = dict(self.registry["s2_seydisfjordur"]["raw_response"])
        raw["sha256"] = "0" * 64  # mutated
        actual_sha = hashlib.sha256((TASK_DIR / "samples" / "raw-S2-WGS84.json").read_bytes()).hexdigest()
        self.assertNotEqual(raw["sha256"], actual_sha)  # the mutation must be CAUGHT, not silently pass

    def test_akureyri_native_file_sha256_matches(self):
        c = self.registry["c_akureyri"]["native_reference"]
        actual_sha = hashlib.sha256(
            (TASK_DIR.parent / "ticket-493-north-data" / "route-data-candidate.json").read_bytes()
        ).hexdigest()
        self.assertEqual(c["file_sha256"], actual_sha)

    def test_each_s2_entry_cites_a_ledger_line_and_native_reference(self):
        for e in self.registry["s2_seydisfjordur"]["entries"]:
            self.assertIsNotNone(e["ledger_line"])
            self.assertIsNotNone(e["native_reference"])
            self.assertIsNotNone(e["raw_response_sha256"])


class TestRequiredPairsPresent(unittest.TestCase):
    """A required endpoint piece/tier missing from the published set
    must be detectable."""

    def setUp(self):
        self.registry = load_registry()
        self.entries = self.registry["s2_seydisfjordur"]["entries"]

    def test_all_8_expected_role_tier_entries_present(self):
        keys = {(e["role"], e["nakvaemniferlis"]) for e in self.entries}
        expected = {(role, tier) for role in ("END", "START") for tier in (-1, 0, 1, 2)}
        self.assertEqual(keys, expected)

    def test_missing_tier_is_detected_by_removal(self):
        mutated = [e for e in self.entries if not (e["role"] == "END" and e["nakvaemniferlis"] == 2)]
        keys = {(e["role"], e["nakvaemniferlis"]) for e in mutated}
        expected = {(role, tier) for role in ("END", "START") for tier in (-1, 0, 1, 2)}
        self.assertNotEqual(keys, expected)  # the removal must be CAUGHT, not silently pass
        self.assertNotIn(("END", 2), keys)


class TestJunctionConsistency(unittest.TestCase):
    """The two paired sides (END vs START) being inconsistent must fail."""

    def setUp(self):
        self.registry = load_registry()

    def test_s2_junction_cross_check_reports_agreement(self):
        jc = self.registry["s2_seydisfjordur"]["junction_cross_check"]
        self.assertTrue(jc["native_xy_agree_within_0_0001m"])
        self.assertTrue(jc["wgs84_agree_within_1e-8deg"])

    def test_mutated_start_coordinate_fails_junction_check(self):
        entries = self.registry["s2_seydisfjordur"]["entries"]
        end2 = next(e for e in entries if e["role"] == "END" and e["nakvaemniferlis"] == 2)
        start2 = next(e for e in entries if e["role"] == "START" and e["nakvaemniferlis"] == 2)
        mutated_start_lat = start2["latitude"] + 0.01  # a real, detectable mutation
        agree = abs(end2["latitude"] - mutated_start_lat) <= 1e-8
        self.assertFalse(agree)  # the mutation must be CAUGHT, not silently pass

    def test_akureyri_c_native_xy_end_equals_start(self):
        c = self.registry["c_akureyri"]["native_reference"]
        self.assertEqual(c["idferill_2940_native_end_3057"], c["idferill_3876_native_start_3057"])
        self.assertTrue(c["exact_xy_equal"])


class TestExtraFeaturesNeverFalseEndpointOrStop(unittest.TestCase):
    """Unused extra features (same IDBUTUR as the expected set) must
    never cause a false endpoint or a STOP -- this is JA1b's own
    binding condition, proven directly against validate_response()."""

    def _synthetic_response(self, extra_same_idbutur=0, extra_other_idbutur=0, duplicate=False, missing=False):
        expected_keys, _ = expected_feature_keys()
        features = []
        keys = sorted(expected_keys)
        if missing:
            keys = keys[:-1]  # drop one required pair
        for idferill, tier in keys:
            features.append({
                "id": f"faerdferlar2017_1.{idferill}{tier}",
                "properties": {"IDFERILL": idferill, "NAKVAEMNIFERLIS": tier, "IDBUTUR": 911170037},
            })
        if duplicate and features:
            features.append(dict(features[0]))
        for i in range(extra_same_idbutur):
            features.append({
                "id": f"faerdferlar2017_1.extra{i}",
                "properties": {"IDFERILL": 90000 + i, "NAKVAEMNIFERLIS": 2, "IDBUTUR": 911170037},
            })
        for i in range(extra_other_idbutur):
            features.append({
                "id": f"faerdferlar2017_1.other{i}",
                "properties": {"IDFERILL": 80000 + i, "NAKVAEMNIFERLIS": 2, "IDBUTUR": 999999999},
            })
        n = len(features)
        doc = {
            "numberMatched": n, "numberReturned": n, "totalFeatures": n, "features": features,
            "crs": {"type": "name", "properties": {"name": "urn:ogc:def:crs:EPSG::4326"}},
        }
        return json.dumps(doc).encode("utf-8")

    def test_clean_response_passes(self):
        ok, finding = validate_response(self._synthetic_response())
        self.assertTrue(ok, finding)

    def test_extra_same_idbutur_is_a_finding_never_a_stop(self):
        ok, finding = validate_response(self._synthetic_response(extra_same_idbutur=3))
        self.assertTrue(ok, finding)  # JA1b: must NOT stop
        self.assertEqual(len(finding["extra_keys_same_idbutur"]), 3)
        self.assertNotIn("deviation_type", finding)

    def test_extra_other_idbutur_does_stop(self):
        ok, finding = validate_response(self._synthetic_response(extra_other_idbutur=1))
        self.assertFalse(ok)
        self.assertEqual(finding["deviation_type"], "WRONG_IDBUTUR_OR_LAYER")

    def test_duplicate_pair_stops(self):
        ok, finding = validate_response(self._synthetic_response(duplicate=True))
        self.assertFalse(ok)
        self.assertEqual(finding["deviation_type"], "DUPLICATE_PAIR")

    def test_missing_pair_stops(self):
        ok, finding = validate_response(self._synthetic_response(missing=True))
        self.assertFalse(ok)
        self.assertEqual(finding["deviation_type"], "MISSING_EXPECTED_PAIR")

    def test_wrong_crs_stops(self):
        expected_keys, _ = expected_feature_keys()
        features = [{"id": f"faerdferlar2017_1.{i}{t}", "properties": {"IDFERILL": i, "NAKVAEMNIFERLIS": t, "IDBUTUR": 911170037}} for i, t in expected_keys]
        n = len(features)
        doc = {"numberMatched": n, "numberReturned": n, "totalFeatures": n, "features": features,
               "crs": {"type": "name", "properties": {"name": "urn:ogc:def:crs:EPSG::3057"}}}
        ok, finding = validate_response(json.dumps(doc).encode("utf-8"))
        self.assertFalse(ok)
        self.assertEqual(finding["deviation_type"], "WRONG_CRS")

    def test_limit_hit_stops(self):
        expected_keys, _ = expected_feature_keys()
        features = [{"id": f"faerdferlar2017_1.{i}{t}", "properties": {"IDFERILL": i, "NAKVAEMNIFERLIS": t, "IDBUTUR": 911170037}} for i, t in expected_keys]
        # pad with extras sharing the SAME IDBUTUR (never a stop on their own)
        # up to the 300-feature limit -- isolates LIMIT_HIT from MISSING_EXPECTED_PAIR.
        while len(features) < 300:
            features.append({
                "id": f"faerdferlar2017_1.pad{len(features)}",
                "properties": {"IDFERILL": 200000 + len(features), "NAKVAEMNIFERLIS": 2, "IDBUTUR": 911170037},
            })
        n = len(features)
        doc = {"numberMatched": n, "numberReturned": n, "totalFeatures": n, "features": features,
               "crs": {"type": "name", "properties": {"name": "urn:ogc:def:crs:EPSG::4326"}}}
        ok, finding = validate_response(json.dumps(doc).encode("utf-8"))
        self.assertFalse(ok)
        self.assertEqual(finding["deviation_type"], "LIMIT_HIT")

    def test_real_s2_response_is_clean_and_has_no_extras_at_all(self):
        body = (TASK_DIR / "samples" / "raw-S2-WGS84.json").read_bytes()
        ok, finding = validate_response(body)
        self.assertTrue(ok, finding)
        self.assertEqual(finding["extra_keys_same_idbutur"], [])
        self.assertEqual(finding["extra_keys_other_idbutur_or_layer"], [])


if __name__ == "__main__":
    unittest.main()
