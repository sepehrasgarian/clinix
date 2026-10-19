import type { Report, RunDiff } from "@clinix/contracts";
import { normalize } from "./citations.js";

/** What changed between this report and the previous one for the same clinic. */
export function buildRunDiff(current: { report: Report; rating?: number; reviewCount?: number }, previous: { report: Report; rating?: number; reviewCount?: number }): RunDiff {
  const key = (f: { competitorPlaceId: string | null; claim: string }) => `${f.competitorPlaceId ?? "own"}|${normalize(f.claim)}`;
  const prevKept = new Map(previous.report.findings.filter((f) => f.status === "kept").map((f) => [key(f), f]));
  const currKept = new Map(current.report.findings.filter((f) => f.status === "kept").map((f) => [key(f), f]));

  const newFindingIds = [...currKept.entries()].filter(([k]) => !prevKept.has(k)).map(([, f]) => f.id);
  const resolvedFindingIds = [...prevKept.entries()].filter(([k]) => !currKept.has(k)).map(([, f]) => f.id);
  const completedRecommendationIds = previous.report.recommendations.filter((r) => r.status === "done").map((r) => r.id);

  const ratingDelta = Math.round(((current.rating ?? 0) - (previous.rating ?? 0)) * 10) / 10;
  const reviewCountDelta = (current.reviewCount ?? 0) - (previous.reviewCount ?? 0);

  const parts = [
    ratingDelta !== 0 ? `Rating ${ratingDelta > 0 ? "up" : "down"} ${Math.abs(ratingDelta).toFixed(1)}` : "Rating unchanged",
    reviewCountDelta > 0 ? `${reviewCountDelta} new review${reviewCountDelta === 1 ? "" : "s"}` : "no new reviews",
    completedRecommendationIds.length ? `${completedRecommendationIds.length} action${completedRecommendationIds.length === 1 ? "" : "s"} completed` : null,
    newFindingIds.length ? `${newFindingIds.length} new finding${newFindingIds.length === 1 ? "" : "s"}` : null,
    resolvedFindingIds.length ? `${resolvedFindingIds.length} resolved` : null,
  ].filter(Boolean);

  return {
    previousAnalysisId: previous.report.analysisId,
    previousGeneratedAt: previous.report.generatedAt,
    ratingDelta,
    reviewCountDelta,
    newFindingIds,
    resolvedFindingIds,
    completedRecommendationIds,
    summary: `${parts.join(", ")} since ${new Date(previous.report.generatedAt).toLocaleDateString("en-CA", { month: "long", day: "numeric" })}.`,
  };
}
