# #493 forecast-time — Prófunarlota V1–V5

Ripley, 2026-11-06. Drög til Jonesy-yfirferðar samkvæmt docs/ai/README.md. Samþykkt v1 og result-review.md skilgreina grunnhegðun. V2-lotan nær til prófa, CC-skýrslu og CURRENT-lífsferils. Vörukóði er utan umfangs. Ef próf sýnir vörugalla skal skrá nákvæma endurgerð til lokamats.

- **V1 (U1):** (a) próf þar sem `selectedHour` er þegar sett og glugginn verður síðan tómur → engar mælitölur í sama render (Profiler eða `waitFor`+commit-athugun), veljari sýnir „engin tími“; (b) fake timers/`setSystemTime` færir `now` fram yfir valda klukkustund → ekkert commit með gildum fyrir liðna tímann, fyrsti tiltæki tími valinn; (c) frame-level (sama aðferð og V2) leiðarskipti þar sem nýr gluggi inniheldur ekki fyrra val → ekkert commit með gildum fyrir gamla tímann.
- **V2 (U2):** vitest-próf sem fer í gegnum öll `winterRoute*`-gildi í `translations.is` og `translations.en` og athugar heil orð/orðmyndir (`departure`, `arrival`, `\bETA\b`, `70 ?km`, `brottför`/`brottfar-`, `komutím-`) og finnur ekkert; gætt að óskyldum texta (t.d. „departure“ í öðrum lyklum utan `winterRoute*`).
- **V3 (U3):** tvö próf: val sem er í báðum gluggum helst við skipti A→B (og B→A) án sér-sögu; val sem er ekki í nýja glugganum fellur á fyrsta tiltæka tíma nýju leiðar.
- **V4 (U4):** keyra lyklaborðs-e2e (a.m.k. nýja Borgarnes-prófið) við 375px breidd, eða skrá berum orðum að það var ekki gert; engin staðhæfing um „mjóan skjá“ án þess.
- **V5 (U5):** uppfæra cc-report „Not done/Limits“ með því sem enn er óprófað eftir V1–V4 og með nákvæmri keyrsluskrá (skipanir, fjöldi, niðurstaða) fyrir endurkeyrslu.

Prófin skulu byrja með raunverulegt val og aðgreinanleg mæligildi. Við mínútutikk og leiðarskipti skal commit-athugun skrá millistöður og greina liðinn tíma frá nýju gildi. Prófa varðveislu með tíma sem er annar en fyrsti kostur. Staðfesta 375px viewport og lyklaborðsbreytingu á spátíma með stubbuðu API. Keyra tengd Vitest-próf og viðeigandi Playwright-spec og skrá raunverulega niðurstöðu eða hindrun. Fyrri skýrsla um heildarsvítu inniheldur eitt fall í App.affiliateHolder.test.jsx. Orsök þess er óstaðfest hér. Commit, push og útgáfa eru utan umfangs.

Jonesy verdict PENDING.

## Jonesy review — umferð 1 (2026-11-06)

### Niðurstaða: APPROVED MEÐ SKILYRÐUM W1–W5 (skýringar á aðferð og skýrslugjöf; brjóta inn í approved-prompt-v2 áður en CC keyrir)

Afmörkunin er rétt: aðeins próf, e2e-spec, cc-report og CURRENT; vörukóði utan umfangs; vörugalli sem próf afhjúpar er skráður með nákvæmri endurgerð en ekki lagaður hér; V1–V5 eru óbreytt úr result-review. Skilyrðin hér neðar loka fjórum veikleikum sem í drögunum gætu skilað prófum sem standast án þess að verja neitt, og einni nafnaárekstri.

### Sandbox-athuganir mínar (lestur á staged afritum; ekkert keyrt, ekkert net)

- **Staða:** CURRENT = `ticket-493-forecast-time`, Stage PROMPT_REVIEW, prompt review = `correction-prompt-review.md`, approved prompt enn `approved-prompt-v1.md`; `result-review.md` hefur Jonesy umferð 1 (REVISE V1–V5) og Ripley lokamat (REVISE V1–V5; EPERM við endurnefningu tímaskrár í eigin Vitest-keyrslu Ripley, orsök falls í `App.affiliateHolder.test.jsx` óstaðfest).
- **Prófagrunnur í `WinterRoute.test.jsx` (lestur):** engin notkun á fake timers í `src` (grep tómt) — mínútutikk-próf (V1b) verður sú fyrsta; síðan notar `useNowTicking` `setInterval(…, 60000)` og `new Date()`. Fyrirliggjandi frame-level mynstur er `describe("V2 — render-time route-bound view (frame-level)")` með `recordCommit` í `React.Profiler` og **non-vacuity-staðhæfingu** („probe actually observed the new h1“). `FUTURE_HOURS` hefur aðeins tvær klukkustundir (+2 h, +3 h), `routeAwareFetch` notar sömu `FUTURE_HOURS` fyrir báðar leiðir — V3 þarf því eigin fixtures með a.m.k. þremur klukkustundum og ólíkum gluggum.
- **Nafnaárekstur:** „sama aðferð og V2“ í V1(c) vísar í mínum texta til #491-prófaflokksins „V2 — render-time route-bound view“, en í þessari lotu er V2 líka nafnið á þýðingarprófinu.
- **Þýðingar:** `translations.winterRoute.js` hefur engin tilvik af leitarorðunum í dag (grep umferð 1); JavaScript `\b` virkar ekki rétt með `ö`, `í`, `ó` o.fl.
- **Umfang á tæki (mtime):** engin vörukóðaskrá hefur breyst síðan result review umferð 1 (`WinterRoute.jsx` 1793986675937, `winterRouteSummary.js` 1793986548030, `translations.winterRoute.js` 1793986748493); `correction-prompt-review.md`, `result-review.md` og `CURRENT.md` með mtime 1793987958452.

### Skilyrði

- **W1 — frame-level próf V1 mega ekki geta staðist án þess að sjá millistöðuna.** (a) Tilvísun „V2“ í V1(c) skal orðuð „#491 V2 frame-level prófin (`recordCommit`/`React.Profiler`)“ svo ekki rugli við V2 þessarar lotu. (b) Hvert V1-próf skal innihalda non-vacuity-staðhæfingu í anda #491: probe-ið skráir (i) commit þar sem valið (gamla) `selectedHour` er enn í state en kortin sýna „Spá ekki tiltæk“/engin gildi, og (ii) þar sem við á, síðari commit með nýja gildinum; prófið mistekst ef (i) sést ekki, því án þess hefði það getað staðist fyrir gömlu effect-útfærsluna. Commit-skráin geymi `select`-gildi, fjölda korta með mæligildi og hvort gildi gamla tímans sjáist í DOM.
- **W2 — aðferð við mínútutikk er fastsett.** V1(a) og V1(b) notar fake timers og kerfistíma: `vi.useFakeTimers({ toFake: ["setInterval", "Date"], … })` (eða sambærilegt), `vi.setSystemTime` fram yfir valda klukkustund og `await act(async () => { await vi.advanceTimersByTimeAsync(60000); })` til að keyra raunverulegt `useNowTicking`; (a) færir tímann fram yfir **allar** klukkustundir glugga (tómur gluggi með valið enn í state), (b) aðeins yfir fyrstu af a.m.k. þremur. Fixtures með a.m.k. þremur klukkustundum. Fake timers skulu endurstillast í `afterEach` (`vi.useRealTimers()`) svo þau leki ekki í önnur próf í skránni; engin breyting á vite/vitest-stillingum. Ef fake timers duga ekki með RTL-`waitFor` í þessu umhverfi skal skrá nákvæma hindrun í stað þess að veikja prófið.
- **W3 — þýðingarpróf V2 má ekki vera tómt eða rangt.** (a) Regex notar Unicode-meðvituð mörk (`u`-fáni og `(?<![\p{L}\p{N}])…(?![\p{L}\p{N}])` eða stofn-regex fyrir íslenskar beygingar eins og `brottf[aö]r`, `komutím`), ekki `\b`. (b) Prófið skal fara yfir **alla** lykla sem byrja á `winterRoute` í `translations.is` og `translations.en` og staðfesta að talan sé > 0 og jöfn í báðum málum (annars gæti síun skilað tómu safni og prófið staðist án gagna). (c) Jákvætt viðmið: sama regex finnur hver leitarstrengur í litlu sýnisfylki („Estimated departure time“, „Áætlaður brottfarartími“, „Estimated arrival“, „Áætluð koma“, „70 km/h“, „komutími“), svo sannað sé að matcherinn greinir.
- **W4 — V3 og V4 skulu sanna hegðun, ekki aðeins að eitthvað sé sýnilegt.** V3: leið A og B hafa ólíka glugga (a.m.k. 3 tíma) og aðgreinanleg mæligildi eftir klukkustund; prófa **bæði** A→B og B→A, þar sem valið er annað en fyrsti kostur; staðfesta valinn `select`-gildi og að kort/samantekt sýni gildi **þess** tíma (ekki aðeins `select.value`); fallback-tilfelli: val fyrir utan nýja gluggann → fyrsti tiltæki tími nýju leiðar og kortin sýna gildi hans. V4: Playwright-prófið setur `page.setViewportSize({ width: 375, … })` og staðfestir mælda breidd í prófinu sjálfu (t.d. `page.viewportSize()`), notar lyklaborð til að fókusa veljarann og skipta um spátíma, og staðfestir að **samantekt og kort** uppfærist í gildi nýja tímans, að beiðnafjöldi er óbreyttur og að `scrollWidth ≤ clientWidth`. Aðeins Borgarnes-prófið dugar ekki sem eina sönnun fyrir „Vík eða Borgarnes“ — annað hvort bæði eða skýr afmörkun í skýrslu.
- **W5 — hindranir, skýrslugjöf og umfang.** (a) EPERM-hindrunin: CC skráir nákvæma skipun, villuboð og hvort hún endurtekur sig; umhverfisbundin lausn (t.d. `TMPDIR`/`TEMP` eða cache-slóð með umhverfisbreytu á skipanalínu) má nota ef hún breytir engri skrá í repo og er skráð sem lausn; ef tilraunir stöðvast áfram skal hver ókeyrð prófun skráð `NOT_RUN` með ástæðu og engin staðhæfing um að ný próf „standist“. (b) `cc-report.md`: dagsettur viðauki (append-only), ekki endurskrifun; viðaukinn leiðréttir „Not done/Limits“ úr fyrri skýrslu, geymir keyrsluskrá (skipun, fjöldi prófa, niðurstaða) og aðgreinir CC-keyrt frá ókeyrðu. (c) `App.affiliateHolder.test.jsx`: orðað „óbreytt af þessari lotu (`git status`), orsök óstaðfest“; ekki „flaky/pre-existing“ nema sönnun sé í skránni (t.d. keyrsla á hreinu tré). (d) Umfang: aðeins `WinterRoute.test.jsx` (og nýtt lítið prófasafn ef CC kýs), bæði e2e-spec, `cc-report.md` og `CURRENT.md`; engin vöru-, þýðinga- né stillingaskrá; engin núverandi próf eytt eða veikt (fjöldi/titlar fyrir og eftir skráðir); `git status --short` í skýrslu.

### Athugasemdir (ekki skilyrði)

- **N1:** Dag/nótt-prófið (N3 úr fyrri lotu) má bæta við hér ef hentar, en er ekki skilyrði.
- **N2:** Ef V1-prófin afhjúpa raunverulegan vörugalla gildir drögin sjálf: stöðva, skrá nákvæma endurgerð, engin vörubreyting.
- **N3:** Lýsing „velur fyrsta tiltæka tíma“ í V1(b) á við **eftir** að effect hefur keyrt; millistöðin (W1) er það sem T2 ver.

### Mörk

Prompt-review; engin gögn eða appkóði breytt og engin keyrsla heimiluð af mér. Ég keyrði ekki Vitest, Playwright, lint, build, git eða vafra á vél eiganda og gerði engin netköll; allt hér er lestur á staged afritum í sandbox. Ég get ekki staðfest EPERM-hindrunina (hún er skráð af Ripley). Production NOT_TESTED. Stage helst PROMPT_REVIEW. Næsta skref: Ripley býr til `approved-prompt-v2.md` með W1–W5 og setur READY_FOR_CC; Róbert commit-ar sjálfur.

## Ripley, 2026-11-06

W1–W5 felld inn í approved-prompt-v2.md. CURRENT er READY_FOR_CC.
