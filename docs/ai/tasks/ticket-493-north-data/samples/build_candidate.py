"""
#493-north-data -- v3 correction (Y1/Y4/L2/L4), on top of v2 (W1/K1/K2):

- Y1/L2: gaps are now DERIVED from the measured unrounded distance between
  consecutive pieces' own endpoints (exact_xy_equal compared on the full
  float tuple), not a blind hardcoded `{idferill: constant}` dict. The two
  named roundabout-bridge constants (1.77m, 42.84m) are asserted to be
  within 1cm of their own unrounded measurement -- documenting
  correspondence to the already-recorded evidence, not inventing a new
  threshold. direction_grade's prose is corrected from the wrong "45 of 46"
  to the correct "44 of 46" (44 exact + 2 bridged = 46 transitions).
- Y4/L4: the candidate JSON is now written with an explicit `newline="\\n"`
  (on top of the existing `encoding="utf-8"`), so the on-disk file is
  canonical LF regardless of the platform's own default line-ending
  behaviour. Byte count and SHA256 are computed by re-reading that same
  on-disk file in binary mode immediately after writing it, and both are
  printed along with the method used to compute them.

v2 fixes against v1, unchanged this round:

- v1 summed roundabout 30401's own 124.7m closed-loop length INTO the route
  distance, as if it were a through-path piece. A VEGHLUTI=5 roundabout is a
  closed ring (both its own start and end coordinate are identical), not a
  driven-through segment -- its length is retained as its own evidence field
  (`ring_30401_length_m_*`) and EXCLUDED from every route-distance total.
- v1's prose said "45 of 47 pieces VEGHLUTI=1, 2 are VEGHLUTI=5" -- wrong;
  the chain has exactly ONE VEGHLUTI=5 piece (30401). The near-Akureyri
  roundabout 33604 ("B") is a separate, nearby feature that was never in
  chain_order at all.
- v1 described B as lying "near/at the middle" of piece 32964 without
  computing or distinguishing chord (straight-line) vs along-line distance.
  This version adds both, computed from the raw nodes (see
  inventory_chain.py's compute_b_measurement for the from-scratch version;
  this script reuses the same numbers for the candidate JSON).
- Every 0.00 m inter-piece gap is now labelled explicitly as "exact native
  coordinate contact" (VERIFIED that the two mapped lines touch), not
  "VERIFIED driving connection" -- per pre-sample-plan.md section 2's own
  rule, proximity is evidence of mapped-line contact, not of a legal route.
- chain_order below is reused as a CANDIDATE INPUT, cross-checked
  independently by inventory_chain.py's from-scratch discovery (confirmed
  identical this round) -- it is not, by itself, proof that this is the only
  possible chain.
"""
import hashlib
import json
import math
import os

R = 6371008.8

with open('docs/ai/tasks/ticket-483/samples/wfs-vegnr1-all.json', encoding='utf-8') as f:
    native = json.load(f)
with open('docs/ai/tasks/ticket-493-north-data/samples/wfs-north-4326.json', encoding='utf-8') as f:
    wgs = json.load(f)

native_t0 = {f['properties']['IDFERILL']: f for f in native['features'] if f['properties'].get('NAKVAEMNIFERLIS') == 0}
wgs_t0 = {f['properties']['IDFERILL']: f for f in wgs['features'] if f['properties'].get('NAKVAEMNIFERLIS') == 0}


def euclid(a, b):
    return math.hypot(a[0] - b[0], a[1] - b[1])


def haversine_m(lon1, lat1, lon2, lat2):
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dl = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * R * math.asin(math.sqrt(a))


def line_haversine(coords):
    return sum(haversine_m(coords[i][0], coords[i][1], coords[i + 1][0], coords[i + 1][1]) for i in range(len(coords) - 1))


def plen(coords):
    return sum(math.hypot(coords[i + 1][0] - coords[i][0], coords[i + 1][1] - coords[i][1]) for i in range(len(coords) - 1))


RING_IDFERILL = 30401  # VEGHLUTI=5 roundabout, closed loop -- excluded from route-distance totals
REFERENCE_IDFERILL = 2819  # #491's own final southbound piece -- excluded from "north-only" totals

chain_order = [2819, 30401, 2816, 2800, 2775, 2753, 3103, 3406, 3407, 3408, 2243, 1481,
               3828, 3827, 3826, 3825, 3584, 3570, 52490, 3569, 2594, 2593, 3221, 2423,
               2456, 2478, 3237, 3238, 2477, 2734, 2733, 2736, 2718, 3233, 3258, 3275,
               3016, 3015, 2995, 2940, 3876, 3505, 3504, 2727, 2726, 2725, 32964]
# Documented, named roundabout-bridge constants (rounded; Y1/L2 asserts these
# against the unrounded MEASURED distance below -- not used as the gap value
# directly, and not a general proximity threshold).
DOCUMENTED_ROUNDABOUT_GAPS_M = {30401: 1.77, 2816: 42.84}

pieces_out = []
prev_end_native = None
for idf in chain_order:
    nf = native_t0[idf]
    wf = wgs_t0[idf]
    np_ = nf['properties']
    nc = nf['geometry']['coordinates']
    wc = wf['geometry']['coordinates']
    start_native = (nc[0][0], nc[0][1])

    if prev_end_native is None:
        exact_xy_equal = None
        unrounded_gap_m = None
        gap_grade = 'start piece, no preceding gap'
    else:
        exact_xy_equal = (prev_end_native == start_native)
        unrounded_gap_m = euclid(prev_end_native, start_native)
        if exact_xy_equal:
            gap_grade = 'exact native-coordinate contact (VERIFIED that the two mapped lines touch; NOT a VERIFIED driving permission)'
        else:
            documented = DOCUMENTED_ROUNDABOUT_GAPS_M.get(idf)
            assert documented is not None, f"piece {idf} has a non-exact gap ({unrounded_gap_m:.6f}m) that is not one of the two pre-registered roundabout bridges -- this is a new, undisclosed gap and must be investigated, not silently bridged"
            deviation = unrounded_gap_m - documented
            assert abs(deviation) < 0.01, f"measured gap for {idf} ({unrounded_gap_m:.6f}m) deviates from the documented roundabout-bridge constant ({documented}m) by more than 1cm"
            gap_grade = 'bridged by pre-registered roundabout rule (NOT a VERIFIED driving connection; see pre-sample-plan.md section 2)'

    gap = round(unrounded_gap_m, 3) if unrounded_gap_m is not None else 0.0
    plen_m = plen(nc)
    hav_m = line_haversine(wc)
    is_ring = (idf == RING_IDFERILL)
    pieces_out.append({
        'idferill': idf, 'idbutur': np_['IDBUTUR'], 'veghluti': np_['VEGHLUTI'], 'kaflanr': np_['KAFLANR'],
        'is_closed_ring_excluded_from_route_distance': is_ring,
        'exact_xy_equal': exact_xy_equal,
        'gap_from_prev_m': gap,
        'unrounded_gap_from_prev_m': unrounded_gap_m,
        'gap_grade': gap_grade,
        'piece_length_m_planar_isn93': round(plen_m, 3),
        'piece_length_m_haversine_wgs84': round(hav_m, 3),
        'native_start_3057': [nc[0][0], nc[0][1]],
        'native_end_3057': [nc[-1][0], nc[-1][1]],
        'wgs84_start': [wc[0][0], wc[0][1]],
        'wgs84_end': [wc[-1][0], wc[-1][1]],
        'node_count_native': len(nc), 'node_count_wgs84': len(wc),
    })
    prev_end_native = (nc[-1][0], nc[-1][1])

gaps = {p['idferill']: p['gap_from_prev_m'] for p in pieces_out if p['gap_from_prev_m'] > 0}
assert set(gaps.keys()) == set(DOCUMENTED_ROUNDABOUT_GAPS_M.keys()), "derived non-zero-gap set no longer matches the two pre-registered roundabout bridges -- investigate before proceeding"

# Route-distance totals: EXCLUDE the ring's own loop length; keep both disclosed bridging gaps once each.
non_ring_non_ref = [p for p in pieces_out if p['idferill'] not in (RING_IDFERILL, REFERENCE_IDFERILL)]
sum_planar_north = sum(p['piece_length_m_planar_isn93'] for p in non_ring_non_ref)
sum_hav_north = sum(p['piece_length_m_haversine_wgs84'] for p in non_ring_non_ref)
gaps_sum = sum(gaps.values())  # 1.77 + 42.84, counted once each, per K1

north_only_planar_km = (sum_planar_north + gaps_sum) / 1000
north_only_hav_km = (sum_hav_north + gaps_sum) / 1000

ring_piece = next(p for p in pieces_out if p['idferill'] == RING_IDFERILL)

candidate_points = [
    {'id': 'N1', 'label_is': 'Endi stykkis 2800 (IDBUTUR 904040037)', 'idferill': 2800, 'idbutur': 904040037,
     'which': 'end', 'status': 'point is the literal end vertex of piece 2800 -- "Baula / Norðurárdalur" is a PROPOSED area name, UNKNOWN as a verified place-confirmation, not derived from the IDBUTUR name itself.'},
    {'id': 'N2', 'label_is': 'Hæsti skráði z-hnútur á stykki 3408 (IDBUTUR 904060037)', 'idferill': 3408, 'idbutur': 904060037,
     'which': 'local_max_z_vertex', 'z_elevation_m': 395.2098,
     'status': 'vertex-level local maximum within this one piece, not a terrain/DEM-derived summit; "Holtavorduheidi" is a plausible area match (independently located, not named by this data), not a verified place-confirmation.'},
    {'id': 'N3', 'label_is': 'Hæsti skráði z-hnútur á stykki 3237 (IDBUTUR 908020037)', 'idferill': 3237, 'idbutur': 908020037,
     'which': 'local_max_z_vertex', 'z_elevation_m': 422.9379,
     'status': 'same caveat as N2; "Vatnsskard" is a plausible area match, not verified.'},
    {'id': 'N4', 'label_is': 'Hæsti skráði z-hnútur á stykki 3258 (IDBUTUR 909010037)', 'idferill': 3258, 'idbutur': 909010037,
     'which': 'local_max_z_vertex', 'z_elevation_m': 544.4727,
     'status': 'highest recorded z-vertex among the 47 evidence pieces; "Oxnadalsheidi" is a plausible area match, not verified. Elevation gaps (141/1107 zero-z vertices, see z_profile) limit any "highest point of the whole chain" claim to "highest AMONG THE RECORDED z-values" only.'},
    {'id': 'N5', 'label_is': 'Síðasta tier0-línuendi fyrir útilokaða IDBUTUR 909000037 (Vaðlaheiðargöng)', 'idferill': 32964, 'idbutur': 909350037,
     'which': 'end', 'status': 'candidate SCOPE BOUNDARY, not a named "Akureyri approach" -- the chain passes through Akureyri town streets (909360037 "Tvofaldi kaflinn", 909350037) before reaching this excluded-tunnel boundary. See akureyri_endpoint_candidates for the alternative (B, roundabout 33604) and the unexamined 909030037/909360037 junction near piece 2940/3876.'},
]
z_map = {3408: 8, 3237: 44, 3258: 7}
z_coords = {}
for idf, vidx in z_map.items():
    nc = native_t0[idf]['geometry']['coordinates']
    wc = wgs_t0[idf]['geometry']['coordinates']
    z_coords[idf] = {'native': nc[vidx], 'wgs84': wc[vidx]}

# B (roundabout 33604) chord + along-line measurement, from raw native nodes (not hardcoded).
piece_32964_native = native_t0[32964]['geometry']['coordinates']
b_point_native = native_t0[33604]['geometry']['coordinates'][0]
total_len_32964 = plen(piece_32964_native)
best = None
cum = 0.0
for i in range(len(piece_32964_native) - 1):
    seg_a, seg_b = piece_32964_native[i], piece_32964_native[i + 1]
    seg_len = euclid(seg_a, seg_b)
    if seg_len > 0:
        t = ((b_point_native[0] - seg_a[0]) * (seg_b[0] - seg_a[0]) + (b_point_native[1] - seg_a[1]) * (seg_b[1] - seg_a[1])) / (seg_len ** 2)
        tc = max(0.0, min(1.0, t))
        proj = (seg_a[0] + tc * (seg_b[0] - seg_a[0]), seg_a[1] + tc * (seg_b[1] - seg_a[1]))
        d = euclid(b_point_native, proj)
        along = cum + tc * seg_len
        if best is None or d < best[0]:
            best = (d, along)
    cum += seg_len
b_dist_to_line, b_along_from_start = best
b_along_from_end = total_len_32964 - b_along_from_start
b_chord_to_start = euclid(b_point_native, piece_32964_native[0])
b_chord_to_end = euclid(b_point_native, piece_32964_native[-1])

out = {
    'generated_by': 'CC, ticket-493-north-data, v3 correction 2026-11-05 (Y1/Y4 on top of v2 W1/K1/K2 ring/role-count/B-measurement fixes; see cc-report-north-data.md "## v3" section for the full history)',
    'source': 'docs/ai/tasks/ticket-483/samples/wfs-vegnr1-all.json (native ISN93/EPSG:3057, reused unchanged) + bounded WFS call wfs-north-4326.json (EPSG:4326, unchanged from v1 -- no new network exchange this round), see samples/manifest.md for hashes',
    'status': 'ROUTE-DATA CANDIDATE, NOT app config. VEGHLUTI=1 undocumented role (#483 research-report.md line 42) -- INFERRED single/ordinarily-bidirectional carriageway, not proven legal traffic direction. Akureyri endpoint is a CANDIDATE scope boundary, not owner-approved. A 0.00m gap is VERIFIED exact-coordinate contact between mapped lines, NOT a VERIFIED driving permission (K1).',
    'continues_from_491': {
        'idferill': 2819, 'idbutur': 904040037,
        'note': 'Same piece as #491 route-data-candidate.json end_borgarnes.entry_point_idferill. Included here ONCE for chain-continuity verification; EXCLUDED from every north_only_* total below (its own length is already counted in #491 70.566/70.780km Raudavatn->Borgarnes figures).'
    },
    'chain_pieces': pieces_out,
    'ring_30401_evidence_only': {
        'idferill': 30401, 'idbutur': 904040037, 'veghluti': 5,
        'length_m_planar_isn93': ring_piece['piece_length_m_planar_isn93'],
        'length_m_haversine_wgs84': ring_piece['piece_length_m_haversine_wgs84'],
        'note': 'Closed loop (own start==own end coordinate). This length is feature-existence evidence only and is EXCLUDED from every route-distance total in this file -- a vehicle does not drive the full loop circumference as "distance travelled" (W1/K1 correction; v1 wrongly included it).'
    },
    'veghluti_role_counts_47_evidence_pieces': {'1': 46, '5': 1},
    'veghluti_role_count_note': 'v1 wrongly said "45 of 47 VEGHLUTI=1, 2 are VEGHLUTI=5" -- corrected: 46 pieces are VEGHLUTI=1, exactly 1 (the ring, 30401) is VEGHLUTI=5. The near-Akureyri roundabout 33604 ("B") was never a chain_order member in either version; it is a separate nearby feature, not a 2nd in-chain VEGHLUTI=5 piece.',
    'direction_grade': 'VERIFIED exact-coordinate contact (exact_xy_equal==True, full float-tuple comparison) for 44 of 46 inter-piece transitions (v2 wrongly said "45 of 46" -- corrected); the remaining 2 transitions (2819->30401 at an unrounded 1.770434m, 30401->2816 at an unrounded 42.840892m) are bridged by the pre-registered roundabout rule with named evidence (documented as 1.77m = #491s own recorded gap_entry_to_roundabout_m; 42.84m = continuous KAFLANR "g8" on both sides -- both asserted within 1cm of their own unrounded measurement, see chain_pieces[].unrounded_gap_from_prev_m), NOT a newly-invented proximity threshold and NOT a VERIFIED driving connection either way. VEGHLUTI role is uniformly 1 (undocumented) for all 46 non-ring pieces -- no VEGHLUTI 6/7 divided-carriageway pair exists anywhere in this stretch, so both direction conventions reuse the SAME verified-contact geometry (graded INFERRED-bidirectional-ordinary-road, not independently verified per direction -- see pre-sample-plan.md section 2).',
    'north_only_length_km_planar_isn93_excl_piece_2819_and_ring': round(north_only_planar_km, 4),
    'north_only_length_km_haversine_wgs84_excl_piece_2819_and_ring': round(north_only_hav_km, 4),
    'length_methodology_note': 'These are DISTANCE-ALONG-MAPPED-LINES approximations (haversine over WGS84 vertices + the two disclosed bridging gaps), NOT a proven driving distance -- no driving-direction/lane/turn-restriction data exists for this stretch. The 17.818km figure some earlier draft text used ("904040037 extent used by this round, WITH the ring") is a different quantity (full-IDBUTUR-partition accounting, see idbutur_904040037_coverage_note) and must not be read as this rounds own north-only route length.',
    'node_count_crosscheck': 'All 47 pieces: native ISN93 vertex count == WGS84 vertex count, exact match -- independently re-verified by samples/inventory_chain.py this round (same method as #491 final-validation).',
    'z_profile': {
        'total_vertices_47_pieces': 1107,
        'zero_z_vertices': 141,
        'zero_z_note': 'z=0 means no elevation value was recorded for that vertex in this dataset -- it is NOT evidence the point is at sea level (same convention #483 already established). 38.395 km of piece length (excluding reference piece 2819) consists ENTIRELY of zero-z vertices: 25.37 km between Blonduos and Svinvetningabraut (pieces 2456/2478, IDBUTUR 908010037) and 8.075 km within Akureyri itself (pieces 3876/3505/3504/2727/2726/2725/32964, IDBUTUR 909360037/909350037), plus 4.95km (piece 2940, IDBUTUR 909030037).',
        'local_maxima_among_recorded_z_values': [
            {'idferill': 3258, 'idbutur': 909010037, 'z_m': 544.4727},
            {'idferill': 3233, 'idbutur': 909010037, 'z_m': 477.0399},
            {'idferill': 3237, 'idbutur': 908020037, 'z_m': 422.9379},
            {'idferill': 3238, 'idbutur': 908020037, 'z_m': 420.158},
            {'idferill': 3408, 'idbutur': 904060037, 'z_m': 395.2098},
        ],
        'maxima_caveat': 'These are the highest Z VALUES ACTUALLY RECORDED in this tier0 dataset -- not a claim that no higher point exists on the real road where elevation was not recorded (141/1107 vertices, 38.4km of piece length, carry no elevation at all). Not a DEM/terrain analysis.',
    },
    'akureyri_endpoint_candidates': [
        {'candidate': 'A', 'label_is': 'Sidasta tier0-linuendi fyrir Vadlaheidargong (IDBUTUR 909000037)', 'idferill': 32964, 'idbutur': 909350037,
         'native_3057': native_t0[32964]['geometry']['coordinates'][-1], 'wgs84': wgs_t0[32964]['geometry']['coordinates'][-1],
         'note': 'This is the 0.00m exact-contact junction with EXCLUDED piece 32961 (IDBUTUR 909000037, Vadlaheidargong) -- a candidate SCOPE BOUNDARY, not a named "Akureyri approach" and not the default correct product endpoint. The chain runs through Akureyri town streets (909360037/909350037) to reach it.'},
        {'candidate': 'B', 'label_is': 'Hringtorg (VEGHLUTI=5) naer innri hluta linu 32964', 'idferill': 33604, 'idbutur': 909350037, 'veghluti': 5,
         'native_3057': native_t0[33604]['geometry']['coordinates'][0], 'wgs84': wgs_t0[33604]['geometry']['coordinates'][0],
         'feature_existence_grade': 'VERIFIED (a real, mapped roundabout feature exists at this point)',
         'route_connection_grade': 'INFERRED, NOT a chain endpoint -- its own reference node sits ~38% along piece 32964s own length, not at either end',
         'distance_to_piece_32964_point_to_line_m': round(b_dist_to_line, 3),
         'distance_along_line_from_start_m': round(b_along_from_start, 3),
         'distance_along_line_from_end_m': round(b_along_from_end, 3),
         'chord_distance_to_start_m': round(b_chord_to_start, 3),
         'chord_distance_to_end_m': round(b_chord_to_end, 3),
         'note': 'No length-to-B claim is made beyond these measured distances; B is not proposed as a product endpoint, only disclosed as a nearby mapped feature.'},
        {'candidate': 'unexamined', 'label_is': 'Mot 909030037/909360037 (stykki 2940->3876)', 'note': 'Named in Jonesy result-review round 1 as a possible alternative end, NOT investigated as an endpoint in this round -- listed so it is not silently omitted from the set of options an owner might consider.'},
    ],
    'candidate_points': candidate_points,
    'candidate_point_coordinates': {
        'N1': {'native_3057': native_t0[2800]['geometry']['coordinates'][-1], 'wgs84': wgs_t0[2800]['geometry']['coordinates'][-1]},
        'N2': {'native_3057': z_coords[3408]['native'], 'wgs84': z_coords[3408]['wgs84']},
        'N3': {'native_3057': z_coords[3237]['native'], 'wgs84': z_coords[3237]['wgs84']},
        'N4': {'native_3057': z_coords[3258]['native'], 'wgs84': z_coords[3258]['wgs84']},
        'N5': {'native_3057': native_t0[32964]['geometry']['coordinates'][-1], 'wgs84': wgs_t0[32964]['geometry']['coordinates'][-1]},
    },
    'idbutur_904040037_coverage_note': 'This is a full-IDBUTUR-partition accounting, a DIFFERENT quantity from the north_only route-distance above (it includes the ring). Full tier0 extent of IDBUTUR 904040037 is 19.694 km. #491 uses 1.876 km (pieces 2876+2819); this round uses 17.818 km (pieces 2816+2800+ring 30401, i.e. INCLUDING the rings own 124.7m loop length). Combined: 19.694 km = the full extent, no leftover/overlap for THIS ONE IDBUTUR -- this says nothing about route-distance.',
    'side_road_pieces_sharing_target_idbutur_keys': {
        'note': 'The WGS84 WFS response (ID-filtered by IDBUTUR, not by VEGNR) also returned tier0 pieces that are NOT on VEGNR=1 -- side/branch roads sharing one of the 16 target IDBUTUR road-state keys. These are NOT part of the Hringvegur chain and are NOT added to it; naming them here corrects the v1 overclaim that "all other 15 IDBUTUR are used in full" (that conflated the IDBUTUR administrative key with VEGNR=1 route geometry).',
        'pieces': [
            {'idferill': 3372, 'idbutur': 904050037, 'vegnr': '5240', 'kaflanr': '01', 'tier0_length_m': 190.4},
            {'idferill': 3587, 'idbutur': 907150037, 'vegnr': '7020', 'kaflanr': '01', 'tier0_length_m': 1016.2},
            {'idferill': 3824, 'idbutur': 907150037, 'vegnr': '704', 'kaflanr': '04', 'tier0_length_m': 1720.8},
            {'idferill': 3865, 'idbutur': 907210037, 'vegnr': '731', 'kaflanr': '01', 'tier0_length_m': 199.3},
        ],
        'sum_tier0_length_km': 3.127,
    },
}

OUT_PATH = 'docs/ai/tasks/ticket-493-north-data/route-data-candidate.json'
# Y4/L4: explicit encoding + newline so the on-disk file is canonical UTF-8/LF
# regardless of the platform's own default line-ending translation.
with open(OUT_PATH, 'w', encoding='utf-8', newline='\n') as f:
    json.dump(out, f, indent=2, ensure_ascii=False)
    f.write('\n')

# Compute byte count + SHA256 by RE-READING the same on-disk file in binary
# mode immediately after writing it -- this is the canonical LF file as it
# actually sits on disk, not a re-serialization and not a CRLF-translated copy.
with open(OUT_PATH, 'rb') as f:
    on_disk_bytes = f.read()
byte_count = len(on_disk_bytes)
sha256_hex = hashlib.sha256(on_disk_bytes).hexdigest()
assert b'\r\n' not in on_disk_bytes, 'on-disk file contains CRLF -- newline="\\n" did not produce canonical LF output'

print('wrote file, pieces:', len(pieces_out))
print('north_only_planar_km (excl ring+2819):', round(north_only_planar_km, 4))
print('north_only_hav_km (excl ring+2819):', round(north_only_hav_km, 4))
print('ring length planar/hav (m):', ring_piece['piece_length_m_planar_isn93'], ring_piece['piece_length_m_haversine_wgs84'])
print('B along-line from start/end (m):', round(b_along_from_start, 3), round(b_along_from_end, 3))
print('B chord to start/end (m):', round(b_chord_to_start, 3), round(b_chord_to_end, 3))
print()
print('=== Y4/L4: canonical on-disk file ===')
print('path:', os.path.abspath(OUT_PATH))
print('encoding: utf-8, newline: LF only (verified: no CRLF present)')
print('byte count (re-read from disk, binary mode):', byte_count)
print('SHA256 (of those exact on-disk bytes):', sha256_hex)
print('method: hashlib.sha256() over the full binary contents of the file as written by json.dump() with encoding="utf-8", newline="\\n" -- not a re-serialization, not normalized after the fact.')
