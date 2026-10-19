import {
  Analysis,
  type AnalysisStage,
  type AnalysisStatus,
  type DiscoveryResult,
  type PhaseId,
  type PhaseProgress,
  type Report,
  type ScanResult,
} from "@clinix/contracts";
import { getDb } from "./connection.js";
import { rid, toPlain } from "./records.js";
import { newId, nowIso } from "../lib/ids.js";

const QUICK_SCAN_PHASES: PhaseId[] = ["validate", "enrich", "understand"];
const DISCOVERY_PHASES: PhaseId[] = ["discover"];
const DEEP_PHASES: PhaseId[] = ["reviews", "mine", "synthesize"];

export function phasesFor(stage: AnalysisStage): PhaseProgress[] {
  const ids = stage === "quick_scan" ? QUICK_SCAN_PHASES : stage === "discovery" ? DISCOVERY_PHASES : DEEP_PHASES;
  return ids.map((phase) => ({ phase, status: "pending" }));
}

export async function createAnalysis(clinicId: string): Promise<Analysis> {
  const db = await getDb();
  const id = newId("analysis");
  const now = nowIso();
  const row = await db.create(rid("analysis", id)).content({
    clinicId,
    stage: "quick_scan",
    status: "queued",
    phases: phasesFor("quick_scan"),
    createdAt: now,
    updatedAt: now,
  });
  return Analysis.parse(toPlain(row));
}

export async function getAnalysis(id: string): Promise<Analysis | null> {
  const db = await getDb();
  const row = await db.select(rid("analysis", id));
  return row ? Analysis.parse(toPlain(row)) : null;
}

export async function listAnalyses(clinicId: string): Promise<Analysis[]> {
  const db = await getDb();
  const [rows] = await db.query<[unknown[]]>("SELECT * FROM analysis WHERE clinicId = $clinicId ORDER BY createdAt DESC", { clinicId });
  return rows.map((r) => Analysis.parse(toPlain(r)));
}

export async function latestSucceeded(clinicId: string, excludeId?: string): Promise<Analysis | null> {
  const db = await getDb();
  const [rows] = await db.query<[unknown[]]>(
    "SELECT * FROM analysis WHERE clinicId = $clinicId AND status = 'succeeded' AND report != NONE ORDER BY createdAt DESC",
    { clinicId },
  );
  const found = rows.map((r) => Analysis.parse(toPlain(r))).find((a) => a.id !== excludeId);
  return found ?? null;
}

/**
 * Compare-and-set status transition. Returns the updated row, or null when the current
 * status is not `expected` (someone else already moved it). This is what stops double runs.
 */
export async function transition(
  id: string,
  expected: AnalysisStatus | AnalysisStatus[],
  next: { status: AnalysisStatus; stage?: AnalysisStage; error?: string },
): Promise<Analysis | null> {
  const db = await getDb();
  const expectedList = Array.isArray(expected) ? expected : [expected];
  const patch: Record<string, unknown> = { status: next.status, updatedAt: nowIso() };
  if (next.stage) {
    patch.stage = next.stage;
    patch.phases = phasesFor(next.stage);
  }
  if (next.error !== undefined) patch.error = next.error;
  const [rows] = await db.query<[unknown[]]>(
    "UPDATE $id MERGE $patch WHERE status IN $expected RETURN AFTER",
    { id: rid("analysis", id), patch, expected: expectedList },
  );
  return rows.length ? Analysis.parse(toPlain(rows[0])) : null;
}

export async function setPhase(id: string, phase: PhaseId, update: Omit<PhaseProgress, "phase">): Promise<void> {
  const db = await getDb();
  const current = await getAnalysis(id);
  if (!current) throw new Error(`analysis ${id} not found`);
  const phases = current.phases.map((p) => (p.phase === phase ? { phase, ...update } : p));
  await db.update(rid("analysis", id)).merge({ phases, updatedAt: nowIso() });
}

export async function saveScan(id: string, scan: ScanResult): Promise<void> {
  const db = await getDb();
  await db.update(rid("analysis", id)).merge({ scan, updatedAt: nowIso() });
}

export async function saveDiscovery(id: string, discovery: DiscoveryResult): Promise<void> {
  const db = await getDb();
  await db.update(rid("analysis", id)).merge({ discovery, updatedAt: nowIso() });
}

export async function saveReport(id: string, report: Report): Promise<void> {
  const db = await getDb();
  await db.update(rid("analysis", id)).merge({ report, updatedAt: nowIso() });
}
