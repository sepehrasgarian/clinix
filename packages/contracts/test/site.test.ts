import { describe, expect, it } from "vitest";
import { Understanding } from "../src/site";
import { fixtureReport } from "../src/fixtures/index";

const site = fixtureReport.competitors[0].site!;

describe("Understanding", () => {
  it("accepts a site that lists no locations, so a thin competitor page is still kept", () => {
    expect(Understanding.parse({ ...site, locationsCount: 0 }).locationsCount).toBe(0);
    expect(Understanding.parse({ ...site, locationsCount: 3 }).locationsCount).toBe(3);
  });
  it("rejects a negative or fractional location count", () => {
    expect(() => Understanding.parse({ ...site, locationsCount: -1 })).toThrow();
    expect(() => Understanding.parse({ ...site, locationsCount: 1.5 })).toThrow();
  });
});
