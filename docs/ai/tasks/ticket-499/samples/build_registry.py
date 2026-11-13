#!/usr/bin/env python3
"""#499 base endpoints -- assembles endpoint-registry.json from the
already-built/verified pieces (s2-wgs84-paired.json, discovery-gaps.json,
rp1_native_reference.json) plus retained #493 facts transcribed from
their own source files (paths/hashes cited, read-only, nothing
re-fetched). Run after build_s2_wgs84.py and build_discovery_gaps.py.
"""
import hashlib
import json
from pathlib import Path

TASK_DIR = Path(__file__).resolve().parent.parent


def main():
    s2 = json.loads((TASK_DIR / "samples" / "s2-wgs84-paired.json").read_bytes())
    discovery = json.loads((TASK_DIR / "discovery-gaps.json").read_bytes())

    registry = {
        "note": "All WGS84 values are produced by the server, not independently derived (EA5d) -- pairing is a construction/consistency check against retained native data, not proof of the values themselves. z is excluded from every published value (EA5a). driving_access_both_directions is EXACT_GAP for every place below -- no retained or newly-acquired field encodes direction/one-way/access.",
        "r1_reykjavik": {
            "owner_choice": "R1 approved as PRODUCT SCOPE ONLY (docs/ai/tasks/ticket-493/endpoint-owner-decisions-2026-11-11.md, 2026-11-11): Reykjavík gets one named approach with a connection supporting both ring directions. Exact point, name, and road chain are explicitly PENDING -- NOT selected by this or any prior round.",
            "status": "EXACT_GAP -- no coordinate, no selected candidate, no connection claim.",
            "retained_candidate_disclosed_not_selected": {
                "label": "Rauðavatn / piece 1436 (both ends)",
                "source": "docs/ai/tasks/ticket-493-access-points/endpoint-candidates-v3.json, key 'reykjavik'",
                "explicit_status_in_source": "unselected comparison candidate (D6) -- never a confirmed Reykjavík core",
                "entry_end_crs_3057": [365522.0175, 402772.762],
                "exit_start_crs_3057": [367768.94, 401667.09],
                "rey_core_coordinate_source": "NO_COORDINATE_SOURCE (same file) -- no VEGNR=1 piece represents the city core",
                "owner_statement": "Hvorugur Rauðavatnsendi1436 er sjálfkrafa samþykktur Reykjavíkurendi (endpoint-owner-decisions-2026-11-11.md) -- neither Rauðavatn end is automatically the Reykjavík endpoint.",
            },
            "smallest_next_step_proposed_not_executed": "A single, scoped discovery call (or retained-data search) for a named Reykjavík ring-road access point with a traceable connection in both directions -- e.g. a specific Hringbraut/Vesturlandsvegur/Suðurlandsvegur junction IDFERILL -- would let a future round select a real candidate instead of Rauðavatn. This round does not perform that search (approved-prompt-v1.md step 5's own boundary: 'ekki hefja óafmarkaða korta-/þjónustuleit').",
        },
        "e1_egilsstadir": {
            "owner_choice": "Varðveitt eigandaval (approved-prompt-v1.md step 1): Egilsstaðir E1 = IDFERILL 2345 END / IDFERILL 2344 START, WGS84 lat 65.25861764, lon -14.39028964. NOT re-selected or re-fetched this round.",
            "status": "RETAINED from #493 -- reused, not re-acquired.",
            "entries_source": "docs/ai/tasks/ticket-493-endpoint-acquisition/endpoint-wgs84.json (entries with idferill 2345/2344, all 4 tiers each)",
            "raw_response": {
                "path": "docs/ai/tasks/ticket-493-endpoint-acquisition/samples/raw-E1-WGS84.json",
                "sha256": "cb9382946098c2040dbc5c151985977974a1b7bf38aede520a7c1a312ee78355",
                "ledger_line": 1,
                "ledger_file": "docs/ai/tasks/ticket-493-endpoint-acquisition/samples/exchange-ledger.jsonl",
            },
            "native_reference": {
                "file": "docs/ai/tasks/ticket-493-endpoint-acquisition/samples/rp1_native_reference.json (e1_features)",
                "native_xy": [715153.74, 536679.93],
                "crs": "EPSG:3057",
            },
            "er1_er3_corrections_incorporated": {
                "ER1_native_reference_sha_gap": "endpoint-wgs84.json's own native_reference block does not carry the native FILE's own SHA-256 or a vertex index -- this is a retained, un-fixed gap in the #493 deliverable (not touched this round, per 'ekki breyta gömlu afhendingunni'); recorded here so this round's own registry does not silently repeat it without comment for E1. This round's own NEW S2 entries (see s2_seydisfjordur below) carry the same style of native_reference pointer; neither carries an independent native-file SHA either -- a real limitation shared by both, not newly introduced.",
                "ER2_junction_equality": "2345-END == 2344-START is a construction check only (EA5c/d), confirmed again this round for the analogous S2 junction (see junction_cross_check below) -- #493's own E1 junction was never independently re-verified by code either; both rely on the same retained-native-data consistency argument.",
                "ER3_factual": "E1's real raw response: chunked (Transfer-Encoding: chunked, confirmed in ticket-493-endpoint-acquisition/samples/exchange-ledger.jsonl), 24 properties per feature (confirmed by direct read this round: docs/ai/tasks/ticket-493-endpoint-acquisition/samples/raw-E1-WGS84.json), 32 features/32 numberMatched/32 numberReturned. The #493 cc-report.md's own 'non-chunked'/'28 properties' statements are not corrected in that file (append-only discipline, out of this round's own scope) but are not repeated here.",
            },
            "extra_features_finding_12_same_idbutur": "idferill 1985/2899/19524 x tier{-1,0,1,2}, IDBUTUR 911040037 (same as E1's own expected set) -- recorded as a finding in docs/ai/tasks/ticket-493-endpoint-acquisition/samples/live_run_summary.json; this round's own driver (JA1b) would treat this exact shape as a finding, not a stop, if E1 were ever re-run (it is not, this round).",
        },
        "s2_seydisfjordur": {
            "owner_choice": "Varðveitt vöruafmörkunartillaga samþykkt af eiganda (endpoint-decision-table-2026-11-11.md, owner 'já þetta er fínt' á endpoint-owner-decisions-2026-11-11.md): S2 = mót IDFERILL 2894 END / IDFERILL 2892 START, native EPSG:3057 (732875.6740, 538207.0762). Heiti/aðgengi/WGS84 voru PENDING fyrir þessa lotu; WGS84 er nú NÝLEGA SÓTT (þessi lota). Nákvæmt staðarheiti og akstursaðgengi eru ÁFRAM óstaðfest -- valið festir vöruafmörkun, ekki staðfest bæjarheiti eða heimild.",
            "status": "NEWLY ACQUIRED this round (S2-WGS84 call, 2026-11-13) -- real HTTPS GET to gagnaveita.vegagerdin.is, per this round's own fresh owner authorization.",
            "name_status": "Described neutrally per approved-prompt-v1.md step 4: 'Seyðisfjörður (S2)' -- a selected approach at the junction of pieces 2894/2892, precise town-core name UNCONFIRMED. Not asserted as a confirmed place-core name.",
            "entries": s2["entries"],
            "junction_cross_check": s2["junction_cross_check"],
            "raw_response": {
                "path": "docs/ai/tasks/ticket-499/samples/raw-S2-WGS84.json",
                "sha256": s2["raw_response_sha256"],
                "ledger_line": 1,
                "ledger_file": "docs/ai/tasks/ticket-499/samples/exchange-ledger.jsonl",
            },
            "driving_access_both_directions": "EXACT_GAP -- no retained or acquired field encodes direction/one-way/access for this layer (confirmed again this round: 24 properties on the real S2-WGS84 response, same schema as E1, none access-related).",
            "comparison_candidates_not_selected": {
                "note": "docs/ai/tasks/ticket-493/endpoint-decision-table-2026-11-11.md's own S1/S3/S4 comparison table (retained, unchanged) -- S2 was the owner-approved product choice among these, not the only candidate considered.",
                "S1_graveyard_corner": {"native_3057": [732722.8305, 537584.8513], "tier_minus1_km_from_E1": 25.6094},
                "S2_selected": {"native_3057": [732875.674, 538207.0762], "tier_minus1_km_from_E1": 26.2523},
                "S3": {"native_3057": [732743.757, 538421.6228], "tier_minus1_km_from_E1": 26.5131},
                "S4_ferry_dock": {"native_3057": [733080.7436, 538522.4045], "tier_minus1_km_from_E1": 26.9266},
            },
        },
        "c_akureyri": {
            "owner_choice": "Eigandi samþykkti 2026-11-06 (docs/ai/tasks/ticket-493/akureyri-endpoint-decision.md): C = mót IDFERILL 2940 END (IDBUTUR 909030037) = IDFERILL 3876 START (IDBUTUR 909360037), WGS84 65.69570405° N, 18.12371406° V.",
            "status": "RETAINED -- not re-fetched this round (JA3: no new call, per approved-prompt-v1.md step 1).",
            "latitude": 65.69570405,
            "longitude": -18.12371406,
            "native_reference": {
                "file": "docs/ai/tasks/ticket-493-north-data/route-data-candidate.json",
                "file_sha256": "094fb5d3615c1d5f0e7b372706d134bf48e9c5e954ab3ec7af61fa825b0fb4a8",
                "idferill_2940_native_end_3057": [540259.2615, 577843.7582],
                "idferill_3876_native_start_3057": [540259.2615, 577843.7582],
                "exact_xy_equal": True,
                "crs": "EPSG:3057",
            },
            "provenance_chain": "docs/ai/tasks/ticket-493-north-data/evidence-north.md (sections 1,3,5,7) + route-data-candidate.json chain_pieces -- per docs/ai/tasks/ticket-493/akureyri-endpoint-decision.md's own 'Heimildir' line. No new fetch; retained only (JA3).",
            "driving_access_both_directions": "EXACT_GAP -- unchanged; INFERRED/UNKNOWN per akureyri-endpoint-decision.md's own wording.",
        },
        "discovery_metadata": {
            "status": discovery["capabilities_status"],
            "feature_types_enumerated_count": discovery["feature_types_enumerated_count"],
            "discovery_candidates_count": len(discovery["discovery_candidates"]),
            "discovery_candidates": discovery["discovery_candidates"],
            "classification_rule_file": discovery["classification_rule_file"],
            "classification_rule_sha256": discovery["classification_rule_sha256"],
            "driving_access_note": discovery["driving_access_note"],
            "full_listing_file": "docs/ai/tasks/ticket-499/discovery-gaps.json",
            "raw_response": {
                "path": "docs/ai/tasks/ticket-499/samples/raw-ACCESS-CAPABILITIES.xml",
                "sha256": discovery["raw_response_sha256"],
                "ledger_line": 2,
                "ledger_file": "docs/ai/tasks/ticket-499/samples/exchange-ledger.jsonl",
            },
        },
        "open_items": [
            "R1 Reykjavík: no coordinate, no selected candidate -- EXACT_GAP, needs an explicit owner decision on the smallest next discovery step (see r1_reykjavik.smallest_next_step_proposed_not_executed).",
            "S2 Seyðisfjörður: precise place-core name and driving access remain unconfirmed; discovery_candidate layers (28 of 61) are flagged but NOT investigated further this round (EA7: no further call triggered by classification alone).",
            "Akureyri C and Egilsstaðir E1: driving_access_both_directions remains EXACT_GAP (no retained or acquired field encodes it anywhere in this dataset).",
            "Full From/To routing, place naming beyond these four endpoints, and any UI/app change are OUT OF SCOPE for #499 (approved-prompt-v1.md's own 'Umfang og STOP').",
        ],
    }

    out_path = TASK_DIR / "endpoint-registry.json"
    with open(out_path, "w", encoding="utf-8", newline="\n") as f:
        json.dump(registry, f, ensure_ascii=False, indent=1)
        f.write("\n")
    sha = hashlib.sha256(out_path.read_bytes()).hexdigest()
    print("wrote", out_path, "sha256:", sha)


if __name__ == "__main__":
    main()
