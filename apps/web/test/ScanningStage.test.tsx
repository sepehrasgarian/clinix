import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { fixtureAnalysis } from "@clinix/contracts/fixtures";
import { ScanningStage } from "@/components/onboarding/ScanningStage";

const clinic = { name: "Réhabital", address: "1 Rue Test, Montréal", website: "https://rehabital.example" };
const running = (phases: typeof fixtureAnalysis.phases) => ({ ...fixtureAnalysis, scan: undefined, stage: "quick_scan" as const, status: "running" as const, phases });

describe("ScanningStage", () => {
  it("shows the clinic, the three steps and waiting placeholders before the scan has results", () => {
    render(<ScanningStage analysis={running([{ phase: "validate", status: "done" }, { phase: "enrich", status: "running", startedAt: new Date().toISOString() }])} clinic={clinic} onRetry={vi.fn()} />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("We're building your clinic intelligence");
    expect(screen.getByTestId("clinic-card")).toHaveTextContent("Réhabital");
    const steps = within(screen.getByTestId("scan-timeline")).getAllByRole("heading", { level: 3 });
    expect(steps).toHaveLength(3);
    expect(screen.getByText("In progress")).toBeInTheDocument();
    expect(screen.getAllByText("Reading…").length).toBeGreaterThan(0);
    expect(screen.queryByRole("alert")).toBeNull();
  });
  it("shows the measured facts and the first hint once the scan is in", () => {
    render(<ScanningStage analysis={{ ...fixtureAnalysis, stage: "quick_scan", status: "running" }} clinic={clinic} onRetry={vi.fn()} />);
    expect(screen.getByText("Already spotted")).toBeInTheDocument();
    expect(screen.getByText(fixtureAnalysis.scan!.hints[0].text)).toBeInTheDocument();
  });
  it("shows a clear error and a Retry button when a step failed", () => {
    const onRetry = vi.fn();
    const failed = { ...fixtureAnalysis, stage: "discovery" as const, status: "failed" as const, error: "This step was interrupted. Press retry to run it again.", phases: [{ phase: "discover" as const, status: "failed" as const, error: "This step was interrupted. Press retry to run it again." }] };
    render(<ScanningStage analysis={failed} clinic={clinic} onRetry={onRetry} />);
    expect(screen.getByRole("alert")).toHaveTextContent(/interrupted/);
    fireEvent.click(screen.getAllByRole("button", { name: /try again/i })[0]);
    expect(onRetry).toHaveBeenCalledOnce();
  });
  it("goes back to the clinic details", () => {
    const onBack = vi.fn();
    render(<ScanningStage analysis={running([])} clinic={clinic} onRetry={vi.fn()} onBack={onBack} />);
    fireEvent.click(screen.getByRole("button", { name: /back to/i }));
    expect(onBack).toHaveBeenCalledOnce();
  });
});
