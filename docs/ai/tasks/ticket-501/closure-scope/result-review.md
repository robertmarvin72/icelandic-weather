# #501 closure-scope — Jonesy result review — 2026-11-20

Yfirfarið: `cc-report.md`, `scope-and-blockers.md` (410 línur), `approved-prompt-v1.md` (P1–P8), `CURRENT.md`. Í `closure-scope/` eru nú fjórar skrár (`approved-prompt-v1.md`, `cc-report.md`, `prompt-review.md`, `scope-and-blockers.md`); `prompt-review.md` er **óbreytt** frá mínu afriti (26 790 B) og P1–P8 í `approved-prompt-v1.md` eru **bókstaflega eins** og mín (`==` á texta, 8 576 stafir). `CURRENT.md` ber aðeins workflow-breytingar (Stage, slóð á approved prompt, tvö handoff). Engin kóða- eða gagnaskrá er í mínu afriti sem sýnir breytingu; ég get ekki keyrt `git status` héðan (sjá mörk).

## Niðurstaða

**PASS — engir blockerar.** Skref 2 er framkvæmanlegt og skýrt: stuðningslistinn er réttur, tilraun A endurskapar mínar tölur, lokaði blockerlistinn (B1 same_place Vestfjarðaenda, B2 tíu óstudd samsett pör, B3 ekki blocker) er afmarkaður og P4-skilyrðin eru öll innan. Skjalið fullyrðir hvergi fullgert net, byrjar ekki á skrefi 2 og heldur öllum takmörkunum sýnilegum. **Fimm atriði (S1–S5) eru skjalaleiðréttingar sem Ripley getur gert beint** (eins og S1/S4 í síðustu lotu) — ekkert þeirra breytir skrefi 2-tillögunni, blockerlistanum eða tölum; **S2 (3611/`via`) verður að fara inn í approved-prompt skrefs 2**. Engin umferð 2.

## Merking: sandbox vs CC

- **Sandbox (mitt, Linux, node, vitest, pyproj):** núverandi kóði (afrit gegnum Tálknafjörð — geometryId/regionVersion CC passa nákvæmlega við mín, svo kóðinn er sá sami), raunhandler, raunkjarni og svæðisskrár. Allar tölur mínar, viðmið ±0,05 m.
- **CC-fullyrt, ekki endurkeyrt af mér:** `git status`/`git diff --check` á Windows; að engin kóða-/runtimeJSON-/eldri skjöl hafi breyst (ég sé aðeins að `closure-scope/` og `CURRENT.md` eru það sem er í mínu afriti). **813/813** er CC-fullyrt tala úr Tálknafjarðarlotunni (sjá S1), ekki mín.

## Sandbox-staðfesting (óháð)

1. **Stuðningslisti (P1):** minn eigin handler-loop yfir öll **3 600 raðpör** (60 id) gefur nákvæmlega CC-töluna: **5 `same_place`** (reykjavik-raudavatn, egilsstadir, seydisfjordur, hella, selfoss), **3 107 `200 unsupported endpoint_mapping_unavailable`**, **36 `geometry_only`** (18 óröðuð), **452 `400 unknown_place_id`**. Allar 18 lengdirnar, valkostur (`south` aðeins á Rauðavatn↔Hella/Selfoss), tier (2 hringpilot, 0 Vestfirðir), `geometryId` og `regionVersion` í töflum CC eru **eins og mín** (fylgdu t.d. `9d3e8ed9…`/`2f68aa48…` Búðardalur↔Flókalundur, `b0c4c622…`/`656802aa…`, `e79c0f7e…` Egilsstaðir↔Seyðisfjörður). Ég sé því að `flokalundur→flokalundur` er `400` (ekki same_place) og `budardalur/holmavik→sjálft` `200 unsupported`, eins og B1 segir.
2. **P3 raunpróf:** `budardalur↔holmavik` báðar áttir `200 unsupported endpoint_mapping_unavailable`; `seydisfjordur→egilsstadir` 24 148,860880942146 m, `geometryId` `3f67cfaa…` (öfug stefna ≠ fram) — eins og CC.
3. **Tilraun A:** `budardalur-flokalundur` ∪ `throskuldar-holmavik` = **24 línur** (mín talning = CC), B↔H **78 697,77054505677 m**, 12 slices í sömu röð, `3755 END = 3321 START` (z 42,058), enginn connector — nákvæmlega mín tala. Öll tíu ný pör (lengd, slices, `estimatedConnectorLengthM` 0,0050 / 4,3932 / 4,3982 / 0) **samsvara mínum sandbox-tölum** og eru ekki afrit: CC mældi á eigin sameiningu og fann sjálft connector-villuna (−4 vantaði → ~383 km) áður en tölur voru festar. Hringvegshættan: 219 478,016 / 51 570,879 / 177 322,814 m **allar staðfestar** af mér (ég hef einnig 93 726,081 m fyrir B→J68 með Hringvegi, sem CC nefnir ekki; óþarft).
4. **Skörun svæðisskráa (athugasemd CC um 3611):** CC hefur **rétt fyrir sér og ég rangt**. Ég skrifaði „JSON-eins, 0 átök“ eftir samanburð á *hnitum* einum; heil línuhluti er **ekki** eins í `sourceId 3611` (`1-68-holmavik` ber auka `idbuturName`, `throskuldar-holmavik` ekki). Hin sex skarast sourceId (2769, 3648, 3833, 3834, 3883, 53127) eru JSON-eins. Talning CC „7 id, 9 aukaeintök“ stemmir (16 eintök alls, 88 ólík `sourceId`).
5. **P6, 31 raðir:** ég keyrði sjálfstæða punkt-til-hluta vörpun allra 31 CSV-hnita (pyproj → EPSG:3057) á 90 lína netið. **Allar 31 fjarlægðir og næstu `sourceId` eru eins og í töflu CC** (t.d. 160,1/2769; 564,8/3753; 3 707,2/3544; 2 255,5/3771; 9 808,6/49925; 995,4/2889; 284,4/3535 Súðavík; 4 519,9/3003 Dýrafjarðargöng; 32 650,0/3370). **Súðavík-leiðrétting CC er rétt** (284 m frá 3535 á Ísafjörður↔Hólmavík-legg; tilgáta mín var röng). **Dýrafjarðargöng er raunverulegt gagnagat:** göngin sjálf (38085/38087/38088) **eru** á núverandi Flókalundur↔Ísafjörður-legg (ég sá þau í sneiðaröð), en CSV-punkturinn (65,834; −23,454) er 6,2/10,1/12,6 km frá þeim og 4,5 km frá 3003 — CC skráir þetta sem gat, ekki lagað. Staða á 6 endum, 2 junction-viðmiðum (41, 64), Brjánslæk (43), Flatey (44) er rétt.
6. **Föst leið (skilyrði 8):** ég keyrði sjálfur `api/winter-route.test.js` (20) og `api/_lib/winterRoute/routes.test.js` (12): **32/32 PASS** (vitest 3.2.7, sandbox-afrit). `src/lib/winterRouteRoutes`-próf er ekki til í mínu afriti og var ekki keyrt.

## Athugasemdir (S — ekki blockerar; skjalaleiðréttingar)

**S1 — fjórar rangar/ofmetnar stöður í töflu lokaskilyrða (Ripley leiðréttir beint).**
(a) **Röð 7 „Satisfied“ stangast á við B1/B2** í sama skjali (same_place á Vestfjarðaendum og samsett pör vantar próf af því að hegðunin vantar). Rétt staða: **að hluta — vantar same_place-/samsett próf (B1/B2)**; röð 5 er „uppfyllt fyrir núverandi pör; samsett = B2“ (tilraun A er forskrift, ekki próf).
(b) **„813/813“ (raðir 1 og 7) er ekki „samanlögð svíta níu lota“ og er ekki staðfest af mér.** Það er *CC-fullyrt full `api/`-svíta* í Tálknafjarðarlotunni; ég skráði hana sem „ekki endurkeyrt af mér“. Mín óháða tala er **257/257 á tíu skrám** (sama lota). Skjalið á að nota 257/257 sem fyrra lokamati eignað (P7) og skrá 813/813 sem CC-fullyrt, eða sleppa henni.
(c) **Röð 8:** sönnunin er „git status í hverri lotu“ — það sannar að ekkert var snert, ekki að leiðirnar virki. P7 bað um að skrá hvort focused próf fyrir skilyrði 8 væru keyrð; `cc-report.md` svarar ekki því. Bæta við: „CC keyrði ekki focused föstu-leiðaprófin; Jonesy sandbox: `winter-route.test.js` + `routes.test.js` 32/32“ (eða Ripley keyri þau á Windows).
(d) **P6-dálkurinn „Á samsettri leið?“** mælir í raun *fjarlægðardóm* (t.d. Reykhólar „Nei“ þótt 49925 sé á Búðardalur↔Flókalundur-legg; Bíldudalur „Nei“ þótt 2889 sé á P↔T; hjá mér er næsta lína á einhverri sýndri leið í öllum 31 röðum). Endurnefna í „innan þröskulds (nærri línu á legg)“ eða skrá `sourceId` línu *og* hvaða legg hún tilheyrir sérstaklega, svo „Nei“ sé ekki lesið sem „línan er ekki notuð“. Staða 37 (Holtavörðuheiði, „Hringvegarstaður“) falli undir orðaforðann: framtíðargrein (Hringvegur).

**S2 — 3611-munurinn hefur áhrif á `via`, ekki aðeins „cosmetic“ (verður að fara í skref 2).** CC segir `idbuturName` á 3611 hafi engin áhrif á leið, lengd eða IdButur. Það er rétt, en `api/winter-route-geometry.js` (um l. 694) les `line.idbuturName` til að leiða `via` (`Innstrandavegur`/`Broddanes`) fyrir 1/68–Hólmavík-greinina. Sameining á `sourceId` skal því taka **yfirmengi reita** (halda `idbuturName`), núverandi J68↔Hólmavík-grein helst byte-eins og **`via` fyrir ný pör skal ákveðin og fest í prófi** (t.d. B↔H, B↔I: ekkert/`[]` eða nefnd nöfn — ekki leiða úr óákveðinni sameiningu). Þetta á að bætast við P4 í skrefi 2-prompti.

**S3 — leiðrétting á minni eigin fullyrðingu.** Setningin „7 skarast sourceId JSON-eins, 0 átök“ í minni umferð 1 var of víð; rétt er 6 af 7 JSON-eins og 3611 með aukareit (S2). Engin áhrif á lengdir.

**S4 — afmörkun á „Experiment A staðfestir engin tvítalning“.** Þetta er skrifta-samanburður á 24/88/90 línum; til að verða lokaskilyrði 5/7 þarf að verða *próf* í skrefi 2 (sama niðurstaða, ekki ný vinna). CC segir þetta sjálft í B2/P4; bæta við orðalag í röð 5.

**S5 — flokalundur.** Ripley og CC fylgja sömu tillögu (F verður veljanlegt í nýju pörunum, fær same_place, gömul `400` fyrir óstudd pör óbreytt). Ég bendi aðeins á að þá þarf `flokalundur→flokalundur` að skila same_place **án** þess að `flokalundur` fari í 56-lista (hún er nú `400 unknown_place_id`); skref 2-próf á að festa bæði.

## Mörk þessarar yfirferðar

- Ég get ekki keyrt `git status`/`git diff --check` eða lint á Windows; „engin kóðabreyting“ og „engar eldri skrár breyttar“ byggir á CC-skýrslu, að `prompt-review.md`/`approved-prompt-v1.md` standast samanburð og að `CURRENT.md` ber aðeins workflow-breytingar í mínu afriti.
- Ég las ekki GitHub #501; átta lokaskilyrðin eru úr prompt-texta. Engin sjónræn athugun, ekkert kort. Lengdir eru tier-0 planar, `drivingAccess: UNVERIFIED`; „studdur endi“ er MVP-skilgreining.
- Ég keyrði ekki fullsuite, mutation eða build (utan umfangs). Næsta: Ripley leiðréttir S1(a–d) beint í `scope-and-blockers.md`, bætir S2 í skref 2-prompt, eigandi samþykkir afhendingarmengi/eftirfylgni. Umferð 2 aðeins ef eigandi biður um hana.


## Ripley lokamat — 2026-11-20

**PASS — skref1 lokunarumfangi lokið.** Jonesy PASS og CC-afhending lesin gegn samþykktu prompti. Beinar skjalaleiðréttingar S1/S4: lokaskilyrði5 samsett=B2, skilyrði7 að hluta=B1/B2, fyrri257/257 eignuð Ripley/fyrri813fullapi eignuðCC, skilyrði8 með raunfocusedprófum. P6síðasti dálkur endurnefndur nálægðardómur, ekki sönnun um route-notkun; Holtavörðuheiði framtíðargrein(Hringvegur).

S2/S3 leiðrétt í samantekt: 3611aukaidbuturName hefur áhrif ávia, ekki geometry. Skref2krefst metadata-yfirmengis viðsameiningu/deterministicvia íprófum, fyrriJ68par óbreytt. Flókalundur same_place án almennrar56listavíkkunar og óbreytt400gates áfram skýrt. Enginn nýr blocker bættur; B1same_place/B2samsettpör eru lokaði listinn, B3afhendingarsamningur ekki blocker nema sýnd villa.

Sjálfstætt Windows: raunhandler B↔H báðaráttir200unsupported; H↔H200unsupported; Selfoss↔Selfoss same_place. Vitest4.1.10 föstu leiðaprófin api/winter-route.test.js og api/_lib/winterRoute/routes.test.js **32/32 PASS**. Afhendingartafla hefur nákvæmlega31raðir34–64; diff-check án villna (eldrihandlerLF/CRLFviðvörun). Allur3600parahringur, sjálfstæðar geometry-/fjarlægðarmælingar og tölur tíunýrra para eru CC/Jonesy eignuð, ekki endurkeyrð hér. Engin fullsuite/build/lint nauðsynleg fyrir skjalabreytingar; enginn kóði/runtimegögn breytt.

CURRENT→CLOSED fyrir closure-scope. #501 ekki lokið: skref2(samsetning/same_place) og skref3(lokapróf/handoff) eftir. Eigandi hefur þegar samþykkt aðskilnað frekari þekju; ekki ný almenn umfangsspurning. Næsta executionprompt þarf að festa tiltekið afhendingarmengi og skýringar S2/S5 hér. Engin sjálfvirk innleiðing, engin ný gagnaöflun/GitHub/commit/push/deploy.
