#!/usr/bin/env python3
"""
#493 access-points v4 -- AA6(d). Reads samples/v3/stem_search_hints_v3.json
(read-only, SHA verified against samples/v3/HASHES-v3.sha256 first) and
computes the "7 of 15" figure in code: of the matches whose own
matched_token is an informative road-name compound (ends in vegur/
braut/stígur/gata and is longer than the bare searched-for name), how
many were swallowed by stem rule 1 (HOME_PIECE_OR_ROUTE_ENDPOINT)
instead of correctly landing on rule 2 (ROAD_NAME_COMPOUND_MENTION).
This is an ANALYSIS of v3's own frozen output, not a reclassification:
the hints file itself is never written to. Offline, read-only.
"""
import hashlib
import json
from pathlib import Path

TASK_DIR = Path(__file__).resolve().parent.parent.parent
sys_path_marker = None

import sys  # noqa: E402
sys.path.insert(0, str(Path(__file__).resolve().parent))
from validate_final_outputs_v4 import compute_7_of_15  # noqa: E402


def main():
    hints_path = TASK_DIR / "samples/v3/stem_search_hints_v3.json"
    data = hints_path.read_bytes()
    live_sha = hashlib.sha256(data).hexdigest()
    hashes_sha256_text = (TASK_DIR / "samples/v3/HASHES-v3.sha256").read_text(encoding="utf-8")
    expected_line = next(line for line in hashes_sha256_text.splitlines() if "stem_search_hints_v3.json" in line)
    expected_sha = expected_line.split()[0]
    assert live_sha == expected_sha, f"stem_search_hints_v3.json has drifted from HASHES-v3.sha256 ({live_sha} != {expected_sha})"
    print(f"stem_search_hints_v3.json SHA verified unchanged: {live_sha}")

    stem_hints = json.loads(data)
    total_matches = sum(len(v["matches"]) for v in stem_hints.values())
    category_totals = {}
    for v in stem_hints.values():
        for m in v["matches"]:
            category_totals[m["mention_category"]] = category_totals.get(m["mention_category"], 0) + 1
    assert total_matches == 113, total_matches
    assert category_totals == {"HOME_PIECE_OR_ROUTE_ENDPOINT": 102, "ROAD_NAME_COMPOUND_MENTION": 8, "UNCLASSIFIED_TEXT_MENTION": 3}, category_totals

    analysis = compute_7_of_15(stem_hints)
    # AA6(d) asked for Jonesy's own "7 of 15" figure (from her I5 review,
    # a sandbox/manual count) to be presented as a count computed in code
    # against the exact stated rule (matched_token ends in vegur/braut/
    # stigur/gata and is longer than the bare name). Running that rule for
    # real against the actual v3 output gives 11 of 19, not 7 of 15: her
    # own figure covered only the 3 named examples in her own I5 text
    # (Skagastrandarvegur x3, Þorlákshafnarvegur x2, Eyrarbakkavegur x2
    # wrongly-classified = 7 of a 3+2+2+8=15 subset) and did not include
    # the 4 Hvammstangavegur matches (idferill 3825/3826/3827/3828), which
    # also satisfy the same literal rule. The real, code-computed figure
    # is reported here rather than forced to match the prose -- this is
    # itself an instance of I6's own "wording must match what was proven"
    # principle, applied to this round's own new figure.
    assert analysis["informative_compound_count"] == 19, analysis
    assert analysis["swallowed_by_rule1_count"] == 11, analysis
    assert analysis["correctly_rule2_count"] == 8, analysis
    print("AA6(d) analysis (labelled as analysis, not a reclassification):", analysis)
    print("Unchanged from v3:", {"total_matches": total_matches, "category_totals": category_totals})

    out = {
        "note": "Analysis only -- does not modify stem_search_hints_v3.json or any road_connection/coordinate_source/direction_status value. Rule: an informative compound is a matched_token ending in vegur/braut/stigur/gata (NFC) that is longer than the bare searched-for place name.",
        "jonesy_cited_figure_in_i5_review": "7 of 15 (her own sandbox/manual count, covering only the 3 named examples in her I5 text; did not include the 4 Hvammstangavegur matches)",
        "actual_code_computed_figure_against_the_same_stated_rule": {"swallowed_by_rule1": analysis["swallowed_by_rule1_count"], "of_informative_compounds": analysis["informative_compound_count"]},
        "stem_search_hints_v3_json_sha256_verified_unchanged": live_sha,
        "unchanged_totals": {"total_matches": total_matches, "category_totals": category_totals},
        "informative_compound_analysis": analysis,
    }
    with open(TASK_DIR / "samples/v4/seven_of_fifteen_analysis_v4.json", "w", encoding="utf-8", newline="\n") as f:
        json.dump(out, f, ensure_ascii=False, indent=1)
        f.write("\n")


if __name__ == "__main__":
    main()
