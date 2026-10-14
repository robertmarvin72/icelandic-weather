// Ticket #430 — F3: equivalent controlled GA validation. This exercises the
// REAL src/lib/analytics.js (not a call-site mock of trackEvent), with
// react-ga4 mocked only at the package boundary. VITE_GA_MEASUREMENT_ID is
// stubbed BEFORE vi.resetModules() + a dynamic import, because analytics.js
// reads the id once at module load (`const gaId = import.meta.env...`) — a
// plain re-import without resetModules would reuse the already-cached
// module and its already-decided gaId. This proves event names/payload/
// timing/dedup through the real abstraction; it is NOT live GA4 ingestion.
import { describe, it, expect, vi, afterEach } from "vitest";

vi.mock("react-ga4", () => ({
  default: { initialize: vi.fn(), send: vi.fn(), event: vi.fn() },
}));

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
  // The react-ga4 mock factory runs once and its vi.fn()s are cached
  // independently of resetModules — clear their call history explicitly.
  vi.clearAllMocks();
});

async function loadWithGaId(id) {
  vi.stubEnv("VITE_GA_MEASUREMENT_ID", id);
  vi.resetModules();
  const { trackEvent } = await import("./analytics");
  const ReactGA = (await import("react-ga4")).default;
  return { trackEvent, ReactGA };
}

describe("analytics.js (real module) — affiliate events through react-ga4 (F3 equivalent GA validation)", () => {
  it("with a GA id: affiliate_offer_viewed reaches ReactGA.event with the exact name and metadata, exactly once", async () => {
    const { trackEvent, ReactGA } = await loadWithGaId("G-TEST430");

    trackEvent("affiliate_offer_viewed", {
      partner: "viator",
      campaign: "northern_lights",
      placement: "homepage_northern_lights",
      business_model_experiment: "northern_lights_free_v1",
      forecast_verdict: "good",
      selected_night: "2026-09-25",
    });

    expect(ReactGA.event).toHaveBeenCalledTimes(1);
    expect(ReactGA.event).toHaveBeenCalledWith("affiliate_offer_viewed", {
      partner: "viator",
      campaign: "northern_lights",
      placement: "homepage_northern_lights",
      business_model_experiment: "northern_lights_free_v1",
      forecast_verdict: "good",
      selected_night: "2026-09-25",
    });
  });

  it("with a GA id: affiliate_clicked reaches ReactGA.event with destination present, synchronously (no await needed)", async () => {
    const { trackEvent, ReactGA } = await loadWithGaId("G-TEST430");

    trackEvent("affiliate_clicked", {
      partner: "viator",
      campaign: "northern_lights",
      placement: "northern_lights_forecast",
      destination: "viator_northern_lights_search",
      business_model_experiment: "northern_lights_free_v1",
    });

    // Synchronous: the call already landed before this line runs — no await.
    expect(ReactGA.event).toHaveBeenCalledTimes(1);
    const [name, data] = ReactGA.event.mock.calls[0];
    expect(name).toBe("affiliate_clicked");
    expect(data.destination).toBe("viator_northern_lights_search");
  });

  it("repeated calls are not deduped by analytics.js itself — dedup is the holder's job, not this transport", async () => {
    const { trackEvent, ReactGA } = await loadWithGaId("G-TEST430");
    trackEvent("affiliate_clicked", { partner: "viator" });
    trackEvent("affiliate_clicked", { partner: "viator" });
    expect(ReactGA.event).toHaveBeenCalledTimes(2);
  });

  it("no GA id configured: trackEvent never calls ReactGA.event for an affiliate event", async () => {
    const { trackEvent, ReactGA } = await loadWithGaId("");
    trackEvent("affiliate_offer_viewed", { partner: "viator" });
    expect(ReactGA.event).not.toHaveBeenCalled();
  });

  it("is equivalent controlled validation, not live ingestion: asserts only the mocked SDK call, never a real network request", async () => {
    const fetchSpy = vi.spyOn(global, "fetch");
    const { trackEvent } = await loadWithGaId("G-TEST430");
    trackEvent("affiliate_clicked", { partner: "viator" });
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });
});
