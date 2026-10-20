# Ticket #450 — Reference check (v4, W4/L5)

This file is the **single saved location** for the v4 reference-inventory result required by Jonesy's L5 condition. `research-report.md` (§8 closing paragraph) and `cc-report.md` (R7 and V2 dispositions, "v4 Correction Round" section) both point here for the full result; **this file does not point back to either of them for its own result** — everything needed to verify the result is below (exact commands, literal output, and the table itself), not a cross-document pointer. This avoids the circular-pointer problem Jonesy flagged (W4).

## Method

Two methods were combined, each with stated limits:

1. **Manual, full read (primary method for L2(e)'s inventory).** `research-report.md`, `provider-matrix.csv`, `source-register.md`, and `cc-report.md` were each read in full (not sampled or skimmed) by CC during this v4 round. Every occurrence of the following patterns was logged by hand while reading, not by relying on one grep pattern to find them: `§N` section marks, "S8"-style typos (a section mark fused with a source-register ID), "sjá …", "hér að ofan/neðan", "above/below", "memo"/"minnisblað(s)"/"box", "next-step"/"Næsta skref", "Grep-staðfesting", every backticked file path cited together with a section or row number, and the named headings of the mapping tables. **Limit:** a manual read can still miss a reference if its wording doesn't match any of the above categories and isn't otherwise salient; this is mitigated by the second method below, but not eliminated — see "Residual limitation" at the end of this file.
2. **Targeted automated greps (secondary, for exact reproducibility and for the six strings Jonesy named explicitly in L5).** Six `grep -rniE` commands, listed verbatim under "Final focused grep results" below, run against the four live deliverable files and, separately, against the three archive directories (to confirm archived occurrences are correctly classed as archive-valid rather than needing a fix). **Limit:** grep only catches the exact string/pattern given; it is not a substitute for the manual read for anything not in this list of six strings, which is why method 1 is primary.

Every reference found by either method was classed as one of:
- **current-resolves** — the reference's target (a heading, file, row, or source ID) exists in the current, live document as read at check time.
- **historical-with-marker** — the reference describes a past state (e.g. "this was true in v2") and is explicitly marked as historical/superseded where it appears; it does not claim to be current.
- **archive-valid** — the reference lives inside `v1-archive/`, `v2-archive/`, or `v3-archive/` and correctly describes the frozen content of that archived snapshot; archives are not edited, so these are not defects.
- **defect (fixed in this round)** — the reference did not fit any of the above (it pointed at something that doesn't exist, was ambiguous, or made an unproven/false claim without any marker) and was corrected during this v4 round.

## SHA256 of each checked file, at check time

Taken immediately after all other v4 edits (including the `cc-report.md` v4 section itself) were complete, per L5's explicit ordering instruction — these are the exact file states this reference check was run against:

```
e655b73526d9ca3c0bd3055e623879ca4b86a0a8b4986ea7742b7306cd401a23  research-report.md
25e3d4f451d2823b4176165f574641aa0fe0262a89f3dfebabbd978286706883  provider-matrix.csv
c962369bed1e34228bbbc8d2d8a7ab4847ccca5d4621a5d355425c104a6dea00  source-register.md
a9761c17c32958aa8cfe7cb61dabae53fd53a0132e894df25dc25deb799f4bbc  cc-report.md
```
Checked: 2026-10-19T19:35:01Z.

**If any of these four files changes after this point, this hash table (and therefore this check's currency) must be refreshed before handoff — per L5.** No edit was made to any of the four files after this hash table was taken; this file (`reference-check.md`) itself was written after, and does not modify any of them.

## Authoritative heading lists used to resolve `§N` and named-section references

`research-report.md`: `## v2-leiðréttingar…` (L5), `## v3-leiðréttingar…` (L17), `## v4-leiðréttingar…` (L28), `## Ákvörðunarminnisblað` (L41) with sub-headings `### Eigandaspurning…` (L43), `### Hvaða notkun…` (L49), `### „IG" og rekstraraðilar…` (L66), `## 1.` (L72) through `## 9.` (L179), `## Viðaukar` (L185).

`cc-report.md`: top-level `#` title plus per-round `## v2 Correction Round` (L87), `## v3 Correction Round` (L194), `## v4 Correction Round` (L296), each with their own `###` sub-headings (K1–K6/V1–V3/N1/Ripley-K3/K4 under v3; L6/W1–W4 under v4).

## Reference inventory table

`file:line` is the current, post-v4 line number where the reference text appears. Where many lines carry the same reference to the same target, lines are grouped into one row.

| file:line | reference text (summarized) | target | resolves? | class |
|---|---|---|---|---|
| research-report.md:15 | R7 row — now names `research-report.md` §1, line 62, quotes the real sentence | `research-report.md` §1 (heading at L72, sentence at L76) | yes | current-resolves |
| research-report.md:15, 32, 175 | "Mikilvægur hliðarfundur" box, named as never having existed | (no target — explicitly states none exists) | n/a (correctly states non-existence) | current-resolves (the reference correctly says the target does NOT exist, which is itself the current, accurate fact) |
| research-report.md:5,9–15 (v2-mapping table) | §5, §2, §3, §8 cross-references in the R1–R7 mapping row | `## 5.`(L125), `## 2.`(L80), `## 3.`(L98), `## 8.`(L167) | yes | current-resolves |
| research-report.md:17–26 (v3-mapping table) | §2, §8, §1, §5 cross-references | same headings as above | yes | current-resolves |
| research-report.md:28–35 (v4-mapping table) | self-citations to lines 15/59/87/175 in this document, and to `cc-report.md` lines 155/226 | all four exist at the stated lines as of this check's hash snapshot | yes | current-resolves (explicitly caveated in the table cell itself that line numbers drift on further edits — see that row's own text) |
| research-report.md:54 | "sjá **§8. Næsta skref**" | `## 8. Næsta skref` (L167) | yes | current-resolves |
| research-report.md:56 | "(sjá §2)" ×2, "sjá §2 og `research-tools/nearest-station-distance.output.txt`" | `## 2.` (L80); file exists at `research-tools/nearest-station-distance.output.txt` | yes | current-resolves |
| research-report.md:59 | Grep-staðfesting — now gives exact inline grep output instead of pointing at `cc-report.md, v3-kafla` | self-contained (no external pointer any more) | yes | current-resolves (defect fixed — previously an unproven external pointer, see W1/L2c) |
| research-report.md:68 | "(sjá §5)" | `## 5.` (L125) | yes | current-resolves |
| research-report.md:74 | "Sjá `v1-archive/research-report.md` §1" | `v1-archive/research-report.md`, its own §1 heading | yes | archive-valid |
| research-report.md:87 | corrected "§1 hér í þessu skjali" + "heimild S8 í source-register.md" (was ambiguous "§1/S8") | `## 1.` (L72) and `source-register.md` row `| S8 |` (L22) | yes | current-resolves (defect fixed — see W1/L2d) |
| research-report.md:92 | "hér að neðan" (null-count row points to the full table in `research-tools/observation-field-table.output.txt`) | file exists | yes | current-resolves |
| research-report.md:94 | "sjá **§8. Næsta skref**" | `## 8. Næsta skref` (L167) | yes | current-resolves |
| research-report.md:111 | corrected "heimild **E1**… / `provider-matrix.csv` röð 8" (was garbled "§-E1") | `source-register.md` row `\| E1 \|` (L38); `provider-matrix.csv` file line 8 | yes | current-resolves (defect fixed — see W1/L2e additional finding) |
| research-report.md:113 | "§2 hér að ofan" | `## 2.` (L80) | yes | current-resolves |
| research-report.md:121 | "Sjá `v1-archive/research-report.md` §4" | archived file, its own §4 | yes | archive-valid |
| research-report.md:34 | "röð 37 að neðan" with explicit numbering-convention note (Jonesy's data-row-count "row 36" vs. this document's file-line-count "röð 37" for the same physical row) | `provider-matrix.csv` file line 37 | yes | current-resolves (defect fixed — numbering ambiguity explained, not silently picked — see W1/L2e) |
| research-report.md:152 | "sjá `v1-archive/research-report.md` §6" | archived file, its own §6 | yes | archive-valid |
| research-report.md:171 | "(§5, §7)" | `## 5.` (L125), `## 7.` (L156) | yes | current-resolves |
| research-report.md:173 | "§2's nýja…", "sbr. §7's…" | `## 2.` (L80), `## 7.` (L156) | yes | current-resolves |
| research-report.md:175 | "⚠ Tilvísanaprófun" — withdraws the v3 "zero broken references" claim, points to `reference-check.md` (this file) | this file | yes | current-resolves (defect fixed — see W1/W4/L2c) |
| research-report.md:181 | "sjá `v1-archive/research-report.md` §8 (upprunalega tölusetningin…)" | archived file, its own (pre-renumbering) §8 | yes | archive-valid (explicitly marked as the archive's own, different numbering) |
| research-report.md:187–192 (Viðaukar) | file/path citations to `provider-matrix.csv`, `source-register.md`, `samples/`, `research-tools/`, `cc-report.md`, `v1-archive/`; corrected to name all three scripts and all three `cc-report.md` round-sections | all files/directories exist | yes | current-resolves (two defects fixed in this bullet list — see W1/L2e) |
| cc-report.md:54 | "see `research-report.md` for the full narrative and decision memo" | `research-report.md`, `## Ákvörðunarminnisblað` (L41) | yes | current-resolves |
| cc-report.md:145–155 | §2/§3 cross-references inside the v2 R1–R7 disposition | `## 2.`(L80), `## 3.`(L98) | yes | current-resolves |
| cc-report.md:155 | SUPERSEDED marker added at the R7 line, pointing to `research-report.md` §1 and the v2-mapping table's corrected R7 row | `## 1.` (L72); `research-report.md:15` | yes | current-resolves (defect fixed — see L2b) |
| cc-report.md:216–247 | §1/§2/§5 cross-references inside the v3 V1/K3/K4 dispositions | `## 1.`(L72), `## 2.`(L80), `## 5.`(L125) | yes | current-resolves |
| cc-report.md:226 | SUPERSEDED marker withdrawing "zero broken references found" / "reproduced inline", redirecting to `reference-check.md` | this file | yes | current-resolves (defect fixed — see W1/W4/L2c) |
| cc-report.md:277, 283, 288 | "§8"/"§8's step 3" cross-references inside the v3 "remaining limitations"/"deviations" | `## 8.` (L167) | yes | current-resolves |
| cc-report.md:300–349 (v4 section, L6 table + W1–W4 text) | self-citations to `research-report.md` lines 15/59/87/92/175, `provider-matrix.csv` row 37, and to this file | all exist as of this check | yes | current-resolves |
| provider-matrix.csv:9,10 | "see `provider-matrix.csv` Point/grid interpolation row and `research-report.md` section 3" | `provider-matrix.csv` file line 11 ("Point/grid interpolation"); `research-report.md` `## 3.` (L98) | yes | current-resolves |
| provider-matrix.csv:37 | corrected Grade column, cause of all-null pattern restated as UNKNOWN with no INFERRED term | (no external target — wording only) | n/a | current-resolves (defect fixed — see W3/L4) |
| source-register.md:40 | "see `research-report.md` §3" | `## 3.` (L98) | yes | current-resolves |
| source-register.md:61,64 | "see `research-report.md` §2" (×2); V7/V8 "new this round" clarified | `## 2.` (L80) | yes | current-resolves (V7/V8 wording defect fixed — see W1/L2e) |

## Count of unresolved items

**0 unresolved** (reported as found by actually re-checking every row above against the live headings/files/rows/IDs at the SHA256 snapshot above — this is a reported result, not an assumption). All references that were previously unresolved or false (the five items in Jonesy's W1, plus the five additional ones found during this round's full read: appendix script count, appendix cc-report-section count, "§-E1" typo, V7/V8 wording, and the row-36-vs-37 convention mismatch) were corrected during this same v4 round, as shown in the table above and in `cc-report.md`'s v4 "L6 — before/after checklist".

## Final focused grep results (Jonesy's six required strings)

Run against the four live deliverable files:

```
grep -rniE "hliðarfund|hlidarfund" research-report.md provider-matrix.csv source-register.md cc-report.md
```
→ 4 hits (`research-report.md:15,32,175`; `cc-report.md:155`). **Class: all historical-text-explicitly-withdrawn** — every hit is inside text that states the box never existed or quotes/withdraws the old false claim; none asserts the box as a current, real location.

```
grep -rniE "vanti þessa skynjara" research-report.md provider-matrix.csv source-register.md cc-report.md
```
→ 2 hits (`research-report.md:35,92`). **Class: historical-text-explicitly-withdrawn** — line 35 is the v4-mapping-table's own description of what W3 fixed (quoting the phrase to name the defect); line 92 is the corrected §2 row's own withdrawal sentence ("þessi ályktun er hér felld niður"). No live, unmarked claim remains.

```
grep -rniE "sensor-absence|sensor absence" research-report.md provider-matrix.csv source-register.md cc-report.md
```
→ 1 hit (`provider-matrix.csv:37`). **Class: historical-text-explicitly-withdrawn** — the hit is inside the row's own withdrawal sentence ("the v3 text here stated an unconfirmed inference... withdrawn"), not a live claim.

```
grep -rniE "zero broken" research-report.md provider-matrix.csv source-register.md cc-report.md
```
→ 3 hits (`research-report.md:32,35,175`). **Class: historical-text-explicitly-withdrawn** — all three quote the phrase only to name and withdraw the v3 defect (the v4-mapping table's own description, and the §8 paragraph's own withdrawal). No row asserts "zero broken" as a current, live finding.

```
grep -rniE "engin brotin" research-report.md provider-matrix.csv source-register.md cc-report.md
```
→ 1 hit (`research-report.md:175`). **Class: historical-text-explicitly-withdrawn** — same withdrawal paragraph as above.

```
grep -rniE "reproduced inline" research-report.md provider-matrix.csv source-register.md cc-report.md
```
→ 2 hits (`research-report.md:35`; `cc-report.md:226`). **Class: historical-text-explicitly-withdrawn** — line 35 names it as one of the strings this very check searches for; line 226 is `cc-report.md`'s own withdrawal of that pointer ("is also withdrawn").

Run against the archive directories (to confirm correct archive-valid classification, not to fix anything — archives are never edited):

```
grep -rliE "hliðarfund|hlidarfund" v1-archive v2-archive v3-archive
```
→ `v1-archive/research-report.md`, `v2-archive/cc-report.md`, `v3-archive/cc-report.md`, `v3-archive/research-report.md`. **Class: archive-valid** — these are frozen, byte-identical snapshots of what Jonesy/Ripley actually reviewed at each round; per L1 and the project's standing archive rule, archives are never edited to fix a later-discovered defect.

```
grep -rliE "zero broken" v1-archive v2-archive v3-archive
```
→ `v3-archive/cc-report.md`. **Class: archive-valid.**

```
grep -rliE "vanti þessa skynjara" v1-archive v2-archive v3-archive
```
→ `v2-archive/research-report.md`, `v3-archive/research-report.md`. **Class: archive-valid.**

```
grep -rliE "sensor.absence|sensor absence" v1-archive v2-archive v3-archive
```
→ `v3-archive/provider-matrix.csv`. **Class: archive-valid.**

## Pointer verification (no circular reference)

- `research-report.md:175` points to `reference-check.md` (this file) — verified: this file exists at `docs/ai/tasks/ticket-450/reference-check.md`.
- `cc-report.md:226` and `cc-report.md`'s v4 section (W4 disposition) point to `reference-check.md` (this file) — verified: same file, same path.
- This file points to neither `research-report.md` nor `cc-report.md` for *its own result* — every claim above is backed by an inline command and literal output or an inline heading-list, not a cross-document "see the other file" pointer. (This file does of course reference specific line numbers and headings *inside* those two documents, as the inventory itself requires — that is the inventory's subject matter, not a circular dependency on the other document's own self-assessment of correctness.)

## Residual limitation (stated honestly, not hidden)

This check combines a manual full read with six targeted greps. The manual read is thorough but not formally exhaustive — a human-style read of ~600 combined lines across four files, done once, by one party (CC), without a second independent reader. It is possible, though believed unlikely given the breadth of patterns deliberately searched for (per L2(e)'s list), that a reference using wording outside all of the listed patterns and not otherwise salient during the read was missed. This is the same class of limitation that caused the v3 round's narrower, single-grep-pattern check to miss the "Mikilvægur hliðarfundur" reference in the first place — broadening the method (read-based, six patterns, plus archive cross-checks) reduces but does not formally eliminate this risk. No claim stronger than "0 unresolved found by this check" is made.
