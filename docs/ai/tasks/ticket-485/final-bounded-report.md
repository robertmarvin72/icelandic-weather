# #485 — afmörkuð lokaskýrsla, 2026-11-03

> **Núgildandi lokaniðurstaða: PASS / RESEARCH GO**, afmarkað við sex punkta, fimm breytur og 2026-11-04 kl. 00–23 UTC. Sjá síðari viðbót og lokamat Ripley í result-review-final-probe.md. Fyrri PARTIAL-niðurstaða er varðveitt hér að neðan sem saga.

## Fyrri niðurstaða: PARTIAL

Samþykkt upplýsingasýn: nýjasta tiltæka færð/lokanir á varðveittri Rauðavatn–Vík leiðartengingu, merktar heimild og gagnatíma, ásamt punktaspá á tíma sem notandi velur. Reykjavíkurborgargötur, ETA, spá við komutíma, samfelld veðurþekja og öryggisráðleggingar eru utan umfangs. Núverandi færð verður aldrei túlkuð sem framtíðarfærð.

### 1. Notkunarréttindi: studd fyrir afmarkaða notkun

Opinberar heimildir skoðaðar 2026-11-03, fyrri niðurstöður endurnýttar:

- Vegagerðin: https://www.vegagerdin.is/vegagerdin/gagnasafn/vefthjonustur/skilmalar-vefthjonustur — gildissvið nær til gagna á gagnaþjónum, sérstaklega færðargagna, nema annað sé tekið fram. CC BY 4.0 styður birtingu og vistun staðreyndagagna. Þetta er rökstudd beiting almennra skilmála á faerd2017_1/faerdpunktar2017_1, ekki sértækt leyfisbréf. Engin gagnstæð sértakmörkun fannst í fyrirliggjandi þjónustugögnum. Birta þarf heimild, gagnasett, öflunartíma og leyfistengil; aðgreina breytingar og forðast staðfestingar-/stuðningsfullyrðingar. Ekki endurbirta ritvarið skýrsluefni, merki eða óstaðfest efni þriðja aðila; fyrstu sýn takmarkast við færðar-/lokunarstaðreyndir. Opinberar lokanir ganga framar sjálfvirkum/eldri gögnum. Engin trygging um tiltækileika eða réttleika.
- Open-Meteo: https://open-meteo.com/en/pricing og https://open-meteo.com/en/terms — greidd áskrift styður atvinnunotkun á customer-hýsli; gögn undir CC BY 4.0 með heimildum, leyfistengli og breytingamerkingu. Eigandastaðfest API Standard endurnýtt úr #453 og owner-clarification-2026-11-02.md. Heimildamerkt birting og tímabundin vistun gagnanna studd; lykill aldrei afhentur notendum. Almennur ókeypis hýsill ekki notaður. Kvótastaða og framleiðslurekstur ekki staðfest í þessari rannsókn.

### 2. Greidd aðgangs-/spáprófun: engin nothæf svargögn

Punktarnir sex, uppruni hnitanna, breytur, einingar, 24 klst. UTC-gluggi og fullnægjandi svar voru skráð í final-bounded-plan.md áður en nettilraun hófst. Áætlunar-SHA256 við tilraun: 7c5d61f8efe5ebc63be3a335552dac1e019c07529f66e64694cddb5dc6b1c9a2.

Fyrsta staðbundna undirbúningsskipun stöðvaðist við import á requests (ekki uppsett), áður en nokkur netbeiðni eða niðurstöðuskrá varð til. Ekkert sett upp; notað var staðlað urllib.request úr Python í staðinn. Þetta var einnota skipun, ekki nýr rannsóknarbiðlari. Gamli biðlarinn var hvorki notaður né breyttur.

Ein customer-tilraun var gerð 18:05:37 UTC með staðbundnum lykli úr .env.local. Engar endurtekningar, engar fylgdar áframsendingar og engin yfirfærsla á almenna þjónustu. Staðlað TLS; beinn aðgangur án proxy. Tilraunin lauk með URLError áður en HTTP-svar fékkst. Undirliggjandi orsök er UNKNOWN: undantekningatexti var ekki varðveittur til að forðast mögulega birtingu lykilslóðar. Ekki fullyrt að þjónustan hafi móttekið beiðnina, að þetta sé höfnun lykils eða að gögn vanti hjá þjónustunni. Engin svargögn, einingar, tímaraðir eða ný spáþekja staðfest. Lykill/slóð með lykli ekki skrifuð í rannsóknarskjöl eða annál.

Vélrænn niðurstöðuvottur: final-bounded-result.json. attempts=1 merkir eina staðbundna nettilraun, ekki staðfesta móttöku eða reikningsfærslu þjónustunnar. Ekkert sýni varð til og því engin sýnis-SHA256.

### 3. Endurnýtt og lokamörk

HTTPS-prófanir Vegagerðarinnar frá 2026-11-02 endurnýttar úr samples/manifest.md; ekki enduropnaðar. Leiðar-IDBUTUR-tenging #483 endurnýtt fyrir færðarkafla; engin ETA-/aksturslengdarvinna gerð. Engar nýjar Vegagerðar-gagnabeiðnir.

PARTIAL: réttindamatið styður þrengdu sýnina en tæknileg staðfesting greiddra punktaspáa tókst ekki. Því engin GO-niðurstaða fyrir alla samþykktu sýnina, en hvorki sönnuð óheimil notkun né tæknilegt NO-GO. Eina ólokna prófunaratriðið er nothæft customer-svar fyrir frysta sex-punkta gluggann (nýr framtíðargluggi þyrfti að vera skráður ef prófað síðar). Það er ekki krafa um fullgerðan rannsóknarbiðlara eða leiðarvél. Engin frekari rannsókn/viðgerð hafin; eigandi ákveður hvort þetta verði tekið upp síðar. Engin innleiðing, birting, GitHub-breyting, commit eða push.

---

## Viðbót, 2026-11-03 (síðari tilraun, `approved-prompt-v10.md`): RESEARCH GO fyrir prófaða gluggann

Þessi viðbót eyðir ekki fyrri tilraun hér fyrir ofan (URLError-tilraunin 18:05:37 UTC stendur óbreytt sem sjálfstæð, fyrri skráning). `final-probe-request.md` skráði lykillausa beiðnilýsinguna — óbreytt sex punktar/röð/breytur úr `final-bounded-plan.md`, sama 24 klst. UTC-glugginn (`start_hour=2026-11-04T00:00`, `end_hour=2026-11-04T23:00`, þar sem hann var enn algjörlega framundan kl. 18:18:46 UTC) — áður en nokkur netbeiðni var send.

**Lykill/umhverfi:** `OPEN_METEO_API_KEY` fannst ekki í process-umhverfi en var til í einni línu í `.env.local`; lesinn aðeins í minni, hvorki prentaður né skrifaður í neitt skjal eða annál. `HTTP_PROXY`/`HTTPS_PROXY` voru hvorki stillt (nei/nei). Engin breyting á stillingum. Verkfærisumhverfið þurfti netheimild fyrir þessa einu samþykktu beiðni — hennar var óskað og hún veitt fyrir þessa einu keyrslu, ekkert framhjáhlaup takmarkana.

**Framkvæmd:** Samkvæmt CC var einnota Node-skrifta keyrð sem tímabundin `.mjs` skrá í scratchpad utan verkefnisins og fjarlægð eftir keyrslu, innbyggt `fetch`, `redirect: "error"`, `AbortSignal.timeout(30000)`, 1 MiB þak við streymislestur. Engin endurtekning, engin önnur beiðni. GET `https://customer-api.open-meteo.com/v1/forecast`, sex hnit í einni beiðni, `hourly=temperature_2m,wind_speed_10m,wind_gusts_10m,precipitation,weather_code`, `temperature_unit=celsius`, `wind_speed_unit=ms`, `precipitation_unit=mm`, `timezone=UTC`, `start_hour=2026-11-04T00:00`, `end_hour=2026-11-04T23:00`. Keyrslutími: beiðni send 18:20:07.423Z, svar móttekið 18:20:07.670Z (247 ms).

**Svar:** HTTP 200. 8 494 bæti lesið (ekki skorið niður, undir 1 MiB þakinu). Nákvæmlega sex niðurstöður, í umbeðinni röð — sannreynt með S2-haversine-prófi: fjarlægð hvers skilaðs reits til allra sex umbeðnu punktanna reiknuð úr frystum hnitum; hver niðurstaða er nánust SÍNUM eigin umbeðna punkti (mesta fjarlægð punkts-til-eigin-umbeðna-punkts: 2,97 km, punktur 5; engin jafntefli). Fyrir hvern af sex punktum: öll 24 skráð UTC-klukkustundagildi (`2026-11-04T00:00`…`2026-11-04T23:00`) í réttri röð; allar fimm 24-staka talnaraðir — `temperature_2m`, `wind_speed_10m`, `wind_gusts_10m`, `precipitation`, `weather_code` — án null/óendanlegra gilda; einingar `°C`/`m/s`/`m/s`/`mm`/`wmo code` samkvæmt `hourly_units` í svarinu; `utc_offset_seconds=0` fyrir alla sex. Umbeðin hnit og skiluð reits-/hæðarhnit eru aðgreind og varðveitt saman (sjá sýnistöflu hér neðan) — stök reitasýni sannar EKKI samfellda leiðarþekju.

| Punktur | Umbeðin hnit | Skiluð reitshnit | Hæð (m) | Fjarlægð til umbeðins punkts |
|---|---|---|---|---|
| P1 | 64.01137995, -21.25070175 | 64.00315, -21.246933 | 287 | 0,93 km |
| P2 | 63.96197548, -21.11948637 | 63.960835, -21.104675 | 16 | 0,73 km |
| P3 | 63.90527541, -20.59094600 | 63.912666, -20.590302 | 43 | 0,82 km |
| P4 | 63.82344501, -20.36083533 | 63.82356, -20.34851 | 29 | 0,60 km |
| P5 | 63.54962230, -19.76249937 | 63.52445, -19.782333 | 14 | 2,97 km |
| P6 | 63.41954011, -19.00662528 | 63.418705, -19.016129 | 10 | 0,48 km |

**Varðveitt sýni:** `docs/ai/tasks/ticket-485/final-probe-sample.json` — lykillaust, afmarkað JSON með sex punktum, umbeðnum og skiluðum hnitum, 24 tímagildum, einingum og þessum fimm röðum fyrir hvern punkt. SHA256 `c9d97d6493f0ac6e88597b30d3928ab905d3aca567f86ac533ad9f6cfcc0eea8` (19 086 bæti). Skoðað í minni fyrir lykilsgrunda texta áður en vistað — hvergi finnst `apikey`-strengur eða gildi lykilsins í sýninu; skrifta skráði innbyggða öryggisathugun (samanburð á fullum JSON-streng við lykilinn í minni) sem hefði bælt úttak hefði lykillinn fundist þar — það gerðist ekki.

**Niðurstaða: RESEARCH GO**, afmarkað við þennan prófaða 24 klst. UTC-glugga, þessa sex punkta og þessar fimm breytur, samkvæmt S1. Öll fullnægjandi-svars-skilyrði #2–#4 í `approved-prompt-v10.md` standast fyrir alla sex punktana. Réttindamatið í `final-bounded-plan.md` er endurnýtt óbreytt. Önnur spáhorizon, kvótastaða, staðfestur Production-/Preview-lykilrekstur og endurtekin hegðun eru áfram UNKNOWN — engin ný próf gerð á þeim. Þetta er ekki almenn product-GO, birtingarheimild eða staðfesting á innleiddum rekstri (Production/Preview) út frá þessari staðbundnu keyrslu.
