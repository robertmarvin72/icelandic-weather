# #493 — Endapunktaákvarðanir til eiganda

2026-11-11, Ripley. Tillaga eftir CLOSED/PASS með fyrirvörum á ticket-493-access-points. Eigandi heimilaði gerð ákvörðunartöflu; það er ekki samþykki á valkostunum. Allt hér er PROPOSAL nema áður samþykkt Akureyri C. Engin ný gagnaöflun eða breyting á appi. CURRENT helst CLOSED á fyrri lotu.

## Ráðlögð vöruafmörkun

Frá/Til merkir samanburð á færð og veðri milli skýrra aðkomupunkta staða. Þetta er ekki leiðsögn frá tilteknu heimilisfangi. Notandi velur staðarnafn og sér stutta aðkomulýsingu. Reykjavík þarf einn skiljanlegan staðarvalkost og tengingar sem leyfa bæði hringval; ekki tvö ósamræmd upphafshnit falin undir sama staðarnafni. Veðurpunktaval er aðskilin næsta ákvörðun, ekki sjálfkrafa staðarendapunktur.

## Ákvörðunartafla

| Staður | Valkostir | Tillaga Ripley | Hvað valið þýðir |
| --- | --- | --- | --- |
| Reykjavík | R1: nafngreind aðkoma Reykjavíkur, staðfest í næstu gagnaöflun. R2: annar endi 1436 sem skýrt merkt Rauðavatns-viðmið. R3: borgarkjarni með nýrri vegkeðju. | R1. Velja fyrst vöruregluna; leggja nákvæman punkt og heiti fyrir eiganda eftir gagnaöflun. | Einn Reykjavík-valkostur í UI, skýr aðkomulýsing og báðar hringáttir. Núverandi gögn duga ekki til að festa nákvæman punkt eða tengingu hans við báðar áttir. |
| Egilsstaðir | E1: mót hringvegar og Seyðisfjarðarvegar, 2345 END = 2344 START. E2: endi 2344 á vegi93, um 1,7162 km frá mótunum á tier−1. E3: sérstakur bæjarkjarnapunktur sem þarf ný gögn. | E1 sem staðaraðkoma, með skýrri lýsingu í UI. | Bein geometry-tenging við hringveg og veg93. Valið er aðkomuafmörkun, ekki staðfest akstursheimild eða fullyrðing um miðbæ. |
| Seyðisfjörður | S1: 3409 END = 2894 START, lýst sem kirkjugarðshorni. S2: 2894 END = 2892 START. S3: 2892 END = 2891 START. S4: 2891 END, ferjubryggja. | S2 sem candidate fyrir almenna bæjaraðkomu; staðfesta staðarheiti og aðgengi í næstu gagnaöflun. | Almennur staðarvalkostur Seyðisfjörður miðast við valda aðkomu. Ferjubryggja yrði sérstakur valkostur síðar, ekki sjálfgefið markmið allra ferða til bæjarins. |
| Akureyri | C: 2940 END = 3876 START. | Halda samþykktu C. | Engin ný ákvörðun eða breyting. |

## Samanburður Seyðisfjarðarkosta

Lengdir eru retained planar ISN93-rannsóknarlengdir frá E1, ekki leiðsagnarvegalengdir eða aksturstími. Tier−1 og tier2 eru mismunandi upplausnir sömu retained veggagna; ekki valkostir um tvo vegi. Engin ETA leidd af þessum tölum.

| Valkostur | Native EPSG:3057 (x, y) | Tier−1 km | Tier2 km | Munur frá S2, tier−1 |
| --- | --- | ---: | ---: | ---: |
| S1, kirkjugarðshorn | 732722.8305, 537584.8513 | 25.6094 | 23.5081 | −0.6429 km |
| S2, mót2894/2892 | 732875.6740, 538207.0762 | 26.2523 | 24.1489 | 0 |
| S3, mót2892/2891 | 732743.7570, 538421.6228 | 26.5131 | 24.4007 | +0.2608 km |
| S4, ferjubryggja2891 END | 733080.7436, 538522.4045 | 26.9266 | 24.7525 | +0.6743 km |

S2 er tillaga að vöruafmörkun úr fyrra release-definition-proposal.md, ekki staðreynd um skilgreind bæjarmörk. WGS84, nákvæmt notendaheiti og akstursaðgengi/áttir eru óstaðfest. Að velja S2 heimilar ekki að fylla þau inn með ágiskun.

## Reykjavík: það sem er hægt að velja núna

Ráðlegging R1 festir tilgang en ekki nákvæman landfræðilegan punkt. Báðir retained endar1436 eru óvaldir Rauðavatns-samanburðarpunktar. Þeir eru (365522.0175,402772.7620) END og (367768.9400,401667.0900) START í EPSG:3057; retained piece_cost er 2560.1497 m. Hvorki þeirra er staðfestur Reykjavíkurkjarni. Ekki afleiða lengd í miðbæ eða tvo samfellda aðkomuleggi frá óþekktum sameiginlegum punkti.

Eigandasamþykki R1 þýðir að næsta prompt megi undirbúa nafngreinda aðkomu með retained-first gagnaöflunaráætlun. Það er hvorki samþykki á ónefndri staðsetningu né sjálfstæð net-/hýsingaheimild. Nákvæmur candidate þarf heimild, heiti og skýra vegtengingu áður en hann er festur.

## Staða eftir hugsanlegt samþykki

Ef eigandi samþykkir R1/E1/S2: skrá samþykktu vöruafmörkunina með dagsetningu, en halda R1 exact coordinate PENDING og S2 aðgengi/heiti/WGS84 PENDING. Næsta afmarkaða prompt fer í venjulega Jonesy-yfirferð áður en CC vinnur. Það útlistar nákvæm retained gagnagöt, fyrirhugaða hýsla og leyfileg köll; engin ný netheimild er veitt með þessari töflu. Marklisti72 og 61 NODE_UNDETERMINED leysast ekki með þessum þremur ákvörðunum. #493 áfram opinn.

## Heimildir og takmarkanir

- docs/ai/tasks/ticket-493-access-points/endpoint-candidates-v3.json: native-hnit, sjö veg93-hnútar og samanburðarlengdir.
- docs/ai/tasks/ticket-493-access-points/result-review.md: Jonesy umferð4 og Ripley lokamat, BB1–BB5 takmarkanir validator og opin gagnagöt.
- docs/ai/tasks/ticket-493/release-definition-proposal.md: fyrri R1/E1/S2 vöruafmörkunartillögur.
- docs/ai/tasks/ticket-493/akureyri-endpoint-decision.md: eigandasamþykki C.

Allar nýjar ráðleggingar í þessari töflu eru hönnunartillögur Ripley. Engin ný landfræðileg heimild sótt og engin akstursheimild fullyrt. Production NOT_TESTED.
