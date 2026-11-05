# #493 — Upphaf og áfangastaður: innviðaúttekt og útfærslutillaga

## Ripley — umferð 1, 2026-11-05

Til Jonesy prompt-review. Þetta er umræðu-/rýniskjal, ekki execution-heimild. Eigandi hefur óskað eftir nýju prompti. Fyrri lota #491 er CLOSED. Þessi lota sinnir aðeins fyrsta skrefi #493: yfirferð núverandi innviða, stutt tillaga og skýr gagnagöt. Engin appinnleiðing eða ný gagnaöflun er heimiluð hér.

Miði lesinn af GitHub 2026-11-05: https://github.com/robertmarvin72/icelandic-weather/issues/493 — „Winter Route: Velja upphafsstað og áfangastað“. Markmið heildarmiðans er samsetning leiða úr skilgreindum stöðum við Hringveginn, tvær áttir, styttri vegalengd sjálfgefin, sameiginlegur spátími, nýjasta færð aðgreind frá framtíðarspá. Miðinn krefst innviðaúttektar áður en innleiðing hefst. Þessi A-lota lýkur ekki heildarmiðanum.

### Staðfest í undirbúningi Ripley (lestur, ekki keyrsluprófun)

- `/winter-route` er skráð í `src/AppRoutes.jsx`; núverandi síða er UI-inngangurinn sem á að endurnýta.
- `api/_lib/winterRoute/routes.js` skilgreinir tvær fastar leiðir: Rauðavatn–Vík og Rauðavatn–Borgarnes. `segments.js` geymir Vík-gögn; frontend hefur sér display-/expectedPointCount töflu í `src/lib/winterRouteRoutes.js`.
- `api/winter-route.js` samþykkir allowlisted routeId, sækir tvö færðarfeed og eina fjölpunkta spá fyrir valda leið. Hann skilar routeId/expectedPointCount og síuðum köflum/punktum. Þetta sannar ekki þekju fyrir allan Hringveginn.
- `cache.js` er module-memory per-route cache, road TTL 5 mín., forecast TTL 15 mín., stale mörk 30/60 mín. Engin tryggð deiling milli serverless instance/cold starts.
- `forecastFetch.js` notar fimm núverandi klukkutímabreytur, UTC, 24 klukkutíma frá næsta heila tíma. Lykilvöntun stöðvar spásókn í öllum umhverfum. Hvorki þjónustukostnaður né hámark fjölpunkta var sannreynt hér.
- `WinterRoute.jsx` notar `resolvePointAtDeparture` í spákortum og brottfararsamanburð. Þessa hegðun má ekki flytja óbreytta í #493: sami valdi spátími á að gilda alls staðar, ETA og brottfararráðleggingar eru utan umfangs.
- #429 coverage geymir punktasýni fyrir fleiri staði en núverandi leiðir, en merkir meðal annars leið B PARTIAL. Eldri punktasýni/færðar-ID eru ekki sjálfkrafa samfelld, stefnurétt leiðarlína. #491 hefur sérstakar INFERRED forsendur sem ekki má hækka í VERIFIED við endurnýtingu.

### Fyrirhugað execution-prompt — A eingöngu

Lestu AGENTS.md, CLAUDE.md og docs/ai/README.md/CURRENT.md. Aðeins eftir Jonesy-yfirferð, approved-prompt skrá og eigandahandoff má CC framkvæma þetta. Fylgdu öllum CC-stigaskiptum. Skilaðu skjalfestri úttekt; ekki breyta appkóða, prófum, dependencies eða frumgögnum.

1. **Rekja raunverulegt gagnaflæði.** Lestu `api/winter-route.js`, `api/_lib/winterRoute/{routes,segments,roadFetch,roadConditionCodes,freshness,forecastFetch,validateForecast,cache,boundedFetch}.js`, `src/pages/WinterRoute.jsx`, `src/lib/winterRoute{Routes,Eta,Summary,Comparison,Presentation}.js`, tengdar þýðingar/próf og UI-innganga. Athugaðu raunveruleg skráarheiti; Summary hér vísar til `winterRouteSummary.js`. Skráðu request → route resolution → feeds/forecast → normalization/validation → cache/fallback → response → state/race-vörn → röðun/spátímavörpun/samantekt. Aðgreindu keyrslukóða frá gömlum athugasemdum. Tilgreindu föst stærðarmörk og hvar 6/4 eða ETA-forsendur lifa enn. Engin breyting á gating/scoring/entitlement/payment eða sameiginlegum forecast-inntökum.

2. **Varðveitt gögn fyrst; uppruni og takmörk.** Notaðu #429 `research-report.md`, `coverage.csv`, `samples/manifest.md`; #483 `research-report.md`, `route-segments.csv`, `samples/manifest.md` og viðeigandi tilvísaðar frumskrár; #485 varðveitt sýni eftir þörfum; #491 `final-validation/evidence-table-final.md`, `final-validation/route-data-candidate.json`, `derivation-29-pieces.md` og nýjustu yfirferðir í `result-review-implementation.md`. Fylgdu heimildum að frumgögnum þegar fullyrðing byggir á þeim. Nýjasta leiðrétting ræður fram yfir afturkallaða eldri fullyrðingu. Aðgreindu geometry-pieces/IDFERILL frá færðarköflum/IDBUTUR og punktatilkynningum; einn færðarkafli getur náð út fyrir valda leið. Útskýrðu hvort hægt sé að afmarka tilkynningar innan hlutkafla með fyrirliggjandi gögnum. Ekki skálda stefnu, lengd, hnit eða tengingu út frá heiti/nálægð einni saman.

3. **Þekjuskrá og gagnagöt.** Skráðu núverandi studda staði/endapunkta nákvæmlega (Rauðavatn er ekki sjálfkrafa miðborg Reykjavíkur), fyrirliggjandi tengingar, ordered weather points með id/heiti/hnitum/leiðartengingu, færðar-ID og lengdarheimildir. Aðskildu fyrirhugaða valstaði frá staðfest studdum stöðum. Gefðu þétt yfirlit um Hringveginn sem sýnir hvaða bil hafa sannreynda keðju, aðeins stök sýni eða óþekkta þekju; ekki kalla óskoðað bil fjarverandi gögnum. Hvert gap fær heimild, VERIFIED/INFERRED/UNKNOWN, áhrif, næsta afmarkaða aðgerð og hvort þarf eigandaákvörðun eða nýja gagnaöflun. Sérstaklega: báðar akstursáttir, hringtorg/aðskildar akreinar/göng, núverandi Hringvegslega, tengingar valstaða, útgangur úr heilli færðarlínu á hlutkafla, berskjaldaðir kaflar/fjallvegir og stöðug sameiginleg punktaauðkenni. Ekki er heimilt að fylla götin í þessari lotu.

4. **Minnsta útfærslutillaga, engin innleiðing.** Berðu röð tengdra, skilgreindra vegkafla við þörf á ytri leiðaþjónustu. Leggðu til einfalt gagnalíkan fyrir staði/tengivegi, hringkeðju/lengdir, spápunkta og færðartengingar; útskýrðu tvær áttir, millistaðanöfn, styttri vegalengd/tie-reglu, viðsnúning röðunar og lokun án sjálfvirks skipts. Óstaðfest gráf-/leiðarlíkan er tillaga, ekki tilbúin leið. Sams konar upphaf/endi á að gefa skilaboð, ekki óbeinan heilan hring. Heilan hring má nota sem innra afkastaviðmið, ekki bæta nýju notendaflæði við. Gerðu skýrt hvernig núverandi tvær leiðir geta haldið áfram eða færst yfir án ósannaðrar regression-fullyrðingar. Minni staðaþekja er valkostur til eigandaákvörðunar, ekki sjálfvirk skerðing á kröfu um báðar leiðir um Hringveginn.

5. **Tími og UI-áhrif.** Skráðu hvaða ETA-, brottfarar-, ±2 samanburðar-, samantektar- og copy-notkun þarf að fjarlægja eða aðlaga fyrir sameiginlegan spátíma. Aðgreindu framtíðarveður frá nýjustu færð, gögn sótt frá export-/registration-tíma og stale/error/unknown. Skýr out-of-window hegðun; gagnaskortur ekki góð skilyrði; punktspá ekki samfelld veðurþekja. Lýstu lágmarks Frá/Til leitarbærum reitum, víxlhnappi og millistaðamerktum leiðarvalkostum á núverandi síðu, með síma-/lyklaborðsþörfum og IS/EN. Ekki hanna nýja síðu eða velja dependency. Ekki varðveita ferðaframvindu-/öryggisfullyrðingar í texta.

6. **Afköst, mörk og notkun.** Rekja núverandi call count og cache-hætti, með köldu/heitu instance, sameiginlegum punktum á mismunandi leiðum, tvöföldum in-flight beiðnum, fallbacks og hröðum leiðarskiptum. Leggðu til skýrt hámark punkta/beiðni og reglur um lengri leiðir/batching/partial failures og bounded cache-key cardinality; óstaðfest veituhámark má ekki verða staðreynd. Áætlaðu stutta/langa leið og heilan hring með skýrum N-punkta/H-klukkutíma/B-batch forsendum; aðgreindu HTTP-köll frá hugsanlegum billable einingum. Ef N er óþekkt sýndu formúlu og merkt dæmi, ekki tilbúna fullhringsmælingu. Paid-only/missing-key vörn, timeout/size bounds og bann við lyklum í loggum halda gildi. Route-change/response identity verður að ná yfir upphaf/enda/átt/gagnaversjón og koma í veg fyrir gömul gögn, líka A→B→A og stale fallback. Ekki leggja til nýtt dreift cache eða innviðaútvíkkun nema rökstutt sem sérstaka eigandaákvörðun.

7. **Þjónustur og heimildir.** Engin ný þjónusta valin sjálfkrafa. Meta fyrst hvort retained gögn duga til að mæla með núverandi þjónustum. Skrá fyrirliggjandi notkunarréttindi/attribution/takmarkanir og aðgreindu sönnuð atriði frá óstaðfestum núgildandi skilmálum/verðum/kvótum. Þessi lota heimilar engin netköll, live-provider próf, lyklalestur eða kostnað. Ef þörf er á nýrri þjónustu eða staðfestingu núgildandi skilmála, skrá nákvæma rannsóknarbeiðni fyrir næstu samþykkt: opinberar heimildir, spurningar, afmörkun og kostnaðaráhættu. Engin ný dependency, WFS-landssöfnun eða ný geómetríuvinnslukerfi.

8. **Afhending.** Búðu til `docs/ai/tasks/ticket-493/infrastructure-audit.md` með stuttri aðaltillögu, núverandi gagnaflæði, studdri þekju, tillögu að gagnalíkani, traceable gap-töflu, call-budget og ákvörðunum eiganda. Aðgreindu hvað má endurnýta núna, hvað þarf yfirfærslu og hvað er BLOCKED. Búðu til `cc-report.md` með lesnum heimildum, framkvæmdri sannprófun og takmörkum. Skilaðu `GO_FOR_IMPLEMENTATION_PROMPT` eða `BLOCKED_FOR_IMPLEMENTATION` með nákvæmum forsendum; hvorugt heimilar appvinnu. Heildarmiðinn er ólokinn. Leggðu til acceptance-/test matrix fyrir seinni innleiðingu: stutt/löng leið, báðar áttir, víxlaðir endar, sami staður, jafnlangir valkostir, shared/endapunktar án tvítalningar, óviðkomandi kaflar/notices útilokaðir, lokun, missing/stale/error, sameiginlegur spátími/out-of-window, lengsta leið/batch-failure, race/cache isolation og mobile/keyboard IS/EN. Skjáskot eru afhendingarkrafa seinni innleiðingar, ekki fölsuð sönnun í docs-lotu.

### Sannprófun og STOP

- Heimilt er að lesa og gera litla offline talningu/afleiðslu úr varðveittum gögnum með fyrirliggjandi tólum. Skráðu endurkeyranlega skipun og heimild fyrir tölum sem þú reiknar; ekki ný stór harness eða dependencies. Óþarft að keyra app-próf/lint/build fyrir þessa docs-only úttekt; ókeyrt skal merkt ókeyrt.
- Skrif aðeins í `docs/ai/tasks/ticket-493/` og lögboðnar CURRENT.md færslur. Varðveittu fyrri task-sögu og fyrirliggjandi óskyldar breytingar. Engin subagents, commit, push, GitHub-mutation, deploy eða raunveituköll. Production NOT_TESTED.
- Gagnagat stöðvar háða niðurstöðu, ekki óháða úttekt: skilaðu gagnlegu yfirliti og nákvæmri hindrun. Óleyst vöruákvörðun, nýr kostnaður, dependency, þjónusta eða umfangsaukning => tillaga til eiganda, engin sjálfvirk framkvæmd.
- Eftir afhendingu: skrá cc-report slóð, CURRENT → CC_COMPLETE; eigandi → Jonesy → Ripley. Appinnleiðing þarf sérstakt yfirfarið prompt eftir mat á þessari úttekt. #493 er ekki lokað við lok A-lotu.

### Jonesy — review-áherslur

Meta hvort A-afmörkun uppfylli fyrsta skref miðans, gömul ETA-hegðun sé skýrt aðgreind frá nýrri kröfu, gögn úr #429/#483/#485/#491 séu ekki ofmetin, báðar leiðir/hlutkaflar/tengivegir séu raunhæft afmarkaðar og call-budget sé heiðarlegt án live rannsókna. Rýna hvort listaðar afhendingar dugi til að velja næsta afmarkaða skref. Verdict: PENDING.

## Jonesy review — umferð 1 (2026-11-05)

### Niðurstaða: APPROVED MEÐ SKILYRÐUM A1–A5 (skilyrði eru skjalaleg; þarf að brjóta inn í approved-prompt áður en CC keyrir)

A-afmörkunin (docs-only úttekt, engin appbreyting, ekkert net/lykill/kostnaður, engin ný þjónusta) uppfyllir fyrsta skref miðans og heldur nýrri kröfu um sameiginlegan spátíma greinilega frá gömlu ETA-/brottfarar-/±2 hegðuninni (item 5). Call-budget er sett fram sem formúla með merktum dæmum, ekki sem mæling, og HTTP-köll eru aðgreind frá billable einingum (item 6). Production NOT_TESTED. Ekkert keyrt á vél eiganda; ég keyrði engin próf/lint/build/git/vafra og engin netköll.

### Sandbox-athuganir mínar (lestur og lítil offline talning úr staged afritum; ekkert net, enginn lykill)

- **Staðhæfingar Ripley staðfestar í kóða:** öll nefnd skráarheiti í item 1 og 2 eru til (`api/_lib/winterRoute/{routes,segments,roadFetch,roadConditionCodes,freshness,forecastFetch,validateForecast,cache,boundedFetch}.js`, `src/lib/winterRoute{Routes,Eta,Summary,Comparison,Presentation}.js`, #429/#483/#485 `research-report.md`/`coverage.csv`/`route-segments.csv`/`samples/manifest.md`, #491 `final-validation/{evidence-table-final.md,route-data-candidate.json}` og `derivation-29-pieces.md`). `cache.js`: `ROAD_TTL_MS` 5 mín., `FORECAST_TTL_MS` 15 mín., `ROAD_MAX_STALE_MS` 30 mín., `FORECAST_MAX_STALE_MS` 60 mín., single-flight og per-routeId bucket. `forecastFetch.js`: fimm hourly-breytur, UTC, 24 klst. frá fyrsta heila tíma STRANGLEGA eftir `now`. Þær eru VERIFIED að lestri, ekki keyrðar.
- **Mikilvægt fyrir call-budget:** `buildForecastUrl` sendir **eina** HTTP-beiðni á leið með öllum punktum í `latitude`/`longitude` (kommulistar). HTTP-köll á leið eru því föst (1 spá + 2 færðarfeed), en billable einingar fara líklega eftir punktafjölda × klukkutímum × breytum. Það er óstaðfest hér; item 6/7 verða að byggja á varðveittu `ticket-485/samples/openmeteo-pricing.html` og skrá ósannað sem ósannað.
- **#429 `coverage.csv`:** 21 gagnaröð; leið A = Reykjavík–Vík (9), **B = Reykjavík–Akureyri (9)**, **C = Reykjavík–Borgarnes (3)**. Þetta eru checkpoint-/stöðvasýni, ekki samfelld keðja. Fjórar raðir hafa 29 reiti á móti 28 í haus (óvarið komma): A Skógar, B Borgarnes, B Holtavörðuheiði, B Vatnsskarð (`csv.reader`, línur 8, 11, 13, 16). `DictReader` skilar því röngum `evidence_grade` fyrir þær (t.d. „3“ fyrir Holtavörðuheiði og Vatnsskarð).
- **#429 `harness/05_coverage_consistency_check-output.txt`:** engin af 22 notuðum IDBUTUR í sýninu hefur DATEX RoadCondition-færslu; fjarvera má ekki lesa sem „opið“.
- **#485 `coverage.csv`:** spans 1–6 Vík megin PASS fyrir geometry og state, span 0 (Reykjavíkurinngangur) UNKNOWN með leiðréttingunni v2; allt `axis4_forecast_required` NOT_TESTED og `axis6_rights_access` PARTIAL.
- **GitHub-miði #493:** ég las hann ekki (ekkert net). Lýsingin á kröfum miðans í umferð 1 er Ripley-eignuð og óstaðfest af mér.

### Skilyrði (bundin við samþykkið)

- **A1 — heimildalistinn vantar rights-/þjónustuskrárnar.** Item 2 nefnir aðeins „#485 varðveitt sýni eftir þörfum“ og item 7 nefnir engar heimildir. Réttindin og takmarkanirnar liggja í #485: `blocker-rights-register.md`, `owner-clarification-2026-11-02.md`, `research-report.md`, `coverage.csv`, `route-point-mapping.csv`, `final-bounded-report.md`, `samples/openmeteo-{pricing,terms}.html`, `samples/manifest.md`; auk #429 `source-register.md`, #483 `samples/vegagerdin-skilmalar.html` og repo-skjalsins `docs/open-meteo-auth.md` (lestur, ekki `.env`). Án þessa gæti CC skráð skráð atriði sem UNKNOWN eða öfugt. Bæta þeim við item 2 og 7 sem skyldulestur; núgildandi skilmálar/verð haldast óstaðfest nema retained sýni sanni (dagsett 2026-11-02).
- **A2 — merking og gagnagæði #429.** Skrá í úttektinni að „leið B“ í #429 er Reykjavík–Akureyri og C Reykjavík–Borgarnes, en #491 `raudavatn-borgarnes` er sérstök keðja; ekki sameina. Krefjast `csv.reader` með reitafjöldaprófi (fjórar raðir að ofan) og skrá ósamræmið í cc-report; engin ályktun úr sköruðum reitum.
- **A3 — viðsnúningur raðar er ekki sönnun fyrir gagnstæða átt.** #491 H1-keðjan er INFERRED nálgun að norðurleið (VEGHLUTI 1/6, 2982 útilokað eftir nafni, ~10 hringtorg brúuð með beinum native-bilum, ekki bogum). Úttektin verður að skrá gagnstæða átt (og Vík→Rauðavatn) sem UNKNOWN/INFERRED nema gögn um gagnstæða akrein/aðskildar akreinar/göng séu skoðuð, og gagnamódel þarf annaðhvort stefnuháð gögn eða skýra, merkta INFERRED forsendu um jafna lengd í báðar áttir.
- **A4 — niðurstöðumerkin eru of tvíunda.** `GO_FOR_IMPLEMENTATION_PROMPT`/`BLOCKED_FOR_IMPLEMENTATION` ná ekki yfir líklegustu niðurstöðuna: studd undirmengi (Rauðavatn, Vík, Borgarnes) án þekju á öllum Hringveginum, sem er eigandaákvörðun samkvæmt item 4. Bæta við þriðja merki, t.d. `BLOCKED_PENDING_OWNER_SCOPE_DECISION` með nefndum studdum undirmengjum, svo „BLOCKED“ sé ekki lesið sem „ekkert má“. Hvorugt merki heimilar appvinnu (óbreytt).
- **A5 — texti miðans sem rekjanleg heimild.** Acceptance-/test matrix og krafa um „sameiginlegan spátíma“ verða að rekjast til texta #493. Setja skilyrði: eigandi/Ripley lætur dagsett afrit af miðanum í `ticket-493/` (eins og `issue-483-2026-10-28.json`) áður en CC keyrir, eða cc-report skráir að CC gat ekki lesið hann og matrixið er merkt „tillaga“, ekki „úr miðanum“.

### Athugasemdir (ekki skilyrði)

- **N1:** verkið er umfangsmikið (8 liðir, 7 yfirlitslög). Mælt með að CC skrifi `infrastructure-audit.md` í áföngum og merki í hverjum kafla hvað er lokið, svo stöðvun vegna gagnagats skilji eftir nýtilega hluta (prompt segir þetta í anda; engin ný krafa).
- **N2:** „Ekki varðveita ferðaframvindu-/öryggisfullyrðingar“ er rétt; bæta mætti við að núverandi H1-/ETA-takmörkunartexti (#491) sé ekki endurnotaður sem staðfesting á nýjum leiðum.

### Mörk

Þetta er prompt-review; engin gögn eða appkóði breytt og engin keyrsla heimiluð. Allar tölur hér eru úr lestri/talningu á staged afritum í sandbox. Stage helst PROMPT_REVIEW. Næsta skref: Ripley brýtur A1–A5 inn í `approved-prompt-v1.md` og setur READY_FOR_CC; Róbert commit-ar sjálfur.

## Ripley — samþykki fellt inn, 2026-11-05

Jonesy APPROVED með A1–A5 samþykkt. Búið til approved-prompt-v1.md með skyldulestri réttinda-/þjónustuheimilda (A1), csv.reader reitafjöldaprófi og skýrri B/C-aðgreiningu (A2), stefnu-/akreinagagnavörn (A3), þriðja scope-niðurstöðumerki (A4) og dagsettu GitHub-afriti issue-493-2026-11-05.json (A5, sótt af Ripley). N1 áfangaskrif og N2 engin uppfærsla H1/ETA-takmarkana í sönnun einnig tekin inn. Engin appvinna eða ný veitugagnaöflun. CURRENT → READY_FOR_CC. Næst eigandi → CC: „Prompt approved“.

## Ripley — leiðréttingarlota til review, 2026-11-05

Eftir CC A-afhendingu og Jonesy REVISE W1–W3: lokamat Ripley REVISE. Næsta afmarkaða prompt er `docs/ai/tasks/ticket-493/correction-prompt-review.md` (umferð 2, docs only). Full fyrri review-saga hér varðveitt, v1 immutable. Jonesy → „Review uppfært“ áður en approved v2 er búið til.
