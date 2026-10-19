import { createHash } from "node:crypto";
import { Review } from "@clinix/contracts";
import type { Fetcher } from "./places.js";

/**
 * Google Maps reviews through Apify's `compass/google-maps-reviews-scraper`.
 * Reviewer names, profile links and photos are dropped at ingest; we keep text, stars,
 * date and the owner's reply. Review ids are a hash of place + date + text.
 */
const ACTOR = "compass~google-maps-reviews-scraper";
export const MAX_REVIEWS_PER_PLACE = 60;

type RawReview = {
  placeId?: string;
  text?: string | null;
  textTranslated?: string | null;
  stars?: number;
  publishedAtDate?: string;
  responseFromOwnerText?: string | null;
};

export interface ReviewSource {
  fetchReviews(placeIds: string[], maxPerPlace?: number): Promise<Review[]>;
}

export class ApifyClient implements ReviewSource {
  constructor(
    private readonly token: string,
    private readonly fetchImpl: Fetcher = fetch,
  ) {}

  async fetchReviews(placeIds: string[], maxPerPlace = MAX_REVIEWS_PER_PLACE): Promise<Review[]> {
    if (placeIds.length === 0) return [];
    const url = `https://api.apify.com/v2/acts/${ACTOR}/run-sync-get-dataset-items?token=${this.token}&timeout=300&memory=1024`;
    const res = await this.fetchImpl(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ placeIds, maxReviews: maxPerPlace, reviewsSort: "newest", language: "en", personalData: false }),
    });
    if (!res.ok) throw new Error(`Review fetch failed with ${res.status}`);
    const items = (await res.json()) as RawReview[];
    return items.map(toReview).filter((r): r is Review => r !== null);
  }
}

export function toReview(raw: RawReview): Review | null {
  const text = (raw.text ?? raw.textTranslated ?? "").trim();
  if (!raw.placeId || !text || !raw.stars || !raw.publishedAtDate) return null;
  const publishedAt = new Date(raw.publishedAtDate);
  if (Number.isNaN(publishedAt.getTime())) return null;
  const parsed = Review.safeParse({
    id: reviewId(raw.placeId, publishedAt.toISOString(), text),
    placeId: raw.placeId,
    rating: Math.round(raw.stars),
    text,
    publishedAt: publishedAt.toISOString(),
    ownerReply: raw.responseFromOwnerText?.trim() || undefined,
    source: "apify",
  });
  return parsed.success ? parsed.data : null;
}

export function reviewId(placeId: string, publishedAt: string, text: string): string {
  return `rev_${createHash("sha1").update(`${placeId}|${publishedAt}|${text}`).digest("hex").slice(0, 16)}`;
}
