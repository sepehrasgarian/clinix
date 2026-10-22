import { z } from "zod";
import { Discipline, Id, IsoDate } from "./common";
import { Place } from "./place";
import { Report } from "./report";
import { Understanding } from "./site";

export const AnalysisStage = z.enum(["quick_scan", "discovery", "deep"]);
export type AnalysisStage = z.infer<typeof AnalysisStage>;

export const AnalysisStatus = z.enum([
  "queued",
  "running",
  "awaiting_services",
  "awaiting_competitors",
  "succeeded",
  "failed",
]);
export type AnalysisStatus = z.infer<typeof AnalysisStatus>;

export const PhaseId = z.enum([
  "validate",
  "enrich",
  "understand",
  "discover",
  "reviews",
  "websites",
  "mine",
  "synthesize",
]);
export type PhaseId = z.infer<typeof PhaseId>;

export const PHASE_LABELS: Record<PhaseId, string> = {
  validate: "Checking your details",
  enrich: "Finding your clinic on Google",
  understand: "Reading your website",
  discover: "Finding competitors near you",
  reviews: "Reading patient reviews",
  websites: "Reading competitor websites",
  mine: "Looking for patterns with evidence",
  synthesize: "Writing your action plan",
};

export const PhaseProgress = z.object({
  phase: PhaseId,
  status: z.enum(["pending", "running", "done", "skipped", "failed"]),
  startedAt: IsoDate.optional(),
  finishedAt: IsoDate.optional(),
  error: z.string().optional(),
});
export type PhaseProgress = z.infer<typeof PhaseProgress>;

export const ScanHint = z.object({
  kind: z.enum(["review_gap", "rating_gap", "rating_strength", "no_website", "crowded_market"]),
  text: z.string(),
  /** One line on why it matters. Older scans have none. */
  why: z.string().optional(),
});
export type ScanHint = z.infer<typeof ScanHint>;


/** A clinic of the same kind near the owner's, as measured in the quick scan. */
export const NearbyClinic = z.object({
  placeId: z.string(),
  name: z.string(),
  lat: z.number(),
  lng: z.number(),
  rating: z.number().min(0).max(5).optional(),
  reviewCount: z.number().int().nonnegative().optional(),
  distanceKm: z.number().nonnegative(),
});
export type NearbyClinic = z.infer<typeof NearbyClinic>;

export const ScanResult = z.object({
  place: Place,
  understanding: Understanding,
  hints: z.array(ScanHint),
  competitorCountsPerService: z.array(z.object({ service: z.string(), count: z.number().int() })),
  /** The nearby clinics found, nearest first. Older scans have none. */
  nearby: z.array(NearbyClinic).default([]),
  /** How far the search looked, in km. */
  radiusKm: z.number().default(5),
  /** True when the search hit its limit, so the real number is higher ("28+"). */
  nearbyCapped: z.boolean().default(false),
});
export type ScanResult = z.infer<typeof ScanResult>;

export const CompetitorCandidate = z.object({
  place: Place,
  distanceKm: z.number(),
  ring: z.enum(["hyperlocal", "local", "city"]),
  relevance: z.number().min(0).max(100),
  flag: z.enum(["strong", "borderline", "irrelevant"]),
  reason: z.string(),
  disciplines: z.array(Discipline),
});
export type CompetitorCandidate = z.infer<typeof CompetitorCandidate>;

export const DiscoveryResult = z.object({
  candidates: z.array(CompetitorCandidate),
  selectedPlaceIds: z.array(z.string()),
});
export type DiscoveryResult = z.infer<typeof DiscoveryResult>;

export const Analysis = z.object({
  id: Id,
  clinicId: Id,
  stage: AnalysisStage,
  status: AnalysisStatus,
  phases: z.array(PhaseProgress),
  scan: ScanResult.optional(),
  discovery: DiscoveryResult.optional(),
  report: Report.optional(),
  error: z.string().optional(),
  createdAt: IsoDate,
  updatedAt: IsoDate,
});
export type Analysis = z.infer<typeof Analysis>;
