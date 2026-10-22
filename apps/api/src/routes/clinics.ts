import { Hono } from "hono";
import { z } from "zod";
import { ClinicInput } from "@clinix/contracts";
import { createClinic, findClinic, getClinic, getClinicById, listClinics, transferClinic, updateClinic } from "../db/clinics.js";
import { listAnalyses } from "../db/analyses.js";
import { GUEST_ID, type AuthVariables } from "../middleware/auth.js";

const ClaimBody = z.object({ guestId: z.string().regex(GUEST_ID) });

export const clinics = new Hono<{ Variables: AuthVariables }>()
  .get("/", async (c) => c.json(await listClinics(c.get("userId"))))
  .post("/", async (c) => {
    const parsed = ClinicInput.safeParse(await c.req.json().catch(() => null));
    if (!parsed.success) return c.json({ error: "invalid clinic", issues: parsed.error.issues }, 400);
    // Setting up the same clinic again (going back and saving, or a second visit) updates it instead of adding a duplicate.
    const existing = await findClinic(c.get("userId"), parsed.data.name, parsed.data.address);
    if (existing) return c.json(await updateClinic(existing.id, parsed.data), 200);
    const clinic = await createClinic(parsed.data, c.get("userId"), c.get("orgId"));
    return c.json(clinic, 201);
  })
  // The owner changed their answers on the first step: the same clinic, new details.
  .patch("/:id", async (c) => {
    const clinic = await getClinic(c.req.param("id"), c.get("userId"));
    if (!clinic) return c.json({ error: "not found" }, 404);
    const parsed = ClinicInput.safeParse(await c.req.json().catch(() => null));
    if (!parsed.success) return c.json({ error: "invalid clinic", issues: parsed.error.issues }, 400);
    return c.json(await updateClinic(clinic.id, parsed.data));
  })
  .get("/:id", async (c) => {
    const clinic = await getClinic(c.req.param("id"), c.get("userId"));
    if (!clinic) return c.json({ error: "not found" }, 404);
    return c.json({ clinic, analyses: await listAnalyses(clinic.id) });
  })
  // A signed-in owner takes over the clinic they set up as a guest.
  .post("/:id/claim", async (c) => {
    if (c.get("isGuest")) return c.json({ error: "sign in to claim a clinic", code: "auth_required" }, 401);
    const body = ClaimBody.safeParse(await c.req.json().catch(() => null));
    if (!body.success) return c.json({ error: "guestId required" }, 400);
    const existing = await getClinicById(c.req.param("id"));
    if (!existing) return c.json({ error: "not found" }, 404);
    if (existing.ownerId === c.get("userId")) return c.json(existing);
    const moved = await transferClinic(existing.id, body.data.guestId, c.get("userId"));
    if (!moved) return c.json({ error: "this clinic belongs to someone else" }, 403);
    return c.json(moved);
  });
