# #485 — result review, loka-prófun (`approved-prompt-v10.md`)

## Jonesy result review - umferð 1 - 2026-11-03

Yfirfarið: `approved-prompt-v10.md` (SHA256 3afab53da88129b2cab5b589f86c3e488870ca0d640411ea1e77343564a59e80), `cc-report-final-probe.md`, `final-probe-request.md`, `final-probe-sample.json`, dagsett viðbót í `final-bounded-report.md`, `final-bounded-plan.md`, `final-bounded-result.json`, CURRENT-handoff CC. Ekkert keyrt á vél eiganda; ég las engan lykil og gerði enga netbeiðni (hvorki á Open-Meteo né annað); allt sannreynt úr varðveittum skrám í sándbox.

**Verdict: PASS (RESEARCH GO, afmarkað).** Sýnið, sem CC varðveitti, stenst hvert svarskilyrði í v10 þegar ég reikna það sjálfstætt. Niðurstaðan er bundin við prófaða 24 klst. UTC-gluggann (2026-11-04T00:00–23:00), þessa sex punkta og þessar fimm breytur, eins og S1 krefst. Þetta er ekki product-GO, birtingarheimild né staðfesting á Production/Preview. Þrjár litlar athugasemdir (N1–N3) krefjast engra nýrra prófa.

### Staðfest af mér (VERIFIED SAMPLE, sándbox, aðeins úr skrám)
- **Hash:** `final-probe-sample.json` = c9d97d6493f0ac6e88597b30d3928ab905d3aca567f86ac533ad9f6cfcc0eea8 (19 086 B), eins og CC skrifar. `final-bounded-plan.md` = 7c5d61f8... og `final-bounded-result.json` = 94e06cbe... eru óbreytt frá fyrri tilraun. Fyrri hluti `final-bounded-report.md` (4 403 B) er varðveittur; viðbótin kemur á eftir `---`.
- **Röð atburða (mtime, UTC):** plan og fyrri URLError 18:05:37; v10 18:15:21; `final-probe-request.md` 18:19:19; beiðni 18:20:07 (samkvæmt CC); sýni 18:21:57; skýrsla 18:23:06; cc-report 18:24:08; CURRENT 18:24:34. Lykillausa lýsingin er því skrifuð á undan beiðninni (mtime-röð, ekki sönnun á óbreytileika). Glugginn var enn algerlega framundan kl. 18:18:46Z, svo upprunalegi glugginn var réttilega notaður.
- **Efni sýnis, reiknað af mér:** nákvæmlega sex punktar; umbeðin hnit jafngilda frystu hnitunum í plani í réttri röð; hver punktur hefur öll 24 tímagildi `2026-11-04T00:00`…`T23:00` í réttri röð; fimm raðir af lengd 24 án null/óendanlegra/bool-gilda; `utc_offset_seconds` = 0; einingar nákvæmlega `iso8601`, `°C`, `m/s`, `m/s`, `mm`, `wmo code`.
- **S2 (haversine, endurreiknað):** hver niðurstaða er nánust sínum eigin umbeðna punkti; fjarlægð til eigin punkts 0,93 / 0,73 / 0,82 / 0,60 / 2,97 / 0,48 km, næsti annar punktur að minnsta kosti 7,7 km; engin jafntefli; sex ólíkir reitir. Stemmir við töflu CC.
- **Sanity á gildum:** hiti 1,2–8,0 °C, vindur ≤ 9,6 m/s, hviður ≤ 14,5 m/s og aldrei lægri en vindur, úrkoma ≥ 0 (≤ 3,5 mm/klst.), WMO-kóðar {0,1,2,3,45,51,53,55,61,63} eru allir gildir heiltölur. Ekkert bendir til brenglaðs svars; þetta er skynsemispróf, ekki gæðamat á spá.
- **Leynd:** engin `apikey`/`api_key` strengur í sýninu; það er afmarkað endurbyggt úr leyfðum reitum (`endpoint`, glugga, `timezone`, sex punkta), ekki hrátt svar. Lykillinn er ekki í neinu varðveittu skjali sem ég las. Ég hef ekki lykilinn og gat því ekki leitað að gildi hans; sú athugun er CC-eignuð.
- **Umfang:** nýjar skrár í verkefninu eru aðeins `final-probe-request.md`, `final-probe-sample.json`, `cc-report-final-probe.md`, viðbót í `final-bounded-report.md` og CURRENT. Engin kóðabreyting sést í ticket-485 möppunni; `approved-prompt-v9.md` er áfram withdrawn.

### CC-eignað (ekki sannreynt af mér)
HTTP 200, 8 494 B, 247 ms; að beiðnin fór á `customer-api.open-meteo.com` með gildum lykli; `redirect:"error"`, 30 s tímamörk og 1 MiB þak; proxy-breytur óstilltar (já/nei); að netheimild var veitt fyrir þessa einu beiðni; að skriftan var fjarlægð; git status/HEAD (76721c56... óbreytt). Sýnið sjálft sýnir ekki hvaða hýsill svaraði. Þegar HTTP 200 og lykill fylgja er það samt sú niðurstaða sem prompt kallar á; þetta er rakið hér svo hún sé merkt rétt.

### Athugasemdir (ekki skilyrði)
- **N1 (LOW) – fyrirsögn skýrslu:** `final-bounded-report.md` byrjar enn á „Niðurstaða: PARTIAL“ (fyrri tilraun, varðveitt eftir kröfu) og RESEARCH GO kemur aðeins neðar. Ein lína efst með tilvísun í dagsettu viðbótina kemur í veg fyrir misskilning. Ripley/eigandi ákveður; ekki breytt af mér.
- **N2 (LOW) – frávik í orðalagi:** v10 S3 segir „inline-skrifta“; skýrslan segir í annarri málsgrein að venjuleg `.mjs` skrá hafi verið keyrð einu sinni úr scratchpad (utan verkefnis, fjarlægð). Hvorugt vistaði lykil samkvæmt CC og þetta breytir hvorki öryggi né niðurstöðu, en lýsingarnar tvær ættu að vera eins. Prentvilla „8 494 bygt“ í viðbót.
- **N3 (INFO) – reitshæð:** sjálfgefið `cell_selection=land` gaf reitshæðir 10–287 m. Hvort reitshæð við Hellisheiði og aðra kafla lýsir raunhæð vegarins er UNKNOWN; það er gæðaspurning um spána, ekki svarskilyrði þessarar rannsóknar, og engin ný próf eru lögð til.

### Hvað þetta lokar og hvað ekki
Lokar: eina óstaðfesta forsendu #485 — að greiddi customer-hýsillinn skili fullnægjandi punktaspá (breytur, einingar, 24 klst. UTC) fyrir sex frystu punktana í venjulegu staðbundnu umhverfi eiganda. Jafnframt fæst fyrsta sýnið um að svarið beri `wind_speed_unit=ms` sem `m/s` (sjá `docs/open-meteo-auth.md` — þar var þetta áður óstaðfest; sýnishornið er CC-aflað).
Lokar ekki (UNKNOWN, óbreytt): önnur spáhorizon/tímar, kvótastaða, Production/Preview-lykill og útgáfurekstur, endurtekin hegðun, gæði spár, samfelld leiðarþekja, ETA/komutími. Réttinda-/HTTPS-/leiðarniðurstöður eru endurnýttar úr eldri rannsókn, ekki prófaðar aftur. Engin innleiðing, birting, MVP eða GitHub-aðgerð er samþykkt.

### Takmörk yfirferðar
Aðeins varðveittar skrár; engin óháð beiðni, enginn lykill og engin keyrsla á vél eiganda. Aðeins ein 24 klst. mæling á einum degi. Allar CC-eignaðar fullyrðingar hér að ofan eru merktar sem slíkar.

### Næst
Eigandi → Ripley „Jonesy búinn að reviewa CC“ fyrir lokamat. Ripley ákveður hvort N1–N2 séu lagfærð og lokar verkefninu samkvæmt README.

## Ripley — lokamat, 2026-11-03

**PASS / RESEARCH GO (afmarkað).** Lesið v10, CC-skýrslu, Jonesy-yfirferð og lokaskýrslu. Sjálfstætt endurreiknað úr varðveittu sýni, án nets eða lykilaðgangs: SHA256 c9d97d6493f0ac6e88597b30d3928ab905d3aca567f86ac533ad9f6cfcc0eea8; sex fryst hnit í réttri röð; 24 nákvæm UTC-gildi og offset 0; allar fimm 24-staka raðir án null/bool/óendanlegra gilda; réttar einingar. Haversine til allra punkta endurreiknað: hver niðurstaða nánust eigin punkti (0,933 / 0,734 / 0,822 / 0,605 / 2,967 / 0,482 km). Öll afmörkuð svarskilyrði standast.

HTTP 200, customer-hýsill/lykilnotkun, ein beiðni og flutnings-/leyndarmálavarnir eru áfram CC-eignaðar framkvæmdarupplýsingar, ekki sjálfstætt endurprófaðar af Ripley. Engin endurbeiðni gerð. N1 lagfært með núgildandi niðurstöðuvísun efst; N2 orðalag í lokaskýrslu samræmt við tímabundna .mjs-skrá samkvæmt CC og prentvillur lagaðar. Þetta smávægilega frávik frá inline-orðalagi krefst engrar viðgerðar eða nýrrar prófunar. N3 reitshæð/spágæði skráð óstaðfest; ekki svarskilyrði.

Afmarkaðri rannsókn #485 lokið. RESEARCH GO aðeins fyrir prófaða gluggann/punktana/breyturnar, með eldri réttinda-/HTTPS-/færðartengingarniðurstöðum endurnýttum. Ekki almenn product-GO, staðfesting á öðrum horizon, kvóta, Production/Preview, endurtekningu, spágæðum eða samfelldri þekju. Engin innleiðing/birting samþykkt. CURRENT → CLOSED. Engin frekari rannsókn; eigandi sér um commit/push og GitHub-lokun síðar með sérstakri fyrirmælum. Engin GitHub-aðgerð, commit eða push hér.
