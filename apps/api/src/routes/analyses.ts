import { Hono } from "hono";
import { z } from "zod";
import { getClinic, updateClinic } from "../db/clinics.js";
import { createAnalysis, getAnalysis, listAnalyses, transition } from "../db/analyses.js";
import type { AuthVariables } from "../middleware/auth.js";
import type { PipelineDeps } from "../pipeline/deps.js";
import { startQuickScan } from "../pipeline/runner.js";

const ServicesBody = z.object({ services: z.array(z.string().min(1)).min(1).max(12) });

/** Routes under /clinics/:id/analyses. `deps` is injected so tests can use fakes. */
export function analysesRoutes(deps: PipelineDeps, run: typeof startQuickScan = startQuickScan) {
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
      const analysis = await createAnalysis(clinic.id);
      void run(analysis.id, deps);
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
      return c.json(moved);
    })
    .post("/:aid/retry", async (c) => {
      const clinic = await getClinic(c.req.param("id")!, c.get("userId"));
      if (!clinic) return c.json({ error: "not found" }, 404);
      const analysis = await getAnalysis(c.req.param("aid"));
      if (!analysis || analysis.clinicId !== clinic.id) return c.json({ error: "not found" }, 404);
      if (analysis.status !== "failed" || analysis.stage !== "quick_scan") return c.json({ error: "only a failed quick scan can be retried here" }, 409);
      const moved = await transition(analysis.id, "failed", { status: "queued", stage: "quick_scan", error: "" });
      if (!moved) return c.json({ error: "analysis changed, reload" }, 409);
      void run(analysis.id, deps);
      return c.json(moved, 202);
    });
}
