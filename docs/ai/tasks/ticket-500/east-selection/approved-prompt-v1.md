# #500 — Festa tvær kortastaðfestar bæjartengingar

## Approved prompt v1 — 2026-11-16

Jonesy APPROVED án blockera; OM1–OM2 skýringar teknar inn. Keyranlegt aðeins eftir nýtt eiganda „Prompt approved“ til CC meðan CURRENT er READY_FOR_CC. Fyrri east-junctions-lota stöðvaðist rétt því CC hafði ekki myndsýn. **Ripley hefur nú gert kortaprófið sjálfur**, með heimild eiganda, og báðir afmarkaðir hnútar standast. Nýja promptið afhendir aðeins staðbundna gagnabreytingu til CC; vafri/netaðgangur er ekki forsenda lengur. Ekki búa til aðra tóma rannsóknarlotu.

## Lesa og markmið

Lesa AGENTS.md, CLAUDE.md, docs/ai/README.md, CURRENT.md; east-junctions/approved-prompt-v1.md og result-review.md sem sögu; síðan **docs/ai/tasks/ticket-500/east-selection/map-check.md** sem nýjan staðsetningargrunn. Lesa places.json, approach-selections.json, approachSelections.test.js og retained road-links.csv/wfs-vegnr1-all.json.

Festa aðeins Reyðarfjörð2553 START og Fáskrúðsfjörð2536 END sem vörupunkta við bæjartengingu. Skrefið sem krafðist myndsýnar er lokið af Ripley; ekki eigna CC/Jonesy þá skoðun eða setja fram sem opinbera aðgengissönnun. Jonesy metur gagnabreytinguna og rekjanleika; þarf ekki sjálfur myndsýn til að yfirfara skráða Ripley-skoðun.

Eftir Jonesy APPROVED gerir Ripley approved-prompt/READY_FOR_CC; nýtt eiganda „Prompt approved“ til CC heimilar þetta nákvæma tveggja-punkta vöruval. Engin ný hnitafgreiðsla á hvern stað.

| Place-ID | Source og endi | Native EPSG:3057 | WGS84 föst vænting (námundun8 aukastafir) | Staðarlýsing |
|---|---|---|---|---|
| reydarfjordur |2553 START (OBJECTID5331, tier−1);2813 END samnýttur|[722850.6187,511691.7700]|65.02999391, -14.26600882|Punktur við tengingu Hringvegar og Norðfjarðarvegar áleiðis til Reyðarfjarðar.|
| faskrudsfjordur |2536 END (OBJECTID5271, tier−1);3843 START samnýttur|[733763.5297,501861.9080]|64.93458925, -14.05142635|Punktur við tengingu Hringvegar og Búðavegar áleiðis til Fáskrúðsfjarðar.|

## Skýringar úr samþykktri yfirferð (OM1–OM2)

- **OM1 — föst heimildareiti:** á báðum nýju selections-færslunum er `map_reference` nákvæmlega `docs/ai/tasks/ticket-500/east-selection/map-check.md`. Einn nýr reitur `map_observation` geymir `source_role: RIPLEY_VISUAL_CHECK`, nákvæma `url` úr map-check.md, stutta `observation`, `estimated_offset_m: [0, 10]` og `offset_method: visual_estimate_from_20m_scale`. Vísar á skráða Ripley-skoðun, ekki nýja CC-skoðun eða nákvæma vegamælingu. `map_recommendation_reason` helst stutt vöruvalsástæða. Prófa föstu tilvísunina og að rétt URL/heimildarhlutverk fylgi hvorum stað.
- **OM2 — afmörkuð orðalagsvörn:** nýju approach-lýsingarnar fylgja jákvæða orðalaginu í töflunni og mega ekki fullyrða staðfesta aðkomu, bæjarmörk, miðbæ eða staðfesta akstursleið. Prófa eitt dæmigert ósatt orðalagsbrot og að connectionStatus.reason tilgreini Ripley-kortastoð og óstaðfest aðgengi. Ekki nota hráa bannleit að orðhlutanum „leið“: leyfilega orðið „áleiðis“ í töflunni þarf að haldast.

## Minnsta framkvæmd

1. Fyrst bera Reyðarfjarðarhnút beint við geymdan tier−1 raw-hnút í docs/ai/tasks/ticket-483/samples/wfs-vegnr1-all.json og native start/end-dálka road-links.csv; síðan Fáskrúðsfjarðarhnút á sama hátt. Endurnýta núverandi Lambert-lausn úr fyrri lotum; engin dependency. Útreiknuð WGS84 eiga að stemma við töfluna innan1e-7 gráðu, og vörpun sannprófuð gegn nokkrum óháðum retained native/WGS84-pörum. Stoppa við source/enda/hnitamisræmi, ekki finna staðgengil.
2. Í **núverandi** winter-route-approach-selections.json breytast aðeins þessar tvær afgreiðslur. Geyma gömlu CURRENT_CANDIDATE_NOT_SELECTED-færsluna bókstaflega undir previous_disposition áður en val er sett inn; gamla höfnunin gilti um2520 START/2536 START, ekki nýju punktana. Ný staða SELECTED_PRODUCT_APPROACH, source.database `road-links`, rétt idferill/stored_field og skýr CSV/raw-tilvísun; native_xy/native_crs, wgs84, wgs84_derivation (GRS80/ISN93-færibreytur og source); `selection_basis: MAP_JUNCTION_APPROVED_VIA_PROMPT`, `access_status: EXACT_GAP`. Tilvísun í map-check.md og nákvæma OSM-URL/athugun Ripley; sjónrænt frávik0–10m merkt áætlun, ekki sönnuð exact graph-snerting.
3. Í places.json fyllast aðeins þessir tveir: coordinates, stutt íslensk approach eins og taflan, state ACCESS_POINT_SELECTED_ACCESS_UNCONFIRMED og reason sem greinir vöruval/Ripley-kortastoð frá óstaðfestu aðgengi; selection_basis, selectionReference og coordinateDerivationReference í rétta selections-færslu. Eldri reference-reitir varðveittir. Ekki kalla miðbæ eða bæjarmörk.
4. Uppfæra topp-note í báðum skrám til samræmis. Nú27 af56 með hnit,29null;23 selections allar SELECTED_PRODUCT_APPROACH (eldri21+nýir2), gömlu2 höfnanir varðveittar í previous_disposition. Eldri21 afgreiðsla og aðrar54 places-færslur haldast óbreyttar, þar á meðal fyrri25 hnit. Ekki endurskrifa eldri analysis/coverage/source-snapshot til að gera gömlu tillögurnar „réttar“.

Kortið sýndi veg92/955 við hnútana en retained vegnr1-gögn innihalda ekki þá tengivegi: **engin ytri graph-tenging, stefna eða akstursleið er staðfest** með þessu. Enginn SUPPORTED/ROUTABLE. Allir56 halda sér.

## Markviss sannprófun og skil

Framlengja núverandi approachSelections.test.js með óháðum föstum væntingum yfir2 nýju source-enda/native-hnit og WGS84-töflu. Bera beint við raw/CSV og prófa vörpun/native-metadata. Rétt source.database/reference, ný selection_basis og previous_disposition með gömlu source-endunum sannreynd. Kortaskoðun sjálf er skráð Ripley-heimild, ekki próf sem á að álykta vegamót út frá vegheiti.

Prófa raunveruleg brot: gamli endinn settur aftur inn, rangt CRS/hnit, previous_disposition týnt, ósönn routability. Enginn nýr validator-framework. Aðlaga aðeins úreltar væntingar í approachSelections/places/remainingCoverage og öðrum gagnasöfnum ef raunverulega þarf:21→23 valin selections,25→27 hnit,31→29null, ný4. selection_basis-flokkur ásamt MAP/RETAINED/engum. Eldri21 selections og25 hnit skulu enn vera nákvæmlega eins. Einfaldur fyrir/eftir-samanburður á54 óbreyttum place-færslum og gömlu21 selections í cc-report; ekki nýtt snapshot-framework. Allir56 með sömu ID/heiti/aliases/svæði/röð, KEF≠Keflavík.

Keyra approachSelections, places, remainingCoverage, southConnections, acquiredGeometry, approachAnalysis, placeEvidence (sjö gagnasöfn); ESLint á snertum JS og git diff --check. Engin frontend-suite/build/vafraregression. Þegar þessi gagnabreyting og próf standast skal stoppa.

Leyfðar skrár: winter-route-places.json, winter-route-approach-selections.json og ofangreind próf eftir þörf; nýjar litlar hjálparskrár/cc-report undir docs/ai/tasks/ticket-500/east-selection/ og CURRENT.md. Map-check.md og eldri saga/raw/ledger óbreytt. Engin netleit/kortaopnun/geometry-öflun, dependency/delegation, UI/leiðarvél/forecast/scoring/gating/greiðslubreyting, commit/push/GitHub/deploy eða #500-lokun.

CC þarf **engin myndsýnistól** fyrir þetta prompt. Við önnur nauðsynleg verk utan umfangs: skrá concrete hindrun og stoppa frekar en að víkka. READY_FOR_CC → CC_IN_PROGRESS → CC_COMPLETE með skýrslu, Jonesy result-review og Ripley lokamat samkvæmt README. Þetta er önnur prompt-umferð sama afhendingarmarkmiðs; fyrir þriðju review-umferð gildir stutt eiganda-checkpoint, engin sjálfvirk endalaus lykkja.
