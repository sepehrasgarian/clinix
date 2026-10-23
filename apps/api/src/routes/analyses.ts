import { Hono } from "hono";
import { z } from "zod";
import type { CompetitorCandidate } from "@clinix/contracts";
import { getClinic, updateClinic } from "../db/clinics.js";
import { createAnalysis, createAnalysisFromScan, findRecommendation, getAnalysis, listAnalyses, reusableScan, saveDiscovery, setRecommendationStatus, transition } from "../db/analyses.js";
import { canManage, OWNER_ONLY } from "../middleware/access.js";
import type { AuthVariables } from "../middleware/auth.js";
import type { PipelineDeps } from "../pipeline/deps.js";
import { validateSelection } from "../pipeline/discover.js";
import { recoverInterrupted, stageRunners, type StageRunners } from "../pipeline/runner.js";
import { distanceKm, ringFor } from "../lib/geo.js";
import { log } from "../lib/log.js";

const ServicesBody = z.object({ services: z.array(z.string().min(1)).min(1).max(12) });
const SelectionBody = z.object({ placeIds: z.array(z.string().min(1)).max(40) });
/** A listing the owner picked from the lookup (`placeId`), or a name to search for. */
const AddCompetitorBody = z.object({ placeId: z.string().min(1).max(200) }).or(z.object({ query: z.string().min(2).max(120) }));
const StatusBody = z.object({ status: z.enum(["todo", "in_progress", "done"]) });
/** `forceRefresh` asks for a new quick scan even when a recent one could be copied. Owners and administrators only. */
const StartBody = z.object({ forceRefresh: z.boolean().optional() });

/** Routes under /clinics/:id/analyses. `deps` and `run` are injected so tests can use fakes. */
export function analysesRoutes(deps: PipelineDeps, run: StageRunners = stageRunners) {
  return new Hono<{ Variables: AuthVariables }>()
    .get("/", async (c) => {
      const clinic = await getClinic(c.req.param("id")!, c.get("userId"), c.get("orgId"));
      if (!clinic) return c.json({ error: "not found" }, 404);
      return c.json(await listAnalyses(clinic.id));
    })
    .post("/", async (c) => {
      const clinic = await getClinic(c.req.param("id")!, c.get("userId"), c.get("orgId"));
      if (!clinic) return c.json({ error: "not found" }, 404);
      if (!canManage(c.var, clinic)) return c.json(OWNER_ONLY, 403);
      const inFlight = (await listAnalyses(clinic.id)).find((a) => a.status === "queued" || a.status === "running");
      if (inFlight) return c.json(inFlight, 200);
      const body = StartBody.safeParse(await c.req.json().catch(() => ({})));
      const wantsFresh = body.success && body.data.forceRefresh === true;
      if (wantsFresh && c.get("isGuest")) log.info({ clinicId: clinic.id }, "forceRefresh ignored for a guest");
      const previous = wantsFresh && !c.get("isGuest") ? null : await reusableScan(clinic);
      if (previous) return c.json(await createAnalysisFromScan(clinic.id, previous), 201);
      const analysis = await createAnalysis(clinic.id);
      void run.quickScan(analysis.id, deps);
      return c.json(analysis, 202);
    })
    .get("/:aid", async (c) => {
      const clinic = await getClinic(c.req.param("id")!, c.get("userId"), c.get("orgId"));
      if (!clinic) return c.json({ error: "not found" }, 404);
      let analysis = await getAnalysis(c.req.param("aid"));
      if (!analysis || analysis.clinicId !== clinic.id) return c.json({ error: "not found" }, 404);
      if (analysis.status === "running" && (await recoverInterrupted()) > 0) analysis = (await getAnalysis(analysis.id)) ?? analysis;
      return c.json(analysis);
    })
    // Checkpoint 1: the owner confirms the services found by the quick scan.
    .post("/:aid/services", async (c) => {
      const clinic = await getClinic(c.req.param("id")!, c.get("userId"), c.get("orgId"));
      if (!clinic) return c.json({ error: "not found" }, 404);
      if (!canManage(c.var, clinic)) return c.json(OWNER_ONLY, 403);
      const analysis = await getAnalysis(c.req.param("aid"));
      if (!analysis || analysis.clinicId !== clinic.id) return c.json({ error: "not found" }, 404);
      const body = ServicesBody.safeParse(await c.req.json().catch(() => null));
      if (!body.success) return c.json({ error: "services required" }, 400);
      const canConfirm = analysis.status === "awaiting_services" || analysis.status === "awaiting_competitors";
      if (!canConfirm) return c.json({ error: `analysis is ${analysis.status}, not awaiting_services` }, 409);
      await updateClinic(clinic.id, { services: body.data.services });
      // Confirming again from the competitors step re-runs discovery with the new services.
      const moved = await transition(analysis.id, ["awaiting_services", "awaiting_competitors"], { status: "queued", stage: "discovery" });
      if (!moved) return c.json({ error: "analysis changed, reload" }, 409);
      void run.discovery(analysis.id, deps);
      return c.json(moved, 202);
    })
    // Checkpoint 2: the owner confirms up to five competitors per discipline. Needs an account.
    .post("/:aid/competitors", async (c) => {
      if (c.get("isGuest")) return c.json({ error: "Create a free account to choose competitors and run the full analysis.", code: "auth_required" }, 401);
      const clinic = await getClinic(c.req.param("id")!, c.get("userId"), c.get("orgId"));
      if (!clinic) return c.json({ error: "not found" }, 404);
      if (!canManage(c.var, clinic)) return c.json(OWNER_ONLY, 403);
      const analysis = await getAnalysis(c.req.param("aid"));
      if (!analysis || analysis.clinicId !== clinic.id) return c.json({ error: "not found" }, 404);
      if (analysis.status !== "awaiting_competitors" || !analysis.discovery) return c.json({ error: `analysis is ${analysis.status}, not awaiting_competitors` }, 409);
      const body = SelectionBody.safeParse(await c.req.json().catch(() => null));
      if (!body.success) return c.json({ error: "placeIds required" }, 400);
      const problem = validateSelection(analysis.discovery.candidates, body.data.placeIds, clinic.disciplines);
      if (problem) return c.json({ error: problem }, 400);
      await saveDiscovery(analysis.id, { ...analysis.discovery, selectedPlaceIds: body.data.placeIds });
      const moved = await transition(analysis.id, "awaiting_competitors", { status: "queued", stage: "deep" });
      if (!moved) return c.json({ error: "analysis changed, reload" }, 409);
      void run.deep(analysis.id, deps);
      return c.json(moved, 202);
    })
    // The owner adds a competitor we missed, picked from the lookup or by name. It joins the candidate list as "strong".
    .post("/:aid/competitors/add", async (c) => {
      const clinic = await getClinic(c.req.param("id")!, c.get("userId"), c.get("orgId"));
      if (!clinic) return c.json({ error: "not found" }, 404);
      if (!canManage(c.var, clinic)) return c.json(OWNER_ONLY, 403);
      const analysis = await getAnalysis(c.req.param("aid"));
      if (!analysis || analysis.clinicId !== clinic.id) return c.json({ error: "not found" }, 404);
      if (analysis.status !== "awaiting_competitors" || !analysis.discovery) return c.json({ error: "analysis is not awaiting competitors" }, 409);
      const body = AddCompetitorBody.safeParse(await c.req.json().catch(() => null));
      if (!body.success) return c.json({ error: "placeId or query required" }, 400);
      const center = { lat: clinic.lat ?? 0, lng: clinic.lng ?? 0 };
      const place = "placeId" in body.data
        ? await deps.places.details(body.data.placeId).catch(() => null)
        : (await deps.places.searchText(`${body.data.query} ${clinic.city}`, { near: center, radiusM: 15000, max: 1 }))[0];
      if (!place) return c.json({ error: "No clinic matched that name nearby." }, 404);
      if (place.placeId === clinic.placeId) return c.json({ error: "That is your own clinic, not a competitor." }, 422);
      if (analysis.discovery.candidates.some((k) => k.place.placeId === place.placeId)) return c.json(analysis.discovery);
      const km = distanceKm(center, place);
      const candidate: CompetitorCandidate = { place, distanceKm: Math.round(km * 10) / 10, ring: ringFor(km), relevance: 100, flag: "strong", reason: "Added by the owner.", disciplines: clinic.disciplines };
      const discovery = { ...analysis.discovery, candidates: [candidate, ...analysis.discovery.candidates] };
      await saveDiscovery(analysis.id, discovery);
      return c.json(discovery, 201);
    })
    // Retry whichever stage failed; the stage's inputs (scan, selection) are kept.
    .post("/:aid/retry", async (c) => {
      const clinic = await getClinic(c.req.param("id")!, c.get("userId"), c.get("orgId"));
      if (!clinic) return c.json({ error: "not found" }, 404);
      if (!canManage(c.var, clinic)) return c.json(OWNER_ONLY, 403);
      const analysis = await getAnalysis(c.req.param("aid"));
      if (!analysis || analysis.clinicId !== clinic.id) return c.json({ error: "not found" }, 404);
      if (analysis.status !== "failed") return c.json({ error: "only a failed analysis can be retried" }, 409);
      const moved = await transition(analysis.id, "failed", { status: "queued", stage: analysis.stage, error: "" });
      if (!moved) return c.json({ error: "analysis changed, reload" }, 409);
      const runner = { quick_scan: run.quickScan, discovery: run.discovery, deep: run.deep }[analysis.stage];
      void runner(analysis.id, deps);
      return c.json(moved, 202);
    })
    // The owner (or front desk) tracks an action: to do -> in progress -> done.
    .patch("/:aid/recommendations/:rid", async (c) => {
      const clinic = await getClinic(c.req.param("id")!, c.get("userId"), c.get("orgId"));
      if (!clinic) return c.json({ error: "not found" }, 404);
      const analysis = await getAnalysis(c.req.param("aid"));
      if (!analysis || analysis.clinicId !== clinic.id) return c.json({ error: "not found" }, 404);
      const body = StatusBody.safeParse(await c.req.json().catch(() => null));
      if (!body.success) return c.json({ error: "status must be todo, in_progress or done" }, 400);
      if (!analysis.report) return c.json({ error: "this analysis has no report yet" }, 409);
      const report = await setRecommendationStatus(analysis.id, c.req.param("rid"), body.data.status);
      if (!report) return c.json({ error: "not found" }, 404);
      return c.json(findRecommendation(report, c.req.param("rid")));
    });
}
