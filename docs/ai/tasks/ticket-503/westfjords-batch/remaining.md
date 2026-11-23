# remaining — ticket #503 westfjords-batch

#503 as a whole is **not closed**. Current coverage after this round:

- **7 of 25 UI-selectable pairs are connected; 18 remain.** Three additional junction pairs exist only in the API.
- **7 of 28** API pairs now have weather/road data bound: B↔H (first
  round) + B↔F, B↔P, B↔T, F↔P, F↔T, P↔T (this round).
- **21 API pairs remain unbound** (no weather/road data binding yet, even
  though most already resolve `geometry_only`), including every pair that
  touches the Ring Road places (reykjavik-raudavatn, selfoss, hella,
  egilsstadir, seydisfjordur) and isafjordur.
- Route **options** (e.g. rvk↔selfoss north/south) have no weather/road
  data binding at all yet — only the single-option geometry pairs do.
- **Ring Road full-length measurement** is not attempted.
- Ódrjúgsháls (inside the B-F/B-P/B-T 83.6 km gap) has no forecast point of
  its own — noted honestly in the UI's computed gap caveat, not hidden.
  Adding a point there is possible future work, not a blocker.
- Tálknafjörður's own short-end and Ísafjörður/other legacy geometry
  limits are unchanged from earlier rounds — not addressed here.
- The real-browser P8 pass sampled 4 of the 12 new directions directly
  (B→T, T→B, P→T, F→P) plus the B-H→new-pair→unconnected-pair race; the
  remaining 8 directions are covered by the unit/component test suite and
  the offline cross-check against the real geometry handler, not by a
  dedicated screenshot.

- The original live probe per-point returned coordinates/elevation/snap and overall minimum ordering margin were not retained. The 2.64 km claim remains attributed to CC, not independently reproduced from retained live data. No additional upstream calls were made to repair this evidence gap.
