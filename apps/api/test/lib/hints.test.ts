import { describe, expect, it } from "vitest";
import { buildScanHints, isNewClinic } from "../../src/lib/hints.js";
import type { Place } from "@clinix/contracts";

const place: Place = { placeId: "p", name: "Mine", address: "", lat: 0, lng: 0, rating: 4.6, reviewCount: 128, website: "https://x", types: [], sampleReviews: [] };

describe("buildScanHints", () => {
  it("reports a review gap, a rating strength and a crowded market", () => {
    const hints = buildScanHints(place, { leaderReviewCount: 310, leaderName: "Yonge Smile Studio", averageRating: 4.5, crowdedService: { service: "Invisalign", count: 11 } });
    expect(hints.map((h) => h.kind)).toEqual(["review_gap", "rating_strength", "crowded_market"]);
    expect(hints[0].text).toContain("310");
  });

  it("skips the review gap for a new clinic and reports a rating gap", () => {
    const hints = buildScanHints({ ...place, rating: 4.1 }, { leaderReviewCount: 310, averageRating: 4.5 }, { clinicIsNew: true });
    expect(hints.map((h) => h.kind)).toEqual(["rating_gap"]);
  });

  it("flags a missing website and never returns more than three hints", () => {
    const hints = buildScanHints({ ...place, website: undefined, rating: 4.0 }, { leaderReviewCount: 400, averageRating: 4.5, crowdedService: { service: "cleaning", count: 20 } });
    expect(hints).toHaveLength(3);
    expect(hints.some((h) => h.kind === "no_website")).toBe(true);
  });

  it("returns nothing when there is nothing measurable", () => {
    expect(buildScanHints({ ...place, rating: undefined, reviewCount: undefined }, {})).toEqual([]);
  });
});

describe("isNewClinic", () => {
  const now = new Date("2026-10-19T00:00:00Z");
  it("is new under two years, not new after", () => {
    expect(isNewClinic("2025-03", now)).toBe(true);
    expect(isNewClinic("2024-06", now)).toBe(false);
    expect(isNewClinic("2019", now)).toBe(false);
    expect(isNewClinic(undefined, now)).toBe(false);
  });
});
