import { beforeEach, describe, expect, it, vi } from "vitest";
import { resetDbForTests } from "../../src/db/connection.js";
import { createClinic, getClinicById } from "../../src/db/clinics.js";
import { createAnalysis, getAnalysis, transition } from "../../src/db/analyses.js";
import { startQuickScan } from "../../src/pipeline/runner.js";
import type { PipelineDeps } from "../../src/pipeline/deps.js";
import { testGuides } from "../helpers.js";
import type { Place } from "@clinix/contracts";

const input = { name: "Finch East Family Dental", address: "77 Finch Ave E", city: "Toronto", province: "ON", disciplines: ["dentistry" as const], services: [] as string[] };
const own: Place = { placeId: "p_own", name: input.name, address: "", lat: 43.78, lng: -79.415, rating: 4.6, reviewCount: 128, types: ["dentist"], sampleReviews: [] };

const deps = (opts: { failEnrich?: boolean } = {}): PipelineDeps => ({
  places: {
    geocode: vi.fn(async () => (opts.failEnrich ? null : { location: { lat: own.lat, lng: own.lng }, formattedAddress: "" })),
    searchText: vi.fn(async () => [own]),
    details: vi.fn(async () => own),
  } as unknown as PipelineDeps["places"],
  guides: testGuides(),
  ai: { readWeb: vi.fn(), structured: vi.fn() } as unknown as PipelineDeps["ai"],
});

describe("startQuickScan", () => {
  beforeEach(async () => {
    await resetDbForTests();
  });

  it("runs to awaiting_services, records phases and stores the listing on the clinic", async () => {
    const clinic = await createClinic(input, "user_1");
    const a = await createAnalysis(clinic.id);
    await startQuickScan(a.id, deps());
    const after = await getAnalysis(a.id);
    expect(after?.status).toBe("awaiting_services");
    expect(after?.phases.map((p) => p.status)).toEqual(["done", "done", "done"]);
    expect(after?.scan?.place.placeId).toBe("p_own");
    expect((await getClinicById(clinic.id))?.placeId).toBe("p_own");
  });

  it("marks the failing phase and the analysis as failed with an owner-facing message", async () => {
    const clinic = await createClinic(input, "user_1");
    const a = await createAnalysis(clinic.id);
    await startQuickScan(a.id, deps({ failEnrich: true }));
    const after = await getAnalysis(a.id);
    expect(after?.status).toBe("failed");
    expect(after?.phases.find((p) => p.phase === "enrich")?.status).toBe("failed");
    expect(after?.phases.find((p) => p.phase === "understand")?.status).toBe("pending");
    expect(after?.error).toMatch(/address/i);
    expect(after?.error).not.toMatch(/geocod/i);
  });

  it("does nothing when the analysis is not queued (another worker claimed it)", async () => {
    const clinic = await createClinic(input, "user_1");
    const a = await createAnalysis(clinic.id);
    await transition(a.id, "queued", { status: "running" });
    const d = deps();
    await startQuickScan(a.id, d);
    expect(d.places.geocode).not.toHaveBeenCalled();
    expect((await getAnalysis(a.id))?.status).toBe("running");
  });
});
