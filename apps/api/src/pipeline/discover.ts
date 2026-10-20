import { z } from "zod";
import { Discipline, primaryDiscipline, type Clinic, type CompetitorCandidate, type DiscoveryResult, type Place } from "@clinix/contracts";
import { classifyBusiness } from "../clients/places.js";
import { preferSameDiscipline } from "../lib/disciplineTypes.js";
import { distanceKm, ringFor } from "../lib/geo.js";
import { rankSystem, rankUser, type RankCandidateInput } from "../prompts/rank.js";
import type { PipelineDeps } from "./deps.js";

/** Search rings: each keeps only places inside its own distance band so outer rings add variety. */
export const RINGS = [
  { name: "hyperlocal", minKm: 0, maxKm: 2, radiusM: 2000, keep: 3 },
  { name: "local", minKm: 2, maxKm: 5, radiusM: 5000, keep: 3 },
  { name: "city", minKm: 5, maxKm: 15, radiusM: 15000, keep: 2 },
] as const;

export const PER_DISCIPLINE_MAX = 5;
export const MIN_REVIEWS_FOR_AUTOSELECT = 10;
const MAX_CANDIDATES = 24;

type Found = { place: Place; distanceKm: number; foundBy: Set<string> };

/** Runs one Places search per service and ring, dedupes, and keeps the closest few per service and ring. */
export async function gatherCandidates(clinic: Clinic, center: { lat: number; lng: number }, services: string[], deps: PipelineDeps): Promise<Found[]> {
  const found = new Map<string, Found>();
  const searches = services.slice(0, 6).flatMap((service) => RINGS.map((ring) => ({ service, ring })));

  await Promise.all(
    searches.map(async ({ service, ring }) => {
      const results = await deps.places.searchText(`${service} ${clinic.city}`, { near: center, radiusM: ring.radiusM, max: 20 }).catch(() => [] as Place[]);
      const clinics = results.filter((p) => p.placeId !== clinic.placeId && classifyBusiness(p.types) !== "non_clinic");
      const eligible = preferSameDiscipline(clinics, clinic.disciplines)
        .map((p) => ({ place: p, distanceKm: distanceKm(center, p) }))
        .filter((c) => c.distanceKm > ring.minKm && c.distanceKm <= ring.maxKm * 1.2)
        .sort((a, b) => a.distanceKm - b.distanceKm)
        .slice(0, ring.keep);
      for (const c of eligible) {
        const existing = found.get(c.place.placeId);
        if (existing) existing.foundBy.add(service);
        else found.set(c.place.placeId, { ...c, foundBy: new Set([service]) });
      }
    }),
  );

  return [...found.values()].sort((a, b) => a.distanceKm - b.distanceKm).slice(0, MAX_CANDIDATES);
}

const RankOutput = z.object({
  rankings: z.array(
    z.object({
      id: z.string(),
      relevance: z.number().min(0).max(100),
      flag: z.enum(["strong", "borderline", "irrelevant"]),
      reason: z.string(),
      disciplines: z.array(z.string()).describe("Discipline ids from the allowed list only"),
    }),
  ),
});

/** One model call scores every candidate. Unranked candidates fall back to borderline/50. */
export async function rankCandidates(clinic: Clinic, services: string[], found: Found[], deps: PipelineDeps): Promise<CompetitorCandidate[]> {
  if (found.length === 0) return [];
  const inputs: RankCandidateInput[] = found.map((f) => ({
    id: f.place.placeId,
    name: f.place.name,
    address: f.place.address,
    types: f.place.types,
    distanceKm: f.distanceKm,
    rating: f.place.rating,
    reviewCount: f.place.reviewCount,
    foundBy: [...f.foundBy],
  }));
  const { rankings } = await deps.ai.structured({ schema: RankOutput, system: rankSystem(clinic.disciplines, clinic.city), user: rankUser(clinic.name, services, inputs), tier: "light" });
  const byId = new Map(rankings.map((r) => [r.id, r]));
  // The model sometimes invents an id; keep the known ones and fall back to the clinic's own disciplines.
  const known = (ids: string[]): Discipline[] => ids.filter((d): d is Discipline => Discipline.options.includes(d as Discipline));

  return found
    .map((f) => {
      const r = byId.get(f.place.placeId);
      return {
        place: f.place,
        distanceKm: Math.round(f.distanceKm * 10) / 10,
        ring: ringFor(f.distanceKm),
        relevance: r?.relevance ?? 50,
        flag: r?.flag ?? "borderline",
        reason: r?.reason ?? "Not reviewed; found by a service search nearby.",
        disciplines: known(r?.disciplines ?? []).length ? known(r!.disciplines) : clinic.disciplines,
      } satisfies CompetitorCandidate;
    })
    .sort((a, b) => b.relevance - a.relevance || a.distanceKm - b.distanceKm);
}

/**
 * Default pick per discipline: strong candidates with enough reviews first, then borderline ones,
 * then thinly reviewed clinics only to fill gaps. The owner can always change the selection.
 */
export function autoSelect(candidates: CompetitorCandidate[], disciplines: Discipline[]): string[] {
  const selected = new Set<string>();
  const tier = (c: CompetitorCandidate) => {
    const established = (c.place.reviewCount ?? 0) >= MIN_REVIEWS_FOR_AUTOSELECT;
    if (c.flag === "strong" && established) return 0;
    if (c.flag === "borderline" && established) return 1;
    return 2;
  };
  for (const d of disciplines) {
    candidates
      .filter((c) => c.flag !== "irrelevant" && primaryDiscipline(c.disciplines, disciplines) === d)
      .sort((a, b) => tier(a) - tier(b) || b.relevance - a.relevance)
      .slice(0, PER_DISCIPLINE_MAX)
      .forEach((c) => selected.add(c.place.placeId));
  }
  return [...selected];
}

/** Validates an owner's selection: known ids only, at most five per discipline. */
export function validateSelection(candidates: CompetitorCandidate[], placeIds: string[], disciplines: Discipline[]): string | null {
  const known = new Map(candidates.map((c) => [c.place.placeId, c]));
  const unknown = placeIds.filter((id) => !known.has(id));
  if (unknown.length) return `Unknown competitor: ${unknown[0]}`;
  if (placeIds.length === 0) return "Pick at least one competitor.";
  for (const d of disciplines) {
    const n = placeIds.filter((id) => primaryDiscipline(known.get(id)!.disciplines, disciplines) === d).length;
    if (n > PER_DISCIPLINE_MAX) return `Pick at most ${PER_DISCIPLINE_MAX} competitors for ${d}.`;
  }
  return null;
}

export async function runDiscovery(clinic: Clinic, services: string[], deps: PipelineDeps): Promise<DiscoveryResult> {
  if (clinic.lat === undefined || clinic.lng === undefined) throw new Error("The clinic has no map position yet; run the quick scan first.");
  const center = { lat: clinic.lat, lng: clinic.lng };
  const found = await gatherCandidates(clinic, center, services, deps);
  const candidates = await rankCandidates(clinic, services, found, deps);
  return { candidates, selectedPlaceIds: autoSelect(candidates, clinic.disciplines) };
}
