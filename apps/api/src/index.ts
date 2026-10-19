import "dotenv/config";
import { Hono } from "hono";
import { serve } from "@hono/node-server";

const app = new Hono();

app.get("/health", (c) => c.json({ ok: true, service: "clinix-api" }));

const port = Number(process.env.PORT ?? 8787);
serve({ fetch: app.fetch, port }, () => {
  console.log(`clinix-api listening on http://localhost:${port}`);
});
