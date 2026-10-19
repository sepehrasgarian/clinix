import { describe, expect, it, vi } from "vitest";
import type { Place } from "@clinix/contracts";
import { createApp } from "../../src/app.js";
import type { PipelineDeps } from "../../src/pipeline/deps.js";

const dentist: Place = { placeId: "p1", name: "Yonge Finch Dental Centre", address: "5650 Yonge St", lat: 43.78, lng: -79.41, rating: 4.9, reviewCount: 74, types: ["dentist"], photoName: "places/p1/photos/abc", sampleReviews: [] };
const pharmacy: Place = { ...dentist, placeId: "p2", name: "Shoppers", types: ["pharmacy"] };

const deps = {
  places: {
    searchText: vi.fn(async () => [dentist, pharmacy]),
    photo: vi.fn(async (name: string) => (name.endsWith("abc") ? { bytes: new TextEncoder().encode("img").buffer, contentType: "image/jpeg" } : null)),
  },
  ai: {},
} as unknown as PipelineDeps;
const app = createApp({ deps, run: { quickScan: vi.fn(), discovery: vi.fn() } });
const auth = { "x-user-id": "u1" };

describe("lookup routes", () => {
  it("returns matching clinic listings and drops non-clinics", async () => {
    const res = await app.request("/api/lookup/clinic-search?q=yonge%20finch%20dental", { headers: auth });
    expect(res.status).toBe(200);
    const body = (await res.json()) as Place[];
    expect(body.map((p) => p.placeId)).toEqual(["p1"]);
    expect(deps.places.searchText).toHaveBeenCalledWith("yonge finch dental Toronto", { max: 6 });
  });

  it("rejects a too-short query and requires auth", async () => {
    expect((await app.request("/api/lookup/clinic-search?q=a", { headers: auth })).status).toBe(400);
    expect((await app.request("/api/lookup/clinic-search?q=dental")).status).toBe(401);
  });

  it("proxies a photo and validates the resource name", async () => {
    const ok = await app.request("/api/lookup/photo/places/p1/photos/abc", { headers: auth });
    expect(ok.status).toBe(200);
    expect(ok.headers.get("content-type")).toBe("image/jpeg");
    expect((await app.request("/api/lookup/photo/places/p1/photos/missing", { headers: auth })).status).toBe(404);
    expect((await app.request("/api/lookup/photo/places/p1/photos/abc;rm", { headers: auth })).status).toBe(400);
    expect((await app.request("/api/lookup/photo/../../etc/passwd", { headers: auth })).status).not.toBe(200);
    expect(deps.places.photo).not.toHaveBeenCalledWith(expect.stringContaining(".."));
  });
});
