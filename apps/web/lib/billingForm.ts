import { EMAIL, POSTAL } from "./checkout";
import { provinceFrom, type ProvinceCode } from "./tax";

/** What the owner enters for the invoice. Never a card: card details live only in the form while it is open. */
export type BillingDraft = {
  kind: "business" | "individual";
  legalName: string;
  contactName: string;
  email: string;
  sameAddress: boolean;
  province: ProvinceCode;
  postalCode: string;
  street: string;
  unit: string;
  city: string;
  gstNumber: string;
  qstNumber: string;
  language: "en" | "fr";
};

type ClinicAddress = { name: string; address: string; city: string; province?: string };

/** The clinic's own address, split into the invoice's fields as far as it can be read. */
export function defaultBilling(clinic: ClinicAddress, email: string | null): BillingDraft {
  const postal = clinic.address.match(/[A-Za-z]\d[A-Za-z] ?\d[A-Za-z]\d/)?.[0].toUpperCase() ?? "";
  const fromAddress = clinic.address.match(/,\s*([A-Z]{2})\b/)?.[1];
  return {
    kind: "business",
    legalName: clinic.name,
    contactName: "",
    email: email ?? "",
    sameAddress: true,
    province: provinceFrom(clinic.province) ?? provinceFrom(fromAddress) ?? "QC",
    postalCode: postal.length === 6 ? `${postal.slice(0, 3)} ${postal.slice(3)}` : postal,
    street: clinic.address.split(",")[0].trim(),
    unit: "",
    city: clinic.city,
    gstNumber: "",
    qstNumber: "",
    language: "en",
  };
}

export type BillingErrors = Partial<Record<"legalName" | "contactName" | "email" | "postalCode" | "street" | "city", string>>;

export function billingErrors(b: BillingDraft): BillingErrors {
  const e: BillingErrors = {};
  if (!b.legalName.trim()) e.legalName = b.kind === "business" ? "Enter your legal business name." : "Enter your full name.";
  if (!b.contactName.trim()) e.contactName = "Enter the name of the person we contact about billing.";
  if (!EMAIL.test(b.email.trim())) e.email = "Enter an email address, like name@clinic.ca.";
  if (!POSTAL.test(b.postalCode.trim())) e.postalCode = "Enter a Canadian postal code, like H4W 2T5.";
  if (!b.street.trim()) e.street = "Enter the street address.";
  if (!b.city.trim()) e.city = "Enter the city.";
  return e;
}
