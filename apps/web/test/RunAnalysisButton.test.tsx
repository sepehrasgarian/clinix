import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fixtureClinic } from "@clinix/contracts/fixtures";
import { RunAnalysisButton } from "@/components/dashboard/RunAnalysisButton";

const push = vi.fn();
const startAnalysis = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("@/lib/api", () => ({ startAnalysis: (...a: unknown[]) => startAnalysis(...a) }));

beforeEach(() => { push.mockClear(); startAnalysis.mockReset(); localStorage.clear(); });

describe("RunAnalysisButton", () => {
  it("starts one analysis, remembers it for setup and opens setup, ignoring a second click while it runs", async () => {
    startAnalysis.mockResolvedValue({ id: "analysis_new" });
    render(<RunAnalysisButton clinic={fixtureClinic} />);
    const button = screen.getByRole("button", { name: "Run new analysis" });
    fireEvent.click(button);
    expect(button).toBeDisabled();
    fireEvent.click(button);
    await waitFor(() => expect(push).toHaveBeenCalledWith("/start"));
    expect(startAnalysis).toHaveBeenCalledTimes(1);
    expect(startAnalysis).toHaveBeenCalledWith(fixtureClinic.id);
    expect(JSON.parse(localStorage.getItem("clinix.onboarding")!)).toMatchObject({ analysisId: "analysis_new", claimed: true });
  });
  it("shows the failure and lets the owner try again", async () => {
    startAnalysis.mockRejectedValue(new Error("Try again in a minute."));
    render(<RunAnalysisButton clinic={fixtureClinic} />);
    fireEvent.click(screen.getByRole("button", { name: "Run new analysis" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Try again in a minute.");
    expect(push).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Run new analysis" })).toBeEnabled();
  });
});
