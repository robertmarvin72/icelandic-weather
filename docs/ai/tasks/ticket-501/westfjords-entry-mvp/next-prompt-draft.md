# #501 — Vestfirðir: fyrsta tenging — NÆSTA PROMPT, ÓVIRKT DRÖG — 2026-11-19

Ekki approved/execution prompt. Virk Hella-lota heldur CURRENT pointer þar til lokið; við virkjun skal gera prompt-review.md, Jonesy review og approved-prompt samkvæmt venjulegum verkferli. Engin sjálfvirk execution á þessum drögum.

Markmið: endurnýta tilbúinn Hringveg og bæta fyrstu raunverulegu Vestfjarðatengingu við: vegamót1/60→Búðardalur og öfugt, rétt röðuð geometry/IdButur og skýrir greinipunktar. Eitt kort og focused próf. Ekki allt Vestfjarðanet eða allt landið í einni lotu.

Lesa owner-packages-2026-11-19/source-note.md og manifest, project/Verkefnislysing.txt sem heimild en ný fyrirmæli eiganda ganga framar nákvæmniskröfu; project/Island-akstursrod-og-GPS.csv og Vestfirdir-Hringvegur.png. Lesa samsvarandi vegagerdin-ids CSV/GeoJSON/heimildir. Nota sömu pakka í báðum review-stigum. Hnit eiganda gild fyrir MVP, engin ný nákvæmnisrannsókn; gamli56-listi ekki lokascope. Flatey/ferja utan, akstur að höfnum má síðar.

Byrja á retained offline geometry veg1/60 og ná raunverulegri grein1/60; staðfesta Bröttubrekku/Miðdala-keðju að Búðardal með legu, vegnúmerum, heitum og source-identities. CSV-röð og nearest candidate duga ekki. Raunveruleg IdButur eru staðfest að séu til; leiðarnotkun þarf valda röð af raunferlum. Ekki flytja IdButur_tillogur í roadConditionIds. Varðveita alla nauðsynlega ferla sama IdButur. Ný leiðarniðurstaða getur geymt route-validated condition-ID sem stoð fyrir #503, ekki ný live færðartenging hér.

Minnsta offline adapter: WGS84/tier0 í sameiginlegt metrískt CRS með varðveittri upprunamerkingu. Ekki blanda tier0 við tier2 í einu core-kalli, ekki merkja tier0 semtier2 eða gráður semmetra. Núverandi Hringvegs-svör/ID haldast óbreytt; tákna Hringvegsjunction og svæðisleið skýrt fremur en að sameina allt landsnet. Enginn nýr provider/framework; endurnýta core og litlar runtime-svæðisgagnaskrár, ekki runtime-lestur docs.

Eigandapunktar og akstursaðkoma aðskilin. Dalsmynni candidate skortur er ekki óaðgengi; finna1/60 geometry-junction í stað þess að draga beina línu frá staðarpunkti til næsta vegar. Leggja fram opnanlegt kort með product-punktum/aðkomum/junction og báðum raunferlum; sýna áætlaða tengingu ef einhver er, aldrei sem opinber road-feature. Ef heilkaflagat finnst, skila nákvæmu gati og minnsta vali, ekki nýju landsaudit eða þöglum langri tengingu.

Próf: rétt sourceId-röð og réttar greinar í báðar áttir, samfelld keðja, metralengd, IdButur-join úr völdum geometry, ekkert ID úr óvöldum afleggjara bara af nálægð; fyrri Hringvegspör óbreytt. Sameiginlegt API-innsláttarsnið og rétt stable place-ID fyrir einungis þennan svæðisbút; 164staða innflutningur ekki sjálfvirkur. Lint snertum JS/diff-check og focused regressions; engin fullsuite/fuzz/hardening nema sýnd ástæða.

Afhending: working fyrsta svæðistenging, stutt cc-report með gögn/source-hash, forsendum, prófum og virku korti. Engin ný netöflun, ferja, UI/#502, live færð/#503, gömul #501-endurvinnsla, commit/push/deploy/GitHub. Blocker sýnir ranga/ónothæfa leið eða umfangsbrot; ekki krefjast nákvæmari eigandahnita eða opinberrar MVP-stefnustaðfestingar. Stoppa þegar þessi tenging virkar; aðrir Vestfirðir í planinu.
