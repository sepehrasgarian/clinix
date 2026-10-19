import { env } from "./env.js";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { serve } from "@hono/node-server";
import { RecordId } from "surrealdb";
import { z } from "zod";
import * as db from "./db.js";
import { analyzeClinic, chat } from "./agent.js";
import { requireUser } from "./auth.js";

type Env = { Variables: { userId: string } };

// SurrealDB RecordIds serialize as `clinic:⟨abc⟩`; the app only needs `abc`.
const plain = (v: unknown): unknown => {
  if (v instanceof RecordId) return String(v.id);
  if (Array.isArray(v)) return v.map(plain);
  if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, plain(x)]));
  return v;
};
const app = new Hono<Env>();
app.use("*", cors());

app.get("/health", (c) => c.json({ ok: true, service: "clinix-api" }));

const ClinicInput = z.object({
  name: z.string().min(1),
  type: z.string().min(1),
  address: z.string().min(1),
  city: z.string().min(1),
  services: z.array(z.string()).default([]),
  prices: z.record(z.string(), z.string()).optional(),
  website: z.string().optional(),
  notes: z.string().optional(),
});

const api = new Hono<Env>();
api.use("*", requireUser);

api.get("/clinics", async (c) => c.json(plain(await db.listClinics(c.get("userId")))));

api.post("/clinics", async (c) => {
  const parsed = ClinicInput.safeParse(await c.req.json());
  if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 400);
  const clinic = await db.createClinic({ ...parsed.data, owner_id: c.get("userId") });
  return c.json(plain(clinic), 201);
});

api.get("/clinics/:id", async (c) => {
  const clinic = await db.getClinic(c.req.param("id"), c.get("userId"));
  if (!clinic) return c.json({ error: "not found" }, 404);
  const competitors = await db.listCompetitors(clinic.id!);
  const consultations = await db.listConsultations(clinic.id!);
  return c.json(plain({ clinic, competitors, consultations }));
});

// Runs the Claude research agent. Takes 1-3 minutes; the mobile app polls GET /clinics/:id after.
api.post("/clinics/:id/analyze", async (c) => {
  const clinic = await db.getClinic(c.req.param("id"), c.get("userId"));
  if (!clinic) return c.json({ error: "not found" }, 404);
  const { report, data } = await analyzeClinic(clinic);
  const { competitors, ...rest } = data;
  await db.replaceCompetitors(
    clinic.id!,
    competitors.map((k) => ({
      name: k.name,
      address: k.address ?? undefined,
      website: k.website ?? undefined,
      rating: k.rating ?? undefined,
      review_count: k.review_count ?? undefined,
      services: k.services,
      price_notes: k.price_notes ?? undefined,
      hours: k.hours ?? undefined,
      strengths: k.strengths,
      weaknesses: k.weaknesses,
      source_urls: k.source_urls,
    })),
  );
  const consultation = await db.saveConsultation({ clinic: clinic.id!, ...rest, report_markdown: report });
  return c.json(plain({ consultation, competitors: await db.listCompetitors(clinic.id!) }));
});

api.post("/clinics/:id/chat", async (c) => {
  const clinic = await db.getClinic(c.req.param("id"), c.get("userId"));
  if (!clinic) return c.json({ error: "not found" }, 404);
  const body = z.object({ message: z.string().min(1) }).safeParse(await c.req.json());
  if (!body.success) return c.json({ error: "message required" }, 400);

  const [competitors, consultations, history] = await Promise.all([
    db.listCompetitors(clinic.id!),
    db.listConsultations(clinic.id!),
    db.recentMemory(clinic.id!),
  ]);
  const answer = await chat(clinic, competitors, consultations[0]?.report_markdown ?? null, history, body.data.message);
  await db.appendMemory(clinic.id!, "user", body.data.message);
  await db.appendMemory(clinic.id!, "assistant", answer);
  return c.json({ answer });
});

app.route("/api", api);

serve({ fetch: app.fetch, port: env.PORT }, () => {
  console.log(`clinix-api listening on http://localhost:${env.PORT}`);
});

