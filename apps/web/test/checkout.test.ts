import { describe, expect, it } from "vitest";
import { brandOf, cents, cvcValid, demoOutcome, expiryValid, groupCard, groupExpiry, luhnValid, normalPostal, orderFor, POSTAL } from "@/lib/checkout";
import { provinceFrom, taxLines } from "@/lib/tax";

describe("orderFor and taxes", () => {
  it("annual is twelve months listed, two taken off", () => {
    expect(orderFor("growth", "annual")).toEqual({ billing: "annual", listCents: 418800, discountCents: 69800, subtotalCents: 349000 });
    expect(orderFor("growth", "monthly").subtotalCents).toBe(34900);
  });
  it("adds Québec's GST and QST to the cent", () => {
    const lines = taxLines(349000, "QC");
    expect(lines.map((l) => [l.label, l.cents])).toEqual([["GST (5%)", 17450], ["Québec QST (9.975%)", 34813]]);
    expect(349000 + lines.reduce((s, l) => s + l.cents, 0)).toBe(401263);
    expect(cents(401263)).toBe("$4,012.63");
  });
  it("uses one HST in Ontario and the Atlantic provinces, GST alone in Alberta", () => {
    expect(taxLines(10000, "ON").map((l) => l.cents)).toEqual([1300]);
    expect(taxLines(10000, "NS").map((l) => l.cents)).toEqual([1500]);
    expect(taxLines(10000, "AB").map((l) => l.cents)).toEqual([500]);
    expect(taxLines(10000, "BC").map((l) => l.label)).toEqual(["GST (5%)", "BC PST (7%)"]);
  });
  it("reads a province from a code or a name, with or without accents", () => {
    expect(provinceFrom("QC")).toBe("QC");
    expect(provinceFrom("quebec")).toBe("QC");
    expect(provinceFrom("Québec")).toBe("QC");
    expect(provinceFrom("Narnia")).toBeNull();
  });
});

describe("card checks", () => {
  it("validates numbers with Luhn and recognises the brand", () => {
    expect(luhnValid("4242 4242 4242 4242")).toBe(true);
    expect(luhnValid("4242 4242 4242 4243")).toBe(false);
    expect(luhnValid("1234")).toBe(false);
    expect(brandOf("4242")).toBe("visa");
    expect(brandOf("5555 5555 5555 4444")).toBe("mastercard");
    expect(brandOf("378282246310005")).toBe("amex");
  });
  it("groups digits as they are typed", () => {
    expect(groupCard("4242424242424242")).toBe("4242 4242 4242 4242");
    expect(groupCard("378282246310005")).toBe("3782 822463 10005");
    expect(groupExpiry("0427")).toBe("04 / 27");
    expect(groupExpiry("1")).toBe("1");
  });
  it("accepts a card until the end of its month and refuses a past or impossible date", () => {
    const now = new Date(2026, 9, 22);
    expect(expiryValid("10 / 26", now)).toBe(true);
    expect(expiryValid("09 / 26", now)).toBe(false);
    expect(expiryValid("13 / 30", now)).toBe(false);
    expect(expiryValid("1 / 3", now)).toBe(false);
  });
  it("needs a four digit code on American Express and three elsewhere", () => {
    expect(cvcValid("123", "4242424242424242")).toBe(true);
    expect(cvcValid("123", "378282246310005")).toBe(false);
    expect(cvcValid("1234", "378282246310005")).toBe(true);
  });
  it("checks Canadian postal codes and formats them", () => {
    expect(POSTAL.test("H4W 2T5")).toBe(true);
    expect(POSTAL.test("h4w2t5")).toBe(true);
    expect(POSTAL.test("12345")).toBe(false);
    expect(normalPostal("h4w2t5")).toBe("H4W 2T5");
  });
  it("picks the demo outcome from the number alone", () => {
    expect(demoOutcome("4242 4242 4242 4242")).toBe("approved");
    expect(demoOutcome("4000 0000 0000 0002")).toBe("declined");
    expect(demoOutcome("4000 0027 6000 3184")).toBe("verify");
  });
});
