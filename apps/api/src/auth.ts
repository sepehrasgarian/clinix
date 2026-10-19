import { verifyToken } from "@clerk/backend";
import type { Context, Next } from "hono";

// Verifies the Clerk session token from `Authorization: Bearer <token>`.
// In local dev without CLERK_SECRET_KEY, falls back to an `x-user-id` header.
const secretKey = process.env.CLERK_SECRET_KEY;

export async function requireUser(c: Context, next: Next) {
  if (!secretKey) {
    const dev = c.req.header("x-user-id") ?? "dev-user";
    c.set("userId", dev);
    return next();
  }
  const auth = c.req.header("authorization");
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : undefined;
  if (!token) return c.json({ error: "missing bearer token" }, 401);
  try {
    const { sub } = await verifyToken(token, { secretKey });
    c.set("userId", sub);
    return next();
  } catch {
    return c.json({ error: "invalid token" }, 401);
  }
}
