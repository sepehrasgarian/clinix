import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Analysis } from "@clinix/contracts";
import { fixtureAnalysis, fixtureClinic } from "@clinix/contracts/fixtures";
import { RunView } from "@/components/report/RunView";

const retry = vi.fn();
vi.mock("@/lib/api", async (orig) => ({ ...(await orig<typeof import("@/lib/api")>()), retryAnalysis: (...a: unknown[]) => retry(...a) }));

const at = (s: string) => `2026-10-19T15:${s}.000Z`;
const running = (phases: Analysis["phases"]): Analysis => ({ ...fixtureAnalysis, status: "running", stage: "deep", phases });

describe("RunView", () => {
  beforeEach(() => retry.mockReset());

  it("shows the real stages: completed with its measured time, the one running, the rest pending, and no invented percentage", () => {
    render(<RunView clinic={fixtureClinic} analysis={running([{ phase: "reviews", status: "done", startedAt: at("00:00"), finishedAt: at("01:12") }, { phase: "websites", status: "running", startedAt: at("01:12") }])} onRefresh={vi.fn()} />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Your analysis is in progress");
    expect(screen.getByRole("img", { name: "1 of 5 steps completed" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Analyzing competitor websites" })).toBeInTheDocument();
    const stages = screen.getByRole("region", { name: "Stages" });
    expect(within(stages).getAllByRole("listitem")).toHaveLength(5);
    expect(within(stages).getByText("Completed")).toBeInTheDocument();
    expect(within(stages).getByText("1m 12s")).toBeInTheDocument();
    expect(within(stages).getByText("In progress")).toBeInTheDocument();
    expect(within(stages).getByText(/01/)).toBeInTheDocument();
    expect(within(stages).getAllByText("Pending")).toHaveLength(3);
    expect(screen.queryByText(/%/)).toBeNull();
  });

  it("lists who is being read with only what is known, five first and all on request", () => {
    const many = { ...fixtureAnalysis.discovery!, candidates: Array.from({ length: 8 }, (_, i) => ({ ...fixtureAnalysis.discovery!.candidates[0], place: { ...fixtureAnalysis.discovery!.candidates[0].place, placeId: `p${i}`, name: `Clinic ${i}` } })), selectedPlaceIds: Array.from({ length: 8 }, (_, i) => `p${i}`) };
    render(<RunView clinic={fixtureClinic} analysis={{ ...running([]), discovery: many }} onRefresh={vi.fn()} />);
    expect(screen.getByText("8 clinics")).toBeInTheDocument();
    expect(screen.getByText("Clinic 4")).toBeInTheDocument();
    expect(screen.queryByText("Clinic 5")).toBeNull();
    expect(screen.queryByText(/Reviews analyzed|In queue/)).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /View all 8 competitors/ }));
    expect(screen.getByText("Clinic 7")).toBeInTheDocument();
  });

  it("says what comes out, and does not promise notifications it cannot send", () => {
    render(<RunView clinic={fixtureClinic} analysis={running([])} onRefresh={vi.fn()} />);
    for (const t of ["Findings with evidence", "Your clinic scorecard", "Prioritized action plan", "Insights by discipline"]) expect(screen.getByText(t)).toBeInTheDocument();
    expect(screen.getByText("You can safely leave this page")).toBeInTheDocument();
    expect(screen.queryByText(/we'll (email|notify)/i)).toBeNull();
    expect(screen.getByRole("link", { name: /Back to dashboard/ })).toHaveAttribute("href", "/app/clinics/clinic_demo");
  });

  it("when done: the success state with a way to the report and the dashboard, and no progress", () => {
    render(<RunView clinic={fixtureClinic} analysis={fixtureAnalysis} onRefresh={vi.fn()} />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Your analysis is ready");
    expect(screen.getByRole("link", { name: /view my report/i })).toHaveAttribute("href", "/app/clinics/clinic_demo/findings");
    expect(screen.getByRole("link", { name: "Go to dashboard" })).toHaveAttribute("href", "/app/clinics/clinic_demo");
    expect(screen.queryByRole("region", { name: "Stages" })).toBeNull();
  });

  it("when failed: says so plainly, marks the stopped stage, shows no spinner or 'running', and retries from there", async () => {
    const onRefresh = vi.fn();
    const failed: Analysis = { ...running([{ phase: "reviews", status: "done", startedAt: at("00:00"), finishedAt: at("01:00") }, { phase: "websites", status: "failed", error: "This step was interrupted." }]), status: "failed", error: "This step was interrupted." };
    render(<RunView clinic={fixtureClinic} analysis={failed} onRefresh={onRefresh} />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("We couldn't finish preparing your report");
    expect(screen.getByText(/Your completed analysis steps have been saved/)).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Analyzing competitor websites" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "1 of 5 steps completed" })).toBeInTheDocument();
    expect(screen.getAllByText("Stopped").length).toBeGreaterThan(0);
    expect(screen.queryByText(/is running|Running for|In progress/)).toBeNull();
    expect(screen.queryByText("You can safely leave this page")).toBeNull();
    expect(screen.getAllByRole("link", { name: "Back to dashboard" })).toHaveLength(2);
    retry.mockResolvedValueOnce({});
    fireEvent.click(screen.getByRole("button", { name: /try again/i }));
    await waitFor(() => expect(onRefresh).toHaveBeenCalledOnce());
    retry.mockRejectedValueOnce(new Error("Another run is already going."));
    fireEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Another run is already going.");
  });

  it("a stage still marked running on a run that has stopped is shown as stopped, not as working", () => {
    const interrupted: Analysis = { ...running([{ phase: "reviews", status: "done" }, { phase: "websites", status: "running", startedAt: at("01:00") }]), status: "failed", error: "This step was interrupted. Press retry to run it again." };
    render(<RunView clinic={fixtureClinic} analysis={interrupted} onRefresh={vi.fn()} />);
    const stages = screen.getByRole("region", { name: "Stages" });
    expect(within(stages).getByText("Stopped")).toBeInTheDocument();
    expect(within(stages).queryByText("In progress")).toBeNull();
    expect(screen.getByRole("button", { name: /try again/i })).toBeEnabled();
  });
});
