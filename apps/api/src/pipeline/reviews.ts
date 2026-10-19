import type { Place, Review } from "@clinix/contracts";
import { recentlyFetched, reviewsForPlaces, saveReviews } from "../db/reviews.js";
import type { PipelineDeps } from "./deps.js";

/**
 * Phase 5: review text for the owner's clinic and each chosen competitor. Cached 14 days per
 * place. When the review source fails for a place, its Google sample reviews are used so the
 * run degrades instead of dying.
 */
export async function collectReviews(places: Place[], deps: PipelineDeps): Promise<Map<string, Review[]>> {
  const ids = places.map((p) => p.placeId);
  const cached = await recentlyFetched(ids);
  const toFetch = ids.filter((id) => !cached.has(id));

  if (toFetch.length) {
    try {
      const fetched = await deps.reviews.fetchReviews(toFetch);
      for (const id of toFetch) {
        const mine = fetched.filter((r) => r.placeId === id);
        const fallback = places.find((p) => p.placeId === id)?.sampleReviews ?? [];
        await saveReviews(id, mine.length ? mine : fallback);
      }
    } catch {
      for (const id of toFetch) {
        const fallback = places.find((p) => p.placeId === id)?.sampleReviews ?? [];
        await saveReviews(id, fallback);
      }
    }
  }

  const all = await reviewsForPlaces(ids);
  const byPlace = new Map<string, Review[]>(ids.map((id) => [id, []]));
  for (const r of all) byPlace.get(r.placeId)?.push(r);
  return byPlace;
}
