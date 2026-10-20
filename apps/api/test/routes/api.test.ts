import { beforeEach, describe, expect, it, vi } from "vitest";
import { createApp } from "../../src/app.js";
import { resetDbForTests } from "../../src/db/connection.js";
import { getAnalysis, saveDiscovery, saveScan, transition } from "../../src/db/analyses.js";
import type { PipelineDeps } from "../../src/pipeline/deps.js";
import { testGuides } from "../helpers.js";
import { fixtureAnalysis } from "@clinix/contracts/fixtures";
import type { Place } from "@clinix/contracts";

const extraPlace: Place = { placeId: "p_added", name: "Added Dental", address: "1 Yonge St", lat: 43.79, lng: -79.41, rating: 4.4, reviewCount: 50, types: ["dentist"], sampleReviews: [] };
const deps = { places: { searchText: vi.fn(async () => [extraPlace]) }, ai: {} } as unknown as PipelineDeps;
const run = { quickScan: vi.fn(async () => {}), discovery: vi.fn(async () => {}), deep: vi.fn(async () => {}) };
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
    run.quickScan.mockClear();
    run.discovery.mockClear();
  });

  it("health needs no auth", async () => {
    expect((await app.request("/health")).status).toBe(200);
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
    expect(run.quickScan).toHaveBeenCalledWith(a.id, deps);
    const second = await app.request(`/api/clinics/${clinic.id}/analyses`, { method: "POST", headers: auth });
    expect(second.status).toBe(200);
    expect(((await second.json()) as { id: string }).id).toBe(a.id);
    expect(run.quickScan).toHaveBeenCalledTimes(1);
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
    expect(ok.status).toBe(202);
    const after = await getAnalysis(a.id);
    expect(after).toMatchObject({ stage: "discovery", status: "queued" });
    expect(run.discovery).toHaveBeenCalledWith(a.id, deps);
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
    expect(run.quickScan).toHaveBeenCalledTimes(2);
  });

  async function awaitingCompetitors() {
    const clinic = await makeClinic();
    const a = (await (await app.request(`/api/clinics/${clinic.id}/analyses`, { method: "POST", headers: auth })).json()) as { id: string };
    await transition(a.id, "queued", { status: "queued", stage: "discovery" });
    await transition(a.id, "queued", { status: "running" });
    await saveDiscovery(a.id, fixtureAnalysis.discovery!);
    await transition(a.id, "running", { status: "awaiting_competitors" });
    return { clinic, a };
  }

  it("confirms competitors: validates the selection and moves to the deep stage", async () => {
    const { clinic, a } = await awaitingCompetitors();
    const bad = await app.request(`/api/clinics/${clinic.id}/analyses/${a.id}/competitors`, { method: "POST", headers: auth, body: JSON.stringify({ placeIds: ["nope"] }) });
    expect(bad.status).toBe(400);
    const ok = await app.request(`/api/clinics/${clinic.id}/analyses/${a.id}/competitors`, { method: "POST", headers: auth, body: JSON.stringify({ placeIds: ["place_yonge_smile", "place_willowdale"] }) });
    expect(ok.status).toBe(202);
    const after = await getAnalysis(a.id);
    expect(after).toMatchObject({ stage: "deep", status: "queued" });
    expect(after?.discovery?.selectedPlaceIds).toEqual(["place_yonge_smile", "place_willowdale"]);
    expect(run.deep).toHaveBeenCalledWith(a.id, deps);
  });

  it("rejects competitor confirmation outside the checkpoint", async () => {
    const clinic = await makeClinic();
    const a = (await (await app.request(`/api/clinics/${clinic.id}/analyses`, { method: "POST", headers: auth })).json()) as { id: string };
    const res = await app.request(`/api/clinics/${clinic.id}/analyses/${a.id}/competitors`, { method: "POST", headers: auth, body: JSON.stringify({ placeIds: ["x"] }) });
    expect(res.status).toBe(409);
  });

  it("lets the owner add a missed competitor by name", async () => {
    const { clinic, a } = await awaitingCompetitors();
    const res = await app.request(`/api/clinics/${clinic.id}/analyses/${a.id}/competitors/add`, { method: "POST", headers: auth, body: JSON.stringify({ query: "Added Dental" }) });
    expect(res.status).toBe(201);
    const body = (await res.json()) as { candidates: { place: { placeId: string }; flag: string }[] };
    expect(body.candidates[0]).toMatchObject({ place: { placeId: "p_added" }, flag: "strong" });
    const again = await app.request(`/api/clinics/${clinic.id}/analyses/${a.id}/competitors/add`, { method: "POST", headers: auth, body: JSON.stringify({ query: "Added Dental" }) });
    expect(again.status).toBe(200);
  });

  it("hides another owner's analysis", async () => {
    const clinic = await makeClinic();
    const a = (await (await app.request(`/api/clinics/${clinic.id}/analyses`, { method: "POST", headers: auth })).json()) as { id: string };
    const res = await app.request(`/api/clinics/${clinic.id}/analyses/${a.id}`, { headers: { "x-user-id": "user_2" } });
    expect(res.status).toBe(404);
  });
});
