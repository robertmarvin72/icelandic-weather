# #437 — Source register

Research-only. Every claim below is either VERIFIED (read directly from the cited source by CC in this research round, 2026-10-23) or explicitly marked otherwise. No source here is formal Veðurstofan validation of the app's model — see provenance note in research-report.md.

## v2 correction notes (2026-10-23, Jonesy B1/B2/R7)

- **B2**: the full 13-row Beaufort table (previously only rows 9-12 were quoted, with a dangling reference to a "research-report.md §Beaufort reference table" that did not exist) is now reproduced in full under SRC-01, with the source's own decimal-comma notation preserved. **"Hvassviðri" is row 8 (17,2-20,7 m/s)** — this was omitted from the original excerpt and is the basis of inventory.md's corrected INV-F03 and research-report.md's corrected F-02 extension.
- **B1/R7**: added SRC-07 (retained #450 live Open-Meteo sample, public host, legacy `windspeed_unit=ms`, confirms `hourly_units`/`daily_units` = "m/s" for all 4 points on 2026-10-19) and SRC-08 (retained #450 Veðurstofan AWS-hour parameter catalog, defining `f`/`fx`/`fg`/`fgfx` precisely). Both were already in the repository from ticket #450 and were not consulted in the v1 research round — this was the gap Jonesy's B1 identified.

## SRC-01 — Vindhraði (Wind speed), nr/349

- **URL**: https://www.vedur.is/vedur/frodleikur/greinar/nr/349
- **Title**: "Vindhraði"
- **Author**: Baldur Ragnarsson
- **Publication date (as shown on page)**: 10.8.2006
- **Last-modified date**: none shown
- **Access date**: 2026-10-23
- **Status**: dated explanatory reference (2006), not a current normative standard, per binding clarification.

**Supported claims (direct quotes/paraphrase, short excerpts only):**

1. Simplified m/s table (5 rows): `<5` "Mjög hægur vindur"; `5-10` "Fremur hægur vindur"; `10-20` "Talsverður vindur"; `20-30` "Mjög hvasst, fólk þarf að gá að sér"; `>30` storm-warning wording ("fólk ætti ekki að vera á ferli að nauðsynjalausu, hættulegt").
2. **Full 13-row Beaufort table (0-12)**, Icelandic name + mean wind speed range in m/s, source's own decimal-comma notation preserved (corrected in v2 — the v1 register quoted only rows 9-12 and referenced a "research-report.md §Beaufort reference table" that did not exist; this is now the complete, single copy of the table, cross-linked from inventory.md and research-report.md rather than duplicated):

   | Beaufort | Icelandic name | Mean wind speed (m/s) |
   |---|---|---|
   | 0 | Logn | 0-0,2 |
   | 1 | Andvari | 0,3-1,5 |
   | 2 | Kul | 1,6-3,3 |
   | 3 | Gola | 3,4-5,4 |
   | 4 | Stinningsgola (blástur) | 5,5-7,9 |
   | 5 | Kaldi | 8,0-10,7 |
   | 6 | Stinningskaldi (strekkingur) | 10,8-13,8 |
   | 7 | Allhvass vindur (allhvasst) | 13,9-17,1 |
   | **8** | **Hvassviðri (hvasst)** | **17,2-20,7** |
   | 9 | Stormur | 20,8-24,4 |
   | 10 | Rok | 24,5-28,4 |
   | 11 | Ofsaveður | 28,5-32,6 |
   | 12 | Fárviðri | ≥ 32,7 |

   **Row 8, "Hvassviðri", is a defined Beaufort term** — this was the fact omitted from the v1 excerpt (which quoted only rows 9-12, the ones this research's own threshold register happened to land near). It directly bears on `src/i18n/weatherVoice/safety.js`'s "Hvassviðri"/"Mjög hvassviðri" copy — see inventory.md INV-F03 (corrected) and research-report.md F-02 (corrected).
3. Averaging basis, as stated on this page: the Beaufort mean-wind-speed ranges use a **10-minute averaging period** ("meðalvindhraði... 10 mínútna").
4. Gusts explicitly excluded: "Vindhviður eru ekki fangaðar af Beaufort-kvarðanum" (paraphrase of the page's footnote) — modern anemometers measure instantaneous speed; gust values are often far from the 10-minute mean and have no defined relation to the Beaufort scale.
5. Conversion: 1 m/s = 3.6 km/h = 1.944 knots; Beaufort↔m/s formula V = 0.836·B^(3/2).
6. "Stórviðri" (>30 m/s, simplified table) is a different word from "Stormur"/"Rok" (Beaufort table) and does not appear in the Beaufort table.

**Averaging-basis tension (binding clarification requirement)**: see SRC-02 — nr/1098 does NOT corroborate "10-minute" as the current universal standard; it says the basis has varied by country/era. This page's own "10-minute" statement is therefore the MORE SPECIFIC but OLDER (2006) of the two sources on this point, and is retained here as its own claim, not reconciled into one answer.

## SRC-02 — Nöfn vindstiga og greining veðurhæðar, nr/1098

- **URL**: https://www.vedur.is/vedur/frodleikur/greinar/nr/1098
- **Title**: "Nöfn vindstiga og greining veðurhæðar"
- **Author**: Trausti Jónsson
- **Publication date (as shown on page)**: 21.11.2007
- **Last-modified date**: none shown
- **Access date**: 2026-10-23

**Supported claims:**

1. "Veðurhæðar er nú að jafnaði getið í hraðaeiningunni metrar á sekúndu (m/s)" — wind force is now usually given in m/s (measured by anemometer), where historically a visual Beaufort estimate was used.
2. Averaging basis, as stated on THIS page: "Einnig hefur verið misjafnt eftir löndum og tímum hvort miðað er við 1 mínútu, 10 mínútna eða klukkustundarmeðaltöl vindhraða" — the averaging basis has differed by country and era: 1-minute, 10-minute, or hourly means have all been used. **This page does not state that the current Icelandic standard is specifically a 10-minute mean** — contrast with SRC-01's own explicit "10-minute" statement.
3. Gusts: not defined here. Only a usage caution that wind-force names should not be applied without considering whether gusts or steady/mean wind ("jafnvindi") is meant — a usage warning, not a definition.
4. No measurement period is specified for "the current standard" on this page, and no official warning criteria are given.
5. Historical note: Beaufort-12-level thresholds were once slightly different; a 17-level extension applied in 1944 was later reversed.

**Averaging-basis tension**: this page is the source of the explicit doubt — it directly undercuts treating SRC-01's "10-minute mean" as settled/current without caveat. Both claims are retained as separate, dated, attributed statements; this research does not resolve the tension, per the binding clarification.

## SRC-03 — Orðskýringar (glossary), nr/936

- **URL**: https://www.vedur.is/vedur/frodleikur/greinar/nr/936
- **Title**: "Orðskýringar"
- **Author**: Trausti Jónsson
- **Publication date (as shown on page)**: 22.5.2007
- **Last-modified date**: none shown
- **Access date**: 2026-10-23

**Supported claims:**

1. Gust defined as "skammvinn vindgusa" (a short-lived gust). Mean wind defined separately: "10 mín. vindur er til dæmis meðalvindhraði á 10 mínútna tímabili" (10-min wind is, for example, the mean wind speed over a 10-minute period) — this is the one place among the three sources that explicitly uses "10 mín. vindur" as a named concept, though it does not itself assert this is the universal current standard for all wind-speed reporting (see SRC-02's caveat).
2. Veðurstofan's OWN gust measurement is typically averaged over about **3 seconds**; some instruments (mostly Vegagerðin's, the road authority) use **1 second** instead.
3. Aviation forecasting convention quoted: a gust is forecast "ef búist er við að vindhviður verði 10 hnútum meiri en 10-mínútna meðalvindhraði" (if gusts are expected to exceed the 10-minute mean wind speed by 10 knots).
4. "Mesti vindur" (maximum wind) = the highest wind speed recorded over a given period at a given place — a generic definition, not tied to a specific instrument/interval.
5. "Ofsaveður" given a technical sense here too: "nafn á 11. stigi Beaufortvindkvarðans (28,5 til 32,6 m/s)" — matches SRC-01's Beaufort-11 row exactly (independent cross-confirmation between the two pages).
6. **"Stormur" and "rok" are NOT defined on this page** — the page's own coverage is a general glossary, not the Beaufort table (that is SRC-01). This does not contradict SRC-01 (which DOES define them via the Beaufort table); it only means this particular glossary page doesn't repeat that definition.
7. No official-warning-system criteria on this page; its sea-state scale is descriptive (wave heights), not a warning threshold table.
8. Page note: last dated 2007; gust-averaging practice may have changed since.

## SRC-04 — Open-Meteo API documentation (provider semantics, J8)

- **URL**: https://open-meteo.com/en/docs
- **Access date**: 2026-10-23
- No live API probe was performed (per STOP rule); this is documentation-only reading of the publicly published parameter/variable reference.

**Supported claims:**

1. Documented variable names: `wind_speed_10m`, `wind_gusts_10m` (hourly), `wind_speed_10m_max`, `wind_gusts_10m_max` (daily). **Note**: this app's code requests `windspeed_10m`/`windgusts_10m`/`windspeed_10m_max`/`windgusts_10m_max` (no underscore between "wind" and "speed"/"gusts") — see inventory.md for the exact field names as requested in code; this is a separate question from the `wind_speed_unit` parameter-name question below and is not itself flagged as a defect here (Open-Meteo evidently accepts both namings for these particular field names, since this app receives data successfully) — only the UNIT PARAMETER name discrepancy (below) is flagged as a live concern, because that one has a documented "legacy" vs "canonical" distinction asserted inside this repo's own tests.
2. `wind_speed_10m` (hourly) valid time: **"Instant"** — an instantaneous reading, not any kind of mean or preceding-interval aggregate.
3. `wind_gusts_10m` (hourly) valid time: **"Preceding hour max"** — the maximum over the hour preceding the timestamp (a 15-minutely variant exists for some models/regions as "Preceding 15 min max", not used by this app per the inventory).
4. Daily `_max` variables: documented only as "Maximum wind speed and gusts on a day"; the daily-aggregation section separately states "Aggregations are a simple 24 hour aggregation from hourly values" — Open-Meteo's own docs do not explicitly spell out "daily max = max of the 24 hourly values" for this specific pair of variables; that join is an INFERENCE from the two separate statements, not one explicit sentence. Graded INFERRED, not VERIFIED, per J8's "if the docs do not settle it, grade UNKNOWN/INFERRED" instruction.
5. `wind_speed_unit` parameter: canonical/documented name, **with** an underscore between "wind" and "speed". Default `kmh` if omitted. Accepted values: km/h (`kmh`), m/s (`ms`), mph, knots (`kn`).
6. The docs page **never mentions** a parameter named `windspeed_unit` (no underscore) at all — neither as an alias, nor as deprecated/legacy. No statement either way about whether an unrecognized/misspelled parameter name is silently ignored (falling back to the default `kmh`) or rejected. The only documented error case is an invalid variable VALUE (example given: `tempeture_2m` as an hourly field name, a typo'd field, not a parameter-name case), returning HTTP 400 with a JSON error. **This specific question (does `windspeed_unit` silently fall back to km/h, or does it still work) is UNKNOWN from the public docs and was not resolved by this research** (resolving it would require a live request, outside this ticket's no-provider-probe rule) — see F-01 in research-report.md.

## SRC-05 — Expert Support meeting excerpt (attributed paraphrase, not independent verification)

- **Source**: owner-supplied meeting excerpt, Expert Support meeting with Guðrún Nína Petersen (Veðurstofa Íslands), 2026-10-14. Not a recording or a confirmed verbatim transcript.
- Issue #437's own text and the internal planning doc (`docs/planning/expert-support-2026-10-14-proposal.md`, item N2) both cite timestamps 10:00 / 19:30 / 39:40 for the paraphrased comment: use wind-speed classification carefully; avoid defined terms such as "stormur"/"rok" incorrectly; gusts should be interpreted in context.
- These timestamps are retained ONLY as the owner-supplied excerpt's own markers, per the binding clarification — they are not independently verified by CC, and this is not formal Veðurstofan validation of the app or its model. This is the only attribution of this meeting in this research; it is not repeated elsewhere, and findings in research-report.md are derived from SRC-01–SRC-04 and direct code reading, not from this paraphrase.

## SRC-07 — Retained #450 live Open-Meteo sample (public host, legacy `windspeed_unit=ms`) [added in v2]

- **File**: `docs/ai/tasks/ticket-450/samples/openmeteo-baseline-4point.json` (sha256 `035e26676f2d54a58db5c24436f99850cf5e0afdd3759a40e7834f6566ebf0cd`, matches `manifest.md`'s own table), plus `openmeteo-baseline-headers.txt` (sha256 `76089c4ec503d2a56d804c809311c5f2ca82ddb28cf57c66eea5fe319ea7b364`).
- **Provenance** (per `docs/ai/tasks/ticket-450/samples/manifest.md`): original public URL EXACT-graded, retrieved via `curl` against `https://api.open-meteo.com/v1/forecast` — the **public host**, never `customer-api.open-meteo.com`, and the URL explicitly includes **`windspeed_unit=ms`** (the no-underscore, "legacy" name per `openMeteo.test.js`'s own comment). Retrieval UTC 2026-10-19 17:47:22Z, EXACT (response `Date` header).
- **Read directly by CC in this v2 round** (`node -e` against the retained JSON, repo root, 2026-10-23): all four returned points' `hourly_units.windspeed_10m`, `hourly_units.windgusts_10m`, `daily_units.windspeed_10m_max`, `daily_units.windgusts_10m_max` are **`"m/s"`**. Sample daily wind/gust maxima are single-digit-to-high-teens m/s values (e.g. `14.1`, `6.5`, `16.9`, `22.4`, `30.6`), consistent with genuine m/s magnitudes for Icelandic conditions — not inflated ~3.6× km/h-scale numbers.
- **Supported claim**: on the **public host**, at this one point in time (2026-10-19), the legacy `windspeed_unit=ms` parameter **was honoured** — VERIFIED SAMPLE. This directly narrows research-report.md's F-01 (formerly a broad "UNKNOWN, possibly severe systemic bug" framing — corrected in v2; see that finding for the current, narrower framing). **Not covered by this sample**: the keyed host (`customer-api.open-meteo.com`, used when `OPEN_METEO_API_KEY` is set — see `api/_lib/openMeteoAuth.js`, traced in ticket #453's own work this session), and any date after 2026-10-19. A single point-in-time sample on one host is evidence of that host's behavior at that time, not a universal, current, or keyed-host guarantee.
- **Correction carried over from Jonesy's review, not CC's own error**: ticket #453's `resolveOpenMeteoAuth()` fails closed in production when no key is present and does **not** retry the public host after a keyed-host failure (confirmed directly in this session's own earlier #453 work: `{ host: null, apiKey: null, failClosed: true }` for `VERCEL_ENV==="production"` with no key). Any reference elsewhere to a "public-host retry" on keyed failure is incorrect and is not repeated here.

## SRC-08 — Retained #450 Veðurstofan AWS-hour parameter catalog (f/fx/fg/fgfx) [added in v2]

- **File**: `docs/ai/tasks/ticket-450/samples/vedur-parameters-aws-hour.json` (sha256 `f1b0fd06228e372d51fb9afaf3f1a4b86572f7169033180662384cb71524cfe3`, matches `manifest.md`).
- **Provenance**: public `https://api.vedur.is/weather/parameters?url=/observations/aws/hour&locale=en`, EXACT-graded URL, retrieved 2026-10-19 (RECONSTRUCTED time, see `manifest.md`). Retained under Veðurstofan's own declared CC BY 4.0 license (`vedur-openapi.json`'s `info.license`).
- **Read directly by CC in this v2 round**: the catalog's own field descriptions, quoted verbatim:
  - `f`: "Wind speed (10-min average on the hour), m/s"
  - `fx`: "Maximum wind speed (highest 10-min average during past hour), m/s"
  - `fg`: "Wind gust (highest 3-sec value during past hour), m/s"
  - `fgfx`: "Gust factor (fg/fx)"
- **Supported claims**: this is a primary, Veðurstofan-authored, machine-readable confirmation that (a) their own standard wind-speed observation (`f`) is explicitly a 10-minute average, reported once per hour — direct support for SRC-01's "10-minute mean" claim as the CURRENT observational practice (not just a 2006 article's statement), narrowing (but not fully resolving) the SRC-01/SRC-02 averaging-basis tension; (b) their own gust (`fg`) is explicitly the highest **3-second** value — confirms SRC-03's "~3 second" claim with a precise, primary-source number; (c) **both `fx` and `fg` share the same "during past hour" aggregation window** — i.e. Veðurstofan's own maximum-wind field uses the identical 1-hour-window-maximum STRUCTURE that Open-Meteo's `windgusts_10m` ("preceding hour max") also uses. The genuinely different, supported axis between Veðurstofan's `fg` and Open-Meteo's `wind_gusts_10m` is the stated **underlying sample duration** (Veðurstofan: explicitly 3 seconds; Open-Meteo: not stated at all in its own docs) — not the aggregation window, which is structurally the same (1 hour) on both sides. See research-report.md F-07 (corrected in v2) for why this distinction matters and was previously conflated.

## SRC-06 — N1 resolution (binding clarification requirement, not a technical source)

Resolved from actual repository/issue history, not guessed: the issue text of #437 says "Tengist #142/#117 Done og N1; ekki sama umfang" (relates to #142/#117 Done and N1; not the same scope). `docs/planning/expert-support-2026-10-14-proposal.md` defines **N1 = "Aðgreina eigin veðurathugasemdir frá opinberum viðvörunum"** (Distinguish our own weather comments from official warnings), P0, from the SAME 2026-10-14 meeting. `gh issue view 436` confirms GitHub issue **#436** has the IDENTICAL title and is **CLOSED, Project status Done**. **Therefore N1 = #436**, already resolved/closed, and is a DIFFERENT scope from #437 (own-assessment-vs-official-warning disambiguation, not wind-word/classification accuracy) — consistent with CLAUDE.md's documented "Canonical Decision Tone" / own-assessment constraint and with J13's instruction to treat #436 as a standing constraint on #437's recommendations, not as something to redo.

#142 ("Replace 'Bad' forecast label with softer severity wording", CLOSED/Done) and #117 ("Change color of windgust icon by severity", CLOSED, closed in backlog cleanup per its one comment — "not clear/important enough given current goals, may reopen if real data/need arises") are both read directly via `gh issue view`; neither implemented a wind-speed classification/terminology change — #142 was about a different (non-wind-specific) severity word, #117 was closed without any implementation. Confirms the "not the same scope" framing in #437's own text.
