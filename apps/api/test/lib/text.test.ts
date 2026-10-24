import { describe, expect, it } from "vitest";
import { fold, nameKey } from "../../src/lib/text.js";

describe("fold", () => {
  it("lower-cases and strips accents", () => {
    expect(fold("Montréal Dentisterie")).toBe("montreal dentisterie");
  });
});

describe("nameKey", () => {
  it("treats punctuation, case, accents and spacing as the same name", () => {
    expect(nameKey("Dr. Lee  Dental")).toBe(nameKey("DR LEE DENTAL"));
    expect(nameKey("Clinique Santé-Plus")).toBe("clinique sante plus");
  });
  it("keeps different names apart", () => {
    expect(nameKey("Yonge Dental")).not.toBe(nameKey("Yonge Dental Care"));
  });
});
