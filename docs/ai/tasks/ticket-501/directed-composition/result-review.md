## Jonesy result review — umferð 1 (2026-11-18)

**Verdict: PASS. Engir blockerar.** Directed kjarninn gerir það sem approved-prompt-v1 + P1–P6 biðja um, og óstefnda hegðunin er óbreytt á öllum raunpörum. Ein lítil frávik frá „byte-identical“-fullyrðingu CC (CF1, texti í `detail`) og fimm valfrjáls prófagöt (OP1–OP5). Ég les þetta sem tillögu að lokamati; lokamat er Ripley/eiganda.

Merking: **[sandbox]** = keyrt af mér í skýjasandbox (Node 22, afrit af repo, eigið vitest v3 utan repo; ekkert net, ekkert á vél eiganda, engin breyting í repo). **[CC]** = fullyrt af CC á Windows, óstaðfest af mér.

### 1. Sandbox-staðfest

1. **Raunverulegt vitest (v3, óbreytt prófaskrá): 8 skrár / 132 próf PASS** — geometryComposition 54 (23 gömul + 31 ný), winter-route-geometry 20, geometryDataset 11, winter-route 20, cache 9, routes 12, segments 3, winterRouteRoutes 3. Stemmir við tölu CC.
2. **Óstefnt óbreytt gegn gamla kjarnanum** (afrit af geometryComposition.js fyrir breytingu vs núverandi): öll 25 raunpör (5×5 endapunktar) `deepStrictEqual` og JSON-strengur eins, `reverseGeometryPath` líka; `GEOMETRY_COMPOSITION_VERSION` = 1; UNSUPPORTED_REASONS óbreytt (aðeins fjögur ný). Selfoss→Hella `geometryId` = `1e5ec24e068b90156c1c9b0ec1c00d39`. 400 slembin synthetic óstefnd tilvik: eins nema `detail`-texti á `disconnected_graph` (CF1).
3. **Raunfixture 36807 (hypothetical, `TEST_FIXTURE_HYPOTHETICAL`):** forward A→B **72,549288 m**, ein slice 36807 forward 2→5; forward B→A **40,406375** (0→2); reverse A→B 40,406375 (2→0), reverse B→A 72,549288 (5→2); both: 40,406375 báðar leiðir. Stemmir við mitt óháða Python-prototype frá prompt-review.
4. **P1 raunfixture** `[2117,2134,2135,36807]` + policy aðeins 36807 forward ⇒ 72,549288 (sía-síðan-dedup). Mutation „sía eftir óstefnt dedup“ fellur 4 próf; „óraðaður dedup-lykill í directed“ fellur 1.
5. **Differential fuzz á directed (3 000 slembin tilvik, 2 132 óná­anleg / 568 náanleg, restin same_place):** borið saman við óháða Bellman-Ford á heimiluðum brúnum: staða/náanleiki réttur, `lengthM` = óháð stysta lengd (<1e-9), hver slice á leyfðri línu og í leyfðri átt, samfelldar slices frá `from` til `to`, óháð summa = `lengthM`, `appliedRule`/`directionBasis` rétt á hverri slice, röð lína og reglna víxluð ⇒ sama `geometryId`, annað `policyVersion` ⇒ annað ID, `reverseGeometryPath` hafnar alltaf (`directed_result_not_reversible`), óná­anlegt ⇒ `no_directed_path` með `mode`/`policyVersion`.
6. **Raungögn (255 línur/946 hornpunktar):** allt-`both` ⇒ sömu slices/lengd og óstefnt á öllum 20 pörum (munur 0) og **annað** `geometryId` í hverju; allt-`forward` nær aðeins 3/20 pörum (styður að teiknistefna er ekki stefnuforsenda); R1→Selfoss með tóma gilda policy ⇒ `no_directed_path` (`mode: directed`, `policyVersion` rétt), ekki `endpoint_not_in_graph`; endapunktur utan grafs ⇒ `endpoint_not_in_graph` með directed-merkingu.
7. **Afmörkun á vél (listing):** aðeins `geometryComposition.js` (29 252 B) og `.test.js` (49 895 B) breytt; `geometryDataset.js/.test.js`, `winter-route-geometry.js/.test.js`, `server_data/*`, aðrar `api/`-skrár með óbreyttan mtime; í `directed-composition/` eru approved-prompt, cc-report, contract-note og prompt-review.
8. **Mutation (32 stökkbreytingar á kjarnanum, prófin keyrð óbreytt):** 26 felldar, 6 lifa. Felldar m.a.: missing/unknown/blocked sem heimilað, forward↔reverse víxl, both≈forward, tier/basis/enum/sourceId/policyVersion athuganir fjarlægðar, conflict last-wins (bæði átt og basis), policy án mode, mode directed án policy, `disconnected_graph` í directed, reversal leyft, `mode`/`policyVersion` tög fjarlægð, same_place-ID óstefnt, ógilt policy staðfest of seint, tómt policy hafnað, endapunktur krefst brúna.

### 2. P1–P6

- **P1** ✔ sía á heimilaðar áttir áður en ordered parallel-edge val (`resolveParallelEdges` með `directedPairKey`); synthetic (blocked/missing víkur, einstefnu-par lifa bæði, tveir sömu stefnu ⇒ lægra ID) og raunfixture.
- **P2** ✔ fimm gating-línur réttar; tómt policy gilt.
- **P3** ✔ policy staðfest fyrirfram, óháð notkun; ógilt ⇒ `invalid_policy` fyrir alla niðurstöðu (kóðinn staðfestur í sandbox, sjá OP3 um próf).
- **P4** ✔ útgáfa óbreytt, gamalt ID fest, óstefnd niðurstöðu-objekt án nýrra lykla (athugasemd CF1 um `detail`), directed ID inniheldur mode + policyVersion + `appliedRule` per slice (virkni staðfest, sjá OP1 um próf).
- **P5** ✔ `no_directed_path` aldrei `disconnected_graph` í directed mode; endapunktaleit yfir allar línur; directed same_place með eigið ID.
- **P6** ✔ directed `geometry_only` hafnað í `reverseGeometryPath`; B→A er ný sjálfstæð compose.

### 3. Frávik og valfrjáls atriði (ekki blockerar)

- **CF1 (lítið frávik frá fullyrðingu, ekki blocker):** textinn í `detail` á **óstefndu** `disconnected_graph`-niðurstöðu breyttist úr „…no edge-connected path exists in the given lines“ í „…in the given lines/policy“ (deilt strengur með directed greininni). Staða, `reason` og öll önnur svæði eru eins, og API les aðeins `reason`, en niðurstaðan er því ekki „byte-identical“ eins og `cc-report`/`contract-note` fullyrða (142 af 400 slembnum disconnected-tilvikum, sandbox). Minnsta lagfæring: sér-streng fyrir óstefnda greinina (eða gamli textinn fyrir `!directed`) + eitt próf sem festir hann. Engin áhrif á ID eða raunpör.
- **OP1 (prófagat, P4):** `policyVersion` í directed ID er ekki varið af neinu prófi (fjarlæging lifir, 54/54), né `appliedRule` í descriptor, né `mode`. Aðeins samanlögð fjarlæging allra þriggja fellur (2 próf). Kóðinn er réttur (fuzz: annað policyVersion ⇒ annað ID; sömu slices undir both vs forward ⇒ annað ID). Smæsta lagfæring: tvö próf — sama leið með `policyVersion` "a" vs "b" ⇒ ólík ID; sama leið undir `both` vs `forward` (36807-hringur B→A: forward 0→2 og both) ⇒ ólík ID.
- **OP2 (prófagat, P5):** `directionBasis` á slice er ekki varið (fjarlæging lifir). Ein fullyrðing á raun-slice dugar.
- **OP3 (prófagat, P3):** enginn próf fyrir **ógilt policy + sömu endapunkta** (same_place) ⇒ `invalid_policy`; stökkbreyting sem skilar same_place fyrir ógilt policy lifir. Kóðinn staðfestir áður en graf er byggt (rétt), en prompt P3 nefnir þetta sérstaklega.
- **OP4 (smáatriði):** directed villur sem koma frá `buildGraph` (mixed_tier, conflicting_identity_geometry o.fl.) og `invalid_mode`/`invalid_policy` bera ekki `mode`/`policyVersion` (engin directed-merking á villum fyrir graf); ásættanlegt, bara skjalfesta.
- **OP5 (utan umfangs):** `api/_lib/winterRoute/approachSelections.test.js` fellur í mínu afriti (1 próf af 322 í allri `winterRoute`-möppunni): `selection_basis` `MAP_PRODUCT_APPROVED_VIA_PROMPT` á 27 stöðum er ekki í EXPECTED-listum prófsins. Skrárnar (`winter-route-places.json`, prófið) eru óbreyttar í þessari lotu (mtime 1794861097…) og prófið er ekki í focused-setti CC, svo þetta tengist ekki #501; mælt með að Ripley/eigandi keyri það á Windows og skrái sem aðskilið mál ef það fellur þar líka.

### 4. Takmörk þessa review

- Ekki keyrt af mér: ESLint, `git status`/`git diff --check`, Windows-vitest — **[CC]**-eignað/óstaðfest. Ég keyrði vitest v3 (CC segir „real npx vitest“ á Windows; tölur stemma).
- Policy er input-samningur: ég sannreyni ekki að `directionBasis` sé sönn heimild. Hringtölurnar sýna **vélfræði**, ekki merkingu VEGHLUTI 5 eða lögmæta akstursstefnu. Engin runtime direction-map til; endpoint/loader/dataset ótengt, svo engin directed notendavirkni afhent.
- #501 ekki lokað; geometry ≠ topology ≠ driving authority; allar niðurstöður `drivingAccess: "UNVERIFIED"`.
- Engin ný umferð opnuð; CF1 + OP1–OP3 gætu verið ein þröng CC-lagfæring ef Ripley/eigandi vilja, annars valfrjálst. Ekki þriðja review-umferð án eiganda.

**Next:** Ripley lokamat (PASS tillaga; CF1/OP1–OP3 að mati Ripley).


## Ripley lokamat — 2026-11-18

**PASS — afmarkaður stefnumiðaður samsetningarkjarni samþykktur.** Jonesy PASS án blockera, samþykkt prompt v1 og P1–P6, útfærsla og sjálfstæð focused staðfesting samræmast. Lesið sérstaklega upfront policy validation, filter-before-ordered-dedup, endpoint lookup yfir allar línur, no_directed_path og höfnun directed reversal. Engin ný framkvæmdar- eða review-umferð nauðsynleg samkvæmt MVP-reglu eiganda.

Sjálfstætt keyrt á Windows í raunverulegu checkout (Vitest 4.1.10): approved focused-settið, 8 skrár / 132 próf PASS; ESLint á geometryComposition.js og geometryComposition.test.js hreint. Að auki approachSelections.test.js: 1 skrá / 50 próf PASS. OP5 endurtekur sig því ekki hér; ekki skráð sem staðfest bilun og engin lagfæring framkvæmd. git diff --check hreint. Git status sýnir áfram ócommittaðar geometry/API/dataset-skrár og workflow-gögn úr þessum og fyrri #501-lotum; untracked skrár sjást ekki í tracked diff. Engin fullyrðing um fullsuite/build/deployment eða sjálfstæða endurkeyrslu á fuzz/mutation Jonesy.

CF1 samþykkt sem óhindrandi textafrávik: detail á óstefndu disconnected_graph segir nú 'given lines/policy' í stað 'given lines'. Því er blanket fullyrðing CC um BYTE-IDENTICAL niðurstöður án mode/policy of víð. Staða/reason og staðfest eldri geometry-ID eru óbreytt; gömlu prófin standast. Þetta lokamat leiðréttir fullyrðinguna án breytingar á keyrslukóða. OP1–OP3 eru valfrjáls prófaauki, ekki blocker; OP4 (villur fyrir graf án directed-merkingar) er skráð takmörkun.

Afmörkun: policy-vélfræði er útfærð, en engar staðfestar runtime-akstursreglur hafa verið afhentar. Dæmareglur eru synthetic / TEST_FIXTURE_HYPOTHETICAL. Niðurstöður sanna ekki lögmæta akstursstefnu; drivingAccess helst UNVERIFIED. Endpoint/UI hafa ekki verið tengd directed mode. Þessi áfangi er CLOSED; GitHub-miði #501 er ekki fullgerður eða lokaður með þessu.

Ripley breytti aðeins workflow/skýrslugögnum í lokamatinu. Engin kóðabreyting, commit, push, deploy eða GitHub-aðgerð.
