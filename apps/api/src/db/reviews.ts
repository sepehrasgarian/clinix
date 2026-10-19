import { Review } from "@clinix/contracts";
import { getDb } from "./connection.js";
import { rid, toPlain } from "./records.js";
import { nowIso } from "../lib/ids.js";

export const REVIEW_CACHE_DAYS = 14;

/** Stores reviews for a place and remembers when they were fetched. Ids are content hashes, so re-runs overwrite rather than duplicate. */
export async function saveReviews(placeId: string, reviews: Review[]): Promise<void> {
  const db = await getDb();
  const fetchedAt = nowIso();
  for (const r of reviews) {
    await db.upsert(rid("review", r.id)).content({ ...r, fetchedAt });
  }
  await db.upsert(rid("review_fetch", placeId)).content({ placeId, fetchedAt, count: reviews.length });
}

/** Places whose reviews were fetched within the cache window. */
export async function recentlyFetched(placeIds: string[], maxAgeDays = REVIEW_CACHE_DAYS): Promise<Set<string>> {
  if (placeIds.length === 0) return new Set();
  const db = await getDb();
  const since = new Date(Date.now() - maxAgeDays * 24 * 3600 * 1000).toISOString();
  const [rows] = await db.query<[{ placeId: string }[]]>("SELECT placeId FROM review_fetch WHERE placeId IN $ids AND fetchedAt >= $since", { ids: placeIds, since });
  return new Set(rows.map((r) => r.placeId));
}

export async function reviewsForPlaces(placeIds: string[]): Promise<Review[]> {
  if (placeIds.length === 0) return [];
  const db = await getDb();
  const [rows] = await db.query<[unknown[]]>("SELECT * FROM review WHERE placeId IN $ids ORDER BY publishedAt DESC", { ids: placeIds });
  return rows.map((r) => {
    const { fetchedAt: _fetchedAt, ...rest } = toPlain<Record<string, unknown>>(r);
    return Review.parse(rest);
  });
}
