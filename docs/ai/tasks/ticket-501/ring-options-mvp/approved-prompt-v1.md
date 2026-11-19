# #501 — Hringvalkostir MVP — approved prompt v1 — 2026-11-18

Jonesy APPROVED með bindandi P1–P7, engir blockerar. Óbreytt afrit P1–P7 hér neðar gengur framar Round 1 þar sem nákvæmari. Sögulegur pending-review texti Round 1 er afgreiddur með þessum haus. Eigandi hefur sérstaklega staðfest að north sé langi boginn um Borgarnes/Blönduós/Norðurland/Austurland/suðurströnd að Selfossi, south sé stutta Hellisheiðarleiðin; báðar ferðastefnur. Framkvæmd eftir eiganda „Prompt approved“, CURRENT READY_FOR_CC og pointer hingað; CC_IN_PROGRESS áður, CC_COMPLETE með skýrslu eftir.

## Afmörkun framkvæmdar

Nota óbreyttan samsetningarkjarna með litlum tveggja-leggja wrapper um Egilsstaða-hnút E1 fyrir north. Engin ný heimildaleit eða gagnaöflun. Núverandi retained net nægir samkvæmt sandbox; CC staðfestir sjálft áður en fullyrt er að north virki. Ekki láta E1→Rauðavatn velja suðurleiðina aftur og nefna það norður.

Tvö ný explicit estimated samskeyti við Hádegismóa eru aðeins í north-inntaki með eigin policyVersion. −1/bygging suðurinntaks er óbreytt og norður notar ekki −1. Ekkert global snapping, fleiri samskeyti eða silent fallback. Samkvæmt P2: STOP ef fleiri samskeyti/önnur bilun reynast nauðsynleg. Reglur/lengdir/hash/ID Jonesy eru sandbox-viðmið, ekki eigin Windows-staðfesting CC.

P3 „bæt-fyrir-bæt“ á við fyrirliggjandi suður-geometry/policy/lengd/slices/hnit, ekki bann við nýjum selectedOption/options envelope-reitum sem P5 krefst. Önnur pör halda fyrri svörum; option hunsað fyrir önnur pör eins og áður voru ólesnar query-breytur, skrá það val. Raunmældar lengdir geta verið summa raunmældra leggja þegar samfelld valin keðja hefur verið endursummuð sjálfstætt; ekki afritaðar ágiskanir.

P4: ein nákvæm, skráð ≈36,25 m hringstefnuundantekning við Akureyri er samþykkt til MVP-skoðunar, ekki fullyrðing um rétta stefnu á þeim bút. Festa/sýna hana, ekki fela og ekki hefja kjarnabreytingu til að laga hana í þessari lotu. Endanleg sjónræn eigandaafgreiðsla nær yfir hana og Hádegismóa-samskeytin. Enginn sjónrænn PASS nema raunveruleg skoðun hafi farið fram. Via-merki studd af raunkeðju/heimild, ekki búa til bæjarmiðjupinna.

Lágmarksvinnandi framkvæmd, focused próf og eitt virkt kort. Engin Hella-/Vestfjarða-/alla56 útvíkkun hér; þau halda sér í remaining-mvp-plan.md. Engin valfrjáls hardening eða sjálfvirk rannsóknar-/review-lykkja.

## Samþykkt Round 1

# #501 — Tveir hringvalkostir Rauðavatn ↔ Selfoss — MVP Round 1 — 2026-11-18

## Markmið og heimild

Eigandi samþykkti „ok byrjum á því“ eftir áætlun um stuttu suðurleiðina og hina leiðina norður um land fyrir Rauðavatn↔Selfoss. Afhenda þessa tvo raunverulegu valkosti í báðar ferðastefnur með núverandi samsetningarkjarna. Endurnýta samþykktar MVP-forsendur; engin Vegagerðar-fyrirspurn eða ný heimildaleit. Vestfirðir eru áfram inni í remaining-mvp-plan.md, en ekki í þessari lotu. Þetta er prompt-review, ekki CC-framkvæmdarheimild fyrr en approved prompt + CURRENT READY_FOR_CC og eigandi Prompt approved.

## Lesa afmarkað

AGENTS/CLAUDE/README/CURRENT; remaining-mvp-plan.md; núverandi geometry API/próf, geometryComposition.js og geometryDataset.js; raudavatnSelfossMvpPolicy.js/próf; samþykkt Selfoss-lokamat/kort. Retained wfs-vegnr1-all.json og runtime pilot JSON, geometry-api/build-pilot-dataset.mjs. chain-walks-v4.json undir ticket-493-place-network/samples og retained place_nodes eftir þörfum til að staðsetja norður/suðurkorridora; eldri prefix-keðjur eru ekki sönnun fulls hrings. Ekki lesa alla rannsóknarsöguna eða gera nýja audit-lotu.

## Fyrsta athugun og framkvæmd

1. Stutta suðurleiðin er þegar samþykkt (um 44,985 / 45,102 km eftir ferðastefnu) og helst óbreytt í hnitum/slices/geometryId ef input er óbreytt. Byrja á einni focused keyrslu á varðveittu veg1-neti: getur það tengt norðurvalkost frá Rauðavatni gegnum Vesturland, Norðurland, Austurland og Suðurland að Selfossi? Þetta er forskoðun innan framkvæmdar, ekki sjálfstæð rannsóknarafhending.
2. Ekki kalla sömu stuttu leiðina aftur og nefna hana norðurleið. Velja norðurkorridor með einföldum explicit source/waypoint-afmörkunum úr raunverulegum varðveittum hnútum. Millistöðvar lýsa raunleið (t.d. Borgarnes, Akureyri, Egilsstaðir og Vík); staðfesta tengingu þeirra við keðjuna áður en þær eru merktar sem via. Ekki afrita ferðalista eiganda sem línulega röð afleggjara. Ekki þurfa nýja mapping allra 56 staða til að velja fáa innri corridor-hnúta.
3. Endurnýta composeGeometryPath og MVP-reglur. Lítil wrapper-samsetning gegnum fasta hnúta eða afmarkaða kaflalista heimil; enginn nýr route engine/Dijkstra, provider, generalized alternatives framework eða óþörf abstraction. Sameiginlegir bútar við upphaf/enda geta verið eðlilegir en ekki hlaupa fram og til baka um stuttu suðurleiðina til að ná öllum via-punktum. Hver route hefur raunverulega samfellda hnitarunu; engin fuglsflugslína yfir gögn sem vantar.
4. Ef retained full geometry leysir samskeyti, nota hana án nýs netkalls. Sama 44,215 m Selfoss-pilot connector má endurnýta þar sem við á. Fáein explicit estimated samskeyti ≤45m hvert eru heimil ef nauðsynleg á þessari raunleið, með kortastoð á raunverulegum vegamótum, merktum synthetic IDs og lengd talinni; ekkert global snapping eða þögul tenging þvert á óskyldar akbrautir. Ef það vantar heilan vegkafla eða þarf víðtæka endurgerð, STOP með nákvæmu sourceId/hnita-gati og minnsta vali eiganda. Ekki afhenda upploginn norðurvalkost, endurtaka öflunarleit eða telja unsupported eitt og sér fulla innleiðingu.

## Lítill API-samningur fyrir þetta eina par

Víkka núverandi geometry API aðeins fyrir Rauðavatn↔Selfoss með optional `option=south|north`. Án option velst styttri raunmældur studdur valkostur (venjulega south); óþekkt/endurtekið option fyrir þetta par gefur 400. Val á átt er sjálfstætt frá vali valkosts: Selfoss→Rauðavatn north fer hina leiðina um landið, ekki vélrænn viðsnúningur directed-result.

Svör þessa pars halda fyrirliggjandi geometry-reitum og fá `selectedOption` og `options` með lýsandi id/label, raunverulegum via-stöðum, lengthM og stöðugu routeId/útgáfu fyrir hvorn valkost. Aðeins valda geometry þarf í svarinu; ekki tvöfalt payload af öllum hnitum ef óþarft. Minnsta route-ID/útgáfa má byggja á núverandi geometryId/datasetVersion/policyVersion og valkostinum. Ef nauðsynlegur valkostur er í raun unsupported skal merkja það með skýru reason, ekki falsa lengd eða via-staði. Útfærsla telst ekki full PASS fyrir báða valkosti meðan raunleið vantar.

Önnur pör, Hella/veg93, same_place og gamla winter-route veður/færð/UI halda núverandi samningi. Ekki bæta norðurvalkosti fyrir Hellu í þessari lotu. Engar „betri/öruggari“ fullyrðingar, ETA, hraði, departure, sjálfvirk hjáleið eða live lokunarrouting. drivingAccess UNVERIFIED/MVP-forsendur áfram skýrar.

## Lokaskilyrði og focused staðfesting

- Fjögur raunferlatilvik: south/north × báðar ferðastefnur, réttir pinned endar, samfelld hnitakeðja og lengd endurreiknuð úr henni. Norðurleið fer raunverulega norður og austur um land, ekki gervilykkja eða sami suðurferillinn. Sameiginlegir kaflar/hringlokun og 1436 ekki tvítalin í einni niðurstöðu.
- Sjálfgefið styttri valkostur, explicit val virkar, routeId/útgáfa stöðug fyrir sama input og valkostir/áttir aðgreindir. Prófa selection og grunnsnið, ekki exhaustive all-pair/fuzz/mutation.
- Fyrri Selfoss-suðurleið, Hella og veg93 áfram rétt; engin óviljandi pilot-predicate víkkun á önnur pör. Focused regression og viðeigandi eldri winter-route-samningspróf, lint á snertum JS, git diff --check. Engin fullsuite/build án sýndrar ástæðu.
- EITT task-local map-view.html sýnir valkostina í litum og gerir kleift að skoða hvora ferðastefnu. Skýrar leiðarlýsingar/via og estimated tengingar. Endurnýta fyrri kort/transform; localhost á lausu loopback-porti, aðeins task-mappa, canonical OSM-slóð/Referer/attribution. Engin ný npm dependency eða product-UI. Sjónræn athugun aðeins fullyrt ef hún var framkvæmd; annars eigandaafgreiðsla á virku korti.
- Stutt cc-report.md með raunleiðum/lengdum/prófum, breyttum skrám og kortahlekk. Ekki ný skýrsluröð. Ef STOP: sýna eina nákvæma hindrun og minnsta nauðsynlega framhald, ekki almenna kröfu um fullkomið landsnet.

## Umfang og lífsferill

Heimilt: geometry API og próf, lítill valkosta-wrapper/hjálp/próf, nauðsynleg afmörkuð runtime corridor-gögn úr retained heimildum, task-local build/preview/skýrslur og CURRENT. Aldrei runtime-lestur á docs/. Ef dataset breytist, version endurspeglar það og fyrri leiðaslices/ID ekki breytt að óþörfu. Pure-core aðeins ef sýnd nauðsyn, engin F1/F2 eða valfrjáls hardening. Ekkert src UI, gamla winter-route API/cache/forecast/roadFetch, pricing/scoring/packages eða önnur ticket. Engin ný WFS/metadata/netöflun eða skilaboð, commit/push/deploy/GitHub; venjuleg tile-kortaskoðun heimil.

CC READY_FOR_CC → CC_IN_PROGRESS → CC_COMPLETE; Jonesy yfirferð, Ripley lokamat. Working MVP, ekki commercial-release readiness. Blocker sýnir ranga/ónothæfa raunleið, raunverulegt gagnagat eða umfangsbrot. Þegar tveir valkostir í báðar áttir, focused próf og skoðunarsýn eru tilbúin, stoppa. Ekki sjálfvirkt vinna Hellu/Vestfirði/alla56; þau halda sér í framhaldsáætlun.

## Bindandi Jonesy P1–P7 (óbreytt afrit)

**P1 — Norðurvalkostur má aldrei vera falskur.** Naive samsetning „Selfoss→Egilsstaðir + Egilsstaðir→R1“ með núverandi policy skilar 665,8 km vestur-legg sem fer suðurströnd til baka og um Selfoss — „norður“ sem er í raun suður fram og til baka. Prófin þurfa að sýna: norðurniðurstaða inniheldur norðurlínurnar (nöfn: Borgarnes-Baulan, Holtavörðuheiði, Akureyri, Vaðlaheiðargöng, Mývatnssveit), **ekkert sourceId kemur tvisvar fyrir** í einni niðurstöðu, engar suðurleiðarsneiðar Rauðavatn↔Selfoss (2138, 2135, 36807 …) í norðurvalkosti nema þar sem leggur endar við Selfoss, og lengdir ≈ viðmiðin að ofan (±0,01 m). Norðurleið er ekki „leiðin sem kjarninn velur“; hún er smíðuð úr tveimur föstum leggjum um Egilsstaðir (E1).

**P2 — Samskeytin: nákvæmlega þau tvö, ekki fleiri án STOP.** Notið synthetic línur (neikvætt tölulegt sourceId, ekki −1 sem er frátekið suðurtenginguna), `idbutur: null`, `evidenceRef` marker, einstefna, `estimated: true` á slice og samanlögð áætluð lengd í svari (13,369 m fyrir E1→R1 north, 0 annars). Tenging −1 (44,215 m) er ekki notuð í norðurleggjum. Ef CC finnur aðra bilun eða annað samskeyti >45 m: STOP með nákvæmu sourceId/hnita-gati og minnsta vali eiganda (eins og promptið segir). Samskeytin eru ekki sönnuð sem raunveruleg vegamót af mér (ég sé ekki kort): eigandi metur þau á kortinu.

**P3 — Suðurleiðin helst bæt-fyrir-bæt óbreytt.** Norðursamskeyti/-reglur fara í aðskilið inntak með eigin `policyVersion`; suðurinntak (`buildMvpDirectedInput` + −1) breytist ekki. Prófa: R1→Selfoss og Selfoss→R1 south hafa sömu fullu geometryId, `policyVersion` `…a73f8191242a0938`, lengdir, slices og hnit og fyrir lotuna; Hella-, Egilsstaðir↔Seyðisfjörður- og Selfoss↔Hella-svör óbreytt; engin predicate-víkkun á önnur pör (aðeins Rauðavatn↔Selfoss fær `option`).

**P4 — Hringtorgsúttekt og 36 m á Akureyri.** CC keyrir sömu brúnaúttekt á alla fjóra norðurleggi og skráir niðurstöðuna. Búist er við: 0 á þremur leggjum og eitt tilvik (32964/33604, ≈36,25 m) á E1→R1. Ég mæli með að þetta sé **skráð, ekki lagað** (eins og Hella 3,19 m): lagfæring þarf brúnastigs-útilokun sem krefst kjarnabreytingar, utan umfangs; sýna ringinn og bútinn á kortinu og láta eiganda meta. Prófið má ekki verða veikt til að ná í gegn: festa nákvæmlega þetta eina tilvik (sourceId + lengd), ekkert annað.

**P5 — API-samningur.** `option=south|north` aðeins fyrir Rauðavatn↔Selfoss (báðar áttir); án option → south í báðar áttir (styttra); óþekkt eða endurtekið option → 400; önnur pör með `option` → núverandi hegðun (ekki 400 nema promptið segi; skrá val CC). `options` lýsir báðum valkostum með raunmældri `lengthM` (ekki áætlaðri summu), via-merkjum, stöðugu `routeId`/útgáfu sem er ólíkt milli valkosta og átta; aðeins valin geometry í svari (aðeins ein hnitaruna). Átt og valkostur sjálfstæð: Selfoss→R1 north er smíðað úr Selfoss→E1 + E1→R1, ekki viðsnúningur á R1→Selfoss north. `drivingAccess: UNVERIFIED`, ekkert „öruggari/betri“, engin ETA.

**P6 — Via-merkingar.** Dataset hefur aðeins fimm pinnaða endapunkta; aðrir staðir hafa engin hnit í runtime. Via-merki (Borgarnes, Akureyri, Egilsstaðir, Vík) mega aðeins fylgja ef CC staðfestir tengingu við keðjuna úr retained heimildum; annars merkja `via` eftir línuheitum sem koma fyrir í raunsneiðum (sandbox: Borgarnes-Baulan, Akureyri, Egilsstaðir og Vík koma fyrir). Engin ný staðamappa fyrir alla 56. Egilsstaðir-tengipunkturinn E1 er hnútur 1/93-vegamóta (65,2586°N 14,3903°V), ekki bæjarmiðja — merkja það sem skeytingarpunkt leggjanna.

**P7 — Sjónræn heiðarleiki.** Ég sé ekki kort; ekkert sjónrænt PASS frá mér. Skoðunaratriði eiganda á einu korti: (1) samskeytin tvö við Hádegismóa (364304/405438 → 364310/405428 → 364380/405259 → 364381/405257), (2) Akureyri-hringur 33604, (3) samskeyti leggja við Egilsstaði (E1), (4) heildarmynd norðurleiðar. Ný vefgátt á lausu loopback-porti (ekki 8765–8767), aðeins task-mappa, canonical OSM-slóð.
