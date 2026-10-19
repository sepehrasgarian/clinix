import { Surreal, RecordId, Table } from "surrealdb";
import { createNodeEngines } from "@surrealdb/node";
import { mkdirSync } from "node:fs";
import { env } from "./env.js";

// Embedded SurrealDB: no server to run. Data persists under ./data.
// Set SURREAL_URL to a remote instance (ws://...) to use Surreal Cloud instead.
let db: Surreal | null = null;

export async function getDb(): Promise<Surreal> {
  if (db) return db;
  const url = env.SURREAL_URL;
  if (url.startsWith("surrealkv://")) mkdirSync("./data", { recursive: true });

  db = new Surreal({ engines: createNodeEngines() });
  await db.connect(url);
  await db.use({ namespace: "clinix", database: "main" });
  await db.query(SCHEMA);
  return db;
}

const SCHEMA = `
DEFINE TABLE IF NOT EXISTS clinic SCHEMALESS;
DEFINE TABLE IF NOT EXISTS competitor SCHEMALESS;
DEFINE TABLE IF NOT EXISTS consultation SCHEMALESS;
DEFINE TABLE IF NOT EXISTS memory SCHEMALESS;
DEFINE INDEX IF NOT EXISTS clinic_owner ON clinic FIELDS owner_id;
DEFINE INDEX IF NOT EXISTS competitor_clinic ON competitor FIELDS clinic;
DEFINE INDEX IF NOT EXISTS consultation_clinic ON consultation FIELDS clinic;
DEFINE INDEX IF NOT EXISTS memory_clinic ON memory FIELDS clinic;
`;

export type Clinic = {
  id?: RecordId;
  owner_id: string;
  name: string;
  type: string; // dental, physio, dermatology, walk-in, ...
  address: string;
  city: string;
  services: string[];
  prices?: Record<string, string>;
  website?: string;
  notes?: string;
  created_at?: string;
};

export type Competitor = {
  id?: RecordId;
  clinic: RecordId;
  name: string;
  address?: string;
  website?: string;
  rating?: number;
  review_count?: number;
  services: string[];
  price_notes?: string;
  hours?: string;
  strengths: string[];
  weaknesses: string[];
  source_urls: string[];
  updated_at: string;
};

export type Consultation = {
  id?: RecordId;
  clinic: RecordId;
  summary: string;
  market_position: string;
  opportunities: string[];
  threats: string[];
  action_plan: { title: string; why: string; effort: "low" | "medium" | "high"; impact: "low" | "medium" | "high" }[];
  report_markdown: string;
  created_at: string;
};

export type Memory = {
  id?: RecordId;
  clinic: RecordId;
  role: "user" | "assistant";
  content: string;
  created_at: string;
};

export async function createClinic(c: Clinic): Promise<Clinic> {
  const db = await getDb();
  const row = await db.create<Clinic>(new Table("clinic")).content({ ...c, created_at: new Date().toISOString() });
  return row[0] ?? (row as unknown as Clinic);
}

export async function getClinic(id: string, ownerId: string): Promise<Clinic | null> {
  const db = await getDb();
  const row = await db.select<Clinic>(new RecordId("clinic", id));
  if (!row || row.owner_id !== ownerId) return null;
  return row as Clinic;
}

export async function listClinics(ownerId: string): Promise<Clinic[]> {
  const db = await getDb();
  const [rows] = await db.query<[Clinic[]]>(
    "SELECT * FROM clinic WHERE owner_id = $owner ORDER BY created_at DESC",
    { owner: ownerId },
  );
  return rows as unknown[] as Clinic[];
}

export async function replaceCompetitors(clinicId: RecordId, comps: Omit<Competitor, "clinic" | "updated_at">[]) {
  const db = await getDb();
  await db.query("DELETE competitor WHERE clinic = $clinic", { clinic: clinicId });
  const now = new Date().toISOString();
  for (const c of comps) {
    await db.create<Competitor>(new Table("competitor")).content({ ...c, clinic: clinicId, updated_at: now });
  }
}

export async function listCompetitors(clinicId: RecordId): Promise<Competitor[]> {
  const db = await getDb();
  const [rows] = await db.query<[Competitor[]]>(
    "SELECT * FROM competitor WHERE clinic = $clinic ORDER BY rating DESC",
    { clinic: clinicId },
  );
  return rows;
}

export async function saveConsultation(c: Omit<Consultation, "created_at">): Promise<Consultation> {
  const db = await getDb();
  const row = await db.create<Consultation>(new Table("consultation")).content({ ...c, created_at: new Date().toISOString() });
  return row[0] ?? (row as unknown as Consultation);
}

export async function listConsultations(clinicId: RecordId): Promise<Consultation[]> {
  const db = await getDb();
  const [rows] = await db.query<[Consultation[]]>(
    "SELECT * FROM consultation WHERE clinic = $clinic ORDER BY created_at DESC",
    { clinic: clinicId },
  );
  return rows;
}

export async function appendMemory(clinicId: RecordId, role: Memory["role"], content: string) {
  const db = await getDb();
  await db.create<Memory>(new Table("memory")).content({ clinic: clinicId, role, content, created_at: new Date().toISOString() });
}

export async function recentMemory(clinicId: RecordId, limit = 20): Promise<Memory[]> {
  const db = await getDb();
  const [rows] = await db.query<[Memory[]]>(
    "SELECT * FROM memory WHERE clinic = $clinic ORDER BY created_at DESC LIMIT $limit",
    { clinic: clinicId, limit },
  );
  return rows.reverse();
}
