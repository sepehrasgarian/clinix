import { describe, expect, it } from "vitest";
import { matchesDisciplines, preferSameDiscipline } from "../../src/lib/disciplineTypes.js";

describe("disciplineTypes", () => {
  it("matches Google types to disciplines", () => {
    expect(matchesDisciplines(["dentist", "health"], ["dentistry"])).toBe(true);
    expect(matchesDisciplines(["diagnostic_center", "health"], ["dentistry"])).toBe(false);
    expect(matchesDisciplines(["chiropractor"], ["physiotherapy"])).toBe(false);
    expect(matchesDisciplines(["anything"], ["other"])).toBe(true);
  });
  it("prefers same-discipline places but falls back when there are none", () => {
    const a = { id: "a", types: ["dentist"] };
    const b = { id: "b", types: ["health"] };
    expect(preferSameDiscipline([a, b], ["dentistry"])).toEqual([a]);
    expect(preferSameDiscipline([b], ["dentistry"])).toEqual([b]);
  });
});
