import { describe, expect, it, vi } from "vitest";
import type { Place } from "@clinix/contracts";
import { createApp } from "../../src/app.js";
import type { PipelineDeps } from "../../src/pipeline/deps.js";

const own: Place = { placeId: "p_own", name: "Mine", address: "5650 Yonge St", lat: 43.78, lng: -79.415, rating: 4.9, reviewCount: 74, types: ["dentist"], sampleReviews: [] };
const peer = (id: string, dLat: number, reviewCount: number, rating = 4.6, types = ["dentist"]): Place => ({ placeId: id, name: id, address: "", lat: own.lat + dLat, lng: own.lng, rating, reviewCount, types, sampleReviews: [] });

const deps = {
  places: {
    details: vi.fn(async (id: string) => (id === "p_own" ? own : null)),
    searchText: vi.fn(async () => [own, peer("a", 0.01, 1026, 4.8), peer("b", 0.02, 300), peer("diag", 0.01, 2378, 4.9, ["diagnostic_center"]), peer("far", 0.5, 999)]),
  },
  ai: {},
} as unknown as PipelineDeps;
const app = createApp({ deps, run: { quickScan: vi.fn(), discovery: vi.fn() } });
const guest = { "x-guest-id": "guest_abcdef123456" };

describe("GET /api/lookup/market-card", () => {
  it("counts same-discipline peers within 5 km and names the leader", async () => {
    const res = await app.request("/api/lookup/market-card?placeId=p_own&disciplines=dentistry", { headers: guest });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ nearby: 2, leaderName: "a", leaderReviewCount: 1026, averageRating: 4.7 });
  });
  it("serves repeat requests from the cache", async () => {
    const before = (deps.places.details as ReturnType<typeof vi.fn>).mock.calls.length;
    await app.request("/api/lookup/market-card?placeId=p_own&disciplines=dentistry", { headers: guest });
    expect((deps.places.details as ReturnType<typeof vi.fn>).mock.calls.length).toBe(before);
  });
  it("validates input and reports an unknown listing", async () => {
    expect((await app.request("/api/lookup/market-card?placeId=p_own", { headers: guest })).status).toBe(400);
    expect((await app.request("/api/lookup/market-card?placeId=p_own&disciplines=astrology", { headers: guest })).status).toBe(400);
    expect((await app.request("/api/lookup/market-card?placeId=nope&disciplines=dentistry", { headers: guest })).status).toBe(404);
  });
});
