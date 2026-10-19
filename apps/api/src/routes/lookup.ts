import { Hono } from "hono";
import { z } from "zod";
import { DISCIPLINE_LABELS, Discipline, type Place } from "@clinix/contracts";
import { classifyBusiness } from "../clients/places.js";
import { matchesDisciplines } from "../lib/disciplineTypes.js";
import { distanceKm } from "../lib/geo.js";
import type { AuthVariables } from "../middleware/auth.js";
import type { PipelineDeps } from "../pipeline/deps.js";

const Query = z.object({ q: z.string().trim().min(2).max(120), city: z.string().trim().min(1).max(60).default("Toronto") });
const MarketQuery = z.object({
  placeId: z.string().min(1),
  disciplines: z.string().transform((v) => v.split(",").filter(Boolean)).pipe(z.array(Discipline).min(1).max(4)),
});

export type MarketCard = { nearby: number; leaderName?: string; leaderReviewCount?: number; averageRating?: number };

const MARKET_RADIUS_M = 5000;
const MARKET_RADIUS_KM = 5.5;
const CACHE_TTL_MS = 24 * 3600 * 1000;
const marketCache = new Map<string, { at: number; card: MarketCard }>();

/** "19 dental clinics within 5 km; the leader has 1,026 reviews." Shown the moment a listing is picked. */
export async function buildMarketCard(deps: PipelineDeps, placeId: string, disciplines: Discipline[]): Promise<MarketCard | null> {
  const key = `${placeId}|${disciplines.join(",")}`;
  const hit = marketCache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.card;

  const place = await deps.places.details(placeId);
  if (!place) return null;
  const center = { lat: place.lat, lng: place.lng };
  const seen = new Map<string, Place>();
  for (const d of disciplines.slice(0, 2)) {
    const found = await deps.places.searchText(`${DISCIPLINE_LABELS[d]} clinic near ${place.address}`, { near: center, radiusM: MARKET_RADIUS_M, max: 20 }).catch(() => [] as Place[]);
    for (const p of found) {
      if (p.placeId !== placeId && distanceKm(center, p) <= MARKET_RADIUS_KM && matchesDisciplines(p.types, disciplines)) seen.set(p.placeId, p);
    }
  }
  const peers = [...seen.values()];
  const rated = peers.filter((p) => p.rating !== undefined);
  const leader = peers.filter((p) => p.reviewCount !== undefined).sort((a, b) => (b.reviewCount ?? 0) - (a.reviewCount ?? 0))[0];
  const card: MarketCard = {
    nearby: peers.length,
    leaderName: leader?.name,
    leaderReviewCount: leader?.reviewCount,
    averageRating: rated.length ? Math.round((rated.reduce((s, p) => s + (p.rating ?? 0), 0) / rated.length) * 10) / 10 : undefined,
  };
  marketCache.set(key, { at: Date.now(), card });
  return card;
}

/** Listing search for onboarding step 1: the owner types a name, we show matching Google listings. */
export function lookupRoutes(deps: PipelineDeps) {
  return new Hono<{ Variables: AuthVariables }>()
    .get("/clinic-search", async (c) => {
      const parsed = Query.safeParse({ q: c.req.query("q"), city: c.req.query("city") ?? undefined });
      if (!parsed.success) return c.json({ error: "q (2-120 chars) is required" }, 400);
      const { q, city } = parsed.data;
      const places = await deps.places.searchText(`${q} ${city}`, { max: 6 });
      const clinics: Place[] = places.filter((p) => classifyBusiness(p.types) !== "non_clinic");
      return c.json(clinics);
    })
    .get("/market-card", async (c) => {
      const parsed = MarketQuery.safeParse({ placeId: c.req.query("placeId"), disciplines: c.req.query("disciplines") ?? "" });
      if (!parsed.success) return c.json({ error: "placeId and disciplines are required" }, 400);
      const card = await buildMarketCard(deps, parsed.data.placeId, parsed.data.disciplines);
      if (!card) return c.json({ error: "listing not found" }, 404);
      return c.json(card);
    })
    .get("/photo/*", async (c) => {
      const name = c.req.path.replace(/^.*\/photo\//, "");
      if (!/^places\/[\w-]+\/photos\/[\w-]+$/.test(name)) return c.json({ error: "invalid photo name" }, 400);
      const photo = await deps.places.photo(name);
      if (!photo) return c.json({ error: "not found" }, 404);
      return new Response(photo.bytes, { headers: { "Content-Type": photo.contentType, "Cache-Control": "public, max-age=86400" } });
    });
}
