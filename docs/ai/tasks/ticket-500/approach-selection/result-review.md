# #500 approach-selection — result review

## Jonesy result review — umferð 1 (2026-11-16)

**Niðurstaða: PASS að efni, með þremur litlum beinum leiðréttingum (OH1–OH3) sem Ripley getur gert við lokamat; engir blockerar og engin ný CC-lota.** Valin 11 hnit, endar, source-tilvísanir og places-breytingin standast sjálfstæða sannprófun; ósamræmin eru í veitu/orðalagi, ekki í völdum punktum. Stage → RESULT_REVIEW. Ég sótti ekkert af vefnum og dæmi ekki kortamat Ripley (það er Ripley-eignað og vöruákvörðun eiganda).

### Sandbox-staðfest (mitt) og CC-eignað

**Sandbox (afrit í scratch, engin netköll):**
- Vitest 4.1.12: approachSelections (12) + placeEvidence/places/remainingCoverage/southConnections/acquiredGeometry/approachAnalysis = **86/86 PASS** (sjö söfn, sem ná yfir ný og snert próf).
- **Selections-skrá:** nákvæmlega 13 afgreiðslur (11 SELECTED_PRODUCT_APPROACH + Reyðarfjörður/Fáskrúðsfjörður CURRENT_CANDIDATE_NOT_SELECTED án hnita). Öll 11: source-ID/endi/hnit = fasti listinn í prompt-inu; `selection_basis: MAP_RECOMMENDATION_APPROVED_VIA_PROMPT`; `access_status: EXACT_GAP`.
- **Source-sannprófun á hráu:** 7 acquisition-punktar = start/end-hnútur tier −1 raw-stykkis (nákvæmt, línustykki). Selfoss/Hella/Hvolsvöllur = south-connections WGS84 og native-endar í `road-links.csv`; Reykjahlíð 3566 START native = `road-links.csv`; Lambert-vörpun (mín sjálfstæða + pyproj) gefur töfluhnitið (< 1e-13°); sama formúla á 11 retained suðurpör: mest 2,3e-8°.
- **places.json fyrir/eftir** (óháður samanburður við fyrri útgáfu): 56/56, sama röð; nákvæmlega **11 færslur breyttar** (aðeins `coordinates`, `approach`, `connectionStatus` + nýtt `selectionReference`; engir reitir tapaðir, eldri reference-reitir varðveittir), 45 óbreyttar bókstaflega; fjögur eldri eigandavöld hnit óbreytt; Reyðarfjörður/Fáskrúðsfjörður áfram null; toppstig note rétt (15 valdir/41 óvaldir). Aðrar server_data-skrár hafa óbreyttan mtime frá fyrra stigi.
- **Selfoss/Hella** velja réttilega ALTERNATIVE_NOT_RECOMMENDED endann (OG2) og bilin 30,1/32,63 m eru sögð óleyst í `approach` og selections.
- **Mutation-próf á afriti (22 breytingar):** 20 greinast (m.a. rangur endi/hnit, endi fluttur samkvæmt í bæði skrá og places, Reyðarfjörður/Fáskrúðsfjörður með hnit, aukastaður með hnit/tilvísun, SUPPORTED/ROUTABLE, selection_basis → OWNER_SELECTED, KEF-Keflavík blöndun, eldri eigandahnit fært, source-id rangt, south-connections hnit fiktað); **2 sleppa**: „Eigandavalin“ í approach-texta (OG1) og að ALTERNATIVE/bil-setning hverfi úr Hellu-texta (OG2) — orðalag án prófs, sjá OH2.
- Aðlögun eldri prófa (5 söfn): hver fékk litla, nafngreinda `SELECTED_PRODUCT_APPROACH_IDS`-undantekningu (places 11, remainingCoverage 8, southConnections 3, acquiredGeometry 7, approachAnalysis 7 ID) og krefst non-null + réttrar stöðu hjá þeim; null-krafa óbreytt fyrir alla aðra (mutation: hofn/kopavogur/keflavik með hnit greinist). Ekkert próf fellt niður.

**CC-eignað (ekki keyrt af mér):** vitest 181/181 á allri möppunni, ESLint, `git diff --check`, `git status`.

### Leiðréttingar (litlar, beinar; ekki blockerar)

**OH1 — Reykjahlíð: native-hnit og merking vörpunar vantar í vöruskrárnar.** Prompt-ið krefst „varðveita native-hnit/source og merkja vörpunina“. Hvorki selections-skráin né places-færslan hefur native EPSG:3057 gildi eða merki um að WGS84 sé fengið með vörpun; texti segir aðeins „eftir vörpun“. Rekjanleiki er óbeinn (source → remaining-coverage 3566). Lagfæring: bæta í selections-færsluna `native_xy: [596178.6007, 572933.0514]`, `native_crs: "EPSG:3057"` og stutt `wgs84_derivation` (Lambert, GRS80, færibreytur, mesta frávik 2,3e-8° gegn retained pörum); ein prófsetning sem ber native við `road-links.csv`.

**OH2 — OG1/OG2-fyrirmæli komin í orðalag en ekki alveg eins og samþykkt:** (a) places-færslurnar hafa ekki `selection_basis`-reit (hann er aðeins í selections-skrá og sem texti í `connectionStatus.reason`); (b) ALTERNATIVE_NOT_RECOMMENDED/bil-setningin fyrir Selfoss/Hellu er í `approach` og selections, ekki í `connectionStatus.reason` eins og OG2 sagði; (c) hvorug fullyrðing er varin af prófi (mutation survivors). Annaðhvort bæta reitnum/setningunni við eða merkja í lokamati að textinn í `reason` + selections nægi; ef bætt við: ein prófun á `selection_basis` á 11 og fjórum eigandavöldum án hans.

**OH3 — villur í tveimur óvöldum færslum (Reyðarfjörður/Fáskrúðsfjörður).** (a) `source.database` er „approach-analysis“, en hvorugur staðurinn er í approach-analysis (39 staðir; kandídatarnir eru í `remaining-coverage.json`, coverage.reydarfjordur/faskrudsfjordur, native START 2520/2536) — röng tilvísun; á að vera „remaining-coverage“. (b) `reason_text` Reyðarfjarðar segir vegheitið „Reyðarfjörður-Egilsstaðir“; raunverulegt desc í `road-links.csv` fyrir 2520 og 2536 er „Reyðarfjörður - Fáskrúðsfjörður“ (og Ripley-skjalið segir það líka) — rangt heiti í vörugögnum. Lagfæring: tveir strengir í JSON. Engin ný hnit.

### Ábendingar (valfrjálst)

- KEF: `map_recommendation_reason` segir enn „…nær flugstöðvarsvæðinu á Flugstöðvarvegi“ (Ripley-orðalag); source-stykkið er veg 41 með STADARLYSING „Hafnavegur - Flugstöð“, svo „á Flugstöðvarvegi“ er óstutt. `approach` (það sem OG4 snerti) er rétt orðað; ráðlegt að samræma ástæðuna ef skráin er hvort eð er snert vegna OH1/OH3.
- `cc-report.md`: „Six existing test files adapted“ en nefnir fimm (placeEvidence ósnert, rétt); „5 óháð retained pör“ eru 3 retained (R1, Akureyri C, Borgarnes P4 í prófinu) + 2 Ripley-útgefin Reyðarfjarðar/Fáskrúðsfjarðar-hnit — fullnægjandi gegn mínum 11 retained suðurpörum en lýsingin á ekki að kalla þau öll „retained“. Athugasemd í remainingCoverage-prófi segir „7“ en settið hefur 8 ID (með Reykjahlíð).
- Prófin bera ekki Hvolsvöll/Selfoss/Hellu við `road-links.csv` native-enda heldur við south-connections.json (annað eldra skjal); fyrirmælin (OG3) leyfa það, og ég staðfesti native-endana sjálfur. Ekki þarf meira.

### Takmörk

Ég met hvorki hvort kortavalið sé rétt né ytri tengingar/stefnu/aðgengi; þau eru EXACT_GAP áfram. Enginn staður er SUPPORTED/ROUTABLE; 41 af 56 er án valins punkts; Reyðarfjörður/Fáskrúðsfjörður þurfa sérstakt eigandaheimilað eftirfylgniverk. Þetta er ekki lokun #500. Fyrsta result-review umferð; eftir OH1–OH3 dugar lokamat Ripley, ekki ný Jonesy-lota (ef Ripley vill sjálfstæða yfirferð á leiðréttu skránni nægir stutt „CC búinn“).

### Næsta skref

Ripley (eða CC beint) lagar OH1–OH3 í `winter-route-approach-selections.json` (og eftir ákvörðun OH2 í places), keyrir sex gagnasöfn + approachSelections, og lokametur. Engin ný öflun eða lota.

## Ripley lokamat — 2026-11-16

**PASS eftir beinar OH1–OH3-leiðréttingar. Þessi lota CLOSED; #500 áfram opinn.**

Reykjahlíð hefur nú native_xy/EPSG:3057 og rekjanlega Lambert-vörpun í selections, með derivation-reference á places. selection_basis bætt á nákvæmlega þær 11 places-færslur sem lotan valdi; engar aðrar staðafærslur snertar við lokamat. Selfoss/Hella connectionStatus.reason segir nú ALTERNATIVE_NOT_RECOMMENDED, nálægð við byggð fremur en samfellu og óleyst 30,1/32,63 m bil. Tveir óvaldir source-vísar leiðréttir í remaining-coverage, vegheiti Reyðarfjarðar leiðrétt og KEF-ástæða samræmd vegi41. Hnit og endaval óbreytt.

Þrjú markviss viðbótarpróf verja native-source/vörpun, selection_basis/orðalag/bil og rétta source-vísa óvalinna punkta. Frávikskröfu vörpunarprófs hert úr 1e-6 í samþykkt 1e-7 gráðu. Sjálfstætt keyrt staðbundið Vitest4.1.10: approachSelections + sex gagnasöfn **89/89 PASS**. ESLint á snertu prófi hreint; git diff --check hreint. Jonesy-fyrir/eftir-samanburður á 45 óbreyttum færslum og hans pyproj/fullri11-suðurpara-vörpun eru Jonesy-eignuð; 181-prófa full-folder-keyrsla er CC-eignuð. Engin ný netköll eða kortaskoðun við þetta lokamat. CC-skýrslu bætt við leiðréttingum á talningu prófskráa, uppruna samanburðarpara og óvöldum/kandídatastöðum.

15 af56 með valinn punkt,41 óvalinn. Reyðarfjörður/Fáskrúðsfjörður áfram án vals; enginn staður SUPPORTED/ROUTABLE, engin Frá/Til- eða leiðarvélarinnleiðing. Engin ný lota sjálfkrafa; enginn commit/push/GitHub.
