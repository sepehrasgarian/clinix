import type { Discipline } from "@clinix/contracts";

/** Google Places types that identify a business of each discipline. */
const TYPES_BY_DISCIPLINE: Record<Discipline, string[]> = {
  dentistry: ["dentist", "dental_clinic"],
  dental_hygiene: ["dentist", "dental_clinic"],
  physiotherapy: ["physiotherapist", "physical_therapy_clinic", "sports_medicine_clinic"],
  chiropractic: ["chiropractor"],
  massage: ["massage", "massage_therapist", "spa", "wellness_center"],
  naturopathy: ["naturopath", "wellness_center", "alternative_medicine_practitioner"],
  other: [],
};

/** True when the place's Google types match one of the clinic's disciplines. `other` matches anything. */
export function matchesDisciplines(types: string[], disciplines: Discipline[]): boolean {
  if (disciplines.includes("other")) return true;
  const wanted = new Set(disciplines.flatMap((d) => TYPES_BY_DISCIPLINE[d]));
  return types.some((t) => wanted.has(t));
}

/** Keeps same-discipline places when there are any; otherwise falls back to the full list. */
export function preferSameDiscipline<T extends { types: string[] }>(places: T[], disciplines: Discipline[]): T[] {
  const same = places.filter((p) => matchesDisciplines(p.types, disciplines));
  return same.length ? same : places;
}
