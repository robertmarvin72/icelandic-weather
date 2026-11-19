# #501 metadata-acquisition — ROAD-REGISTER-SCHEMA metadata-report

Heimild: `docs/ai/tasks/ticket-501/metadata-acquisition/approved-prompt-v1.md`.
Eitt heimilað HTTP-kall sent og afgreitt — sjá `request-ledger.json` og
`cc-report.md` fyrir fulla sendingarstöðu.

## Hvað var sótt

`GET` `DescribeFeatureType` fyrir `gis:vegakerfi_ist120_2024_1`
("Vegakerfi ist120" — vegaskrá, Abstract vísar í vegalög nr. 80/2007,
staðfest gegn `ticket-499/samples/raw-ACCESS-CAPABILITIES.xml` fyrir
sendingu). Svar: HTTP 200, `text/xml`, 3815 bætur, SHA-256
`33b7405c11b4272382dcfd9f31e82f4ab0f15cab8d03ce25128a6af0468b72cb` —
varðveitt óbreytt í `raw-ROAD-REGISTER-SCHEMA.xml`.

## Athugaðir reitir (`vegakerfi_ist120_2024_1Type`)

28 frumefni í sequence (OBJECTID + 26 eigindi + SHAPE) samtals. Allir hér taldir upp — engin úrfelling:

| Reitur | Tegund | Athugasemd |
|---|---|---|
| `OBJECTID` | decimal (required) | Fitju-auðkenni, ekki leiðarauðkenni milli fitja. |
| `FITJUFLOKKUR` | decimal | Óljóst án verðmætaskrár — ekki athugað hér. |
| `IDKAFLI` | decimal | Hugsanlegt kaflaauðkenni — **ekkert from/to-nóðu- eða tengingarreitur sést**. |
| `VEGNR` | string | Vegnúmer. |
| `KAFLANR` | string | Kaflanúmer. |
| `NAFNFITJU` | string | Nafn fitju. |
| `LENGD` | decimal | Lengd. |
| `VEGFLOKKUN` | decimal | Flokkun — kóðatafla ekki í þessu svari. |
| `VEGFLOKKUNSVEITAFELAGA` | decimal | Sveitarfélags-flokkun. |
| `VEGTEGUND` | string | Tegund vegar. |
| `SLITLAG` / `ARSLITLAG` | decimal | Slitlagstegund/ár. |
| `BREIDD` | decimal | Breidd. |
| **`AKSTURSSTEFNA`** | **decimal** | **Sjá "Direction/access spurning" hér að neðan — mikilvægasti fundurinn.** |
| `HRADI` | decimal | Hugsanlega hámarkshraði — ekki staðfest merking hér. |
| `EININGVEGAKERFIS` | decimal | Óljóst án frekari heimilda. |
| `UPPHAFNOTKUNAR` / `ENDIRNOTKUNAR` | dateTime | Notkunartímabil (dagsetningar), ekki aðgengi/stefna. |
| `HEIMILD` | string | Heimild/uppruni gagnans — ekki akstursheimild. |
| `DAGSHEIMILDAR`, `DAGSINNSETNINGAR`, `DAGSLEIDRETTINGAR` | dateTime | Skráningartímar. |
| `VINNSLUFERLIFITJU` | decimal | Vinnsluferli. |
| `NAKVAEMNIXY` | decimal | Nákvæmni (sbr. `NAKVAEMNIFERLIS`-reit í faerdferlar2017_1, en ekki sá sami reitur). |
| `GAGNAEIGANDI`, `EIGANDIFYRIRBAERIS` | string | Gagnaeigandi. |
| `DAGSGRUNNUR` | dateTime | Grunndagsetning. |
| `SHAPE` | `gml:LineStringPropertyType` | Geometría — engin ný geometry-beiðni gerð hér, bara reitarlýsing. |

## Connection/direction/access spurning — PARTIAL; merking stefnu fyrir þetta lag UNKNOWN

**A2: reitur til, merking fyrir þetta lag UNKNOWN:** schemað ber reit **`AKSTURSSTEFNA`**
(bókstaflega „akstursstefna" = driving direction), `xsd:decimal`,
`nillable="true"`. Þetta er fyrsti reitur sem þessi rannsókn hefur
fundið í ÖLLU varðveittu Vegagerðar-gagnasetti (hvorki
`faerdferlar2017_1` samkvæmt #429's DescribeFeatureType, né neitt af
retained `chain-walks`/`road-links` skrám #493/#499/#500/#501) sem
heitir beinlínis eftir akstursstefnu.

Í samræmi við samþykkta promptið athugaði ég hvort reitarnafnið eitt
og sér (sem er EKKI staðfest merking) kæmi fyrir í öðrum ÞEGAR
varðveittum skrám í vinnutrénu — ekki ný netöflun, aðeins `grep` yfir
núverandi skrár. Það gerði það: `docs/planning/nature-roads-source-2026-10-28/`
(móttekið/lesið af Ripley 2026-10-28, varðveitt PDF SHA-256
`4e2845cf71bef133608d224c5fb1a4152f185c3300404181d4a6f68ce6e59fa7`,
óháð þessari lotu, ENGIN ný heimild sótt hér) er **eigandaveitt
skjalfest** opinber Vegagerðar-gagnabók fyrir SYSTURLAG
`gis:vegirinatturuislands_2022_1` (vegir utan þjóðvegakerfis — ANNAÐ
lag en `vegakerfi_ist120_2024_1` sem þessi lota sótti), með nákvæma
kóðatöflu (`extracted-text.txt:224-229`, `source-note.md:19`):

| Kóði | Nafn | Skilgreining |
|---|---|---|
| −1 | Einstefna á móti stefnu línu | „Stefna línu sýnir hvernig hún er teiknuð" (geometry-relative, ekki heimsátt) |
| 0 | Óþekkt | — |
| 1 | Einstefna með stefnu línu | sama fyrirvari — geometry-relative |
| 2 | Tvístefna | — |

**Fyrirvari sem verður að standa:** þetta er skjalfest merking fyrir
SYSTURLAGIÐ, ekki beina skjalfestingu fyrir `vegakerfi_ist120_2024_1`
sjálft — þessi lota sótti enga kóðatöflu fyrir réttu lagið (það er
ekki hluti af einu `DescribeFeatureType`-svari, sem lýsir aðeins
reitanöfnum/tegundum, ekki gildissviðum). Yfirþyrmandi líkt reitasafn
(`VEGFLOKKUN, VEGTEGUND, SLITLAG, AKSTURSSTEFNA, EININGVEGAKERFIS,
HEIMILD, DAGSHEIMILDAR, DAGSINNSETNINGAR, DAGSLEIDRETTINGAR,
NAKVAEMNIXY, GAGNAEIGANDI` koma fyrir í BÁÐUM lögum, orð fyrir orð)
og `vegakerfi_ist120_2024_1`'s eigin Abstract vísar sjálft í sama
ÍST 120:2012-staðalinn — sterk, en ekki fullgild, vísbending um að
sama kóðamerking gildi. **Þetta er ekki staðfest fyrir nákvæmlega
þetta lag án frekari heimildar** (t.d. samsvarandi PDF-gagnabók fyrir
`vegakerfi_ist120_2024_1` sjálft, ekki eitt GetFeature-gildi eitt og sér).
Jafnvel ef kóðinn er sá sami gildir enn: „direction depends on
geometry ordering" (`source-note.md:19`) — kóðinn −1/1 er afstæður
við hvernig línan var sjálf teiknuð, ekki heimsátt eða lögleg
akstursstefna í sjálfu sér, sama fyrirvari og H1/`direction_grade:
INFERRED` hefur alls staðar annars staðar í þessu verkefni.

**Ekkert tengingar-/nóðu-reitur fannst** (t.d. from-ID/to-ID milli
fitja) — `IDKAFLI` gæti verið kaflaauðkenni en engin tveggja-reita
tengingarregla (eins og IDFERILL/IDBUTUR-pöripunktar nota) sést í
þessu schema.

**Niðurstaða fyrir A-spurninguna** (upprunalega: „hvort nein
skjalfest reitur um nóðutengingu/einátta-umferð/aðgengi er til"):
**AKSTURSSTEFNA er fundin og til er skjalfest kóðatafla — en fyrir
systurlag, ekki þetta lag sjálft.** Þetta er sterkari staða en hreint
UNKNOWN (nafn + líklegt gildissvið − 1/0/1/2 úr sömu ÍST120-fjölskyldu),
en ekki full staðfesting fyrir `vegakerfi_ist120_2024_1` nákvæmlega.
Ekkert tengingar-/nóðu-reitur (from-ID/to-ID milli fitja) fannst í
hvoru laginu. Að þessi reitur fannst ekki áður þýðir EKKI að engin
slík heimild sé til í raunheimum — það þýðir aðeins að fyrri
schema-svör (faerdferlar2017_1) svöruðu ekki þessari spurningu;
þetta nýja svar gerir það, að hluta.

## Minnsta næsta skref (krefst sérstakrar eigandaheimildar)

Tveir mögulegir næstu valkostir, ekki heimilaðir til framkvæmdar — **hvorugur
framkvæmdur hér**, í forgangsröð:

1. **Ódýrasta skrefið fyrst, engin ný netbeiðni:** kanna hvort
   eigandinn/Ripley á eða getur fengið samsvarandi opinbera PDF-/
   gagnabókarskjal fyrir `gis:vegakerfi_ist120_2024_1` sjálft (sama
   leið og `docs/planning/nature-roads-source-2026-10-28/` kom til —
   eigandaveitt skjal, ekki vefsótt), til að staðfesta kóðatöfluna
   beint fyrir þetta lag án nokkurs network-kalls.
2. **Ef ekki til:** eitt `GetFeature`-kall á
   `gis:vegakerfi_ist120_2024_1`, afmarkað við fáar fitjur (t.d.
   `maxFeatures=1-5` eða `featureID`-síað á þekkt `OBJECTID`/
   `IDFERILL`-gildi sem þessi rannsókn þegar hefur retained hnit
   fyrir, t.d. Rauðavatn/1436-svæðið), til að lesa **raunverulegt**
   `AKSTURSSTEFNA`-gildi á þekktum vegkafla og meta hvort gildissviðið
   stemmir við −1/0/1/2-töfluna hér að ofan. Sama bundnu skilyrði
   (max1 kall, byte/tíma-hámark, 0 retries/redirects) ættu að gilda um
   þá beiðni líka, samþykkt sérstaklega af eiganda fyrir þá nákvæmu
   URL — ekki sjálfkrafa heimilað af þessari niðurstöðu.

Ef `AKSTURSSTEFNA` reynist í raun bera sömu merkingu á
`vegakerfi_ist120_2024_1`, væri það í fyrsta sinn í þessu vinnutré
sem einhver varðveitt/aðgengileg heimild gæti svarað #501's
akstursstefnu-spurningu — EN jafnvel þá er kóðinn geometry-afstæður
(„direction depends on geometry ordering"), ekki heimsátt, og krefst
enn að vita hvernig hver fitja var teiknuð til að verða gagnlegur.
Þetta leysir ekki spurninguna sjálfkrafa, aðeins færir hana frá
„ekkert skjalfest" til „skjalfest kóði + geometry-teikniregla
þarf að staðfesta per fitju".

Engin sjálfvirk framkvæmd af þessari niðurstöðu. Ekkert nýtt
`GetFeature`/geometry-kall gert í þessari lotu.


## Ripley leiðrétting JE1–JE3 — 2026-11-17

**A = PARTIAL. A1 tenging/hnútar:** enginn from/to-reitur fannst í
þessum tveimur skoðuðu schema; ekki fullyrt að slík heimild sé hvergi til.
**A2 ferðastefna:** AKSTURSSTEFNA-reitur er til en merking hans fyrir
vegakerfi_ist120_2024_1 er UNKNOWN. Retained systurlags-PDF er sterk
vísbending, ekki staðfesting sömu kóða í þessu lagi. Stakt GetFeature-gildi
myndi ekki eitt staðfesta merkingu/kóðatöflu eða join við IDFERILL/IDBUTUR.
Þessi reitur lokar engum B1/B2/C1 geometry-götum.

Raw schema hefur 28 frumefni (OBJECTID + 26 eigindi + SHAPE), sjálfstætt
talið með XML-parser. Eldri talan 27 leiðrétt. Engin tafluröð vantaði.

fetch_schema.mjs er **þegar keyrð og má ekki endurkeyra**: enginn
endurkeyrsluvörður er í henni og hún getur yfirskrifað raw/ledger.
req.setTimeout er socket-idle timeout, ekki 20s wall-timer; samþykktu
wall-mörkin voru því ekki tæknilega tryggð. Ledger skráir lokið svar
á 37ms, svo frávikið hafði ekki áhrif á þetta svar en verður skráð,
ekki endurnotað sem tryggt fetch-verkfæri. Engin ný beiðni eða script-keyrsla.
