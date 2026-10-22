export const PROVINCES = [
  { code: "AB", name: "Alberta" }, { code: "BC", name: "British Columbia" }, { code: "MB", name: "Manitoba" }, { code: "NB", name: "New Brunswick" },
  { code: "NL", name: "Newfoundland and Labrador" }, { code: "NS", name: "Nova Scotia" }, { code: "NT", name: "Northwest Territories" }, { code: "NU", name: "Nunavut" },
  { code: "ON", name: "Ontario" }, { code: "PE", name: "Prince Edward Island" }, { code: "QC", name: "Québec" }, { code: "SK", name: "Saskatchewan" }, { code: "YT", name: "Yukon" },
] as const;
export type ProvinceCode = (typeof PROVINCES)[number]["code"];

type Rule = { label: string; rate: number };
const GST: Rule = { label: "GST", rate: 5 };
const hst = (rate: number): Rule[] => [{ label: "HST", rate }];

/** Sales taxes on software, by province, as percentages. These are estimates for display; the invoice is what counts. */
const RULES: Record<ProvinceCode, Rule[]> = {
  AB: [GST], NT: [GST], NU: [GST], YT: [GST],
  BC: [GST, { label: "BC PST", rate: 7 }],
  SK: [GST, { label: "Saskatchewan PST", rate: 6 }],
  MB: [GST, { label: "Manitoba RST", rate: 7 }],
  QC: [GST, { label: "Québec QST", rate: 9.975 }],
  ON: hst(13), NB: hst(15), NL: hst(15), NS: hst(15), PE: hst(15),
};

export type TaxLine = { label: string; rate: number; cents: number };

/** Each tax is rounded to the cent on its own, as an invoice shows it. Amounts are whole cents so nothing drifts. */
export function taxLines(subtotalCents: number, province: ProvinceCode): TaxLine[] {
  return RULES[province].map((r) => ({ label: `${r.label} (${r.rate}%)`, rate: r.rate, cents: Math.round((subtotalCents * r.rate) / 100) }));
}

export const provinceFrom = (text: string | undefined): ProvinceCode | null => {
  if (!text) return null;
  const t = text.trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  return PROVINCES.find((p) => p.code.toLowerCase() === t || p.name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "") === t)?.code ?? null;
};
