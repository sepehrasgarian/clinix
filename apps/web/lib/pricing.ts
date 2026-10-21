export type PlanId = "essential" | "growth" | "scale";

/** Monthly list price in CAD. Annual billing is ten months, shown as a per-month price. */
export const monthlyPrice: Record<PlanId, number> = { essential: 149, growth: 349, scale: 799 };
export const planOrder: readonly PlanId[] = ["essential", "growth", "scale"];

export const yearlyPrice = (plan: PlanId) => monthlyPrice[plan] * 10;
export const yearlyPerMonth = (plan: PlanId) => yearlyPrice(plan) / 12;

/** Canadian dollars in the visitor's locale: $1,490.00 in English, 1\u00a0490,00\u00a0$ in French. */
export const money = (n: number, locale = "en-CA") => new Intl.NumberFormat(locale, { style: "currency", currency: "CAD", currencyDisplay: "narrowSymbol", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
export const whole = (n: number, locale = "en-CA") => new Intl.NumberFormat(locale, { style: "currency", currency: "CAD", currencyDisplay: "narrowSymbol", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);

/** What each answer in the plan finder demands: 0 = Essential, 1 = Growth, 2 = Scale. */
export const finderLevels = {
  locations: [0, 1, 2, 2],
  disciplines: [0, 1, 2, 2],
  seo: [0, 1],
  strategy: [0, 2],
} as const;

export type FinderKey = keyof typeof finderLevels;
export type FinderAnswers = Partial<Record<FinderKey, number>>;

/** The smallest plan that covers every answer. `extras` is true when the answers go past what Scale includes. */
export function recommendPlan(answers: FinderAnswers): { plan: PlanId; extras: boolean } {
  const level = Math.max(0, ...(Object.keys(answers) as FinderKey[]).map((k) => finderLevels[k][answers[k] ?? 0]));
  const extras = answers.locations === 3 || answers.disciplines === 3;
  return { plan: planOrder[level], extras };
}
