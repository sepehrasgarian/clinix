import { beforeEach, describe, expect, it, vi } from "vitest";
import { fixtureReport } from "@clinix/contracts/fixtures";
import { createApp } from "../../src/app.js";
import { resetDbForTests } from "../../src/db/connection.js";
import { saveReport, transition } from "../../src/db/analyses.js";
import type { PipelineDeps } from "../../src/pipeline/deps.js";
import type { ToolLoopInput } from "../../src/clients/anthropic.js";
import { testGuides } from "../helpers.js";

/** A fake model that reads findings about the owner's clinic, then answers citing the first evidence review. */
const runTools = vi.fn(async ({ tools, run, question, history }: ToolLoopInput) => {
  expect(tools.some((t) => t.name === "answer")).toBe(true);
  const findings = (await run("get_findings", { competitor: null, kind: null, aboutOwnClinic: true })) as { claim: string; evidence: { reviewId: string }[] }[];
  const cite = findings[0].evidence[0].reviewId;
  return { text: `Your most repeated complaint: ${findings[0].claim} (history: ${history.length} turns, asked: ${question})`, citedReviewIds: [cite, "rev_not_in_report"] };
});
const deps = { places: {}, ai: { runTools }, reviews: {}, guides: testGuides() } as unknown as PipelineDeps;
const app = createApp({ deps, run: { quickScan: vi.fn(), discovery: vi.fn(), deep: vi.fn() } });
const auth = { "x-user-id": "user_1", "content-type": "application/json" };
const guest = { "x-guest-id": "guest_abcdef123456", "content-type": "application/json" };
const clinicBody = { name: "Finch East Family Dental", address: "77 Finch Ave E", city: "Toronto", disciplines: ["dentistry"], services: [] };

async function clinicWithReport() {
  const clinic = (await (await app.request("/api/clinics", { method: "POST", headers: auth, body: JSON.stringify(clinicBody) })).json()) as { id: string };
  const a = (await (await app.request(`/api/clinics/${clinic.id}/analyses`, { method: "POST", headers: auth })).json()) as { id: string };
  await transition(a.id, "queued", { status: "running" });
  await saveReport(a.id, { ...fixtureReport, analysisId: a.id, clinicId: clinic.id });
  await transition(a.id, "running", { status: "succeeded" });
  return clinic;
}

describe("chat routes", () => {
  beforeEach(async () => {
    await resetDbForTests();
    runTools.mockClear();
  });

  it("answers from the report, cites only reviews that exist, and keeps the conversation", async () => {
    const clinic = await clinicWithReport();
    const res = await app.request(`/api/clinics/${clinic.id}/chat`, { method: "POST", headers: auth, body: JSON.stringify({ message: "What do my own patients complain about?" }) });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { answer: { role: string; content: string; citedReviewIds: string[] }; reviews: { id: string }[] };
    expect(body.answer.role).toBe("assistant");
    expect(body.answer.content).toMatch(/waiting past the appointment time/i);
    expect(body.answer.citedReviewIds).toEqual(["rev_own_2"]);
    expect(body.reviews.map((r) => r.id)).toEqual(["rev_own_2"]);

    const second = await app.request(`/api/clinics/${clinic.id}/chat`, { method: "POST", headers: auth, body: JSON.stringify({ message: "And what should I do first?" }) });
    expect(((await second.json()) as { answer: { content: string } }).answer.content).toMatch(/history: 2 turns/);

    const history = (await (await app.request(`/api/clinics/${clinic.id}/chat`, { headers: auth })).json()) as { messages: { role: string }[]; reviews: unknown[] };
    expect(history.messages.map((m) => m.role)).toEqual(["user", "assistant", "user", "assistant"]);
    expect(history.reviews).toHaveLength(1);
  });

  it("refuses guests, validates the message, and waits for a report", async () => {
    const clinic = (await (await app.request("/api/clinics", { method: "POST", headers: auth, body: JSON.stringify(clinicBody) })).json()) as { id: string };
    expect((await app.request(`/api/clinics/${clinic.id}/chat`, { method: "POST", headers: guest, body: JSON.stringify({ message: "hi" }) })).status).toBe(401);
    expect((await app.request(`/api/clinics/${clinic.id}/chat`, { method: "POST", headers: auth, body: JSON.stringify({ message: "" }) })).status).toBe(400);
    const noReport = await app.request(`/api/clinics/${clinic.id}/chat`, { method: "POST", headers: auth, body: JSON.stringify({ message: "hi" }) });
    expect(noReport.status).toBe(409);
    expect(runTools).not.toHaveBeenCalled();
  });

  it("hides another owner's chat", async () => {
    const clinic = await clinicWithReport();
    expect((await app.request(`/api/clinics/${clinic.id}/chat`, { headers: { "x-user-id": "user_2" } })).status).toBe(404);
  });
});
