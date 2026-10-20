import { z } from "zod";
import { primaryDiscipline, type Clinic, type Competitor, type Discipline, type DisciplineSection, type Finding, type Recommendation, type Review } from "@clinix/contracts";
import { newId } from "../lib/ids.js";
import { log } from "../lib/log.js";
import { disciplineSectionSystem, disciplineSectionUser } from "../prompts/discipline.js";
import type { PipelineDeps } from "./deps.js";
import { mineAll, type Business } from "./mine.js";

/**
 * One agent per discipline the clinic offers. It reads the clinic's own reviews and its rivals'
 * reviews through that discipline's guide (phase "mine"), and later writes the discipline's
 * section from the verified findings, given the clinic-wide plan so it never repeats it.
 */
export type DisciplineInputs = {
  discipline: Discipline;
  ownReviews: Review[];
  competitors: { competitor: Competitor; reviews: Review[] }[];
};

/** Which competitors each discipline agent owns: a competitor belongs to its primary discipline. */
export function assignCompetitors(disciplines: Discipline[], competitors: Competitor[]): Map<Discipline, Competitor[]> {
  const map = new Map<Discipline, Competitor[]>(disciplines.map((d) => [d, []]));
  for (const c of competitors) map.get(primaryDiscipline(c.disciplines, disciplines))?.push(c);
  return map;
}

export async function mineDiscipline(clinic: Clinic, input: DisciplineInputs, deps: PipelineDeps): Promise<Finding[]> {
  const businesses: Business[] = [
    { placeId: null, name: clinic.name, discipline: input.discipline, reviews: input.ownReviews },
    ...input.competitors.map((c) => ({ placeId: c.competitor.placeId, name: c.competitor.name, discipline: input.discipline, reviews: c.reviews })),
  ];
  const t0 = Date.now();
  const findings = await mineAll(clinic, businesses, deps);
  log.info({ discipline: input.discipline, businesses: businesses.length, findings: findings.length, ms: Date.now() - t0 }, "discipline agent mined");
  return findings;
}

const SectionOutput = z.object({
  summary: z.string().min(10).max(400),
  leader: z.object({ name: z.string(), reason: z.string().max(300) }).nullable(),
  patientDemand: z.array(z.string().max(80)).max(8),
  statements: z.array(z.object({ text: z.string().min(10).max(300), findingIds: z.array(z.string()).min(1).max(6) })).max(4),
  recommendations: z
    .array(
      z.object({
        title: z.string().min(5).max(120),
        rationale: z.string().min(10).max(500),
        impact: z.enum(["low", "medium", "high"]),
        effort: z.enum(["low", "medium", "high"]),
        horizon: z.enum(["now", "30d", "90d"]),
        firstStep: z.string().min(5).max(300),
        expectedOutcome: z.string().min(5).max(300),
        findingIds: z.array(z.string()).min(1).max(6),
      }),
    )
    .max(4),
});

export async function writeDisciplineSection(
  clinic: Clinic,
  input: { discipline: Discipline; competitors: Competitor[]; findings: Finding[]; clinicPlan: Recommendation[]; rating?: number; reviewCount?: number; positioning: string },
  deps: PipelineDeps,
): Promise<DisciplineSection> {
  const kept = input.findings.filter((f) => f.status === "kept");
  const known = new Set(kept.map((f) => f.id));
  const out = await deps.ai.structured({
    schema: SectionOutput,
    system: await disciplineSectionSystem(deps.guides),
    user: disciplineSectionUser({ clinic, discipline: input.discipline, competitors: input.competitors, findings: kept, clinicPlan: input.clinicPlan, rating: input.rating, reviewCount: input.reviewCount, positioning: input.positioning }),
    tier: "strong",
  });
  const leaderMatch = out.leader ? input.competitors.find((c) => c.name.toLowerCase() === out.leader!.name.toLowerCase() || out.leader!.name.toLowerCase().includes(c.name.toLowerCase())) : undefined;
  return {
    discipline: input.discipline,
    leader: leaderMatch && out.leader ? { placeId: leaderMatch.placeId, name: leaderMatch.name, reason: out.leader.reason } : undefined,
    patientDemand: out.patientDemand,
    statements: out.statements.map((s) => ({ ...s, findingIds: s.findingIds.filter((id) => known.has(id)) })).filter((s) => s.findingIds.length > 0),
    recommendations: out.recommendations
      .map((r) => ({ ...r, id: newId("rec"), findingIds: r.findingIds.filter((id) => known.has(id)), disciplines: [input.discipline], status: "todo" as const }))
      .filter((r) => r.findingIds.length > 0),
    summary: out.summary,
    competitorPlaceIds: input.competitors.map((c) => c.placeId),
  };
}
