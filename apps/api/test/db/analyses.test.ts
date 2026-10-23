import { beforeEach, describe, expect, it } from "vitest";
import { resetDbForTests } from "../../src/db/connection.js";
import { createClinic } from "../../src/db/clinics.js";
import { createAnalysis, createAnalysisFromScan, getAnalysis, latestSucceeded, listAnalyses, phasesFor, reusableScan, saveReport, setPhase, transition } from "../../src/db/analyses.js";
import { getDb } from "../../src/db/connection.js";
import { rid } from "../../src/db/records.js";
import { fixtureAnalysis, fixtureReport } from "@clinix/contracts/fixtures";

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

describe("reusableScan", () => {
  const listing = { placeId: "place_own", website: "https://www.finchfamilydental.example" };
  const scan = fixtureAnalysis.scan!;
  const daysAgo = (n: number) => new Date(Date.now() - n * 24 * 3600 * 1000).toISOString();
  /** A finished scan of `placeId` for `clinicId`, back-dated by `ageDays`. */
  const scannedAt = async (clinicId: string, ageDays: number) => {
    const a = await createAnalysis(clinicId);
    const db = await getDb();
    await db.update(rid("analysis", a.id)).merge({ scan, createdAt: daysAgo(ageDays) });
    return a.id;
  };

  beforeEach(async () => {
    await resetDbForTests();
  });

  it("copies the clinic's own scan from the last 30 days, and remembers where it came from", async () => {
    const mine = await createClinic({ ...clinicInput, ...listing }, "user_1");
    const id = await scannedAt(mine.id, 10);
    const found = await reusableScan(mine);
    expect(found?.reusedFrom).toBe(id);
    const copy = await createAnalysisFromScan(mine.id, found!);
    expect(copy.reusedFrom).toBe(id);
    expect(copy.status).toBe("awaiting_services");
  });

  it("copies another account's scan of the same listing within 183 days when the website matches", async () => {
    const theirs = await createClinic({ ...clinicInput, ...listing }, "user_other");
    const id = await scannedAt(theirs.id, 100);
    const mine = await createClinic({ ...clinicInput, ...listing }, "user_1");
    expect((await reusableScan(mine))?.reusedFrom).toBe(id);
  });

  it("does not reuse a scan older than 183 days, of a different website, or of a clinic without a listing", async () => {
    const theirs = await createClinic({ ...clinicInput, ...listing }, "user_other");
    await scannedAt(theirs.id, 200);
    const mine = await createClinic({ ...clinicInput, ...listing }, "user_1");
    expect(await reusableScan(mine)).toBeNull();

    await scannedAt(theirs.id, 50);
    const otherSite = await createClinic({ ...clinicInput, placeId: "place_own", website: "https://new-owner-dental.example" }, "user_1");
    expect(await reusableScan(otherSite)).toBeNull();
    const noListing = await createClinic(clinicInput, "user_1");
    expect(await reusableScan(noListing)).toBeNull();
  });

  it("ignores the clinic's own scan once it is older than 30 days", async () => {
    const mine = await createClinic(clinicInput, "user_1");
    await scannedAt(mine.id, 45);
    expect(await reusableScan(mine)).toBeNull();
  });
});
