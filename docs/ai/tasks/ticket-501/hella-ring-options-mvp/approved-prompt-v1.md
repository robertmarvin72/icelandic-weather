# #501 — Hella hringvalkostir MVP — approved prompt v1 — 2026-11-19

Jonesy APPROVED með bindandi P1–P6, engir blockerar. Óbreytt afrit P1–P6 hér neðar gengur framar Round 1 þar sem nákvæmari. Sögulegur pending-review texti er afgreiddur með þessum haus. Framkvæmd eftir eiganda „Prompt approved“, CURRENT READY_FOR_CC og pointer hingað; CC_IN_PROGRESS áður og CC_COMPLETE með skýrslu eftir.

## Framkvæmdarafmörkun

Tvær litlar production-breytingar: nákvæm Hella-raðpör í RING_OPTIONS_PAIRS og par-sértækt routeId-forskeyti. Núverandi kjarni, dataset, policy, north-input og connectors óbreytt. Fáar nauðsynlegar focused prófabreytingar og eitt kort; enginn nýr wrapper/provider/framework eða rannsókn.

P4 routeId-regla: núverandi runtime notar FULLT geometryId í routeId; stytt gildi með „…“ í yfirferð eru viðmiðsforskeyti, ekki heimild til að stytta auðkennið. Pinna raunveruleg full átta routeId eftir eigin baseline-keyrslu, varðveita núverandi full Selfoss-gildi orðrétt. Via south [] og north listinn fest eins og P4 segir. Ekki bæta við óskyldri mutation/hardening-vinnu.

P3 lengdir/keðjur eru sandbox-viðmið Jonesy, CC keyrir rauneiningarnar sjálft. Hella-north er langi landboginn að Hellu, ekki suðurleið um Selfoss til baka. Selfoss↔Hella og same_place fá ekki option-samning. Hella áður hunsað option en eftir breytingu staðfestir það gildin; vísvitandi samningsbreyting sem skal skrá.

P5 Hellu-endafrávik og Akureyri-frávik eru nákvæmlega skilgreindar samþykktar MVP-takmarkanir, ekki fullyrðing um rétta/löglega stefnu. Sýna þær á réttum tilvikum, ekki breyta endum/gögnum eða fela nýtt frávik. „0 í norðurtilvikum“ fyrir Hellu-stubbinn á ekki við Akureyri sem er sérstök skráð undantekning á vestur-north. Sjónrænt PASS aðeins ef raunveruleg skoðun framkvæmd; annars opnanlegt kort til eiganda. Fyrri samþykki ná ekki sjálfkrafa þessari nýju Hella-sýn.

## Samþykkt Round 1

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

## Bindandi Jonesy P1–P6 (óbreytt afrit)

**P1 — Paraval nákvæmt.** `RING_OPTIONS_PAIRS` hefur nákvæmlega fjórar raðaðar samsetningar (Rauðavatn↔Selfoss, Rauðavatn↔Hella), ekki mengistékk. Selfoss↔Hella (báðar áttir), Egilsstaðir↔Seyðisfjörður og `same_place` hafa nákvæmlega fyrri svör og hunsa `option` — líka ógilt gildi (áfram 200, ekki 400). Prófa báðar áttir Selfoss↔Hella (35 646,177 m, `1e5ec24e068b…`/`6c8979a3345e…`) með `option=north` og `option=bogus`.

**P2 — Suðurleið Hellu óbreytt.** Lengdir, slices, hnit, geometryId, `policyVersion` og −1 eins og að ofan; enginn nýr connector, ekkert í kjarna/dataset/policy/north-option breytist. Eina leyfða breyting á suðursvari er viðbótin `selectedOption`/`options` og `routeId` í `options`. Sjálfgefið er south (styttra, raunmælt) í báðar áttir; `option=south|north` virkar; ógilt/tómt/hástafir/fylki/endurtekið `option` á Hella-pari → 400 `{error:"invalid_option", field:"option"}`, aldrei endurspeglað. **Þetta er vísvitandi samningsbreyting** (Hella hunsaði áður `option`): skrá hana í skýrslu og prófi, ekki sem óvart.

**P3 — Norður er raunverulegur bogi, ekki suður fram og til baka.** Tvö tilvik raunmælt úr óbreyttum einingum áður en pinnað er: R1→Hella 1 200 394,651 m/197, Hella→R1 1 200 533,828 m/199 (±0,01 m); leggir E1→Hella 585 023,806/78 og Hella→E1 584 988,732/78. Prófa norðurlínuheiti (Borgarnes-Baulan, Holtavörðuheiði, Akureyri, Vaðlaheiðargöng, Mývatnssveit, Fagridalur, Skeiðarársandur, Vík), engin 2138/2135/36807, endar pinnaðir, hnitakeðja = `lengthM`, **0 tvítalin brún á brúnastigi** (ekki bann við endurtekinni sourceId; 2791/2489/2532 eru lögmæt, sjá ofan). Samskeyti: R1→Hella north 0 estimated; Hella→R1 north nákvæmlega −2 og −3 einu sinni hvort (13,369 m), ekkert −1. Ef raunleiðin víkur frá þessum viðmiðum eða krefst fleiri samskeyta/kjarnabreytingar → STOP með nákvæmri bilun.

**P4 — `routeId` par-sértækt, Selfoss óbreytt.** Forskeyti úr parinu (`raudavatn-selfoss-` / `raudavatn-hella-`); geometryId/policyVersion óbreytt. Prófa **nákvæm** `routeId`-gildi fyrir allar átta samsetningar (2 pör × 2 valkostir × 2 áttir) með fullum geometryId, stöðug við endurtekin köll, ólík milli para/valkosta/átta, og að Selfoss-gildin séu orðrétt þau sem nú eru (`…south-215a1805457eb42a`, `…south-d657c07e56020a36`, `…north-d0e0996e7500b868`, `…north-323c5b6f4a97b6a7`). Þetta nær líka yfir tvær lifandi festingareyður úr fyrri mutation (routeId-forskeyti, `via` á south = `[]`): festa `via` south `[]` og north `[Borgarnes, Akureyri, Egilsstaðir, Vík]` á báðum pörum. Annað „valfrjálst hardening“ úr fyrri lotu er áfram utan umfangs.

**P5 — Frávik skráð nákvæmlega, ekki löguð og ekki veikt í prófum.** Festa: Hella-endastubbur 3,19 m (1,936 m öfug brún) aðeins á south R1→Hella og **0** í norðurtilvikum; Akureyri 32964 (36,25 m) aðeins á Hella→R1 north og 0 á R1→Hella north; `z:null` samkvæmt F1. Ef annað kemur í ljós (ný öfug brún eða önnur lengd) → skrá nákvæmlega og stoppa, ekki fela og ekki laga með kjarnaverki. Prófið sem verður að færa („Hella án options“) fær staðgengil á óskyldu pari (Selfoss↔Hella eða Egilsstaðir↔Seyðisfjörður); engin vörn eytt án staðgengils.

**P6 — Kort og sjónræn heiðarleiki.** Eitt `map-view.html` með fjórum Hella-lögum (south/north × átt), E1-hnút, Hellu-enda, −2/−3 og Akureyri-bút; hnit úr API-svari/pyproj, ekki handslegin. Nýtt laust port á 127.0.0.1 **annað en 8765–8768** (þ.e. t.d. 8769), aðeins task-mappa, canonical OSM-slóð, referrer, attribution; fyrri kort ósnert. Ég sé ekki kort: ekkert sjónrænt PASS frá CC né mér. Skoðunaratriði eiganda: (1) norðurbogi að Hellu er sami bogi og Selfoss-norður án síðasta ~35,6 km, (2) Hellu-endi við hringtorg 16641 (komið að frá austri í norðri, frá vestri í suðri), (3) Hádegismóa-samskeyti á Hella→R1 north, (4) Akureyri 33604 á Hella→R1 north. Eldra Selfoss-samþykki nær ekki yfir Hellu-tilvikin.
