import type { Analysis, Finding, Recommendation, Report } from "@clinix/contracts";

/** Pure helpers the report screens share. No fetching, no React. */

export type Ranked = { placeId: string | null; name: string; reviewCount: number; rating?: number; distanceKm?: number; isYou: boolean };

/** The clinic and its chosen competitors ranked by Google review count, the first thing patients compare in Maps. */
export function rankByReviews(report: Report, analysis: Analysis, clinicName: string): Ranked[] {
  const you: Ranked = { placeId: null, name: clinicName, reviewCount: analysis.scan?.place.reviewCount ?? 0, rating: analysis.scan?.place.rating, isYou: true };
  const rivals: Ranked[] = report.competitors.map((c) => ({ placeId: c.placeId, name: c.name, reviewCount: c.reviewCount ?? 0, rating: c.rating, distanceKm: c.distanceKm, isYou: false }));
  return [you, ...rivals].sort((a, b) => b.reviewCount - a.reviewCount);
}

export const positionOf = (ranked: Ranked[]): { rank: number; of: number } => ({ rank: ranked.findIndex((r) => r.isYou) + 1, of: ranked.length });

const impactRank = { high: 3, medium: 2, low: 1 } as const;
const effortRank = { low: 3, medium: 2, high: 1 } as const;

/** Clinic-wide actions ranked by impact against effort, done ones last. */
export function rankedActions(report: Report): Recommendation[] {
  return [...report.recommendations].sort((a, b) => Number(a.status === "done") - Number(b.status === "done") || impactRank[b.impact] + effortRank[b.effort] - (impactRank[a.impact] + effortRank[a.effort]));
}

/** The next three actions not yet done. */
export const nextMoves = (report: Report, n = 3): Recommendation[] => rankedActions(report).filter((r) => r.status !== "done").slice(0, n);

export const findingsFor = (report: Report, rec: Recommendation): Finding[] => rec.findingIds.map((id) => report.findings.find((f) => f.id === id)).filter((f): f is Finding => !!f);

/** Strongest and weakest measured dimension, for the key takeaways. */
export function takeaways(report: Report): { strongest: Report["scorecard"]["dimensions"][number]; weakest: Report["scorecard"]["dimensions"][number] } {
  const dims = [...report.scorecard.dimensions].sort((a, b) => b.score - a.score);
  return { strongest: dims[0], weakest: dims[dims.length - 1] };
}

export const horizonGroups: { key: Recommendation["horizon"]; label: string }[] = [
  { key: "now", label: "This week" },
  { key: "30d", label: "This month" },
  { key: "90d", label: "This quarter" },
];

export const competitorName = (report: Report, placeId: string | null, you = "Your clinic"): string => (placeId === null ? you : report.competitors.find((c) => c.placeId === placeId)?.name ?? "A competitor");

/** The same ranking limited to one discipline's competitors. */
export const rankWithin = (ranked: Ranked[], placeIds: string[]): Ranked[] => ranked.filter((r) => r.isYou || placeIds.includes(r.placeId ?? ""));

export type GoalStep = { rank: number; passName: string; reviewsNeeded: number; perMonth: number; months: number };

/** Up to three rungs above the clinic: who to pass, how many reviews it takes, and a steady pace to get there. */
export function reviewGoal(ranked: Ranked[]): GoalStep[] {
  const me = ranked.find((r) => r.isYou);
  if (!me) return [];
  const above = ranked.filter((r) => !r.isYou && r.reviewCount > me.reviewCount).sort((a, b) => a.reviewCount - b.reviewCount).slice(0, 3);
  return above.map((r, i) => {
    const reviewsNeeded = r.reviewCount - me.reviewCount + 1;
    const perMonth = Math.max(4, Math.ceil(reviewsNeeded / 12));
    return { rank: ranked.indexOf(me) - i, passName: r.name, reviewsNeeded, perMonth, months: Math.ceil(reviewsNeeded / perMonth) };
  });
}

/** A clinic opened less than two years ago is told to build steadily, never that it has too few reviews. */
export const isNewClinic = (opened: string | undefined, now = new Date()): boolean => {
  if (!opened) return false;
  const [y, m = "01"] = opened.split("-");
  return now.getTime() - new Date(Number(y), Number(m) - 1, 1).getTime() < 2 * 365 * 24 * 3600 * 1000;
};

/** Median of a list, 0 when empty. */
export const median = (xs: number[]): number => {
  const s = [...xs].sort((a, b) => a - b);
  return s.length ? s[Math.floor(s.length / 2)] : 0;
};
