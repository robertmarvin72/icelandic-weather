// Settings "Skrá út" / "Log out" row in Toolbar: visibility, ordering after the DEV
// toggle, pending/failure states, and focus restoration.
import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import Toolbar from "./Toolbar";
import { translations } from "../i18n/translations";

vi.mock("../lib/analytics", () => ({ trackEvent: vi.fn() }));
// Switchable: the PWA sentinel renders only when a test sets pwa.visible = true.
const pwa = vi.hoisted(() => ({ visible: false }));
vi.mock("./InstallPWA", async () => {
  const React = await import("react");
  return {
    default: ({ className }) =>
      pwa.visible ? React.createElement("button", { type: "button", "data-testid": "pwa-sentinel", className }, "Install") : null,
  };
});
vi.mock("./CampsitePicker", () => ({ default: () => null }));
vi.mock("./DevProToggle", () => ({ default: () => <div data-testid="dev-pro-toggle-sentinel" /> }));

function props(lang = "en", overrides = {}) {
  const dict = translations[lang];
  return {
    t: (k) => dict[k] ?? k,
    lang,
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

function openSettings(lang = "en") {
  const dict = translations[lang];
  fireEvent.click(screen.getByRole("button", { name: new RegExp(dict.settingsLabel) }));
}

function logoutButton(lang = "en") {
  const dict = translations[lang];
  return screen.queryByRole("button", { name: new RegExp(dict.logoutLabel) });
}

describe("Toolbar logout row", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    pwa.visible = false;
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("is absent for an anonymous or unresolved user", () => {
    render(<Toolbar {...props("en", { isSignedIn: false, onLogout: vi.fn() })} />);
    openSettings("en");

    expect(logoutButton("en")).toBeNull();
  });

  it("is absent when the logout props are omitted", () => {
    render(<Toolbar {...props("en")} />);
    openSettings("en");

    expect(logoutButton("en")).toBeNull();
  });

  it("is shown for a signed-in user with one decorative LogOut SVG and a visible label", () => {
    render(<Toolbar {...props("en", { isSignedIn: true, onLogout: vi.fn() })} />);
    openSettings("en");

    const button = logoutButton("en");
    expect(button).not.toBeNull();
    const svgs = button.querySelectorAll("svg");
    expect(svgs).toHaveLength(1);
    expect(svgs[0].getAttribute("aria-hidden")).toBe("true");
    expect(svgs[0].getAttribute("focusable")).toBe("false");
    expect(svgs[0].getAttribute("width")).toBe("16");
    expect(svgs[0].getAttribute("height")).toBe("16");
    expect(button.textContent).not.toContain("🚪");
    expect(button.textContent).toContain(translations.en.logoutLabel);
    // Class guards only; not responsive geometry proof.
    expect(button.className).toContain("min-h-[44px]");
    expect(button.className).toContain("focus-ring");
  });

  it("uses the Icelandic label when lang is is", () => {
    render(<Toolbar {...props("is", { isSignedIn: true, onLogout: vi.fn() })} />);
    openSettings("is");

    expect(logoutButton("is")).not.toBeNull();
    expect(translations.is.logoutLabel).toBe("Skrá út");
  });

  it("sits after the DEV toggle as the last control of the settings panel", () => {
    vi.stubEnv("DEV", true);
    render(<Toolbar {...props("en", { isSignedIn: true, onLogout: vi.fn() })} />);
    openSettings("en");

    const sentinel = screen.getByTestId("dev-pro-toggle-sentinel");
    const button = logoutButton("en");
    expect(sentinel.compareDocumentPosition(button) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("is shown and the DEV toggle is hidden when DEV is false", () => {
    vi.stubEnv("DEV", false);
    render(<Toolbar {...props("en", { isSignedIn: true, onLogout: vi.fn() })} />);
    openSettings("en");

    expect(screen.queryByTestId("dev-pro-toggle-sentinel")).toBeNull();
    expect(logoutButton("en")).not.toBeNull();
  });

  it("closes the panel and returns focus to the Settings toggle after a successful logout", async () => {
    const onLogout = vi.fn().mockResolvedValue(true);
    render(<Toolbar {...props("en", { isSignedIn: true, onLogout })} />);
    openSettings("en");

    const toggle = screen.getByRole("button", { name: /Settings/ });
    await act(async () => {
      fireEvent.click(logoutButton("en"));
    });

    expect(onLogout).toHaveBeenCalledTimes(1);
    expect(document.getElementById("toolbar-settings-panel")).toBeNull();
    expect(document.activeElement).toBe(toggle);
  });

  it("keeps the panel open and the button enabled after a failed logout", async () => {
    const onLogout = vi.fn().mockResolvedValue(false);
    render(<Toolbar {...props("en", { isSignedIn: true, onLogout })} />);
    openSettings("en");

    await act(async () => {
      fireEvent.click(logoutButton("en"));
    });

    expect(document.getElementById("toolbar-settings-panel")).not.toBeNull();
    expect(logoutButton("en").disabled).toBe(false);
  });

  it("shows the pending label, disables the button, and blocks repeat clicks while loggingOut", () => {
    const onLogout = vi.fn().mockResolvedValue(true);
    render(<Toolbar {...props("en", { isSignedIn: true, onLogout, loggingOut: true })} />);
    openSettings("en");

    const button = screen.getByRole("button", { name: /Logging out/ });
    expect(button.disabled).toBe(true);
    expect(button.getAttribute("aria-busy")).toBe("true");

    fireEvent.click(button);
    expect(onLogout).not.toHaveBeenCalled();
  });

  it("does not pull focus back to Settings if the panel was closed while the request was pending", async () => {
    let resolveLogout;
    const onLogout = vi.fn(() => new Promise((res) => (resolveLogout = res)));
    render(
      <>
        <Toolbar {...props("en", { isSignedIn: true, onLogout })} />
        <button type="button">elsewhere</button>
      </>
    );
    openSettings("en");

    const toggle = screen.getByRole("button", { name: /Settings/ });
    fireEvent.click(logoutButton("en"));

    // User closes the panel with the toggle, then moves focus elsewhere.
    fireEvent.click(toggle);
    expect(document.getElementById("toolbar-settings-panel")).toBeNull();
    const elsewhere = screen.getByRole("button", { name: "elsewhere" });
    elsewhere.focus();

    await act(async () => {
      resolveLogout(true);
    });

    expect(document.activeElement).toBe(elsewhere);
    expect(document.activeElement).not.toBe(toggle);
  });
});

// #435: presentation contract for the settings row (uniform controls, logout group owns its divider).
describe("Toolbar settings row layout (#435)", () => {
  const panel = () => document.getElementById("toolbar-settings-panel");
  const langTitle = () => translations.en["toolbar.toggleLanguage"] ?? "toolbar.toggleLanguage";

  beforeEach(() => {
    vi.clearAllMocks();
    pwa.visible = false;
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("orders PWA -> units -> language -> theme -> DEV -> logout when both optional controls are visible", () => {
    vi.stubEnv("DEV", true);
    pwa.visible = true;
    render(<Toolbar {...props("en", { isSignedIn: true, onLogout: vi.fn() })} />);
    openSettings("en");

    const seq = [
      screen.getByTestId("pwa-sentinel"),
      screen.getByRole("button", { name: "Switch to imperial units" }),
      screen.getByTitle(langTitle()),
      screen.getByRole("button", { name: "Switch to dark mode" }),
      screen.getByTestId("dev-pro-toggle-sentinel"),
      logoutButton("en"),
    ];
    for (let i = 0; i < seq.length - 1; i++) {
      expect(seq[i].compareDocumentPosition(seq[i + 1]) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    }
    expect(panel().lastElementChild.contains(logoutButton("en"))).toBe(true);
  });

  it("anonymous with no PWA and no DEV: exactly three direct button children and no divider", () => {
    vi.stubEnv("DEV", false);
    render(<Toolbar {...props("en", { isSignedIn: false, onLogout: vi.fn() })} />);
    openSettings("en");

    expect(panel().children).toHaveLength(3);
    for (const child of panel().children) expect(child.tagName).toBe("BUTTON");
    expect(panel().querySelector(".border-l")).toBeNull();
  });

  it("signed-in with no PWA and no DEV: logout group is the last child and holds only the logout button", () => {
    vi.stubEnv("DEV", false);
    render(<Toolbar {...props("en", { isSignedIn: true, onLogout: vi.fn() })} />);
    openSettings("en");

    const last = panel().lastElementChild;
    expect(panel().children).toHaveLength(4);
    expect(last.classList.contains("border-l")).toBe(true);
    expect(last.children).toHaveLength(1);
    expect(last.firstElementChild).toBe(logoutButton("en"));
    // Class guard: the old full-row divider classes are gone.
    expect(last.className).not.toMatch(/basis-full|w-full|border-t/);
  });

  it("units, language and theme callbacks each fire once and remain type=button", () => {
    vi.stubEnv("DEV", false);
    const onToggleUnits = vi.fn();
    const onToggleLanguage = vi.fn();
    const onToggleTheme = vi.fn();
    render(<Toolbar {...props("en", { onToggleUnits, onToggleLanguage, onToggleTheme })} />);
    openSettings("en");

    const units = screen.getByRole("button", { name: "Switch to imperial units" });
    const lang = screen.getByTitle(langTitle());
    const theme = screen.getByRole("button", { name: "Switch to dark mode" });
    for (const b of [units, lang, theme]) expect(b.getAttribute("type")).toBe("button");

    fireEvent.click(units);
    fireEvent.click(lang);
    fireEvent.click(theme);
    expect(onToggleUnits).toHaveBeenCalledTimes(1);
    expect(onToggleLanguage).toHaveBeenCalledTimes(1);
    expect(onToggleTheme).toHaveBeenCalledTimes(1);
  });

  it("InstallPWA receives the shared control class (className replaces its default styling)", () => {
    vi.stubEnv("DEV", false);
    pwa.visible = true;
    render(<Toolbar {...props("en")} />);
    openSettings("en");

    const pwaEl = screen.getByTestId("pwa-sentinel");
    expect(pwaEl.className).toContain("min-h-[44px]");
    expect(pwaEl.className).toContain("focus-ring");
    expect(pwaEl.className).toContain("cursor-pointer");
  });

  it("the Settings disclosure toggle keeps its own styling and is not part of the shared string", () => {
    render(<Toolbar {...props("en")} />);
    const toggle = screen.getByRole("button", { name: /Settings/ });
    expect(toggle.className).toContain("px-2");
    expect(toggle.className).toContain("py-1");
    expect(toggle.className).toContain("text-xs");
    expect(toggle.className).not.toContain("min-h-[44px]");
  });
});
