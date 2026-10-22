import { describe, expect, it } from "vitest";
import type { CompetitorCandidate } from "@clinix/contracts";
import { countPerDiscipline, groupByDiscipline, visibleCandidates } from "@/lib/competitors";

const c = (id: string, over: Partial<CompetitorCandidate> & { rating?: number; reviews?: number; name?: string; address?: string } = {}): CompetitorCandidate => ({
  place: { placeId: id, name: over.name ?? `Clinic ${id}`, address: over.address ?? "1 Rue Test", lat: 0, lng: 0, rating: over.rating, reviewCount: over.reviews, types: [], sampleReviews: [] },
  distanceKm: over.distanceKm ?? 1, ring: "local", relevance: over.relevance ?? 50, flag: "strong", reason: "r", disciplines: over.disciplines ?? ["physiotherapy"],
});
const items = [c("a", { distanceKm: 3, relevance: 90, rating: 4.2, reviews: 10 }), c("b", { distanceKm: 1, relevance: 70, rating: 4.9, reviews: 5 }), c("c", { distanceKm: 8, relevance: 80, name: "Clinique Côte-des-Neiges", address: "9 Chemin Test" })];
const ids = (list: CompetitorCandidate[]) => list.map((x) => x.place.placeId);

describe("visibleCandidates", () => {
  it("sorts by relevance, distance, rating and reviews, with missing numbers last", () => {
    const run = (sort: "relevance" | "distance" | "rating" | "reviews") => ids(visibleCandidates(items, { query: "", maxKm: null, sort }));
    expect(run("relevance")).toEqual(["a", "c", "b"]);
    expect(run("distance")).toEqual(["b", "a", "c"]);
    expect(run("rating")).toEqual(["b", "a", "c"]);
    expect(run("reviews")).toEqual(["a", "b", "c"]);
  });
  it("searches name and address without caring about accents or case, and caps distance", () => {
    expect(ids(visibleCandidates(items, { query: "cote des neiges", maxKm: null, sort: "relevance" }))).toEqual(["c"]);
    expect(ids(visibleCandidates(items, { query: "chemin", maxKm: null, sort: "relevance" }))).toEqual(["c"]);
    expect(ids(visibleCandidates(items, { query: "", maxKm: 2, sort: "relevance" }))).toEqual(["b"]);
    expect(visibleCandidates(items, { query: "zzz", maxKm: null, sort: "relevance" })).toEqual([]);
  });
});

describe("per discipline", () => {
  const mixed = [...items, c("d", { disciplines: ["massage_therapy"] })];
  it("groups by the discipline each clinic belongs to and counts selections in each", () => {
    const groups = groupByDiscipline(mixed, ["physiotherapy", "massage_therapy"]);
    expect(groups.map((g) => [g.d, ids(g.items)])).toEqual([["physiotherapy", ["a", "b", "c"]], ["massage_therapy", ["d"]]]);
    expect(countPerDiscipline(mixed, ["a", "d"], "physiotherapy", ["physiotherapy", "massage_therapy"])).toBe(1);
  });
});
