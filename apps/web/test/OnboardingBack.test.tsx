import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { fixtureAnalysis, fixtureClinic } from "@clinix/contracts/fixtures";
import { ClinicForm } from "@/components/onboarding/ClinicForm";
import { CompetitorsStage } from "@/components/onboarding/CompetitorsStage";
import { FoundStage } from "@/components/onboarding/FoundStage";

describe("Back on the setup steps", () => {
  it("What we found: Back calls onBack instead of reloading", () => {
    const onBack = vi.fn();
    render(<FoundStage analysis={{ ...fixtureAnalysis, status: "awaiting_services" }} onContinue={vi.fn()} onBack={onBack} />);
    fireEvent.click(screen.getByRole("button", { name: /back to your clinic/i }));
    expect(onBack).toHaveBeenCalledOnce();
  });
  it("Competitors: Back goes to What we found", () => {
    const onBack = vi.fn();
    render(<CompetitorsStage analysis={{ ...fixtureAnalysis, status: "awaiting_competitors" }} disciplines={["dentistry"]} onConfirm={vi.fn()} onBack={onBack} />);
    fireEvent.click(screen.getByRole("button", { name: /back to what we found/i }));
    expect(onBack).toHaveBeenCalledOnce();
  });
  it("Your clinic: coming back shows the chosen listing and disciplines prefilled", () => {
    render(<ClinicForm onSubmit={vi.fn()} initial={{ clinic: fixtureClinic, place: fixtureAnalysis.scan!.place }} search={vi.fn(async () => [])} marketCard={vi.fn(async () => ({ nearby: 3 }))} />);
    expect(screen.getByTestId("listing-card")).toHaveTextContent(fixtureClinic.name);
    expect(screen.getAllByTestId("chosen-discipline")[0]).toHaveTextContent("Dentistry");
    expect(screen.getByRole("button", { name: /save and continue/i })).toBeEnabled();
  });
});
