import { describe, expect, it, vi } from "vitest";
import type { Clinic, Place } from "@clinix/contracts";
import { enrich, marketPreview, runQuickScan, understand, validate } from "../../src/pipeline/quickScan.js";
import type { PipelineDeps } from "../../src/pipeline/deps.js";
import { testGuides } from "../helpers.js";
import type { AiClient } from "../../src/clients/anthropic.js";
import type { PlacesClient } from "../../src/clients/places.js";

const clinic: Clinic = {
  id: "clinic_1", ownerId: "user_1", name: "Finch East Family Dental", address: "77 Finch Ave E", city: "Toronto", province: "ON",
  website: "https://finch.example", disciplines: ["dentistry"], services: ["cleaning"], opened: "2019-03", createdAt: "2026-10-19T00:00:00.000Z",
};
const own: Place = { placeId: "p_own", name: clinic.name, address: "77 Finch Ave E", lat: 43.78, lng: -79.415, rating: 4.6, reviewCount: 128, website: clinic.website, types: ["dentist"], sampleReviews: [] };
const peer = (id: string, rating: number, reviewCount: number, dLat = 0.01): Place => ({ placeId: id, name: id, address: "", lat: own.lat + dLat, lng: own.lng, rating, reviewCount, types: ["dentist"], sampleReviews: [] });

function fakeDeps(overrides: Partial<{ places: Partial<PlacesClient>; ai: Partial<AiClient> }> = {}): PipelineDeps {
  const places = {
    geocode: vi.fn(async () => ({ location: { lat: own.lat, lng: own.lng }, formattedAddress: "77 Finch Ave E" })),
    searchText: vi.fn(async (q: string) => (q.startsWith(clinic.name) ? [own] : [peer("p_a", 4.8, 310), peer("p_b", 4.2, 90), { ...peer("p_far", 5, 999, 0.2) }])),
    details: vi.fn(async () => ({ ...own, hours: ["Mon-Fri 9-5"] })),
    ...overrides.places,
  } as unknown as PlacesClient;
  const ai = {
    readWeb: vi.fn(async () => "Services: cleaning, whitening, Invisalign. Languages: English, Farsi. Online booking: no."),
    structured: vi.fn(async () => ({ services: ["cleaning", "whitening", "Invisalign"], specializations: ["clear aligners"], languages: ["English", "Farsi"], positioning: "Gentle family dentist.", nicheTermsByService: { Invisalign: ["clear aligners"] } })),
    ...overrides.ai,
  } as unknown as AiClient;
  return { places, ai };
}

describe("validate", () => {
  it("accepts a complete clinic and rejects missing fields", () => {
    expect(() => validate(clinic)).not.toThrow();
    expect(() => validate({ ...clinic, name: " " })).toThrow(/name/);
    expect(() => validate({ ...clinic, city: "" })).toThrow(/address/);
  });
});

describe("enrich", () => {
  it("geocodes, matches the listing and returns details", async () => {
    const deps = fakeDeps();
    const place = await enrich(clinic, deps);
    expect(place.placeId).toBe("p_own");
    expect(place.hours).toEqual(["Mon-Fri 9-5"]);
  });
  it("fails when the address cannot be geocoded", async () => {
    const deps = fakeDeps({ places: { geocode: vi.fn(async () => null) } });
    await expect(enrich(clinic, deps)).rejects.toThrow(/Geocoding/);
  });
  it("fails when the matched listing is not a clinic, unless the owner confirmed it", async () => {
    const deps = fakeDeps({ places: { searchText: vi.fn(async () => [{ ...own, types: ["pharmacy"] }]) } });
    await expect(enrich(clinic, deps)).rejects.toThrow(/not a clinic/);
    await expect(enrich({ ...clinic, businessTypeConfirmed: true }, deps)).resolves.toBeDefined();
  });
  it("fails when the listing is far from the address", async () => {
    const deps = fakeDeps({ places: { searchText: vi.fn(async () => [{ ...own, lat: 45.5 }]) } });
    await expect(enrich(clinic, deps)).rejects.toThrow(/km from the address/);
  });
});

describe("understand", () => {
  it("reads the website and merges the owner's declared services", async () => {
    const deps = fakeDeps();
    const u = await understand(clinic, own, deps);
    expect(u.services).toEqual(["cleaning", "whitening", "Invisalign"]);
    expect(u.languages).toContain("Farsi");
    expect(deps.ai.readWeb).toHaveBeenCalledOnce();
  });
  it("seeds from disciplines when there is no website and never calls the model", async () => {
    const deps = fakeDeps();
    const u = await understand({ ...clinic, website: undefined, services: [] }, { ...own, website: undefined }, deps);
    expect(u.services).toEqual(["Dentistry"]);
    expect(deps.ai.readWeb).not.toHaveBeenCalled();
  });
});

describe("marketPreview", () => {
  it("counts nearby peers per service, excludes self and far places, and finds the leader", async () => {
    const deps = fakeDeps();
    const { counts, stats } = await marketPreview(clinic, own, ["cleaning", "Invisalign"], deps);
    expect(counts).toEqual([{ service: "cleaning", count: 2 }, { service: "Invisalign", count: 2 }]);
    expect(stats.leaderReviewCount).toBe(310);
    expect(stats.averageRating).toBeCloseTo(4.5, 5);
  });
  it("lists the nearby clinics nearest first with their distance, and measures their medians", async () => {
    const deps = fakeDeps();
    const { nearby, capped, stats } = await marketPreview(clinic, own, ["cleaning", "Invisalign"], deps);
    expect(nearby.length).toBe(2);
    expect(nearby.map((c) => c.distanceKm)).toEqual([...nearby.map((c) => c.distanceKm)].sort((a, b) => a - b));
    expect(nearby[0]).toMatchObject({ placeId: expect.any(String), name: expect.any(String), lat: expect.any(Number), lng: expect.any(Number) });
    expect(capped).toBe(false);
    expect(stats.nearbyCount).toBe(2);
  });
  it("says the count is a floor when a search came back full", async () => {
    const full = Array.from({ length: 20 }, (_, i) => peer(`p_${i}`, 4.5, 100 + i));
    const deps = fakeDeps({ places: { searchText: vi.fn(async () => full) } });
    expect((await marketPreview(clinic, own, ["cleaning"], deps)).capped).toBe(true);
  });
  it("ignores businesses of another kind when computing the leader", async () => {
    const deps = fakeDeps({ places: { searchText: vi.fn(async () => [peer("p_a", 4.8, 310), { ...peer("p_diag", 4.9, 2378), types: ["diagnostic_center", "health"] }]) } });
    const { stats } = await marketPreview(clinic, own, ["cleaning"], deps);
    expect(stats.leaderReviewCount).toBe(310);
  });
});

describe("runQuickScan", () => {
  it("runs the three phases in order and produces hints", async () => {
    const deps = fakeDeps();
    const order: string[] = [];
    const scan = await runQuickScan(clinic, deps, { onPhase: async (p, fn) => { order.push(p); await fn(); } });
    expect(order).toEqual(["validate", "enrich", "understand"]);
    expect(scan.place.placeId).toBe("p_own");
    expect(scan.hints.map((h) => h.kind)).toContain("review_gap");
    expect(scan.competitorCountsPerService.length).toBeGreaterThan(0);
    expect(scan.nearby.length).toBeGreaterThan(0);
    expect(scan.radiusKm).toBe(5);
    expect(scan.nearbyCapped).toBe(false);
  });
  it("still returns a scan when the market preview fails", async () => {
    const deps = fakeDeps();
    let calls = 0;
    (deps.places.searchText as unknown as ReturnType<typeof vi.fn>).mockImplementation(async (q: string) => {
      if (q.startsWith(clinic.name)) return [own];
      calls++;
      throw new Error("quota");
    });
    const scan = await runQuickScan(clinic, deps, { onPhase: async (_p, fn) => fn() });
    expect(calls).toBeGreaterThan(0);
    expect(scan.competitorCountsPerService).toEqual([]);
    expect(scan.nearby).toEqual([]);
    expect(scan.hints).toEqual([]);
  });
});
