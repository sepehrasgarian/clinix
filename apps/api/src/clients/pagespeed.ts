import type { PageSpeed } from "@clinix/contracts";
import { log } from "../lib/log.js";

/**
 * Google PageSpeed Insights: Lighthouse scores for one URL. Optional: without a key the audit
 * simply skips it. One request per strategy, 60 s timeout, any failure is null.
 */
export const PAGESPEED_TIMEOUT_MS = 60_000;
const ENDPOINT = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed";

export type Strategy = "mobile" | "desktop";

type Audit = { numericValue?: number };
type Payload = { lighthouseResult?: { categories?: { performance?: { score?: number } }; audits?: Record<string, Audit> } };

/** Parses a PageSpeed payload into the four numbers the report shows. */
export function parsePageSpeed(payload: Payload): PageSpeed | null {
  const lh = payload.lighthouseResult;
  const score = lh?.categories?.performance?.score;
  if (typeof score !== "number") return null;
  const metric = (id: string) => {
    const v = lh?.audits?.[id]?.numericValue;
    return typeof v === "number" ? Math.round(v * 1000) / 1000 : null;
  };
  return { performanceScore: Math.round(score * 100), lcpMs: metric("largest-contentful-paint"), cls: metric("cumulative-layout-shift"), inpMs: metric("interaction-to-next-paint") };
}

export async function runPageSpeed(url: string, strategy: Strategy, key: string | undefined, fetchImpl: typeof fetch = fetch): Promise<PageSpeed | null> {
  if (!key) return null;
  const t0 = Date.now();
  try {
    const q = new URLSearchParams({ url, strategy, category: "performance", key });
    const res = await fetchImpl(`${ENDPOINT}?${q}`, { signal: AbortSignal.timeout(PAGESPEED_TIMEOUT_MS) });
    if (!res.ok) {
      log.warn({ strategy, status: res.status, ms: Date.now() - t0 }, "pagespeed failed");
      return null;
    }
    const parsed = parsePageSpeed((await res.json()) as Payload);
    log.info({ strategy, score: parsed?.performanceScore ?? null, ms: Date.now() - t0 }, "pagespeed done");
    return parsed;
  } catch (err) {
    log.warn({ strategy, ms: Date.now() - t0, err: err instanceof Error ? { message: err.message } : String(err) }, "pagespeed failed");
    return null;
  }
}
