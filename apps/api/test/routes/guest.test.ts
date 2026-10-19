import { beforeEach, describe, expect, it, vi } from "vitest";
import { createApp } from "../../src/app.js";
import { resetDbForTests } from "../../src/db/connection.js";
import { getAnalysis, saveDiscovery, saveScan, transition } from "../../src/db/analyses.js";
import type { PipelineDeps } from "../../src/pipeline/deps.js";
import { fixtureAnalysis } from "@clinix/contracts/fixtures";

const deps = { places: {}, ai: {} } as unknown as PipelineDeps;
const run = { quickScan: vi.fn(async () => {}), discovery: vi.fn(async () => {}) };
const app = createApp({ deps, run });
const GUEST = "guest_abcdef123456";
const guest = { "x-guest-id": GUEST, "content-type": "application/json" };
const user = { "x-user-id": "user_1", "content-type": "application/json" };
const other = { "x-user-id": "user_2", "content-type": "application/json" };
const clinicBody = { name: "Finch East Family Dental", address: "77 Finch Ave E", city: "Toronto", disciplines: ["dentistry"], services: ["cleaning"] };

async function guestClinicAwaitingCompetitors() {
  const clinic = (await (await app.request("/api/clinics", { method: "POST", headers: guest, body: JSON.stringify(clinicBody) })).json()) as { id: string };
  const a = (await (await app.request(`/api/clinics/${clinic.id}/analyses`, { method: "POST", headers: guest })).json()) as { id: string };
  await transition(a.id, "queued", { status: "queued", stage: "discovery" });
  await transition(a.id, "queued", { status: "running" });
  await saveDiscovery(a.id, fixtureAnalysis.discovery!);
  await transition(a.id, "running", { status: "awaiting_competitors" });
  return { clinic, a };
}

describe("free first look as a guest, then claim", () => {
  beforeEach(async () => {
    await resetDbForTests();
    run.quickScan.mockClear();
  });

  it("a guest can create a clinic and start the quick scan", async () => {
    const res = await app.request("/api/clinics", { method: "POST", headers: guest, body: JSON.stringify(clinicBody) });
    expect(res.status).toBe(201);
    const clinic = (await res.json()) as { id: string; ownerId: string };
    expect(clinic.ownerId).toBe(GUEST);
    const started = await app.request(`/api/clinics/${clinic.id}/analyses`, { method: "POST", headers: guest });
    expect(started.status).toBe(202);
    expect(run.quickScan).toHaveBeenCalledOnce();
  });

  it("a guest cannot confirm competitors; the response asks for an account", async () => {
    const { clinic, a } = await guestClinicAwaitingCompetitors();
    const res = await app.request(`/api/clinics/${clinic.id}/analyses/${a.id}/competitors`, { method: "POST", headers: guest, body: JSON.stringify({ placeIds: ["place_yonge_smile"] }) });
    expect(res.status).toBe(401);
    expect(await res.json()).toMatchObject({ code: "auth_required" });
  });

  it("the right user can claim the guest's clinic and then continue; others cannot", async () => {
    const { clinic, a } = await guestClinicAwaitingCompetitors();
    const wrong = await app.request(`/api/clinics/${clinic.id}/claim`, { method: "POST", headers: other, body: JSON.stringify({ guestId: "guest_zzzzzz999999" }) });
    expect(wrong.status).toBe(403);
    const asGuest = await app.request(`/api/clinics/${clinic.id}/claim`, { method: "POST", headers: guest, body: JSON.stringify({ guestId: GUEST }) });
    expect(asGuest.status).toBe(401);

    const ok = await app.request(`/api/clinics/${clinic.id}/claim`, { method: "POST", headers: user, body: JSON.stringify({ guestId: GUEST }) });
    expect(ok.status).toBe(200);
    expect(((await ok.json()) as { ownerId: string }).ownerId).toBe("user_1");
    expect((await app.request(`/api/clinics/${clinic.id}`, { headers: guest })).status).toBe(404);

    const confirmed = await app.request(`/api/clinics/${clinic.id}/analyses/${a.id}/competitors`, { method: "POST", headers: user, body: JSON.stringify({ placeIds: ["place_yonge_smile"] }) });
    expect(confirmed.status).toBe(202);
    expect((await getAnalysis(a.id))?.stage).toBe("deep");
  });

  it("claiming your own clinic again is a no-op", async () => {
    const clinic = (await (await app.request("/api/clinics", { method: "POST", headers: user, body: JSON.stringify(clinicBody) })).json()) as { id: string };
    const res = await app.request(`/api/clinics/${clinic.id}/claim`, { method: "POST", headers: user, body: JSON.stringify({ guestId: GUEST }) });
    expect(res.status).toBe(200);
  });

  it("reuses a recent quick scan instead of running a new one", async () => {
    const clinic = (await (await app.request("/api/clinics", { method: "POST", headers: user, body: JSON.stringify(clinicBody) })).json()) as { id: string };
    const first = (await (await app.request(`/api/clinics/${clinic.id}/analyses`, { method: "POST", headers: user })).json()) as { id: string };
    await transition(first.id, "queued", { status: "running" });
    await saveScan(first.id, fixtureAnalysis.scan!);
    await transition(first.id, "running", { status: "awaiting_services" });
    await transition(first.id, "awaiting_services", { status: "queued", stage: "discovery" });
    await transition(first.id, "queued", { status: "failed", error: "x" });

    const again = await app.request(`/api/clinics/${clinic.id}/analyses`, { method: "POST", headers: user });
    expect(again.status).toBe(201);
    const reused = (await again.json()) as { id: string; status: string; phases: { status: string }[]; scan?: unknown };
    expect(reused.id).not.toBe(first.id);
    expect(reused.status).toBe("awaiting_services");
    expect(reused.phases.every((p) => p.status === "done")).toBe(true);
    expect(reused.scan).toBeDefined();
    expect(run.quickScan).toHaveBeenCalledTimes(1);
  });
});
