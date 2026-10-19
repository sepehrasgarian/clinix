import { beforeEach, describe, expect, it, vi } from "vitest";
import { createApp } from "../../src/app.js";
import { resetDbForTests } from "../../src/db/connection.js";
import { getAnalysis, saveScan, transition } from "../../src/db/analyses.js";
import type { PipelineDeps } from "../../src/pipeline/deps.js";
import { fixtureAnalysis } from "@clinix/contracts/fixtures";

const deps = { places: {}, ai: {} } as unknown as PipelineDeps;
const run = vi.fn(async () => {});
const app = createApp({ deps, run });
const auth = { "x-user-id": "user_1", "content-type": "application/json" };
const clinicBody = { name: "Finch East Family Dental", address: "77 Finch Ave E", city: "Toronto", disciplines: ["dentistry"], services: ["cleaning"] };

async function makeClinic() {
  const res = await app.request("/api/clinics", { method: "POST", headers: auth, body: JSON.stringify(clinicBody) });
  return (await res.json()) as { id: string };
}

describe("API routes", () => {
  beforeEach(async () => {
    await resetDbForTests();
    run.mockClear();
  });

  it("health and mock endpoints need no auth", async () => {
    expect((await app.request("/health")).status).toBe(200);
    const report = await (await app.request("/api/mock/clinics/x/report")).json();
    expect(report).toMatchObject({ analysisId: fixtureAnalysis.id });
  });

  it("rejects unauthenticated requests", async () => {
    expect((await app.request("/api/clinics")).status).toBe(401);
  });

  it("creates, lists and reads a clinic for its owner only", async () => {
    const created = await makeClinic();
    expect(created.id).toMatch(/^clinic_/);
    const list = await (await app.request("/api/clinics", { headers: auth })).json();
    expect(list).toHaveLength(1);
    const other = await app.request(`/api/clinics/${created.id}`, { headers: { "x-user-id": "user_2" } });
    expect(other.status).toBe(404);
  });

  it("rejects an invalid clinic body", async () => {
    const res = await app.request("/api/clinics", { method: "POST", headers: auth, body: JSON.stringify({ name: "x" }) });
    expect(res.status).toBe(400);
  });

  it("starts a quick scan once and returns the in-flight one on a second click", async () => {
    const clinic = await makeClinic();
    const first = await app.request(`/api/clinics/${clinic.id}/analyses`, { method: "POST", headers: auth });
    expect(first.status).toBe(202);
    const a = (await first.json()) as { id: string };
    expect(run).toHaveBeenCalledWith(a.id, deps);
    const second = await app.request(`/api/clinics/${clinic.id}/analyses`, { method: "POST", headers: auth });
    expect(second.status).toBe(200);
    expect(((await second.json()) as { id: string }).id).toBe(a.id);
    expect(run).toHaveBeenCalledTimes(1);
  });

  it("confirms services only at the awaiting_services checkpoint and moves to discovery", async () => {
    const clinic = await makeClinic();
    const a = (await (await app.request(`/api/clinics/${clinic.id}/analyses`, { method: "POST", headers: auth })).json()) as { id: string };
    const early = await app.request(`/api/clinics/${clinic.id}/analyses/${a.id}/services`, { method: "POST", headers: auth, body: JSON.stringify({ services: ["cleaning"] }) });
    expect(early.status).toBe(409);

    await transition(a.id, "queued", { status: "running" });
    await saveScan(a.id, fixtureAnalysis.scan!);
    await transition(a.id, "running", { status: "awaiting_services" });
    const ok = await app.request(`/api/clinics/${clinic.id}/analyses/${a.id}/services`, { method: "POST", headers: auth, body: JSON.stringify({ services: ["cleaning", "Invisalign"] }) });
    expect(ok.status).toBe(200);
    const after = await getAnalysis(a.id);
    expect(after).toMatchObject({ stage: "discovery", status: "queued" });
    const clinicAfter = await (await app.request(`/api/clinics/${clinic.id}`, { headers: auth })).json() as { clinic: { services: string[] } };
    expect(clinicAfter.clinic.services).toEqual(["cleaning", "Invisalign"]);
  });

  it("retries only a failed quick scan", async () => {
    const clinic = await makeClinic();
    const a = (await (await app.request(`/api/clinics/${clinic.id}/analyses`, { method: "POST", headers: auth })).json()) as { id: string };
    expect((await app.request(`/api/clinics/${clinic.id}/analyses/${a.id}/retry`, { method: "POST", headers: auth })).status).toBe(409);
    await transition(a.id, "queued", { status: "failed", error: "boom" });
    const res = await app.request(`/api/clinics/${clinic.id}/analyses/${a.id}/retry`, { method: "POST", headers: auth });
    expect(res.status).toBe(202);
    expect((await getAnalysis(a.id))?.status).toBe("queued");
    expect(run).toHaveBeenCalledTimes(2);
  });

  it("hides another owner's analysis", async () => {
    const clinic = await makeClinic();
    const a = (await (await app.request(`/api/clinics/${clinic.id}/analyses`, { method: "POST", headers: auth })).json()) as { id: string };
    const res = await app.request(`/api/clinics/${clinic.id}/analyses/${a.id}`, { headers: { "x-user-id": "user_2" } });
    expect(res.status).toBe(404);
  });
});
