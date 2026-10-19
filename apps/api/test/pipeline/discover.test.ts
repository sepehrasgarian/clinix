import { describe, expect, it, vi } from "vitest";
import type { Clinic, CompetitorCandidate, Place } from "@clinix/contracts";
import { autoSelect, gatherCandidates, rankCandidates, runDiscovery, validateSelection } from "../../src/pipeline/discover.js";
import type { PipelineDeps } from "../../src/pipeline/deps.js";

const clinic: Clinic = {
  id: "clinic_1", ownerId: "u", name: "Finch East Family Dental", address: "77 Finch Ave E", city: "Toronto", province: "ON",
  disciplines: ["dentistry", "dental_hygiene"], services: ["cleaning", "Invisalign"], placeId: "p_own", lat: 43.78, lng: -79.415, createdAt: "2026-10-19T00:00:00.000Z",
};
const center = { lat: clinic.lat!, lng: clinic.lng! };
const place = (id: string, dLat: number, types = ["dentist"], rating = 4.5, reviewCount = 100): Place => ({ placeId: id, name: id, address: `${id} St`, lat: center.lat + dLat, lng: center.lng, rating, reviewCount, types, sampleReviews: [] });

// 0.01 deg lat ≈ 1.1 km. p_a/p_b hyperlocal, p_c local (3.3 km), p_d city (8.9 km), p_far outside every ring.
const nearby = [place("p_own", 0), place("p_a", 0.005), place("p_b", 0.012), place("p_pharm", 0.003, ["pharmacy"]), place("p_c", 0.03), place("p_d", 0.08), place("p_far", 0.5)];

function deps(ranking?: unknown): PipelineDeps {
  return {
    places: { searchText: vi.fn(async () => nearby) } as unknown as PipelineDeps["places"],
    ai: {
      structured: vi.fn(async () => ranking ?? {
        rankings: [
          { id: "p_a", relevance: 92, flag: "strong", reason: "Same-street dentist.", disciplines: ["dentistry", "dental_hygiene"] },
          { id: "p_b", relevance: 70, flag: "strong", reason: "General dentist.", disciplines: ["dentistry"] },
          { id: "p_c", relevance: 10, flag: "irrelevant", reason: "Dental lab, not a clinic.", disciplines: [] },
        ],
      }),
      readWeb: vi.fn(),
    } as unknown as PipelineDeps["ai"],
  };
}

describe("gatherCandidates", () => {
  it("excludes the clinic itself, non-clinics and places outside the ring, and dedupes across services", async () => {
    const d = deps();
    const found = await gatherCandidates(clinic, center, ["cleaning", "Invisalign"], d);
    const ids = found.map((f) => f.place.placeId);
    expect(ids).not.toContain("p_own");
    expect(ids).not.toContain("p_pharm");
    expect(ids).not.toContain("p_far");
    expect(ids).toEqual(["p_a", "p_b", "p_c", "p_d"]);
    expect([...found[0].foundBy]).toEqual(["cleaning", "Invisalign"]);
    expect(d.places.searchText).toHaveBeenCalledTimes(6); // 2 services x 3 rings
  });
  it("keeps only places inside each ring's distance band, so outer rings add variety", async () => {
    const d = deps();
    const found = await gatherCandidates(clinic, center, ["cleaning"], d);
    const km = Object.fromEntries(found.map((f) => [f.place.placeId, f.distanceKm]));
    expect(km.p_c).toBeGreaterThan(2);
    expect(km.p_d).toBeGreaterThan(5);
  });
  it("prefers same-discipline places and ignores a diagnostic centre when dentists exist", async () => {
    const d = deps();
    (d.places.searchText as ReturnType<typeof vi.fn>).mockResolvedValue([place("p_a", 0.005), place("p_diag", 0.004, ["diagnostic_center", "health"], 4.9, 2378)]);
    const found = await gatherCandidates(clinic, center, ["cleaning"], d);
    expect(found.map((f) => f.place.placeId)).toEqual(["p_a"]);
  });
  it("survives a failing search", async () => {
    const d = deps();
    (d.places.searchText as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("quota"));
    expect(await gatherCandidates(clinic, center, ["cleaning"], d)).toEqual([]);
  });
});

describe("rankCandidates", () => {
  it("merges model rankings, defaults unranked ones to borderline, and sorts by relevance", async () => {
    const d = deps();
    const found = await gatherCandidates(clinic, center, ["cleaning"], d);
    const ranked = await rankCandidates(clinic, ["cleaning"], found, d);
    expect(ranked.map((c) => c.place.placeId)).toEqual(["p_a", "p_b", "p_d", "p_c"]);
    expect(ranked[0]).toMatchObject({ flag: "strong", relevance: 92, ring: "hyperlocal" });
    expect(ranked[2]).toMatchObject({ flag: "borderline", relevance: 50, ring: "city" });
    expect(ranked[3]).toMatchObject({ flag: "irrelevant", disciplines: clinic.disciplines });
  });
  it("skips the model when there are no candidates", async () => {
    const d = deps();
    expect(await rankCandidates(clinic, ["x"], [], d)).toEqual([]);
    expect(d.ai.structured).not.toHaveBeenCalled();
  });
});

describe("autoSelect and validateSelection", () => {
  const cand = (id: string, flag: CompetitorCandidate["flag"], disciplines: CompetitorCandidate["disciplines"], relevance: number): CompetitorCandidate => ({
    place: place(id, 0.01), distanceKm: 1, ring: "hyperlocal", relevance, flag, reason: "", disciplines,
  });
  const candidates = [
    ...Array.from({ length: 7 }, (_, i) => cand(`d${i}`, "strong", ["dentistry"], 90 - i)),
    cand("h1", "borderline", ["dental_hygiene"], 60),
    cand("bad", "irrelevant", ["dentistry"], 5),
  ];

  it("auto-selects at most five per discipline and never an irrelevant one", () => {
    const picked = autoSelect(candidates, ["dentistry", "dental_hygiene"]);
    expect(picked).toEqual(["d0", "d1", "d2", "d3", "d4", "h1"]);
  });
  it("prefers strong candidates over borderline ones", () => {
    const list = [cand("b1", "borderline", ["dentistry"], 99), ...Array.from({ length: 5 }, (_, i) => cand(`s${i}`, "strong", ["dentistry"], 60 - i))];
    expect(autoSelect(list, ["dentistry"])).toEqual(["s0", "s1", "s2", "s3", "s4"]);
  });
  it("uses clinics with fewer than ten reviews only to fill gaps", () => {
    const thin = { ...cand("thin", "strong", ["dentistry"], 99), place: { ...place("thin", 0.01), reviewCount: 3 } };
    const picked = autoSelect([thin, ...candidates], ["dentistry"]);
    expect(picked).toEqual(["d0", "d1", "d2", "d3", "d4"]);
    const few = autoSelect([thin, cand("d0", "strong", ["dentistry"], 90)], ["dentistry"]);
    expect(few).toEqual(["d0", "thin"]);
  });
  it("validates owner selections", () => {
    expect(validateSelection(candidates, ["d0", "h1"], ["dentistry", "dental_hygiene"])).toBeNull();
    expect(validateSelection(candidates, ["nope"], ["dentistry"])).toMatch(/Unknown/);
    expect(validateSelection(candidates, [], ["dentistry"])).toMatch(/at least one/);
    expect(validateSelection(candidates, ["d0", "d1", "d2", "d3", "d4", "d5"], ["dentistry"])).toMatch(/at most 5/);
  });
});

describe("runDiscovery", () => {
  it("requires a geocoded clinic", async () => {
    await expect(runDiscovery({ ...clinic, lat: undefined, lng: undefined }, ["cleaning"], deps())).rejects.toThrow(/quick scan/);
  });
  it("returns ranked candidates with an auto selection", async () => {
    const result = await runDiscovery(clinic, ["cleaning"], deps());
    expect(result.candidates).toHaveLength(4);
    expect(result.selectedPlaceIds).toEqual(["p_a", "p_b", "p_d"]);
  });
});
