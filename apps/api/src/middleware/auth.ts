import { verifyToken } from "@clerk/backend";
import type { Context, Next } from "hono";
export type AuthVariables = { userId: string; orgId?: string; isGuest: boolean };

/** Browsers mint one of these before any account exists; the free first look runs under it. */
export const GUEST_ID = /^guest_[a-z0-9]{12,40}$/;

/**
 * Identifies the caller. In order: a Clerk bearer token (when a secret key is given), the
 * dev `x-user-id` header (when it is not), or a guest id from `x-guest-id`. Guests can run
 * the free first look only; routes that need an account check `isGuest`.
 * The key is always passed explicitly (index.ts passes the configured one; tests pass none),
 * so a key in .env can never switch Clerk on for a caller that wants development mode.
 */
export function requireUser(secretKey: string | undefined) {
  return async (c: Context<{ Variables: AuthVariables }>, next: Next) => {
    const guest = c.req.header("x-guest-id");
    const header = c.req.header("authorization");
    const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;

    if (!secretKey) {
      const devUser = c.req.header("x-user-id");
      if (devUser) {
        c.set("userId", devUser);
        c.set("isGuest", false);
        const org = c.req.header("x-org-id");
        if (org) c.set("orgId", org);
        return next();
      }
    }
    if (!token && guest) {
      if (!GUEST_ID.test(guest)) return c.json({ error: "invalid guest id" }, 401);
      c.set("userId", guest);
      c.set("isGuest", true);
      return next();
    }
    if (!secretKey) return c.json({ error: "missing x-user-id or x-guest-id header (dev mode)" }, 401);
    if (!token) return c.json({ error: "missing bearer token" }, 401);
    try {
      const claims = await verifyToken(token, { secretKey });
      c.set("userId", claims.sub);
      c.set("isGuest", false);
      const orgId = (claims as { org_id?: string }).org_id;
      if (orgId) c.set("orgId", orgId);
      return next();
    } catch {
      return c.json({ error: "invalid token" }, 401);
    }
  };
}
