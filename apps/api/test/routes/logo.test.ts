import { describe, expect, it, vi } from "vitest";
import type { Place } from "@clinix/contracts";
import { logoRoutes } from "../../src/routes/logo.js";
import type { PipelineDeps } from "../../src/pipeline/deps.js";

const place = (website?: string): Place => ({ placeId: "ChIJabcdefgh", name: "Rehabital", address: "5800 Boul. Cavendish", lat: 45.46, lng: -73.66, website, types: [], sampleReviews: [] });
const bytes = new Uint8Array(150).buffer;
const depsWith = (p: Place | null) => ({ places: { details: vi.fn(async () => p) } }) as unknown as PipelineDeps;

describe("GET /api/logo/:placeId", () => {
  it("serves the clinic's logo, found from the listing's own website, with safe headers", async () => {
    const fetchLogo = vi.fn(async () => ({ bytes, contentType: "image/png" }));
    const app = logoRoutes(depsWith(place("https://rehabital.ca")), fetchLogo);
    const res = await app.request("/ChIJabcdefgh");
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("image/png");
    expect(res.headers.get("x-content-type-options")).toBe("nosniff");
    expect(res.headers.get("content-security-policy")).toContain("sandbox");
    expect(fetchLogo).toHaveBeenCalledWith("https://rehabital.ca");
  });
  it("remembers the answer, including 'no logo'", async () => {
    const fetchLogo = vi.fn(async () => null);
    const deps = depsWith(place("https://rehabital.ca"));
    const app = logoRoutes(deps, fetchLogo);
    expect((await app.request("/ChIJabcdefgh")).status).toBe(404);
    expect((await app.request("/ChIJabcdefgh")).status).toBe(404);
    expect(fetchLogo).toHaveBeenCalledOnce();
  });
  it("answers 404 for a listing without a website or that cannot be found, and 400 for a bad id", async () => {
    expect((await logoRoutes(depsWith(place(undefined)), vi.fn()).request("/ChIJabcdefgh")).status).toBe(404);
    expect((await logoRoutes(depsWith(null), vi.fn()).request("/ChIJabcdefgh")).status).toBe(404);
    expect((await logoRoutes(depsWith(null), vi.fn()).request("/../etc")).status).toBeGreaterThanOrEqual(400);
    expect((await logoRoutes(depsWith(null), vi.fn()).request("/x")).status).toBe(400);
  });
});

describe("GET /api/logo/site/:domain", () => {
  it("serves the logo of a bare domain and remembers it", async () => {
    const fetchLogo = vi.fn(async () => ({ bytes, contentType: "image/jpeg" }));
    const app = logoRoutes(depsWith(null), fetchLogo);
    expect((await app.request("/site/Rehabital.ca")).status).toBe(200);
    expect((await app.request("/site/rehabital.ca")).status).toBe(200);
    expect(fetchLogo).toHaveBeenCalledOnce();
    expect(fetchLogo).toHaveBeenCalledWith("https://rehabital.ca");
  });
  it("refuses anything that is not a bare domain, so the server is never pointed somewhere else", async () => {
    const fetchLogo = vi.fn();
    const app = logoRoutes(depsWith(null), fetchLogo);
    for (const bad of ["localhost", "10.0.0.1", "a.b%2F..%2Fx", "x.ca:8080", "user@x.ca"]) expect((await app.request(`/site/${bad}`)).status).toBe(400);
    expect(fetchLogo).not.toHaveBeenCalled();
  });
  it("answers 404 when the site has no logo", async () => {
    expect((await logoRoutes(depsWith(null), vi.fn(async () => null)).request("/site/clinic.ca")).status).toBe(404);
  });
});
