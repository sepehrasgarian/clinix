import { resolve } from "node:path";
import { config } from "dotenv";
import type { NextConfig } from "next";

// One .env at the repo root is the source of truth for every app.
config({ path: resolve(process.cwd(), "../../.env") });

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_API_MODE: process.env.NEXT_PUBLIC_API_MODE ?? "mock",
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8787",
  },
  transpilePackages: ["@clinix/contracts"],
  turbopack: {
    rules: {
      "*.css": { loaders: ["@tailwindcss/turbopack"], as: "*.css" },
    },
  },
};

export default nextConfig;
