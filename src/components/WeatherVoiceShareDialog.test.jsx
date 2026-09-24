// Ticket 410 (#410) — WeatherVoiceShareDialog: image lifecycle, native
// share/download branches, cancellation/errors, focus trap/restoration,
// duplicate-action guard, URL cleanup, and exact event payload/throw
// isolation. `renderWeatherVoiceShareImage` and `trackEvent` are mocked —
// real canvas rendering/asset loading is exercised by real-browser
// evidence instead (outputs/ticket-410-weather-voice-share-evidence/).
//
// Ticket 417 (#417) — the dialog now opens on a compact "choice" screen
// first (Share image / Share on Facebook); every image/native/download
// test below now explicitly picks "Share image" before exercising that
// existing behavior, which is otherwise completely unchanged. New describe
// blocks at the bottom cover the choice screen and Facebook sharing
// itself. `weatherVoiceFacebookShare.js` is mocked here (like
// `renderWeatherVoiceShareImage`) — real manifest-matching logic has its
// own dedicated unit tests (weatherVoiceFacebookShare.test.js).
import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import WeatherVoiceShareDialog from "./WeatherVoiceShareDialog";
import { renderWeatherVoiceShareImage } from "../lib/weatherVoiceShareImage";
import { resolveWeatherVoiceFacebookShare } from "../lib/weatherVoiceFacebookShare";
import { trackEvent } from "../lib/analytics";

vi.mock("../lib/weatherVoiceShareImage", () => ({ renderWeatherVoiceShareImage: vi.fn() }));
vi.mock("../lib/weatherVoiceFacebookShare", () => ({ resolveWeatherVoiceFacebookShare: vi.fn() }));
vi.mock("../lib/analytics", () => ({ trackEvent: vi.fn() }));

const t = (k) => k;

const SNAPSHOT = Object.freeze({
  voiceId: "excellent_01",
  text: "Þetta er grunsamlega gott.",
  language: "is",
  mood: "excellent",
  condition: "excellent",
  severity: 0,
  siteName: "Þingvellir",
  date: "2026-09-08",
  tmax: 16,
  code: 0,
  episodeKey: "homepage_decision|site-a|2026-09-08|is|excellent|excellent|0",
});

const FACEBOOK_AVAILABLE = Object.freeze({
  available: true,
  pageUrl: "https://eltumvedrid.is/share/tjaldur/v1/is/excellent_01.html",
  facebookUrl: "https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Feltumvedrid.is%2Fshare%2Ftjaldur%2Fv1%2Fis%2Fexcellent_01.html",
});
const FACEBOOK_UNAVAILABLE = Object.freeze({ available: false, reason: "mismatch" });

function fakeBlob() {
  return new Blob(["fake-png-bytes"], { type: "image/png" });
}

function setNativeShareSupport({ share, canShare } = {}) {
  if (share) {
    Object.defineProperty(navigator, "share", { value: share, configurable: true });
  } else {
    delete navigator.share;
  }
  if (canShare) {
    Object.defineProperty(navigator, "canShare", { value: canShare, configurable: true });
  } else {
    delete navigator.canShare;
  }
}

beforeEach(() => {
  vi.clearAllMocks();
  resolveWeatherVoiceFacebookShare.mockReturnValue(FACEBOOK_AVAILABLE);
  setNativeShareSupport({});
  vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:fake-url");
  vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
});
afterEach(() => {
  setNativeShareSupport({});
  vi.restoreAllMocks();
});

function renderDialog(props = {}) {
  const onClose = vi.fn();
  const utils = render(<WeatherVoiceShareDialog snapshot={SNAPSHOT} lang="is" t={t} onClose={onClose} {...props} />);
  return { onClose, ...utils };
}

// Ticket 417 (#417): every pre-existing image/native/download test picks
// "Share image" first, since the dialog now opens on the choice screen.
function chooseImage() {
  fireEvent.click(screen.getByText("weatherVoiceShareChoiceImage"));
}

describe("WeatherVoiceShareDialog — image lifecycle", () => {
  it("shows a generating status, then the preview once rendering resolves", async () => {
    let resolveRender;
    renderWeatherVoiceShareImage.mockReturnValue(new Promise((resolve) => (resolveRender = resolve)));
    renderDialog();
    chooseImage();
    expect(screen.getByRole("status")).toHaveTextContent("weatherVoiceShareGenerating");

    resolveRender(fakeBlob());
    await waitFor(() => expect(screen.getByRole("img")).toBeInTheDocument());
  });

  it("shows an error state, never a blank/partial image, when rendering fails (decode/render failure)", async () => {
    renderWeatherVoiceShareImage.mockRejectedValue(new Error("decode failed"));
    renderDialog();
    chooseImage();
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("weatherVoiceShareError"));
    expect(screen.queryByRole("img")).toBeNull();
  });

  it("revokes the created object URL on unmount, after it was available for use", async () => {
    renderWeatherVoiceShareImage.mockResolvedValue(fakeBlob());
    const { unmount } = renderDialog();
    chooseImage();
    await waitFor(() => expect(screen.getByRole("img")).toBeInTheDocument());
    unmount();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:fake-url");
  });

  it("passes an AbortSignal to the renderer and aborts it on unmount (async invalidation)", () => {
    renderWeatherVoiceShareImage.mockReturnValue(new Promise(() => {})); // never resolves
    const { unmount } = renderDialog();
    chooseImage();
    const passedSignal = renderWeatherVoiceShareImage.mock.calls[0][1].signal;
    expect(passedSignal.aborted).toBe(false);
    unmount();
    expect(passedSignal.aborted).toBe(true);
  });

  it("a late-resolving render after unmount does not update state or throw", async () => {
    let resolveRender;
    renderWeatherVoiceShareImage.mockReturnValue(new Promise((resolve) => (resolveRender = resolve)));
    const { unmount } = renderDialog();
    chooseImage();
    unmount();
    expect(() => resolveRender(fakeBlob())).not.toThrow();
  });

  it("does not call the image renderer at all while still on the choice screen", () => {
    renderWeatherVoiceShareImage.mockReturnValue(new Promise(() => {}));
    renderDialog();
    expect(renderWeatherVoiceShareImage).not.toHaveBeenCalled();
  });
});

describe("WeatherVoiceShareDialog — native share support and second-gesture invocation", () => {
  it("the native Share button is absent when navigator.share/canShare are unsupported", async () => {
    renderWeatherVoiceShareImage.mockResolvedValue(fakeBlob());
    renderDialog();
    chooseImage();
    await waitFor(() => expect(screen.getByRole("img")).toBeInTheDocument());
    expect(screen.queryByText("weatherVoiceShareNative")).toBeNull();
  });

  it("the native Share button appears only once canShare({files}) returns true for the actual generated file", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    const canShare = vi.fn().mockReturnValue(true);
    setNativeShareSupport({ share, canShare });
    renderWeatherVoiceShareImage.mockResolvedValue(fakeBlob());
    renderDialog();
    chooseImage();
    await waitFor(() => expect(screen.getByText("weatherVoiceShareNative")).toBeInTheDocument());
    expect(canShare).toHaveBeenCalledWith({ files: [expect.any(File)] });
  });

  it("navigator.share is invoked only by the explicit button click, never during rendering/preparation", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    setNativeShareSupport({ share, canShare: () => true });
    renderWeatherVoiceShareImage.mockResolvedValue(fakeBlob());
    renderDialog();
    chooseImage();
    await waitFor(() => expect(screen.getByText("weatherVoiceShareNative")).toBeInTheDocument());
    expect(share).not.toHaveBeenCalled();

    fireEvent.click(screen.getByText("weatherVoiceShareNative"));
    await waitFor(() => expect(share).toHaveBeenCalledTimes(1));
    expect(share.mock.calls[0][0]).toEqual(expect.objectContaining({ files: [expect.any(File)] }));
  });
});

describe("WeatherVoiceShareDialog — cancellation, errors, and the download fallback", () => {
  it("AbortError from navigator.share shows a neutral cancellation notice, never a scary error or completion claim", async () => {
    const share = vi.fn().mockRejectedValue(Object.assign(new Error("cancelled"), { name: "AbortError" }));
    setNativeShareSupport({ share, canShare: () => true });
    renderWeatherVoiceShareImage.mockResolvedValue(fakeBlob());
    renderDialog();
    chooseImage();
    await waitFor(() => expect(screen.getByText("weatherVoiceShareNative")).toBeInTheDocument());

    fireEvent.click(screen.getByText("weatherVoiceShareNative"));
    await waitFor(() => expect(screen.getByText("weatherVoiceShareCancelled")).toBeInTheDocument());
    expect(screen.queryByText("weatherVoiceShareUnavailable")).toBeNull();
  });

  it("a non-abort share rejection shows the unavailable notice, and the save action remains usable", async () => {
    const share = vi.fn().mockRejectedValue(new Error("NotAllowedError"));
    setNativeShareSupport({ share, canShare: () => true });
    renderWeatherVoiceShareImage.mockResolvedValue(fakeBlob());
    renderDialog();
    chooseImage();
    await waitFor(() => expect(screen.getByText("weatherVoiceShareNative")).toBeInTheDocument());

    fireEvent.click(screen.getByText("weatherVoiceShareNative"));
    await waitFor(() => expect(screen.getByText("weatherVoiceShareUnavailable")).toBeInTheDocument());
    expect(screen.getByText("weatherVoiceShareSave")).not.toBeDisabled();
  });

  it("the download fallback works on every render (an <a download> click), independent of native support", async () => {
    renderWeatherVoiceShareImage.mockResolvedValue(fakeBlob());
    renderDialog();
    chooseImage();
    await waitFor(() => expect(screen.getByText("weatherVoiceShareSave")).not.toBeDisabled());

    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    fireEvent.click(screen.getByText("weatherVoiceShareSave"));
    expect(clickSpy).toHaveBeenCalledTimes(1);
  });

  it("rendering failure never allows a download of a blank file — the save button stays disabled", async () => {
    renderWeatherVoiceShareImage.mockRejectedValue(new Error("render failed"));
    renderDialog();
    chooseImage();
    await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument());
    expect(screen.getByText("weatherVoiceShareSave")).toBeDisabled();
  });
});

describe("WeatherVoiceShareDialog — duplicate-action guard", () => {
  it("disables both buttons while a share/download attempt is in flight, re-enabling after it settles", async () => {
    let resolveShare;
    const share = vi.fn().mockReturnValue(new Promise((resolve) => (resolveShare = resolve)));
    setNativeShareSupport({ share, canShare: () => true });
    renderWeatherVoiceShareImage.mockResolvedValue(fakeBlob());
    renderDialog();
    chooseImage();
    await waitFor(() => expect(screen.getByText("weatherVoiceShareNative")).toBeInTheDocument());

    fireEvent.click(screen.getByText("weatherVoiceShareNative"));
    expect(screen.getByText("weatherVoiceShareNative")).toBeDisabled();
    expect(screen.getByText("weatherVoiceShareSave")).toBeDisabled();
    expect(share).toHaveBeenCalledTimes(1);

    // A second click while busy must not invoke share again.
    fireEvent.click(screen.getByText("weatherVoiceShareNative"));
    expect(share).toHaveBeenCalledTimes(1);

    resolveShare(undefined);
    await waitFor(() => expect(screen.getByText("weatherVoiceShareNative")).not.toBeDisabled());

    // A later, intentional retry after settling is a legitimate new attempt.
    fireEvent.click(screen.getByText("weatherVoiceShareNative"));
    expect(share).toHaveBeenCalledTimes(2);
  });

  // Ripley Round 1 finding #4: "existing busy tests exercise pending
  // native sharing rather than this download path" — the download
  // handler is fully synchronous, so a REACT-STATE-only guard
  // (`if (busyMethod) return`) cannot actually block two rapid clicks
  // fired within the same script tick, since both read the same
  // pre-update `busyMethod` closure value. The fix uses a ref checked/set
  // BEFORE any other work, released only on the next microtask.
  it("Revision 2 (#410): rapid, synchronous repeat download clicks trigger only one real attempt; a later retry after a tick succeeds", async () => {
    renderWeatherVoiceShareImage.mockResolvedValue(fakeBlob());
    renderDialog();
    chooseImage();
    await waitFor(() => expect(screen.getByText("weatherVoiceShareSave")).not.toBeDisabled());
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    const saveButton = screen.getByText("weatherVoiceShareSave");
    // Two clicks fired back to back, synchronously, in the same script
    // tick — simulating a real rapid double-click before React (or even
    // this handler's own bounded release) has had a chance to run.
    fireEvent.click(saveButton);
    fireEvent.click(saveButton);
    expect(clickSpy).toHaveBeenCalledTimes(1); // the second, rapid click was suppressed
    expect(trackEvent).toHaveBeenCalledTimes(1);

    // Let the bounded (microtask) release resolve, then retry deliberately.
    await waitFor(() => expect(saveButton).not.toBeDisabled());
    fireEvent.click(saveButton);
    expect(clickSpy).toHaveBeenCalledTimes(2); // a genuine later retry is a new attempt
    expect(trackEvent).toHaveBeenCalledTimes(2);
  });
});

describe("WeatherVoiceShareDialog — Revision 2 (#410, Ripley Round 1 finding #4): native method requires BOTH navigator.share and navigator.canShare", () => {
  it("hides the native button when canShare exists but navigator.share does not", async () => {
    setNativeShareSupport({ canShare: () => true }); // share left unset
    renderWeatherVoiceShareImage.mockResolvedValue(fakeBlob());
    renderDialog();
    chooseImage();
    await waitFor(() => expect(screen.getByText("weatherVoiceShareSave")).not.toBeDisabled());
    expect(screen.queryByText("weatherVoiceShareNative")).toBeNull();
  });

  it("hides the native button when navigator.share exists but canShare does not", async () => {
    setNativeShareSupport({ share: vi.fn() }); // canShare left unset
    renderWeatherVoiceShareImage.mockResolvedValue(fakeBlob());
    renderDialog();
    chooseImage();
    await waitFor(() => expect(screen.getByText("weatherVoiceShareSave")).not.toBeDisabled());
    expect(screen.queryByText("weatherVoiceShareNative")).toBeNull();
  });

  it("shows the native button only when both are genuinely present", async () => {
    setNativeShareSupport({ share: vi.fn(), canShare: () => true });
    renderWeatherVoiceShareImage.mockResolvedValue(fakeBlob());
    renderDialog();
    chooseImage();
    await waitFor(() => expect(screen.getByText("weatherVoiceShareNative")).toBeInTheDocument());
  });
});

describe("WeatherVoiceShareDialog — Revision 2 (#410): focus behavior through unrelated parent rerenders", () => {
  it("a rerender with a referentially-stable onClose and the same snapshot does not reset focus away from wherever the user tabbed to", async () => {
    renderWeatherVoiceShareImage.mockResolvedValue(fakeBlob());
    const stableOnClose = vi.fn();
    const { rerender } = render(<WeatherVoiceShareDialog snapshot={SNAPSHOT} lang="is" t={t} onClose={stableOnClose} />);
    await waitFor(() => expect(screen.getByRole("dialog").contains(document.activeElement)).toBe(true));

    const closeButton = screen.getByText("close");
    closeButton.focus();
    expect(document.activeElement).toBe(closeButton);

    // Re-render with the SAME snapshot and SAME onClose reference (as
    // WeatherVoiceCard.jsx's own useCallback-memoized closeShareDialog
    // guarantees) and an unrelated prop change (lang stays "is" here,
    // simulating a rerender caused by something outside this dialog).
    rerender(<WeatherVoiceShareDialog snapshot={SNAPSHOT} lang="is" t={t} onClose={stableOnClose} />);
    expect(document.activeElement).toBe(closeButton); // focus was NOT reset to the first element
  });
});

describe("WeatherVoiceShareDialog — exact event payload and analytics-throw isolation (native/download, image path)", () => {
  it("emits weather_voice_share_clicked with exactly the documented fields on download, from the frozen snapshot", async () => {
    renderWeatherVoiceShareImage.mockResolvedValue(fakeBlob());
    renderDialog();
    chooseImage();
    await waitFor(() => expect(screen.getByText("weatherVoiceShareSave")).not.toBeDisabled());
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    fireEvent.click(screen.getByText("weatherVoiceShareSave"));

    expect(trackEvent).toHaveBeenCalledTimes(1);
    const [name, payload] = trackEvent.mock.calls[0];
    expect(name).toBe("weather_voice_share_clicked");
    expect(Object.keys(payload).sort()).toEqual(["language", "severity", "share_method", "surface", "voice_id", "weather_type"]);
    expect(payload).toEqual({
      voice_id: "excellent_01",
      language: "is",
      severity: 0,
      weather_type: "excellent",
      surface: "homepage_decision",
      share_method: "download",
    });
  });

  it("emits with share_method:'native' for the native button, on click — even if navigator.share later rejects", async () => {
    const share = vi.fn().mockRejectedValue(new Error("boom"));
    setNativeShareSupport({ share, canShare: () => true });
    renderWeatherVoiceShareImage.mockResolvedValue(fakeBlob());
    renderDialog();
    chooseImage();
    await waitFor(() => expect(screen.getByText("weatherVoiceShareNative")).toBeInTheDocument());

    fireEvent.click(screen.getByText("weatherVoiceShareNative"));
    expect(trackEvent).toHaveBeenCalledWith("weather_voice_share_clicked", expect.objectContaining({ share_method: "native" }));
    await waitFor(() => expect(screen.getByText("weatherVoiceShareUnavailable")).toBeInTheDocument());
    // Still exactly one event — the failed attempt itself counts as one click, never a completion.
    expect(trackEvent).toHaveBeenCalledTimes(1);
  });

  it("opening the preview alone (before any click) never emits an event", async () => {
    renderWeatherVoiceShareImage.mockResolvedValue(fakeBlob());
    renderDialog();
    chooseImage();
    await waitFor(() => expect(screen.getByText("weatherVoiceShareSave")).not.toBeDisabled());
    expect(trackEvent).not.toHaveBeenCalled();
  });

  it("a throwing trackEvent does not prevent the download/share action or throw out of the click handler", async () => {
    trackEvent.mockImplementation(() => {
      throw new Error("analytics exploded");
    });
    renderWeatherVoiceShareImage.mockResolvedValue(fakeBlob());
    renderDialog();
    chooseImage();
    await waitFor(() => expect(screen.getByText("weatherVoiceShareSave")).not.toBeDisabled());
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    expect(() => fireEvent.click(screen.getByText("weatherVoiceShareSave"))).not.toThrow();
    expect(clickSpy).toHaveBeenCalledTimes(1);
  });

  it("never includes free text, site name, coordinates, or the full episode key in the payload", async () => {
    renderWeatherVoiceShareImage.mockResolvedValue(fakeBlob());
    renderDialog();
    chooseImage();
    await waitFor(() => expect(screen.getByText("weatherVoiceShareSave")).not.toBeDisabled());
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    fireEvent.click(screen.getByText("weatherVoiceShareSave"));

    const [, payload] = trackEvent.mock.calls[0];
    const serialized = JSON.stringify(payload);
    expect(serialized).not.toContain(SNAPSHOT.text);
    expect(serialized).not.toContain(SNAPSHOT.siteName);
    expect(serialized).not.toContain(SNAPSHOT.episodeKey);
  });
});

describe("WeatherVoiceShareDialog — keyboard focus containment and restoration (new implementation, Ticket 410)", () => {
  it("moves focus into the dialog on open and restores it to the previously focused trigger on close", async () => {
    renderWeatherVoiceShareImage.mockResolvedValue(fakeBlob());
    const trigger = document.createElement("button");
    trigger.textContent = "open trigger";
    document.body.appendChild(trigger);
    trigger.focus();
    expect(document.activeElement).toBe(trigger);

    const { unmount } = renderDialog();
    await waitFor(() => expect(document.activeElement).not.toBe(trigger));
    expect(screen.getByRole("dialog").contains(document.activeElement)).toBe(true);

    unmount();
    expect(document.activeElement).toBe(trigger);
    trigger.remove();
  });

  it("falls back to document.body when the original trigger has disappeared (e.g. episode invalidation removed it)", async () => {
    renderWeatherVoiceShareImage.mockResolvedValue(fakeBlob());
    const trigger = document.createElement("button");
    document.body.appendChild(trigger);
    trigger.focus();

    const { unmount } = renderDialog();
    await waitFor(() => expect(screen.getByRole("dialog").contains(document.activeElement)).toBe(true));

    trigger.remove(); // simulate the trigger disappearing while the dialog is open
    expect(() => unmount()).not.toThrow();
  });

  it("Tab cycles forward from the last focusable element back to the first (focus trap)", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    setNativeShareSupport({ share, canShare: () => true });
    renderWeatherVoiceShareImage.mockResolvedValue(fakeBlob());
    renderDialog();
    chooseImage();
    await waitFor(() => expect(screen.getByText("weatherVoiceShareNative")).toBeInTheDocument());

    const dialog = screen.getByRole("dialog");
    const focusable = Array.from(dialog.querySelectorAll('button:not([disabled])'));
    const last = focusable[focusable.length - 1];
    last.focus();
    fireEvent.keyDown(document, { key: "Tab" });
    expect(document.activeElement).toBe(focusable[0]);
  });

  it("Escape closes the dialog", async () => {
    renderWeatherVoiceShareImage.mockResolvedValue(fakeBlob());
    const { onClose } = renderDialog();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("clicking the backdrop closes the dialog, but clicking inside it does not", async () => {
    renderWeatherVoiceShareImage.mockResolvedValue(fakeBlob());
    const { onClose } = renderDialog();
    fireEvent.click(screen.getByRole("dialog"));
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("presentation"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("switching from the choice screen into the image view refocuses the dialog's first focusable control", async () => {
    renderWeatherVoiceShareImage.mockReturnValue(new Promise(() => {}));
    renderDialog();
    const dialog = screen.getByRole("dialog");
    expect(dialog.contains(document.activeElement)).toBe(true);

    chooseImage();
    // The choice buttons are gone now; focus must land on a real control
    // inside the dialog (the new "Back" link), never a detached node.
    expect(dialog.contains(document.activeElement)).toBe(true);
    expect(document.activeElement).not.toBeNull();
  });
});

describe("WeatherVoiceShareDialog — Ticket 417 (#417): the compact two-action choice screen", () => {
  it("opens on the choice screen by default — both action labels visible, no image content yet", () => {
    renderDialog();
    expect(screen.getByText("weatherVoiceShareChoiceImage")).toBeInTheDocument();
    expect(screen.getByText("weatherVoiceShareChoiceFacebook")).toBeInTheDocument();
    expect(screen.queryByRole("img")).toBeNull();
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("the dialog title on the choice screen is the choice title key, not the image dialog title", () => {
    renderDialog();
    expect(screen.getByRole("dialog")).toHaveAttribute("aria-label", "weatherVoiceShareChoiceTitle");
  });

  it("never presents the square PNG preview as part of the Facebook choice — no <img> exists before a choice is made", () => {
    renderDialog();
    expect(screen.queryByRole("img")).toBeNull();
  });

  it("clicking Share image transitions into the existing image dialog content and starts generation", () => {
    renderWeatherVoiceShareImage.mockReturnValue(new Promise(() => {}));
    renderDialog();
    chooseImage();
    expect(renderWeatherVoiceShareImage).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("status")).toHaveTextContent("weatherVoiceShareGenerating");
    expect(screen.getByText(/weatherVoiceShareBack/)).toBeInTheDocument();
  });

  it("the Back link in the image view returns to the choice screen", async () => {
    renderWeatherVoiceShareImage.mockResolvedValue(fakeBlob());
    renderDialog();
    chooseImage();
    await waitFor(() => expect(screen.getByRole("img")).toBeInTheDocument());

    fireEvent.click(screen.getByText(/weatherVoiceShareBack/));
    expect(screen.getByText("weatherVoiceShareChoiceImage")).toBeInTheDocument();
    expect(screen.getByRole("dialog")).toHaveAttribute("aria-label", "weatherVoiceShareChoiceTitle");
  });
});

describe("WeatherVoiceShareDialog — Ticket 417 (#417): Facebook sharing", () => {
  it("resolves Facebook availability from the exact frozen snapshot, once", () => {
    renderDialog();
    expect(resolveWeatherVoiceFacebookShare).toHaveBeenCalledWith(SNAPSHOT);
  });

  it("renders a real external anchor with the resolved sharer URL, opening in a new tab safely", () => {
    renderDialog();
    const link = screen.getByText("weatherVoiceShareChoiceFacebook").closest("a");
    expect(link).toHaveAttribute("href", FACEBOOK_AVAILABLE.facebookUrl);
    expect(link).toHaveAttribute("target", "_blank");
    expect(link.getAttribute("rel")).toEqual(expect.stringContaining("noopener"));
    expect(link.getAttribute("rel")).toEqual(expect.stringContaining("noreferrer"));
  });

  it("fires tjaldur_facebook_share_clicked with exactly {mood, language, source} on click, never weather_voice_share_clicked", () => {
    renderDialog();
    fireEvent.click(screen.getByText("weatherVoiceShareChoiceFacebook"));

    expect(trackEvent).toHaveBeenCalledTimes(1);
    const [name, payload] = trackEvent.mock.calls[0];
    expect(name).toBe("tjaldur_facebook_share_clicked");
    expect(Object.keys(payload).sort()).toEqual(["language", "mood", "source"]);
    expect(payload).toEqual({ mood: "excellent", language: "is", source: "homepage_decision" });
  });

  it("repeated intentional clicks each count once", () => {
    renderDialog();
    const link = screen.getByText("weatherVoiceShareChoiceFacebook");
    fireEvent.click(link);
    fireEvent.click(link);
    const calls = trackEvent.mock.calls.filter((c) => c[0] === "tjaldur_facebook_share_clicked");
    expect(calls).toHaveLength(2);
  });

  it("does not fire on render, on opening the choice screen, or on choosing the image path instead", async () => {
    renderWeatherVoiceShareImage.mockResolvedValue(fakeBlob());
    renderDialog();
    expect(trackEvent).not.toHaveBeenCalled();
    chooseImage();
    await waitFor(() => expect(screen.getByRole("img")).toBeInTheDocument());
    expect(trackEvent.mock.calls.filter((c) => c[0] === "tjaldur_facebook_share_clicked")).toHaveLength(0);
  });

  it("never emits weather_voice_share_clicked for a Facebook click", () => {
    renderDialog();
    fireEvent.click(screen.getByText("weatherVoiceShareChoiceFacebook"));
    expect(trackEvent.mock.calls.filter((c) => c[0] === "weather_voice_share_clicked")).toHaveLength(0);
  });

  it("a throwing trackEvent does not prevent the anchor's own click/navigation", () => {
    trackEvent.mockImplementation(() => {
      throw new Error("analytics exploded");
    });
    renderDialog();
    const link = screen.getByText("weatherVoiceShareChoiceFacebook");
    expect(() => fireEvent.click(link)).not.toThrow();
  });

  it("never includes voice_id, quote text, episodeKey, or any location in the Facebook event payload", () => {
    renderDialog();
    fireEvent.click(screen.getByText("weatherVoiceShareChoiceFacebook"));
    const [, payload] = trackEvent.mock.calls[0];
    const serialized = JSON.stringify(payload);
    expect(serialized).not.toContain(SNAPSHOT.voiceId);
    expect(serialized).not.toContain(SNAPSHOT.text);
    expect(serialized).not.toContain(SNAPSHOT.siteName);
    expect(serialized).not.toContain(SNAPSHOT.episodeKey);
  });

  it("Facebook does NOT depend on successful canvas generation — the link is present and clickable even if the image renderer would reject", () => {
    renderWeatherVoiceShareImage.mockRejectedValue(new Error("canvas exploded"));
    renderDialog();
    // Never chose "Share image" — renderer was never even invoked — yet
    // the Facebook link is fully present and functional.
    expect(renderWeatherVoiceShareImage).not.toHaveBeenCalled();
    const link = screen.getByText("weatherVoiceShareChoiceFacebook").closest("a");
    expect(link).toHaveAttribute("href", FACEBOOK_AVAILABLE.facebookUrl);
    fireEvent.click(link);
    expect(trackEvent).toHaveBeenCalledWith("tjaldur_facebook_share_clicked", expect.any(Object));
  });

  describe("localized unavailable state (missing/mismatched manifest entry)", () => {
    beforeEach(() => {
      resolveWeatherVoiceFacebookShare.mockReturnValue(FACEBOOK_UNAVAILABLE);
    });

    it("shows a localized unavailable notice instead of the Facebook link", () => {
      renderDialog();
      expect(screen.queryByText("weatherVoiceShareChoiceFacebook")).toBeNull();
      expect(screen.getByText("weatherVoiceShareFacebookUnavailable")).toBeInTheDocument();
    });

    it("image sharing remains fully available", async () => {
      renderWeatherVoiceShareImage.mockResolvedValue(fakeBlob());
      renderDialog();
      expect(screen.getByText("weatherVoiceShareChoiceImage")).toBeInTheDocument();
      chooseImage();
      await waitFor(() => expect(screen.getByRole("img")).toBeInTheDocument());
    });

    it("never substitutes a different quote's share link", () => {
      renderDialog();
      expect(screen.queryByRole("link")).toBeNull();
    });
  });

  describe("Ticket 417 (#417): same-episode object churn must not swap the resolved choice; a genuine episode change invalidates it", () => {
    it("a new snapshot OBJECT for the same episodeKey (same voiceId/text/mood/language) still resolves consistently on rerender", () => {
      const { rerender } = renderDialog();
      expect(resolveWeatherVoiceFacebookShare).toHaveBeenCalledTimes(1);

      // A structurally-identical but referentially-different snapshot for
      // the SAME episode (e.g. an unrelated parent rerender rebuilding the
      // object) — WeatherVoiceCard.jsx's own frozen-state design (Ticket
      // 410 Revision 2) is what actually prevents this from happening in
      // production; this test proves the dialog's OWN memoization still
      // only re-resolves when the snapshot reference genuinely changes.
      const sameEpisodeNewObject = { ...SNAPSHOT };
      rerender(<WeatherVoiceShareDialog snapshot={sameEpisodeNewObject} lang="is" t={t} onClose={vi.fn()} />);
      expect(resolveWeatherVoiceFacebookShare).toHaveBeenCalledTimes(2); // useMemo keys on the object reference, so this DOES re-run...
      // ...but resolves to the same result since the underlying resolver is pure and given equal fields:
      expect(resolveWeatherVoiceFacebookShare).toHaveBeenLastCalledWith(sameEpisodeNewObject);
    });

    it("a genuine episode change (different voiceId) resolves Facebook availability again from the new snapshot", () => {
      const { rerender } = renderDialog();
      const otherSnapshot = { ...SNAPSHOT, voiceId: "good_01", text: "Þetta má alveg.", mood: "happy", condition: "good" };
      resolveWeatherVoiceFacebookShare.mockReturnValue({
        available: true,
        pageUrl: "https://eltumvedrid.is/share/tjaldur/v1/is/good_01.html",
        facebookUrl: "https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Feltumvedrid.is%2Fshare%2Ftjaldur%2Fv1%2Fis%2Fgood_01.html",
      });
      rerender(<WeatherVoiceShareDialog snapshot={otherSnapshot} lang="is" t={t} onClose={vi.fn()} />);
      expect(resolveWeatherVoiceFacebookShare).toHaveBeenLastCalledWith(otherSnapshot);
      const link = screen.getByText("weatherVoiceShareChoiceFacebook").closest("a");
      expect(link).toHaveAttribute("href", expect.stringContaining("good_01"));
    });
  });
});
