# #500 — Sameinuð retained-yfirferð 47 staða og einn gagnagatalisti

## Ripley initial prompt — umferð 1, 2026-11-14

Til Jonesy-yfirferðar, ekki framkvæmdarheimild. Eigandi bað um eitt sameinað prompt eftir að suðurlotan fékk PASS sem kandídatgögn. Ekki endurtaka fimm staða vinnu í hverri nýrri review-lykkju. Allir **56** eigandastaðir halda sér; þessi lota afgreiðir sameiginlega stöðu þeirra **47 sem eru enn PENDING**, en varðveitir fjóra valda punkta og fimm suðurkandídata án endurmats.

## Tilgangur

Færa 47 staði úr almennu „ekki yfirfarið“ í eina rekjanlega niðurstöðu fyrir hvern: retained aðkomutillaga/tenging sem má endurnýta, eða **nákvæmt gagnagat**. Uppfæra núverandi vöruskrá með tilvísun í þessar niðurstöður og sameina götin eftir sameiginlegum gagnagjafa/veggangi. Ekki bara afrita gamla 72-raða listann, merkja alla „EXACT_GAP“ eða búa til nýja umfangsmikla landsrannsókn. Engin krafa um að finna gögn sem ekki eru til í heimiluðum retained grunni.

## Lesa fyrst og endurnýta

- AGENTS.md, CLAUDE.md, docs/ai/README.md og CURRENT.md.
- server_data/winter-route-places.json og prófið api/_lib/winterRoute/places.test.js; bindandi heiti/röð/svæði í ticket-500/nationwide-owner-scope.md. R1/E1/S2/C og fimm suðurkandídatar eru þegar afgreiddir í fyrri gagnalotum, ekki leiðarvalhæfir af því einu.
- ticket-500/nationwide-status.md (NB2 leiðrétt Reykjahlíð), lokamöt nationwide/result-review.md og south/result-review.md. Fyrirliggjandi R1-keðja/suðurkaflaskrá eru tilvísanir, ekki endursmíðaverkefni.
- docs/ai/tasks/ticket-493-access-points/place-access-status-v3.csv, endpoint-candidates-v3.json og samples/gap_list.json; ticket-493-place-network/place-inventory.csv og samples/road-links.csv/chain-walks-v4.json. Gamlar 72-raða stöður eru vísbendingar, ekki samþykktur nýr staðalisti eða sönnun þess að gögn vanti í öllum heimildum.
- Fylgja tilvísunum þessara skjala í retained frumgögn, aðeins fyrir raunverulegar niðurstöður staðanna 47 (t.d. ticket-483 raw, #491 Borgarnes, #493 veg93/norðurgögn). Nota lokamöt umfram eldri ofsterkar skýrslufullyrðingar. Ekki lesa allar eldri prompt-/review-lotur eða endurkeyra rannsóknarsöfn.

## Framkvæmd

1. Lesa PENDING-færslurnar úr vöruskránni áður en breytingar hefjast; staðfesta nákvæmlega 47 og engin skörun við þá níu sem þegar hafa niðurstöðu. Varðveita eintak í minni fyrir samanburð. Gamli 72-listinn stýrir ekki því hver fær afgreiðslu.
2. Fyrir hvern af þessum 47 finna samsvarandi retained færslu eða sýna að hún vanti í tilgreindu safni. Skoða sérstaklega ólík heiti/samheiti og sameinaðar sveitarfélagafærslur: Keflavík og KEF eru aðskilin; Reykjahlíð (Mývatn) tengist retained Reykjahlíð; nýr eigandastaður þarf ekki að hafa verið í gamla listanum. Ekki velja miðju sveitarfélags sem aðkomu. Heitasamsvörun ein er ekki vegtenging.
3. Þar sem nothæf retained gögn finnast, skrá raunverulegan aðkomu-candidate eða vísa í fyrirliggjandi candidate með source-slóð/SHA og nákvæmum reit/stykki/tier/START–END eftir því sem heimild hefur. Ef WGS84 er þegar til, endurnýta það; annars skrá native CRS og sérstakt WGS84-gat, ekki skrifa native sem lat/lon. Aðgreina stored START/END frá traversal entry/exit. Ekki nýtt reprojection-kerfi, nearest-neighbour leiðarleit eða loftlínubrýr.
4. Skrá tengingu við sameiginlegan veggang/graf aðeins þar sem hún er rekjanleg í retained gögnum. Endurnýta fyrirliggjandi vegkafla með tilvísun, ekki afrita geometry 47 sinnum. Greina aðkomupunkt, geometry-samfellu, eigandaval og akstursstefnu/aðgengi í sundur; merkja ályktanir sem slíkar. Ekki gera núverandi runtime-leið sjálfkrafa að staðfestum bæjarenda (sbr. Vík KE1). Ekki nýja sérleiðaskrá fyrir hvert staðapar.
5. Þar sem gögn duga ekki, tilgreina **hvaða staðreynd vantar, hvaða retained heimildir voru athugaðar og áhrif á notkun**. Dæmi: enginn sjálfstæður KEF-aðkomupunktur í tilgreindum safni; vantar geometry á tengivegi að stað; tvær retained aðkomur krefjast eigandavals; vantar WGS84 fyrir tiltekinn native-punkt; akstursstefna tiltekinnar tengingar óstaðfest. „Ekki í VEGNR=1“ þýðir ekki „enginn vegur“; F-vegur/ferja verður ekki sjálfgefin tenging. Göt um aðgengi geta verið sameiginleg, en mega ekki fela aðkomu-/geometry-göt hvers staðar.
6. Sameina niðurstöður í einn stuttan gatalista eftir gagnagjafa/veggangi, með tilvísuðum staða-ID. Tilgreina einföldustu nauðsynlegu næstu aðgerð fyrir hvern hóp og hvort hún sé gagnaöflun eða eigandaval. **Ekki** nýtt prompt, ítarleg fetch-áætlun eða review-skjal fyrir hvern hóp. Engin ný öflun í þessari lotu. Að segja að retained gögn skorti heimild sannar ekki að ný opinber leit gæti ekki leyst gatið.

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


## Jonesy review — umferð 1 (2026-11-14)

**Niðurstaða: APPROVED — engin skilyrði, engir sýndir blockerar.** NE1–NE4 eru leiðbeiningar/valfrjálsar og mega hvorki tefja „Prompt approved“ né skapa nýja vinnu. Stage helst PROMPT_REVIEW þar til Ripley skrifar `remaining/approved-prompt-v1.md`.

### Sandbox-staðfest (mitt; aðeins lestur á retained skrám; engin net-/GitHub-köll)

- **47 PENDING staðfest.** Núverandi `winter-route-places.json` (með KE1-lagfæringu Ripley): 47 × `PENDING`, 5 × `APPROACH_CANDIDATE_PROPOSED_ACCESS_UNCONFIRMED`, 4 × `ACCESS_POINT_SELECTED_ACCESS_UNCONFIRMED`; 56 − 9 = 47, engin skörun. Níu afgreiddu eru Reykjavík, Akureyri, Egilsstaðir, Seyðisfjörður, Vík, Hvolsvöllur, Hella, Selfoss og Hveragerði — eins og promptið segir.
- **Retained grunnur 47 staða (v3-tafla `place-access-status-v3.csv`):** 4 hafa `NAME_MATCH_INFERRED` + `RETAINED_GEOMETRY` (Borgarnes 2819, Reykjahlíð 3566, Reyðarfjörður 2520, Fáskrúðsfjörður 2536); 7 hafa aðeins stem-hints, „INFERRED text mention only, no status effect“ (Hvammstangi, Blönduós, Skagaströnd, Varmahlíð, Djúpivogur, Kirkjubæjarklaustur, Þorlákshöfn); 31 eru `NODE_UNDETERMINED`/`NO_COORDINATE_SOURCE`; 5 eru ekki í v3 (Keflavík, KEF, Reykhólar, Drangsnes, Skaftafell). Raunhæf niðurstaða lotunnar er því **fáeinir ályktaðir kandídatar og mörg nákvæm gagnagöt** — promptið gerir ráð fyrir því („ekki krafa um að finna gögn sem ekki eru til“, „ekki stoppa við fyrsta gat“).
- **WGS84 retained:** aðeins Borgarnes (2819, öll fjögur tier) er í `wfs-north-4326.json` og `wfs-vesturland-4326.json`. Fyrir 3566, 2520 og 2536 finnst ekkert retained 4326 (skannað öll `*4326*`/crs-4326 JSON undir `tasks/`); reglan „skrá native CRS og sérstakt WGS84-gat, ekki reprojection-kerfi“ á því við um þrjá staði. Allar tilvísaðar skrár (`endpoint-candidates-v3.json`, `samples/gap_list.json`, `place-inventory.csv` (27 raðir), `road-links.csv`, `chain-walks-v4.json`) eru til.
- **Afmörkun og lifecycle samræmast README og fyrri lotum**: ein sameinuð lota, engin ný öflun, `winter-route-remaining-coverage.json` með 47 niðurstöðum, aðeins connectionStatus/provenance/reference á þessum 47 í vöruskrá (name/id/region/röð/aliases og coordinates/approach óbreytt), fimm-suður og fjögur-valin óbreytt, `south-connections.json` bannað að snerta, ný `remainingCoverage.test.js` + afmörkuð aðlögun `places.test.js` (47-PENDING-fastinn), eitt lokað handoff, engin GitHub-/commit-/UI-/#501-aðgerð, PASS ekki sjálfvirk lokun #500. Prófkröfurnar ná nú því sem ég fann vanta í síðustu lotu (KE2): „hver emitted candidate/stykki/hnit stemmir við tilgreinda frumfærslu, ekki aðeins eigin umritun“ og ein raunveruleg neikvæð athugun fyrir missing coverage, ranga source/stykki-tilvísun og óheimila promotion.

### Athugasemdir (ekki blockerar)

- **NE1 — retained færðarlistar eru heimild um færðarauðkenni, ekki geometry; orða götin samkvæmt því.** `ticket-429/samples/vegagerdin-faerd2017-1.json` og `ticket-483/samples/legacy-faerd-fresh.json` (708 IDBUTUR, nöfn, engin geometry) innihalda t.d. Þorlákshafnarvegur 902410037/902330037, Strandavegur og Drangsnesvegur 907100037 og Drangsnes–Kaldrananes 907110037, Reykhólasveitarvegur (**tvö ólík IDBUTUR 905120037 og 506070037 með sama nafn**), Siglufjörður 909310037, Patreksfjörður 562070037, Djúpvegur: Flugvöllur–Ísafjörður 906120037. Þetta er ekki aðkomupunktur né geometry (promptið bannar réttilega IDBUTUR eitt sér sem geometry-heimild), en gagnagat fyrir slíka staði á að segja „færðarauðkenni retained, geometry/aðkoma vantar“ en ekki „ekkert retained“; og nafn ≠ einkvæmt ID. Þessar skrár eru ekki nefndar í „Lesa fyrst“ — ein lína dugar.
- **NE2 — nota v3-skrárnar.** `ticket-493-access-points/samples/gap_list.json` er elsta útgáfa; núgildandi eru `samples/v3/gap_list_v3.json` og `samples/v3/stem_search_hints_v3.json` (v3-taflan vísar á hina síðarnefndu). „Nota lokamöt umfram eldri ofsterkar skýrslufullyrðingar“ á við hér.
- **NE3 — stem-hints og Borgarnes.** Hintin sjö eru í v3 sögð „INFERRED text mention only, no status effect“: þau mega ekki verða kandídatar án greinilegrar merkingar sem ályktun (eins og Hveragerði í síðustu lotu). Borgarnes 2819 er á `ccw_short`, ekki `cw_long`; v3 skildi `node_role/stored_field` eftir tóm (D1) — CC ætti að skrá stored START/END aðeins ef retained heimild segir til um það, annars sem gat, ekki giska á hlutverk.
- **NE4 — hópun og vegnúmer.** Retained gögn nefna ekki vegnúmer tengivega fyrir flesta staðina. Ef gatalisti er hópaður „eftir veggangi“ ætti hvert vegnúmer/vegheiti sem kemur ekki úr retained skrá að vera merkt óstaðfest (almenn þekking CC), annars hópur „ónefndur tengivegur“. Þetta kemur í veg fyrir að ályktað vegnúmer verði „staðreynd“ í næsta öflunarprompti.

### Takmörk

Aðeins lestur á retained skrám og sandbox-skönnun (JSON, CSV); ekki keyrð próf/lint/git/build á vél eiganda, ekki GitHub, engin netöflun. Ég tek enga afstöðu til þess hvaða staðir eigi að fá kandídata eða hvort retained hints séu rétt túlkuð.

### Næsta skref

Ripley skrifar approved-prompt (NE-athugasemdir mega fylgja sem ein til tvær línur eða sleppast), setur READY_FOR_CC; eigandi „Prompt approved“ til CC. Fyrsta Jonesy-umferð þessa prompts; engin önnur nauðsynleg. Þriðja umferð krefst eigandaákvörðunar skv. README.
