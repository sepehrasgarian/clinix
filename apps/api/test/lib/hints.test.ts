import { describe, expect, it } from "vitest";
import { buildScanHints, isNewClinic, median, medianStats } from "../../src/lib/hints.js";
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

describe("median", () => {
  it("takes the middle value, or the mean of the two in the middle, and nothing for an empty list", () => {
    expect(median([3, 1, 2])).toBe(2);
    expect(median([4, 1, 2, 3])).toBe(2.5);
    expect(median([])).toBeUndefined();
  });
});

describe("medianStats", () => {
  it("measures the clinics themselves, and only calls it a median from three clinics on", () => {
    const s = medianStats([{ rating: 4.2, reviewCount: 50 }, { rating: 4.8, reviewCount: 300 }, { rating: 4.5, reviewCount: 120 }, { reviewCount: 10 }]);
    expect(s).toEqual({ nearbyCount: 4, ratedCount: 3, medianRating: 4.5, reviewedCount: 4, medianReviews: 85 });
    expect(medianStats([{ rating: 4.2, reviewCount: 50 }, { rating: 4.8, reviewCount: 300 }])).toMatchObject({ medianRating: undefined, medianReviews: undefined, ratedCount: 2 });
  });
});

describe("hints against the nearest clinics' median", () => {
  const stats = { nearbyCount: 28, ratedCount: 26, medianRating: 4.5, reviewedCount: 28, medianReviews: 310 };
  it("says it with the numbers, and says why it matters", () => {
    const hints = buildScanHints({ ...place, rating: 4.1, reviewCount: 20 }, stats);
    expect(hints.map((h) => h.kind)).toEqual(["review_gap", "rating_gap", "crowded_market"]);
    expect(hints[0].text).toBe("You have 20 Google reviews. The 28 clinics nearest you have a median of 310.");
    expect(hints[0].why).toMatch(/review counts before they book/);
    expect(hints[1].text).toBe("Your 4.1★ rating is below the 4.5★ median of the 26 clinics nearest you.");
    expect(hints[2].text).toBe("28 clinics within 5 km are after the same patients.");
  });
  it("calls a rating at or above the median a strength", () => {
    const hints = buildScanHints({ ...place, rating: 5.0, reviewCount: 400 }, stats);
    expect(hints.find((h) => h.kind === "rating_strength")?.text).toBe("Your 5.0★ rating matches or beats at least half of the 26 clinics nearest you.");
    expect(hints.some((h) => h.kind === "review_gap")).toBe(false);
  });
  it("leaves out the review comparison for a new clinic, and the crowded market when it is not crowded", () => {
    const hints = buildScanHints(place, { ...stats, nearbyCount: 5 }, { clinicIsNew: true });
    expect(hints.some((h) => h.kind === "review_gap")).toBe(false);
    expect(hints.some((h) => h.kind === "crowded_market")).toBe(false);
  });
  it("words the missing website plainly", () => {
    expect(buildScanHints({ ...place, website: undefined, rating: undefined, reviewCount: undefined }, {})[0]).toMatchObject({ kind: "no_website", text: "There's no website on your Google profile." });
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
