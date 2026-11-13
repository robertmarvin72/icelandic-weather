#!/usr/bin/env python3
"""#499 base endpoints -- mechanical EA7 listing of the real ACCESS-CAPABILITIES
response. classify_capabilities.py (this round's own copy of the rule,
keyword list/logic unchanged from metadata-classification-rule.md,
SHA b3c18d67d09d5aa37c037a3768c6a275298af45fc4205954416a7c95e617510f)
applied mechanically -- discovery_candidate is never set by hand."""
import hashlib
import json
import sys
from pathlib import Path

TASK_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(Path(__file__).resolve().parent))
from classify_capabilities import enumerate_feature_types  # noqa: E402


def main():
    raw_path = TASK_DIR / "samples" / "raw-ACCESS-CAPABILITIES.xml"
    raw_bytes = raw_path.read_bytes()
    feature_types, error = enumerate_feature_types(raw_bytes)
    discovery_candidates = [ft["name"] for ft in feature_types if ft["discovery_candidate"]]

    out = {
        "capabilities_status": "RECEIVED" if error is None else "PARSE_ERROR",
        "reason": None if error is None else error,
        "raw_response_sha256": hashlib.sha256(raw_bytes).hexdigest(),
        "feature_types_enumerated_count": len(feature_types),
        "feature_types_enumerated": feature_types,
        "discovery_candidates": discovery_candidates,
        "classification_rule_used": "metadata-classification-rule.md EA7 keyword list (lower-case, diacritics stripped, substring match)",
        "classification_rule_file": "docs/ai/tasks/ticket-493-endpoint-acquisition/metadata-classification-rule.md",
        "classification_rule_sha256": "b3c18d67d09d5aa37c037a3768c6a275298af45fc4205954416a7c95e617510f",
        "driving_access_status": "EXACT_GAP",
        "driving_access_authority": {
            "file": "docs/ai/tasks/ticket-499/samples/raw-E1-WGS84.json is NOT retained here -- authority is the retained ticket-493 raw response at docs/ai/tasks/ticket-493-endpoint-acquisition/samples/raw-E1-WGS84.json",
            "pointer": "features[].properties -- 24 properties per feature (confirmed by direct read this round, not 28 as an earlier #493 report stated -- see evidence.md's dated correction), none encoding direction/one-way/access",
        },
        "driving_access_note": "discovery_candidate=true on a layer name/title (e.g. containing 'veg', 'stefna', 'access') does NOT by itself establish content, licence, one-way status, or driving access of any kind (EA7's own explicit instruction). No metadata result changes this status. No further network call, DescribeFeatureType request, or feature query was made as a result of this classification, regardless of outcome.",
        "r1_status": "No coordinate, no candidate, no connection claim resolved by this run. R1's own exact point remains PENDING (see endpoint-registry.json's own r1 entry for the retained-but-unselected Rauðavatn candidate and the proposed next owner decision).",
        "license_note": "Vegagerðin's own 'Skilmálar vefþjónustur' CC BY 4.0 reference stands (retained from #493, unchanged). No licence inference is drawn from this round's own capabilities response (no Fees/AccessConstraints metadata was specifically examined this round).",
    }
    out_path = TASK_DIR / "discovery-gaps.json"
    with open(out_path, "w", encoding="utf-8", newline="\n") as f:
        json.dump(out, f, ensure_ascii=False, indent=1)
        f.write("\n")
    print("wrote", out_path)
    print("feature_types:", len(feature_types), "discovery_candidates:", len(discovery_candidates))


if __name__ == "__main__":
    main()
