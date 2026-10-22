// Ticket #440 — dialog semantics, keyboard/focus containment, focus return
// and body-scroll-lock lifecycle for RoutePlannerDetailsModal. New focused
// file per J9: RoutePlannerDetailsModal.test.jsx (pre-existing, #436) keeps
// its own assertions untouched. Structural DOM assertions here (focusable
// order, listener counts, inline style values) are used deliberately —
// jsdom cannot establish real layout or scrolling, so this file never
// asserts clipping/scrollability from class strings or jsdom metrics (see
// outputs/ticket-440-browser-evidence/ for the real-browser proof of that).
import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import RoutePlannerDetailsModal from "./RoutePlannerDetailsModal";
import { translations } from "../i18n/translations";

const t = (k) => translations.en[k] ?? k;

function day(dateISO, overrides = {}) {
  return {
    date: dateISO,
    points: 7,
    pointsRaw: 7,
    baseSitePoints: 5,
    baseSitePointsRaw: 5,
    windPen: 0,
    gustPen: 0,
    rainPen: 0,
    rainStreakPen: 0,
    shelter: 0.5,
    shelterBonus: 0.2,
    basePts: 5,
    warnings: [],
    baseSiteWarnings: [],
    ...overrides,
  };
}

function candidate(overrides = {}) {
  return {
    siteId: "site-fludir",
    siteName: "Flúðir",
    distanceKm: 25,
    betterDays: 1,
    sameDays: 0,
    worseDays: 0,
    deltaVsBase: 2,
    reasons: [],
    aggregateType: "better",
    windowDays: [day("2026-10-20")],
    ...overrides,
  };
}

function getPanel() {
  return screen.getByRole("dialog");
}

function getScrollRegion() {
  return screen.getByTestId("route-details-scroll-region");
}

// DOM order inside the panel with advanced collapsed: header close button,
// HazardSourceNote's vedur.is link, the advanced-disclosure toggle, footer
// close button. Verified by reading RouteCompareTable.jsx (no focusable
// elements of its own) and HazardSourceNote.jsx (one link) directly.
function getFocusableInPanel() {
  const panel = getPanel();
  return Array.from(
    panel.querySelectorAll('button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'),
  );
}

beforeEach(() => {
  document.body.style.overflow = "";
  document.body.style.paddingRight = "";
});

afterEach(() => {
  document.body.style.overflow = "";
  document.body.style.paddingRight = "";
});

describe("RoutePlannerDetailsModal — dialog role and accessible name (J3)", () => {
  it("exposes role=dialog, aria-modal=true, and an accessible name matching the visible title", () => {
    render(<RoutePlannerDetailsModal open candidate={candidate()} t={t} lang="en" onClose={vi.fn()} />);
    const dialog = getPanel();
    expect(dialog.getAttribute("aria-modal")).toBe("true");
    expect(dialog).toHaveAccessibleName("Flúðir");
  });

  it("keeps the exact existing aria-label=\"Close modal\" on the header close button (the #441 canonicalTone helper depends on it)", () => {
    render(<RoutePlannerDetailsModal open candidate={candidate()} t={t} lang="en" onClose={vi.fn()} />);
    expect(screen.getByLabelText("Close modal")).toBeInTheDocument();
    // Still exactly one match — queryByLabelText throws on more than one.
    expect(() => screen.getByLabelText("Close modal")).not.toThrow();
  });
});

describe("RoutePlannerDetailsModal — initial focus permits immediate keyboard scrolling (J6)", () => {
  it("focuses the scroll region itself on open, not the header close button or the panel", async () => {
    render(<RoutePlannerDetailsModal open candidate={candidate()} t={t} lang="en" onClose={vi.fn()} />);
    await waitFor(() => expect(document.activeElement).toBe(getScrollRegion()));
    expect(document.activeElement).not.toBe(screen.getByLabelText("Close modal"));
  });

  it("the scroll region is excluded from the normal Tab sequence (tabIndex=-1), so it is a valid initial-focus target without becoming an extra tab stop", () => {
    render(<RoutePlannerDetailsModal open candidate={candidate()} t={t} lang="en" onClose={vi.fn()} />);
    const region = getScrollRegion();
    expect(region.getAttribute("tabindex")).toBe("-1");
    expect(getFocusableInPanel()).not.toContain(region);
  });
});

describe("RoutePlannerDetailsModal — Tab/Shift+Tab containment (J4/J6)", () => {
  it("Tab from the last focusable control wraps to the first, with advanced collapsed", () => {
    render(<RoutePlannerDetailsModal open candidate={candidate()} t={t} lang="en" onClose={vi.fn()} />);
    const items = getFocusableInPanel();
    expect(items.length).toBeGreaterThan(1);
    items[items.length - 1].focus();
    fireEvent.keyDown(window, { key: "Tab" });
    expect(document.activeElement).toBe(items[0]);
  });

  it("Shift+Tab from the first focusable control wraps to the last, with advanced collapsed", () => {
    render(<RoutePlannerDetailsModal open candidate={candidate()} t={t} lang="en" onClose={vi.fn()} />);
    const items = getFocusableInPanel();
    items[0].focus();
    fireEvent.keyDown(window, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(items[items.length - 1]);
  });

  it("Tab/Shift+Tab wrapping still holds after the advanced disclosure is expanded", () => {
    render(<RoutePlannerDetailsModal open candidate={candidate()} t={t} lang="en" onClose={vi.fn()} />);
    fireEvent.click(screen.getByText(t("routeDetailsShowAdvanced")));

    const items = getFocusableInPanel();
    items[items.length - 1].focus();
    fireEvent.keyDown(window, { key: "Tab" });
    expect(document.activeElement).toBe(items[0]);

    items[0].focus();
    fireEvent.keyDown(window, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(items[items.length - 1]);
  });

  it("recomputes the focusable set at keydown time, not once at open (defensive — correct even though this specific content does not currently add new controls when advanced expands)", () => {
    render(<RoutePlannerDetailsModal open candidate={candidate()} t={t} lang="en" onClose={vi.fn()} />);
    const beforeItems = getFocusableInPanel();
    fireEvent.click(screen.getByText(t("routeDetailsShowAdvanced")));
    const afterItems = getFocusableInPanel();
    // Whatever the set is at this moment, wrap-from-last must target
    // whatever is now first — never a stale reference captured at open.
    afterItems[afterItems.length - 1].focus();
    fireEvent.keyDown(window, { key: "Tab" });
    expect(document.activeElement).toBe(afterItems[0]);
    expect(beforeItems.length).toBeGreaterThan(0); // sanity: the "before" set was real
  });

  // v3 correction (K1): the two tests that used to live here asserted that
  // Tab/Shift+Tab from the scroll region (tabIndex=-1, INSIDE the panel, but
  // absent from FOCUSABLE_SELECTOR) re-enters at first/last. That was the
  // bug: Jonesy's v2 browser evidence showed real Chromium making the
  // compare-table/advanced-table scroll containers their own native Tab
  // stops despite matching no FOCUSABLE_SELECTOR pattern either, and the old
  // handler hijacked Tab there too, bouncing focus back to the header close
  // button and making "Show scoring details" and the footer Close
  // unreachable by keyboard at 320px wide. "Outside the known focusable
  // set" and "outside the panel" are not the same thing; only the latter
  // should re-enter at first/last. These two tests now use a genuinely
  // external element; the scroll-region case moves to the describe block
  // below, which asserts the opposite (native pass-through, not hijacked).
  it("Tab re-enters at the first control when focus is genuinely outside the panel", () => {
    const outside = document.createElement("button");
    document.body.appendChild(outside);
    render(<RoutePlannerDetailsModal open candidate={candidate()} t={t} lang="en" onClose={vi.fn()} />);
    outside.focus();
    const items = getFocusableInPanel();
    fireEvent.keyDown(window, { key: "Tab" });
    expect(document.activeElement).toBe(items[0]);
    outside.remove();
  });

  it("Shift+Tab re-enters at the last control when focus is genuinely outside the panel", () => {
    const outside = document.createElement("button");
    document.body.appendChild(outside);
    render(<RoutePlannerDetailsModal open candidate={candidate()} t={t} lang="en" onClose={vi.fn()} />);
    outside.focus();
    const items = getFocusableInPanel();
    fireEvent.keyDown(window, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(items[items.length - 1]);
    outside.remove();
  });
});

describe("RoutePlannerDetailsModal — in-panel native stops are not hijacked (v3 / K1 fix)", () => {
  // jsdom cannot create a REAL implicitly-keyboard-focusable scroll
  // container the way Chromium does for RouteCompareTable's/the advanced
  // table's overflow-x-auto wrappers (outputs/ticket-440-browser-evidence/
  // proves reachability there). The scroll region itself already has the
  // one property that matters for this handler decision: it is contained in
  // the panel and matches none of FOCUSABLE_SELECTOR -- a faithful jsdom
  // stand-in for "an in-panel element absent from the selector list".
  it("Tab keydown is not default-prevented and focus is not moved when it is on an in-panel element absent from FOCUSABLE_SELECTOR", async () => {
    render(<RoutePlannerDetailsModal open candidate={candidate()} t={t} lang="en" onClose={vi.fn()} />);
    const region = getScrollRegion();
    await waitFor(() => expect(document.activeElement).toBe(region));

    const notPrevented = fireEvent.keyDown(window, { key: "Tab" });
    expect(notPrevented).toBe(true);
    expect(document.activeElement).toBe(region);
  });

  it("Shift+Tab keydown is not default-prevented and focus is not moved, in the backward direction too", async () => {
    render(<RoutePlannerDetailsModal open candidate={candidate()} t={t} lang="en" onClose={vi.fn()} />);
    const region = getScrollRegion();
    await waitFor(() => expect(document.activeElement).toBe(region));

    const notPrevented = fireEvent.keyDown(window, { key: "Tab", shiftKey: true });
    expect(notPrevented).toBe(true);
    expect(document.activeElement).toBe(region);
  });
});

describe("RoutePlannerDetailsModal — backdrop (J4)", () => {
  it("the backdrop is not a <button> and is not part of the focusable/tab sequence", () => {
    const { container } = render(<RoutePlannerDetailsModal open candidate={candidate()} t={t} lang="en" onClose={vi.fn()} />);
    const backdrop = container.ownerDocument.body.querySelector(".fixed.inset-0.z-\\[9999\\] > .absolute.inset-0.bg-black\\/60");
    expect(backdrop).toBeInTheDocument();
    expect(backdrop.tagName).toBe("DIV");
    expect(backdrop).not.toHaveAttribute("tabindex");
    expect(getFocusableInPanel()).not.toContain(backdrop);
  });

  it("clicking the backdrop closes once; clicking inside the panel never closes", () => {
    const onClose = vi.fn();
    const { container } = render(<RoutePlannerDetailsModal open candidate={candidate()} t={t} lang="en" onClose={onClose} />);
    fireEvent.click(getPanel());
    expect(onClose).not.toHaveBeenCalled();

    const backdrop = container.ownerDocument.body.querySelector(".fixed.inset-0.z-\\[9999\\] > .absolute.inset-0.bg-black\\/60");
    fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe("RoutePlannerDetailsModal — Escape (existing contract) plus the exact-one-listener guarantee (J8)", () => {
  it("Escape still calls onClose exactly once (pre-existing #436 test behavior, re-confirmed)", () => {
    const onClose = vi.fn();
    render(<RoutePlannerDetailsModal open candidate={candidate()} t={t} lang="en" onClose={onClose} />);
    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("adds exactly one window keydown listener while rendered, and removes exactly one on close — balanced across repeated open/close cycles", () => {
    const addSpy = vi.spyOn(window, "addEventListener");
    const removeSpy = vi.spyOn(window, "removeEventListener");
    const onClose = vi.fn();

    const { rerender } = render(<RoutePlannerDetailsModal open={false} candidate={null} t={t} lang="en" onClose={onClose} />);
    addSpy.mockClear();
    removeSpy.mockClear();

    for (let i = 0; i < 3; i++) {
      rerender(<RoutePlannerDetailsModal open candidate={candidate()} t={t} lang="en" onClose={onClose} />);
      rerender(<RoutePlannerDetailsModal open={false} candidate={candidate()} t={t} lang="en" onClose={onClose} />);
    }

    const addCount = addSpy.mock.calls.filter((c) => c[0] === "keydown").length;
    const removeCount = removeSpy.mock.calls.filter((c) => c[0] === "keydown").length;
    expect(addCount).toBe(3);
    expect(removeCount).toBe(3);
    addSpy.mockRestore();
    removeSpy.mockRestore();
  });
});

describe("RoutePlannerDetailsModal — body scroll lock (J8)", () => {
  it("locks body overflow while rendered and restores the exact PRE-EXISTING non-empty values on close", () => {
    document.body.style.overflow = "scroll";
    document.body.style.paddingRight = "17px";

    const { rerender } = render(<RoutePlannerDetailsModal open candidate={candidate()} t={t} lang="en" onClose={vi.fn()} />);
    expect(document.body.style.overflow).toBe("hidden");

    rerender(<RoutePlannerDetailsModal open={false} candidate={candidate()} t={t} lang="en" onClose={vi.fn()} />);
    expect(document.body.style.overflow).toBe("scroll");
    expect(document.body.style.paddingRight).toBe("17px");
  });

  it("restores on candidate -> null while open stays true (no stale lock from an invisible dialog)", () => {
    const { rerender } = render(<RoutePlannerDetailsModal open candidate={candidate()} t={t} lang="en" onClose={vi.fn()} />);
    expect(document.body.style.overflow).toBe("hidden");

    rerender(<RoutePlannerDetailsModal open candidate={null} t={t} lang="en" onClose={vi.fn()} />);
    expect(document.body.style.overflow).toBe("");
  });

  it("open=true with candidate=null never locks the body, never moves focus, and adds no listener (J5/J10 invisible-lock guard)", () => {
    const trigger = document.createElement("button");
    document.body.appendChild(trigger);
    trigger.focus();
    const addSpy = vi.spyOn(window, "addEventListener");

    render(<RoutePlannerDetailsModal open candidate={null} t={t} lang="en" onClose={vi.fn()} />);

    expect(document.body.style.overflow).toBe("");
    expect(document.activeElement).toBe(trigger);
    expect(addSpy.mock.calls.filter((c) => c[0] === "keydown").length).toBe(0);

    addSpy.mockRestore();
    trigger.remove();
  });
});

describe("RoutePlannerDetailsModal — focus return (J7)", () => {
  it("restores focus to the original trigger on close, using preventScroll", async () => {
    const trigger = document.createElement("button");
    document.body.appendChild(trigger);
    trigger.focus();
    expect(document.activeElement).toBe(trigger);

    const focusSpy = vi.spyOn(trigger, "focus");
    const { rerender } = render(<RoutePlannerDetailsModal open candidate={candidate()} t={t} lang="en" onClose={vi.fn()} />);
    await waitFor(() => expect(document.activeElement).not.toBe(trigger));

    rerender(<RoutePlannerDetailsModal open={false} candidate={candidate()} t={t} lang="en" onClose={vi.fn()} />);
    expect(document.activeElement).toBe(trigger);
    expect(focusSpy).toHaveBeenCalledWith(expect.objectContaining({ preventScroll: true }));

    trigger.remove();
  });

  it("does not throw and leaves focus wherever the browser puts it when the original trigger is gone on close", async () => {
    const trigger = document.createElement("button");
    document.body.appendChild(trigger);
    trigger.focus();

    const { rerender } = render(<RoutePlannerDetailsModal open candidate={candidate()} t={t} lang="en" onClose={vi.fn()} />);
    await waitFor(() => expect(getPanel().contains(document.activeElement)).toBe(true));

    trigger.remove(); // opener disappears while the dialog is open
    expect(() => rerender(<RoutePlannerDetailsModal open={false} candidate={candidate()} t={t} lang="en" onClose={vi.fn()} />)).not.toThrow();
  });

  it("focus-return restoration is opener-agnostic (generic trigger, not tied to any specific RoutePlannerCard control)", async () => {
    // RoutePlannerDetailsModal has no knowledge of which specific control
    // opened it; it only captures document.activeElement at the moment it
    // becomes rendered. This test demonstrates that captured-element
    // restoration works for an arbitrary trigger element. Of RoutePlannerCard's
    // two "Open details" pill call sites, only the non-preview one
    // (RoutePlannerCard.jsx:1513) is actually clickable; the other
    // (RoutePlannerCard.jsx:1371, preview-only) carries a static `disabled`
    // attribute and can never produce a click/focus event, so this test does
    // not claim to cover "both" openers — the real-browser evidence (see
    // outputs/ticket-440-browser-evidence/) exercises the one reachable one.
    const opener1 = document.createElement("button");
    opener1.textContent = "Open details (pill 1)";
    document.body.appendChild(opener1);
    opener1.focus();

    const { rerender } = render(<RoutePlannerDetailsModal open candidate={candidate()} t={t} lang="en" onClose={vi.fn()} />);
    await waitFor(() => expect(document.activeElement).not.toBe(opener1));
    rerender(<RoutePlannerDetailsModal open={false} candidate={candidate()} t={t} lang="en" onClose={vi.fn()} />);
    expect(document.activeElement).toBe(opener1);
    opener1.remove();
  });
});

describe("RoutePlannerDetailsModal — stable focus across unrelated parent rerenders (J5)", () => {
  it("a rerender with a NEW onClose identity and the SAME candidate does not move focus or recapture the restore target", async () => {
    const trigger = document.createElement("button");
    document.body.appendChild(trigger);
    trigger.focus();

    const site = candidate();
    const { rerender } = render(<RoutePlannerDetailsModal open candidate={site} t={t} lang="en" onClose={() => {}} />);
    await waitFor(() => expect(document.activeElement).toBe(getScrollRegion()));

    // Move focus somewhere else inside the dialog, deliberately, to prove a
    // rerender below does not reset it back to the scroll region.
    screen.getByLabelText("Close modal").focus();
    expect(document.activeElement).toBe(screen.getByLabelText("Close modal"));

    rerender(<RoutePlannerDetailsModal open candidate={site} t={t} lang="en" onClose={() => {}} />); // new inline onClose identity
    expect(document.activeElement).toBe(screen.getByLabelText("Close modal")); // unchanged

    rerender(<RoutePlannerDetailsModal open={false} candidate={site} t={t} lang="en" onClose={() => {}} />);
    expect(document.activeElement).toBe(trigger); // restore target was still the ORIGINAL trigger, not the close button
    trigger.remove();
  });

  it("a rerender with a DIFFERENT candidate object (still open) does not move focus or recapture the restore target", async () => {
    const trigger = document.createElement("button");
    document.body.appendChild(trigger);
    trigger.focus();
    const onClose = vi.fn();

    const { rerender } = render(<RoutePlannerDetailsModal open candidate={candidate({ siteId: "a" })} t={t} lang="en" onClose={onClose} />);
    await waitFor(() => expect(document.activeElement).toBe(getScrollRegion()));

    screen.getByLabelText("Close modal").focus();
    rerender(<RoutePlannerDetailsModal open candidate={candidate({ siteId: "b", siteName: "Different Site" })} t={t} lang="en" onClose={onClose} />);
    expect(document.activeElement).toBe(screen.getByLabelText("Close modal")); // still unchanged

    rerender(<RoutePlannerDetailsModal open={false} candidate={candidate({ siteId: "b" })} t={t} lang="en" onClose={onClose} />);
    expect(document.activeElement).toBe(trigger);
    trigger.remove();
  });
});

describe("RoutePlannerDetailsModal — StrictMode double-invoke (J5)", () => {
  it("a full open/close cycle inside StrictMode ends with focus on the opener, body styles restored, and listeners balanced", async () => {
    const trigger = document.createElement("button");
    document.body.appendChild(trigger);
    trigger.focus();
    document.body.style.overflow = "";
    document.body.style.paddingRight = "";
    const addSpy = vi.spyOn(window, "addEventListener");
    const removeSpy = vi.spyOn(window, "removeEventListener");

    const { rerender } = render(
      <React.StrictMode>
        <RoutePlannerDetailsModal open candidate={candidate()} t={t} lang="en" onClose={vi.fn()} />
      </React.StrictMode>,
    );
    await waitFor(() => expect(document.body.style.overflow).toBe("hidden"));

    rerender(
      <React.StrictMode>
        <RoutePlannerDetailsModal open={false} candidate={candidate()} t={t} lang="en" onClose={vi.fn()} />
      </React.StrictMode>,
    );

    expect(document.activeElement).toBe(trigger);
    expect(document.body.style.overflow).toBe("");
    expect(document.body.style.paddingRight).toBe("");

    const addCount = addSpy.mock.calls.filter((c) => c[0] === "keydown").length;
    const removeCount = removeSpy.mock.calls.filter((c) => c[0] === "keydown").length;
    expect(addCount).toBe(removeCount);

    addSpy.mockRestore();
    removeSpy.mockRestore();
    trigger.remove();
  });
});

describe("RoutePlannerDetailsModal — repeated open/close cycles stay consistent", () => {
  it("three consecutive open/close cycles each lock then fully restore, with no leaked state", async () => {
    const onClose = vi.fn();
    const { rerender } = render(<RoutePlannerDetailsModal open={false} candidate={null} t={t} lang="en" onClose={onClose} />);

    for (let i = 0; i < 3; i++) {
      const site = candidate({ siteId: `site-${i}` });
      rerender(<RoutePlannerDetailsModal open candidate={site} t={t} lang="en" onClose={onClose} />);
      await waitFor(() => expect(document.body.style.overflow).toBe("hidden"));

      rerender(<RoutePlannerDetailsModal open={false} candidate={site} t={t} lang="en" onClose={onClose} />);
      expect(document.body.style.overflow).toBe("");
      expect(document.body.style.paddingRight).toBe("");
    }
  });
});
