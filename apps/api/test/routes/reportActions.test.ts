import { beforeEach, describe, expect, it, vi } from "vitest";
import { createApp } from "../../src/app.js";
import { resetDbForTests } from "../../src/db/connection.js";
import { getAnalysis, saveReport, transition } from "../../src/db/analyses.js";
import type { PipelineDeps } from "../../src/pipeline/deps.js";
import { testGuides } from "../helpers.js";
import { fixtureReport } from "@clinix/contracts/fixtures";

const deps = { places: {}, ai: {} } as unknown as PipelineDeps;
const run = { quickScan: vi.fn(async () => {}), discovery: vi.fn(async () => {}), deep: vi.fn(async () => {}) };
const app = createApp({ deps, run });
const auth = { "x-user-id": "user_1", "content-type": "application/json" };
const clinicBody = { name: "Finch East Family Dental", address: "77 Finch Ave E", city: "Toronto", disciplines: ["dentistry"], services: ["cleaning"] };

async function clinicWithAnalysis() {
  const clinic = (await (await app.request("/api/clinics", { method: "POST", headers: auth, body: JSON.stringify(clinicBody) })).json()) as { id: string };
  const a = (await (await app.request(`/api/clinics/${clinic.id}/analyses`, { method: "POST", headers: auth })).json()) as { id: string };
  return { clinic, a };
}

describe("recommendation status", () => {
  beforeEach(async () => {
    await resetDbForTests();
    Object.values(run).forEach((f) => f.mockClear());
  });

  it("moves an action to in_progress and done, and rejects unknown ids and bad statuses", async () => {
    const { clinic, a } = await clinicWithAnalysis();
    const noReport = await app.request(`/api/clinics/${clinic.id}/analyses/${a.id}/recommendations/rec_wait`, { method: "PATCH", headers: auth, body: JSON.stringify({ status: "done" }) });
    expect(noReport.status).toBe(409);

    await saveReport(a.id, { ...fixtureReport, analysisId: a.id, clinicId: clinic.id });
    const ok = await app.request(`/api/clinics/${clinic.id}/analyses/${a.id}/recommendations/rec_saturday`, { method: "PATCH", headers: auth, body: JSON.stringify({ status: "in_progress" }) });
    expect(ok.status).toBe(200);
    expect(((await ok.json()) as { status: string }).status).toBe("in_progress");
    expect((await getAnalysis(a.id))?.report?.recommendations.find((r) => r.id === "rec_saturday")?.status).toBe("in_progress");

    // an action inside a discipline section is tracked the same way
    const disc = await app.request(`/api/clinics/${clinic.id}/analyses/${a.id}/recommendations/rec_d_sat`, { method: "PATCH", headers: auth, body: JSON.stringify({ status: "done" }) });
    expect(disc.status).toBe(200);
    expect(((await disc.json()) as { id: string; status: string })).toMatchObject({ id: "rec_d_sat", status: "done" });
    expect((await getAnalysis(a.id))?.report?.disciplines[0].recommendations.find((r) => r.id === "rec_d_sat")?.status).toBe("done");

    expect((await app.request(`/api/clinics/${clinic.id}/analyses/${a.id}/recommendations/rec_nope`, { method: "PATCH", headers: auth, body: JSON.stringify({ status: "done" }) })).status).toBe(404);
    expect((await app.request(`/api/clinics/${clinic.id}/analyses/${a.id}/recommendations/rec_saturday`, { method: "PATCH", headers: auth, body: JSON.stringify({ status: "later" }) })).status).toBe(400);
    expect((await app.request(`/api/clinics/${clinic.id}/analyses/${a.id}/recommendations/rec_saturday`, { method: "PATCH", headers: { "x-user-id": "user_2", "content-type": "application/json" }, body: JSON.stringify({ status: "done" }) })).status).toBe(404);
  });
});

describe("retry any failed stage", () => {
  beforeEach(async () => {
    await resetDbForTests();
    Object.values(run).forEach((f) => f.mockClear());
  });

  it("re-queues the failed stage and starts its runner", async () => {
    const { clinic, a } = await clinicWithAnalysis();
    await transition(a.id, "queued", { status: "queued", stage: "deep" });
    await transition(a.id, "queued", { status: "failed", error: "boom" });
    const res = await app.request(`/api/clinics/${clinic.id}/analyses/${a.id}/retry`, { method: "POST", headers: auth });
    expect(res.status).toBe(202);
    expect((await getAnalysis(a.id))).toMatchObject({ stage: "deep", status: "queued" });
    expect(run.deep).toHaveBeenCalledWith(a.id, deps);
    expect(run.quickScan).toHaveBeenCalledTimes(1); // only the original start
  });

  it("refuses to retry an analysis that is not failed", async () => {
    const { clinic, a } = await clinicWithAnalysis();
    expect((await app.request(`/api/clinics/${clinic.id}/analyses/${a.id}/retry`, { method: "POST", headers: auth })).status).toBe(409);
  });
});
