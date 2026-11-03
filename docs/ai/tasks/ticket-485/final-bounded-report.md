# #485 — afmörkuð lokaskýrsla, 2026-11-03

## Niðurstaða: PARTIAL

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
