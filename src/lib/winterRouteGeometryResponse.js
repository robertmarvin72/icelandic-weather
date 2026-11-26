// src/lib/winterRouteGeometryResponse.js
//
// Ticket #502 — pure helpers interpreting a real /api/winter-route-geometry
// response (ticket #501) for the new "Velja staði" Frá/Til UI. No React, no
// fetch — the component owns the request lifecycle (abort/generation
// guard/draft-vs-applied, approved-prompt-v1.md P4); these functions only
// decide WHAT the already-resolved {httpStatus, payload} pair means and
// how to read its display-relevant fields, so that logic is independently
// testable against real response shapes without rendering anything.

export const WINTER_ROUTE_OUTCOME = {
  GEOMETRY_ONLY: "geometry_only",
  SAME_PLACE: "same_place",
  NO_ROUTE: "no_route",
  ERROR: "error",
  // Ticket #492, direct-flow, C2 -- a fixed-route-adapter result (a real
  // /api/winter-route response reused as-is), never produced by
  // classifyWinterRouteGeometryResponse() below (the geometry endpoint is
  // never called for these two pairs at all) -- set directly by the
  // caller. Listed here only because it's a sibling UI-facing outcome
  // value checked the same way (`view.outcome === ...`) as the others.
  FIXED_ROUTE: "fixed_route",
};

const KNOWN_PAYLOAD_STATUSES = new Set(["geometry_only", "same_place", "unsupported"]);

// P4(c)/(d): classify a resolved response into exactly one of four UI-facing
// outcomes. `applied` is the {from, to, option} the request was actually
// sent for (option may be null/undefined). Never trusts a 200 body without
// checking it actually answers THIS applied request.
export function classifyWinterRouteGeometryResponse({ httpStatus, payload, applied }) {
  if (typeof httpStatus !== "number" || payload == null || typeof payload !== "object") {
    return { outcome: WINTER_ROUTE_OUTCOME.ERROR };
  }

  // A 400 unknown_place_id for a pair drawn entirely from this UI's own
  // frozen 11-id list (flokalundur<->ring-pilot) is a legitimate "no route
  // in the route base yet" outcome, not a system error -- the UI never
  // sends an id outside that list, so every such 400 it can ever receive
  // is this case by construction.
  if (httpStatus === 400 && payload.error === "unknown_place_id") {
    return { outcome: WINTER_ROUTE_OUTCOME.NO_ROUTE };
  }
  if (httpStatus !== 200) {
    return { outcome: WINTER_ROUTE_OUTCOME.ERROR };
  }

  if (payload.from !== applied.from || payload.to !== applied.to) {
    return { outcome: WINTER_ROUTE_OUTCOME.ERROR };
  }
  if (typeof payload.schemaVersion !== "number" || typeof payload.tier !== "number") {
    return { outcome: WINTER_ROUTE_OUTCOME.ERROR };
  }
  if (!KNOWN_PAYLOAD_STATUSES.has(payload.status)) {
    return { outcome: WINTER_ROUTE_OUTCOME.ERROR };
  }
  // The API silently ignores `option` on a pair without options -- if the
  // UI sent one, the response's own selectedOption must echo it back, or
  // this is treated as an invalid response (never "that option got picked").
  if (applied.option != null && payload.selectedOption !== applied.option) {
    return { outcome: WINTER_ROUTE_OUTCOME.ERROR };
  }

  if (payload.status === "unsupported") return { outcome: WINTER_ROUTE_OUTCOME.NO_ROUTE };
  if (payload.status === "same_place") return { outcome: WINTER_ROUTE_OUTCOME.SAME_PLACE, payload };
  return { outcome: WINTER_ROUTE_OUTCOME.GEOMETRY_ONLY, payload };
}

// P6(a): selectable options only exist when the real response actually has
// more than one. Today that is only reykjavik-raudavatn<->selfoss/hella.
export function winterRouteGeometryOptions(payload) {
  return Array.isArray(payload?.options) ? payload.options : [];
}

export function winterRouteHasSelectableOptions(payload) {
  return winterRouteGeometryOptions(payload).length > 1;
}

// P5(a): `via` comes from the selected option's own `via` when options
// exist, otherwise the top-level `via` -- either may legitimately be
// absent (ring pairs without options carry no top-level `via` at all).
export function winterRouteDisplayVia(payload) {
  const options = winterRouteGeometryOptions(payload);
  const selected = options.find((o) => o.id === payload?.selectedOption);
  if (selected && Array.isArray(selected.via)) return selected.via;
  return Array.isArray(payload?.via) ? payload.via : [];
}

// P5(d): shown whenever a real estimated connector is actually present,
// regardless of surface (Westfjords -4/-5 or ring-pilot -1/-2/-3) -- the
// key itself may be absent, which counts as 0, never as "estimated".
export function winterRouteShowsEstimatedConnectorNote(payload) {
  return (payload?.estimatedConnectorLengthM ?? 0) > 0;
}

// P5(e): read generically from accessApproach[<id>], never hardcoded to
// "talknafjordur" -- works the same for any place id on any surface that
// happens to carry this flag.
export function winterRouteAccessPointShortFlag(payload, placeId) {
  return payload?.accessApproach?.[placeId]?.routeEndsShortOfOwnerCoordinate === true;
}

// P6(b): i18n key for an option's label, read by option.id, never the raw
// English options[].label from the API.
export function winterRouteOptionLabelKey(optionId) {
  if (optionId === "south") return "winterRouteOptionSouth";
  if (optionId === "north") return "winterRouteOptionNorth";
  return "winterRouteOptionGeneric";
}
