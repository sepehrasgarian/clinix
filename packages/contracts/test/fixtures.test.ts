import { describe, it, expect } from "vitest";
import { Analysis, Clinic, ChatMessage, Report, Review } from "../src/index";
import { fixtureAnalysis, fixtureClinic, fixtureChat, fixtureReport, fixtureReviews } from "../src/fixtures/index";

describe("fixtures conform to the contracts", () => {
  it("clinic", () => expect(() => Clinic.parse(fixtureClinic)).not.toThrow());
  it("reviews", () => expect(() => Review.array().parse(fixtureReviews)).not.toThrow());
  it("report", () => expect(() => Report.parse(fixtureReport)).not.toThrow());
  it("analysis", () => expect(() => Analysis.parse(fixtureAnalysis)).not.toThrow());
  it("chat", () => expect(() => ChatMessage.array().parse(fixtureChat)).not.toThrow());
});

describe("fixture internal consistency", () => {
  const reviewIds = new Set(fixtureReviews.map((r) => r.id));
  const findingIds = new Set(fixtureReport.findings.map((f) => f.id));

  it("every kept finding cites at least two reviews that exist", () => {
    for (const f of fixtureReport.findings.filter((f) => f.status === "kept")) {
      expect(f.evidence.length).toBeGreaterThanOrEqual(2);
      for (const e of f.evidence) expect(reviewIds.has(e.reviewId)).toBe(true);
    }
  });

  it("kept findings quote text that really appears in the cited review", () => {
    const byId = new Map(fixtureReviews.map((r) => [r.id, r]));
    for (const f of fixtureReport.findings.filter((f) => f.status === "kept")) {
      for (const e of f.evidence) expect(byId.get(e.reviewId)!.text).toContain(e.quote);
    }
  });

  it("the rejected quote_not_found finding really is not in the review", () => {
    const f = fixtureReport.findings.find((f) => f.rejectionReason === "quote_not_found")!;
    const review = fixtureReviews.find((r) => r.id === f.evidence[0].reviewId)!;
    expect(review.text).not.toContain(f.evidence[0].quote);
  });

  it("ledger totals match the findings", () => {
    const kept = fixtureReport.findings.filter((f) => f.status === "kept").length;
    const rejected = fixtureReport.findings.filter((f) => f.status === "rejected").length;
    expect(fixtureReport.ledger).toMatchObject({ proposed: kept + rejected, kept, rejected });
  });

  it("recommendations reference real findings", () => {
    for (const rec of fixtureReport.recommendations) for (const id of rec.findingIds) expect(findingIds.has(id)).toBe(true);
  });
});

describe("contracts reject bad data", () => {
  it("rejects a review rating outside 1-5", () => {
    expect(() => Review.parse({ ...fixtureReviews[0], rating: 6 })).toThrow();
  });
  it("rejects a clinic with no disciplines", () => {
    expect(() => Clinic.parse({ ...fixtureClinic, disciplines: [] })).toThrow();
  });
  it("rejects an unknown analysis status", () => {
    expect(() => Analysis.parse({ ...fixtureAnalysis, status: "paused" })).toThrow();
  });
});
