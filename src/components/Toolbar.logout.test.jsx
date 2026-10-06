// Settings "Skrá út" / "Log out" row in Toolbar: visibility, ordering after the DEV
// toggle, pending/failure states, and focus restoration.
import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import Toolbar from "./Toolbar";
import { translations } from "../i18n/translations";

vi.mock("../lib/analytics", () => ({ trackEvent: vi.fn() }));
vi.mock("./InstallPWA", () => ({ default: () => null }));
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

  it("is shown for a signed-in user with an aria-hidden door icon and a 44px touch target", () => {
    render(<Toolbar {...props("en", { isSignedIn: true, onLogout: vi.fn() })} />);
    openSettings("en");

    const button = logoutButton("en");
    expect(button).not.toBeNull();
    expect(button.className).toContain("min-h-[44px]");
    expect(button.className).toContain("focus-ring");
    const icon = button.querySelector("[aria-hidden]");
    expect(icon?.textContent).toBe("🚪");
  });

  it("uses the Icelandic label when lang is is", () => {
    render(<Toolbar {...props("is", { isSignedIn: true, onLogout: vi.fn() })} />);
    openSettings("is");

    expect(logoutButton("is")).not.toBeNull();
    expect(translations.is.logoutLabel).toBe("Skrá út");
  });

  it("sits after the DEV toggle as the last row of the settings panel", () => {
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
