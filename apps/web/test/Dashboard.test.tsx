import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fixtureAnalysis, fixtureClinic, fixtureReport } from "@clinix/contracts/fixtures";
import type { Analysis } from "@clinix/contracts";
import { Dashboard } from "@/components/report/Dashboard";
import { competitorRows, kpiList, opportunityCount, resolveDashboard, stageRows, topOpportunities } from "@/lib/dashboard";

const refresh = vi.fn();
const retryAnalysis = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
vi.mock("@/lib/api", () => ({ retryAnalysis: (...a: unknown[]) => retryAnalysis(...a), startAnalysis: vi.fn(), logoUrl: () => "/logo.png" }));

const done = { ...fixtureAnalysis, report: fixtureReport };
const phase = (p: Analysis["phases"][number]["phase"], status: Analysis["phases"][number]["status"]) => ({ phase: p, status });
const deepPhases = (...s: Analysis["phases"][number]["status"][]) => (["reviews", "websites", "mine", "synthesize"] as const).map((p, i) => phase(p, s[i] ?? "pending"));
const newer = (over: Partial<Analysis>): Analysis => ({ ...fixtureAnalysis, id: "analysis_new", report: undefined, createdAt: "2026-10-22T10:00:00.000Z", status: "running", ...over });

beforeEach(() => { refresh.mockClear(); retryAnalysis.mockReset(); });

describe("resolveDashboard", () => {
  it("is empty before any analysis exists", () => {
    expect(resolveDashboard([])).toEqual({ hero: { kind: "none" }, latest: null });
  });
  it("lets a newer failed analysis lead while the previous report stays the latest completed one", () => {
    const r = resolveDashboard([done, newer({ status: "failed" })]);
    expect(r.hero.kind).toBe("failed");
    expect(r.latest?.analysis.id).toBe(done.id);
  });
  it("treats awaiting steps as setup, queued as waiting and running as processing", () => {
    expect(resolveDashboard([newer({ status: "awaiting_services" })]).hero.kind).toBe("setup");
    expect(resolveDashboard([newer({ status: "queued" })]).hero).toMatchObject({ kind: "processing", queued: true });
    expect(resolveDashboard([newer({ status: "running" })]).hero).toMatchObject({ kind: "processing", queued: false });
  });
});

describe("stageRows", () => {
  it("never shows a stage as running on a failed run and marks only the stopped one", () => {
    const rows = stageRows(newer({ status: "failed", phases: deepPhases("done", "running", "pending", "pending") }));
    expect(rows.map((r) => r.status)).toEqual(["done", "failed", "pending", "pending"]);
  });
  it("marks the next pending stage as stopped when none was running", () => {
    const rows = stageRows(newer({ status: "failed", phases: deepPhases("done", "done") }));
    expect(rows.map((r) => r.status)).toEqual(["done", "done", "failed", "pending"]);
  });
});

describe("stageRows for a run that stopped during setup", () => {
  it("shows the setup steps, not the deep-analysis ones", () => {
    const rows = stageRows(newer({ stage: "discovery", status: "failed", phases: [phase("validate", "done"), phase("enrich", "done"), phase("understand", "running"), phase("discover", "pending")] }));
    expect(rows.map((r) => r.status)).toEqual(["done", "done", "failed", "pending"]);
    expect(rows[2].title).toBe("Reading your website");
  });
});

describe("kpiList", () => {
  it("derives position, rating, reviews and opportunities from the report, with trends only when a comparison exists", () => {
    const withDiff = { ...fixtureReport, diff: { previousAnalysisId: "p", previousGeneratedAt: "2026-09-19T15:00:00.000Z", ratingDelta: 0.2, reviewCountDelta: -3, newFindingIds: [], resolvedFindingIds: [], completedRecommendationIds: [], summary: "s" } };
    const k = kpiList({ analysis: done, report: withDiff }, "Finch East Family Dental");
    expect(k.find((x) => x.key === "position")?.value).toBe("#5 of 5");
    expect(k.find((x) => x.key === "opportunities")?.value).toBe(String(opportunityCount(fixtureReport)));
    expect(k.find((x) => x.key === "rating")?.trend).toEqual({ text: "+0.2 vs. last analysis", direction: "up" });
    expect(k.find((x) => x.key === "reviews")?.trend).toEqual({ text: "−3 vs. last analysis", direction: "down" });
    const plain = kpiList({ analysis: done, report: { ...fixtureReport, diff: undefined } }, "Finch East Family Dental");
    expect(plain.every((x) => x.trend === undefined)).toBe(true);
  });
  it("leaves out a figure the report cannot support instead of showing it empty", () => {
    const noRating = { ...done, scan: { ...done.scan!, place: { ...done.scan!.place, rating: undefined } } };
    expect(kpiList({ analysis: noRating, report: fixtureReport }, "Finch East Family Dental").map((x) => x.key)).not.toContain("rating");
  });
  it("shows at most three opportunities, none of them done", () => {
    const top = topOpportunities(fixtureReport);
    expect(top).toHaveLength(3);
    expect(top.every((o) => o.rec.status !== "done")).toBe(true);
  });
});

describe("competitorRows", () => {
  it("never lists the clinic itself as its own competitor", () => {
    const own = done.scan!.place.placeId;
    const report = { ...fixtureReport, competitors: [{ ...fixtureReport.competitors[0], placeId: own }, ...fixtureReport.competitors] };
    const rows = competitorRows({ analysis: done, report }, null);
    expect(rows.map((r) => r.placeId)).not.toContain(own);
    expect(rows).toHaveLength(fixtureReport.competitors.length);
  });
});

describe("Dashboard", () => {
  const completed = { kind: "completed", analysis: done, report: fixtureReport } as const;
  it("State D: completed shows the position, opportunities, competitors and what holds the clinic back, and no onboarding preview", () => {
    render(<Dashboard clinic={fixtureClinic} hero={completed} latest={{ analysis: done, report: fixtureReport }} />);
    expect(screen.getByRole("heading", { name: "Your clinic at a glance" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /view latest report/i })).toHaveAttribute("href", `/app/clinics/${fixtureClinic.id}/report`);
    expect(screen.getByText("#5 of 5")).toBeInTheDocument();
    expect(screen.getByText("Top growth opportunities")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Competitive gaps" })).toBeInTheDocument();
    expect(screen.queryByText("Preview")).toBeNull();
    expect(screen.queryByRole("progressbar")).toBeNull();
    fireEvent.click(screen.getAllByRole("button", { name: /view details/i })[0]);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("table")).toHaveTextContent(fixtureReport.competitors[0].name);
  });
  it("State B: running shows real steps, the background notice and polls for updates", () => {
    vi.useFakeTimers();
    const a = newer({ phases: deepPhases("done", "running") });
    render(<Dashboard clinic={fixtureClinic} hero={{ kind: "processing", analysis: a, queued: false }} latest={null} refreshMs={1000} />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "1");
    expect(screen.getByText("Your analysis continues in the background.")).toBeInTheDocument();
    expect(screen.getByText("Preview")).toBeInTheDocument();
    expect(screen.queryByLabelText("Key figures")).toBeNull();
    vi.advanceTimersByTime(1000);
    expect(refresh).toHaveBeenCalled();
    vi.useRealTimers();
  });
  it("State C: a failed run shows no running indicator and never polls, names the stopped step, and retries", async () => {
    vi.useFakeTimers();
    retryAnalysis.mockResolvedValue({});
    const a = newer({ status: "failed", error: "Reviews could not be collected.", phases: deepPhases("running") });
    render(<Dashboard clinic={fixtureClinic} hero={{ kind: "failed", analysis: a }} latest={null} refreshMs={500} />);
    expect(screen.getByText("Reviews could not be collected.")).toBeInTheDocument();
    expect(screen.getByText("Stopped at:", { exact: false })).toHaveTextContent("Collecting and analyzing reviews");
    expect(screen.queryByRole("progressbar")).toBeNull();
    expect(screen.queryByText(/continues in the background/)).toBeNull();
    expect(screen.queryByLabelText("Key figures")).toBeNull();
    vi.advanceTimersByTime(2000);
    expect(refresh).not.toHaveBeenCalled();
    vi.useRealTimers();
    fireEvent.click(screen.getByRole("button", { name: "Retry analysis" }));
    await waitFor(() => expect(refresh).toHaveBeenCalled());
    expect(retryAnalysis).toHaveBeenCalledWith(fixtureClinic.id, "analysis_new");
    expect(screen.getByRole("link", { name: "Contact support" })).toHaveAttribute("href", "/contact");
  });
  it("State C with an earlier report keeps it reachable and labelled while the failure stays compact", () => {
    const a = newer({ status: "failed", phases: deepPhases("running") });
    render(<Dashboard clinic={fixtureClinic} hero={{ kind: "failed", analysis: a }} latest={{ analysis: done, report: fixtureReport }} />);
    expect(screen.getByText(/latest completed report from/i)).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /view latest report/i })[0]).toHaveAttribute("href", `/app/clinics/${fixtureClinic.id}/report`);
    expect(screen.getByText("#5 of 5")).toBeInTheDocument();
  });
  it("shows the retry error and does not refresh when retry fails", async () => {
    retryAnalysis.mockRejectedValue(new Error("Try again in a minute."));
    const a = newer({ status: "failed", phases: deepPhases("running") });
    render(<Dashboard clinic={fixtureClinic} hero={{ kind: "failed", analysis: a }} latest={null} />);
    fireEvent.click(screen.getByRole("button", { name: "Retry analysis" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Try again in a minute.");
    expect(refresh).not.toHaveBeenCalled();
  });
  it("State A: unfinished setup shows the clinic, the step and one way forward, and no figures", () => {
    localStorage.setItem("clinix.onboarding", JSON.stringify({ pending: { step: "payment" } }));
    render(<Dashboard clinic={fixtureClinic} hero={{ kind: "none" }} latest={null} />);
    return waitFor(() => {
      expect(screen.getByRole("heading", { name: /you left off at step 4 — payment/i })).toBeInTheDocument();
      expect(screen.getAllByRole("link", { name: /continue setup/i })[0]).toHaveAttribute("href", "/start");
      expect(screen.getByText("3 of 5 completed")).toBeInTheDocument();
      expect(screen.getByText(fixtureClinic.name, { selector: "p" })).toBeInTheDocument();
      expect(screen.queryByLabelText("Key figures")).toBeNull();
    });
  });
  it("starts at step 2 when nothing has been saved yet", async () => {
    localStorage.clear();
    render(<Dashboard clinic={fixtureClinic} hero={{ kind: "setup", analysis: newer({ status: "awaiting_services" }) }} latest={null} />);
    expect(await screen.findByRole("heading", { name: /you left off at step 2 — what we found/i })).toBeInTheDocument();
  });
  it("falls back to step 2 when the saved setup is unreadable", async () => {
    localStorage.setItem("clinix.onboarding", "{not json");
    render(<Dashboard clinic={fixtureClinic} hero={{ kind: "none" }} latest={null} />);
    expect(await screen.findByRole("heading", { name: /step 2/i })).toBeInTheDocument();
  });
  it("switches the market comparison between review counts and ratings", () => {
    render(<Dashboard clinic={fixtureClinic} hero={completed} latest={{ analysis: done, report: fixtureReport }} />);
    const reviews = screen.getByRole("tab", { name: "Google reviews" });
    expect(reviews).toHaveAttribute("aria-selected", "true");
    fireEvent.click(screen.getByRole("tab", { name: "Google rating" }));
    expect(screen.getByRole("tab", { name: "Google rating" })).toHaveAttribute("aria-selected", "true");
    expect(reviews).toHaveAttribute("aria-selected", "false");
  });
  it("points a finished report with a running newer analysis at its progress, and keeps the report visible", () => {
    const hero = { kind: "processing", analysis: newer({ status: "running", stage: "deep" }), queued: false } as const;
    render(<Dashboard clinic={fixtureClinic} hero={hero} latest={{ analysis: done, report: fixtureReport }} />);
    expect(screen.getByText("Your analysis is underway")).toBeInTheDocument();
    expect(screen.getByText("Top growth opportunities")).toBeInTheDocument();
  });
  it("numbers the opportunities 01, 02, 03 and words the evidence as findings from patient reviews", () => {
    render(<Dashboard clinic={fixtureClinic} hero={completed} latest={{ analysis: done, report: fixtureReport }} />);
    const list = screen.getByRole("heading", { name: "Top growth opportunities" }).closest("section")!;
    expect(list).toHaveTextContent("01");
    expect(list).toHaveTextContent(/Based on \d+ findings? from \d+ patient reviews?/);
  });
  it("says so, without inventing a weakness, when the report has no competitive gaps", () => {
    const report = { ...fixtureReport, findings: fixtureReport.findings.filter((f) => f.competitorPlaceId !== null) };
    render(<Dashboard clinic={fixtureClinic} hero={completed} latest={{ analysis: done, report }} />);
    expect(screen.getByText("No significant competitive gaps identified")).toBeInTheDocument();
    expect(screen.getByText("Your latest analysis did not identify any major weaknesses in the available evidence.")).toBeInTheDocument();
  });
});
