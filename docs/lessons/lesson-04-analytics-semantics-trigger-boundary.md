## Analytics rule — correct value + correct trigger boundary

**Correct analytics semantics require both the right value and the right trigger boundary.**

Það er ekki nóg að senda rétt canonical gildi í event payload ef eventið fire-ar enn á raw/intermediate state.

Fyrir user-facing recommendation analytics skal:

- nota final canonical state sem notandinn raunverulega sér,
- triggera eventið á sama semantic layer og það canonical state verður fullmótað,
- dedupe-a á canonical gildinu sjálfu,
- ekki nota raw engine verdict sem trigger fyrir canonical exposure event,
- og ekki telja payload-leiðréttingu eina og sér næga ef trigger boundary er enn röng.

Dæmi:

`raw move + comparisonState.direction = similar → canonical stay`

Canonical exposure event á að mæla:

`stay`

og fire-a þegar canonical `model.tone` verður `stay` — ekki fyrr þegar raw verdict verður `move`.

Meginregla:

> **Right value on the wrong trigger is still wrong analytics.**
