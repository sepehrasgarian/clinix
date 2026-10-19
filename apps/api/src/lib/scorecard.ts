import type { Competitor, Place, Review, Scorecard, ScoreDimensionKey, Understanding } from "@clinix/contracts";

export type Peer = { place: Place; reviews: Review[]; competitor: Competitor };

const LABELS: Record<ScoreDimensionKey, string> = {
  google_profile: "Google profile",
  review_count: "Review volume",
  rating: "Google rating",
  review_velocity: "Recent reviews",
  owner_responsiveness: "Replies to reviews",
  service_breadth: "Services",
  language_coverage: "Languages",
};

const DAYS_90 = 90 * 24 * 3600 * 1000;

/** Where `value` sits among `peers`, 0-100. Equal to the best peer scores 100; equal to the worst scores 0. */
export function percentile(value: number, peers: number[]): number {
  if (peers.length === 0) return 50;
  const below = peers.filter((p) => p < value).length;
  const equal = peers.filter((p) => p === value).length;
  return Math.round(((below + equal / 2) / peers.length) * 100);
}

export const replyRate = (reviews: Review[]): number => (reviews.length ? reviews.filter((r) => r.ownerReply).length / reviews.length : 0);
export const recentCount = (reviews: Review[], now = Date.now()): number => reviews.filter((r) => now - new Date(r.publishedAt).getTime() <= DAYS_90).length;

function profileCompleteness(place: Place, understanding: Understanding): number {
  const checks = [!!place.website, !!place.phone, !!place.hours?.length, !!place.photoName, understanding.services.length > 0, (place.reviewCount ?? 0) > 0];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

/**
 * Seven measured dimensions, scored against the chosen competitors. No pricing dimension:
 * the product never nudges owners toward price visibility.
 */
export function buildScorecard(own: { place: Place; reviews: Review[]; understanding: Understanding; isNew: boolean }, peers: Peer[], now = Date.now()): Scorecard {
  const peerReviewCounts = peers.map((p) => p.place.reviewCount ?? 0);
  const peerRatings = peers.map((p) => p.place.rating ?? 0);
  const peerVelocity = peers.map((p) => recentCount(p.reviews, now));
  const peerReply = peers.map((p) => replyRate(p.reviews));
  const peerBreadth = peers.map((p) => p.competitor.disciplines.length * 4); // rough proxy until competitor sites are read
  const ownLanguages = own.understanding.languages.length;

  const dims: { key: ScoreDimensionKey; score: number; summary: string }[] = [
    {
      key: "rating",
      score: percentile(own.place.rating ?? 0, peerRatings),
      summary: `${(own.place.rating ?? 0).toFixed(1)} vs a local average of ${avg(peerRatings).toFixed(1)}.`,
    },
    {
      key: "review_count",
      score: own.isNew ? 50 : percentile(own.place.reviewCount ?? 0, peerReviewCounts),
      summary: own.isNew
        ? `${own.place.reviewCount ?? 0} reviews. Your clinic is new, so volume is not scored against established competitors.`
        : `${own.place.reviewCount ?? 0} reviews vs ${Math.max(...peerReviewCounts, 0)} for the leader nearby.`,
    },
    {
      key: "review_velocity",
      score: percentile(recentCount(own.reviews, now), peerVelocity),
      summary: `${recentCount(own.reviews, now)} reviews in the last 90 days; the most active competitor has ${Math.max(...peerVelocity, 0)}.`,
    },
    {
      key: "owner_responsiveness",
      score: Math.round(replyRate(own.reviews) * 100),
      summary: `You reply to ${Math.round(replyRate(own.reviews) * 100)}% of reviews; competitors average ${Math.round(avg(peerReply) * 100)}%.`,
    },
    {
      key: "google_profile",
      score: profileCompleteness(own.place, own.understanding),
      summary: profileSummary(own.place),
    },
    {
      key: "service_breadth",
      score: percentile(own.understanding.services.length, peerBreadth),
      summary: `${own.understanding.services.length} services found on your website.`,
    },
    {
      key: "language_coverage",
      score: Math.min(100, ownLanguages * 34),
      summary: ownLanguages > 1 ? `${ownLanguages} languages on your website.` : "English only on your website.",
    },
  ];

  const overall = Math.round(dims.reduce((s, d) => s + d.score, 0) / dims.length);
  return {
    dimensions: dims.map((d) => ({ ...d, label: LABELS[d.key] })),
    overall,
    summary: "", // filled by the synthesis step
  };
}

const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

function profileSummary(place: Place): string {
  const missing = [!place.website && "website", !place.phone && "phone", !place.hours?.length && "hours", !place.photoName && "photos"].filter(Boolean);
  return missing.length ? `Missing on your Google listing: ${missing.join(", ")}.` : "Website, phone, hours and photos are all on your listing.";
}
