"use client";

import { SignIn, SignUp } from "@clerk/nextjs";
import { clerkEnabled } from "@/lib/auth";
import { clerkAppearance } from "@/lib/authAppearance";
import { LoginPanel } from "./LoginPanel";

/** Clerk's sign-in or sign-up form, styled for Clinx (wording comes from the provider), or the development panel without Clerk. */
export function AuthPanel({ mode }: { mode: "sign-in" | "sign-up" }) {
  if (!clerkEnabled) return <LoginPanel />;
  return mode === "sign-in" ? <SignIn appearance={clerkAppearance} /> : <SignUp appearance={clerkAppearance} />;
}
