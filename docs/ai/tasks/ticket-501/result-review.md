# #501 — read-only úttekt, result review

## Jonesy result review — umferð 1 (2026-11-17)

**Niðurstaða: NOT PASS aðeins vegna sönnunartöflunnar (JB1–JB2); hitt stendur.** Kafli 1 (data-flow/endpoint/cache), JA1 (veg93-keðjan E1→S2) og lágmarksviðmið-kaflinn eru réttir og vel unnir. En vegalengdar- og bilfærslur fyrir Reykjavík–Selfoss/Hella — kjarni töflunnar og undirstaða „má innleiða næst“ — eru rangar. Lagfæringin er bein textaleiðrétting á `audit-report.md` (nokkrar reitir, engin ný öflun eða CC-lota); þegar tölurnar hér að neðan eru komnar inn þarf ekki aðra Jonesy-umferð. Stage → RESULT_REVIEW.

### Afhent (CC)

`audit-report.md` (18 623 B), `cc-report.md` (8 736 B), CURRENT.md → CC_COMPLETE. Aðeins skjöl undir `ticket-501/` og CURRENT.md.

### Sandbox-staðfest (mitt; engin net-/GitHub-köll, engin þjónusta keyrð)

- **Vörugögn/kóði ósnert:** mtime `server_data/winter-route-*.json` óbreytt (places/selections 1794861097204 o.s.frv.), `api/_lib/winterRoute/routes.js` og `segments.js` óbreytt; #500 handoff-skrár voru uppfærðar af eiganda (commit) áður en lotan hófst, ekki af CC.
- **Kafli 1 (samningar):** `api/winter-route.js:213` `resolveRouteId`, `:222–231` bucket-per-routeId, `routes.js` `DEFAULT_ROUTE_ID` (l. 92) og `ROUTE_DEFS` (l. 94), `resolveRouteId` (400 án endurspeglunar), `cache.js:29` `DEFAULT_BUCKET_KEY`, `WinterRoute.jsx:389–421`, `AppRoutes.jsx:199` og prófið `WinterRoute.test.jsx:149` („a closed segment shows the closed label…“) — allt stemmir við línurnar í skýrslunni; enginn `useWinterRoute.js`.
- **JA1 (veg93):** keðjan 2344→3410→3409→2894→2892→2891, öll 5 samskeyti 0,0 m, `wfs93-raw.json` SHA `1d8c9cf8…` stemmir, E1/S2-hnit jöfn `places-v1.json`; vegalengdir 26 252,294 m (E1→END 2894, tier −1), 26 926,55 m (að ferjubryggju 2891), 24 752,45 m (tier 2, −8,07 %) stemma við `road93-candidate.json`/`road93_section-v2.json`; ósamræmið við `handoff-to-501.md` er skráð án þess að breyta handoff — í samræmi við JA1. `road_condition_footprint-v2.json` (911040037/911170037 hafa raunveruleg færðgögn, v1 „NOT_AVAILABLE“ afturkallað) og `worklist_and_weatherpoints-v2.json` (4 ósamþykktir punktar, lína, 26 926,6 m) rétt lýst.

### JB1 — Selfoss/Hella vegalengdarstoð er röng (NOT PASS-ástæða 1)

Taflan gefur R1→Selfoss ≈ **33,23 km** og R1→Hella ≈ **64,37 km**, „R1→upphaf stykkis `902030037`/`901130037`“. Það eru upphaf IDBUTUR-segmentanna (Selfoss–Hveragerði byrjar rétt vestan Hveragerðis; Hella–Þjórsá byrjar við Þjórsá), ekki valdir punktar. Valdir punktar eru **exit** stykkja 2138 og 3591, þ.e. austast í viðkomandi segmenti:

| Par | Skýrsla | Rétt (chain-walks-v4 `cw_long`, með 1436) | segments.js (lok segments) |
|---|---|---|---|
| R1→Selfoss (2138 START) | 33,23 km | **45 740,46 m** (= `selfoss_closure_target.cost_m_incl_1436`; 43 180,31 m án 1436) | 33,23 + 12,63 = 45,86 km |
| R1→Hella (3591 START) | 64,37 km | **81 769,6 m** (summa `gap_into_m + piece_cost_m` skrefa 0–14) | 64,37 + 17,64 = 82,01 km |

Skekkjan er ~12,5 km (Selfoss) og ~17,4 km (Hella). Aðferðin „einföld summa `lengthKm` að upphafi stykkis“ er ekki röng sem aðferð, en hún var notuð á vitlausan enda; og prompt-ið (JA2) bað um að staðfesta úr gögnum, ekki að nota nálgun þegar nákvæmari gögn (`cw_long`, `selfoss_closure_target`) eru til staðar og voru nefnd í minni prompt-yfirferð. Leiðrétta báðar tölur og færa „segment-stig vs idferill-stig“ aðferðarsetningu í samræmi.

### JB2 — bil lögð á rangan stað; „CONTINUOUS_EXACT 0,0 m“ er rangt um suðurkorridorinn (NOT PASS-ástæða 2)

Prompt-ið (JA3) krafðist þess að aðgreina bil **fyrir** valinn endpoint frá bilum **handan** hans; skýrslan segir „gatið er fyrir/við valinn endpoint“ en nefnir rangt bil og sleppir því rétta:

- **R1→Selfoss** fer yfir **0,234 m** (inn í 2071) og **34,749 m** (inn í 2135, Hellisheiði→Hveragerði), samtals 34,98 m. Bilið 30,097 m liggur **handan** Selfoss (2138→3737) og er ekki á leið R1→Selfoss.
- **R1→Hella** fer yfir 0,234 / 34,749 / 30,097 / 42,302 m (samtals **107,38 m**). Bilið 32,63 m liggur **handan** Hellu (3591→3638) og er ekki á leiðinni.
- Setningin „Suðurkorridor-keðjan sjálf er `CONTINUOUS_EXACT` 0,0 m milli stykkja innan sinnar eigin 25-stykkja lengdar“ er röng: `winter-route-south-connections.json` hefur þrjú mæld bil (30,097 m milli stykkja 1–2, 42,302 m milli 3–4, 32,63 m milli 9–10; samtals 105,029 m); 34,749 m er utan 25 stykkjanna. Þetta er líka það sem handoff #500 sagði. „CONTINUOUS_EXACT 0,0 m“ gildir um veg93-keðjuna, ekki þessa.
- Afleiðing fyrir niðurstöðuröðina: „má innleiða án nýrrar öflunar“ getur staðið, en með réttri setningu: bil á leið eru 34,98 m (Selfoss) og 107,38 m (Hella), óbrúuð og engin ný heimild til að brúa þau, og H1 INFERRED.

### JB3 — „nýr fundur“ um cum-km er þegar skráður og leystur (leiðrétta orðalag; ekki blocker)

`road93-candidate.json` er v1-skrá; v2-sönnunarskjal fasa 2 (`ticket-493-place-data-phase2/evidence.md`, R3 l. 27, töflur l. 323 og 406) skráir þegar að **676,0013 er cum-km (án 1436) hins fasa-1 hnúts** (714320,9956; 536912,9869), ekki mótanna; mótin eru 680,1945 km með/677,6344 km án 1436 (= `egilsstadir_nodes-v2.json`). Endurreikningur CC (680,194 km) er réttur og staðfestir v2, en hann er ekki nýtt ósamræmi sem krefst ákvörðunar, og skilyrðið í niðurstöðulið 2 („fyrst ákvörðun um cum-km“) er því óþarft; cc-report skráir ekki `evidence.md` sem lesna. Skipta orðalaginu út fyrir „v1-gildið er leiðrétt í v2; nota `egilsstadir_nodes-v2.json`“. Sjálf E1→S2-vegalengdin og keðjan haggast ekki.

### Valfrjálst

- **JB4 — 1436:** „á ekki við línuleg pör“ er of víðtækt; R1 er vestari endi 1436, svo allar R1-vegalengdir ráðast af því hvort 1436 (2 560,15 m) er talið (45 740 vs 43 180 m). Einni setningu þarf: R1-upphafspunktur ⇒ „með 1436“ er rétt og er talið einu sinni.
- **JB5 — veður:** fjórði tillögupunktur í `worklist_and_weatherpoints-v2.json` er ferjubryggjan (733080,74; 538522,40), handan valins S2; tillagan er því ekki nothæf óbreytt fyrir E1→S2 (lengd lína 26 926,6 m, ekki 26 252,3 m). Rétt að nefna þegar nefnt er að tillagan sé ósamþykkt.

### CC-eignað / óstaðfest af mér

HEAD `00bfd301…` óbreytt, `git diff --check`, `git status`, „Prompt approved“, engin keyrsla (engin kóðabreyting; ekkert vitest/lint/build — ég keyrði ekkert slíkt heldur). Ég get ekki staðfest texta GitHub-miða #501.

### Næst

Ripley (eða CC í stuttri leiðréttingu) lagar JB1–JB2 beint í `audit-report.md` (tölur og bil að ofan) og JB3-orðalag; JB4–JB5 helst. #501 er hvorki innleitt né lokað: PASS þessarar lotu gildir aðeins um úttektina, og „Selfoss/Hella sem tvær nýjar fastar routeId“ er tillaga sem eigandi/næsta prompt þarf að heimila.


## Ripley lokamat — 2026-11-17

**PASS fyrir read-only úttektina eftir beinar JB1–JB5 leiðréttingar.** Sjálfstæð Python-prefix athugun á retained cw_long: Selfoss 45740.460240 m, bil 34.982940 m; Hella 81769.553984 m, bil 107.381784 m. 1436 þegar fyrsta skref, talið einu sinni. Bil 30,097/32,63 handan Selfoss/Hellu aðgreind frá bilum á leið. Suðurkorridor ekki continuous-exact. Veg93 fjórði tillögupunktur handan S2 skráður.

JB3: eldri 676,0013 er ekki ný uppgötvun. Auk þess leiðréttir evidence.md §10–§11 v2 680,1945 sem tvítalningu 1436; gildandi place_nodes-v3.json og prefix gefa E1-entry 677.6344 km með 1436, 675,0743 án. Því var ekki afrituð röng v2-tala úr review. Audit-report leiðrétt, engar retained heimildir breyttar. CC-skýrslan heldur sögulegri lýsingu en fær correction-note. Engin ný Jonesy-umferð nauðsynleg samkvæmt review, engin application-próf/build/lint þar sem aðeins skjöl breytt; diff-check keyrt.

CURRENT CLOSED aðeins fyrir úttektarlotu. #501 er hvorki innleitt né lokað. Næsta eigandaákvörðun er milli sérstaklega afmarkaðrar innleiðingar úr hlutagögnum og heimilaðrar lágmarksgagnaöflunar fyrir raunverulega almenna samsetningu; engin ný föst leið, valkostur, brúun bila eða netöflun sjálfvirkt heimiluð. Engin commit/push/deploy/GitHub aðgerð.
