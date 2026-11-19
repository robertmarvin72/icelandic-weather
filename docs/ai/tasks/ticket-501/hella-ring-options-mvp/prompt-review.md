# #501 — Hringvalkostir Rauðavatn ↔ Hella — MVP Round 1 — 2026-11-19

## Markmið

Eigandi samþykkti áframhald eftir lokna Selfoss-hringvalkosta. Endurnýta sömu south/north lausn fyrir nákvæmlega Rauðavatn↔Hella. South er samþykkt stutt suðurleið til Hellu; north langi boginn um Vesturland/Norðurland/Austurland/suðurströnd að Hellu. Báðar ferðastefnur. Engin ný route engine, rannsókn, provider eða heimildaleit. Vestfirðir/alla56 áfram í planinu en ekki í þessari lotu.

Prompt-review, ekki execution authorization. CC approved prompt + CURRENT READY_FOR_CC eftir eiganda Prompt approved; CC_IN_PROGRESS áður, CC_COMPLETE eftir.

## Lesa og endurnýta

AGENTS/CLAUDE/README/CURRENT; ring-options-mvp/result-review.md með eigandasamþykki; raudavatn-hella-mvp/result-review.md með eigandasamþykki. Núverandi api/winter-route-geometry.js/próf, raudavatnSelfossNorthOption.js/próf og raudavatnSelfossMvpPolicy.js/próf; runtime dataset óbreytt. Fyrri kort sem fyrirmynd, ekki öll rannsóknarsaga.

## Minnsta breyting

- Víkka RING_OPTIONS_PAIRS um nákvæmlega Rauðavatn→Hella og Hella→Rauðavatn. Ekki þriggja-staða mengistékk sem gerir Selfoss↔Hella óvart ring-options. Annað paraval/policy óbreytt.
- composeSouthOption og composeNorthOption taka þegar from/to og dataset; endurnýta beint, north áfram tveir sjálfstæðir leggir um E1. Keyra báðar áttir fyrst með raunhandler. Engin ný samskeyti: sömu −1 fyrir south þar sem notað og −2/−3 fyrir north þar sem notuð. Ef raunbilun krefst annars connectors eða core/dataset-breytingar, STOP með nákvæmri bilun/minnsta vali eiganda.
- option=south|north og sjálfgefið styttri raunmældi valkostur eins og fyrir Selfoss. Options lýsa raunmældum lengdum/via og aðeins valin geometry í svari. Óþekkt/tómt/fylki/endurtekið option á Hella-pari gefur sama 400 invalid_option og Selfoss. Önnur pör/same_place halda fyrri samningi og hunsa option eins og áður.
- describeOption notar nú hardcoded `raudavatn-selfoss-` routeId-forskeyti. Gera litla par-sértæka breytingu svo Hella-valkostir fái rétt auðkenni (t.d. raudavatn-hella-…), en varðveita full Selfoss routeId nákvæmlega. Ekki breyta geometryId/policyVersion/útgáfu ef reglur og raunkeðja óbreytt. Enginn cosmetic helper/file rename nauðsynlegur.
- Fyrri Rauðavatn↔Hella south lengd/slices/hnit/geometryId/policyVersion óbreytt; nýir options/selectedOption envelope-reitir eru vísvitandi viðbót. Uppfæra próf sem áður kröfðust engrar options á Hella-pari og færa scope-regression á óskylt par (Selfoss↔Hella, veg93 eða same_place), ekki eyða vörn án staðgengils. Selfoss south/north svör og ID haldast óbreytt.

## Raunferlar og focused próf

Fjögur Hella-tilvik south/north × átt. Réttir pinned endar, hnitakeðja samfelld og lengd endurreiknuð; north raunverulega norðurbogi, ekki south fram og til baka um E1. Prófa norður-línuauðkenni/landfræðilega keðju og 0 tvítalningu raunbrúna, ekki bann við endurteknu sourceId á aðskildum slices. Raunmæla lengdir úr óbreyttum production-einingum áður en pinnað er í prófi; ekki giska á frádrátt Hellu-Selfoss.

Sameiginlegar samþykktar MVP-forsendur halda: Akureyri ~36,25 m öfug hringbrún ef hún kemur fyrir og Hellu-pinned-endafrávik ~3,19 m ef það kemur fyrir, skrá nákvæmlega á hvaða tilviki. Ekki endilega gera ráð fyrir sama Hellu-lokabút í north og south; staðfesta raunleið. Ekki ný úrbótalota á þessum samþykktu mörkum. Önnur óvænt röng raunleið er ekki falin.

Connectorar estimated merktir og taldir þar sem notaðir, engin fölsuð IDFERILL. routeId stöðugt/einstakt per par/option/átt, sjalfgefið styttra, explicit val virkar. Fyrri Selfoss-pör bæði options, veg93, Selfoss↔Hella og same_place óbreytt. Núverandi eldri winter-route samningspróf, focused geometry/policy/API próf, lint snertum JS og git diff --check. Ekkert fullsuite/build/mutation/fuzz án ástæðu.

## Kort og afhending

Eitt task-local map-view.html með fjórum Hella-tilvikum, endum/via og estimated/þekktum frávikum. Endurnýta fyrri map/transform, engin dependency eða product-UI. Nýtt laust port á 127.0.0.1, aðeins task-mappa, fyrri kort ótrufluð; canonical OSM-slóð, Referer og attribution. Sjónræn staðfesting aðeins ef framkvæmd; annars opnanlegt kort fyrir eiganda. Fyrra Selfoss-hringasamþykki nær ekki sjálfkrafa yfir Hella-tilvikin.

Stutt cc-report.md með raunmældum lengdum/ID, afmörkun breytinga, prófum og kortahlekk. Heimilt: geometry API/paraval/route-labels og viðeigandi próf, task-local kort/skýrslur/CURRENT. Core, dataset, connectors og reglur óbreytt. Engin valfrjáls prófaherðing úr fyrri review. Ekkert UI, veður/færð/cache, gamla api/winter-route.js, pricing/scoring/packages eða önnur ticket. Engin gagnaöflun/skilaboð, commit/push/deploy/GitHub. Venjuleg tile-kortaskoðun heimil. drivingAccess UNVERIFIED, engin ETA/öryggisfullyrðing eða hjáleið við lokun.

Þegar fjögur raunferlatilvik/focused próf og kort eru tilbúin, stoppa. Engin sjálfvirk Vestfjarða-/alla56-lota; þau halda sér í remaining-mvp-plan.md. Blocker sýnir ranga/ónothæfa afhenta leið eða raunverulegt umfangsbrot; valfrjáls nákvæmni og opinber staðfesting vinnuforsendna ekki blocker.

## Jonesy review — umferð 1 (2026-11-19)

**Niðurstaða: APPROVED með bindandi P1–P6. Engir blockerar í promptinu.** Smæsta breytingin dugar: Hella-parið þarf aðeins að bætast í `RING_OPTIONS_PAIRS` og `routeId`-forskeytið að verða par-sértækt. Sandbox sýnir að báðir norðurleggir Hella eru heilir, án samskeyta umfram −2/−3, án nýrra gildra. Eina atriðið sem breytist í núverandi prófum er prófið sem bannar `selectedOption`/`options` á Hella-pari (fyrirséð í promptinu).

### Sandbox (mitt, Linux; óbreyttur kjarni/dataset/policy/north-option úr ring-options-lotunni; handler afrit með þessum tveimur breytingum; ekkert keyrt á Windows)

- **Leggir, directed (north-inntak):** R1→E1 615 370,845 m (119) · **E1→Hella 585 023,806 m (78)** · **Hella→E1 584 988,732 m (78)** · E1→R1 615 545,096 m (121, samskeyti −2/−3 einu sinni hvort). Allir fjórir án sameiginlegra brúna og án tvítalinna brúna.
- **Norður (raunhandler):** R1→Hella **1 200 394,651 m, 197 slices** (geometryId `a8704618cc1a…`); Hella→R1 **1 200 533,828 m, 199 slices** (`fc32a8502ed9…`, `estimatedConnectorLengthM` 13,369 = −2 + −3). Endar pinnaðir, hnitakeðjusumma = `lengthM`, 0 tvítalin brún, engin suður-sourceId (2138/2135/36807), línuheiti Borgarnes-Baulan, Holtavörðuheiði, Akureyri, Vaðlaheiðargöng, Mývatnssveit, Jökuldalur, Fagridalur, Fáskrúðsfjarðargöng, Höfn, Skeiðarársandur, Vík og Hella-Þjórsá; `via` = Borgarnes/Akureyri/Egilsstaðir/Vík. Krosstékk: Selfoss-north − Hella-north = 35 643,671 m ≈ Selfoss↔Hella 35 646,177 m (munur 2,5 m — Hellu-endastubbur), þ.e. norðurleið Hella er sami bogi og Selfoss-norður án síðasta bútsins.
- **Suður óbreytt gegnum nýja valkostaleið:** R1→Hella 80 681,312 m, 21 slices, geometryId `a71377300033…`; Hella→R1 80 747,987 m, 19 slices, `e77ac0a9b47b…`, −1 (44,215 m) aðeins á Hella→R1; `policyVersion` `raudavatn-selfoss-mvp-v1-a73f8191242a0938`. Öll Selfoss-svör (lengdir, ID, `routeId`) byte-eins og áður. Selfoss↔Hella óbreytt undirected (35 646,177 m, `1e5ec24e068b…`/`6c8979a3345e…`), `option` hunsað.
- **Frávik/athugasemdir við Hellu:** (a) Hellu-endastubbur á **suðurleið** R1→Hella: brún 3591 vertex 2→1 (**1,936 m**) á móti hringstefnu á 16641 + 1,253 m bútur að pinnuðum enda = **3,19 m**; **ekki** í norðurleið (E1→Hella kemur að frá hinni hliðinni; 0 öfugar brúnir) og ekki á Hella→R1. (b) Akureyri 36,25 m (32964 [3→0]) kemur fyrir **aðeins** á Hella→R1 north (E1→R1-leggurinn), ekki á R1→Hella north. (c) `z:null` við samskeyti: 2 á Hella→R1 north, 1 á Hella→R1 south (F1). (d) Endurtekin sourceId: 2791 og 2489 á R1→Hella north, 2532 á Hella→R1 north (hringlokun/staðbundin 32321-króka, 0 tvítalin brún); 2138 á suðurleið (eldra).
- **Núverandi próf með þessar tvær breytingar:** 36/37 standast; eina bilunin er „Hella pair … no option key“ — nákvæmlega prófið sem promptið segir að eigi að færa.

### Bindandi P-atriði

**P1 — Paraval nákvæmt.** `RING_OPTIONS_PAIRS` hefur nákvæmlega fjórar raðaðar samsetningar (Rauðavatn↔Selfoss, Rauðavatn↔Hella), ekki mengistékk. Selfoss↔Hella (báðar áttir), Egilsstaðir↔Seyðisfjörður og `same_place` hafa nákvæmlega fyrri svör og hunsa `option` — líka ógilt gildi (áfram 200, ekki 400). Prófa báðar áttir Selfoss↔Hella (35 646,177 m, `1e5ec24e068b…`/`6c8979a3345e…`) með `option=north` og `option=bogus`.

**P2 — Suðurleið Hellu óbreytt.** Lengdir, slices, hnit, geometryId, `policyVersion` og −1 eins og að ofan; enginn nýr connector, ekkert í kjarna/dataset/policy/north-option breytist. Eina leyfða breyting á suðursvari er viðbótin `selectedOption`/`options` og `routeId` í `options`. Sjálfgefið er south (styttra, raunmælt) í báðar áttir; `option=south|north` virkar; ógilt/tómt/hástafir/fylki/endurtekið `option` á Hella-pari → 400 `{error:"invalid_option", field:"option"}`, aldrei endurspeglað. **Þetta er vísvitandi samningsbreyting** (Hella hunsaði áður `option`): skrá hana í skýrslu og prófi, ekki sem óvart.

**P3 — Norður er raunverulegur bogi, ekki suður fram og til baka.** Tvö tilvik raunmælt úr óbreyttum einingum áður en pinnað er: R1→Hella 1 200 394,651 m/197, Hella→R1 1 200 533,828 m/199 (±0,01 m); leggir E1→Hella 585 023,806/78 og Hella→E1 584 988,732/78. Prófa norðurlínuheiti (Borgarnes-Baulan, Holtavörðuheiði, Akureyri, Vaðlaheiðargöng, Mývatnssveit, Fagridalur, Skeiðarársandur, Vík), engin 2138/2135/36807, endar pinnaðir, hnitakeðja = `lengthM`, **0 tvítalin brún á brúnastigi** (ekki bann við endurtekinni sourceId; 2791/2489/2532 eru lögmæt, sjá ofan). Samskeyti: R1→Hella north 0 estimated; Hella→R1 north nákvæmlega −2 og −3 einu sinni hvort (13,369 m), ekkert −1. Ef raunleiðin víkur frá þessum viðmiðum eða krefst fleiri samskeyta/kjarnabreytingar → STOP með nákvæmri bilun.

**P4 — `routeId` par-sértækt, Selfoss óbreytt.** Forskeyti úr parinu (`raudavatn-selfoss-` / `raudavatn-hella-`); geometryId/policyVersion óbreytt. Prófa **nákvæm** `routeId`-gildi fyrir allar átta samsetningar (2 pör × 2 valkostir × 2 áttir) með fullum geometryId, stöðug við endurtekin köll, ólík milli para/valkosta/átta, og að Selfoss-gildin séu orðrétt þau sem nú eru (`…south-215a1805457eb42a`, `…south-d657c07e56020a36`, `…north-d0e0996e7500b868`, `…north-323c5b6f4a97b6a7`). Þetta nær líka yfir tvær lifandi festingareyður úr fyrri mutation (routeId-forskeyti, `via` á south = `[]`): festa `via` south `[]` og north `[Borgarnes, Akureyri, Egilsstaðir, Vík]` á báðum pörum. Annað „valfrjálst hardening“ úr fyrri lotu er áfram utan umfangs.

**P5 — Frávik skráð nákvæmlega, ekki löguð og ekki veikt í prófum.** Festa: Hella-endastubbur 3,19 m (1,936 m öfug brún) aðeins á south R1→Hella og **0** í norðurtilvikum; Akureyri 32964 (36,25 m) aðeins á Hella→R1 north og 0 á R1→Hella north; `z:null` samkvæmt F1. Ef annað kemur í ljós (ný öfug brún eða önnur lengd) → skrá nákvæmlega og stoppa, ekki fela og ekki laga með kjarnaverki. Prófið sem verður að færa („Hella án options“) fær staðgengil á óskyldu pari (Selfoss↔Hella eða Egilsstaðir↔Seyðisfjörður); engin vörn eytt án staðgengils.

**P6 — Kort og sjónræn heiðarleiki.** Eitt `map-view.html` með fjórum Hella-lögum (south/north × átt), E1-hnút, Hellu-enda, −2/−3 og Akureyri-bút; hnit úr API-svari/pyproj, ekki handslegin. Nýtt laust port á 127.0.0.1 **annað en 8765–8768** (þ.e. t.d. 8769), aðeins task-mappa, canonical OSM-slóð, referrer, attribution; fyrri kort ósnert. Ég sé ekki kort: ekkert sjónrænt PASS frá CC né mér. Skoðunaratriði eiganda: (1) norðurbogi að Hellu er sami bogi og Selfoss-norður án síðasta ~35,6 km, (2) Hellu-endi við hringtorg 16641 (komið að frá austri í norðri, frá vestri í suðri), (3) Hádegismóa-samskeyti á Hella→R1 north, (4) Akureyri 33604 á Hella→R1 north. Eldra Selfoss-samþykki nær ekki yfir Hellu-tilvikin.

### Athugasemdir (ekki blockerar)

- Lengdir eru tier-2 planar (EPSG:3057), ekki aksturslengd; `lengthNote`, `drivingAccess: UNVERIFIED`, engin ETA/öryggisfullyrðing óbreytt. 1 200 km er ekki sambærilegt við raunakstur.
- Heitið „Short route via Hellisheiði“ á south-valkosti Hellu er rétt (leiðin fer um Hellisheiði og Selfoss); `via` er `[]` því Selfoss er ekki í via-listanum — ekki bæta við.
- Stoppa þegar fjögur tilvik, focused próf og kortið eru tilbúin; Vestfirðir/alla 56 ekki í þessari lotu.

**Næsta skref:** Ripley skrifar approved-prompt-v1.md með P1–P6 → eigandi: „Prompt approved“ til CC.
