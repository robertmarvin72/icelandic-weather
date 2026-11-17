# #500 east-selection — result review

## Jonesy result review — umferð 1 (2026-11-16)

**Niðurstaða: PASS (gögn og afhending), engir blockerar.** Báðir staðir eru festir nákvæmlega eins og approved-prompt segir og öll vörugögn stemma við source. Hins vegar vantar prófun á þremur atriðum sem approved-prompt (OM1–OM2 og „rangt CRS“) bað beint um; það er ekki blocker því gögnin eru sannreynd rétt, en Ripley ætti að ákveða hvort það er tekið sem valfrjáls herðing eða örlítil lagfæring (OP1). Stage → RESULT_REVIEW.

### Sandbox-staðfest (mitt, engin netköll)

- **selections.json:** 23 afgreiðslur, sama röð og sömu lyklar; **21 eldri afgreiðslur bókstaflega óbreyttar** (sjálfstæður samanburður við fyrri útgáfu); aðeins `reydarfjordur` og `faskrudsfjordur` breyttar. Allar 23 = SELECTED_PRODUCT_APPROACH, engin CURRENT_CANDIDATE_NOT_SELECTED.
- **Nýju færslurnar:** Reyðarfjörður source `road-links` 2553 `start`, native [722850.6187, 511691.77], WGS84 65.02999390726, −14.26600882454 (stemmir við mína óháðu Lambert/pyproj-útreikninga <1e-8°); Fáskrúðsfjörður `road-links` 2536 `end`, native [733763.5297, 501861.908], WGS84 64.93458924725, −14.05142635025. `MAP_JUNCTION_APPROVED_VIA_PROMPT`, `access_status: EXACT_GAP`, `native_crs EPSG:3057`, GRS80/ISN93-færibreytur réttar, `wgs84_derivation.native_source` bendir á rétta CSV-línu. `map_reference` = map-check.md; `map_observation` (RIPLEY_VISUAL_CHECK, rétt URL fyrir hvorn stað, athugun í samræmi við map-check.md, [0,10] m, `visual_estimate_from_20m_scale`) — OM1 uppfyllt í gögnum.
- **`previous_disposition`:** deep-equal við fyrri færslurnar (2520 START `remaining-coverage` og 2536 START) — bókstaflega varðveitt og um annan endapunkt en nýja valið.
- **places.json:** 56/56 í sömu röð; **nákvæmlega 2 breyttar, 54 óbreyttar** (þar á meðal fyrri 25 með hnit); breytt: coordinates, approach, `ACCESS_POINT_SELECTED_ACCESS_UNCONFIRMED`, reason (greinir Ripley-kortastoð frá óstaðfestu aðgengi, 0–10 m áætlun, EXACT_GAP), `selectionReference`, `selection_basis`, `coordinateDerivationReference`; `coverageReference` og aðrir eldri reitir varðveittir. Hnit og approach = selections-færslur. 27/56 með hnit, 29 null. Topp-`note` í báðum skrám uppfærð í samræmi (OK3-krafan) og í samræmi við raunstöðu.
- **Texti (OM2) í gögnum:** „Punktur við tengingu Hringvegar og Norðfjarðarvegar áleiðis til Reyðarfjarðar.“ / „… Búðavegar áleiðis til Fáskrúðsfjarðar.“ — orðrétt eins og taflan, engin fullyrðing um bæjarmörk/miðbæ/staðfesta aðkomu eða akstursleið.
- **Aðrar server_data-skrár** og öll önnur prófasöfn óbreytt (mtime): analysis, remaining-coverage, south, acquired-geometry, place-evidence, southConnections/acquiredGeometry/approachAnalysis/placeEvidence. Aðeins approachSelections.test.js, places.test.js og remainingCoverage.test.js breyttust (sjá prompt: „aðeins þar sem raunverulega þarf“; síðustu tvær fengu aðeins tvö ID í núverandi undantekningasett).
- **Prófin í mínu umhverfi:** sjö gagnasöfnin **101/101 PASS** (97 áður + 4 ný). Allar 13 prófaskrár sem hlaðast hjá mér: 183/183; `forecastFetch.test.js` hleðst ekki í mínu afriti (vantar `../openMeteoAuth.js`, utan þessarar lotu og óbreytt), því staðfesti ég ekki tölu CC 196/196.
- **Mutation-próf á afriti (34 breytingar):** 22 greinast, **12 sleppa**. Greinast m.a.: gamli endinn settur inn aftur (2520 START; 2536 START), native 50 m færður, WGS84 0,001° færð, Fáskrúðsfjörður-hnit fært að bæjarmiðju, `previous_disposition` týnt/breytt source, rangt `selection_basis`, SUPPORTED/ROUTABLE, rangt `map_reference`, `source_role: CC_VISUAL_CHECK`, frávik [0,50], „Staðfest bæjarmörk“/„miðbær“ í places-approach, rangt `selectionReference`, `coordinateDerivationReference` týnt, eldri staðir færðir, aukastaður fær hnit, shared-end skipt út.

**CC-eignað (ekki keyrt af mér):** vitest 196/196 á allri möppunni, ESLint, `git diff --check`, `git status` (aðeins leyfðar skrár), fullyrðingin um villuna sem CC fann og lagaði í fyrstu útgáfu prófsins (rangt raw-skjal og blandaðar einingar) og „validation“-textinn í `wgs84_derivation` (5 retained pör, 2,3e-8°).

### Ábendingar

- **OP1 — prófagöt gagnvart approved-prompt (mutation sem sleppa; gögnin sjálf rétt):**
  1. **`native_crs` og `wgs84_derivation`-færibreytur** hjá nýju færslunum eru óvarðar (M07: `native_crs` = EPSG:3059 sleppur; M30: `lat_1` breytt sleppur). Prompt-ið krafðist „rangt CRS/hnit“ og „native/projection-metadata“; núverandi próf á þessu eiga aðeins við Reykjahlíð.
  2. **OM1:** próf athugar bara að URL byrji á `https://www.openstreetmap.org/`; sé URL Reyðarfjarðar og Fáskrúðsfjarðar víxlað sleppur það (M16). „Rétt URL fylgi hvorum stað“ var skýr krafa.
  3. **OM2:** engin athugun á að `connectionStatus.reason` tilgreini Ripley-kortastoð og óstaðfest aðgengi (M22: reason = „Vöruaðkoma valin.“ sleppur; M23: „Staðfest ytri graph-tenging og akstursleið“ sleppur því bannregex nær aðeins yfir „staðfest akstursleið“). Auk þess er orðalagsvörnin aðeins á places-approach, ekki `approach_is` í selections (M21).
  Lagfæringin er um 10–15 línur í approachSelections.test.js (tvær `toBe`-athuganir á `native_crs`/`lat_1`, URL ber saman við map-check.md per stað, `reason` inniheldur „Ripley“ og „EXACT_GAP“ og ekki „staðfest … graph“, og `place.approach === selections[id].approach_is`).
- **OP2 — valfrjáls herðing:** (a) WGS84-próf notar `toBeCloseTo(…, 6)` (±5e-7°) þótt prompt-ið nefni 1e-7°; 2e-7° breyting sleppur (M06) — 2 cm, hrein formsatriði. (b) `previous_disposition.reason_text` er ekki borið saman bókstaflega (M10; ég staðfesti deep-equal). (c) `coverageReference` varðveitt er ekki prófað (M26). (d) Hvorug topp-`note` er varin (M32, M33). (e) Eldra próf með titilinn „… byte-for-byte unchanged“ athugar aðeins `selection_basis`; ég staðfesti sjálf bókstaflegt jafngildi, en titillinn ofhermir.
- **OP3 — „real mutation“-prófið er sjálfhverft:** það breytir staðbundnu afriti og ber saman við sama hjálparfall, svo það getur ekki mistekist. Raunvörnin er prófið á undan (live source ≠ previous_disposition.source), sem greinir M01 og M02. Ekkert tap, en titillinn ofhermir.

### Takmörk

Kortaskoðunin sjálf (gatnamót við pinna, 0–10 m) er Ripley-heimild; ég hef ekki séð kort. Rúmfræði retained gagna (Hringvegur beygir við báða hnúta) samræmist henni en sannar hana ekki. Engin ytri graph-tenging við veg 92/955, stefna, opnun eða akstursleið er staðfest. Enginn staður er SUPPORTED/ROUTABLE; akstursaðgengi EXACT_GAP á öllum 23 völdum punktum í selections (27 staðir með punkt alls, 29 án punkts). #500 er opið.

### Næsta skref

Ripley lokamat. Engin ný CC-lota nauðsynleg; OP1 má taka sem valfrjálsa herðingu eða senda CC örlitla prófalagfæringu (eitt skipti, ekki þriðja review-umferð í þessari vinnu).

## Ripley lokamat — 2026-11-16

**PASS. Vörumarkmið þessarar tveggja-punkta lotu uppfyllt; Stage CLOSED. #500 áfram opinn.**

Reyðarfjörður2553 START og Fáskrúðsfjörður2536 END valdir með native/source/vörpun og Ripley-kortatilvísunum. Gamlar höfnanir á öðrum endum varðveittar undir previous_disposition. Jonesy staðfesti source/hnit, bókstaflega varðveislu eldri21 afgreiðslna og54 óbreyttar place-færslur; sá samanburður er Jonesy-eignaður. Kortprófið er áfram fyrri Ripley-skoðun, ekki ný CC/Jonesy-heimild eða ný sjónskoðun við lokamat.

OP1 tekið inn sem lítil bein prófaleiðrétting: CRS/GRS80/færibreytur, rétt URL fyrir hvorn stað (gegn skráðum map-check-slóðum), approach_is=places.approach og afmarkað orðalag, Ripley/EXACT_GAP og skýrt óstaðfest graph-aðgengi í reason. Ný athugun prófuð; upphafleg ofvíð bann-regex greip réttmætu neitunina „ekki staðfest“, svo leiðrétt í jákvæða kröfu um þá neitun. Engum réttum vörugögnum breytt. Eldra describe-talningarheiti samræmt23/33. OP2/OP3 önnur valfrjáls herðing ekki framkvæmd; engin ný lota.

Sjálfstætt keyrt staðbundið Vitest4.1.10, sjö gagnasöfn **102/102 PASS**, ESLint á þremur snertum prófskrám og git diff --check hrein. CC196-prófa full-folder-keyrsla áfram CC-eignuð. Engin ný netköll eða dependencies.

Nú27 af56 með punkt,29 óvalinn; enginn SUPPORTED/ROUTABLE. Staðsetningarval sannar ekki ytri graph-tengingu við92/955 eða stefnu/opnun. Engin UI/leiðarvél afhent, engin #500-lokun eða sjálfvirk næsta lota, enginn commit/push/GitHub.
