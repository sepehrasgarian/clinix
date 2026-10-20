export { matchesDisciplines } from "@clinix/contracts";
import { matchesDisciplines } from "@clinix/contracts";
import type { Discipline } from "@clinix/contracts";

/** Keeps same-discipline places when there are any; otherwise falls back to the full list. */
export function preferSameDiscipline<T extends { types: string[] }>(places: T[], disciplines: Discipline[]): T[] {
  const same = places.filter((p) => matchesDisciplines(p.types, disciplines));
  return same.length ? same : places;
}
