# #491 — Afmörkuð leiðrétting eftir result review, v4

Byggir á Jonesy result-review-implementation.md, umferð 1, V1–V3, og Ripley lokamati 2026-11-04. V3 er óbreytt söguleg framkvæmd. Þetta er leiðrétting innan samþykkts umfangs, ekki ný rannsókn eða birtingarheimild. Eigandi → CC: „Prompt approved“.

Lestu AGENTS.md, CLAUDE.md, docs/ai/README.md og CURRENT.md. Staðfestu READY_FOR_CC og settu CC_IN_PROGRESS áður en vinna hefst. Lestu approved-prompt-v3.md, cc-report-implementation.md og result-review-implementation.md. Fyrri samþykktar nálganir C1–C4/B1–B7 standa; leiðargögn, ETA-regla og rannsóknarniðurstöður breytast ekki.

1. **V1 — rétt leiðarheiti:** Leiða h1 og Helmet title af valinni WINTER_ROUTE_OPTIONS færslu, nameIs/nameEn. Heiti fylgir valinu strax, líka meðan gögn hlaðast eða villa birtist. Almennur undirtexti má haldast. Markviss próf fyrir báðar leiðir og IS/EN, þar á meðal document title.

2. **V2 — leiðarbundin myndgerð:** Audit fyrst á allri notkun data/loadError og afleiddra gilda í WinterRoute.jsx. Fela gögn annarrar leiðar á render-tíma, ekki treysta á setData(null) í passive effect. Dæmi er view = data?.routeId === routeId ? data : null; villa þarf sambærilega tengingu við leiðina sem hún tilheyrir. Nota leiðarbundnu sýnina í öllum afleiddum gildum og myndgerð (availableHours, summary, comparison, kortum, köflum og fjöldum). Enginn commit-rammi með nýju vali og gömlum gögnum/villu. Varðveita abort/request-generation/StrictMode-vörn, A→B→A og tímavals-/fókushegðun. Engin almenn endurhönnun fetch-kerfisins.

   Bæta við Profiler eða jafngildu commit-mælandi regression-prófi sem skoðar hvern commit við leiðarskipti, ekki aðeins lokastöðu eftir act. Ná yfir gömul gögn og gamla villu, loading/bilun nýju leiðarinnar og seint svar gömlu leiðarinnar; ekkert rangrar leiðar má sjást í afleiddri sýn. Halda fyrri request-count/race-prófum. Leiðrétta kóðaathugasemd og fyrri skýrslufullyrðingu um „same render pass“ með skýrum leiðréttingarkafla, án þess að eyða sögunni.

3. **V3 — endurskapanleg afleiðsla:** Afhenda eina docs-skrá undir ticket-491 með nákvæmum frumskráarslóðum/SHA256, aðferðinni úr v3 B1, 29 raða töflu (IDFERILL, línulengd, tengibil og uppsöfnuð km), P1–P4 niðurstöðum og niðurstöðum allra 13 Vík-stýrikafla/mismun. Birta einfalda lykillausa offline skipun með þeim útreikningi sem þarf til að endurskapa töflurnar úr varðveittum skrám. Ein inline skipun í Markdown nægir; ekkert nýtt hjálparkerfi, engin netköll og engin ný leiðarrannsókn. Reikna upphafsbil einu sinni, halda native-bilum aðgreindum frá haversine-lengdum og nota óbreytt viðmið/tolerances B1. Ef niðurstöður ganga ekki upp, skrá nákvæma hindrun og stöðva, ekki víkka rannsókn.

R4 er ekki lagfæringarkrafa: ekki breyta roadFetch-signature. R5: leiðrétta aðeins orðalag skýrslu um cache — implicit bucket á við beina kallara/próf, handler sendir skýrt routeId og notar nafngreint Vík-bucket. Engin cache-endurhönnun.

Prófun: keyra viðkomandi WinterRoute/page og route-regression próf, lint/build og núverandi #486/#491 Playwright/Chromium með stubbsvörum. Staðfesta titla IS/EN, skipti/loading/bilun, fókus og báðar leiðir; engin raunveita/lykill. Víkkun svítu aðeins ef ný áhrif eða bilanir réttlæta. Ekki rekja ótengdar bilanir í viðgerðarlotu; aðgreina keyrt frá ekki prófuðu.

Afhending: bæta v4-kafla við cc-report-implementation.md með breytingum, leiðréttingum fyrri fullyrðinga, endurskapanlegu skjali, prófaniðurstöðum og takmörkunum. Varðveita fyrri review/prompt/gagnasögu og óskyldar breytingar. CURRENT CC report slóð óbreytt; setja CC_COMPLETE eftir skýrslu. Production NOT_TESTED; næst eigandi → Jonesy → Ripley.

Mörk: aðeins V1–V3 og skýrsluleiðrétting R5. Engar breytingar á bakenda/cache, leiðargögnum, 70km/ceil, gagnaveitum, DB, greiðslum eða rekstrarstillingum; engin ný gögn/dependencies/subagents, engin leyndarmál, commit/push/GitHub/deploy. Engin MVP-útvíkkun eða ný rannsókn.
