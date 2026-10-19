import { mkdirSync } from "node:fs";
import { Surreal } from "surrealdb";
import { createNodeEngines } from "@surrealdb/node";
import { env } from "../env.js";

let db: Surreal | null = null;
let activeUrl: string | null = null;

const SCHEMA = `
DEFINE TABLE IF NOT EXISTS clinic SCHEMALESS;
DEFINE TABLE IF NOT EXISTS analysis SCHEMALESS;
DEFINE TABLE IF NOT EXISTS review SCHEMALESS;
DEFINE TABLE IF NOT EXISTS memory SCHEMALESS;
DEFINE INDEX IF NOT EXISTS clinic_owner ON clinic FIELDS ownerId;
DEFINE INDEX IF NOT EXISTS analysis_clinic ON analysis FIELDS clinicId;
DEFINE INDEX IF NOT EXISTS review_place ON review FIELDS placeId;
DEFINE INDEX IF NOT EXISTS memory_clinic ON memory FIELDS clinicId;
`;

/**
 * Embedded SurrealDB. The first call decides the URL (`mem://` in tests, `surrealkv://` on
 * disk by default, `ws://` for Surreal Cloud); later calls reuse the open connection.
 */
export async function getDb(): Promise<Surreal> {
  if (db) return db;
  return open(activeUrl ?? env.SURREAL_URL);
}

async function open(url: string): Promise<Surreal> {
  if (url.startsWith("surrealkv://")) {
    const dir = url.replace("surrealkv://", "").replace(/\/[^/]*$/, "") || ".";
    mkdirSync(dir, { recursive: true });
  }
  const conn = new Surreal({ engines: createNodeEngines() });
  await conn.connect(url);
  await conn.use({ namespace: "clinix", database: "main" });
  await conn.query(SCHEMA);
  db = conn;
  activeUrl = url;
  return conn;
}

/** Tests call this before each case to get a fresh in-memory database. */
export async function resetDbForTests(): Promise<Surreal> {
  if (db) await db.close();
  db = null;
  return open("mem://");
}
