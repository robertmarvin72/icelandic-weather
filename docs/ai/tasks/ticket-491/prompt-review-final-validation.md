# #491 — lokastaðfesting leiðargagna, til Jonesy review

## Ripley — umferð 1, 2026-11-04

Þetta er nýtt afmarkað execution-prompt til yfirferðar, ekki keyrsluheimild. Fyrri gagnayfirferð PASS; B-innleiðing áfram óheimil. Eigandaákvarðanir eru bein fyrirmæli: Rauðavatn eins og núverandi Vík-leið, Borgarnes-aðkoma á Hringvegi og fjórir spápunktar eftir staðfestum köflum, veðurfarslegu mikilvægi og dreifingu.

### Vöruspurning og lokamark

Getum við afhent eina stefnurétta Rauðavatn→Borgarnes-keðju, studdar vegalengdir og fjögur rekjanleg WGS84-spáhnit sem nægja fyrir núverandi 70 km/klst. ETA-nálgun? Skila GO eða BLOCKED fyrir ÞESSI leiðargögn og hætta. GO er ekki staðfest spágæði/öryggi, ekki innleiðingar- eða birtingarheimild.

### Fyrirhugað execution-prompt

Lestu AGENTS.md, CLAUDE.md („Umfang og aukaverkefni“), docs/ai/README.md og CURRENT.md. Endurnýttu ticket-491/evidence-owner-scope-2026-11-04.md með O1–O5-afgreiðslu, owner-scope-result-review.md, geometry-inventory-owner-scope.json og fyrirliggjandi frumskrár/hashar. Endurnýttu #483 gagnasnið, leiðarlengdarharness/úttak, #485 pör native/WGS84 og #491 eldri leiðréttingar. Ekki endurtaka gagnabirgðatalningu, skilmála/HTTPS, veðuráskrift eða fyrri prófanir.

**Framkvæmdarmörk:** Enginn appkóði, backend, DB, UI, ETA-regla eða rekstrarstilling breytt. Gagnaafleiðslur/skýrslur aðeins undir ticket-491/final-validation/. Enginn rannsóknarbiðlari, ný dependency, keyrsla aflögðu biðlaranna, lykill, Open-Meteo-spábeiðni eða samskipti við veitendur. Nota tiltæk stöðluð verkfæri og einnota offline skipanir. Aldrei skálda gögn; ef nauðsynlegur stuðningur næst ekki innan marka, BLOCKED með nákvæmri eftirstöð og hætta án viðgerðarlotu.

**Afmarkaður nýr heimildaaðgangur (tillaga til review):** Aðeins ef varðveitt efni nægir ekki, opinber Vegagerðar-geómetría/staðfræðikort og birt CRS-/stefnuskjöl; opinber staðbundin veðurfróðleiksheimild má styðja punktaval. Fyrir fyrsta kall skrá fastar slóðir, tilgang og hvaða eftirstöð hvert kall leysir. Hámark 8 HTTP-skipti samtals (redirect telur), 16 MiB móttekin svör samtals, 4 MiB hvert, 30 sek. heildartímamörk fyrir hvert kall, 30 mín. heildarvinnugluggi frá fyrsta kalli. Engar sjálfvirkar endurtekningar, HTTP-niðurfærsla, frjáls leit í ótal hnitum eða nýjar gagnaveitur. WFS-fyrirspurnir aðeins afmörkuð auðkenni sem þessi leið notar, ekki landsútdráttur. Að hámarki 4 gagnasvör; afgangur skjala/korta. Ef tól geta ekki haldið þessum einföldu mörkum velja minni/annað staðlað kall eða STOP, ekki byggja quota-/netkerfi. Enginn nýr raunfærðar-/athugana-/spáútdráttur þarf til geometríulokunar. Varðveita aðeins notuð svör með tímum/SHA256 og lykillausum slóðum; ekki vista ramma/tile-safn úr kortasjá. Ef engin ný kall þarf, skrá 0.

1. **Frysta upphaf og enda með rekjanlegri reglu.** Rauðavatn: vestari IDFERILL1436-endi (lat 64.10152894, lon -21.75906405; native E365522.0175 N402772.762), við hring8677, er athugunargrunnur að sama upphafi Vík-keðju; ekki nota annað #485 ETA-zero49926. Staðfesta þetta gegn raunlínu og núverandi kaflaröð, án breytingar á núverandi Vík-kóða. Borgarnes: fyrsta hringtorg á Hringvegi við aðkomu úr suðri, bera saman 2876/2819-endapunkta og 30401. Ef varðveitt 30401 samsvarar reglunni, velja raunverulegan innkomupunkt norðurferðar að hringnum sem enda, ekki fyrsta geymda hringhnút eða reiknaða „miðju“. Ef regla samsvarar ekki staðnum, skrá mótsögn og BLOCKED; ekki leita að öðrum víðum vöruendapunkti sjálfkrafa.
2. **Stefnurétt pieces-keðja:** Úr Rauðavatnsenda um 8677, stefnuhluta1477/54723 og viðeigandi 914020037/903020037, Kjalarnes, göng, Melasveit/Hafnarfjall að skilgreindri aðkomu. Nota raun IDFERILL, full IDBUTUR, VEGNR/tier/VEGHLUTI/KAFLANR, geymda vs akstursstefnu, valda línuhluta og rök fyrir útilokuðum römpum/andstæðri akbraut. 3023→56002→3796 er studd samliggjandi göng-keðja og heiti 2982 „til suðurs“ ásamt öfugri stafrænni stefnu er gagn; ekki halda fram umferðarheimild af því einu ef það nægir ekki. Tengja sérstaka stefnuskjöl/kort ef þarf. Skrá mæld bil og hvers vegna tenging er talin rétt, ekki samræma með ósýndum beinum línum. Hringtorgsbogar þurfa afmarkað inn-/útstig og rétta stefnu. Ekki „stysta leið“ sem staðgengil heimilda eða tvítelja gagnstæð göng.
3. **Lengdir og CRS:** Endurnýta núverandi #483 valaðferð og endurskapa 13 Vík-kaflalengdir sem stýringu áður en nýjar lengdir eru notaðar. Skrá raunmun/orsök námundunar/tier-vals, ekki þvinga tölur eða kalla hráar summur aksturslengdir. Ef stýring stenst ekki, ekki eyða lotu í nýjan lengdarreiknivél; BLOCKED. Reikna valda aksturslínu, hluta kafla við upphaf/enda og uppsafnað kílómetragildi hvers nýs punkts. Birta afmarkað lengdarbil þegar tvíræðni er til staðar, tilgreina hvort hún breyti núverandi ETA-ceil. Bil án studds stefnuvals verður ekki að fullri leið þótt tímagildi væri hið sama.

WGS84: annaðhvort nota afmarkað opinbert WFS-svar með EPSG:4326 og para við sömu IDFERILL/native-hnúta, eða tiltæka staðlaða umvörpun með skjalfestri EPSG:3057-skilgreiningu/axis-order og samanburði við fyrirliggjandi native/WGS84 pör. Engin ný formúlusmíði eða dependency-uppsetning. EPSG9802-404 er ekki heimild. Skrá E/N vs lon/lat og WGS84 í afhendingu sem lat/lon með skýrri merkingu; ekki nota stöðvahnit eða skiluð spáreitshnit sem vegpunkt.
4. **Fjórir punktar:** Velja fjögur raunveruleg vegpunktahnít á staðfestri keðju, utan jarðganga. Tillögusvæði P1 Kjalarnes, P2 utan norðurenda ganga, P3 fyrr á Hafnarfjall-hlutum47042/3756, P4 staðfest Borgarnes-aðkoma. Ekki endurnota síðkomna P3=3757 upphaf. Þessi svæði eru valkandidatar, ekki krafa um að halda óheppilegri dreifingu; ef eitt svæði samræmist ekki eigandaskilyrðum, skrá rökstudda tillögu í stað þess að frysta óstutt staðsetningarval. Bera saman uppsafnaðar vegalengdir og bil frá Rauðavatni, milli punkta og að enda, svo fjórir punktar séu ekki allir á síðasta hluta leiðar. Veðurfarslegt mikilvægi þarf afmarkaða heimild eða skýra staðfræðilega röksemd merktri INFERRED, ekki nýjar vindáhættufullyrðingar. Ef nauðsynlegt valvígi/staðsetning er enn óútkljáð: BLOCKED með nákvæmu vali sem vantar. Samsvarandi forecastHour á tveimur punktum er EKKI galli eitt og sér: staðbundin gildi geta verið ólík. Afleiddur vegpunktur má vera á raunlínu með skjalfestri arc-length/interpolation-reglu; hann er þá DERIVED, ekki mæld veðurstöð eða staðfest samfelld veðurþekja. Heimilt að leggja fram þetta afmarkaða val innan eigandareglunnar, ekki krefjast áður frystra hnitanna.
5. **Færðartenging og lokaútgáfa:** Tengja full IDBUTUR valinnar keðju við varðveitt færðarsýni, skrá 0/1/margar samsvaranir og útgáfu/sýnatíma; vantar gögn er UNKNOWN, ekki greiðfært. Hver spápunktur beri IDFERILL/nearIdButur og stöðu afleiðslu. Skila einni uppfærðri evidence-table-final.md, afmörkuðu route-data-candidate.json (gagnatillaga, ekki appconfig), skýrslu og notuðum heimildum/SHA256/endurkeyranlegum lykillausum skipunum. Engin ný prófasvíta/rannsóknararkitektúr; sjálfstæðar einfaldar sannprófanir á röð/hnitum/lengdum/uppsöfnun og fjórum punktum nægja. Fyrri gögn/yfirferðir óbreytt, vísa í stað þess að yfirskrifa sögu.

**GO:** Fryst upphaf/endir uppfylla reglurnar; samfelld stefnurétt keðja og hlutaval studd; lengdaraðferð/stýring útskýrð; fjögur WGS84 vegpunktahnít með staðfestum uppruna/afleiðslu, kílómetragildum og rökstuddu vali; engin UNKNOWN sem hindrar rétta leiðartengingu/ETA eða skyldubundin eigandaskilyrði. Ekki krefjast veðurspárannsóknar, spáreitsnákvæmni, nýs ársstíðarlíkans eða mælinga á spágæðum. Styðjandi staðfræðilegt val getur verið rökstudd ályktun ef takmörk eru skýr, ekki fullyrt staðfest loftslagsþekja.

**BLOCKED:** Ef nokkurt nauðsynlegt atriði helst óstaðfest, skrá nákvæma heimild/tæknilega eða vöruákvörðun sem vantar og hvaða getu hún hindrar. Hætta innan samþykktra marka; engin sjálfvirk viðgerðarlota/umfangsaukning. Ótengdar athugasemdir fara ekki í nýtt lokaskilyrði.

CC færir CURRENT í CC_IN_PROGRESS, skilar cc-report-final-validation.md sem byrjar „GO“ eða „BLOCKED“ með stuttum rökum og að lokum CURRENT → CC_COMPLETE. Eigandi → Jonesy result-review → Ripley lokamat. Báðar niðurstöður stoppa þar. B verður aðeins sérstakt samþykkt innleiðingarprompt eftir yfirfarin GO-gögn. Engin commit/push/GitHub/deploy/subagents eða production-prófun.

### Review-áhersla

Jonesy yfirfer að endapunkts-/punktaákvarðanir séu framkvæmanlegar, að takmörkuð ný opinber gögn séu nægilega afmörkuð og að þessi lota geti annaðhvort lokað fjórum eftirstöðvum eða skilað einni nákvæmri BLOCKED-niðurstöðu. Ekki breyta henni í nýjan rannsóknarbiðlara eða ótakmarkaða rannsókn. Jonesy verdict: PENDING.

## Jonesy review — umferð 1, 2026-11-04

Hlutverk: tæknilegur rýnir, útfærði ekkert, engin raunveita, enginn lykill, ekkert keyrt á vél eiganda. Stage staðfestur sem PROMPT_REVIEW (CURRENT bendir á þessa skrá, Approved prompt: none) og helst PROMPT_REVIEW. Verdict hér að neðan kemur í stað „PENDING“.

### Verdict: APPROVED með S1–S3 (nauðsynleg, fellanleg án nýrrar rannsóknar) og S4–S5 (LOW)

Uppbygging er rétt: lokað markmið (GO eða BLOCKED og hætta), engin kóðabreyting, talið hámark á nýjum köllum, P3-endurval og stýring á lengdum. Þrír hlutir ráða því hvort lotan getur í raun lokað fjórum eftirstöðvum eða endar í BLOCKED vegna þess að reglur vantar fyrir fram. Ég prófaði framkvæmanleika á varðveittum gögnum, niðurstöður að neðan.

### Hvað var athugað (merkt eftir uppruna)

**Sandbox (mitt, án nets, án lykils, python yfir staged frumskrár; tier 0 allsstaðar):**
- Las prompt, evidence-owner-scope (með O1–O5-afgreiðslu), CURRENT. Eigandaákvarðanir sé ég aðeins í endursögn Ripley (OWNER-REPORTED).
- **Tenging Rauðavatns → Kjalarnes (liður 2):** reyndi tengigraf yfir tier 0 línuhluta 1410010037, 914020037, 903020037 og 903030037 frá vestari enda 1436 að upphafi 3025. Engin tenging finnst með bili ≤ 1,5 m eða ≤ 5 m. Með 50 m vikmörkum og stefnutilgátu H1 (VEGHLUTI 6 ekin í stafrænni stefnu, 1 í báðar áttir) finnst keðja með 16 stykkjum: 1477, 1431, 42243, 49926, 9923, 9925, 9927, 10242, 2796, 10247, 2488, 2532, 30721, 49281, 49285, 3025. Tilgáturnar „7 í stafrænni stefnu“ (H2) og „7 í stafrænni stefnu, 6 öfugt“ (H4) ná ekki að 3025. Bilin á milli stykkja eru 14 fyrir utan eitt núll-bil, frá 2,9 m upp í 41,5 m, samtals um 0,33 km (fyrsta bilið, frá vestari enda 1436 að upphafi 1477, er 38,7 m; hringur 8677 er ekki notaður í stystu keðju). H1 er INFERRED tilgáta, ekki sönnuð umferðarstefna; skráin lýsir VEGHLUTI 1 og 8 sem óskjalfest í #483.
- **Heildarlína leiðar** (keðjan ofan + 3025, 3023, 56002, 3796, 3794, 3802, 3740, 3741, 47042, 3756, 3757, 3758, 2876, 2819, með 27,6 m bili 3796→3794): summa línulengda eftir tier: −1 70,451 km; 0 70,385 km; 1 70,052 km; 2 68,851 km, auk bila um 0,36 km. Til enda 2876 (en ekki 2819) styttist hún um 0,719 km.
- **Færðarsýni:** `legacy-faerd-fresh.json` (2026-10-28) og `legacy-faerd-https.json` (2026-11-02) hafa nákvæmlega eina færðarlínu fyrir hvert IDBUTUR í keðjunni (914020037, 903020037, 903030037, 904690037, 904000037, 904010037, 804020037, 904040037) og einnig 814700037 og 1410010037.
- **Hringtorg (VEGHLUTI 5) á köflum 804020037 og 904040037:** eina varðveitta er 30401; næsta fyrra á leiðinni er 42573 við norðurmunna ganga.
- **Hlutfallsleg staða fjögurra punkta** (aðeins til að meta dreifingu, ekki tillaga): með keðjunni ofan er 3025 upphaf um 23,6 km frá vestari enda 1436, P2 (3796 endi) um 34,4 km, 47042 upphaf um 53,8 km, 3756 endi um 64,4 km, 2819 endi um 70,7 km.
- Vegagerðar WFS-slóðin sem #483 notaði (fastur gagnaveituvefur, `typeName=gis:faerdferlar2017_1`, `CQL_FILTER=IDBUTUR IN (…)`) er varðveitt í `wfs-chain-4326-headers.txt`.

**Ekki athugað af mér (NOT TESTED / UNKNOWN):** texti GitHub-miða; hvort ókeypis staðlað umvörpunartól sé uppsett á vél eiganda; hvort Vegagerðin svari raunverulega nýju kalli; raunheimsstaðsetning punkta; stýring á 13 Vík-lengdum (CC á að endurskapa hana, ég gerði það ekki); appkóði, próf, lint, build, vafri, git, Production, raunveita. Ekkert keyrt á vél eiganda.

### Skilyrði

**S1 — MED–HIGH — liður 2 mótmælir sjálfum sér án fyrirfram skilgreindra bilvikmarka og stefnureglu.**
Prompt segir „skrá mæld bil … ekki samræma með ósýndum beinum línum“ og krefst stefnuréttar keðju. Í varðveittum gögnum er hins vegar **engin** tenging innan 5 m á milli Rauðavatns og Kjalarness; raunbil á samskeytum eru 3–42 m (sjá ofan). CC mun þá annaðhvort lýsa BLOCKED strax eða velja vikmörk sjálfur. Bætið við prompt: (a) forskráð bilreglu, til dæmis „tengja útgang stykkis við næsta inngang stykkis af leyfðum VEGHLUTI innan 50 m ef einstök næsta tenging er til; hvert brúað bil skráð“, (b) stefnutilgátuna sem prófa skal (6 í stafrænni stefnu = norðurátt) og að sýnt sé að aðrar tilgátur nái ekki (mín niðurstaða: H2/H4 ná ekki, H1 nær), merkt INFERRED, (c) hvort lengd brúaðra bila telst með í vegalengd (tillaga: skráð sérstaklega, ekki falin í stykkjasummu), og (d) hvað gerist ef brúun er tvíræð (BLOCKED með nákvæmu bili, ekki val).

**S2 — MED — fyrirfram regla fyrir „námunda upp í klukkustund“ við 70 km.**
Heildarlengd leiðar (68,85–70,45 km eftir tier, auk bila ≈ 0,36 km) liggur beggja vegna 70 km, mörkum einnar klukkustundar við 70 km/klst. Lok við 2876 endi er um 70,0 km (tier 0 með bilum), við 2819 endi um 70,7 km. Valið á endapunkti (0,72 km) og valið á tier hvort fyrir sig geta því breytt spáklukkustund lokapunkts. Prompt biður um „lengdarbil og hvort það breyti ETA-ceil“ en segir ekki hvað það þýðir fyrir GO. Tillaga: tier 0 sem punktmat (eins og Vík-stýringin), bilið birt, og að bil sem spannar klukkustundamörk sé ekki BLOCKED eitt og sér (núverandi ETA er sagt áætlað og Vík notar miðpunkta), heldur skráð með báðum klukkustundagildum. Ef Ripley vill strangari kröfu þarf að tilgreina hana.

**S3 — MED — WGS84-leiðin og nýi heimildaaðgangurinn eru óþarflega opin.**
Prompt gefur tvær leiðir (opinber WFS með EPSG:4326 eða „tiltæk stöðluð umvörpun“) og leyfir auk þess „opinbera staðbundna veðurfróðleiksheimild“. Framkvæmanlegast er ein: eitt WFS-kall með sömu uppbyggingu og varðveitta #483-kallið (fastur vefur og `typeName` ofan, `CQL_FILTER=IDBUTUR IN (903030037,904690037,904000037,904010037,804020037,904040037)`, `srsName=EPSG:4326`, JSON), pöruð við varðveittu native-eiginleikana á IDFERILL og hnútafjölda; 903020037 og 914020037 eru þegar til í WGS84 (#485). Ég veit ekki hvort PROJ er uppsett á vél eiganda og ræð því frá umvörpun sem aðalleið. Fjöldi gagnasvara: 1, hámarkið 8 skipta er óþarflega rúmt (2 duga). Afnema veðurfróðleiks-heimildina: GO-skilgreining prompts leyfir sjálf rökstudda INFERRED staðfræðiröksemd, svo nýr vefur til að styðja punktaval opnar án nauðsynjar á opna leit og hugsanlegt leyfisspursmál. Nýja kallið þarf að vera óyggjandi samþykkt eigandans í „Prompt approved“, ekki aðeins tillaga í yfirferð.

**S4 — LOW — stýring á 13 Vík-lengdum nær aðeins til línusummu og tier-vals.**
Hún stýrir ekki stefnuréttri stykkjakeðju (liður 2) því engin Vík-hliðstæða er til af því tagi. Segið í prompti hvað stýringin vottar (tier 0 línusumma, hringtorg skilin frá) og hvaða vikmörk eru leyfð (ég sá ~0,01 km mun á tier 0 summum og CSV-gildum í tveimur köflum sem ég bar saman, 1436 og 801100037; allar 13 ekki endurskapaðar af mér).

**S5 — LOW — færðartenging: núll ný köll og granularity.**
Bæði varðveitt færðarsýni hafa eina línu fyrir hvert IDBUTUR í keðjunni, svo liður 5 þarf engin ný köll (skrá 0). Taka fram að 904040037 er ein færðarlína fyrir 19,7 km kafla þar sem aðeins um 1,9 km er notaður, og 904690037 ein lína fyrir göng og aðkomustykki; færðarstaða á þeim kafla á ekki við hluta leiðar óbreytt.

### Athugasemdir (ekki skilyrði)

- **N1:** Valreglan fyrir Borgarnes-enda („fyrsta hringtorg á Hringvegi við aðkomu úr suðri“) er prófanleg á varðveittum gögnum ef hún er orðuð sem „fyrsta VEGHLUTI 5 hringtorg á eftir 42573“: aðeins 30401 stenst innan þeirra stykkja. Varðveitta lagið gæti vantað hringtorg; takmörkin þarf að skrá. Innkomupunktur er þá endi 2819 (1,77 m frá punkti hringsins).
- **N2:** Hlutfallsleg staða punkta (23,6 / 34,4 / 53,8–64,4 / 70,7 km) sýnir að P3 á 47042/3756 lagar dreifinguna sem ég benti á í síðustu yfirferð; fyrsti punktur er um þriðjungur leiðar og ekkert er á fyrstu 23 km (þéttbýli). Vík-leiðin hafði fyrsta punkt á svipuðum stað. Eigandi/Ripley ráða.
- **N3:** Ef keðjan fer um 49926 sem millistykki breytir það engu fyrir regluna „ekki nota 49926 sem ETA-núll“; það er stykki á leiðinni, ekki upphaf.
- **N4:** #489 og #490 production PASS og lokun þeirra eru frá Ripley/eiganda og ekki staðfest af mér. Production fyrir #491 er NOT_TESTED. Ekki lögfræðiráðgjöf.

### Næst

Ripley fellir inn S1–S3 (og helst S4–S5) og býr til approved prompt; eigandi samþykkir nýja kallið skriflega í „Prompt approved“. Stage helst PROMPT_REVIEW þar til hann hefur breyst í READY_FOR_CC. Róbert sér um commit.

## Ripley — afgreiðsla samþykkis, 2026-11-04

S1–S5 felld inn í approved-prompt-v2.md. 50m er gagnatengileit, ekki nákvæmnis-/akstursvottun; H1 INFERRED, skyldubundin stefna/tvíræðni óleyst => BLOCKED. Tier0+bil punktmat og ETA-mörk skráð en eitt klukkustundamark ekki sjálfvirk hindrun. Ný netheimild þrengd í eina WFS-beiðni/2 skipti með sama HTTPS-hýsli, 4MiB hvert, ekkert annað. 13 Vík-stýring skilgreind með 0,02km sýndri námundun, ekki stefnusönnun. Færðarkornastærð skráð. READY_FOR_CC; engin eigin keyrsla/kall/appbreyting. Eigandi → CC „Prompt approved“ heimilar þá afmörkuðu WFS-beiðni, ekki innleiðingu.
