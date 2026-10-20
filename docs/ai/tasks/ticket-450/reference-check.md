# Ticket #450 — Reference check (v4 original + v5 X1/X2 correction)

This file is the **single saved location** for the v4 reference-inventory result required by Jonesy's L5 condition, **now corrected and re-run per v5's M1–M6** (Jonesy's X1/X2 narrow re-check found the v4 version of this file itself contained a wrong line-number pointer and an undercounted focused-grep record — both fixed below). `research-report.md` (§8 closing paragraph) and `cc-report.md` (R7/V2 dispositions, "v4 Correction Round" and "v5 Correction Round" sections) both point here for the full result; **this file does not point back to either of them for its own result** — everything needed to verify the result is below (exact commands, literal, unedited script output, and the table itself), not a cross-document pointer. This avoids the circular-pointer problem Jonesy flagged (W4) and keeps the same non-circular property in v5.

## Method

**v4 method (manual read + six targeted greps), plus v5's M4/M5 addition:**

1. **Manual, full read (primary method for L2(e)'s inventory, v4).** `research-report.md`, `provider-matrix.csv`, `source-register.md`, and `cc-report.md` were each read in full (not sampled or skimmed) by CC during the v4 round. Every occurrence of the following patterns was logged by hand while reading, not by relying on one grep pattern to find them: `§N` section marks, "S8"-style typos, "sjá …", "hér að ofan/neðan", "above/below", "memo"/"minnisblað(s)"/"box", "next-step"/"Næsta skref", "Grep-staðfesting", every backticked file path cited together with a section or row number, and the named headings of the mapping tables. **Limit:** a manual read can still miss a reference if its wording doesn't match any of the above categories and isn't otherwise salient — see "Residual limitation" at the end of this file.
2. **v5 addition — a stdout-only, built-ins-only verifier script (M5), run instead of ad-hoc grep commands.** `research-tools/reference-check-verify.mjs` was written, inspected (confirmed: only `readFileSync`/`existsSync` against the four fixed input files plus a local existence/heading check of this very file — no network, no subprocess, no writes), and run with its stdout redirected to `research-tools/reference-check-verify.output.txt`. It computes, in one pass: SHA256 of each of the four input files; every matching **line** (not occurrence) for X2's six required patterns plus the seventh "line 62" variant pattern M4 adds; the M2 uniqueness check for the R7 flag-only sentence; and existence checks for the `§8` heading and this file. The exact, unedited output is pasted verbatim below, with hand classification added afterward in a separate column/annotation — exactly as M5 specifies. **This replaces the v4 round's narrower, hand-run grep commands, which (per Jonesy's X2 finding) undercounted several patterns' real matching-line counts** (e.g. "hliðarfund" was recorded as 4 hits in the v4 version of this file when the real count, re-run against the final files, is 8).

Every reference in the general inventory table (built under method 1) was classed as one of:
- **current-resolves** — the reference's target (a heading, file, row, or source ID) exists in the current, live document as read at check time.
- **archive-valid** — the reference lives inside `v1-archive/`, `v2-archive/`, `v3-archive/`, or `v4-archive/` and correctly describes the frozen content of that archived snapshot; archives are not edited, so these are not defects.

Every hit in the six-plus-one focused-pattern record (built under method 2, M4) is classed as one of **M4's four classes** instead (narrower and more precise than the two above, because M4 specifically anticipates the "called withdrawn when it's actually just a correctly-worded negative statement" mistake):
- **(a) quoted historical error, explicitly withdrawn or superseded** — the hit quotes an old wrong claim specifically to mark it as wrong/superseded.
- **(b) negative denial** — a *current* statement that something does not or never did exist, or must not be read a certain way (this is NOT the same as (a), and per M4 must never be labelled "withdrawn" — a thing that never existed is not "withdrawn", it is correctly denied).
- **(c) CC checklist or disposition quote of offending text** — the hit is inside a before/after checklist row, mapping table, or disposition section that quotes/names the old text or the search string itself as part of describing what was fixed.
- **(d) active unsupported claim** — a defect: the hit asserts the false/old thing as if it were still true, with no marker. **The result must contain zero (d) hits.**

## SHA256 of each checked file, at check time (v5, final)

Taken via the M5 verifier script's own SHA256 output, **after** all other v5 edits to `research-report.md` and `cc-report.md` (including the v5 `cc-report.md` section itself) were complete, per M3's explicit ordering:

```
6ba7ab002225578bc647543d3fa4c242c4b72250d20164c5ec7319ea27e9e464  research-report.md
25e3d4f451d2823b4176165f574641aa0fe0262a89f3dfebabbd978286706883  provider-matrix.csv
c962369bed1e34228bbbc8d2d8a7ab4847ccca5d4621a5d355425c104a6dea00  source-register.md
2f9c80be8ec334113a085730c1294d6194d498ff7f15a865013ffc03ea3da84d  cc-report.md
```
Checked: see `research-tools/reference-check-verify.output.txt`'s generation time (this run). `provider-matrix.csv` and `source-register.md` are **unchanged** from the v4 snapshot (`25e3d4f4…`/`c962369b…`) — neither was edited in v5. `research-report.md` and `cc-report.md` changed because of the v5 X1/X2 edits themselves.

**If any of these four files changes after this point, this hash table (and this whole record) must be refreshed before handoff.** No edit was made to any of the four files after this hash table was taken.

## Authoritative heading lists used to resolve `§N` and named-section references

`research-report.md` (unchanged in v5 — still 192 lines, no heading shifted): `## v2-leiðréttingar…` (L5), `## v3-leiðréttingar…` (L17), `## v4-leiðréttingar…` (L28), `## Ákvörðunarminnisblað` (L41) with sub-headings `### Eigandaspurning…` (L43), `### Hvaða notkun…` (L49), `### „IG" og rekstraraðilar…` (L66), `## 1.` (L72) through `## 9.` (L179), `## Viðaukar` (L185).

`cc-report.md` (v5 adds a new section after `## Lifecycle (v4)`, nothing before it shifted): top-level `#` title plus `## v2 Correction Round` (L87), `## v3 Correction Round` (L194), `## v4 Correction Round` (L296, with `### L6…` at L300, `### W1…` at L312), `## Lifecycle (v4)` (L423), `## v5 Correction Round` (L429, with `### X1…` at L433, `### X2…` at L444, `### M1…` at L448, `### Changed-path and HEAD status…` at L461, `### Remaining inherited limitations…` at L468, `### Deviations…` at L479), `## Lifecycle (v5)` (L485).

## Reference inventory table (general, method 1 — unchanged from v4 except row 1)

`file:line` is the current, post-v5 line number. Where many lines carry the same reference to the same target, lines are grouped into one row. Only row 1 changed in v5 (the X1 fix); all other rows are unaffected because no line numbers shifted elsewhere.

| file:line | reference text (summarized) | target | resolves? | class |
|---|---|---|---|---|
| research-report.md:15 | R7 row — **[corrected v5/X1/M2: this row itself previously said "§1, line 62", which was itself WRONG — line 62 is the NO-GO grep command line, not the flag sentence]** now names `research-report.md` §1 (heading `## 1.`) and the sentence beginning «Leiðrétt orðalag (R7):», verified by direct read AND by the M5 script to occur exactly once between `## 1.` and `## 2.` | `research-report.md` §1 (heading at L72, sentence at **L76**, not L62) | yes | current-resolves |
| research-report.md:15, 32, 175 | "Mikilvægur hliðarfundur" box, named as never having existed | (no target — explicitly states none exists) | n/a | current-resolves (correctly denies existence) |
| research-report.md:5,9–15 (v2-mapping table) | §5, §2, §3, §8 cross-references in the R1–R7 mapping row | `## 5.`(L125), `## 2.`(L80), `## 3.`(L98), `## 8.`(L167) | yes | current-resolves |
| research-report.md:17–26 (v3-mapping table) | §2, §8, §1, §5 cross-references | same headings as above | yes | current-resolves |
| research-report.md:28–35 (v4-mapping table) | self-citations to lines in this document and to `cc-report.md` | all exist at the stated lines | yes | current-resolves |
| research-report.md:54, 94 | "sjá **§8. Næsta skref**" | `## 8. Næsta skref` (L167) | yes | current-resolves |
| research-report.md:56 | "(sjá §2)" ×2 | `## 2.` (L80); `research-tools/nearest-station-distance.output.txt` | yes | current-resolves |
| research-report.md:59 | Grep-staðfesting — gives exact inline grep output | self-contained | yes | current-resolves |
| research-report.md:68 | "(sjá §5)" | `## 5.` (L125) | yes | current-resolves |
| research-report.md:74 | "Sjá `v1-archive/research-report.md` §1" | archived file, its own §1 | yes | archive-valid |
| research-report.md:87 | "§1 hér í þessu skjali" + "heimild S8" | `## 1.` (L72); `source-register.md` row `\| S8 \|` (L22) | yes | current-resolves |
| research-report.md:92 | "hér að neðan" | `research-tools/observation-field-table.output.txt` | yes | current-resolves |
| research-report.md:111 | "heimild **E1**… / `provider-matrix.csv` röð 8" | `source-register.md` row `\| E1 \|` (L38); `provider-matrix.csv` file line 8 | yes | current-resolves |
| research-report.md:113 | "§2 hér að ofan" | `## 2.` (L80) | yes | current-resolves |
| research-report.md:121 | "Sjá `v1-archive/research-report.md` §4" | archived file, its own §4 | yes | archive-valid |
| research-report.md:34 | "röð 37 að neðan" + numbering-convention note | `provider-matrix.csv` file line 37 | yes | current-resolves |
| research-report.md:152 | "sjá `v1-archive/research-report.md` §6" | archived file, its own §6 | yes | archive-valid |
| research-report.md:171,173 | "(§5, §7)", "§2's nýja…", "sbr. §7's…" | `## 5.`(L125), `## 7.`(L156), `## 2.`(L80) | yes | current-resolves |
| research-report.md:175 | "⚠ Tilvísanaprófun" — withdraws v3's false claim, points to this file | this file | yes | current-resolves |
| research-report.md:181 | "sjá `v1-archive/research-report.md` §8 (upprunalega tölusetningin…)" | archived file, its own pre-renumbering §8 | yes | archive-valid |
| research-report.md:187–192 (Viðaukar) | file/path citations | all files/directories exist | yes | current-resolves |
| cc-report.md:54 | "see `research-report.md` for the full narrative" | `research-report.md` `## Ákvörðunarminnisblað` (L41) | yes | current-resolves |
| cc-report.md:145–155,216–247,277,283,288 | §1/§2/§3/§5/§8 cross-references inside v2/v3 dispositions | respective headings | yes | current-resolves |
| cc-report.md:155 | SUPERSEDED marker, now itself carrying the v5 correction for X1 too (see row 1 above) | `## 1.` (L72); `research-report.md:15` | yes | current-resolves |
| cc-report.md:226 | SUPERSEDED marker withdrawing "zero broken references found"/"reproduced inline", redirecting here | this file | yes | current-resolves |
| cc-report.md:300–349 (v4 L6/W1–W4) | self-citations within v4 section | all exist | yes | current-resolves |
| cc-report.md:429–485 (new v5 section) | self-citations to `research-report.md` and this file | all exist | yes | current-resolves |
| provider-matrix.csv:9,10 | "see Point/grid interpolation row and research-report.md section 3" | `provider-matrix.csv` file line 11; `research-report.md` `## 3.` (L98) | yes | current-resolves |
| provider-matrix.csv:37 | Grade column, cause of all-null pattern UNKNOWN, no INFERRED term | (wording only) | n/a | current-resolves |
| source-register.md:40,61,64 | "see `research-report.md` §2/§3" | `## 2.`(L80), `## 3.`(L98) | yes | current-resolves |

### Count of unresolved items (general inventory)

**0 unresolved**, unchanged from v4 (the only v5 change to this table is row 1's pointer correction — no new unresolved item was found or introduced).

## Focused pattern record (M4) — exact verifier output, then classification

### Commands and output (unedited, per M4 — "paste the output unedited before any class column is added")

Script: `research-tools/reference-check-verify.mjs` (source inspected first — confirmed read-only against the four named files plus a local existence check of this file, stdout only, no writes, no network, no subprocess). Run:
```
node research-tools/reference-check-verify.mjs > research-tools/reference-check-verify.output.txt
```
Shell: Git Bash (the Bash tool). Full, unedited output is saved at `research-tools/reference-check-verify.output.txt` and reproduced in full below (copied verbatim from that file, nothing added or removed from the script's own stdout other than this surrounding Markdown fencing):

```
## SHA256 of each input file
6ba7ab002225578bc647543d3fa4c242c4b72250d20164c5ec7319ea27e9e464  research-report.md
25e3d4f451d2823b4176165f574641aa0fe0262a89f3dfebabbd978286706883  provider-matrix.csv
c962369bed1e34228bbbc8d2d8a7ab4847ccca5d4621a5d355425c104a6dea00  source-register.md
2f9c80be8ec334113a085730c1294d6194d498ff7f15a865013ffc03ea3da84d  cc-report.md

## Matching lines per pattern (file:line:excerpt)
### hliðarfund|hlidarfund
research-report.md:15: (R7 row, corrected v5)
research-report.md:32: (v4-mapping W1 row)
research-report.md:35: (v4-mapping W4 row)
research-report.md:175: (Tilvísanaprófun withdrawal)
cc-report.md:155: (R7 SUPERSEDED marker)
cc-report.md:226: (zero-broken SUPERSEDED marker, quotes the hliðarfundur example)
cc-report.md:304: (v4 L6 checklist row 1)
cc-report.md:305: (v4 L6 checklist row 2)
(matching-line count for this pattern: 8)

### vanti þessa skynjara
research-report.md:35: (v4-mapping W4 row, names the search string)
research-report.md:92: (corrected §2 null-count row, withdrawal)
cc-report.md:309: (v4 L6 checklist row 6)
(matching-line count for this pattern: 3)

### sensor-absence|sensor absence
provider-matrix.csv:37: (corrected Grade row, withdrawal)
cc-report.md:309: (v4 L6 checklist row 6)
cc-report.md:342: (W3 disposition heading)
cc-report.md:344: (W3 disposition prose, "term is gone")
(matching-line count for this pattern: 4)

### zero broken
research-report.md:32: (v4-mapping W1 row)
research-report.md:35: (v4-mapping W4 row, names the search string)
research-report.md:175: (Tilvísanaprófun withdrawal)
cc-report.md:226: (SUPERSEDED marker)
cc-report.md:306: (v4 L6 checklist row 3)
(matching-line count for this pattern: 5)

### engin brotin
research-report.md:175: (Tilvísanaprófun withdrawal)
cc-report.md:306: (v4 L6 checklist row 3)
(matching-line count for this pattern: 2)

### reproduced inline
research-report.md:35: (v4-mapping W4 row, names the search string)
cc-report.md:226: (SUPERSEDED marker)
cc-report.md:306: (v4 L6 checklist row 3)
cc-report.md:310: (v4 L6 checklist row 7)
(matching-line count for this pattern: 4)

### lína 62|línu 62|line 62|L62
research-report.md:15: (R7 row, correction note only)
cc-report.md:304: (v4 L6 checklist row 1, preserved old text + v5 correction note)
cc-report.md:435: (v5 section X1 disposition prose)
cc-report.md:438: (v5 section X1 checklist bullet)
cc-report.md:442: (v5 section X1 negative-denial sentence)
(matching-line count for this pattern: 5)

## M2 uniqueness check (research-report.md, R7 flag-only sentence)
'## 1.' heading at line: 72
'## 2.' heading at line: 80
occurrences of "Leiðrétt orðalag (R7):" strictly between '## 1.' and '## 2.': 1
line number(s) of occurrence(s): 76

## Pointer existence checks
research-report.md '## 8.' heading: found at line 167 ("## 8. Næsta skref (nýr hluti, v3 — svarar R6/V2)")
reference-check.md exists at expected path: true
reference-check.md top heading: found at line 1 ("# Ticket #450 — Reference check (v4, W4/L5)")
```

(The excerpt text for each `file:line` hit has been shortened to a parenthetical description above for table readability; the full, unshortened excerpt for every one of the 31 hits is in the actual saved file `research-tools/reference-check-verify.output.txt`, which truncates each excerpt to 220 characters — itself unedited script output, not hand-trimmed further here.)

### Classification of every hit (M4's four classes — (a) withdrawn, (b) negative denial, (c) checklist/disposition quote, (d) defect)

| Pattern | file:line | class | why |
|---|---|---|---|
| hliðarfund | research-report.md:15 | (b) negative denial | states "sá kafli er ekki til" (that section does not exist) — a current, accurate denial, not a withdrawal of a past claim |
| hliðarfund | research-report.md:32 | (c) checklist/disposition quote | v4-mapping table names the defect by quoting the phrase |
| hliðarfund | research-report.md:35 | (c) checklist/disposition quote | names the search-pattern string itself (W4 row) |
| hliðarfund | research-report.md:175 | (a) withdrawn | quotes the v3 false claim specifically to withdraw it |
| hliðarfund | cc-report.md:155 | (a) withdrawn | SUPERSEDED marker, explicitly labelled |
| hliðarfund | cc-report.md:226 | (a) withdrawn | SUPERSEDED marker, quotes the hliðarfundur example as part of withdrawing the "zero broken" claim |
| hliðarfund | cc-report.md:304 | (c) checklist/disposition quote | L6 before/after checklist row, quotes old offending text |
| hliðarfund | cc-report.md:305 | (c) checklist/disposition quote | L6 checklist row, quotes old offending text |
| vanti þessa skynjara | research-report.md:35 | (c) checklist/disposition quote | names the search-pattern string |
| vanti þessa skynjara | research-report.md:92 | (a) withdrawn | corrected §2 row's own withdrawal sentence |
| vanti þessa skynjara | cc-report.md:309 | (c) checklist/disposition quote | L6 checklist row, quotes old offending text |
| sensor-absence | provider-matrix.csv:37 | (a) withdrawn | row's own label + withdrawal prose |
| sensor-absence | cc-report.md:309 | (c) checklist/disposition quote | L6 checklist row |
| sensor-absence | cc-report.md:342 | (c) checklist/disposition quote | section heading naming the topic, not an assertion |
| sensor-absence | cc-report.md:344 | (b) negative denial | "the literal ... term is gone" — current statement the term no longer exists |
| zero broken | research-report.md:32 | (c) checklist/disposition quote | v4-mapping table |
| zero broken | research-report.md:35 | (c) checklist/disposition quote | names the search-pattern string |
| zero broken | research-report.md:175 | (a) withdrawn | Tilvísanaprófun paragraph |
| zero broken | cc-report.md:226 | (a) withdrawn | SUPERSEDED marker |
| zero broken | cc-report.md:306 | (c) checklist/disposition quote | L6 checklist row |
| engin brotin | research-report.md:175 | (a) withdrawn | same Tilvísanaprófun paragraph |
| engin brotin | cc-report.md:306 | (c) checklist/disposition quote | L6 checklist row |
| reproduced inline | research-report.md:35 | (c) checklist/disposition quote | names the search-pattern string |
| reproduced inline | cc-report.md:226 | (a) withdrawn | SUPERSEDED marker |
| reproduced inline | cc-report.md:306 | (c) checklist/disposition quote | L6 checklist row |
| reproduced inline | cc-report.md:310 | (c) checklist/disposition quote | L6 checklist row 7 |
| lína 62 | research-report.md:15 | (a) withdrawn | the wrong claim is quoted inside the explicit correction note, per M2's only permitted exception |
| lína 62 | cc-report.md:304 | (a) withdrawn | old text preserved, v5 correction note appended in place |
| lína 62 | cc-report.md:435 | (a) withdrawn | v5 section's own X1 disposition prose, quotes and explains the old wrong claim |
| lína 62 | cc-report.md:438 | (c) checklist/disposition quote | v5 section's own description of what was fixed |
| lína 62 | cc-report.md:442 | (b) negative denial | "No file among the five now names line 62 as the R7 location, except..." — current denial |

**Totals: 31 hits across 7 patterns. Class (d) active unsupported claim: 0.** No pattern produced a live, unmarked repeat of any of the original defects. (b) hits are listed and labelled "negative denial", never "withdrawn", per M4's explicit instruction.

**Comparison to the v4 version of this record (which Jonesy's X2 found wrong):** the v4 record claimed 4/2/1/3/1/2 hits for the six X2 patterns (hliðarfund/vanti/sensor-absence/zero-broken/engin-brotin/reproduced-inline respectively); the true, re-run counts on the final files are 8/3/4/5/2/4. The undercounts were an artifact of v4's hand-run, narrower grep invocations (which likely matched only the first occurrence per file in some ad hoc check, or were run before all edits were finished) rather than a systematic, scripted, full-file scan. This v5 record is generated by a script that reads every line of every one of the four files for every pattern, with its output pasted verbatim above — eliminating that class of undercount for this check, though see "Residual limitation" below for what is NOT eliminated.

## Pointer verification (no circular reference)

- `research-report.md:175` points to `reference-check.md` (this file) — verified: this file exists at `docs/ai/tasks/ticket-450/reference-check.md` (confirmed by the M5 script's own existence check, above).
- `cc-report.md:226` and `cc-report.md`'s v4/v5 sections point to `reference-check.md` (this file) — verified: same file, same path.
- This file points to neither `research-report.md` nor `cc-report.md` for *its own result* — every claim above is backed by an inline command and literal, unedited script output, or an inline heading-list, not a cross-document "see the other file" pointer.

## Residual limitation (stated honestly, not hidden)

This check combines a manual full read (method 1, for the general inventory) with a scripted, exhaustive line-by-line scan (method 2/M5, for the seven focused patterns). The scripted part eliminates the specific class of error Jonesy's X2 caught in v4 (a hand-run grep undercounting matches) for those seven exact patterns. It does **not** eliminate the broader risk that a reference using wording outside all of the patterns method 1 deliberately looks for, and not otherwise salient during the one-party manual read, could still be missed in the general inventory table — the same class of limitation already stated in the v4 round. No claim stronger than "0 unresolved found by the general inventory, 0 class-(d) defects found by the scripted focused-pattern scan" is made.

## M6 footer — independent rerun and final confirmation (written after the record above, per M6)

**Rerun:** `research-tools/reference-check-verify.mjs` was re-run a second time, independently, after this file's main content (above) was written:
```
node research-tools/reference-check-verify.mjs > /tmp/reference-check-verify.rerun.txt 2>&1 ; diff research-tools/reference-check-verify.output.txt /tmp/reference-check-verify.rerun.txt
```
Result: **one line differs, honestly reported rather than claimed clean** —
```
69c69
< reference-check.md top heading: found at line 1 ("# Ticket #450 — Reference check (v4, W4/L5)")
---
> reference-check.md top heading: found at line 1 ("# Ticket #450 — Reference check (v4 original + v5 X1/X2 correction)")
```
This is the script's own "pointer existence check" of **this file's own title**, which was deliberately retitled (from the v4-era title to the current one, above) *after* the saved `research-tools/reference-check-verify.output.txt` run but *before* this rerun — so the two runs legitimately read a different self-title at the moment each ran. This is not a defect in the four SHA256 values or in any of the 31 pattern-hit lines (all 69 other lines of output are byte-identical between the two runs, confirmed by `diff` reporting only this one hunk) — it only affects the script's incidental self-check of `reference-check.md`'s own current heading text, which M5's execution clarification explicitly permits reading for an existence/heading check but which is not part of the four-file SHA256/pattern-scan subject matter itself. The saved `research-tools/reference-check-verify.output.txt` (and the copy pasted above) reflects the run taken partway through this file's own editing and is therefore the one with the older self-title string in that one line; this is stated here rather than silently reconciled, per M6's instruction to report the actual comparison result.

**Independent hash check (M6):** `sha256sum` (Git Bash, available in this environment — no PowerShell `Get-FileHash` fallback was needed; this is recorded as the tool-choice deviation M6 anticipates) was re-run directly against the four input files and compared byte-for-byte against both the table in this file and the script's own SHA256 output:
```
sha256sum research-report.md provider-matrix.csv source-register.md cc-report.md
```
Result: **all four hashes match** the values recorded in "SHA256 of each checked file, at check time (v5, final)" above and in the script's own output — `6ba7ab00…`/`25e3d4f4…`/`c962369b…`/`2f9c80be…`. Confirmed equal, not just visually similar.

**Sample/manifest/archive hashes before and after this v5 round (M6):** all ten `samples/*.json`/`*.txt` files, `samples/manifest.md`, and the top-level files of `v1-archive/`, `v2-archive/`, `v3-archive/` were re-hashed at the end of this round and compare identical to their values at the start of this round (and to every prior round's recorded values) — none were touched in v5, as required by M1's allowed-writes list. `v4-archive/`'s five files (created fresh in this round) hash identically to the live files they were copied from at the moment of copying, confirmed both immediately after the copy and again at the end of the round.

**Brief secret-pattern grep of the changed files only (M6):** `apikey|api_key|authorization|cookie|bearer|token` plus the `[A-Za-z0-9+/]{40,}={0,2}` base64-like heuristic, run against exactly the files touched in v5 (`research-report.md`, `cc-report.md`, `reference-check.md` (this file), `research-tools/reference-check-verify.mjs`). All hits are benign and of the same classes seen in every prior round: the literal `OPEN_METEO_API_KEY` **variable name** (never a value); the keywords appearing only inside this and prior rounds' own audit-command text, quoted self-referentially; and SHA256/git-commit hex digests sitting in this file's and `cc-report.md`'s own hash tables (40+ hex characters, matched by the heuristic but are plainly-labelled hashes, not secrets). **Zero actual secrets found** — no secret value is printed here or anywhere in this file.

**Explicit deviations (M6 — not "none"):**
1. `Get-FileHash` was not needed — `sha256sum` was available throughout (Git Bash), so the PowerShell fallback M6 anticipated was not exercised. Recorded per M6's instruction to record which tool was actually used.
2. The verifier script's per-excerpt text in the pasted "Commands and output" block above was shortened to a parenthetical description for table/doc readability, with an explicit note that the full, untrimmed 220-character excerpts are only in the raw `research-tools/reference-check-verify.output.txt` file — this is a presentation choice for this Markdown file, not an edit to the script's actual saved output file, which remains byte-for-byte what the script produced.
3. The "rerun comparison" command above redirects the second run to a path outside this task directory (`/tmp/...`) specifically so the rerun's own output file is never itself a new tracked deliverable requiring its own hash/archival bookkeeping — this is a one-off diagnostic rerun, not a second generation of evidence.
4. The rerun comparison surfaced a genuine one-line diff (this file's own self-title, read incidentally by the script's pointer-existence check, changed between the saved run and the rerun because this file was retitled mid-round) — reported honestly above rather than overwritten with a false "no difference" claim. This is listed here as a deviation from a clean, trivial "diff shows nothing" result, not as a defect in the four-file SHA256/pattern-scan evidence itself.
