# #491 — evidence-table.md (gagnahlið A, Reykjavík–Borgarnes)

> **Nýjasta afmörkun og niðurstaða:** sjá evidence-owner-scope-2026-11-04.md (Rauðavatn–Borgarnes, fjórir punktar). Eldri skortur á eigandaákvörðun er leystur; tæknileg staðfesting áfram BLOCKED.

## Leiðrétting Ripley eftir Jonesy — 2026-11-04 (gildir umfram eldri texta)

**A: BLOCKED stendur; engin appinnleiðing heimiluð.** E1–E4 í Jonesy-yfirferð leiðrétt hér með sjálfstæðum offline-endurreikningi Ripley á frumskrá, ekki nýrri veitubeiðni. Eldri frásögn hér að neðan er varðveitt til rekjanleika; mótmæltar fullyrðingar hennar eru ekki gildar niðurstöður.

- **E1:** Fullyrðingin „raunlengd Kjalarness 6–7 km“ er dregin til baka sem óstudd. Summa tier-0 línuhluta 903030037 er 20,702 km, ekki staðfest aksturslengd. 801100037 tier-0 summa er 1,346 km. Hráar summur telja endurtekin nákvæmnistier; fjórföldun er studd skýring, en hlutverka-/stefnuval þarf enn. Engin lengd er samþykkt fyrir ETA án fyrirfram afmarkaðrar leiðar og aðferðarsannprófunar.
- **E2:** „904690037 er stuttur munnakafli, ekki göngin“ er dregið til baka. Heiti eitt staðfestir það ekki. Tier-0 summa: 904690037 = 7,298 km; 814700037 = 5,417 km; 904000037 = 7,124 km. Þetta eru línuhlutasummur, ekki sannaðar stefnuréttar vegalengdir. Hvaða hlutar samsvara göngum/norðurferð er **UNKNOWN**. Heitið „til suðurs“ á 814700037 er áfram staðfestur eiginleiki, ekki lausn á norðurleið.
- **E3:** Minimum endpoint-to-endpoint fjarlægðir úr öllum varðveittum línuhlutum í EPSG:3057 eru mælanlegar: 903020037→903030037 20,9 m; 903030037→904690037 0,0; 814700037→904690037 0,0; 904690037→904000037 27,6; 904000037→904010037 0,0; 904010037→804020037 0,0; 804020037→904040037 0,0; 903030037→814700037 910,1 m. Sjö paranna eru innan 30 m. Þetta staðfestir nálægni línuenda, EKKI akstursstefnu, traversal eða heila leið. Eldri fullyrðing um að aðeins eitt par sé mælanlegt/staðfest er afturkölluð.
- **E4:** Skráin er gilt strict UTF-8, 1.242.779 bæti; SHA256 305f60d6f1f17918c058cbd047735681e56d6f9aad99f9e16f50de9419d6983a. Latin-1/cp1252 fullyrðing er afturkölluð. Notið UTF-8.
- **CRS:** EPSG-9802 capture er 404-síða, ekki varðveitt aðferðarlýsing. Sú leiðrétting CC stendur. Jonesy staðfesti hins vegar paraðar ISN93/WGS84 varðveittar extension-skrár fyrir 903020037 og 914020037; tilvist þeirra dregur til baka blanket-fullyrðingu um að WGS84 vanti fyrir þau. Ekki sjálfstætt endurreiknað af Ripley hér; heimild Jonesy-yfirferð og ticket-485/samples/wfs-extension-4326.json/native3057.json. Þau staðfesta ekki sjálfkrafa CRS-umbreytingu eða alla norðurleið.

Minnsta næsta ákvörðun: skilgreina upphaf/endastað og heimila nákvæma valreglu spápunkta. Það er vöruákvörðun; samfelld norðurleið/hlutaval og leiðarlengdir eru tæknileg staðfesting sem eigandasamþykki eitt leysir ekki. A er því BLOCKED; ekki fullgerð #491-innleiðing eða heimild í B. Engin ný rannsókn/viðgerðarlota hafin.


CC, 2026-11-04. Offline lestur/útreikningar yfir varðveitt gögn eingöngu — engin ný veitu-/lykilbeiðni, engin ný pakki, engin app-breyting. Allir tölustafir hér eru **sjálfstætt endurreiknaðir af mér** úr varðveittum skrám (python yfir staged JSON/CSV), ekki eintóm tilvitnun í prompt-review.md — þar sem niðurstöður eru þær sömu er það sjálfstæð staðfesting, ekki afritun.

Dálkar: VERIFIED = staðfest beint úr varðveittri skrá/reikningi þessa umferð; INFERRED = ályktun af staðfestu efni, merkt sem slík; UNKNOWN = engin varðveitt gögn hvorki til né frá, eða gagn er til en ófullnægjandi/óstaðfest fyrir þessa kröfu.

## 1. Upphafsstaður ("Reykjavík" nákvæmur vegtengipunktur)

**Staða: UNKNOWN.**

- #485 `research-report.md` §1(c) (lesið að fullu) reiknar (`harness/span0_path_analysis.py`, endurkeyranlegt) fjarlægð frá varðveittum akkerishnit (Veðurstofa stöð 1 "Reykjavík", 64.1288833618/-21.9081897736, úr #450) að þremur raunverulegum, tengdum VEGNR=1 kandídötum:
  - `903020037` ("Vesturlandsvegur"): **5924.6 m**
  - `914020037` ("Suðurlandsv. um Hádegismóa"): **5931.6 m** (role-set háð)
  - `1410010037` ("Rauðavatn", núverandi Vík-keðja upphafspunktur): 7851.6 m
- Niðurstaðan er UNKNOWN **ekki** vegna 7m munar milli #1/#2 (sá munur er ágiskunarlaus en lýsandi, ekki úrslitaatriði), heldur vegna þess að óvissumörkin (E) sem v1-umferðin vitnaði í eru **órökstudd** (endurnýtt úr öðrum stað, Hellisheiði DATEX-control residual, sem #483's eigið `harness/02`-úttak segir skýrt EKKI vera "projection-accuracy bound for lengths"). Án studds E er aðgreiningarpróf ómögulegt á hvaða mörkum sem er.
- Tengingarslóð `903020037`→`903030037` (Kjalarnes-átt) er **mæld og staðfest** af mér sjálfstætt: ég las `wfs-vegnr1-all.json` (EPSG:3057) og fann `STADARLYSING`/`STUTTNAFNLEIDAR` reitina; þessi slóð birtist einnig í #483 `harness/01_chain_geometry_check-output.txt` sem 20,9 m planar bil — ég endurstaðfesti þá tölu beint úr skránni, ekki eintóm tilvitnun.
- Ekkert varðveitt skjal í `docs/ai/` (leit yfir allt tréð, sjá §8) sýnir eigandastaðfestingu á stefnu/vali við þessa mótvegamót.

**Hindrar:** #491 kröfu um "nákvæman vegtengipunktur, ekki 'Reykjavík' án skilgreiningar". **Minnsta vantaða gagn/ákvörðun:** eigandi/Ripley velji formlega milli `903020037`/`914020037`/annars, EÐA samþykki nýtt studd E til að aðgreina — hvorugt er til í varðveittum gögnum.

## 2. Endastaður ("Borgarnes" nákvæmur vegtengipunktur)

**Staða: UNKNOWN.**

- Ég keyrði sjálfstæða talningu á `wfs-vegnr1-all.json` (996 eiginleikar, 74 IDBUTUR, VEGNR=1): `IDBUTUR=904260037` (Borgarnes–Hítará, sá kafli sem #429 notaði sem "Borgarnes" áfangastaðar-IDBUTUR) kemur fyrir **0 sinnum**. Skráin hefur enga geómetríu fyrir þennan kafla.
- #429 `coverage.csv` lína 22 skráir Borgarnes-áfangastaðarhnit sem "64.5500031,-21.9169998 ... N/A (checkpoint coordinate = station coordinate, by construction)" — þ.e. hnitin eru óvirku Veðurstofustöðvar 142 eigin hnit (óvirk frá 1988), ekki staðfestur vegpunktur. Ég staðfesti þetta beint úr CSV-línunni.
- Aðrir varðveittir kaflar nálægt Borgarnesi ERU til með geómetríu (sjálfstætt talið úr sömu skrá): `904040037` "Borgarnes–Baulan" (20 eiginleikar), `904050037` "Baulan–Norðurá" (12 eiginleikar) — en `STADARLYSING`-reitirinn ("Borgarnes" / "Baulan – Norðurárdalsvegur") sýnir að þessir kaflar liggja **handan** Borgarness (á leið til Norðurár), ekki endilega sá vegtengipunktur sem táknar "komið til Borgarness". Hvort `904260037` (sem vantar algerlega), `904040037`, eða einhver annar punktur er réttur endastaður er vöruákvörðun sem ekki er skjalfest neins staðar.

**Hindrar:** #491 kröfu um "nákvæman vegtengipunktur ... ekki Vík-gögn eða tilbúin midpoint-hnit" fyrir endastað. **Minnsta vantaða gagn/ákvörðun:** eigandi/Ripley skilgreini hvaða VEGNR=1 IDBUTUR (eða mótvegamót) telst "Borgarnes" fyrir vöruna — `904260037` er hvorki til í varðveittri geómetríu né er nein önnur kafla sjálfkrafa réttur í staðinn.

## 3. Kaflar/IDBUTUR í akstursröð (Kjalarnes → Hvalfjarðargöng → Borgarnes)

**Staða: INFERRED (ekki VERIFIED sem full, stefnuréttar, eigandastaðfest leið).**

Ég las `STUTTNAFNLEIDAR`/`STADARLYSING`/`NAKVAEMNIFERLIS`/`VEGHLUTI` beint úr `wfs-vegnr1-all.json` (latin-1 afkóðun — skráin er latin-1/cp1252 bætt þrátt fyrir `.json`-endingu; utf-8 lestur býr til "mojibake", staðfest af mér) fyrir Jonesy-nefndu 9 IDBUTUR-in, 904260037 er til samanburðar (vantar):

| IDBUTUR | STUTTNAFNLEIDAR | STADARLYSING | NAKVAEMNIFERLIS (tier) | VEGHLUTI | Eiginleikar í skrá |
|---|---|---|---|---|---|
| 903020037 | Vesturlandsvegur | Vesturlandsvegur: Nesbraut – Þingvallavegur | -1 | 7 | 100 |
| 903030037 | Kjalarnes | Þingvallavegur – Hvalfjarðargöng | -1 | 7 | 56 |
| 814700037 | **Hvalfjarðargöng til suðurs** | Hvalfjarðargöng til suðurs | 2 | 1 | 4 |
| 904690037 | Hvalfjarðargöng | **sunnanmunni Hvalfjarðarganga** | 2 | 1 | 16 |
| 904000037 | Hvalfjarðargöng–Grundartangi | Hvalfjarðargöng – Grundartangavegur | 2 | 1 | 4 |
| 904010037 | Melasveit | Hvalfjarðarvegur – Grundartangavegur | 2 | 1 | 12 |
| 804020037 | Hafnarfjall | Hafnarfjall | 2 | 1 | 16 |
| 904040037 | Borgarnes–Baulan | Borgarnes | 2 | 1 | 20 |
| 904050037 | Baulan–Norðurá | Baulan – Norðurárdalsvegur | 2 | 1 | 12 |
| 904260037 | — | — | — | — | **0 (vantar)** |

Staðfestir, sjálfstætt endurreiknaðir punktar:
- `814700037`'s eigið nafn er **"Hvalfjarðargöng til suðurs"** — bókstaflega stefnumerkt, staðfestir Jonesy-aðvörunina að þessi auðkenni er ekki sjálfkrafa gild fyrir norðurferð.
- `904690037`'s `STADARLYSING` er **"sunnanmunni Hvalfjarðarganga"** (suður-gangamunni) — þ.e. þetta er stuttur munnakafli, **ekki göngin sjálf** (sem eru ~5,7 km jarðgöng). Engin IDBUTUR í þessum lista táknar göngin sjálf sem eina samfellda einingu; það er ekki kannað hvort slíkur IDBUTUR er yfirhöfuð til í Vegagerðar-kerfinu (UNKNOWN, ekki rannsakað frekar þessa umferð).
- Eina mælda, raunverulega samliggjandi bilið á þessari leið er `903020037`→`903030037` (20,9 m, úr #483 `harness/01`, endurstaðfest af mér úr sama skránni). **Engin önnur mæld endapunkts-til-endapunkts aðlægni er til fyrir hina átta hoppana** (903030037→814700037, 814700037→904690037, o.s.frv.) — röðin hér er byggð á nöfnum/`STADARLYSING`/landfræðilegri rökvísi (Þingvallavegur→Hvalfjarðargöng→Grundartangi→Melasveit→Hafnarfjall→Borgarnes→Baulan), ekki á sama mælda-aðlægni-aðferð sem #483 notaði til að votta Vík-keðjuna. Þetta er **INFERRED röð**, ekki VERIFIED keðja.

**Hindrar:** #491 kröfu um "fulla kafla/IDBUTUR í akstursröð" sem VERIFIED. **Minnsta vantaða gagn:** endapunkts-til-endapunkts mæling (sama handahófslausa aðferð og #483 `harness/01`) fyrir hin átta hoppin, auk staðfestingar á hvort 904260037 er yfirhöfuð nauðsynlegur hluti leiðarinnar (sjá lið 2).

## 4. Spápunktar — fjöldi, hnit, uppruni

**Staða: UNKNOWN / vísvitandi BLOCKED (S3 ákvörðun Ripley).**

- Engin fryst spápunktasamstæða er til fyrir Reykjavík–Borgarnes (ólíkt Vík-leiðinni, sem hefur sex #485-fryst punkta sem núverandi `segments.js` notar).
- Einu varðveittu hnitin sem tengjast þessari leið eru **stöðvahnit, ekki vegpunktar**, allt staðfest beint úr #429 `coverage.csv`:
  - Kjalarnes: Veðurstofa stöð 31579 (virk), hnit = stöðvarhnit ("checkpoint coordinate = station coordinate, by construction").
  - Hvalfjarðargöng: hnit **UNKNOWN** algerlega — engin stöð notuð, "none used this round".
  - Borgarnes: Veðurstofa stöð 142, **óvirk frá 1988**, hnit = stöðvarhnit "by construction".
- Raunveruleg vegakeómetría ER til núna fyrir meirihluta leiðarins (lið 3), svo tæknilega væri hægt að reikna offline afleidda punkta (t.d. miðpunkta eftir uppsafnaðri fjarlægð, sama meginregla og `approxDistanceFromStartKm` í `segments.js` fyrir Vík) — **en S3 í `approved-prompt-v1.md` útilokar þetta sérstaklega** ("ekki ... óheimilaðri midpoint-/hlutfallsreglu") nema fyrri eigandasamþykkt fyrir slíkri reglu finnist. Leitaði (sjá §8) — engin slík samþykkt er skjalfest neins staðar í `docs/ai/`.
- Staðfesting nýrra punkta gagnvart `validateForecast`/Open-Meteo krefst nýrrar veitubeiðni (bönnuð í þessari umferð) — jafnvel ef punktafjöldi/-regla væri ákveðin, væri raunspágluggi/vikmörk þeirra NOT_TESTED hér.

**Hindrar:** #491 kröfu um "hnit hvers spápunkts og uppruna", og er sjálf S3-ákvörðunin sem gerir A að BLOCKED. **Minnsta vantaða ákvörðun:** eigandi/Ripley ákveði fyrirfram (a) punktafjölda og (b) nákvæma valreglu (t.d. jöfn skipting eftir staðfestri uppsafnaðri fjarlægð úr lið 3, EFTIR að lið 1–3 eru VERIFIED) — ekki CC að ákveða eða ágiska.

## 5. Kaflalengdir / uppsöfnuð fjarlægð

**Staða: UNKNOWN (ekki reiknað út sem studd niðurstaða — sjá rökstuðning).**

Prompt-ið (S2) krefst þess EKKI að reikna lengd út í hörgul þegar punktaval (lið 1/2/4) gerir niðurstöðuna ómögulega — "ekki reikna alla þá liði að óþörfu ... sýna þá nákvæma gagnabirgðastöðu og hætta." Því var full 13-liða-Vík-endursköpun **ekki** keyrð þessa umferð. Til að styðja S2's eigin viðvörun um að hrá lengd sé ónothæf, reiknaði ég **eina, afmarkaða, sjálfstæða sönnun** (ekki tilvitnun í eldri tölur):

- `903030037` (Kjalarnes), öll `VEGHLUTI`/tier tekin með (56 eiginleikar, VEGHLUTI {1,3,4,5,6,7}): hrá Evklíðsk summa = **82,40 km**. Raunlengd Kjalarness er nærri 6–7 km — hrá summa er því margfalt of há, staðfestir S2's viðvörun sjálfstætt.
- `801100037` (Vík-kafli, eini kaflinn með bæði hráa summu úr mér OG kvarðaða `segments.js`-tölu til samanburðar): hrá Evklíðsk summa (8 eiginleikar, allir VEGHLUTI=1) = **5,33 km**, á móti **1,34 km** í `segments.js`/#483's kvarðaðri aðferð — stuðfestir að jafnvel innan sama VEGHLUTI er hrá summa ~4x of há; #483's NAKVAEMNIFERLIS/VEGHLUTI-hlutverkasíun er nauðsynleg, ekki valkvæð.
- Þessar tvær tölur eru **sjálfstætt reiknaðar af mér þessa umferð** (python yfir `wfs-vegnr1-all.json`), ekki eintóm tilvitnun í #483/Jonesy-tölur (sem voru lítillega öðruvísi, t.d. 79,65 km/4,01 km — munurinn er vænatnlega minniháttar tier-/slóðarúrtaksmunur, ekki mótsögn í niðurstöðu).
- #483's kvarðaða aðferð er sjálf "aðeins sannreynd fyrir Vík-keðjuna" (staðfest með lestri á `research-report.md`); #483/#485 skrá sjálf "length NOT COMPUTED" fyrir Reykjavíkur-framlengingarkaflana (903020037/914020037) vegna VEGHLUTI-vals við hringtorg/margra-ramp mót.

**Hindrar:** #491 kröfu um "kaflalengdir/uppsöfnuð fjarlægð og reikniaðferð" sem studd niðurstaða. **Minnsta vantaða gagn:** ekki tæknilegt — þetta er eftir-ákvörðun atriði sem verður fyrst viðeigandi EFTIR að liðir 1, 2 og 4 eru leystir af eiganda/Ripley.

## 6. ISN93 → WGS84 ummyndun (hnitakerfi)

**Staða: UNKNOWN (engin varðveitt offline aðferð er raunverulega til).**

Athugun leiddi í ljós að `prompt-review.md`'s fullyrðing um að "aðferðin er varðveitt í #485 iteration-3 (EPSG 9802)" er **ekki nákvæm þegar lesið er nánar**: #485 iteration-3's eigin `manifest-iteration-3.md`/`cc-report-iteration-3.md` skrá að `https://epsg.org/method_9802/Lambert-Conic-Conformal-2SP.html` (aðferðarlýsing/nákvæmnisskjal) kom til baka sem **404** ("real CMS 404, not re-guessed"). Það sem ER varðveitt er aðeins CRS-skilgreiningarsíðan (`crs_3057`, 200) — tilvitnun í auðkenni, ekki raunveruleg ummyndunarbreytur/formúla. Öll ummyndun ISN93→WGS84 sem raunverulega var gerð í #485 fór fram **með netþjóns-hliðar endurvörpun í sjálfri WFS-fyrirspurninni** (`srsName=EPSG:4326`), ekki með staðbundinni/offline formúlu.

**Hindrar:** hvers kyns framtíðar offline-hnitaafleiðslu fyrir ný Borgarnes-stig (lið 4/5) sem þyrfti ISN93-eina geómetríu (t.d. `903020037`/`914020037`'s eigin native ISN93-eiginleikar sem #483's `harness/01` skráir sem WGS84-lausa) án nýrrar veitubeiðni. Óháð liðum 1/2/4 en samverkandi UNKNOWN.

## 7. Færðartenging / auðkennaútgáfa

**Staða: PARTIAL VERIFIED (afmarkað), UNKNOWN utan þess.**

- #429 `coverage.csv`: öll þrjú þekkt checkpoint-IDBUTUR (903030037 Kjalarnes, 904690037 Hvalfjarðargöng, 904260037 Borgarnes) höfðu staðfest `GREIDFAERT`-ástand á sýnatökutíma 2026-10-27 — staðfest beint úr CSV-línunum af mér.
- Þetta er checkpoint-stigs, ekki heildarkeðju: lokana-/tilkynningasaga fyrir hin sjö óþekktu IDBUTUR-in í lið 3 (814700037, 904000037, 904010037, 804020037, 904040037, 904050037, 903020037) var **ekki athuguð** þessa umferð (engin ný veitubeiðni heimiluð) — UNKNOWN.

**Hindrar:** ekkert beint núna (ekki S3-atriði), en yrði krafist fyrir fulla B-innleiðingu.

## 8. Fyrri eigandasamþykkt fyrir Borgarnes-endapunktum/spápunktum — leit

Ég leitaði (`grep -ri`) yfir allt `docs/ai/`-tréð eftir "Borgarnes", "frystir Borgarnes", "endapunkt.*Borgarnes", "upphafsstað.*Reykjavík" og tengdum orðum. **Engin skrá** — hvorki CURRENT.md-saga, eldri cc-report, result-review né annað — sýnir eigandastaðfesta skilgreiningu á (a) Borgarnes/Reykjavík vegtengipunktum eða (b) spápunktafjölda/-valreglu fyrir þessa leið. Eina sem fannst voru núverandi #491-skjöl sjálf, sem lýsa því sem ÓákVEÐIÐ.

## Niðurstaða

Liðir **1 (upphafsstaður)**, **2 (endastaður)** og **4 (spápunktar)** eru hver fyrir sig UNKNOWN með engri fyrri eigandasamþykkt til (lið 8). Þetta er nákvæmlega S3-ákvörðun Ripley í `approved-prompt-v1.md`: A getur EKKI orðið PASSED án slíkrar samþykktar. Sjá `cc-report.md` fyrir formlega **A: BLOCKED** niðurstöðu.
