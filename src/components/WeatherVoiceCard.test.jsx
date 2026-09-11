// WeatherVoiceCard.jsx — pure renderer for the standalone Weather Voice
// card (below the verdict card, above Northern Lights — see App.jsx).
// Never interprets weather, selects text, or touches storage — only
// renders an already-resolved result/action and reports visibility.
import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import WeatherVoiceCard from "./WeatherVoiceCard";

const ALL_TWELVE_MOODS = [
  "happy",
  "excellent",
  "neutral",
  "suspicious",
  "nervous",
  "struggling",
  "sad",
  "freezing",
  "unimpressed",
  "wrecked",
  "amazed",
  "sleeping",
];

const t = (k) => (k === "weatherVoiceLabel" ? "TJALDUR SEGIR" : k);

function activeResult(overrides = {}) {
  return {
    show: true,
    condition: "good",
    mood: "happy",
    severity: 0,
    comment: { id: "good_01", text: "Þetta má alveg." },
    ctaType: null,
    ...overrides,
  };
}

class FakeIntersectionObserver {
  constructor(callback) {
    this.callback = callback;
    FakeIntersectionObserver.instances.push(this);
  }
  observe() {}
  disconnect() {
    this.disconnected = true;
  }
  trigger(entries) {
    this.callback(entries);
  }
}
FakeIntersectionObserver.instances = [];

describe("WeatherVoiceCard — rendering", () => {
  beforeEach(() => {
    FakeIntersectionObserver.instances = [];
    vi.stubGlobal("IntersectionObserver", FakeIntersectionObserver);
  });
  afterEach(() => vi.unstubAllGlobals());

  it("renders the eyebrow label", () => {
    render(<WeatherVoiceCard result={activeResult()} surface="homepage_decision" t={t} />);
    expect(screen.getByText("TJALDUR SEGIR")).toBeInTheDocument();
  });

  it("renders the exact selected comment text, quoted", () => {
    render(<WeatherVoiceCard result={activeResult({ comment: { id: "cold_01", text: "Lopapeysan hafði rétt fyrir sér." } })} surface="homepage_decision" t={t} />);
    expect(screen.getByText("„Lopapeysan hafði rétt fyrir sér.“")).toBeInTheDocument();
  });

  it("the comment is the dominant, largest text in the card — visually primary over the label and supporting line", () => {
    render(<WeatherVoiceCard result={activeResult()} surface="homepage_decision" t={t} supportingText="Context line." />);
    const comment = screen.getByText("„Þetta má alveg.“");
    expect(comment.className).toMatch(/text-\[19px\]/);
    expect(comment.className).toMatch(/font-semibold/);
    const label = screen.getByText("TJALDUR SEGIR");
    expect(label.className).toMatch(/text-\[11px\]/); // small, secondary
    const supporting = screen.getByText("Context line.");
    expect(supporting.className).toMatch(/text-sm/); // smaller than the comment
  });

  it("all twelve mood asset paths resolve to a real image with the correct src", () => {
    for (const mood of ALL_TWELVE_MOODS) {
      const { unmount, container } = render(<WeatherVoiceCard result={activeResult({ mood })} surface="homepage_decision" t={t} />);
      const img = container.querySelector("img");
      expect(img).toBeTruthy();
      expect(img.getAttribute("src")).toBe(`/tjaldur/${mood}.png`);
      unmount();
    }
  });

  it("the wrecked mood renders exactly /tjaldur/wrecked.png", () => {
    const { container } = render(<WeatherVoiceCard result={activeResult({ mood: "wrecked", condition: "extreme_wind", severity: 3 })} surface="homepage_decision" t={t} />);
    expect(container.querySelector("img").getAttribute("src")).toBe("/tjaldur/wrecked.png");
  });

  it("the image is decorative: empty alt and aria-hidden", () => {
    const { container } = render(<WeatherVoiceCard result={activeResult()} surface="homepage_decision" t={t} />);
    const img = container.querySelector("img");
    expect(img.getAttribute("alt")).toBe("");
    expect(img.getAttribute("aria-hidden")).toBe("true");
  });

  it("the mascot is meaningfully larger on desktop (md breakpoint) than the base mobile size, and desktop lands in the ~90-110px target", () => {
    const { container } = render(<WeatherVoiceCard result={activeResult()} surface="homepage_decision" t={t} />);
    const img = container.querySelector("img");
    // Base (mobile) size and a larger md: size — both present as responsive classes.
    expect(img.className).toMatch(/h-20 w-20/);
    expect(img.className).toMatch(/md:h-\[100px\] md:w-\[100px\]/);
  });

  it("show:false renders no DOM at all — no wrapper, no margin, no space", () => {
    const { container } = render(<WeatherVoiceCard result={{ show: false }} surface="homepage_decision" t={t} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("an unknown/unsupported mood renders nothing rather than a guessed mascot", () => {
    const { container } = render(<WeatherVoiceCard result={activeResult({ mood: "totally_made_up" })} surface="homepage_decision" t={t} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("a null/undefined result renders nothing", () => {
    const { container: c1 } = render(<WeatherVoiceCard result={null} surface="homepage_decision" t={t} />);
    expect(c1).toBeEmptyDOMElement();
    const { container: c2 } = render(<WeatherVoiceCard result={undefined} surface="homepage_decision" t={t} />);
    expect(c2).toBeEmptyDOMElement();
  });

  it("an optional supporting sentence renders only when supplied", () => {
    const { container: withoutIt } = render(<WeatherVoiceCard result={activeResult()} surface="homepage_decision" t={t} />);
    expect(withoutIt.textContent).not.toContain("extra context");

    render(<WeatherVoiceCard result={activeResult()} surface="homepage_decision" t={t} supportingText="Some extra context sentence." />);
    expect(screen.getByText("Some extra context sentence.")).toBeInTheDocument();
  });

  it("null action renders no CTA container/button at all", () => {
    const { container } = render(<WeatherVoiceCard result={activeResult()} surface="homepage_decision" t={t} action={null} />);
    expect(container.querySelector("button")).toBeNull();
  });

  it("a resolved action renders a real, keyboard-operable button with the exact label, calling onClick", () => {
    const onClick = vi.fn();
    render(<WeatherVoiceCard result={activeResult()} surface="homepage_decision" t={t} action={{ label: "Compare conditions", onClick }} />);
    const button = screen.getByRole("button", { name: "Compare conditions" });
    expect(button.tagName).toBe("BUTTON");
    expect(button.getAttribute("type")).toBe("button");
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});

describe("WeatherVoiceCard — visibility-based exposure signal", () => {
  beforeEach(() => {
    FakeIntersectionObserver.instances = [];
    vi.stubGlobal("IntersectionObserver", FakeIntersectionObserver);
    Object.defineProperty(document, "visibilityState", { configurable: true, value: "visible" });
  });
  afterEach(() => vi.unstubAllGlobals());

  it("calls onVisible(episodeKey) when the node intersects at/above threshold on a visible document", () => {
    const onVisible = vi.fn();
    render(<WeatherVoiceCard result={activeResult()} surface="homepage_decision" episodeKey="ep-1" t={t} onVisible={onVisible} />);
    FakeIntersectionObserver.instances[0].trigger([{ isIntersecting: true, intersectionRatio: 1 }]);
    expect(onVisible).toHaveBeenCalledTimes(1);
    expect(onVisible).toHaveBeenCalledWith("ep-1");
  });

  it("falls back to the comment id as the watched episode identity when no explicit episodeKey prop is supplied", () => {
    const onVisible = vi.fn();
    render(<WeatherVoiceCard result={activeResult({ comment: { id: "cold_01", text: "x" } })} surface="homepage_decision" t={t} onVisible={onVisible} />);
    FakeIntersectionObserver.instances[0].trigger([{ isIntersecting: true, intersectionRatio: 1 }]);
    expect(onVisible).toHaveBeenCalledWith("cold_01");
  });

  it("does not call onVisible when not intersecting", () => {
    const onVisible = vi.fn();
    render(<WeatherVoiceCard result={activeResult()} surface="homepage_decision" episodeKey="ep-1" t={t} onVisible={onVisible} />);
    FakeIntersectionObserver.instances[0].trigger([{ isIntersecting: false, intersectionRatio: 0 }]);
    expect(onVisible).not.toHaveBeenCalled();
  });

  it("an entry below the 0.5 intersection ratio threshold is not eligible, even with isIntersecting:true", () => {
    const onVisible = vi.fn();
    render(<WeatherVoiceCard result={activeResult()} surface="homepage_decision" episodeKey="ep-1" t={t} onVisible={onVisible} />);
    FakeIntersectionObserver.instances[0].trigger([{ isIntersecting: true, intersectionRatio: 0.2 }]);
    expect(onVisible).not.toHaveBeenCalled();
  });

  it("an entry with isIntersecting:true but no intersectionRatio field at all is not eligible (treated as 0, not assumed to meet threshold)", () => {
    const onVisible = vi.fn();
    render(<WeatherVoiceCard result={activeResult()} surface="homepage_decision" episodeKey="ep-1" t={t} onVisible={onVisible} />);
    FakeIntersectionObserver.instances[0].trigger([{ isIntersecting: true }]);
    expect(onVisible).not.toHaveBeenCalled();
  });

  it("does not call onVisible while the document is hidden, even at/above threshold", () => {
    Object.defineProperty(document, "visibilityState", { configurable: true, value: "hidden" });
    const onVisible = vi.fn();
    render(<WeatherVoiceCard result={activeResult()} surface="homepage_decision" episodeKey="ep-1" t={t} onVisible={onVisible} />);
    FakeIntersectionObserver.instances[0].trigger([{ isIntersecting: true, intersectionRatio: 1 }]);
    expect(onVisible).not.toHaveBeenCalled();
  });

  it("a hidden-then-visible transition with unchanged eligible geometry records once via visibilitychange, with no new intersection event", () => {
    Object.defineProperty(document, "visibilityState", { configurable: true, value: "hidden" });
    const onVisible = vi.fn();
    render(<WeatherVoiceCard result={activeResult()} surface="homepage_decision" episodeKey="ep-1" t={t} onVisible={onVisible} />);
    FakeIntersectionObserver.instances[0].trigger([{ isIntersecting: true, intersectionRatio: 1 }]);
    expect(onVisible).not.toHaveBeenCalled(); // hidden — not eligible yet

    Object.defineProperty(document, "visibilityState", { configurable: true, value: "visible" });
    document.dispatchEvent(new Event("visibilitychange"));
    expect(onVisible).toHaveBeenCalledTimes(1);
    expect(onVisible).toHaveBeenCalledWith("ep-1");
  });

  it("visibilitychange while never having had an eligible intersection does not fire", () => {
    const onVisible = vi.fn();
    render(<WeatherVoiceCard result={activeResult()} surface="homepage_decision" episodeKey="ep-1" t={t} onVisible={onVisible} />);
    document.dispatchEvent(new Event("visibilitychange"));
    expect(onVisible).not.toHaveBeenCalled();
  });

  it("fires at most once per mount even with repeated eligible intersections and visibilitychange events", () => {
    const onVisible = vi.fn();
    render(<WeatherVoiceCard result={activeResult()} surface="homepage_decision" episodeKey="ep-1" t={t} onVisible={onVisible} />);
    const observer = FakeIntersectionObserver.instances[0];
    observer.trigger([{ isIntersecting: true, intersectionRatio: 1 }]);
    observer.trigger([{ isIntersecting: true, intersectionRatio: 1 }]);
    document.dispatchEvent(new Event("visibilitychange"));
    expect(onVisible).toHaveBeenCalledTimes(1);
  });

  it("does not observe anything for show:false — no DOM node exists to observe", () => {
    const onVisible = vi.fn();
    render(<WeatherVoiceCard result={{ show: false }} surface="homepage_decision" t={t} onVisible={onVisible} />);
    expect(FakeIntersectionObserver.instances).toHaveLength(0);
  });

  it("disconnects the observer and removes the visibilitychange listener on unmount", () => {
    const removeSpy = vi.spyOn(document, "removeEventListener");
    const { unmount } = render(<WeatherVoiceCard result={activeResult()} surface="homepage_decision" episodeKey="ep-1" t={t} onVisible={vi.fn()} />);
    const observer = FakeIntersectionObserver.instances[0];
    unmount();
    expect(observer.disconnected).toBe(true);
    expect(removeSpy).toHaveBeenCalledWith("visibilitychange", expect.any(Function));
    removeSpy.mockRestore();
  });

  // Ripley Revision 2 REVISE — preserved repro (also kept verbatim under
  // outputs/ticket-408-weather-voice-evidence/WeatherVoice.review-repro.test.jsx):
  // a queued callback from an observer that has already been torn down by
  // a rerender must not fire, because disconnect() alone does not retract
  // an already-queued callback in every environment — the effect's own
  // local `cancelled` flag (checked first) is what actually prevents it.
  it("a callback captured from a torn-down observer (after replacement) does not fire, even called directly post-cleanup", () => {
    const onVisible = vi.fn();
    const { rerender } = render(<WeatherVoiceCard result={activeResult({ comment: { id: "good_01", text: "a" } })} surface="homepage_decision" episodeKey="ep-1" t={t} onVisible={onVisible} />);
    const oldObserver = FakeIntersectionObserver.instances[0];

    rerender(<WeatherVoiceCard result={activeResult({ comment: { id: "good_02", text: "b" } })} surface="homepage_decision" episodeKey="ep-2" t={t} onVisible={onVisible} />);

    oldObserver.trigger([{ isIntersecting: true, intersectionRatio: 1 }]);
    expect(onVisible).not.toHaveBeenCalled();
  });
});
