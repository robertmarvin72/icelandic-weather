# Winter Route — landsþekja, umfang og næsta framkvæmd

## Ripley — fyrsta afhending og Jonesy-review, 2026-11-14

Eigandi sendi nýjar heildarkröfur og mynd sem sjónrænt viðmið. Hann staðfesti síðan „Já, allir 56 staðirnir“ þegar talning leiddi í ljós 56 heiti í skjali merktu 55. Heimild: `nationwide-owner-scope.md`. Enginn staður er felldur út eða bætt við. Fyrri road93-prompt-review.md er ekki lengur virk útgáfuafmörkun; gögn þess eru áfram endurnýtanleg.

Fyrsta afhending Ripley er `nationwide-status.md`: núverandi kóði, nákvæmur listi 56 með stöðu retained-gagna, vöntun og tillaga um sameiginlega leiðarkafla og nauðsynlegar miðabreytingar. Engin app- eða GitHub-breyting framkvæmd. Þetta uppfyllir kröfu eiganda um stutta stöðugreiningu áður en umfangsmikil innleiðing hefst.

### Jonesy yfirferð

Lesa docs/ai/README.md og CURRENT.md, nationwide-owner-scope.md og nationwide-status.md. Yfirfara aðeins nauðsynlegt kóða-/miðasamhengi, ekki allar fyrri rannsóknarlotur.

- Nákvæmlega öll 56 eigandaheitin, Keflavík og KEF aðskilin, engin Garðabæjar/Reykholts/72-lista viðbót. Sömu staðir eiga að vera í Frá/Til; aliases fjölga ekki stöðum.
- Aðgreining valstaða, veðurpunkta og innri leiðarhnúta. Hnit eða IDBUTUR eitt sannar ekki akstursleið. Óstudd tenging fær sýnileg skilaboð án þess að staður hverfi af eigandalistanum.
- Vestfirðir, Snæfellsnes og Reykjanes eru ófrávíkjanlegt umfang; landsnet sameiginlegra vegkafla, ekki aðeins Hringvegur eða 56×55 sérleiðaskrá. F-vegir/hálendi/ferjur ekki sjálfgefnar; engin sjálfvirk hjáleið.
- Mynd er aðeins sjónrænt viðmið. Kort/listi eiga síðar að birta sömu leið, fækkun kortamerkinga breytir ekki leitarlista.
- Núverandi tvær föstu leiðir eru ekki full landsþekja. Stöðugreiningin fullyrðir ekki að öll eldri gögn séu ónýt eða allir vegir lokaðir; óstaðfest í þessari yfirferð er ekki sönnun þess að heimild sé ekki til.
- Prófunaráætlun síðar nær leiðum innan/milli landshluta, viðsnúningi, sama stað, óstuddri tengingu, lokun, röðun og sama spátíma. Engin ETA/komutími/öryggisskor.

Skila APPROVED/REVISE á þessu samhengi og næstu afmörkun, með aðeins sýndum blockerum. Ekki innleiða meðan review stendur. Ekki gera endurkeyrslu eldri gagnaprófa eða nýja umfangsmikla rannsókn að forkröfu fyrir samþykki rétta staðalistans.

### Tillaga að næsta framkvæmdarprompti eftir review

Festa eina sameiginlega 56-staða vöruskrá með stöðugum ID og heitum, aðskildum aliases og sýnilegri staðfestingarstöðu; endurnýta fjóra eigandapunkta án þess að búa til hnit fyrir aðra. Samræma #492/#493/#500–#504 við kröfurnar sem raktar eru í nationwide-status.md. Síðan tengja raunverulega samsetningu leiða og Frá/Til samkvæmt núverandi miðaskiptingu; svæðislotur mega raða vinnu, ekki minnka vöruna.

Þetta er ekki enn CC-framkvæmdarprompt: eftir samhengi-review þarf approved-prompt með nákvæmum leyfðum skrám, viðtöku og prófum fyrir fyrstu raunbreytingu. Engin framkvæmd á road93-drafti eða eldri approved-prompt í stað þess. Ekki stofna sjálfkrafa viðbótar hönnunar-/rannsóknarlykkjur. Ef Jonesy finnur nauðsynlega breytingu á stöðugreiningu, gera minnstu skýru leiðréttingu án þess að endurskilgreina eigandalistann.


## Jonesy review — umferð 1 (2026-11-14)

**Niðurstaða: APPROVED — samhengi, staðalisti og næsta afmörkun; engir sýndir blockerar.** Athugasemdir NB1–NB4 eru leiðbeiningar fyrir approved-prompt eða valfrjálsar textaleiðréttingar; þær tefja ekki og skapa ekki nýja rannsókn. Stage helst PROMPT_REVIEW þar til Ripley skrifar approved-prompt (ekki CC-framkvæmd enn).

### Sandbox-staðfest (mitt, aðeins lestur; engin köll; ekki GitHub)

- **56 staðir**: `nationwide-owner-scope.md` listinn = 56 heiti, 56 einstök; sama röð og orðrétt sömu heiti í stöðutöflu `nationwide-status.md` (56/56, engin viðbót/brottfall); Keflavík og Keflavíkurflugvöllur (KEF) eru aðskildar færslur; engin Garðabæ/Reykholt/Hellissand-færsla í listanum. Talning mín á upphaflega textanum (4+3+6+10+6+8+8+11 = 56) stemmir við eigandastaðfestinguna „Já, allir 56 staðirnir“; talan 55 í heimildartexta er leiðrétt og skráð.
- **Þrjú hugtök aðgreind**: scope-skjalið varðveitir „veljanlegir staðir / veðurpunktar / færðarkaflar og leiðarhnútar“ óbreytt; stöðugreiningin og prompt-tillagan lýsa aliases sem fjölga ekki stöðum og innri hnútum sem ekki valstöðum.
- **Kóðastaðhæfingar stemma**: `src/lib/winterRouteRoutes.js` hefur nákvæmlega tvær leiðir (`raudavatn-vik` með 6 veðurpunkta, `raudavatn-borgarnes` með 4); `WinterRoute.jsx` notar eitt `<select>` á fast routeId og einn sameiginlegan `effectiveHour` (enginn komutími); `/winter-route` er skráð í `AppRoutes.jsx`; `api/_lib/winterRoute/routes.js` er samsvarandi allowlist. Ekkert Frá/Til, víxlun eða „Sýna leið“ er til — eins og skjalið segir.
- **Staða staðanna samanborin við retained v3-töflu** (`place-access-status-v3.csv`, 72 raðir): 55 af 56 stöðutöflufærslum stemma (NODE_UNDETERMINED/NAME_MATCH_INFERRED/engin samsvörun; Keflavík, KEF, Reykhólar, Drangsnes og Skaftafell ekki í v3 — rétt; R1/E1/S2/C eigandaval rétt; Borgarnes og Vík sem endar á föstum leiðum rétt). Ein frávik: NB2 hér að neðan.
- Aðkomutengingar óstaðfestar um allt: skjalið segir enga akstursstefnu sannaða; það er í samræmi við EXACT_GAP í places-v1/#499. Skjalið lofar engri þekju og fullyrðir hvorki að eldri gögn séu ónýt né að heimild skorti.
- Tillaga um sameiginlegt net stefnubundinna vegkafla (ekki 56×55 sérleiðir), tengivegi sem fyrsta flokks hluta, engar F-vegir/ferjur/hjáleiðir sjálfkrafa, óstudd tenging með sýnilegum skilaboðum án þess að staður hverfi — allt samræmist kröfum eiganda. Hönnunarmynd er hvergi notuð sem gagnalind. Engin ETA/komutími/skor.
- road93-prompt-review.md merkt SUPERSEDED sem framtíðarumfang er rökrétt: umfang eins pars er ekki lengur afmörkun; **mín fyrri APPROVED-niðurstaða á því stendur sem gagna-/stefnumat**, ekki sem keyranleg framkvæmd. Veg93-keðjan 2344→3410→3409→2894 (E1→S2, ≈26,25 km, 0,0 m bil) og NA1–NA3 eru endurnýtanleg sem ein tenging í landsneti.

### Athugasemdir (ekki blockerar)

- **NB1 — afmörkun fyrsta approved-prompts (mikilvægust).** Tillagan í kaflanum „Tillaga að næsta framkvæmdarprompti“ er ein málsgrein sem spannar vöruskrá, samræmingu #492/#493/#500–#504 *og* samsetningu leiða + Frá/Til. Það er of stórt fyrir eitt CC-prompt. Leggðu til að **fyrsta approved-prompt nái aðeins gagnaskránni**: ein 56-staða vöruskrá (stöðug ID, birtingarheiti án innri E1/C-kóða, aliases aðskilin, staða per stað, núll uppspunnin hnit fyrir hina 52, fjögur retained hnit endurnýtt), með einu raunverulegu prófi: listinn = nákvæmlega þessi 56 heiti/ID, einstök, KEF≠Keflavík, aliases mynda ekki nýja staði. Engin app/UI/leiðarvél/#501–#504-breyting í því prompti. Leiða-/UI-samsetning kemur í aðskildum prompt(um) með eigin yfirferð. Textaleiðrétting á GitHub-miðum sé sér skref, ekki hluti af CC-keyrslunni nema eigandi bæti því við.
- **NB2 — Reykjahlíð í stöðutöflu.** Sagt er „Engin nákvæm heitasamsvörun í v3-töflu“, en v3 hefur `Reykjahlíð` (EXACT, Hagstofa 700) með NAME_MATCH_INFERRED og RETAINED_GEOMETRY (piece 3566, native 596178.6007, 572933.0514). Rétt staða: NAME_MATCH_INFERRED (ekki valhæf aksturstenging). Smá textaleiðrétting; hefur engin áhrif á niðurstöðuna. Texti skjalsins segir sjálfur að slíkt sé ekki heimild til að fjarlægja stað.
- **NB3 — nöfn/aðkomupunktar sem þurfa eigandaákvörðun síðar, ekki núna.** „Reykjavík“ er í dag R1 (Rauðavatn, eigandaval) en borgarkjarni ómótaður; Skaftafell er ekki þéttbýli; Keflavík og KEF þurfa sitt hvorn aðkomupunkt. Vöruskráin á að geyma þetta sem sýnilega stöðu (t.d. approach pending/unsupported) án þess að búa til hnit eða fela staðinn; birtingarheiti má vera „Reykjavík“ aðeins ef eigandi samþykkir að það vísi á R1-aðkomu — annars hlutlaus aðkomulýsing eins og S2. Þetta þarf ekki að blokka vöruskrána.
- **NB4 — takmörk á því sem ég gat sannreynt.** Staðhæfingar um live GitHub-miða (#492/#493/#501–#504, t.d. #502 „fela frestaða staði“) og að „engin app/GitHub-breyting“ hafi verið gerð eru Ripley-eignaðar; ég skoðaði ekki GitHub. Prompt-tillögurnar eru tillögur að miðatextabreytingum, ekki birtar breytingar — ég miða við það.

### Takmörk

Sandbox: aðeins lestur á staged skrám (`nationwide-*`, owner-scope, v3 CSV, `winterRouteRoutes.js`, `WinterRoute.jsx`, `routes.js`, `AppRoutes.jsx`). Ekki keyrð próf/lint/build, ekki GitHub, ekkert keyrt á vél eiganda, engin netköll/öflun. Ég hef ekki endurkeyrt eldri gagnapróf (ekki forkrafa samkvæmt promptinu).

### Næsta skref

Ripley (eða eigandi) tekur NB1 inn í approved-prompt fyrir *vöruskrána eina* (leyfðar skrár, viðtaka og próf tilgreind) og lagar NB2 ef hentar; Stage → READY_FOR_CC eftir það, svo „Prompt approved“ frá eiganda til CC. Fyrsta Jonesy-umferð þessarar afhendingar; önnur umferð aðeins á approved-prompti sjálfu, ekki á þessu samhengi.
