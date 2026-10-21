"use client";

import { useSyncExternalStore } from "react";
import { AUTH_EVENT, isGuest } from "@/lib/identity";

const subscribe = (notify: () => void) => {
  window.addEventListener("storage", notify);
  window.addEventListener(AUTH_EVENT, notify);
  return () => { window.removeEventListener("storage", notify); window.removeEventListener(AUTH_EVENT, notify); };
};

/**
 * Whether the visitor has an account identity (not just a guest id). Until Clerk sign-in lands this is the dev user
 * from lib/identity.ts. The server render is always signed out; the browser corrects it right after load.
 */
export const useSignedIn = () => useSyncExternalStore(subscribe, () => !isGuest(), () => false);
