import { describe, expect, it } from "vitest";
import { cleanWebsite } from "@/lib/website";

describe("cleanWebsite", () => {
  it("drops tracking parameters and keeps a bare address bare", () => {
    expect(cleanWebsite("https://www.fincheastdental.ca/?utm_source=GoogleOrganic&utm_medium=GBP")).toBe("https://www.fincheastdental.ca");
    expect(cleanWebsite("https://clinic.ca/book?utm_campaign=x&slot=2")).toBe("https://clinic.ca/book?slot=2");
  });
  it("leaves a clean address alone and copes with nothing or nonsense", () => {
    expect(cleanWebsite("https://clinic.ca/about")).toBe("https://clinic.ca/about");
    expect(cleanWebsite(undefined)).toBe("");
    expect(cleanWebsite("not a url")).toBe("not a url");
  });
});
