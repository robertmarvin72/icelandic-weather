# #500 — Samþykkt framkvæmdarprompt v1: yfirferð 47 staða

## Ripley — 2026-11-14; Jonesy APPROVED án skilyrða

Jonesy samþykkti umferð 1 án skilyrða. Keyranlegt aðeins þegar CURRENT vísar hingað í READY_FOR_CC og eigandi sendir nýtt „Prompt approved“. Eigandi bað um eitt sameinað prompt eftir að suðurlotan fékk PASS sem kandídatgögn. Ekki endurtaka fimm staða vinnu í hverri nýrri review-lykkju. Allir **56** eigandastaðir halda sér; þessi lota afgreiðir sameiginlega stöðu þeirra **47 sem eru enn PENDING**, en varðveitir fjóra valda punkta og fimm suðurkandídata án endurmats.

## Tilgangur

Færa 47 staði úr almennu „ekki yfirfarið“ í eina rekjanlega niðurstöðu fyrir hvern: retained aðkomutillaga/tenging sem má endurnýta, eða **nákvæmt gagnagat**. Uppfæra núverandi vöruskrá með tilvísun í þessar niðurstöður og sameina götin eftir sameiginlegum gagnagjafa/veggangi. Ekki bara afrita gamla 72-raða listann, merkja alla „EXACT_GAP“ eða búa til nýja umfangsmikla landsrannsókn. Engin krafa um að finna gögn sem ekki eru til í heimiluðum retained grunni.

## Lesa fyrst og endurnýta

- AGENTS.md, CLAUDE.md, docs/ai/README.md og CURRENT.md.
- server_data/winter-route-places.json og prófið api/_lib/winterRoute/places.test.js; bindandi heiti/röð/svæði í ticket-500/nationwide-owner-scope.md. R1/E1/S2/C og fimm suðurkandídatar eru þegar afgreiddir í fyrri gagnalotum, ekki leiðarvalhæfir af því einu.
- ticket-500/nationwide-status.md (NB2 leiðrétt Reykjahlíð), lokamöt nationwide/result-review.md og south/result-review.md. Fyrirliggjandi R1-keðja/suðurkaflaskrá eru tilvísanir, ekki endursmíðaverkefni.
- docs/ai/tasks/ticket-493-access-points/place-access-status-v3.csv, endpoint-candidates-v3.json og samples/v3/gap_list_v3.json / samples/v3/stem_search_hints_v3.json; ticket-493-place-network/place-inventory.csv og samples/road-links.csv/chain-walks-v4.json. Gamlar 72-raða stöður eru vísbendingar, ekki samþykktur nýr staðalisti eða sönnun þess að gögn vanti í öllum heimildum.
- Retained færðarauðkenni/nöfn: ticket-429/samples/vegagerdin-faerd2017-1.json og ticket-483/samples/legacy-faerd-fresh.json. Þau hafa ekki geometry; nafn getur átt fleiri en eitt IDBUTUR. Þar sem við á segja „færðarauðkenni retained, geometry/aðkoma vantar“, ekki „ekkert retained“.
- Fylgja tilvísunum þessara skjala í retained frumgögn, aðeins fyrir raunverulegar niðurstöður staðanna 47 (t.d. ticket-483 raw, #491 Borgarnes, #493 veg93/norðurgögn). Nota lokamöt umfram eldri ofsterkar skýrslufullyrðingar. Ekki lesa allar eldri prompt-/review-lotur eða endurkeyra rannsóknarsöfn.

## Framkvæmd

1. Lesa PENDING-færslurnar úr vöruskránni áður en breytingar hefjast; staðfesta nákvæmlega 47 og engin skörun við þá níu sem þegar hafa niðurstöðu. Varðveita eintak í minni fyrir samanburð. Gamli 72-listinn stýrir ekki því hver fær afgreiðslu.
2. Fyrir hvern af þessum 47 finna samsvarandi retained færslu eða sýna að hún vanti í tilgreindu safni. Skoða sérstaklega ólík heiti/samheiti og sameinaðar sveitarfélagafærslur: Keflavík og KEF eru aðskilin; Reykjahlíð (Mývatn) tengist retained Reykjahlíð; nýr eigandastaður þarf ekki að hafa verið í gamla listanum. Ekki velja miðju sveitarfélags sem aðkomu. Heitasamsvörun ein er ekki vegtenging.
3. Þar sem nothæf retained gögn finnast, skrá raunverulegan aðkomu-candidate eða vísa í fyrirliggjandi candidate með source-slóð/SHA og nákvæmum reit/stykki/tier/START–END eftir því sem heimild hefur. Ef WGS84 er þegar til, endurnýta það; annars skrá native CRS og sérstakt WGS84-gat, ekki skrifa native sem lat/lon. Aðgreina stored START/END frá traversal entry/exit. Ekki nýtt reprojection-kerfi, nearest-neighbour leiðarleit eða loftlínubrýr. Stem-hints eru aðeins INFERRED text mentions, ekki staðfestir kandídatar. Borgarnes 2819 er á ccw_short; stored START/END skal aðeins skrá ef tilgreind retained heimild styður það, annars merkja gat.
4. Skrá tengingu við sameiginlegan veggang/graf aðeins þar sem hún er rekjanleg í retained gögnum. Endurnýta fyrirliggjandi vegkafla með tilvísun, ekki afrita geometry 47 sinnum. Greina aðkomupunkt, geometry-samfellu, eigandaval og akstursstefnu/aðgengi í sundur; merkja ályktanir sem slíkar. Ekki gera núverandi runtime-leið sjálfkrafa að staðfestum bæjarenda (sbr. Vík KE1). Ekki nýja sérleiðaskrá fyrir hvert staðapar.
5. Þar sem gögn duga ekki, tilgreina **hvaða staðreynd vantar, hvaða retained heimildir voru athugaðar og áhrif á notkun**. Dæmi: enginn sjálfstæður KEF-aðkomupunktur í tilgreindum safni; vantar geometry á tengivegi að stað; tvær retained aðkomur krefjast eigandavals; vantar WGS84 fyrir tiltekinn native-punkt; akstursstefna tiltekinnar tengingar óstaðfest. „Ekki í VEGNR=1“ þýðir ekki „enginn vegur“; F-vegur/ferja verður ekki sjálfgefin tenging. Göt um aðgengi geta verið sameiginleg, en mega ekki fela aðkomu-/geometry-göt hvers staðar.
6. Sameina niðurstöður í einn stuttan gatalista eftir gagnagjafa/veggangi, með tilvísuðum staða-ID. Tilgreina einföldustu nauðsynlegu næstu aðgerð fyrir hvern hóp og hvort hún sé gagnaöflun eða eigandaval. **Ekki** nýtt prompt, ítarleg fetch-áætlun eða review-skjal fyrir hvern hóp. Vegnúmer/vegheiti án retained heimildar eru merkt óstaðfest eða hópurinn heitir ónefndur tengivegur; almenn þekking verður ekki heimild við hópun. Engin ný öflun í þessari lotu. Að segja að retained gögn skorti heimild sannar ekki að ný opinber leit gæti ekki leyst gatið.

## Afhending og leyfðar breytingar

- Ný `server_data/winter-route-remaining-coverage.json`: schema_version og nákvæmlega 47 niðurstöður með staða-ID, aðgreindri stöðu candidate/geometry/access/owner-selection og rekjanlegum heimildum/götum. Nota einfalt gagnasnið; ekki almennt audit-/schema-framework. Náttúrulega sameiginlegir source/SHA geta verið einu sinni í source-töflu með tilvísunum.
- Í `server_data/winter-route-places.json`: aðeins connectionStatus/provenance og coverageReference/candidateReference þeirra 47 eftir því sem þarf. Ekki breyta name/id/region/order/aliases neins af 56. Coordinates/approach halda null fyrir þessa 47 meðan engin eigandasamþykkt liggur fyrir; ný kandídathnit eru í coverage-gögnum. Ekki merkja stað supported/routable af því yfirferð lauk. Hin níu staðagögn eru óbreytt.
- Ein stutt samantekt/ákvörðunartafla í `docs/ai/tasks/ticket-500/remaining/evidence.md`: heildartalning og hópaður gatalisti; ekki önnur löng endursögn 47 færslna ef JSON hefur þær. Vísanir á fyrirliggjandi fimm suðurkandídata/eigandaákvarðanir, ekki ný enduruppbygging þeirra.
- `remaining/cc-report.md` með afhentri stöðu, prófum og lokunarmati #500: hvað er gagnaundirbúið, hvaða samþykktarskilyrði standa enn óuppfyllt, og hvers þarf til að fara í #501. Ekki fullyrða að skjalfest gagnagöt jafngildi fullri landsþekju eða að eigandi hafi samþykkt útilokanir. Ekki loka eða breyta GitHub-miða.
- Ný `api/_lib/winterRoute/remainingCoverage.test.js` og nauðsynleg afmörkuð aðlögun places.test.js fyrir yfirfarnar stöður í stað gamla 47-PENDING fastans. Ekki herða ótengd alias-/suðurpróf eða breyta eldri samþykktum skrám.

## Prófun og viðtaka

Ein markviss keyrsla places/remainingCoverage/southConnections gagnaprófa; lint á snertum JS-prófskrám. Staðfesta nákvæma mengi 47 úr fyrir-breytingu PENDING-listanum og 56-listann óbreyttan, hin níu gögn óbreytt. Tilvísanir leysast í raunveruleg source-gögn/SHA; hver emitted candidate/stykki/hnit stemmir við tilgreinda frumfærslu, ekki aðeins eigin umritun. Enginn óstaðfestur kandídat fer í samþykktan staðarpunkt eða fær supported-stöðu. Ein raunveruleg neikvæð athugun fyrir missing coverage-færslu, ranga source/stykki-tilvísun og óheimila promotion nægir. Engin hundruð mutation-prófa, almenn test-umgjörð eða frontend/build/vafrapróf fyrir óinnbundin gagnagögn.

Viðtaka: allir 47 hafa efnislega retained niðurstöðu eða nákvæmt skráð gat og vöruskráin vísar á hana; nýjar nýtanlegar heimildir hafa verið nýttar í stað þess að skilja færslurnar almennt óyfirfarnar. Ekki gera öflun sem þessi lota heimilar ekki að blocker á gagnayfirferðinni. PASS er niðurstaða þessa afmarkaða verks, ekki sjálfvirk lokun #500 eða yfirlýsing um nothæfa akstursleið. Ekki stoppa við fyrsta gagnagat; klára óháðar 47 niðurstöður í sama handoffi.

## Mörk og lifecycle

Engin netköll/ný landfræðileg öflun, ný þjónusta/dependency, delegation, UI/API-/#501-leiðarvél, veður-/ETA-/scoring-/entitlement-/greiðslubreyting, commit/push/GitHub-birting/lokun/deploy. Aðeins framangreindar skrár, ný skjöl undir ticket-500/remaining/ og CURRENT.md. Engar breytingar á eldri raw/ledger, samþykktum promptum/yfirferðum eða south-connections.json.

Keyranlegt aðeins sem samþykkt approved-prompt sem CURRENT vísar á í READY_FOR_CC eftir eiganda „Prompt approved“. CC setur CC_IN_PROGRESS, framkvæmir, skilar skýrslu og setur CC_COMPLETE. Jonesy yfirfer sameinaða afhendingu einu sinni; sýndur nauðsynlegur blocker þarf nákvæma villu/áhrif/minnstu leiðréttingu. Valfrjáls herðing er ekki ný vinnulota. Fyrir þriðju review-umferð þarf eigandaákvörðun samkvæmt README.
