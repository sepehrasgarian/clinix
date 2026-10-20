import { z } from "zod";
import { Discipline, FindingKind, type Clinic, type Finding, type Review } from "@clinix/contracts";
import { dedupeFindings, validateFinding, type ProposedFinding } from "../lib/citations.js";
import { newId } from "../lib/ids.js";
import { env } from "../env.js";
import { miningSystem, miningUser } from "../prompts/mine.js";
import type { PipelineDeps } from "./deps.js";

export const MIN_REVIEWS_TO_MINE = 3;
const MAX_REVIEWS_PER_BUSINESS = 60;

const MinedOutput = z.object({
  findings: z.array(
    z.object({
      kind: FindingKind,
      claim: z.string().min(10).max(240),
      whyItMatters: z.string().min(10).max(600),
      evidence: z.array(z.object({ reviewId: z.string(), quote: z.string().min(1).max(240) })).min(1).max(6),
      confidence: z.enum(["confirmed", "likely"]),
    }),
  ),
});

export type Business = { placeId: string | null; name: string; discipline: Discipline; reviews: Review[] };

/** Phase 6: one Claude call per business through its discipline pack, then the validator. */
export async function mineBusiness(clinic: Clinic, business: Business, deps: PipelineDeps): Promise<Finding[]> {
  if (business.reviews.length < MIN_REVIEWS_TO_MINE) return [];
  const reviews = business.reviews.slice(0, MAX_REVIEWS_PER_BUSINESS);
  const { findings } = await deps.ai.structured({
    schema: MinedOutput,
    system: await miningSystem(business.discipline, deps.guides),
    user: miningUser({ businessName: business.name, isOwnClinic: business.placeId === null, ownerClinicName: clinic.name, services: clinic.services, reviews }),
    tier: env.MINING_TIER,
  });
  const byId = new Map(reviews.map((r) => [r.id, r]));
  return findings.map((f) => {
    const proposed: ProposedFinding = {
      id: newId("f"),
      discipline: business.discipline,
      competitorPlaceId: business.placeId,
      kind: f.kind,
      claim: f.claim,
      whyItMatters: f.whyItMatters,
      evidence: f.evidence,
      confidence: f.confidence,
    };
    return validateFinding(proposed, byId);
  });
}

export async function mineAll(clinic: Clinic, businesses: Business[], deps: PipelineDeps): Promise<Finding[]> {
  const results = await Promise.all(
    businesses.map((b) => mineBusiness(clinic, b, deps).catch(() => [] as Finding[])), // one failed business must not fail the run
  );
  return dedupeFindings(results.flat());
}
