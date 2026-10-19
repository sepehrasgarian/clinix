import { RecordId } from "surrealdb";

/** Converts SurrealDB RecordIds anywhere in a value to the plain string ids used by the contracts. */
export function toPlain<T>(value: unknown): T {
  if (value instanceof RecordId) return String(value.id) as T;
  if (Array.isArray(value)) return value.map((v) => toPlain(v)) as T;
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, toPlain(v)])) as T;
  }
  return value as T;
}

export const rid = (table: string, id: string): RecordId => new RecordId(table, id);
