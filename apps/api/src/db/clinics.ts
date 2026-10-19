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

/** Owner-scoped read used by routes. */
export async function getClinic(id: string, ownerId: string): Promise<Clinic | null> {
  const clinic = await getClinicById(id);
  return clinic && clinic.ownerId === ownerId ? clinic : null;
}

/** Trusted read for the job runner; ownership was checked when the job was created. */
export async function getClinicById(id: string): Promise<Clinic | null> {
  const db = await getDb();
  const row = await db.select(rid("clinic", id));
  return row ? Clinic.parse(toPlain(row)) : null;
}

export async function listClinics(ownerId: string): Promise<Clinic[]> {
  const db = await getDb();
  const [rows] = await db.query<[unknown[]]>("SELECT * FROM clinic WHERE ownerId = $ownerId ORDER BY createdAt DESC", { ownerId });
  return rows.map((r) => Clinic.parse(toPlain(r)));
}

export async function updateClinic(id: string, patch: Partial<ClinicInput> & { placeId?: string; lat?: number; lng?: number }): Promise<Clinic> {
  const db = await getDb();
  const row = await db.update(rid("clinic", id)).merge(patch);
  return Clinic.parse(toPlain(row));
}
