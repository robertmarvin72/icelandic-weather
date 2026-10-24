## Tilgangur og vandamál
Yfirfara CLAUDE.md og AGENTS.md gagnvart núverandi kóða, scripts og samþykktum verkefnaákvörðunum áður en vinna við #460 hefst. Úreltar eða mótsagnakenndar leiðbeiningar geta valdið rangri afmörkun og óþarfa stoppum.

## Umfang og vinnuferli
1. Read-only úttekt fyrst: lesa skrárnar í heild og bera saman við package.json, vite.config.js, api/, src/ og kanónískt AI-vinnuferli docs/ai/README.md/CURRENT.md.
2. Skila töflu með núverandi reglu, heimild/staðfestu ástandi, ósamræmi og tillögu að breytingu. Aðgreina staðreyndir, samþykktar reglur og óleystar product/architecture ákvarðanir.
3. Samræma skjölin við samþykktar ákvarðanir eftir yfirferð tillagna. Ekki breyta vörureglu til að laga skjöl að tilviljanakenndri útfærslu.
4. Halda skýru hvaða skjal er kanónískt fyrir hvern málaflokk. Draga úr tvítekningu með tilvísunum, án þess að missa mikilvæg fyrirmæli.

## Atriði til sérstakrar athugunar
- Client-only/no-backend regla gagnvart núverandi API-leiðum og því hvernig afmarkað backend-verk er heimilað.
- npm run dev ræsir Vite; raunveruleg bakendakeyrsla og sérstakur public forecast þróunarproxy séu rétt lýst.
- Open-Meteo server-only lykill, samræmt hýsilval, Production missing-key policy og engin public fallback við keyed failure (#453).
- Vindeiningar og metadata-vörn í aurora (#452); ekki fullyrða að main forecast hafi sömu vörn.
- Skorunargildi vs birt veðurgildi, óþekkt gögn vs logn/LOW og óleystar niðurstöður #437. #460–#462 eru fyrirhuguð vinna, ekki útfærðar reglur/hegðun.
- Free/Pro forecast-data regla, canonical decision tone, eigin mat vs opinberar viðvaranir og aðgengis-/modal leiðbeiningar.
- Hlutverk Ripley/Jonesy/CC, CURRENT lifecycle, eitt virkt verkefni, git/commit/push reglur og mörk á delegation. docs/ai/README.md er kanónískt vinnuferli; ekki endurhanna það í þessari yfirferð.
- Arkitektúr-, skráa-, API- og prófunarlýsingar, úreltar tölur og leiðir. Engin leyndarmál eða raunveruleg env-gildi lesin/birt.

## Acceptance criteria
- Allir kaflar beggja skráa hafa verið yfirfarnir; frávik og ókannað atriði skráð.
- Hver efnisleg breyting hefur rekjanlega heimild úr kóða eða samþykktri ákvörðun; óleystar ákvarðanir lagðar fyrir eiganda.
- Engin fyrirhuguð #460/#461/#462 hegðun eða þekktur galli kynntur sem samþykkt núverandi regla.
- Engar mótsagnir um backend-scope, dev-keyrslu, credential policy eða AI-handoff standa eftir án skýrrar afmörkunar.
- Mikilvægar varðveislureglur um scoring, Free/Pro, tón og git tapast ekki.
- Afhent tafla, yfirfarið diff og stutt niðurstöðuskýrsla með takmörkunum.

## Staðfesting
Sannreyna scripts/paths og kóðatilvísanir read-only; skoða lokadiff og git diff --check. Engin þörf á fullum prófum/build fyrir eingöngu leiðbeiningatexta. Skrá nákvæmlega hvaða fullyrðingar voru ekki sannreyndar í rekstri.

## Forgangur og mörk
P1 · Project #3 · In Progress. Taka á undan #460, en ekki víkka í almenna arkitektúrhreinsun. Documentation-only: engar app-/test-/config-/scoring-/provider-/entitlement breytingar, nýjar þjónustur eða keyrslustillingar. Engin Vercel/account breyting, commit/push/deploy án sérstakrar heimildar. Project-staða virkjar ekki sjálfkrafa CC; fylgja venjulegu prompt/review vinnuferli þegar vinna er hafin.

## Tengsl
#437 (rannsókn lokið), #440 (modal), #452 (aurora-einingar), #453 (Open-Meteo aðgangur), #460–#462 (fyrirhuguð framhaldsvinna).
