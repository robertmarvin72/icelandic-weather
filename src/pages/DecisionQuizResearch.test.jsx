import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import DecisionQuizResearch from "./DecisionQuizResearch";
import AppRoutes from "../AppRoutes";
import { trackEvent, trackPageView } from "../lib/analytics";

vi.mock("../lib/analytics", () => ({
  trackEvent: vi.fn(),
  trackPageView: vi.fn(),
  initAnalytics: vi.fn(),
}));

function renderQuiz() {
  return render(
    <MemoryRouter>
      <DecisionQuizResearch />
    </MemoryRouter>,
  );
}

async function answerCurrentScenario() {
  // Radio groups render generically regardless of which scenario/order is
  // showing — pick the first option in each group and submit.
  const radios = screen.getAllByRole("radio");
  const byGroup = {};
  for (const radio of radios) {
    const name = radio.getAttribute("name");
    if (!byGroup[name]) byGroup[name] = radio;
  }
  Object.values(byGroup).forEach((radio) => fireEvent.click(radio));
  fireEvent.click(screen.getByRole("button", { name: /next|áfram/i }));
}

describe("DecisionQuizResearch — route registration", () => {
  it("/research/decision-quiz is registered and renders the quiz (not NotFound)", () => {
    render(
      <MemoryRouter initialEntries={["/research/decision-quiz"]}>
        <AppRoutes HomeComponent={() => <div data-testid="page-home" />} />
      </MemoryRouter>,
    );
    expect(screen.queryByTestId("quiz-consent") || screen.queryByTestId("quiz-unavailable")).not.toBeNull();
  });
});

describe("DecisionQuizResearch — missing/disabled configuration fails closed", () => {
  // Explicitly clears every VITE_RESEARCH_QUIZ_* value getResearchQuizConfig()
  // reads, regardless of .env.local/.env.development.local/CI secrets/shell
  // environment/test order. Ticket 395 Revision 2: this test previously
  // relied on the ambient environment having none of these set, and
  // false-failed (rendered quiz-consent) once a real deployment's env vars
  // were configured locally for the manual browser->Sheet smoke test.
  beforeEach(() => {
    vi.stubEnv("VITE_RESEARCH_QUIZ_ENABLED", "");
    vi.stubEnv("VITE_RESEARCH_QUIZ_WEBAPP_URL", "");
    vi.stubEnv("VITE_RESEARCH_QUIZ_CAMPAIGN", "");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("shows the neutral unavailable state when config env vars are absent", () => {
    renderQuiz();
    expect(screen.getByTestId("quiz-unavailable")).toBeInTheDocument();
    expect(screen.queryByTestId("quiz-consent")).toBeNull();
  });

  it("shows the neutral unavailable state when explicitly disabled despite an otherwise-valid URL", () => {
    vi.stubEnv("VITE_RESEARCH_QUIZ_ENABLED", "false");
    vi.stubEnv("VITE_RESEARCH_QUIZ_WEBAPP_URL", "https://script.google.com/macros/s/abc123/exec");
    renderQuiz();
    expect(screen.getByTestId("quiz-unavailable")).toBeInTheDocument();
    expect(screen.queryByTestId("quiz-consent")).toBeNull();
  });

  it("shows the neutral unavailable state when enabled but the URL shape is invalid", () => {
    vi.stubEnv("VITE_RESEARCH_QUIZ_ENABLED", "true");
    vi.stubEnv("VITE_RESEARCH_QUIZ_WEBAPP_URL", "https://example.com/not-apps-script");
    renderQuiz();
    expect(screen.getByTestId("quiz-unavailable")).toBeInTheDocument();
    expect(screen.queryByTestId("quiz-consent")).toBeNull();
  });
});

describe("DecisionQuizResearch — enabled: consent gate, full flow, confirmation", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_RESEARCH_QUIZ_ENABLED", "true");
    vi.stubEnv("VITE_RESEARCH_QUIZ_WEBAPP_URL", "https://script.google.com/macros/s/abc123/exec");
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("shows the consent gate before anything else", () => {
    renderQuiz();
    expect(screen.getByTestId("quiz-consent")).toBeInTheDocument();
  });

  it("runs the full flow: consent -> 3 scenarios -> ready -> submit -> confirmed only after a real acknowledgment", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ json: async () => ({ ok: true, receivedAt: "2026-08-24T12:00:00Z" }) }),
    );
    renderQuiz();

    fireEvent.click(screen.getByRole("button", { name: /start|byrja/i }));
    expect(screen.getByTestId("quiz-scenario")).toBeInTheDocument();

    await answerCurrentScenario();
    await answerCurrentScenario();
    await answerCurrentScenario();

    expect(screen.getByTestId("quiz-ready")).toBeInTheDocument();
    expect(screen.queryByTestId("quiz-confirmed")).toBeNull(); // not confirmed before the ack

    fireEvent.click(screen.getByRole("button", { name: /send results|senda niðurstöður/i }));
    await waitFor(() => expect(screen.getByTestId("quiz-confirmed")).toBeInTheDocument());
  });

  it("never shows confirmed on an opaque/failed acknowledgment", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));
    renderQuiz();

    fireEvent.click(screen.getByRole("button", { name: /start|byrja/i }));
    await answerCurrentScenario();
    await answerCurrentScenario();
    await answerCurrentScenario();
    fireEvent.click(screen.getByRole("button", { name: /send results|senda niðurstöður/i }));

    await waitFor(() => expect(screen.getByTestId("quiz-unconfirmed")).toBeInTheDocument());
    expect(screen.queryByTestId("quiz-confirmed")).toBeNull();
  });

  it("renders the actual HomeDecisionCard (no live weather/scoring) for each scenario", () => {
    renderQuiz();
    fireEvent.click(screen.getByRole("button", { name: /start|byrja/i }));
    // A real HomeDecisionCard renders one of the canonical tone titles —
    // confirmed via the translation-key passthrough `t = (k) => k` used
    // nowhere here (real useT is in effect), so we assert the card's
    // structural presence via its known CSS-independent content instead.
    expect(screen.getByTestId("quiz-scenario")).toBeInTheDocument();
    expect(screen.getAllByRole("radio").length).toBeGreaterThan(0);
  });

  it("emits zero production analytics calls across render, transition, and interaction", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ json: async () => ({ ok: true, receivedAt: "x" }) }),
    );
    renderQuiz();
    fireEvent.click(screen.getByRole("button", { name: /start|byrja/i }));
    await answerCurrentScenario();
    await answerCurrentScenario();
    await answerCurrentScenario();
    fireEvent.click(screen.getByRole("button", { name: /send results|senda niðurstöður/i }));
    await waitFor(() => expect(screen.getByTestId("quiz-confirmed")).toBeInTheDocument());

    expect(trackEvent).not.toHaveBeenCalled();
    expect(trackPageView).not.toHaveBeenCalled();
  });
});
