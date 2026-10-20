import { describe, expect, it, vi } from "vitest";
import type { Clinic, Competitor, Finding } from "@clinix/contracts";
import { assignCompetitors, writeDisciplineSection } from "../../src/pipeline/disciplineAgent.js";
import type { PipelineDeps } from "../../src/pipeline/deps.js";
import { testGuides } from "../helpers.js";

const clinic: Clinic = { id: "c", ownerId: "u", name: "Réhabital", address: "5800 Cavendish", city: "Côte Saint-Luc", disciplines: ["physiotherapy", "massage"], services: [], createdAt: "2026-10-19T00:00:00.000Z" };
const comp = (placeId: string, name: string, disciplines: Competitor["disciplines"]): Competitor => ({ placeId, name, distanceKm: 1, rating: 4.8, reviewCount: 100, disciplines, reviewsAnalyzed: 40 });

describe("assignCompetitors", () => {
  it("gives each competitor to its primary discipline only", () => {
    const map = assignCompetitors(clinic.disciplines, [comp("a", "Dena", ["physiotherapy", "massage"]), comp("b", "Flux", ["massage"]), comp("c", "Spa", ["day_spa"])]);
    expect(map.get("physiotherapy")?.map((c) => c.name)).toEqual(["Dena"]);
    expect(map.get("massage")?.map((c) => c.name)).toEqual(["Flux"]);
    expect([...map.values()].flat()).toHaveLength(2); // the spa belongs to no offered discipline
  });
});

describe("writeDisciplineSection", () => {
  const finding = (id: string, who: string | null): Finding => ({ id, discipline: "massage", competitorPlaceId: who, kind: "strength", claim: `claim ${id}`, whyItMatters: "w", evidence: [], confidence: "likely", status: "kept" });
  const deps = {
    guides: testGuides(),
    ai: {
      structured: vi.fn(async () => ({
        summary: "You lose massage patients on continuity.",
        leader: { name: "flux therapeutique", reason: "Most massage reviews nearby." },
        patientDemand: ["deep tissue", "prenatal"],
        statements: [
          { text: "Flux is praised for remembering pressure preferences.", findingIds: ["f1"] },
          { text: "Made up statement.", findingIds: ["f_nope"] },
        ],
        recommendations: [
          { title: "Name your massage therapists on the site", rationale: "r", impact: "medium", effort: "low", horizon: "now", firstStep: "s", expectedOutcome: "o", findingIds: ["f1", "f_nope"] },
          { title: "Ghost action", rationale: "r", impact: "low", effort: "low", horizon: "90d", firstStep: "s", expectedOutcome: "o", findingIds: ["f_nope"] },
        ],
      })),
    },
  } as unknown as PipelineDeps;

  it("keeps only statements and actions that cite verified findings, and resolves the leader to a known rival", async () => {
    const section = await writeDisciplineSection(
      clinic,
      { discipline: "massage", competitors: [comp("b", "Flux Therapeutique", ["massage"])], findings: [finding("f1", "b"), { ...finding("f2", null), status: "rejected" }], clinicPlan: [], positioning: "p" },
      deps,
    );
    expect(section.leader).toMatchObject({ placeId: "b", name: "Flux Therapeutique" });
    expect(section.statements).toHaveLength(1);
    expect(section.recommendations).toHaveLength(1);
    expect(section.recommendations[0]).toMatchObject({ findingIds: ["f1"], disciplines: ["massage"], status: "todo" });
    expect(section.competitorPlaceIds).toEqual(["b"]);
    const user = (deps.ai.structured as ReturnType<typeof vi.fn>).mock.calls[0][0].user as string;
    expect(user).toMatch(/# Discipline\nMassage therapy/);
    expect(user).not.toContain("f2"); // rejected findings are never offered
  });
});
