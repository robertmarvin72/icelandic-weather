# #499/#500/#501 — ready-to-post GitHub text (owner posts; CC does not)

Written per `approved-prompt-v1.md`'s LA1 — grounded only in the
verbatim `#499`/`#500`/`#501` text Ripley read on GitHub 2026-11-13
(quoted in the approved prompt itself). No other ticket condition is
assumed or guessed; CC has no GitHub access this round. These three
blocks are **drafts for the owner to review and post**, not already
posted, and no issue is closed by writing this file.

---

## Block 1 — `#499` closing summary / scope correction

Four base endpoints are now data-ready, with provenance, for a future
Frá/Til feature:

- **R1 (Reykjavík)** — owner-selected 2026-11-13: **Reykjavík —
  Rauðavatn**, western end of IDFERILL 1436 / IDBUTUR 1410010037,
  64.10152894° N, 21.75906405° W. Selection record:
  `docs/ai/tasks/ticket-499/reykjavik/owner-decision.md`. Coordinates
  retained, not re-fetched.
- **E1 (Egilsstaðir)** — reused from the original data round, with
  raw/ledger/native SHA references and the cross-piece junction check
  (2345 END = 2344 START) intact. The prior round's own ER1–ER3
  limitations stand wherever this data is used (native-reference file
  SHA/vertex-index gap; the junction check is a construction/
  consistency check, not independent proof).
- **S2 (Seyðisfjörður)** — described neutrally as **"Seyðisfjörður —
  aðkoma við mót 2894/2892"**: the owner-selected junction the raw
  data supports, not an official place name or confirmed town
  boundary.
- **C (Akureyri)** — retained unchanged, no re-selection.

**This closes a scoped MVP data-preparation step — it does NOT close
the implementation gate `#499`'s own checklist describes.** Against
that checklist, summarized (unchecked items remain partly unresolved):

- [ ] R1 point/name approved; exact northern arc and driving direction
  remain unresolved and are carried forward to #500.
- [ ] E1 reused; ER1/ER2 limitations remain: the registry lacks the
  native-file SHA/vertex index, and the junction check is a construction/
  consistency check. ER1–ER3 remain explicit limitations, not resolved claims.
- [ ] S2 WGS84 confirmed against both junction sides and all precision
  tiers; a sourced approach name remains unresolved. The neutral
  junction description is the MVP label, not a confirmed place name.
- [x] Akureyri C retained, not re-selected.
- [ ] **Driving access/direction** — still has no authority on either
  side and no confirmed status for the Reykjavík-side northern arc;
  this is an **open, carried-forward gap**, not met.
- [~] Delivered endpoint file distinguishes owner choice, confirmed
  data, the candidate, and unmet release conditions — true for what's
  delivered; the unmet condition above is one of the things it
  distinguishes, not something it resolves.

Per `#499`'s own stated proviso: *"Opin aðgengisgöt mega vera
skjalfest niðurstaða rannsóknarlotu; þau teljast ekki staðfest tenging
eða full lokun þessa innleiðingarhliðs."* This closure is exactly
that — a documented research-round outcome, not a claim that the
implementation gate is satisfied.

---

## Block 2 — `#500` follow-up (place/connection register)

Carrying forward into `#500`'s own stated scope (*"Útbúa útgáfustýrða
staðaskrá og rekjanlegar tengingar helstu staða við hringveg og
skilgreinda tengivegi. Depends on: grunnendapunktaákvarðanir úr
undirmiða 1; retained rannsókn má nýta strax."*):

- **Needed**: the exact northern arc/driving direction from the
  western end of piece 1436 (Rauðavatn) toward the
  Reykjavík/Kjalarnes interchange area — connectivity is measured and
  real (geometric adjacency confirmed in retained data), but which
  specific ramp/arc constitutes the through-route, and in which
  direction, is unresolved. Measured geometric contact must not be
  read as a confirmed, drivable route — `#500`'s own text is explicit
  on this point: *"Hvorki nafnasamsvörun, geometry-snerting né
  vetrarþjónustuflokkur einn gerir stað valhæfan."*
- Also carry forward: driving access/direction for E1, S2, and C
  remain unconfirmed (`EXACT_GAP` in the retained registry) — not
  specific to R1.
- This is additive to `#500`'s existing scope, not a request to
  reopen the full national place-coverage audit.

---

## Block 3 — `#501` dependency note

Per `#501`'s own stated scope (*"Samsetja rétta leið milli studdra
staða úr samþykktri staðaskrá og vegkeðjum. Depends on: undirmiða 2,
staðfest gagnasnið/endpoint-contract úr 1."*):

- `#501` should use only connections `#500` actually confirms. The
  unresolved Rauðavatn-side northern connection above must produce an
  explicit `unsupported`/data-gap result in `#501`, never a
  fabricated or inferred route, exactly as `#501` already requires:
  *"Brotinn graf/óstaðfest tenging skilar skýru unsupported/gagnagati,
  ekki uppspunninni leið."*
- No new general route-search engine is implied or requested by this
  note.

---

**Nothing above has been posted to GitHub.** The owner reviews these
three blocks, edits as needed, and posts/commits per `docs/ai/README.md`'s
own human-controlled completion steps — `#499` closure, and any
`#500`/`#501` updates, happen only after that, on the owner's own
action.
