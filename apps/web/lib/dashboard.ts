import { PHASE_LABELS, type Analysis, type Discipline, type PhaseProgress, type Recommendation, type Report } from "@clinix/contracts";
import { copy } from "@/lib/copy";
import { findingsFor, median, nextMoves, positionOf, rankByReviews, type Ranked } from "@/lib/report";

/** Pure helpers for the dashboard. Everything here is derived from the API's analyses; nothing is invented. */

export type Completed = { analysis: Analysis; report: Report };

export type HeroState =
  | { kind: "none" }
  | { kind: "setup"; analysis: Analysis }
  | { kind: "processing"; analysis: Analysis; queued: boolean }
  | { kind: "failed"; analysis: Analysis }
  | { kind: "completed"; analysis: Analysis; report: Report };

const byNewest = (a: Analysis, b: Analysis) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();

/** The newest analysis decides the hero; the newest successful one with a report stays reachable as "latest completed". */
export function resolveDashboard(analyses: Analysis[]): { hero: HeroState; latest: Completed | null } {
  const sorted = [...analyses].sort(byNewest);
  const done = sorted.find((a) => a.status === "succeeded" && a.report);
  const latest = done ? { analysis: done, report: done.report! } : null;
  const current = sorted[0];
  if (!current) return { hero: { kind: "none" }, latest };
  if (current.status === "succeeded" && current.report) return { hero: { kind: "completed", analysis: current, report: current.report }, latest };
  if (current.status === "failed") return { hero: { kind: "failed", analysis: current }, latest };
  if (current.status === "awaiting_services" || current.status === "awaiting_competitors") return { hero: { kind: "setup", analysis: current }, latest };
  if (current.status === "queued" || current.status === "running") return { hero: { kind: "processing", analysis: current, queued: current.status === "queued" }, latest };
  return { hero: { kind: "none" }, latest };
}

export type StageStatus = "done" | "running" | "failed" | "pending";
export type StageRow = { phase: PhaseProgress["phase"]; title: string; now: string; status: StageStatus };

const raw = (p?: PhaseProgress): StageStatus => (p?.status === "done" || p?.status === "skipped" ? "done" : p?.status === "running" ? "running" : p?.status === "failed" ? "failed" : "pending");

const SETUP_PHASES: PhaseProgress["phase"][] = ["validate", "enrich", "understand", "discover"];

/**
 * The stages of the run as it reports them: the four deep-analysis steps, or the setup steps for a run that stopped before
 * the deep analysis. On a failed run nothing shows as running: the stage that failed (or was running, or is next) is marked
 * failed, and only stages the run confirmed as done show as done.
 */
export function stageRows(analysis: Analysis): StageRow[] {
  const rows: StageRow[] = analysis.stage === "deep"
    ? copy.onboarding.run.stages.map((s) => ({ phase: s.phase as PhaseProgress["phase"], title: s.title, now: s.now, status: raw(analysis.phases.find((p) => p.phase === s.phase)) }))
    : SETUP_PHASES.map((phase) => ({ phase, title: PHASE_LABELS[phase], now: "", status: raw(analysis.phases.find((p) => p.phase === phase)) }));
  if (analysis.status !== "failed") return rows;
  const at = rows.findIndex((r) => r.status === "failed" || r.status === "running");
  const stop = at >= 0 ? at : rows.findIndex((r) => r.status === "pending");
  return rows.map((r, i) => ({ ...r, status: i === stop ? "failed" : r.status === "running" ? "pending" : r.status }));
}

export const currentStage = (rows: StageRow[]): StageRow | undefined => rows.find((r) => r.status === "failed") ?? rows.find((r) => r.status === "running") ?? rows.find((r) => r.status === "pending");

export type Kpi = { key: "position" | "rating" | "reviews" | "opportunities"; label: string; value: string; note: string; trend?: { text: string; direction: "up" | "down" | "flat" }; /** How the figure is defined, shown on the info icon. */ info: string; };

/** Competitor weaknesses and unmet patient demand are the openings; both are kept findings with cited reviews. */
export const opportunityCount = (report: Report): number =>
  report.findings.filter((f) => f.status === "kept" && f.competitorPlaceId !== null && (f.kind === "weakness" || f.kind === "unmet_demand")).length;

const signed = (n: number, digits = 0) => `${n > 0 ? "+" : n < 0 ? "−" : ""}${Math.abs(n).toFixed(digits)}`;
const direction = (n: number): "up" | "down" | "flat" => (n > 0 ? "up" : n < 0 ? "down" : "flat");

/**
 * The figures a finished report supports. A figure the report cannot support is left out, not shown empty, and a trend appears
 * only when the report carries a comparison with the previous analysis.
 */
export function kpiList(latest: Completed, clinicName: string): Kpi[] {
  const t = copy.dashboard.kpi;
  const { report } = latest;
  const ranked = rankByReviews(report, latest.analysis, clinicName);
  const you = ranked.find((r) => r.isYou)!;
  const { rank, of } = positionOf(ranked);
  const rivals = ranked.filter((r) => !r.isYou);
  const rivalRatings = rivals.map((r) => r.rating).filter((n): n is number => n !== undefined);
  const { diff } = report;
  const items: Kpi[] = [];
  if (of > 1) items.push({ key: "position", label: t.position, value: `#${rank} of ${of}`, note: t.positionNote, info: t.positionInfo });
  if (you.rating !== undefined) {
    items.push({ key: "rating", label: t.rating, value: `${you.rating.toFixed(1)} ★`, info: t.ratingInfo, note: rivalRatings.length ? `${t.median} ${median(rivalRatings).toFixed(1)} ★` : t.ratingNote, trend: diff && diff.ratingDelta !== 0 ? { text: `${signed(diff.ratingDelta, 1)} ${t.sinceLast}`, direction: direction(diff.ratingDelta) } : undefined });
  }
  items.push({ key: "reviews", label: t.reviews, value: you.reviewCount.toLocaleString("en-CA"), info: t.reviewsInfo, note: rivals.length ? `${t.median} ${median(rivals.map((r) => r.reviewCount)).toLocaleString("en-CA")}` : t.reviewsNote, trend: diff && diff.reviewCountDelta !== 0 ? { text: `${signed(diff.reviewCountDelta)} ${t.sinceLast}`, direction: direction(diff.reviewCountDelta) } : undefined });
  items.push({ key: "opportunities", label: t.opportunities, value: String(opportunityCount(report)), info: t.opportunitiesInfo, note: t.opportunitiesNote });
  return items;
}

/** What is holding the clinic back, in the report's own verified words: kept findings about the clinic that are problems. */
export const holdingBack = (report: Report, n = 3): string[] =>
  report.findings.filter((f) => f.status === "kept" && f.competitorPlaceId === null && (f.kind === "weakness" || f.kind === "admin_friction" || f.kind === "access")).slice(0, n).map((f) => f.claim);

/** The comparison with the previous analysis, only when the report really carries one. */
export function sinceLastTime(report: Report): { date: string; summary: string; newFindings: number; resolved: number; completed: number } | null {
  const d = report.diff;
  return d ? { date: d.previousGeneratedAt, summary: d.summary, newFindings: d.newFindingIds.length, resolved: d.resolvedFindingIds.length, completed: d.completedRecommendationIds.length } : null;
}

export type CompetitorRow = { placeId: string; name: string; distanceKm: number; disciplines: Discipline[]; rating?: number; reviewCount?: number; reviewsAnalyzed?: number; services?: string[] };

/** From the finished report when there is one; otherwise the competitors the owner selected. The clinic is never its own competitor. */
export function competitorRows(latest: Completed | null, current: Analysis | null): CompetitorRow[] {
  const own = (latest?.analysis ?? current)?.scan?.place.placeId;
  if (latest) return [...latest.report.competitors].filter((c) => c.placeId !== own).sort((a, b) => a.distanceKm - b.distanceKm).map((c) => ({ placeId: c.placeId, name: c.name, distanceKm: c.distanceKm, disciplines: c.disciplines, rating: c.rating, reviewCount: c.reviewCount, reviewsAnalyzed: c.reviewsAnalyzed, services: c.site?.services }));
  const d = current?.discovery;
  if (!d) return [];
  return d.candidates
    .filter((c) => d.selectedPlaceIds.includes(c.place.placeId) && c.place.placeId !== own)
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .map((c) => ({ placeId: c.place.placeId, name: c.place.name, distanceKm: c.distanceKm, disciplines: c.disciplines, rating: c.place.rating, reviewCount: c.place.reviewCount }));
}

export type Opportunity = { rec: Recommendation; index: number; evidence: string };

/** "Backed by 3 findings from 7 patient reviews", counted from the recommendation's own findings. */
export function evidenceSummary(report: Report, rec: Recommendation): string {
  const findings = findingsFor(report, rec);
  const reviews = new Set(findings.flatMap((f) => f.evidence.map((e) => e.reviewId))).size;
  if (findings.length === 0) return "";
  return `Based on ${findings.length} ${findings.length === 1 ? "finding" : "findings"} from ${reviews} patient ${reviews === 1 ? "review" : "reviews"}`;
}

/** The three open recommendations ranked by impact against effort. */
export const topOpportunities = (report: Report): Opportunity[] =>
  nextMoves(report).map((rec) => ({ rec, index: report.recommendations.indexOf(rec) + 1, evidence: evidenceSummary(report, rec) }));

export type MarketSnapshot = { rows: Ranked[]; maxReviews: number; medianReviews: number; medianRating: number | null; /** Services each website lists, for the clinic and the competitors whose site could be read. */ coverage: { name: string; isYou: boolean; value: number }[] };

/** The clinic against the nearest competitors on the two figures patients see in Google Maps. */
export function marketSnapshot(latest: Completed, clinicName: string): MarketSnapshot {
  const ranked = rankByReviews(latest.report, latest.analysis, clinicName);
  const rivals = ranked.filter((r) => !r.isYou);
  const rated = rivals.map((r) => r.rating).filter((n): n is number => n !== undefined);
  const rows = ranked.slice(0, 6);
  if (!rows.some((r) => r.isYou)) rows.push(ranked.find((r) => r.isYou)!);
  const shown = new Set(rows.map((r) => r.placeId));
  const you = latest.analysis.scan?.understanding.services.length;
  const coverage = [
    ...(you !== undefined ? [{ name: clinicName, isYou: true, value: you }] : []),
    ...latest.report.competitors.filter((c) => shown.has(c.placeId) && c.site).map((c) => ({ name: c.name, isYou: false, value: c.site!.services.length })),
  ];
  return { rows, maxReviews: Math.max(1, ...rows.map((r) => r.reviewCount)), medianReviews: median(rivals.map((r) => r.reviewCount)), medianRating: rated.length ? median(rated) : null, coverage };
}

export type StatusChip = { label: string; tone: "success" | "primary" | "warning" | "neutral" };

/** One honest label for where the newest analysis is. */
export function statusChip(hero: HeroState): StatusChip {
  const t = copy.dashboard.status;
  switch (hero.kind) {
    case "none": return { label: t.none, tone: "neutral" };
    case "setup": return { label: t.setup, tone: "neutral" };
    case "processing": return { label: hero.queued ? t.queued : t.processing, tone: "primary" };
    case "failed": return { label: t.failed, tone: "warning" };
    case "completed": return { label: t.completed, tone: "success" };
  }
}
