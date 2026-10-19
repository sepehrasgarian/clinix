import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { FoundStage } from "@/components/onboarding/FoundStage";
import { fixtureAnalysis } from "@clinix/contracts/fixtures";

const analysis = { ...fixtureAnalysis, status: "awaiting_services" as const };

describe("FoundStage", () => {
  it("shows the account gate to guests and calls onCreateAccount", () => {
    const onCreateAccount = vi.fn();
    render(<FoundStage analysis={analysis} guest onCreateAccount={onCreateAccount} onContinue={vi.fn()} />);
    expect(screen.getByText(/create a free account to choose competitors/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /create a free account/i }));
    expect(onCreateAccount).toHaveBeenCalledOnce();
    expect(screen.queryByRole("button", { name: /find my competitors/i })).toBeNull();
  });
  it("lets a signed-in owner edit services and continue", () => {
    const onContinue = vi.fn();
    render(<FoundStage analysis={analysis} onContinue={onContinue} />);
    fireEvent.click(screen.getByRole("button", { name: /remove cleaning/i }));
    fireEvent.click(screen.getByRole("button", { name: /find my competitors/i }));
    expect(onContinue).toHaveBeenCalledWith(expect.not.arrayContaining(["cleaning"]));
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(/market overview/i);
  });
  it("says so when nothing measured stands out", () => {
    render(<FoundStage analysis={{ ...analysis, scan: { ...analysis.scan!, hints: [] } }} onContinue={vi.fn()} />);
    expect(screen.getByText(/nothing measured stands out yet/i)).toBeInTheDocument();
  });
});
