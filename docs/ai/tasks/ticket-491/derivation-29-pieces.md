# #491 — V3: reproducible derivation of the 29-piece chain and the 13-piece Vík control

Written for `approved-prompt-v4.md`'s V3 item ("endurskapanleg afleiðsla"), **corrected under `approved-prompt-v5.md` (W1–W2)** after Jonesy's result review found two bugs in this document's first version (see "v5 correction" at the end). This is a documentation-only deliverable: it reproduces, from the already-retained source files, the cumulative-km table behind the four fixed `BORGARNES_FORECAST_POINTS` distances in `api/_lib/winterRoute/routes.js` (23.559 / 34.288 / 53.738 / 70.566 km) and the 13-piece Vík control from the earlier final-validation round. No network call, no new dependency, no new helper module in the repo — the one reproducing command is inline below. **`routes.js`'s fixed numbers are not changed by this document.**

## Source files (retained, unchanged this round)

| File | SHA256 |
|---|---|
| `docs/ai/tasks/ticket-485/samples/wfs-extension-4326.json` | `84e560e3303f655779b09b1f43949032b238d5c18c4ad3679416161003b8222e` |
| `docs/ai/tasks/ticket-491/final-validation/samples/wfs-vesturland-4326.json` | `5fb643b23ac83dc0df47e1ff5c482adb78d7a99bc567028133d8bfd6b140659f` |
| `docs/ai/tasks/ticket-483/samples/wfs-vegnr1-all.json` | `305f60d6f1f17918c058cbd047735681e56d6f9aad99f9e16f50de9419d6983a` |
| `docs/ai/tasks/ticket-483/samples/wfs-chain-4326.json` | `966848554f0ce205c919625c3e6209da1fe05bcc50e7e8084ae96840ad519af4` |
| `docs/ai/tasks/ticket-483/route-segments.csv` | `5f0b18b7549fa7bfa9024c2c2535976cacf5b0b486c9145be0323a85e86e0f57` |

Re-verified unchanged this round (same hashes as the first version of this document). No file was re-fetched.

## Method (B1, unchanged this round — only the implementation below was corrected)

1. **Start gap, counted exactly once:** the chain's own cumulative-km axis starts at Rauðavatn's existing reference point (IDFERILL 1436, the same start the existing Rauðavatn–Vík route already uses — `start_raudavatn` in `final-validation/route-data-candidate.json`), not at piece 1477's own first vertex. The native-ISN93 (EPSG:3057) gap from IDFERILL 1436's own end vertex to piece 1477's own start vertex is **37.39 m**, added once, before piece 1's own length — not re-added anywhere later in the chain.
2. For each of the 29 pieces in chain order: track `entry_km` (cumulative *before* the piece's own length — i.e. right after the gap that precedes it), the piece's own haversine length (R = 6,371,008.8 m, summed along its WGS84 vertices), and `exit_km` (`entry_km + length`, *before* the gap that follows it). The native-ISN93 point-to-point gap to the *next* piece is added only when moving to that next piece's own `entry_km` — never folded into the current piece's own `exit_km`.
3. **P1 = entry_km of piece 3025** (the start of 3025, not the end of the preceding 49285 — numerically identical here only because that specific connecting gap happens to be 0.00 m). **P2 = exit_km of piece 3796** (the end of 3796, *before* the 27.62 m gap to the next piece, 3794 — this is the one place a real gap sits between a "piece boundary" and the following gap, and the two must not be collapsed together). **P3 = entry_km of piece 47042** (its start, following the final-validation round's own point selection). **P4 = exit_km of piece 2819** (its end — the last piece, so no following gap exists regardless).
4. For the 13-piece Vík control: group tier0 features by `IDBUTUR` from `wfs-chain-4326.json`, keeping only features whose own `VEGNR` equals the string `"1"` (not just any feature sharing that `IDBUTUR`), sum each kept group's own haversine length, and compare against `route-segments.csv`'s own `length_km_vegnr1_tier0` column.
5. All sample files are read as **UTF-8** (not latin-1/cp1252). Some `STADARLYSING`/`STUTTNAFNLEIDAR` text fields contain literal U+FFFD replacement characters baked into the file's own bytes — pre-existing upstream data loss at capture time, not a decoding error here — but no field this script actually computes with (`IDFERILL`, `IDBUTUR`, `VEGNR`, `NAKVAEMNIFERLIS`, the coordinate arrays) is affected by that.

## 1. The 29-piece chain (reproduced)

Start gap (IDFERILL 1436's native end → piece 1477's native start): **37.39 m**, counted exactly once, before row 1.

| # | IDFERILL | entry (km) | length (km) | exit (km) | gap to next (m) |
|---|---|---|---|---|---|
| 1 | 1477 | 0.0374 | 0.7838 | 0.8212 | 38.68 |
| 2 | 1431 | 0.8599 | 0.9099 | 1.7698 | 3.60 |
| 3 | 42243 | 1.7734 | 1.2739 | 3.0473 | 3.71 |
| 4 | 49926 | 3.0510 | 0.1825 | 3.2335 | 10.83 |
| 5 | 9923 | 3.2444 | 2.1590 | 5.4034 | 34.16 |
| 6 | 9925 | 5.4376 | 1.9023 | 7.3399 | 26.55 |
| 7 | 9927 | 7.3665 | 0.8208 | 8.1872 | 31.47 |
| 8 | 10242 | 8.2187 | 1.1523 | 9.3710 | 40.83 |
| 9 | 2796 | 9.4118 | 0.6739 | 10.0857 | 17.92 |
| 10 | 10247 | 10.1037 | 0.5280 | 10.6317 | 32.67 |
| 11 | 2488 | 10.6643 | 0.9726 | 11.6370 | 41.45 |
| 12 | 2532 | 11.6784 | 6.6582 | 18.3366 | 7.09 |
| 13 | 30721 | 18.3437 | 1.1816 | 19.5253 | 38.62 |
| 14 | 49281 | 19.5640 | 2.8264 | 22.3904 | 2.88 |
| 15 | 49285 | 22.3932 | 1.1662 | **23.5594** | 0.00 |
| 16 | 3025 | **23.5594** (P1) | 3.5594 | 27.1189 | 0.00 |
| 17 | 3023 | 27.1189 | 0.9366 | 28.0555 | 0.00 |
| 18 | 56002 | 28.0555 | 5.7654 | 33.8209 | 0.00 |
| 19 | 3796 | 33.8209 | 0.4668 | **34.2877** (P2) | 27.62 |
| 20 | 3794 | 34.3153 | 7.1015 | 41.4168 | 0.00 |
| 21 | 3802 | 41.4168 | 3.7705 | 45.1873 | 0.00 |
| 22 | 3740 | 45.1873 | 1.0944 | 46.2817 | 0.00 |
| 23 | 3741 | 46.2817 | 7.4562 | 53.7379 | 0.00 |
| 24 | 47042 | **53.7379** (P3) | 4.1218 | 57.8598 | 0.00 |
| 25 | 3756 | 57.8598 | 6.4013 | 64.2611 | 0.00 |
| 26 | 3757 | 64.2611 | 1.9692 | 66.2303 | 0.00 |
| 27 | 3758 | 66.2303 | 2.4652 | 68.6955 | 0.00 |
| 28 | 2876 | 68.6955 | 1.1535 | 69.8490 | 0.00 |
| 29 | 2819 | 69.8490 | 0.7174 | **70.5664** (P4) | — |

## 2. P1–P4: reproduced vs. Jonesy's sandbox reference vs. `routes.js`

| Point | Definition | Reproduced (km) | Jonesy sandbox (km) | `routes.js` (km) | Diff vs. sandbox | Diff vs. `routes.js` |
|---|---|---|---|---|---|---|
| P1 | entry of 3025 | 23.5594 | 23.5594 | 23.559 | +0.0000 | +0.0004 |
| P2 | exit of 3796 | 34.2877 | 34.2877 | 34.288 | −0.0000 | −0.0003 |
| P3 | entry of 47042 | 53.7379 | 53.7379 | 53.738 | +0.0000 | −0.0001 |
| P4 | exit of 2819 | 70.5664 | 70.5664 | 70.566 | −0.0000 | +0.0004 |

All four points reproduce **exactly** against Jonesy's independently-reported sandbox reference, and all four are within 0.0004 km of `routes.js`'s fixed figures — well inside the agreed ±0.01 km tolerance. Neither B1 stop condition triggers. **`routes.js`'s existing numbers are correct; this is not a product/geometry defect.**

## 3. What was wrong in the first version of this document (superseded, not deleted from history)

The first version of this document (written under `approved-prompt-v4.md`) reported P1/P3/P4 off by ≈0.037 km and P2 off by 0.0101 km, and reported this as an unresolved "obstacle" rather than a bug. Jonesy's result review (round 2) found the actual cause, in her own sandbox, independent of this file:

- **D1 — missing start gap:** that script never added the 37.39 m gap from Rauðavatn's own reference point (IDFERILL 1436's end) to piece 1477's own start — it began summing directly from piece 1477's own length, with no leading gap at all. Adding this one gap, once, accounts for almost the entire P1/P3/P4 shortfall.
- **D1 — P2 measured at the wrong point:** that script's printed "cumulative at piece 3796" already included the *following* 27.62 m gap to piece 3794 (its loop added a piece's own trailing gap before printing that piece's row), so what was reported as "P2" was actually `exit_km(3796) + gap(3796→3794)`, not `exit_km(3796)` itself. Separating entry/exit from the following gap (section 1 above) fixes this.

Both are corrected in sections 1–2 above. The claim in the first version that this was a genuine, unresolved reproducibility gap in `routes.js`'s fixed figures was **wrong** — it was an error in that version's own script, not evidence against the route data. `routes.js` was never changed and remains correct.

## 4. The 13-piece Vík control (reconciled, correctly described)

| Order | IDBUTUR | kept pieces (VEGNR=="1" & tier0) | Reproduced (km) | CSV `length_km_vegnr1_tier0` (km) | Diff (km) |
|---|---|---|---|---|---|
| 1 | 1410010037 | 1 | 2.5494 | 2.5500 | −0.0006 |
| 2 | 903010037 | 1 | 1.8926 | 1.8900 | +0.0026 |
| 3 | 253020037 | 2 | 12.2920 | 12.2900 | +0.0020 |
| 4 | 252090037 | 1 | 16.4999 | 16.5000 | −0.0001 |
| 5 | 902030037 | 5 | 12.6265 | 12.6300 | −0.0035 |
| 6 | 902040037 | 6 | 18.5124 | 18.5100 | +0.0024 |
| 7 | 901130037 | 5 | 17.6403 | 17.6400 | +0.0003 |
| 8 | 901230037 | 3 | 12.8080 | 12.8100 | −0.0020 |
| 9 | 901220037 | 3 | 21.9639 | 21.9600 | +0.0039 |
| 10 | 901210037 | 3 | 17.3771 | 17.3800 | −0.0029 |
| 11 | 901050037 | 3 | 28.0786 | 28.0800 | −0.0014 |
| 12 | 901040037 | 1 | 12.0595 | 12.0600 | −0.0005 |
| 13 | 801100037 | 2 | 1.3405 | 1.3400 | +0.0005 |

**Max |deviation| = 0.0039 km**, within the ±0.02 km tolerance — identical to the figure reported in `cc-report-implementation.md`.

**Correction to the first version's method description (D2):** that version described the exclusion rule for rows 6 and 8 as "a non-lettered `KAFLANR`" (a plain two-digit numeric sub-piece code). That heuristic happened to produce the right *result* here, but mischaracterized the actual rule: the three excluded pieces (`IDFERILL` 3592, 3710 for row 8; `IDFERILL` 20165 for row 6) belong to **`VEGNR` 261 and `VEGNR` 33 respectively — different road numbers entirely**, not an unlabelled branch of `VEGNR` 1. The correct, and now-used, filter is simply `VEGNR == "1"` (string) together with `NAKVAEMNIFERLIS == 0` — no `KAFLANR` pattern-matching is needed or used.

## 5. Reproducing command (offline, key-less, no network)

Run from the repo root with Python 3 (standard library only — no new dependency):

```bash
python3 - <<'PY'
import json, math, csv

R = 6371008.8
EXT_PATH = "docs/ai/tasks/ticket-485/samples/wfs-extension-4326.json"
VEST_PATH = "docs/ai/tasks/ticket-491/final-validation/samples/wfs-vesturland-4326.json"
NATIVE_PATH = "docs/ai/tasks/ticket-483/samples/wfs-vegnr1-all.json"
CHAIN4326_PATH = "docs/ai/tasks/ticket-483/samples/wfs-chain-4326.json"
CSV_PATH = "docs/ai/tasks/ticket-483/route-segments.csv"

FIRST11 = [1477, 1431, 42243, 49926, 9923, 9925, 9927, 10242, 2796, 10247, 2488]
REMAIN18 = [2532, 30721, 49281, 49285, 3025, 3023, 56002, 3796, 3794, 3802, 3740, 3741, 47042, 3756, 3757, 3758, 2876, 2819]
CHAIN29 = FIRST11 + REMAIN18
START_IDFERILL = 1436  # Rauðavatn reference, same as the existing Vík route's own start

def load_features(path):
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)["features"]

def tier0_index(features):
    return {f["properties"]["IDFERILL"]: f for f in features if f["properties"].get("NAKVAEMNIFERLIS") == 0}

def haversine_m(lon1, lat1, lon2, lat2):
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi, dlmb = math.radians(lat2 - lat1), math.radians(lon2 - lon1)
    a = math.sin(dphi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(dlmb/2)**2
    return 2 * R * math.asin(math.sqrt(a))

def linestring_length_m(coords):
    return sum(haversine_m(coords[i][0], coords[i][1], coords[i+1][0], coords[i+1][1]) for i in range(len(coords)-1))

def euclid_m(p1, p2):
    return math.hypot(p1[0]-p2[0], p1[1]-p2[1])

ext_t0, vest_t0 = tier0_index(load_features(EXT_PATH)), tier0_index(load_features(VEST_PATH))
native_t0 = tier0_index(load_features(NATIVE_PATH))
wgs = {fid: ext_t0[fid] for fid in FIRST11}
wgs.update({fid: vest_t0[fid] for fid in REMAIN18})

start_gap_m = euclid_m(native_t0[START_IDFERILL]["geometry"]["coordinates"][-1],
                        native_t0[CHAIN29[0]]["geometry"]["coordinates"][0])
print("start gap (m):", round(start_gap_m, 2))

cum = start_gap_m / 1000.0
by_fid = {}
for i, fid in enumerate(CHAIN29):
    coords = wgs[fid]["geometry"]["coordinates"]
    entry_km = cum
    length_km = linestring_length_m(coords) / 1000.0
    exit_km = entry_km + length_km
    print(f"{i+1:>2} {fid:>8} entry={entry_km:.4f} len={length_km:.4f} exit={exit_km:.4f}")
    by_fid[fid] = (entry_km, exit_km)
    if i < len(CHAIN29) - 1:
        nxt = CHAIN29[i+1]
        gap_m = euclid_m(native_t0[fid]["geometry"]["coordinates"][-1], native_t0[nxt]["geometry"]["coordinates"][0])
        cum = exit_km + gap_m / 1000.0
    else:
        cum = exit_km

print("P1 (entry of 3025):", round(by_fid[3025][0], 4))
print("P2 (exit of 3796):", round(by_fid[3796][1], 4))
print("P3 (entry of 47042):", round(by_fid[47042][0], 4))
print("P4 (exit of 2819):", round(by_fid[2819][1], 4))

chain13_t0 = [f for f in load_features(CHAIN4326_PATH)
              if f["properties"].get("NAKVAEMNIFERLIS") == 0 and f["properties"].get("VEGNR") == "1"]
by_idbutur = {}
for f in chain13_t0:
    by_idbutur.setdefault(f["properties"]["IDBUTUR"], []).append(f)

with open(CSV_PATH, encoding="utf-8-sig") as fh:
    rows = list(csv.DictReader(fh))

max_dev = 0.0
for r in rows:
    idb = int(r["idbutur"])
    mine_km = sum(linestring_length_m(f["geometry"]["coordinates"]) for f in by_idbutur.get(idb, [])) / 1000.0
    diff = mine_km - float(r["length_km_vegnr1_tier0"])
    max_dev = max(max_dev, abs(diff))
    print(r["order"], idb, "mine_km=", round(mine_km, 4), "diff_km=", round(diff, 4))
print("max |deviation| =", round(max_dev, 4), "km")
PY
```

Running this against the retained files above reproduces exactly the tables in sections 1, 2, and 4 — no network, no key, no new file added to the repo.

## Scope

This document and its computation are the entirety of V3/W1/W2. No other file was touched to produce it; `routes.js`'s fixed numbers are unchanged throughout. Production NOT_TESTED (not applicable to a docs-only deliverable).
