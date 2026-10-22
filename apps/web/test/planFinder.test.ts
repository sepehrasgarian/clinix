import { describe, expect, it } from "vitest";
import { misfits, needsDetails, neededFeatures, reasonsFor, recommendedPlan, type Needs } from "@/lib/planFinder";

const base: Needs = { locations: 1, disciplines: 1, goals: [], analytics: null };

describe("recommendedPlan", () => {
  it("picks the least expensive plan that covers everything", () => {
    expect(recommendedPlan(base).plan).toBe("essential");
    expect(recommendedPlan({ ...base, disciplines: 3 }).plan).toBe("growth");
    expect(recommendedPlan({ ...base, goals: ["seo"], analytics: true }).plan).toBe("growth");
    expect(recommendedPlan({ ...base, goals: ["geo"] }).plan).toBe("scale");
    expect(recommendedPlan({ ...base, locations: 5 }).plan).toBe("scale");
  });
  it("comparing locations only matters with more than one location", () => {
    expect(recommendedPlan({ ...base, goals: ["compare"] }).plan).toBe("essential");
    expect(recommendedPlan({ ...base, locations: 2, goals: ["compare"] }).plan).toBe("scale");
  });
  it("says so when even Scale is not enough", () => {
    expect(recommendedPlan({ ...base, locations: 9 })).toEqual({ plan: "scale", beyond: true });
  });
  it("analytics is only counted when the SEO question was asked", () => {
    expect(neededFeatures({ ...base, goals: ["growth"], analytics: true })).toEqual([]);
    expect(needsDetails(["seo"])).toBe(true);
    expect(needsDetails(["growth"])).toBe(false);
  });
});

describe("misfits and reasons", () => {
  const needs: Needs = { ...base, goals: ["seo"], analytics: true };
  it("names each thing a plan lacks", () => {
    expect(misfits("essential", needs)).toEqual(["it doesn't include Website SEO audit", "it doesn't include Google Analytics & Search Console"]);
    expect(misfits("growth", needs)).toEqual([]);
    expect(misfits("growth", { ...base, locations: 4 })).toEqual(["it covers up to 3 locations"]);
  });
  it("explains the recommendation with the owner's own answers", () => {
    expect(reasonsFor("growth", needs)).toEqual([
      "It covers your 1 location and 1 discipline — up to 3 and 4 on this plan.",
      "It includes Website SEO audit, because you chose “Improve website SEO”.",
      "It includes Google Analytics & Search Console, because you answered yes to “Do you want to connect Google Analytics and Search Console?”.",
    ]);
    expect(reasonsFor("essential", base)[1]).toMatch(/least expensive/);
  });
});
