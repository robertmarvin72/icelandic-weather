# #501 — Vegur 93 MVP — approved prompt v1 — 2026-11-18

Jonesy APPROVED með bindandi P1–P4, engir blockerar. P1–P4 hér neðar eru óbreytt afrit og ganga framar Round 1 þar sem nákvæmari. Sögulegur pending-review texti Round 1 er afgreiddur með þessum haus. Framkvæmd eftir eiganda „Prompt approved“, CURRENT READY_FOR_CC og pointer hingað; CC_IN_PROGRESS áður en byrjað er, CC_COMPLETE eftir skýrslu.

## Afmörkun fyrir framkvæmd

Núverandi raunhandler virkar samkvæmt sandbox í báðar áttir. Byrja á eigin grunnlínukeyrslu; ef hún stenst eru afhendingarnar aðeins eitt til tvö focused handler-próf, task-local kort og stutt skýrsla. Enginn production-kóði, policy, gögn eða pinnuð hnit breytast. Ef raunbilun kemur í ljós, STOP samkvæmt P1 og lýsa henni í stað ósamþykktrar lagfæringar.

Viðmið Jonesy: 24 148,860881 m, fjórir bútar 2344/3410/3409/2894 og öfug röð í bakaleið. Full geometry-ID eru í sandbox-töflu yfirferðar og má pinna eftir eigin keyrslu: austur e79c0f7e8237d6c2ecd910771b8b8bda, vestur 3f67cfaa1ab61fd70a7dccfaf0ebbac0. Þetta eru viðmið, ekki eigin staðfesting CC. Engin ferð áfram á 2892/2891 að höfn.

Venjulegur undirected API-samningur helst; MVP-forsenda um tvístefnu kemur í skýrslu/kort, ekki nýr API-lykill. Lengdin er milli pinnuðu endapunktanna, ekki bæjarmiðja til ferjubryggju. Ekkert nýtt kerfi eða valfrjálsar lagfæringar úr öðrum lotum. Kort á nýju loopback-porti með réttu tile-URL/Referer/attribution; sjónræn staðfesting aðeins ef kort var raunverulega skoðað. Stoppa þegar afmörkuð afhending er tilbúin.

## Samþykkt Round 1

# #501 — Egilsstaðir ↔ Seyðisfjörður um veg 93 — MVP Round 1 — 2026-11-18

## Markmið og heimild

Eigandi bað um næsta skref eftir samþykktan Rauðavatn↔Hella MVP. Staðfesta og afhenda beina leið Egilsstaðir↔Seyðisfjörður um veg 93 í báðar áttir, án gervihringferðar. Þetta par virkar þegar í geometry API í aðra átt og kjarnapróf festa beina keðju; EKKI búa til nýja innleiðingu þar sem núverandi lausn dugar. Þessi lota er focused lokastaðfesting parsins og sýnileg kortaafhending, ekki ný leiðarvél eða almenn stefnu-/valkostaarkitektúr.

Prompt-review til Jonesy, ekki framkvæmdarheimild. CC keyrir approved prompt eftir eiganda Prompt approved og CURRENT READY_FOR_CC; CC_IN_PROGRESS áður, CC_COMPLETE með skýrslu eftir.

## Lesa / það sem þegar er til

AGENTS/CLAUDE/README/CURRENT; api/winter-route-geometry.js og próf; geometryComposition.js/próf (E1→S2 og reverse), geometryDataset.js og server_data/winter-route-geometry-pilot.json; raudavatn-hella-mvp/result-review.md og map-view.html sem fyrirmynd. Retained road93 raw/place_nodes aðeins ef þarf til að staðfesta beinu keðjuna; engin skyldulesning allra eldri rannsókna.

Pinned endpoints: Egilsstaðir E1 (715153.74,536679.93), Seyðisfjörður S2 (732875.674,538207.0762), samkvæmt runtime dataset. Núverandi E1→S2 próf: 2344→3410→3409→2894, um 24 148,861 m; 2892/2891 eru handan S2 að höfn og eiga ekki að bætast við. Tölurnar eru retained viðmið, CC staðfestir raunverulegt handler-svar í báðar áttir.

## Minnsta framkvæmd

1. Byrja á raunverulegum handler í báðar áttir með óbreyttum gögnum. Venjulegur vegur 93 meðhöndlaður sem tvístefna í þessari MVP-lotu. Ef báðir ferlar eru réttir heldur núverandi undirected geometry-samningur sér: engin ný policyVersion/mode/estimated connector bara til samræmis við suðurleiðarpilotinn. Ekki víkka isRaudavatnSelfossPair eða beita Rauðavatns-connector/reglum á veg 93.
2. Bæta aðeins nauðsynlegri focused regression-staðfestingu ef handler-próf vantar fyrir báðar áttir. Prófa beina sourceId-keðju og öfuga röð/átt í bakaleið; pinned endapunkta, samfellda hnitakeðju, endurreiknaða lengd, stöðugt geometryId við sama inntak og mismunandi ID eftir ferðastefnu. Ekkert 2892/2891, enginn Hringvegur/Rauðavatns-connector eða óþörf lykkja. Sýna same_place/gagnagat með fyrirliggjandi prófum, ekki ný almennt test-framework.
3. Framleiða eina task-local map-view.html úr RAUNVERULEGUM handler-niðurstöðum með báðum áttum/litum og merktum endum. Endurnýta fyrri staðfestu hnitaumbreytingu og einfalda Leaflet-sýn, engin ný dependency eða product-UI. Nota localhost, canonical OSM tile-slóð, eðlilegan Referer og attribution; binda vefþjón við 127.0.0.1 og þjóna aðeins þessari task-möppu. Fyrri localhost-kort á 8765/8766 standa ótrufluð; velja lausan port.
4. Sjónræn skoðun: leið yfir Fjarðarheiði milli réttu endanna, engin ferð út fyrir Seyðisfjarðar-endapunkt að höfn, enginn hringkrókur. Ef CC getur ekki séð rendered kort, skrá það heiðarlega og afhenda virkan hlekk fyrir eiganda. Ekki krefjast nýrrar Vegagerðar-staðfestingar eða rannsókna sem forsendu.

## Prófun og afhending

Keyra focused geometry API/core/dataset/pilot-policy og eldri winter-route samningspróf sem verja núverandi ferla. Lint aðeins á snertum JS, git diff --check. Engin fullsuite/build, mutation/fuzz eða all-pair útvíkkun. cc-report.md stutt: hvaða hegðun var þegar til, hvaða próf eða lagfæring bættist við, raunmældar lengdir/keðjur, virkur kortahlekkur, prófniðurstöður og takmörk. Ekki framsetja óbreytta hegðun sem nýja leiðarvél.

Leyfðar breytingar: task-local gögn/kort/skýrslur/CURRENT og geometry API-próf; ef sýnd einföld raunbilun finnst má laga þröngt í geometry API innan parsins án áhrif á fyrri samþykkt pör. Runtime JSON/pinned hnit/pure-core/pilot-policy óbreytt; ef þau þurfa raunbreytingu, skila nákvæmri bilun og minnsta vali eiganda áður en umfang vex. Ef núverandi virkni stenst þarf enga production-kóðabreytingu.

Engin ný gagnaöflun, metadata-/heimildaleit eða skilaboð. Ekkert src UI, veður/færð, gamla winter-route API, cache, scoring, pricing, packages eða önnur ticket. Enginn commit/push/deploy/GitHub. drivingAccess helst UNVERIFIED, ekki turn-by-turn/öryggisfullyrðing.

Þessi lota afgreiðir beina veg93-parið, ekki báða Hringvegsvalkosti eða allt #501. Blocker verður að sýna ranga/ónothæfa raunleið eða brotið umfang. Valfrjáls hardening eða opinber staðfesting MVP-forsendna ekki blocker. Þegar raunparið í báðar áttir, focused próf og opnanleg sýn eru tilbúin, stoppa; engin sjálfvirk viðbótarlota.

## Bindandi Jonesy P1–P4 (óbreytt afrit)

**P1 — Grunnlína fyrst, engin production-breyting.** CC keyrir raunhandler í báðar áttir og ber saman við töfluna (lengd ±1e-6, slices, geometryId). Ef samsvörun: engin breyting á `winter-route-geometry.js`, `raudavatnSelfossMvpPolicy.js`, kjarna, dataset, JSON eða pinnuðum hnitum; `git status` á því sýnir aðeins próf, task-möppu og CURRENT. Breyting á production-kóða án sýndrar raunbilunar er umfangsbrot; ef bilun finnst: STOP og sýna nákvæma bilun + minnsta val (eins og promptið segir).

**P2 — Eitt til tvö focused próf, ekki ný prófaröð.** Bæta handler-prófi fyrir Seyðisfjörður→Egilsstaðir: slices nákvæmlega `[2894 r, 3409 r, 3410 r, 2344 r]` með vísitölum úr töflu, pinnaðir endar, samfelld keðja (`sumCoordinates` = `lengthM`), engin 2892/2891, **engir** `mode`/`policyVersion`/`estimatedConnectorLengthM` lyklar, sama lengd og austurátt. Í sama prófi eða öðru: geometryId stöðugt við tvö köll og **ólíkt** milli átta (pinna full gildi að ofan er heimilt en má líka vera `not.toBe`). Predicate-prófin (`isRaudavatnSelfossPair` = false fyrir bæði pör) eru þegar til; ekki afrita.

**P3 — Samningurinn helst „venjulegt undirected“; tvístefnuforsendan sést ekki í API.** Egilsstaðir↔Seyðisfjörður er EKKI í directed pilotnum og API-svarið ber hvorki `mode` né `OWNER_APPROVED_MVP_ASSUMPTION`. Það er rétt samkvæmt promptinu en þýðir að forsendan „veg 93 er tvístefna“ er hvergi merkt í svarinu. CC á að skrá hana í cc-report og hliðarglugga kortsins, ekki bæta lykli við API.

**P4 — Endapunktar og sjónræn heiðarleiki.** E1 = 2344 vertex 0 = hnútur þar sem 2344, 2345 og 2814 mætast, við 65,25862°N 14,39029°V (Hringvegur/veg 93 við Egilsstaði, ekki endilega bæjarmiðja); S2 = 2894 endi, við 65,26022°N 14,00953°V í Seyðisfirði (2892/2891 liggja áfram að höfninni og eru viljandi útilokuð). Lengdin 24,149 km er því *endapunktur-í-endapunkt*, ekki bæjarmiðja-í-ferjubryggju. CC segir þetta í skýrslu og merkir báða enda á kortinu. Ég sé ekki kort og fullyrði ekkert sjónrænt; CC skráir heiðarlega hvað var skoðað. Skoðunaratriði eiganda: leiðin fer yfir Fjarðarheiði milli réttu endanna, stoppar við S2 (ekki að höfn), enginn krókur. Nýtt port (ekki 8765/8766), bundið 127.0.0.1, aðeins task-mappa, canonical OSM-slóð.
