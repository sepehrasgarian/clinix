import { describe, expect, it } from "vitest";
import type { Place, Review } from "@clinix/contracts";
import { buildScorecard, percentile, recentCount, replyRate } from "../../src/lib/scorecard.js";

const now = new Date("2026-10-19T00:00:00Z").getTime();
const rev = (daysAgo: number, reply = false): Review => ({ id: `r${daysAgo}${reply}`, placeId: "p", rating: 5, text: "x", publishedAt: new Date(now - daysAgo * 86400000).toISOString(), ownerReply: reply ? "thanks" : undefined, source: "apify" });
const place = (id: string, rating: number, reviewCount: number): Place => ({ placeId: id, name: id, address: "", lat: 0, lng: 0, rating, reviewCount, website: "https://x", phone: "1", hours: ["Mon"], photoName: "p/x", types: ["dentist"], sampleReviews: [] });
const understanding = { services: ["a", "b", "c"], specializations: [], languages: ["English"], positioning: "", nicheTermsByService: {} };

describe("scorecard helpers", () => {
  it("percentile places a value among peers", () => {
    expect(percentile(4.9, [4.5, 4.7, 4.8])).toBe(100);
    expect(percentile(4.0, [4.5, 4.7, 4.8])).toBe(0);
    expect(percentile(4.7, [4.5, 4.7, 4.8])).toBe(50);
    expect(percentile(1, [])).toBe(50);
  });
  it("measures reply rate and 90-day velocity", () => {
    const reviews = [rev(10, true), rev(50), rev(200)];
    expect(replyRate(reviews)).toBeCloseTo(1 / 3);
    expect(recentCount(reviews, now)).toBe(2);
  });
});

describe("buildScorecard", () => {
  const peers = [
    { place: place("a", 4.8, 310), reviews: [rev(5), rev(20), rev(40)], competitor: { placeId: "a", name: "a", distanceKm: 1, disciplines: ["dentistry" as const], reviewsAnalyzed: 3 } },
    { place: place("b", 4.4, 190), reviews: [rev(300, true)], competitor: { placeId: "b", name: "b", distanceKm: 2, disciplines: ["dentistry" as const], reviewsAnalyzed: 1 } },
  ];
  it("produces seven dimensions without pricing and an overall score", () => {
    const card = buildScorecard({ place: place("me", 4.6, 128), reviews: [rev(30), rev(400)], understanding, isNew: false }, peers, now);
    expect(card.dimensions.map((d) => d.key)).toEqual(["rating", "review_count", "review_velocity", "owner_responsiveness", "google_profile", "service_breadth", "language_coverage"]);
    expect(card.dimensions.find((d) => d.key === "rating")?.score).toBe(50);
    expect(card.dimensions.find((d) => d.key === "owner_responsiveness")?.score).toBe(0);
    expect(card.dimensions.find((d) => d.key === "google_profile")?.score).toBe(100);
    expect(card.overall).toBeGreaterThan(0);
    expect(card.overall).toBeLessThanOrEqual(100);
  });
  it("does not score review volume against established clinics for a new clinic", () => {
    const card = buildScorecard({ place: place("me", 4.6, 12), reviews: [], understanding, isNew: true }, peers, now);
    expect(card.dimensions.find((d) => d.key === "review_count")).toMatchObject({ score: 50 });
    expect(card.dimensions.find((d) => d.key === "review_count")?.summary).toMatch(/new/);
  });
});
