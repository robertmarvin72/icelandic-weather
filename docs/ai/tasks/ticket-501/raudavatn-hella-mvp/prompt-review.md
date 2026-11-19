# #501 — Rauðavatn ↔ Hella MVP — Round 1 — 2026-11-18

## Markmið

Eigandi samþykkti áframhald eftir lokinn Rauðavatn↔Selfoss MVP. Framlengja sömu lausn að Hellu í báðar áttir í núverandi geometry API. Endurnýta einföldu MVP-stefnureglurnar og sömu 44,215 m estimated tengingu. Engin ný rannsókn eða Vegagerðar-svar sem forsenda. Þetta er prompt-review, ekki framkvæmdarheimild; CC keyrir aðeins approved prompt eftir eiganda Prompt approved og CURRENT READY_FOR_CC.

## Lesa og breyta afmarkað

AGENTS/CLAUDE/README/CURRENT; raudavatn-selfoss-mvp/result-review.md með eigandasamþykki; api/_lib/winterRoute/raudavatnSelfossMvpPolicy.js og próf, api/winter-route-geometry.js og próf, geometryDataset og geometryComposition eftir þörfum. Runtime JSON og pinnuð hnit haldast óbreytt. Engin skyldulesning allrar rannsóknarsögunnar.

## Framkvæmd

- Nota núverandi buildMvpDirectedInput óbreytt ef hægt. Víkka paraval aðeins þannig að Rauðavatn↔Hella bætist við Rauðavatn↔Selfoss. Þetta er fjögur directed ferðapör, ekki öll pör innan þriggja staða; Selfoss↔Hella helst óbreytt undirected í þessari lotu. Ekki bæta við framework eða afrita policy.
- Heiti núverandi hjálpartækis/exports mega haldast til að spara óþarfa rename. Leiðrétta afmörkunarathugasemdir sem segja „nákvæmlega eitt par“. PolicyVersion má halda sama gildi ef reglur/connector eru eins; fyrri Selfoss geometryId og svör eiga þá að haldast óbreytt. Ekki gera cosmetic rename að skilyrði.
- Keyra báðar raunáttir á pinned Rauðavatns- og Hellu-endapunktum með raunverulegum gögnum. Ekki spegla directed leið. Röð búta/hnita, hringtorg og akbrautir fylgja sömu samþykktu reglum: 1/8 both, 3/4/5/6/7 forward, basis OWNER_APPROVED_MVP_ASSUMPTION. Ekki ný heimildar-/lagaleg staðfesting.
- Sama connector aðeins í directed pilot-köllum; ekki í sameiginlegt dataset. Estimated-merki og lengd halda sér. Ekki bæta nýjum connectorum í blindni: ef Hella-parið þarf aðra tengingu, sýna nákvæma bilun og minnsta nauðsynlega breytingu áður en umfang vex.
- Uppfæra gömlu P3-prófin sem kröfðust undirected fyrir Rauðavatn→Hella: þetta par er nú vísvitandi innan pilots. Færa regression-vörnina á óskylt par, t.d. Selfoss↔Hella og Egilsstaðir↔Seyðisfjörður; óskyld pör og same_place halda fyrri samningi. Ekki eyða regression-vörninni án staðgengils.

## Afhending og lágmarksstaðfesting

1. Raunverulegur handler skilar geometry_only/directed fyrir Rauðavatn→Hella og Hella→Rauðavatn, rétta pinnaða enda og samfellda hnitakeðju; lengd endurreiknuð úr hnitum stemmir. Skrá raunmældar lengdir, ekki ágiskun eða áætlaða summu fyrri leiða.
2. Focused próf staðfesta policy sé notuð (réttar akbrautir/forward hringir, estimated connector rétt merktur og talinn þar sem notaður), fyrri Selfoss-par óbreytt og óskyld pör/same_place ekki dregin inn. Engin all-pair/mutation/fuzz krafa.
3. Nota fyrirliggjandi task-local kortasýn sem fyrirmynd og búa til EINA map-view.html í þessari lotu fyrir Rauðavatn↔Hella, með tveimur litum og estimated tengingu. Opna í gegnum localhost, ekki file://: canonical https://tile.openstreetmap.org/{z}/{x}/{y}.png, eðlilegur Referer og sýnileg attribution. Endurnýta hnitaumbreytingu úr fyrri kortsgerð; ekki ný dependency eða product-UI. Ef næsti laus port þarf annan vefþjón, binda aðeins við 127.0.0.1 og þjóna aðeins task-möppu. Ekki rjúfa fyrri sýn að óþörfu.
4. Skoða sérstaklega nýja hlutann Selfoss↔Hella og sýna eiganda virkt kort. Ef CC getur ekki séð kortið, skrá það heiðarlega og afhenda opnanlega sýn; ekki búa til sjónrænt PASS. Fyrra eigandasamþykki Selfoss-sýnar á ekki við nýja hlutann sjálfkrafa.
5. Keyra viðeigandi focused geometry/policy/API og eldri winter-route próf, lint á snertum JS, git diff --check. Ekki fullsuite/build eða nýja prófaröð án ástæðu. cc-report.md stutt: breyting, báðar lengdir, próf, virkur kortahlekkur og takmarkanir. Engin ný rannsóknarskýrsla nauðsynleg.

## Mörk og lok

Leyft: núverandi pilot-policy/paraval og próf, geometry API/próf, task-local kort/skýrslugögn og CURRENT. Pure geometry-kjarni/dataset haldast óbreytt. Ekkert src UI, eldri api/winter-route.js, veður/færð, cache, pricing, scoring, dependencies eða önnur ticket. Engin gagnaöflun/metadata-leit, Vegagerðar-skilaboð, commit/push/deploy/GitHub. Venjuleg tile-kortaskoðun heimil.

Þessi lota skilar stuttu suðurleiðinni til Hellu. Hinn hringvalkosturinn og sameiginleg valkostaniðurstaða koma síðar; ekki klára allt #501 hér. Staðir á Hringvegi í röð og afleggjarar sem greinar eru samþykkt heildarlíkan eiganda, ekki heimild til alls landsumfangs í þessari lotu.

CC READY_FOR_CC → CC_IN_PROGRESS → CC_COMPLETE með skýrsluslóð; Jonesy yfirferð síðan Ripley lokamat. Blocker sýnir rangan/ónothæfan afhentan feril eða raunverulegt umfangsbrot. Valfrjáls hardening, F1–F3 úr fyrri lotu og skortur á opinberri staðfestingu samþykktra MVP-forsendna opna ekki nýja lotu. Þegar báðar áttir og focused próf virka, stoppa.

## Jonesy review — umferð 1 (2026-11-18)

**Niðurstaða: APPROVED með bindandi P1–P5. Engir blockerar.** Núverandi policy og sami connector duga óbreytt fyrir Rauðavatn↔Hella; engin ný tenging og engin kjarna-/dataset-breyting þarf. P-atriðin loka þremur gildrum sem promptið sér ekki sjálft (paraval, hringtorg við Hellu-endapunkt, regression-prófin).

### Sandbox-staðfesting (mitt, Linux; raunkjarni óbreyttur, núverandi `buildMvpDirectedInput`, raunverulegt pilot-gagnasafn; ekkert keyrt á Windows)

| Leið | Niðurstaða (sandbox) | Undirected til samanburðar |
|---|---|---|
| Rauðavatn → Hella | geometry_only, **80 681,311934 m**, 21 slices, connector ekki notaður, geometryId-forskeyti `a71377300033` | 80 630,947828 m (+50,364) |
| Hella → Rauðavatn | geometry_only, **80 747,986952 m**, 19 slices, connector einu sinni (44,214688 m), forskeyti `e77ac0a9b47b` | 80 630,947828 m (+117,039) |
| Selfoss → Hella (til skýringar) | directed 35 696,542 m | undirected 35 646,177 m (óbreytt API) |
| Rauðavatn↔Selfoss (óbreytt) | 44 984,770 / 45 101,810 m; forskeyti `215a1805457e` / `d657c07e5602` | — |

- **Engin ný bilun:** Hella→Rauðavatn tengist með sama eina connectornum (2021-endi → 1735/2071). Ný hluti leiðarinnar (Selfoss↔Hella) notar eingöngu VEGHLUTI 1 og 5; engir 3/4/6/7-bútar, því engin ný stefnuforsenda reynir á þar.
- **Directed lagar hringtorg sem undirected fer rangt um:** undirected austur fer 8676 og 3454 réttsælis (`8676 r2-1`, `3454 r2-0`); directed fer 8676 f2→4 og 3454 f2→4 (rangsælis). Vestur: 3454 f0→2, 8676 f1→2. Það skýrir +50 m austur.
- **Öll hringtorg á leiðunum** (36807, 52491, 52492, 8676, 3454) eru farin eingöngu rangsælis (athugað á brúnastigi: 0 brúnir á móti hringstefnu) — nema eitt tilvik, sjá P3.

### Bindandi P-atriði

**P1 — Paraval er skýrt, ekki mengjastækkun.** Núverandi `isRaudavatnSelfossPair` krefst þess að bæði id séu í menginu {Rauðavatn, Selfoss}. Ef Hella er einfaldlega bætt í mengið verður **Selfoss↔Hella óvart directed** (35 696,542 m í stað 35 646,177 m, nýtt geometryId) og brýtur prompt-skilyrðið. Notið skýrt lista: nákvæmlega fjögur raðpör {R1→Selfoss, Selfoss→R1, R1→Hella, Hella→R1}; same-id áfram útilokað. Próf á predicate: Selfoss↔Hella, Hella↔Egilsstaðir, Egilsstaðir↔Seyðisfjörður, R1↔Egilsstaðir, öll same-id = false.

**P2 — Viðmiðstölur og „policy er raunverulega notuð“.** Prófin sýna: báðar áttir continuous, endar = pinnaðir endapunktar (nákvæm jafna), `lengthM` = endurreiknað úr hnitum (≤0,01 m), `mode: directed`, `policyVersion` óbreytt (`raudavatn-selfoss-mvp-v1-a73f8191242a0938` ef reglur og connector eru eins), `drivingAccess: UNVERIFIED`. Auk þess: bæði Hella-pör ≠ undirected-lengd (sjá töflu) og austur inniheldur hringina 8676/3454 forward (2→4), vestur 3454 0→2 og 8676 1→2; vestur inniheldur connectorinn nákvæmlega einu sinni með `estimated: true` og `estimatedConnectorLengthM` = 44,2147; austur `estimatedConnectorLengthM` = 0. **Selfoss-pörin óbreytt:** sömu lengdir og geometryId (fullt gildi úr óbreyttum API, ekki mitt forskeyti). Raunmældar lengdir CC koma í skýrsluna; tölurnar mínar eru viðmið, ekki Windows-staðfesting.

**P3 — Hellu-endapunkturinn liggur á hringtorgi; skrá það, ekki laga það.** Pinnaði endapunkturinn (430972,1263; 370845,6043, 3591 vertex 0) liggur á norðurboga hrings 16641, ~3,3 m frá vestari innkeyrslunni (3591 vertices 1–2 liggja sjálfir á hringnum). Austurátt (Rauðavatn→Hella og, ef það yrði beitt, Selfoss→Hella) endar því á `3591 r3-0` sem fer **~3,2 m á móti hringstefnu** (3591 vertices 2→1→0 = 1,936 m brún hrings 6→5 í öfuga átt auk ~1,25 m af hluta brúnar 4→5). Hella→Rauðavatn fer rétt (rangsælis frá útakstri). Þetta er áhrif þess að endapunktur er punktur á hring, ekki heil kringumferð; ekki blocker (3 m við áfangastað, pinnaður endapunktur óbreyttur samkvæmt prompti). CC á **ekki** að færa endapunktinn, bæta við connector eða sérreglu. Prófið „enginn slice á móti hringstefnu“ verður að undanskilja nákvæmlega lokabút `3591` í austurátt (eða miða við „allir hringtorgsbútar forward nema …“) — annars fellur það, eða verra, verður veikt til að ná í gegn. Skrá í cc-report og sem sýnilegt skoðunaratriði á kortinu (eigandi metur).

**P4 — Selfoss↔Hella API-svarið er áfram undirected (samkvæmt prompti) og það sést.** Þar með fer Selfoss→Hella-svarið áfram réttsælis um 8676 og 3454, á meðan sami hluti innan Rauðavatn→Hella er rangsælis. Rétt skráð takmörkun, ekki galli lotunnar; CC segir það í cc-report svo eigandi lesi ekki óbreytt Selfoss↔Hella sem MVP-directed. Kortasýnin á „nýja hlutanum Selfoss↔Hella“ er sá hluti sem er innan Rauðavatn→Hella leiðarinnar.

**P5 — Regression-prófin flytjast, þau eru ekki eytt.** Tvö núverandi próf nota Rauðavatn↔Hella sem „óskylt par“: handler-prófið „P3 unrelated pair … plain OLD undirected“ (80 630,948 m, ekkert mode/policyVersion) og policy-prófið „unrelated pair R1↔Hella … DIFFERENT length“. Þau verða að snúast að **Selfoss↔Hella**, sem er enn sönn sönnun: directed 35 696,542 m ≠ undirected 35 646,177 m, og API-svarið þarf að vera óbreytt undirected með pinnað geometryId `1e5ec24e068b90156c1c9b0ec1c00d39`. Bæta einu prófi sem pinnar Egilsstaðir↔Seyðisfjörður (eða annað óskylt par) og same_place. Leiðrétta athugasemdir sem segja „nákvæmlega eitt par“.

### Athugasemdir (ekki blockerar)

- Sjónræn heiðarleiki (P6 fyrri lotu gildir áfram): ég sé ekki kort og fullyrði ekkert sjónrænt. Skoðunaratriði fyrir eiganda í nýju sýninni: hringir 8676 og 3454 báðar áttir, Hella-hringur 16641 við endapunktinn (P3), connectorinn aðeins í vesturátt. Fyrra eigandasamþykki Selfoss-sýnar nær ekki sjálfkrafa til þess.
- F1 (z:null á samskeytahnitinu í vesturátt) endurtekur sig í Hella→Rauðavatn; valfrjálst, ekki ástæða til lotu.
- Stopp: ef CC finnur að Hella-parið þarf aðra tengingu en sandbox sýnir, STOP og sýna nákvæma bilun (eins og promptið segir). Þegar báðar áttir og focused próf standast, stoppa; engin umferð 2 nema eigandi biðji.

**Næsta skref:** Ripley skrifar approved-prompt-v1.md með P1–P5 → eigandi: „Prompt approved“ til CC.
