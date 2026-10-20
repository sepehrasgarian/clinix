import { config } from "dotenv";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

// One .env at the repo root is the source of truth; apps/api/.env may override locally.
const here = dirname(fileURLToPath(import.meta.url));
export const repoRoot = resolve(here, "../../..");
config({ path: resolve(repoRoot, ".env") });
config({ path: resolve(here, "../.env"), override: true });

const EnvSchema = z.object({
  ANTHROPIC_API_KEY: z.string().min(1).optional(),
  GOOGLE_PLACES_API_KEY: z.string().min(1).optional(),
  APIFY_TOKEN: z.string().min(1).optional(),
  CLERK_SECRET_KEY: z.string().min(1).optional(),
  SURREAL_URL: z.string().min(1).default("surrealkv://./data/clinix"),
  /** Model per tier (see clients/anthropic.ts) and which tier reads reviews. */
  MODEL_STRONG: z.string().min(1).optional(),
  MODEL_FAST: z.string().min(1).optional(),
  MODEL_LIGHT: z.string().min(1).optional(),
  MINING_TIER: z.enum(["strong", "fast", "light"]).default("strong"),
  /** Private discipline guides: a folder on disk, or a private GitHub repo read with a scoped token. */
  DISCIPLINE_PACKS_DIR: z.string().min(1).optional(),
  DISCIPLINE_PACKS_REPO: z.string().regex(/^[\w.-]+\/[\w.-]+$/).optional(),
  GITHUB_TOKEN: z.string().min(1).optional(),
  PORT: z.coerce.number().int().positive().default(8787),
});

export type Env = z.infer<typeof EnvSchema>;

/** Parses a raw environment; exported so tests can feed their own values. */
export function parseEnv(raw: Record<string, string | undefined>): Env {
  // Treat empty strings (unfilled .env lines) as unset.
  const cleaned = Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, v === "" ? undefined : v]));
  return EnvSchema.parse(cleaned);
}

export const env: Env = parseEnv(process.env);

/** Throws a clear message when a feature needs a key that is not configured. */
export function requireEnv<K extends keyof Env>(key: K): NonNullable<Env[K]> {
  const v = env[key];
  if (v === undefined) throw new Error(`${key} is not set. Add it to the .env at the repo root.`);
  return v as NonNullable<Env[K]>;
}
