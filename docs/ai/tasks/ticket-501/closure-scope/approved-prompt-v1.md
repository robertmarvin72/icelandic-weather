# #501 lokunarumfang — approved prompt v1 — 2026-11-20

Jonesy „samþykkjanlegt með bindandi P1–P8“ afgreitt APPROVED með atriðunum innfelldum. P1–P8 afrituð óbreytt neðar ganga framar Round1 þar sem nákvæmari. Eingöngu skjalaafhending/read-only tilraun, engin skref2-innleiðing. CC setur CURRENT CC_IN_PROGRESS eftir eiganda Prompt approved og CC_COMPLETE með report-path þegar lokið.

Eigandi hefur samþykkt að aðskilja frekari staðaþekju frá501. Verkefnið hér er lokaður stuðnings-/blocker-/eftirfylgnilisti og framkvæmanleg tillaga skrefs2, ekki ný samþykktarspurning um sömu verkaskiptingu. P4sameinað net/tíu ný pör er sannprófuð framkvæmdartillaga í skjalinu, ekki heimild til kóðabreytinga í þessari lotu. Færa6place-ID og3junction-ID rétt í lista, ekki teljajunction sem bæjarstaði. Same_place fyrirFlókalund er inni í tillögðu skref2-umfangi sem studdur endpoint; ekki breyta400svörum annarra óstudda para. Viðmið Jonesy eru sandbox-niðurstöður, CC keyrir sjálft og eignar rétt; ekki ný keyrsla Ripley.

Þröngar túlkanir vegna staðreynda: P1 „öll önnur pör200unsupported“ á aðeins við þekktID sem komast gegnum almenna hliðið. P4nýjunction-pör fara ekki í allowlist og halda raunverulegu fyrra400/200svari, ekki þvinga unsupported200 fyrir óþekktjunction. P6 Dalsmynni/Þröskuldar/Hrútafjörður eiga sér aðskilda junction-viðmiðun, ekki sömu hnit eða sjálfkrafa geometry-millistaði. Mæla fjarlægð og hvort VALIN samsett leið noti viðkomandi source-line; nálægð eða tilvist línu sannar ekki að owner-staðurinn sé heimsóttur. Brjánslækur er ferjuhöfn með retained610vegbút, Flatey ferjuundanþága; hvorugt bætist í nýja route-endalista.

P4próf áT-pörum og stubbum verða lýst fyrir framtíðarinnleiðingu, ekki skrifuð hér. Hringvegshættan er afmörkun: enginjunction-ID í nýja place-pair allowlist, engin ný Hringvegsruntimeinnleiðing. Lokun/503samningsmunur verður aðeins blocker ef raunathugun sýnir ófullnægjandi samþykktahegðun; valfrjáls normalisering ekki ný blocker. Full-net31raða fjarlægðarsamanburður er afmörkuð staðbundin forskrift úr retained gögnum, ekki ný landsöflun eða leiðakerfisúttekt.

Þegar nothæft skjal/afmörkuð tilraun/CCskýrsla tilbúin, stoppa. Engin ný review-lykkja vegna valfrjálsraS1–S3 eða ný staðapör. Enginn kóði/runtimeJSON/eldri skjöl/GitHub/commit/push/deploy.

# #501 lokunarumfang og afmarkaður blockerlisti

## Samþykkt Round1 — 2026-11-20

Eigandi samþykkti: „Já, aðskiljum frekari þekju og klárum #501 samkvæmt planinu.“ Þetta gengur framar fyrri kröfu um að klára frekari svæðisþekju innan sama miða. Staðir falla ekki úr vörumarkmiði. closure-plan.md er samþykkt verkaskipting; þessi lota er skref 1, ekki ný leiðainnleiðing eða heimild til að loka GitHub.

Markmið: eitt nothæft lokunarumfang og lokaður listi sýndra MVP-blockera fyrir skref 2. Ekki búa til nýtt review-/gagnakerfi eða endurrannsaka samþykktar leiðir. Samþykkt með P1–P8 hér neðar; CC bíður eiganda Prompt approved og CURRENT READY_FOR_CC.

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

## Bindandi Jonesy P1–P8 (óbreytt afrit)

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
