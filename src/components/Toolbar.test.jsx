// Ticket 411 (#411) — homepage hero seasonal variants wired into Toolbar.jsx
import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import Toolbar from "./Toolbar";
import { trackEvent } from "../lib/analytics";
import { translations } from "../i18n/translations";
import { HOMEPAGE_HERO_VARIANTS } from "../config/homepageHero";

vi.mock("../lib/analytics", () => ({ trackEvent: vi.fn() }));
vi.mock("./InstallPWA", () => ({ default: () => null }));
vi.mock("./CampsitePicker", () => ({ default: () => null }));
vi.mock("./DevProToggle", () => ({ default: () => null }));

function baseProps(overrides = {}) {
  return {
    t: (k) => k,
    lang: "is",
    onToggleLanguage: vi.fn(),
    siteList: [],
    siteId: null,
    onSelectSite: vi.fn(),
    onUseMyLocation: vi.fn(),
    units: "metric",
    onToggleUnits: vi.fn(),
    darkMode: false,
    onToggleTheme: vi.fn(),
    devPro: false,
    onToggleDevPro: vi.fn(),
    ...overrides,
  };
}

function realTProps(lang, overrides = {}) {
  const dict = translations[lang];
  return baseProps({ t: (k) => dict[k] ?? k, lang, ...overrides });
}

afterEach(() => {
  vi.useRealTimers();
});

describe("Toolbar — hero copy across all three variants x both languages (real translations dictionary)", () => {
  beforeEach(() => vi.clearAllMocks());

  it.each([
    ["2026-01-15T12:00:00.000Z", HOMEPAGE_HERO_VARIANTS.WINTER_WEATHER_AURORA, "heroWinterAuroraTitle", "heroWinterAuroraSubtitle", "heroWinterCta"],
    ["2026-04-15T12:00:00.000Z", HOMEPAGE_HERO_VARIANTS.WINTER_WEATHER, "heroAprilTitle", "heroAprilSubtitle", "heroWinterCta"],
    ["2026-06-15T12:00:00.000Z", HOMEPAGE_HERO_VARIANTS.SUMMER_CAMPING, "heroStayMoveTitle", "heroStayMoveSubtitle", "heroCta"],
  ])("%s -> %s: exact IS title/subtitle/CTA from the real dictionary", (iso, _variant, titleKey, subtitleKey, ctaKey) => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(iso));
    const dict = translations.is;
    render(<Toolbar {...realTProps("is")} />);

    expect(screen.getByText(dict[titleKey])).toBeInTheDocument();
    expect(screen.getByText(dict[subtitleKey])).toBeInTheDocument();
    expect(screen.getByText(`${dict[ctaKey]} →`)).toBeInTheDocument();

    // No raw untranslated key ever leaks onto the page.
    expect(screen.queryByText(titleKey)).toBeNull();
    expect(screen.queryByText(subtitleKey)).toBeNull();
    expect(screen.queryByText(ctaKey)).toBeNull();
  });

  it.each([
    ["2026-01-15T12:00:00.000Z", "heroWinterAuroraTitle", "heroWinterAuroraSubtitle", "heroWinterCta"],
    ["2026-04-15T12:00:00.000Z", "heroAprilTitle", "heroAprilSubtitle", "heroWinterCta"],
    ["2026-06-15T12:00:00.000Z", "heroStayMoveTitle", "heroStayMoveSubtitle", "heroCta"],
  ])("%s: exact EN title/subtitle/CTA from the real dictionary", (iso, titleKey, subtitleKey, ctaKey) => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(iso));
    const dict = translations.en;
    render(<Toolbar {...realTProps("en")} />);

    expect(screen.getByText(dict[titleKey])).toBeInTheDocument();
    expect(screen.getByText(dict[subtitleKey])).toBeInTheDocument();
    expect(screen.getByText(`${dict[ctaKey]} →`)).toBeInTheDocument();
  });

  it("May-August summer copy is byte-identical to the pre-existing heroStayMoveTitle/Subtitle/heroCta keys (unchanged)", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-04T12:00:00.000Z"));
    render(<Toolbar {...realTProps("is")} />);
    const dict = translations.is;
    expect(dict.heroStayMoveTitle).toBe("Finndu rólegra tjaldsvæði áður en veðrið versnar.");
    expect(dict.heroStayMoveSubtitle).toBe(
      "Eltum Veðrið ber saman tjaldsvæði í nágrenninu og sýnir hvar líklegt er að vera rólegra, þurrara eða hlýrra næstu daga."
    );
    expect(dict.heroCta).toBe("Finna betri stað");
    expect(screen.getByText(dict.heroStayMoveTitle)).toBeInTheDocument();
  });

  it("both winter variants (Sept-March and April) share the exact same CTA label text", () => {
    const dict = translations.is;

    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-01T12:00:00.000Z"));
    const { unmount } = render(<Toolbar {...realTProps("is")} />);
    expect(screen.getByText(`${dict.heroWinterCta} →`)).toBeInTheDocument();
    unmount();

    vi.setSystemTime(new Date("2026-04-10T12:00:00.000Z"));
    render(<Toolbar {...realTProps("is")} />);
    expect(screen.getByText(`${dict.heroWinterCta} →`)).toBeInTheDocument();
  });
});

function clickCta() {
  fireEvent.click(screen.getByRole("button", { name: /→/ }));
}

describe("Toolbar — homepage_hero_cta_click / homepage_primary_cta_clicked analytics", () => {
  beforeEach(() => vi.clearAllMocks());

  it("a single click fires exactly one unchanged homepage_hero_cta_click and one homepage_primary_cta_clicked with the expected metadata", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-15T12:00:00.000Z"));
    render(<Toolbar {...realTProps("is")} />);
    clickCta();

    expect(trackEvent).toHaveBeenCalledTimes(2);
    expect(trackEvent).toHaveBeenNthCalledWith(1, "homepage_hero_cta_click");
    expect(trackEvent).toHaveBeenNthCalledWith(2, "homepage_primary_cta_clicked", {
      hero_variant: HOMEPAGE_HERO_VARIANTS.WINTER_WEATHER_AURORA,
      cta_label: translations.is.heroWinterCta,
      language: "is",
    });
  });

  it("April emits winter_weather, distinct from winter_weather_aurora, despite the identical CTA label", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-20T12:00:00.000Z"));
    render(<Toolbar {...realTProps("is")} />);
    clickCta();

    expect(trackEvent).toHaveBeenCalledWith(
      "homepage_primary_cta_clicked",
      expect.objectContaining({ hero_variant: HOMEPAGE_HERO_VARIANTS.WINTER_WEATHER, cta_label: translations.is.heroWinterCta })
    );
  });

  it("summer_camping emits its own variant id and the unchanged heroCta label", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-01T12:00:00.000Z"));
    render(<Toolbar {...realTProps("is")} />);
    clickCta();

    expect(trackEvent).toHaveBeenCalledWith(
      "homepage_primary_cta_clicked",
      expect.objectContaining({ hero_variant: HOMEPAGE_HERO_VARIANTS.SUMMER_CAMPING, cta_label: translations.is.heroCta })
    );
  });

  it("no event fires on mount", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-15T12:00:00.000Z"));
    render(<Toolbar {...realTProps("is")} />);
    expect(trackEvent).not.toHaveBeenCalled();
  });

  it("no event fires on a plain rerender with unchanged props", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-15T12:00:00.000Z"));
    const props = realTProps("is");
    const { rerender } = render(<Toolbar {...props} />);
    rerender(<Toolbar {...props} />);
    expect(trackEvent).not.toHaveBeenCalled();
  });

  it("no event fires on theme/language/units toggles or other unrelated controls", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-15T12:00:00.000Z"));
    render(<Toolbar {...realTProps("is")} />);
    fireEvent.click(screen.getByText("⚙", { exact: false }));
    fireEvent.click(screen.getByLabelText("Switch to imperial units"));
    fireEvent.click(screen.getByTitle("Toggle dark mode"));
    fireEvent.click(screen.getByText(/🌐/));
    fireEvent.click(screen.getByLabelText("Use my current location"));
    expect(trackEvent).not.toHaveBeenCalled();
  });

  it("repeated intentional clicks each count once per event, with matching metadata each time", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-01T12:00:00.000Z"));
    render(<Toolbar {...realTProps("is")} />);
    clickCta();
    clickCta();

    const heroClicks = trackEvent.mock.calls.filter(([name]) => name === "homepage_hero_cta_click");
    const primaryClicks = trackEvent.mock.calls.filter(([name]) => name === "homepage_primary_cta_clicked");
    expect(heroClicks).toHaveLength(2);
    expect(primaryClicks).toHaveLength(2);
    expect(primaryClicks[0][1]).toEqual(primaryClicks[1][1]);
  });

  it("a click after switching language reflects the new language and the newly-translated label", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-15T12:00:00.000Z"));
    const { rerender } = render(<Toolbar {...realTProps("is")} />);
    rerender(<Toolbar {...realTProps("en")} />);
    clickCta();

    expect(trackEvent).toHaveBeenCalledWith(
      "homepage_primary_cta_clicked",
      expect.objectContaining({ language: "en", cta_label: translations.en.heroWinterCta })
    );
  });

  it.each([
    ["2026-01-15T12:00:00.000Z", HOMEPAGE_HERO_VARIANTS.WINTER_WEATHER_AURORA],
    ["2026-04-15T12:00:00.000Z", HOMEPAGE_HERO_VARIANTS.WINTER_WEATHER],
    ["2026-06-15T12:00:00.000Z", HOMEPAGE_HERO_VARIANTS.SUMMER_CAMPING],
  ])("%s (%s): switching language fires nothing by itself; the following click still fires exactly one event pair", (iso) => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(iso));
    const { rerender } = render(<Toolbar {...realTProps("is")} />);
    rerender(<Toolbar {...realTProps("en")} />);
    expect(trackEvent).not.toHaveBeenCalled();
    clickCta();
    expect(trackEvent).toHaveBeenCalledTimes(2);
  });

  it("preserves the exact scroll target id and options unchanged", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-01T12:00:00.000Z"));
    const scrollIntoView = vi.fn();
    const el = document.createElement("div");
    el.id = "comparison-section";
    el.scrollIntoView = scrollIntoView;
    document.body.appendChild(el);

    render(<Toolbar {...realTProps("is")} />);
    clickCta();

    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: "smooth", block: "start" });
    document.body.removeChild(el);
  });
});

describe("Toolbar — copy and click metadata agree across a rerender at each seasonal boundary", () => {
  beforeEach(() => vi.clearAllMocks());

  it.each([
    ["2026-03-31T23:59:59.000Z", "2026-04-01T00:00:00.000Z", HOMEPAGE_HERO_VARIANTS.WINTER_WEATHER_AURORA, HOMEPAGE_HERO_VARIANTS.WINTER_WEATHER],
    ["2026-04-30T23:59:59.000Z", "2026-05-01T00:00:00.000Z", HOMEPAGE_HERO_VARIANTS.WINTER_WEATHER, HOMEPAGE_HERO_VARIANTS.SUMMER_CAMPING],
    ["2026-08-31T23:59:59.000Z", "2026-09-01T00:00:00.000Z", HOMEPAGE_HERO_VARIANTS.SUMMER_CAMPING, HOMEPAGE_HERO_VARIANTS.WINTER_WEATHER_AURORA],
  ])("boundary %s -> %s: rendered copy and click metadata both flip together", (before, after, beforeVariant, afterVariant) => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(before));
    const props = realTProps("is");
    const { rerender } = render(<Toolbar {...props} />);
    clickCta();
    expect(trackEvent).toHaveBeenLastCalledWith(
      "homepage_primary_cta_clicked",
      expect.objectContaining({ hero_variant: beforeVariant })
    );

    vi.clearAllMocks();
    vi.setSystemTime(new Date(after));
    rerender(<Toolbar {...props} />);
    clickCta();
    expect(trackEvent).toHaveBeenLastCalledWith(
      "homepage_primary_cta_clicked",
      expect.objectContaining({ hero_variant: afterVariant })
    );
  });
});

describe("Toolbar — the pre-existing browser-local October-April winter hint is unaffected", () => {
  beforeEach(() => vi.clearAllMocks());

  it("September: hero shows winter_weather_aurora copy, but the browser-local winter hint (Oct-Apr) is NOT shown", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-15T12:00:00.000Z"));
    render(<Toolbar {...realTProps("is")} />);
    expect(screen.getByText(translations.is.heroWinterAuroraTitle)).toBeInTheDocument();
    expect(screen.queryByText(translations.is.winterModeActive)).toBeNull();
  });

  it("October: hero copy is unchanged (still winter_weather_aurora), and the browser-local winter hint now appears", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-15T12:00:00.000Z"));
    render(<Toolbar {...realTProps("is")} />);
    expect(screen.getByText(translations.is.heroWinterAuroraTitle)).toBeInTheDocument();
    expect(screen.getByText(translations.is.winterModeActive)).toBeInTheDocument();
  });
});
