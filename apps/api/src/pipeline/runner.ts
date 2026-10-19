import type { PhaseId } from "@clinix/contracts";
import { getAnalysis, saveScan, setPhase, transition } from "../db/analyses.js";
import { getClinicById, updateClinic } from "../db/clinics.js";
import { humanizeError } from "../lib/errors.js";
import { nowIso } from "../lib/ids.js";
import type { PipelineDeps } from "./deps.js";
import { runQuickScan } from "./quickScan.js";

/**
 * In-process job runner. Each stage claims the analysis with a compare-and-set
 * (queued -> running), records phase progress, and ends in a checkpoint or failed state.
 */
export async function startQuickScan(analysisId: string, deps: PipelineDeps): Promise<void> {
  const claimed = await transition(analysisId, "queued", { status: "running" });
  if (!claimed) return; // another worker already has it

  const analysis = await getAnalysis(analysisId);
  const clinic = analysis && (await getClinicById(analysis.clinicId));
  if (!analysis || !clinic) {
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
