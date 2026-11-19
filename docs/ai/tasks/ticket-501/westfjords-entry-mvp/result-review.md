# #501 westfjords-entry-mvp — Jonesy result review — 2026-11-19

Yfirfarið: `cc-report.md`, `map-view.html`, `build-westfjords-region.mjs`, `server_data/westfjords-region-1-60-budardalur.json`, `api/_lib/winterRoute/westfjordsRegionDataset.js` (+ próf, 13), `api/winter-route-geometry.js` (diff gegn Hella-lotunni) og nýju handler-prófin (4). `geometryComposition.js`, `geometryDataset.js`, `raudavatnSelfossMvpPolicy.js`, `raudavatnSelfossNorthOption.js`, `winter-route-places.json` og `winter-route-geometry-pilot.json` eru **byte-eins** og í Hella-lotunni (`cmp` í sandbox). Handler-diffið er ein ný grein (junction-pörun athuguð á undan almenna `KNOWN_PLACE_IDS`-hliðinu) og einn innflutningur.

## Niðurstaða

**PASS — engir blockerar.** Fyrsta Vestfjarðatengingin (vegamót 1/60 ↔ Búðardalur) virkar í báðar áttir, úr bókstaflegum tier-0 hnútum án nokkurrar synthetic tengingar; P1–P7 uppfyllt, P8 virt (ekkert sjónrænt PASS frá mér). Sjálfstæð endurbygging mín á svæðisskránni úr GeoJSON-pakkanum stemmir við skrá CC upp á < 0,00001 m.

## Merking: sandbox vs CC

- **Sandbox (mitt, Linux, vitest, node, pyproj; GeoJSON-pakkinn úr eigin zip):** „Sandbox-staðfesting“ og „Mutation“.
- **CC-fullyrt (Windows, ekki endurkeyrt af mér):** ESLint, `git status`/`git diff --check`, 11 skrár / 200 próf (þ.m.t. winter-route/routes/segments/cache/winterRouteRoutes sem ég keyrði EKKI), vefþjónn á 127.0.0.1:8770.

## Sandbox-staðfesting (mín afrit af skrám CC)

1. **Próf: 153/153 PASS** á sex fókusskrám (handler, region-dataset 13, north-option, policy, composition, dataset) — þar af þrjú region-próf sem lesa hrá-GeoJSON úr `docs/`; ég lagði pakkann á sama slóð og SHA-256 stemmir við skráða gildið (`cab197ad…`).
2. **Raunhandler, bæði áttir:**

| Átt | lengthM | slices | geometryId | IdButur í röð |
|---|---|---|---|---|
| junction → budardalur | 42 155,202847 | 7: `3544,3590,2649,3753,2648,2647,2769` (öll forward) | `742bbdeda4fa…` | 904070037, 905030037, 805030037 |
| budardalur → junction | 42 155,202847 | 7: `2769,2647,2648,3753,2649,3590,3544` (öll reverse) | `559dde16d368…` | 805030037, 905030037, 904070037 |

   Hnitakeðjusumma = `lengthM`, 0 tvítalin brún, fyrsta/síðasta hnit = junction/innskotshnútur, `tier:0`, `crs:EPSG:3057`, `drivingAccess: UNVERIFIED`, `via` `["Brattabrekka","Breiðabólstaður"]`, `lengthNote` segir tier 0, ekkert `mode`/`option`, `accessApproach.ownerCoordinateOffsetM` 160,1476 m utan `lengthM`. Stemmir við mínar P-tölur (42 155,203 / 41 738,857 m).
3. **P1 (vegamót/keðja):** `3544` vertex 0 = endi `2753` = upphaf `3103` bókstaflega; engin synthetic lína í svæðisskránni (nákvæmlega 7 línur, allar VEGHLUTI 1, tier 0); 0 m bil á hverju samskeyti.
4. **P2 (Búðardalur):** valkostur (b). Innskotshnúturinn (370 289,3768; 515 027,0685) liggur á 2769 (fjarlægð 1e-11 m), summa skiptra liða = 487,2678 m = upphaflegur liður, `sourceId`/IdButur óbreytt (5 hnútar í stað 4). Núverandi `budardalur` í `winter-route-places.json` óbreytt (`cmp`); valkostur (a) 41 738,857 m / 6 slices varðveittur í skrá til samanburðar.
5. **P3 (Dalsmynni):** eigandahnit 7 806,5 m frá vegamótum, 3 707 m frá næstu línu; prófið staðfestir `endpoint_not_in_graph` frá hnitinu og að það sé ekki í svæðisgrafinu; Dalsmynni er sér-punktur (`dalsmynni`) sem er aldrei notaður í leiðarreikning. Mutation: Dalsmynni-hnit sett á vegamótin → próf falla.
6. **P4 (tier 0):** **óháð endurbygging mín** (pyproj 4326→3057 á hverjum hnúti úr GeoJSON, 7 línur, alls 182 hnútar) gefur **0,0 m frávik** frá skrá CC; auðkenni/heiti/IdButur stemma við GeoJSON; fjöldi hnúta samsvarar (nema 2769: +1 innskotshnútur). Staðfesting CC gegn pilot-safninu (927 pör, hámark 2,8 mm) stemmir við mínar tölur nákvæmlega. Hringvegarsvörin (Rauðavatn↔Selfoss/Hella, Selfoss↔Hella, veg 93, `same_place`) óbreytt (geometryId `215a1805457e…`, `a8704618cc1a…`, `1e5ec24e068b…`, `e79c0f7e8237…`).
7. **P5 (IdButur):** `idButurIds` aðeins úr sneiðunum; `905070037` og `505870037` ekki í listanum; hvorki `roadConditionIds`, `routes.js` né færðarkall snert.
8. **P6 (API):** 56-listi óbreyttur; junction-auðkennið gildir aðeins pöruð við `budardalur` (hvor röð): `junction+hella`, `junction+selfoss`, `junction+R1`, `junction+junction`, óþekkt auðkenni → áfram 400 `unknown_place_id`; `budardalur` ásamt öðrum stað → áfram `endpoint_mapping_unavailable` (200). Region-skráin er í `server_data/` (pakkast með `includeFiles`), lesin með `process.cwd()`; hvorki lesið úr `docs/` í runtime né nýr dependency.
9. **P7:** óstefnubundið, `drivingAccess: UNVERIFIED`, tier 0 merkt, `via` úr raunverulegum línuheitum; CC skráir að „Miðdalir“ kemur ekki bókstaflega fyrir í gögnunum og notar það ekki (heiðarlegt; þetta er rétt, heitin eru „Breiðabólstaður – Skógstagl“ og „Skógstagl–Búðardalur“).
10. **P8 (kort, sandbox):** `map-view.html`: leið 175 hnit = API (175/175), innan **0,056 m** (6-aukastafa námundun) frá pyproj; J, núverandi hnútur, innskotshnútur og Dalsmynni-punktur stemma við svæðisskrá; Dalsmynni merkt „REJECTED as junction“ og ekki teiknað sem vegur; canonical OSM-slóð, referrer-meta, attribution, 127.0.0.1:8770 (ekki 8765–8769). Ég **opnaði ekki** síðuna.

## Mutation (sandbox, 22 mutantar á handler/loader/svæðisskrá)

**21 drepnir**, m.a.: junction samþykkt með hvaða stað sem er / aðeins ein átt / endapunktur á gamla hnútnum / `idButurIds` ósamþjappað / tillaga `905070037` bætt við / `via` „Miðdalir“ bætt við eða tómt / `lengthNote` tier-2 / `tier` 2 / frávik talið í `lengthM` eða sleppt / `drivingAccess` fjarlægt / pörunarregla færð fyrir aftan `KNOWN_PLACE_IDS` / loader samþykkir tier 2 / innskotshnútur 1 m utan línu / IdButur 2769 breytt í tillöguna / vegamót færð um 2,5 mm / `offsetM` rangt / auka synthetic lína í skránni / 2769 án innskotshnúts / Dalsmynni sett á vegamótin.

**1 lifði:** villuleiðin þar sem svæðisskrá hleðst ekki skilar 500 `geometry_dataset_error` — mutant sem breytir í 200 er ekki fastur af prófi (ekkert próf neyðir hleðsluvillu). Minniháttar; hegðun rétt.

## Athugasemdir (valfrjálsar, ekki blockerar)

- **S1 (P4-frágangur):** Munurinn tier 2 ↔ tier 0 í vegamótunum (2,5 mm, y) er hvergi skráður; skýrsla segir „independently re-derived in native EPSG:3057 (…5872)“ — native tier-2 gildið er …5847. Þetta skiptir ekki máli fyrir þetta par (Hringvegur er ekki hluti af kallinu) en `junction`-færslan tengir ekki hnútinn við Hringvegarhnútinn; kemur við sögu þegar svæðisleið verður tengd við hringleið í einni niðurstöðu.
- **S2 (P8-frágangur):** Kortið sýnir ekki eigandahnit Búðardals (65,110; −21,765) sjálft (aðeins fjarlægðina 160 m í texta og tvo hnúta) og ekki nálægðarvörpun Dalsmynnis á 3544 (7,9 km inn á línuna) sem „hafnað“; ég bað um bæði. Sjónræn atriði eiganda, ekki rangt svar.
- **S3 (z):** `z` innskotshnúts (24,473) er línulega brúað gildi úr nágrannahnútum, ekki heimild — samskonar flokkur og F1 (z á samskeytum); hafa í huga ef hæð verður notuð.
- **S4 (próf-festing):** handler-prófið heitir „pinned endpoints“ en athugar ekki fyrsta/síðasta hnit beint (kjarninn myndi þó skila `unsupported` ef hnútur væri ekki bókstaflegur); engin próf neyðir 500-leiðina (sjá mutation).
- **Planar lengd:** 42,2 km er tier-0 planar EPSG:3057 lengd (`lengthNote`), ekki aksturslengd; `via` „Breiðabólstaður“ er bæjarnafn úr línuheiti, ekki staðfest vegamót.
- Eldri F1/F2 áfram; prófin þrjú sem lesa `docs/ai/.../Vegagerdin-faerdferlar-WGS84.geojson` krefjast þess að pakkinn sé í repo-inu (hann er í `owner-packages-2026-11-19/vegagerdin-ids/`).

## Mörk þessarar yfirferðar

- Ekkert keyrt á Windows-vél eiganda; ESLint/git/eldri próf/vefþjónn eru CC-fullyrt.
- **Ekkert sjónrænt PASS frá mér.** Skoðunaratriði eiganda á `http://127.0.0.1:8770/map-view.html`: (1) vegamótin við Baulan/Norðurá á Hringvegi, (2) Brattabrekka → Breiðabólstaður → Búðardalur án króks, (3) Búðardalur-endi (innskotshnútur 160 m frá hnitinu vs núverandi hnútur 455 m), (4) Dalsmynni-punkturinn (rauður) er ekki vegamótin.
- `drivingAccess: UNVERIFIED`; „tvístefna“ er MVP-forsenda, ekki staðfest; engin ETA/öryggisfullyrðing; ekki turn-by-turn; IdButur-listinn er grunnur fyrir #503, ekki færðartenging.
- Lokar ekki #501: rest Vestfjarða (60/61, Þröskuldar, Innstrandavegur 68, afleggjarar) og staðaþekja bíða.

## Næsta skref

Ripley lokamat. Eigandi opnar kortið og segir Ripley ef eitthvað lítur rangt út (þá blocker, annars má loka áfanganum). Engin umferð 2 af minni hálfu.


## Ripley lokamat — 2026-11-19

**PASS fyrir tæknilega fyrstu Vestfjarðatengingu; sjónræn eigandaafgreiðsla opin.** Jonesy PASS án blockera samþykkt. Sjálfstætt Windows-checkout, Vitest4.1.10:11 skrár/200 próf PASS; ESLint hreint á handler/prófi, svæðisloader/prófi og offline-build; git diff --check hreint. Lesið svæðisloader og afmarkað API-innskot. Engin fullsuite/build eða sjálfstæð pyproj/mutation/brúnagreining endurkeyrð; slíkt eignað Jonesy. Prófin keyra raunverulega adapter/regression-prófun gegn varðveittum pakka.

Tvær áttir1/60↔Búðardalur ~42,155km,7raunbútar, tier0/EPSG3057 og IdButur úr völdum slices. Eigandapunktur/vegaðkoma aðskilin;160,148m offset ekki lengthM. Engin ný synthetic vegtenging. Dalsmynni ekki dulið sem vegamót, kandidat-IDs ekki færðartengingar. Fyrri Hringvegsvinna/places/runtime óbreytt samkvæmt focused regressions og Jonesy byte-samanburði.

S1/S3 skýrt í cc-report viðauka: tier0/tier2 hafa~2,5mm hnitaafbrigði á sömu vegamótum; ekki blandað graf. z innskotshnúts er línulega áætlað. S2 kortauppbót beint: bætti við skýrum fjólubláum Búðardalur-owner-punkti úr CSV svo160m frávik sjáist gagnvart grænni vegaðkomu, án nýrrar veglínu. Hafnað Dalsmynni-nearest projection er enn ekki sérstakur kortapinni; Dalsmynni-vörupunktur er merktur og greinipunktur skýr. Það er óhindrandi framsetningartakmörkun, ekki ný CC-lota. S4/villuleiðarpróf valfrjálst.

TCP-aðgengi127.0.0.1:8770 staðfest; rendered kort ekki skoðað af Ripley hér. Eigandi opnar http://127.0.0.1:8770/map-view.html og skoðar1/60-vegamót, beina Bröttubrekku/Miðdala-keðju að Búðardal og aðkomu vs eigandapunkt. Stage RESULT_REVIEW þar til kortasamþykki, engin ný review-umferð.

#501 enn opið; næst rest Vestfjarðastofns/greina og svæðisþekja.164staða grunnur er gildur, ekki eldri fastur56-listi; ekki telja163staði sjálfkrafa ólokna þegar nokkrir eru þegar studdir. Enginn production-kóði/runtime-gögn, commit, push, deploy eða GitHub-aðgerð af Ripley; aðeins kortaframsetning/skýrslur/workflow.


## Eigandasamþykki og lokun fyrsta Vestfjarðaáfanga — 2026-11-19

Eigandi svaraði „Samþykkt“ eftir tæknilegt PASS og handoff á Búðardalskortið, með1/60-vegamótum, leið að Búðardal og aðgreindum eigandapunkti/vegaðkomu. Kortasamþykki eiganda skráð; ekki fullyrt sjálfstæð sjónræn staðfesting Ripley eða opinber akstursheimild.

**Endanlegt PASS — Hringvegur1/60↔Búðardalur MVP-áfangi CLOSED.** Fyrri sjálfstæð staðfesting11skrár/200próf og lint hreint ásamt samþykki eiganda nægir fyrir samþykkt MVP-umfang. Skráð160m aðkomufrávik er ekki akvegur og er ekki talið í lengthM; engin ný vegtenging eða candidate→færðartenging.

#501 í heild enn ólokið. Framhald Vestfjarðastofns/greina og svæðisþekju byggir á nýju164-staðatöflunni og báðum eigandapökkum. Engin ný lota virkjuð hér; engin kóðabreyting, commit, push, deploy eða GitHub-aðgerð.
