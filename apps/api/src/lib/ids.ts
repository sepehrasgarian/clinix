import { randomUUID } from "node:crypto";

/** Short, URL-safe ids with a readable prefix, e.g. `clinic_9f3a1c2b7d`. */
export function newId(prefix: string): string {
  return `${prefix}_${randomUUID().replace(/-/g, "").slice(0, 12)}`;
}

export const nowIso = (): string => new Date().toISOString();
