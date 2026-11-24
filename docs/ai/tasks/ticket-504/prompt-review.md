# #504 — Heildarprófun og þekjuskrá fyrir núverandi MVP

## Ripley initial prompt — umferð 1 — 2026-11-24

Eigandi heimilar undirbúning #504 („Gerðu það“). #503 source-time PASS/CLOSED með eigandasamþykki; engin ólokin innleiðingarlota. #504/#493 lesin beint af GitHub2026-11-24. Þetta skjal er prompt-review; ekki framkvæma fyrr en approved prompt er skráð í CURRENT READY_FOR_CC og eigandi segir „Prompt approved“.

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

Skrá11UIstaði með IDs/displaynames/raunendpoint/sourcevertex/tiltækum native-WGS84heimildum,5hring/6Vestfirðir;25studdpör og valkosti,30unsupportedmixedpör,3junctionaðskilin, same-place. Perleið references ápunktregistry/orderedID/fjölda/IdButur/tengingar/version og gaps, ekki copy-paste allarJSONgeómetríur íMarkdown. Endurnýta tölur úrkóða, ekki giska á sameiginlegauniontalningu.56staðaskráin afmörkuð sem viðmið/óútgefinþekja; telja óútgefna/frestaða staði sérstaklega úrraunIDmismun (m.a.Flókalundur er ekki sjálfkrafa hluti sömu56skráar — staðfesta). Ekki draga11frá56blindandi.

Varðveita raunmörk: Tálknafjarðar995mshort-end, Ísafjarðar/akbrautaUNVERIFIED, nullconnectorar, n:1IdButurtilkynningar, staðbundinpunktspá/gaps allt að≈111km, aðeinsnorðurleiðR–E/R–Sey, optionstýring aðeinsR–Selfoss/Hella. Gögn/þekjuákvarðanir breytast ekki hér.

## Heildarprófun — focused og rekjanleg

1. **Frá vali að niðurstöðu í raunvafra:** Rauðavatn→Selfoss south, north, reverse north; Rauðavatn→Hella south/north; Egilsstaðir→Seyðisfjörður,swaptilbaka. Eitt Vestfjarðapar Búðardalur↔Hólmavík og eitt sameiginlegt/beint stuttpar Selfoss↔Hella nægir; lesa#504sameiginlegtengivegskilyrði gagnvart actualslices, ekki nýleið aðjunction. Samastað/genuineunsupportedmixed/noresult líka. Skiptihratt úr18pointnorth í3pointE–Sey,mode/draft/swap ogUTCslota; ekkertgamalt undirnýjumhaus.
2. **Bilunarlíkön með controlled fixtures**, ekki bíðaeftirraunlokun/hættuveðri: closure/roadwork/othernotice,unknown/stale/partialroad+forecast/providerfail,out-ofwindowUTC,seinkaðoldresponse. Endurnýta parsedhelperfixtures og núverandi próf. Ef nauðsynlegt vantarexactdelayedidentityrace úr#503, eitt lítið focusedcomponentpróf leyft; ekki byggja matrixframework. Engin providerfailure eða „falsklokun“ skrifuð í raungagnakerfi.
3. **Lengsta leið:** varðveitt#503ring-optionsproof max18points/≈1236km/nochunk19536B og pervariantcache3calls/reverse6 er fyrra mælt evidence. Sannreyna runtimehámark/routeidentity ífocusedprófi og raunUI18cardflow núna; ekki endursækja öll8+16forecastproofs aftur. Warmrequestrepeats verða0upstream ef withinTTL íunitprófi. Heildcold117 er reikningur, ekki SLA. Ef nýrealrequest mæld, skráskipt frá gömluproof.
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

---

## Jonesy review — umferð 1 (2026-11-24)

**Niðurstaða: PROMPT_REVIEW — samþykkjanlegt með bindandi P1–P7. Umfang, STOP-reglur og „PASS aðeins fyrir núverandi MVP“ eru réttar og ég bæti engu við umfangið. Fjórar staðreyndir í promptinu standast ekki eða eru óljósar þegar ég prófa þær á kóða og gögnum: (1) 30-kalla kvótinn er nánast eyddur af áætluðum sýnum og „0 aukakall innan TTL“ gildir aðeins í 5 mínútur; (2) „runtime-hámark 18“ er hámark frystra gagna, ekki kóðatakmark; (3) 56-staða skráin geymir ekki Flókalund og kallar Rauðavatn „Reykjavík“, og `connectionStatus` í henni segir enn „engin staður routable“; (4) öfug norðurleið Selfoss→Rauðavatn er 15 punktar, ekki 18.**

**Merking:** *sandbox (mitt)* = Linux/Node v22, afrit af repo-skrám (m.a. `cache.js`, `winter-route-data.js`, `winterRoutePlaces.js`, `server_data/winter-route-places.json`, `offline-matrix.json` úr ring-options og ring-completion), kóðalestur og útreikningar; engin net-köll. *Ekki gert af mér:* vafri/Windows/ESLint/build/git, CI, GitHub #504/#493 (ég las þau ekki; 13 skilyrði #493 get ég því ekki staðfest), skjálesari; CC er ekki byrjaður.

### Sandbox-staðfesting á forsendum prompt

- **Þekjutölur standast:** `WINTER_ROUTE_PLACES` = 11 staðir, 5 hringur (`reykjavik-raudavatn`, `selfoss`, `hella`, `egilsstadir`, `seydisfjordur`) + 6 Vestfirðir (`budardalur`, `flokalundur`, `isafjordur`, `holmavik`, `patreksfjordur`, `talknafjordur`). C(5,2)=10 hringpör + C(6,2)=15 Vestfjarðapör = 25 tengd; 5×6=30 blönduð; 11 staðir ⇒ 55 möguleg. Samræmist closure-assessment og parity-prófi.
- **Valkostir (úr `ring-options/evidence/offline-matrix.json`, 8 raðir):** R→Selfoss south 3 punktar/45,0 km; **north 18 punktar/1236,0 km; Selfoss→R north 15 punktar/1236,2 km**; R→Hella south 3/80,7 km (báðar áttir); north 17/1200,4 km (báðar áttir). 18 er hámarkið meðal ring-options-átta (og prófin kalla það „the production maximum“); ring-completion-áttir eru allt að 16. Vestfjarðapörin endurtalði ég ekki nú. Prompt-liður „skipta hratt úr 18-punkta north í 3-punkta E–Sey“ passar við R→Selfoss north.
- **Cache-lyklar:** hver lykill hefur eigin færðar- og spáfötu (`cache.js`: færð TTL 5 mín, spá 15 mín, per einstakt `routeId`, í minni hverrar instance). Lyklar: ring-options `…ring:{from}|{to}|{option}|{geometryId}` (**stefnubundinn**), ring-completion `…ring-completion:{from}|{to}|{geometryId}|{datasetVersion}` (**stefnubundinn**), Vestfirðir `…:{from,to raðað}` og Búðardalur↔Hólmavík fastur lykill (**deilt í báðar áttir**). Kalt lykill kostar 3 köll (2 færðarfeedar + 1 spá), eins og í fyrri lotum.
- **Engin kóðatakmörk á punktafjölda:** `winter-route-data.js` og `forecastFetch.js` hafa hvorki hámarksfasta né skiptingu í hluta; 18 er afleiðing frystra gagna og er aðeins fullyrt í prófum fyrir R→Selfoss north (`ringOptionsRoute.test.js` „the production maximum“, `winter-route-data.test.js` 18 punktar).
- **56-staða skráin (`server_data/winter-route-places.json`):** 56 staðir; **10 af 11 UI-id eru í henni, `flokalundur` er það ekki** (þ.e. UI-listinn er ekki undirmengi 56 og 46 af 56 eru ekki valhæfir). `reykjavik-raudavatn` heitir þar „Reykjavík“ (UI sýnir „Reykjavík (Rauðavatn)“), svo samsvörun á nafni sleppir honum ranglega. Öll 10 hafa `connectionStatus.state = ACCESS_POINT_SELECTED_ACCESS_UNCONFIRMED`; haus skráarinnar segir enn „No place is routable/supported yet“ og „54 staðir hafa valinn aðkomupunkt, 2 óvalin“.
- **Eldri mælingar (mínar, fyrri lotur, ekki ný keyrsla fyrir #504):** API/geometry-prófin 358/358 og `WinterRoute.test.jsx` 126/126 + `winterRoutePresentation.test.js` 15/15 (source-time). Eldra #502 fókuspróf flöktir (1 af 6) — þekkt, ekki frá #504.

### Bindandi atriði

**P1 — Fyrirfram skráð kallabókhald; kvótinn er 27 af 30 með engum afgangi fyrir endurtektir.** Áætluð sýni kosta, miðað við lykla hér að ofan: R→Selfoss south, north og Selfoss→R north (3 lyklar), R→Hella south og north (2), E→Sey og Sey→E (2, stefnubundið), Búðardalur↔Hólmavík (1, báðar áttir deila fötu), Selfoss↔Hella (1) = **9 lyklar × 3 = 27 köll**; Hella→Selfoss eða aðrar áttir bæta við 3. Frekar en „núll aukaköll ef hægt“ krefst ég: (a) CC skrái *áður en fyrsta raun-kall er gert* töflu lykill → væntanleg köll → röð, og haldi sig við hana; (b) endurheimsókn sama lykils kostar 2 köll (færð) eftir 5 mín og 3 eftir 15 mín, svo „skipta hratt úr 18-punkta north í E–Sey“ og „swap til baka“ verða að gerast innan 5 mín frá fyrri heimsókn lykilsins eða teljast kald; endurhlaðning/zoom/skjáskot-endurtaka teljast líka; endurræsing `vercel dev`/hot-reload á `api/` núllstillir cache og telst kalt; (c) talning úr svörum án bakendabreytingar: `roadMeta.cacheAgeMs === 0` ⇒ 2 köll, `forecast.cacheAgeMs === 0` ⇒ 1 kall (efri mörk — 0 sést líka þegar fetch deilist í flugi og þegar hluti er `available:false`); (d) þegar talan nær 30 ⇒ STOP á netprófun og afgangur kemur úr preserved evidence/prófum. Skrá fjölda raun-kalla í `cc-report.md` og hver þeirra var kalt vs endurtekið.

**P2 — Væntigildi fyrir fyrsta raunsýni, ekki bara „eitthvað birtist“.** Fyrir hvert sýni skrái CC fyrirfram úr retained gögnum og beri svo saman: R→Selfoss south 3 punktar/≈45,0 km; north 18/≈1236,0; **Selfoss→R north 15/≈1236,2 (ósamhverf — ekki spegla 18)**; R→Hella south 3/≈80,7; north 17/≈1200,4 (báðar áttir 17); E↔Sey 3 punktar, bil ≈13,5 km (úr ring-completion matrix, 24,1 km leið); Selfoss↔Hella 2 punktar, bil 35,6 km (þynnsta þekja sem tengd er — merkja „mjög þunn“ í skýrslu, ekki galla); Búðardalur↔Hólmavík 4 punktar (úr source-time skjáskoti). Frávik er niðurstaða (REVISE/BLOCKED samkvæmt STOP), ekki leyfi til að uppfæra tölu í skýrslunni.

**P3 — Þekjuskráin: samsvörun eftir id, og 56-skráin er ekki þekjuheimild.** (a) `coverage.json` gerð úr `WINTER_ROUTE_PLACES` + flokkun para (`winterRoutePairParity.test.js`/parity-logic) + raun-handlerum offline, samsvörun **eftir id** (nafn gefur falska villu á `reykjavik-raudavatn`). (b) Skýrsla segir beint: 10 af 11 UI-staðanna eru í 56-skránni, **Flókalundur er utan hennar**, 46 af 56 eru ekki valhæfir (óútgefin/frestuð þekja), 30 blönduð pör ótengd, 3 junction-pör utan UI. (c) `connectionStatus`/haustexti í `winter-route-places.json` („No place is routable/supported yet“) er *staða aðkomupunkts*, ekki þekja og er úreltur sem lýsing á þekju; coverage.json má **ekki** lesa routable-stöðu úr honum. Gögnin eru ekki breytt í #504 (umfang); skrá sem þekkt skjalaskekkja og eigandaákvörðun. (d) Öll 10 staðirnir bera „akstursaðgengi óstaðfest“ (EXACT_GAP) — sama takmark og UI sýnir; fer í takmarkalistann.

**P4 — „Runtime-hámark 18“ orðist rétt og prófist þar sem það hefur merkingu.** Segja í skýrslu: *hámark frystra gagna er 18 punktar (R→Selfoss north); engin kóðatakmörk eru til og engin skipting í hluta*. Liður 3 leyfir eitt lítið focused próf: yfir allar 50 áttir með raun-geometry- og data-handlerum (stubbuð upstream) staðfesta `max(points) ≤ 18`, að hvert svar beri rétt auðkenni (`regionVersion` / `selectedOption`+`datasetVersion`+`policyVersion` / `datasetVersion` eingöngu) og að endurtekið kall innan TTL gefi 0 upstream-köll (cache.test.js getur nægt fyrir hið síðasta). Ekki fullyrða „hámark varið“ nema slíkt próf sé raunverulega skrifað og keyrt.

**P5 — PASS-skilgreining fyrirfram, skrifuð með umfangi í sömu setningu.** „PASS“ fyrir 11 staða MVP þýðir: öll raunsýni (P2) stemma við væntigildi eða hafa útskýrt frávik; focused próf (ein skráð skipun + fjöldi) græn; `npm run lint`/`build` græn eða með óskyldum villum nefndum sérstaklega; NOT_TESTED/NOT_VERIFIED (skjálesari, CI, production) eru skráð sem eigandaskref og blokka ekki PASS **nema** prompt kallar þau blocker. Hver PASS-setning í `release-report.md` ber „fyrir 11 staða/25 para MVP, ekki #493“ — ekki í fyrirsögn einni. Runtime-villa ⇒ STOP, REVISE/BLOCKED og tilkynna eiganda áður en app-kóða er breytt (prompt segir þetta þegar).

**P6 — #493-taflan: 13 skilyrði orðrétt, ekki endursögð.** Ég get ekki staðfest töluna 13 (las ekki #493). CC skrái heimild (live issue með dagsetningu, eða `docs/ai/tasks/ticket-500/nationwide-owner-scope.md` ef GitHub er ekki tiltækt) og afriti skilyrðin orðrétt; ef orðréttur listi fæst ekki ⇒ merkja töfluna BLOCKED_ON_INPUT en ekki endursmíða hana eftir minni. Línan „báðar leiðir um Hringveg“: aðeins R–Selfoss og R–Hella (2 pör, 8 afbrigði) hafa south/north; R–E og R–Sey hafa eingöngu norðurleið; engin „öll pör með tvöfalda leið“ fullyrðing.

**P7 — Sönnunargögn sem hægt er að sannreyna.** (a) 200% zoom á að vera raunverulegur vafrazoom; skrá `window.devicePixelRatio` og `window.innerWidth` fyrir/eftir (zoom 200% á skjá með DPR 1 ⇒ DPR 2 og helmingað `innerWidth`), annars NOT_TESTED. (b) Hver mynd skráð með raun/stubbað, vafri, upplausn, zoom, tungumál, tímastimpil; skjáskot sýna lokastöðu, seinkað „race“ kemur úr prófi. (c) Engin gömul e2e-spec sem skrifar yfir #502/#503 myndir (prompt segir þetta); allar nýjar myndir aðeins í `ticket-504/evidence/` og ekkert eldra skrifað yfir. (d) Skrá `git rev-parse HEAD`, fjölda skráa í `git status --short` og hvaða hluti #499–#503 er í HEAD vs aðeins í working tree; CI-niðurstaða gildir aðeins um nákvæmlega þann SHA og er NOT_VERIFIED fyrir óskuldbundnar breytingar.

### Athugasemdir (S, ekki bindandi)

**S1 — Prompt-orðalag „Skipta hratt úr 18-punkta north í 3-punkta E–Sey“** reynir race-skilyrði að hluta en raunvafri getur ekki skapað *seinkað* gamalt svar; prompt segir það þegar (race úr prófi). Skrá í skýrslu hvaða próf í `WinterRoute.test.jsx` ber þá sönnun (CC bendir á nafn og keyrslufjölda), frekar en að nota „race“ sem almennt orð.

**S2 — Óháður viðmiðunarpunktur fyrir tölurnar.** Mínar fyrri keyrslur: API/geometry 358/358, `WinterRoute.test.jsx` 126/126, presentation 15/15. Þær eru fyrri athuganir í öðru umhverfi; CC leggi þær ekki saman við sínar og skrái sína eigin skipun og fjölda.

**S3 — Selfoss↔Hella og E↔Sey eru mjög stutt pör (35,6 og 24,1 km, 2–3 punktar).** Rétt val sem „bein/stutt“ sýni; þunn punktþekja er skráð takmark #503, ekki #504 galli.

**S4 — Ekki endurtelja.** 56-skráin og 3 junction-pör eru þegar skráð í closure-assessment/remaining; #504 skýrslan vitni í þær frekar en að endurtelja allt.

### Mörk þessarar yfirferðar

- Engin net-köll (Vegagerðin/Open-Meteo/GitHub), enginn vafri, Windows, ESLint, build eða `git`; ég las hvorki #504 né #493 (13 skilyrðin og „lifandi“ efni eru ósannreynd af mér) og sá ekki CI-stöðu.
- Allar tölur hér eru úr afritum mínum af repo-skrám og kóðalestri; kallatalning (3 köll/lykill, TTL) er úr kóða og fyrri stubbuðum keyrslum, ekki úr raun-veitu.
- Ég breytti engum kóða; CC byrjar ekki fyrr en `READY_FOR_CC` og „Prompt approved“ frá eiganda.
- Engin umferð 2 nema eigandi biðji.

**Næsta:** Ripley sker `approved-prompt-v1.md` með P1–P7 (kallabókhald og væntigildi fremst), eigandi samþykkir og CC fær verkið.


## Ripley afhending — 2026-11-24

Jonesy samþykkiP1–P7 varðveitt óbreytt í approved-prompt-v1.md. Kallabókhald/væntigildi fremst:9lyklar27coldcalls/max30,TTL5/15mín,raunswap/endurheimsókn talinrétt.18=frystgagnahámark,ekkiinnbyggðurguard;P4offlineprófheimilað. ÞekjaID-based10af11í56/Flókalundurutan/46frestaðir. ScopedPASSfyrir11/25MVPekki#493,raunzoom/CIshaheiðarleiki. Stage READY_FOR_CC;eigandi→CC„Prompt approved“. Enginapp/net/commit/push/deploy/GitHubwrite.

# Ripley — umferð 2, #504: aðeins fersk vafraprófun

Dagsetning: 2026-11-24. Eigandi svaraði „Já heimilt“ við nýjum hámarki 30 veitukalla fyrir eina stutta vafralotu. Þetta afléttir kvótabið, ekki heimild til CI-lagfæringa eða app-breytinga. Fyrri approved-prompt-v1 er óbreytt söguleg heimild; þessi viðbót bíður Jonesy-samþykkis áður en approved-prompt-v2 er gefið út.

## Verk fyrir CC eftir samþykki

Ljúka aðeins ferska UI-hlutanum sem vantaði í fyrri afhendingu #504. Endurnýta gögn/API/offline próf og lint/build úr fyrri skýrslu ef kóði hefur ekki breyst. Ekki endurtaka 957 próf, byggja nýtt prófakerfi eða laga CI. Lesa README/CURRENT, núverandi result-review, release-report og call-accounting fyrst. Varðveita fyrri niðurstöður með dagsettri viðbót.

Fyrsta raunathugun skal vera í vafra: frá Frá/Til vali Egilsstaðir→Seyðisfjörður að 3 punkta niðurstöðu (24,1 km, gloppa um 13,5 km). Engin curl-prófun eða sérstök provider-probe fyrst. Nota núverandi dev-umhverfi, heimilt að ræsa venjulegar project-dev skipanir ef þarf, engar env-breytingar eða lyklar í úttaki. Mest tvær venjulegar tilraunir ef umhverfi bregst, svo skrá raunástæðu.

Fyrir fyrsta data-fetch: nýtt task-local kallabókhald, aðskilið frá fyrri 30/30. Telja hverja /api/winter-route-data beiðni fyrirfram sem 3 cold-call-equivalent, þar með reload, mode/hour/option/swap breytingar og sjálfvirkar endurtekningar; ekki gera ráð fyrir warm-cache í vercel dev. Virkt neteftirlit frá áður en síða opnast, ekkert nýtt data-fetch þegar minna en 3 er eftir. Hámark 10 data-beiðnir / 30 cold-call-equivalent; við mörk STOP net. Geometry/assets teljast ekki veituköll. Engar diagnostic-endurtekningar eða raunveitu-bilanaprófanir. Ef ekki er hægt að halda bókhaldinu öruggu, stoppa frekari lifandi gagnabeiðnir og skrá óprófað.

Forgangsröð: (1) E→Sey úr UI; (2) Rauðavatn→Selfoss north, 18 punktar/um 1236,0 km; skoða allt 18 spjalda flæðið; (3) raunverulegur 200% browserzoom á vali og niðurstöðu, skrá actual zoom-action og fyrir/eftir devicePixelRatio/innerWidth, ekki CSS transform; (4) lyklaborðsflæði með vali, skiptingu, submit, option-arrow og fókus eftir því sem raunverulega er hægt innan kvóta; (5) skipta aftur í E→Sey, tryggja að ekki séu gömul 18 spjöld undir nýjum haus, og swap Sey→E ef kvóti leyfir. Fyrirfram áætla sjálfvirk fetch vegna vals/submit eftir núverandi UI; ekki gera ráð fyrir einni beiðni á skref. Afmarkað mobile 360px og IS/EN með núverandi niðurstöðu ef hægt án endurhleðslu; telja annars köll. Ekki bæta öðrum leiðum við; þær hafa fyrri sannanir. Samastað/óstuddu pari má athuga án data-fetch. Tímasetningarace er staðfest með fyrri prófum, skjáskot sýna aðeins lokastöðu.

Nýjar myndir aðeins í ticket-504/evidence/browser-followup/, með raun/stub, browser, viewport, zoom, tungumáli og tíma skráðum. Engin gömul mynd yfirskrifuð. Raunskjálesari aðeins ef þegar tiltækur, annars NOT_TESTED. Ekki fullyrða öll UI-atriði PASS ef aðeins hluti var prófaður.

Uppfæra cc-report og release-report með dagsettri viðbót: nýtt prófað, retained og NOT_TESTED skýrt aðgreint; call ledger; nákvæm sýni/niðurstöður og myndatilvísanir. Leiðrétta ofmat identity-prófs (resolver-reitur, ekki bann við blöndu í raunhandler); CI er fyrirliggjandi rautt, tvær Winter Route prófbilanir og sér affiliate-bilun. Enginn CI-rerun, timeout/hash-fix eða víðari skjalaendurgerð. Niðurstaða aðeins fyrir 11 staða/25 para MVP, ekki landsþekju #493; #492 utan.

Raunveruleg runtime-villa: skrá repro/áhrif/minnstu lausn, stoppa háð PASS og tilkynna eiganda áður en app-kóða er breytt. Engin ný dependency, provider, framleiðsluprófun, commit/push/deploy/GitHub-write/lokun. Stoppa þegar þessi vafrasannprófun er búin; engin sjálfvirk viðbótarlota.

Eftir samþykki Jonesy gefur Ripley út approved-prompt-v2. CC fylgir READY_FOR_CC→CC_IN_PROGRESS→CC_COMPLETE og skrifar viðbót við cc-report; result-review saga varðveitt. Jonesy yfirfer aðeins þessa viðbót, ekki opna aftur fyrri samþykkt atriði án nýs raunblocker.

---

## Jonesy review — umferð 2 (2026-11-24)

**Niðurstaða: PROMPT_REVIEW — umferð 2 viðbót Ripley er samþykkjanleg með bindandi P1–P5. Umfangið (aðeins ferskt UI, 10 gagnabeiðnir/30 köll, engin CI-/app-breyting, engin curl-diagnostic) og leiðréttingarnar á identity-prófi og CI-orðalagi eru réttar. Ég breyti engu í umfangi. Þrennt þarf að binda svo lotan nái markmiði sínu: (1) kostnaður hvers UI-skrefs er ekki einn heldur ræðst af kóðanum — Rauðavatn→Selfoss *north* kostar 2 beiðnir, ekki 1, og flipaskipti í „Fastar veðurleiðir“ kallar á annan endapunkt sem ekki er í bókhaldinu; (2) enginn teljari/tól er skilgreint sem getur samtímis talið beiðnir, gert raunverulegan vafrazoom og lesið `devicePixelRatio`/`innerWidth`; (3) væntigildi fyrir UI-textann vantar.**

**Merking:** *sandbox (mitt)* = Linux/Node v22, kóðalestur á `WinterRoute.jsx` og `winter-route-geometry.js` og útreikningar úr `ring-options/evidence/offline-matrix.json`; engin net-köll né vafri. *Ekki gert af mér:* vafri/Windows/ESLint/git, CI, GitHub, `vercel dev`; CC er ekki byrjaður. Ég yfirfer aðeins þessa viðbót, ekki fyrri samþykkt atriði (eins og Ripley mælir fyrir um).

### Sandbox-staðfesting úr kóða

- **Hvað hvert UI-skref kostar í gagnabeiðnir** (`WinterRoute.jsx`, „Velja staði“): síðuopnun 0 (legacy-fetchið er hliðað á `mode === WINTER_ROUTE_MODE_LEGACY`; geometry-beiðni er ókeypis, offline samsetning); *Sýna leið* ⇒ geometry (frítt) ⇒ **eitt** `/api/winter-route-data` (effectið er varið gegn StrictMode-tvöföldun með `lastDataKeyRef`); *swap* breytir aðeins drögum (`handleSwap` kallar ekkert; niðurstaðan hverfur þar til *Sýna leið* er ýtt aftur, því `isDataEligible` krefst `draftMatchesApplied`) ⇒ 0 + 1 við submit; *valkostaval* (ör/val í radiogroup) ⇒ ný geometry + **ný** gagnabeiðni (`handleSelectOption` ⇒ `runRequest(…, optionId)`); *tímaval* ⇒ 0; *tungumálaskipti/zoom/viewport* ⇒ engin fetch í kóðanum (ég hef ekki mælt í vafra).
- **Sjálfgefinn valkostur er sá styttri:** geometry-handler velur `south` ef `south.lengthM <= north.lengthM` (línur 1203–1206). Fyrir Rauðavatn→Selfoss og Rauðavatn→Hella er sjálfgefið því **south**. Til að sjá 18 spjalda north-sýnina þarf *Sýna leið* (south: 1 beiðni) og svo valkostaval (north: 1 beiðni) = **2 beiðnir, 6 köll**, ekki 3.
- **Flipinn „Fastar veðurleiðir“** kallar `/api/winter-route` (annar endapunktur, sem sækir líka færð + spá hjá veitum) fyrsta sinn sem hann er virkjaður fyrir hvert `routeId`. Bókhald sem telur aðeins `/api/winter-route-data` sleppir honum.
- **Afbrotin beiðni kostar samt:** `abort()` á biðlara hættir ekki þjóninum sem þegar er byrjaður að sækja; hröð skipti á meðan svar er í vinnslu eyða köllum.
- **Væntigildi bils úr offline-matrix (chainageKm, ring-options):** R→Selfoss south 3 punktar, stærsta bil 25,1 km; **north 18 punktar, 101,8 km**; Selfoss→R north 15, 111,4 km; R→Hella south 3, 55,6 km; north 17, 101,8 km. E↔Sey: 3 punktar, bil 13,5 km (milli Fjarðarheiði-punkts og Seyðisfjarðar; úr fyrri yfirferð og `coverage.json`). Lengdir ≥ 400 km (R→Selfoss/Hella north) eiga að sýna „langleið“-athugasemdina.

### Bindandi atriði

**P1 — Kallabókhald úr kóða, ekki úr ágiskun.** Fyrirfram skráð tafla (aðgerð → væntar gagnabeiðnir → köll) með eftirfarandi kostnaði: síðuopnun 0; *Sýna leið* 1; ring-option par byrjar alltaf á `south` (1) og valkostaval í north/south er 1 í viðbót; swap 0 en síðan *Sýna leið* 1; tímaval 0; zoom/viewport/tungumál 0 (staðfest með teljara, ekki gert ráð fyrir). **Tillaga að röð (7 af 10 beiðnum, 3 til vara):** (1) E→Sey [1]; (2) R→Selfoss [south 1] + valkostaval north [1] = 18 spjöld [samtals 3]; (3) *strax* skipta í E→Sey [1] til að sanna „engin gömul 18 spjöld undir nýjum haus“ [4]; (4) swap Sey→E + *Sýna leið* [5]; (5) lyklaborðsflæði R→Hella: submit [south 1] + ör í north [1] [7]; zoom/mobile/EN eru skoðuð á þeim niðurstöðum sem þegar eru á skjá (0). Bíða eftir að hver beiðni klárist áður en næsta aðgerð er gerð (afbrotin beiðni kostar samt). **Ekki** smella á „Fastar veðurleiðir“; geri CC það óvart skal það skráð sem `/api/winter-route` og talið 3 köll. Engin diagnostic-endurtekning, engin „til að sjá warm-hit“.

**P2 — Teljari sem telur allar `/api/*` beiðnir, og tól valin fyrirfram.** Skrá fyrir fyrstu gagnabeiðni hvaða tól gerir eftirfarandi þrennt, og hvað ekki: (i) telur beiðnir (slóð, `option`, tímasetning) frá því áður en síðan opnast; (ii) framkvæmir raunverulegan vafrazoom (OS-/vafra-stig, Ctrl/Cmd +, sýnileg „200%“ í vafra) — **ekki** page-injected lyklaborðsatburður, CDP-/Playwright-`deviceScaleFactor`, viewport-breyting eða CSS-zoom (Ripley útilokar þetta rétt); (iii) les `devicePixelRatio`/`innerWidth` fyrir og eftir í sömu lotu. Ef ekkert eitt tól gerir allt, skrái CC hvaða mælingu vantar (t.d. „zoom raunverulegur, tala ekki mæld“ eða „tala mæld, zoom ekki raunverulegur ⇒ NOT_TESTED“) og blandi ekki aðferðum. Hver sýnileg `/api/*` beiðni er flokkuð (frí: `winter-route-geometry`, `me` o.þ.h.; talin: `winter-route-data` ×3; talin: `winter-route` ×3) og talan í skýrslu kemur úr teljaranum; `cacheAgeMs === 0` er aðeins aukaathugun. Ef teljari er ekki virkur ⇒ engin gagnabeiðni (Ripley segir þetta þegar).

**P3 — Væntigildi fyrir UI-texta, skráð áður en sýni er tekið.** Fyrir hvert sýni skrái CC væntanlega: fyrirsögn „Veður á N punktum“ (N: E→Sey 3; R→Selfoss south 3 / north 18; R→Hella south 3 / north 17), stærsta-bils-línu (E↔Sey 13,5 km; R→Selfoss north ≈101,8 km, Selfoss→R north ≈111,4 km; viðmið úr matrix með ±0,5 km þol því UI notar `approxDistanceFromStartKm` úr svari), „langleið“-athugasemd á north-leiðum og engin á E↔Sey, og að fjöldi `ForecastCard` jafngildi N. Frávik er niðurstaða (REVISE/BLOCKED eftir STOP-reglum), ekki leyfi til að uppfæra töluna í skýrslu. „Ekkert gamalt undir nýjum haus“ sannast með því að spjöld eftir skiptin séu nákvæmlega 3 og fyrirsögnin „3 punktum“, auk þess sem seinkað *race* kemur áfram úr prófum (ekki skjáskoti).

**P4 — Skýrsla: dagsett viðbót, þröngt verdict, óbreytt saga.** `cc-report.md` og `release-report.md` fá dagsetta viðbót („umferð 2, vafralota“) með: ferskt prófað vs retained vs NOT_TESTED/NOT_MEASURED í aðskildum listum; call ledger úr teljara (P2) með röð, beiðni og kostnaði; hver mynd skráð með raun/stub, vafra, viewport, zoom, tungumál, tímastimpil og slóð í `ticket-504/evidence/browser-followup/`; `git status --short` fyrir og eftir (aðeins ný skjöl/myndir leyfð). Verdict-línan má aðeins nefna það sem raunverulega var prófað (t.d. „UI-flæði PASS fyrir E↔Sey og R→Selfoss north, zoom NOT_TESTED“) og ber „fyrir 11 staða/25 para MVP, ekki #493“ í sömu setningu. Fyrri hluti skýrslu og saga helst óbreytt; leiðréttingar á identity-prófi (resolver-reitur, ekki bann við blöndu í raunhandler) og CI („fyrirliggjandi, 2 af 3 tengjast Winter Route“) fara í viðbótina eins og Ripley mælir fyrir um.

**P5 — STOP-reglur og mörk.** Raunveruleg runtime-villa ⇒ skrá repro/áhrif/minnstu lausn og STOP áður en app-kóða er breytt; engin CI-/hash-/timeout-lagfæring, ekkert endurkeyrsla 957 prófa, engin ný dependency; ef umhverfi bregst (ræsing `vercel dev`/Vite) gilda áfram mest tvær venjulegar tilraunir, síðan skráð óprófað. Hver slík tilraun sem endar í gagnabeiðni telst með í kvótanum. Engin gömul mynd yfirskrifuð; engin mynd utan `browser-followup/`.

### Athugasemdir (S, ekki bindandi)

**S1 — „Reload“ kostar 0 gagnabeiðnir** í „Velja staði“ (síðan geymir ekki valið par), svo endurhleðsla sjálf er frí; nýtt submit eftir hana kostar 1. Ripley telur reload sem 3 og það er öruggt, en það þarf ekki að forðast reload til að spara kvóta.

**S2 — Tungumála-/viewport-skipti** í hinni þegar sýndu niðurstöðu eiga ekki að kalla á gagnabeiðni samkvæmt kóðanum; teljarinn staðfestir það og niðurstaðan er sjálf gagnleg sönnun (0 aukakall) frekar en áhætta.

**S3 — Röð 4 í P1 (swap Sey→E) staðfestir röðun beggja áttir** (bil 13,5 km kemur fyrst í öfugri átt, sjá `coverage.json`); texti bilsins ætti að nefna punktana í öfugri röð.

**S4 — Skjálesari er áfram NOT_TESTED** nema raunverulegur skjálesari sé þegar til staðar; AX-tré/jsdom-hlutverk er ekki skjálesari.

### Mörk þessarar yfirferðar

- Engin net-köll, vafri, `vercel dev`, Windows, ESLint, `git` eða CI; ég las ekki GitHub. Allar tölur (kostnaður skrefa, væntibil) eru úr kóðalestri og offline-matrix, ekki úr vafrakeyrslu.
- Ég breytti engum kóða; CC byrjar ekki fyrr en `READY_FOR_CC`, approved-prompt-v2 og „Prompt approved“ frá eiganda.
- Ég yfirfer aðeins viðbótina; engin ný umferð nema eigandi biðji.

**Næsta:** Ripley gefur út `approved-prompt-v2.md` með P1–P5, eigandi samþykkir og CC framkvæmir aðeins ferska UI-lotu; Jonesy yfirfer viðbótina þegar CC er búinn.

## Ripley afhending umferðar 2 — 2026-11-24

Approved-prompt-v2.md gefið út með bindandi P1–P5 orðréttum og forgangi yfir grunnviðbót. Fyrirfram 7 beiðnir/21 köll + 9 til vara; all-api teljari áður en síða opnast, enginn legacy-flipi, raunzoom á 18 spjalda niðurstöðu og síðan 18→3 skipti. CURRENT READY_FOR_CC, approved-v2. Eigandi sendir CC: Prompt approved. Engin ný veituköll eða framkvæmd hér.
