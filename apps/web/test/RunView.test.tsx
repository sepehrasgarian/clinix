import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { fixtureAnalysis, fixtureClinic } from "@clinix/contracts/fixtures";
import { RunView } from "@/components/report/RunView";

describe("RunView", () => {
  it("while running: progress ring, the live line, who is being read, and what comes out", () => {
    const running = { ...fixtureAnalysis, status: "running" as const, phases: [{ phase: "reviews" as const, status: "done" as const, startedAt: "2026-10-19T15:00:00.000Z", finishedAt: "2026-10-19T15:00:30.000Z" }, { phase: "mine" as const, status: "running" as const, startedAt: "2026-10-19T15:00:30.000Z" }, { phase: "synthesize" as const, status: "pending" as const }] };
    render(<RunView clinic={fixtureClinic} analysis={running} onRefresh={vi.fn()} />);
    expect(screen.getByText("33%")).toBeInTheDocument();
    expect(screen.getByTestId("waiting-radar")).toBeInTheDocument();
    expect(screen.getByText("Yonge Smile Studio")).toBeInTheDocument();
    expect(screen.getByText(/4 competitors you confirmed/)).toBeInTheDocument();
    expect(screen.getByText("Findings with evidence")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /open the report/i })).toBeNull();
  });
  it("when done: the button to open the report", () => {
    render(<RunView clinic={fixtureClinic} analysis={fixtureAnalysis} onRefresh={vi.fn()} />);
    expect(screen.getByRole("link", { name: /open the report/i })).toHaveAttribute("href", "/app/clinics/clinic_demo/findings");
    expect(screen.getByText("100%")).toBeInTheDocument();
  });
  it("when failed: the error and a retry button", () => {
    render(<RunView clinic={fixtureClinic} analysis={{ ...fixtureAnalysis, status: "failed", error: "This step was interrupted. Press retry to run it again." }} onRefresh={vi.fn()} />);
    expect(screen.getByRole("alert")).toHaveTextContent(/interrupted/);
    expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument();
  });
});
