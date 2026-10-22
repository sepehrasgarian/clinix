"use client";

import { useSyncExternalStore } from "react";
import { useAuth } from "@clerk/nextjs";
import { clerkEnabled } from "@/lib/auth";
import { AUTH_EVENT, isGuest } from "@/lib/identity";

const subscribe = (notify: () => void) => {
  window.addEventListener("storage", notify);
  window.addEventListener(AUTH_EVENT, notify);
  return () => { window.removeEventListener("storage", notify); window.removeEventListener(AUTH_EVENT, notify); };
};

/** The development stand-in: a user id kept in this browser. The server render is always signed out. */
const useDevSignedIn = () => useSyncExternalStore(subscribe, () => !isGuest(), () => false);

/** Clerk's session, once loaded. Signed out until Clerk has loaded. */
const useClerkSignedIn = () => {
  const { isLoaded, isSignedIn } = useAuth();
  return isLoaded && isSignedIn === true;
};

/** Whether the visitor has an account. Which source answers is fixed at build time, so the hook order never changes. */
export const useSignedIn: () => boolean = clerkEnabled ? useClerkSignedIn : useDevSignedIn;
