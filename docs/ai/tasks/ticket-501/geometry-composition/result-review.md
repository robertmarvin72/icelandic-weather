# #501 geometry-composition — Jonesy result review

## Jonesy result review — umferð 1 (2026-11-17)

**Niðurstaða: eining (`geometryComposition.js`) PASS; raunpróf R1→Selfoss og R1→Hella NOT PASS (JK1) — röng endapunkta-pinning, ekki galli í einingunni. Smá lagfæring hjá CC (2 hnit + 2 tölur + texti), engin ný hönnun.** B1, B2, C1 og E1→S2 eru rétt og vel prófuð. Þetta er fyrsta result-umferð; ein lagfæringarumferð dugar.

Merking: **sandbox** = mitt, Node 22.23.4 / Python 3 á stöguðum afritum (ekkert net, ekkert keyrt á vél eiganda, ekkert git). **CC-eignað** = sem CC segir um Windows-keyrslu. Test-runner í sandbox er **mín eigin lágmarks-vitest-shim** (describe/it/expect) með óbreyttu `.test.js` og óbreyttri einingu; ekki raunverulegur vitest.

### JK1 — endapunktar Selfoss/Hella eru entry, ekki exit (sýnt, afgerandi)
Approved-prompt P2 pinnaði **Selfoss = 2138 exit, Hella = 3591 exit** úr `place_nodes-v3.json`. Prófin nota hnit sem eru **`entry_coord`** í sömu skrá, en merkja þau „own exit“:

| | `place_nodes-v3.json` exit (pinnað) | notað í prófi (= entry) |
|---|---|---|
| Selfoss / 2138 | (401739,85; 383119,047) | (400974,332; 384785,129) |
| Hella / 3591 | (430972,1263; 370845,6043) | (430713,0138; 371613,8204) |

Líklegasta orsök (ályktun): `entry/exit` í place_nodes er miðað við akstursátt „rev“ í chain-walk, en CC las það sem teiknistefnu (síðasti hornpunktur). Afleiðing sandbox-staðfest: með **pinnuðu** hnitunum skilar einingin (óbreytt) **R1→Selfoss 44 984,770378 m** og **R1→Hella 80 630,947828 m** á tier 2 — nákvæmlega prototype-tölurnar mínar til síðasta stafs; allir 4 tiers: Selfoss 44 984,770 / 45 435,701 / 45 615,810 / 45 650,044, Hella 80 630,948 / 81 361,610 / 81 645,565 / 81 701,454. Prófin festa **43 101,159 m** og **79 817,678 m** (sandbox: einingin skilar nákvæmlega þær tölur með entry-hnitunum) — 1 883,612 m og 813,270 m styttra, þ.e. leið að röngum enda 2138/3591.
Auk þess er **skýring CC röng**: „most plausibly a different (also valid, lower-cost) route choice … not investigated“ (implementation-note, „A note on the R1→Selfoss/Hella numbers“) og next-decision lið 3 („munur gegn prototype“). Munurinn er endapunktar, ekki leiðarval; sami graf, sama Dijkstra. P1/P3-fullyrðingar (36807 forward 2→4 án B, 2138 í tveimur ósamliggjandi slices, 1436 einu sinni) halda líka með réttum endapunktum (sandbox: slices `…2117, 36807:2>4f, 2135:5>1r, 52492:1>2f, 2138:5>3r, 52491:2>4f, 2138:1>0r`; fyrir Hella +8676/3737/3768/3454/3767/3781/3613/3614/3615/3591).
**Minnsta fix (CC):** í `geometryComposition.test.js` breyta SELFOSS/HELLA í exit-hnitin hér að ofan (lesin úr place_nodes-v3, ekki handslegin), uppfæra væntar tölur (44 984,770378 / 80 630,947828, `toBeCloseTo` eins og áður; gamli „cross-check“-athugasemdatextinn verður „stemmir við prototype“), laga „own exit“-orðalag, og leiðrétta implementation-note + cc-report (taka út „route choice“-skýringuna og next-decision 3). Engin breyting á `geometryComposition.js` vegna JK1.

### Sandbox-staðfest: eining og próf
- **Óbreytt test + eining í mínu shim: 21/21 PASS** (13 synthetic + 6 VEGNR=1 + 2 road93).
- **B1** 0,234270 m [1735 index 0↔1]; **B2** 40,406375 m, eingöngu 36807 `reverse` (72,549 m boginn aldrei skilaður); **C1** 43,488921 m [3454, 3767]; **E1→S2** 24 148,860881 m [2344, 3410, 3409, 2894] — allt stemmir við mína óháðu sandbox-útreikninga í fyrri umferð (jafnt í öllum tiers þar sem ég prófaði).
- Á pinnuðu pörunum: **0 tvítekin edge-pör**, slices samfelld bókstaflega (hvert `toXY` = næsta `fromXY`; fyrsti = R1, síðasti = pinnaður endapunktur), óháð summa slice-hornpunkta = `lengthM`; `reverseGeometryPath` = beint Selfoss→R1 query (sama ID, slices, lengd); 60 handahófskenndar raðir inntaks: **1 geometryId** (Selfoss) og **1** (Hella).
- **Mutation (rautt/grænt, afrit af einingu):** merge-villa CC (strengur vs tala) ⇒ 4 próf falla; hæsta ID vinnur í parallel-tie ⇒ 1 fellur; blandað tier leyft ⇒ 1; reverse heldur stefnu ⇒ 1; mótsagnageometry hunsuð ⇒ 1. Eitt mutant lifði (zero-length self-loop haldið): jafngilt, núll-lengdar edge getur aldrei verið á stystu leið — ekki veikleiki.
- Fyrri möppur og eldri winterRoute-skrár: mtime óbreytt á tækinu (routes.js, segments.js, cache.js, roadFetch.js, forecastFetch.js, boundedFetch.js, winter-route.js, package.json, eslint.config.js); `api/_lib/winterRoute/` hefur aðeins tvær nýjar skrár.

### JK2 — jafnlangar mismunandi leiðir: niðurstaða fer eftir inntaksröð (lítið, Round1-contract)
Round1 krafðist „lexical source/node tie-break svo shuffle input breyti ekki niðurstöðu“; P4 nær aðeins yfir **samsíða edge milli sömu hnúta**. Sandbox: tvö lög (0,0)→(10,0)→(10,10) [id 10] og (0,0)→(0,10)→(10,10) [id 20], sama from/to: `[L1,L2]` skilar slices [10], `[L2,L1]` skilar [20], **ólík geometryId** (reverse query eins). Prófið „closed ring … tie“ staðhæfir í athugasemd að tie sé „resolved by the same deterministic rule“ en prófar aðeins lengdina — athugasemdin er röng. Áhrif á raunpör: engin sýnd (60 shuffles, JK1-pörin stöðug), en stöðugt ID er kjarni samningsins og framtíðar-hlaðari með annarri röð gæti kallað fram ólíka niðurstöðu við samhverfa hringtorgs-punkta. **Minnsta fix:** í `shortestPath` velja frontier-hnút með (fjarlægð, svo `x|y` í strengjaröð) og við jafna fjarlægð velja forvera með lægsta (hnitastrengur forvera, sourceId, fromIndex); bæta við einu prófi með víxluðum röðum á þessu fixture og einu með shufflað inntak á raunpari (3 línur). Ef Ripley kýs að fresta: lágmark er að leiðrétta athugasemdina og skrá takmörkunina í implementation-note — ekki blocker fyrir raunpörin.

### JK3 — smáatriði (ekki blocker)
- „Prófa input permutation á … retained path“ (approved-prompt lið 4) er ekki í prófunum; ég sýndi stöðugleika í sandbox (sjá ofan) — má bæta við með JK2.
- Edge-uniqueness próf á R1→Hella skoðar (sourceId, span) á slice-stigi; ég staðfesti edge-stig (0 tvítekin). Dugar, en edge-stig væri sterkara.
- Slices geyma aðeins `fromXY/toXY` (+ vísa), ekki millipunkta; í lagi þar sem vísar vísa á source-hornpunkta.
- `crs` í prófum er harðkóðað „EPSG:3057“, ekki lesið úr skránni; ekki skilyrði hér.
- `npx vitest run` virkar ekki í umhverfi CC (CC-eignað; sama villa í fyrri #500/#501 lotum, ekki staðfest af mér). Raunverulegur vitest + eslint + eldri winterRoute/frontend próf hafa því **ekki** verið keyrð á þessari lotu af neinum okkar; shim-keyrsla á óbreyttu efni er staðgengill. **Eigandi/CC getur keyrt `npx vitest run api/_lib/winterRoute/geometryComposition.test.js` og `npx eslint` á vélinni þegar hún virkar — ég get það ekki.**

### CC-eignað, ekki staðfest af mér
Windows-keyrsla á shim (21/21), ESLint hreint, `git diff --check`, `git status`, að HEAD sé óbreytt, að vitest bili á ósnertri routes.test.js, tvær fundnar villur (merge-mismunur og chord-hjálparfall) — merge-villan er staðfest óbeint með mutation (aftur-sett villan fellir 4 próf).

### Takmörk
Prototype/próf mín sýna ekki akstursstefnu, topology né hringtorg; `drivingAccess: UNVERIFIED` og `geometry_only` eru rétt notuð í einingunni og athugasemdum. Hvorki net né provider-köll. Ég lagfærði ekkert í kóða CC.

### Næsta skref
CC (ein þröng umferð): JK1 (próf + tvö skjöl) og helst JK2; keyra shim/eslint aftur og segja hvað var keyrt. Síðan Ripley lokamat. Engin ný öflun, enginn app-/endpoint-breyting. Eftir þá umferð: stoppa (ekki þriðja umferð án eiganda).


## Ripley lokamat — v1 — 2026-11-17

**REVISE — þröng JK1/JK2 leiðrétting.** Sjálfstætt raun-Vitest4.1.10 5files/48tests PASS (new geometry/routes/segments/cache/frontend route-contract). Þetta staðfestir runner virkar hjá Ripley, ekki að röng fixture-hnit uppfylli P2. JK1 staðfest úr test/source og Jonesy pinned-vs-entry; JK2 deterministic equal-cost er upphafleg contract-krafa, því valin lágmarks tie-lagfæring fremur en að fresta. JK3 retained shuffle test tekið með; engin optional edge-hardening.

approved-prompt-v2.md búið til fyrir eina þrönga CC-correction sem Jonesy lýsti, engin ný design/prompt-review umferð. CURRENT READY_FOR_CC; eigandi sendir Prompt approved til CC. V1 immutable. Engin kóðabreyting gerð af Ripley í þessari yfirferð; engin ný öflun/runtime/GitHub/commit/push/deploy. Eftir lagfæringu Ripley lokamat með focused prófum; ekki þriðja umferð án eiganda.

## Jonesy result review — umferð 2 (2026-11-18)

**Niðurstaða: PASS fyrir v2-leiðréttinguna (JK1, JK2, JK3 lokað). Enginn blocker. Ripley getur gert lokamat.** Eining + próf uppfylla nú approved-prompt-v2. Ég mæli ekki með þriðju umferð; JL1 hér að neðan er valfrjáls, ekki skilyrði.

Merking: **sandbox** = mitt (Node 22.23.4 + mín eigin vitest-shim, óbreyttar skrár, ekkert net, ekkert keyrt á vél eiganda). **CC-eignað** = Windows-keyrsla sem CC lýsir.

### Sandbox-staðfest
- **JK1:** prófið les SELFOSS_EXIT/HELLA_EXIT úr `place_nodes-v3.json` `exit_coord` (= (401739,85; 383119,047) og (430972,1263; 370845,6043), stemmir við P2) og staðhæfir `result.to`. Óbreytt v2-eining skilar **44 984,770378 m** (Selfoss) og **80 630,947828 m** (Hella) á tier 2; tier 1/0/−1: 45 435,701/45 615,810/45 650,044 og 81 361,610/81 645,565/81 701,454. Gamla „lower-cost route“-skýringin er afturkölluð og merkt SUPERSEDED í cc-report og implementation-note; next-decision 3 fjarlægt. Engin production-breyting vegna JK1 (staðfest með diff v1→v2).
- **JK2/JK3:** diff v1→v2 á einingu er aðeins tie-break: `edgeWins()`, frontier-val eftir `x|y` við jafna fjarlægð, predecessor-skipti við jafnan kostnað (aðeins fyrir óheimsótta hnúta). Lengdir óbreyttar.
  - **Slembigraf (1 500 tie-þung grafs á heiltölu-neti):** v2 skilar sömu lengd og staða og v1 í 100 % tilvika; **0** ósamræmd geometryId undir 12 víxluðum röðum hvert (v1: 3).
  - **5×5 net, horn í horn (252 jafnlangar stystu leiðir), 200 víxlanir:** v2 = **1** geometryId, v1 = **110**.
  - Raungögn: 100 slembiraðir á R1→Selfoss, R1→Hella og B2: **1** geometryId hvert; reverse(reverse(x)) = x.
  - P1 heldur með v2-einingu á öllum 4 tiers: 36807 `forward` 2→4 (tier −1: 5→11), 1436 einu sinni, 2138 í tveimur slices á Hella.
- **Próf:** óbreytt `geometryComposition.test.js` í mínu shim: **23/23 PASS** (21 gömul + 2 ný). Samsvarar CC: 2 ný próf (+2 af 48 ⇒ 50).
- **Mutation á nýja kóðann:** sleppa frontier-tie ⇒ lokað-hring-próf fellur; sleppa `edgeWins` ⇒ JK2-fixture fellur; snúa `edgeWins` ⇒ JK2-fixture fellur; snúa frontier-röð ⇒ hring-próf fellur (4/4 drepin).
- **Umfang:** `api/_lib/winterRoute/` hefur enn aðeins `geometryComposition.js/.test.js` sem nýjar skrár; mtime óbreytt á routes.js, segments.js, cache.js, boundedFetch.js, roadFetch.js, forecastFetch.js og próf þeirra; `api/`-rót og `package.json` óbreytt (tækja-mtime).
- Hring-tie próf (single ring, sama sourceId) staðhæfir nú valda slice `reverse` 5→3 (um (0,10)) og athugasemdin er leiðrétt og heiðarleg um að það sé frontier-lykillinn, ekki `edgeWins`, sem ræður þar.

### JL1 — valfrjálst, ekki blocker: P1-staðhæfingar fjarlægðar úr R1→Selfoss prófinu án skráningar
v2 eyddi úr R1→Selfoss prófinu staðhæfingunum um 36807-slice (`forward`, vísar ekki á vertex 0 = B) sem voru í v1. cc-report nefnir það ekki. Eiginleikinn **er** réttur (sandbox, sjá ofan) og implementation-note fullyrðir hann ekki lengur, en prófið ver hann ekki. Fjórar línur skila því; ég geri það ekki að skilyrði (MVP; engin villa fannst). Ripley getur kosið að biðja um þær í næstu snertingu við skrána.

### Takmörk og CC-eignað
- Raunverulegur `vitest`, `eslint`, `git diff --check`, `git status`: **CC-eignað** (CC: 5 skrár/50 próf PASS og ESLint hreint á Windows; Ripley staðfesti vitest virkar í hans umhverfi). Ég keyrði hvorki vitest né eslint; shim mín staðfestir sömu 23 próf á óbreyttum skrám.
- `PLACE_NODES` er lesið úr skrá sem er sjálf pinningin; prófið ber hnitin ekki við föst bókstafsgildi. Ég staðfesti gildin handvirkt (sjá JK1). Retained-permutation próf CC er ein öfug röð; mín 100-röð sandbox-könnun nær lengra. Hvort tveggja dugar fyrir þetta umfang.
- Eiginleikinn er geometry-only: ekkert um akstursstefnu, hringtorg eða topology (`drivingAccess: UNVERIFIED` óbreytt). Engin net-köll.

### Næsta skref
Ripley lokamat (PASS fyrir afmarkaðan geometry-kjarna, ekki lokun #501/all56/heilan hring/akstursleiðir). Engin þriðja CC-umferð nauðsynleg.


## Ripley lokamat — v2 — 2026-11-18

**PASS fyrir afmarkaðan geometry-samsetningarkjarna.** Jonesy umferð2 PASS lesið gegn approved-prompt-v2, source/test og CC-report. JK1 rétt pinned exit_coord úr place_nodes-v3, JK2 deterministic equal-cost frontier/predecessor og JK3 retained permutation staðfest úr source/tests. Ekkert nýtt scope og engin þriðja CC-lota nauðsynleg.

Sjálfstætt keyrt á vél eiganda með raun Vitest4.1.10 (ekki shim):
`npx vitest run api/_lib/winterRoute/geometryComposition.test.js api/_lib/winterRoute/routes.test.js api/_lib/winterRoute/segments.test.js api/_lib/winterRoute/cache.test.js src/lib/winterRouteRoutes.test.js`
**5 skrár / 50 próf PASS**, exit0. Nýja suite23 próf ásamt eldri route/segment/cache/frontend-contract vernd. Sjálfstætt `npx eslint` á geometryComposition.js/.test.js hreint; `git diff --exit-code` á fixed routes, segments, cache, road/forecast fetch, api/winter-route.js, WinterRoute.jsx/frontend-route list, server_data og package/lock sýnir engar tracked breytingar. `git diff --check` hreint eftir lokaskráningu.

JL1 samþykkt sem valfrjálst, ekki blocker: Selfoss-prófið ver ekki lengur sérstaklega P1 forward2→4 statement þótt Jonesy hafi staðfest eiginleikann. Ekki ný test-/herðingarlota; ekki fullyrt að þessi nákvæma assertion sé enn í prófum. Engin application-/prófbreyting gerð af Ripley í lokamati.

Afhent er pure geometry_only kjarni með drivingAccess UNVERIFIED, raungagnapörum, native vertex-slices, stöðugum auðkennum og focused regression. Engin lögleg akstursstefna/topology/fullur hringur/all56 eða notendavirkni staðfest. Einingin er ekki tengd endpoint/UI eða núverandi föstum routes. #501 er því ekki fullinnleitt eða lokað á GitHub.

CURRENT CLOSED fyrir þessa innleiðingarundirlotu. Næsta afmörkun þarf sérstaka runtime-/route-contract ákvörðun áður en geometry niðurstaða gæti orðið akstursleið. Enginn nýr prompt/öflun sjálfvirkt, B2-sókn áfram stöðvuð. Engin commit/push/deploy/GitHub breyting.
