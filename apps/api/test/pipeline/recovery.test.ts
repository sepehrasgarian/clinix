import { beforeEach, describe, expect, it } from "vitest";
import { resetDbForTests } from "../../src/db/connection.js";
import { createClinic } from "../../src/db/clinics.js";
import { createAnalysis, getAnalysis, setPhase, transition } from "../../src/db/analyses.js";
import { recoverInterrupted } from "../../src/pipeline/runner.js";

const input = { name: "Finch East Family Dental", address: "77 Finch Ave E", city: "Toronto", province: "ON", disciplines: ["dentistry" as const], services: [] as string[] };

describe("recoverInterrupted", () => {
  beforeEach(async () => {
    await resetDbForTests();
  });

  it("on startup, marks every running analysis as failed with a retry message", async () => {
    const clinic = await createClinic(input, "user_1");
    const a = await createAnalysis(clinic.id);
    await transition(a.id, "queued", { status: "running" });
    await setPhase(a.id, "enrich", { status: "running", startedAt: new Date().toISOString() });
    const b = await createAnalysis(clinic.id);
    expect(await recoverInterrupted({ all: true })).toBe(1);
    const after = await getAnalysis(a.id);
    expect(after).toMatchObject({ status: "failed", error: expect.stringMatching(/interrupted/i) });
    expect(after?.phases.find((p) => p.phase === "enrich")).toMatchObject({ status: "failed", finishedAt: expect.any(String) });
    expect((await getAnalysis(b.id))?.status).toBe("queued");
  });

  it("during normal operation, leaves a fresh running analysis alone", async () => {
    const clinic = await createClinic(input, "user_1");
    const a = await createAnalysis(clinic.id);
    await transition(a.id, "queued", { status: "running" });
    expect(await recoverInterrupted()).toBe(0);
    expect((await getAnalysis(a.id))?.status).toBe("running");
  });
});
