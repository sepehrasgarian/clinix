import { monthlyPrice, planOrder, type PlanId } from "./pricing";

export type FeatureId = "seo" | "analytics" | "geo" | "compare" | "support";
export const FEATURE_LABELS: Record<FeatureId, string> = {
  seo: "Website SEO audit",
  analytics: "Google Analytics & Search Console",
  geo: "GEO visibility tracking",
  compare: "Cross-location comparison",
  support: "Priority support",
};
const ALL: FeatureId[] = ["seo", "analytics", "geo", "compare", "support"];

/** What each plan covers. Locations and disciplines are caps; the features are what the plan includes. */
export const PLANS: Record<PlanId, { locations: number; disciplines: number; features: FeatureId[] }> = {
  essential: { locations: 1, disciplines: 1, features: [] },
  growth: { locations: 3, disciplines: 4, features: ["seo", "analytics", "support"] },
  scale: { locations: 6, disciplines: 6, features: ALL },
};

export type GoalId = "patients" | "competitors" | "google" | "seo" | "geo" | "growth" | "track" | "compare";
/** `feature` is set where a goal needs something only some plans include. */
export const GOALS: { id: GoalId; title: string; sub: string; feature?: FeatureId }[] = [
  { id: "patients", title: "Attract more local patients", sub: "See why nearby patients choose other clinics." },
  { id: "competitors", title: "Understand my local competitors", sub: "Their services, reviews and positioning, discipline by discipline." },
  { id: "google", title: "Improve Google visibility", sub: "Your Google profile and reviews against nearby clinics." },
  { id: "seo", title: "Improve website SEO", sub: "A technical and content audit of your own website.", feature: "seo" },
  { id: "geo", title: "Understand my GEO visibility", sub: "Whether chat-style search answers name your clinic.", feature: "geo" },
  { id: "growth", title: "Identify growth opportunities", sub: "Ranked actions, each backed by evidence." },
  { id: "track", title: "Track performance over time", sub: "Each report compared with the one before." },
  { id: "compare", title: "Compare multiple clinic locations", sub: "Your locations side by side.", feature: "compare" },
];
export const ANALYTICS_QUESTION = "Do you want to connect Google Analytics and Search Console?";

export type Needs = { locations: number; disciplines: number; goals: GoalId[]; analytics: boolean | null };
export type Need = { feature: FeatureId; because: string };

/** The "details" step is only asked when it can change the answer: the website SEO goal is what makes analytics relevant. */
export const needsDetails = (goals: GoalId[]) => goals.includes("seo");

/** Features the owner's answers call for, each with the answer that asked for it. Comparing needs more than one location. */
export function neededFeatures({ goals, analytics, locations }: Needs): Need[] {
  const out: Need[] = [];
  for (const id of ["seo", "geo", "compare"] as const) {
    const goal = GOALS.find((g) => g.id === id)!;
    if (goals.includes(id) && (id !== "compare" || locations > 1)) out.push({ feature: goal.feature!, because: `you chose “${goal.title}”` });
  }
  if (analytics && needsDetails(goals)) out.splice(1, 0, { feature: "analytics", because: `you answered yes to “${ANALYTICS_QUESTION}”` });
  return out;
}

/** Why a plan cannot serve these answers (empty when it can). */
export function misfits(plan: PlanId, needs: Needs): string[] {
  const p = PLANS[plan];
  const out: string[] = [];
  if (needs.locations > p.locations) out.push(`it covers up to ${p.locations} location${p.locations === 1 ? "" : "s"}`);
  if (needs.disciplines > p.disciplines) out.push(`it covers up to ${p.disciplines} discipline${p.disciplines === 1 ? "" : "s"}`);
  for (const n of neededFeatures(needs)) if (!p.features.includes(n.feature)) out.push(`it doesn't include ${FEATURE_LABELS[n.feature]}`);
  return out;
}

/** The least expensive plan that covers every answer. `beyond` is true when even Scale falls short on locations or disciplines. */
export function recommendedPlan(needs: Needs): { plan: PlanId; beyond: boolean } {
  const fits = planOrder.find((p) => misfits(p, needs).length === 0);
  return fits ? { plan: fits, beyond: false } : { plan: "scale", beyond: true };
}

/** One sentence per reason for the recommendation, in the order the owner answered. */
export function reasonsFor(plan: PlanId, needs: Needs): string[] {
  const p = PLANS[plan];
  const n = (count: number, word: string) => `${count} ${word}${count === 1 ? "" : "s"}`;
  const out = [`It covers your ${n(needs.locations, "location")} and ${n(needs.disciplines, "discipline")} — up to ${p.locations} and ${p.disciplines} on this plan.`];
  for (const need of neededFeatures(needs)) out.push(`It includes ${FEATURE_LABELS[need.feature]}, because ${need.because}.`);
  if (out.length === 1) out.push("It is the least expensive plan that covers what you told us.");
  return out;
}

export const yearlySaving = (plan: PlanId) => monthlyPrice[plan] * 2;
