# #486 — Jonesy result review (umferð 1)

Dagsetning: 2026-11-03. Hlutverk: tæknilegur rýnir, útfærði ekkert. Efni: approved-prompt-v1.md (S1–S6) gegn raunkóða CC (24 staged skrár) og cc-report.md.

## Niðurstaða: REVISE

Kóðinn uppfyllir meginhluta S1–S6 og bakendaprófin standast í sandbox. Fjórir gallar (1 HIGH, 2 MED, 1 LOW-MED) brjóta þó beinar kröfur samþykkta prompt-sins og eru allir litlir og afmarkaðir. Enginn þeirra krefst nýrrar dependency, nýs umfangs eða nýrrar rannsóknar.

## Hvað var athugað (merkt eftir uppruna)

**Sandbox (mitt, Linux, vitest 4.1.10 með `unshare -rn`, ENGIN netbeiðni, enginn lykill):**
- Keyrði CC-bakendaprófin: api/winter-route.test.js, 6 skrár í api/_lib/winterRoute/ og openMeteoAuth.test.js — 8 skrár, 80 próf, öll standast.
- Skrifaði 17 sjálfstæð árásarpróf á handler með varðveittu raunsýnunum (legacy-faerd-https.json, legacy-faerdpunktar-https.json) og tilbúnu spásvari; mocked fetch. Öll keyrðu; niðurstöður hér að neðan lýsa hegðun, ekki "pass/fail" prófanna.
- Las allan bakendakóða og WinterRoute.jsx, winterRoutePresentation.js, þýðingaskrá og weatherPresentation.js (frumlestur).

**CC-eignað (ekki endurkeyrt af mér):** full suite 200/200 skrár, 2935/2935 próf; `npm run lint` hreinn; `npm run build` OK; grep í dist/assets án customer-api/OPEN_METEO_API_KEY/gagnaveita.vegagerdin; HEAD óbreyttur 24fa3d31.

**Ekki keyrt af mér (UNKNOWN / NOT TESTED):** React-próf (page/Footer, jsdom), lint, build, git, raunvafri, `vercel dev`, raunverulegt Vercel/Production, aðgengi gagnaveitunnar frá Vercel. Ekkert var keyrt á vél eiganda.

## S1–S6 yfirlit

| Liður | Niðurstaða |
|---|---|
| S1 kóðatafla (14/13/6 kóðar), lokun úr þremur reitum vegur yfir jákvætt, óþekkt (TONN_ALLS, HOLUR_I_VEGI) aldrei gott | Staðfest í kóða og árásarprófi A5/A6 (sandbox) |
| S1 jákvæður stíll aðeins við ferskan útflutning + skráningu | Staðfest fyrir segment-feed (A7). Sjá R1 um punktafeed |
| S2(a) Aths/AthsEn ekki sótt/send | Staðfest: ekkert "Aths" í svari (A1); texti skorinn í 300 stafi, React-texti (A16) |
| S3 TTL 5/15, single-flight, no-store, 30/60 stale, 15 s, redirect:error, 2 MiB streymi | Staðfest í kóða/prófum; stale 10 mín birtist, 31 mín gefur "ótiltækt" (A13). Sjá R3 um birtingu spár |
| S4 sex niðurstöður, 24 nákvæmir UTC-tímar, offset 0, einingar, haversine-röð, null≠0 | Staðfest; röng röð og röng eining gera aðeins viðkomandi punkt ónothæfan (A11), röng lengd/lögun gerir spá ótiltæka (A12). Sjá R4 um merkingar |
| S5 .0-auðkenni, GildirTil aðeins á punktum, 13 föst nöfn, Ölfusá á báðum köflum | Staðfest (A1: tilkynningar á 902030037, 902040037, 901230037). Sjá R2 um tvítekin auðkenni |
| S6 blank/whitespace/undefined lykill → NÚLL beiðnir á spáhýsil, ekkert public-fallback | Staðfest fyrir "   ", "", undefined, "\n\t" (A8); fast hýsill customer-api og gluggi 14:00→13:00 (A9, A10); færð birtist samt |
| Lykill/URL í svari eða annál | Ekki í svari (A1); catch-all annálar aðeins fasta strenginn |

## Gallar (REVISE-skilyrði)

**R1 — HIGH — Punktafeed fellur, en allir kaflar fá grænt „Greiðfært“ án viðvörunar.**
Sandbox A2: þegar faerdpunktar2017_1 bregst (segment-feed í lagi) fá allir 13 kaflar `positiveStyleEligible: true`. `roadMeta.pointsAvailable: false` er sent en WinterRoute.jsx notar það hvergi. Lokanir og vegavinna koma einmitt úr punktafeedinu (þrír kaflar eru með vegavinnu í varðveittu sýni), svo þær hverfa hljóðlaust og notandinn sér grænt. Brýtur „Vantar færslu … er aldrei opið/gott“ og S1 (jákvæður stíll aðeins án óþekkts/vantar-upplýsinga) og „síðast þekkt gögn með villumerkingu“. Tengt: þegar segment-feed fellur en punktafeed lifir (A3) birtist lokun úr punktum sem „closed/active“ í tilkynningalista en kaflaflokkurinn er fastur á `unknown_unclassified` (`!row`-greinin í buildSegmentPayload horfir ekki á tilkynningar).
Lágmarkslausn: (a) `positiveStyleEligible = false` þegar `pointsResult` er ekki ok (og einnig þegar punktafeed vantar DagsKeyrtUt eða er úrelt); (b) UI sýnir sýnilega línu þegar `roadMeta.pointsAvailable === false` („Tilkynningar um lokanir/vegavinnu eru ekki tiltækar – staðfestu hjá Vegagerðinni“, IS/EN); (c) í `!row`-greininni: flokkur = `worstCategory([unknown_unclassified, ...flokkar tilkynninga])`. Próf: punktafeed niðri → enginn jákvæður stíll; segment niðri + lokunartilkynning → `closed`.

**R2 — MED — Tvítekið, mótsagnakennt IDBUTUR í segment-feed endar sem greiðfært.**
Sandbox A15: aukalína fyrir 252090037 með `LOKAD` á eftir upprunalegu `GREIDFAERT` línunni → kaflinn verður `passable` með jákvæðum stíl (fyrsta lína vinnur, sú seinni hunsuð). S5 segir „Ógild/tvítekin mótsagnakennd auðkenni ekki sjálfkrafa greiðfær“; athugasemd í roadFetch.js segir sama en hegðunin er önnur. Auk þess samsvarar `252090037.4` kafla 252090037 vegna `Math.round` (A15) — S5 krefst heiltölugilda, ekki námundunar.
Lágmarkslausn: tvítekin lína með ólíka `AstandYfirbord`/`AstandVidbotaruppl` (eða hvaða tvítekning sem er) merkir kaflann sem tvíræðan → `unknown_unclassified`, enginn jákvæður stíll; `normalizeIdButur` hafnar gildum sem eru ekki heiltölur (`Number.isInteger`) í stað `Math.round`. Próf fyrir bæði.

**R3 — MED — Stale spá er ekki merkt í UI.**
Bakendinn sendir `forecast.stale` og `cacheAgeMs` (A14: 20 mín gömul spá birtist með `stale: true`, og er enn borin fram þótt lykill hafi verið fjarlægður — núll beiðnir, sem S6 krefst, en gögnin eru gömul). WinterRoute.jsx les hvorugt. Prompt: „síðast þekkt gögn með raunaldri og villumerkingu“ (gildir um báðar veitur). Færðarhlutinn hefur þessa línu, spáin ekki.
Lágmarkslausn: lína í spáhlutanum þegar `forecast.stale` („Sýnir síðustu þekktu spá ({minutes} mín. gamla)“, IS/EN) + eitt UI-próf.

**R4 — LOW-MED — Hviður ekki merktar „fyrri klukkustund“.**
S4: „mm = summa fyrri klukkustundar, hviður = hámark fyrri klukkustundar … Þetta skal skýrt á IS/EN.“ Úrkoma er merkt („síðasta klukkustund“), hviður ekki („Hviður“/„Gusts“).
Lágmarkslausn: bæta „(hámark síðustu klukkustundar)“ / „(max of previous hour)“ við hviðumerkingu; hiti/vindur sem augnabliksgildi má vera ómerkt.

## Athugasemdir (ekki skilyrði nema Ripley ákveði annað)

- **N1 — veðurtákn nætur:** WinterRoute.jsx kallar `resolveWeatherPresentation(code, { isDay: true })` fastbundið, svo heiðskírt kl. 02 UTC sýnir sólartákn. weatherPresentation.js hefur `isDaytimeHour` og dag/nótt-tákn. Tengist „núverandi veðurtákn úr kóða“; ég tel þetta réttast að laga um leið (ein lína) en læt Ripley ákveða vægi.
- **N2 — útrunnin lokun:** A4: útrunnin punktalokun á GREIDFAERT-kafla gerir kaflaflokk `closed` („Lokað“) á meðan tilkynningin sjálf segir „útrunnin“. Íhaldssamt og felur ekkert; S5 segir hins vegar „ekki núgildandi“. Ákvörðun Ripley/eiganda: halda (mín skoðun, ásættanlegt) eða aðgreina („Lokun útrunnin – staðfestu“). Ekki skilyrði.
- **N3 — raunvafri ekki yfirfarinn:** Prompt krafðist UI-yfirferðar í raunvafra (sími/skjáborð, lyklaborð, dökkt/ljóst, villustöður). CC gat það ekki og skráði það heiðarlega; jsdom-próf eru hlutaígildi. Ég gerði hana ekki heldur. Eigandi/Ripley ákveða: stutt handvirk yfirferð eða undanþága. Staðan er UNKNOWN.
- **N4 — Helmet-titill:** `<title>` er fastur „… · Eltum Veðrið“ í EN líka. Ég hef ekki séð venju annarra síðna (ekki staged) — UNKNOWN; athuga gegn gildandi vörumerkjareglu CLAUDE.md.
- **N5 — hlutabilun og cache:** Eins og CC flaggaði er hlutabilun einnar færðarveitu cache-uð sem árangur í 5 mín. Ég samþykki þá lestur, en hann gerir R1 (a)–(b) nauðsynlegt.

## Skilyrði fyrir PASS

R1 (a)–(c), R2, R3, R4 með tilheyrandi prófum; N1–N5 samkvæmt ákvörðun Ripley/eiganda. Engin ný dependency, engin breyting á sameiginlegum leiðum.

## Takmörk

Sandbox-athugun með tilbúnum/varðveittum sýnum, ekkert raunnet, enginn lykill. Raunverulegur Vercel-/Production-rekstur, aðgengi Vegagerðarinnar og raunvafrahegðun eru UNKNOWN. Ekki lögfræðiráðgjöf. Engin commit/push/deploy.

## Ripley lokamat — 2026-11-03

**REVISE.** R1–R4 staðfest með kóðalestri: pointsAvailable ekki notað í UI, Math.round/first-wins í roadFetch, stale spá ósýnileg og hviðutímabil vantar. Sjálfstæð markviss keyrsla (handler, roadFetch, WinterRoute UI) stöðvaðist fyrir öll próf vegna EPERM við rename í sandbox-temp; engin próf framkvæmd, ekki kóðafall. Jonesy 80 bakendapróf/árásarpróf og CC full-suite/lint/build haldast þeirra eignaðar niðurstöður.

approved-prompt-v2.md afmarkar viðgerð R1–R4. N1 einfalt núverandi dag/nótt-mynstur, N2 aðgreina útrunna eina lokun frá virkri án græns stíls, N4 tungumálavörumerki; N3 raunvafrayfirferð er áfram krafist úr v1, engin undanþága. N5 cache-útfærsla samþykkt óbreytt með R1-viðvörun. Við R2 er þekkt lokun varðveitt í forgangi þótt tvítekin gögn séu mótsagnakennd, í stað þess að fela hana í unknown.

CURRENT → READY_FOR_CC með v2 samkvæmt REVISE-lífsferli README. Enginn forritskóði breyttur eða provider/lykill notaður. Eigandi → CC „Prompt approved“.


## Jonesy result review — umferð 2 (approved-prompt-v2) — 2026-11-03

### Niðurstaða: REVISE (eitt afmarkað UI/texta-atriði, R5; allt annað stenst)

R1–R4 og N1/N2/N4 eru rétt útfærð í bakenda og birtingu, mælt í sandbox. Eftir stendur lítið atriði þar sem v2 krefst tiltekins texta/tengils sem vantar í UI. Engin ný dependency, engin ný rannsókn.

### Hvað var athugað

**Sandbox (mitt, án nets, án lykils, `unshare -rn`, vitest 4.1.10):**
- Allur v2-bakendi lesinn: roadFetch.js, roadConditionCodes.js, winter-route.js, WinterRoute.jsx, winterRoutePresentation.js, þýðingaskrá, e2e-skrá.
- CC-bakendapróf endurkeyrð úr staged skrám: 8 skrár, **96 próf standast** (var 80).
- Mín árásarpróf (24, handler með varðveittum raunsýnum og tilbúnu spásvari) keyrð aftur, þ.m.t. ný fyrir v2.

**CC-eignað, ekki endurkeyrt af mér:** full suite 201/201 skrár og 2963/2963 próf; lint; build; dist-grep; Playwright e2e (5 próf, 4 skjámyndir sem ég hef ekki séð); StrictMode-athugun í vafra; stakt NorthernLightsCard-flake. Ekki keyrt af mér: React/jsdom-próf, e2e, lint, build, git, vercel dev, Production. Ekkert keyrt á vél eiganda.

### Staðfest í sandbox

- **R1:** punktafeed niðri, tómt, með úreltan DagsKeyrtUt eða ógildan tíma → `pointsFeedUnavailableOrStale: true` og 0 af 13 köflum fá jákvæðan stíl (B5); yfirborðsflokkar eru óbreyttir svo gild gögn hverfa ekki. Segment-feed niðri + virk punktalokun → `closed` (A3/B6; var `unknown_unclassified`).
- **R2:** GREIDFAERT/LOKAD í báðum röðum → `closed`, `ambiguous: true`, enginn jákvæður stíll (B1); mótsögn án lokunar (GREIDFAERT/HALKA) → `unknown_unclassified`, enginn jákvæður stíll (B2a); eins tvítekning → áfram `passable` (B2b); `252090037.4` → hafnað, kafli „ekki tiltækur“ (B3, A15); `"252090037.0"` strengur samþykktur.
- **N2:** útrunnin ein lokun → `hazard_notice`, ekki jákvætt (A4/B4a); útrunnin + virk lokun → `closed` (B4b); útrunnin lokun án GildirTil (óþekktur gildistími) → `closed` (B4c, íhaldssamt, rétt).
- **S6, spá og cache óbreytt:** núll Open-Meteo-beiðnir við blank/undefined lykil, fast customer-hýsill, gluggi 14:00→13:00 (A8–A10), ekkert Aths/lykill í svari (A1).
- **StrictMode (N3-fundur CC):** rökstuðningur CC stenst við lestur: gamli kóðinn hafði `cancelled`-flagg sem cleanup setti, sem hefði hent niðurstöðu einu fetch-beiðninnar undir StrictMode. Nýi kóðinn er með `fetchedRef` eingöngu og ekkert `cancelled`. Góð leiðrétting; ég get ekki staðfest dev-hegðunina sjálfur.

### R5 — LOW-MED — tveggja texta-/tengilatriða úr v2 vantar í UI

1. **N2 (v2):** „Sýna ‚Útrunnin lokunartilkynning — staðfestu hjá Vegagerðinni‘ áberandi.“ Núna fær kafli með útrunna eina lokun gula flokkinn „Aðgát – tilkynning“, og tilkynningin sjálf fær almenna smáa línu „Útrunnin tilkynning – staðfestu hjá Vegagerðinni“ (`winterRouteNoticeExpired`, xs-stafir). Textinn nefnir ekki lokun og er ekki áberandi; ekkert UI-próf er fyrir þessu tilviki. Öryggislega er þetta í lagi (aldrei grænt, ekki „Lokað“, tilkynningin sýnileg), en v2 krefst skýrs orðalags.
2. **R1 (v2):** viðvörun um ótiltækar lokunar-/vegavinnutilkynningar átti að fylgja „tengill á varðveitta opinbera heimild“. Viðvörunin (`winterRoutePointsFeedUnavailable`) er texti án tengils; Vegagerðartengillinn er aðeins neðst í heimildakaflanum.

Lágmarkslausn: (a) í SegmentRow: ef tilkynning hefur `astand === "ALLUR_AKSTUR_BANN"` og `status === "expired"` og kaflaflokkur er ekki `closed`, sýna áberandi línu með nýjum IS/EN-lykli („Útrunnin lokunartilkynning — staðfestu hjá Vegagerðinni“ / „Expired closure notice — confirm with Vegagerðin“); (b) bæta við sama Vegagerðartengli (`VEGAGERDIN_LINKS`) innan R1-viðvörunarinnar; (c) eitt UI-próf fyrir hvort um sig (útrunnin ein lokun vs. útrunnin + virk; viðvörun hefur tengil). Ekki endurskrifa neitt annað.

### Athugasemdir (ekki skilyrði)

- **N6 — stale-served færð og jákvæður stíll:** B7: þegar bæði feed bregðast og 25 mín. gömul cache-gögn eru borin fram (`roadMeta.stale: true`) fá 10 kaflar enn jákvæðan stíl, því útflutningstíminn (29 mín.) er innan 30 mín. markanna. Sýnileg lína „Sýnir síðustu þekktu stöðu (N mín. gömul)“ fylgir. Þetta stenst bókstaf S1/S3 og var eins í umferð 1; ég tel það ásættanlegt, en ef Ripley vill strangara er ein lína (`pointsFeedUnavailableOrStale || roadData.stale`). Ekki skilyrði.
- **N7 — tómt punktafeed:** ef faerdpunktar skilar tómum lista (engar tilkynningar) er DagsKeyrtUt null → viðvörun „tilkynningar ekki tiltækar“ birtist og enginn kafli fær jákvæðan stíl. Íhaldssamt og öruggt; raunsýnið hefur 26 línur, svo ólíklegt. Engin aðgerð.
- **N8 — e2e-umfang (CC-eignað):** lyklaborðspróf notar `.focus()` + ArrowDown, ekki raunverulega Tab-röð, og villustaða (`loadError`) er ekki í vafraprófunum; hlutabilun/stale er það. Raunvafrapassinn notar stubbað gagnaform CC, ekki raunsvar. Þetta er samt raunvafri (Chromium) og uppfyllir N3 í aðalatriðum; ég gerði enga skjámyndayfirferð sjálfur (UNKNOWN).
- **N9 — N1 prófun:** prófin ná til hjálparfalls (kl. 02/14), ég sá ekki próf sem staðfestir að ForecastCard velji nóttar-/dagtákn; vandinn er í einni línu og var yfirfarinn við lestur. Engin aðgerð.
- **N4:** titill fylgir tungumáli (lestur); ekkert próf (v2 leyfði „breytingu/prófi“).

### Skilyrði fyrir PASS

Eingöngu R5 (a)–(c). Eftir það tel ég #486 uppfylla samþykkt skilyrði v1 + v2. Raunverulegur Vercel-/Production-rekstur og aðgengi Vegagerðarinnar eru áfram UNKNOWN, ekki skilyrði.

### Takmörk

Sandbox með varðveittum/tilbúnum sýnum, ekkert raunnet, enginn lykill. Ekki lögfræðiráðgjöf. Engin commit/push/deploy.

## Ripley lokamat — umferð 2, 2026-11-03

**REVISE, eingöngu R5.** Sjálfstæður kóðalestur staðfestir almenna xs-merkingu útrunninnar lokunar og að opinber tengill er aðeins neðst, ekki í punktafeed-viðvörun. R1–R4 samþykkt á grundvelli Jonesy kóðalesturs/96 bakendaprófa/24 árásarprófa og CC skráðra UI/prófa; ekki endurkeyrt hér, engin ný grein breytt. N6–N9 eru ekki lokahindranir; fyrirliggjandi afmarkaðar niðurstöður nægja og engin aukarannsókn. approved-prompt-v3.md afmarkar tvær UI-lagfæringar/próf. CURRENT → READY_FOR_CC. Enginn forritskóði breyttur. Eigandi → CC „Prompt approved“.


## Jonesy result review — umferð 3 (approved-prompt-v3) — 2026-11-03

### Niðurstaða: PASS

R5 (bæði atriðin) er útfært eins og v3 krefst og innan umfangs. Engin ný skilyrði. Þar með uppfyllir #486 samþykkt skilyrði v1 + v2 + v3 að mínu mati, innan þeirra takmarka sem eru talin upp hér að neðan.

### Hvað var athugað

**Sandbox / lestur (mitt, án nets, án lykils):**
- Las breytta kóðann: `SegmentRow` og punktafeed-viðvörun í `src/pages/WinterRoute.jsx`, nýju prófin í `WinterRoute.test.jsx`, e2e-skrána og þýðingaskrána.
- **R5(1):** skilyrðið er `astand === "ALLUR_AKSTUR_BANN" && status === "expired" && segment.category !== "closed"`. Þá birtist sérstök gulbrún, feitletruð lína með nýja lyklinum `winterRouteExpiredClosureNoticeProminent`: „Útrunnin lokunartilkynning — staðfestu hjá Vegagerðinni“ / „Expired closure notice — confirm with Vegagerðin“ (strengir stemma orðrétt við v3). Ef kaflinn er `closed` vegna annarrar uppsprettu helst „Lokað“-merkið núgildandi og útrunna tilkynningin heldur venjulegri línu með útrunnið-merkingu (ekki falin). Ekkert grænt og ekkert „núgildandi Lokað“ úr útrunninni lokun einni (það er backend-flokkunin úr umferð 2, sem ég staðfesti þá með keyrslu).
- **R5(2):** viðvörun um ótiltækt/óstaðfest punktafeed inniheldur nú tengil á `VEGAGERDIN_LINKS[lang]` (sami varðveitti tengill og neðst á síðunni, enginn ný slóð), `target="_blank"` með `rel="noopener noreferrer"`, textinn er núverandi `winterRouteOfficialSourceLinkRoad` á IS/EN.
- Þýðingar: 43 lyklar í IS og 43 í EN, enginn vantar hvorum megin (keyrt með node í sandbox).
- Bakendi óbreyttur: stærðir og mtime allra `api/winter-route*.js` og `api/_lib/winterRoute/*` eru þau sömu og þegar ég yfirfór umferð 2 (96 bakendapróf og 24 árásarpróf mín þar á við áfram). Ég endurkeyrði þau ekki, enda enginn bakendakóði breyttur.

**CC-eignað, ekki endurkeyrt af mér:** `WinterRoute.test.jsx` 15/15 (3 ný próf: ein útrunnin lokun á IS og EN; útrunnin + núgildandi lokun; tengill í viðvörun), endurkeyrt 5×; `npm run lint` hreinn; e2e 6/6 með Chromium og tveimur skjámyndum sem ég hef ekki séð.

**Ekki keyrt af mér (NOT TESTED):** React/jsdom-próf, lint, build, e2e, skjámyndir, git, `vercel dev`, Production. Ekkert var keyrt á vél eiganda.

### Athugasemdir (ekki skilyrði)

- Sértæka línan sýnir ekki upprunalega `Lysing` tilkynningarinnar, aðeins fasta textann. Það er í samræmi við v3 („í stað almennrar smárrar … línu“) og er ásættanlegt.
- Prófin sem snúa að nýja tilvikinu eru UI-próf með tilbúnu API-svari; samspil við raunverulega backend-flokkun er tryggt með prófunum frá umferð 2 en ekki endurprófað saman í einu prófi. Ekki skilyrði.

### Eftirstandandi takmörk (UNKNOWN, ekki skilyrði)

- Raunverulegur Vercel-/Production-rekstur, aðgengi Vegagerðarinnar frá Vercel og raunverulegt Open-Meteo-svar með lykli hafa ekki verið prófuð (réttilega utan umfangs; fyrri RESEARCH GO er ekki staðfestur Production-rekstur).
- Raunvafrayfirferð er CC-eignuð og notar stubbað gagnaform; ég hef ekki séð skjámyndirnar.
- N6–N9 (úr umferð 2) eru samþykktar skráðar athugasemdir samkvæmt Ripley.
- Ekki lögfræðiráðgjöf. Engin commit/push/deploy; Róbert sér um þau.

## Ripley lokamat — umferð 3, 2026-11-03

**PASS.** Lesið CURRENT, CC-viðbót umferð 3 og Jonesy PASS-yfirferð; sjálfstætt kóðalesið SegmentRow, punktafeed-viðvörun, IS/EN-strengi og þrjú ný UI-próf. R5 leyst: útrunnin eina lokun fær sértækan áberandi texta; virk lokun heldur forgangi; opinber tengill er inni í viðvöruninni. Engin ný óleyst samþykkisskilyrði.

Sjálfstæð tilraun til `npx vitest run src/pages/WinterRoute.test.jsx` stöðvaðist fyrir próf vegna sandbox-temp EPERM við rename; núll próf keyrð, engin fullyrðing um sjálfstæða græna keyrslu. CC niðurstöður 15/15 page-próf, lint og 6/6 Chromium-e2e með skjámyndayfirferð eru CC-eignaðar. Jonesy 96 bakendapróf og 24 árásarpróf úr umferð 2 ásamt umferð-3 kóðayfirferð eru Jonesy-eignuð. Eldri full-suite/build úr umferð 2 gilda með skráðri uppruna-/umfangstakmörkun; ekki endurkeyrt hér. Engin ný veitubeiðni/lykill.

#486 samþykkt þróunarafhending: /winter-route, færð/lokanir Rauðavatn–Vík, sex punktaspár og staðbundið tímaval, villa/vöntun/úrelding, IS/EN og fyrirliggjandi raunvafrasönnun. N6–N9 áfram samþykktar skráðar athugasemdir. Raunverulegur Vercel-/Production-rekstur og aðgengi veitna frá Vercel óstaðfest; engin ný birtingarheimild. CURRENT → CLOSED. Engin frekari lagfæring/rannsókn nauðsynleg innan þessa miða. Eigandi sér um commit/push og síðar sérstaklega fyrirskipaða GitHub-lokun. Enginn forritskóði, commit/push/GitHub/deploy í þessu lokamati.
