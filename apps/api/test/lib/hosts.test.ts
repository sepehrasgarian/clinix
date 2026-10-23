import { describe, expect, it } from "vitest";
import { sameWebsite, websiteHost } from "../../src/lib/hosts.js";

describe("websiteHost", () => {
  it("lower-cases, drops www and accepts a bare domain", () => {
    expect(websiteHost("https://www.YongeDental.ca/book")).toBe("yongedental.ca");
    expect(websiteHost("yongedental.ca")).toBe("yongedental.ca");
  });
  it("returns null for nothing or garbage", () => {
    expect(websiteHost(undefined)).toBeNull();
    expect(websiteHost("")).toBeNull();
    expect(websiteHost("http://")).toBeNull();
  });
});

describe("sameWebsite", () => {
  it("matches across www and scheme, never when a side is unknown", () => {
    expect(sameWebsite("https://www.clinic.ca", "http://clinic.ca/about")).toBe(true);
    expect(sameWebsite("https://clinic.ca", "https://other.ca")).toBe(false);
    expect(sameWebsite(undefined, undefined)).toBe(false);
    expect(sameWebsite("https://clinic.ca", undefined)).toBe(false);
  });
});
