"use client";

import { SignIn, SignUp } from "@clerk/nextjs";
import { clerkEnabled } from "@/lib/auth";
import { LoginPanel } from "./LoginPanel";

/** Clerk's hosted sign-in or sign-up form when configured; otherwise the development panel. */
export function AuthPanel({ mode }: { mode: "sign-in" | "sign-up" }) {
  if (!clerkEnabled) return <LoginPanel />;
  const appearance = { elements: { rootBox: "mx-auto", cardBox: "shadow-[0_40px_80px_-40px_rgba(14,21,38,.4)] rounded-[28px]" } };
  return <div className="flex justify-center">{mode === "sign-in" ? <SignIn appearance={appearance} /> : <SignUp appearance={appearance} />}</div>;
}
