import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Analysis, Review } from "@clinix/contracts";
import { fixtureAnalysis, fixtureReviews } from "@clinix/contracts/fixtures";
import { resetDbForTests } from "../../src/db/connection.js";
import { createClinic } from "../../src/db/clinics.js";
import { createAnalysis, getAnalysis, saveDiscovery, saveScan, transition } from "../../src/db/analyses.js";
import { collectReviews } from "../../src/pipeline/reviews.js";
import { startDeep } from "../../src/pipeline/runner.js";
import type { PipelineDeps } from "../../src/pipeline/deps.js";
import { testGuides } from "../helpers.js";

const input = { name: "Finch East Family Dental", address: "77 Finch Ave E", city: "Toronto", province: "ON", disciplines: ["dentistry" as const], services: ["cleaning"], opened: "2019-03" };

/** The model proposes two good findings, one with a made-up quote, and a plan that cites one bad id. */
function fakeAi() {
  return {
    readWeb: vi.fn(),
    structured: vi.fn(async ({ user }: { user: string }) => {
      if (user.startsWith("# Discipline")) {
        const ids = [...user.matchAll(/\[(f_[a-z0-9]+)\]/g)].map((m) => m[1]);
        return {
          summary: "Section summary.",
          leader: null,
          patientDemand: ["cleanings"],
          statements: ids.length ? [{ text: "A statement.", findingIds: [ids[0]] }] : [],
          recommendations: ids.length ? [{ title: "Do one discipline thing", rationale: "r", impact: "medium", effort: "low", horizon: "now", firstStep: "s", expectedOutcome: "o", findingIds: [ids[0]] }] : [],
        };
      }
      if (user.includes("VERIFIED FINDINGS")) {
        const ids = [...user.matchAll(/\[(f_[a-z0-9]+)\]/g)].map((m) => m[1]);
        return {
          summary: "You are rated well but lose on convenience.",
          scorecardSummary: "Strong reputation, weak access.",
          recommendations: [
            { title: "Add online booking", rationale: "r", impact: "high", effort: "low", horizon: "now", firstStep: "s", expectedOutcome: "o", findingIds: [ids[0], "f_invented"], disciplines: ["dentistry"] },
            { title: "Open one Saturday", rationale: "r", impact: "high", effort: "medium", horizon: "30d", firstStep: "s", expectedOutcome: "o", findingIds: [ids[0]], disciplines: ["dentistry"] },
            { title: "Ghost action", rationale: "r", impact: "low", effort: "low", horizon: "90d", firstStep: "s", expectedOutcome: "o", findingIds: ["f_invented"], disciplines: ["dentistry"] },
          ],
        };
      }
      const ids = [...user.matchAll(/\[id=([^\]]+)\]/g)].map((m) => m[1]);
      const own = user.includes("owner's OWN clinic");
      return {
        findings: [
          { kind: own ? "admin_friction" : "strength", claim: own ? "Waiting past appointment time is a repeated complaint" : "Patients praise online booking and Saturday hours", whyItMatters: "why it matters here", evidence: ids.slice(0, 2).map((id) => ({ reviewId: id, quote: quoteFrom(id) })), confidence: "confirmed" },
          { kind: "access", claim: "There is never any parking at this clinic", whyItMatters: "made up", evidence: [{ reviewId: ids[0], quote: "There is never any parking" }, { reviewId: ids[1], quote: "parking is a nightmare" }], confidence: "likely" },
        ],
      };
    }),
  } as unknown as PipelineDeps["ai"];
}
const byId = new Map(fixtureReviews.map((r) => [r.id, r]));
const quoteFrom = (id: string) => byId.get(id)!.text.slice(0, 40);

function deps(reviews: Review[] = fixtureReviews): PipelineDeps {
  return {
    places: {} as PipelineDeps["places"],
  guides: testGuides(),
    ai: fakeAi(),
    reviews: { fetchReviews: vi.fn(async (ids: string[]) => reviews.filter((r) => ids.includes(r.placeId))) },
  };
}

async function readyForDeep(): Promise<Analysis> {
  const clinic = await createClinic(input, "user_1");
  const a = await createAnalysis(clinic.id);
  await transition(a.id, "queued", { status: "running" });
  await saveScan(a.id, fixtureAnalysis.scan!);
  await transition(a.id, "running", { status: "awaiting_services" });
  await transition(a.id, "awaiting_services", { status: "queued", stage: "discovery" });
  await transition(a.id, "queued", { status: "running" });
  await saveDiscovery(a.id, fixtureAnalysis.discovery!);
  await transition(a.id, "running", { status: "awaiting_competitors" });
  await transition(a.id, "awaiting_competitors", { status: "queued", stage: "deep" });
  return (await getAnalysis(a.id))!;
}

describe("deep analysis", () => {
  beforeEach(async () => {
    await resetDbForTests();
  });

  it("produces a report with verified findings, a ledger, a scorecard and a plan that only cites real findings", async () => {
    const a = await readyForDeep();
    const d = deps();
    await startDeep(a.id, d);
    const after = (await getAnalysis(a.id))!;
    expect(after.status).toBe("succeeded");
    expect(after.phases.map((p) => p.status)).toEqual(["done", "done", "done"]);
    const report = after.report!;
    // 5 businesses, but one has fewer than three reviews and is skipped: 4 x 2 proposals.
    expect(report.findings.length).toBe(8);
    expect(report.ledger.kept).toBe(4);
    expect(report.ledger.rejected).toBe(4);
    expect(report.ledger.rejectedReasons).toEqual([{ reason: "quote_not_found", count: 4 }]);
    expect(report.findings.filter((f) => f.status === "kept").every((f) => f.evidence.length >= 2)).toBe(true);
    expect(report.recommendations.map((r) => r.title)).toEqual(["Add online booking", "Open one Saturday"]);
    expect(report.recommendations[0].findingIds).toHaveLength(1);
    expect(report.scorecard.dimensions).toHaveLength(7);
    expect(report.scorecard.summary).toBe("Strong reputation, weak access.");
    expect(report.competitors).toHaveLength(4);
    expect(report.reviews.length).toBeGreaterThan(0);
    expect(report.reviews.every((r) => report.findings.some((f) => f.evidence.some((e) => e.reviewId === r.id)))).toBe(true);
    expect(report.thinReport).toBe(true); // fixture competitors have 3-4 reviews each
    expect(report.diff).toBeUndefined();
    expect(report.disciplines).toHaveLength(1);
    expect(report.disciplines[0]).toMatchObject({ discipline: "dentistry", summary: "Section summary." });
    expect(report.disciplines[0].recommendations[0].disciplines).toEqual(["dentistry"]);
  });

  it("falls back to Google sample reviews when the review source fails, and still finishes", async () => {
    const a = await readyForDeep();
    const d = deps();
    (d.reviews.fetchReviews as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("Apify 402"));
    await startDeep(a.id, d);
    const after = (await getAnalysis(a.id))!;
    expect(after.status).toBe("succeeded");
    expect(after.report!.competitors.every((c) => c.reviewsAnalyzed === 0)).toBe(true); // fixture candidates carry no sample reviews
    expect(after.error).toBeUndefined();
  });

  it("fails cleanly with an owner-facing message when the plan cannot be written", async () => {
    const a = await readyForDeep();
    const d = deps();
    (d.ai.structured as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("Anthropic overloaded"));
    await startDeep(a.id, d);
    const after = (await getAnalysis(a.id))!;
    expect(after.status).toBe("failed");
    expect(after.error).not.toMatch(/anthropic/i);
  });
});

describe("collectReviews", () => {
  beforeEach(async () => {
    await resetDbForTests();
  });
  it("fetches once, then serves from the cache", async () => {
    const d = deps();
    const places = [fixtureAnalysis.scan!.place];
    const first = await collectReviews(places, d);
    expect(first.get("place_own")).toHaveLength(4);
    await collectReviews(places, d);
    expect(d.reviews.fetchReviews).toHaveBeenCalledTimes(1);
  });
});
