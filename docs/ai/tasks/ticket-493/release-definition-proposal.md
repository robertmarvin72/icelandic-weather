# #493 — Tillaga að valstöðum og næstu innleiðingarafmörkun

2026-11-10, Ripley. Eigandi óskaði eftir framhaldi eftir PASS áfanga2. Þetta skjal leggur fram næstu ákvarðanir. Heimildir eru place-data-phase2 lokamat umferð3, worklist_matching-v3.json, place_nodes-v3.json, road93_section-v2.json og samþykktur Akureyrarendi C.

## Valstaðir

Tillagan er að taka alla72 svæðismerktu staðina úr yfirfarna vinnulistanum sem marklista fyrir Frá/Til. Mannfjöldamörk ráða þá ekki ein og sér vali. Hver staður fær stöðu um aðkomutengingu og gögn.67 MATCHED,1 AMBIGUOUS og4 UNMATCHED eru Hagstofunafnapörun. Vegtenging og framleiðsluvalhæfi þurfa sjálfstæða staðfestingu.

Valhæfur staður þarf stöðugt staðarauðkenni, samþykktan aðkomuhnút, heimilaða vegkeðju að grunngrafinu, skýra áttarstöðu og skráða færðar-/spágagnatakmörkun. Staðir sem bíða tengingar eru áfram á marklista. Viðmótsframsetning þeirra þarf skýrt merki um að leiðargögn séu í vinnslu. Engin mannfjöldatala er nauðsynleg í viðmótinu. Leyfi Hagstofugagna er áfram óákveðið.

Reykholt þarf svæðisgreiningu milli tveggja kóða áður en það fær eitt staðarauðkenni. Kópavogur, Hafnarfjörður, Garðabær og Reykjanesbær þurfa sjálfstæð vöruauðkenni og vegtengingar óháð því hvernig Hagstofutaflan flokkar þéttbýlið. Sameiningartillaga í kóða50 leysir ekki vegtengingar þessara staða.

## Endapunktar

- Akureyri C er samþykktur endahnútur2940 við3876. Þessi ákvörðun helst grunnur leiðarinnar.
- Reykjavík þarf staðfestan og notendaskiljanlegan aðkomupunkt ásamt tengingu norður og suður. Tillagan er að útbúa nafngefinn Reykjavíkuraðkomupunkt með opinberri landfræðilegri heimild, fremur en að merkja Rauðavatn sem þegar staðfestan Reykjavíkurborgarkjarna. Retained Rauðavatn verður samanburðarakkeri.
- Egilsstaðir-mót2345/2344 eru raunveruleg geometry-tenging við veg93. Velja þarf hvort staðurinn í UI heiti Egilsstaðir með skýrri aðkomulýsingu eða fái sér bæjarhnút.
- Fyrir Seyðisfjörð legg ég til bæjarinngang sem fyrsta staðaenda. Retained bryggjuendi2891 er sér tillaga fyrir ferjuhöfn síðar. Mót2894/2892 eru candidate fyrir bæjarinngang og þarf að staðfesta heiti, hnit, akstursaðkomu og lengd úr gögnum áður en hann verður samþykktur staðaendi.

## Veðurpunktar og leiðarflæði

Punktaval fer fram eftir leiðartengingum. Endurnýta má yfirfarna punkta sem candidate og sameiginleg auðkenni þar sem hnit eru söm. Fyrir veg93 eru interpolation-punktar við0/33/67/100% endurkeyranleg tillaga á geometry. Staðsetning á veglínu sannar ekki að punktarnir fangi veðuráhættu Fjarðarheiðar. Endanlegt punktaval þarf rök fyrir berskjöldun og viðeigandi fjallvegaköflum.

Leiðarval þarf að styðja tvo hringvalkosti þar sem við á og beina tengivegaleið. Frá/Til víxlun snýr réttri stefnubundinni röð. Lokun er sýnd á valinni leið og engin sjálfvirk hjáleið. Einn UTC-spátími gildir á öllum punktum. Færð er síðasta tiltæka staða með eigin tímasetningu.

## Næsta afmarkaða lota

Næsta prompt skal loka aðkomuforsendum Reykjavík/Egilsstaða/Seyðisfjarðar og skila connectivity-stöðutöflu allra72 staðanna. Fyrst retained-first úrvinnsla og nákvæm lista yfir þær opinberu landfræðilegu heimildir sem vantar. Ný hýsing eða gagnasöfnun verður afmörkuð í yfirförnu prompti. Engin ný leiðaþjónusta eða dependency er valin með þessu skjali.

Eftir endapunktaákvörðun verður innleiðingarprompt byggt á samþykktri staðaskrá og skýrt skilgreindu vöruumfangi. Heildarmiði493 heldur landsdekkandi markmiði sínu og er áfram opinn.
