import { Hono } from "hono";
import { cors } from "hono/cors";
import type { AuthVariables } from "./middleware/auth.js";
import { requireUser } from "./middleware/auth.js";
import type { PipelineDeps } from "./pipeline/deps.js";
import type { startQuickScan } from "./pipeline/runner.js";
import { analysesRoutes } from "./routes/analyses.js";
import { clinics } from "./routes/clinics.js";
import { health } from "./routes/health.js";
import { mock } from "./routes/mock.js";

export type AppOptions = {
  deps: PipelineDeps;
  clerkSecretKey?: string;
  run?: typeof startQuickScan;
};

/** Builds the Hono app. `index.ts` serves it; tests call `app.request()` directly. */
export function createApp({ deps, clerkSecretKey, run }: AppOptions) {
  const app = new Hono<{ Variables: AuthVariables }>();
  app.use("*", cors());
  app.route("/health", health);
  app.route("/api/mock", mock);

  const api = new Hono<{ Variables: AuthVariables }>();
  api.use("*", requireUser(clerkSecretKey));
  api.route("/clinics", clinics);
  api.route("/clinics/:id/analyses", analysesRoutes(deps, run));
  app.route("/api", api);

  app.onError((err, c) => {
    console.error(err);
    return c.json({ error: "internal error" }, 500);
  });
  return app;
}
