import { primaryDiscipline, type CompetitorCandidate, type Discipline } from "@clinix/contracts";

export type SortKey = "relevance" | "distance" | "rating" | "reviews";
export const SORTS: { key: SortKey; label: string }[] = [
  { key: "relevance", label: "Relevance" },
  { key: "distance", label: "Distance" },
  { key: "rating", label: "Google rating" },
  { key: "reviews", label: "Most reviews" },
];
export const DISTANCES: { km: number | null; label: string }[] = [
  { km: null, label: "Any distance" },
  { km: 1, label: "Within 1 km" },
  { km: 2, label: "Within 2 km" },
  { km: 5, label: "Within 5 km" },
  { km: 10, label: "Within 10 km" },
];

export const PER_DISCIPLINE_MAX = 5;

const plain = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

/** Filters by name or address text and a distance cap, then sorts. Missing ratings or reviews sort last, never as zero. */
export function visibleCandidates(items: CompetitorCandidate[], { query, maxKm, sort }: { query: string; maxKm: number | null; sort: SortKey }): CompetitorCandidate[] {
  const q = plain(query.trim());
  const shown = items.filter((c) => (maxKm === null || c.distanceKm <= maxKm) && (!q || plain(`${c.place.name} ${c.place.address}`).includes(q)));
  const last = (n: number | undefined) => n ?? -1;
  const by: Record<SortKey, (a: CompetitorCandidate, b: CompetitorCandidate) => number> = {
    relevance: (a, b) => b.relevance - a.relevance,
    distance: (a, b) => a.distanceKm - b.distanceKm,
    rating: (a, b) => last(b.place.rating) - last(a.place.rating) || last(b.place.reviewCount) - last(a.place.reviewCount),
    reviews: (a, b) => last(b.place.reviewCount) - last(a.place.reviewCount),
  };
  return [...shown].sort(by[sort]);
}

/** Each candidate belongs to one discipline, so the five-per-discipline limit is unambiguous. */
export function groupByDiscipline(candidates: CompetitorCandidate[], disciplines: Discipline[]) {
  return disciplines.map((d) => ({ d, items: candidates.filter((c) => primaryDiscipline(c.disciplines, disciplines) === d) })).filter((g) => g.items.length);
}

export function countPerDiscipline(candidates: CompetitorCandidate[], selected: string[], d: Discipline, ownerDisciplines: Discipline[] = [d]): number {
  return candidates.filter((c) => selected.includes(c.place.placeId) && primaryDiscipline(c.disciplines, ownerDisciplines) === d).length;
}
