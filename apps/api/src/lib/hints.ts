import { median, medianStats, isNewClinic, type Place, type ScanHint } from "@clinix/contracts";

// The measuring helpers live in the shared contracts so the setup screens use the very same numbers.
export { median, medianStats, isNewClinic };

export type MarketStats = {
  /** Highest review count among nearby same-discipline clinics. */
  leaderReviewCount?: number;
  leaderName?: string;
  /** Average rating of nearby same-discipline clinics. */
  averageRating?: number;
  /** Number of nearby clinics offering the most crowded service. */
  crowdedService?: { service: string; count: number };
  /** Measured over the nearby clinics themselves. With these, hints compare with the median, not the leader or the mean. */
  nearbyCount?: number;
  ratedCount?: number;
  medianRating?: number;
  reviewedCount?: number;
  medianReviews?: number;
};

const WHY = {
  review_gap: "Patients compare review counts before they book, and Google uses them when it ranks clinics in Maps.",
  rating_gap: "Patients put ratings side by side before they choose, so a lower one can cost you the booking.",
  rating_strength: "That's an advantage worth putting in front of new patients.",
  no_website: "Patients comparing clinics can't read about you before they book.",
  crowded_market: "Your report shows what each of them does better or worse than you.",
} as const;

/** Up to three measured facts shown right after the quick scan. Never estimates, never "patients lost". */
export function buildScanHints(place: Place, market: MarketStats, opts: { clinicIsNew?: boolean } = {}): ScanHint[] {
  const hints: ScanHint[] = [];

  const ownReviews = place.reviewCount;
  if (!opts.clinicIsNew && ownReviews !== undefined) {
    if (market.medianReviews !== undefined) {
      if (market.medianReviews > ownReviews * 1.5) {
        hints.push({ kind: "review_gap", text: `You have ${ownReviews} Google reviews. The ${market.reviewedCount} clinics nearest you have a median of ${market.medianReviews}.`, why: WHY.review_gap });
      }
    } else if (market.leaderReviewCount && market.leaderReviewCount > ownReviews * 1.5) {
      hints.push({ kind: "review_gap", text: `${market.leaderName ?? "The leading clinic nearby"} has ${market.leaderReviewCount} reviews; you have ${ownReviews}.`, why: WHY.review_gap });
    }
  }

  if (place.rating !== undefined) {
    const stars = place.rating.toFixed(1);
    if (market.medianRating !== undefined) {
      const diff = Math.round((place.rating - market.medianRating) * 10) / 10;
      if (diff <= -0.2) {
        hints.push({ kind: "rating_gap", text: `Your ${stars}\u2605 rating is below the ${market.medianRating.toFixed(1)}\u2605 median of the ${market.ratedCount} clinics nearest you.`, why: WHY.rating_gap });
      } else if (diff >= 0) {
        hints.push({ kind: "rating_strength", text: `Your ${stars}\u2605 rating matches or beats at least half of the ${market.ratedCount} clinics nearest you.`, why: WHY.rating_strength });
      }
    } else if (market.averageRating !== undefined) {
      const diff = Math.round((place.rating - market.averageRating) * 10) / 10;
      if (diff <= -0.2) {
        hints.push({ kind: "rating_gap", text: `Your ${stars} rating is below the local average of ${market.averageRating.toFixed(1)}.`, why: WHY.rating_gap });
      } else if (diff >= 0.1) {
        hints.push({ kind: "rating_strength", text: `Your ${stars} rating is above the local average of ${market.averageRating.toFixed(1)}.`, why: WHY.rating_strength });
      }
    }
  }

  if (!place.website) {
    hints.push({ kind: "no_website", text: "There's no website on your Google profile.", why: WHY.no_website });
  }

  const crowded = market.nearbyCount ?? market.crowdedService?.count ?? 0;
  if (crowded >= 8) {
    hints.push({ kind: "crowded_market", text: `${crowded} clinics within 5 km are after the same patients.`, why: WHY.crowded_market });
  }

  return hints.slice(0, 3);
}
