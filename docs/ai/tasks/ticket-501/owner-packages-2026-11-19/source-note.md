# #501 — Eigandapakkar og Vestfjarðasamhengi — 2026-11-19

## Gildandi ákvörðun eiganda

Báðir pakkar lesnir, upprunatafla og Vestfirdir-Hringvegur.png skoðuð. Samtals átta kort eru í project-möppu; önnur svæði ekki tekin til leiðainnleiðingar hér. Leiðbeiningar inni í pakkanum eru heimildarefni, ekki sjálfstæð framkvæmdarheimild. Nýrri fyrirmæli eiganda ráða: hnit töflunnar duga fyrir MVP, engin ný nákvæmnisrannsókn nauðsynleg; Hringvegsvinna endurnýtt, ferjur utan umfangs en akstursleiðir að höfnum mega vera með. Eldri 55/56-staðalisti er EKKI lengur lokað vöruumfang. Runtime-listinn er enn 56 þar til afmörkuð innleiðing uppfærir hann; ekki breyta öllu landinu í einu.

## Samanburður og sjálfstæðar athuganir

- Uppruna-CSV í project og upprunalegt-CSV í ID-pakka eru byte-identical, SHA256 c26e9c60c96be1ecedb3e8692930e4ee82dccddefdef6673a964ac757b6eb638. Þetta er ein 164-staða tafla, ekki tvær misvísandi útgáfur.
- Endurtalið 164 staðir, 708 einstök IdButur, 1.564 GeoJSON-línur og 288 tengitillögur. ID-mengi CSV og geometry eru eins (708); þetta sannar ID-þekju pakkans, ekki leiðarsamfellu.
- 31 færsla í „Dalir og Vestfirðir“, þar af Flatey merkt ferjuundanþágu. 147 staðir með tillögur, 11 án nálægrar línu innan 2km, 2 göngustaðir og 4 ferjustopp eru pakkastöður, ekki staðfestar leiðarkeðjur. IdButur_stadfest er autt á öllum164 röðum.
- Eina sérskráða staðfesta nafnsamsvörunin er Hveragerði–Selfoss 902030037. Hún staðfestir ekki allar aðkomur, röðun geometry eða Vestfjarðakeðju.
- Línur eru EPSG:4326/WGS84 og NAKVAEMNIFERLIS=0 (allar1564). Núverandi geometryComposition tekur aðeins EPSG:3057 og eitt tier í hverju kalli; runtime-pilot hefur 255 línur á tier2. Ný gögn má ekki merkja tier2 eða láta lengdargráður vera metra. Minnsta offline-normalisering/adapter fyrir svæðið þarf að varðveita sourceId/tier/CRS; ekkert þarf að endurvinna Hringveginn vegna þess.
- Núverandi geometry API notar winter-route-places.json sem known-ID allowlist; ný röð í164-staðatöflu verður því ekki runtime-staður sjálfkrafa. Innleiða aðeins staði/greinipunkta næstu svæðislotu, varðveita núverandi stable IDs fyrir sama stað; hnit töflunnar eru gild MVP-vörupunktar, ekki endilega literal-graph-hnútar. Skýr aðkomutenging getur þurft vörupunkt→veg, án þess að kalla hana færðarsönnun.
- roadFetch.js tekur IdButur-lista. Opinbert IdButur er join-lykill færðar, IDFERILL er geometry-piece, OBJECTID hvorki. Fleiri en einn ferill getur tilheyrt sama IdButur; varðveita alla nauðsynlega ferla í réttri röð, dedup aðeins færðar-ID-lista þegar þess þarf.

## Það sem nýtist fyrir Vestfirði

Eigandakort: bleik stofnleið60/61, grænar tengingar68/Þröskuldar61, gular Suðurfjarðaleiðir/afleggjarar, blár Hringvegur, fjólublá ferja (utan akstursnets). Kort er handteiknuð vöruáætlun, ekki nákvæm geometry eða vegkeðjusönnun. Ekki tengja allar CSV-raðir í eina línu.

ID-skráin hefur raunverulega kafla og geometry fyrir m.a. Bröttubrekku60 (904070037, ferlar3544/3590), Miðdali60 (905030037,3753/2649 og805030037,2769/2647/2648), Búðardal–Laugar60 (905070037,3197), Þröskulda61 (907000037,3321/3324), Innstrandaveg68 og stofnleiðir/greinar60/61/62/63. Þetta eru tiltæk gögn, ekki fullyrt samfelld röðuð route.

Fyrsta fyrirhugaða framkvæmd: vegamót Hringvegar/60 → Búðardalur og öfugt; ákvarða raunveruleg vegamót úr geometry, ekki nota nálægasta candidate sem staðfestan greinipunkt. Eigandapunkturinn „Dalsmynni“ er MVP-staður, en hefur enga candidate-línu innan2km (næsta skráð3695m). Það kallar á samhengi réttrar aðkomu, ekki höfnun eigandahnits eða sjálfvirka3,7km beina línu. Síðan stofn60/61,68/Þröskuldar og afleggjarar, í afmörkuðum afhendingum.

## Virkt prompt og næsta handoff

CURRENT er enn Hella hringvalkostir READY_FOR_CC. Samþykkt approved-prompt-v1 þar er EKKI endurskrifað, kóðaumfang hennar er enn Hella. Þessi gögn bæta context fyrir NÆSTU Vestfjarðalotu, ekki aukakröfur við Hella-result-review. westfjords-entry-mvp/next-prompt-draft.md er undirbúningur eingöngu; ekki virkt execution prompt og ekki ný samhliða lota.

Jonesy skal lesa þessa source-note, project/Island-akstursrod-og-GPS.csv og project/Vestfirdir-Hringvegur.png ásamt viðeigandi ID/geometry-gögnum í vegagerdin-ids í prompt-review og result-review Vestfjarðalotunnar. Aðgreina nálægðartillögu frá route-validated identity. Engin candidate→roadConditionIds sjálfvirkni; engin snapshot-færð sett sem lifandi eigind. Engin endurræsing Hringvegar/landsverkefnis.

Enginn production-kóði, runtime-gögn, commit, push, deploy eða GitHub breytt við þessa samantekt. Manifest varðveitir uppruna og archive-hash; engin ný netöflun.


## Verkferlisuppfærsla — 2026-11-19

Hella-lotu lokið með eigandasamþykki. Vestfjarðatengingin nú í PROMPT_REVIEW, sjá westfjords-entry-mvp/prompt-review.md og CURRENT. Eldri lýsing hér á READY_FOR_CC Hella og óvirkum drögum er söguleg, ekki núverandi pointer.
