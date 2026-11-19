# #501 — Read-only úttekt á leiðasamsetningargrunni

## Round 1 — Ripley — 2026-11-17

PROMPT_REVIEW; þetta er umræðu-/yfirferðarskjal, ekki framkvæmdarheimild CC.

### Samþykkt afmörkun eiganda

Eigandi valdi #501 og samþykkti fyrstu lotu sem stutta read-only úttekt eftir að Ripley lýsti gagnagötum #500. Markmiðið nú er skýrt svar um hvaða leiðasamsetningu varðveitt gögn leyfa og hvaða lágmarksheimildir vantar. Ekki innleiða leiðarvél eða skila öllum unsupported sem staðgengli fyrir fullgerð lokaskilyrði #501. PASS þessarar úttektar lokar aðeins þessari lotu, ekki innleiðingarmiðanum #501.

Live #501 var lesinn ásamt athugasemdum (engar) 2026-11-17. Miðinn biður um stöðugt leiðar-ID/útgáfu, röðuð geometry/vegstykki og tengipunkta fyrir veður/færð; stutta/langa valkosti Reykjavík–Selfoss/Hella þar sem studdir; beina veg93 Egilsstaðir–Seyðisfjörður; viðsnúning, sama stað, engar tvítalningar á hringlokun/1436/sameiginlegum köflum; skýrt gagnagat í brotnu/óstaðfestu grafi; eldri fastar leiðir varðveittar. UI/ETA/hraði/brottfarir/fjöláfangar/sjálfvirkar hjáleiðir utan umfangs. Lokun vegar á valinni leið er ekki heimild til nýrrar hjáleiðar.

Geymsluathugun Ripley: #500 CLOSED/PASS staðbundið, hrein git-staða við upphaf þessarar lotu. Handoff #500 greinir 56 staði, 54 með valinn punkt, tvö hnitagöt (Keflavík bær/Þórshöfn); 0/56 SUPPORTED/ROUTABLE í nýja grunni. Tvær eldri fastar runtime-leiðir standa óháðar þeim merkjum. Ekki álykta að allar raunverulegar leiðir séu ófærar eða að föstu leiðirnar séu horfnar. Eigandaval punkts sannar ekki vegtengingu/akstursstefnu. Suðurkorridor og R1-norður eru afmarkaðir útdrættir með varðveittum fyrirvörum, ekki fullur löglegur hringgrafur.

### Lesa og rekja, afmarkað

1. AGENTS.md, CLAUDE.md, docs/ai/README.md og CURRENT. Fylgja nýjustu MVP-reglu eiganda: lágmarks fullnægjandi úttekt, engin útgáfuherðing eða nýtt gagnakerfi. Skrá HEAD og git status fyrir/eftir; varðveita annað verk.
2. #500 closure-handoff/handoff-to-501.md og result-review.md með lokamati Ripley; fylgja aðeins viðeigandi heimildatilvísunum. Gildandi winter-route-places.json/approach-selections.json og #499 endpoint-registry/closure-handoff eftir þörfum. Gamall GitHub-texti #499 getur verið úreltur; lokaafhending og per-place gögn ráða nýrri staðreyndum, árekstra skrá sérstaklega.
3. Rekja api/winter-route.js → routes.js/segments.js → cache.js/roadFetch.js/forecastFetch.js, ásamt raunverulegum frontend-kallstað/hooki og src/lib/winterRouteRoutes.js. Finna kallstaði með rg, ekki gera ráð fyrir að useWinterRoute.js sé til. Lesa viðeigandi próf til að skilja routeId, sjálfgefið/óþekkt ID, cache-bucket, stale/fallback, ósamstillt svör og viðmótsvæntingar. Ekki keyra þjónustu, upstream eða nýjar API-beiðnir.
4. Skoða varðveitt chain-walks/raw/source geometry og mæld bil aðeins fyrir nauðsynleg tilvik. Endurnýta fyrri mælingar/heimildir, ekki gera nýja kortaleit eða afrita alla rannsóknarsöguna. Einföld staðbundin JSON/töflureiknun er leyfð ef hún skýrir hlutlæga staðreynd; skrá aðferð og nákvæma slóð/ID. Hnitnálægð er ekki heimild til að brúa bil, velja epsilon eða staðfesta löglega akstursstefnu.

### Afhending — eitt stutt decision memo + CC-skýrsla

Skrifa docs/ai/tasks/ticket-501/audit-report.md á íslensku með:

- Hnitmiðað núverandi data-flow/endpoint/cache-contract með file:line tilvísunum, sérstaklega routeId versus staðapör/valkost/útgáfa; hvað þegar er til og hvað væri breyting. Engin ný schema/route-cache arkitektúrhönnun nauðsynleg.
- Ein sönnunartafla fyrir Reykjavík–Selfoss, Reykjavík–Hella, Egilsstaðir–Seyðisfjörður og eldri Rauðavatn–Vík/Borgarnes til samanburðar. Aðgreina hvora hringátt og gagnstæða ferðastefnu; ekki láta snúning geometry jafngilda akstursheimild. Fyrir hverja: valdir endpoint-ID, varðveitt stykki/keðja/heimild, nákvæm þekkt bil eða óþekkt tenging/stefna, vegalengdarstoð, veður/færðarjoin stoð, staða þess sem má nýta í #501. Notið lýsandi staðfest/hlutagögn/óstaðfest með rökum; engin skylda að fylla tóman reit með nýjum gögnum.
- Lágmarksviðmið fyrir sérstök #501 tilvik: sama stað, viðsnúning, sameiginlegan tengiveg (veg93), hringlokun/1436 tvítalningu, brotinn graf, lokun á valinni leið. Segja hvort varðveitt gögn/próf sýni þau nú eða hvað vanti; ekki smíða ný próf/fabricated fixtures til að lýsa tilbúinni virkni.
- Nákvæma lágmarksvöntun fyrir hvert ósannað val: hvaða samskeyti/stykki/staðpar/átt/heimild þarf, hvers vegna, hvaða staðbundna skrá styður það. Ekki almennt “fleiri gögn vantar”; ef ekki hægt að tilgreina ID án öflunar, lýsa nákvæmlega því sem er óþekkt.
- Niðurstaða: hvað má raunhæft innleiða næst án nýrrar gagnaöflunar, ef eitthvað; hvað krefst sérstaklega heimilaðrar öflunar eða eigandaákvörðunar. Stysta næsta skref fyrir einn þróunaraðila, engin sjálfvirk framkvæmd. Hvorki fækka 56-listanum né telja eiganda samþykkja gömul gögn sem akstursheimild. Ekki lofa báðum hringáttum ef gögn styðja þær ekki. Ekki endurvekja #441/#450 eða vinna #502–#504.

Skrifa cc-report.md með lesnum kjarnaskrám, raunathugunum/skipunum og takmörkunum. Ekkert próf/build/lint þarf fyrir hreina úttekt; ef mjög afmarkað existing test er raunverulega gagnlegt má keyra það án application breytinga og eigna niðurstöður rétt. Fyrra 215/215 #500 er ekki ný prófkeyrsla eða sönnun fulls grafs. Engin ný próf eða tooling-rammaverk; tímabundin einföld forskrift nægir, ekki skylda að afhenda hana. git diff --check og skoðun nýju skjala (untracked sést ekki í git diff) nægir með afmörkuðum staðreyndaprófunum.

### Mörk, STOP og lífsferill

Leyfð skrif aðeins skjöl undir docs/ai/tasks/ticket-501/ og nauðsynleg CURRENT-lífsferilsfærsla. Engar breytingar á gömlum heimildum/#500, server_data, src, api, prófum, config, dependencies eða framleiðslugögnum. Engin ný geometry/netaöflun, vafrakortaskoðun, geocoding, þjónustur, lyklar/env-skrár, commit/push/deploy eða GitHub-miða/Project-breyting. CURRENT í CRLF; ný skjöl mega LF.

Þekkt gögn vantar ⇒ skrá nákvæmt gap og klára úttektina; það er ekki blocker á afhendingu úttektar. Ósamræmi sem breytir niðurstöðu ⇒ skrá bæði gögn og áhrif, ekki laga vörugögn eða giska. STOP frekari öflun/innleiðingu og vísa ákvörðun til eiganda ef næsta nauðsynlega skref fer út fyrir samþykktu read-only afmörkunina. Ekki óska eftir leyfi áður en fullnægjandi ákvörðunargrunnur hefur verið skrifaður.

CC keyrir aðeins samþykktan prompt eftir Jonesy APPROVED, approved-prompt-v1.md til staðar, CURRENT READY_FOR_CC og eiganda “Prompt approved”. Setja CC_IN_PROGRESS áður, CC_COMPLETE með report-path að lokum. Jonesy result review síðan Ripley lokamat. PASS/CLOSED gildir aðeins úttektarlotu; #501 GitHub/innleiðing áfram sérstök ákvörðun. Stöðva þegar tafla, gagnagöt og næsta-skref niðurstaða svara spurningunni; engar valfrjálsar endurskoðunarlotur.

### Beiðni til Jonesy

Yfirfarðu afmörkunina sem stutta read-only úttekt, ekki fulla #501 innleiðingu. Leitaðu aðeins að sýndum götum sem gera niðurstöðuna ranga/ónothæfa: núverandi samningar, tvær hringáttir versus viðsnúningur, heimild fyrir samskeytum/stefnu og skýr aðgreining gamla runtime og nýs 56-punkta grunns. APPROVED eða REVISE með minnsta nauðsynlega fix; valfrjáls dýpkun ekki blocker.

## Jonesy review — umferð 1 (2026-11-17)

**Niðurstaða: APPROVED með einu skilyrði (JA1), sem Ripley fellir beint inn í approved-prompt; engin önnur Jonesy-umferð nauðsynleg.** Afmörkunin er rétt stærð fyrir stutta read-only úttekt: engin leiðarvél, engin öflun, skýr aðgreining gamla runtime og nýs 56-punkta grunns, bæði hringáttir og ferðastefna nefnd, og „hnitnálægð er ekki heimild“. JA1 er sýnt gat í lestrarlistanum sem getur gert eina röð töflunnar ranga; JA2–JA4 eru valfrjálsar. Stage helst PROMPT_REVIEW.

### Sannprófað í sandbox (mitt; aðeins lestur, engin net-/GitHub-köll, ekkert keyrt hjá eiganda)

- **Núverandi samningar (kóði):** `api/winter-route.js:213` `resolveRouteId(req.query?.routeId)`, `:222–229` hvert routeId fær eigin road/forecast-bucket; `api/_lib/winterRoute/cache.js:32–42` `getBucketsForRoute(routeId)`, `:81–86` `getRoadData/getForecastData({routeId})`; frontend-kallstaður er `src/pages/WinterRoute.jsx:375–421` (`fetch("/api/winter-route[?routeId=…]")`, sannreynir `routeId`/`expectedPointCount` við `src/lib/winterRouteRoutes.js`, sem hefur tvær færslur); `src/hooks/` hefur engan `useWinterRoute.js` (prompt-ið segir réttilega „ekki gera ráð fyrir“). Þ.e. samningurinn er enn **routeId → fastur IDBUTUR-listi + föst veðurpunkta**, ekki staðapar; það sem prompt-ið biður um að sé greint („routeId versus staðapör“) er raunverulega breytingin.
- **Gagnagrunnur #500:** 56 staðir, 54 með hnit, 50 selections, 0 SUPPORTED — óbreytt frá closure-handoff; `CURRENT.md` er CRLF (794/794), stemmir við „CURRENT í CRLF“.
- **Retained graf:** `road-links.csv` hefur **aðeins VEGNR=1** (249 raðir, öll „1“); aðrar leiðir (t.d. Þrengslavegur) eru ekki þar — „Fossvellir – Þrengslavegur“ er Hringvegarstykki, ekki Þrengslavegur. `chain-walks-v4.json`: `cw_long` (129 skref R1→Akureyri, Egilsstaðir á cum 677,6 km excl. 1436), `ccw_short` (29 skref R1→Borgarnes, 70,85 km), `selfoss_closure_target` (7 skref að Selfoss 2138, 45 740,46 m með 1436 / 43 180,31 m án; bil inn í 2135 = 34,749 m), 1436 = 2 560,15 m (tvítalningarhætta er raunveruleg og þegar mæld).

### Skilyrði

**JA1 — vantar veg93-heimildir í lestrarlistann; closure-handoff segir „engin keðja“ fyrir Egilsstaði/Seyðisfjörð.** `handoff-to-501.md` (og minn eigin PASS/OS4 á þeirri lotu) lýsir „þremur og aðeins þremur“ varðveittum keðjum og skráir `egilsstadir`/`seydisfjordur` með „—“. Það er ónákvæmt: **veg93-keðjan E1→S2 er varðveitt** í `docs/ai/tasks/ticket-493-place-data-phase2/samples/` (`road93-candidate.json`, `road93_section-v2.json`, hrá `wfs93-raw.json`, SHA-256 `1d8c9cf880df374b9cb8120e1053e8ffd5acfba3d4bf55714e57ffdd8c49eb33`, 24 features = 6 stykki × 4 tiers): 2344 → 3410 → 3409 → 2894 → 2892 → 2891, öll 5 samskeyti **0,0 m**, engin endurtekning. Mín athugun: E1 (715153,74; 536679,93) = START 2344 = END 2345 (bil 0,0 m, VERIFIED native-snerting, ekki akstursheimild) og S2 (732875,674; 538207,0762) = END 2894 = START 2892 — báðir eru nákvæmir hnútar keðjunnar og jafnir `places-v1.json`/`places.json`. Áhrif ef CC fer eftir handoff: kjarnaröð töflunnar („Egilsstaðir–Seyðisfjörður“, best studda parið) segði „engin varðveitt keðja“. **Lágmarksfix:** bæta við „Lesa og rekja“ lið 4: `ticket-493-place-data-phase2/samples/road93-candidate.json`, `road93_section-v2.json`, `wfs93-raw.json`, `egilsstadir_nodes-v2.json` (og eftir þörfum `road_condition_footprint-v2.json`/`worklist_and_weatherpoints-v2.json` fyrir færð/veður-join), og að CC skrái ósamræmið við handoff-töflu sem sérstakt atriði (prompt-ið heimilar nú þegar „árekstra skrá sérstaklega“) án þess að breyta handoff-skjalinu. Leiðrétting á minni eigin fyrri yfirferð: ég skoðaði ekki phase2-möppuna í closure-handoff-lotunni; það er ekki sama og að gögnin vanti.

### Valfrjálst (ekki blockerar)

**JA2 — vegalengdargildra E1→S2.** `road93_section-v2.json` og `road93-candidate.json` birta 26,9266 km „from_junction_node“; það nær til ferjubryggju (END 2891). Valinn S2 er END 2894, svo lengd valda parsins er 1 716,174 + 9 882,054 + 14 011,188 + 642,878 = **26 252,294 m**, ekki 26,93 km (stykki 2892/2891 eru handan S2 og ekki heimiluð sem veg93-leið án sérstakrar heimildar, sbr. eldra road93-prompt). Tier-næmi er skráð (tier 2 = 24 752 m, −8,07 %); töflan ætti að segja hvaða tier vegalengdarstoðin byggir á. Allar sex veg93-færslur eru `direction_grade: INFERRED (VEGHLUTI=1)`; engin akstursstefnu-/aðgengisheimild er til — í samræmi við kröfu prompt-sins um gat-aðgreiningu geometry vs aðgengi.

**JA3 — „stutt/lang“ fyrir Reykjavík–Selfoss/Hella.** Retained gögn eru VEGNR=1, svo val gegnum Þrengslaveg er ekki í gögnunum (ekki heldur sem „stutta leið“), og hringurinn er opinn: `cw_long` nær R1→Akureyri, `ccw_short` aðeins R1→Borgarnes, R1-norðurútdráttur 15 stykki að 3025; Akureyri→Borgarnes er ekki varðveitt. Svo engin „löng“ (andhringátt) leið að Selfossi/Hellu er studd; það sem er til er eina áttin cw gegnum Hellisheiði (252090037). `chain-walks-v4.json#closure_test` skráir `closed_with_real_closure_set: true` fyrir {252090037, 902020037} (merking ekki prófuð af mér); töflan ætti því að segja berum orðum að viðsnúningur geometry (`rev`) er ekki sama og akstursheimild í hina áttina. Valinn Selfoss-punktur (2138 START) er EXIT-endi með 30,1 m bil að næsta stykki en 34,749 m bil inn í 2135 er það sem R1→Selfoss-keðjan ber; Hella-punktur (3591 START) hefur 32,63 m bil í kringum sig — töflan á að nefna nákvæmlega hvort bilið liggur á milli R1 og valins punkts eða handan hans.

**JA4 — veður/færð-join.** Fastar leiðir hafa fasta veðurpunkta með `nearIdButur` (`segments.js`, `routes.js`); `roadFetch` tekur IDBUTUR-lista. Fyrir ný pör má IDBUTUR-listi leiða af keðjustykkjum en veðurpunktar fyrir nýtt par eru ekki til nema þar sem phase2-gögn hafa þá (E1–S2); prompt-ið þarf ekki að smíða þá, aðeins greina hvort þeir séu til.

### Mörk

Ég get ekki staðfest texta GitHub-miða #501; tilvísanir í hann eru Ripley-heimild. Ég keyrði engar þjónustur, ekkert vitest/lint/build/git hjá eiganda; „Prompt approved“ og git status eru CC/eigandi. Kortamat Ripley er óendurskoðað. APPROVED hér er ekki innleiðingarheimild fyrir #501 og lokar ekki miðanum; stöðva ber þegar tafla, gagnagöt og næsta-skref niðurstaða svara spurningunni.
