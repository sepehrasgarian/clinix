import { describe, expect, it } from "vitest";
import { fixtureClinic } from "@clinix/contracts/fixtures";
import { canManage, OWNER_ONLY } from "../../src/middleware/access.js";

const clinic = { ...fixtureClinic, ownerId: "user_owner", orgId: "org_1" };

describe("canManage", () => {
  it("lets the owner and an administrator of the clinic's organization manage it", () => {
    expect(canManage({ userId: "user_owner" }, clinic)).toBe(true);
    expect(canManage({ userId: "user_admin", orgId: "org_1", orgRole: "admin" }, clinic)).toBe(true);
  });
  it("refuses a member, an administrator of another organization and a stranger", () => {
    expect(canManage({ userId: "user_desk", orgId: "org_1", orgRole: "member" }, clinic)).toBe(false);
    expect(canManage({ userId: "user_other", orgId: "org_2", orgRole: "admin" }, clinic)).toBe(false);
    expect(canManage({ userId: "user_stranger" }, clinic)).toBe(false);
  });
  it("never lets an administrator in when the clinic has no organization", () => {
    const personal = { ...clinic, orgId: undefined };
    expect(canManage({ userId: "user_admin", orgId: "org_1", orgRole: "admin" }, personal)).toBe(false);
  });
  it("names the owner in the refusal without naming a supplier", () => {
    expect(OWNER_ONLY.code).toBe("owner_required");
    expect(OWNER_ONLY.error).toMatch(/owner/i);
  });
});
