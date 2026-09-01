import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import NorthernLightsMap from "./NorthernLightsMap";

vi.mock("../MapView", () => ({
  default: (props) => (
    <div data-testid="real-map" data-mode={props.mode}>
      {props.selectedId}
    </div>
  ),
}));

class FakeIntersectionObserver {
  constructor(cb) {
    this.cb = cb;
  }
  observe() {
    this.cb([{ isIntersecting: true }]);
  }
  disconnect() {}
}

const t = (k) => k;

beforeEach(() => {
  vi.stubGlobal("IntersectionObserver", FakeIntersectionObserver);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("NorthernLightsMap", () => {
  it("mounts the real map once the container intersects the viewport", async () => {
    render(
      <NorthernLightsMap
        locations={[{ id: "a", name: "A", lat: 1, lon: 2 }]}
        selectedId="a"
        onSelect={() => {}}
        lang="is"
        t={t}
        theme="light"
      />,
    );
    expect(await screen.findByTestId("real-map")).toHaveTextContent("a");
  });

  it("#397: always renders MapView in explicit Aurora presentation mode, never the default generic-weather mode", async () => {
    render(
      <NorthernLightsMap
        locations={[{ id: "a", name: "A", lat: 1, lon: 2, band: "excellent" }]}
        selectedId="a"
        onSelect={() => {}}
        lang="is"
        t={t}
        theme="light"
      />,
    );
    const map = await screen.findByTestId("real-map");
    expect(map.dataset.mode).toBe("aurora");
  });
});
