// Ticket #436 correction round (v2, F-A/F-B, Jonesy condition E1) —
// HazardSourceNote had no test file at all before this round. This is the
// only new file this correction prompt permits. Per E1: select the copy
// paragraph structurally (link.closest("p")), not by dictionary text, and
// hard-code the literal IS/EN strings rather than reading them back from
// the translation dictionary (that tautology is exactly what hid F-A).
import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import HazardSourceNote from "./HazardSourceNote";
import { translations } from "../i18n/translations";

const tEn = (k) => translations.en[k] ?? k;
const tIs = (k) => translations.is[k] ?? k;

const EN_COPY =
  "About this weather assessment: Caution indicators are calculated by Eltum Veðrið and are not official weather warnings. Check official warnings at vedur.is.";
const IS_COPY =
  "Um veðurmatið: Varúðarmerkingar eru reiknað mat Eltum Veðrið, ekki opinberar veðurviðvaranir. Skoðaðu opinberar viðvaranir á vedur.is.";

function normalize(text) {
  return text.replace(/\s+/g, " ").trim();
}

describe("HazardSourceNote — exact issue copy (F-A/F-B)", () => {
  it("EN: the copy paragraph's normalized text equals the literal issue copy exactly", () => {
    render(<HazardSourceNote t={tEn} />);
    const link = screen.getByRole("link", { name: "vedur.is" });
    const p = link.closest("p");
    expect(p).not.toBeNull();
    expect(normalize(p.textContent)).toBe(EN_COPY);
  });

  it("IS: the copy paragraph's normalized text equals the literal issue copy exactly", () => {
    render(<HazardSourceNote t={tIs} />);
    const link = screen.getByRole("link", { name: "vedur.is" });
    const p = link.closest("p");
    expect(p).not.toBeNull();
    expect(normalize(p.textContent)).toBe(IS_COPY);
  });
});

describe("HazardSourceNote — sr-only new-tab description sits outside the copy paragraph (F-A)", () => {
  it("EN: the described-by element exists, holds the correct new-tab text, and is not a descendant of the copy <p>", () => {
    render(<HazardSourceNote t={tEn} />);
    const link = screen.getByRole("link", { name: "vedur.is" });
    const p = link.closest("p");
    const describedId = link.getAttribute("aria-describedby");
    expect(describedId).toBeTruthy();
    const describedEl = document.getElementById(describedId);
    expect(describedEl).not.toBeNull();
    expect(describedEl.textContent).toBe("Opens in a new tab");
    expect(p.contains(describedEl)).toBe(false);
  });

  it("IS: the described-by element exists, holds the correct new-tab text, and is not a descendant of the copy <p>", () => {
    render(<HazardSourceNote t={tIs} />);
    const link = screen.getByRole("link", { name: "vedur.is" });
    const p = link.closest("p");
    const describedId = link.getAttribute("aria-describedby");
    const describedEl = document.getElementById(describedId);
    expect(describedEl).not.toBeNull();
    expect(describedEl.textContent).toBe("Opnast í nýjum flipa");
    expect(p.contains(describedEl)).toBe(false);
  });
});

describe("HazardSourceNote — two hosts mounted together (E1 unique-association requirement)", () => {
  it("each link's aria-describedby resolves to an element inside its own host container, the two ids differ, and neither is a descendant of any copy <p>", () => {
    render(
      <div>
        <div data-testid="host-a">
          <HazardSourceNote t={tEn} />
        </div>
        <div data-testid="host-b">
          <HazardSourceNote t={tEn} />
        </div>
      </div>
    );

    const hostA = screen.getByTestId("host-a");
    const hostB = screen.getByTestId("host-b");
    const linkA = hostA.querySelector('a[href="https://www.vedur.is/"]');
    const linkB = hostB.querySelector('a[href="https://www.vedur.is/"]');

    const idA = linkA.getAttribute("aria-describedby");
    const idB = linkB.getAttribute("aria-describedby");
    expect(idA).toBeTruthy();
    expect(idB).toBeTruthy();
    expect(idA).not.toBe(idB);

    const describedA = document.getElementById(idA);
    const describedB = document.getElementById(idB);
    expect(hostA.contains(describedA)).toBe(true);
    expect(hostB.contains(describedA)).toBe(false);
    expect(hostB.contains(describedB)).toBe(true);
    expect(hostA.contains(describedB)).toBe(false);

    const pA = linkA.closest("p");
    const pB = linkB.closest("p");
    expect(pA.contains(describedA)).toBe(false);
    expect(pB.contains(describedB)).toBe(false);
  });
});
