import { serve } from "@hono/node-server";
import { createApp } from "./app.js";
import { env } from "./env.js";
import { log } from "./lib/log.js";
import { buildDeps } from "./pipeline/deps.js";
import { recoverInterrupted } from "./pipeline/runner.js";

const app = createApp({ deps: buildDeps(), clerkSecretKey: env.CLERK_SECRET_KEY });

serve({ fetch: app.fetch, port: env.PORT }, async () => {
  log.info({ port: env.PORT, logLevel: env.LOG_LEVEL }, "clinix-api listening");
  const recovered = await recoverInterrupted({ all: true }).catch((err) => {
    log.error({ err: err instanceof Error ? { message: err.message } : String(err) }, "recovery failed");
    return 0;
  });
  if (recovered) log.warn({ recovered }, "interrupted analyses marked for retry");
});
