# Lesson 03 — Consistency, copy equivalence og approved intent

## Tilgangur

Þriðja æfingin í advanced Claude Code workflow fyrir Eltum Veðrið.

Markmiðið var að taka follow-up á `WeatherFinder` eftir #376 og meta hvort secondary exploration tool sem áður var fullopið ætti að fylgja sama progressive-disclosure mynstri og forecast og ranking.

Í þessari lotu var ekki aðeins verið að æfa collapse/expand hegðun.

Meginlærdómurinn varð:

**hvernig á að samræma UI-pattern, information roles og copy án þess að tæknileg endurnýting yfirskrifi samþykkta product-ákvörðun.**

---

## Bakgrunnur

Eftir #376 voru:

- `ForecastTable`
- `Top5Leaderboard`

færð í progressive disclosure.

`WeatherFinder` var vísvitandi ósnert.

Rendered verification sýndi hins vegar að `WeatherFinder` varð nú eina stóra, fullopna ranked/list surface á þessum hluta homepage.

Þótt componentið hefði ekki breyst varð relative visual weight þess meira.

Þetta leiddi til sérstaks follow-up audits.

---

## 1. Read-only audit

Claude Code kortlagði `WeatherFinder` áður en nokkur breyting var gerð.

Audit-ið staðfesti meðal annars:

- `WeatherFinder` fær `scoresById` sem prop frá `App.jsx`,
- `scoresById` kemur úr sömu `useLeaderboardScores` heimild og önnur homepage logic nota,
- `WeatherFinder` er hins vegar aðeins downstream consumer,
- það framleiðir enga shared computation sem önnur component treysta á,
- eigið ranking er client-side `useMemo` afleiða,
- engin mount analytics events eru til staðar,
- öll núverandi analytics eru interaction-based,
- mode/radius/days/showAll eru local UI state,
- Free/Pro gating er þegar afmarkað í núverandi logic.

### Niðurstaða audits

`WeatherFinder` var öruggur kandidat fyrir presentation-only progressive disclosure.

Engin STOPP-skilyrði fundust.

---

## 2. UX niðurstaða

Rendered hierarchy eftir #376 var:

1. canonical decision
2. supporting Route Planner
3. comparison
4. collapsed forecast/ranking
5. full-open WeatherFinder
6. map

WeatherFinder varð því sjónrænt stærra secondary surface en hlutverk þess réttlætti.

Audit niðurstaða:

**`collapse`**

---

## Lærdómur 1 — Consistency er information-role consistency

Fyrsta implementation-tillagan lýsti WeatherFinder teaser sem einföldum CTA-kubbi.

Við nánari samanburð kom í ljós að shipped pattern fyrir `ForecastTable` og `Top5Leaderboard` var ekki bara „hnappur inni í korti“.

Mynstrið hafði þrjú skýr information roles:

1. **Header/context**
   - hvað svæðið er um

2. **CTA**
   - hvað gerist þegar notandi opnar það

3. **Expanded content**
   - actual detailed/mode-specific information

WeatherFinder þurfti því ekki aðeins að líta svipað út.

Það þurfti að fylgja sama semantic hierarchy.

Meginregla:

> Reuse existing patterns by matching information roles, not merely visual styling.

---

## 3. WeatherFinder information roles

### Collapsed header

Kyrrstæður, mode-óháður titill:

**IS**

`Skoða staði eftir veðurskilyrðum`

**EN**

`Explore campsites by conditions`

Hlutverk:

- skilgreina tólið,
- vera semantic-neutral,
- ekki gefa verdict.

### CTA

Sértæk aðgerð:

**IS**

`Sjá röðun staða eftir veðri`

**EN**

`See sites ranked by weather`

Hlutverk:

- segja nákvæmlega hvað opnast,
- forðast generic `Meira` / `Nánar` / `See results`.

### Expanded title

Núverandi mode-háði:

`RESULT_TITLE_KEY[mode]`

t.d.:

`Rólegustu staðirnir í nágrenninu`

helst algjörlega óbreytt inni í expanded toolinu.

Hlutverk:

- lýsa núverandi result mode,
- þar má mode-specific orðaforði áfram eiga heima.

---

## Lærdómur 2 — Semantic neutrality þarf ekki að eyða domain-specific copy

Í collapsed teaser var viljandi forðast að endurnota:

- `Rólegra`
- `Þurrara`
- `Hlýrra`

og samsvarandi EN-orð.

Þessi orð eru þegar notuð af `HomeDecisionCard` sem canonical reasoning.

Ef WeatherFinder teaser hefði notað sama orðaforða gæti hann lesist sem:

- annað reasoning layer,
- annað recommendation hint,
- eða framhald af stay/move niðurstöðunni.

En inni í expanded WeatherFinder er mode-specific copy rétt og gagnlegt.

Því er reglan ekki:

**„forðastu þessi orð alls staðar.“**

Heldur:

**notaðu verdict/reasoning-líkan orðaforða aðeins þar sem information role styður hann.**

---

## 4. Minimum implementation

WeatherFinder fékk local disclosure state:

`finderOpen`

sjálfgefið:

`false`

Öll núverandi state/hooks/calculations héldust skilyrðislaus:

- `mode`
- `radiusKm`
- `days`
- `showAll`
- `sites`
- `options`
- `ranked`

Núverandi:

`if (!sites.length) return null`

hélst óbreytt fyrir ofan collapse branch.

Þetta tryggði að WeatherFinder teaser birtist ekki þegar engin gögn eru í raun tiltæk.

---

## 5. Preserve semantics

Implementation breytti ekki:

- `scoresById`,
- `useLeaderboardScores`,
- `rankCalmest`,
- `rankWarmest`,
- `rankDriest`,
- `resultsLimit`,
- Free/Pro gating,
- analytics semantics,
- map behaviour.

State varðveittist yfir:

**open → change mode → close → reopen**

vegna þess að componentið hélt áfram að vera mounted.

---

## 6. Verification

Targeted tests:

**24/24 green**

Full suite:

**507/507 green**

Build:

**green**

MapView:

hélt áfram að vera separate lazy chunk.

Ný tests staðfestu meðal annars:

- WeatherFinder collapsed by default,
- expanded mode title er ekki sýnilegt meðan collapsed,
- `RESULT_TITLE_KEY[mode]` birtist rétt eftir open,
- mode-switch heldur réttri semantics,
- state lifir collapse/reopen,
- opening/closing fire-ar ekki ný analytics event,
- niðurstöður eru þegar reiknaðar við fyrstu opnun.

---

## Lærdómur 3 — Existing key reuse ≠ approved copy preservation

Í implementation fann Claude Code fyrirliggjandi i18n key:

`weatherFinderTitle`

sem var ónotaður annars staðar.

Gildin voru:

- IS: `Veðurleit`
- EN: `Weather Finder`

Agentinn endurnýtti lykilinn til að minnka diff.

Tæknilega var þetta öruggt:

- enginn blast radius,
- engin önnur use-sites.

En product-level var þetta rangt.

Samþykkt copy hafði verið:

- `Skoða staði eftir veðurskilyrðum`
- `Explore campsites by conditions`

Agentinn hafði því varðveitt **key reuse**, en ekki **approved intent**.

---

## Lærdómur 4 — Key reuse þarf tvö checks

Áður en existing i18n key er endurnýtt þarf að staðfesta bæði:

### 1. Blast-radius equivalence

- Hvar er lykillinn notaður?
- Er öruggt að endurnýta eða breyta honum?

### 2. Semantic/copy equivalence

- Er núverandi texti í raun jafngildur samþykktu copy-i?
- Passar tone, specificity og information role?
- Er verið að endurnýta lykil eða óvart breyta product ákvörðun?

Meginregla:

> Before reusing existing UI copy or i18n keys, verify both blast radius and semantic equivalence with the approved product intent.

---

## 7. Copy-frávikið var leiðrétt

Claude Code staðfesti að `weatherFinderTitle` var:

- ónotaður annars staðar fyrir þessa vinnu,
- því öruggt að breyta gildinu.

Minimum fix:

### EN

`Weather Finder`

→

`Explore campsites by conditions`

### IS

`Veðurleit`

→

`Skoða staði eftir veðurskilyrðum`

Enginn nýr key var nauðsynlegur.

Þetta var rétta sameiningin af:

- technical reuse,
- zero blast radius,
- approved product copy.

---

## Lærdómur 5 — Smaller diff is not automatically the better diff

Agentinn reyndi að gera tæknilega hagkvæma breytingu:

> „There is already an unused key, so reuse it.“

Það var skynsamlegt frá implementation-sjónarhorni.

En minni diff hafði óvart orðið stærri product-breyting.

Því:

> Implementation convenience must not override an explicit product or copy decision.

Ef nákvæmt copy hefur þegar verið samþykkt telst breyting á því ekki „implementation detail“.

Það þarf sérstakt samþykki.

---

## Lærdómur 6 — Frávik frá samþykktu þarf að vera explicit

Ef agent sér betri, einfaldari eða endurnýtanlegri leið en sú sem var samþykkt má hann leggja hana til.

En hann á ekki að framkvæma hana þegjandi.

Rétt workflow:

1. Finna mögulegt frávik.
2. Staðfesta blast radius.
3. Segja skýrt hvað breytist frá samþykktu.
4. Útskýra trade-off.
5. Bíða eftir product/copy approval.
6. Implement-a síðan.

Ekki:

1. finna existing key,
2. telja hann „nógu svipaðan“,
3. skipta samþykktu copy-i út,
4. kynna það sem tæknilega hagræðingu.

---

## 8. Rendered verification

Eftir implementation var homepage skoðuð handvirkt.

Ný hierarchy varð:

1. `HomeDecisionCard`
2. `RoutePlannerCard`
3. comparison
4. collapsed forecast
5. collapsed ranking
6. collapsed WeatherFinder
7. map

WeatherFinder les nú sem secondary exploration tool í stað stórrar ranked surface.

Collapsed header:

**„Skoða staði eftir veðurskilyrðum“**

CTA:

**„Sjá röðun staða eftir veðri“**

les sem:

**tool → action**

en ekki:

**recommendation → reasoning**

Visual verification:

**PASS**

---

## Lærdómur 7 — Progressive disclosure skapar secondary-tool layer

Eftir Lessons 1–3 er homepage farin að sýna skýrara lagaskipti:

### Primary

- canonical stay/move decision
- primary reasoning

### Supporting

- Route Planner context
- comparison

### Secondary tools/details

- detailed forecast
- weekly ranking
- WeatherFinder

### Navigation/detail

- map

Þegar fleiri features bætast við homepage þarf að verja þetta hierarchy.

Ekki láta hvert nýtt feature verða fullopið module bara af því það hefur gagnlegar upplýsingar.

Spyrja fyrst:

**Hvaða information role hefur þetta?**

---

## Workflow pattern sem Lesson 03 staðfesti

Fyrir UI pattern reuse og copy:

**Audit role → compare shipped pattern → map information roles → protect semantics → propose copy → verify approved intent → check key blast radius → implement minimum change → tests → rendered verification**

Sérstaklega:

> Visual consistency should follow semantic information roles.

og:

> Existing key reuse is only valid when both blast radius and copy meaning match the approved intent.

og:

> A technically smaller diff must not silently replace an approved product decision.

---

## Tengsl við Lesson 01 og 02

### Lesson 01

**Collapsed ≠ neutral**

Sýnilegt teaser-copy getur sjálft keppt við canonical decision.

### Lesson 02

**Unchanged ≠ unaffected**

Óbreytt component getur fengið nýtt visual weight þegar surrounding content breytist.

### Lesson 03

**Reused ≠ equivalent**

Existing UI pattern eða i18n key getur verið tæknilega endurnýtanlegt án þess að vera semantic jafngilt samþykktri hönnun.

Saman:

> Verify what remains visible, what changes relative hierarchy, and whether reused implementation details preserve the intended meaning.

---

## Sterkir kandidatar fyrir framtíðar Skill

Eftir þrjár lessons eru nokkur patterns farin að endurtaka sig:

- audit-first fyrir visual UX,
- rendered verification eftir source audit,
- collapse má ekki breyta lifecycle/data/analytics semantics,
- collapsed surfaces þurfa semantic-neutral teaser,
- unchanged surrounding surfaces þarf að meta eftir breytingu,
- pattern reuse þarf information-role equivalence,
- i18n key reuse þarf blast-radius + semantic-equivalence check,
- explicit approved copy má ekki breytast sem implementation detail.

Þetta er orðið nógu mikið evidence til að byrja fljótlega að meta hvort hluti af þessu eigi að verða reusable **UX implementation Skill**.

Ekki færa allt sjálfkrafa í `CLAUDE.md`.

---

## Staða

**Lesson 03: complete**

Niðurstaða:

- technical audit: PASS
- UX hierarchy audit: PASS
- shared-data protection: PASS
- analytics semantics: PASS
- state preservation: PASS
- pattern consistency: PASS
- semantic-neutrality: PASS
- approved-copy preservation: PASS after correction
- targeted tests: PASS
- full suite: PASS
- rendered verification: PASS
