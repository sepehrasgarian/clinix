import { describe, expect, it } from "vitest";
import { initials } from "@/lib/initials";

describe("initials", () => {
  it("uses the first and last name", () => expect(initials("Rouzbeh Ghasemi", null)).toBe("RG"));
  it("uses the first and last word of a long name", () => expect(initials("Mary Ann Smith", null)).toBe("MS"));
  it("falls back to the email, then to a question mark", () => {
    expect(initials(null, "owner@clinic.test")).toBe("OW");
    expect(initials("", null)).toBe("?");
  });
});
