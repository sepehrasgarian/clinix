import { z } from "zod";
import { Discipline, type Clinic, type Finding, type Recommendation, type Scorecard } from "@clinix/contracts";
import { newId } from "../lib/ids.js";
import { synthesizeSystem } from "../prompts/mine.js";
import type { PipelineDeps } from "./deps.js";

const PlanOutput = z.object({
  summary: z.string().min(20).max(600),
  scorecardSummary: z.string().min(10).max(240),
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
        disciplines: z.array(Discipline).min(1),
      }),
    )
    .min(3)
    .max(10),
});

export type Synthesis = { summary: string; scorecardSummary: string; recommendations: Recommendation[] };

/** Phase 7: the ranked plan. Only kept findings are offered; invented finding ids are dropped. */
export async function synthesizePlan(clinic: Clinic, findings: Finding[], scorecard: Scorecard, competitorNames: Map<string, string>, isNew: boolean, deps: PipelineDeps): Promise<Synthesis> {
  const kept = findings.filter((f) => f.status === "kept");
  const lines = kept.map(
    (f) => `[${f.id}] (${f.kind}, ${f.confidence}, about ${f.competitorPlaceId === null ? "the owner's clinic" : competitorNames.get(f.competitorPlaceId) ?? "a competitor"}) ${f.claim} — ${f.whyItMatters}`,
  );
  const score = scorecard.dimensions.map((d) => `${d.label}: ${d.score}/100 — ${d.summary}`).join("\n");
  const user = [
    `Clinic: ${clinic.name}, ${clinic.city}. Disciplines: ${clinic.disciplines.join(", ")}. Services: ${clinic.services.join(", ") || "not specified"}.`,
    isNew ? "The clinic opened less than two years ago." : "",
    `\nSCORECARD\n${score}`,
    `\nVERIFIED FINDINGS (${kept.length})\n${lines.join("\n")}`,
  ].join("\n");

  const out = await deps.ai.structured({ schema: PlanOutput, system: await synthesizeSystem(deps.guides), user, tier: "strong" });
  const known = new Set(kept.map((f) => f.id));
  const recommendations: Recommendation[] = out.recommendations
    .map((r) => ({ ...r, id: newId("rec"), findingIds: r.findingIds.filter((id) => known.has(id)), status: "todo" as const }))
    .filter((r) => r.findingIds.length > 0);
  return { summary: out.summary, scorecardSummary: out.scorecardSummary, recommendations };
}
