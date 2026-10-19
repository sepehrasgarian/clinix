import { describe, expect, it } from "vitest";
import { Hono } from "hono";
import { requireUser, type AuthVariables } from "../../src/middleware/auth.js";

const build = (secret?: string) => {
  const app = new Hono<{ Variables: AuthVariables }>();
  app.use("*", requireUser(secret));
  app.get("/me", (c) => c.json({ userId: c.get("userId"), orgId: c.get("orgId") ?? null }));
  return app;
};

describe("requireUser", () => {
  it("dev mode: accepts x-user-id and optional x-org-id", async () => {
    const res = await build(undefined).request("/me", { headers: { "x-user-id": "u1", "x-org-id": "org1" } });
    expect(await res.json()).toEqual({ userId: "u1", orgId: "org1" });
  });
  it("dev mode: rejects a request without x-user-id", async () => {
    expect((await build(undefined).request("/me")).status).toBe(401);
  });
  it("clerk mode: rejects a missing or invalid bearer token", async () => {
    const app = build("sk_test_fake");
    expect((await app.request("/me")).status).toBe(401);
    expect((await app.request("/me", { headers: { authorization: "Bearer not-a-jwt" } })).status).toBe(401);
  });
});
