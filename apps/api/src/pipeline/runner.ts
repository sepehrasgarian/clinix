import type { AnalysisStage, PhaseId } from "@clinix/contracts";
import { getAnalysis, saveDiscovery, saveReport, saveScan, setPhase, transition } from "../db/analyses.js";
import { getClinicById, updateClinic } from "../db/clinics.js";
import { humanizeError } from "../lib/errors.js";
import { nowIso } from "../lib/ids.js";
import { log } from "../lib/log.js";
import type { PipelineDeps } from "./deps.js";
import { runDeepAnalysis } from "./deep.js";
import { runDiscovery } from "./discover.js";
import { runQuickScan } from "./quickScan.js";

/** The stage runners the routes can start. Injected so tests can replace them. */
export type StageRunners = {
  quickScan: (analysisId: string, deps: PipelineDeps) => Promise<void>;
  discovery: (analysisId: string, deps: PipelineDeps) => Promise<void>;
  deep: (analysisId: string, deps: PipelineDeps) => Promise<void>;
};

/**
 * In-process job runner. Each stage claims the analysis with a compare-and-set
 * (queued -> running), records phase progress, and ends in a checkpoint or failed state.
 */
export async function startQuickScan(analysisId: string, deps: PipelineDeps): Promise<void> {
  const analysis = await claimStage(analysisId, "quick_scan");
  if (!analysis) return;

  const clinic = await getClinicById(analysis.clinicId);
  if (!clinic) {
    await transition(analysisId, "running", { status: "failed", error: "Clinic not found." });
    return;
  }

  try {
    const scan = await runQuickScan(clinic, deps, { onPhase: (phase, fn) => trackPhase(analysisId, phase, fn) });
    await saveScan(analysisId, scan);
    await updateClinic(clinic.id, { placeId: scan.place.placeId, lat: scan.place.lat, lng: scan.place.lng });
    await transition(analysisId, "running", { status: "awaiting_services" });
  } catch (err) {
    await transition(analysisId, "running", { status: "failed", error: humanizeError(err) });
  }
}

/**
 * Claims a queued analysis for one stage with a compare-and-set (queued -> running).
 * Returns null when the analysis is missing, in another stage, or already claimed.
 */
async function claimStage(analysisId: string, stage: AnalysisStage) {
  const current = await getAnalysis(analysisId);
  if (!current || current.stage !== stage || current.status !== "queued") return null;
  return transition(analysisId, "queued", { status: "running" });
}

async function trackPhase(analysisId: string, phase: PhaseId, fn: () => Promise<void>): Promise<void> {
  const startedAt = nowIso();
  const t0 = Date.now();
  await setPhase(analysisId, phase, { status: "running", startedAt });
  log.info({ analysisId, phase }, "phase start");
  try {
    await fn();
    await setPhase(analysisId, phase, { status: "done", startedAt, finishedAt: nowIso() });
    log.info({ analysisId, phase, ms: Date.now() - t0 }, "phase done");
  } catch (err) {
    await setPhase(analysisId, phase, { status: "failed", startedAt, finishedAt: nowIso(), error: humanizeError(err) });
    log.error({ analysisId, phase, ms: Date.now() - t0, err: err instanceof Error ? { message: err.message } : String(err) }, "phase failed");
    throw err;
  }
}

/** How long a stage may stay "running" before it is considered interrupted. */
export const STAGE_TIMEOUT_MS: Record<AnalysisStage, number> = { quick_scan: 5 * 60_000, discovery: 5 * 60_000, deep: 25 * 60_000 };
const INTERRUPTED = "This step was interrupted. Press retry to run it again.";

/**
 * Jobs run inside the API process, so a restart loses whatever was running. On startup, and
 * whenever a stale analysis is read, anything still "running" past its stage timeout (or at
 * all, on startup) is marked failed with a retry message rather than left spinning forever.
 */
export async function recoverInterrupted(opts: { all?: boolean } = {}): Promise<number> {
  const { runningAnalyses } = await import("../db/analyses.js");
  const stuck = await runningAnalyses();
  let n = 0;
  for (const a of stuck) {
    const age = Date.now() - new Date(a.updatedAt).getTime();
    if (opts.all || age > STAGE_TIMEOUT_MS[a.stage]) {
      const moved = await transition(a.id, "running", { status: "failed", error: INTERRUPTED });
      if (moved) {
        const open = a.phases.find((p) => p.status === "running");
        if (open) await setPhase(a.id, open.phase, { status: "failed", startedAt: open.startedAt, finishedAt: nowIso(), error: INTERRUPTED });
        n++;
        log.warn({ analysisId: a.id, stage: a.stage, ageMs: age }, "recovered interrupted analysis");
      }
    }
  }
  return n;
}

/** Stage 2: find and rank competitors, then wait for the owner to confirm them. */
export async function startDiscovery(analysisId: string, deps: PipelineDeps): Promise<void> {
  const claimed = await claimStage(analysisId, "discovery");
  if (!claimed) return;

  const clinic = await getClinicById(claimed.clinicId);
  if (!clinic) {
    await transition(analysisId, "running", { status: "failed", error: "Clinic not found." });
    return;
  }

  try {
    const services = claimed.scan?.understanding.services ?? clinic.services;
    let discovery!: Awaited<ReturnType<typeof runDiscovery>>;
    await trackPhase(analysisId, "discover", async () => {
      discovery = await runDiscovery(clinic, clinic.services.length ? clinic.services : services, deps);
    });
    await saveDiscovery(analysisId, discovery);
    await transition(analysisId, "running", { status: "awaiting_competitors" });
  } catch (err) {
    await transition(analysisId, "running", { status: "failed", error: humanizeError(err) });
  }
}

/** Stage 3: reviews, mining with verification, and the plan. Ends in a report. */
export async function startDeep(analysisId: string, deps: PipelineDeps): Promise<void> {
  const claimed = await claimStage(analysisId, "deep");
  if (!claimed) return;

  const clinic = await getClinicById(claimed.clinicId);
  if (!clinic) {
    await transition(analysisId, "running", { status: "failed", error: "Clinic not found." });
    return;
  }

  try {
    const report = await runDeepAnalysis(clinic, claimed, deps, { onPhase: (phase, fn) => trackPhase(analysisId, phase, fn) });
    await saveReport(analysisId, report);
    await transition(analysisId, "running", { status: "succeeded" });
  } catch (err) {
    await transition(analysisId, "running", { status: "failed", error: humanizeError(err) });
  }
}

export const stageRunners: StageRunners = { quickScan: startQuickScan, discovery: startDiscovery, deep: startDeep };
