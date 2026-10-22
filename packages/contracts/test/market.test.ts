import { describe, expect, it } from "vitest";
import { isNewClinic, median, medianStats, reviewRank } from "../src/market";

const near = (reviewCount?: number, rating?: number) => ({ placeId: `p${reviewCount}`, name: "n", lat: 0, lng: 0, reviewCount, rating, distanceKm: 1 });

describe("median and medianStats", () => {
  it("takes the middle, and only trusts a median from three clinics", () => {
    expect(median([5, 1, 3])).toBe(3);
    expect(median([])).toBeUndefined();
    expect(medianStats([{ rating: 4, reviewCount: 10 }, { rating: 5, reviewCount: 30 }])).toMatchObject({ ratedCount: 2, medianRating: undefined, medianReviews: undefined });
    expect(medianStats([{ rating: 4, reviewCount: 10 }, { rating: 5, reviewCount: 30 }, { rating: 4.5, reviewCount: 20 }])).toMatchObject({ medianRating: 4.5, medianReviews: 20 });
  });
});

describe("reviewRank", () => {
  it("is one plus the clinics with more reviews, out of everyone counted including the clinic itself", () => {
    expect(reviewRank(90, [near(862), near(500), near(90), near(10)])).toEqual({ rank: 3, total: 5 });
    expect(reviewRank(1000, [near(862)])).toEqual({ rank: 1, total: 2 });
  });
  it("says nothing without the clinic's reviews or without neighbours", () => {
    expect(reviewRank(undefined, [near(5)])).toBeNull();
    expect(reviewRank(10, [])).toBeNull();
  });
});

describe("isNewClinic", () => {
  it("is new under two years", () => {
    const now = new Date("2026-10-19T00:00:00Z");
    expect(isNewClinic("2025-03", now)).toBe(true);
    expect(isNewClinic("2024-06", now)).toBe(false);
    expect(isNewClinic(undefined, now)).toBe(false);
  });
});
