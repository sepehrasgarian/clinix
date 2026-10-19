import { beforeEach, describe, expect, it } from "vitest";
import { resetDbForTests } from "../../src/db/connection.js";
import { createClinic } from "../../src/db/clinics.js";
import { createAnalysis, getAnalysis, latestSucceeded, listAnalyses, phasesFor, saveReport, setPhase, transition } from "../../src/db/analyses.js";
import { fixtureReport } from "@clinix/contracts/fixtures";

const clinicInput = { name: "Test Dental", address: "1 Main St", city: "Toronto", province: "ON", disciplines: ["dentistry" as const], services: [] };

describe("analysis repository", () => {
  beforeEach(async () => {
    await resetDbForTests();
  });

  it("creates a queued quick-scan analysis with pending phases", async () => {
    const clinic = await createClinic(clinicInput, "user_1");
    const a = await createAnalysis(clinic.id);
    expect(a.stage).toBe("quick_scan");
    expect(a.status).toBe("queued");
    expect(a.phases.map((p) => p.phase)).toEqual(["validate", "enrich", "understand"]);
    expect((await getAnalysis(a.id))?.id).toBe(a.id);
  });

  it("transition succeeds only when the current status matches (compare-and-set)", async () => {
    const clinic = await createClinic(clinicInput, "user_1");
    const a = await createAnalysis(clinic.id);
    const first = await transition(a.id, "queued", { status: "running" });
    expect(first?.status).toBe("running");
    const second = await transition(a.id, "queued", { status: "running" });
    expect(second).toBeNull();
  });

  it("moving to a new stage resets the phase list", async () => {
    const clinic = await createClinic(clinicInput, "user_1");
    const a = await createAnalysis(clinic.id);
    const moved = await transition(a.id, "queued", { status: "queued", stage: "discovery" });
    expect(moved?.phases).toEqual(phasesFor("discovery"));
  });

  it("records phase progress", async () => {
    const clinic = await createClinic(clinicInput, "user_1");
    const a = await createAnalysis(clinic.id);
    await setPhase(a.id, "enrich", { status: "failed", error: "Google returned nothing" });
    const after = await getAnalysis(a.id);
    expect(after?.phases.find((p) => p.phase === "enrich")).toMatchObject({ status: "failed", error: "Google returned nothing" });
    expect(after?.phases.find((p) => p.phase === "validate")?.status).toBe("pending");
  });

  it("returns the latest succeeded analysis with a report, excluding the current one", async () => {
    const clinic = await createClinic(clinicInput, "user_1");
    const older = await createAnalysis(clinic.id);
    await saveReport(older.id, { ...fixtureReport, analysisId: older.id, clinicId: clinic.id });
    await transition(older.id, "queued", { status: "succeeded" });
    const current = await createAnalysis(clinic.id);
    expect((await latestSucceeded(clinic.id, current.id))?.id).toBe(older.id);
    expect(await latestSucceeded(clinic.id, older.id)).toBeNull();
    expect((await listAnalyses(clinic.id)).length).toBe(2);
  });

  it("returns null for an unknown analysis", async () => {
    expect(await getAnalysis("analysis_nope")).toBeNull();
  });
});
