# #501 — Síðasta B2-tilraun, Round 1 — 2026-11-17

Eigandi samþykkti eina síðustu tilraun eftir ráðleggingu Ripley: laga tvöfaldan Host, sýna eina Host-línu í staðbundinni raw-beiðnisupptöku og senda sama kall með sömu mörkum. Eftir þetta stöðvast B2-sókn hvort sem gögn finnast eða ekki. Engin fjórða tilraun eða ný rannsóknarlota sjálfvirkt. Þetta er ekki samþykki á að brúa bilið eða route-innleiðingu.

Jonesy yfirfer þennan þrönga prompt/manifest. Eftir APPROVED býr Ripley til approved-prompt-v1, CURRENT READY_FOR_CC; eigandi sendir Prompt approved til CC. Engin ný upstream beiðni fyrir það.

## Lágmarksfix og staðbundin staðfesting

Afrita b2-retry wrapper í þessa nýju möppu; aldrei breyta fyrri attempts/marker/raw/reviews. Eina fyrirhugaða hegðunarbreytingin er að eyða explicit conn.putheader("Host", parts.netloc), nota eina Host-línu frá putrequest. Halda R1–R3 persistence/validator/deadline/cap óbreyttu. Heimilt að breyta aðeins attempt-ID/output-slóð/ledger-guard fyrir þessa möppu. Ekki endursmíða wrapper/framework.

Staðbundið raw-socket/mock próf keyrir sama bounded_get og dispatch og tekur upp HTTP request bytes: nákvæmlega ein Host-lína með réttu host[:port] fyrir próftengingu, engir tvöfaldir aðrir hausar, GET/path/query óbreytt. Samanburður við stdlib conn.request baseline er local, ekki upstream. Prófið þarf að falla á gamla duplicate-Host kóðanum og standast með fixi; gamla skrá ekki breytt til að sýna það (local temp/mock útgáfa leyfð). Keyra núverandi 13 focused self-tests á keyrsluvél ásamt nýju header-prófi. Engin app-suite/build/lint eða ný dependency. Self-test sendir ekkert á gagnaveita host og notar sérstaka task-local temp möppu. Ef þessi nauðsynlegu próf standast ekki: ekki senda raunkall, skila bilanaskýrslu og hætta þessari B2-sókn; ekki gera fleiri verkfærarannsóknarlotur sjálfvirkt.

## Nákvæm eina heimilaða request

request-manifest.json afritar exact URL/decoded params/request-hash/bbox/caps úr attempt2; nýtt attempt3-ID og nýtt exclusive marker. Max1 GET, sama host/path/typeName/bbox/native EPSG:3057/JSON/maxFeatures100; body1MiB, overall20s wall, 0 retry/redirect/probe/HEAD/pagination. Ekki breyta query til að fá grænt svar. Fyrri slóðir og marker eru óbreytt. SHA fyrir fyrri wrapper+marker staðfest fyrir/eftir. Við tilvist nýs marker/ledger/raw hér: ekki endurkeyra. Hvert dispatch telur líka við HTTP/tooling bilun.

## Afhending og stöðvun

Ný raw/headers/atomic ledger/UTC start-end/serverDate/SHA/status/failure_reason varðveitt hér með sömu persistence/partial reglum og attempt2. Aðeins complete_usable með réttu JSON/count/CRS og ekki cap/truncation leyfir geometry-samanburð. Endurnýta retained baseline16 úr staðbundnum gögnum; engin önnur netköll. Við gilt svar skrá ný/breytt/retained feature/tier og hvort B2 connector sé sýndur, án snapping/tier-blöndunar/akstursheimildarályktunar. Við bilun/truncation: ekkert efnislegt svar. Útkoma neikvæð þýðir aðeins ósannað í þessum gögnum, ekki vegaleysi.

final-report.md + cc-report.md stutt með Host red/green local proof, self-tests, exact actual dispatch0/1, råw/ledger hashes, niðurstöðu/takmörkun og skýru “B2-sókn stöðvuð eftir þessa tilraun”. Engin ný B1/C1/önnur box/metadata/graph/routeId/UI/server_data/gömul docs breyting. Leyfð skrif aðeins b2-final-attempt/ og CURRENT CRLF. Engin env/credentials/GitHub/commit/push/deploy. Engin breyting á 56-markmiði eða innleiðingarreglum um gap. Engir processes skildir eftir.

CC_IN_PROGRESS fyrir vinnu, CC_COMPLETE eftir afhendingu. Jonesy narrow review/Ripley lokamat. Frágangur heiðarlegrar niðurstöðu, ekki fullkomin fetch-library, er samþykktarsvið. Frekari aðgerð eftir þetta er aðeins ný vöru-/eigandaákvörðun, ekki enn ein B2-tilraun. Jonesy: APPROVED/REVISE aðeins fyrir sýnda galla sem brjóta þessa einu tilraun; engin valfrjáls útvíkkun.

## Jonesy review — umferð 1 (2026-11-17)

**Niðurstaða: APPROVED fyrir Host-fixið og eina síðustu óbreytta beiðni (attempt-3). Engin REVISE-krafa; engin blocker.** Ekki netheimild: kallið krefst approved-prompt frá Ripley, READY_FOR_CC og „Prompt approved“ frá eiganda. Engin net-/GitHub-köll, ekkert keyrt á vél eiganda; allt hér er **sandbox-staðfest (mitt, 127.0.0.1 og fake-socket eingöngu)**.

### Staðfest
- **Manifest óbreytt að efni:** `url`, `decoded_params`, bbox, caps og `encoded_request_sha256` (8719083019…35fe; `sha256("GET "+url)` stemmir) eru eins og í attempt-2; aðeins `status`, `request_id`, `previous_attempt` og `final_attempt` breytast.
- **Fixið er rétt og dugar (rauð/græn sýnd á raunverulegu wrapper-skránni):** ég tók `b2-retry/b2_fetch.py` og bjó til afrit sem eyðir nákvæmlega einni línu, `conn.putheader("Host", parts.netloc)` (`diff`: aðeins lína 271). Með því að keyra raunverulega `bounded_get` gegn raw-socket þjóni á 127.0.0.1 og taka upp beiðnisbætin: **gamla skráin sendir 2 Host-línur** (`Host, Host, User-Agent, Accept`), **nýja sendir 1** (`Host, User-Agent, Accept`). Þetta staðfestir bæði orsökina frá umferð 1 og að fixið sé eins línu breyting.
- **Hausar fyrir raunverulega hostinn án nets (fake socket):** `HTTPSConnection("gagnaveita.vegagerdin.is")` + `putrequest` án auka `putheader("Host")` gefur eina línu `Host: gagnaveita.vegagerdin.is` (enginn port fyrir sjálfgefna 443); með auka-haus gefur það tvær. Þannig má sanna bætin á vírnum fyrir *þennan* host án TLS og án upstream.
- **Önnur 400-orsök er ekki sýnileg:** URL-snið, UA, `Accept` og aðrir hausar eru þau sömu og í beiðnum sem tókust (metadata DescribeFeatureType, #483/#493 GetFeature). Þetta fix lokar eina þekkta frávikinu.
- **Afmörkun er skýr og rétt stillt:** engin fjórða tilraun, bilun/neikvætt ⇒ stöðva B2; gamlar möppur/marker ósnertar; ef prófin falla ⇒ ekki senda; gap-meðferð/route-innleiðing ekki heimiluð.

### Skilyrði fyrir approved-prompt (ábendingar, ekki blockerar)
**O1 — raunhost-bætapróf án nets.** Auk localhost-upptökunnar, bæta við prófi sem setur fake socket á `HTTPSConnection` fyrir `gagnaveita.vegagerdin.is` og krefst nákvæmlega: request-line (`GET /geoserver/gis/ows?…` óbreytt, byte-for-byte við manifest URL), **ein** `Host: gagnaveita.vegagerdin.is`, `User-Agent`, `Accept`, engin tvítekning nokkurs haus-heitis, og enginn `Connection:` haus. Þetta sannar bætin sem fara á vírinn fyrir kallið sem verður sent. Samanburður við stdlib `conn.request()` baseline er gagnlegur en ekki nauðsynlegur.
**O2 — rauð/græn með raunskrám.** Rauða hliðin keyri óbreytta `b2-retry/b2_fetch.py` (innflutt til lesturs, aldrei breytt) og græna hliðin nýju skrána; prófið á að mistakast á gömlu og standast á nýju. Skrá `diff old new` í skýrslu — væntanlegur munur: aðeins línan sem er eytt + attempt-ID/slóðir/ledger-guard.
**O3 — hash fyrir/eftir.** SHA-256 af `b2-retry/` (wrapper, marker, ledger, raw) og `b2-geometry/` (marker, wrapper) fyrir og eftir; nýtt marker/ledger/raw með einstökum nöfnum (`…ATTEMPT-3…`) í `b2-final-attempt/`. Staðfesta að wrapperinn vísi aldrei á gamla marker (HERE-slóðir).
**O4 — túlkun útkomu fyrirfram.** (a) 200 + `complete_usable` ⇒ samanburður við baseline 16; (b) 200 en `transport_complete_unusable`/`partial` ⇒ ekkert efnislegt svar; (c) **400 aftur með sannaðri einni Host-línu** ⇒ raunveruleg höfnun þjóns/proxy á þessari beiðni; skrá, stöðva, **ekki** kanna orsök (engin fjórða). (d) Ekkert af þessu er sönnun á vegaleysi eða tengingu; neikvætt = B2 ósannað.
**O5 — baseline og samanburður.** Óbreytt frá fyrri umferðum: retained baseline 16 (2117/2134/2135/36807 × tiers) úr `wfs-vegnr1-all.json`; nýtt vs retained eftir ID+geometry, engin tier-blöndun/snapping/epsilon.

### Takmörk
Ég get ekki sannað að tvöfaldur Host hafi verið *eina* orsök 400 í attempt-2 (sjá fyrri result review); attempt-3 sker úr um það. Ég hef ekki nginx í sandbox, svo viðbrögð þjónsins eru ekki endurgerð — aðeins bætin sem send eru. Keyrsluvél er Windows; hegðun þar gæti verið önnur en í mínum Linux-prófum (Python 3.13.18), en `putrequest`-hegðunin er stdlib og sú sama. Engin umferð 2 nauðsynleg nema Ripley breyti beiðninni eða mörkum.
