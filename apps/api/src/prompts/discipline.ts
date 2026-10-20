import { DISCIPLINE_LABELS, type Clinic, type Competitor, type Discipline, type Finding, type Recommendation } from "@clinix/contracts";
import type { GuideLibrary } from "./guides.js";

/** The discipline section prompt: the private plan prompt when present, else the bundled one. */
export const disciplineSectionSystem = (guides: GuideLibrary): Promise<string> => guides.prompt("discipline_plan_system.txt").catch(() => guides.prompt("discipline_section_system.txt"));

export function disciplineSectionUser(input: {
  clinic: Clinic;
  discipline: Discipline;
  rating?: number;
  reviewCount?: number;
  positioning: string;
  competitors: Competitor[];
  findings: Finding[];
  clinicPlan: Recommendation[];
  /** What rivals' websites say, one line each, from `siteSummaryLines`. */
  rivalSites?: string;
}): string {
  const label = DISCIPLINE_LABELS[input.discipline];
  const nameOf = (id: string | null) => (id === null ? "the clinic itself" : input.competitors.find((c) => c.placeId === id)?.name ?? "a rival");
  const rivals = input.competitors.length
    ? input.competitors.map((c) => `- ${c.name}: ${c.distanceKm} km away, ${c.rating ?? "?"} rating, ${c.reviewCount ?? "?"} reviews, ${c.reviewsAnalyzed} reviews read`).join("\n")
    : "No rival was analysed for this discipline.";
  const intelligence = input.findings.length
    ? input.findings.map((f) => `[${f.id}] (${f.kind}, ${f.confidence}, about ${nameOf(f.competitorPlaceId)}) ${f.claim} — ${f.whyItMatters}`).join("\n")
    : "No verified findings for this discipline.";
  const plan = input.clinicPlan.length ? input.clinicPlan.map((r) => `- ${r.title}`).join("\n") : "(none yet)";
  return [
    `# Discipline\n${label}`,
    `\n# Clinic\nName: ${input.clinic.name}\nAddress: ${input.clinic.address}, ${input.clinic.city}\nWebsite: ${input.clinic.website ?? "none"}\nGoogle rating of the whole listing: ${input.rating ?? "?"} (${input.reviewCount ?? "?"} reviews) — clinic-wide, not specific to ${label}\nPositioning: ${input.positioning}`,
    `\n# Local rivals in ${label}\n${rivals}`,
    `\n# Rival intelligence (${label}) — verified findings; cite their ids\n${intelligence}`,
    `\n# Services rivals list that you don't\n${input.rivalSites ?? "No competitor website could be read in this report."}`,
    `\n# Already in the clinic-wide plan — do not repeat these\n${plan}`,
    `\nReturn the section for ${label}. Every statement and every action must cite at least one finding id from the list above.`,
  ].join("\n");
}
