import { verifyToken } from "@clerk/backend";
import type { Context, Next } from "hono";
import { env } from "../env.js";

export type AuthVariables = { userId: string; orgId?: string };

/**
 * Verifies the Clerk session token from `Authorization: Bearer <token>`.
 * Without CLERK_SECRET_KEY (local dev and tests) it accepts an `x-user-id` header instead.
 */
export function requireUser(secretKey: string | undefined = env.CLERK_SECRET_KEY) {
  return async (c: Context<{ Variables: AuthVariables }>, next: Next) => {
    if (!secretKey) {
      const devUser = c.req.header("x-user-id");
      if (!devUser) return c.json({ error: "missing x-user-id header (dev mode)" }, 401);
      c.set("userId", devUser);
      const org = c.req.header("x-org-id");
      if (org) c.set("orgId", org);
      return next();
    }
    const header = c.req.header("authorization");
    const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;
    if (!token) return c.json({ error: "missing bearer token" }, 401);
    try {
      const claims = await verifyToken(token, { secretKey });
      c.set("userId", claims.sub);
      const orgId = (claims as { org_id?: string }).org_id;
      if (orgId) c.set("orgId", orgId);
      return next();
    } catch {
      return c.json({ error: "invalid token" }, 401);
    }
  };
}
