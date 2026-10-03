// Ticket 432 (#432) — every share entrypoint refuses a non-sarcastic
// snapshot on its own, not only because the snapshot builder never produced
// one. Each test uses an otherwise-valid snapshot that differs only in tone.
import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { renderWeatherVoiceShareImage } from "../lib/weatherVoiceShareImage";
import { resolveWeatherVoiceFacebookShare } from "../lib/weatherVoiceFacebookShare";
import WeatherVoiceShareDialog from "../components/WeatherVoiceShareDialog";

vi.mock("../lib/analytics", () => ({ trackEvent: vi.fn() }));

const t = (k) => k;

function snapshot(overrides = {}) {
  return {
    voiceId: "good_01",
    text: "Þetta má alveg.",
    language: "is",
    mood: "happy",
    condition: "good",
    voiceLevel: "sarcastic",
    severity: 0,
    siteName: "Þingvellir",
    date: "2026-09-08",
    tmax: 13,
    code: 3,
    episodeKey: "homepage_decision|site-a|2026-09-08|is|good|happy|0",
    ...overrides,
  };
}

const CAUTIOUS = snapshot({ voiceId: "safety_heavy_rain", condition: "heavy_rain", mood: "sad", voiceLevel: "cautious", severity: 2 });
const SERIOUS = snapshot({ voiceId: "safety_extreme_wind", condition: "extreme_wind", mood: "wrecked", voiceLevel: "serious", severity: 3 });
const MISSING_TONE = snapshot({ voiceLevel: undefined });
const MISMATCHED_TONE = snapshot({ condition: "extreme_wind" });

describe("image renderer refuses non-sarcastic snapshots before touching assets or canvas (#432)", () => {
  it.each([["cautious", CAUTIOUS], ["serious", SERIOUS], ["missing tone", MISSING_TONE], ["mismatched tone", MISMATCHED_TONE]])(
    "%s snapshot is rejected",
    async (_label, bad) => {
      await expect(renderWeatherVoiceShareImage(bad, { t, moodAssetPath: "/x.png", brandingAssetPath: "/y.png" })).rejects.toThrow(/not shareable/);
    }
  );
});

describe("Facebook resolver refuses non-sarcastic snapshots before the manifest lookup (#432)", () => {
  it.each([["cautious", CAUTIOUS], ["serious", SERIOUS], ["missing tone", MISSING_TONE], ["mismatched tone", MISMATCHED_TONE]])(
    "%s snapshot is not_shareable even with a real manifest id",
    (_label, bad) => {
      expect(resolveWeatherVoiceFacebookShare(bad)).toEqual({ available: false, reason: "not_shareable" });
    }
  );

  it("a sarcastic snapshot with a real manifest id still resolves", () => {
    expect(resolveWeatherVoiceFacebookShare(snapshot()).available).toBe(true);
  });
});

describe("share dialog renders nothing for a non-sarcastic snapshot (#432)", () => {
  it.each([["cautious", CAUTIOUS], ["serious", SERIOUS]])("%s snapshot renders no dialog and no share controls", (_label, bad) => {
    const { container } = render(<WeatherVoiceShareDialog snapshot={bad} lang="is" t={t} onClose={() => {}} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("a sarcastic snapshot still renders the dialog", () => {
    const { getByRole } = render(<WeatherVoiceShareDialog snapshot={snapshot()} lang="is" t={t} onClose={() => {}} />);
    expect(getByRole("dialog")).toBeInTheDocument();
  });
});
