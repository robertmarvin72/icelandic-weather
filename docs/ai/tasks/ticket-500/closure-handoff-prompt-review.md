# #500 — Lokaafhending gagna og gagnagata til #501

## Ripley initial prompt — umferð 1, 2026-11-16

Til Jonesy-yfirferðar; ekki framkvæmdarprompt enn. Eigandi samþykkti eina afmarkaða lokafrágangslotu eftir closure-assessment.md. Markmiðið er nothæf afhending núverandi gagna til #501 og skýr ákvörðunargrunnur um lokun #500. Ekki fullgera landsdekkandi leiðastuðning í þessari lotu. Engin sjálfvirk lokun GitHub-miða eða samþykki fyrir minni vörulista.

## Lesa fyrst

- AGENTS.md, CLAUDE.md, docs/ai/README.md og CURRENT.md.
- ticket-500/closure-assessment.md, nationwide-owner-scope.md og remaining-map-selection/result-review.md. nationwide-status.md er söguleg staða, ekki núverandi talning.
- server_data/winter-route-places.json og winter-route-approach-selections.json: gildandi 56-staða listi og valdar aðkomur. 54 með hnit, Keflavík bær/Þórshöfn null; enginn almennur leiðastuðningur staðfestur af þeirri talningu.
- Eftir tilvísunum: ticket-500/places-v1.json, r1-north-connection.json, server_data/winter-route-south-connections.json, winter-route-remaining-coverage.json, winter-route-acquired-geometry.json, winter-route-approach-analysis.json og winter-route-place-evidence.json.
- Varðveitt chain-walks-v4.json/road-links.csv í ticket-493-place-network/samples og 72-raða ticket-493-access-points/place-access-status-v3.csv. Lesa viðeigandi kafla/heimildir eftir þörfum; ekki endurtaka allar fyrri rannsóknir.
- src/lib/winterRouteRoutes.js og api/_lib/winterRoute/routes.js til að greina núverandi föstu leiðirnar frá framtíðarleiðasamsetningu.

## Framkvæmd CC eftir samþykki

1. Staðfesta með litlum staðbundnum samanburði 56 einstök auðkenni/nöfn/röð gegn eigandalistanum, 54/2 hnitastöðu og 50 selection-færslur + fjóra upphaflegu punktana. Engin netköll eða gagnaöflun.
2. Skrifa **docs/ai/tasks/ticket-500/closure-handoff/handoff-to-501.md**. Eitt hnitmiðað afhendingarskjal, ekki nýtt gagnakerfi:
   - Gildandi skrár/hlutverk, schema_version þar sem til er og SHA-256 þeirra gagna sem skjalið vísar á sem afhendingargrunn. Sögulegar rannsóknir skýrt merktar; þær yfirskrifa ekki nýtt punktaval. Tilvísanir repo-relative.
   - Ein 56-raða tafla: place-ID/heiti, punktur valinn eða hnitagat, tilvísun á val/source, tilvísun á varðveitta graph-tengingu/keðju ef hún er til, þekkt tengi-/stefnu-/aðgengisgat og afleiðing fyrir #501. Ekki afrita öll hnit/hrágögn. Heimild vantar => segja nákvæmlega hvað er óstaðfest, ekki álykta að vegur sé ófær eða að engin tenging sé til í raunheimum.
   - Varðveittar keðjur/tengingar sem #501 getur nýtt sem rannsóknar-/gagnagrunn, með gildissviði og takmörkunum. Greina geometry, tengingu við valinn punkt og akstursstefnu. Ekki gera óstaðfestar keðjur routable. Núverandi föstu runtime-leiðirnar tvær standa sjálfstætt og óbreyttar.
   - Sérstaklega sýnileg: Keflavík bær ≠ KEF, tvö hnitagöt; R1-norðurtenging; áður skráð suður-/hring-/Akranes-/Dalvíkur-göt. Varðveita mæld bil og fyrirvara með tilvísun; hvorki ný mæling né ný graph-leit nauðsynleg. Nýtt vörupunktaval eyðir ekki gömlu tengigati sjálfkrafa.
   - 72-raða rannsóknarsafnið varðveitt með núverandi niðurstöðum/tilvísun; 56-staða eigandalistinn er vörugrunnurinn. Eldri krafa um Reykholt/Garðabæ bætir þeim ekki við vöruna. Ekki túlka nöfn utan listans sem nýjar eigandasamþykktar útilokanir.
   - Stutt lokunartafla gagnvart #500 samkvæmt closure-assessment.md: uppfyllt / afhent sem nákvæmt gagnagat / ólokið. Gagnagat verður ekki sjálfkrafa samþykkt frestun. Segja skýrt hvort tæknileg gagnaafhending sé tilbúin og hvaða ákvörðun eigandinn á enn um áhrif gagnagatanna. Ekki lýsa landsþekju eða öllum 56 sem routable.
   - Afmörkun: #501 leiðasamsetning, #502 Frá/Til, #503 veður/færð, #504 heildarprófun. Ekki semja ný framkvæmdarprompt fyrir þá miða.
3. Skrifa **closure-handoff/issue-500-closure-draft.md**: stutt tilbúin tillaga að GitHub-lokaathugasemd með 56-staða umfangi, núverandi stuðningi/götum og tilvísun á handoff. Merkja drög og ákvörðun eiganda eftir. Ekki birta eða breyta GitHub.
4. Skrifa closure-handoff/cc-report.md með raunathugunum, niðurstöðu og takmörkunum; fylgja CURRENT-lífsferli í README.

## Leyfðar breytingar og utan umfangs

Aðeins ný skjöl undir docs/ai/tasks/ticket-500/closure-handoff/ og nauðsynleg CURRENT.md workflow-færsla. Prompt-review saga bætist við af Jonesy/Ripley samkvæmt hlutverkum. Ekki breyta eldri samþykktum promptum, heimildum, vörugögnum, prófum, kóða eða issue-textum. Engin ný dependency, leiðarvél, frontend-import, UI, kortaskoðun, netöflun, nýtt staðaval, commit eða push. Þetta er gagnahandoff; ekkert nýtt UI-entrypoint þarf.

## Samþykktarskilyrði og hófleg sannprófun

- 56-raða taflan nær nákvæmlega yfir samþykktan lista án tvítekninga eða hljóðlausrar fækkunar. Staðfesta töflumengi/talningar, tilvísunarskrár og skráð SHA staðbundið; einföld tímabundin Python/Node-athugun nægir, ekkert nýtt prófakerfi.
- 54 valdir punktar, tvö hnitagöt, staðfestar geometry-heimildir og óstaðfest akstursaðgengi haldast aðgreind. Nákvæmt gagnagat þarf source-tilvísun/skýra lýsingu, ekki almenna EXACT_GAP-stimplun án samhengis.
- #501 getur séð hvað er gildandi, hvað er aðeins sögulegt og hvað má ekki nota sem sönnun um studda leið. Ekki þarf að leysa gagnagötin til að þessi skjalalota fái PASS.
- Eigandamarkmiðið allir 56 helst óbreytt; PASS þessarar lotu er ekki samþykki fyrir útgáfu með minni þekju eða sjálfvirk lokun #500.
- Engar kóðabreytingar: engin þörf á build/lint/fullri test-keyrslu. `git diff --check` og sannprófun ofangreindra staðhæfinga nægir; skoða einnig nýju skrárnar því git diff sýnir ekki untracked innihald. Fyrri 215/215 próf eru fyrra Ripley-lokamati eignuð, ekki sögð endurkeyrð hér.

## STOP

Ef heimildir stangast raunverulega á, skrá nákvæmt ósamræmi og áhrif í handoff/cc-report; ekki lagfæra vörugögn eða endurvekja fyrri valákvarðanir. Ef ómögulegt er að afhenda heiðarlega nothæfan grunn án nýrrar gagnaöflunar eða scope-breytingar, tilgreina einfaldasta nauðsynlega skref og stöðva þann hluta. Gagnagöt sem þegar eru heiðarlega skráð kalla ekki ein og sér á nýja rannsóknarlotu. Þegar handoff og sannprófun standast, stoppa.

Jonesy: meta hvort skjalið geti afhent gögnin heiðarlega og nothæft innan þessa MVP-umfangs. Valfrjáls herðing eða ólokin vinna á #501–#504 er ekki blocker á þessari afhendingu.

## Jonesy review — umferð 1 (2026-11-16)

**Niðurstaða: APPROVED. Engir sýndir blockerar.** Promptið er hóflegt, rétt afmarkað (aðeins ný skjöl, engin gagnabreyting/öflun/kóði) og stenst allar staðreyndastaðhæfingar sem ég gat borið við gögnin. OS1–OS6 hér að neðan eru valfrjálsar og tefja ekki; þær koma í veg fyrir þekktar gildrur í handoff-skjalinu sjálfu. Stage helst PROMPT_REVIEW; Ripley býr til approved-prompt og setur READY_FOR_CC, eigandi segir „Prompt approved“ við CC.

### Sannprófað í sandbox (mitt, aðeins lestur, engin net- eða GitHub-köll)

- `winter-route-places.json`: schema_version 1, 56 færslur, 56 einstök ID; nöfn og röð **bókstaflega jöfn** eigandalistanum í `nationwide-owner-scope.md` (56/56, parsað úr „Lokaður listi“-kaflanum).
- 54 með `coordinates`, aðeins `keflavik` og `thorshofn` null (state `NO_RETAINED_MATCH_CHECKED`); 54 `ACCESS_POINT_SELECTED_ACCESS_UNCONFIRMED`; enginn SUPPORTED/ROUTABLE.
- `winter-route-approach-selections.json`: 50 færslur, allar `SELECTED_PRODUCT_APPROACH` og `EXACT_GAP`; selection_basis 27 MAP_PRODUCT / 11 MAP_RECOMMENDATION / 10 RETAINED_CANDIDATE / 2 MAP_JUNCTION. Fjórir upphaflegu punktarnir (reykjavik-raudavatn, akureyri, egilsstadir, seydisfjordur) hafa enga selection-færslu og hnit þeirra eru bókstaflega jöfn `places-v1.json`. 50 + 4 = 54, 54 + 2 = 56. Talningin í promptinu stemmir.
- Hnit, `selection_basis` og `selectionReference` í places = `wgs84`/`selection_basis` í selections fyrir allar 50 (0 frávik).
- Allar 214 `*Reference`-tilvísanir í places.json leysast (skrá + lykill), 0 týndar. Hvert af 54 völdum stöðum hefur eigin `connectionStatus.reason` (54 ólíkir textar), ekki endurtekinn stimpill.
- Mæld bil og fyrirvarar eru í gögnunum sem promptið vísar á: Hveragerði 34,75 m, Selfoss 30,1 m, Hella 32,63 m, Akranes 2,5 m/21441, Dalvík 3501/innri, Kirkjubæjarklaustur 2409, Höfn 982/3170, Hafnarfjörður 2807. Vík „629 m“ er til staðar en er annars eðlis (OS2).
- Tilvísaðar skrár eru allar til og hafa schema_version nema `chain-walks-v4.json` (promptið segir „þar sem til er“, rétt). Fastar runtime-leiðir eru tvær (`raudavatn-vik`, `raudavatn-borgarnes`) bæði í `src/lib/winterRouteRoutes.js` og `api/_lib/winterRoute/routes.js`.
- 72-raða `place-access-status-v3.csv` er til (72 raðir); `road-links.csv` 250 línur.
- Ekkert ósamræmi milli heimilda fannst sem kallar á STOP-ákvæðið.
- Ég keyrði ekki vitest þessa umferð (engin kóða-/gagnabreyting í promptinu; 215/215 er Ripley-eignað, ekki mitt).

### Athugasemdir (valfrjálsar, ekki blockerar)

**OS1 — 72-raða safnið er ekki yfirmengi 56-staða listans.** Ég bar nöfnin saman: 22 nöfn í 72-röðunum eru ekki í 56 (Garðabær, Reykjanesbær, Vogar, Sandgerði, Garður, Bifröst, Hellissandur, Suðureyri, Flateyri, Hofsós, Reykjahlíð, Laugar, Hrafnagil, Grenivík, Fellabær, Stöðvarfjörður, Breiðdalsvík, Borgarfjörður eystri, Eyrarbakki, Stokkseyri, Reykholt, Laugarás) og 6 nöfn úr 56 finnast ekki bókstaflega í 72 (Keflavík, Keflavíkurflugvöllur (KEF), Reykhólar, Drangsnes, Reykjahlíð (Mývatn), Skaftafell). Handoff á því ekki að segja „56 ⊂ 72“, ekki varpa Reykjanesbær → Keflavík þegjandi og hljóðalaust, og ekki lesa 22 aukanöfnin sem útilokanir. Þar sem 72-taflan er nýtt per stað: aðeins bókstafleg nafnasamsvörun, annars „ekki í 72-röðunum“ eða skýrt merkt varpa (t.d. „Reykjahlíð“ ↔ Reykjahlíð (Mývatn)). Þetta er sama lexía og áður um nöfn og þrönga heimild.

**OS2 — Valinn vörupunktur er ekki sjálfkrafa endi fastrar runtime-leiðar.** Samkvæmt gögnunum sjálfum er valinn Vík-punktur (3849 START) innri samskeyti stykkja 3849/23041 og föst leið (`segments.js`) heldur um 629 m lengra austur; það er **munur á punktum**, ekki mælt samskeytabil eins og 34,75/30,1/32,63 m. Borgarnes valinn punktur er sama hnit og #491 P4/end_borgarnes með fyrirvara um ccw_short/cw_long-grunn. Reykjavík (R1) er upphaf beggja fastra leiða. Handoff ætti að hafa þessi þrjú atriði í „föst leið vs valinn punktur“-reit og hafa 629 m aðgreint frá mældum bilum svo #501 álykti ekki að fasta leiðin „nái“ valda punktinum (sambærileg gildra og KE1 úr suðurlotunni).

**OS3 — SHA-256 eru á bæti vinnutrés og línulok eru ólík.** `winter-route-places.json` (1172 CRLF/1172 línur) og `winter-route-approach-selections.json` (1336/1336) eru CRLF í vinnutrénu hjá eiganda, en `south-connections.json`, `places-v1.json` og `r1-north-connection.json` eru LF. SHA breytist ef git/CI normalíserar línulok eða ef Ripley breytir skrá eftir afhendingu (það gerðist í OQ2). Skrá SHA á bæti á diski við afhendingu, merkja „vinnutré, línulok CRLF/LF“ og „breytist ef skráin breytist“; ekki fullyrða að sama SHA gildi í CI-checkout. Viðmiðunargildi úr minni afstöðu (afrit af tækinu við þessa umferð; CC á að reikna sjálfur): places `ed4adcbd2f53…`, selections `a9dd5e2479cf…`, south-connections `aa0c117c4f12…`, remaining-coverage `98ac823993cf…`, acquired-geometry `8dc9fa9a1261…`, approach-analysis `32cec4f3a8c1…`, place-evidence `3c2be211b3b4…`, places-v1 `b8e08f507c5e…`, r1-north `0a1b8aa46dcc…`, chain-walks-v4 `640efec931a3…`, road-links `bf25ff0f68f0…`, place-access-status-v3 `d0bb7c7c3e4c…`. Stemmi gildin ekki hjá CC er það vísbending um breytingu eða línulokamun, ekki endilega villu.

**OS4 — Keðjureiturinn verður víðast „engin varðveitt keðja“, og það er rétt.** Valdir staðir koma úr: acquisition-raw 25, approach-analysis 14, south-connections 5 (Selfoss, Hella, Hvolsvöllur, Hveragerði, Vík), road-links 4, remaining-coverage 2. Aðeins varðveittu keðjurnar eru raunveruleg graph-gögn: cw_long (R1→Vík, 25 stykki, suðurlotan), ccw_short (#491 Borgarnes) og R1-norðurútdrátturinn að Kjalarnesi (3025). CC á aðeins að skrá keðjutilvísun þar sem IDFERILL/IDBUTUR valda punktsins kemur í raun fyrir í varðveittum skrefum; fyrir hina „engin varðveitt keðja“ án þess að álykta að enginn vegur sé til. Ný graph-leit þarf ekki (promptið segir það þegar).

**OS5 — Notið núverandi JSON-stöðu, ekki sögutexta úr CURRENT/cc-report.** Dæmi: place-evidence cc-report frá 2026-11-15 telur Þórshöfn sem CONFIRMED_AUTHORITY_NO_GEOMETRY_BINDING; `winter-route-place-evidence.json` hefur nú Þórshöfn og Keflavík sem `LEAD_NOT_INDEPENDENTLY_VERIFIED` (í núverandi skrá eru aðeins Skaftafell og Höfn CONFIRMED_AUTHORITY_NO_GEOMETRY_BINDING; talning 2 CONFIRMED / 6 LEAD / 18 NOT_CHECKED / 1 INCONCLUSIVE / 1 BLOCKED / 1 PARTIAL; Hafnarfjörður, Skagaströnd, Hvammstangi og Mosfellsbær eru einnig LEAD, ekki staðfest). Handoff-taflan á að sækja stöðu úr gildandi skrám með forskrift, ekki úr eldri CURRENT-færslum. Topp-`note` í places.json byrjar enn á „Coordinates/approach are null … for places not yet reviewed“ en uppfærslusetningin kemur á eftir; handoff á að byggja á talningu úr gögnunum (54/2), ekki þeim texta.

**OS6 — Smíða töfluna með forskrift, skoða svo textann.** 56 raðir handskrifaðar eru hættulegar (tvítekning/slit á röð). Einföld tímabundin Python/Node-forskrift sem les places.json, selections.json og 72-raða CSV og prentar grind (ID, nafn, valinn/gat, selection_basis, tilvísun, access_status, tilvísanir) er innan „einfaldrar tímabundinnar athugunar“ og krefst ekki nýs prófakerfis; forskriftin þarf ekki að vera í repo (leyfðar breytingar eru aðeins ný skjöl), en niðurstaðan og staðbundnu athuganirnar skulu skráðar í cc-report. Línulok: CURRENT.md er CRLF (776/776); CC haldi þeim óbreyttum (ein fyrri lota breytti í LF og olli ósamræmi). Ný skjöl í `closure-handoff/` mega vera LF.

### Mörk þessarar umsagnar

Ég get ekki staðfest texta eða stöðu GitHub-miða #500–#504 né að drög að lokaathugasemd passi við þann texta; það er CC/Ripley/eiganda. Kortamat Ripley (OSM með myndsýn) er Ripley-heimild sem ég hef ekki endurskoðað; ég staðfesti aðeins gögnin og tilvísanir. Ég keyrði ekkert á Windows-vél eiganda, ekkert git/lint/build, og „Prompt approved“ er eiganda. PASS lotunnar er ekki samþykki fyrir minni þekju og ekki sjálfvirk lokun #500. Fyrir þriðju review-umferð sama verks þarf eiganda-checkpoint samkvæmt README.
