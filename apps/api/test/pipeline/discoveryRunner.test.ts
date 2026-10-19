import { beforeEach, describe, expect, it, vi } from "vitest";
import { resetDbForTests } from "../../src/db/connection.js";
import { createClinic, updateClinic } from "../../src/db/clinics.js";
import { createAnalysis, getAnalysis, transition } from "../../src/db/analyses.js";
import { startDiscovery } from "../../src/pipeline/runner.js";
import type { PipelineDeps } from "../../src/pipeline/deps.js";
import type { Place } from "@clinix/contracts";

const input = { name: "Finch East Family Dental", address: "77 Finch Ave E", city: "Toronto", province: "ON", disciplines: ["dentistry" as const], services: ["cleaning"] };
const peer: Place = { placeId: "p_a", name: "Peer", address: "", lat: 43.785, lng: -79.415, rating: 4.7, reviewCount: 200, types: ["dentist"], sampleReviews: [] };

const deps = (): PipelineDeps => ({
  places: { searchText: vi.fn(async () => [peer]) } as unknown as PipelineDeps["places"],
  ai: { structured: vi.fn(async () => ({ rankings: [{ id: "p_a", relevance: 88, flag: "strong", reason: "ok", disciplines: ["dentistry"] }] })), readWeb: vi.fn() } as unknown as PipelineDeps["ai"],
});

async function queuedDiscovery() {
  const clinic = await createClinic(input, "user_1");
  await updateClinic(clinic.id, { placeId: "p_own", lat: 43.78, lng: -79.415 });
  const a = await createAnalysis(clinic.id);
  await transition(a.id, "queued", { status: "queued", stage: "discovery" });
  return a;
}

describe("startDiscovery", () => {
  beforeEach(async () => {
    await resetDbForTests();
  });

  it("ranks candidates and waits for competitor confirmation", async () => {
    const a = await queuedDiscovery();
    await startDiscovery(a.id, deps());
    const after = await getAnalysis(a.id);
    expect(after?.status).toBe("awaiting_competitors");
    expect(after?.phases).toEqual([expect.objectContaining({ phase: "discover", status: "done" })]);
    expect(after?.discovery?.candidates[0].place.placeId).toBe("p_a");
    expect(after?.discovery?.selectedPlaceIds).toEqual(["p_a"]);
  });

  it("refuses to run a quick-scan stage analysis", async () => {
    const clinic = await createClinic(input, "user_1");
    const a = await createAnalysis(clinic.id);
    const d = deps();
    await startDiscovery(a.id, d);
    expect(d.places.searchText).not.toHaveBeenCalled();
    expect((await getAnalysis(a.id))?.status).toBe("queued");
  });

  it("fails cleanly when the model call breaks", async () => {
    const a = await queuedDiscovery();
    const d = deps();
    (d.ai.structured as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("Anthropic 529 overloaded"));
    await startDiscovery(a.id, d);
    const after = await getAnalysis(a.id);
    expect(after?.status).toBe("failed");
    expect(after?.error).not.toMatch(/anthropic/i);
  });
});
