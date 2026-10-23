import type { Analysis, Clinic, Competitor, DisciplineSection, Finding, Place, PhaseId, Report, Review, SeoAudit } from "@clinix/contracts";
import { latestSucceeded } from "../db/analyses.js";
import { dedupeFindings, ledgerFor } from "../lib/citations.js";
import { buildRunDiff } from "../lib/diff.js";
import { isNewClinic } from "../lib/hints.js";
import { nowIso } from "../lib/ids.js";
import { log } from "../lib/log.js";
import { buildScorecard, type Peer } from "../lib/scorecard.js";
import type { PipelineDeps } from "./deps.js";
import { assignCompetitors, mineDiscipline, writeDisciplineSection } from "./disciplineAgent.js";
import { collectReviews } from "./reviews.js";
import { auditSite, siteHealthLines } from "./siteHealth.js";
import { readCompetitorSites, servicesGap, siteSummaryLines } from "./websites.js";
import { synthesizePlan } from "./synthesize.js";

/** A report built on fewer than this many well-reviewed competitors is flagged as thin, not failed. */
export const MIN_SOLID_COMPETITORS = 3;
export const MIN_REVIEWS_SOLID = 10;

export type DeepHooks = { onPhase: (phase: Extract<PhaseId, "reviews" | "websites" | "site_health" | "mine" | "synthesize">, fn: () => Promise<void>) => Promise<void> };

/**
 * Phases 5-7. One discipline agent per discipline the clinic offers reads the clinic's and its
 * rivals' reviews through that discipline's guide, all in parallel. The report agent then writes
 * the clinic-wide plan from the verified findings, and each discipline agent writes its own
 * section given that plan, again in parallel.
 */
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
  const ownReviews = reviewsByPlace.get(scan.place.placeId) ?? [];

  const competitors: Competitor[] = chosen.map((c) => ({
    placeId: c.place.placeId,
    name: c.place.name,
    distanceKm: c.distanceKm,
    rating: c.place.rating,
    reviewCount: c.place.reviewCount,
    website: c.place.website,
    disciplines: c.disciplines,
    reviewsAnalyzed: reviewsByPlace.get(c.place.placeId)?.length ?? 0,
    siteStatus: "no_website" as const,
    servicesNotOnYourSite: [],
  }));

  await hooks.onPhase("websites", async () => {
    const sites = await readCompetitorSites(clinic, competitors, deps);
    for (const c of competitors) {
      const r = sites.get(c.placeId);
      if (!r) continue;
      c.siteStatus = r.status;
      c.site = r.site;
      c.servicesNotOnYourSite = r.site ? servicesGap(scan.understanding.services, r.site.services) : [];
    }
  });
  const rivalSites = siteSummaryLines(competitors);

  let siteHealth: SeoAudit | null = null;
  await hooks.onPhase("site_health", async () => {
    siteHealth = await auditSite({ place: scan.place, understanding: scan.understanding, disciplines: clinic.disciplines, competitors, reviewsByPlace }, { pagespeedKey: deps.pagespeedKey });
  });
  const thinReport = competitors.filter((c) => c.reviewsAnalyzed >= MIN_REVIEWS_SOLID).length < MIN_SOLID_COMPETITORS;
  const byDiscipline = assignCompetitors(clinic.disciplines, competitors);

  let findings: Finding[] = [];
  await hooks.onPhase("mine", async () => {
    const t0 = Date.now();
    const perDiscipline = await Promise.all(
      clinic.disciplines.map((discipline) =>
        mineDiscipline(
          clinic,
          { discipline, ownReviews, competitors: (byDiscipline.get(discipline) ?? []).map((competitor) => ({ competitor, reviews: reviewsByPlace.get(competitor.placeId) ?? [] })) },
          deps,
        ),
      ),
    );
    findings = dedupeFindings(perDiscipline.flat());
    log.info({ analysisId: analysis.id, disciplines: clinic.disciplines.length, findings: findings.length, ms: Date.now() - t0 }, "discipline agents finished mining");
  });

  const isNew = isNewClinic(clinic.opened);
  const peers: Peer[] = chosen.map((c, i) => ({ place: c.place, reviews: reviewsByPlace.get(c.place.placeId) ?? [], competitor: competitors[i] }));
  const scorecard = buildScorecard({ place: scan.place, reviews: ownReviews, understanding: scan.understanding, isNew }, peers);

  let report!: Report;
  await hooks.onPhase("synthesize", async () => {
    const plan = await synthesizePlan(clinic, findings, scorecard, nameOf, isNew, deps, rivalSites, siteHealthLines(siteHealth));
    const sections: DisciplineSection[] = await Promise.all(
      clinic.disciplines.map((discipline) =>
        writeDisciplineSection(
          clinic,
          {
            discipline,
            competitors: byDiscipline.get(discipline) ?? [],
            findings: findings.filter((f) => f.discipline === discipline),
            clinicPlan: plan.recommendations,
            rating: scan.place.rating,
            reviewCount: scan.place.reviewCount,
            positioning: scan.understanding.positioning,
            rivalSites: siteSummaryLines(byDiscipline.get(discipline) ?? []),
          },
          deps,
        ).catch((err) => {
          log.warn({ analysisId: analysis.id, discipline, err: err instanceof Error ? { message: err.message } : String(err) }, "discipline section skipped");
          return null;
        }),
      ),
    ).then((all) => all.filter((s): s is DisciplineSection => s !== null));

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
      disciplines: sections,
      siteHealth,
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
