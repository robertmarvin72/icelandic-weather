# #502 Frá/Til og leiðarval á Winter Route — Jonesy result review — 2026-11-23

Yfirfarið: `cc-report.md`, `approved-prompt-v1.md`, `prompt-review.md`, `CURRENT.md`, `src/pages/WinterRoute.jsx` (þ.m.t. `WinterRouteGeometrySection`, `PlaceField`, `GeometryResultView`, mode-rofi og legacy-gating), `src/lib/winterRoutePlaces.js`, `src/lib/winterRouteGeometryResponse.js` (+ bæði próf), `src/pages/WinterRoute.test.jsx` (#502-hluti), `translations.winterRoute.js` (nýir lyklar), `evidence/fixtures-gen.mjs` og öll sjö skjáskotin.

## Niðurstaða

**PASS með S1–S2 sem ég mæli með að verði lagað áður en eigandi lokar — engir virknisblockerar.** Kjarninn er réttur og vel afmarkaður: sjálfgefin stilling *Velja staði* án beiðni við mount, legacy-sókn lazy og gated með early-return á undan dedup-ref, báðir hlutar mounted með `hidden` (ekki ternary), draft ≠ applied felur niðurstöðu, `URLSearchParams`, full svarvalidering (from/to/schemaVersion/tier/status/`selectedOption`-echo), `400 unknown_place_id` = sama „engin leið“ og `200 unsupported`, valkostir aðeins þegar `options.length > 1` með i18n-merkjum eftir `id`, ekkert af `lengthNote`/`label`/`coordinates`/`slices` í DOM. Ekkert snert undir `api/`, `server_data/`, `vite.config.js`, `package.json`, `AppRoutes`. **Eini raunverulegi gallinn sem ég staðfesti sjálfur er S1: fókus tapast við smell á valkosta-/retry-hnapp** (lyklaborðsnotandi lendir á `<body>`). Hann er innan beinnar 502-hegðunar og lagast í einni lítilli lagfæringu; Ripley/eigandi ákveða hvort það gerist fyrir lokun. #503 veður/færð er ekki komið og CC fullyrðir það ekki.

## Merking: sandbox vs CC

- **Sandbox (mitt, Linux, Node v22.23.4, vitest 4.1.10, jsdom; afrit af repo-skrám):** endurkeyrsla á sömu 6 skrám, lestur á kóða og prófum, einangruð fókusprófun (S1), skjáskot skoðuð, samanburður á approved-prompt P1–P9 bókstaflega.
- **CC-fullyrt, ekki endurkeyrt af mér:** Windows/PowerShell keyrslan **137/137 (6 skrár, vitest 4.1.10, Node 24.11.0)**, ESLint hreint, `git diff --check`, `git status` innan P9-umfangs, **Playwright 8/8 (502) og 18/18 (486/491) gegn raunverulegu `vercel dev` (3000) + Vite (5173)**, og að legacy-hluti hafi óbreytta hegðun í raunvafra.
- **Ekkert sjónrænt PASS frá mér.** Ég sá skjáskotin (staðfest að þau sýna það sem CC lýsir), en eigandi skoðar síðuna sjálfur.

## Sandbox-staðfesting (óháð)

1. **Approved-prompt:** P1–P9 eru bókstaflega eins og mín í `approved-prompt-v1.md` (hvert atriði `in`-athugað eftir að bil voru jöfnuð).
2. **Próf:** 6 skrár, **137/137 PASS með `--testTimeout=60000`**; `WinterRoute.test.jsx` hefur **77 próf** (58 óbreytt + 19 ný), eins og CC segir. Með sjálfgefnum mörkum féllu tvö próf (S5) í mínu 2-CPU sandbox.
3. **Legacy-gating (P1b):** `useEffect` hefur `if (mode !== WINTER_ROUTE_MODE_LEGACY) return undefined;` á undan `lastRequestedRouteIdRef`-athuguninni, svo skipti fram og til baka endursækja ekki sama `routeId`. Próf „P1(b)“ pinnar bæði „engin `/api/winter-route` í geometry-stillingu“ og „nákvæmlega ein sókn eftir skipti“.
4. **Svarflokkun (P4c/d):** `classifyWinterRouteGeometryResponse` les rétt: ekki-töluleg staða/`null` payload/non-200 → ERROR (nema `400 unknown_place_id` → NO_ROUTE), from/to-ósamræmi, vantar `schemaVersion`/`tier`, óþekkt `status`, og `option` sent en `selectedOption` ekki echo → ERROR. Prófað á lib-stigi, þ.m.t. `invalid_option` og `405`.
5. **121-samsetningartaflan (P7c):** próf staðfestir 50 `geometry_only` / 11 `same_place` / 50 `unsupported` / 10 `400` — sama og mín fylkiskeyrsla.
6. **Fókus-/valkostaprófun (mín, einangrað, ekki í repo):** render á `WinterRoute`, submit rvk→selfoss með stubbaðri raunlaga svörun, `focus()` á „north“-radio, smellur → í hleðslustöðu er hnappurinn **ekki lengur í DOM og `document.activeElement` er `BODY`**; eftir svar er fókus enn `BODY` (nýr „north“-hnappur fær ekki fókus). Sjá S1.
7. **Skjáskot (7 af 7 skoðuð):** rvk→selfoss með valkostum (via Borgarnes, Akureyri, Egilsstaðir, Vík + fyrirvarar), Búðardalur→Tálknafjörður (via 6 staðir, estimated-connector fyrirvari, „leiðin endar nálægt staðnum“, aðkomufyrirvari), Flókalundur→Selfoss og rvk→Búðardalur (sami „engin leið“-texti), Selfoss→Selfoss (same_place án lengdar/ETA), Búðardalur→Hólmavík og mobile EN (óvirkt ástand með víxluðu vali).

## Athugasemdir (S — ekki blockerar nema annað sé tekið fram)

**S1 — fókus tapast á valkosta-/retry-hnappi (staðfest í sandbox; P3c/P7b „lyklaborð/fókus“).** `GeometryResultView` er afmáð á meðan beiðni er í gangi (`isCurrentLoading` skiptir út fyrir hleðslutexta), svo hnappurinn sem notandinn smellti á (`role="radio"` eða „Reyna aftur“) hverfur og fókus fer á `<body>`; sama gildir um „Reyna aftur“ samkvæmt kóða (ekki sér-prófað). Lyklaborðsnotandi þarf að Tab-a frá toppi síðunnar eftir hvert valkostaskipti. Lágmarkslagfæring: eftir að svar kemur eftir *notandasmell* á valkost/retry, færa fókus á valinn radio (ref + `focus()` aðeins á því svari), eða halda niðurstöðunni mounted með `aria-busy` á meðan beðið er. Bæta `toHaveFocus`-prófi við. Þetta er ekki „fókusstuldur“ við leit/síun (sem CC forðast rétt), heldur fókustap við notandaaðgerð.

**S2 — próf sem approved-prompt bað um en vantar á component-stigi.** (a) Engin lyklaborðs-/fókuspróf í geometry-hlutanum (P3c, P7b); (b) **Enter í leitarreit óprófað** (P3f krafðist þess að hegðunin væri „skilgreind og prófuð“; CC skráir í cc-report að form-submit sé native, sem er rétt út frá kóðanum, en ekkert próf pinnar það); (c) **núllstilling `option` við par-/víxlbreytingu (P6d)** er aðeins til staðar *byggingarlega* (`handleSubmit` sendir alltaf `null`) — ekkert component-próf; (d) **frame-level Profiler-próf (P4e)** er til fyrir legacy (V2) en fyrir geometry er aðeins „reverse-order resolution“-prófið; render-time lykilgríman (`requestState.key === currentKey`) er rétt í kóðanum; (e) **`submitDisabled`** hefur ekkert sérpróf (CC viðurkennir það). Tillaga: 3–4 lítil próf, ekki ný prófaumgjörð.

**S3 — aðgengi: gagnvirkir hlutar inni í `role="status" aria-live="polite"` og `role="radio"` án örvalykla.** Valkostahópur og „Reyna aftur“ eru inni í sama live-svæði og niðurstaðan, svo skjálesari les allan hópinn upp aftur við hvert skipti. Þetta er ekki rangt, en P3e bað um *eitt* aria-live svæði; CC túlkar það sem eitt á hvern óháðan hluta (request-staða + sitt „engar niðurstöður“ á leitarreit) og skráir ákvörðunina — ég tek hana gilda, Ripley staðfestir. Valkostirnir eru `<button role="radio">` hver með sitt tabstop (engin roving tabindex/örvalyklar eins og APG radio-mynstrið gerir ráð fyrir); `aria-pressed`-hnappar eða raunveruleg `<input type="radio">` væru einfaldari. Valfrjálst.

**S4 — sjálfgefin staða „Velja staði“ gerir legacy-flæðið valfrjálst.** Eðlilegt og í samræmi við P1a, en gamla Rauðavatn–Vík/Borgarnes-veðrið er nú á bak við annan smell. Ef sú síða hefur umferð (tenglar á „Færð Rauðavatn–Vík“ í footer o.fl.) þarf eigandi að vera meðvitaður; þetta er ákvörðun, ekki galli.

**S5 — V1 (a)/(b) próf eru viðkvæm fyrir hraða.** Í mínu 2-CPU sandbox fór V1 (a) yfir 5000 ms (5013 ms) og V1 (b) yfir 10 000 ms (10 004 ms — prófið sem CC gaf 10 000 ms timeout) með sjálfgefnum mörkum; þau standast með `--testTimeout=60000`. Rótin er að báðir hlutar eru nú alltaf mounted og `switchToLegacyMode` notar `findByRole` með nafnaregex yfir stærra tré undir fake timers. Þetta afsannar ekki fullyrðingu CC (137/137 á Windows), en gæti flöktað á hægari CI/vél. Ódýrari fyrirspurn (t.d. `getByRole("button", { name: <nákvæmur strengur> })`) eða breiðara timeout á þessum tveimur væri nóg.

**S6 — sjónrænt (eigandi ákveður; ekki galli í mínu mati).** (a) Á desktop eru leitarreitirnir mjóir (~138 px) og placeholder er skorinn („Leita að upphafs…“, „Leita að áfangast…“); (b) h1 sýnir *par* líka þegar niðurstaðan er „engin leið“ eða `same_place` („Reykjavík (Rauðavatn) → Búðardalur“, „Selfoss → Selfoss“) — heimilað af P1e (beitt par), en gæti lesist eins og leið sé til; (c) valinn valkostur greinist í útliti aðeins með lit/ramma (og `aria-checked` fyrir skjálesara).

**S7 — CC-fullyrt: raunvafri og legacy.** Playwright 8/8 og 18/18 og skjáskotaskoðun eru CC-fullyrt (þjónusturnar voru þegar keyrandi utan lotu og CC notaði þær óbreyttar, eins og promptið leyfði). **Legacy-flæðið var ekki endurprófað á raunneti í vafra** (gögn þarf úr Vegagerðinni/Open-Meteo) — óbreytt kóðaleið og núverandi próf standa. Smáatriði: athugasemd í `WinterRoute.jsx` nefnir „Rauðavatn (Rauðavatn) → Selfoss“ sem dæmi; rétt heiti er „Reykjavík (Rauðavatn)“.

## Mörk þessarar yfirferðar

- Ég keyrði ekki Playwright/raunvafra, Windows/PowerShell, ESLint, `git status` né `git diff --check`; vitest-keyrsla mín er á Linux/jsdom á eigin afritum.
- Ég las ekki GitHub #502 (kröfur eru úr prompt) og endurkeyrði ekki `fixtures-gen.mjs` gegn raunhandler í þessari lotu (handler-snið og 121-taflan eru staðfest úr fyrri sandbox-keyrslu minni, byte-eins handler).
- Fókusprófun mín náði til valkostahnapps; „Reyna aftur“ og leitarreitir eru metin af kóða.
- Ekkert sjónrænt PASS; engin umferð 2 nema eigandi biðji.

**Næsta:** Ripley lokamat; ákveða hvort S1 (+ S2 prófin) fari í eina stutta CC-lagfæringu (focused, ekki umferð 2) áður en eigandi skoðar `/winter-route` sjálfur (320–360 px og desktop, IS/EN, lyklaborð, valkostir, `same_place`, „engin leið“), commitar/pushar og lokar #502.


## Ripley lokamat — 2026-11-23

**Tæknilegt PASS; eigandalokaskoðun eftir.** Jonesy review og approvedprompt/CCreport lesin. Eini sýndi virknigallinn S1 lagfærður beint innan502: eftir notandaaðgerð áoption/retry er fókus endurheimtur ánýjan valinnoption, retry eða stöðuganSýnaleiðhnapp. Ef notandi hefur fært fókus annars staðar, breyttdraft eða falið geometrymode er fókus ekki færður. Engin endurheimt við leit/venjulegtfetch ánnotandafókusintent.

S3: optionradiohnappar fá örvalyklavirkni ogselectedtabstop;engin dependency/comboboxframework. Live-svæðistúlkun CC (eitt áóháðanhluta) samþykkt, ekki ný refactor/hardeninglota. S7athugasemd umReykjavík/Rauðavatn leiðrétt. S6sjónræntpolish ekki blocker; legacy-mode ákvörðun var ísamþykktuP1ogheldursér.

S2: þrjú nýfocusedcomponentpróf: örvalykill+northfókus+swapoptionreset; retryendurheimt ogfókus ekki stolinn frásearch; submitDisabled ogProfilercommit-gríma ádraftbreytingu. Nú80componentpróf (58legacy/19CC/3Ripley),samtals **140/140 á6skrám**,Vitest4.1.10/Windows,sjálfstæðkeyrslaánaukinnatestTimeoutflaggs. Sjö JS/JSX/i18nskrár ESLint hreint; diff-check án villna (LF/CRLFviðvaranir áeldribreytumskrám). Ekki fullsuite/mutation. Enter ísearch var áður CC-raunvafraprófað,ekki nýttcomponent-próf hér; ekki fullyrt aðallirvalfrjálsirS2pinnar séufullgerðir.

Sjálfstæð raunvafraathugun Ripley meðCUA á http://localhost:5173/winter-route: upphafVeljastaði ánfetch, Sýnaleið→raunSelfossoptions, hægriörfrásouth→north, raunsvarumBorgarnes/Akureyri/Egilsstaði/VíkogAXfókusstaðfestur ávalinnnorthhnapp eftirhleðslu. Screenshot raunvafra skoðað: skýr aðgreining staðavals/fastraveðurleiða, disclaimer,áberandifókushringur. Ekki ný mobile/ENeðalegacy-realnetkeyrsla; þau sjöCCskjáskot/8e2eog18legacy-e2e eru áfram CC-eignuð. Engin ný screenshot-skrá vistuð íþessariCUAathugun; ekki búa til evidenceclaim.

#503veður/færðnýrraleiða ekkiinnleitt.11staðir/60óstuddpör,geometry-only/aðkomumörk ogTcoveragefyrirvarar haldast. Enginnbackend/runtime/entitlement/scoring/newdependency/staðaþekjuvíkkun. Engin önnurCC/Jonesy-reviewumferð nauðsynlegefeigandi samþykkir síðuna.

Stage RESULT_REVIEW þar tileigandi skoðar/samþykkir /winter-route. Þá má merkja502lotuCLOSED;GitHublokuneftir eigandayfirferð/commit/pushogsérstakriheimild. Enginncommit/push/deploy/GitHubfráRipley.


## Ripley endanlegt lokamat — 2026-11-23

**PASS.** Eigandi samþykkti síðuna með „Samþykkt“ eftir lokaskoðunarskrefið. Fyrra tæknilegtPASS, sjálfstæð140/140focusedpróf/ESLint og raunvafrafókusathugun standa óbreytt; engin ný prófakeyrsla eða kóðabreyting. Sjónræna samþykkið er eigandans.

CURRENT→CLOSED fyrir ticket-502. Frá/Til-leit/víxlun/leiðarval og stöðuflæði afhent innan samþykkts11staðaMVP-umfangs; föstuVík/Borgarnesveðurleiðir áfram aðgengilegar ísérstillingu. Veður/færðnýrraleiða er ekki komið; #503tekurviðþvívelskilgreindaumfangi. Gagnagöt/óstaðfestakstursaðgengi haldast heiðarleg,engin nýstaðaþekja.

GitHub#502ekkilokaðhér. Eigandiyfirfer/commitar/pusharhandvirkt;GitHublokunaðeinsámeðsérstakriheimildeftirpush. Enginncommit/push/deploy/GitHub eða sjálfvirknæstalota.
