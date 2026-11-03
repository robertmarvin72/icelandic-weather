# #485 — síðasta forsenda: greitt punktaspásvar

## Ripley — umferð 1, 2026-11-03

Til Jonesy review. Þetta er tillaga að execution-prompti, ekki keyrsluheimild. Fyrri rannsóknarbiðlarinn og v9 eru áfram aflögð.

### Execution-prompt

Staðfestu eina óstaðfesta forsendu #485: hvort greiddi Open-Meteo-aðgangurinn skili fullnægjandi spá fyrir sex valda leiðarpunkta í venjulegu staðbundnu þróunarumhverfi eiganda.

Lestu AGENTS.md, uppfært CLAUDE.md (sérstaklega „Umfang og aukaverkefni“), docs/ai/README.md og CURRENT.md. Endurnýttu í docs/ai/tasks/ticket-485/: final-bounded-plan.md, final-bounded-report.md, final-bounded-result.json og owner-clarification-2026-11-02.md. Endurnýttu docs/open-meteo-auth.md og docs/ai/tasks/ticket-453/cc-report.md. Greidd API Standard-áskrift er eigandastaðfest; ekki óska endurstaðfestingar. Fyrri URLError án HTTP-svars staðfestir hvorki rangan lykil né bilun þjónustunnar.

1. **Skráðu áður en sent er** lykillausa beiðnilýsingu í final-probe-request.md: punktana sex með óbreyttum hnitum, röð og leiðarköflum úr final-bounded-plan.md; allar fimm breytur, einingar og UTC-glugga. Notaðu upprunalega gluggann aðeins ef hann er enn allur framundan; annars næsta heila UTC-sólarhring, 00:00–23:00 (24 klukkustundagildi). Skráðu keyrslutíma og nákvæman glugga. Frumáætlun og fyrri niðurstöður haldast óbreyttar.
2. **Ein bein customer-beiðni:** GET https://customer-api.open-meteo.com/v1/forecast, sex hnit í sömu beiðni. hourly=temperature_2m,wind_speed_10m,wind_gusts_10m,precipitation,weather_code; temperature_unit=celsius; wind_speed_unit=ms; precipitation_unit=mm; timezone=UTC; start_hour/end_hour samkvæmt skráðum glugga. Sjálfgefið líkanaval; engin IG-fullyrðing. Notaðu tiltækt staðlað verkfæri/runtime, t.d. innbyggt Node fetch, í venjulegu þróunarumhverfi. Ekki nota Vite /api/forecast-proxy: #453 sýnir að hann fer á almenna hýsilinn. Enginn nýr biðlari, hjálparkerfi, pakki eða uppsetning.
3. **Lykill og mörk:** Lestu aðeins OPEN_METEO_API_KEY úr núverandi process-umhverfi eða staðbundinni .env.local í minni. Engin birting lykils, lykilslóðar, heilla umhverfisskráa, request-objecta eða hrára exception/stack-gagna í skipunum, annálum eða skjölum. Ekki setja gildi í CLI-argument. Engar stillingabreytingar. Vanti lykil eða heimilaðan netaðgang, skráðu NOT_TESTED og stöðvaðu; ekki gera það að nýju verkefni. Ein tilraun, engin sjálfvirk endurtekning, redirect eða fallback; staðlað TLS, 30 sek. heildartímamörk og 1 MiB hámark svargagna. Ein HTTP-beiðni getur talist fleiri en eitt staðsetningarkall í kvóta.
4. **Fullnægjandi svar:** HTTP 200 og nákvæmlega sex niðurstöður í beiðniröð. Fyrir hvern punkt: öll 24 skráð UTC-klukkustundagildi, allar fimm jafnlöngu talnaraðir án null/óendanlegra gilda eða óútskýrðra gata; einingar °C, m/s, m/s, mm og WMO-kóði. Skráðu umbeðin hnit og skiluð spáreitshnit/hæð sérstaklega; punktasýni sannar ekki samfellda leiðarþekju. Úrkoma er klukkustundamagn samkvæmt þjónustunni.
5. **Afhending og stöðvun:** Skráðu HTTP-stöðu (eða NO_HTTP_RESPONSE), UTC-tíma, úttekt fyrir hvern punkt/breytu/tíma/einingu og gagnagöt. Varðveittu afmarkað lykillaust JSON-sýni með sex punktum, skiluðum hnitum, tímum, einingum og þessum fimm röðum, ásamt SHA256. Skoðaðu mögulegan leyndarmálatexta í minni áður en vistað er. Við villu skráðu tiltækan öruggan flokkunarkóða/orsök, t.d. DNS-, TLS-, tengingar- eða tímamarkakóða úr innri villu; ekki hrá villuskilaboð eða slóð. Ef orsök er óþekkt, segðu UNKNOWN. Stöðvaðu án viðgerðarlotu eða annarrar beiðni.

Bættu dagsettri niðurstöðu við final-bounded-report.md án þess að eyða fyrri tilraun. GO ef öll ofangreind svarskilyrði standast, með fyrirliggjandi réttinda-/HTTPS-niðurstöðum; PARTIAL ef fullnægjandi svar vantar eða orsök er óstaðfest; NO-GO aðeins ef gögn sýna hindrun fyrir sjálfa samþykktu sýnina. Ekki túlka eina flutnings-/auðkenningarvillu sem varanlegt NO-GO. GO nær aðeins til nýjustu færðar/lokana Rauðavatn–Vík með gagnatíma og spár við valda punkta á notandavöldum tíma. Engin ETA, komutímaspá, framtíðarfærð eða öryggisráðgjöf. Ekki fullyrða staðfestan Production-/Preview-rekstur út frá staðbundinni prófun.

Skrifaðu stutt cc-report-final-probe.md og fylgdu CURRENT.md-lífsferli samkvæmt README. Engar framleiðslu-, kóða-, gagnagrunns-, UI-, rekstrar- eða MVP-breytingar; ekkert nýtt skilmála-, HTTPS- eða leiðarverk. Engin GitHub-breyting, commit eða push. Verkefninu lýkur með þessari niðurstöðu; innleiðing/birting er ekki samþykkt.

### Endurnýting / eina nýja sönnunin

Réttindi, HTTPS, leiðarkaflar og #453 uppsetningarniðurstöður eru endurnýtt. Aðeins eitt raunverulegt greitt spásvar og staðbundin tæknileg niðurstaða þess vantar. Review skal tengja sérhverja kröfu við þau svarskilyrði; ekki hanna nýtt rannsóknarkerfi.

Jonesy verdict: PENDING.

## Jonesy review - umferð 1 - 2026-11-03

Yfirfarið: execution-prompt hér að ofan, `final-bounded-plan.md` (SHA256 7c5d61f8efe5ebc63be3a335552dac1e019c07529f66e64694cddb5dc6b1c9a2, óbreytt frá því sem fyrri tilraun skráði), `final-bounded-report.md`, `final-bounded-result.json`, `owner-clarification-2026-11-02.md`, `docs/open-meteo-auth.md`, #453 `cc-report.md`, uppfært `CLAUDE.md` kafli „Umfang og aukaverkefni“, og varðveitt docs-sample (`iteration-3/samples/openmeteo-docs.html`, SHA256 7c63cb41...). Ekkert keyrt, enginn lykill lesinn, engin netbeiðni.

**Verdict: APPROVED með 4 skilyrðum (S1–S4).** Promptinn er stuttur, þröngur og tengir hverja kröfu við svarskilyrðin; hann hannar ekkert nýtt kerfi, förðar enga nýja kröfu inn úr fyrri lotum og stoppar á einni tilraun. Skilyrðin eru þörf skilgreiningar á þeim kröfum sem þegar eru í prompti, ekki ný verkefni. Í samræmi við „Umfang og aukaverkefni“ er hvert skilyrði tengt við samþykkisskilyrði. Stage helst PROMPT_REVIEW þar til Ripley býr til óbreytanlegan approved prompt; þessi umferð er ekki keyrsluheimild.

### Staðfest (VERIFIED DOCUMENT CONTENT, docs-sample)
- `start_hour`/`end_hour` (yyyy-mm-ddThh:mm) eru skjálfærð fyrir hourly gögn; 00:00–23:00 gefur 24 gildi.
- Fleiri hnit í einni beiðni (komma-aðgreind) skila **lista** af byggingum í beiðniröð; `wind_speed_unit=ms`, `precipitation_unit=mm`, `timezone=UTC` og þessar fimm breytur eru í skjölunum. `cell_selection` er sjálfgefið `land`, svo skilað hnit/hæð geta vikið frá umbeðnum; prompt krefst réttilega að þau séu skráð sérstaklega.
- Hnitin sex eru í plani eins og þær voru frystar (bil milli punkta 8,5–42 km, reiknað af mér úr hnitunum). Því er unnt að sannreyna röð ef skiluð hnit eru borin saman við umbeðin (S2).
- Raðing við fyrri tilraun: URLError áður en HTTP-svar fékkst; orsök UNKNOWN; hvorki lykill né þjónusta sönnuð biluð. Promptið segir þetta rétt.

### Skilyrði (þarf að vera í approved prompt)

**S1 (HIGH-MED) – GO-yfirlýsingin gengur lengra en sönnunin.** „GO nær aðeins til … spár við valda punkta á notandavöldum tíma“. Eitt 24 klst. UTC-gluggasvar fyrir einn dag sannar aðeins þann glugga, þessa sex punkta og þessar fimm breytur. Það sannar ekki aðra tíma/spáhorizon (t.d. þegar notandi velur tíma allt að `forecast_days`), kvóta, gildi lykils í Production/Preview né endurtekna hegðun. Samþykkisskilyrði: PASS-skilyrðin í final-bounded-plan.md, og eigandi hefur áður greint rannsóknar-GO frá product-GO og birtingarheimild. Breyting: orða niðurstöðuna „RESEARCH GO fyrir prófaða gluggann/punktana/breyturnar“; skrá sérstaklega UNKNOWN: önnur horizon, kvóti, Production/Preview-lykill, endurtekning. Engin ný próf fylgja þeirri skráningu.

**S2 (MED) – „beiðniröð“ þarf mælanlegt viðmið.** Svarskilyrði 4 krefst sex niðurstaðna „í beiðniröð“, en Open-Meteo skilar snöppuðum reitshnitum. Breyting: skrá fjarlægð hverrar niðurstöðu frá umbeðnum punkti hennar og frá hinum fimm; röð telst röng aðeins ef niðurstaða i er nær umbeðnum punkti j≠i en punkti i. Tvö hnit sem snappa í sama reit (sömu skiluðu hnit) eru skráð og útskýrð, ekki sjálfkrafa brestur. Samþykkisskilyrði: „nákvæmlega sex niðurstöður í beiðniröð“.

**S3 (MED) – villu-/lykilmeðhöndlun þarf að vera föst í prompti, ekki skilin eftir.** Kröfur í prompti (engin birting lykils/slóðar/raw exception) eru réttar en CC verður að útfæra þær án nýs hjálparbúnaðar. Breyting, til skýringar á núverandi kröfu: (a) beiðni send úr einnota skipun/inline-skriftu sem ekki er vistuð í repo, eða vistuð án lykils og talin upp í skýrslu; (b) lykill lesinn úr process-env eða aðeins þeirri einu línu í `.env.local` í minni; skráin ekki prentuð eða `cat`-uð; (c) `redirect: "error"`, `AbortSignal.timeout(30000)` og lestur svars með 1 MiB þaki; (d) catch-grein skrifar **aðeins** fastan lista (error.name, `cause.code` ef til, tími), aldrei `String(err)`, `err.message`, `err.stack`, `console.error(err)` né `err.input`/URL-reiti — t.d. getur `Invalid URL` villa borið alla slóðina með lyklinum; (e) lykill finnst ekki í úttaki, skýrslum eða JSON-sýni (leit í minni áður en vistað er, eins og prompt segir). Samþykkisskilyrði: „Engin birting lykils … raw exception“ og „enginn nýr biðlari“.

**S4 (MED) – flokkun nettruflunar og umhverfistakmörk.** Fyrri URLError kom áður en HTTP-svar fékkst. Líkleg orsök er takmarkað net í keyrsluumhverfi eða proxy-krafa (INFERRED, ósannað). Breyting: ef villa án HTTP-svars, skrá `cause.code` (t.d. ENOTFOUND/ECONNREFUSED/ETIMEDOUT/CERT-kóði) eða UNKNOWN; skrá einnig hvort HTTP(S)_PROXY-umhverfisbreytur eru stilltar (aðeins já/nei, ekki gildi). Mér vitanlega notar Node `fetch` ekki proxy-umhverfisbreytur sjálfgefið (ekki prófað hér); Python `urllib` gerir það, svo sama net getur hegðað sér ólíkt. Ef verkfærisumhverfi CC þarf netheimild/leyfislista fyrir `customer-api.open-meteo.com` er það leyfi eiganda í lotunni; fáist það ekki: NOT_TESTED samkvæmt núverandi prompti. **Valfrjálst (ekki skilyrði, Ripley/eigandi ákveður):** ein lyklalaus GET-beiðni á sama hýsil fyrir eina tilraunina myndi greina netvandamál frá lyklavandamáli án þess að nota lykil; ef hafnað helst eins-skots tilraunin gild.

### Athugasemdir (engin aðgerð)
- Lestur `.env.local` er eigandaveitt undanþága frá fyrri lotum (final-bounded-plan.md); ég hef ekki afritað eða lesið skrána.
- Kvótakostnaður (6 staðsetningar × 24 klst. × 5 breytur) er hverfandi; prompt viðurkennir fleiri en eitt staðsetningarkall.
- Hluti „GO“-setningar um „nýjustu færð/lokanir“ byggir á endurnýttri réttinda-/HTTPS-niðurstöðu, ekki þessari beiðni; það stendur, en ætti að vera merkt sem endurnýtt í skýrslunni.
- Prompt leyfir ekki viðgerðarlotu og lýkur verkefninu á niðurstöðu. Ef niðurstaða er PARTIAL vegna umhverfis (S4) er það skráð með áhrifum sínum og ekki sjálfkrafa nýtt undirverkefni (CLAUDE.md).

### Takmörk
Þetta er yfirferð á texta, plani og skjölum; ég hef ekki sannað hvernig raunverulegt customer-svar lítur út (UNKNOWN / NOT TESTED). Nothing run on owner machine; ég las engan lykil og gerði enga netbeiðni á Open-Meteo.

### Næst
Eigandi → Ripley „Jonesy búinn að reviewa prompt“. Ripley fellir S1–S4 inn í approved prompt (S4-valkosturinn að vild) og setur READY_FOR_CC. Engin keyrsla fyrr en eigandi samþykkir.

## Ripley — afgreiðsla samþykkis, 2026-11-03

S1–S4 felld inn í approved-prompt-v10.md. Valfrjálsri lyklalausri forprófun sleppt: aðeins ein customer-beiðni. RESEARCH GO afmarkað við prófað sýni; önnur horizon/rekstur skráð UNKNOWN án aukaverkefna. CURRENT → READY_FOR_CC. Engin beiðni keyrð eða lykill lesinn. Næst: eigandi → CC „Prompt approved“.
