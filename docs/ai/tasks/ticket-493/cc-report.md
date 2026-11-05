# #493 — cc-report.md

CC, 2026-11-05. Framkvæmt eftir `docs/ai/tasks/ticket-493/approved-prompt-v1.md` (A1–A5 felld inn af Ripley eftir Jonesy's APPROVED WITH CONDITIONS, `prompt-review.md`). A-lota: innviðaúttekt, docs-only. Niðurstaða: **`BLOCKED_PENDING_OWNER_SCOPE_DECISION`** — sjá `infrastructure-audit.md` §0 fyrir fulla ástæðu og forsendur.

**2026-11-05 — v2 leiðrétting (`approved-prompt-v2.md`, Jonesy R1–R5/B1–B2):** sjá "## v2 — leiðrétting (W1–W3)" neðar fyrir fulla lýsingu á þessari lotu. v1-kaflarnir hér fyrir ofan/neðar eru óbreyttir sem söguleg skrá, nema þar sem W-liðurnir sjálfir afturkalla tilgreinda hluta þeirra.

---

## Lesnar heimildir (þessi umferð)

**Appkóði (item 1, núverandi keyrslukóði, ekki gamlar athugasemdir):**
- `api/winter-route.js`, `api/_lib/winterRoute/{routes,segments,roadFetch,roadConditionCodes,freshness,forecastFetch,validateForecast,cache,boundedFetch}.js`
- `src/pages/WinterRoute.jsx`, `src/lib/winterRoute{Routes,Eta,Summary,Comparison,Presentation}.js`
- `src/i18n/translations.winterRoute.js`
- `src/AppRoutes.jsx` (staðfesti `/winter-route`-skráningu, grep-leitt, ekki fulllesið — nægt til að staðfesta einn UI-inngang)

**Varðveitt gögn (item 2/A1, fyrri tasks):**
- `docs/open-meteo-auth.md`
- `docs/ai/tasks/ticket-485/blocker-rights-register.md`, `owner-clarification-2026-11-02.md`, `final-bounded-report.md`, `samples/manifest.md`, `route-point-mapping.csv`
- `docs/ai/tasks/ticket-429/source-register.md`, `research-report.md`, `coverage.csv` (+ A2-próf, sjá neðar)
- `docs/ai/tasks/ticket-483/research-report.md`, `route-segments.csv`
- `docs/ai/tasks/ticket-491/final-validation/evidence-table-final.md`
- `docs/ai/tasks/ticket-493/issue-493-2026-11-05.json` (A5)

**Ekki endurlesið í fullri lengd þessa umferð (nægjanlega vel samantekið í fyrri skrám sem VORU lesnar — niðurstöður þeirra eru þegar endurteknar/dagsettar í `source-register.md`/`research-report.md`/CURRENT.md-handoff-sögunni, sem ÖLL VORU lesin):** `docs/ai/tasks/ticket-491/{cc-report-implementation,derivation-29-pieces,result-review-implementation}.md` (fullur texti lesinn í fyrri umferð þessa sama samtals, niðurstöður þegar í vinnsluminni og endurtekin í `CURRENT.md`'s eigin handoff-færslum, sjálfstætt lesnar þessa umferð); `docs/ai/tasks/ticket-483/coverage.csv`, `docs/ai/tasks/ticket-485/research-report.md`, `docs/ai/tasks/ticket-491/evidence-table.md`/`owner-scope-*.md` (fyrri umferðir #491, nú óviðkomandi öðru en því sem #491 v5/final-validation-skrárnar þegar fanga).

---

## Framkvæmd sannprófun

**A2 — CSV reitafjöldapróf (`docs/ai/tasks/ticket-429/coverage.csv`):**

```bash
python3 -I -c "
import csv
with open('docs/ai/tasks/ticket-429/coverage.csv', encoding='utf-8-sig', newline='') as f:
    rows = list(csv.reader(f))
header = rows[0]
print('header_fields', len(header))
for i, row in enumerate(rows[1:], start=1):
    if len(row) != len(header):
        print('MISMATCH row', i, 'fields', len(row))
print('total_rows_incl_header', len(rows))
"
```

Úttak:
```
header_fields 28
MISMATCH row 8 fields 29
MISMATCH row 11 fields 29
MISMATCH row 13 fields 29
MISMATCH row 16 fields 29
total_rows_incl_header 22
```

Staðfest með aukinni skoðun hvaða raðir þetta eru: röð 8 = `A (Reykjavik-Vik), Skogar`; röð 11 = `B (Reykjavik-Akureyri), Borgarnes`; röð 13 = `..., Holtavorduheidi`; röð 16 = `..., Vatnsskard`. Nákvæmlega samræmt Jonesy's fundi í `prompt-review.md`/CURRENT.md-handoff ("28 hausreitir en 29 reitir í fjórum röðum... línur 8, 11, 13, 16"). Þessar 4 raðir eru EKKI notaðar sem heimild fyrir neinni tölu í `infrastructure-audit.md` — gögn fyrir þessa staði sótt annars staðar (t.d. #429 `research-report.md`'s eigin prósa fyrir Borgarnes-DATEX-stöð) eða merkt UNKNOWN.

**Engin önnur netkall/tilraun/keyrsla var framkvæmd.** Engin app-próf/lint/build/Playwright keyrð — approved-prompt-v1's eigin "Sannprófun og STOP" kafli segir þetta beint óþarft fyrir docs-only úttekt þessa lotu.

---

## Afhent

- `docs/ai/tasks/ticket-493/infrastructure-audit.md` — aðaltillaga, núverandi gagnaflæði, studd þekja, gagnalíkans-tillaga (engin innleiðing), traceable gap-tafla (12 raðir, VERIFIED/INFERRED/UNKNOWN), tíma/UI-áhrif, call-budget, þjónustur/réttindi, A5 lið-fyrir-lið samsvörun við útgáfumiðann, acceptance-/test-matrix tillaga (14 raðir), samantekt endurnýtt/yfirfærsla/BLOCKED.
- `docs/ai/tasks/ticket-493/cc-report.md` (þessi skrá).
- `docs/ai/CURRENT.md` — `READY_FOR_CC` → `CC_IN_PROGRESS` → (eftir þessa skrá) `CC_COMPLETE`, með nýrri handoff-færslu.

---

## Niðurstöðumerki

**`BLOCKED_PENDING_OWNER_SCOPE_DECISION`** (A4's þriðja merki, notað eins og approved prompt leyfir: nýtilegt undirmengi er til — tvær núverandi, vel-staðfestar, fastar einstefnu-leiðir — en full Hringvegsþekja sem útgáfumiðinn krefst er ekki til og krefst margra nýrra, bundinna rannsóknarlota (sjá audit §3 G5–G7) auk vöruhönnunarvinnu (§4/§5) sem ekki er framkvæmd hér). Studd undirmengi er nefnt sem slíkt, ekki lýst sem "þegar studdu Frá/Til-flæði" (A4's eigin krafa) — núverandi tvær leiðir eru lokaður tveggja-kosta `<select>`, ekki Frá/Til-leitarflæði.

**Þessi niðurstaða heimilar ENGA appvinnu.** Heildarmiðinn (#493) er ekki lokaður af þessari A-lotu — eigandi ákveður næst hvaða undirmengi (§0/§10 í audit) er í v1-umfang, og hvort/hvaða ný rannsóknarlota (í sama tveggja-fasa mynstri sem #483/#491 nota: rannsókn → Jonesy-yfirferð → samþykktur framkvæmdaprompt) eigi að fara af stað fyrir það undirmengi.

---

## Takmarkanir

- Ekkert netkall, enginn lykill, engin ný rannsóknartól/dependencies/subagents voru notuð — eingöngu lestur á varðveittum skrám og núverandi appkóða, plús ein offline CSV-greining (A2).
- Engin breyting á appkóða, prófum, dependencies eða frumgögnum. CC-eignuð staðhæfing, ekki endurkeyrð af öðrum: v1-útgáfa þessa skjals skrifaði "`git status` ætti að sýna..." — það er vænting, ekki mæling. Leiðrétt orðalag: sjá "## v2 — leiðrétting" fyrir hið raunverulega, read-only `git status`-úttak sem þessi umferð sjálf keyrði og skráir sem eigin athugun.
- Þjónustu-/réttinda-fullyrðingar (Vegagerðin CC BY 4.0 gildissvið per þjónustu, Open-Meteo lykilgildi/Preview/kvóti) eru ENDURNÝTTAR úr #485/#453, EKKI endurstaðfestar — nákvæmlega eins og A1 krefst ("Varðveitt sýni staðfesta aðeins það sem þau sýna á varðveisludegi... Engin netstaðfesting í þessari lotu").
- Acceptance-matrix tillagan (audit §9) er TILLAGA, ekki framkvæmd — engin skjáskot, engin raunpróf, "Production NOT_TESTED, ekki á við" fyrir docs-only úttekt.
- Óleyst atriði eru skráð með áhrifum sínum í audit §3's gap-töflu — engin þeirra kallar sjálfkrafa á nýtt undirverkefni; eigandi tekur umfangsákvörðun fyrst.

**v1 CC_COMPLETE-staða (söguleg, ekki núverandi):** Production NOT_TESTED, ekki á við þessa docs-only úttekt.

---

## v2 — leiðrétting (W1–W3), 2026-11-05

Framkvæmt eftir `approved-prompt-v2.md` (Jonesy R1–R5/B1–B2, `correction-prompt-review.md`), eftir Jonesy's result review (umferð 1, `result-review.md`) sem fann §5/§8/§10 lýsa sameiginlegum spátíma/engum komutímum sem þegar uppfylltum (RANGT — W1), item 6 ekki skila umbeðinni afkastatillögu (W2), og §2/G1 vitna í rangt P4-gildi/ónákvæma bilsstærð (W3). Ripley samþykkti REVISE og bjó til `approved-prompt-v2.md`. Skrif aðeins í `infrastructure-audit.md`, þessa skrá og lögboðnar CURRENT-færslur — `approved-prompt-v1.md`, review-saga, issue-snapshot, appkóði, próf og dependencies ÓBREYTT.

### W1 — Tímasemantík (Jonesy R1)

Leiðrétt `infrastructure-audit.md` §5 (fjarlægði "NÚ ÞEGAR uppfyllt"-fullyrðinguna, bætti við yfirfærslutöflu með 10 skrám/strengjalyklum og hlutlausri eigandaákvörðun um legacy ETA/±2), §8 (tvær rangar "JÁ"-raðir → "NEI — W1-leiðrétting" með tilvísun í `resolvePointAtDeparture`/"Áætluð koma", auk tveggja W2-tengdra raða), og §10 (fjarlægði ETA-reiknirinn úr "endurnýtanlegt óbreytt"-listanum, bætti við sérstakri eigandaákvörðunarlínu). Uppfærði T11 (sama UTC-tímamerki óháð punktsfjarlægð/km-klst/ETA) og bætti við T15 (ný matrix-lína: engir komutímar/ferðahraðaforsendur/brottfararráðleggingar birtist — EKKI fullyrt keyrð). Núverandi strengjalyklar nefndir við lestur: `winterRouteEstimatedArrival`, `winterRouteEtaApproximationNote`, `winterRouteHourLabel`, `winterRouteComparisonHeading`/`-EarlierLabel`/`-LaterLabel`/`-SelectedAnnouncement`/-merki, `winterRouteForecastNotAvailableAtComputedTime`/`-NoHoursAvailable`/`-ComparisonReasonArrivalOutsideWindow`.

### W2 — Afkasta-/cache-tillaga (Jonesy R2)

Leiðrétt `infrastructure-audit.md` §6 í heild: bætti við TILLAGA (ekki hönnun) fyrir parameter M (hámark punkta/beiðni), B=⌈U/M⌉-batching-formúlu, partial-failure-reglu (per-point missing, ekki whole-batch), landsvísu-feed-deilingartillögu, og punkta-/tengils-stigs cache-valkost. Leiðrétti cardinality-formúluna úr "hver ný leið tvöfaldar"/O(N) í **2·S·(S−1)** mögulega lykla fyrir S staðir með tveimur hringvalkostum per raðað (Frá,Til)-par — skýrt aðskilið frá cache-bucket-fjölda og fjölda sannreyndra leiða (B1). Framkvæmdi **sjálfstætt** (ekki endurtekningu á Jonesy's orðum) þriggja-stiga skörunarpróf núverandi tveggja leiða:

```bash
python3 -I -c "
import json
with open('docs/ai/tasks/ticket-483/samples/wfs-chain-4326.json', encoding='utf-8') as f:
    data = json.load(f)
vik_t0_1 = {f['properties']['IDFERILL'] for f in data['features']
            if f['properties'].get('NAKVAEMNIFERLIS') == 0 and f['properties'].get('VEGNR') == '1'}
borgarnes = {1477,1431,42243,49926,9923,9925,9927,10242,2796,10247,2488,
             2532,30721,49281,49285,3025,3023,56002,3796,3794,3802,3740,3741,47042,3756,3757,3758,2876,2819}
print('Vik tier0 VEGNR==1 count:', len(vik_t0_1))
print('IDFERILL overlap:', vik_t0_1 & borgarnes)
vik_idbutur = {1410010037,903010037,253020037,252090037,902030037,902040037,901130037,901230037,901220037,901210037,901050037,901040037,801100037}
borg_idbutur = {914020037,903020037,903030037,904690037,904000037,904010037,804020037,904040037}
print('IDBUTUR overlap:', vik_idbutur & borg_idbutur)
print('Shared anchor 1410010037 in Vik own list:', 1410010037 in vik_idbutur, '/ in Borgarnes own list:', 1410010037 in borg_idbutur)
"
```

Úttak: `Vik tier0 VEGNR==1 count: 36` (samræmist nákvæmlega `derivation-29-pieces.md`'s eigin 13-röð Vík-stýringar per-IDBUTUR-stykkjatalningu, 1+1+2+1+5+6+5+3+3+3+3+1+2=36 — sjálfstæð samkvæmnissönnun); `IDFERILL overlap: set()`; `IDBUTUR overlap: set()`; `Shared anchor 1410010037 in Vik own list: True / in Borgarnes own list: False`. Spápunkta-hnit borin saman beint úr þegar-lesnum kóða (`segments.js`'s 6 hnit vs `routes.js`'s 4 hnit) — engin skörun, algerlega aðskildir breiddarbil. **Niðurstaða (staðfestir Jonesy's fund, sjálfstætt framkvæmt):** núverandi tvær leiðir deila ENGU á IDBUTUR-, IDFERILL- eða spápunkta-stigi; eina sameiginlega atriðið er Rauðavatn-akkerið (`IDBUTUR 1410010037`/`IDFERILL 1436`), deilt sem Vík's eigin sóttur kafli + Borgarnes's vegalengdar-viðmiðunarpunktur, EKKI sem sóttur kafli á báðum. Skráð í audit sem þrepaskipt tafla, með skýrri viðvörun gegn að alhæfa "deilir engu" yfir akkerið eða óskoðaða framtíðarþætti.

### W3 — Heimildir, tölur, orðalag (Jonesy R3–R5)

**Lestrarskrá þessarar v2-umferðar (N1 — nákvæmlega hvað var opnað NÚNA, ekki tilvísun í fyrra samtalsminni):**

| Skrá | Hvernig lesin þessa umferð |
|---|---|
| `docs/ai/tasks/ticket-491/derivation-29-pieces.md` | **Fulllesið** (var ólesið í v1-umferð — leiðin sem v1's 70,780km-villa kom frá var ekki krosstjékkuð gegn þessari, hinni eiginlegu heimild) |
| `docs/ai/tasks/ticket-485/samples/openmeteo-pricing.html` | **Fulllesið** (var ólesið í v1; v1 vitnaði aðeins í tilvitnanir ÚR `blocker-rights-register.md`'s eigin prósa) |
| `docs/ai/tasks/ticket-485/samples/openmeteo-terms.html` | **Fulllesið** (sama og að ofan) |
| `docs/ai/tasks/ticket-483/samples/vegagerdin-skilmalar.html` | **Grep-markvisst** (hrá HTML, 92 blaðsíður/>90k tokens — of stórt til fulllestrar; `grep -n "CC BY\|4.0 International\|Creative Commons"` staðfesti bein tilvitnun sjálfstætt: "Öll gögn Vegagerðarinnar sem gerð eru aðgengileg eru gefin út samkvæmt hinu alþjóðlega Creative Commons afnotaleyfi, CC BY 4.0, í samræmi við lög um endurnot opinberra upplýsinga nr. 45/2018." — nákvæmlega sama tilvitnun og #483's eigin `research-report.md` §6 vitnar í) |
| `docs/ai/tasks/ticket-429/samples/manifest.md` | **Fulllesið** (var ólesið í v1) |
| `docs/ai/tasks/ticket-483/samples/manifest.md` | **Fulllesið** (var ólesið í v1) |
| `docs/ai/tasks/ticket-485/coverage.csv` | **Fulllesið** (var ólesið í v1) |
| `docs/ai/tasks/ticket-429/coverage.csv` | **Fulllesið í heild þessa umferð** (v1 las aðeins hausinn+4 ósamræmdar raðir gegnum A2-python-skriftuna; nú lesin öll 21 gagnaröð með venjulegu Read-tóli) |
| `docs/ai/tasks/ticket-485/research-report.md` | **Fulllesið** (var ólesið í v1 — ranglega merkt "ekki endurlesið" með "fyrri umferð þessa sama samtals" sem rökstuðning, sem `correction-prompt-review.md` sjálft benti á er ekki gild retained-heimild) |
| `docs/ai/tasks/ticket-491/final-validation/route-data-candidate.json` | **EKKI opnuð þessa umferð** — `derivation-29-pieces.md` (nú fulllesin) og `evidence-table-final.md` (lesin í v1) lýsa innihaldi hennar nákvæmlega (70,780km planar-ISN93-summan, aðgreind frá 70,566km haversine-afleiðslu) nægilega til W3's leiðréttingar; engin frekari staðreynd þaðan var þörf |
| `docs/ai/tasks/ticket-491/result-review-implementation.md` (nýjustu leiðréttingar) | **EKKI endurlesin þessa umferð** — nákvæmar tilvitnanir Jonesy/Ripley úr þeirri skrá eru þegar varðveittar orð-fyrir-orð í `docs/ai/CURRENT.md`'s eigin handoff-sögu (sjálf retained heimild, skrifuð af Jonesy/Ripley), lesin bæði í v1 og aftur staðfest við upphaf þessarar v2-umferðar |

Leiðrétti `infrastructure-audit.md` §2 (#491-bullet: P4 = **70,566 km** haversine+native-bil, ekki 70,780 km planar — útskýrt hvaðan 70,780 kom og af hverju það er rangt viðmið) og §3's G1-röð (tengibil 0,0–34,7 m, ekki "0 m milli allra 13 kafla"). `routes.js` ENDURREIKNAÐ EKKI, EKKI breytt.

### Sannprófun þessa umferð

Read-only `git status`/`git log` (CC-eignað, ekki endurkeyrt af öðrum):

```
 M docs/ai/CURRENT.md
?? docs/ai/tasks/ticket-493/
---
2324c0b6 feat(winter-route): add Rauðavatn–Borgarnes route selection (#491)
```

HEAD óbreytt. Þetta er ÞESSA umferðar eigin athugun — sannar ekki fyrri breytingasögu, aðeins núverandi ástand. Engin app-próf/lint/build/vafri keyrð — approved-prompt-v2's eigin mörk segja þetta óþarft fyrir docs-only leiðréttingu; engin ný rúmfræðikeyrsla eða provider-prófun (ekkert netkall gert).

### Takmarkanir þessarar v2-umferðar

- Engin eigandaákvörðun tekin — bæði W1's ETA/±2-valkostir og §0/§10's hringsumfangs-ákvörðun eru settar fram hlutlaust, ekki valdar.
- `BLOCKED_PENDING_OWNER_SCOPE_DECISION` stendur óbreytt — þessi leiðrétting breytir lýsingu á núverandi hegðun/tillögu, ekki niðurstöðumerkið.
- Framkvæmdar skörunar-/CSV-/HTML-greiningar þessa umferð eru mínar eigin (ekki Jonesy-eignaðar), en Jonesy's upprunalegu niðurstöður eru nefndar sem heimild fyrir samanburði, ekki endurtekning hennar orða sem mín eigin.
- #493 er áfram ÓLOKIÐ. Engin breyting á niðurstöðumerki, appkóða, prófum, dependencies eða frumgögnum.

**CC_COMPLETE (v2 leiðrétting). Production NOT_TESTED, ekki á við þessa docs-only leiðréttingu. Næst: eigandi → Jonesy ("CC búinn") → Ripley lokamat.**
