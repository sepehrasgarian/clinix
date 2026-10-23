import { describe, expect, it } from "vitest";
import { fixtureReport } from "@clinix/contracts/fixtures";
import { compareReviews, competitorsCsv, disciplineCounts, initialsOf, visibleCompetitors, type Competitor } from "@/lib/competitorList";

const c = (placeId: string, over: Partial<Competitor> = {}): Competitor => ({ placeId, name: `Clinic ${placeId}`, distanceKm: 1, disciplines: ["physiotherapy"], reviewsAnalyzed: 0, servicesNotOnYourSite: [], siteStatus: "no_website", ...over });
const list = [c("a", { distanceKm: 3, rating: 4.2, reviewCount: 10 }), c("b", { distanceKm: 1, rating: 4.9, reviewCount: 5 }), c("c", { distanceKm: 8, name: "Clinique Côte-des-Neiges", disciplines: ["osteopathy"] })];
const ids = (rows: Competitor[]) => rows.map((x) => x.placeId);
const run = (over: Partial<Parameters<typeof visibleCompetitors>[2]> = {}) => ids(visibleCompetitors(list, ["physiotherapy"], { filter: "all", query: "", sort: "closest", ...over }));

describe("visibleCompetitors", () => {
  it("sorts by distance, rating, reviews and name, with missing numbers last", () => {
    expect(run()).toEqual(["b", "a", "c"]);
    expect(run({ sort: "rating" })).toEqual(["b", "a", "c"]);
    expect(run({ sort: "reviews" })).toEqual(["a", "b", "c"]);
    expect(run({ sort: "name" })).toEqual(["a", "b", "c"]);
  });
  it("filters by discipline and searches names and services without caring for accents or case", () => {
    expect(run({ filter: "osteopathy" })).toEqual(["c"]);
    expect(run({ query: "COTE-des-NEIGES" })).toEqual(["c"]);
    const withService = [c("s", { site: { services: ["Sports massage"], specializations: [], languages: [], positioning: "", nicheTermsByService: {}, team: [], accessibility: [], trustSignals: [] } as unknown as Competitor["site"] })];
    expect(ids(visibleCompetitors(withService, ["physiotherapy"], { filter: "all", query: "massage", sort: "closest" }))).toEqual(["s"]);
    expect(run({ query: "zzz" })).toEqual([]);
  });
});

describe("disciplineCounts", () => {
  it("counts every competitor once, so the pills add up to the total", () => {
    const counts = disciplineCounts(list, ["physiotherapy"]);
    expect(counts[0]).toEqual({ key: "all", count: 3 });
    expect(counts.slice(1).reduce((n, x) => n + x.count, 0)).toBe(3);
    expect(counts.find((x) => x.key === "osteopathy")?.count).toBe(1);
  });
  it("keeps a clinic discipline with no competitor at zero", () => {
    expect(disciplineCounts([], ["physiotherapy"])).toEqual([{ key: "all", count: 0 }, { key: "physiotherapy", count: 0 }]);
  });
});

describe("compareReviews", () => {
  it("uses the Google review counts, with a small band counted as similar", () => {
    expect(compareReviews(201, 90)).toEqual({ kind: "more", diff: 111 });
    expect(compareReviews(40, 90)).toEqual({ kind: "fewer", diff: -50 });
    expect(compareReviews(92, 90).kind).toBe("similar");
  });
  it("says unknown rather than guessing when either count is missing", () => {
    expect(compareReviews(undefined, 90).kind).toBe("unknown");
    expect(compareReviews(10, undefined).kind).toBe("unknown");
  });
});

describe("competitorsCsv and initialsOf", () => {
  it("exports the rows as shown, quoting names and leaving the unknown blank", () => {
    const csv = competitorsCsv([c("a", { name: 'Dena "Sports", NDG', reviewCount: 201, rating: 4.8 }), c("b")], 90).split("\n");
    expect(csv[0]).toContain("Google reviews");
    expect(csv[1]).toBe('"Dena ""Sports"", NDG","1.0","4.8","201","","111"');
    expect(csv[2].endsWith('"",""')).toBe(true);
  });
  it("makes initials from the first two words and survives odd names", () => {
    expect(initialsOf("Sarah Friedman Physiotherapy")).toBe("SF");
    expect(initialsOf("N&I Clinique")).toBe("NC");
    expect(initialsOf("123")).toBe("?");
  });
  it("runs on the fixture report", () => {
    expect(visibleCompetitors(fixtureReport.competitors, ["dentistry"], { filter: "all", query: "", sort: "closest" }).length).toBe(fixtureReport.competitors.length);
  });
});
