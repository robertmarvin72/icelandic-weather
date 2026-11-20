# #501 Samsetning núverandi Vestfjarðagrunns og same_place

## Ripley initial prompt umferð 1 — 2026-11-20

Eigandi heimilaði áframhald eftir PASS/CLOSED á closure-scope. Þetta er skref 2 í samþykktu closure-plan: aðeins B1 (same_place) og B2 (tíu samsett pör). B3 er samningslýsing, ekki krafa um normalisering allra eldri svara. Frekari staðaþekja er samþykkt eftirfylgni utan501. Ekkert nýtt svæði, ekkert nýtt endpoint eða gagnagatafylling.

Lesa AGENTS/CLAUDE/README/CURRENT, closure-plan með eigandasamþykki, closure-scope/approved-prompt-v1.md, scope-and-blockers.md og result-review.md (sérstaklega Ripley-leiðréttingar/S2/S5). Síðan núverandi geometry API/core og átta VestfjarðasvæðisJSON/loaders/próf. Notið raunverulegan stuðningslista18para úr úttektinni, ekki gamlar rangar lotutalningar. Prompt-review, ekki keyranlegt fyrr en Jonesy APPROVED, approved-prompt/CURRENT READY_FOR_CC og eigandi Prompt approved.

## Nákvæmt afhendingarmengi

Sex place-endapunktar: `budardalur` B, `flokalundur` F, `isafjordur` I, `holmavik` H, `patreksfjordur` P, `talknafjordur` T. Endahnit/owner-offsets/aðkomumörk orðrétt endurnýtt úr samþykktum svæðisskrám; engin ný projection/innskot eða places.json breyting.

Tíu ný pör báðar áttir, nákvæmur allowlist (óháður röð endanna):

| Par | Úttektarviðmið planar m | Estimated connectorar |
| --- | ---: | --- |
| B–H | 78 697,7705 | enginn |
| B–I | 260 092,7711 | −4 |
| B–P | 233 874,3218 | −4,−5 |
| B–T | 248 219,9897 | −4 |
| F–H | 154 887,0832 | −4 |
| F–T | 75 745,7669 | enginn |
| I–P | 148 325,1015 | −5 |
| I–T | 162 670,7695 | enginn |
| H–P | 216 287,1822 | −4,−5 |
| H–T | 230 632,8501 | −4 |

CC mælir sjálft úr raunkjarna; þetta eru fyrri úttektarviðmið±0.05m, ekki ný keyrsla Ripley. Full geometryId/regionVersion reiknuð, ekki búin til úr forskeytum. Engin önnur ný pör. Átta núverandi Vestfjarðagreinar halda eigin svörum/lengdum/geometryId/regionVersion byte-eins; hringpilotparin tíu og gömlu föstu leiðirnar óbreyttar.

## Minnsta innleiðing

1. Nýtt sjálfstætt runtimeJSON fyrir sameinaðan grunn, lítill loader og task-local offline-build með fyrirliggjandi mynstri. Engin request-time lestur úr docs, engin ný dependency/provider/core-breyting. Sameina átta retained svæðisskrár á sourceId, með connectorum−4/−5. Nýja skráin má hafa88raunlínur+2connectora úr úttektinni; ekki krefjast blindgötuhreinsunar/74lína-útgáfu. Ekki bæta Hringvegslínum eða fullu1564neti íruntime.
2. Skarast sourceId: varðveita samhljóða geometry/ID/tier, metadata-yfirmengi samrýmanlegra reita. Sexafsjöskörunum JSON-eins;3611 hefur aukaidbuturName íveg68skránni, sem **stýrir via**. Halda reitnum, ekki fyrstur-vinnur sem glatar metadata. Óvænt ósamrýmanleg gildi/hnit => STOP með mun, ekki silent snapping/epsilon/hnútabreyting. Connectorar/evidenceRef/z/endpoints orðrétt afrit, enginn nýrconnector.
3. API: ein ný grein fyrir tíu-pára allowlist eftir fyrri nákvæmu branches en fyrir almenna known-ID-hlið. **Junction-ID öll útilokuð**, bæði ísame_place ogsamsettri allowlist: J60/J68/J61 halda fyrri400/200-samningum utan eigin eldri para. Þekkt hætta: Vestfjarðanet ánHringvegar getur skilað219kmJ60→J68-hjáleið ístað51.6km; ekki leyfa slíkpör og ekki laga með nýrriHringvegslotu.
4. Nota núverandi composeGeometryPath á sameinuðum raunlínum og valinn raun-endpoint, ekki líma saman tilbúin parsvar. Skeyting við3755/3321, HólmavíkurJ og2271/3361 eftir leið. Þegar P/T/H/F er ekki áfangastaður má ekki aka að bæjarenda bara til að skeyta leggjum. Sérstaklega B/F/I/H↔T innihalda hvorki53127né−5; F↔T fer2271→3361beint. Próf á raunbrúnum (sourceId+vertexedge), ekki uniqueness-regla yfir marga sjálfstæða framtíðarferðaleggi.
5. B1: same_place fyrir **alla sex studda Vestfjarðaenda** (þar meðFlókalundur) fyriralmenna hliðið, með sama grunnsvarformi og núverandi same_place íkjarna/API, tier0/version/endahnit/UNVERIFIED. Engin lengd/geometryuppspuni og engin ný sama-staðar-fullyrðing fyrir aðra ómappaða staði. Halda raunverulegum offset/coverage-fyrirvara þarsemviðá; same_place áT er sama aðkoma2889v12, ekki owner-bæjarpunktur. Ekki bætaFlókalundi íalmenna56listann eða breyta400svörum óstuddaFlókalundarpara. FyrriB1-undantekningar íprófum uppfærast aðeins fyrirþessa sex id.
6. Ný samsett svör fylgja fyrirliggjandi geometry-only sniði: stöðug útgáfa/geometryId/endar/slices/coordinates/via/idButurIds/lengthNote, estimatedConnectorLengthM=summaALLRAestimatedslices áleið. Connectornull sleppt íIdButur og röð varðveitt. LykluðaccessApproach áplaceId, réttir offsets án loftlínu ílengthM. T-pör með995.43m/routeEndsShortOfOwnerCoordinate:true ogtown continuation not included. I-pör bera3834hringbogafyrirvara með raunátt slice, ekki hardkóðaða átt úröðrupari. lengthNote telur hvern connector sem er raunverulega áleið (−4~5mm,−5~4.39m), enga sem er ekki áleið. drivingAccess UNVERIFIED/tier0planarlengd, enginETA/öryggis-/færðar-/heilsársfullyrðing.
7. Via fyrirnýpör byggist á fyrirfram nafngreindum raunleiðarmerkjum og ferðarröð, **fest nákvæmlega íprófum áhverjupari/báðumáttum**. Reikna fyrst úrraunslices/retainedheitum og skrá væntingar; engin substring-bæjaályktun eða endar sem millistaðir. Mikilvægt að3611metadata-sameining ráði ekki óviljandi hvaða nöfn birtast. GamlaJ68↔Hviaorðalag óbreytt. Sýnt nýtt nafnagap krefst einfaldasta sannra merkis, ekki nýrrar nafnarannsóknar.

## Focused samþykktarskilyrði

- Tuttugu ný stefnusvör geometry_only með réttum endum/lengdum/sourcekeðjum/IdButur/via; reversehnitaruna/slices rétt,0tvítalinraunbrún, hnit-/slice-summa=lengthM, stabílversions/geometryId. B↔H nákvæm12sneiðar tilraunarA úrclosure-scope; aðrar sourcekeðjur pinnaðar úr sjálfstæðri væntingu/úttekt, ekki test sem kallar sama build og les sama vænta úttak.
- Sex same_place-svör, engin víkkun annarra óstudda/junctionpara. Núverandi18óröðuðpör/36stefnusvör óbreytt; ný10gera28/56 fyrirutan same_place. Fyrri5same_place +6ný =11. Prófa tilteknar400gates/unsupported/same_place ómappaðsstaðar; ekki afturkeyra3600pör nema nýr sýndur vafi réttlæti.
- Connector-metadata/summa sýnd áB↔P/H↔P meðbáðumconnectorum, Ihringbogafyrirvari ogTcoverageflag/skeyting sérstaklega prófuð. Endahnit/metadata úrsourceafritum sannprófuð. Eittneikvættbilpróf ánýjumgrunni sýnirunsupported viðbrotiðsamþykktnet, engin uppspunninbrú/silentfallback. Ekki ný full-net mutation/fuzzlota.
- Focusednýsamsvæðis/API/core ogviðeigandi fyrri regressions, föstu leiðapróf32 sem áður; lint snertumJS/diff-check. Ekki fullsuite/build/mutation nema sýndástæða. Kjarni/fyrriJSON/loaders/vercel/places óbreytt. Handler-import/nýbranch/same_place-grein viðbætur; fyrri runtimebranches ekki refactoraðar.

## Kort og handoff

Eitttask-localmap-view/build-map-data með nýju10pörunum/báðumáttum íselector (ekki productUI). Leið úrraunhandler/raunkjarna, endpoint/ownerpunktar/offsets, estimatedconnectorar sérmerktir, Ihringbogi/T995mcoverage skýrt, engin leið aðownerT efhúnvantar. Sýna B↔H, F↔T ogH↔P sem aðalpróftilfelli fyrir eiganda; ekki10nýjar sjálfstæðarkortasamþykktarlykkjur. CanonicalOSM/referrer/attribution, fyrirliggjanditransform/tolerance≤0.056m. Nýttlaustport t.d.8778,eldri8765–8777ótrufluð/task-localonly. Virkurhlekkur eða heiðarleg tæknitakmörkun; ekkert sjónræntPASS án skoðunar. Eigandakortasamþykki eftir tæknilegtlokamat.

Stutt **route-contract.md** íþessaritaskmöppu: hvaða reiti502/503 lesa ánýja sameinaða flötinum/eldrigeometryflötum/föstuleiðum,IdButur úr slices þarsemvantar top-level, source/geometry/veðurpunktar aðgreindir. Engin livefærð/veðuruppsetning eða breytingáeldrisvörum vegna samningsmunar. Skrifa cc-report.md með raunmælingum/prófum/óbreyttumfyrriIDs/blockerB1/B2afgreiðslu. Skref3endanleglokaskilyrðauppgjör/handoff er eftir; ekki loka501nú.

## Umfang og STOP

NýttsameinaðruntimeJSON/loader/próf, litlarAPI/prófabreytingar, task-localbuild/kort/samningslýsing/cc-report ogCURRENT-lífsferill samkvæmtREADME. AðeinsB1/B2; engir nýirstaðir/endapunktar, götfylling, nýconnector/öflun/arkitektúr/dependency/UI/liveveður/færð/cache/scoring/pricing eðaHringvegstenging. Ef þaðkrefst kjarnabreytingar, breytingaáfyrri geometry/endapunktum eða nýrragagna: STOP með raunvillu ogminnsta vali áðurenvíkkaðer. Ekki rjúfa hringgates til aðgera meiriall-pairs.

Valfrjálsherðing, aukinnafnagögn eðaendurmatfyrri samþykktraMVPforsendna ekki blocker. Þegar10nýpör/sex same_place/focusedpróf/kortvirka,stoppa. Engincommit/push/deploy/GitHub eða sjálfvirktnæstaverk. CC READY_FOR_CC→CC_IN_PROGRESS→CC_COMPLETE meðreportpath; Jonesyreview/Ripleylokamat/eigandakortasamþykki.

---

## Jonesy review — umferð 1 (2026-11-20)

**Niðurstaða: PROMPT_REVIEW — samþykkjanlegt með bindandi P1–P9.** Afmörkunin (B1 + B2, sex endapunktar, tíu ný pör, engin ný gögn, engin kjarnabreyting, junction-id úti) er rétt og ég sé enga ástæðu til að stækka eða minnka hana. Ég prófaði forsendurnar í sandbox á raunkjarna og raunhandler (núverandi kóði gegnum Tálknafjörð) og **allar tölur í töflunni þinni standast** (lengd, slices, estimated connectorar). Sjö atriði sem prompt nefnir ekki eða þarf að skerpa — og ein **leiðrétting á minni eigin S2-fullyrðingu**:

1. **Leiðrétting á S2 (3611/`via`) — ég ofmat áhrifin.** `idbuturName` á 3611 er „Djúpvegur: Hrófá - Hólmavík“, og „Djúpvegur“ er yfirlýst *útilokað* sem via-merki í núverandi kóða. Nöfnin sem núverandi 1/68-via leitar að (`Innstrandavegur`, `Broddanes`) eru í `idbuturName` á **blindgötulínunum 1796, 1720, 1717, 1444, 3278, 24002, 3411, 2427, 2773, 2690** — og **engin þeirra er á neinni af tíu nýju leiðunum** (0 slices úr þeim í öllum tíu, báðar áttir). Að halda `idbuturName` á 3611 (yfirmengi) er samt rétt og skaðlaust, en það **ræður ekki via nýju paranna**. Prompt-texti „sem stýrir via“ er því ónákvæmur; P1/P5 laga það. Raunveruleg via-hætta er önnur (næsti liður).
2. **Núverandi via snýst ekki við í öfuga átt.** `Ísafjörður→Hólmavík` og `Hólmavík→Ísafjörður` gefa bæði `["Súðavík","Steingrímsfjarðarheiði"]`; `Búðardalur↔Flókalundur` bæði `["Gilsfjörður","Þorskafjörður","Klettsháls"]` (frambeint listaröð, ekki ferðarröð). Prompt-liður 7 biður um *ferðarröð* fyrir ný pör — rétt, en þá **verða ný pör ólík eldri í öfuga átt** (via snýst við). Það verður að vera fast ákvörðun með prófi (P5), og eldri svör verða **ekki** „löguð“.
3. **−4 er hættulegt connector:** án −4 skilar kjarninn **ekki** `unsupported` heldur **rangri langri leið** sem `geometry_only` (B→I 300 799,91 m, B→P 442 864,27 m, B→T 457 209,94 m, F→H 304 494,79 m, H→P 365 201,34 m, H→T 379 547,01 m — stór lykkja um Hólmavíkursvæðið/Ísafjarðardjúp í stað −4-brúarinnar). Aðeins **−5** gefur `unsupported disconnected_graph` (B/I/H↔P). Prompt-liður „eitt neikvætt bilpróf … sýnir unsupported“ verður því að nota −5 (P7).
4. **same_place á Westfjords-endum getur ekki verið „sama grunnsnið“ bókstaflega:** núverandi `same_place` (Hella) er tier-2 með `coordinates:[{x,y,z:null}]` námundað í 4 aukastafi og `datasetVersion`; Westfjords-svör eru tier 0 með raun-`z`, óbreyttum x/y, `regionVersion` og lykluðu `accessApproach`. Þetta þarf að festa nákvæmlega (P3), annars velur CC einhliða.
5. **`estimatedConnectorLengthM`-lykill:** núverandi svör sleppa lyklinum þar sem enginn connector er (`isafjordur↔holmavik`), en B↔F hefur hann. Ný pör verða að hafa **eitt** snið (P6).
6. **`accessApproach` Búðardals er ekki í sameinuðu skránni sjálfkrafa:** `offsetM` 160,1476178502974 er aðeins í `westfjords-region-1-60-budardalur.json`; `budardalur-flokalundur.json` ber aðeins `insertedNode` (án `z`; `z` 24,473128257522806 kemur úr línuhnút 2769). Sameiningin verður að *flytja* offsetið orðrétt, ekki endurreikna það (engin ný vörpun).
7. **`lengthNote` núverandi B↔F nefnir ekki −4** (aðeins `estimatedConnectorLengthM`). Ný pör eiga að nefna hvern connector sem er á leið, en B↔F **helst byte-eins** — ekki samræma.

### Merking: sandbox vs CC

- **Sandbox (mitt, Linux):** núverandi kóði og átta svæðisskrár (afrit), raunhandler, **raunverulegur `composeGeometryPath`** á sameinuðu neti (88 línur + −4/−5, sameining á `sourceId`, fyrstu-skrá-vinnur — sama röð og hjá CC í closure-scope sem skilaði mínum tölum), via-útreikningur með nafnalista úr núverandi kóða, og fjarlæging connectora. Allar tölur mínar, viðmið ±0,05 m. **Ekkert af nýja kóðanum er til enn.**
- **CC-fullyrt:** ekkert enn.

### Sandbox-niðurstöður

**1. Tíu ný pör (öll `geometry_only`, báðar áttir, öfug lengd ≤6e-11 m) — samsvara töflu prompt.** Slices/IdButur-fjöldi (úr sameinuðu neti): B↔H 12/7 · B↔I 38/24 · B↔P 28/17 · B↔T 28/18 · F↔H 17/11 · F↔T 8/7 · I↔P 24/17 · I↔T 24/18 · H↔P 24/16 · H↔T 24/17. **0 línur úr blindgötunum (spur) og engin junction-id-lína á neinni leið.**

**2. Sourcekeðjur fram (öfugt = nákvæmlega öfug röð/átt; sjálfstæð viðmið, ekki úr kóða CC):**

- **B→H:** `2769[3→4] 3197[0→45] 3247[0→33] 3462[0→22] 40961[0→13] 3460[0→20] 3771[0→18] 3755[0→15] 3321[0→47] 3324[0→63] 3611[0→26] 3883[0→3]`
- **B→I:** `2769[3→4] 3197[0→45] 3247[0→33] 3462[0→22] 40961[0→13] 3460[0→20] 3771[0→18] 3755[0→15] 3754[0→61] 3750[0→22] 49925[0→48] −4 50566[0→36] 3678[0→65] 3677[0→55] 3675[0→60] 3672[0→66] 3651[0→72] 3869[0→53] 3868[0→28] 3648[0→53] 3009[0→39] 3008[0→77] 2870[0→66] 38085[0→41] 38087[0→15] 38088[0→18] 2994[0→11] 3003[0→30] 2767[0→44] 2993[0→9] 2297[0→9] 2890[0→10] 2618[0→5] 2600[0→4] 3835[0→13] 3833[0→13] 3834[0→5]`
- **B→P:** sama upphaf og B→I til `3868[0→28] 3648[0→53]`, svo `3698[0→22] 3339[0→53] 3334[0→49] 3332[0→69] 2271[0→59] −5 53127[0→7]`
- **B→T:** sama og B→P til `2271[0→59]`, svo `3361[0→53] 2889[0→12]` (**ekkert 53127/−5**)
- **F→H:** `3648[50→0] 3868[28→0] 3869[53→0] 3651[72→0] 3672[66→0] 3675[60→0] 3677[55→0] 3678[65→0] 50566[36→0] −4 49925[48→0] 3750[22→0] 3754[61→0] 3321[0→47] 3324[0→63] 3611[0→26] 3883[0→3]`
- **F→T:** `3648[50→53] 3698[0→22] 3339[0→53] 3334[0→49] 3332[0→69] 2271[0→59] 3361[0→53] 2889[0→12]`
- **I→P:** `3834[5→0] 3833[13→0] 3835[13→0] 2600[4→0] 2618[5→0] 2890[10→0] 2297[9→0] 2993[9→0] 2767[44→0] 3003[30→0] 2994[11→0] 38088[18→0] 38087[15→0] 38085[41→0] 2870[66→0] 3008[77→0] 3009[39→0] 3698[0→22] 3339[0→53] 3334[0→49] 3332[0→69] 2271[0→59] −5 53127[0→7]` (fer **ekki** um 3648 — fer framhjá Flókalundi)
- **I→T:** sama og I→P til `2271[0→59]`, svo `3361[0→53] 2889[0→12]`
- **H→P:** `3883[3→0] 3611[26→0] 3324[63→0] 3321[47→0] 3754[0→61] 3750[0→22] 49925[0→48] −4 50566[0→36] 3678[0→65] 3677[0→55] 3675[0→60] 3672[0→66] 3651[0→72] 3869[0→53] 3868[0→28] 3648[0→53] 3698[0→22] 3339[0→53] 3334[0→49] 3332[0→69] 2271[0→59] −5 53127[0→7]`
- **H→T:** sama og H→P til `2271[0→59]`, svo `3361[0→53] 2889[0→12]`

Athugið: **`3755 END = 3754 START = 3321 START`** er þríhnútur (Þröskuldamót); B→H velur 3321, B→I/P/T og H→P/T 3754. `3648[0→53]` fer í gegnum innskotshnút Flókalundar (v50) án þess að skipta sneið — Flókalundur er ekki endi á B→I/B→P/B→T/H→P/H→T og **á ekki að verða sneiðaskil eða via**. F→H/F→T hefja á `3648[50→…]` (Flókalundarhnútur v50). `I→P/I→T` taka 3009→3698 beint og snerta ekki 3648.

**3. Ísafjarðarhringbogi (3834) — raunátt:** `I→X`: `3834 reverse 5→0`; `X→I`: `forward 0→5` (öll fjögur I-pör, báðar áttir). Textinn í `lengthNote` verður að fylgja raunsneið hvers svars.

**4. Via — niðurstaða mín (nafnalisti úr núverandi kóða, ferðarröð, fyrsta tilvik):**

| Par | via fram | via öfugt |
| --- | --- | --- |
| B–H | `["Gilsfjörður","Þröskuldar"]` | `["Þröskuldar","Gilsfjörður"]` |
| B–I | `["Gilsfjörður","Þorskafjörður","Klettsháls","Dýrafjarðargöng"]` | snúið |
| B–P | `["Gilsfjörður","Þorskafjörður","Klettsháls","Brjánslækur","Kleifaheiði"]` | snúið |
| B–T | `["Gilsfjörður","Þorskafjörður","Klettsháls","Brjánslækur","Kleifaheiði","Miklidalur"]` | snúið |
| F–H | `["Klettsháls","Þorskafjörður","Þröskuldar"]` | snúið |
| F–T | `["Brjánslækur","Kleifaheiði","Miklidalur"]` | snúið |
| I–P | `["Dýrafjarðargöng","Brjánslækur","Kleifaheiði"]` | snúið |
| I–T | `["Dýrafjarðargöng","Brjánslækur","Kleifaheiði","Miklidalur"]` | snúið |
| H–P | `["Þröskuldar","Þorskafjörður","Klettsháls","Brjánslækur","Kleifaheiði"]` | snúið |
| H–T | `["Þröskuldar","Þorskafjörður","Klettsháls","Brjánslækur","Kleifaheiði","Miklidalur"]` | snúið |

**5. Neikvæð bilpróf (raunkjarni, sameinað net):** án −5: `B/I/H→P` = `unsupported disconnected_graph` (hin sjö óbreytt). Án −4: sjá athugasemd 3 hér að ofan (rangar langar `geometry_only` leiðir).

**6. Núverandi stöðu fylki (60 id, 3 600 raðpör):** 36 `geometry_only` / 5 `same_place` / 3 107 `200 unsupported` / 452 `400`. **Vænt eftir breytingu (reiknað, ekki enn keyrt):** **56 / 11 / 3 086 / 447** — breytingin er nákvæmlega 20 `unsupported/400`→`geometry_only` (16 úr unsupported: 8 óröðuð pör milli B/I/H/P/T; 4 úr 400: F–H, F–T) og 6 → `same_place` (5 úr unsupported, `flokalundur→flokalundur` úr 400). 3 086 + 447 + 56 + 11 = 3 600.

**7. Offsets sem verða að berast orðrétt í sameinuðu skrána:** Búðardalur **160,1476178502974** (aðeins í `1-60-budardalur`), Flókalundur **51,30036446804795**, Ísafjörður **164,61838967158118**, Hólmavík **437,31993395679643**, Patreksfjörður **8,775919534139193**, Tálknafjörður **995,4294251543986** + `routeEndsShortOfOwnerCoordinate:true`.

### Bindandi atriði (P1–P9)

**P1 — Sameinað runtimeJSON og metadata (leiðrétting á S2 innifalin).**
Ný sjálfstæð skrá (t.d. `server_data/westfjords-region-combined.json`) + lítill loader + task-local offline build; engin request-time lestur úr docs; ekkert nýtt í `places.json`/`vercel.json`/kjarna/fyrri skrám. Sameina átta retained skrár á `sourceId` (**88 línur, connectorar −4 og −5 orðrétt**, ekki nýir). Skýr assertion í build: sex af sjö skarast `sourceId` (2769, 3648, 3833, 3834, 3883, 53127) **JSON-eins í heild**; **3611 hefur aukareitinn `idbuturName` í 1/68-skránni — halda honum (yfirmengi)** og festa í prófi að sameinaða 3611 = 1/68-afritið (vertices/ID/tier/veghluti/name/evidenceRef óbreytt). **Leiðrétting:** `idbuturName` á 3611 hefur engin áhrif á via (sjá P5); halda reitnum sem heilleika-metadata, ekki sem via-áhrifavald. Óvænt ósamrýmanlegt gildi/hnit á öðru skarast id ⇒ STOP með mun. **Endapunktar úr sameinuðu skránni orðrétt:** B (370 289,3768328927; 515 027,06854594796; `z` 24,473128257522806 úr hnút 2769 v3), F (307 969,53266107786; 570 587,8678268795; z 0), I (3834 v5; 313 430,1109331023; 625 946,2219128008; z 0), H (3883 v3; 376 742,4201551166; 580 824,7020691019), P (269 924,76731277065; 575 660,3516744098; z 0), T (2889 v12; 278 446,8401528691; 578 008,3317371758; z 0). **Offsets orðrétt** eins og í lið 7 hér að ofan — **budardalur-offsetið er aðeins í 1-60-skránni og verður að flytjast, ekki endurreiknast.** Próf: `JSON.stringify`-jafnræði á afritunum á móti sjálfstæðri lestri frumskránna (ekki sama build-fall).

**P2 — Allowlist, hlið og regression.**
Nákvæmur óröðurháður allowlist yfir tíu pör: B–H, B–I, B–P, B–T, F–H, F–T, I–P, I–T, H–P, H–T. **Engin önnur pör.** Fimm núverandi pör (B–F, F–I, I–H, F–P, P–T) og þrjú junction-pör **áfram á eigin greinum**, byte-eins (lengd/`geometryId`/`regionVersion` úr `scope-and-blockers.md` töflu 1, t.d. `9d3e8ed9…`/`2f68aa48…`, `b0c4c622…`/`656802aa…`). Junction-id **útilokuð í allowlist og same_place**; J-pör með B/F/I/H/P/T halda fyrri 400/200 (`junction-1-68-stadarskali↔budardalur` o.s.frv. — skrá fyrri svör fyrir keyrslu, bera saman eftir). Ný grein **fyrir** almenna known-ID-hliðið en **eftir** núverandi nákvæmum pair-branches (eða útilokun fimm núverandi para óháð röð). **Ég bind eina keyrslu (forskrift, ekki próf, ekki afhent í repo)** á öllum 3 600 raðpörum fyrir og eftir; vænt niðurstaða **36/5/3 107/452 → 56/11/3 086/447** og nákvæmlega 26 breyttar frumur — ódýrt (sekúndur) og eina leiðin til að *sýna* „engin víkkun“; sýnd vafi er hér til staðar vegna þess að ný grein fer fyrir almenna hliðið. Hringpilotparin tíu, Egilsstaðir/Seyðisfjörður og föstu leiðirnar 32/32 (`api/winter-route.test.js` 20 + `api/_lib/winterRoute/routes.test.js` 12) óbreytt.

**P3 — same_place (B1) fyrir sex id.**
`budardalur`, `flokalundur`, `isafjordur`, `holmavik`, `patreksfjordur`, `talknafjordur` → `200 same_place` á undan almenna hliðinu; **`flokalundur` fer ekki í 56-lista**; `flokalundur→X` (X utan fimm studdra para/ný pör) áfram `400 unknown_place_id`, J-id áfram óbreytt (`junction-*→junction-*` ekki same_place). Snið (fast, Westfjords-snið, ekki kopía af tier-2): `schemaVersion`, `compositionVersion`, `regionVersion` (sameinaða skráin), `from`=`to`, `crs`, `tier` 0, `drivingAccess: "UNVERIFIED"`, `status: "same_place"`, `geometryId` (stöðugt, ólíkt milli id), `lengthM: 0`, `lengthNote` (tier-0 planar; **engin ný sama-staðar-fullyrðing** um bæ/aðgengi), `via: []`, `idButurIds: []`, `estimatedConnectorLengthM: 0`, `coordinates: [ { x, y, z } ]` = **bókstaflegur endapunktur (óbreytt x/y/z, ekki námundað í 4 aukastafi, `z` ekki `null` þar sem hnúturinn hefur `z`)**, `slices: []`, `accessApproach` lykluð `{ <placeId>: { ownerCoordinateOffsetM … } }` (T bætir við `routeEndsShortOfOwnerCoordinate: true` og „town continuation not included“ í texta; same_place á T er aðkoma 2889 v12, ekki owner-bæjarpunktur). **Krosspróf:** `coordinates[0]` í same_place hvers id **=** fyrsta hnit hvers para sem byrjar á því id og síðasta hnit hvers para sem endar á því (báðar áttir). Aðeins `same-id` fullyrðingar fyrir þessi sex id breytast í núverandi prófum (`flokalundur` o.fl. í `winter-route-geometry.test.js` ~l. 742, 851, 959, 1304, 1418 + búdardalur/talknafjordur-staðir); `keflavik→keflavik` (l. 138) og önnur ómöppuð id áfram `unsupported`.

**P4 — Samsetning og sourcekeðjur.**
Núverandi `composeGeometryPath` á sameinuðum raunlínum, valinn raun-endapunktur, engin sérsmíðuð skeyting. Prófin pinna **sourceId + vertexedge-röð** (`2769[3→4]…`) fyrir öll tíu pör, báðar áttir, **úr sjálfstæðri væntingu** — keðjurnar mínar hér að ofan eru viðmið (CC mælir sjálft og ber saman; frávik í röð eða >0,05 m = STOP með mun). Auk þess: (a) **0 slices úr blindgötunum 3544, 3590, 2649, 3753, 2648, 2647, 1796, 1720, 1717, 1444, 3278, 24002, 3411, 2427, 2773, 2690 á öllum tíu**; (b) `B/F/I/H↔T` innihalda hvorki `53127` né `−5`, F↔T = `3648[50→53] 3698 3339 3334 3332 2271 3361 2889` beint; (c) **P-pör (B/I/H↔P) enda á `−5 53127[0→7]`**, ekki á 53127 án −5; (d) `I↔P/I↔T` snerta ekki `3648` (fara framhjá Flókalundi); (e) Flókalundarhnútur v50 er **ekki** sneiðaskil á B→I/P/T og H→P/T; (f) skeytin: B→H um `3755 END = 3321 START` (z 42,058), hin um `3754`; (g) 0 tvítalin raunbrún (sourceId+vertex edge), hnitakeðja = slice-summa = `lengthM`, öfug stefna nákvæmlega öfug röð/átt, stöðug `geometryId`/`regionVersion`, 0 `z:null`.

**P5 — via (ferðarröð, fast í prófi á hverju pari og átt).**
Nafnalistinn fyrir nýju greinina er **nákvæmlega** `Gilsfjörður, Þorskafjörður, Klettsháls, Þröskuldar, Brjánslækur, Kleifaheiði, Dýrafjarðargöng, Miklidalur`, leitað í `name` raunlínu (substring eins og núverandi grein), merki í **röð fyrsta tilviks á leið í ferðaátt**; **öfug átt er nákvæmlega öfug röð fram-listans** (sjá töflu hér að ofan, ég gef gildin sem viðmið, CC reiknar sjálft og ber saman). **Ekki í via:** `Súðavík`, `Steingrímsfjarðarheiði`, `Innstrandavegur`, `Broddanes`, `Djúpvegur` (óskýrt nafn, útilokað í núverandi kóða), `Hólmavík`/`Flókalundur`/`Ísafjörður`/`Búðardalur`/`Patreksfjörður`/`Tálknafjörður` (endar/bæir), Hálfdán, Bíldudalur, Flatey/Baldur. `Flókalundur` sem gegnumgangsstaður verður **ekki** via (engin ný nafnarannsókn). Próf sýnir að via breytist **ekki** þó `idbuturName` á 3611 sé fjarlægt úr afritinu (sönnun fyrir leiðréttingu 1) og að J68↔Hólmavík-via (`["Innstrandavegur","Broddanes"]` báðar áttir, óbreytt röð) og allar átta núverandi via-niðurstöður séu **byte-eins** (þær snúast **ekki** við; ný pör gera það — skrá þennan mun í route-contract.md, ekki laga).

**P6 — Connectorar, lengthNote, accessApproach, hringbogi, T.**
(a) **`estimatedConnectorLengthM` alltaf til staðar á nýju pörum og same_place (tala, 0 þar sem enginn connector)** = summa lengda allra slices með `sourceId<0` (−4: B–I, B–P, B–T, F–H, H–P, H–T ⇒ 0,0050 m; −5: I–P ⇒ 4,3932 m; B–P og H–P ⇒ 4,3982 m; B–H, F–T, I–T ⇒ 0); slices `estimated:true`, `idbutur: null`. (b) **`lengthNote` sett saman úr þáttum eftir raunsneiðum**, aldrei úr öðru pari: grunntexti; **hver connector á leið** (−4 ≈5 mm, −5 ≈4,39 m; B–P/H–P lýsa báðum; engin sem er ekki á leið — próf með `toMatch`/`not.toMatch` á hverju pari); Ísafjarðarhringbogi **aðeins á I-pörum** með átt **lesin úr raun-3834-sneið svarsins** (`I→X` reverse, `X→I` forward; textinn og sneiðin verða að stemma báðar áttir); T-þáttur (995,43 m, retained 617 endar „að 1sta ljósastaur“, town continuation not included, Bíldudalur/Hálfdán/ferja utan umfangs) **aðeins á T-pörum**; Kleifaheiði/Brjánslækur-þáttur (engin færðar-/lokunar-/aðgengisfullyrðing, Baldur-ferja utan umfangs) á pörum sem fara um 62 (B/I/H/F–P/T); allt með setningunni „no claim about winter closure, driving conditions, current access, or whether any road or service is open“. (c) **`accessApproach` lykluð á placeId** fyrir báða enda með offsetunum í lið 7 (B–F-gamla sniðið óbreytt á gömlu greininni); engin loftlína í `lengthM`. (d) `drivingAccess: "UNVERIFIED"`, tier 0 planar, engin ETA/leiðsögn/færð/öryggi/heilsár.

**P7 — Próf (focused) og neikvæð bilpróf.**
Ný próf fyrir sameinuðu skrána/loader (afritun, sameining, offsets) + handler (tíu pör × 2 áttir = 20 svör; sex same_place; hlið; via; connectorar; hringbogi; T). **Neikvæða prófið notar −5:** fjarlægja −5 úr sameinuðu neti ⇒ `B→P`, `I→P`, `H→P` (báðar áttir) = `unsupported disconnected_graph`, hin sjö óbreytt; **−4**-prófið er annars konar: sýna að án −4 skilar kjarninn rangar langar leiðir (talnaviðmið í athugasemd 3) og að þær **brjóta** pinnuðu lengdirnar — því er **lengdarpróf + „−4 er á nákvæmlega þessum sex leiðum“** það sem ver −4. Engin ný full-net mutation/fuzz. Fyrri focused regressions (átta svæðispör, hringpilot, 93, föstu leiðir 32/32), lint á snertum JS, `git diff --check`; ekki fullsuite/build. Handler-import/ný grein/same_place eru **viðbætur**, ekki refactor. Eldri 257/257 er fyrra lokamati eignað; nýjar tölur CC merktar sem CC-fullyrtar þar til ég/Ripley endurkeyri.

**P8 — Kort og route-contract.md.**
Eitt task-local `map-view.html`/`build-map-data` með tíu pörum × tveimur áttum í selector (ekki product-UI), leið úr raunhandler, endapunktar/owner-punktar/offsets, estimated connectorar sérmerktir (−4 ≈5 mm sést ekki: merkja í texta), hringbogi og T 995 m skýrt, engin leið að owner-T, aðalprófunartilfelli fyrir eiganda **B↔H, F↔T, H↔P** (+ I-par til að sjá hringbogann í selector, ekki sér lykkja). Canonical OSM/referrer/attribution, fyrirliggjandi transform/tolerance ≤0,056 m; nýtt laust port (t.d. **8778**; 8765–8777 ótrufluð); virkur hlekkur eða heiðarleg tæknitakmörkun; **ekkert sjónrænt PASS frá CC** án skoðunar. `route-contract.md` (stutt): fyrir hvern flöt (sameinaður Westfjords-flötur, átta eldri Westfjords-pör, hringpilot, 93, fastar leiðir) **hvaða reitir eru til** (`via`, `idButurIds` toppstaða vs `slices[].idbutur`, `FORECAST_POINTS` aðeins Vík/Borgarnes, `regionVersion` vs `datasetVersion`, `estimatedConnectorLengthM` lykill, same_place-snið), að **via í ný pör snýst við en eldri ekki**, og að source/geometry/veðurpunktar eru aðgreindir; engin breyting á eldri svörum, engin live færð.

**P9 — Umfang, STOP, skýrsla.**
Aðeins B1/B2: engir nýir staðir/endapunktar, engin gagnagatafylling (Dýrafjarðargöng-CSV-gatið, Tálknafjarðarbær o.s.frv. áfram eftirfylgni), enginn nýr connector/öflun/dependency/UI/live færð/Hringvegslína, engin kjarnabreyting. Kjarnabreyting, breyting á núverandi greinum/geometry/endapunktum eða ný gögn ⇒ STOP með raunvillu og minnsta vali. `cc-report.md`: raunmælingar (20 svör), próf/lint/diff-check nákvæmlega hvað var keyrt, óbreytt fyrri `geometryId`/`regionVersion`, **fylkisamanburður 36/5/3 107/452 → 56/11/3 086/447**, afgreiðsla B1/B2, takmarkanir áfram sýnilegar (UNVERIFIED, estimated connectorar, offsets, 995 m, 3834 hringbogi, tier-0 planar). #501 ekki lokað; skref 3 eftir. Commit/push/deploy/GitHub ekki.

### Valfrjálst (ekki blockerar)

- **S1:** `lengthNote` á B↔F nefnir ekki −4 (aðeins `estimatedConnectorLengthM`); samræming við ný pör er ekki hluti þessa verks (byte-eins ákvæðið gengur framar).
- **S2:** Gamla via snýst ekki við í öfuga átt; það er ósamræmi sem route-contract.md skal skrá, ekki laga hér.
- **S3:** Ég get ekki sagt hvort þrjú aðalprófunarkortin nægi eiganda til að sjá −4-bilið; það sést aðeins í texta/tooltip.

### Mörk þessarar yfirferðar

- Enginn kóði CC til að skoða; allt hér er sandbox-forprófun á raunkjarna og núverandi handler. Ég las ekki GitHub #501, skoðaði ekkert kort og keyrði ekki Windows-próf. Engin ný runtime-skrá, loader eða ný grein er til enn — P2-fylkið og P3-sniðið eru **fyrirmæli**, ekki mælingar á nýjum kóða. Lengdir eru tier-0 planar, `drivingAccess: UNVERIFIED`; „studdur endi“ er MVP-skilgreining. Umferð 2 aðeins ef eigandi biður um hana.
