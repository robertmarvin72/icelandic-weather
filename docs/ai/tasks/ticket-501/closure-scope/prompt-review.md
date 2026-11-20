# #501 lokunarumfang og afmarkaður blockerlisti

## Ripley initial prompt umferð 1 — 2026-11-20

Eigandi samþykkti: „Já, aðskiljum frekari þekju og klárum #501 samkvæmt planinu.“ Þetta gengur framar fyrri kröfu um að klára frekari svæðisþekju innan sama miða. Staðir falla ekki úr vörumarkmiði. closure-plan.md er samþykkt verkaskipting; þessi lota er skref 1, ekki ný leiðainnleiðing eða heimild til að loka GitHub.

Markmið: eitt nothæft lokunarumfang og lokaður listi sýndra MVP-blockera fyrir skref 2. Ekki búa til nýtt review-/gagnakerfi eða endurrannsaka samþykktar leiðir. Prompt-review eingöngu; CC bíður approved-prompt/CURRENT READY_FOR_CC og eiganda Prompt approved.

## Lesa fyrst

AGENTS/CLAUDE/docs/ai/README/CURRENT, closure-plan.md með eigandasamþykki, remaining-mvp-plan.md og owner-packages-2026-11-19/source-note.md. Núverandi api/winter-route-geometry.js/próf, geometryComposition og svæðisloaders/runtimeJSON eftir þörfum, src/lib/winterRouteRoutes.js og núverandi fast API-flæði. Samþykkt lokamöt Hringvegs/veg93 og átta Vestfjarðalota eru grunnur, ekki efni í nýjar mutation-/stefnurannsóknir. Nota retained eigandaCSV164 fyrir nafngreinda eftirfylgni; engin kortaskoðun eða netöflun þarf.

## Afhending

Skrifa **docs/ai/tasks/ticket-501/closure-scope/scope-and-blockers.md**, hnitmiðað skjal með:

1. **Nákvæmum núverandi stuðningslista.** Raða studdum pörum/endapunktum/valkostum úr raunverulegum branches/data, báðar áttir og sér-ID vegamóta. Greina veljanlegan endpoint, millistað á geometry og óstuddan stað. Átta Vestfjarðapör talin í closure-plan; ekki endurtaka gömul röng sjö/níu-lotutalningar úr athugasemdum.
2. **Töflu yfir öll átta upprunaleg lokaskilyrði #501** (sjá lista neðar): uppfyllt með file/test/raunsvar-vísun, sýndur blocker eða skýrt afhendingarmark. Grænt geometry-próf sannar ekki sjálfkrafa same_place/lokun/tengipunkta503. Ekki kalla UNVERIFIED akstursstefnu staðfesta; samþykktar MVP-forsendur skráðar, ekki ný Vegagerðarstaðfestingarkrafa.
3. **Litlu raunprófi áður en innleiðing er hönnuð.** Keyra núverandi handler á Búðardalur→Hólmavík (nú líklega unsupported), eina stefnu öfugt og same_place fyrir studdan Vestfjarðaenda. Síðan read-only/tímabundin offline tilraun með fyrirliggjandi kjarna á einum samsettum Vestfjarðalegg, helst Búðardalur→Hólmavík um Þröskulda: núverandi leið1/60-grunnur þarf ekki inn á Hringveg, samþykkti Búðardalsendi endurnýttur. Sýna hvort fyrirliggjandi tier0-gögn duga, raun sourceId/endahnit/samskeyti og hvað þarf að breyta. Notkun retained fullrar fitju sem read-only tilraun er heimil, ekki ný runtime-landsvíkkun. Ekki kalla óvænt stystuleið um608/63 rétta af því hún er geometry_only. Ef gögnin duga ekki, skrá nákvæmt lágmarksgat og hentugasta þegar-studda samsetningarprófið; ekki sjálfvirk ný öflun. Þetta er afmörkuð samþættingarathugun, ekki skönnun allra para.
4. **Föst tillaga að skrefi 2.** Nafngreina minnsta afhendingarmengi samsettra para/báðar áttir sem sýnir tengdan núverandi grunn og rétta skeytingu. Tillagan skal sannprófuð með tilrauninni, ekki loforð um allar samsetningar eða Hringvegstengingu milli tier0 og pilot. Greina J/Patreksfjarðarskeyti og bæjarstubba eftir því sem tilfellin nota; ekki tvítelja eða líma tilbúin parsvar. Stutt nauðsynlegt leiðarsnið fyrir502/503 og same_place/lokunarhegðun ef sýnt gat er þar. Hvorki ný dependency/provider/almennur arkitektúr né öll landsnetið í runtime. Ef þetta krefst stærra umfangs en einnar hóflegrar lotu: sýna ástæðu/einfaldasta val áður en fleiri lotur eru ákveðnar.
5. **Lokuðum blockerlista** með afmörkuðu triggeri, raunverulegri röngu/vantandi niðurstöðu, áhrifum á samþykktan MVP og minnstu nauðsynlegu breytingu/prófi. Skilja valfrjálsa herðingu frá. Engin viðbót við listann í hverri review-umferð nema ný sýnd villa; ekki breyta öllum gömlum pörum sjálfkrafa vegna samningsmismunar.
6. **Nafngreindri eftirfylgni.** Ein tafla fyrir allar31 Dalir-og-Vestfirðir CSV-raðir (þar af ferjustaður), með stöðu endpoint/millistaður/framtíðargrein/gagnagat/ferjuundanþága og framkvæmd sem vantar. Tálknafjörður áfram endpoint með995mcoverage-gati, ekki fullgerð bæjartenging. Önnur svæði úr164-grunni fara í nafngreinda svæðisflokka eftir CSV, ekki sjálfvirka landsúttekt. Viðbótarstaðaþekja er samþykkt eftirfylgni utan501; engin ný geometry-innleiðing eða GitHub-miðar hér.

Skrifa **closure-scope/cc-report.md** með raunkeyrðum athugunum/niðurstöðu fyrir skref2; ekki langt safn nýrra úttektarskjala. Tímabundin forskrift til talninga/tilraunar nægir, ekki afhenda nýtt framework eða tests sem spegla skjalatexta.

## Lokaskilyrði #501 til samanburðar

- Stöðugt leiðarauðkenni/útgáfa, endar, valinn valkostur, ordered geometry/vegkaflar og tengipunktar veður/færðar.
- Reykjavík–Selfoss/Hella stutta leiðin og hinn Hringvegsvalkosturinn þar sem gögn leyfa.
- Egilsstaðir–Seyðisfjörður beinn vegur93.
- Viðsnúningur/hlutverk/stefna og skýr same_place.
- Engin tvítalning hringlokunar/1436/sameiginlegra kafla.
- Brotinn graf/óstaðfest tenging gefur unsupported/gagnagat.
- Targeted próf á valkostum/báðum áttum/sameiginlegum tengivegi/lokun/viðsnúningi/sama stað/gagnagati.
- Núverandi föstu leiðir áfram virkar eða sannreynd yfirfærsla.

Lokun er ekki sjálfvirk hjáleið. Lifandi veður/færð í503; hér þarf aðeins skilgreinda nothæfa afhendingu, ekki nýja retrieval-þjónustu. UI í502. Gömlu issue-checkbox eru ekki sjálfstæð sönnun um ólokna eða lokna vinnu.

## Umfang, sannprófun og STOP

Aðeins ný skjöl undir closure-scope/ og workflow-færslur CURRENT samkvæmt README. Engin breyting á kóða/runtimeJSON/eldri samþykktum promptum/lokamötum, engin ný dependency/netöflun/GitHub/commit/push/deploy. Nota núverandi próf/svör sem focused sönnun; ekki fullsuite/mutation/build. Sannprófa endpoint/pair-töflur/31CSV-raðir og skrá nákvæmlega hvaða athuganir voru keyrðar; diff-check og skoðun nýrra skráa. Fyrri257/257 er fyrra lokamati eignað, ekki ný keyrsla.

Þetta skref fái PASS þegar skref2 er framkvæmanlegt og skýrt eða nákvæmt gagnagat/umfangsval er sýnt. Ekki falsa lokið samsett net. Nýr óhjákvæmilegur arkitektúr/gagnaöflun eða umfang utan samþykkts plans: STOP með minnsta valkostinum áður en framkvæmd víkkuð. Optional polish ekki blocker og ekki ný review-lota. Þegar nothæft skjal/afmörkuð tilraun/CC-skýrsla tilbúin, stoppa. CC setur READY_FOR_CC→CC_IN_PROGRESS→CC_COMPLETE með report-path; Jonesy yfirferð, Ripley lokamat. Ekki hefja skref2 sjálfur.

---

## Jonesy review — umferð 1 (2026-11-20)

**Niðurstaða: PROMPT_REVIEW — samþykkjanlegt með bindandi P1–P8.** Afmörkunin (skjöl eingöngu, ein tilraun, lokaður blockerlisti, nafngreind eftirfylgni) er rétt og framkvæmanleg. Ég keyrði tilraunina úr prompt-lið 3 sjálfur á raunkjarnanum: **Búðardalur→Hólmavík er samsetjanlegt úr fyrirliggjandi svæðisgögnum án nýrra gagna og án kjarnabreytingar** (78 697,77 m, 12 slices, enginn connector, báðar áttir eins). Engin ný gagnaöflun þarf í skref 2. Atriði sem prompt nefnir ekki, vanmetur eða sem ég þarf að leiðrétta:

1. **Stuðningslistinn er stærri en closure-plan.md segir.** Handler styður **18 óröðuð pör (36 með stefnu)**, ekki aðeins átta Vestfjarðapör: **10 pör eru hringpilotinn** (öll pör milli Rauðavatns, Selfoss, Hellu, Egilsstaða og Seyðisfjarðar, þ.m.t. Rauðavatn↔Egilsstaðir 615 333,34 m, Rauðavatn↔Seyðisfjörður 639 482,20 m, Egilsstaðir↔Hella 584 988,73 m, Egilsstaðir↔Selfoss 620 628,53 m, Seyðisfjörður↔Hella 609 137,59 m, Seyðisfjörður↔Selfoss 644 777,39 m) + 8 Vestfjarðapör. Planið og prompt telja aðeins Rauðavatn/Selfoss/Hella og 93 sem „afhent“; listinn verður að vera sá sem kóðinn gefur, ekki sá sem plantaflan segir.
2. **same_place er aðeins til fyrir 5 id** (reykjavik-raudavatn, selfoss, hella, egilsstadir, seydisfjordur). Allir Vestfjarðaendar svara `200 unsupported endpoint_mapping_unavailable` fyrir sama stað (budardalur, isafjordur, holmavik, patreksfjordur, talknafjordur); `flokalundur` og `junction-*` svara `400 unknown_place_id` (líka með öðrum en Vestfjarðarpörum). Lokaskilyrði 4 er því **ekki uppfyllt** fyrir Vestfirði — þetta er sýndur blocker (B1 hér neðar).
3. **Hringvegur Baulan–Staðarskáli ER til í retained tier-0 gögnum** (249 lína með vegnr „1“ í 1564-lína netinu). Ég hafði gert ráð fyrir að hann vantaði; það var rangt. Sjá „Hringvegshættan“ — hún breytir því hvernig skref 2 má ekki mixa netum, ekki því hvort gögn séu til.

### Merking: sandbox vs CC

- **Sandbox (mitt, Linux):** raunverulegur núverandi handler á Vestfjarða-/hringpilot-pörum; **raunverulegur `composeGeometryPath`** á sameinuðu neti (union) allra 8 svæðisskránna (sameinað á sourceId; 88 línur + connectorar −4 og −5; 7 skarast sourceId — 2769, 3611, 3648, 3833, 3834, 3883, 53127 — **JSON-eins, 0 átök**); línur Hringvegar úr mínum pyproj-umreikningi á retained 1564-lína neti, bætt við með endahnútum stilltum á bókstaflegt hnit CC (3544 v0 / 1796 v0). Allar tölur mínar, viðmið ±0,05 m; afritun á lengdum átta núverandi para úr sameinaða netinu gefur **≤3e-11 m** mun frá samþykktum tölum. Ég las `api/winter-route.js`, `routes.js` og `winterRouteRoutes.js` en keyrði ekki prófin þeirra.
- **CC-fullyrt:** ekkert enn. Ég gat ekki lesið GitHub-miða #501; átta lokaskilyrðin eru tekin úr prompt-texta og eru óstaðfest af mér gegn miðanum.

### Sandbox-niðurstöður

**1. Núverandi handler (56-lista + `flokalundur` + þrjú junction-id).**

| Flokkur | Niðurstaða |
| --- | --- |
| `geometry_only` | 18 óröðuð / 36 með stefnu: 10 hringpilotspör (5 id) + 8 Vestfjarðapör |
| same_place | aðeins 5 id (hringpilot/93); Vestfjarðaendar `200 unsupported endpoint_mapping_unavailable`; `flokalundur`/`junction-*` `400 unknown_place_id` |
| Búðardalur↔Hólmavík | báðar áttir `200 unsupported endpoint_mapping_unavailable` (eins og prompt giskaði) |
| `borgarnes`→`reykjavik-raudavatn` | `unsupported` (en föst leið `raudavatn-borgarnes` er til á `/api/winter-route`, sér flötur) |
| óþekkt id / vantar færibreytu | `400 unknown_place_id` / `400 missing_param` |

**2. Tilraun A — Búðardalur→Hólmavík (prompt-liður 3).** Lína-mengi = svæðisskrár `budardalur-flokalundur` ∪ `throskuldar-holmavik` (1/60-skráin og connectorar ekki notuð), raunkjarni, báðar áttir: **78 697,77054505677 m, 12 slices**, öfugt eins: `2769[3→4] 205,4 · 3197[0→45] 15 555,8 · 3247[0→33] 9 237,6 · 3462[0→22] 5 492,1 · 40961[0→13] 5 445,6 · 3460[0→20] 5 813,1 · 3771[0→18] 3 237,2 · 3755[0→15] 3 155,6 · 3321[0→47] 10 052,1 · 3324[0→63] 14 778,7 · 3611[0→26] 5 207,0 · 3883[0→3] 517,4`. **Samskeyti bókstafleg**, m.a. `3755 END = 3321 START` (3321 v0 = J61, 60/61-vegamót Þröskulda, z 42,058); endar: Búðardalur `bf.budardalur.insertedNode`, Hólmavík `th.holmavik.endpoint` (3883 v3). Enginn estimated connector. Niðurstaða: **gögn duga; ekkert vantar; engin kjarnabreyting.** Það er ekki „stytsta leið sem er rétt af því hún er geometry_only“ — hún er sú leið sem prompt og closure-plan nefna (Þröskuldar), staðfest á slice-röðinni.

**3. Sameinað net allra átta svæðisskráa.** 88 línur, connectorar −4 (5 mm, Búðardalur–Flókalundur) og −5 (4,39318262751713 m, 2271 END/3361 START → 53127 START), 0 átök. Endurskapar átta samþykktar lengdir innan ≤3e-11 m (B↔F 172 474,223; B↔J60 42 155,203; P↔T 17 114,943; P↔F 61 400,099; I↔H 223 136,989; I↔F 87 618,548; H↔J68 110 073,975; H↔J61 30 555,315). Að fjarlægja 16 blindgötu-stubba (3544, 3590, 2649, 3753, 2648, 2647, 1796, 1720, 1717, 1444, 3278, 24002, 3411, 2427, 2773, 2690) gefur **sömu niðurstöður** (74 línur).

**4. Endapunktanet {B=Búðardalur, F=Flókalundur, I=Ísafjörður, H=Hólmavík, P=Patreksfjörður, T=Tálknafjörður}: 15 óröðuð pör, 5 til nú, 10 ný** (úr stubbalausu sameinuðu neti, öll `geometry_only`, öfug stefna ≤6e-11 m):

| Par | Lengd (m) | Slices | Athugasemd |
| --- | ---: | ---: | --- |
| B↔H | 78 697,7705 | 12 | enginn connector |
| B↔I | 260 092,7711 | 38 | −4 (0,0050 m); um 3834; = B↔F + F↔I án tvítalningar |
| B↔P | 233 874,3218 | 28 | −4 og −5 (0,0050 + 4,3932 m); um 53127 |
| B↔T | 248 219,9897 | 28 | −4; 3361/2889 |
| F↔H | 154 887,0832 | 17 | −4 |
| F↔T | 75 745,7669 | 8 | 2271→3361 beint; **ekki** 53127/−5 |
| I↔P | 148 325,1015 | 24 | −5; um 3834 |
| I↔T | 162 670,7695 | 24 | um 3834 |
| H↔P | 216 287,1822 | 24 | −4, −5 |
| H↔T | 230 632,8501 | 24 | −4 |

Til nú: B↔F 172 474,223 · F↔I 87 618,548 · I↔H 223 136,989 · F↔P 61 400,099 · P↔T 17 114,943. **Hvert par með Ísafirði fer um 3834** (hringtorgsfyrirvarinn fylgir). Öll T-pör bera 995 m coverage-gatið. Pör þar sem P er endi en ekki millistaður eru rétt skeytt: F↔T fer ekki um Patreksfjarðarstubbinn 53127 (enginn tvítalinn stubbur).

**5. Hringvegshættan (junction-id í sameinuðu neti).** Sameinaða Vestfjarðanetið inniheldur **ekki** Hringveg (3103, 3406, 3407, 3408, 2243, 1481). Ef junction-id (J60 `junction-1-60-baulan`, J68 `junction-1-68-stadarskali`, J61) fá sameinaða netið skilar kjarninn `geometry_only` **ranga Vestfjarðahjáleið**: J60→J68 **219 478,016 m** (26 slices; rétt: **51 570,879 m** um Hringveg, 6 slices, 3544 v0 = 3103 v0 og 1796 v0 = 1481 END bókstaflega), B→J68 **177 322,814 m** (með Hringvegi 93 726,081 m). Aðrir Vestfjarðapör óbreytt með/án (B→H 78 697,771; F→J68 253 512,126; I→J68 332 176,118; B→J60 42 155,203). Þetta er hönnunarskilyrði fyrir skref 2 (P4), ekki ástæða til að bæta Hringvegi í runtime nú.

**6. Skilgreiningar sem prompt/plan misreikna.** „Ferjustaður“ í prompt-lið 6 er eintala; í CSV eru **tvær ferjuraðir**: 43 Brjánslækur (ferjuhöfn, vegtengd — akstur að höfn er samþykktur) og 44 Flatey á Breiðafirði (aðeins ferja). 11 af 31 CSV-röðum eru í `winter-route-places.json` (budardalur, reykholar, patreksfjordur, talknafjordur, bildudalur, thingeyri, isafjordur, bolungarvik, sudavik, holmavik, drangsnes); **veljanlegir Vestfjarðaendar í dag eru 6 place-id (B, F, I, H, P, T — og F er ekki í 56-lista) + 3 junction-id sem eru ekki place-id.** Dalsmynni, Þröskuldar og Hrútafjörður hafa sér junction-id þar sem raunvegamót er annað hnit en owner-punkturinn.

### Mat mitt á lokaskilyrðum (CC sannreynir og vísar í file/test/raunsvar)

| # | Skilyrði | Mín staða (sandbox/lestur) |
| --- | --- | --- |
| 1 | Auðkenni/útgáfa, endar, valkostur, geometry, tengipunktar | Að hluta. Vestfirðir: `regionVersion`, `geometryId`, `idButurIds`, `via` til. Hringpilot: `compositionVersion`/`datasetVersion`/`selectedOption`/`options[]`, **enginn `idButurIds`/`via` á toppi** (leiðanlegt úr `slices[].idbutur`). Föst leið: `FORECAST_POINTS` aðeins fyrir Vík/Borgarnes. Samningsmunur, ekki sjálfkrafa blocker (P3). |
| 2 | Reykjavík–Selfoss/Hella tveir valkostir | Til í hringpilot (south/north); CC vísar í próf + raunsvar. |
| 3 | Egilsstaðir–Seyðisfjörður veg 93 | Til (24 148,860880942146 m); vísun. |
| 4 | Viðsnúningur/same_place | **Ekki uppfyllt fyrir Vestfirði** (B1). Viðsnúningur uppfylltur á núverandi pörum. |
| 5 | Engin tvítalning | Uppfyllt pör fyrir pör; fyrir samsett par = skref 2 (B2). |
| 6 | Brotinn graf → unsupported/gagnagat | Uppfyllt á núverandi pörum (neikvæð próf fyrri lota); vísun. |
| 7 | Targeted próf | Að hluta — vantar same_place Vestfirðir og samsett pör (afleiðing af B1/B2). |
| 8 | Núverandi fastar leiðir | Aðskilinn flötur (`api/winter-route.js`, `routes.js`, `winterRouteRoutes.js`; raudavatn-vik, raudavatn-borgarnes), engin yfirfærsla í geometry-API (`borgarnes` er `unsupported` þar). CC keyrir núverandi focused próf og skráir; engin ný virkni. |

### Bindandi atriði (P1–P8)

**P1 — Stuðningslisti úr kóða, ekki úr plani.**
Listinn í scope-and-blockers.md er **myndaður með forskrift** úr raunhandler yfir öll pör af 56-lista + `flokalundur` + þrjú junction-id (60 id; raðað pör) og verður að endurskapa: **36 stefnupör / 18 óröðuð `geometry_only`** (10 hringpilot + 8 Vestfirðir); same_place fyrir nákvæmlega 5 id; `flokalundur`/`junction-*` `400 unknown_place_id`. Hvert par með lengd (±0,05 m, CC mælir sjálft), valkostum, `geometryId`/`regionVersion` og flokkun: veljanlegur endi / millistaður á geometry / óstuddur. Stefnupör sem eru óstudd flokkast í einn línu („öll önnur pör: `200 unsupported endpoint_mapping_unavailable`“); ekki 3 500 raðir. Hringpilotparin tíu (m.a. Egilsstaðir/Seyðisfjörður↔Rauðavatn/Selfoss/Hella) **eru með** þó plantafla sleppi þeim. Ekki kalla neitt par „samþykkt“ án lokamats; ekki endurtaka gömul sjö/níu-lotutöl.

**P2 — Töfluna um átta lokaskilyrði.**
Hver röð: uppfyllt (skrá/próf/raunsvar-vísun), sýndur blocker (B-númer) eða afhendingarmark. Raðir 1 og 8 skulu taka skýrt fram: tengipunktar eru **ekki** sama gerð á öllum flötum (Vestfirðir `idButurIds`; hringpilot aðeins `slices[].idbutur`; föst leið `FORECAST_POINTS` aðeins Vík/Borgarnes) og föstu leiðirnar eru sér flötur án yfirfærslu. Grænt geometry-próf er ekki sönnun um same_place/lokun/tengipunkta503. Akstursstefna áfram `UNVERIFIED` — samþykkt MVP-forsenda, ekki ný Vegagerðarkrafa.

**P3 — Raunpróf og tilraun A.**
Handler-keyrslur: Búðardalur→Hólmavík og Hólmavík→Búðardalur (nú `200 unsupported`), eitt viðsnúið núverandi par, `same_place` fyrir 5 id sem virka og eitt Vestfjarðaid (nú `unsupported`, ekki `same_place`). Tilraun A: **sameina svæðisskrár á sourceId** (assert að skarast sourceId séu JSON-eins; búist við 88 línur/2 connectorar fyrir allar átta, eða 2 skrár fyrir B↔H), raunkjarni, báðar áttir. Viðmið mitt: **B↔H 78 697,77054505677 m, 12 slices** í röðinni hér að ofan, `3755 END = 3321 START` bókstaflega, enginn connector, sama lengd öfugt (±1e-9). CC mælir sjálft og festir sínar tölur; frávik >0,05 m eða önnur slice-röð = STOP með mun. Engin ný gagnaöflun, engin ný runtime-landsvíkkun, notkun retained fullrar fitju bara read-only.

**P4 — Föst tillaga að skrefi 2 (bindandi að efni, CC sannreynir).**
Eitt sameinað Vestfjarðanet (stubbalaus 74 línur + connectorar −4/−5, eða sama net byggt með sourceId-sameiningu) fyrir **place-endapunkta {Búðardalur, Flókalundur, Ísafjörður, Hólmavík, Patreksfjörður, Tálknafjörður}** með **skýrum allowlist** yfir tíu ný pör: B↔I, B↔H, B↔P, B↔T, F↔H, F↔T, I↔P, I↔T, H↔P, H↔T, báðar áttir (tölur að ofan, sandbox-viðmið). **Minnsta afhendingarmengi ef Ripley vill skera:** B↔H (tilraun A, enginn connector), B↔I (3834 + −4, sannar skeytingu við tvö núverandi pör án tvítalningar) og H↔P (−4 og −5, sannar summu tveggja connectora); hin sjö bætast við án nýrrar hönnunar ef þau standast sömu próf — CC ber þetta undir eiganda aðeins ef eitthvað annað kemur í ljós. Skilyrði:
- Átta núverandi greinar halda sér **byte-eins** (`geometryId`, `regionVersion`, lengd); nýju pörin eru viðbót á undan almenna hliðinu.
- **Junction-id (J60, J68, J61) fara ekki inn í nýja allowlist**; J-pör með öðru en núverandi samþykktum pörum eru `unsupported`. Hringvegslínum er **ekki** bætt við í skrefi 2 nema eigandi ákveði það sérstaklega (þær eru til í retained gögnum og gefa J60↔J68 51 570,88 m, en það er utan samþykkts lágmarks); án þeirra skilar sameinað net rangri 219 km hjáleið (hættan hér að ofan).
- Próf/ályktanir: F/B/I/H↔T innihalda hvorki 53127 né −5 þegar T er áfangastaður um 2271→3361; engin tvítalin raunbrún; summa slices = `lengthM` = hnitakeðja; **`estimatedConnectorLengthM` er summa allra slices með `sourceId<0`** (B↔P: 0,0050 + 4,3932 m); **`lengthNote` er mynduð á hvern connector sem er á leiðinni** (ekki endurnýtt úr einu pari: tvö connector-par eins og B↔P/H↔P eiga að lýsa báðum); öll Ísafjarðarpör bera hringtorgsfyrirvarann (3834); öll T-pör bera 995 m coverage-flagg og `routeEndsShortOfOwnerCoordinate`; `accessApproach` lykluð á placeId; IdButur í ferðarröð, connector null sleppt.
- **same_place** fyrir öll studd Vestfjarðaid (B, I, H, P, T og F ef F verður veljanlegt). Samningurinn um `flokalundur` (nú 400) er **ákvörðun Ripley/eiganda**: tillaga mín er `flokalundur` verði veljanlegt í nýju pörunum og fái `same_place`, en ekki breyta gömlum 400 svörum fyrir óstudd pör sjálfkrafa.
- Ef eitthvað af þessu krefst breytinga á `geometryComposition.js`, nýrri gagnaöflun eða breytingu á núverandi greinum: STOP með minnsta valkosti áður en víkkað er. Ekki lofa Hringvegstengingu milli tier-0 Vestfjarða og hringpilots.
- Stutt leiðarsnið fyrir 502/503: einn texti sem lýsir hvaða reitir eru til á hverjum fleti (toppstaða og afleiðing úr `slices[].idbutur`), ekki ný breyting á gömlum pörum.

**P5 — Lokaður blockerlisti (skilyrði fyrir að vera á honum).**
Hver færsla: trigger, raunverulega ranga/vantandi niðurstaða (raunkeyrð), áhrif á samþykktan MVP, minnsta breyting/próf. Mín fræ (CC staðfestir með raunkeyrslu):
- **B1 same_place Vestfjarðaenda** — trigger: `from==to` á studdu Vestfjarðaid; raun: `200 unsupported endpoint_mapping_unavailable` (flokalundur `400`); áhrif: lokaskilyrði 4; lágmark: same_place-grein fyrir studd id, sama svarform og núverandi same_place, próf.
- **B2 samsett pör óstudd** — trigger: Búðardalur→Hólmavík (og níu pör til); raun: `200 unsupported`; áhrif: tengt Vestfjarðaflæði vantar; lágmark: P4.
- **B3 tengipunktasamningur (#503)** — **ekki blocker nema CC sýni villu**; samningsmunur leystur með P4-leiðarsniði, ekki breytingu á gömlum svörum.
Valfrjálst (sér kafli, aldrei blocker): `lengthNote`-prófaherðing (fyrri S1), innri hnútar festir við GeoJSON (S3/S4 fyrri lota), 0,01 m innri hnútar, Tálknafjarðarbæjartenging, Hringvegur Baulan–Staðarskáli sem runtime-grein. Engin viðbót í umferðum nema ný sýnd villa.

**P6 — Eftirfylgnitaflan: allar 31 CSV-raðir.**
Ein tafla (Röð 34–64; Búðardalur, Brattabrekka, Dalsmynni, Holtavörðuheiði, Gilsfjörður, Króksfjarðarnes, Reykhólar, Þröskuldar, Flókalundur, Brjánslækur, Flatey, Barðaströnd, Breiðavík, Látrabjarg, Patreksfjörður, Tálknafjörður, Bíldudalur, Dynjandi, Dýrafjarðargöng, Þingeyri, Flateyri, Suðureyri, Ísafjörður, Hnífsdalur, Bolungarvík, Súðavík, Steingrímsfjarðarheiði, Hólmavík, Drangsnes, Norðurfjörður, Hrútafjörður) með dálkum: staða (veljanlegur endi / millistaður á geometry / framtíðargrein / gagnagat / ferjuundanþága), **mæld fjarlægð í næstu retained línu og hvort samsett leið fer um hana** (forskrift, ekki sjón), framkvæmd sem vantar. Reglur: nálægð ein sér er **aldrei** endi; **Dalsmynni, Þröskuldar, Hrútafjörður = junction-id/millistaðir, ekki place-id**; Tálknafjörður = endi með 995,43 m gat; Brjánslækur (43) = vegtengd ferjuhöfn, framtíðargrein/gagnagat, Flatey (44) = ferjuundanþága; nákvæmlega raðir sem eru í dag veljanlegir endar: Búðardalur, Flókalundur, Patreksfjörður, Tálknafjörður, Ísafjörður, Hólmavík. **Tilgáta mín (ósannreynd — CC sannreynir með forskrift):** Brattabrekka, Gilsfjörður, Króksfjarðarnes, Barðaströnd, Dynjandi, Dýrafjarðargöng og Steingrímsfjarðarheiði gætu verið millistaðir á núverandi legg; Reykhólar, Þingeyri, Flateyri, Suðureyri, Hnífsdalur, Bolungarvík, Súðavík, Bíldudalur, Drangsnes, Norðurfjörður, Látrabjarg, Breiðavík eru greinar út úr leggjum (framtíðargrein). Önnur svæði úr 164-grunni: nafngreindir svæðisflokkar eftir CSV með fjölda raða, ekki sjálfvirk landsúttekt, engin ný GitHub-mál.

**P7 — Umfang og sannprófun.**
Aðeins `closure-scope/scope-and-blockers.md`, `closure-scope/cc-report.md` og workflow-færslur í CURRENT. Tímabundin forskrift **ekki** afhent sem framework (ef hún er geymd: aðeins í skýrslu sem endurtakanleg skipun, ekki í repo nema Ripley biðji). `git status` sýnir aðeins þessi skjöl; diff-check; skoða nýju skrárnar; skrá **nákvæmlega** hvaða athuganir voru keyrðar (handler-keyrslur, sameining, 31-raða forskrift, focused próf fyrir lokaskilyrði 8) og hverjar ekki. Fyrra 257/257 er fyrra lokamati eignað, ekki ný keyrsla; ekki fullsuite/mutation/build.

**P8 — STOP og heiðarleiki.**
Ekki fullyrða fullgert net, ekki hefja skref 2, ekki breyta kóða/runtimeJSON/eldri skjölum, ekki nýja netöflun/GitHub/commit/push/deploy. Takmarkanir haldast sýnilegar: `drivingAccess UNVERIFIED`, estimated connectors (5 mm og 4,39 m), owner-offsets, tier-0 planarlengd, Ísafjarðarhringtorg, Tálknafjörður 995 m. Ekkert sjónrænt PASS frá CC; engin kortaskoðun þarf í þessari lotu. Nýr óhjákvæmilegur arkitektúr/umfang utan planins: STOP með einföldustu valkostum áður en víkkað er.

### Valfrjálst (ekki blockerar)

- **S1:** closure-plan.md-taflan („Rauðavatn–Selfoss/Hella, Selfoss–Hella og Egilsstaðir–Seyðisfjörður“) mætti uppfæra í 10 hringpilotspör eftir að CC hefur sannreynt listann; ekki hluti af þessari lotu.
- **S2:** Ég hef ekki prófað samsetningu Vestfjarða við hringpilot (tier/kjarna-blöndun); ekkert í þessari yfirferð styður að hún virki — P4 bannar loforð um það.
- **S3:** 31 CSV-raðir eru 31 í mínu CSV-eintaki (Röð 34–64); ef CC fær annan fjölda: STOP og skrá mun.

### Mörk þessarar yfirferðar

- Enginn CC-kóði eða skýrsla enn; tilraunir mínar eru á sandbox-afriti af núverandi kóða (gegnum Tálknafjörð) og raunkjarna, ekki á CC-niðurstöðum. Ég las ekki GitHub #501 og keyrði ekki fastar-leiða prófin. Engin sjónræn athugun.
- Lengdir eru tier-0 planar, `drivingAccess: UNVERIFIED`; „studdur endi“ er MVP-skilgreining, ekki Vegagerðarstaðfesting. Umferð 2 aðeins ef eigandi biður um hana.
