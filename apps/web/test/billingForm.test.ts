import { describe, expect, it } from "vitest";
import { billingErrors, defaultBilling } from "@/lib/billingForm";

const clinic = { name: "Réhabital", address: "5800 Boul. Cavendish D4, Côte Saint-Luc, QC H4W 2T5, Canada", city: "Côte Saint-Luc" };

describe("defaultBilling", () => {
  it("splits the clinic's address into the invoice fields", () => {
    expect(defaultBilling(clinic, "a@b.ca")).toMatchObject({ legalName: "Réhabital", email: "a@b.ca", street: "5800 Boul. Cavendish D4", city: "Côte Saint-Luc", province: "QC", postalCode: "H4W 2T5", sameAddress: true, kind: "business" });
  });
  it("prefers the clinic's own province, and leaves the email empty when there is none", () => {
    const d = defaultBilling({ ...clinic, province: "Ontario", address: "1 Main St" }, null);
    expect(d.province).toBe("ON");
    expect(d.email).toBe("");
    expect(d.postalCode).toBe("");
  });
});

describe("billingErrors", () => {
  it("asks for what is missing, one message each, and passes a complete form", () => {
    const base = defaultBilling(clinic, "a@b.ca");
    expect(Object.keys(billingErrors(base))).toEqual(["contactName"]);
    expect(billingErrors({ ...base, contactName: "Hasan A." })).toEqual({});
    expect(Object.keys(billingErrors({ ...base, contactName: "x", email: "nope", postalCode: "123", street: "", city: "" })).sort()).toEqual(["city", "email", "postalCode", "street"]);
  });
  it("asks for a person's name rather than a business name when billing an individual", () => {
    expect(billingErrors({ ...defaultBilling(clinic, "a@b.ca"), kind: "individual", legalName: "", contactName: "x" }).legalName).toMatch(/full name/);
  });
});
