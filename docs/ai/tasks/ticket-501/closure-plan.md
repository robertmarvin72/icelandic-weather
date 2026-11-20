# Lokunarplan fyrir miða 501

2026-11-20. Tillaga til eiganda eftir samþykkta Tálknafjarðarlotu. Planið heimilar hvorki framkvæmd né frestun samþykktrar staðaþekju. CURRENT helst CLOSED fyrir síðustu lotu.

## Ákvörðunin sem lokapunkturinn byggist á

Mín tillaga er að ljúka #501 sem leiðasamsetningar-MVP með núverandi afhentu leiðagrunni, eftir þrjú afmörkuð skref hér neðar. Viðbótarstaðaþekja úr 164-staða pakkanum verði áfram skýrt verkefni, með nöfnum og tengdum eftirfylgnimiðum þegar eigandi heimilar það. Engin landsþekja eða fullgerð Vestfjarðaþekja verður sögð afhent.

Þetta er **breyting á verkaskiptingu sem eigandi þarf að samþykkja**: samþykkt framhaldsáætlun frá 19. nóvember nær yfir stofnleiðir og greinar samkvæmt eigandakorti. Núverandi gögn eru að mestu afmörkuð pör, ekki allt tengt svæðisnet. Lokun með minni þekju má því ekki réttlæta eingöngu með upprunalegum þrengri issue-texta. Ef eigandi vill alla þá svæðisþekju áfram innan #501 verður miðinn opinn þar til nafngreindur staðalisti er afgreiddur; ekki er hægt að lofa aðeins þremur lotum fyrir þann kost.

## Það sem er þegar afhent

| Hluti | Staða |
| --- | --- |
| Geometry-samsetningarkjarni og API | Til staðar; endurnýtt í samþykktum MVP-lotum |
| Rauðavatn–Selfoss og Rauðavatn–Hella | Stutti/lengi Hringvegsvalkosturinn og báðar áttir afhent í sínum lotum |
| Selfoss–Hella og Egilsstaðir–Seyðisfjörður | Fyrirliggjandi bein pör, vegur 93 án gervihringferðar |
| Vestfirðir | Átta samþykkt pör, talin hér neðar; hvert par sjálfstætt |
| Samsetning milli allra þessara para | Ekki afhent sem almennt tengt net; nákvæm pair-branches ráða nú API |
| UI og lifandi veður/færð | Aðskilin verkefni #502/#503, ekki lokunarvinna þessa plans |

Samþykktu Vestfjarðapörin eru 1/60-vegamót–Búðardalur, Búðardalur–Flókalundur, Flókalundur–Ísafjörður, Ísafjörður–Hólmavík, 1/68-vegamót–Hólmavík, 60/61-vegamót–Hólmavík um Þröskulda, Flókalundur–Patreksfjörður og Patreksfjörður–retained617-aðkoma Tálknafjarðar. Þetta eru átta pör, ekki átta fullgerð landsvæði eða almenn all-pairs virkni.

## Þrjú skref að lokun með tillögðu umfangi

### 1 Festa lokunarumfang og afhendingarsamning

Ein lítil read-only afhendingarlota ber öll átta [lokaskilyrði #501](https://github.com/robertmarvin72/icelandic-weather/issues/501) við núverandi svör/próf og skráir fyrir hvert: uppfyllt með tilvísun, nákvæmur blocker eða eigandaákvörðun. Staðfesta sérstaklega stöðugt leiðarauðkenni/útgáfu, valinn valkost, geometry/slices, ætlaða tengipunkta fyrir #503, same_place á studdum endum, lokun og gamla fasta leiðaflæðið. Geometry-only svar eða græn fyrri próf nægja ekki sjálfkrafa sem sönnun um alla þessa samningsliði.

Afhending: stuttur lokaður listi yfir studda enda/pör/valkosti, nauðsynlegar lagfæringar og skýr tafla eftirfylgni. Gera upp allar 31 raðir Dalir og Vestfirðir í eiganda-CSV sem raun-endapunkt, millistað á geometry, framtíðargrein, gagnagat eða ferjuundanþágu. Staður á línu er ekki sjálfkrafa veljanlegur endi. Önnur svæði úr 164-listanum verða sýnileg eftirfylgni, ekki ný sjálfvirk landslota. Ekki framkvæma viðbótarsvæðisleiðir í þessari lotu.

Lokamark: eigandi hefur samþykkt nákvæmt afhendingarmengi og hvað fer í eftirfylgni. Enginn óljós flokkur „aðrar greinar síðar“ án nafna. Ekki opna nýja GitHub-miða án heimildar.

### 2 Tengja samþykktan grunn og loka sýndum samningsgötum

Ein afmörkuð innleiðingarlota samkvæmt lista úr skrefi 1. Endurnýta núverandi kjarna/gögn og raunveruleg vegamót. Ekki líma saman tilbúin parsvar eða geometryIds: bæjarstubbar geta annars verið tvítaldir. Skeyta við J hjá Hólmavík og við 62/63 hjá Patreksfirði þar sem það á við; samþykktir bæjarendar haldast endar þegar staðurinn sjálfur er áfangastaður.

Festa fyrirfram studd samsett pör í prompti eftir staðbundna data-flow skoðun, með raun-endum og réttum leiðarvalkostum. Lágmarks raunpróf á tengdu Vestfjarðaflæði og endurteknum bæjarstubbum; ekki lofa að allar samsetningar núverandi enda eða tenging inn á Hringvegspilot virki áður en gögnin hafa verið borin saman. Núverandi tier0-Vestfirðir og eldri Hringvegsgögn mega ekki blandast ranglega í eina keyrslu. Ef sú tenging krefst nýrrar gagnavinnslu/arkitektúrs eða umfangs umfram samþykktan lista: stöðva þann hluta og bera einfaldasta val undir eiganda.

Laga aðeins demonstrated blockers úr skrefi 1, þar á meðal skýrt same_place fyrir studda enda og skilgreinda afhendingu til #503 ef það vantar. Engin ný bæjargrein, ný almenn routing-þjónusta, heildararkitektúr eða lifandi færð í þessari lotu.

Lokamark: samþykkt samsett notkun og nauðsynlegir samningsliðir virka, engin tvítalning raunbrúna/óþarfa ferð að bæjarenda sem er ekki áfangastaður; unsupported fyrir það sem er utan samþykkts grunns. Ef listinn passar ekki í eina hóflega MVP-lotu, gefa eiganda nákvæma ástæðu áður en fleiri lotur eru ákveðnar.

### 3 Lokapróf og afhending til 502 og 503

Focused próf fyrir samþykkt pör/valkosti/báðar áttir, 1436/hringlokun, sameiginlega kafla, same_place og gagnagat; skilgreind lokunarhegðun án sjálfvirkrar hjáleiðar, viðeigandi fyrri regressions og sannreynt áframhald gamla fasta flæðisins. Viðbótarpróf aðeins þar sem ný hegðun eða sýnt gat réttlætir þau. Kortaskoðun eiganda á nýjum samsettum leiðum; ekki endurskoða öll þegar samþykkt kort eða hefja mutation/herðingarlykkju.

Afhenda stutt lokamat með tilvísun fyrir hvert issue-skilyrði, endanlega stuðnings-/gatalistanum og leiðarsamningi sem #502/#503 geta notað. Sýna raunverulegar takmarkanir viðkomandi leiðar. Eigandi samþykkir umfang/eftirfylgni og lokamat; síðan eigin commit/push og sérstök heimild til að loka GitHub-miðanum samkvæmt README.

## Takmarkanir sem hverfa ekki við lokun

- Tálknafjarðarleið endar á retained617, um 995 m frá owner-punkti; bæjarframhald er ekki með. Kortasamþykki er ekki heimild til að lýsa því framhaldi fullgerðu.
- Estimated connectors haldast merktar, meðal annars 4,39 m við Patreksfjörð og 5 mm í eldri Búðardals–Flókalundargrunni. Þær verða ekki staðfest WFS-/aksturstenging með því að breyta workflow-stigi.
- Samþykktur Ísafjarðarhringbogafyrirvari, owner-offsets, tier0-planarlengd og UNVERIFIED-aðgengi haldast tengd við þau svör sem þau eiga við.
- Bíldudalur, Reykhólar, Þingeyri, Flateyri, Suðureyri, Bolungarvík, Drangsnes, Norðurfjörður, Látrabjarg/Breiðavík og aðrar óinnleiddar greinar eru ekki afhentar af því að stofngeometry liggur nálægt. Skref 1 afgreiðir þær með nafni; eigandi ákveður hvort þær þurfa að klárast fyrir lokun eða flytjast í eftirfylgni.

## Stöðvunarregla

Eftir skref 1 er engin sjálfvirk viðbót við lokaðan blocker-/stuðningslista. Sýnd ný villa má krefjast minnstu leiðréttingar; valfrjáls nákvæmni, prófaherðing eða ný staðaþekja opnar ekki sjálfkrafa annað prompt. Þrjú skref eru tillaga að afmörkun, ekki tímamat eða fullyrðing um að óúttekin samþætting sé einföld.

Heimildir: lifandi #501 skoðaður 2026-11-20; remaining-mvp-plan.md með eigandauppfærslu 2026-11-19; source-note.md/164-staðaCSV; núverandi api/winter-route-geometry.js og samþykkt lokamöt svæðislotanna. Enginn kóði, vörugögn eða GitHub breytt við þetta plan; engin ný prófakeyrsla.


## Samþykkt eiganda 2026-11-20

Eigandi: „Já, aðskiljum frekari þekju og klárum #501 samkvæmt planinu.“ Tillaga um verkaskiptingu hér að ofan er því samþykkt: frekari staðaþekja flyst í skýra nafngreinda eftirfylgni; staðir falla ekki úr vörumarkmiði. #501 lýkur eftir afmarkaða leiðasamsetningu/samningslagfæringar og lokapróf samkvæmt skrefum1–3. Fyrri texti um ófengið samþykki er söguleg forsenda, ekki opin spurning lengur. Þetta heimilar hvorki GitHub-breytingar né sjálfvirka framkvæmd CC án samþykkts prompts. Fyrsta prompt: closure-scope/prompt-review.md.
