import { describe, expect, it } from "vitest";
import { buildScanHints, isNewClinic, median, medianStats, CROWDED_AT, MAX_HINTS } from "../../src/lib/hints.js";
import type { Place } from "@clinix/contracts";

const place: Place = { placeId: "p", name: "Mine", address: "", lat: 0, lng: 0, rating: 4.6, reviewCount: 128, website: "https://x", types: [], sampleReviews: [] };
/** Five rivals: ratings 4.2–4.9 (median 4.5), review counts 60–400 (median 200). */
const rivals = medianStats([
  { rating: 4.2, reviewCount: 60 }, { rating: 4.5, reviewCount: 150 }, { rating: 4.9, reviewCount: 200 }, { rating: 4.4, reviewCount: 320 }, { rating: 4.8, reviewCount: 400 },
]);

describe("buildScanHints thresholds", () => {
  it("calls a review gap once the median reaches twice the clinic's count, and carries the numbers", () => {
    expect(buildScanHints({ ...place, reviewCount: 101 }, rivals).map((h) => h.kind)).not.toContain("review_gap");
    expect(buildScanHints({ ...place, reviewCount: 100 }, rivals).map((h) => h.kind)).toContain("review_gap");
    const gap = buildScanHints({ ...place, reviewCount: 99 }, rivals).find((h) => h.kind === "review_gap");
    expect(gap).toMatchObject({ tone: "problem", yours: 99, nearby: 200, nearbyCount: 5 });
    expect(gap?.text).toBe("You have 99 Google reviews. The 5 clinics nearest you have a median of 200.");
  });
  it("treats zero reviews as one so the gap can still fire", () => {
    expect(buildScanHints({ ...place, reviewCount: 0 }, rivals).map((h) => h.kind)).toContain("review_gap");
  });
  it("never compares review counts for a new clinic", () => {
    expect(buildScanHints({ ...place, reviewCount: 5 }, rivals, { clinicIsNew: true }).map((h) => h.kind)).not.toContain("review_gap");
  });
  it("calls a rating gap at 0.2 below the median, not at 0.1", () => {
    expect(buildScanHints({ ...place, rating: 4.4 }, rivals).map((h) => h.kind)).not.toContain("rating_gap");
    expect(buildScanHints({ ...place, rating: 4.3 }, rivals).find((h) => h.kind === "rating_gap")).toMatchObject({ tone: "problem", yours: 4.3, nearby: 4.5, nearbyCount: 5 });
  });
  it("calls a rating a strength only at the median or above and at least 4.5", () => {
    expect(buildScanHints({ ...place, rating: 4.5 }, rivals).map((h) => h.kind)).toContain("rating_strength");
    expect(buildScanHints({ ...place, rating: 4.4 }, rivals).map((h) => h.kind)).not.toContain("rating_strength");
    const lowMarket = medianStats([{ rating: 4.0 }, { rating: 4.1 }, { rating: 4.2 }]);
    expect(buildScanHints({ ...place, rating: 4.3 }, lowMarket).map((h) => h.kind)).not.toContain("rating_strength");
  });
  it("calls the market crowded from ten clinics, and says the count is a floor when the search was capped", () => {
    expect(buildScanHints(place, { ...rivals, nearbyCount: CROWDED_AT - 1 }).map((h) => h.kind)).not.toContain("crowded_market");
    const crowded = buildScanHints(place, { ...rivals, nearbyCount: 26 }, { capped: true }).find((h) => h.kind === "crowded_market");
    expect(crowded).toMatchObject({ tone: "context", nearbyCount: 26, atLeast: true });
    expect(crowded?.text).toBe("26+ clinics within 5 km are after the same patients.");
    expect(buildScanHints(place, { ...rivals, nearbyCount: 12 }).find((h) => h.kind === "crowded_market")?.text).toBe("12 clinics within 5 km are after the same patients.");
  });
  it("says nothing against fewer than three rivals", () => {
    const two = medianStats([{ rating: 4.9, reviewCount: 900 }, { rating: 4.9, reviewCount: 900 }]);
    expect(buildScanHints({ ...place, rating: 3.9, reviewCount: 3 }, two)).toEqual([]);
  });
});

describe("buildScanHints order and cap", () => {
  it("lists problems, then the strength, then context, and never more than three", () => {
    const hints = buildScanHints({ ...place, website: undefined, rating: 4.0, reviewCount: 10 }, { ...rivals, nearbyCount: 15 });
    expect(hints.map((h) => h.kind)).toEqual(["review_gap", "rating_gap", "no_website"]);
    expect(hints).toHaveLength(MAX_HINTS);
  });
  it("puts the strength before the crowded-market context", () => {
    expect(buildScanHints({ ...place, rating: 4.8, reviewCount: 300 }, { ...rivals, nearbyCount: 15 }).map((h) => h.kind)).toEqual(["rating_strength", "crowded_market"]);
  });
  it("returns nothing when there is nothing measurable", () => {
    expect(buildScanHints({ ...place, rating: undefined, reviewCount: undefined }, {})).toEqual([]);
  });
  it("words the missing website plainly", () => {
    expect(buildScanHints({ ...place, website: undefined, rating: undefined, reviewCount: undefined }, {})[0]).toMatchObject({ kind: "no_website", tone: "problem", text: "There's no website on your Google profile." });
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

describe("isNewClinic", () => {
  const now = new Date("2026-10-19T00:00:00Z");
  it("is new under two years, not new after", () => {
    expect(isNewClinic("2025-03", now)).toBe(true);
    expect(isNewClinic("2024-06", now)).toBe(false);
    expect(isNewClinic("2019", now)).toBe(false);
    expect(isNewClinic(undefined, now)).toBe(false);
  });
});
