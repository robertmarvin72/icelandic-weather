# #499 — Initial prompt: grunnendapunktar fyrir Winter Route MVP (#493)

2026-11-13, Ripley. Til Jonesy-yfirferðar, ekki framkvæmdarprompt enn.

## Markmið

Færa áfram fjóra grunnendapunkta svo hægt sé að byggja Frá/Til á þeim. Endurnýta það sem er búið; afla aðeins gagna sem vantar. Afhenda eina litla endpoint-skrá með skýrum stöðum, ekki nýtt gagnaöflunarkerfi eða fullbúna leiðsöguvöru.

Issue: https://github.com/robertmarvin72/icelandic-weather/issues/499 (undirmiði #493). Eigandi hefur ítrekað MVP-umfang fyrir öll verkefni og að spyrja áður en farið er út fyrir það.

## Lesa fyrst

- AGENTS.md, CLAUDE.md, docs/ai/README.md og CURRENT.md.
- ticket-493/endpoint-owner-decisions-2026-11-11.md, endpoint-decision-table-2026-11-11.md og akureyri-endpoint-decision.md undir docs/ai/tasks/.
- Síðustu lokamöt í ticket-493-access-points/result-review.md og ticket-493-endpoint-acquisition/result-review.md (sérstaklega ER1–ER5).
- Núverandi endpoint-candidates-v3.json í access-points og endpoint-wgs84.json, request-manifest.json, exchange-ledger.jsonl, raw-E1-WGS84.json og native-reference gögn í endpoint-acquisition/samples. Nota raunverulegar slóðir úr þessum skjölum.

## Verkefni

1. **Varðveita eigandaval:** Akureyri C = 2940 END / 3876 START. Egilsstaðir E1 = 2345 END / 2344 START, WGS84 lat 65.25861764, lon -14.39028964. Ekki velja aftur eða sækja E1 aftur.
2. **Endurnýta E1 rétt:** ný endpoint-skrá hefur tilvísun í raw-skrá, SHA, ledger-línu og native-skrá/SHA/hornpunktsvísi. Staðfesta tilvísanir og að báðar mótshliðar séu sama hnit á öllum fjórum nákvæmnistigum. Taka ER1–ER3 með: svar hafði 32 features, 24 properties og var chunked. Ekki breyta gömlu afhendingunni eða skrifa söguna aftur.
3. **Sækja S2-hnit:** endurnýta fyrri bounded-fetch/encoding aðferð fyrir óaflaða S2-kallið að neðan. Para 2894 END / 2892 START við native (732875.6740, 538207.0762), staðfesta bæði stykki og öll retained nákvæmnistig. Hnit í afhendingu eru latitude/longitude; raw x/y röðun og CRS skulu skráð. Ekki nota z sem hæðarstaðreynd eða staðgengil XY.
4. **Metadata og aðkoma:** eina capabilities-kallið að neðan má finna viðeigandi layer-heiti/lýsingar fyrir aðgang/áttir og staðarheiti. Capabilities er ekki sjálft sönnun á akstursheimild. Nota retained heiti ef heimild styður þau; annars lýsa S2 hlutlaust sem valinni aðkomu á mótum stykki2894/2892 með nákvæmu heiti óstaðfestu.
5. **Reykjavík R1:** leita fyrst í retained gögnum að einum nafngreindum candidate með rekjanlegri tengingu í báðar hringáttir. Ekkert Rauðavatnshnit sjálfkrafa gert að Reykjavík. Leggja candidate með heimildum fyrir eiganda; ekki merkja eigandasamþykktan fyrr en eigandi velur. Ef gögn duga ekki, skrá nákvæmlega hvað vantar og leggja fram minnsta næsta gagnaöflunarkall/ákvörðun. Ekki hefja óafmarkaða korta-/þjónustuleit eða nýja gagnaöflunarlotu.

## Afmörkuð netheimild í fyrirhuguðu framkvæmdarprompti

Þessi review-skrá heimilar engin köll. Eftir Jonesy-samþykki verður sama afmörkun í approved-prompt. Nýtt eigandahandoff „Prompt approved“ á READY_FOR_CC heimilar þá þessi TVÖ GET-köll eingöngu; skrá dagsetningu/handoff og approved-prompt SHA í cc-report fyrir fyrsta kall. Ekki endurnýta gömlu owner-authorisation frá #493, né búa til nýja undirskrift eiganda.

Host HTTPS `gagnaveita.vegagerdin.is`, path `/geoserver/gis/ows`, engin auth/cookies/secrets:

1. S2-WGS84: `service=WFS&version=1.0.0&request=GetFeature&typeName=gis:faerdferlar2017_1&CQL_FILTER=IDBUTUR IN (911170037)&srsName=EPSG:4326&outputFormat=application/json&maxFeatures=300`. Nota encoded URL orðrétt úr fyrri request-manifest.json fyrir S2, ekki nýjan síuflokk. Body-cap 262144 bæti.
2. ACCESS-CAPABILITIES: `service=WFS&version=1.0.0&request=GetCapabilities`. Nota encoded URL úr sama manifest. Body-cap 4194304 bæti.

Samtals mest 2 köll, 4456448 svarbæti, 20 sekúndur á kall, 10 mínútna öflunargluggi; TLS staðfest, engar sjálfvirkar endurtekningar eða redirects. Nota fyrri bounded driver/helper ef hann hentar með litlum staðbundnum breytingum; ekki byggja nýjan HTTP-client. Nýr ledger/raw undir ticket-499, eldri gögn óbreytt. Misheppnað kall ekki endurtekið; varðveita árangur sjálfstæðra skrefa og skrá gap.

Fyrirfram meðferð aukafeatures: a.m.k. expected 5 road93-stykki (3410/3409/2894/2892/2891) × 4 tier = 20. Aukafeatures með SAMA IDBUTUR eru varðveitt/skráð en ekki notuð í endpoint; þau ein og sér stöðva EKKI lotuna (E1 sýndi þegar slíka deilingu). STOP fyrir skert/paged svar (matched > returned), limit-hit eða >40 features, rangan CRS/layer/IDBUTUR, eða missing/duplicate/ósamræmd required pör. Ekki breikka síu eða sækja næstu síðu. Ferjubryggjugögn geta komið með en breyta ekki S2-vali.

## Skil og viðtaka

Undir docs/ai/tasks/ticket-499/: endpoint-registry.json (R1/E1/S2/C með aðskildum reitum fyrir eigandaval, hnit/provenance, heiti, tengingar, aðgengi og ólokin atriði), stutt evidence.md/cc-report.md, raw+ledger fyrir ný köll og lítill offline-validator. Halda fyrirliggjandi heitum/ID þar sem hægt er; engin app-runtime tenging í þessari lotu.

Markviss próf: provenance SHA/ledger/native-reference mismatch fellir; required endpoint stykki/tier vantar fellir; tvær mótshliðar ósamræmdar fellir; ónotuð aukafeatures valda ekki fölsku endpoint eða STOP. Nota varðveitt raw/fixtures, ekki netendurkeyrslu til prófunar. Ein targeted validator-keyrsla og þessi regression-tilvik nægja; ekki ný almennt test-/audit-framework eða heildar frontend-suite.

Afhending er nothæf þegar staðfest gögn eru rekjanleg og óviss gögn skýrt merkt. Óstaðfest akstursaðgengi má vera rannsóknarniðurstaða, en þá ekki fullyrða að tengingin sé leiðarvalhæf. R1 candidate án eigandavals eða S2-gat þýðir að #499 er enn PARTIAL; ekki falsa full lokaskilyrði til að ná MVP-merki. Skýrslan segir í fáum línum hvað er tilbúið, eina næstu eigandaákvörðun ef þarf og hvað er enn ólokið.

## Umfang og STOP

Engar app/UI/API-, veður-, scoring-, Free/Pro-, greiðslu- eða routing-engine breytingar. Engar nýjar dependencies, delegation, commit/push, issue-closure eða deploy. #500–#504 og full hönnun #492 utan scope. Ekki gera nýja þjóðarstaðaskrá núna. Ef R1/heiti/aðgengi þarf önnur netköll eða aukið verkefni, skrá ástæðu og spyrja eiganda áður en þau hefjast; klára óháðan heimilaðan hluta.

CC lifecycle samkvæmt README: READY_FOR_CC → CC_IN_PROGRESS → CC_COMPLETE; cc-report/result-review slóðir úr CURRENT. Jonesy greinir nauðsynlega blocker frá valfrjálsri herðingu. Ekki bæta valfrjálsri frágangsvinnu í lokaskilyrði eða hefja þriðju review-umferð sjálfkrafa.

## Jonesy review — umferð 1

Bíður review. Meta réttmæti endurnotkunar, tveggja kalla afmörkun og MVP-skil; ekki innleiða.


## Jonesy review — umferð 1 (2026-11-13)

**Verdict: APPROVED MEÐ SKILYRÐUM JA1–JA3.** Stage helst `PROMPT_REVIEW`. Þetta er hvorki framkvæmdar- né netheimild; hún kemur aðeins með nýju approved-prompt, `READY_FOR_CC` og „Prompt approved“ frá eiganda. Skilyrðin eru aðeins það sem ég tel *sýnda blockera* á MVP-niðurstöðuna (stöðvun sem endurtæki #493-stöðvunina, og vantandi heimild fyrir C); allt annað er merkt valfrjálst og er ekki skilyrði. Þetta er fyrsta umferð.

### Merking

Sandbox (mitt, Linux, aðeins lestur á afritum; engin köll, ekkert net): ég bar drögin saman við `request-manifest.json`, `exchange-ledger.jsonl`, `live_run_summary.json`, `rp1_native_reference.json`, `endpoint-wgs84.json`, `live_driver.py`, `owner-authorisation.md`, `result-review.md` (ER1–ER5) og eigandaákvarðanirnar 2026-11-11. Ég keyrði ekkert og hef enga netheimild.

### Staðfest og í lagi

- Gildi stemma: E1 2345 END = 2344 START, WGS84 65,25861764 / −14,39028964, native (715153,74; 536679,93); S2 2894 END = 2892 START, native (732875,6740; 538207,0762), allt 20 væntra S2-feature-lykla (5 stykki × 4 stig) til í `rp1_native_reference.json` með `IDBUTUR` 911170037; Akureyri C 2940/3876 óbreytt.
- Kallalýsingin er orðrétt úr `request-manifest.json` (URL-in, encoded SHA-sett og bodycap 262144 / 4194304 stemma); samtals 2 köll og 4 456 448 B reiknast rétt; 20 s, engin redirect/retry; „ekki endurnýta gömlu heimildina“ er í samræmi við ER4.
- ER1–ER3 eru tekin inn (SHA/ledger/native-tilvísun, þvert-á-stykki jafngildi, 24 properties / chunked), eigandaákvarðanir virtar (R1 ekki sjálfkrafa Rauðavatn, S2 ekki „staðfest“), umfang og STOP eru skýr og engin app/dependency/commit/push.
- Skil (registry + stutt evidence/cc-report + raw/ledger + lítill validator) og regression-tilvikin eru hæfilega lítil; „PARTIAL ef R1/S2 vantar“ er heiðarlegt.

### Skilyrði (sýndir blockerar)

- **JA1 — endurnotkun á gamla drivernum þarf nákvæma afmörkun, annars stöðvast lotan nákvæmlega eins og #493.** Concrete: `live_driver.validate_response` skilar `False` með `EA4_II_EXTRA_FEATURE_WHILE_EXPECTED_SET_COMPLETE` ef *einhver* aukafeature er til og stöðvar þá bæði S2-úrvinnslu og capabilities (`stopped_reason` → öll síðari köll sleppt); talningarathugunin `number_matched == number_returned == len(features) == len(expected)` fellur líka á aukafeatures; capabilities er aðeins kallað ef S2 var „hreint“; Driver er stilltur á 3 köll / 4 718 592 B / 30 mín; slóðir (`TASK_DIR`) og fyrsta kallið (E1) eru harðkóðuð á gamla verkefnið. Afleiðing: sú keyrsla sem Ripley lýsir („aukafeatures stöðva ekki“) myndi stöðvast við fyrsta aukafeature (ER4 sagði þetta fyrir). Minnsta lagfæring: approved-prompt tilgreinir að þetta séu *einu* leyfðu breytingarnar á **afriti** af drivernum undir `ticket-499/` (gamla skráin og HASHES óbreytt): (a) fjarlægja E1-kallið og setja `max_calls=2`, `max_total_bytes=4456448`, `window_minutes=10`; (b) aukafeatures með sama `IDBUTUR` → skrá sem finding, ekki stöðvun; talningarskilyrði verður `numberMatched == numberReturned == len(features)` og öll 20 væntu pör til án tvítekningar; (c) ACCESS-CAPABILITIES er óháð S2-niðurstöðu nema um flutnings-/öryggisbrot sé að ræða.
- **JA2 — STOP-reglurnar í drögunum stangast á við „aukafeatures stöðva ekki“ og eru óljósar um umfang.** (a) „>40 features“ er geðþótta-þak: E1 gaf 32 með 12 aukafeatures og S2 er `UNKNOWN`; heill gildur svar með t.d. 44 features væri stöðvað og #499 yrði PARTIAL að óþörfu. Minnsta lagfæring: fjarlægja töluna 40; STOP ef `numberMatched > numberReturned`, `len(features) >= maxFeatures` (300), body-skerðing/-cap, rangur CRS/layer/`IDBUTUR`, eða vantandi/tvítekin vænt pör; fjöldi aukafeatures er aðeins skráður. (b) Skilgreina að *gagnaformsstopp á S2* (þ.e. S2 verður `null`/gap) hindra ekki capabilities-kallið, en *flutnings-/öryggisstopp* (TLS-villa, redirect, annar host, budget/gluggi) stöðva allt — drögin segja „varðveita árangur sjálfstæðra skrefa“ en orðið STOP í sama kafla er tvírætt.
- **JA3 — Akureyri C vantar heimild/uppruna fyrir WGS84 í „Lesa fyrst“.** Registry á að hafa C, en hnit hans (IDFERILL 2940, `IDBUTUR` 909030037, 65,69570405 N, 18,12371406 V) eru aðeins í `ticket-493/akureyri-endpoint-decision.md` með tilvísun í `ticket-493-north-data/evidence-north.md` og `route-data-candidate.json`, ekki í endpoint-acquisition-skrám. Án þess að nefna þær skrár gæti CC látið C vera án hnita (registry óbrúkhæft) eða giskað. Minnsta lagfæring: bæta þessum skrám í „Lesa fyrst“ og krefjast að C-færslan vísi á skrána + SHA, merkt „retained, ekki endursótt“, án nýs kalls.

### Valfrjálst (ekki skilyrði, ekki blocker)

- GetCapabilities fyrir allan GeoServer getur verið stærra en 4 MiB; ef svarið skerðist er það gap, ekki endurtekning — drögin segja þetta nú þegar um misheppnuð köll.
- Skrá Vegagerðar/CC BY 4.0 vísun í registry-færslum (var í fyrra evidence).
- Gömlu EA2-prófin (localhost) sanna aðeins driver, ekki gagnaveituna; ekki þarf að endurkeyra þau.

### Næsta skref

Ripley (`Jonesy búinn að reviewa prompt`): fella JA1–JA3 inn í `approved-prompt-v1.md` og setja `READY_FOR_CC`; ef Ripley vill fremur breyta drögunum og fá aðra yfirferð, þá er það önnur umferð (ekki sjálfkrafa þriðja). Eigandi sendir „Prompt approved“ til CC.
