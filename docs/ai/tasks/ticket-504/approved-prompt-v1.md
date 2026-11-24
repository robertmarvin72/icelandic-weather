# #504 — Approved prompt v1: heildarprófun núverandi MVP

## Samþykkt framkvæmdarfyrirmæli — 2026-11-24

Eigandi heimilar undirbúning #504 („Gerðu það“). #503 source-time PASS/CLOSED með eigandasamþykki; engin ólokin innleiðingarlota. #504/#493 lesin beint af GitHub2026-11-24. Jonesy samþykkti með bindandi P1–P7 felldum inn hér. Framkvæma aðeins þegar CURRENT READY_FOR_CC vísar á þetta skjal og eigandi segir „Prompt approved“.


## Fyrst: væntigildi, kvóti og val Ripley

P1–P7 ganga framar grunntexta. Þetta er samþykkt validation-lota, ekki ný innleiðing. Engin þriðja review-umferð sjálfkrafa.

**Raunprófunarbókhald áður en fyrsta gagnabeiðni er gerð:** eftirfarandi eru9lyklar/27coldupstreamcalls, ekki9HTTPrequests í vafra (geometry/assets eru annað). FærðarTTL5mín/spáTTL15mín.30 er hart efri kallamark, ekki endurprófunarfjárheimild. Nota eftirlit á data-svörum og fyrirframáætlun samkvæmtP1; þetta er varfærin efri talning, ekki fullyrðing um beina upstreamnetmælingu.

| Röð | Lykill/sýnishorn | Væntigildi | Kalt efri kallatalning |
|---|---|---|---:|
|1|E→Sey|3punktar/24,1km/13,5kmgloppa|3|
|2|Sey→E og swaptilbaka innan5mín|3punktar/sama13,5gloppa|3 nýlykils, endurheimsókn E→Sey0 aðeins ef innanTTL|
|3|R→Selfoss south|3punktar/≈45km|3|
|4|R→Selfoss north|18punktar/≈1236,0km|3|
|5|Selfoss→R north|15punktar/≈1236,2km|3|
|6|R→Hella south|3punktar/≈80,7km|3|
|7|R→Hella north|17punktar/≈1200,4km|3|
|8|Búðardalur→Hólmavík og reverseinnanTTL|4punktar, sömudeildufötu|3|
|9|Selfoss→Hella|2punktar/≈35,6kmgloppa|3|

Ekki bæta Hella→Selfoss eðaHella→R við vegna ↔styttingar ígrunntexta án nýrrar3calltalningar. Allaráttirdekkast líka af retainedmatrix/targetedtests. UpphafE→Sey ogendurheimsswap gerðstímanlega; seinna north→E–Sey samanburðarsýnishorn má styðja delayedpróf eða fara íkvótabókhaldið ef >5mínliðið. EftirTTL telja2roadcalls/eftir15mín3. Hægt að nota eina heita síðu/mode án reload fyrirzoom/lang/screenshot oggagnabeiðnir verða ekkisjálfkrafa0þóttsíðan séopin. Við30STOPnet; skráóprófað ístaðaðfara framúr.

- Engar breytingar ácache/devprocess tilaðfalsa warmkvóta. Ræsaefvantar enekkirestarta milli sýna tilað„hreinsa“ það. Efhotreload/restartverður, skrá það ogtelja cold.
- Núverandi **18punktahámark er afleiðing frystra routegagna**, ekki kóðafastihámarks-/chunkguard. P4lítiðofflinepróf á50studduáttum+allraoptionvariantsmeðstubbuðumupstream heimilað ínúveranditests eða tasklocaltest. Ekki framleiðsluguardtilaðfáprófgrænt. Réttidentitygerð/singleflight/TTLpróf endurnýta þarsemraunverulegasamaaðferð.
- Þekjuskrá samræmd eftirID:10af11UI í56staðaskrá;Flókalundur viðbótutan;46af56ekkiUI. Ekki breyta connectionStatus/hausgögnum; þau eru provenance/aðkomutakmörk, ekki núverandi routeallowlist. UIroutableákvörðun úractualhandlers/pairclassification.
- #493áframlandsdekkandiyfirmiði og doubleoptionaðeinsá2pörum. **PASS fyrir11staða/25paraMVP,ekki#493** er niðurstaða; ekki nýfullrelease/lokunarheimild. Óskyldlint/CIerror getur leyft scopedproductPASSmeð skýrtgæðahliðNOT_PASSED/NOT_VERIFIED, aldreilýsaósigrugruncheckgrænum. DemonstratedruntimebugSTOPtil eiganda.
- P6-listinn tekinn orðrétt úr live#493 meðdagsetningu eðaheimilaðriretainedheimild. Ripley laslive#493 2026-11-24 viðpromptagerð; CC verður aðvísaíactualretrievedbody íevidence eða repoheimild, ekki endursegja eftirminni. BLOCKED_ON_INPUT er status skýrslutöflu efinputvantar, **ekki nýCURRENTstage**; nota aðeins workflowstages.
- P7raunzoom ogskjálesaraheiðarleiki: devicePixelRatiogildi einog sérsannaekki200%; þurfa actualbrowserzoomaction ogfyrir/eftirviewport/DPR. Ef enginraunskjálesaraprófun,NOT_TESTEDmeðeigandaskrefi, enginnnyplatform.
- Framleiðslukóði erread-only. Mæling/próf/skýrslugerðmáklára sjálfstætt viðruntimeblocker, ekki leiðréttaappkóða án eigandastefnu. Enginn nýnetprovider eða paidservice.


## Markmið og samþykktarmörk

Sannreyna **núverandi vinnandi MVP**, skrá þekju og skila skýru PASS/REVISE/BLOCKED til eiganda. Þetta er heildarathugun, ekki ný leiða-/veður-/kortainnleiðing eða release-framework. #492 endurhönnun/kort er utan og má ekki verða skilyrði fyrir prófun.

Þekja sem þetta prompt leggur til útgáfugats: 11 núverandi staðir úr WINTER_ROUTE_PLACES,25studd óröðuð leiðapör (15Vestfirðir+10hringpör,50áttir), tveir south/northvalkostapör með8variant, 3junctiongeometrypör utanUI áfram ótengd veðri.11staðir gefa55möguleg pör;30mixedRing–Westfirðir eruunsupported. Engin falin breyting á landsdekkandi markmiði #493 eða56staðaskrá. **PASS í þessari lotu merkir aðeins núverandiMVP, ekki að #493 sé fullgerður á landsvísu.** Eigandasamþykki lokaafhendingar staðfestir þessa afmörkuðu útgáfuþekju. LokanirGitHub/útgáfa eru sérstök eigandaákvörðun.

## Lesa / nýta fyrri vinnu

AGENTS/CLAUDE, docs/ai/README/CURRENT; lifandi#504 og#493 innihald ef tiltækt; docs/open-meteo-auth.md. #499–#502 afhendingar eftir repo (sérstaklega#501 closure-final/final-handoff og route-contract/#502result-review). #503closure-assessment og result-review/cc-report/probe-output úr öllum síðustu lotum. Núverandi data/geometry-handlerar, route/helper/cache/punktaskrár, WinterRoute.jsx, identity/pairclassification, i18n og targetedpróf/e2e-specs.

Ekki endurframleiða gögn sem þegar eru varðveitt og samþykkt. Fyrri raunprobe/screenshot er **fyrri athugun**, ný lokalkeyrsla er nýathugun; hvaðCC/Jonesy/Ripleykeyrði er alltaf aðgreint. Ekki leggja saman próffjölda frá mörgum tímum sem eina núverandi keyrslu.

## Fyrsta athugun — áður en skýrslukerfi er smíðað

Read-only inventorygit/head/runtime/config og staðfesta núverandi /winter-route inngang. Nota existingVite+raunbackend efkeyrandi; heimilt að ræsa project-dev-skipanir hidden efþarf án envbreytingar/deploy. Lykiltilvist aðeinsboolean; engin env/URLapikey. Fyrsta raunathugun **Egilsstaðir→Seyðisfjörður** fráFrá/Til að3punktaniðurstöðu, sömuUTCslot ogréttum færðarköflum. Þetta er lítill þekktur3pointflow sem sannar núverandiintegration.

Ef API/dev/netaðgangur/lykilvantar: skrá raunástæðu, prófa sjálfstæð unit/build/þekjuhluta áfram, en ekki kalla mockrealPASS eða eyða tíma í provider/port/envrannsókn umfram2venjulegar tilraunir. Enginnnýprovider/fallback/service/dependency. Skýrsla lýsir hvaðbíður eiganda.

## Þekjuskrá — lítið artifact úr raunskrám

Búa til `coverage.json` eða .csv + stutta skýringu írelease-report. Task-local lítil script má lesa runtime-skrár/raunhandlera offline; ekki runtimeframleiðslukerfi.

Skrá11UIstaði með IDs/displaynames/raunendpoint/sourcevertex/tiltækum native-WGS84heimildum,5hring/6Vestfirðir;25studdpör og valkosti,30unsupportedmixedpör,3junctionaðskilin, same-place. Perleið references ápunktregistry/orderedID/fjölda/IdButur/tengingar/version og gaps, ekki copy-paste allarJSONgeómetríur íMarkdown. Endurnýta tölur úr kóða, ekki giska á sameiginlegauniontalningu.56staðaskráin afmörkuð sem viðmið/óútgefinþekja; telja óútgefna/frestaða staði sérstaklega úrraunIDmismun (m.a.Flókalundur er ekki sjálfkrafa hluti sömu56skráar — staðfesta). Ekki draga11frá56blindandi.

Varðveita raunmörk: Tálknafjarðar995mshort-end, Ísafjarðar/akbrautaUNVERIFIED, nullconnectorar, n:1IdButurtilkynningar, staðbundinpunktspá/gaps allt að≈111km, aðeinsnorðurleiðR–E/R–Sey, optionstýring aðeinsR–Selfoss/Hella. Gögn/þekjuákvarðanir breytast ekki hér.

## Heildarprófun — focused og rekjanleg

1. **Frá vali að niðurstöðu í raunvafra:** Rauðavatn→Selfoss south, north, reverse north; Rauðavatn→Hella south/north; Egilsstaðir→Seyðisfjörður,swaptilbaka. Eitt Vestfjarðapar Búðardalur↔Hólmavík og eitt sameiginlegt/beint stuttpar Selfoss→Hella nægir; lesa#504sameiginlegtengivegskilyrði gagnvart actualslices, ekki nýleið aðjunction. Samastað/genuineunsupportedmixed/noresult líka. Skiptihratt úr18pointnorth í3pointE–Sey,mode/draft/swap ogUTCslota; ekkertgamalt undirnýjumhaus.
2. **Bilunarlíkön með controlled fixtures**, ekki bíðaeftirraunlokun/hættuveðri: closure/roadwork/othernotice,unknown/stale/partialroad+forecast/providerfail,out-ofwindowUTC,seinkaðoldresponse. Endurnýta parsedhelperfixtures og núverandi próf. Ef nauðsynlegt vantarexactdelayedidentityrace úr#503, eitt lítið focusedcomponentpróf leyft; ekki byggja matrixframework. Engin providerfailure eða „falsklokun“ skrifuð í raungagnakerfi.
3. **Lengsta leið:** varðveitt#503ring-optionsproof max18points/≈1236km/nochunk19536B og pervariantcache3calls/reverse6 er fyrra mælt evidence. Sannreyna hámark núverandi frystra skilgreininga/routeidentity ífocusedprófi og raunUI18cardflow núna; ekki endursækja öll8+16forecastproofs aftur. Warmrequestrepeats verða0upstream ef withinTTL íunitprófi. Heildcold117 er reikningur, ekki SLA. Ef nýrealrequest mæld, skráskipt frá gömluproof.
4. **Aðgengi eftirviðeigandiumfangi:** keyboardfrom/search/select/swap/submit/optionsarrow/hour, fókus oglive-region; mobile360,desktop,ISEN,200%realbrowserzoom ávali+niðurstöðu. Ekki líkja screenshotresize eðaCSStransform við browserzoom. Skjálesarapróf aðeins ef raunskjálesari/session tiltækur; AXtree/jsdomrole er **ekki raunskjálesari**. Efekkitiltækt skrá NOT_TESTEDogstutt eigandaprófunarskref, ekki nýdependency/platform eða falsePASS. Hvers konar aðgengisclaim fer í evidence-ogscope-skýringu, ekki að hver óprófaður engine stöðvi sjálfkrafaMVP.
5. **Núverandi targetedpróf:** keyra eitt viðeigandiWinterRouteAPI/geometry/identity/parity/presentation/component-set sem nær núverandigreinum; velja úrraunprófskrám ogskráskipun/fjölda. Fyrriproof geturfullnægtatriðum sem ekki breyttust, enheildarflæðisniðurstaða þarfactualUI. Eldri flaky502focus skrásem slík, ekki triggerwidefix/margendurkeyrslu; maxein markvissendurkeyrsla meðútskýringu.
6. **Gæðahlið:** `npm run lint`, `npm run build` einusinni og `git diff --check`. Ekki dependencyuppfærsla eða óumbeðinrepo-hreinsun vegna óskyldraflöggva. Read-onlyCIstaða fyriractualpushedHEAD ef tiltæk (GitHubconnector/gh); staðfestaSHA. CIkeyrslaáöðrumSHA eða fyrrihead er ekkiPASSáworkingtree. Ef enginmatchedCItiltæk: NOT_VERIFIEDoglocalchecks, enginnpush/workflowdispatch tilað„geraCIgrænt“. Ekki fullsuite/coveragekeyrsla staðbundið bara tilaðhermaCI nema raunbilun sýni þörf.

### Net-/tólmörk og evidence

Raunvafrasýnishornið hér heimilar núverandi data-endpoint á nákvæmlega þessum pörum/variants. Engin sérnýveitu-probe. Nota samsvarandi0-extraTTLrequests þegarhægt; **max30cold upstreamveitu-köll fyrirnýjaraunsýnishornið**, síðan stoppa netprófun/samþætta retainedevidence. Þetta rúmar8–10coldrequests; ekki endalaust screenshotreload eftirTTL. Vafragrunnsasset-/read-onlyGitHubköll ekki samaquota; lyklar aldreiprentast. Báðaráttir/allar25leiðir staðfestoffline+tests, ekki screenshot hverleið.

Computer-use workflow eftirtiltækutólum/skillum, engin nybrowserautomationinfra. Mest2tilraunir viðtólbilun, svo heiðarleg afhending. Evidence íticket-504/evidence eingöngu; **ekki keyra gamlae2especs sem endurskrifa502/503myndir eða vænta aðnú-tengdpör séu ennótengd**. Task-local aðlögun/nýlítil e2eskrá aðeinsefnotað, enginnfjöldiendurskrifaðraprófa. Skrá permyndraun/stub/vélbrowser/resolution/zoom/lang/timestamp. Screenshots sýnalokastöðu; delayedraceproof kemurúrprófi, ekki sama screenshotclaim.

## Skil — stutt release-report, ekki nýtt reviewkerfi

`cc-report.md` meðkeyrslum/prófafjölda og `release-report.md` með:
- **PASS / REVISE / BLOCKED fyrir11staðaMVP**, 25pör og fullgiltþekjulistareference. Allt#493landsscope ekki merkttilbúið afþví.
- Eincompacttafla yfiröll13samþykktarskilyrði#493: evidence/testpath eða explicitpartial/deferred/ownerdecision, sérstaklega „báðarleiðirumHringveg“ er aðeinsá2pörum; enginfalskallar-pör-doubleoptionfullyrðing.
- Nýttprófað vsretained vsstub vsNOT_TESTED vsowner-reportedproduction; CIsha/localworkingtreeaðgreint. Productionekkiprófaðánnýrrarheimildar.
- Þekjugöt/leyfi/heimildir (núverandiVegagerðinCCBY/Open-Meteo ogforliggjandiskjöl; engin nýlögfræðirannsókn), mikilvægustuáhættur, rollbackí2–3skrefum sem **eigandiaðgerð** (fyrriþekktcommit/redeployúrVercel eftirraunrepoaðferð). Ekki framkvæmarollback/push/deploy.
- Afdráttarlaus #493staða: landsdekkandimarkmiðogaðrarpör-optionstakmörk eruopin; þessi#504MVPniðurstaða fellirekki þauúr gildi. #492aðskilinendurhönnun.

Má skrá afmarkað RELEASE_READINESS meðtakmörkum án aðfullyrðaöll#504raunskjálesara/CI/productionatriðiPASSefþaunáðustekki. Efóprófaðatriði erkonkretblocker fyrirraunnotkun, skráBLOCKED/REVISEogminnstulausn; ekki yfirskrifagatiðmeð„MVP“. Eigandi hefur skýranvalkost áþeimafhendingargögnum, ekki enn önnur sjálfvirkreviewlota.

## Umfang / STOP

Sjálfgefið **validation+docs**, ekki framleiðslukóðabreytingar. Heimilt tasklocalscript/evidence/release/coverage/report/CURRENT og fáfocusedtestsemfyllir demonstratedP3gap, án nýdependency/runnerframework. Ef raunpróf finnur runtimebug: skrárepro/áhrif/minnstufix, **STOPháðreleasePASSogtilkynnareiganda áður en appkóða erbreytt**. Ekki endurbyggja route/cachesystem eðaþétta punkta tilaðfágrænalokaskýrslu. Óskyldlint/build/CIerrors ekki sjálfvirkt nýscope.

Enginn nýprovider/geocoding/netresearch/paidservice/backend/scoring/tierclip/entitlement/checkout/#492kort/frekariþekja. CC READY_FOR_CC→CC_IN_PROGRESS→CC_COMPLETEmeðreport;Jonesy/Ripley/eigandi. Max2reviewroundáþessari afhendingu án explicitownerchoice. Enginncommit/push/deploy/GitHubwrite/issueclose/eðasjálfvirknæstalota.

## Viðmið Jonesy — kóðalestur/offline, ekki nýveitumæling

### Sandbox-staðfesting á forsendum prompt

- **Þekjutölur standast:** `WINTER_ROUTE_PLACES` = 11 staðir, 5 hringur (`reykjavik-raudavatn`, `selfoss`, `hella`, `egilsstadir`, `seydisfjordur`) + 6 Vestfirðir (`budardalur`, `flokalundur`, `isafjordur`, `holmavik`, `patreksfjordur`, `talknafjordur`). C(5,2)=10 hringpör + C(6,2)=15 Vestfjarðapör = 25 tengd; 5×6=30 blönduð; 11 staðir ⇒ 55 möguleg. Samræmist closure-assessment og parity-prófi.
- **Valkostir (úr `ring-options/evidence/offline-matrix.json`, 8 raðir):** R→Selfoss south 3 punktar/45,0 km; **north 18 punktar/1236,0 km; Selfoss→R north 15 punktar/1236,2 km**; R→Hella south 3/80,7 km (báðar áttir); north 17/1200,4 km (báðar áttir). 18 er hámarkið meðal ring-options-átta (og prófin kalla það „the production maximum“); ring-completion-áttir eru allt að 16. Vestfjarðapörin endurtalði ég ekki nú. Prompt-liður „skipta hratt úr 18-punkta north í 3-punkta E–Sey“ passar við R→Selfoss north.
- **Cache-lyklar:** hver lykill hefur eigin færðar- og spáfötu (`cache.js`: færð TTL 5 mín, spá 15 mín, per einstakt `routeId`, í minni hverrar instance). Lyklar: ring-options `…ring:{from}|{to}|{option}|{geometryId}` (**stefnubundinn**), ring-completion `…ring-completion:{from}|{to}|{geometryId}|{datasetVersion}` (**stefnubundinn**), Vestfirðir `…:{from,to raðað}` og Búðardalur↔Hólmavík fastur lykill (**deilt í báðar áttir**). Kalt lykill kostar 3 köll (2 færðarfeedar + 1 spá), eins og í fyrri lotum.
- **Engin kóðatakmörk á punktafjölda:** `winter-route-data.js` og `forecastFetch.js` hafa hvorki hámarksfasta né skiptingu í hluta; 18 er afleiðing frystra gagna og er aðeins fullyrt í prófum fyrir R→Selfoss north (`ringOptionsRoute.test.js` „the production maximum“, `winter-route-data.test.js` 18 punktar).
- **56-staða skráin (`server_data/winter-route-places.json`):** 56 staðir; **10 af 11 UI-id eru í henni, `flokalundur` er það ekki** (þ.e. UI-listinn er ekki undirmengi 56 og 46 af 56 eru ekki valhæfir). `reykjavik-raudavatn` heitir þar „Reykjavík“ (UI sýnir „Reykjavík (Rauðavatn)“), svo samsvörun á nafni sleppir honum ranglega. Öll 10 hafa `connectionStatus.state = ACCESS_POINT_SELECTED_ACCESS_UNCONFIRMED`; haus skráarinnar segir enn „No place is routable/supported yet“ og „54 staðir hafa valinn aðkomupunkt, 2 óvalin“.
- **Eldri mælingar (mínar, fyrri lotur, ekki ný keyrsla fyrir #504):** API/geometry-prófin 358/358 og `WinterRoute.test.jsx` 126/126 + `winterRoutePresentation.test.js` 15/15 (source-time). Eldra #502 fókuspróf flöktir (1 af 6) — þekkt, ekki frá #504.


## Bindandi P1–P7 Jonesy — óbreytt

**P1 — Fyrirfram skráð kallabókhald; kvótinn er 27 af 30 með engum afgangi fyrir endurtektir.** Áætluð sýni kosta, miðað við lykla hér að ofan: R→Selfoss south, north og Selfoss→R north (3 lyklar), R→Hella south og north (2), E→Sey og Sey→E (2, stefnubundið), Búðardalur↔Hólmavík (1, báðar áttir deila fötu), Selfoss↔Hella (1) = **9 lyklar × 3 = 27 köll**; Hella→Selfoss eða aðrar áttir bæta við 3. Frekar en „núll aukaköll ef hægt“ krefst ég: (a) CC skrái *áður en fyrsta raun-kall er gert* töflu lykill → væntanleg köll → röð, og haldi sig við hana; (b) endurheimsókn sama lykils kostar 2 köll (færð) eftir 5 mín og 3 eftir 15 mín, svo „skipta hratt úr 18-punkta north í E–Sey“ og „swap til baka“ verða að gerast innan 5 mín frá fyrri heimsókn lykilsins eða teljast kald; endurhlaðning/zoom/skjáskot-endurtaka teljast líka; endurræsing `vercel dev`/hot-reload á `api/` núllstillir cache og telst kalt; (c) talning úr svörum án bakendabreytingar: `roadMeta.cacheAgeMs === 0` ⇒ 2 köll, `forecast.cacheAgeMs === 0` ⇒ 1 kall (efri mörk — 0 sést líka þegar fetch deilist í flugi og þegar hluti er `available:false`); (d) þegar talan nær 30 ⇒ STOP á netprófun og afgangur kemur úr preserved evidence/prófum. Skrá fjölda raun-kalla í `cc-report.md` og hver þeirra var kalt vs endurtekið.

**P2 — Væntigildi fyrir fyrsta raunsýni, ekki bara „eitthvað birtist“.** Fyrir hvert sýni skrái CC fyrirfram úr retained gögnum og beri svo saman: R→Selfoss south 3 punktar/≈45,0 km; north 18/≈1236,0; **Selfoss→R north 15/≈1236,2 (ósamhverf — ekki spegla 18)**; R→Hella south 3/≈80,7; north 17/≈1200,4 (báðar áttir 17); E↔Sey 3 punktar, bil ≈13,5 km (úr ring-completion matrix, 24,1 km leið); Selfoss↔Hella 2 punktar, bil 35,6 km (þynnsta þekja sem tengd er — merkja „mjög þunn“ í skýrslu, ekki galla); Búðardalur↔Hólmavík 4 punktar (úr source-time skjáskoti). Frávik er niðurstaða (REVISE/BLOCKED samkvæmt STOP), ekki leyfi til að uppfæra tölu í skýrslunni.

**P3 — Þekjuskráin: samsvörun eftir id, og 56-skráin er ekki þekjuheimild.** (a) `coverage.json` gerð úr `WINTER_ROUTE_PLACES` + flokkun para (`winterRoutePairParity.test.js`/parity-logic) + raun-handlerum offline, samsvörun **eftir id** (nafn gefur falska villu á `reykjavik-raudavatn`). (b) Skýrsla segir beint: 10 af 11 UI-staðanna eru í 56-skránni, **Flókalundur er utan hennar**, 46 af 56 eru ekki valhæfir (óútgefin/frestuð þekja), 30 blönduð pör ótengd, 3 junction-pör utan UI. (c) `connectionStatus`/haustexti í `winter-route-places.json` („No place is routable/supported yet“) er *staða aðkomupunkts*, ekki þekja og er úreltur sem lýsing á þekju; coverage.json má **ekki** lesa routable-stöðu úr honum. Gögnin eru ekki breytt í #504 (umfang); skrá sem þekkt skjalaskekkja og eigandaákvörðun. (d) Öll 10 staðirnir bera „akstursaðgengi óstaðfest“ (EXACT_GAP) — sama takmark og UI sýnir; fer í takmarkalistann.

**P4 — „Runtime-hámark 18“ orðist rétt og prófist þar sem það hefur merkingu.** Segja í skýrslu: *hámark frystra gagna er 18 punktar (R→Selfoss north); engin kóðatakmörk eru til og engin skipting í hluta*. Liður 3 leyfir eitt lítið focused próf: yfir allar 50 áttir með raun-geometry- og data-handlerum (stubbuð upstream) staðfesta `max(points) ≤ 18`, að hvert svar beri rétt auðkenni (`regionVersion` / `selectedOption`+`datasetVersion`+`policyVersion` / `datasetVersion` eingöngu) og að endurtekið kall innan TTL gefi 0 upstream-köll (cache.test.js getur nægt fyrir hið síðasta). Ekki fullyrða „hámark varið“ nema slíkt próf sé raunverulega skrifað og keyrt.

**P5 — PASS-skilgreining fyrirfram, skrifuð með umfangi í sömu setningu.** „PASS“ fyrir 11 staða MVP þýðir: öll raunsýni (P2) stemma við væntigildi eða hafa útskýrt frávik; focused próf (ein skráð skipun + fjöldi) græn; `npm run lint`/`build` græn eða með óskyldum villum nefndum sérstaklega; NOT_TESTED/NOT_VERIFIED (skjálesari, CI, production) eru skráð sem eigandaskref og blokka ekki PASS **nema** prompt kallar þau blocker. Hver PASS-setning í `release-report.md` ber „fyrir 11 staða/25 para MVP, ekki #493“ — ekki í fyrirsögn einni. Runtime-villa ⇒ STOP, REVISE/BLOCKED og tilkynna eiganda áður en app-kóða er breytt (prompt segir þetta þegar).

**P6 — #493-taflan: 13 skilyrði orðrétt, ekki endursögð.** Ég get ekki staðfest töluna 13 (las ekki #493). CC skrái heimild (live issue með dagsetningu, eða `docs/ai/tasks/ticket-500/nationwide-owner-scope.md` ef GitHub er ekki tiltækt) og afriti skilyrðin orðrétt; ef orðréttur listi fæst ekki ⇒ merkja töfluna BLOCKED_ON_INPUT en ekki endursmíða hana eftir minni. Línan „báðar leiðir um Hringveg“: aðeins R–Selfoss og R–Hella (2 pör, 8 afbrigði) hafa south/north; R–E og R–Sey hafa eingöngu norðurleið; engin „öll pör með tvöfalda leið“ fullyrðing.

**P7 — Sönnunargögn sem hægt er að sannreyna.** (a) 200% zoom á að vera raunverulegur vafrazoom; skrá `window.devicePixelRatio` og `window.innerWidth` fyrir/eftir (zoom 200% á skjá með DPR 1 ⇒ DPR 2 og helmingað `innerWidth`), annars NOT_TESTED. (b) Hver mynd skráð með raun/stubbað, vafri, upplausn, zoom, tungumál, tímastimpil; skjáskot sýna lokastöðu, seinkað „race“ kemur úr prófi. (c) Engin gömul e2e-spec sem skrifar yfir #502/#503 myndir (prompt segir þetta); allar nýjar myndir aðeins í `ticket-504/evidence/` og ekkert eldra skrifað yfir. (d) Skrá `git rev-parse HEAD`, fjölda skráa í `git status --short` og hvaða hluti #499–#503 er í HEAD vs aðeins í working tree; CI-niðurstaða gildir aðeins um nákvæmlega þann SHA og er NOT_VERIFIED fyrir óskuldbundnar breytingar.

