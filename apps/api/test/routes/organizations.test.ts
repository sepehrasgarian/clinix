import { beforeEach, describe, expect, it, vi } from "vitest";
import { createApp } from "../../src/app.js";
import { resetDbForTests } from "../../src/db/connection.js";
import { createClinic } from "../../src/db/clinics.js";
import { orgFromClaims } from "../../src/middleware/auth.js";
import { canManage } from "../../src/middleware/access.js";
import type { PipelineDeps } from "../../src/pipeline/deps.js";

/**
 * A clinic inside an organization: the owner and an administrator can run analyses; a member
 * (front desk) can read and tick actions only; people outside the organization see nothing.
 */
const deps = { places: {}, ai: {}, reviews: {}, guides: {} } as unknown as PipelineDeps;
const run = { quickScan: vi.fn(async () => undefined), discovery: vi.fn(async () => undefined), deep: vi.fn(async () => undefined) };
const app = createApp({ deps, run });

const json = { "content-type": "application/json" };
const owner = { ...json, "x-user-id": "user_owner", "x-org-id": "org_1" };
const admin = { ...json, "x-user-id": "user_admin", "x-org-id": "org_1", "x-org-role": "admin" };
const frontDesk = { ...json, "x-user-id": "user_desk", "x-org-id": "org_1", "x-org-role": "member" };
const stranger = { ...json, "x-user-id": "user_other", "x-org-id": "org_2", "x-org-role": "admin" };
const input = { name: "Finch East Family Dental", address: "77 Finch Ave E", city: "Toronto", province: "ON", disciplines: ["dentistry" as const], services: ["cleaning"] };

describe("organization roles", () => {
  beforeEach(async () => {
    await resetDbForTests();
    Object.values(run).forEach((f) => f.mockClear());
  });

  it("reads the role from v2 and v1 token claims", () => {
    expect(orgFromClaims({ o: { id: "org_1", rol: "admin" } })).toEqual({ orgId: "org_1", orgRole: "admin" });
    expect(orgFromClaims({ org_id: "org_1", org_role: "org:member" })).toEqual({ orgId: "org_1", orgRole: "member" });
    expect(orgFromClaims({ sub: "user_1" })).toEqual({});
  });

  it("lets the owner and an administrator manage, a member read, and hides the clinic from other organizations", async () => {
    const clinic = await createClinic(input, "user_owner", "org_1");
    expect(canManage({ userId: "user_owner" }, clinic)).toBe(true);
    expect(canManage({ userId: "user_admin", orgId: "org_1", orgRole: "admin" }, clinic)).toBe(true);
    expect(canManage({ userId: "user_desk", orgId: "org_1", orgRole: "member" }, clinic)).toBe(false);
    expect(canManage({ userId: "user_other", orgId: "org_2", orgRole: "admin" }, clinic)).toBe(false);

    // everyone in the organization sees the clinic in their list and can open it
    for (const who of [owner, admin, frontDesk]) {
      const list = (await (await app.request("/api/clinics", { headers: who })).json()) as { id: string }[];
      expect(list.map((c) => c.id)).toEqual([clinic.id]);
      expect((await app.request(`/api/clinics/${clinic.id}`, { headers: who })).status).toBe(200);
    }
    expect((await (await app.request("/api/clinics", { headers: stranger })).json()) as unknown[]).toEqual([]);
    expect((await app.request(`/api/clinics/${clinic.id}`, { headers: stranger })).status).toBe(404);
    expect((await app.request(`/api/clinics/${clinic.id}/analyses`, { headers: stranger, method: "POST" })).status).toBe(404);

    // starting an analysis: owner and administrator yes, front desk no
    const desk = await app.request(`/api/clinics/${clinic.id}/analyses`, { headers: frontDesk, method: "POST" });
    expect(desk.status).toBe(403);
    expect(((await desk.json()) as { code: string }).code).toBe("owner_required");
    expect(run.quickScan).not.toHaveBeenCalled();
    expect((await app.request(`/api/clinics/${clinic.id}/analyses`, { headers: admin, method: "POST" })).status).toBe(202);
    expect(run.quickScan).toHaveBeenCalledTimes(1);
  });

  it("a front-desk member can tick an action but not retry a run", async () => {
    const clinic = await createClinic(input, "user_owner", "org_1");
    const started = (await (await app.request(`/api/clinics/${clinic.id}/analyses`, { headers: owner, method: "POST" })).json()) as { id: string };
    const retry = await app.request(`/api/clinics/${clinic.id}/analyses/${started.id}/retry`, { headers: frontDesk, method: "POST" });
    expect(retry.status).toBe(403);
    // no report yet, so the tick is refused for the right reason (409), not for access (403)
    const tick = await app.request(`/api/clinics/${clinic.id}/analyses/${started.id}/recommendations/rec_x`, { headers: frontDesk, method: "PATCH", body: JSON.stringify({ status: "done" }) });
    expect(tick.status).toBe(409);
  });

  it("claiming a guest clinic while an organization is active moves it into that organization", async () => {
    const guest = await createClinic(input, "guest_abcdef123456");
    const res = await app.request(`/api/clinics/${guest.id}/claim`, { headers: admin, method: "POST", body: JSON.stringify({ guestId: "guest_abcdef123456" }) });
    expect(res.status).toBe(200);
    expect((await res.json()) as object).toMatchObject({ ownerId: "user_admin", orgId: "org_1" });
    expect((await app.request(`/api/clinics/${guest.id}`, { headers: frontDesk })).status).toBe(200);
  });
});
