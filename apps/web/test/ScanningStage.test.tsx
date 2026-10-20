import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { fixtureAnalysis } from "@clinix/contracts/fixtures";
import { ScanningStage } from "@/components/onboarding/ScanningStage";

describe("ScanningStage", () => {
  it("shows a clear error and a Retry button in the card when a stage failed", () => {
    const onRetry = vi.fn();
    const failed = { ...fixtureAnalysis, stage: "discovery" as const, status: "failed" as const, error: "This step was interrupted. Press retry to run it again.", phases: [{ phase: "discover" as const, status: "failed" as const, error: "This step was interrupted. Press retry to run it again." }] };
    render(<ScanningStage analysis={failed} onRetry={onRetry} />);
    expect(screen.getByRole("alert")).toHaveTextContent(/interrupted/);
    const buttons = screen.getAllByRole("button", { name: /try again/i });
    expect(buttons.length).toBeGreaterThanOrEqual(1);
    fireEvent.click(buttons[0]);
    expect(onRetry).toHaveBeenCalledOnce();
    expect(screen.queryByTestId("waiting-radar")).toBeNull();
  });
  it("shows the radar and no error while running", () => {
    const running = { ...fixtureAnalysis, stage: "discovery" as const, status: "running" as const, phases: [{ phase: "discover" as const, status: "running" as const, startedAt: new Date().toISOString() }] };
    render(<ScanningStage analysis={running} onRetry={vi.fn()} />);
    expect(screen.getByTestId("waiting-radar")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).toBeNull();
  });
});
