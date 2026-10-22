import type { Clinic } from "@clinix/contracts";

const plain = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();
const key = (c: Pick<Clinic, "name" | "address">) => `${plain(c.name)}|${plain(c.address)}`;

/**
 * One entry per real clinic. Older setups could leave the same clinic saved several times; the switcher must not list it
 * repeatedly. The clinic being viewed stands for its own group; otherwise the newest one does. Order is kept.
 */
export function distinctClinics(clinics: Clinic[], currentId?: string): Clinic[] {
  const chosen = new Map<string, Clinic>();
  for (const c of clinics) {
    const k = key(c);
    const kept = chosen.get(k);
    if (!kept || (kept.id !== currentId && (c.id === currentId || c.createdAt > kept.createdAt))) chosen.set(k, c);
  }
  return clinics.filter((c) => chosen.get(key(c)) === c);
}
