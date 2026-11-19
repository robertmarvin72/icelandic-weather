# #501 B2-LOCAL-GEOMETRY-ATTEMPT-2 — Jonesy result review

## Jonesy result review — umferð 1 (2026-11-17)

**Niðurstaða: INCOMPLETE — enn engin B2-niðurstaða; ekki PASS á B2.** Persistence-/flokkunarviðgerðin (R1–R3) virkar eins og lofað var og er sandbox-staðfest. En **400-svarið er næstum örugglega afleiðing af galla í beiðninni sem CC sendi sjálft: tvö `Host` hausar** — ekki „raunveruleg höfnun þjóns á nákvæmlega samþykktu beiðninni“ eins og `retry-report.md`/`cc-report.md` segja. Ályktun CC (að stoppa B2 vegna tveggja ólíkra bilana) hvílir því á rangri forsendu; eigandi þarf að fá réttar upplýsingar áður en hann ákveður (sjá JH1 og „Ákvörðun“).

Merking: **sandbox** = staðfest af mér úr stöguðum skrám/staðbundnum prófum á 127.0.0.1 (ekkert net, ekkert keyrt á vél eiganda). **CC-eignað** = sem CC segir um keyrslu á Windows.

### Sandbox-staðfest
- Ledger/raw/marker eru til og samræmd: HTTP 400, `Content-Type: text/html`, `Content-Length: 157` = `byte_count 157`, SHA-256 `261c4ca7…86b0` stemmir við raw `.bin` (nginx stock-síða, ekki WFS `ServiceExceptionReport`); marker `2026-11-17T19:01:22Z`, URL = manifest (`sha256("GET "+url)` = 87190830…35fe, óbreytt frá attempt-1). Wrapperinn flokkaði rétt (`failed/http_status_400`, ekki JSON-parse) og `main()` skilaði eðlilega — **fyrsta alvöru-sönnun þess að R1–R3 virkar gegn raunþjóni**.
- O3: `b2-geometry/dispatch-marker…json` (sha `cfa658af…`) og `b2_fetch.py` (sha `bbf057b5…`) stemma við tölur CC; mtime báðar óbreytt frá fyrri lotu ⇒ fyrra attempt ósnert.
- R3: `python3 -I b2_fetch.py --self-test` á minni Linux/Python 3.13.18: **13/13 PASS** (8 tilvik + 5 fixtures) — líka þau sem hrundu í fyrri útgáfu. Ekkert skilið eftir í möppunni (`.selftest-tmp` hreinsað).

### Athugasemdir
**JH1 — duplicate `Host` hausar (sýnt; líklegasta orsök 400).** `b2_fetch.py` línur 270–271 gera `conn.putrequest("GET", …)` og svo `conn.putheader("Host", parts.netloc)`. `putrequest` bætir **sjálfkrafa** við `Host` (nema `skip_host=True`), svo beiðnin fer með tvo `Host`-hausa. Ég endurgerði nákvæmlega þessa runu gegn raw-socket þjóni á 127.0.0.1 og tók upp bætin: beiðnin inniheldur `Host: <auto>` og `Host: gagnaveita.vegagerdin.is`, **2 Host-línur**. RFC 9112 §3.2 segir að þjónn **MUST** svara 400 við HTTP/1.1 beiðni með fleiri en einni Host-línu; nginx gerir það og skilar sinni stock-„400 Bad Request“ síðu — nákvæmlega það sem raw-skráin sýnir (hegðun nginx sjálfs er ekki endurgerð í sandbox; ég hef ekki nginx). Annað sem er óvenjulegt við þessa beiðni miðað við beiðnir sem hafa tekist (metadata DescribeFeatureType í Node, `bounded_fetch.py` með `conn.request`) er ekkert: sama URL-snið og sömu aðrir hausar. **Sama mynstur var í `b2-geometry/b2_fetch.py` (attempt-1)** — svarið sem týndist hefur því að líkindum einnig verið 400. **Báðar tilraunir voru líklega dæmdar til að mistakast vegna sama client-galla; engin þeirra hefur spurt þjóninn um B2.**
**JH2 — prófin gátu ekki fundið þetta, og ég missti af því líka.** Ekkert af 13 prófunum staðfestir **beiðnisbætin** (hausa) — mock-þjónarnir samþykkja hvaða haus sem er. O1 mín (prófa sama `bounded_get`) tryggði sama kóða en ekki þetta atriði. Auk þess las ég sömu tvær línur í `b2-geometry/b2_fetch.py` í fyrri result review og tók ekki eftir tvöföldum Host — það er mín yfirsjón; JG-listinn var ófullnægjandi að þessu leyti.
**JH3 — framsetning í skýrslum.** `retry-report.md` segir „server rejected the exact approved request“ og leggur til að hætta B2 eða rannsaka 400 með „deliberately different formulation“. Rétt framsetning: *URL-ið var það sem samþykkt var, en beiðnin á vírnum var ekki sú sem prompt lýsti (hún hafði gallaðan haus)*; ráðlegging um að „stoppa vegna tveggja ólíkra bilana“ byggir á forsendu O6 sem stenst ekki. CC gat ekki vitað þetta án þess að skoða bætin; ekkert bendir til óheiðarleika — en skýrsluorðalag þarf leiðréttingu (Ripley getur gert það beint í lokamati).
**JH4 — smáatriði.** `Connection: close` í svarinu er val þjónsins (nginx lokar eftir 400), ekki afleiðing af haus frá client — rétt hjá CC. Eftirstandandi: ledger-skrift á tveimur stöðvum (eftir marker, eftir getresponse, í finally) sést í kóða og virkaði; ekkert þarf að breyta þar.

### Ákvörðun (eigandans, ekki mín)
Staðan er ekki „tvær ólíkar bilanir, stöðva“, heldur „sama client-galli tvisvar; B2 óspurt“. Valkostir:
1. **Hætta B2** og skrá bilið (34,7 m af 45,7 km, 0,08 %) sem gagnagat/eigandaákvörðun — gilt, ódýrast, og verðmæti líklegrar niðurstöðu er lágt („ekkert nýtt í boxinu“).
2. **Ný, skýrt heimiluð attempt-3 með smæsta fixinu:** eyða `conn.putheader("Host", …)` (eða nota `skip_host=True`) **og** bæta við prófi sem tekur upp raw request bytes á 127.0.0.1 og krefst nákvæmlega einnar `Host` línu (og engra afrit hausa), með samanburði við það sem `http.client.HTTPSConnection.request()` myndi senda. Allt annað í wrapper/validator óbreytt (13/13 grænt). Nýtt attempt-ID, nýtt marker, gamlar möppur ósnertar, sama URL/caps, engin sjálfvirk þriðja tilraun eftir það.
Ég mæli ekki með valkosti 2 af nauðsyn; ef eigandi vill fá B2 svarað er hann réttlætanlegur núna (ólíkt fyrr), og ef ekki er valkostur 1 fullgildur. O6 (engin sjálfvirk þriðja tilraun) stendur — þetta er ný ákvörðun með nýjum upplýsingum, ekki sjálfvirk.

### Takmörk
Ég keyrði ekkert á vél eiganda og gerði engin net-köll. Ég get ekki **sannað** að tvöfaldur Host sé eina orsök 400 — aðeins að beiðnin braut „MUST“-reglu sem útskýrir hana og að ekkert annað sýnilegt greinir hana frá beiðnum sem tókust; engin þriðja beiðni var send til að sannprófa. CC-eignað og óstaðfest af mér: eitt dispatch, að 13/13 hafi keyrt á Windows (ég sá það á Linux), git HEAD/status/diff --check.

### Næsta skref
Ripley lokamat: skrá attempt-2 sem INCOMPLETE/client-galli (JH1), B2 enn ósannað; leggja ákvörðun 1 eða 2 fyrir eiganda. PASS (ef Ripley velur) nær aðeins til þess að R1–R3 virki og skráning sé heiðarleg, ekki B2-niðurstöðu.


## Ripley lokamat — 2026-11-17

**INCOMPLETE / BLOCKED á B2-niðurstöðu.** Jonesy JH1–JH3 samþykkt; sjálfstætt lesið putrequest + explicit putheader Host og staðfest 157B raw SHA256 261c4ca72e7bec9b49794d577e7fc9a6348f97af405a24b05bce341dbd3786b0. Engin fetch/script-keyrsla eða ný netbeiðni í lokamati. 13/13 local keyrslur eru CC/Jonesy-eignaðar, ekki endurkeyrðar af Ripley. Vistun/response classification heppnaðist, en engin geometry-niðurstaða.

Sýnilegi duplicate-Host gallinn skýrir líklega HTTP400; ekki sannað að hann sé eina orsök. Beiðnis-URL var samþykkt en HTTP-beiðnin var gölluð. Eldri fullyrðingar um höfnun á nákvæmlega samþykktu beiðninni og “tvær ólíkar bilanir” eru afturkallaðar með correction-note í báðum skýrslum. Fyrra týnda svar getur hafa verið sama 400 en það er óþekkt; ekki búa til það. Þjónninn hefur ekki skilað varðveittu efnislegu B2-svari. Hvorki connector né vegaleysi staðfest.

Engin sjálfvirk þriðja tilraun/viðgerð. Eigandi velur annaðhvort að hætta B2-sókn með óleyst gagnagat eða heimila eina nýja attempt-3 með minnsta Host-fixi og raw request-bytes prófi sem sýnir eina Host-línu, sömu URL/caps og nýjum marker. Gömlu tilraunirnar óbreyttar; engin fjórða sjálfvirk tilraun. Gagna-gap meðferð í innleiðingu er sérstök ákvörðun, ekki samþykkt með því að hætta öflun. CURRENT BLOCKED á meðan ákvörðun vantar; #501 óinnleitt. Engin app-test/build/lint/GitHub/commit/push/deploy.
