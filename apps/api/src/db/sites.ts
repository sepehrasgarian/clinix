import { Understanding } from "@clinix/contracts";
import { nowIso } from "../lib/ids.js";
import { getDb } from "./connection.js";
import { rid, toPlain } from "./records.js";

export const SITE_CACHE_DAYS = 14;

export type SiteStatus = "read" | "no_website" | "unreadable";
export type SiteRecord = { placeId: string; website?: string; status: SiteStatus; profile?: Understanding; fetchedAt: string };

/** Remembers what a clinic's website said (or that it could not be read) so re-runs skip the fetch. */
export async function saveSite(placeId: string, website: string | undefined, status: SiteStatus, profile?: Understanding): Promise<void> {
  const db = await getDb();
  await db.upsert(rid("site_fetch", placeId)).content({ placeId, website, status, profile, fetchedAt: nowIso() });
}

/** Site records fetched within the cache window, by place id. */
export async function cachedSites(placeIds: string[], maxAgeDays = SITE_CACHE_DAYS): Promise<Map<string, SiteRecord>> {
  if (placeIds.length === 0) return new Map();
  const db = await getDb();
  const since = new Date(Date.now() - maxAgeDays * 24 * 3600 * 1000).toISOString();
  const [rows] = await db.query<[unknown[]]>("SELECT * FROM site_fetch WHERE placeId IN $ids AND fetchedAt >= $since", { ids: placeIds, since });
  const out = new Map<string, SiteRecord>();
  for (const raw of rows) {
    const { id: _id, ...r } = toPlain<Record<string, unknown>>(raw);
    const rec = r as SiteRecord;
    out.set(rec.placeId, { ...rec, profile: rec.profile ? Understanding.parse(rec.profile) : undefined });
  }
  return out;
}
