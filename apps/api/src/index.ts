import { serve } from "@hono/node-server";
import { createApp } from "./app.js";
import { env } from "./env.js";
import { buildDeps } from "./pipeline/deps.js";

const app = createApp({ deps: buildDeps(), clerkSecretKey: env.CLERK_SECRET_KEY });

serve({ fetch: app.fetch, port: env.PORT }, () => {
  console.log(`clinix-api listening on http://localhost:${env.PORT}`);
});
