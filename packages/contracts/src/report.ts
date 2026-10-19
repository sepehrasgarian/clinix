import { z } from "zod";
import { Discipline, Id, IsoDate } from "./common";
import { Review } from "./place";

export const ReviewCitation = z.object({
  reviewId: Id,
  quote: z.string().min(1),
});
export type ReviewCitation = z.infer<typeof ReviewCitation>;

export const FindingKind = z.enum([
  "strength",
  "weakness",
  "unmet_demand",
  "switching_reason",
  "admin_friction",
  "access",
]);
export type FindingKind = z.infer<typeof FindingKind>;

/** One evidence-backed observation about a competitor (or the clinic itself when competitorPlaceId is null). */
export const Finding = z.object({
  id: Id,
  discipline: Discipline,
  competitorPlaceId: z.string().nullable(),
  kind: FindingKind,
  claim: z.string(),
  whyItMatters: z.string(),
  evidence: z.array(ReviewCitation),
  confidence: z.enum(["confirmed", "likely"]),
  status: z.enum(["kept", "rejected"]),
  rejectionReason: z.enum(["too_few_reviews", "quote_not_found", "duplicate"]).optional(),
});
export type Finding = z.infer<typeof Finding>;

export const Recommendation = z.object({
  id: Id,
  title: z.string(),
  rationale: z.string(),
  impact: z.enum(["low", "medium", "high"]),
  effort: z.enum(["low", "medium", "high"]),
  horizon: z.enum(["now", "30d", "90d"]),
  firstStep: z.string(),
  expectedOutcome: z.string(),
  findingIds: z.array(Id),
  disciplines: z.array(Discipline),
  status: z.enum(["todo", "in_progress", "done"]).default("todo"),
});
export type Recommendation = z.infer<typeof Recommendation>;

export const ScoreDimensionKey = z.enum([
  "google_profile",
  "review_count",
  "rating",
  "review_velocity",
  "owner_responsiveness",
  "service_breadth",
  "language_coverage",
]);
export type ScoreDimensionKey = z.infer<typeof ScoreDimensionKey>;

export const ScoreDimension = z.object({
  key: ScoreDimensionKey,
  label: z.string(),
  score: z.number().min(0).max(100),
  summary: z.string(),
});

export const Scorecard = z.object({
  dimensions: z.array(ScoreDimension),
  overall: z.number().min(0).max(100),
  summary: z.string(),
});
export type Scorecard = z.infer<typeof Scorecard>;

export const Competitor = z.object({
  placeId: z.string(),
  name: z.string(),
  distanceKm: z.number(),
  rating: z.number().optional(),
  reviewCount: z.number().int().optional(),
  website: z.string().optional(),
  disciplines: z.array(Discipline),
  reviewsAnalyzed: z.number().int().nonnegative(),
});
export type Competitor = z.infer<typeof Competitor>;

export const EvidenceLedger = z.object({
  proposed: z.number().int(),
  kept: z.number().int(),
  rejected: z.number().int(),
  rejectedReasons: z.array(z.object({ reason: z.string(), count: z.number().int() })),
});
export type EvidenceLedger = z.infer<typeof EvidenceLedger>;

export const RunDiff = z.object({
  previousAnalysisId: Id,
  previousGeneratedAt: IsoDate,
  ratingDelta: z.number(),
  reviewCountDelta: z.number().int(),
  newFindingIds: z.array(Id),
  resolvedFindingIds: z.array(Id),
  completedRecommendationIds: z.array(Id),
  summary: z.string(),
});
export type RunDiff = z.infer<typeof RunDiff>;

export const Report = z.object({
  analysisId: Id,
  clinicId: Id,
  generatedAt: IsoDate,
  summary: z.string(),
  scorecard: Scorecard,
  competitors: z.array(Competitor),
  findings: z.array(Finding),
  recommendations: z.array(Recommendation),
  ledger: EvidenceLedger,
  diff: RunDiff.optional(),
  thinReport: z.boolean(),
  /** Every review cited by a finding, so the report is self-contained. */
  reviews: z.array(Review).default([]),
});
export type Report = z.infer<typeof Report>;
