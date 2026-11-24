# remaining — ticket #503 ring-options

#503 as a whole is **not closed**. Current coverage after this round:

- **17 of 25** UI-selectable pairs are connected overall: the 15 Westfjords
  pairs (unchanged) + reykjavik-raudavatn↔selfoss + reykjavik-raudavatn↔hella
  (this round, each with south/north options).
- **8 Ring Road UI pairs remain** (any other pair touching selfoss, hella,
  egilsstadir, seydisfjordur, reykjavik-raudavatn not already covered
  above) — e.g. selfoss↔hella, selfoss↔egilsstadir, hella↔egilsstadir,
  reykjavik-raudavatn↔egilsstadir, reykjavik-raudavatn↔seydisfjordur, etc.
- **17 of 28** API pairs are connected; **11 remain, 3 of which are
  junction-only pairs** never reachable from the UI at all.
- This round is the **first** asymmetric (south/north) Ring Road
  measurement — not full Ring Road weather coverage. Only
  reykjavik-raudavatn↔selfoss/hella have `option` support; no other pair
  has an options array at all yet.
- Ring Road full-length measurement for pairs other than the two done here
  (e.g. a true full-ring loop, or Selfoss↔Egilsstaðir directly) is not
  attempted.
- The optional additional Selfoss-side point on Hella-south (noted at
  prompt-review stage, S1) was explicitly **not** taken in — the frozen
  3-point MVP and its own 55.6 km gap caveat stand unchanged, per Ripley's
  own binding decision #7. This is not an open question to resolve later,
  just a decision already made.
- A possible future Ísafjarðardjúp point (from the westfjords-completion
  round, still the largest Westfjords-side gap at ~106 km) remains
  unaddressed, unrelated to this round's own scope.
- The real-browser pass sampled 6 of the 8 variants directly (R→Selfoss
  south/north, Selfoss→R north, R→Hella south/north, keyboard R→Hella);
  Selfoss→R south and R→Hella's own reverse direction are covered by the
  unit/component test suite and the offline cross-check against the real
  geometry handler, not by a dedicated screenshot.
