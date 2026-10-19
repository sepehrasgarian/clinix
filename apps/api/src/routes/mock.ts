import { Hono } from "hono";
import { fixtureAnalysis, fixtureChat, fixtureClinic, fixtureReport } from "@clinix/contracts/fixtures";

/** Fixture data for the web app while the pipeline is being built. No auth, read-only. */
export const mock = new Hono()
  .get("/clinics", (c) => c.json([fixtureClinic]))
  .get("/clinics/:id", (c) => c.json({ clinic: fixtureClinic, analyses: [fixtureAnalysis] }))
  .get("/clinics/:id/analyses/:aid", (c) => c.json(fixtureAnalysis))
  .get("/clinics/:id/report", (c) => c.json(fixtureReport))
  .get("/clinics/:id/chat", (c) => c.json(fixtureChat));
