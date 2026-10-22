import type { NearbyClinic } from "./analysis";

/** Median of a list, or undefined when it is empty. */
export function median(values: number[]): number | undefined {
  if (values.length === 0) return undefined;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

/** What the nearest clinics look like together. A median needs at least three clinics to mean anything. */
export type NearbyStats = { nearbyCount: number; ratedCount: number; medianRating?: number; reviewedCount: number; medianReviews?: number };

export function medianStats(nearby: { rating?: number; reviewCount?: number }[]): NearbyStats {
  const ratings = nearby.flatMap((c) => (c.rating === undefined ? [] : [c.rating]));
  const reviews = nearby.flatMap((c) => (c.reviewCount === undefined ? [] : [c.reviewCount]));
  return {
    nearbyCount: nearby.length,
    ratedCount: ratings.length,
    medianRating: ratings.length >= 3 ? Math.round((median(ratings) ?? 0) * 10) / 10 : undefined,
    reviewedCount: reviews.length,
    medianReviews: reviews.length >= 3 ? Math.round(median(reviews) ?? 0) : undefined,
  };
}

/** A clinic under two years old is "new": its review count is not yet a fair comparison. */
export function isNewClinic(opened: string | undefined, now = new Date()): boolean {
  if (!opened) return false;
  const [y, m = "01"] = opened.split("-");
  const openedDate = new Date(Number(y), Number(m) - 1, 1);
  const twoYears = 2 * 365.25 * 24 * 3600 * 1000;
  return now.getTime() - openedDate.getTime() < twoYears;
}

/** Where the clinic stands among the nearby ones by review count: 1 plus how many have more. Null without reviews or neighbours. */
export function reviewRank(ownReviews: number | undefined, nearby: NearbyClinic[]): { rank: number; total: number } | null {
  if (ownReviews === undefined || nearby.length === 0) return null;
  return { rank: 1 + nearby.filter((c) => (c.reviewCount ?? 0) > ownReviews).length, total: nearby.length + 1 };
}
