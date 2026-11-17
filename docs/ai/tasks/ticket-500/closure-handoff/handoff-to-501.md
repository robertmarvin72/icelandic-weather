# #500 → #501 gagnahandoff, 2026-11-16

Þetta skjal lýsir **gildandi** gagnastöðu Winter Route staðavalsins (56
eigandasamþykktir staðir) nákvæmlega eins og hún er í núverandi
vinnutré, til nýtingar af #501 (leiðasamsetning). Það er ekki nýtt
gagnakerfi, ekki nýtt staðaval og breytir engum vörugögnum — hrein
samantekt + tilvísanir á þegar varðveitt gögn. Heimild fyrir þessari
lotu: `docs/ai/tasks/ticket-500/closure-handoff/approved-prompt-v1.md`
(Jonesy APPROVED, OS1–OS6 teknar inn).

**Sögulegar rannsóknir eru skýrt merktar hér sem SÖGULEGAR — þær
yfirskrifa ekki nýtt punktaval og eru ekki núverandi stuðningslisti.**
`nationwide-status.md` er söguleg staða, ekki núverandi talning — ekki
notuð sem heimild hér.

## 1. Gildandi skrár, hlutverk, schema_version og SHA-256

Allar SHA-256-tölur eru reiknaðar á raunverulegum bætum skráa í
vinnutrénu **við afhendingu þessa skjals** (2026-11-16). Sjá OS3: SHA
breytist ef skráin breytist eða línulok (CRLF/LF) breytast — þessi tala
er ekki loforð um sama bætagildi í öðru checkout/CI-umhverfi.

| Skrá | Hlutverk | schema_version | SHA-256 (vinnutré, 2026-11-16) |
|---|---|---|---|
| `server_data/winter-route-places.json` | **Gildandi 56-staða listi** — vörugrunnurinn. 54 með hnit, Keflavík bær + Þórshöfn null. | 1 | `ed4adcbd2f53d6c5a63f37ddf91d28b5bcdc90a3e4e5619999460533fcd47b33` |
| `server_data/winter-route-approach-selections.json` | **Gildandi valdir aðkomupunktar** — 50 færslur (flokkar: MAP_RECOMMENDATION×11, RETAINED_CANDIDATE×10, MAP_JUNCTION×2, MAP_PRODUCT×27). Allar `access_status: EXACT_GAP`. | 1 | `a9dd5e2479cfcb414b8acf0e8acab4dc1f6adc16adb07ed065ce6b6fcb8252f7` |
| `server_data/winter-route-south-connections.json` | **Varðveitt keðja** — Hveragerði→Selfoss→Hella→Hvolsvöllur→(Vík) suðurkorridor, 25 stykki, úr `chain-walks-v4.json` steps 2135..23041. `driving_access_and_direction: EXACT_GAP`. | 1 | `aa0c117c4f1212d818e79c9cfe66ca980f1231293400f2760fdd4161c37ef310` |
| `server_data/winter-route-remaining-coverage.json` | Söguleg candidate-leit fyrir 47 staði (þar á meðal `keflavik`/`skaftafell`/`thorshofn`'s `NO_RETAINED_MATCH`/`NAME_MENTION_ONLY` niðurstöður, sem standa óbreyttar þótt skaftafell hafi síðar fengið punkt úr ÖÐRU gagnasetti — sbr. OS5). | 1 | `98ac823993cfa788c7146b5a4c2d1cead7a4fa92bc40b696d956eee7b61a73d5` |
| `server_data/winter-route-acquired-geometry.json` | Söguleg hrágagnaöflun (39 staðir, 82 IDBUTUR, 8 WFS-köll) — undirlag fyrir hluta núverandi valinna punkta. | 1 | `8dc9fa9a1261721544f4806f05ae60eeeef3090acbdd275d073d0ee88cb208be` |
| `server_data/winter-route-approach-analysis.json` | Söguleg kandídatgreining (39 staðir) ofan á acquired-geometry. | 1 | `32cec4f3a8c12c0eece6f2b129d8fda3ca3391a5d27242fe9397a9ca4262a348` |
| `server_data/winter-route-place-evidence.json` | Söguleg vefrannsókn (29 staðir sem höfðu engan nothæfan kandídat eftir analysis) — `CONFIRMED_AUTHORITY_NO_GEOMETRY_BINDING`/`LEAD_NOT_INDEPENDENTLY_VERIFIED`/o.s.frv., ekki vörugögn. | 1 | `3c2be211b3b41c68fd6ed1dddb67d4df8b12528007d40dde6d6420e136860849` |
| `docs/ai/tasks/ticket-500/places-v1.json` | **Gildandi** — 4 upphaflegu eigandavöldu punktarnir (R1/E1/S2/C) sem `places.json` endurnotar orðrétt. | 1 | `b8e08f507c5eee50d8006e0941344f8dcd4e63e52c039449068ce15c8f084b04` |
| `docs/ai/tasks/ticket-500/r1-north-connection.json` | **Gildandi** — afmarkaður 15-stykkja útdráttur frá R1 í norður, `unsupported for #501`. | 1 | `0a1b8aa46dcc5330544de94ca4c9dc756bdf601d44ccf48b1ca7dbced3cf9e15` |
| `docs/ai/tasks/ticket-493-place-network/samples/chain-walks-v4.json` | Söguleg/varðveitt rannsóknarskrá — upprunakeðja fyrir suðurkorridorinn (sjá ofan). Rannsóknargagnagrunnur fyrir #501, ekki afhent sem fullgerð leið. | — (ekki `schema_version`-reitur) | `640efec931a374ac3ddd95d0750980e97654fe1d166229dc579d355a082becd7` |
| `docs/ai/tasks/ticket-493-place-network/samples/road-links.csv` | Söguleg/varðveitt raw-tengiskrá (native EPSG:3057 endahnútar) — notuð við SHA/hnútaprófun á fjölda staða þessa árs. | — (CSV) | `bf25ff0f68f0d7e7b46f4beb3fa7619c6e91fd8a1ad7c3f8d71eb24937db10c7` |
| `docs/ai/tasks/ticket-493-access-points/place-access-status-v3.csv` | **Söguleg** 72-raða rannsóknarskrá — sjá kafla 5. EKKI núverandi stuðningslisti. | — (CSV) | `d0bb7c7c3e4c968ccf5d0d373104c8aa1de5c5c034ba451aa3e813a1d95d215b` |
| `api/_lib/winterRoute/routes.js` | **Gildandi runtime** — tvær fastar leiðir (`raudavatn-vik`, `raudavatn-borgarnes`), óháð þessari gagnalotu. | — (kóði) | `f017a38f60a964ae7ddb88ccfbcb93112f6006b9a8a20d6cb4bd1ba3d606a0c4` |
| `src/lib/winterRouteRoutes.js` | Frontend-afrit af sömu tveimur föstu leiðum (viljandi tvítekið, sjá skráin sjálf). | — (kóði) | `e6482cbd73022f5607f314c0a45e1bb2755d1d093f7e94c0586d52a9ffee13bd` |

## 2. 56-raða tafla — núverandi staða hvers staðar

Fyrir #501: allar 54 valdar aðkomur eru með óstaðfest akstursaðgengi/stefnu
(`EXACT_GAP`); 0/56 eru `SUPPORTED`/`ROUTABLE`. Tvö hnitagöt þurfa val áður
en hægt er að tengja þau. „—“ í síðasta dálki merkir enga staðfesta varðveitta
keðjutilvísun í þessum grunni; aðrar tilvísanir halda fyrirvörum neðanmálsgreina.

Dálkar: punktur valinn eða hnitagat → grunnur vals og bein tilvísun (stytt
`selections.json#selections.<id>` birt sem `selections.<id>`) → varðveitt
graph-tenging/keðja, **aðeins þar sem hún er raunverulega til**. Engin
hnit eru afrituð hér — sækja þau beint úr `places.json`/`selections.json`.
Neðanmálsgreinar vísa á þekkt gat/fyrirvara fyrir þá 18 staði sem bera
sértæka athugasemd umfram almenna `EXACT_GAP`-stöðu.

| ID | Nafn | Svæði | Punktur / hnitagat | Grunnur & tilvísun | Varðveitt tenging |
|---|---|---|---|---|---|
| `reykjavik-raudavatn` | Reykjavík | Höfuðborgarsvæði | Valinn punktur[^r1] | Eigandaval (places-v1.json) — `places-v1.json#reykjavik-raudavatn` | `r1-north-connection.json` (norður, unsupported) + upphafspunktur báðra fastra runtime-leiða |
| `kopavogur` | Kópavogur | Höfuðborgarsvæði | Valinn punktur[^kopavogur] | Ripley-kortastoð (MAP_PRODUCT) — `selections.kopavogur` | — |
| `hafnarfjordur` | Hafnarfjörður | Höfuðborgarsvæði | Valinn punktur[^hafnarfjordur] | Ripley-kortastoð (MAP_PRODUCT) — `selections.hafnarfjordur` | — |
| `mosfellsbaer` | Mosfellsbær | Höfuðborgarsvæði | Valinn punktur | Ripley-kortastoð (MAP_PRODUCT) — `selections.mosfellsbaer` | — |
| `keflavik` | Keflavík | Reykjanes | **Hnitagat**[^gap2] (NO_RETAINED_MATCH) | `winter-route-remaining-coverage.json#coverage.keflavik` | — |
| `keflavikurflugvollur-kef` | Keflavíkurflugvöllur (KEF) | Reykjanes | Valinn punktur | Kortaráðlagt (MAP) — `selections.keflavikurflugvollur-kef` | — |
| `grindavik` | Grindavík | Reykjanes | Valinn punktur | Retained kandídat (RETAINED) — `selections.grindavik` | — |
| `akranes` | Akranes | Vesturland og Snæfellsnes | Valinn punktur[^akranes] | Ripley-kortastoð (MAP_PRODUCT) — `selections.akranes` | — |
| `borgarnes` | Borgarnes | Vesturland og Snæfellsnes | Valinn punktur[^borgarnes] | Retained kandídat (RETAINED) — `selections.borgarnes` | Endapunktur `raudavatn-borgarnes` (P4, idbutur 904040037) |
| `stykkisholmur` | Stykkishólmur | Vesturland og Snæfellsnes | Valinn punktur | Ripley-kortastoð (MAP_PRODUCT) — `selections.stykkisholmur` | — |
| `grundarfjordur` | Grundarfjörður | Vesturland og Snæfellsnes | Valinn punktur | Retained kandídat (RETAINED) — `selections.grundarfjordur` | — |
| `olafsvik` | Ólafsvík | Vesturland og Snæfellsnes | Valinn punktur | Retained kandídat (RETAINED) — `selections.olafsvik` | — |
| `budardalur` | Búðardalur | Vesturland og Snæfellsnes | Valinn punktur | Ripley-kortastoð (MAP_PRODUCT) — `selections.budardalur` | — |
| `reykholar` | Reykhólar | Vestfirðir | Valinn punktur | Ripley-kortastoð (MAP_PRODUCT) — `selections.reykholar` | — |
| `patreksfjordur` | Patreksfjörður | Vestfirðir | Valinn punktur | Kortaráðlagt (MAP) — `selections.patreksfjordur` | — |
| `talknafjordur` | Tálknafjörður | Vestfirðir | Valinn punktur | Kortaráðlagt (MAP) — `selections.talknafjordur` | — |
| `bildudalur` | Bíldudalur | Vestfirðir | Valinn punktur | Kortaráðlagt (MAP) — `selections.bildudalur` | — |
| `thingeyri` | Þingeyri | Vestfirðir | Valinn punktur | Kortaráðlagt (MAP) — `selections.thingeyri` | — |
| `isafjordur` | Ísafjörður | Vestfirðir | Valinn punktur | Ripley-kortastoð (MAP_PRODUCT) — `selections.isafjordur` | — |
| `bolungarvik` | Bolungarvík | Vestfirðir | Valinn punktur | Retained kandídat (RETAINED) — `selections.bolungarvik` | — |
| `sudavik` | Súðavík | Vestfirðir | Valinn punktur | Ripley-kortastoð (MAP_PRODUCT) — `selections.sudavik` | — |
| `holmavik` | Hólmavík | Vestfirðir | Valinn punktur | Ripley-kortastoð (MAP_PRODUCT) — `selections.holmavik` | — |
| `drangsnes` | Drangsnes | Vestfirðir | Valinn punktur | Ripley-kortastoð (MAP_PRODUCT) — `selections.drangsnes` | — |
| `hvammstangi` | Hvammstangi | Norðurland vestra | Valinn punktur | Ripley-kortastoð (MAP_PRODUCT) — `selections.hvammstangi` | — |
| `blonduos` | Blönduós | Norðurland vestra | Valinn punktur | Ripley-kortastoð (MAP_PRODUCT) — `selections.blonduos` | — |
| `skagastrond` | Skagaströnd | Norðurland vestra | Valinn punktur | Ripley-kortastoð (MAP_PRODUCT) — `selections.skagastrond` | — |
| `saudarkrokur` | Sauðárkrókur | Norðurland vestra | Valinn punktur | Kortaráðlagt (MAP) — `selections.saudarkrokur` | — |
| `varmahlid` | Varmahlíð | Norðurland vestra | Valinn punktur | Kortaráðlagt (MAP) — `selections.varmahlid` | — |
| `siglufjordur` | Siglufjörður | Norðurland vestra | Valinn punktur | Retained kandídat (RETAINED) — `selections.siglufjordur` | — |
| `olafsfjordur` | Ólafsfjörður | Norðurland eystra | Valinn punktur | Retained kandídat (RETAINED) — `selections.olafsfjordur` | — |
| `dalvik` | Dalvík | Norðurland eystra | Valinn punktur[^dalvik] | Ripley-kortastoð (MAP_PRODUCT) — `selections.dalvik` | — |
| `akureyri` | Akureyri | Norðurland eystra | Valinn punktur | Eigandaval (places-v1.json) — `places-v1.json#akureyri` | — |
| `husavik` | Húsavík | Norðurland eystra | Valinn punktur | Ripley-kortastoð (MAP_PRODUCT) — `selections.husavik` | — |
| `reykjahlid-myvatn` | Reykjahlíð (Mývatn) | Norðurland eystra | Valinn punktur | Kortaráðlagt (MAP) — `selections.reykjahlid-myvatn` | — |
| `kopasker` | Kópasker | Norðurland eystra | Valinn punktur | Ripley-kortastoð (MAP_PRODUCT) — `selections.kopasker` | — |
| `raufarhofn` | Raufarhöfn | Norðurland eystra | Valinn punktur | Ripley-kortastoð (MAP_PRODUCT) — `selections.raufarhofn` | — |
| `thorshofn` | Þórshöfn | Norðurland eystra | **Hnitagat**[^gap2] (NO_RETAINED_MATCH) | `winter-route-remaining-coverage.json#coverage.thorshofn` | — |
| `vopnafjordur` | Vopnafjörður | Austurland | Valinn punktur[^vopnafjordur] | Retained kandídat (RETAINED) — `selections.vopnafjordur` | — |
| `egilsstadir` | Egilsstaðir | Austurland | Valinn punktur | Eigandaval (places-v1.json) — `places-v1.json#egilsstadir` | — |
| `seydisfjordur` | Seyðisfjörður | Austurland | Valinn punktur | Eigandaval (places-v1.json) — `places-v1.json#seydisfjordur` | — |
| `neskaupstadur` | Neskaupstaður | Austurland | Valinn punktur | Ripley-kortastoð (MAP_PRODUCT) — `selections.neskaupstadur` | — |
| `eskifjordur` | Eskifjörður | Austurland | Valinn punktur | Ripley-kortastoð (MAP_PRODUCT) — `selections.eskifjordur` | — |
| `reydarfjordur` | Reyðarfjörður | Austurland | Valinn punktur[^junction] | Kortastaðfest gatnamót (MAP_JUNCTION) — `selections.reydarfjordur` | — |
| `faskrudsfjordur` | Fáskrúðsfjörður | Austurland | Valinn punktur[^junction] | Kortastaðfest gatnamót (MAP_JUNCTION) — `selections.faskrudsfjordur` | — |
| `djupivogur` | Djúpivogur | Austurland | Valinn punktur | Ripley-kortastoð (MAP_PRODUCT) — `selections.djupivogur` | — |
| `hofn` | Höfn | Suðurland | Valinn punktur[^hofn] | Ripley-kortastoð (MAP_PRODUCT) — `selections.hofn` | — |
| `skaftafell` | Skaftafell | Suðurland | Valinn punktur | Ripley-kortastoð (MAP_PRODUCT) — `selections.skaftafell` | — |
| `kirkjubaejarklaustur` | Kirkjubæjarklaustur | Suðurland | Valinn punktur[^kbk] | Ripley-kortastoð (MAP_PRODUCT) — `selections.kirkjubaejarklaustur` | — |
| `vik` | Vík | Suðurland | Valinn punktur[^southcorr][^vik] | Retained kandídat (RETAINED) — `selections.vik` | Suðurkorridor stykki 23/25 + nálægt enda `raudavatn-vik` (sjá [^vik]) |
| `hvolsvollur` | Hvolsvöllur | Suðurland | Valinn punktur[^southcorr] | Kortaráðlagt (MAP) — `selections.hvolsvollur` | Suðurkorridor stykki 12/25 |
| `hella` | Hella | Suðurland | Valinn punktur[^southcorr] | Kortaráðlagt (MAP) — `selections.hella` | Suðurkorridor stykki 9/25 |
| `selfoss` | Selfoss | Suðurland | Valinn punktur[^southcorr] | Kortaráðlagt (MAP) — `selections.selfoss` | Suðurkorridor stykki 1/25 |
| `hveragerdi` | Hveragerði | Suðurland | Valinn punktur[^southcorr] | Retained kandídat (RETAINED) — `selections.hveragerdi` | Suðurkorridor stykki 0/25 (fyrsta) |
| `thorlakshofn` | Þorlákshöfn | Suðurland | Valinn punktur | Ripley-kortastoð (MAP_PRODUCT) — `selections.thorlakshofn` | — |
| `fludir` | Flúðir | Suðurland | Valinn punktur | Ripley-kortastoð (MAP_PRODUCT) — `selections.fludir` | — |
| `laugarvatn` | Laugarvatn | Suðurland | Valinn punktur | Ripley-kortastoð (MAP_PRODUCT) — `selections.laugarvatn` | — |

## 3. Varðveittar keðjur/tengingar sem #501 getur nýtt

Hér eru tveir varðveittir keðjuútdrættir og, aðgreindar frá þeim, tvær
núverandi fastar runtime-leiðir. Taflan sýnir 7 staði með tengi-/keðjutilvísun
og hina 49 (56 − 7, þar af 2 hnitagöt) án slíkrar tilvísunar. Af þeim
hafa 47 valinn stakan punkt en Keflavík bær og Þórshöfn ekkert valið hnit.
Þetta lýsir aðeins varðveittum afhendingargrunni, ekki raunverulegu vegaleysi.

1. **Suðurkorridorinn** (`winter-route-south-connections.json`): 25
   varðveitt stykki, bein úr `chain-walks-v4.json` steps 2135..23041,
   `idbutur_sequence` sama undirmengi og `segments.js`'s núverandi fasta
   `WINTER_ROUTE_SEGMENTS`. Fimm af 56 stöðunum eru bundnir við stykki
   0/1/9/12/23 í þessum útdrætti, í þessari landfræðilegu röð (með
   fyrirvörum um nafnaályktun og óleyst bil, sjá [^southcorr]): Hveragerði (stykki 0) →
   Selfoss (1) → Hella (9) → Hvolsvöllur (12) → Vík (23, af 25). Mælt bil
   milli stykkja samtals 105,029 m, stærsta stak bil 42,302 m — allt
   mælt, ekkert ágiskað. `driving_access_and_direction.status: EXACT_GAP`
   fyrir alla keðjuna — engin lögleg akstursstefna/aðgengi staðfest.
   Keðjan heldur áfram EITT stykki (23041, 629,448 m, bil 0,0 m) framhjá
   Víkur-hnútnum að enda núverandi fastrar runtime-leiðar — sjá
   neðanmálsgrein [^vik].
2. **R1-norðurútdráttur** (`r1-north-connection.json`): 15 stykki frá
   Rauðavatni (R1) í átt að Kjalarnesi, mælt en með bilum (2,88–41,45 m),
   endar við `3025 START` — **sem er EKKI einn af 56 stöðunum sjálfur**,
   heldur miðkaflapunktur í stærri keðju. Þessi útdráttur tengir R1 því
   ekki við neinn nafngreindan stað í 56-listanum innan sinnar eigin
   lengdar. `h1_status: INFERRED, not proven legal traffic direction`.
   `status_for_501: unsupported`.
3. **Tvær fastar runtime-leiðir** (`api/_lib/winterRoute/routes.js`,
   `src/lib/winterRouteRoutes.js`): `raudavatn-vik` og
   `raudavatn-borgarnes` — þessar eru **nú þegar virkar** í appinu (sex
   og fjórir veðurpunktar, föst reiknuð vegalengd), óháðar og óbreyttar
   af þessari gagnalotu. Þær tengja `reykjavik-raudavatn` við `vik` og
   `borgarnes`. **Mikilvægt**: punkturinn sem `places.json` skráir fyrir
   `vik` er EKKI sá sami og leiðarendinn þessara runtime-leiða — sjá
   [^vik]. `borgarnes`'s valinn punktur er sama hnit og leiðarendinn (P4).

`chain-walks-v4.json` og `road-links.csv` eru sjálf **rannsóknargrunnur**
sem #501 má lesa áfram úr (t.d. til að leita fleiri keðjum milli annarra
staðapara), ekki afhent hér sem tæmandi né sem staðfestar heilar leiðir.
Ekki telja 25-stykkja suðurútdráttinn eða 15-stykkja norðurútdráttinn sem
heila/studda leið (OS4) — þeir eru útdrættir úr stærra varðveittu setti.

## 4. Sérstaklega sýnileg atriði

- **Keflavík bær ≠ Keflavíkurflugvöllur (KEF).** Tveir aðskildir staðir
  með aðskildum `id`-um. KEF hefur valinn punkt
  (`keflavikurflugvollur-kef`, MAP_RECOMMENDATION); Keflavík bær er eitt
  af aðeins tveimur hnitagötum. `KEF`-samheitið tilheyrir eingöngu
  flugvellinum, ekki bænum — sjá `places.test.js`.
- **Tvö hnitagöt, nákvæmlega skráð:** `keflavik` og `thorshofn` — hvorugt
  hefur neina varðveitta source-geometry í núverandi gagnasetti.
  `winter-route-remaining-coverage.json` skráir báða sem `NO_RETAINED_MATCH`.
  Engin ný öflun gerð hér; ákvörðun um öflun er eigandans.
- **R1-norðurtengingin er `unsupported`** — mæld en ekki samfelld snerting
  alla leið, engin staðfest akstursstefna. Sjá kafla 3, lið 2.
- **Áður skráð suður-/hring-/Akranes-/Dalvíkur-göt halda sér óbreytt** —
  sjá neðanmálsgreinar [^southcorr], [^akranes], [^dalvik], [^kbk],
  [^hofn], [^kopavogur], [^hafnarfjordur], [^junction], [^vopnafjordur],
  [^vik], [^borgarnes]. **Nýtt vörupunktaval eyðir ekki gömlu
  tengigati sjálfkrafa** — t.d. Akranes fékk nýjan vörupunkt í
  remaining-map-selection-lotunni, en 2,5 m source-bilið að hringstykki
  21441 er enn óleyst.

## 5. 72-raða rannsóknarsafnið (`place-access-status-v3.csv`) — söguleg staða

Þetta er eldra rannsóknarsafn frá ticket-493, **ekki** yfirmengi 56-staða
listans og **ekki** krafa um að bæta fleiri stöðum við vöruna. Beinn
samanburður (gerður fyrir þetta skjal, nöfn borin bókstaflega saman):

- **22 nöfn eru í 72-röðunum en EKKI í 56-staða listanum**: Bifröst,
  Borgarfjörður eystri, Breiðdalsvík, Eyrarbakki, Fellabær, Flateyri,
  Garðabær, Garður, Grenivík, Hellissandur, Hofsós, Hrafnagil, Laugar,
  Laugarás, Reykholt, Reykjahlíð, Reykjanesbær, Sandgerði, Stokkseyri,
  Stöðvarfjörður, Suðureyri, Vogar. **Ekki varpa neitt af þessum á 56-listann
  þegjandi** (t.d. ekki Reykjanesbær→Keflavík — Garðabær er heldur ekki
  sjálfkrafa samþykktur viðbótarstaður, sbr. eldri krafa í `closure-assessment.md`).
- **6 nöfn eru í 56-staða listanum en EKKI bókstaflega í 72-röðunum**:
  Drangsnes, Keflavík, Keflavíkurflugvöllur (KEF), Reykhólar, Reykjahlíð
  (Mývatn), Skaftafell. (Athugið: "Reykjahlíð" í 72-settinu og "Reykjahlíð
  (Mývatn)" í 56-listanum eru sá sami staður með skýrt merktri vörpun —
  ekki ný útilokun.)

72-raða safnið er varðveitt óbreytt sem rannsóknarsafn; 56-staða
eigandalistinn (`nationwide-owner-scope.md`, `places.json`) er
vörugrunnurinn sem #501 á að byggja á.

## 6. Stutt lokunartafla gagnvart #500 (samkvæmt `closure-assessment.md`)

| Atriði úr #500 | Staða | Áhrif |
|---|---|---|
| Endanlegur 56-staða vörulisti | **Uppfyllt** | Engin breyting heimiluð án eigandaákvörðunar. |
| 54/56 með valinn vörupunkt | **Afhent sem nákvæmt gagnagat** (2 eftir) | Keflavík bær/Þórshöfn þurfa sérstaka eigandaheimilaða öflun — ekki sjálfkrafa frestun. |
| Vegtengingar/akstursaðgengi milli valinna punkta | **Ólokið, nákvæmt gagnagat** | 0/56 `SUPPORTED`/`ROUTABLE`. Tveir keðjuútdrættir og tvær aðskildar fastar leiðir (kafli 3) eru ekki staðfest almenn þekja. |
| Samræmt gagnahandoff til #501 | **Afhent hér** (þetta skjal) | #501 getur byggt á þessu án nýrrar gagnaöflunar fyrir þann hluta sem þegar er valinn. |
| Leiðasamsetning/Frá-Til almennt | **Ólokið — tilheyrir #501/#502** | Núverandi tvær fastar runtime-leiðir standa óháðar og óbreyttar. |

**Tæknileg gagnaafhending er tilbúin fyrir þennan hluta.** Eigandinn á
enn eftir að ákveða: (a) hvort 2 hnitagötin krefjast nýrrar öflunar áður
en #501 hefst, eða hvort #501 má byrja með 54/56 og skrá Keflavík
bæ/Þórshöfn sem þekkt framtíðarviðfangsefni; (b) hvort #500 lokast núna
sem gagnamiði (óháð því að leiðarvélin/#501–#504 er ólokið verk) eða
stendur opinn þar til gögnin eru 56/56. Þetta skjal tekur enga slíka
ákvörðun — sjá `closure-handoff/issue-500-closure-draft.md` fyrir drög
sem eigandinn getur samþykkt eða breytt.

## 7. Afmörkun — ekki hluti af þessari lotu

- **#501** (leiðasamsetning): samsetja leiðir úr samþykktum tengingum,
  leiðarauðkennum og báðum áttum þar sem gögn styðja.
- **#502** (Frá/Til): víxlun og leiðaval í núverandi viðmóti.
- **#503**: veður/færð á valinni leið, sameiginlegur spátími.
- **#504**: heildarflæði og útgáfuþekja.

Engin ný framkvæmdarprompt samin fyrir þessa miða hér. Þetta skjal er
gagnahandoff — enginn nýr kóði, UI-innganga, netöflun eða vörugagnabreyting.

---

## Neðanmálsgreinar — þekkt göt/fyrirvarar umfram almenna EXACT_GAP

[^r1]: Eigandavalið R1 (vestari endi IDFERILL 1436, Rauðavatn). Tvær
    tengingar skráðar sérstaklega: norður (kafli 3, lið 2, `unsupported`)
    og suður/austur í gegnum núverandi fasta leið (kafli 3, lið 3).

[^southcorr]: Hveragerði/Selfoss/Hella/Hvolsvöllur/Vík eru öll fest í
    sama 25-stykkja varðveitta suðurkorridornum (kafli 3, lið 1).
    `driving_access_and_direction: EXACT_GAP` fyrir alla keðjuna — `stored_direction: "rev"` er stafrænt/geometry-merki, ekki lögleg akstursstefna.
    Selfoss og Hella voru sjálf valin af `ALTERNATIVE_NOT_RECOMMENDED`
    endanum í eldri south-connections-greiningu (Selfoss: 30,1 m
    source-bil að næsta kafla, óleyst; Hella: 32,63 m, óleyst) — ekki af
    hinum merkta `RECOMMENDED`-enda. Hveragerði: nafnaályktun á vestasta
    enda retained kaflans, 34,75 m bil að Hellisheiðarkafla (2117) áfram
    óleyst.

[^vik]: Valinn punktur (`vik`, IDFERILL 3849 START) er innri samskeyti
    stykkja 3849/23041 — EKKI sami punktur og endi núverandi fastrar
    `raudavatn-vik` runtime-leiðar (`segments.js`), sem heldur um 629 m
    lengra austur (nákvæmlega stykkislengd 23041 = 629,448 m í
    suðurkorridorinum, kafli 3 lið 1). Vísvitandi vöruval, ekki ný ytri
    tenging eða breyting á runtime-leiðinni.

[^borgarnes]: Sama hnit og #491 P4/`end_borgarnes`, staðfestur END-hnútur
    2819 (OBJECTID 5082, tier -1) í retained WGS84
    (`wfs-vesturland-4326.json`). Eldri `cw_long`-fyrirvari (ekki
    validerað undir `cw_long`-grunni) helst óbreyttur.

[^akranes]: Eldra 2,5 m source-bil að hringtorgsstykki 21441 er áfram
    óleyst (ekki leiðrétt af nýju kortavali); kortamat er ný stoð fyrir
    vörupunkt, ekki leiðrétting á eldri exact-seam-niðurstöðu.

[^dalvik]: Punktur er áfram innri samskeyti sama vegar við IDFERILL 3501
    (innri, ekki ytra samskeyti); kortastaðsetning styður aðeins
    vörupunktinn sjálfan.

[^kbk]: Native-endi er ekki færður í miðju hringtorgs 1/205; source-bil
    að IDFERILL 2409 START er áfram óleyst.

[^hofn]: Flugvallarvegur (982/3170) var EKKI notaður sem bæjarpunktur;
    engin ný eða fullstaðfest Hornafjarðarleið er sýnd.

[^kopavogur]: Punktur er á gegnumvegi (Hafnarfjarðarvegur) sunnan
    Kópavogsdals; vegheiti/stykki tilheyrðu upphaflega sameiginlegu
    Hafnarfjarðar-IDBUTUR — ekki gatnamót.

[^hafnarfjordur]: Þessi punktur (IDFERILL 10287 START) er annar en áður
    afturkallaði 2807 START-tillaga; gamla tillagan er ekki endurvakin.

[^junction]: Reyðarfjörður og Fáskrúðsfjörður: sjónrænt frávik 0–10 m
    áætlað af Ripley, ekki mæld nákvæm snerting; engin ný CC-/Jonesy-
    kortaskoðun. Gömul `CURRENT_CANDIDATE_NOT_SELECTED`-höfnun (um ANNAN
    punkt í hvoru tilviki) varðveitt óbreytt undir `previous_disposition`
    í `selections.json`.

[^vopnafjordur]: END snertir bæði samnefnt stykki 3671 og
    Vopnafjörður-Skógavegur (3182); valinn `seam_with_name` er 3182
    (ekki fyrsta snertistykki eftir röðun).

[^gap2]: Engin retained source-geometry fyrir þennan stað í núverandi
    gagnasetti. `winter-route-remaining-coverage.json` skráir
    `NO_RETAINED_MATCH`. Engin ný öflun gerð í þessari lotu.
