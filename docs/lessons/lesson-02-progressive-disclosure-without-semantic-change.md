# Lesson 02 — Progressive disclosure without semantic change

## Tilgangur

Önnur æfingin í advanced Claude Code workflow fyrir Eltum Veðrið.

Markmiðið var að taka issue **#376 — UX: Færa veðurspá, topplista og kort í stigvaxandi upplýsingagjöf** og nota það til að æfa progressive disclosure án þess að breyta:

- recommendation/scoring semantics,
- shared forecast payload,
- ranking semantics,
- feature gating,
- analytics semantics,
- eða lazy-loading architecture.

UX-markmiðið var:

**decision first → reasoning → details on demand**

---

## 1. Read-only audit fyrst

Claude Code kortlagði homepage frá `HomeDecisionCard` og niður áður en nokkur kóði var breytt.

Audit-ið greindi sérstaklega:

- `HomeDecisionCard`
- `RoutePlannerCard`
- `CampsiteComparisonSection`
- `ForecastTable`
- score / wind / shelter detail
- `Top5Leaderboard`
- `WeatherFinder`
- `LazyMap`

Fyrir hvert svæði var skoðað:

- data/state source,
- primary vs secondary hlutverk,
- default visibility,
- feature gating,
- fetch/data timing,
- analytics timing,
- og hvort progressive disclosure mætti framkvæma án semantic breytinga.

---

## 2. Audit-niðurstaða

### HomeDecisionCard

`HomeDecisionCard` var þegar rétt uppsett sem canonical decision surface.

Engin breyting nauðsynleg.

### RoutePlannerCard

`RoutePlannerCard` var þegar collapsed supporting-detail eftir fyrri UX-miða.

Engin breyting nauðsynleg.

### ForecastTable

Full 7-daga forecast tafla var opin sjálfgefið og tók stóran sjónrænan flöt.

Gögnin komu hins vegar úr shared `useForecast` flow sem er einnig input í comparison/recommendation logic.

Niðurstaða:

**Presentation má collapse-a. Data-fetching má ekki breytast.**

### Top5Leaderboard

Topplisti var einnig fullopinn.

Audit fann mikilvægt semantic dependency:

`weekly_ranking_locked_viewed` fire-aði á mount.

Ef componentið yrði conditional-mounted með:

`{expanded && <Top5Leaderboard />}`

myndi event timing breytast óvart.

Niðurstaða:

**Top5Leaderboard þarf áfram að mountast á sama tíma og áður; aðeins presentation má collapse-a.**

### Map

Kortið var þegar:

- code-split,
- lazy-loaded,
- IntersectionObserver/scroll-gated,
- utan initial viewport.

Að breyta því í explicit click-triggered `"Sjá á korti"` hefði breytt loading trigger semantics.

STOPP-reglan greip þetta.

Ákvörðun:

**Halda kortinu scroll-gated og ósnertu.**

---

## Lærdómur 1 — Progressive disclosure er ekki synonym fyrir conditional mount

UI getur verið collapsed án þess að component, hooks eða effects hætti að keyra.

Þegar progressive disclosure er presentation-only breyting þarf að greina sérstaklega á milli:

- rendered visibility,
- component lifecycle,
- data fetching,
- calculations,
- analytics effects.

Dæmi úr #376:

`Top5Leaderboard` þurfti að halda núverandi mount timing svo:

`weekly_ranking_locked_viewed`

héldi sömu semantics.

---

## Lærdómur 2 — Collapsed ≠ deferred data

Að fela gögn sjónrænt þýðir ekki að data layer eigi að breytast.

Í þessari lotu voru:

- `useForecast`
- `useLeaderboardScores`
- `useTop5Campsites`

áfram keyrð óskilyrt í núverandi shared flow.

Ekki var:

- tier-clippað payload,
- frestað fetchi,
- eða flutt shared data undir disclosure-state.

Meginregla:

> Progressive disclosure should not silently become data tiering.

---

## Lærdómur 3 — Preserve analytics semantics

Presentation-breyting getur óvart orðið instrumentation-breyting.

Audit þarf því að svara:

- hvaða events fire-a á mount,
- hvaða events fire-a á data-load,
- hvaða events fire-a á explicit interaction,
- hvort collapse/open implementation breyti timing.

Ef event sem áður fire-aði á mount fer eftir breytingu aðeins af stað þegar notandi opnar section, hefur event semantics breyst jafnvel þótt event-nafnið sé óbreytt.

Slík breyting þarf sérstaka ákvörðun.

Hún má ekki verða þögul aukaverkun af UX-refactor.

---

## Lærdómur 4 — Uniformity is not a goal by itself

Promptið gerði ráð fyrir secondary entrypoints fyrir:

- forecast,
- ranking,
- map.

Audit sýndi þó að kortið var þegar progressive að því leyti að það birtist ekki í initial viewport og var lazy-mounted þegar notandinn skrunaði að því.

Að breyta kortinu í click-triggered pattern hefði aðeins aukið sjónrænt samræmi við forecast/ranking en bætt tæknilegri og semantic áhættu.

Ákvörðun:

**Halda núverandi scroll-gated patterni.**

Meginregla:

> Preserve an existing mechanism when it already satisfies the UX requirement and changing it adds semantic or architectural risk.

---

## 3. Implementation

### Forecast

`ForecastTable` fékk local disclosure-state:

`detailsOpen`

Sjálfgefið:

`false`

Collapsed state sýnir compact entrypoint:

**„Sjá nánari veðurspá“**

Expanded state sýnir áfram alla núverandi forecast virkni.

Header upplýsingar, location context og önnur nauðsynleg tenging við current campsite héldust.

Engin shared forecast semantics breyttust.

---

### Ranking

`Top5Leaderboard` fékk local disclosure-state:

`resultsOpen`

Sjálfgefið:

`false`

Collapsed state sýnir:

**„Sjá fleiri staði“**

Expanded state sýnir áfram:

- núverandi ranking rows,
- Free/Pro gating,
- CTA,
- wind/shelter detail.

Hooks/effects voru áfram keyrð óháð collapsed presentation.

---

### Map

`LazyMap` var ekki breytt.

Núverandi:

- lazy import,
- separate MapView chunk,
- IntersectionObserver-gated mount

hélt sér óbreytt.

---

## 4. Accessibility

Nýju disclosure controls nota native:

`<button>`

og viðeigandi:

- `aria-expanded`
- `aria-controls`

Open/closed interaction nýtir því native keyboard behaviour fyrir Enter/Space.

Ekki var búið til custom accordion framework.

---

## 5. State preservation

Disclosure state var local React state í components sem halda áfram að vera mounted.

Því lifir open/close state eðlilega meðan component er til staðar.

Engin ný persistent state architecture var búin til.

Engin existing domain selection þurfti að færa eða duplicate-a.

---

## 6. Verification

Targeted tests:

**27/27 green**

Full suite:

**500/500 green**

Build:

**green**

MapView var áfram sér lazy-loaded chunk í build-outputi.

ESLint:

engin ný lint-villa vegna breytinganna.

Ný test coverage staðfesti meðal annars:

- collapsed-by-default,
- `aria-expanded`,
- expand/collapse behaviour,
- forecast interaction semantics,
- að `weekly_ranking_locked_viewed` fire-ar áfram á mount þótt ranking presentation sé collapsed.

---

## 7. Manual visual verification

Claude Code hafði ekki browser/screenshot capability.

Visual verification var því réttilega skráð:

**`manual visual verification pending`**

Homepage var síðan skoðuð handvirkt á:

- desktop,
- mobile.

Visual verification staðfesti:

- `HomeDecisionCard` heldur primary vægi,
- Route Planner er supporting teaser,
- forecast/ranking entrypoints eru compact,
- mobile layout staflast rétt,
- ekkert augljóst overflow kom fram.

---

## Lærdómur 5 — Unchanged ≠ unaffected

Handvirk sjónskoðun fann eina áhugaverða hliðarverkun.

`WeatherFinder` var vísvitandi utan scope og því alveg ósnert.

En eftir að:

- ForecastTable var collapsed,
- Top5Leaderboard var collapsed,

var `WeatherFinder` skyndilega eina fullopna listasvæðið á þessum hluta homepage.

Componentið sjálft breyttist ekki.

**Sjónrænt vægi þess breyttist samt vegna breytinga í kringum það.**

Þetta leiðir til mikilvægrar reglu:

> A component can be unchanged in code but affected in hierarchy by changes to surrounding content.

Því þarf rendered verification ekki aðeins að skoða breytta componenta.

Það þarf einnig að meta:

- hvað verður meira áberandi,
- hvað verður minna áberandi,
- hvaða unchanged content erfir nýtt visual priority.

---

## WeatherFinder follow-up

WeatherFinder var ekki blocker fyrir #376.

En eftir implementation varð það meira áberandi sem eina fullopna ranked/list surface neðar á homepage.

Follow-up:

**Meta sjónrænt vægi WeatherFinder eftir #376.**

Spurning:

Á WeatherFinder áfram að vera fullopið eða ætti það síðar að fylgja sambærilegu progressive disclosure patterni?

Þetta skal tekið sem sér UX-ákvörðun, ekki sem scope-creep inn í #376.

---

## Workflow pattern sem Lesson 02 staðfesti

Fyrir progressive disclosure breytingar:

**Audit structure → audit lifecycle/data/analytics → classify primary/secondary → identify safe presentation boundary → implement minimum disclosure → regression tests → rendered verification → inspect global hierarchy**

Sérstaklega:

> Collapsing presentation must not silently change component lifecycle, data-fetch timing, analytics semantics or shared data-flow.

og:

> Visual verification must inspect not only what changed, but what became more prominent because something else changed.

---

## Tengsl við Lesson 01

Lesson 01 kenndi:

**Collapsed ≠ neutral**

þegar visible teaser copy keppti við canonical decision.

Lesson 02 stækkar þá reglu:

**Unchanged ≠ unaffected**

þegar óbreytt component fær nýtt visual vægi vegna þess að surrounding content er collapsed.

Saman mynda þær góða UX verification reglu:

> Evaluate both the visible semantics of collapsed surfaces and the hierarchy changes they create around unchanged surfaces.

---

## Hvað á ekki að flytja strax í CLAUDE.md

Ekki færa alla Lesson 02 í `CLAUDE.md`.

Við erum enn að safna evidence úr raunverulegum miðum.

Sterkir kandidatar fyrir framtíðar Skill eða project-level guardrail eru:

- presentation collapse má ekki breyta analytics semantics,
- presentation collapse má ekki óvart fresta shared data,
- visual verification þarf að meta surrounding hierarchy,
- existing mechanism skal haldast ef það uppfyllir markmiðið og breyting myndi aðeins bæta uniformity.

Meta þetta aftur eftir fleiri Lessons áður en reglurnar eru promoted í canonical workflow.

---

## Staða

**Lesson 02: complete**

Niðurstaða:

- audit discipline: PASS
- lifecycle/data audit: PASS
- analytics-semantics protection: PASS
- STOPP-regla: PASS
- minimum-change discipline: PASS
- accessibility: PASS
- targeted regression coverage: PASS
- full verification: PASS
- manual rendered verification: PASS
- global hierarchy follow-up identified: PASS
