"use client";

import { useClerk, useUser } from "@clerk/nextjs";
import { useCallback } from "react";
import { clerkEnabled } from "@/lib/auth";
import { clearDevUser } from "@/lib/identity";
import { useSignedIn } from "./useSignedIn";

export type Account = { signedIn: boolean; email: string | null; signOut: () => void };

/** Clerk's user: their email and sign-out. */
const useClerkAccount = (): Account => {
  const signedIn = useSignedIn();
  const { user } = useUser();
  const clerk = useClerk();
  const signOut = useCallback(() => { void clerk.signOut({ redirectUrl: "/" }); }, [clerk]);
  return { signedIn, email: user?.primaryEmailAddress?.emailAddress ?? null, signOut };
};

/** The development stand-in has no email; signing out forgets the test user. */
const useDevAccount = (): Account => {
  const signedIn = useSignedIn();
  const signOut = useCallback(() => { clearDevUser(); window.location.assign("/"); }, []);
  return { signedIn, email: null, signOut };
};

/** Who is signed in, for the account block in the setup rail. Which source answers is fixed at build time. */
export const useAccount: () => Account = clerkEnabled ? useClerkAccount : useDevAccount;
