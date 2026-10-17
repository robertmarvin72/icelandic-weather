# Expert Support — tillaga eftir fund 14. október 2026

Drög til samþykktar; engar GitHub-breytingar framkvæmdar. Heimild: fundarúrdráttur sem eigandi afhenti í samtalinu, ekki upptaka eða staðfest orðrétt afrit. Athugasemdir hér eru endursagnir úr úrdrætti, ekki beinar tilvitnanir Guðrúnar. Fundurinn er ekki formleg staðfesting Veðurstofunnar á líkani Eltum Veðrið. Ófullgerð upphafssetning um gagnalíkön er ekki fyllt út með ágiskun.

Read-only GitHub-könnun: 432 issues (opin/lokuð), Project #3 Icelandic Weather Roadmap (375 items). #2 með sama nafni er tómt. #3 hefur Priority P0/P1/P2/P3 og Status Todo/In Progress/Blocked/Done. Nýir miðar: Todo, tillöguforgangur hér. Núverandi stöður #429 In Progress/P0, #419 Todo/P2, #329 Todo/P2 haldast. GitHub OPEN og Project Done eru mismunandi hlutir; ekki sjálfvirk enduropnun/lokun.

Merki expert-support og vedurstofan-2026-10-14 fundust ekki í label-lista. Tillaga: stofna eftir samþykki og setja á alla nýja miða; bæta einnig við uppfærða miða ef eigandi samþykkir það. Engar kóðabreytingar eða veðurfræðilegar þröskulda-/gagnagjafabreytingar í þessu undirbúningsverkefni.

P0 hér merkir öryggis-/traustsatriði sem þarf að rannsaka eða afmarka fyrst, ekki staðfesta neyðarbilun. P1 megin-notagildi/skýrleiki eða nauðsynleg rannsókn. P2 útlits-/framsetningarbót. Gagnaveitur/viðmið breytast aldrei eingöngu á grundvelli þessa fundar.

## N1 — Aðgreina eigin veðurathugasemdir frá opinberum viðvörunum — P0

Fundur: 10:00, 19:30, 22:07. Athugasemd úr úrdrætti: ekki kalla eigin mat viðvaranir; skýra ástæðu athugasemdar og vísa á opinbera vefi; áhrif veðurs eru stað- og árstíðabundin. Vandamál: notandi getur ruglað reiknuðu mati við opinbera viðvörun.

Okkar útfærslutillaga: audit á öllum sýnilegum viðvörunarorðum/táknum, aðskilin heiti/uppruni fyrir eigin athugasemdir og opinberar viðvaranir, sýnileg vedur.is tilvísun. Ekki halda fram „engar opinberar viðvaranir“ þegar opinber gögn vantar. Ekki breyta alvarlegum safety-tón eða hazard-viðmiðum sjálfkrafa.

Acceptance: uppruni skýr IS/EN; eigin mat ekki merkt opinber viðvörun; vantar gögn aðgreint frá engri viðvörun; ástæðu hægt að sjá. Prófun: texta/upprunapróf, ekkert/ótiltækt/gilt mat, mobile/desktop og regression á safety-flæði.

Skarast: #131/#126/#142 Done, #432 OPEN en Project Done. Nýr afmarkaður þverflæðismiði; ekki endurinnleiða #432.

## N2 — Rannsaka vindorð og flokkun með hliðsjón af Veðurstofunni — P1

Fundur: 10:00, 19:30, 39:40. Athugasemd: nota vindhraðaflokkun og varast skilgreind orð á borð við storm/rok; hviður túlkaðar í samhengi.

Vandamál/útfærsla okkar: kortleggja núverandi orð/viðmið og mælieiningar, bera við opinbera töflu, aðgreina vindhraða og hviður. Rannsóknarskýrsla og tillaga áður en flokkun breytist. Ekki yfirfæra vindstig á hviður eða breyta safety-viðmiðum án sérstakrar yfirferðar.

Acceptance: núverandi orð/gagnategundir skráð, frávik og óvissa greind, rökstudd tillaga/heimildir. Prófun: viðmiðunardæmi/mörk/einingar, sértilvik hviður; engin framleiðslubreyting í rannsókninni. Tengist #142/#117 Done og N1; ekki sama umfang.

Heimild: https://www.vedur.is/vedur/frodleikur/greinar/nr/349 (skoðuð 2026-10-14).

## N3 — Rannsaka vetrarbyrjun 15. september og aðgreina árstíðareglur — P1

Fundur: 01:20. Athugasemd: setja vetrarmode 15. sept.

Vandamál: winter mode getur merkt ólíka UI/scoring/feature-glugga. Tillaga okkar: fyrst kortleggja hvern glugga og hvað athugasemdin á við; síðan sérsamþykkt framsetningarbreyting eða scoring-rannsókn. Ekki breyta sameiginlegri árstíð/scoring reglu blindandi.

Acceptance: UI, scoring og aðrir árstíðagluggar aðgreindir; ákvörðun skráð um nákvæma reglu/tímabelti. Prófun: 14./15./16. september og aðrir gluggar óbreyttir. #115/#116 Done, #411 Done tengdur hero-texta; nýtt afmarkað rannsóknar/follow-up verkefni.

## N4 — Skýra mat, stig, lágmarksbætingu og skjól í samhengi notanda — P1

Fundur: 05:00, 08:00, 26:00, 26:23, 30:00, 39:30. Athugasemd: vantar merkingu áhættumats, 0,5-bæting skiljanleika, stigaforsendur, skjólstefnu/flokkaskil og farartækjasamhengi.

Tillaga okkar: læsileg „Hvað þýðir matið?“ upplýsingasíða/disclosure með núverandi skilgreiningum, mælieiningum, fjarlægðarsamhengi og takmörkunum. Segja hvaðan skjólið er aðeins ef gögn styðja. Farartækjadæmi sem skýringar, ekki nýtt vehicle-risk líkan.

Acceptance: upplýsingar náanlegar frá mati; 0,5 ekki óútskýrður tæknistrengur; score/áhætta/skjól ólíkar stærðir; engine-þröskuldar endursagðir rétt; engin öryggistrygging. Prófun: lykilaforsendur samsvara útreikningi, IS/EN, lyklaborð/mobile. #130/#121/#108/#15 Done eru bakgrunnur; #429 rannsókn aðskilin. Nýr afmarkaður skýrleikamiði án recalibration.

## N5 — Laga skroll í nánari upplýsingum Ferðaráðgjafa — P1

Fundur: 07:30. Athugasemd: vantar skroll í nánari upplýsingum.

Tillaga okkar: endurskapa á núverandi modal/disclosure og þröngum skjá; laga scroll-container/focus/aðgengi án flæðisendurhönnunar. Acceptance: allt efni/lokunarhnappur aðgengilegt, enginn scroll-lock gildra. Prófun: langar niðurstöður, stuttur viewport, touch/lyklaborð, opna/loka og focus return. #188/#304 Done tengdir en ná ekki þessari nýju bilun; nýr bug-miði, ekki staðfest reproducible fyrr en audit.

## N6 — Rannsaka mótsögn „betri aðstæður“ og lakara mat — P0

Fundur: 10:30. Athugasemd: betri aðstæður túlkaðar lakara.

Tillaga okkar: finna nákvæman samanburð/valinn dag/forsendur, endurskapa og fylgja canonical tone/data-flow. Ekki gera ráð fyrir að hærri hiti einn eigi alltaf að hækka heildarmat; ekki breyta scoring án staðfestrar orsakar.

Acceptance: tilvik og root cause skráð; skýrt hvort copy/gagnatími/tone eða útreikningur; staðfest bug lagfært innan scope eða sérstök rannsókn afhent. Prófun: upphafstilvik og stay/consider/move/svipað með sama tímaglugga. #353 Done og #428 OPEN/Project Done eru möguleg eldri orsök; nýr rannsókn/follow-up miði með tilvísunum. Ef nákvæm sama bilun reynist þegar leyst: ekki innleiða tvítekna lagfæringu.

## N7 — Sýna staðasamanburð myndrænt með raungildum og skýru úrkomuorðalagi — P1

Fundur: 12:00, 14:30. Athugasemd: töfluform læsilegra; sýna gildin sjálf, ekki bara mismun; „þurrara“ villandi þegar rignir og 2 mm munur ekki sjálfkrafa gagnlegur.

Tillaga okkar: sýna current/candidate raungildi og tímasamhengi hlið við hlið; delta aukaupplýsing, ekki eina niðurstaðan. Úrkomuorð samsvara raunástandi, engin þurrheit fullyrt frá delta einu. Engin ný 2mm regla úr fundinum.

Acceptance: báðir staðir/tímabil/einingar greinileg; úrkomugildi sýnileg; læsilegt á mobile; blandað/svipað mat ekki falskur sigurvegari. Prófun: báðir blautir, báðir þurrir, litlir/stórir munir, horfin gögn, IS/EN. #337/#340/#341 Done hafa samanburð þegar; nýr afmarkaður framsetningar-/orðalagsfollow-up, ekki nýtt comparison feature. Blog-scope aðeins í #329 uppfærslu, #330 tengdur.

## N8 — Samræma tölusnið og bil við hitamælieiningar í IS/EN — P1

Fundur: 13:30, 16:06. Athugasemd: kommutölur á íslensku, punktur á ensku og bil á milli tölu og °C.

Tillaga okkar: sameiginlegt locale-snið fyrir sýnilegar tölur/einingar, ekki API-gögn. Acceptance: IS 6,5 °C, EN 6.5 °C; sama regla í spá/listum/samanburði; engin breyting á reiknuðum gildum. Prófun: mínus/núll/aukastafir/tóm gildi/einingaskipti og báðir locales. Tengist #16/#47 Done; enginn samsvarandi opinn miði fannst.

## N9 — Skýra hitatölur: lægsti/hæsti hiti og rétt skilgreindur meðalhiti — P1

Fundur: 17:40, 34:00. Athugasemd: sýna lægsta/hæsta; meðalhiti ekki meðaltal extrema; umræðan aðgreinir meðaltal og tíðasta gildi.

Tillaga okkar: audit á núverandi hourly/daily gagnasamningum og hitamerkingu. Sýna min/max þar sem tiltækt; ef mean birtist á hann að samsvara skilgreindum tímabilsgögnum/provider-mean, ekki (min+max)/2. Mode ekki endurnefnt mean eða sett í staðinn án rannsóknar.

Acceptance: hver hitastærð og tímabil rétt merkt, ekki uppspunnin mean með vöntuðum klukkustundum; raw scoring óbreytt. Prófun: ójafnt hourly safn þar sem mean != miðja extrema, vantar gögn/dagaskil. #400/#402 Done tengjast dagsyfirliti en ekki þessari hitastærð; nýr þröngur data-contract/framsetningarmiði.

## N10 — Rannsaka úrkomutegundir og samræma úrkoma/regn orðalag — P1

Fundur: 17:40, 18:00. Athugasemd: nota úrkoma í nánari spá; spurning um tegund og umræðuviðmið kringum 2°C.

Tillaga okkar: staðfesta hvaða weather-code/snowfall/rain fields eru til, nákvæmni og takmarkanir; total precipitation heiti „úrkoma“, regn aðeins þar sem tegund réttlætir. 2°C er rannsóknarspurning, ekki fastur nýr threshold.

Acceptance: field/units/code mapping og notkun skráð; athugun á slyddu/él/snjó/regni án óstuddrar hitaflokkunar; innleiðing viðmiða bíður rannsóknar. Prófun: provider-tilvik rain/snow/mixed/unknown, við 0/2°C án fyrirfram fullyrðingar um úrkomutegund. #172/#176/#177/#238 Done: yfirlestur eldri heuristics, ekki blind endurinnleiðing.

## N11 — Snúa sjónrænum Top 5 kvarða frá slæmu upp í frábært — P2

Fundur: 24:00. Athugasemd: snúa kvarðanum.

Tillaga okkar: breyta stefnu legend/skala ef hún er öfug nú, ekki Top5 röð eða score. Acceptance: slæmt->frábært skýrt og litasamræmi við gildi; tooltip/focus/mobile skýrt. Prófun: endapunktar/midpoint, röðun/stig óbreytt. #54/#19/#5 Done tengdir; ný afmörkuð stefnubreyting, ekki nýtt scoring.

## N12 — Þysja og fókusa kort á valið tjaldsvæði — P1

Fundur: 32:00, 35:35. Athugasemd: fókusa niður á svæði, leyfa zoom-out; örvar og nafnval óljóst.

Tillaga okkar: samræma nafn/svæðisval og kortfocus/zoom, audit á örvaraðgerðum og tvíverknaði áður en þær eru fjarlægðar. Acceptance: valinn campsite sést strax, marker/popup rétt, notandi getur zoomað út; ekki stöðug refocus á rerender. Prófun: nafn/ör/kortval, mobile, mörg svæði, user pan/zoom. #9/#235/#415 Done: scroll/select þegar til, nýtt zoom/clarity follow-up.

## N13 — Bæta læsileika veðurgilda í listum — P2

Fundur: 36:22. Athugasemd: vindmerki dauft, nafn og gildi of langt í sundur.

Tillaga okkar: staðbundin spacing/contrast breyting á viðkomandi lista, engin útreikningsbreyting. Acceptance: gildi auðtengd réttu nafni, kontrast mældur, engin clipping við stóran texta. Prófun: IS/EN, dark/light, 320px, langir staðanöfn, lyklaborð. Nýr afmarkaður polish miði; tengist N14 en sjálfstætt acceptance.

## N14 — Samræma tákn fyrir hita, úrkomu, vind og hviður — P2

Fundur: 36:40, 38:47. Athugasemd: hitamælir í stað elds og sömu tákn fyrir sömu stærðir.

Tillaga okkar: inventory og ein samræmd núverandi icon-fjölskylda; thermometer fyrir hita. Rauður/blár hiti aðeins ef skýr framsetningarmerking ákveðin, ekki ný meteorological classification.

Acceptance: sömu merkingar hafa sömu tákn á spá/lista/samanburði; vindur/hviður aðgreinanleg, accessible texti; ekkert nýtt library. Prófun: icon/label mapping, dark/light, sjónræn staðfesting. #20 Done hefur SVG-kerfi áður: endurnýta, nýr þröngur consistency-follow-up.

## U1 — Uppfæra #429 með rannsókn á Open-Meteo líkani, DMI/IG og athugunum

Staða/forgangur haldast In Progress/P0. Fundur: upphaf án tímastimpils, 42:40, 43:30, 45:00, 45:40, 48:14. Athugasemdir: hvaða líkan er notað; kanna staðbundin líkön fyrstu þrjá daga, hæðarmun/reiknipunkta, athuganir núverandi vs spá framtíðar.

Þegar til: #429 kortleggur Veðurstofu/Open-Meteo/stöðvar/staðaspár og route-gagnagæði; ekki stofna annan samhliða vetrargagnaveitu-spike. Tillaga okkar: bæta afmörkuðum hluta um actual Open-Meteo model selection, sannreyna heiti/aðgengi/Íslandscoverage IG hjá DMI, upplausn/staðsetningu/hæð/refresh/leyfi/quota, observation freshness og klst/daga data-contract. Rannsaka hvort 0–72h local-líkan nýtist; ekki samþykkja provider skipti í þessum miða.

Acceptance: heimildastudd gagnaveitufylki og GO/PARTIAL/NO-GO, sérstaklega fjörður/hæðarsamsvörun, forecast vs observation og fyrirspurnamöguleikar. Prófun: read-only dæmi af raunverulegum aðgengilegum data-contractum/staðsetningum og vöntun/úrelding, ekki production switch. Almenn campsite-provider migration er háð þessari rannsókn og sérstökum síðari scope; #429 má ekki verða óafmarkaður innleiðingarmiði.

Vefir: https://athuganir.vedur.is/ og https://www.dmi.dk/frie-data . DMI yfirlit staðfestir opin gögn/API en eitt og sér sannar ekki heiti/Íslandscoverage líkansins sem nefnt var í fundinum.

## U2 — Uppfæra #419 með snjódýptarrannsókn

Staða/forgangur haldast Todo/P2. Fundur: 49:21, 51:06. Athugasemdir: takmarkaðar snjódýptarmælingar, mæliaðferð stika; ófundin „blue eitthvað“ síða.

Þegar til: Ski Weather discovery nefnir snjódýpt sem framtíðargagnategund. Tillaga okkar: gagnayfirlit snjódýptar/mæliaðferða/dekkingar/freshness og hvaða vöntun hindrar MVP. Óþekkt síða skráð sem óstaðfest vísbending, ekki uppspunnin vefslóð/provider. Acceptance: mæling vs spálíkans-depth aðgreind og provenance/dekking/leyfi skráð, eða skýrt ekki tiltækt. Prófun: gagnasýnishorn með tíma/einingum og tilvik vantar gögn. Engin ný snow scoring eða snjódýptarfullyrðing á campsite án gagna.

## U3 — Uppfæra #329 með fundarathugasemd um úrkomumun og orðalag

Staða/forgangur haldast Todo/P2. Fundur: 14:30. Bloggmiði #329 hefur þegar trace rain/1–2mm/samantektarvandann; ekki nýr blog-miði. Tillaga okkar: bæta heimild og acceptance um ekki „þurrt“ þegar niðurstaða er aðeins minni úrkoma, ekki operational-impact fullyrðingar frá litlu magni án gagna. Prófun: báðir dagar blautir og litlir munir án nýs sjálfvirks 2mm-viðmiðs. #330 samanburðar-sigurvegarar tengdur en ekki útvíkkaður sjálfkrafa.

## Framkvæmd eftir samþykki

Endurlesa núverandi issue/Project stöður rétt fyrir writes. Stofna samþykkt vöntuð merki, stofna eingöngu samþykkta nýja miða, tengja Project #3 og setja Priority/Status með núverandi options. Nýir Todo, núverandi þrír halda stöðu/forgangi. Uppfærslur varðveita fyrri umfang og rannsóknarreglur, bæta greinilega aðgreindum fundarkafla frekar en yfirskrifa gamla lýsingu. Engin sjálfvirk enduropnun Done-miða; ef nýr miði reynist nákvæm tvítekning, nota existing í staðinn og segja frá. Engin óheimil kóðabreyting/threshold breyting/GA eða deploy aðgerð.
