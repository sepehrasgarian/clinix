import { describe, expect, it } from "vitest";
import { fixtureReport } from "@clinix/contracts/fixtures";
import { buildRunDiff } from "../../src/lib/diff.js";

describe("buildRunDiff", () => {
  it("finds new and resolved findings by claim, counts completed actions, and summarises", () => {
    const previous = { ...fixtureReport, analysisId: "prev", generatedAt: "2026-09-20T15:00:00.000Z", findings: fixtureReport.findings.filter((f) => f.id !== "f_languages"), recommendations: fixtureReport.recommendations.map((r) => (r.id === "rec_wait" ? { ...r, status: "done" as const } : r)) };
    const current = { ...fixtureReport, findings: [...fixtureReport.findings.filter((f) => f.id !== "f_phone")] };
    const diff = buildRunDiff({ report: current, rating: 4.7, reviewCount: 134 }, { report: previous, rating: 4.6, reviewCount: 128 });
    expect(diff.newFindingIds).toEqual(["f_languages"]);
    expect(diff.resolvedFindingIds).toEqual(["f_phone"]);
    expect(diff.completedRecommendationIds).toEqual(["rec_wait"]);
    expect(diff.ratingDelta).toBeCloseTo(0.1);
    expect(diff.reviewCountDelta).toBe(6);
    expect(diff.summary).toMatch(/Rating up 0.1, 6 new reviews, 1 action completed, 1 new finding, 1 resolved since September 20/);
  });
  it("ignores rejected findings when comparing", () => {
    const diff = buildRunDiff({ report: fixtureReport, rating: 4.6, reviewCount: 128 }, { report: { ...fixtureReport, analysisId: "prev" }, rating: 4.6, reviewCount: 128 });
    expect(diff.newFindingIds).toEqual([]);
    expect(diff.summary).toMatch(/Rating unchanged, no new reviews/);
  });
});
