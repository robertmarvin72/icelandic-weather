# #501 ring-options-mvp — Jonesy result review — 2026-11-19

Yfirfarið: `cc-report.md`, `map-view.html`, `api/winter-route-geometry.js` (+ próf, 37), nýja `api/_lib/winterRoute/raudavatnSelfossNorthOption.js` (+ próf, 9). `raudavatnSelfossMvpPolicy.js`/`.test.js`, `geometryComposition.js`, `geometryDataset.js` og `winter-route-geometry-pilot.json` eru **byte-eins** og í Hella-lotunni (staðfest með `cmp` í sandbox).

## Niðurstaða

**PASS — engir blockerar.** `option=south|north` virkar fyrir Rauðavatn↔Selfoss í báðar áttir; P1–P6 uppfyllt, P7 virt (ekkert sjónrænt PASS frá mér). Norðurleiðin er raunveruleg hringleið (um 1 236 km), ekki falskt „norður“ um Selfoss.

## Merking: sandbox vs CC

- **Sandbox (mitt, Linux, vitest, node, pyproj):** allt undir „Sandbox-staðfesting“ og „Mutation“.
- **CC-fullyrt (Windows, ekki endurkeyrt af mér):** ESLint, `git status`/`git diff --check`, 10 skrár / 176 próf (þ.m.t. eldri winter-route/routes/segments/cache próf sem ég keyrði EKKI), vefþjónn á 127.0.0.1:8768.

## Sandbox-staðfesting (raunhandler, mín afrit af skrám CC)

1. **Próf: 129/129 PASS** (handler 37, north-option 9, policy 18, composition 54, dataset 11).
2. **Fjögur tilvik, raunhandler** (endar pinnaðir, hnitakeðjusumma = `lengthM`, **0 edge-stigs tvítalning** í öllum, jafnt same-direction og reverse):

| Tilvik | lengthM | slices | geometryId |
|---|---|---|---|
| R1→Selfoss south (sjálfgefið) | 44 984,770378 | 11 | `215a1805457e…` (óbreytt) |
| R1→Selfoss north | 1 236 038,322210 | 206 | `d0e0996e7500…` |
| Selfoss→R1 south (sjálfgefið) | 45 101,809503 | 9 | `d657c07e5602…` |
| Selfoss→R1 north | 1 236 223,992067 | 208 | `323c5b6f4a97…` |

   Allt stemmir við mínar P-tölur frá prompt-yfirferð (leggir R1→E1 615 370,845; E1→Selfoss 620 667,478; Selfoss→E1 620 678,896; E1→R1 með samskeytum 615 545,096).
3. **P1 (falskt norður):** án samskeytanna fer E1→R1 suðurleiðina 665 769 m (staðfest bæði af mér og í prófi); með þeim er hún 615 545 m. Engar 2138/2135/36807 í norðurleggjum nema sameiginleg Selfoss-aðkoma. `E1` kemur einu sinni í hnitaröðina (vísitala 251 af 494), engin samliggjandi tvöföld hnit við leggjasamskeytin.
4. **P2 (samskeyti):** nákvæmlega tvö estimated einstefnusamskeyti, `-2` = 9924 endi → 49926 endi (11,025 m) og `-3` = 49926 upphaf → 42244 upphaf (2,344 m), bæði < 45 m, hvort notað einu sinni, `estimatedConnectorLengthM` = 13,369178 á Selfoss→R1 north (0 á R1→Selfoss north), `estimated:true` á þeim. Hnit þeirra stemma við pyproj og við kortið á 6 aukastöfum.
5. **P3:** suðurinntak/`policyVersion` `raudavatn-selfoss-mvp-v1-a73f8191242a0938`/geometryId óbreytt; norður hefur eigin `raudavatn-selfoss-north-v1-…` (mutation: að bæta norðursamskeytum í sameiginlega suðurpolicy fellir próf).
6. **P4 (Akureyri):** nákvæmlega ein öfug hringbrún, sourceId 32964 [3→0] reverse = **36,25017 m**, aðeins á Selfoss→R1 north; 33604 aldrei notað; skráð, ekki lagað; prófið festir bæði lengdina og að 33604-hnit = 32964 vertex 1/2. R1→Selfoss north: 0 öfugar hringbrúnir.
7. **P5 (API):** `option=east`, `option=""`, `option=NORTH`, `option=[south,north]` → 400 `{error:"invalid_option", field:"option"}` (gildi aldrei endurspeglað). Rauðavatn↔Hella: óbreytt south-only svar, **enginn** `selectedOption`/`options`, `option=north` hunsað. Selfoss↔Hella (35 646,177 m, `1e5ec24e068b…`), Egilsstaðir↔Seyðisfjörður (24 148,861 m) og `same_place` óbreytt; `option=bogus` á óskyldu pari hunsað (200). Sjálfgefið val = styttra raunmælt (ekki harðkóðað). `routeId` einstakt per valkost og átt og stöðugt við endurtekin köll (`…north-d0e0996e7500b868`, `…north-323c5b6f4a97b6a7`, `…south-215a1805457eb42a`, `…south-d657c07e56020a36`); aðeins valin geometry í svari.
8. **P6 (via):** north = Borgarnes, Akureyri, Egilsstaðir, Vík (úr raunverulegum línuheitum í slices); south = `[]`. Engin staðarmiðju-pinna.
9. **Kort (sandbox):** `map-view.html` — fjögur lög (south/north × átt): fjöldi hnita og `lengthM` stemma við API (34/494/38/487) og öll hnit við pyproj EPSG:3057→4326 innan **0,056 m** (þ.e. námundun í 6 aukastafi, ~0,11 m/gráðubil); E1/R1/Selfoss-merki, bæði Hádegismóa-samskeyti og Akureyri-undirbútur/33604-hringur stemma við gagnasafn; tile.openstreetmap.org canonical, referrer-meta, attribution, 127.0.0.1:8768. Ég **opnaði ekki** síðuna og sá ekki rendered kort.

## Mutation (sandbox, 29 mutantar á north-option/handler/policy)

**19 drepnir** (m.a. norðurreglur `both`, samskeyti sleppt/auðkenni samhljóða, hnit samskeyta færð um 1 m, sjálfgefið val öfugt, hvaða strengur sem er sem `option`, röð leggja víxluð, lengd aðeins leggur 1, via tómt/vantar Vík, `estimated` aðeins á −1/−2, routeId án geometryId, Hella bætt í ring-pör, norður án samskeyta, val valkosts víxlað, `estimatedConnectorLengthM`=0, norðursamskeyti í sameiginlega suðurpolicy).

**10 lifðu:**

- *Jafngildir/ónothæfir á raungögnum (5):* fylkisgildi `option` (seinni skilyrðið í sama tékki fellir það samt, svo 400 helst); sjálfgefið alltaf south (south er alltaf styttra á þessu pari); via-mutant sem virkar aðeins á > 20 slices (norður finnur öll fjögur samt); `policyVersion`-forskeyti norður = south (hash-hlutinn er samt ólíkur); fyrsti „connector A“-mutant (auka-spur, ónotaður) — endurgerður sem 1 m færsla og þá **drepinn**.
- *Raunverulegar, minniháttar festingareyður (5; hegðun rétt í sandbox):* (a) `policyVersion` norðurs hefur ekki hnit samskeyta í hash (sama og F2 úr fyrri lotum); (b)–(c) norður-geometryId er `sha256(leg1|leg2)` — mutant sem notar aðeins leggur 1 eða 2 er áfram einstakur per átt/valkost og er því ekki fastur af prófi; (d) forskeyti `routeId` („north-/south-“) fast aðeins óbeint (einstök per valkost, en ekki orðrétt prófað á north); (e) `via` á south er ekki fest sem `[]` (mutant sem bætir Borgarnes við south lifir).

## Athugasemdir (valfrjálsar, ekki blockerar)

- **S1 (skýrsla):** CC skráir sourceId 2791 og 2532 sem tvítekin í ósamliggjandi slices; ég sé einnig **2489** (Kjalarnes, VEGHLUTI 5, hringtorg) tvisvar á R1→Selfoss north (slices 21–22, `4→5` og `0→2`, samliggjandi í röð yfir hringlokun). Sama fjölskylda og 2791; 0 edge-stigs tvítalning í öllum fjórum tilvikum. Skýrsluna vantar 2489 — orðalag, ekki hegðun. P1-orðalag mitt „enginn sourceId tvisvar“ er réttilega mildað í „engin brún tvisvar“.
- **F1 (áfram):** `z:null` við samskeytahnit (2 á Selfoss→R1 north), eins og í fyrri lotum.
- **F2 (áfram):** policyVersion/hnit-samskeyta-eyðan, sjá mutation (a).
- **Planar lengd:** 1 236 km er tier-2 planar EPSG:3057 lengd, ekki akstursvegalengd; svarið merkir það (`lengthNote`).
- **Óprófað af mér sem sérstakt tilvik:** `status:"unsupported"`-greinin með `options` (lesin í kóða, ekki framkölluð með raungögnum).

## Mörk þessarar yfirferðar

- Ekkert keyrt á Windows-vél eiganda; ESLint/git/eldri próf/vefþjónn eru CC-fullyrt.
- **Ekkert sjónrænt PASS frá mér.** Skoðunaratriði eiganda á `http://127.0.0.1:8768/map-view.html`: (1) Hádegismóa-samskeytin tvö (grænt strikað) líti eðlilega út, (2) Akureyri 36 m undirbútur/hringtorg 33604 (fjólublátt) sé þar sem búist var við, (3) E1-hnúturinn (2344/2345/2814, 65,2586°N 14,3903°V) sé tengipunkturinn en ekki bæjarmiðja, (4) heildarmynd norðurboga: suðurströnd → Vík → Austurland → Norðurland → Vesturland → Reykjavík, ekki krókur um Selfoss.
- `drivingAccess: UNVERIFIED`, `OWNER_APPROVED_MVP_ASSUMPTION`; engin opinber staðfesting; ekki turn-by-turn; samskeytin eru estimated.
- Nær ekki til Hellu-hringvalkosta, Vestfjarða né uppgjörs allra staða (halda áfram í remaining-mvp-plan.md). Lokar ekki #501.

## Næsta skref

Ripley lokamat. Eigandi opnar kortið og segir Ripley ef eitthvað lítur rangt út (þá blocker, annars má loka áfanganum). Engin umferð 2 af minni hálfu.


## Ripley lokamat — 2026-11-19

**PASS fyrir tæknilega hringvalkosta-MVP-útfærslu; sjónræn afgreiðsla eiganda opin.** Jonesy PASS án blockera samþykkt. Sjálfstætt Windows-checkout, Vitest 4.1.10: 10 skrár / 176 próf PASS; ESLint hreint á handler/prófi og north-option/prófi; git diff --check hreint. Lesið option-paraval/validation, sjálfgefið lengdarsamanburðarval, samsetningu tveggja raunleggja, aðskilið north policy/hash/samskeyti og svarslýsingu. Engin fullsuite/build eða sjálfstæð mutation/pyproj/brúnaúttekt endurkeyrð; þær niðurstöður eignaðar Jonesy.

Fjögur raunferlatilvik standa: south ~44,985/45,102 km óbreytt, north ~1 236,038/1 236,224 km tier-2 planar (ekki nákvæm akstursvegalengd). Norðurboginn er raunverulegur norður-/austur-/suðurstrandarferill, ekki falsa suðurleiðar-endurtekning samkvæmt prófum og Jonesy-úttekt. Tvö estimated Hádegismóa-samskeyti, 11,025m og 2,344m, aðgreind frá suðurinntaki. Hella/veg93/óskyld pör varðveitt.

P1 formfrávik samþykkt með rökum Jonesy: sama sourceId má eiga aðskildar slices yfir hringlokun/staðbundna tengingu; engin endurtekin raunbrún er rétta viðmiðið. CC-skýrsla bætt með 2489 sem vantaði í lista; ekki engine-lagfæring. F1/F2 og önnur óhindrandi prófafestingaratriði opna ekki nýja lotu. Akureyri ~36,25m hringstefnufrávik er skráð MVP-takmörkun samkvæmt approved P4, ekki staðfest sem rétt/lögleg eða skaðlaus akstursleið.

TCP-aðgengi 127.0.0.1:8768 staðfest; rendered kort ekki skoðað af Ripley í þessu lokamati. Eigandi opnar http://127.0.0.1:8768/map-view.html: heildarboga north, Hádegismóa-tengingar tvær, Akureyri 33604/32964-undirbút og E1-skeytingu. CURRENT helst RESULT_REVIEW þar til kortasamþykki kemur; engin ný CC-umferð. #501 ólokið: Hellu-hringvalkostir, Vestfirðir, staðaþekja og sameiginlegt lokauppgjör áfram í planinu.

Ripley breytti aðeins workflow/skýrslum. Enginn kóði, commit, push, deploy eða GitHub-aðgerð.


## Eigandasamþykki og lokun hringvalkostaáfanga — 2026-11-19

Eigandi svaraði „Samþykkt“ eftir tæknilegt PASS og handoff á hringvalkostakortið, þar sem tvær estimated Hádegismóa-tengingar og ~36,25m Akureyri-stefnufrávik voru sérstaklega nefnd. Kortasamþykki eiganda skráð; ekki fullyrt sjálfstæð sjónræn staðfesting Ripley eða opinber akstursheimild.

**Endanlegt PASS — Rauðavatn↔Selfoss hringvalkosta-MVP-áfangi CLOSED.** South/north í báðar ferðastefnur afgreitt með fyrra sjálfstæðu tæknilegu PASS (10 skrár / 176 próf, lint hreint) og samþykki eiganda. Skráðar MVP-forsendur, estimated samskeyti og Akureyri-undantekning haldast sýnileg og óbreytt. Engin ný framkvæmdar- eða review-umferð.

#501 í heild enn ólokið. Hellu-hringvalkostir, Vestfirðir, staðaþekja og sameiginlegt lokauppgjör halda sér í remaining-mvp-plan.md. Engin kóðabreyting, commit, push, deploy eða GitHub-aðgerð.
