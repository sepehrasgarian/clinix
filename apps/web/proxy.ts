import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

/**
 * With Clerk configured, everything under /app needs a signed-in user; visitors are sent to sign in
 * and come back where they were. The free first look (/start) stays open to guests. Without Clerk
 * (no publishable key) requests pass through and the development stand-in applies.
 */
const needsAccount = createRouteMatcher(["/app(.*)"]);

const proxy = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  ? clerkMiddleware(async (auth, req) => {
      if (needsAccount(req)) await auth.protect();
    })
  : () => NextResponse.next();

export default proxy;

export const config = {
  matcher: ["/((?!_next|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|css|js|map|txt|woff2?)).*)", "/(api|trpc)(.*)"],
};
