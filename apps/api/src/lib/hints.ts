import { median, medianStats, isNewClinic, type Place, type ScanHint } from "@clinix/contracts";

// The measuring helpers live in the shared contracts so the setup screens use the very same numbers.
export { median, medianStats, isNewClinic };

/** Measured over the nearby same-discipline clinics themselves. Medians exist from three clinics on. */
export type MarketStats = {
  nearbyCount?: number;
  ratedCount?: number;
  medianRating?: number;
  reviewedCount?: number;
  medianReviews?: number;
};

/** The nearby median must be at least this many times the clinic's own count before it is a gap. */
export const REVIEW_GAP_RATIO = 2;
/** Stars below the median before a rating is a gap. */
export const RATING_GAP = 0.2;
/** A rating is only a strength when it is at the median or above and at least this high. */
export const STRENGTH_FLOOR = 4.5;
/** Same-discipline clinics within the radius before the market is crowded. */
export const CROWDED_AT = 10;
export const MAX_HINTS = 3;

const WHY = {
  review_gap: "Patients compare review counts before they book, and Google uses them when it ranks clinics in Maps.",
  rating_gap: "Patients put ratings side by side before they choose, so a lower one can cost you the booking.",
  rating_strength: "That's an advantage worth putting in front of new patients.",
  no_website: "Patients comparing clinics can't read about you before they book.",
  crowded_market: "Your report shows what each of them does better or worse than you.",
} as const;

const star = (rating: number) => `${rating.toFixed(1)}\u2605`;

/**
 * Up to three measured facts shown right after the quick scan, problems first, then a strength, then
 * context. Each carries its numbers so the screen can word them in the visitor's language. Never
 * estimates, never "patients lost"; nothing is compared against fewer than three clinics.
 */
export function buildScanHints(place: Place, market: MarketStats, opts: { clinicIsNew?: boolean; capped?: boolean } = {}): ScanHint[] {
  const problems: ScanHint[] = [];
  const strengths: ScanHint[] = [];
  const context: ScanHint[] = [];

  const own = place.reviewCount;
  if (!opts.clinicIsNew && own !== undefined && market.medianReviews !== undefined && market.medianReviews >= REVIEW_GAP_RATIO * Math.max(own, 1)) {
    problems.push({ kind: "review_gap", tone: "problem", yours: own, nearby: market.medianReviews, nearbyCount: market.reviewedCount, why: WHY.review_gap,
      text: `You have ${own} Google reviews. The ${market.reviewedCount} clinics nearest you have a median of ${market.medianReviews}.` });
  }

  if (place.rating !== undefined && market.medianRating !== undefined) {
    const diff = Math.round((place.rating - market.medianRating) * 10) / 10;
    const compared = { yours: place.rating, nearby: market.medianRating, nearbyCount: market.ratedCount };
    if (diff <= -RATING_GAP) {
      problems.push({ kind: "rating_gap", tone: "problem", ...compared, why: WHY.rating_gap, text: `Your ${star(place.rating)} rating is below the ${star(market.medianRating)} median of the ${market.ratedCount} clinics nearest you.` });
    } else if (diff >= 0 && place.rating >= STRENGTH_FLOOR) {
      strengths.push({ kind: "rating_strength", tone: "strength", ...compared, why: WHY.rating_strength, text: `Your ${star(place.rating)} rating matches or beats at least half of the ${market.ratedCount} clinics nearest you.` });
    }
  }

  if (!place.website) problems.push({ kind: "no_website", tone: "problem", why: WHY.no_website, text: "There's no website on your Google profile." });

  const crowd = market.nearbyCount ?? 0;
  if (crowd >= CROWDED_AT) {
    const atLeast = opts.capped === true;
    context.push({ kind: "crowded_market", tone: "context", nearbyCount: crowd, atLeast, why: WHY.crowded_market, text: `${crowd}${atLeast ? "+" : ""} clinics within 5 km are after the same patients.` });
  }

  return [...problems, ...strengths, ...context].slice(0, MAX_HINTS);
}
