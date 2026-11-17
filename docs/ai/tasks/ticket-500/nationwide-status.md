# Winter Route — fyrsta stöðugreining landsþekju

2026-11-14, Ripley. Aðeins lestur kóða, GitHub-miða #492/#493/#501–#504 og fyrirliggjandi gagna; engin appbreyting, ný veita eða landfræðileg öflun. #500 hafði einnig verið lesinn í fyrri stöðugreiningu. Mynd eiganda var sjónrænt viðmið, ekki gagnalind. Eigandi hefur samþykkt alla **56** nafngreindu staðina (ekki 55). Listi/kröfur: nationwide-owner-scope.md í þessari möppu.

## 1. Núverandi staðaval og gagnaleið

- `/winter-route` er skráð í src/AppRoutes.jsx. src/pages/WinterRoute.jsx sýnir eitt `<select>` fyrir fasta routeId, ekki Frá/Til, víxlun eða „Sýna leið“. Ekkert leiðarkort í þessari síðu.
- src/lib/winterRouteRoutes.js hefur tvær leiðir: raudavatn-vik (6 veðurpunktar), raudavatn-borgarnes (4). api/_lib/winterRoute/routes.js hefur samsvarandi allowlist; Vík-kaflar/punktar koma úr segments.js. api/winter-route.js tekur routeId, ekki upphaf/enda eða samsetta leið.
- Fyrirliggjandi route-keyed cache, svarauðkenni/afpöntun, færð/tilkynningar, ferskleiki og einn sameiginlegur UTC-spátími eru endurnýtanleg. Síðan notar effectiveHour fyrir alla punkta, ekki komutíma; ETA-fjarlægðarreitir í eldri route-gögnum eru ekki ástæða til að endurvekja ETA.
- ticket-500/places-v1.json er fjögurra staða **rannsóknar-/contract-skjal**, ekki app-staðaskrá. Það skilgreinir ekki landsþekju og er ekki bundið við UI. Gamla 72-raða vinnusafnið er rannsókn, ekki nýr eigandalisti.

## 2. Hvað er stutt núna?

**Enginn af 56 stöðum hefur nú almenna Frá/Til-virkni í appinu.** Tvær fastar leiðir eru útfærðar í kóða; það sannar hvorki alla akstursstefnu né landsþekju og er ekki production-próf hér. R1/E1/S2/C hafa yfirfarið staðarpunktaefni. Vík og Borgarnes eru endar á föstu leiðunum. Fyrir aðra staði er staða hér tekin úr eldri retained v3-töflu, ekki ný landfræðileg sannprófun. Heitasamsvörun/NAME_MATCH_INFERRED merkir ekki valhæfa aksturstengingu.

| Staður eiganda | Eldri retained niðurstaða |
|---|---|
| Reykjavík | R1/Rauðavatn eigandavalið; akstursaðgengi óstaðfest |
| Kópavogur | NODE_UNDETERMINED |
| Hafnarfjörður | NODE_UNDETERMINED |
| Mosfellsbær | NODE_UNDETERMINED |
| Keflavík | Engin nákvæm heitasamsvörun í v3-töflu; þarf einstaklingsathugun |
| Keflavíkurflugvöllur (KEF) | Engin nákvæm heitasamsvörun í v3-töflu; þarf einstaklingsathugun |
| Grindavík | NODE_UNDETERMINED |
| Akranes | NODE_UNDETERMINED |
| Borgarnes | Endi á fastri runtime-leið; ekki almennt Frá/Til-val |
| Stykkishólmur | NODE_UNDETERMINED |
| Grundarfjörður | NODE_UNDETERMINED |
| Ólafsvík | NODE_UNDETERMINED |
| Búðardalur | NODE_UNDETERMINED |
| Reykhólar | Engin nákvæm heitasamsvörun í v3-töflu; þarf einstaklingsathugun |
| Patreksfjörður | NODE_UNDETERMINED |
| Tálknafjörður | NODE_UNDETERMINED |
| Bíldudalur | NODE_UNDETERMINED |
| Þingeyri | NODE_UNDETERMINED |
| Ísafjörður | NODE_UNDETERMINED |
| Bolungarvík | NODE_UNDETERMINED |
| Súðavík | NODE_UNDETERMINED |
| Hólmavík | NODE_UNDETERMINED |
| Drangsnes | Engin nákvæm heitasamsvörun í v3-töflu; þarf einstaklingsathugun |
| Hvammstangi | NODE_UNDETERMINED |
| Blönduós | NODE_UNDETERMINED |
| Skagaströnd | NODE_UNDETERMINED |
| Sauðárkrókur | NODE_UNDETERMINED |
| Varmahlíð | NODE_UNDETERMINED |
| Siglufjörður | NODE_UNDETERMINED |
| Ólafsfjörður | NODE_UNDETERMINED |
| Dalvík | NODE_UNDETERMINED |
| Akureyri | C eigandavalið; akstursaðgengi óstaðfest |
| Húsavík | NODE_UNDETERMINED |
| Reykjahlíð (Mývatn) | NAME_MATCH_INFERRED — v3 „Reykjahlíð“, piece 3566; ekki staðfest aksturstenging |
| Kópasker | NODE_UNDETERMINED |
| Raufarhöfn | NODE_UNDETERMINED |
| Þórshöfn | NODE_UNDETERMINED |
| Vopnafjörður | NODE_UNDETERMINED |
| Egilsstaðir | E1 eigandavalið, hnit staðfest í gagnalotu; akstursaðgengi óstaðfest |
| Seyðisfjörður | S2 eigandavalið, hnit staðfest í gagnalotu; akstursaðgengi óstaðfest |
| Neskaupstaður | NODE_UNDETERMINED |
| Eskifjörður | NODE_UNDETERMINED |
| Reyðarfjörður | NAME_MATCH_INFERRED |
| Fáskrúðsfjörður | NAME_MATCH_INFERRED |
| Djúpivogur | NODE_UNDETERMINED |
| Höfn | NODE_UNDETERMINED |
| Skaftafell | Engin nákvæm heitasamsvörun í v3-töflu; þarf einstaklingsathugun |
| Kirkjubæjarklaustur | NODE_UNDETERMINED |
| Vík | Endi á fastri runtime-leið; ekki almennt Frá/Til-val |
| Hvolsvöllur | NAME_MATCH_INFERRED |
| Hella | NAME_MATCH_INFERRED |
| Selfoss | NAME_MATCH_INFERRED |
| Hveragerði | NODE_UNDETERMINED |
| Þorlákshöfn | NODE_UNDETERMINED |
| Flúðir | NODE_UNDETERMINED |
| Laugarvatn | NODE_UNDETERMINED |

„Engin nákvæm heitasamsvörun“ merkir ekki að engin gögn finnist: t.d. þarf að athuga samheiti Reykjahlíðar/Mývatns og aðskilja Keflavík frá eldri sveitarfélagahópun og KEF. Engin þessara samsvarana heimilar samruna eða fjarlægingu staðar. Taflan uppfærir eldri 72-lista ekki hljóðlega.

## 3. Nákvæmar vöntanir

Það vantar eina sameiginlega vöru-staðaskrá allra 56 með sjálfstæðum ID, heimildabundnum staðarpunktum og aðkomutengingu; leyfilega stefnu/endapunkta á tengivegum; route-composition sem vinnur yfir sameiginlega kafla; og veður-/færðarpunkta á þessum nýju köflum. Vestfirðir, Snæfellsnes og Reykjanes eru skylduþekja, en tengingar þeirra eru ekki í núverandi tveggja leiða allowlist. Þau eru ekki leyst með nýju bæjarnafni í fellilista eða hnitum af mynd.

R1-norður hefur retained kandidatkeðju en H1 er INFERRED og bogaval/aðgengi óstaðfest. E1/S2/C hafa einnig EXACT_GAP fyrir aðgengi í contract-skjalinu. Opin gagnagöt þurfa heimild eða skýr unsupported-svör, ekki almennt bann við að viðkomandi eigandastaður sé í Frá/Til-listanum. Nýjar kröfur aðskilja sérstaklega staðaval frá leiðarþekju.

## 4. Einfaldasta útfærsluleiðin

Nota eina sameiginlega 56-staða skrá fyrir Frá og Til, með aðskildum aliases; veðurpunktar og innri leiðarhnútar eru önnur gögn. Halda eigandavöldum R1/E1/S2/C aðkomupunktum nema eigandi breyti þeim; stutt bæjarnafn í vali og nánari aðkomulýsing í niðurstöðu, ekki innri E1/C-kóði í birtingarheiti.

Byggja reviewed net sameiginlegra, stefnubundinna vegkafla og tengja staði við það. Kafli hefur raunverulega geometry, viðeigandi færðarauðkenni, aðgengisstöðu og tilvísanir; sami kafli er endurnýttur milli staðapara. Tengivegir utan Hringvegar eru fyrsta flokks hluti netsins. Samsetja aðeins heimildastudda leiðarvalkosti, ekki skrá öll 56×55 staðapör eða byggja almenna heimilisfangaleitarvél. F-vegir/hálendi/ferjur ekki sjálfgefnar tengingar. Lokanir sjást á valinni leið og breyta henni ekki sjálfkrafa.

#501 skilar valinni leið og röðuðum geometry-/færðarköflum eða skýru unsupported-gati. #502 notar alla 56 í báðum leitum, víxlar og sýnir gagnagat fyrir óstudda tengingu. #503 bindur leiðarveðurpunkta og tilkynningar við sama auðkenni/valinn spátíma. #492 birtir sömu geometry og niðurstöðu á korti og lista; kortmerkingar mega fækka við yfirsýn án þess að leitarlistinn minnki. #504 sannprófar innan/milli svæða og báðar akstursáttir. Að fara í svæðislotur breytir framkvæmdarröð, ekki eigandalistanum.

## 5. Samræming eldri miða og prompts

| Skjal/miði | Nauðsynleg samræming við nýjar eigandakröfur |
|---|---|
| #493 | Skipta „Hringvegur einn“/72-vinnulista sem vöruafmörkun út fyrir nákvæma 56-staða landsþekju; halda A–B, sameiginlegum spátíma og engu ETA. |
| #500 | 56 sjálfstæðir staðir í stað 72-tillögu sem release-lista; Garðabær/Reykholt og aðrir staðir utan eigandalista ekki nýjar valkröfur. Keflavík og KEF aðskilin. Staðaval ≠ studd leið. |
| #501 | Hringvalkostir aðeins þar sem studdir; bæta tengivegum/sameiginlegum köflum Vestfjarða, Snæfellsness og Reykjaness við, ekki aðeins tvær hringáttir. |
| #502 | Sama leitarbæra 56-staða skrá í Frá/Til. Skipta reglu um að fela/fjarlægja frestaða staði út fyrir sýnilegt unsupported-svar án uppspunninnar leiðar. |
| #503 | Veðurpunktaval á valinni leið, einnig heiðum/fjallvegum utan Hringvegar; innri punktar verða ekki nýir valstaðir. |
| #504 | Rekja öll 56 heiti/aðskilnað KEF; prófa dæmi innan og milli svæða, skipti, öfuga stefnu, gagnagat og lokun. Engin hljóðlaus fækkun við release. |
| #492 | Nýja myndin er sjónrænt viðmið; kortið hluti samþættrar afhendingar. Ekki afleiða hnit, veg eða staðalista af henni og ekki tvísmíða Frá/Til. |
| road93-prompt-review.md | Fyrri eins-pars vörutillaga leyst af hólmi; ekki fara með hana til CC sem afmörkun nýrrar útgáfu. Gögn um veg93 nýtast áfram sem ein tenging í landsneti. |

Þetta eru tillögur að breytingum miðatexta, ekki þegar birtar GitHub-breytingar. Eldri samþykkt gögn/próf eru varðveitt; aðeins röngar framtíðarumfangsforsendur leystar af hólmi. Fyrsta afhending hér er stöðugreining fyrir Jonesy; engin umfangsmikil innleiðing hafin.
