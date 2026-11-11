# #493 access-points — Rules v2 (correction round, H1-H8/J1-J6)

2026-11-10, CC. Executes `approved-prompt-v2.md`. **This is a
correction round, not a new pre-registration.** v1's own outputs,
rules, scripts and hash files are UNCHANGED — this file and every v2
output live either at the task root with a `-v2` suffix, or under
`samples/v2/`. Written and hashed (`rules-v2.sha256`) BEFORE
`samples/v2/build_access_points_v2.py` runs. The read-only baseline
snapshot (`samples/v2/v1_and_input_baseline.json`, 30 files: every v1
task file + all 12 of G7's original inputs) was taken BEFORE this file
was written, per J6's own final bullet.

## Jonesy's J1-J6 conditions, copied verbatim (govern on conflict)

- **J1 (H1; uppbygging færslna, fyrirfram skráð):** `rules-v2.md` skal
  skrá lokað orðaforðaval áður en keyrt er: `node_role` ∈ {ENTRY, EXIT},
  `stored_field` ∈ {START, END}, auk `record_source` (phase-1
  `access_node_end` / phase-2 v3 `place_nodes-v3.json`) og
  `reference_status` (til dæmis PHASE1_REFERENCE / PHASE2_V3_NODE /
  CANDIDATE_NOT_PROMOTED). Ein færsla = eitt hnit + eitt cum-par úr sama
  `cw_long`-skrefi og sama hlutverki. Hlutverk hvers staðar eru **lesin
  úr `place-inventory.csv` (`access_node_end`) og `place_nodes-v3.json`
  í keyrslu og prentuð**, ekki harðkóðuð úr lista í prompti. Skráið
  fyrirfram fyrir hvern af sjö stöðunum hvaða færslur eru gefnar út:
  Selfoss, Hella, Hvolsvöllur: tvær merktar færslur (phase-1 ENTRY og
  phase-2 EXIT), engin gerð að staðarendapunkti; Vík, Fáskrúðsfjörður,
  Reyðarfjörður, Reykjahlíð: phase-1 START/EXIT sem tilvísun, og skýrt
  skráð hvort ENTRY-færslan (v1-hnitið) er einnig gefin út sem ótekin
  candidate-færsla eða ekki gefin út (með ástæðu). Aðaltaflan heldur 72
  röðum í sömu röð; aukafærslur fara í aðskilda skrá eða dálkahópa
  (`entry_*`/`exit_*`) án þess að raðatalan breytist.
- **J2 (H1 og H2; lokaúttaksvalidator og neikvæð próf):** Validatorinn
  les **skrifuðu lokaskrárnar** og er sjálfstæður frá byggingarskriftunni
  (engin innflutningstenging, sama static-próf og í v1). Hann ber
  (hnit, piece-id, hlutverk, reit, cum með/án) saman við varðveitta
  rúmfræði og fram-/aftursummuútreikning. Neikvæðu viðmiðin lesa
  **v1-gögnin orðrétt úr varðveittum v1-skrám** (með tilvísun í sha
  þeirra): afhenta Selfoss-röðin (hnit ENTRY, cum EXIT) og afhentu
  víxluðu Reykjavíkur-offsetin. Hlutverka-, hnita-, merkja- og
  tvítalningarafbrigði keyra á að minnsta kosti tveimur stykkjum
  (helst öllum níu); fjöldi prófa og á hvaða stykki skráður nákvæmlega
  og reiknaður í kóða.
- **J3 (H2; Reykjavík):** Lengd 1436 og báðir enda-offset eru lesin úr
  `cw_long` skrefi 0 með nafngreindum reit (`piece_cost_m`,
  `gap_into_m` sem skal vera 0 á skrefi 0; skriftan fullyrðir það) og
  gerð að (gildi, merki)-pörum fyrir bæði grunnana. Lýsingartexti
  leggjanna (v1 sagði "starts_at START … traverses backward") skal
  endurskrifaður í samræmi við `rev` END→START, og ekkert harðkóðað
  lengdargildi (2560.1497) er eftir í skriftunni.
- **J4 (H3; schema og hnútur 2345):** Listi yfir tölureiti er **leiddur
  sjálfvirkt** (gengið yfir alla lykla sem tákna hnit, lengd, cum eða
  offset í báðum úttökum), ekki handtalinn, svo reitur sem gleymist
  falli ekki utan prófs. Staða (`NOT_VALIDATED`) fer í sérstakan
  status-reit, aldrei í tölureit; ógilt = tómt/null. Fyrir 2345 skal
  `rules-v2.md` skrá fyrirfram: hringvegagrunnur sem staðfest (gildi,
  merki)-pör, og road-93 eigin tier-reitir fyrir hringvegamótin
  annaðhvort 0,0 sem merkt uppruni eða null með ástæðu. Báðir afhentu
  strengirnir fara orðrétt úr v1 sem neikvæð viðmið.
- **J5 (H5, H8; stofnaleit og gatalisti):** Stofnareglan skal vera
  skráð í `rules-v2.md` **áður** en hún er keyrð og vera almenn fyrir
  allar 72 nafnastöður (föst afleiðsla: viðskeytisstripping, skráð
  hljóðbreyting ö↔a ef hún er notuð, lágmarkslengd stofns), ekki
  sniðin að þremur vísbendingunum. Leitarsvið skráð nákvæmlega (skrá,
  reitir; í ljós kemur að þrjú tilvikin eru öll í `desc`) og **allar
  samsvaranir birtar** (stykki, reitur, texti), ekki aðeins nefndu
  stykkin; falskar jákvæður (fordæmi: "Laugar" í "Laugardælavegur")
  metnar og skráðar. Recall-próf: reglan verður að finna
  vísbendingarnar þrjár (þar með 2478), án þess að þær séu forsenda
  stofnanna. Samsvörun á stykki annars staðar (t.d. Eyrarbakkavegur
  nefndur í `desc` Selfoss-stykkja) er vísbending um vegamót í
  lýsingu, hvorki hnit né tenging, og er skráð sem INFERRED-ábending
  án áhrifa á `road_connection`. Níu afturkölluðu staðirnir fá
  raunverulega leit með niðurstöðu skráðri. `host_candidates` nefna
  aðeins hýsla úr nafngreindum varðveittum skrám (skrá + lína) eða
  "enginn hýsill lagður til" með staðreyndabundinni ástæðu;
  gatafærslur eru byggðar úr staðarsértækum reitum (Hagstofustaða/
  kóðar, vísbendingar, vöntun), og Reykholt fær sérstakt
  svæðisgreiningargat. Talningar (gat, samsvaranir, 68/70) reiknaðar í
  kóða.
- **J6 (H6, H7, H8; varðveisla, staðsetning, forskráning):** Staðsetning
  og nöfn v2 skal ákveðin fyrirfram (ekki "eða"): ný v2-nefnd skrá í
  sömu möppu og undir `samples/v2/` (til dæmis `place-access-status-
  v2.csv`, `endpoint-candidates-v2.json`, `rules-v2.md`/`rules-v2.
  sha256`, `evidence-v2.md`, `HASHES-v2.*`), engin v1-skrá breytt (ekki
  einu sinni SUPERSEDED-merking; `evidence-v2.md` er vísitala yfir
  authoritative úttök). SHA allra v1-skráa og 12 inntaka skráð **áður
  en nokkuð er skrifað** og borin saman í lokin; append-only skrár
  (`cc-report.md`, `result-review.md`) sannreyndar með forskeytis-SHA
  upprunalegra bæta. Áttarreglan (H6) og niðurstöðumerkið (G8; hvaða
  próf, þar með lokaúttaksvalidatorar J2/J4, ráða merkinu) eru skráð í
  `rules-v2.md` fyrir keyrslu; `as_posix()` í öllum slóðum í bæði
  inntaks- og úttaks-hash-skrám, tvær keyrslur í röð bæti-eins, engin
  fullyrðing um annað stýrikerfi nema hún hafi farið fram.

## Fastar nákvæmniákvarðanir v2, copied verbatim

- Skrár í task-rót: `place-access-status-v2.csv`, `endpoint-
  candidates-v2.json`, `rules-v2.md`, `rules-v2.sha256` og `evidence-
  v2.md`. Skriftur, aukafærslur, prófaniðurstöður, `input_hashes.json`
  og `HASHES-v2.json`/`HASHES-v2.sha256` fara undir `samples/v2/`.
  `evidence-v2.md` vísar á allar authoritative v2-skrár. Ekki breyta
  v1-skrám. Nýjar hjálparskrár fara eingöngu undir `samples/v2/` og eru
  allar taldar í vísitölu og hash-afhendingu.
- Selfoss/Hella/Hvolsvöllur fá báðar heimildabundnu candidate-
  færslurnar í `samples/v2/place-node-references.json`. Aðaltaflan
  hefur 72 raðir og vísar á þær án þess að velja nýjan
  staðarendapunkt. Fyrir Vík/Fáskrúðsfjörð/Reyðarfjörð/Reykjahlíð er
  phase-1 START/EXIT tilvísun gefin út; v1 ENTRY-hnit ekki gefið út sem
  ný staðartillaga, því það kom úr röngum hnita/cum-samsetningum, ekki
  sérstöku retained vali staðarendapunkts. Skráðu ástæðuna. Hlutverkin
  sjálf skulu samt lesin og prentuð úr retained heimildum samkvæmt J1.
  Lokaðir `record_source`/`reference_status` orðaforðar og null-
  meðferð óþekktra staða skilgreindir hér fyrir keyrslu.
- Fyrir 2345 er road-93 eigin tier −1/tier 2 grunnur 0,0 við merkt
  hringvegamót, með sjálfstæðri staðfestingu upprunans; hringvega-cum
  er í aðskildum merktum reitum. Ef retained gögn styðja ekki þetta
  skal stöðva háða niðurstöðu með nákvæmu gati í stað þess að skipta
  hljóðlaust um grunn.
- `direction_status` verður `UNKNOWN` nema tiltekin retained heimild og
  forskráð regla uppfylli H6/J6; `cw_long` traversal eitt og sér sannar
  ekki akstursheimild.
- Skagastrandarvegur recall nær líka yfir 2478 samkvæmt J5. Engin
  stöðuhækkun vegna stofnaleitar.
- Fyrsta aðgerð CC eftir lestur og skyldubundna CURRENT-lífsferils-
  uppfærslu er read-only SHA/forskeytis-SHA upptaka samkvæmt J6, áður
  en önnur verkefnisúttök eru skrifuð. CURRENT er lífsferilsskrá utan
  varðveislu-hash; review/prompt skjöl sem liggja fyrir við upphaf
  teljast varðveitt.

## This round's own operational decisions (pre-registered, J1/J4/J5/H6/G8)

**Closed vocabulary (J1):**
- `node_role` ∈ {`ENTRY`, `EXIT`} — which end of a `cw_long` step a
  record describes (`ENTRY` = the step's own `entry` coordinate/cum;
  `EXIT` = the step's own `exit` coordinate/cum). For `direction=rev`
  (every piece used this round), `ENTRY` = the piece's own stored
  `END`, `EXIT` = the piece's own stored `START`.
- `stored_field` ∈ {`START`, `END`} — which field of `road-links.csv`
  (or the WFS-93 feature, for road-93 pieces) the record's own
  coordinate equals. Derived from `node_role` + `direction`, never set
  independently of it (a record whose `node_role`/`stored_field` pair
  contradicts the piece's own `direction` fails the final validator).
- `record_source` ∈ {`PHASE1_ACCESS_NODE_END`, `PHASE2_V3_NODE`,
  `THIS_ROUND_NAME_SEARCH`, `OWNER_APPROVED`} — which retained file the
  record's own role choice came from.
- `reference_status` ∈ {`PHASE1_REFERENCE`, `PHASE2_V3_NODE`,
  `CANDIDATE_NOT_PROMOTED`, `OWNER_APPROVED_ANCHOR`,
  `RING_JUNCTION_VERIFIED`} — what standing the record has. A
  `CANDIDATE_NOT_PROMOTED` record is informational only and must never
  be the sole value written into the main 72-row table's own
  `coord`/`cum` columns without an accompanying note pointing at
  `samples/v2/place-node-references.json`.

**Per-place record_source readout (printed at run time, not
hardcoded)**: for each of the 72 names, the script reads phase-1's own
`place-inventory.csv` row (if one exists for that name) and its own
`access_node_end` field (`"end"` -> `node_role=ENTRY`, `"start"` ->
`node_role=EXIT`, under `direction=rev`), AND separately checks whether
`place_nodes-v3.json` has a validated node for the same `idferill`. Both
are printed in the run log for every one of the 24 individually-assessed
phase-1 places, not only the 7 named here.

**The seven places (per J1, decided here, before the build script
runs):**

| Place | Phase-1 `access_node_end` | -> role | Phase-2 v3 node? | Records emitted this round |
|---|---|---|---|---|
| Selfoss (2138) | `end` | ENTRY | yes (EXIT, `place-inventory-v3.csv`) | TWO labelled candidate records (ENTRY/PHASE1_REFERENCE, EXIT/PHASE2_V3_NODE) in `place-node-references.json`; main table row holds neither alone, points to the file. |
| Hella (3591) | `end` | ENTRY | yes (EXIT) | Same pattern as Selfoss. |
| Hvolsvöllur (3593) | `end` | ENTRY | yes (EXIT) | Same pattern as Selfoss. |
| Vík (3849) | `start` | EXIT | no | ONE record: phase-1's own EXIT/START reference (`PHASE1_REFERENCE`), written to the main table row. The v1 ENTRY coordinate is NOT emitted as a new candidate — it never was phase-1's own retained choice, only an artefact of v1's own coord/cum mismatch (see `evidence-v2.md`). |
| Fáskrúðsfjörður (2536) | `start` | EXIT | no | Same pattern as Vík. |
| Reyðarfjörður (2520) | `start` | EXIT | no | Same pattern as Vík. |
| Reykjahlíð (3566) | `start` | EXIT | no | Same pattern as Vík. |

Egilsstaðir (2345, ENTRY, `reference_status=RING_JUNCTION_VERIFIED`)
and Akureyri (3876, EXIT, `reference_status=OWNER_APPROVED_ANCHOR`)
were already self-consistent in v1 (coordinate and cum shared the same
role) and are re-verified, not changed in role.

**Numeric-field auto-detection (J4):** a field is treated as numeric-
or-null if its own key matches one of: `coord` (a 2-element list of
numbers or `None`), or a key ending in any of `_x`, `_y`, `_m`,
`_km_incl_1436`, `_km_excl_1436`, `_offset_km_incl_1436`,
`_offset_km_excl_1436`, `_length_m`, `_tier_minus1`, `_tier_2`. The
schema validator walks the ENTIRE written JSON/CSV structure (not a
hand-picked list of columns) and asserts every such field holds a
finite number or `None`; any status/explanation goes into a
`*_status` or `notes` key instead, never into a numeric-pattern key.

**Node 2345, pre-registered split (J4):** two DIFFERENT "cum" concepts
exist for this node and must live in different field names: the RING's
own cumulative distance from Rauðavatn (`ring_cum_km_incl_1436`/
`ring_cum_km_excl_1436` = 677.6344/675.0743, confirmed (value,label)
pairs against `place_nodes-v3.json`) and road-93's OWN distance count,
which is DEFINED to originate at this junction
(`cum_km_tier_minus1`/`cum_km_tier_2` = `0.0`/`0.0`, marked
`origin_marked: true`, independently confirmed by construction — it is
the first point of road-93's own 6-piece order, not a measurement).
Neither field is a string under any circumstance.

**Direction rule (H6):** `direction_status=INFERRED` only where BOTH
hold: (a) the record's own role/coordinate is validated against a
`cw_long` step's own `direction` field (a specific retained primary
source), AND (b) that `direction` field is being used strictly to mean
"which way this piece is traversed in the retained digitised geometry,"
never as a claim about legal driving permission. Everywhere else:
`UNKNOWN`. `NOT_APPLICABLE` only where no node/coordinate exists at
all. This is unchanged from v1's own rule, restated here because H6
asked for the source and the scope distinction to be explicit.

**Stem-search rule (J5), general for all 72 names, fixed derivation,
pre-registered before running:**

1. Build up to four stem variants per name: the name itself (NFC); the
   name with a single trailing vowel (`a,e,i,o,u,y,á,é,í,ó,ú,ý`)
   stripped, if it ends in one (a common weak-declension nominative
   ending); the name with every `ö` replaced by `a` (the documented
   Icelandic u-umlaut reversal seen in genitive forms such as
   "strönd"->"strandar", "höfn"->"hafnar"); and that same ö->a form
   with a trailing vowel additionally stripped.
2. **Minimum stem length: 7 characters.** Chosen and recorded here
   (not tuned silently): the three known true hints' own derived stems
   are 9-11 characters ("Eyrarbakk", "Skagastrand", "Þorlákshafn");
   the known false lead "Laugar" is only 6 characters. A threshold of
   7 admits every true hint and excludes that specific false lead,
   and is applied uniformly to all 72 names, not case-by-case.
3. Search scope: `road-links.csv`'s own `desc` field only (VEGNR=1;
   the three known hints are confirmed to live in `desc`, never
   `name`), tokenised by splitting on any character that is not an
   Icelandic letter. A stem variant matches a token if the token
   (NFC) STARTS WITH the stem variant (NFC) — a prefix match, wider
   than v1's own exact-whole-word match, which is why this is a
   SEPARATE, clearly-labelled search, not a replacement for it.
4. **Status, not connection**: every match is recorded as an
   `INFERRED` textual hint attached to that PLACE's own gap entry
   (candidate piece id, its own `desc` verbatim, the stem variant that
   matched). It never changes `road_connection`, `coordinate_source`,
   or `direction_status` for either the searched-for place or the
   piece's own "home" place. A piece whose `desc` mentions one place
   while primarily describing another (e.g. "Eyrarbakkavegur" inside a
   Selfoss piece's own `desc`) is recorded as a junction MENTIONED IN
   TEXT, not a coordinate or a connection, exactly as J5 requires.
5. **Transparency**: every match this rule produces, for all 72 names,
   is written to `samples/v2/stem_search_hints.json` and summarised in
   `evidence-v2.md` — including any that look like further false
   leads, which are evaluated and labelled, not silently dropped.
6. **Recall assertion**: the rule MUST find Skagastrandarvegur on
   pieces 2423, 2456, AND 2478 (for "Skagaströnd"), Þorlákshafnarvegur
   on 22722 and 22725 (for "Þorlákshöfn"), and Eyrarbakkavegur on at
   least the ten pieces already identified in sandbox review (for
   "Eyrarbakki") — asserted in code, not just eyeballed.

**Host candidates (J5/G6):** no retained file in this task's own input
set documents a host, WFS layer, or URL on a PER-PLACE basis — only
two HOSTS used by entirely different, EARLIER rounds
(`gagnaveita.vegagerdin.is`, `px.hagstofa.is`) appear anywhere in this
project's retained history, and neither is re-authorised here (G6).
`host_candidates` is therefore `[]` for every gap entry this round,
with the uniform, factual reason: "no retained file in this task's own
input set names a host/layer for this specific place; a host used by
an earlier, different round is not re-authorised by this round."

**Outcome label (G8, restated with J2/J4 in scope):**
`EVIDENCE_READY_FOR_OWNER_REVIEW` applies only if: 72=72 rows in the
same order, no duplicates, no population figure; the schema validator
(J4, auto-derived field list) accepts the final written output and
rejects both verbatim v1 negative cases (the wrong Selfoss row, the
swapped Reykjavík offsets); the independent final-output validator
(J2) accepts every record this round emits and rejects every mutation
test run against it; the G4 seven-node comparison is delivered
unselected; and the two predictable gaps (`REY-CORE`, road-93 WGS84)
are named as their own `BLOCKED_WITH_EXACT_GAPS` sub-items. Any single
failure of the above yields `BLOCKED_WITH_EXACT_GAPS` for that
dependent part specifically, not a silent downgrade of the whole
round's own label.

## Scope note

Offline only, same as v1. No new network exchange, no new host, no
app/API, dependencies, subagents, commit/push, or GitHub action, no
coordinate reprojection. Writes confined to `ticket-493-access-points/`
(new `-v2` files and `samples/v2/` only — no v1 file touched) and the
mandatory `docs/ai/CURRENT.md` entries.
