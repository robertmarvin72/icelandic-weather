// src/config/affiliateOffers.js
//
// Ticket #430 — single centralized source for the Northern Lights affiliate
// (Viator) offer: the exact outbound URL and the exact event constant
// strings quoted in the approved prompt. Keep the URL byte-for-byte: no
// shortener, no redirect, no PII, no added query parameters. Every consumer
// (AffiliateCta, its tests, the review packet) imports from here so the URL
// and constants exist in exactly one place.

// Byte-for-byte as specified in the issue/approved prompt. Do not alter.
export const VIATOR_NORTHERN_LIGHTS_URL =
  "https://www.viator.com/searchResults/all?text=Iceland+Tours%2C+northern+lights&pid=P00323211&mcid=42383&medium=link&campaign=Northern-lights";

export const AFFILIATE_PARTNER_VIATOR = "viator";
export const AFFILIATE_CAMPAIGN_NORTHERN_LIGHTS = "northern_lights";
export const AFFILIATE_DESTINATION_VIATOR_NORTHERN_LIGHTS_SEARCH = "viator_northern_lights_search";

// Placement is the only thing that differs between the two surfaces that
// mount NorthernLightsThreeNight. Keyed by the module's own `surface` prop.
export const AFFILIATE_PLACEMENT_BY_SURFACE = {
  landing: "northern_lights_forecast",
  homepage: "homepage_northern_lights",
};
