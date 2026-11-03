# #486 — afmörkuð lokalagfæring v3

Ripley 2026-11-03: REVISE eingöngu R5 úr Jonesy result-review umferð 2. V1/v2 og umfangsmörk halda gildi; engin ný rannsókn eða hjálpartæki. Keyrsla bíður eiganda „Prompt approved“.

Lestu README/CURRENT, result-review.md umferð 2 og cc-report.md viðbót umferð 2. CURRENT → CC_IN_PROGRESS.

Lagfærðu aðeins tvö eftirliggjandi UI-atriði og markviss próf:

1. Í SegmentRow: útrunnin ALLUR_AKSTUR_BANN-tilkynning, þegar kafli er ekki jafnframt closed vegna annarrar lokunar, fær áberandi texta „Útrunnin lokunartilkynning — staðfestu hjá Vegagerðinni“ / „Expired closure notice — confirm with Vegagerðin“. Nýr IS/EN-lykill og læsileg/áberandi lína í stað almennrar smárrar útrunninnar tilkynningarlínu fyrir þetta tilvik. Halda núverandi backend-flokkun; ekki grænt, ekki núgildandi Lokað. Ef virk lokun er líka til staðar helst hún áberandi sem núgildandi; útrunna tilkynningin samt merkt útrunnin.
2. Innan sýnilegrar viðvörunar um ótiltækt/óstaðfest punktafeed bæta við aðgengilegum, þýddum tengli á sama varðveitta VEGAGERDIN_LINKS[lang] og nú er neðst á síðunni. Engin ný slóð eða rannsókn.

UI-próf á IS/EN: útrunnin ein lokun sýnir áberandi sértexta; útrunnin + virk lokun missir ekki núgildandi lokunarmerkingu; punktafeed-viðvörun inniheldur réttan opinberan tengil. Keyra breytt page-próf og lint; ekki endurtaka heila suite/bakendapróf eða vafrayfirferð óbreytts útlits án ástæðu. Ein lítil skjámyndayfirferð nýju textans má nota fyrir læsileika ef tiltækt, engin verkfærasmíði.

N6–N9 samþykkt sem skráðar takmarkanir/athugasemdir, ekki nýjar lokakröfur: stale-served færð hefur sýnilegan aldur og jákvæður stíll fer eftir samþykktum upstream-ferskleikamörkum; tómt punktafeed íhaldssamt; fyrri Chromium-yfirferð CC nægir núverandi umfangi; hjálparfallspróf N1 nægir með kóðalestri. Ekki breyta cache, bakenda, dag/nótt, fetch-lífsferli eða sameiginlegum kerfum.

Bættu við stuttri dagsettri cc-report viðbót með breytingum og prófum, varðveittu fyrri niðurstöður. CURRENT → CC_COMPLETE. Engin net-/lyklabeiðni, ný dependency, commit/push/GitHub/deploy eða umfangsaukning. Eigandi → Jonesy „CC búinn“, síðan Ripley lokamat.
