import { DISCIPLINE_LABELS, Understanding, type Clinic, type NearbyClinic, type Place, type ScanResult } from "@clinix/contracts";
import { classifyBusiness } from "../clients/places.js";
import { distanceKm } from "../lib/geo.js";
import { matchesDisciplines } from "../lib/disciplineTypes.js";
import { nameKey } from "../lib/text.js";
import { buildScanHints, isNewClinic, medianStats, type MarketStats } from "../lib/hints.js";
import { understandExtractPrompt, understandQuestion, understandSystem } from "../prompts/understand.js";
import type { PipelineDeps } from "./deps.js";

const MAX_LISTING_DISTANCE_KM = 50;
const MARKET_RADIUS_M = 5000;
const MARKET_RADIUS_KM = 5.5;
const SEARCH_PAGE = 20;
const MAX_NEARBY = 40;

/** Phase 1: the inputs we cannot proceed without. */
export function validate(clinic: Clinic): void {
  if (!clinic.name.trim()) throw new Error("Clinic name is required.");
  if (!clinic.address.trim() || !clinic.city.trim()) throw new Error("A street address and city are required.");
  if (clinic.disciplines.length === 0) throw new Error("Pick at least one discipline.");
}

/** Phase 2: find the clinic's own Google listing. */
export async function enrich(clinic: Clinic, deps: PipelineDeps): Promise<Place> {
  const geo = await deps.places.geocode([clinic.address, clinic.city, clinic.province, clinic.country].filter(Boolean).join(", "));
  if (!geo) throw new Error("Geocoding returned no result for this address.");

  const matches = await deps.places.searchText(`${clinic.name}, ${clinic.address}, ${clinic.city}`, { near: geo.location, radiusM: 50_000, max: 5 });
  const place = matches[0];
  if (!place) throw new Error("No Google listing matched this clinic.");

  const km = distanceKm(geo.location, { lat: place.lat, lng: place.lng });
  if (km > MAX_LISTING_DISTANCE_KM) throw new Error(`The matched listing is ${km.toFixed(0)} km from the address.`);
  if (classifyBusiness(place.types) === "non_clinic" && !clinic.businessTypeConfirmed) throw new Error("The matched listing is not a clinic.");

  const details = await deps.places.details(place.placeId);
  return details ?? place;
}

/** Phase 3: read the website (or seed from the declared disciplines when there is none). */
export async function understand(clinic: Clinic, place: Place, deps: PipelineDeps): Promise<Understanding> {
  const website = clinic.website ?? place.website;
  const labels = clinic.disciplines.map((d) => DISCIPLINE_LABELS[d]);
  if (!website) {
    return {
      services: clinic.services.length ? clinic.services : labels,
      specializations: [],
      languages: ["English"],
      positioning: `${labels.join(" and ")} clinic with no website on record.`,
      nicheTermsByService: {},
      team: [],
      accessibility: [],
      socialLinks: [],
      trustSignals: [],
    };
  }
  const notes = await deps.ai.readWeb({ urls: [website], system: understandSystem(), question: understandQuestion(clinic.name), tier: "light" });
  const extracted = await deps.ai.structured({ schema: Understanding, system: "You extract structured facts from notes.", user: understandExtractPrompt(clinic.disciplines, notes), tier: "light" });
  // The owner's declared services always count, even when the site omits them.
  const services = [...new Set([...extracted.services, ...clinic.services])];
  return { ...extracted, services };
}

/** Market preview: how many same-type clinics offer each service within 5 km, and their medians for the hints. */
export async function marketPreview(clinic: Clinic, place: Place, services: string[], deps: PipelineDeps) {
  const center = { lat: place.lat, lng: place.lng };
  const counts: { service: string; count: number }[] = [];
  const seen = new Map<string, Place>();
  // One listing per clinic: Google sometimes returns the same clinic twice under different place ids.
  const seenNames = new Set<string>();

  const results = await Promise.all(
    services.slice(0, 6).map(async (service) => ({ service, found: await deps.places.searchText(`${service} ${clinic.city}`, { near: center, radiusM: MARKET_RADIUS_M, max: SEARCH_PAGE }) })),
  );
  for (const { service, found } of results) {
    const nearby = found.filter(
      (p) => p.placeId !== place.placeId && distanceKm(center, p) <= MARKET_RADIUS_KM && matchesDisciplines(p.types, clinic.disciplines),
    );
    counts.push({ service, count: nearby.length });
    for (const p of nearby) {
      if (seen.has(p.placeId) || seenNames.has(nameKey(p.name))) continue;
      seen.set(p.placeId, p);
      seenNames.add(nameKey(p.name));
    }
  }

  const peers = [...seen.values()];
  const nearby: NearbyClinic[] = peers
    .map((p) => ({ placeId: p.placeId, name: p.name, lat: p.lat, lng: p.lng, rating: p.rating, reviewCount: p.reviewCount, distanceKm: Math.round(distanceKm(center, p) * 10) / 10 }))
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, MAX_NEARBY);
  // A search that returned its full page may have more behind it, so the count is "at least".
  const capped = results.some((r) => r.found.length >= SEARCH_PAGE);
  const stats: MarketStats = medianStats(peers);
  return { counts, stats, nearby, capped };
}

export type PhaseHooks = { onPhase: (phase: "validate" | "enrich" | "understand", fn: () => Promise<void>) => Promise<void> };

/** Runs phases 1-3 and returns the scan. The caller records phase progress through `hooks`. */
export async function runQuickScan(clinic: Clinic, deps: PipelineDeps, hooks: PhaseHooks): Promise<ScanResult> {
  let place!: Place;
  let understanding!: Understanding;

  await hooks.onPhase("validate", async () => validate(clinic));
  await hooks.onPhase("enrich", async () => {
    place = await enrich(clinic, deps);
  });
  await hooks.onPhase("understand", async () => {
    understanding = await understand(clinic, place, deps);
  });

  const { counts, stats, nearby, capped } = await marketPreview(clinic, place, understanding.services, deps).catch(() => ({ counts: [], stats: {} as MarketStats, nearby: [] as NearbyClinic[], capped: false }));
  const hints = buildScanHints(place, stats, { clinicIsNew: isNewClinic(clinic.opened), capped });
  return { place, understanding, hints, competitorCountsPerService: counts, nearby, radiusKm: MARKET_RADIUS_M / 1000, nearbyCapped: capped };
}
