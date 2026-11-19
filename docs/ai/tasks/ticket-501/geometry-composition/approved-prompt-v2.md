# #501 geometry-composition — approved correction v2 — 2026-11-17

Ein þröng leiðrétting samkvæmt Jonesy result-review JK1–JK3 og Ripley lokamati REVISE. V1 immutable. Jonesy óskar eftir einni CC-lagfæringu, síðan Ripley lokamati; engin ný hönnunar/prompt-review umferð nauðsynleg fyrir þessar sömu samþykktu kröfur. CC aðeins eftir eiganda “Prompt approved” og CURRENT READY_FOR_CC; CC_IN_PROGRESS áður, CC_COMPLETE eftir.

## JK1 — pinned endpoints og sannanir

Í geometryComposition.test.js lesa SELFOSS úr place_nodes-v3.json nodes_by_idferill[2138].exit_coord = (401739.85,383119.047) og HELLA [3591].exit_coord = (430972.1263,370845.6043). Ekki entry/stored síðasti vertex að geðþótta: entry/exit hér er chain-traversal. Staðfesta próf að hnit séu þessi pinned values og að returned geometry endi þar.

Leiðrétta expected real-pair lengths úr raunverulegri keyrslu, ekki forced golden: independent Jonesy cross-check tier2 Selfoss44984.770378m/Hella80630.947828m. Sama eining skilar því með réttum endum. Uppfæra own-exit athugasemdir og implementation-note töflu; fjarlægja “different lower-cost route” skýringu og next-decision3 sem byggir á henni. cc-report append leiðrétting, gömul röng niðurstaða fær visible superseded note ef hún stendur. Engin production breyting vegna JK1.

## JK2/JK3 — deterministic equal-cost paths

Þetta er hluti upprunalegs stable-ID/shuffle contracts. Minnsta tie-fix í shortestPath: við jafna frontier-fjarlægð velja stable node-key í lexical röð; við jafnan candidate-cost nota stöðuga predecessor/source/fromIndex röðun óháða innsetningu. Ekki breyta numeric length, geometry topology, tier eða source parallel-edge reglu; ekkert epsilon. Forðast predecessor cycles/visited-node rewrites við jafna vegalengd, positive-edge input eins og áður.

Bæta við focused symmetric equal-cost fixture (id10 (0,0)→(10,0)→(10,10), id20 (0,0)→(0,10)→(10,10)) og víxluðu inntaki: sama geometryId/slices, ekki aðeins length. Eitt retained R1→Selfoss shuffled/permuted input próf staðfestir ID/slices með réttum endpoint. Correct closed-ring tie comment. Ekki stækka í graph-framework eða performance redesign.

## Scope og validation

Aðeins geometryComposition.js/test.js og geometry-composition skjöl/CC-report/CURRENT. Allar v1/P1–P6 native/geometry_only/drivingUNVERIFIED/tier/reverse/source boundaries gilda. Engin fs/net í pure module, engin source/server_data/routes/cache/fetch/frontend/UI/endpoint/dependency/GitHub/commit/push/deploy breyting.

Ripley keyrði raun Vitest4.1.10 nú: new geometry suite + routes/segments/cache + src/lib/winterRouteRoutes, 5skrár/48próf PASS á fyrir-leiðréttingu. Þetta er ekki sönnun rétts pinned endpoint. CC keyrir eftir síðustu breytingu sama focused command og eslint á2 skrár; áður umhverfisgalli má ekki sjálfkrafa verða forsenda shim. Ef CC runner bilar, skrá actual output og staðfesta að engin ný breyting valdi; shim sé merkt shim. Ekki laga global config/dependencies. Report exact counts og JK1/JK2/JK3 dispositions.

Commands:
`npx vitest run api/_lib/winterRoute/geometryComposition.test.js api/_lib/winterRoute/routes.test.js api/_lib/winterRoute/segments.test.js api/_lib/winterRoute/cache.test.js src/lib/winterRouteRoutes.test.js`
`npx eslint api/_lib/winterRoute/geometryComposition.js api/_lib/winterRoute/geometryComposition.test.js`

git diff --check/changed-path audit. Engin fullsuite/build/browsers/newdata. CC append v2 skýrslu; result-review/prompt-history/v1 ekki endurskrifuð. Þegar narrowly corrected requested scope og checks standast: hætta. Engin þriðja review umferð án eiganda; ekki kalla þetta full501 eða virka akstursleið.
