## Jonesy result review — umferð 1 (2026-11-18)

**Verdict: PASS fyrir afmarkaða skjalarannsókn. Engir blockerar.** Heimildir eru rétt skilgreindar og UNKNOWN/PARTIAL eru heiðarlegar niðurstöður innan budgets. Q3 er raunverulegur nýr fundur úr retained gögnum. Tvær skýringar-/rökvillur í skýrslunni (RA1, RA3) og ein leiðrétting á *minni eigin* fyrri tölu (RA2) breyta því hvernig á að lesa Q3 og ráðleggingu, ekki afhendingunni. Lokamat er Ripley/eiganda.

Merking: **[sandbox]** = lesið/reiknað af mér úr stöguðum skrám og retained gögnum (ekkert net, engin heimildaleit, ekkert á vél eiganda). **[CC]** = fullyrt af CC (vefaðgerðir, git); óstaðfest af mér.

### 1. Sandbox-staðfest

1. **Q3 tilvitnun stenst orðrétt:** `ticket-483/owner-source-2026-10-28/extracted-text.txt` línur 108–114 (VEGHLUTI „föst gildi“: 0 Miðlína vegar, 3 Miðlína aðreinar, 4 Miðlína fráreinar, 5 Hringtorg, 6 Akbraut með kaflastefnu, 7 Akbraut á móti kaflastefnu); lína 62 „Lýsing á gerð miðlínu“. PDF SHA-256 reiknað af mér = `ba4205e2…23aa` (stemmir við skýrslu og source-note). Skjalið notar hvorki „einstefna“ né „tvístefna“ um VEGHLUTI.
2. **Q2 UNKNOWN stenst:** færð-reitataflan (`extracted-text.txt` bls. 2) hefur IDFERILL/IDBUTUR/VEGNR/KAFLANR en ekkert `IDKAFLI`; vegakerfi-schema hefur `IDKAFLI`, ekkert IDFERILL/IDBUTUR; enginn tengi-reitur í hvorugu. Q1 PARTIAL stenst (reitur til, kóðatafla fyrir rétta lagið ófundin; kóðatafla systurlags `extracted-text.txt:224–229` rétt endursögð).
3. **Afmörkun:** á vél engin `api/`-skrá (m.a. `geometryComposition*`, `geometryDataset*`, `winter-route-geometry*`) né `server_data/*` með nýjum mtime; í `direction-authority/` eru aðeins approved-prompt, authority-report, cc-report, prompt-review.

### 2. Frávik og athugasemdir (ekki blockerar)

**RA1 — Rökvilla í túlkun á Q2 gagnvart Q3 (miðlungs, skýrsluorðalag):** authority-report segir að Q2-gatið þýði að VEGHLUTI-lestur „could not be tied back“ við IDFERILL/IDBUTUR-stykkin. Það er rangt: **VEGHLUTI er eigind á sömu færð-fitjum (`faerdferlar2017_1`) og geometry-gögnin okkar koma úr** — hvert retained stykki ber þegar `veghluti` (geometry-api sendir hann áfram á hverri slice). **Engin cross-layer-tenging þarf fyrir 3/4/5/6/7.** Raunveruleg eftirstandandi göt fyrir VEGHLUTI sem stefnuheimild eru þrjú: (a) skjalið segir ekki „einstefna“; (b) samband „kaflastefnu“ við vertex-röð teiknunar er óskjalfest — skýrslan kallar kaflastefnu „the section's own reference/digitized direction“, sem er **óstudd samsömun** (skjalið segir það ekki); (c) lagaleg staða. Ráðlegging CC (eigandaveitt PDF fyrir `vegakerfi_ist120_2024_1`) á við Q1 en ekki Q3; næsta skjalaspurning fyrir 3–7 er því önnur: *„hvernig tengist kaflastefna vertex-röð í færð-laginu?“* (eigandaákvörðun hvort hún er spurð; ekkert gert hér).

**RA2 — Leiðrétting á minni eigin fyrri tölu + stærðargráða [sandbox]:** í prompt-review sagði ég að 8/20 röðuð pör snerti VEGHLUTI 6/7 og 12/20 „ekkert“. Það á aðeins við um 6/7. Með öllum stefnuflokkum skjalsins (3 aðrein, 4 frárein, 5 hringtorg, 6/7 akbraut) og 8 (óskjalfest, sjá RA3) snerta **18 af 20** pörum slíkt stykki (aðeins E1↔S2 ekki). Hringtorg (5) eru algengust: **14 pör** hafa a.m.k. eina hringtorgs-slice sem ekin er á móti teiknistefnu (alls 46 forward / 46 reverse hringtorgs-slices yfir 20 pör). **Allar 21 tier-2 línur af VEGHLUTI 5 eru lokaðir hringir, teiknaðir rangsælis (shoelace)** — í hægri umferð er hringtorgsakstur rangsælis, svo teiknistefna = akstursstefna er *samkvæm* þessu (ályktun úr almennri þekkingu, ekki skjalfest hér og ekki lagaleg staðhæfing). Þetta þýðir að núverandi óstefnd niðurstaða fer reglulega rangsælis/réttsælis um hringtorg án þess að nokkuð varni; stefnumál er því ekki bundið við Rauðavatn eins og ég gaf í skyn.

**RA3 — Kóðalistinn í PDF er ekki heill miðað við gögnin (lágt, hefur áhrif á styrk CONFIRMED) [sandbox]:** „föst gildi“ eru 0, 3, 4, 5, 6, 7, en tier-2 gögnin hafa **VEGHLUTI 1 á 190 af 255 línum (74,5 %)** og **8 á 1 línu** (36487, Vesturlandsvegur, 304 m); **gildið 0 kemur ekki fyrir** (dæmaröð PDF hefur sjálf VEGHLUTI 1). Skjalið er dagsett 4. mars 2019. Q3 CONFIRMED stendur fyrir orðalag gildanna 3–7, en lista skjalsins má ekki lesa sem tæmandi/núverandi (1 og 8 óskjalfest, 0 mögulega endurkóðað).

**RA4 — Tvíburapör 6/7 [sandbox]:** allar 26 línur af tegund 6/7 hafa „tvíbura“ af hinni tegundinni þar sem upphaf annarrar og endi hinnar liggja ≤ 44 m frá hvort öðru (antiparallel), t.d. 2117 „Hellisheiði til austurs“ (7, teiknað austur) ↔ 2134 „til vesturs“ (6, teiknað vestur), bil 25 m. Samræmist aðskildum akreinum hvor teiknuð í sína akstursátt; áfram *ályktun*, ekki heimild.

**RA5 — P3-ákvörðunarprófun aðeins að hluta:** ráðleggingin nefnir að Q1 gæti færst úr PARTIAL í CONFIRMED en segir ekki hvaða AKSTURSSTEFNA-gildi eða VEGHLUTI-flokkar gætu breytt hvaða pörum. Með RA2 er það nú tilgreint (18/20, hringtorg 14/20, 6/7 8/20). Ekki blocker; ráðlegging heldur gildi sem ein hlutlaus lína.

**RA6 — Vefaðgerðir [CC]:** landing-síða, 2 leitir og eitt lýsigagnakandídat (`gatt.lmi.is`, rangt gagnasafn, ekki notað) = nákvæmlega budget (P1); engin WFS/WMS/ArcGIS/GetCapabilities/gagnapakka-tenging opnuð (P4); HTTP/bæti/SHA-256 UNKNOWN heimilað. Ég get ekki staðfest neitt af þessu (engin vefskrá); skýrslan er samkvæm sjálfri sér og retained gögnum. `cc-report` fullyrðir 'git status/diff --check hreint' — [CC].

### 3. Hvað niðurstaðan þýðir

- **Engin runtime-regla til; engin heimild fyrir stefnu staðfest.** Q1 PARTIAL, Q2 UNKNOWN. Q3 gefur *skilgreint* orðalag fyrir akreinar/ramp/hringtorg-stykki í sama lagi og geometry, en ekki „einstefna“ og ekki tengingu kaflastefnu við vertex-röð.
- **Ekki sjálfvirkt framhald.** Möguleg stök ákvörðun eiganda (engin þeirra framkvæmd hér): (a) hætta stefnuleit og halda API óstefndu með `drivingAccess: UNVERIFIED` (mín skoðun: ásættanlegt sem geometry-only útgáfa, en þá ætti viðmót ekki að bjóða „leið“ sem akstursleiðbeiningu); (b) afla (eigandaveitt) PDF fyrir `vegakerfi_ist120_2024_1` (Q1); (c) afla skjalfestingar á kaflastefnu/vertex-röð í færð-laginu (RA1) — hagnýtari fyrir núverandi gögn, því engin cross-layer-tenging þarf; (d) síðar, sérstök reviewable policy-lota á *einu* retained stykki (t.d. hringtorg 36807 eða Hellisheiðarparið 2117/2134) — aðeins ef eigandi vill; engin GetFeature þarf til að hefja hana ef (c) fæst.

### 4. Takmörk

Ég gerði enga heimildaleit og engin net-köll; vefniðurstöður CC eru óstaðfestar. Tölur mínar eru úr tier-2 retained gögnum og sýna umfang, ekki rétta akstursstefnu. Hringtorgs-/akreinaályktanir eru ekki lagaleg ályktun og ekki akstursheimild. Directed-kjarni, API og dataset eru óbreytt og ósnert.

**Next:** Ripley lokamat (PASS tillaga; RA1 orðalagsleiðrétting og RA3 fyrirvari æskileg í authority-report); eigandi velur (a)–(d); engin ný lota án hans.


## Ripley lokamat — 2026-11-18

**PASS fyrir afmarkaða skjalarannsókn.** Jonesy PASS samþykkt. RA1 rökvilla og RA3 fyrirvari leiðrétt beint í authority-report.md; engin ný CC/review-umferð. VEGHLUTI er á sömu færð-fitjum og geometry og þarf ekki Q2 crosswalk; kaflastefna er ekki staðfest sem vertex-röð. Ráðlegging leiðrétt að þessum hagnýta heimildaskorti. Q1 PARTIAL, Q2 UNKNOWN, Q3 aðeins staðfest orðalag kóðaskilgreininga, ekki runtime-akstursheimild.

Sjálfstætt: lesið retained extracted-text:108–114; PDF SHA-256 ba4205e209a28bb19fd8f64d59cba81abb738c8a37378f747cc2df17cb3323aa staðfest; runtime JSON 255 línur, VEGHLUTI 1 = 190, 8 = 1, 0 = 0 talið. RA2 leiðréttar paratalningar og RA4 geometry-athuganir eru eignaðar Jonesy, ekki sjálfstæð endurkeyrsla Ripley. git diff --check hreint fyrir lokamat; status sýnir ócommittað geometry/API/dataset úr fyrri lotum auk workflow, ekki hreint checkout. Engin app-próf/lint/build keyrð vegna skjalabreytinga.

Vefaðgerðir og budget-notkun eru CC-eignaðar, engin raw vefskrá og engin endursókn hér. Minniháttar ferlisfrávik/óskýrleiki skráð í authority-report: fallback eftir enga tengingu á lendingarsíðu og utanaðkomandi ótengdur metadata-kandídat fremur en tengt lýsingarskjal. Engin niðurstaða byggir á honum; ekki blocker á afhendingu retained staðreynda/UNKNOWN. Þetta samþykki víkkar ekki heimildir til netöflunar.

Þessi áfangi CLOSED, #501 í heild ólokið. Engin runtime-regla, kóðabreyting, commit, push, deploy eða GitHub-aðgerð. Næst er ákvörðun eiganda hvort afla eigi staðfestingar á kaflastefnu/vertex-röð í færðarlaginu; engin ný lota sjálfkrafa.
