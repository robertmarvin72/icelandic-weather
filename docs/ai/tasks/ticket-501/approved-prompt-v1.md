# #501 — Approved prompt v1 — read-only úttekt

Ripley, 2026-11-17. Jonesy APPROVED umferð 1 með JA1, engin önnur yfirferð nauðsynleg.

## Heimild og forgangur

Eigandi samþykkti þessa afmörkuðu read-only úttekt, ekki leiðarvélarinnleiðingu. CC framkvæmir aðeins eftir “Prompt approved” frá eiganda þegar CURRENT vísar hingað og er READY_FOR_CC. Setja CC_IN_PROGRESS fyrir vinnu, skila audit-report.md/cc-report.md og CC_COMPLETE að lokum. Engin kóða-/vörugagnabreyting, netöflun, GitHub-aðgerð, commit/push/deploy.

Round 1 hér að neðan gildir með eftirfarandi bindandi JA1-leiðréttingu. Sögulegar setningar um að bíða Jonesy yfirferðar eru afgreiddar með þessu samþykki. Lesa veg93-gögn phase2 sérstaklega; #500 handoff er ekki tæmandi skrá yfir öll retained gögn. Skrá ósamræmið við handoff í úttektinni, ekki breyta #500. JA1 er tekið óbreytt inn neðar.

Stuttar skýringar úr valfrjálsum JA2–JA4, án aukins umfangs: afmarka veg93 við valinn S2-hnút fremur en ferjubryggju; merkja tier/heimild vegalengdar og staðfesta úr gögnum í stað þess að afrita review-tölur. Aðgreina bil sem liggja fyrir valinn endpoint frá bilum handan hans. Retained VEGNR=1 sannar ekki Þrengslavegsval, lokaðan heilan hring eða löglega akstursstefnu; geometry-reversal er ekki sú heimild. Veður-/færðarstoð nýrra para er audit-spurning, ekki skylda að búa til punkta eða nýjan samning.

PASS/CLOSED lokar aðeins úttektarlotunni; #501 innleiðing og GitHub-lokun ekki afgreidd. Stöðva þegar stutta taflan, nákvæm gagnagöt og einfaldasta næsta skref eru afhent; engin valfrjáls dýpkun.

## Round 1 — samþykkt umfang (yfirferðarstöðutexti sögulegur)

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


## JA1 — bindandi leiðrétting lestrarlista, óbreytt úr yfirferð Jonesy

**JA1 — vantar veg93-heimildir í lestrarlistann; closure-handoff segir „engin keðja“ fyrir Egilsstaði/Seyðisfjörð.** `handoff-to-501.md` (og minn eigin PASS/OS4 á þeirri lotu) lýsir „þremur og aðeins þremur“ varðveittum keðjum og skráir `egilsstadir`/`seydisfjordur` með „—“. Það er ónákvæmt: **veg93-keðjan E1→S2 er varðveitt** í `docs/ai/tasks/ticket-493-place-data-phase2/samples/` (`road93-candidate.json`, `road93_section-v2.json`, hrá `wfs93-raw.json`, SHA-256 `1d8c9cf880df374b9cb8120e1053e8ffd5acfba3d4bf55714e57ffdd8c49eb33`, 24 features = 6 stykki × 4 tiers): 2344 → 3410 → 3409 → 2894 → 2892 → 2891, öll 5 samskeyti **0,0 m**, engin endurtekning. Mín athugun: E1 (715153,74; 536679,93) = START 2344 = END 2345 (bil 0,0 m, VERIFIED native-snerting, ekki akstursheimild) og S2 (732875,674; 538207,0762) = END 2894 = START 2892 — báðir eru nákvæmir hnútar keðjunnar og jafnir `places-v1.json`/`places.json`. Áhrif ef CC fer eftir handoff: kjarnaröð töflunnar („Egilsstaðir–Seyðisfjörður“, best studda parið) segði „engin varðveitt keðja“. **Lágmarksfix:** bæta við „Lesa og rekja“ lið 4: `ticket-493-place-data-phase2/samples/road93-candidate.json`, `road93_section-v2.json`, `wfs93-raw.json`, `egilsstadir_nodes-v2.json` (og eftir þörfum `road_condition_footprint-v2.json`/`worklist_and_weatherpoints-v2.json` fyrir færð/veður-join), og að CC skrái ósamræmið við handoff-töflu sem sérstakt atriði (prompt-ið heimilar nú þegar „árekstra skrá sérstaklega“) án þess að breyta handoff-skjalinu. Leiðrétting á minni eigin fyrri yfirferð: ég skoðaði ekki phase2-möppuna í closure-handoff-lotunni; það er ekki sama og að gögnin vanti.

