# #501 — Heimild fyrir akstursstefnu, Round 1 — 2026-11-18

## Markmið og staða

Eigandi sagði „Ok höldum áfram“ eftir PASS directed-composition. Næsta afmarkaða skref er að finna hvort opinber heimild geti staðfest stefnu fyrir núverandi geometry-gögn. Þetta er prompt til Jonesy; ekki framkvæmdarheimild fyrr en approved prompt er til og eigandi segir Prompt approved.

Stefnumiðaði kjarninn er samþykktur. Ekki breyta honum, bæta valfrjálsum prófum eða enduropna CF1/OP1–OP4. Núverandi geometry API er enn óstefnt geometry_only, drivingAccess UNVERIFIED. Engin runtime-akstursregla til. Ekki smíða nýtt kerfi til að komast hjá gagnaskortinum.

## Lesa fyrst

AGENTS.md, CLAUDE.md, docs/ai/README.md og CURRENT.md. Síðan directed-composition/result-review.md (Ripley lokamat), metadata-acquisition/metadata-report.md og result-review.md (JE1–JE3 leiðréttingar ráða), raw-ROAD-REGISTER-SCHEMA.xml, docs/planning/nature-roads-source-2026-10-28/source-note.md og extracted-text.txt. Skoða retained #499/#429 source-notes/schema og geometry-api/contract-note.md aðeins eftir þörfum fyrir source identity.

## Tvær nákvæmar spurningar

1. Er opinber lag-sértæk skilgreining á AKSTURSSTEFNA í gis:vegakerfi_ist120_2024_1, þ.m.t. kóðagildi og afstaða við vertex-röð? Systurlag vegirinatturuislands_2022_1 er vísbending, ekki staðfesting.
2. Er skjalfest tenging þessara fitja/IDKAFLI yfir í faerdferlar2017_1 IDFERILL/IDBUTUR og samsvarandi geometry-átta? Sameiginlegt VEGNR/KAFLANR, nálæg hnit eða eins nafn eitt og sér sanna ekki identity eða orientation.

## Framkvæmd CC eftir samþykki

Byrja á retained heimildum, engin endurkeyrsla eldri acquisition-skrifta. Ef svörin eru þar, nota þau og sleppa netleit. Annars er heimil ein stutt opinber skjalaleit: leita nákvæmu lagsnafni og gagnalýsingu/kóðalista hjá Vegagerðinni eða opinberri lýsigagnaskrá sem vísar á upprunagögnin. Að hámarki tvær leitarfyrirspurnir og opnun tveggja líklegustu heimildaskjala (HTML/PDF). Skrá leitartexta, URL, dagsetningu, hvað var raunverulega lesið og stutta niðurstöðu. Aðgangur ómögulegur eða mörk nást: skila UNKNOWN, ekki leita áfram sjálfvirkt. Ekki senda skilaboð eða fyrirspurn til stofnunar.

Engin WFS/WMS/ArcGIS gagnaköll, GetFeature, ný geometry/metadata-schema öflun, bulk-download eða B2-sókn. Ekki opna innfelldar þjónustur til að prófa gildi. Engin sjálfvirk endurtilraun. Opinber skjöl mega vera stoð fyrir nákvæma næstu tillögu, ekki heimild til runtime-breytingar. Ekki álykta lagaheimild, tímabundna opnun eða aksturshæfi út frá geometry-stefnu.

## Afhending og lágmarkssönnun

Skrifa direction-authority/authority-report.md og cc-report.md. Skýrslan á að vera stutt: tafla fyrir spurningar 1 og 2 (CONFIRMED / PARTIAL / UNKNOWN), nákvæm heimild/staðsetning og hvað hún sannar. Aðgreina bein orð heimildar frá ályktun. Varðveita aðeins nauðsynlegan útdrátt og upprunaslóð; ekki afrita heilu höfundarréttarvörðu skjali í skýrslu. Skrá sérstaklega að staðfest kóðatafla leysir ekki sjálf geometry-orientation/join.

Ljúka með EINNI ráðleggingu: ef bæði atriði staðfest, lýsa minnsta afmarkaða raunprófi á einu þegar varðveittu source-piece (engin framkvæmd hér); annars tilgreina nákvæmlega hvaða heimild vantar og einföldustu leið eiganda til að afla hennar. Ekki setja á stað aðra rannsóknar- eða CC-lotu sjálfvirkt. UNKNOWN er gild og heiðarleg afhending.

Engin runtime policy búin til. Engin breyting á api/, src/, server_data/, config, dependencies eða eldri sönnunargögnum. Aðeins ný lotuskráargögn og nauðsynleg CURRENT-lífsferilsfærsla. Enginn commit/push/deploy/GitHub. Engin app-próf/lint/build nauðsynleg fyrir skjalaleit; staðfesta breytingasvið og git diff --check. Skrá próf ekki keyrð, ekki búa til prófaniðurstöður.

CC staðfestir READY_FOR_CC og approved-prompt pointer áður en byrjað er, setur CC_IN_PROGRESS, síðan CC_COMPLETE með skýrsluslóðum. STOP ef heimildaleit krefst annars umfangs; skila niðurstöðu og tillögu án frekari aðgerða.

## Jonesy yfirferð

Meta hvort þessi afmörkun svari næstu raunverulegu hindrun án nýrrar rannsóknarlykkju. Aðeins sýnd rökvilla, óheimil öflun eða ónothæf afhending er blocker. Ekki gera fulla lögfræðilega akstursstaðfestingu, allt landið eða umfangsmikla harðeningu að skilyrði þessa skrefs.

## Jonesy review — umferð 1 (2026-11-18)

**Verdict: APPROVED. Enginn blocker.** Afmörkunin (retained fyrst, ≤2 leitir/≤2 skjöl, engin gagnaköll, UNKNOWN gild afhending, ein ráðlegging) svarar næstu raunverulegu hindrun án nýrrar rannsóknarlykkju og snertir hvorki kóða né runtime. Fjögur bindandi execution-atriði (P1–P4) sem Ripley getur sett í approved-prompt; þau stækka ekki heildarumfang.

Merking: **[sandbox]** = mitt Python-prototype á retained tier-2 gögnum og lestur á staðfestum skjölum; ekkert net, ekkert keyrt á vél eiganda, engin heimildaleit af minni hálfu, engin breyting í repo.

### Staðfest í sandbox

- **Retained heimildir sem prompt vísar í stemma:** `metadata-report.md` + `result-review.md` (JE1 „A2 UNKNOWN með sterkri vísbendingu“, JE2 28 reitir, JE3 skrifta non-rerunnable), `raw-ROAD-REGISTER-SCHEMA.xml`, nature-roads `source-note.md` og `extracted-text.txt:224–229` (−1 einstefna á móti stefnu línu / 0 óþekkt / 1 með stefnu línu / 2 tvístefna; „direction depends on geometry ordering“). Kóðataflan er fyrir **systurlag** `vegirinatturuislands_2022_1`; engin from/to-tenging í hvorugu laginu; IDVEGUR/IDBUTUR „no provided direct crosswalk“.
- **Spurning 2 er nánast örugglega UNKNOWN:** `vegakerfi_ist120_2024_1` ber `IDKAFLI/VEGNR/KAFLANR`, færð-lagið (`faerdferlar2017_1`) ber `IDFERILL/IDBUTUR`; ekkert retained skjal vörpuð milli þessara nafnarýma. Prompt segir réttilega að sameiginlegt VEGNR/KAFLANR eða nálæg hnit sanni ekki identity. Það er heiðarlegt UNKNOWN sem er væntanleg niðurstaða, ekki mistök.
- **Hversu mikið stefnuspurningin skiptir í núverandi gögnum (20 röðuð pör, 5 mappaðir endapunktar, mínar tölur):** aðeins **8 af 20** pörum snerta stykki með VEGHLUTI 6/7 — öll pörin með Rauðavatn (R1↔Selfoss, R1↔Hella: 3 stykki af tegund 7, ≈28,4 km; R1↔Egilsstaðir, R1↔Seyðisfjörður: 10 stykki af tegund 6/7, ≈13,0 km). **12 af 20** (Selfoss/Hella/Egilsstaðir/Seyðisfjörður sín á milli) snerta ekkert 6/7-stykki. Tier-2 safnið hefur 13 línur af tegund 6 og 13 af tegund 7.
- **Nöfn og teiknistefna á 6/7 stykkjum:** nöfn eins og „Hellisheiði til austurs“ (7: 2117) og „Hellisheiði til vesturs“ (6: 2134), „Fossvellir-Þrengslavegur“ (7) og „Þrengslavegur-Fossvellir“ (6) benda á aðskildar akreinar. 2117 er teiknað til austurs (upphaf 380053,6 → enda 392674,4) og 2134 til vesturs (upphaf 392687,7 → enda 380059,8); enda-/upphafspunktar liggja 7 og 25 m frá hvor öðrum (þ.e. sama svæði og B2-bilið). Þetta er **vísbending í gögnunum, ekki heimild**; ég nota hana ekki til að búa til reglu.
- **Hypothetical stærðargráða (ekki policy, ekki tillaga):** ef 6/7-stykki mættu aldrei fara á móti teiknistefnu, verða 4 pör `no_path` (Selfoss/Hella/Egilsstaðir/Seyðisfjörður → R1) og 2 pör lengjast um 37 m; spegilmynd („aldrei með teiknistefnu“) snýr þessu við. Báðar tilgátur brotna við B1/B2-samskeytin — stefnuregla ein og sér gefur ekki nothæfa stefnumiðaða leið án þess að samskeytamálin séu leyst.

### Bindandi execution-atriði (setja í approved-prompt)

**P1 — Heimildabudget: eitt hopp frá retained slóðinni.** `source-note.md` p1 geymir slóð á gagnaveitu Vegagerðarinnar (`https://www.vegagerdin.is/upplysingar-og-utgafa/gagnaveita-vegagerdarinnar/`). Leyfa að opna **hana sem skjal 1** og eitt tengt lýsingar-/gagnabókarskjal (PDF/HTML) fyrir `vegakerfi_ist120_2024_1` sem skjal 2 — leitir (≤2) aðeins ef retained slóð bregst. Annars gæti skjal 1 verið lendingarsíða sem klárar budgetið án raunverulegrar lýsingar. Skrá fyrir hvert opnað skjal: URL, dagsetning, HTTP-staða, bæti og SHA-256 af móttekinni vistun; halda ekki höfundarréttarvörðu skjali í endurbirtingu (aðeins stutt orðrétt tilvitnun + slóð; vistun á skránni sjálfri er ákvörðun eiganda).

**P2 — Bæta við hlið-spurningu 3 (aðeins skjalaleit, sama budget): hvernig er VEGHLUTI (sér í lagi 6/7) skilgreint fyrir `faerdferlar2017_1` og skjalfestir það stefnu?** Rök: nákvæmlega þetta lag (ekki `vegakerfi_ist120`) hefur raun-sönnunargögnin sem þegar eru í notkun, og 8/20 pörin sem stefna gæti breytt snerta 6/7. Merking: CONFIRMED/PARTIAL/UNKNOWN eins og Q1/Q2; bein orð skjals aðgreind frá ályktun; **engin regla búin til, engin regex á nafn/hlutverk, enginn „til austurs/vesturs“-lestur sem heimild**. Ef Ripley kýs að halda tveimur spurningum: setja þá setningu í lokaráðleggingu að VEGHLUTI-skilgreining sé ósvöruð.

**P3 — Væntingastjórnun í skýrslusniði.** Q2 skal skilað sem UNKNOWN sjálfgefið nema skjal sýni orðrétta tengingu; ekki rökstyðja „PARTIAL“ með nafna-/hnitasamsvörun (prompt bannar það nú þegar — gera það að beinni skýrslureglu). Ráðlegging (ein) þarf auk þess **ákvörðunarprófun**: nefna hvaða ákvörðun gildi úr heimildinni gæti breytt (t.d. ef AKSTURSSTEFNA er 2/0 á öllum köflum á Hringvegi: engin breyting; ef 1/−1 á tilteknum köflum: hvaða 8 pör/13 stykki) — svo ekki sé lagt til GetFeature ef ekkert gildi breytir innleiðingunni. Ef bæði Q1 og Q2 staðfest: „minnsta raunpróf“ á **einu** retained stykki; tillaga frá mér til CC að nefna Hellisheiðar-parið 2117/2134 sem dæmi (aðeins sem dæmi, ekki ákvörðun), því það er í retained gögnum og hefur nöfn sem lýsa stefnu.

**P4 — Hörð stöðvun á tenglum.** Ef skjal/síða vísar á WFS/WMS/ArcGIS REST/`GetCapabilities`/`DescribeFeatureType`/gagnapakka (zip, shapefile, GeoJSON, CSV) er það **ekki skjal**: ekki opna, ekki sækja, ekki prófa. Bara texta- og PDF-lýsingar. Ef eina leiðin að svari er gagnaslóð: skila UNKNOWN og nefna slóðina. Engin sjálfvirk endurtilraun né fylgt tilvísun út fyrir `vegagerdin.is` (eða skjalið sem retained slóð vísar á).

### Athugasemdir (ekki blockerar)

- CURRENT: „Result review“-lína vantar „(not yet created)“ eins og skráð venja; „Approved prompt“ er „(ekki til enn)“ — Ripley lagar við samþykki.
- Skýrslusnið (tafla + ein ráðlegging) er viðeigandi; „UNKNOWN er gild afhending“ er rétt — ég hvet CC ekki til að „finna svar“ umfram heimildir.
- Hugsanlegt framhald (ekki hluti af þessu): ef skjalaleit gefur kóðatöflu fyrir rétta lagið, þarf sérstakt eigandasamþykkt GetFeature á afmarkaðan kafla og offline geometry-samanburð til að ákvarða orientation per stykki; það er önnur lota með eigin review, ekki sjálfvirk.

### Takmörk

Ég gerði enga heimildaleit og engin net-köll; hvort Vegagerðin birtir gagnabók fyrir `vegakerfi_ist120_2024_1` eða lýsingu á VEGHLUTI-kóðum er óstaðfest af mér. Tölurnar hér eru mínar eigin úr varðveittum gögnum og sýna aðeins umfang, ekki rétta akstursstefnu. Engin lögfræðileg ályktun, engin akstursheimild.

**Næst:** Ripley býr til `approved-prompt-v1.md` með P1–P4 → eigandi „Prompt approved“ til CC.
