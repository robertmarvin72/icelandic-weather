# #493 access-points — Rules v3 (correction round, D1-D7/F1-F6)

2026-11-10, CC. Executes `approved-prompt-v3.md`. **This is a
correction round, not a new pre-registration.** v1's and v2's own
outputs, rules, scripts and hash files are UNCHANGED — this file and
every v3 output live either at the task root with a `-v3` suffix, or
under `samples/v3/`. Written and hashed (`rules-v3.sha256`) BEFORE
`samples/v3/build_access_points_v3.py` runs. The read-only baseline
snapshot (`samples/v3/v1_v2_and_input_baseline.json`, 49 files: every
v1 + v2 task file + all 12 of G7's original inputs) was taken BEFORE
this file was written, per F6(d)/J6's final bullet, and confirmed the
two append-only files (`cc-report.md`, `result-review.md`) grew with
their v2-recorded bytes as an exact prefix — nothing else changed.

## D1–D7, copied verbatim from approved-prompt-v3.md (govern on conflict)

- **D1 (J1/H1; Borgarnes, miðlungs-lágt):** Röð Borgarness hefur `node_role=ENTRY`, `stored_field=END`, hnit = stored END á stykki 2819. Í `chain-walks-v4.json` er 2819 skref 28 í `ccw_short` með `direction: fwd` og exit = stored END (361119,191; 454127,5752), svo stored END er EXIT í því líkani, ekki ENTRY. Hlutverkið er harðkóðað í greininni (`build_access_points_v2.py` Borgarnes-grein) þvert á `phase1_role_readout.json` sem hefur `derived_node_role: null` fyrir Borgarnes. Cum er tómt, svo engin vegalengd er röng, en J1 krafðist að hlutverk væru lesin úr heimildum, og lokavalidatorinn sleppir röðinni þegjandi (stykki ekki í `cw_long`). Sandbox: Borgarnes `node_role` breytt í EXIT fer óséð í gegn. Sama gildir um að hlutverk Vík/Fáskrúðsfjarðar/Reyðarfjarðar/Reykjahlíðar/Selfoss/Hellu/Hvolsvallar eru harðkóðuð í sérgreinum án fullyrðingar um að þau jafngildi `role_from_access_node_end`-útkomunni. **Lagfæring:** `node_role` tómt fyrir Borgarnes með ástæðu (utan `cw_long`) eða EXIT með skráðri ccw_short-heimild; fullyrðing í keyrslu að hlutverk sérgreina = útkoma `role_from_access_node_end`; lokavalidator má ekki sleppa hlutverkaröð þegjandi (telja og skrá slepptar raðir).
- **D2 (H4/G2; rekjanleiki hnita, miðlungs):** [provenance per coordinate — see F2 below for the resolved fix.]
- **D3 (J4/H3; umfang schema, lágt-miðlungs):** [schema completeness — see F3(e) below.]
- **D4 (J2/H1; lokavalidator og mutation, lágt-miðlungs):** [stored_field check + real mutation set against the real final validator — see F3 below.]
- **D5 (J5/H5; mat á falskri jákvæðni, lágt):** [stem-hint classification — see F4 below.]
- **D6 (H2/J3; Rauðavatn, lágt):** [both ends of 1436 as unselected candidates — see F6(c) below.]
- **D7 (H8/J6; skjalaósamræmi, lágt):** [counts/wording/vocabulary/index/host-reason fixes — see F6 below.]

(Full D1–D7 prose is in `approved-prompt-v3.md` §"D1–D7 úr Jonesy result review umferð 2"; not re-copied in full here to avoid drift between two copies — this file's own operational decisions below implement it exactly.)

## F1–F6, copied verbatim from approved-prompt-v3.md (govern on conflict)

- **F1 (D1; heimild hlutverks per færslu og ekkert þagað):** Fullyrðing um að útgefið hlutverk jafngildi hlutverki úr retained heimild skal vera **per `record_source`**: `PHASE1_ACCESS_NODE_END` ber saman við `access_node_end` og `direction`, `PHASE2_V3_NODE` við hlutverk í `place_nodes-v3.json`, `OWNER_APPROVED` við owner-decision og `cw_long` skref 3876. Þekkta frávikið á Egilsstöðum (phase-1 EXIT, útgefið ENTRY úr `PHASE2_V3_NODE`) skal skráð fyrirfram sem nafngreint `ROLE_SOURCE_DIVERGENCE` með bæði gildi prentuð, ekki sérgrein sem sleppir fullyrðingunni þegjandi. Lokavalidator skilar fyrir **hverja af 72 röðum** niðurstöðu úr lokuðum orðaforða og samanlagður fjöldi er 72, reiknaður í kóða; ekkert `continue` án skráðrar niðurstöðu. Borgarnes eins og drögin segja.
- **F2 (D2; provenance nær yfir hvert hnitapar og er sannprófuð):** Provenance (`source_path`, `source_hash_key`, `piece_id`, `source_field`, `crs`) fylgir **hverju** hnitapari sérstaklega, þar með WGS84-pari Akureyri (`crs`=EPSG:4326, heimild=owner-decision-skráin) og öllum G4-, Reykjavíkur- og Rauðavatn-hnitum. `source_hash_key` er einstakt merki í `input_hashes.json`. Lokavalidator leysir lykilinn, endurreiknar sha256 og ber hnitgildið saman við heimildarreitinn. Neikvæð próf fyrir provenance: rangur lykill, röng slóð, rangt `crs`, provenance vantar á hnit sem er ekki null, breytt Akureyri-WGS84 stafa. Lengdarafbrigðin 26,9266/27,8536 skrifuð úr útreikningi með 4-aukastafa námundun, borin saman við v2 í F5.
- **F3 (D3/D4; prófin keyra raunverulegan lokavalidator og falla af réttri ástæðu):** (a) Lokavalidatorinn tekur inntaks-/úttaksslóðir sem færibreytur. (b) Tímabundið prófasvæði er utan repo (`tempfile`), eytt á eftir. (c) Mutation-mengið (hlutverkamerki eitt sér, 0,2 m hnitafrávik, `stored_field`-víxl, cum-grunnsmerkjavíxl, tvítalning 1436, auk F2-provenance-afbrigða og fjögurra D3-reitaprófa) keyrir á öllum þremur úttaksskrám þar sem við á, á a.m.k. tveimur stykkjum í hverri. (d) Fyrirfram skráð varpa afbrigði → væntanleg check-ID. (e) Fullkomleikapróf á numeric schema. (f) Fjöldi og dreifing reiknuð í kóða.
- **F4 (D5; flokkunarreglur forskráðar og ekki sniðnar að niðurstöðunni):** Lokaður flokkaorðaforði, skráður áður en flokkun keyrir, hlutlægur, notar eingöngu texta stykkisins. Hver samsvörun fær nákvæmlega einn flokk, summa = heildarfjöldi (113 óbreytt frá v2). Flokkur hefur engin áhrif á `road_connection`/`coordinate_source`/`direction_status`.
- **F5 (varðveisla staðfestra gilda):** Kóðuð v3-gegn-v2 samanburðarkeyrsla sýnir óbreytt: 72 raðir/röð, Hagstofudálkar, `road_connection` (61/8/1/2), `coordinate_source`, `direction_status`, öll `native_x/y`, cum-gildi, Reykjavíkuroffset, G4-hnútar sjö, 2345-reitir, `place-node-references`. Leyfð frávik: Borgarnes `node_role`, nýir provenance-/flokkadálkar, `record_source`-orðaforði, gatatexti.
- **F6 (D6/D7; leiðréttingar og tilvísanir):** (a) v3-viðauki telur upp orðrétt hvaða v2-fullyrðingar voru ónákvæmar. (b) Hýsilástæða vísar með skrá+línum í almennar heimildir. (c) Báðir endar 1436 sem óvaldir Rauðavatns-candidates, gamalt nafn leyst af hólmi. (d) Vísitala `evidence-v3.md` nær yfir allar nýjar skrár; baseline nær yfir v1+v2+12 inntök með forskeytis-SHA á append-only skrám.

## This round's own operational decisions (pre-registered before build runs)

### Closed vocabulary (extends v2's own, J1 unchanged where not listed)

- `node_role` ∈ {`ENTRY`, `EXIT`} — unchanged from v2.
- `stored_field` ∈ {`START`, `END`} — unchanged from v2.
- `record_source` ∈ {`PHASE1_ACCESS_NODE_END`, `PHASE2_V3_NODE`, `THIS_ROUND_NAME_SEARCH`, `OWNER_APPROVED`, `PHASE1_AND_PHASE2_PAIR`}. **D7(e) fix:** v2's own composite string value `"PHASE1_ACCESS_NODE_END+PHASE2_V3_NODE"` (used on the three dual-candidate places' *main-table* row) is replaced by the single closed-vocabulary token `PHASE1_AND_PHASE2_PAIR`. The two individual records for each such place, in `samples/v3/place-node-references-v3.json`, keep their own single, clean `record_source` (`PHASE1_ACCESS_NODE_END` / `PHASE2_V3_NODE` respectively) — each of those two records IS sourced from exactly one file.
- `reference_status` ∈ {`PHASE1_REFERENCE`, `PHASE2_V3_NODE`, `CANDIDATE_NOT_PROMOTED`, `OWNER_APPROVED_ANCHOR`, `RING_JUNCTION_VERIFIED`} — unchanged from v2.
- `role_divergence` ∈ {`NONE`, `ROLE_SOURCE_DIVERGENCE`} — **new, F1.** Set on every record whose `record_source` is `PHASE2_V3_NODE`: compare the published `node_role` against `role_from_access_node_end(phase-1's own access_node_end for that idferill's place, the piece's own cw_long direction)`. If they differ, `ROLE_SOURCE_DIVERGENCE` (both values printed in the run log and in `notes`); this is a documented, expected, non-failing divergence (phase-2's own node selection is a deliberate alternative, not required to equal phase-1's role) — never a silently-skipped assertion. Pre-registered expectation: exactly 4 records carry this flag — Egilsstaðir's main-table ENTRY row, and the three dual-places' own EXIT/`PHASE2_V3_NODE` reference records (Selfoss, Hella, Hvolsvöllur). For `record_source=PHASE1_ACCESS_NODE_END` (and `OWNER_APPROVED`), the published role **must equal** the retained-source-derived role by construction — asserted, not assumed; any mismatch is a bug, not a documented divergence.
- `final_validation_outcome` ∈ {`VALIDATED`, `NOT_VALIDATED_OUTSIDE_CW_LONG`, `NO_NODE`, `PAIR_REFERENCE`} — **new, F1.** Computed by the independent final validator for every one of the 72 main-table rows, never a silent `continue`:
  - `VALIDATED`: row has a non-null `node_role` and is checked against `cw_long` (role, coord, cum, `stored_field`) by the independent validator.
  - `NOT_VALIDATED_OUTSIDE_CW_LONG`: row's own native piece is not a `cw_long` step (pre-registered: exactly Borgarnes, piece 2819 on `ccw_short`).
  - `PAIR_REFERENCE`: row's own `reference_status=CANDIDATE_NOT_PROMOTED` and its data lives in `place-node-references-v3.json` instead of the main row (pre-registered: exactly Selfoss, Hella, Hvolsvöllur — 3 rows).
  - `NO_NODE`: every other row (no `node_role`, not Borgarnes, not a pair-reference place) — pre-registered count: 72 − 6 (VALIDATED: Akureyri, Egilsstaðir, Vík, Fáskrúðsfjörður, Reyðarfjörður, Reykjahlíð) − 1 (Borgarnes) − 3 (pair places) = 62.
  - Sum over all four categories MUST equal 72, asserted in code.
- `mention_category` ∈ {`HOME_PIECE_OR_ROUTE_ENDPOINT`, `DESTINATION_MENTION`, `ROAD_NAME_COMPOUND_MENTION`, `UNCLASSIFIED_TEXT_MENTION`} — **new, F4/D5**, see stem-hint classification rule below.

### D1 — Borgarnes (pre-registered decision)

`node_role`/`stored_field`/`cum_*` remain **empty/null** for Borgarnes in `place-access-status-v3.csv`, with an explicit reason in `notes`: piece 2819 is on `ccw_short`, out of this round's `cw_long`-based role/coord/cum validator scope — not re-derived via a parallel ccw_short computation this round, to avoid scope creep into a second, unvalidated distance basis. The retained `native_x`/`native_y` (stored END of 2819) stay as in v2 (unchanged value, F5). For transparency, the script STILL computes `role_from_access_node_end("end", "fwd")` = `EXIT` (`stored_field=END` under `direction=fwd`: `node_role = ENTRY if stored_field=="START" else EXIT`) and prints/records it in `notes` and in `samples/v3/phase1_role_readout_v3.json`, explicitly labelled as "computed, not published" — this is not silently withheld, just not written into the schema-validated `node_role` column. The independent final validator classifies Borgarnes as `NOT_VALIDATED_OUTSIDE_CW_LONG` and **asserts** that classification (never skips it).

### F2 — Coordinate provenance (pre-registered schema)

Every coordinate pair not `None`, in both `place-access-status-v3.csv` and every JSON output, carries:

- `source_path` — repo-relative path (`as_posix()`), equal to the matching entry's own `path` in `input_hashes.json`.
- `source_hash_key` — the unique `label` key into `input_hashes.json` (one of the 12 input labels already used in v2's own `INPUT_FILES` list).
- `piece_id` — the `idferill` (or owner-decision reference) the coordinate belongs to.
- `source_field` — which literal field of that source holds the value (e.g. `"end_x/end_y"`, `"start_x/start_y"`, `"geometry.coordinates[0]"`, `"geometry.coordinates[-1]"`, or the parsed markdown text for Akureyri WGS84).
- `crs` — `"EPSG:3057"` (native ISN93, all road-links/chain-walks/wfs93-raw-derived coordinates) or `"EPSG:4326"` (WGS84, Akureyri only, from `akureyri-endpoint-decision.md`).

Null coordinates carry no provenance (all four fields `None`) — no invented source for an unselected place. The CSV gains three new columns (`source_path`, `source_hash_key`, `crs`; `piece_id`/`source_field` reuse the existing `native_source_piece`/`native_source_field` columns) — an explicitly allowed F5 deviation. The Akureyri WGS84 pair (`lat_deg_n`, `lon_deg_w`) is **parsed directly** from `akureyri-endpoint-decision.md`'s own text (regex on the literal `"65.69570405° N, 18.12371406° V"` string), never a bare literal — if the regex fails to match, the build **fails loudly**, it does not fall back to a hardcoded value.

### F3 — Numeric schema (complete, allowlist-based; D3 fix)

Every leaf scalar in the three final outputs (`place-access-status-v3.csv` rows, `endpoint-candidates-v3.json`, `samples/v3/place-node-references-v3.json`) is classified by key:

- **TEXT_KEYS** (must hold `str` or `None`, never a bare number): `name`, `place`, `hagstofa_pairing`, `hagstofa_match_type`, `road_connection`, `coordinate_source`, `node_role`, `stored_field`, `record_source`, `reference_status`, `role_divergence`, `final_validation_outcome`, `source_path`, `source_hash_key`, `source_field`, `crs`, `native_source_field`, `direction_status`, `gap_id`, `notes`, `mention_category`, `missing_fact`, `purpose`, `host_candidates_reason`, `authorisation`, `basis`, `basis_note`, `leads_toward`, `spelling_note`, `wgs84_note`, `selection`, `piece_name_verbatim`, `piece_desc_verbatim`, `description`, `desc`, `direction`, `matched_token`, `matched_stem_variant`, `label`, `source`, `status`, `hagstofa_codes` (list of `str`), `fields` (list of `str`), `role`, `note`.
- **ID_EXEMPT_KEYS** (must hold `int` or `None`; identifiers, not measurements — exempt from the finite-float/null measurement rule but never a string): `idferill`, `piece_id`, `objectid_canonical`, `n_vertices`, `veghluti`, `native_source_piece`.
- **NUMERIC_KEY_SUFFIXES** (must hold a finite `int`/`float` or `None`, never a string): `_x`, `_y`, `_m`, `_km`, `_km_incl_1436`, `_km_excl_1436`, `_offset_km_incl_1436`, `_offset_km_excl_1436`, `_length_m`, `_tier_minus1`, `_tier_2`, `_deg_n`, `_deg_w`. The two D3-flagged length-variant fields are **renamed** to end in `_km` (`from_ring_junction_2345_km`, `from_phase1_node_via_2345_927m_km`) so the generic `_km` suffix covers them — no field escapes the suffix list by construction.
- **`coord`** (exact key match): `None` or a 2-element list of finite numbers.
- **BOOL_KEYS** (the only keys allowed to hold a literal `bool`): `origin_marked`.
- **Completeness rule (F3e):** the walker visits every key in the structure; a string value under a key NOT in `TEXT_KEYS` fails (`NUMERIC_SCHEMA_VIOLATION`); a number under a key not in `NUMERIC_KEY_SUFFIXES`/`ID_EXEMPT_KEYS`/`coord` fails; a `bool` value under a key not in `BOOL_KEYS` fails. This is the "every value's key is accounted for" test F3(e) requires, not a hand-picked column list — it is exactly what would have caught D3's four missed fields (now impossible to miss: a string under `lat_deg_n`/`lon_deg_w`/`..._km` fails because those keys are NUMERIC, and a string anywhere else still has to be under a documented `TEXT_KEYS` entry).
- Negative tests: the 4 D3 fields (`akureyri.wgs84.lat_deg_n`, `.lon_deg_w`, `exit_length_variants_km.from_ring_junction_2345_km`, `.from_phase1_node_via_2345_927m_km`) each get a dedicated test — a string injected into a **copy** of the written JSON must be rejected with `NUMERIC_SCHEMA_VIOLATION` at that exact path. The two v1-verbatim negative tests (literal text-in-numeric-field `endpoint-candidates.json`; literal Selfoss ENTRY-coord/EXIT-cum row) are preserved unchanged from v2.

### F3 — Final validator mutation set (D4 fix)

`samples/v3/validate_final_outputs_v3.py` is parameterised (`run(paths, cw_path, road_links_path, input_hashes_path, akureyri_decision_path)`) so it can run unmodified against **temporary copies** of the written files (`tempfile.mkdtemp()`, outside the repo, deleted after use — never left on disk, never hashed, never indexed). It independently re-reads `stored_field` (new, D4a) alongside `node_role`/`coord`/`cum_*`, and resolves+verifies provenance (F2). Five role/coord/cum mutation kinds, run on at least two pieces each (pre-registered: 2138 Selfoss, 3849 Vík, plus Egilsstaðir 2345 for the divergence-aware path):

| Mutation | What changes | Expected check-ID |
|---|---|---|
| `role_label_only` | `node_role` flipped to the other value; `coord`/`cum` left as-is | `ROLE_COORD_MISMATCH` or `ROLE_CUM_MISMATCH` |
| `coord_deviation_0.2m` | one coordinate axis shifted by 0.2 m (exceeds the 0.1 m tolerance) | `ROLE_COORD_MISMATCH` |
| `stored_field_swap` | `stored_field` flipped; `node_role`/`coord`/`cum` left as-is | `STORED_FIELD_MISMATCH` |
| `cum_incl_excl_swap` | `cum_km_incl_1436`/`cum_km_excl_1436` values swapped | `ROLE_CUM_MISMATCH` |
| `double_counted_1436` | `cum_km_incl_1436` increased by `piece_1436_length_m/1000` | `ROLE_CUM_MISMATCH` |

Plus five F2-provenance mutation kinds on the same ≥2 pieces:

| Mutation | What changes | Expected check-ID |
|---|---|---|
| `wrong_source_hash_key` | `source_hash_key` set to an unused label | `PROVENANCE_HASH_KEY_INVALID` |
| `wrong_source_path` | `source_path` changed to not match the resolved key's own recorded path | `PROVENANCE_PATH_MISMATCH` |
| `wrong_crs` | `crs` set to neither `EPSG:3057` nor `EPSG:4326` | `PROVENANCE_CRS_INVALID` |
| `provenance_missing_on_real_coord` | all four provenance fields nulled while `coord` stays non-null | `PROVENANCE_MISSING` |
| `akureyri_wgs84_digit_altered` | one digit of the published `lat_deg_n` changed | `AKUREYRI_WGS84_MISMATCH` |

Each runs on ≥2 outputs/files where applicable (main CSV row, `place-node-references-v3.json` record, `endpoint-candidates-v3.json` node) via real calls into the imported `validate_final_outputs_v3` module's own check functions on the temp copy — not a re-implementation. A test passes only if the returned check-ID is **in** the pre-registered expected set above (not merely "something failed"). Exact count (mutation kinds × pieces × applicable files + 4 D3 schema tests + 2 v1-verbatim tests) computed and printed in code.

### F4 — Stem-hint classification rule (D5 fix, general, pre-registered before running)

For every stem-search match already found by v2's own (unchanged) search (piece `idferill`, `desc`, matched place `X`, `matched_token`, `matched_stem_variant`), classify using ONLY the piece's own `name`/`desc` text:

1. Split the piece's own `name` field AND `desc` field each on `" - "` and on `"-"` (covering both `"Þjórsá - Selfoss"`-style and `"Selfoss-Hveragerði"`-style literal separators), trim, and take the first word-token of each resulting segment. If `X`'s own stem variant matches (prefix) any of those first-segment-tokens → **`HOME_PIECE_OR_ROUTE_ENDPOINT`** (X is a named endpoint of this piece's own route — not a mention of a different place's junction).
2. Else, if the literal `matched_token` (the actual word from `desc` that matched) ends in one of the fixed road-compound suffixes `("vegur", "braut", "stígur", "gata")` (NFC, case-sensitive on the Icelandic text as stored) AND the token is strictly longer than `X`'s own bare name → **`ROAD_NAME_COMPOUND_MENTION`** (e.g. "Eyrarbakkavegur" mentioned inside a Selfoss piece's own `desc` while searching for "Eyrarbakki" — a road-name compound referencing X's own road, mentioned along another piece's own route, not X's coordinate or connection).
3. Else, if `matched_token` is the last word-token of the full `desc` string → **`DESTINATION_MENTION`** (the description ends by naming X as a heading/destination).
4. Else → **`UNCLASSIFIED_TEXT_MENTION`** (ambiguous; never forced into a confident category).

This rule is objective (string position + a fixed 4-item suffix list), uses no out-of-band knowledge, and is applied uniformly to all matches for all 72 names — not fitted to the three known hints. `category` is written per-match into `samples/v3/stem_search_hints_v3.json`; gap entries report counts by category (not just a total). Classification never changes `road_connection`/`coordinate_source`/`direction_status`. The search rule itself (stem variants, minimum length 7, recall assertions) is unchanged from v2/`rules-v2.md` — only the match set's own labelling is new.

### D6/F6(c) — Rauðavatn (both ends unselected)

`endpoint-candidates-v3.json`'s `reykjavik` block reports BOTH piece-1436 ends as unselected Rauðavatn comparison candidates, each with its own role/provenance/offset:

- `raudavatn_candidate_ENTRY_stored_END` — identical to `short_western_leg_ENTRY_stored_END`'s own coord/offsets, re-labelled as a Rauðavatn candidate.
- `raudavatn_candidate_EXIT_stored_START` — identical to `long_eastern_leg_EXIT_stored_START`'s own coord/offsets, re-labelled as a Rauðavatn candidate.

v2's own single-ended `raudavatn_comparison_anchor` field is **removed** (not reused with different content) and its removal is logged in the v3 addendum (F6c): it is superseded by the two-candidate pair above, not overwritten silently.

### F6(b) — Host-candidates reason (file + line numbers)

`host_candidates` stays `[]` for every gap entry (no per-place host authorised this round, unchanged from v2). `host_candidates_reason` is corrected to cite the real general sources by file and line, computed at run time (grep, not hand-counted): `national-place-coverage.md` lines 35-40 (Hagstofa + Vegagerðin URLs, reviewed 2026-11-06) and the `px.hagstofa.is` citations inside `place-inventory-v3.csv`'s own `source` column — both are general, project-wide references, not a host or layer naming any one of the gap's own specific places; no new host is proposed.

### Outcome label (unchanged criteria, now gated on F1-F6 passing)

`EVIDENCE_READY_FOR_OWNER_REVIEW` only if: 72=72 rows/order/pairing; numeric schema (completeness form) accepts the real output and rejects all negative tests; role/coord/cum/`stored_field`/provenance validators pass on every applicable row (72=72 classification sum); the F3 mutation set (role, coord, `stored_field`, cum-swap, double-count, 5×provenance, 4×D3-schema) all fail with the pre-registered expected check-ID; F4 classification covers all matches with no drop and no `road_connection`-side-effect; F5's v3-vs-v2 coded comparison shows no undocumented deviation; vocabulary/index/host-reason corrections (F6) are in place; the two predictable gaps (`REY-CORE`, road-93 WGS84) remain named `BLOCKED_WITH_EXACT_GAPS` sub-items. Any single failure yields `BLOCKED_WITH_EXACT_GAPS` for that specific dependent part, not a silent downgrade of the whole round's label.

## Scope note

Offline only, same as v1/v2. No new network exchange, no new host, no app/API, dependencies, subagents, commit/push, or GitHub action, no coordinate reprojection. Writes confined to `ticket-493-access-points/` (new `-v3` files and `samples/v3/` only — no v1 or v2 file touched) and the mandatory `docs/ai/CURRENT.md` entries. `samples/v3/`'s own temp-test-area use (`tempfile`, F3b) is strictly outside the repo and cleaned up — never part of any hash table or index.
