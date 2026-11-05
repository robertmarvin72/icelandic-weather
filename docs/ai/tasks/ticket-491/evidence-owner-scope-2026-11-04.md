# #491 — uppfærð gagnatafla til Jonesy review

Dagsetning 2026-11-04. **Niðurstaða: BLOCKED fyrir innleiðingu.** Ný eigandaafmörkun samþykkt og skráð; eldri hindrun „engin eigandaákvörðun um Reykjavík-upphaf eða punktafjölda“ á ekki lengur við. Eftirstöðvar hér eru tæknileg staðfesting, ekki krafa um endurtekið eigandasamþykki.

## Afmörkun eiganda

Upphaf Rauðavatn, sami upphafspunktur og núverandi Rauðavatn–Vík. Endir aðkoma að Borgarnesi á Hringvegi, nákvæm hnit staðfesta. Markmið fjórir spápunktar valdir af staðfestum vegköflum, veðurfarslegu mikilvægi og dreifingu. Aðeins gagnastaðfesting; enginn forritskóði, engin B-innleiðing. Ekki ný almenn leiðarvél eða rannsóknarbiðlari.

## Gögn og eigin sannprófun Ripley

Endurlesin UTF-8-geómetría, einnota staðlaður Python-útreikningur, engin ný veitubeiðni eða dependency. Heimildamælingar eru ekki framtíðarfærð eða trygging um akstur.

| Heimild | SHA256 | Notkun |
|---|---|---|
| ticket-483/samples/wfs-vegnr1-all.json | 305f60d6f1f17918c058cbd047735681e56d6f9aad99f9e16f50de9419d6983a | IDFERILL/IDBUTUR, tier0, EPSG:3057 E/N, línuhlutalengdir |
| ticket-483/samples/wfs-chain-4326.json | 966848554f0ce205c919625c3e6209da1fe05bcc50e7e8084ae96840ad519af4 | Rauðavatns-línuendapunktar í WGS84 |
| ticket-485/samples/wfs-extension-4326.json | 84e560e3303f655779b09b1f43949032b238d5c18c4ad3679416161003b8222e | viðbótargeómetría sunnan Vesturlandsvegar |
| geometry-inventory-owner-scope.json | sjá skrá/hash í skýrslu | afmarkað gagnasýni 10 raunlínuhluta, ekki ný leiðarskilgreining |

## Uppfærð staða

| Atriði | Staðfest / niðurstaða | Óleyst / áhrif | Minnsta staðfesting |
|---|---|---|---|
| Upphaf | Eigandi hefur valið Rauðavatn. IDBUTUR 1410010037 / IDFERILL 1436 er fyrsta núverandi Vík-línan. Varðveittir WGS84-endar: vestari 64.10152894, -21.75906405; eystri 64.09249225, -21.71204873 (lat,lon). Native endar 365522.0175,402772.762 og 367768.94,401667.09. | Kóðinn setur uppsafnaða lengd eftir kaflaröð, án sérstaks frysts origin-hnitareits. Vestari endinn er eðlilegur kandidat að sama upphafi, en hlutverka-/aksturstenging þaðan í norðurleið er ekki staðfest. Ekki flytja upphafið á #485 rannsóknar-ETA-zero 49926 sem er annar staður. | Rekja norðurleið frá þessum raunverulega Rauðavatnsenda, staðfesta stefnuréttar tengingar. Engin ný „Reykjavík“-vöruákvörðun þarf. |
| Norðurleið | IDBUTUR-kandidatar 914020037→903020037→903030037→904690037→904000037→904010037→804020037→hluti 904040037 hafa varðveitta línuhluta. Tenging 804020037 enda og 904040037 IDFERILL2876 upphafs er nákvæmlega sama E/N-hnit. | Kaflar 914020037/903020037 innihalda stefnubrautir, rampa og hringtorg. Öll þessi ID ein og sér eru ekki sönnuð samfelld norðurleið; lægstu endapunktafjarlægðir sanna ekki löglega stefnu eða val hringtorgsboga. | Afmörkuð stefnurétt pieces-keðja að og frá Vesturlandsvegi; samþykkja ekki nafnaröð sem sönnun. |
| Göng | Tier0 IDFERILL56002 á 904690037: [362520.27,423091.755]→[359537.73,426271.36], línulengd 5783.388 m. Tengist IDFERILL3796 beint, 468.432 m, áfram að [359141.3289,426125.7452]. Þetta sýnir að fyrri „stuttur munnakafli“ fullyrðing var röng. | Geómetría og endapunktar eru VERIFIED; aksturs-/rekstrarstefna ekki vottuð af nafninu einu. 814700037 er merkt til suðurs og má ekki bæta við norðurleið til að tvítelja göngin. | Staðfesta stefnu og val 56002 frekar en 2982/suðurauðkennis; ekki fersk veðurspá úr göngum. |
| Borgarnes-aðkoma | Röð varðveittra samliggjandi native-lína: 3758 (804020037) endar [360414.21,452447.79]; 2876 (904040037) þaðan að [360755.24,453516.21], 1156.647 m; 2819 þaðan að [361119.191,454127.5752], 719.396 m; hringtorg30401 nálægt síðari enda. | Hnit eru staðfest E/N (EPSG:3057), en hvaða þessara tengipunkta samsvarar „aðkomu að þéttbýli“ er ekki sannað með þessari línuskrá. Ekki velja allan 904040037 (19,694 km tier0) sem Borgarnes-endir því hann heldur áfram í norður. Nákvæmur WGS84-endastaður óstaðfestur. | Afmarkað opinbert staðfræðilegt viðmið fyrir aðkomu á þessum hluta Hringvegar og WGS84-hnit þess; ekki óvirka stöð142 eða sjálfgefinn Borgarnes–Hítará-kafla. |
| Lengdir/ETA | Raunlínulengdir í gagnasýni eru mældar í EPSG:3057; tier0 heildarsummur: 914020037 7,515 km; 903020037 18,309; 903030037 20,702; 904690037 7,298; 904000037 7,124; 904010037 12,360; 804020037 15,000; 904040037 19,694. | Þetta eru ALLRA tier0-hlutverka summur, ekki aksturslengdir; ekki leggja saman í „heildarlengd“ eða nota fyrir ETA. Endir leiðar/stefnur/bogar ekki fryst; full Vík-stýring ekki framkvæmd því studd leiðarlengd er ekki lögð fram. Uppsafnað punktakílómetragildi UNKNOWN. | Að endapunkti/pieces-keðju staðfestri reikna aðeins þá hluta, með sömu stýrðu aðferð og Vík; afmarka lengdarbil og áhrif á ETA-ceil. Engin 70km/klst.-reglubreyting. |
| Færðartenging | Sömu full IDBUTUR eru í varðveittri geómetríu; #429 staðfesti stöðu fyrir 903030037/904690037 á sínum sýnatökutíma. | Full valin leiðarkeðja hefur ekki verið samsvöruð við færð/tilkynningar í þessari umferð. Ekki nota 904260037 eingöngu vegna fyrra „Borgarnes“ heitis. | Sía varðveitt færðarsýni á endanlegri keðju og skrá missing, ekki „greiðfært“ sjálfkrafa. |

## Fjórir spápunktar — tillögusvæði, ekki fryst hnit

Eigandi hefur heimilað fjóra punkta eftir mikilvægi/dreifingu. Það heimilar valferlið; ekki þörf á áður samþykktri nákvæmri midpoint-reglu. Hér eru fjögur staðbundin tillögusvæði með raunverulegum línuhnitum sem geta borið valið. Þau eru **INFERRED tillögur**, ekki staðfest veðurfarslegt þekjumat. Dreifing verður að endurmetast eftir uppsafnaðri aksturslengd; ekki jafna native-hnitabil við akstursdreifingu.

| Tillaga | Raunlínuviðmið EPSG:3057 E/N | Ástæða tillögu / takmörk |
|---|---|---|
| P1 Kjalarnes | IDFERILL3025 upphaf [362804.64,418651.23], IDBUTUR903030037 | Fulltrúi leiðar sunnan ganga; valið sérstaklega úr raunlínu. Veðurfarslegt mikilvægi þessa nákvæma punkts óstaðfest. |
| P2 Utan norðurenda ganga | IDFERILL3796 endi [359141.3289,426125.7452], IDBUTUR904690037 | Veðurpunktur utan ganga frekar en spá á neðanjarðarkafla. Gangastaðsetning/stefna og landfræðileg merking þarf staðfestingu, ekki mæling. |
| P3 Hafnarfjall | IDFERILL3757 upphaf [360686.6249,448849.1244], IDBUTUR804020037 | Hæðar-/strandlandslag svæðis er rök fyrir tillögusvæði, ekki sannað vindáhættumat eða staðfest rannsókn á loftslagi. Nákvæm valstaðsetning þarf mat á leiðardreifingu. |
| P4 Borgarnes-aðkoma | Endanlegt viðmið meðal 2876/2819-endapunkta, sjá töflu | Loka leið með punktaspá við staðfesta aðkomu. Hnit ófryst þar til aðkoma er auðkennd; ekki skálda WGS84. |

WGS84-hnit allra fjögurra nýrra punkta, uppsafnaðar akstursfjarlægðir og heildstæð rök fyrir veðurfarslegu mikilvægi eru ekki enn staðfest. Varðveitt stöðvarhnit og Open-Meteo-skilareitir leysa ekki þetta sjálfkrafa. Engin ný spábeiðni eða gagnaveituskipti gerð.

## GO/BLOCKED

**BLOCKED.** Eigandastefna er nú skýr. Eftirstöðvar eru (1) stefnurétt tenging Rauðavatns við norðurleið, (2) nákvæmur Borgarnes-aðkomustaður í WGS84, (3) aksturslengdir/punktfjarlægðir eftir þeirri keðju, (4) fjögur endanleg WGS84-spáhnit með rökstuddri dreifingu og mikilvægi. Þetta hindrar rétt ETA/routeId-leiðargögn, ekki framleiðslukóða sem þarf að laga.

Næsta minnsta tæknilega skref eftir Jonesy review er afmörkuð sannprófun þessara fjögurra atriða með opinberri viðeigandi geómetríu/stefnumerkingu og aðkomuviðmiði; ekki almenn leiðarleit eða nýr rannsóknarbiðlari. Þessi afhending lýsir nákvæmlega því sem varðveittar skrár staðfesta, ekki því sem þær tryggja ekki. Engin innleiðing hefst út frá þessari BLOCKED-töflu. Jonesy þarf að yfirfara sérstaklega Rauðavatnsenda, Borgarnes-kandidata og að línulengdir/tillögusvæði séu ekki misskilin sem samþykkt akstursleið/veðurþekja.

## Afgreiðsla O1–O5 eftir Jonesy — Ripley, 2026-11-04

Gagnayfirferð Jonesy PASS samþykkt; innleiðing áfram BLOCKED. Eigandaákvarðanir eru bein fyrirmæli í þessu spjalli (Rauðavatn, Borgarnes-aðkoma, fjórir punktar), ekki ályktun Ripley. Engin endurstaðfesting þeirra krafist.

- **O1 samþykkt:** Raunsýni útvíkkað með 3023 (sunnanmunni, 939,087 m), 2982 (til suðurs, 5417,467 m) og 42573 (norðanmunni, hringur, 106,949 m). 56002 á 904690037 er merkt Hvalfjarðargöng; 3023 tengir 3025 nákvæmlega við 56002 og 3796 fylgir á eftir. Eigindi/stafræn stefna eru VERIFIED, stuðningur við norðurátt INFERRED, ekki sjálfstæð umferðarheimild. Ekki halda áfram að meðhöndla allt 904690037 sem óauðkenndan munnakafla.
- **O2 samþykkt um endurval:** Draga til baka P3=3757 upphaf sem ráðlagðan endanlegan Hafnarfjall-punkt; hann er of seint á kaflanum og nálægt áfangastað. Næsta afmarkaða val þarf að bera saman raunlínu á 47042/3756 við fyrri P3, með uppsafnaðri akstursdreifingu frá Rauðavatni. Þessir tveir hlutir eru nú í gagnasýninu. Ekki frysta nýjan midpoint eða kalla hann veðurfarslega staðfestan án staðfestingar. P1→P2→P3→P4 bil Jonesy eru línukeðjuútreikningar á INFERRED leið og nýtast sem dreifingarviðvörun, ekki samþykkt ETA. Mikilvæg aðgreining: sami forecastHour á tveimur stöðum merkir ekki sömu spágildi eða veðurþekju; staðsetningar hafa sjálfstæð gildi. Færum P3 vegna landfræðilegrar dreifingar/staðsetningar, ekki til að þvinga mismunandi tímastimpla.
- **O3 samþykkt sem afmörkuð valregla fyrir staðfestingu:** Borgarnes-aðkoma tákni fyrsta hringtorg á Hringvegi við aðkomu úr suðri, ef það samsvarar varðveitta 30401 við enda 2819. Bera þá reglu við lok 2876, lok 2819 og 30401; ekki nota allan Borgarnes–Baulan-kafla. Þetta er nákvæm tæknileg tillaga innan eigandavals „við aðkomu“, ekki enn staðfest að 30401 sé fyrsti hringur/þéttbýlismörk. Hnit 30401 eru punktur á hring, EKKI miðja. Fyrir ETA skal nota staðfestan innkomupunkt á línu/hring frekar en meðaltal hnúta; ekki álykta hringmiðju eða akstursboga af fyrsta hnút.
- **O4 lokið:** Tier=0 bætt við öll sýni; 3023/2982/42573 og Rauðavatnstengingar bætt við, 3740 haldið sem skýrt millitengigagn í Melasveit, ekki nýr spápunktur. Uppfært JSON hefur 18 eiginleika; SHA256 **072e1d6233ee4b8df522a3de04c2f194178b189e5a85fe62f33a864048492934**. Fyrra 10-sýna hash í Jonesy yfirferð gildir um fyrri útgáfu, ekki þessa.
- **O5 samþykkt:** Vestari 1436-endi þarf tengingu við hring8677 og stefnuhluta1477/54723; þeir nú í sýni. Nálægðir Jonesy 1,3/37,4/38,3 m eru Jonesy-endurreiknaðar, ekki nýjar Ripley-mælingar hér. Nákvæm leiðarstefna og bogaval áfram óleyst.

**CRS-forsenda skráð sérstaklega:** Borgarnes-endi og nýir punktar þurfa studda ISN93→WGS84 leið. 9802-síðan er 404 og því ekki heimild fyrir formúlu/framkvæmd. Pöruð native/WGS84 gögn fyrir 903020037/914020037 eru samanburðargögn, ekki full aðferð fyrir alla leið. Næsta staðfesting þarf annaðhvort gildandi tiltæka staðlaða umvörpun með skráðum CRS/breytum og samanburði við þessi pör, eða afmarkaða opinbera WGS84-geómetríu fyrir viðkomandi hluta; hvorugt er framkvæmt eða talinn sjálfkrafa samþykktur nýr verkþáttur hér. Enginn sérsmíðaður hnitabreytingarbiðlari.

**Lokamat þessa review:** PASS sem gagnayfirferð; BLOCKED fyrir B. Næsta skref er afmarkað lokun fjögurra skráðra tæknilegra atriða með valreglunni að ofan og P3 endurvali; ekki fleiri almennar gagnabirgðayfirferðir eða appinnleiðing. Engin ný net-/lyklabeiðni, forritskóðabreyting eða innleiðingarheimild í þessari afgreiðslu.
