import { describe, expect, it } from "vitest";
import { Hono } from "hono";
import { requireUser, type AuthVariables } from "../../src/middleware/auth.js";

const build = (secret?: string) => {
  const app = new Hono<{ Variables: AuthVariables }>();
  app.use("*", requireUser(secret));
  app.get("/me", (c) => c.json({ userId: c.get("userId"), orgId: c.get("orgId") ?? null, isGuest: c.get("isGuest") }));
  app.get("/role", (c) => c.json({ orgRole: c.get("orgRole") ?? null }));
  return app;
};

describe("requireUser", () => {
  it("dev mode: accepts x-user-id and optional x-org-id as a full user, administrator unless x-org-role says member", async () => {
    const res = await build(undefined).request("/me", { headers: { "x-user-id": "u1", "x-org-id": "org1" } });
    expect(await res.json()).toEqual({ userId: "u1", orgId: "org1", isGuest: false });
    const member = await build(undefined).request("/role", { headers: { "x-user-id": "u1", "x-org-id": "org1", "x-org-role": "member" } });
    expect(await member.json()).toEqual({ orgRole: "member" });
  });
  it("accepts a well-formed guest id in any mode and marks it as a guest", async () => {
    for (const secret of [undefined, "test-secret-key"]) {
      const res = await build(secret).request("/me", { headers: { "x-guest-id": "guest_abcdef123456" } });
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ userId: "guest_abcdef123456", orgId: null, isGuest: true });
    }
  });
  it("rejects a malformed guest id", async () => {
    expect((await build(undefined).request("/me", { headers: { "x-guest-id": "guest_short" } })).status).toBe(401);
    expect((await build(undefined).request("/me", { headers: { "x-guest-id": "user_abcdef123456" } })).status).toBe(401);
  });
  it("dev mode: rejects a request with no identity", async () => {
    expect((await build(undefined).request("/me")).status).toBe(401);
  });
  it("clerk mode: rejects a missing or invalid bearer token", async () => {
    const app = build("test-secret-key");
    expect((await app.request("/me")).status).toBe(401);
    expect((await app.request("/me", { headers: { authorization: "Bearer not-a-jwt" } })).status).toBe(401);
  });
});
