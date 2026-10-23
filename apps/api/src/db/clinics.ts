import { Clinic, type ClinicInput } from "@clinix/contracts";
import { getDb } from "./connection.js";
import { rid, toPlain } from "./records.js";
import { newId, nowIso } from "../lib/ids.js";

export async function createClinic(input: ClinicInput, ownerId: string, orgId?: string): Promise<Clinic> {
  const db = await getDb();
  const id = newId("clinic");
  const row = await db.create(rid("clinic", id)).content({ ...input, ownerId, orgId, createdAt: nowIso() });
  return Clinic.parse(toPlain(row));
}

/** Read used by routes: the owner, or anyone in the clinic's organization. */
export async function getClinic(id: string, userId: string, orgId?: string): Promise<Clinic | null> {
  const clinic = await getClinicById(id);
  if (!clinic) return null;
  const member = !!orgId && clinic.orgId === orgId;
  return clinic.ownerId === userId || member ? clinic : null;
}

/** Trusted read for the job runner; ownership was checked when the job was created. */
export async function getClinicById(id: string): Promise<Clinic | null> {
  const db = await getDb();
  const row = await db.select(rid("clinic", id));
  return row ? Clinic.parse(toPlain(row)) : null;
}

/** The clinics a person can open: their own, plus their organization's when one is active. */
export async function listClinics(userId: string, orgId?: string): Promise<Clinic[]> {
  const db = await getDb();
  const [rows] = orgId
    ? await db.query<[unknown[]]>("SELECT * FROM clinic WHERE ownerId = $userId OR orgId = $orgId ORDER BY createdAt DESC", { userId, orgId })
    : await db.query<[unknown[]]>("SELECT * FROM clinic WHERE ownerId = $userId ORDER BY createdAt DESC", { userId });
  return rows.map((r) => Clinic.parse(toPlain(r)));
}

export async function updateClinic(id: string, patch: Partial<ClinicInput> & { placeId?: string; lat?: number; lng?: number }): Promise<Clinic> {
  const db = await getDb();
  const row = await db.update(rid("clinic", id)).merge(patch);
  return Clinic.parse(toPlain(row));
}

/** Moves a guest's clinic to a signed-in owner, and into their active organization. Compare-and-set on the current owner. */
export async function transferClinic(id: string, fromOwnerId: string, toOwnerId: string, orgId?: string): Promise<Clinic | null> {
  const db = await getDb();
  const params = { id: rid("clinic", id), from: fromOwnerId, to: toOwnerId, org: orgId };
  const [rows] = orgId
    ? await db.query<[unknown[]]>("UPDATE $id SET ownerId = $to, orgId = $org WHERE ownerId = $from RETURN AFTER", params)
    : await db.query<[unknown[]]>("UPDATE $id SET ownerId = $to WHERE ownerId = $from RETURN AFTER", params);
  return rows.length ? Clinic.parse(toPlain(rows[0])) : null;
}

const sameText = (a: string, b: string) => a.trim().toLowerCase().replace(/\s+/g, " ") === b.trim().toLowerCase().replace(/\s+/g, " ");

/** The owner's clinic with this name at this address, if they already set it up. */
export async function findClinic(ownerId: string, name: string, address: string): Promise<Clinic | null> {
  return (await listClinics(ownerId)).find((c) => sameText(c.name, name) && sameText(c.address, address)) ?? null;
}
