import type { Analysis, Clinic, Competitor, Finding, Place, PhaseId, Report, Review } from "@clinix/contracts";
import { latestSucceeded } from "../db/analyses.js";
import { ledgerFor } from "../lib/citations.js";
import { buildRunDiff } from "../lib/diff.js";
import { isNewClinic } from "../lib/hints.js";
import { nowIso } from "../lib/ids.js";
import { buildScorecard, type Peer } from "../lib/scorecard.js";
import type { PipelineDeps } from "./deps.js";
import { mineAll, type Business } from "./mine.js";
import { collectReviews } from "./reviews.js";
import { synthesizePlan } from "./synthesize.js";

/** A report built on fewer than this many well-reviewed competitors is flagged as thin, not failed. */
export const MIN_SOLID_COMPETITORS = 3;
export const MIN_REVIEWS_SOLID = 10;

export type DeepHooks = { onPhase: (phase: Extract<PhaseId, "reviews" | "mine" | "synthesize">, fn: () => Promise<void>) => Promise<void> };

/** Phases 5-7 for one analysis that has a scan and a confirmed competitor selection. */
export async function runDeepAnalysis(clinic: Clinic, analysis: Analysis, deps: PipelineDeps, hooks: DeepHooks): Promise<Report> {
  const scan = analysis.scan;
  const discovery = analysis.discovery;
  if (!scan || !discovery) throw new Error("This analysis has no scan or competitor selection yet.");

  const chosen = discovery.candidates.filter((c) => discovery.selectedPlaceIds.includes(c.place.placeId));
  const places: Place[] = [scan.place, ...chosen.map((c) => c.place)];
  const nameOf = new Map(chosen.map((c) => [c.place.placeId, c.place.name]));

  let reviewsByPlace = new Map<string, Review[]>();
  await hooks.onPhase("reviews", async () => {
    reviewsByPlace = await collectReviews(places, deps);
  });

  const competitors: Competitor[] = chosen.map((c) => ({
    placeId: c.place.placeId,
    name: c.place.name,
    distanceKm: c.distanceKm,
    rating: c.place.rating,
    reviewCount: c.place.reviewCount,
    website: c.place.website,
    disciplines: c.disciplines,
    reviewsAnalyzed: reviewsByPlace.get(c.place.placeId)?.length ?? 0,
  }));
  const thinReport = competitors.filter((c) => c.reviewsAnalyzed >= MIN_REVIEWS_SOLID).length < MIN_SOLID_COMPETITORS;

  let findings: Finding[] = [];
  await hooks.onPhase("mine", async () => {
    const businesses: Business[] = [
      { placeId: null, name: clinic.name, discipline: clinic.disciplines[0], reviews: reviewsByPlace.get(scan.place.placeId) ?? [] },
      ...chosen.map((c) => ({ placeId: c.place.placeId, name: c.place.name, discipline: c.disciplines.find((d) => clinic.disciplines.includes(d)) ?? c.disciplines[0] ?? clinic.disciplines[0], reviews: reviewsByPlace.get(c.place.placeId) ?? [] })),
    ];
    findings = await mineAll(clinic, businesses, deps);
  });

  const isNew = isNewClinic(clinic.opened);
  const peers: Peer[] = chosen.map((c, i) => ({ place: c.place, reviews: reviewsByPlace.get(c.place.placeId) ?? [], competitor: competitors[i] }));
  const scorecard = buildScorecard({ place: scan.place, reviews: reviewsByPlace.get(scan.place.placeId) ?? [], understanding: scan.understanding, isNew }, peers);

  let report!: Report;
  await hooks.onPhase("synthesize", async () => {
    const plan = await synthesizePlan(clinic, findings, scorecard, nameOf, isNew, deps);
    const citedIds = new Set(findings.flatMap((f) => f.evidence.map((e) => e.reviewId)));
    const reviews = [...reviewsByPlace.values()].flat().filter((r) => citedIds.has(r.id));
    report = {
      analysisId: analysis.id,
      clinicId: clinic.id,
      generatedAt: nowIso(),
      summary: plan.summary,
      scorecard: { ...scorecard, summary: plan.scorecardSummary },
      competitors,
      findings,
      recommendations: plan.recommendations,
      ledger: ledgerFor(findings),
      thinReport,
      reviews,
    };
    const previous = await latestSucceeded(clinic.id, analysis.id);
    if (previous?.report) {
      report.diff = buildRunDiff(
        { report, rating: scan.place.rating, reviewCount: scan.place.reviewCount },
        { report: previous.report, rating: previous.scan?.place.rating, reviewCount: previous.scan?.place.reviewCount },
      );
    }
  });
  return report;
}
