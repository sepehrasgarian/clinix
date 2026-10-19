import type { AnalysisStage, PhaseId } from "@clinix/contracts";
import { getAnalysis, saveDiscovery, saveScan, setPhase, transition } from "../db/analyses.js";
import { getClinicById, updateClinic } from "../db/clinics.js";
import { humanizeError } from "../lib/errors.js";
import { nowIso } from "../lib/ids.js";
import type { PipelineDeps } from "./deps.js";
import { runDiscovery } from "./discover.js";
import { runQuickScan } from "./quickScan.js";

/** The stage runners the routes can start. Injected so tests can replace them. */
export type StageRunners = {
  quickScan: (analysisId: string, deps: PipelineDeps) => Promise<void>;
  discovery: (analysisId: string, deps: PipelineDeps) => Promise<void>;
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
  await setPhase(analysisId, phase, { status: "running", startedAt });
  try {
    await fn();
    await setPhase(analysisId, phase, { status: "done", startedAt, finishedAt: nowIso() });
  } catch (err) {
    await setPhase(analysisId, phase, { status: "failed", startedAt, finishedAt: nowIso(), error: humanizeError(err) });
    throw err;
  }
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

export const stageRunners: StageRunners = { quickScan: startQuickScan, discovery: startDiscovery };
