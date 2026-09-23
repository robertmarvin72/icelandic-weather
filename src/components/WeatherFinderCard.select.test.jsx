// Ticket 415 (#415) — WeatherFinderCard's place-name selection control.
import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import WeatherFinderCard from "./WeatherFinderCard";

const t = (k) => k;

function baseResult(overrides = {}) {
  return {
    id: "site-7",
    name: "Þingvellir",
    metrics: { avgWind: 3.4, avgTemp: 12.1, rainDays: 1 },
    ...overrides,
  };
}

describe("WeatherFinderCard — Ticket 415 (#415): place-name is a real interactive control", () => {
  it("renders a real type=button element for the place name when onSelect and result.id are both present", () => {
    render(<WeatherFinderCard result={baseResult()} rank={1} mode="calmest" units="metric" t={t} onSelect={vi.fn()} />);
    const btn = screen.getByRole("button", { name: /Þingvellir/ });
    expect(btn.tagName).toBe("BUTTON");
    expect(btn).toHaveAttribute("type", "button");
  });

  it("clicking the name calls onSelect with the exact result object", () => {
    const onSelect = vi.fn();
    const result = baseResult();
    render(<WeatherFinderCard result={result} rank={1} mode="calmest" units="metric" t={t} onSelect={onSelect} />);
    fireEvent.click(screen.getByRole("button", { name: /Þingvellir/ }));
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(result);
  });

  it("the accessible name contains the actual place name", () => {
    render(<WeatherFinderCard result={baseResult({ name: "Skaftafell" })} rank={2} mode="warmest" units="metric" t={t} onSelect={vi.fn()} />);
    expect(screen.getByRole("button", { name: /Skaftafell/ })).toBeInTheDocument();
  });

  it("the decorative arrow is hidden from the accessible name (aria-hidden)", () => {
    render(<WeatherFinderCard result={baseResult()} rank={1} mode="calmest" units="metric" t={t} onSelect={vi.fn()} />);
    const btn = screen.getByRole("button", { name: /Þingvellir/ });
    const arrow = btn.querySelector('[aria-hidden="true"]');
    expect(arrow).not.toBeNull();
    expect(arrow.textContent).toBe("→");
  });

  it("repeated intentional clicks each count once", () => {
    const onSelect = vi.fn();
    render(<WeatherFinderCard result={baseResult()} rank={1} mode="calmest" units="metric" t={t} onSelect={onSelect} />);
    const btn = screen.getByRole("button", { name: /Þingvellir/ });
    fireEvent.click(btn);
    fireEvent.click(btn);
    expect(onSelect).toHaveBeenCalledTimes(2);
  });

  it("the row/panel itself has no click handler — only the name control is interactive", () => {
    const onSelect = vi.fn();
    const { container } = render(<WeatherFinderCard result={baseResult()} rank={1} mode="calmest" units="metric" t={t} onSelect={onSelect} />);
    const row = container.firstChild;
    fireEvent.click(row);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("the metric text still renders correctly alongside the interactive name", () => {
    render(<WeatherFinderCard result={baseResult()} rank={1} mode="calmest" units="metric" t={t} onSelect={vi.fn()} />);
    expect(screen.getByText(/3\.4 m\/s/)).toBeInTheDocument();
  });
});

describe("WeatherFinderCard — Ticket 415 (#415): missing id or unavailable callback falls back to plain text", () => {
  it("no onSelect prop at all: renders plain, non-interactive text, no button, no crash", () => {
    render(<WeatherFinderCard result={baseResult()} rank={1} mode="calmest" units="metric" t={t} />);
    expect(screen.queryByRole("button", { name: /Þingvellir/ })).toBeNull();
    expect(screen.getByText("Þingvellir")).toBeInTheDocument();
  });

  it("onSelect present but result.id is empty string: falls back to plain text", () => {
    const onSelect = vi.fn();
    render(<WeatherFinderCard result={baseResult({ id: "" })} rank={1} mode="calmest" units="metric" t={t} onSelect={onSelect} />);
    expect(screen.queryByRole("button")).toBeNull();
    fireEvent.click(screen.getByText("Þingvellir"));
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("onSelect present but result.id is null: falls back to plain text", () => {
    render(<WeatherFinderCard result={baseResult({ id: null })} rank={1} mode="calmest" units="metric" t={t} onSelect={vi.fn()} />);
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("onSelect is not a function (e.g. a stray truthy value): falls back to plain text", () => {
    render(<WeatherFinderCard result={baseResult()} rank={1} mode="calmest" units="metric" t={t} onSelect={"not-a-function"} />);
    expect(screen.queryByRole("button")).toBeNull();
  });
});

describe("WeatherFinderCard — Ticket 415 (#415): works across all three modes", () => {
  it.each(["calmest", "warmest", "driest"])("%s: the name is still selectable and calls onSelect", (mode) => {
    const onSelect = vi.fn();
    const result = baseResult();
    render(<WeatherFinderCard result={result} rank={1} mode={mode} units="metric" t={t} onSelect={onSelect} />);
    fireEvent.click(screen.getByRole("button", { name: /Þingvellir/ }));
    expect(onSelect).toHaveBeenCalledWith(result);
  });
});
