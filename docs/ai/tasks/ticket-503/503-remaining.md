# #503 — remaining (not done in this round, not an issue/GitHub action)

This round delivered exactly one bounded weather/road binding:
Búðardalur↔Hólmavík um Þröskulda, both directions, 4 forecast points, 7
road sections. #503 as a whole stays open. Short, honest list of what is
explicitly left — not implemented here, no new scope opened by this list:

- **Extend point selection/road binding to the remaining 27 of 28
  geometry pairs** (ticket #502's own 15 Westfjords + 10 ring-pilot +
  3 junction pairs beyond this round's own B↔H). Each pair needs its own
  reviewed point registry (same P2 rigor: real vertex binding, offline
  WGS84, independent anchor where one exists) and its own IdButur/edge-
  segment review (same P3 rigor) — not a mechanical copy of this round's
  own numbers.
- **Options (south/north) coverage.** The ring-pilot `reykjavik-raudavatn
  ↔selfoss/hella` pairs have real selectable options; this round's own
  B↔H pair has none (Westfjords routes never do). A future round needs
  to decide the data-binding contract for an *option-aware* pair
  (e.g. does `geometryId` alone disambiguate, or does the data endpoint
  also need `option`?) before extending to those pairs.
- **Unknown/partial notice-feed coverage beyond the 7 IdButur reviewed
  this round.** This round confirmed real coverage for exactly 7
  IdButur; whether every OTHER retained IdButur on the Westfjords/ring
  network has equally reliable segment/point-feed coverage is unverified
  and not assumed.
- **The ~1,236 km Ring Road (north) option's own call-volume/point-count
  impact.** Explicitly out of this round's own P5 call-measurement
  (approved prompt: "ekki greitt þessari kallamælingu"). A future round
  needs its own point-count/chunking/cache-TTL review before binding
  weather/road data to that option specifically — a single point every
  few km would multiply both road-IdButur and forecast-batch counts well
  beyond this round's own 4-point/7-section scope.
- **Denser future point selection vs. the current "4 points, one gap of
  ~48 km" shape.** This round's own nearest-point convention (point ids
  tied to specific real vertices, not interpolated) does not by itself
  decide how a future, denser point set would be chosen or reviewed.
- **Sharing the national Vegagerðin feed fetch across other legacy
  routeIds.** This round's own cache bucket (`winter-route-data:
  budardalur-holmavik`) is deliberately its own, separate from
  `winter-route.js`'s own Vík/Borgarnes buckets — no shared-fetch
  optimization across the legacy and new endpoints was attempted or is
  assumed safe without its own review.
- **Vercel function-count headroom.** This round's own new endpoint moved
  the `api/**` handler count from 16 to 17; whether that comfortably fits
  the owner's actual plan is unconfirmed (CC can only see this repo's own
  staged files) — worth a quick owner-side check before further
  per-pair endpoints are added one at a time.

None of the above is started here. No new GitHub issue/comment was
created or opened by this document.
