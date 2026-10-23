import { primaryDiscipline, type Discipline, type Report } from "@clinix/contracts";

export type Competitor = Report["competitors"][number];
export type Sort = "closest" | "rating" | "reviews" | "name";
export type Filter = Discipline | "all";

export const SORTS: { key: Sort; label: string }[] = [
  { key: "closest", label: "Closest first" },
  { key: "rating", label: "Highest Google rating" },
  { key: "reviews", label: "Most Google reviews" },
  { key: "name", label: "Name A–Z" },
];

const fold = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

/** The one discipline a competitor is counted under, so the filter counts add up to the total. */
export const disciplineOf = (c: Competitor, owner: Discipline[]): Discipline => primaryDiscipline(c.disciplines, owner);

/** The filter pills: every discipline that has a competitor or belongs to the clinic, with its count. */
export function disciplineCounts(competitors: Competitor[], owner: Discipline[]): { key: Filter; count: number }[] {
  const counts = new Map<Discipline, number>();
  owner.forEach((d) => counts.set(d, 0));
  competitors.forEach((c) => { const d = disciplineOf(c, owner); counts.set(d, (counts.get(d) ?? 0) + 1); });
  return [{ key: "all", count: competitors.length }, ...[...counts].map(([key, count]) => ({ key, count }))];
}

const services = (c: Competitor) => c.site?.services ?? [];

/** Filter by discipline, search the name and the services on their site (accents and case ignored), then sort. Missing numbers go last. */
export function visibleCompetitors(competitors: Competitor[], owner: Discipline[], opts: { filter: Filter; query: string; sort: Sort }): Competitor[] {
  const q = fold(opts.query.trim());
  const last = (n: number | undefined, dir: 1 | -1) => (n === undefined ? Number.POSITIVE_INFINITY : n * dir);
  return competitors
    .filter((c) => opts.filter === "all" || disciplineOf(c, owner) === opts.filter)
    .filter((c) => !q || fold(c.name).includes(q) || services(c).some((s) => fold(s).includes(q)))
    .sort((a, b) => {
      if (opts.sort === "name") return a.name.localeCompare(b.name);
      if (opts.sort === "closest") return a.distanceKm - b.distanceKm;
      const key = opts.sort === "rating" ? "rating" : "reviewCount";
      return last(a[key], -1) - last(b[key], -1);
    });
}

export type Comparison = { kind: "more" | "fewer" | "similar" | "unknown"; diff: number };

/** The competitor's Google review count against the clinic's, from the two listings. Reviews read by Clinx are not used. */
export function compareReviews(competitor: number | undefined, yours: number | undefined): Comparison {
  if (competitor === undefined || yours === undefined) return { kind: "unknown", diff: 0 };
  const diff = competitor - yours;
  if (Math.abs(diff) <= Math.max(2, Math.round(yours * 0.05))) return { kind: "similar", diff };
  return { kind: diff > 0 ? "more" : "fewer", diff };
}

const csvCell = (v: string | number | undefined) => `"${String(v ?? "").replace(/"/g, '""')}"`;

/** The list as it is on screen: the same rows, in the same order, as a CSV the owner can open anywhere. */
export function competitorsCsv(rows: Competitor[], yours: number | undefined): string {
  const head = ["Clinic", "Distance (km)", "Google rating", "Google reviews", "Services on their site", "Reviews vs yours"];
  const lines = rows.map((c) => {
    const cmp = compareReviews(c.reviewCount, yours);
    return [c.name, c.distanceKm.toFixed(1), c.rating, c.reviewCount, services(c).join("; "), cmp.kind === "unknown" ? "" : cmp.diff].map(csvCell).join(",");
  });
  return [head.map(csvCell).join(","), ...lines].join("\n");
}

export const initialsOf = (name: string) => name.split(/[\s/|–-]+/).filter((w) => /^\p{L}/u.test(w)).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "?";
