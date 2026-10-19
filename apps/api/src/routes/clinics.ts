import { Hono } from "hono";
import { ClinicInput } from "@clinix/contracts";
import { createClinic, getClinic, listClinics } from "../db/clinics.js";
import { listAnalyses } from "../db/analyses.js";
import type { AuthVariables } from "../middleware/auth.js";

export const clinics = new Hono<{ Variables: AuthVariables }>()
  .get("/", async (c) => c.json(await listClinics(c.get("userId"))))
  .post("/", async (c) => {
    const parsed = ClinicInput.safeParse(await c.req.json().catch(() => null));
    if (!parsed.success) return c.json({ error: "invalid clinic", issues: parsed.error.issues }, 400);
    const clinic = await createClinic(parsed.data, c.get("userId"), c.get("orgId"));
    return c.json(clinic, 201);
  })
  .get("/:id", async (c) => {
    const clinic = await getClinic(c.req.param("id"), c.get("userId"));
    if (!clinic) return c.json({ error: "not found" }, 404);
    return c.json({ clinic, analyses: await listAnalyses(clinic.id) });
  });
