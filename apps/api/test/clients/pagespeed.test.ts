import { describe, expect, it, vi } from "vitest";
import { parsePageSpeed, runPageSpeed } from "../../src/clients/pagespeed.js";

const payload = { lighthouseResult: { categories: { performance: { score: 0.414 } }, audits: { "largest-contentful-paint": { numericValue: 4812.4 }, "cumulative-layout-shift": { numericValue: 0.2104 }, "interaction-to-next-paint": { numericValue: 350 } } } };

describe("pagespeed", () => {
  it("parses the four numbers and tolerates missing audits", () => {
    expect(parsePageSpeed(payload)).toEqual({ performanceScore: 41, lcpMs: 4812.4, cls: 0.21, inpMs: 350 });
    expect(parsePageSpeed({ lighthouseResult: { categories: { performance: { score: 0.9 } } } })).toEqual({ performanceScore: 90, lcpMs: null, cls: null, inpMs: null });
    expect(parsePageSpeed({})).toBeNull();
  });
  it("skips without a key, calls the API with the key, and returns null on failure", async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify(payload), { headers: { "content-type": "application/json" } }));
    expect(await runPageSpeed("https://clinic.example/", "mobile", undefined, fetchImpl as unknown as typeof fetch)).toBeNull();
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(await runPageSpeed("https://clinic.example/", "mobile", "k", fetchImpl as unknown as typeof fetch)).toMatchObject({ performanceScore: 41 });
    expect(String(fetchImpl.mock.calls[0][0])).toContain("strategy=mobile");
    const failing = vi.fn(async () => { throw new Error("timeout"); });
    expect(await runPageSpeed("https://clinic.example/", "desktop", "k", failing as unknown as typeof fetch)).toBeNull();
    const denied = vi.fn(async () => new Response("no", { status: 403 }));
    expect(await runPageSpeed("https://clinic.example/", "desktop", "k", denied as unknown as typeof fetch)).toBeNull();
  });
});
