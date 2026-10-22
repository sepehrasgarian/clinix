import { Hono } from "hono";
import { cors } from "hono/cors";
import { log } from "./lib/log.js";
import type { AuthVariables } from "./middleware/auth.js";
import { requireUser } from "./middleware/auth.js";
import type { PipelineDeps } from "./pipeline/deps.js";
import type { StageRunners } from "./pipeline/runner.js";
import { analysesRoutes } from "./routes/analyses.js";
import { chatRoutes } from "./routes/chat.js";
import { clinics } from "./routes/clinics.js";
import { health } from "./routes/health.js";
import { logoRoutes } from "./routes/logo.js";
import { lookupRoutes, photoRoutes } from "./routes/lookup.js";

export type AppOptions = {
  deps: PipelineDeps;
  clerkSecretKey?: string;
  run?: StageRunners;
};

/** Builds the Hono app. `index.ts` serves it; tests call `app.request()` directly. */
export function createApp({ deps, clerkSecretKey, run }: AppOptions) {
  const app = new Hono<{ Variables: AuthVariables }>();
  app.use("*", cors());
  app.use("*", async (c, next) => {
    const started = Date.now();
    await next();
    if (c.req.path !== "/health") log.info({ method: c.req.method, path: c.req.path, status: c.res.status, ms: Date.now() - started }, "request");
  });
  app.route("/health", health);
  app.route("/api/photo", photoRoutes(deps));
  app.route("/api/logo", logoRoutes(deps));

  const api = new Hono<{ Variables: AuthVariables }>();
  api.use("*", requireUser(clerkSecretKey));
  api.route("/clinics", clinics);
  api.route("/clinics/:id/analyses", analysesRoutes(deps, run));
  api.route("/clinics/:id/chat", chatRoutes(deps));
  api.route("/lookup", lookupRoutes(deps));
  app.route("/api", api);

  app.onError((err, c) => {
    log.error({ path: c.req.path, err: { message: err.message, name: err.name } }, "unhandled error");
    return c.json({ error: "internal error" }, 500);
  });
  return app;
}
