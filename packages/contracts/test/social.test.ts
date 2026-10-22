import { describe, expect, it } from "vitest";
import { ClinicInput } from "../src/clinic";
import { parseInstagram } from "../src/social";

describe("parseInstagram", () => {
  it("takes a handle with or without the @", () => {
    expect(parseInstagram("@yourclinic")).toBe("yourclinic");
    expect(parseInstagram("  your.clinic_01 ")).toBe("your.clinic_01");
  });
  it("takes a profile link in any usual form", () => {
    expect(parseInstagram("https://www.instagram.com/yourclinic/?hl=en")).toBe("yourclinic");
    expect(parseInstagram("instagram.com/yourclinic")).toBe("yourclinic");
    expect(parseInstagram("http://m.instagram.com/yourclinic#x")).toBe("yourclinic");
  });
  it("says nothing for an empty field and null for what is not a profile", () => {
    expect(parseInstagram("")).toBeUndefined();
    expect(parseInstagram("   ")).toBeUndefined();
    for (const bad of ["https://facebook.com/yourclinic", "your clinic", "https://instagram.com/p/Cabc123/", "https://instagram.com/explore", "a..b", "x".repeat(31), "@", "yourclinic.com"]) {
      expect(parseInstagram(bad), bad).toBeNull();
    }
  });
});

describe("clinic input", () => {
  const base = { name: "Finch East", address: "77 Finch Ave E", city: "Toronto", disciplines: ["dentistry"] };
  it("keeps a valid Instagram handle and refuses an invalid one", () => {
    expect(ClinicInput.parse({ ...base, instagram: "finch.east" }).instagram).toBe("finch.east");
    expect(ClinicInput.safeParse({ ...base, instagram: "not a handle" }).success).toBe(false);
    expect(ClinicInput.parse(base).instagram).toBeUndefined();
  });
});
