import { Hono } from "hono";
import { z } from "zod";
import type { CompetitorCandidate } from "@clinix/contracts";
import { getClinic, updateClinic } from "../db/clinics.js";
import { createAnalysis, createAnalysisFromScan, getAnalysis, listAnalyses, reusableScan, saveDiscovery, transition } from "../db/analyses.js";
import type { AuthVariables } from "../middleware/auth.js";
import type { PipelineDeps } from "../pipeline/deps.js";
import { validateSelection } from "../pipeline/discover.js";
import { stageRunners, type StageRunners } from "../pipeline/runner.js";
import { distanceKm, ringFor } from "../lib/geo.js";

const ServicesBody = z.object({ services: z.array(z.string().min(1)).min(1).max(12) });
const SelectionBody = z.object({ placeIds: z.array(z.string().min(1)).max(40) });
const AddCompetitorBody = z.object({ query: z.string().min(2).max(120) });

/** Routes under /clinics/:id/analyses. `deps` and `run` are injected so tests can use fakes. */
export function analysesRoutes(deps: PipelineDeps, run: StageRunners = stageRunners) {
  return new Hono<{ Variables: AuthVariables }>()
    .get("/", async (c) => {
      const clinic = await getClinic(c.req.param("id")!, c.get("userId"));
      if (!clinic) return c.json({ error: "not found" }, 404);
      return c.json(await listAnalyses(clinic.id));
    })
    .post("/", async (c) => {
      const clinic = await getClinic(c.req.param("id")!, c.get("userId"));
      if (!clinic) return c.json({ error: "not found" }, 404);
      const inFlight = (await listAnalyses(clinic.id)).find((a) => a.status === "queued" || a.status === "running");
      if (inFlight) return c.json(inFlight, 200);
      const previous = await reusableScan(clinic.id);
      if (previous) return c.json(await createAnalysisFromScan(clinic.id, previous), 201);
      const analysis = await createAnalysis(clinic.id);
      void run.quickScan(analysis.id, deps);
      return c.json(analysis, 202);
    })
    .get("/:aid", async (c) => {
      const clinic = await getClinic(c.req.param("id")!, c.get("userId"));
      if (!clinic) return c.json({ error: "not found" }, 404);
      const analysis = await getAnalysis(c.req.param("aid"));
      if (!analysis || analysis.clinicId !== clinic.id) return c.json({ error: "not found" }, 404);
      return c.json(analysis);
    })
    // Checkpoint 1: the owner confirms the services found by the quick scan.
    .post("/:aid/services", async (c) => {
      const clinic = await getClinic(c.req.param("id")!, c.get("userId"));
      if (!clinic) return c.json({ error: "not found" }, 404);
      const analysis = await getAnalysis(c.req.param("aid"));
      if (!analysis || analysis.clinicId !== clinic.id) return c.json({ error: "not found" }, 404);
      const body = ServicesBody.safeParse(await c.req.json().catch(() => null));
      if (!body.success) return c.json({ error: "services required" }, 400);
      if (analysis.status !== "awaiting_services") return c.json({ error: `analysis is ${analysis.status}, not awaiting_services` }, 409);
      await updateClinic(clinic.id, { services: body.data.services });
      const moved = await transition(analysis.id, "awaiting_services", { status: "queued", stage: "discovery" });
      if (!moved) return c.json({ error: "analysis changed, reload" }, 409);
      void run.discovery(analysis.id, deps);
      return c.json(moved, 202);
    })
    // Checkpoint 2: the owner confirms up to five competitors per discipline. Needs an account.
    .post("/:aid/competitors", async (c) => {
      if (c.get("isGuest")) return c.json({ error: "Create a free account to choose competitors and run the full analysis.", code: "auth_required" }, 401);
      const clinic = await getClinic(c.req.param("id")!, c.get("userId"));
      if (!clinic) return c.json({ error: "not found" }, 404);
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
      return c.json(moved, 202);
    })
    // The owner adds a competitor we missed, by name. It joins the candidate list as "strong".
    .post("/:aid/competitors/add", async (c) => {
      const clinic = await getClinic(c.req.param("id")!, c.get("userId"));
      if (!clinic) return c.json({ error: "not found" }, 404);
      const analysis = await getAnalysis(c.req.param("aid"));
      if (!analysis || analysis.clinicId !== clinic.id) return c.json({ error: "not found" }, 404);
      if (analysis.status !== "awaiting_competitors" || !analysis.discovery) return c.json({ error: "analysis is not awaiting competitors" }, 409);
      const body = AddCompetitorBody.safeParse(await c.req.json().catch(() => null));
      if (!body.success) return c.json({ error: "query required" }, 400);
      const center = { lat: clinic.lat ?? 0, lng: clinic.lng ?? 0 };
      const [place] = await deps.places.searchText(`${body.data.query} ${clinic.city}`, { near: center, radiusM: 15000, max: 1 });
      if (!place) return c.json({ error: "No clinic matched that name nearby." }, 404);
      if (analysis.discovery.candidates.some((k) => k.place.placeId === place.placeId)) return c.json(analysis.discovery);
      const km = distanceKm(center, place);
      const candidate: CompetitorCandidate = { place, distanceKm: Math.round(km * 10) / 10, ring: ringFor(km), relevance: 100, flag: "strong", reason: "Added by the owner.", disciplines: clinic.disciplines };
      const discovery = { ...analysis.discovery, candidates: [candidate, ...analysis.discovery.candidates] };
      await saveDiscovery(analysis.id, discovery);
      return c.json(discovery, 201);
    })
    .post("/:aid/retry", async (c) => {
      const clinic = await getClinic(c.req.param("id")!, c.get("userId"));
      if (!clinic) return c.json({ error: "not found" }, 404);
      const analysis = await getAnalysis(c.req.param("aid"));
      if (!analysis || analysis.clinicId !== clinic.id) return c.json({ error: "not found" }, 404);
      if (analysis.status !== "failed" || analysis.stage !== "quick_scan") return c.json({ error: "only a failed quick scan can be retried here" }, 409);
      const moved = await transition(analysis.id, "failed", { status: "queued", stage: "quick_scan", error: "" });
      if (!moved) return c.json({ error: "analysis changed, reload" }, 409);
      void run.quickScan(analysis.id, deps);
      return c.json(moved, 202);
    });
}
