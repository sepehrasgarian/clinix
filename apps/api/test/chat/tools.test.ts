import { describe, expect, it } from "vitest";
import { fixtureAnalysis } from "@clinix/contracts/fixtures";
import { CHAT_TOOLS, citedReviews, runTool } from "../../src/chat/tools.js";

const ctx = { reports: [fixtureAnalysis] };

describe("chat tools", () => {
  it("expose only read tools plus answer, all strict", () => {
    expect(CHAT_TOOLS.map((t) => t.name)).toEqual(["list_reports", "get_findings", "get_reviews", "get_scorecard", "get_action_plan", "compare_latest_two", "answer"]);
    expect(CHAT_TOOLS.every((t) => t.strict)).toBe(true);
  });
  it("get_findings filters by competitor, kind and own clinic, and returns only kept findings", () => {
    const all = runTool("get_findings", { competitor: null, kind: null, aboutOwnClinic: null }, ctx) as { id: string }[];
    expect(all).toHaveLength(6);
    const willowdale = runTool("get_findings", { competitor: "willowdale", kind: null, aboutOwnClinic: null }, ctx) as { about: string }[];
    expect(willowdale.length).toBeGreaterThan(0);
    expect(willowdale.every((f) => f.about === "Willowdale Dental Care")).toBe(true);
    const own = runTool("get_findings", { competitor: null, kind: null, aboutOwnClinic: true }, ctx) as { id: string }[];
    expect(own.map((f) => f.id)).toEqual(["f_wait"]);
    const weaknesses = runTool("get_findings", { competitor: null, kind: "weakness", aboutOwnClinic: null }, ctx) as { kind: string }[];
    expect(weaknesses.every((f) => f.kind === "weakness")).toBe(true);
  });
  it("get_reviews returns full text by id with the business it is about, never a reviewer", () => {
    const out = runTool("get_reviews", { reviewIds: ["rev_ys_1", "rev_own_2", "nope"] }, ctx) as { id: string; about: string; text: string }[];
    expect(out.map((r) => r.id).sort()).toEqual(["rev_own_2", "rev_ys_1"]);
    expect(out.find((r) => r.id === "rev_ys_1")?.about).toBe("Yonge Smile Studio");
    expect(out.find((r) => r.id === "rev_own_2")?.about).toBe("the owner's clinic");
    expect(JSON.stringify(out)).not.toMatch(/author|reviewer/i);
  });
  it("list_reports, scorecard, plan and compare read the latest report", () => {
    expect((runTool("list_reports", {}, ctx) as unknown[]).length).toBe(1);
    expect(runTool("get_scorecard", {}, ctx)).toMatchObject({ overall: 58 });
    expect((runTool("get_action_plan", {}, ctx) as { rank: number }[])[0].rank).toBe(1);
    expect(runTool("compare_latest_two", {}, ctx)).toMatchObject({ previousAnalysisId: "analysis_demo_1" });
  });
  it("says so when there is no report, and citedReviews resolves ids", () => {
    expect(runTool("get_findings", { competitor: null, kind: null, aboutOwnClinic: null }, { reports: [] })).toMatchObject({ error: expect.stringMatching(/no finished report/i) });
    expect(citedReviews(ctx, ["rev_ys_1", "x"]).map((r) => r.id)).toEqual(["rev_ys_1"]);
  });
});
