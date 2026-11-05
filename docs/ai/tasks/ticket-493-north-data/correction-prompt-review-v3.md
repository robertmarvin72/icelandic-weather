# #493 north-data — leiðrétting Y1–Y4 til Jonesy-yfirferðar

Ripley, 2026-11-05. Lesið approved-prompt-v2.md og result-review.md, umferð 2. Framkvæmd bíður samþykkts v3 og venjulegs CC-handoff samkvæmt docs/ai/README.md. Afmörkun er varðveitt gögn, tvö lítil offline afleiðsluforrit og tengd skjöl. Fryst plan, frumsvör, fyrri ledger-færslur og samþykkt prompt eru varðveitt. Netköll og appbreytingar eru utan umfangs.

- Y1. Skráið nákvæman xy-hnitajöfnuð og óafrúnnaða mælda fjarlægð í sitt hvorum reit fyrir hvert keðjuskref. Leiðið gap/gap_grade í candidate JSON af mælingunum eða staðfestið þær með assertions. Samræmið afleiðslur og skjöl við 44 nákvæmar snertingar og tvö hringtorgsbil. Varðveitið sönnunargráðu akstursátta og leiðarlengd 316,7123 km með fyrri aðferð.
- Y2. Reiknið sýnisaldur úr varðveittum tímastimplum miðað við 2026-11-05T18:57:23Z. Eldra sýnið er 8 dagar og 6 mínútur, námundað niður í mínútu. Samræmið aldursbil 3–8 dagar. Varðveitið endurkeyranlega W5-afleiðslu og úttak fyrir aldur, notice 73688 vertex-fjarlægð og hliðarvegastykki, helst í fyrirliggjandi inventory-forriti. Lestrarskrá endurspegli raunverulega lesin færðarsýni og geometry. Haldið takmörkunum um lykilpörun og leiðarviðkomu.
- Y3. Bætið við dagsettri append-only leiðréttingu í ledger og samræmið manifest/report. Tími exchange 1 er UNKNOWN. Varðveitt röðun er probe fyrir forskráningu. 30 mínútna gluggi er óstaðfestur. Exchange 2 skipun er CC-eignuð endurminning. Body-cap framfylgd fyrir chunked svar og full C1-framfylgd eru NOT_DOCUMENTED. Raunbæti exchange 1 eru UNKNOWN og fyrri efri mörk mögulegs afgangs halda gildi.
- Y4. Tilgreinið canonical UTF-8/LF JSON-bæti og SHA256 fyrir endurgerða skrá. Merkið sögulegu v1 budget-töfluna og liði 4–6 í CC-skýrslu með tilvísun á gildandi leiðréttingu.

Endurkeyrið offline afleiðslurnar og berið saman úttak og candidate JSON. Skráið niðurstöðu Y1–Y4 í cc-report-north-data.md og ljúkið CC-lífsferli. EVIDENCE_READY_FOR_OWNER_REVIEW er áfram markmið gagnalotunnar. Eigandaákvörðun um sameiginlegan spátíma er skráð í ticket-493/owner-decisions-2026-11-05.md. Akureyrarendi og veðurpunktar eru áfram tillögur.

Jonesy verdict: sjá „Jonesy review — umferð 3“ neðar.

## Jonesy review — umferð 3 (2026-11-05)

### Niðurstaða: APPROVED WITH CONDITIONS L1–L4 (skjalaleg; felld inn í approved-prompt-v3 áður en READY_FOR_CC)

Y1–Y4 svara X1–X5 beint og eru rétt afmörkuð: offline, ekkert net, ekkert app, fryst plan/frumsvör/ledger-línur/fyrri prompt óbreytt, eigandaákvörðun um tímalíkan ekki opnuð, ekkert val tekið um Akureyrar-endi eða punkta, og 316,7123 km / sönnunargráða stefnu haldast. Fjórir hnökrar eru þess eðlis að CC gæti uppfyllt Y-liðina að orði en ekki að efni; ég tengi þá við Y-liðina sjálfa, ekki ný markmið.

### Sandbox-athuganir mínar (lestur og lítil offline Python `-I` á staged afritum; ekkert net, enginn lykill, ekkert keyrt á vél eiganda)

- **Staða:** CURRENT var PROMPT_REVIEW, Prompt review = `correction-prompt-review-v3.md`, Ripley lokamat umferð 2 (REVISE Y1–Y4) í `result-review.md`. Ég las v3-drögin, lokamatið og handoff.
- **Viðmið mín stemma við drögin:** eldra sýnið 2026-10-28T18:51:00Z er **8 d 0 klst 6 mín 23 s (8,0044 d)** miðað við 2026-11-05T18:57:23Z; yngra 2026-11-02T13:21:00Z er 3 d 5 klst 36 mín 23 s. „8 dagar og 6 mínútur, námundað niður“ er rétt. Allar 708 færslur hvors `faerd`-sýnis bera sama `DagsKeyrtUt`; öll `faerdpunktar`-sýni hafa einnig eitt `DagsKeyrtUt` á skrá (`2026-10-28T18:56:00Z`, 43 færslur; `2026-11-02T13:21:00Z`, 26 færslur) — tilkynningasýnið frá 28.10. er því 8 d 0 klst 1 mín 23 s, ekki sami stimpill og færðarsýnið.
- **Aðrar tölur sem Y1 þarf:** 44 nákvæm xy-snerting (`tuple ==`), 2 ekki: 1,77 m og 42,841 m (óafrúnnað 42,8409…); hringtorgsfastar 1,77/42,84 eru því námundun, ekki nákvæmar mælingar.
- **Mörk:** v3-drögin eru ekki framkvæmd; ég hef ekki keyrt scripts CC í þessari umferð (ekki þörf), og ekkert hér er app-próf/lint/build/git/vafri. Production NOT_TESTED.

### Skilyrði (öll tengd Y1–Y4 og approved-prompt-v2 K1/W3/W5; ekkert nýtt umfang)

- **L1 — Aldursstimpill tilgreindur (Y2).** „Úr varðveittum tímastimplum“ er tvírætt. Tilgreinið: aldur hvers sýnis reiknast af skrá-stigs `DagsKeyrtUt` (útflutningstími) í hverri af fjórum skrám (færð 28.10., færð 2.11., tilkynningar 28.10., tilkynningar 2.11.), allar aldursgildi gegn 2026-11-05T18:57:23Z og skráð í sekúndu-nákvæmni í úttaki (ekki aðeins „8 d“), með heiti stimpilreits og skráar. Eftir-færslu `DagsSkrad` er sér stærð og má ekki rugla saman. Gildin eru reiknuð af skriftunni, ekki hardkóðuð eða slegin inn.
- **L2 — Nákvæmni- og assert-regla (Y1).** Skráið `exact_xy_equal` (bool á fullum float-tuple) og óafrúnnaða fjarlægð í sitt hvorum reit per skref. Brúargildin (1,77/42,84) sem fastar mega vera til sem skjalfest heimild en skriftan á að bera þau saman við mælingu og afhjúpa mismun (assert eða prentuð frávik); sú samanburður er skjöl á samsvörun, **ekki** nýr nálægðarþröskuldur og breytir ekki sönnunargráðu. Hringtorgsbilin tvö áfram „brúuð samkvæmt forskráðri reglu“, ekki „VERIFIED akstursleið“ (K1).
- **L3 — Hreinsun á ágiskuðum tíma í öllum skjölum (Y3).** Ágiskunin „sama mínúta og exchange 2 / 18:57Z“ og „báðar exchange innan sömu mínútu / ~sömu mínútu“ stendur í ledger-leiðréttingunni, `samples/manifest.md` (línan „both exchanges completed within the same minute“) og cc-report (v1 gluggi). Dagsett viðbót á að afturkalla hana í öllum þremur, með einu varðveittu atriði: probe sendur áður en plan var skrifað (mtime plans 18:57:10Z, CC-eignað), tími UNKNOWN og 30 mín gluggi óstaðfestur fyrir exchange 1. Body-cap: segja að flögg voru send (CC-eignuð endurminning), að retained headers sýna chunked án Content-Length, að framfylgd body-þaks og min(8 MiB, eftirstandandi) er NOT_DOCUMENTED; ekki orðið „enforcing“ fyrir 8 MiB þakið. Engin ný beiðni.
- **L4 — Canonical encoding framkvæmt, ekki aðeins lýst (Y4).** Script skrifar JSON með `encoding='utf-8', newline='\n'`; í cc-report er gefið upp bætafjöldi og SHA256 canonical skráar sem er á disk (LF), ekki aðeins hash CRLF-útgáfu; v1 liðir 4–6 og budget-tafla fá innlínumerki með tilvísun í gildandi leiðréttingu. Sá hash sem CC gefur upp stenst síðan endurútreikning úr skránni sjálfri (Jonesy sannreynir). Athugið að skrá sem Windows-sendiferð umbreytir í CRLF breytir hash; CC tilgreinir hvernig hashið er reiknað (bætin á disk eða LF-normalíseruð).

### Athugasemdir (ekki skilyrði)

- **N1:** Y2 má vera í `inventory_chain.py` eða í litlu `notice_key_check.py`; mikilvægt er að úttak sé varðveitt og lestrarskrá nefni hvaða skrár voru lesnar af skriftu.
- **N2:** v3 segir „Fryst plan, frumsvör, fyrri ledger-færslur“ óbreytt; það á líka að ná til ledger-línu 3 (v2-leiðréttingar), sem má ekki endurskrifa heldur aðeins bæta aftan við með nýrri dagsettri línu.
- **N3:** Engin viðbótarskref í CURRENT umfram CC_IN_PROGRESS/CC_COMPLETE og dagsetta v3-færslu.

### Mörk

Prompt-review; ekkert gagna- eða appskjal breytt og engin keyrsla eða sókn heimiluð. Allar tölur eru úr lestri/talningu á staged afritum í sandbox. Stage helst PROMPT_REVIEW. Næsta skref: Ripley býr til approved-prompt-v3.md með L1–L4 og setur READY_FOR_CC; Róbert commit-ar sjálfur.

## Ripley, 2026-11-05

L1–L4 og athugasemdir N1–N3 felld inn í approved-prompt-v3.md. CURRENT er READY_FOR_CC. Eigandi sendir CC „Prompt approved“.
