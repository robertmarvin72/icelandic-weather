# Ticket #504, round 2 — P3 UI-text expected vs. actual

Pre-registered (from `approved-prompt-v2.md` P3, before any step was run)
and compared against the real rendered text, captured verbatim in
`browser-run-log.json`.

| Step | Expected heading | Expected largest-gap line | Expected long-route note | Expected cards | Actual heading | Actual gap | Long-route note | Actual cards | Match |
|---|---|---|---:|---:|---|---|---|---:|---|
| 1. E→Sey | "Veður á 3 punktum" | ≈13,5 km | no | 3 | "Veður á 3 punktum" | "um 13,5 km, milli Nærri Fjarðarheiði og Seyðisfjörður" | absent | 3 | ✓ exact |
| 2. R→Selfoss south | "Veður á 3 punktum" | ≈25,1 km | no | 3 | "Veður á 3 punktum" | "um 25,1 km, milli Rauðavatn og Hellisheiði — austanverð leið" | absent | 3 | ✓ exact |
| 3. R→Selfoss north | "Veður á 18 punktum" | ≈101,8 km | yes | 18 | "Veður á 18 punktum" | "um 101,8 km, milli Leiðarpunktur nærri Biskupshálsi og Leiðarpunktur nærri Fellabæ" | present ("Veður er borið saman á sama tíma...") | 18 | ✓ exact |
| 4. Back to E→Sey | "Veður á 3 punktum" (no leftover 18) | ≈13,5 km | no | exactly 3 | "Veður á 3 punktum" | same 13,5 km | absent | 3 | ✓ exact — confirmed no stale 18-card state survived the switch |
| 5. Swap→ Sey→E | "Veður á 3 punktum" | ≈13,5 km (reversed point order) | no | 3 | "Veður á 3 punktum" | "um 13,5 km, milli Seyðisfjörður og Nærri Fjarðarheiði" (order reversed, same km) | absent | 3 | ✓ exact |
| 6. Keyboard R→Hella south | "Veður á 3 punktum" | ≈55,6 km | no | 3 | "Veður á 3 punktum" | "um 55,6 km, milli Hellisheiði — austanverð leið og Hella" | absent | 3 | ✓ exact |
| 7. Arrow→ north | "Veður á 17 punktum" | ≈101,8 km | yes | 17 | "Veður á 17 punktum" | same 101,8 km note | present | 17 | ✓ exact |

**Zero deviations.** Every one of the 7 live samples matched its
pre-registered expected value exactly — heading text, largest-gap
distance (well within the ±0.5km tolerance; most matched the matrix
figure to 0.0km), long-route note presence/absence, and card count all
agreed. This is the fresh-UI counterpart to round 1's own API-level P2
table, using the real rendered text a user would actually see rather
than the raw JSON.
