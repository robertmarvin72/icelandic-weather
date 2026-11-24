# #503 — lokamat MVP, 2026-11-24

**Niðurstaða uppfærð af Ripley 2026-11-24: heimilda-/tímabirtingin er nú innleidd og fær tæknilegt PASS (141/141, ESLint). Eigandi samþykkti nýju birtinguna 2026-11-24. Ég mæli með lokun #503 á neðangreindum MVP-mörkum; frekari innleiðingarlota er ekki nauðsynleg. GitHub-miðanum hefur ekki verið lokað.** Fyrra sýnilega criterion6-gatið er leyst; engin ný implementation-/review-lota nauðsynleg.

Miðinn lesinn beint af GitHub2026-11-24: https://github.com/robertmarvin72/icelandic-weather/issues/503 (open). Matið byggir á núverandi kóða, samþykktum lotum og varðveittum prófum; engin nýveitu-/vafrakeyrsla, engin GitHubbreyting.

| Lokaskilyrði #503 | Staða innan samþykkts MVP |
|---|---|
| Punktaval með fjallvegum/berskjöldun og skýrum takmörkum | Samþykktir sourcevertexpunktar m.a.Þröskuldar/Dynjandisheiði/Steingrímsfjarðarheiði/Hellisheiði/Holtavörðuheiði/Öxnadalsheiði/Fjarðarheiði. Punktspá, ekki samfelld þekja; óstaðfest berskjól/realheight ekki fullyrt. Gaps≈106km áVestfjörðum og≈111km áfyrrihringoption standa sem takmörk. |
| Röðun veðurs/færðar eftir valinni leið | PASS fyrir25núverandi studdUIpör/50áttir og8optionsvariant, handler-crosschecks; ósamhverfaroptionsáttir varðveittar. |
| SamiUTCtími, enginETA, utan glugga skýrt | PASS samkvæmt focusedprófum og samþykktum lotum. 24klstgluggi, exactlookup, liðnir tímar síaðir. |
| Aðeins valin leið; tilkynningar ekki áuppspunninhnit | PASS innan coarseIdButur-bindingar; engir uppspunnir noticepins. Jaðar/null-IDtakmörk sýnd. |
| Færð/lokanir/aðrar tilkynningar aðgreind, enginhjáleið | PASS samkvæmt raungagna-/stubprófum, engin route-wide opin/lokuðyfirlýsing. |
| Gagnatími/uppruni/stale/unknown/failure sýnilegt | **CC-uppfært 2026-11-24 (ticket-503/source-time, sjá cc-report.md í þeirri möppu): PASS með skráðu takmarki.** `WinterRouteDataView` birtir nú sömu fjóra fyrirvara + tvær attribution-línur + tvo tengla og legacy-sýnin, auk svar-tímastimpils (`generatedAt`, aldrei sóknartími), raun Vegagerðarútflutningstíma (`roadSections[].export.dagsKeyrtUt`, elsti gildi) og skyndiminnisaldurs fyrir færð og veður (aðskilið, aldrei falskt "0 mín" á `available:false`). **Samþykkt takmörk, ekki falið:** spáin ber ENGAN upstream-/líkanstíma í payload-inu (aðeins skyndiminnisaldur) — nákvæmur `fetchedAt` er áfram utan þessa MVP (sjá source-time/approved-prompt-v1.md). |
| Cache/request isolation og gömul svör hunsuð | PASS með föstum routevariantlyklum,abort/requestId/rendermask; nákvæmt multi-step delayedrace-scenario ekki allt sjálfstætt írepo, eldri delayedpróf og óháð yfirferð styðja vélbúnað. Ekki claim um próf sem ekki var keyrt. |
| Hámark/köll/chunk/cache og lengsta leið mæld | PASS innan MVP: max18punktar, eittbatch;≈1236kmringvariant og18punktasvar≈19536B skráð. Nochunk nauðsynleg. TTL/fallbackfyrirliggjandi.117köll ef allar kaltföturnar eru ræstar er reikningur, ekki SLA eða aksturspróf. |
| Enginforecasttierclip/scoring/entitlementbreyting | Óbreytt í samþykktumdiffum; þessarlotur ná ekki þeimkerfum. |
| Targetedtests röðun/lokun/UTC/gap/partial/stale | PASS samkvæmt lotuskýrslum; síðast228/228/ESLint/diffcheck sjálfstættkeyrt afRipley, ekki endurkeyrt nú. |

## Minnsta skrefið sem vantar — CC-uppfærsla 2026-11-24

**Þetta skref er nú innleitt** (ticket-503/source-time, `approved-prompt-v1.md` P1–P7, framkvæmt af CC — sjá þeirrar lotu eigin `cc-report.md` fyrir fulla tækni-/prófalýsingu, engin endurtekning hér). Stutt samantekt:

- Sama lagalegi/fyrirvaratexti og legacy-sýnin (`winterRouteModifiedBy`/`NoEndorsement`/`OfficialOverride`/`NotSafetyAdvice`) + tvær attribution-línur + tveir tenglar, nú líka í `WinterRouteDataView`.
- Nýr svar-tímastimpill („Svar útbúið {time} UTC") úr staðfestu `generatedAt` — aldrei sóknartími, aldrei „— UTC" á ógildu gildi (línan er þá einfaldlega sleppt).
- Nýr raun Vegagerðarútflutningstími („Færð: Vegagerðin keyrði gögnin út {time} UTC") úr elsta gilda `roadSections[].export.dagsKeyrtUt`, aðeins þegar `segmentsAvailable` er satt — ekki afleiddur `fetchedAt`.
- Skyndiminnisaldur færðar og veðurs sýndur aðskilið, aðeins þegar viðkomandi hluti er raunverulega `available` og `cacheAgeMs` er gilt/finite/≥0 — `available:false` með `cacheAgeMs:0` úr bakenda sýnir aldrei falskt „innan við mínútu".
- Tvö ný hrein hjálparföll í `src/lib/winterRoutePresentation.js` (+ próf): `formatValidatedUtcTimestamp`, `cacheAgeMinutesDisplay`.
- Engin bakenda-/cache-/geometry-/punktaþéttingarbreyting. Spáin hefur **áfram ENGAN** upstream-/líkanstíma — samþykkt, skráð takmörk, ekki falið.

Óháð eigandayfirferð/RESULT_REVIEW samkvæmt venjulegu workflow sker úr um hvort þetta nægir til lokunar #503 á núverandi MVP-mörkum; CC tekur enga afstöðu til þess hér.

## Afmörkun við lokun

25 af55mögulegum pörum meðal11UIstaða eru studd (15Vestfirðir+10hringpör);30mixedpör áframunsupported.25/28APIgeometrypör gagnatengd;3junctionpör hafa enganUIinngang og má skilgreina áfram utan þessaMVP ef eigandi samþykkir lokun ánúverandiUIumfanginu.56nafngreindirstaðir eru ekki allir kortlagðir/aðgengilegir. Rauðavatn↔E/Sey er eina núverandinorðurleiðin, enginn nýr suðurvalkostur. Þunn punktþekja og UNVERIFIEDgeometry eru samþykkt/sýnileg takmörk, ekki sjálfvirkt nýttverk.

Þegar litla heimilda-/tímabirtingin virkar og focusedcheck stendur, er einfaldasta leiðin að mæla með #503lokun áþessumMVPmörkum, án nýrrar almennrarþekjulotu. Eigandi ræður scopeákvörðun/commit/push og veitir síðan sérstaka GitHublokunarheimild eftirpush samkvæmt docs/ai/README.md. Núverandi ring-completion StageCLOSED/PASS helst; þetta mat enduropnar ekki samþykkta lotu eða kallar sjálfkrafa áþriðjureviewumferð.

Enginn appkóði/próf/runtimegögn breytt, engin netköll aðveður-/vegaveitu, commit/push/deploy/GitHubwrite eða nýprompt hringur hér.


## Lokastaðfesting Ripley — source-time, 2026-11-24

Jonesy PASS staðfest og Ripley endurkeyrði `src/lib/winterRoutePresentation.test.js`15/15 og `src/pages/WinterRoute.test.jsx`126/126 áWindows með sjálfgefnum tímamörkum,141/141. ESLint á framleiðsluskrám þessarar lotu PASS. Engin nýraunnet/vafrakeyrsla; skjáskot/vafri eignuðCC. Eigandi skoðar síðustu birtinguna áður en lotu er lokað.

**Varðveitt legacy-takmörkun:** `winterRouteAcquiredAt` í gömlu föstu sýninni segir „Færðargögn sótt“ um `generatedAt`. Það er eldri ónákvæm merking: serverstimpill er tekinn fyrir fetch, ekki tryggður sóknartími. Nýja gagnasýnin greinir þetta rétt. Legacy-orðalagið er óbreytt samkvæmt samþykktu source-time umfangi; það heimilar ekki sjálfvirka nýja lotu og er ekki sönnun um nýtt upstreamfetchedAt.

Lokuð lota og lokun GitHub eru aðskildar: eigandi samþykkir viðmót, commitar/pushar sjálfur og getur síðan heimilað lokun #503.25studduUIpör/3junctionundanþága/þunnpunktspá eru þau mörk sem ráðleggingin byggir á.


## Eigandasamþykki — 2026-11-24

Eigandi samþykkti source-time eftir lokamat. Framkvæmdalotur allar PASS/samþykktar. Ráðlegging: loka #503 á núverandi skráðum MVP-mörkum eftir commit/push og sérstaka lokunarheimild; ekki gera nýjar sjálfvirkar þekju-/reviewlotur. GitHub ekki breytt hér.
