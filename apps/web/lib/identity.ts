import { browserToken, clerkEnabled, serverToken } from "./auth";

/**
 * Who is calling the API. Before any account exists, a guest id minted once per browser. With
 * Clerk configured, the signed-in user's token; without it, the development stand-in user.
 */
const GUEST_KEY = "clinix.guest";
const USER_KEY = "clinix.user";

const randomId = () => {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => (b % 36).toString(36)).join("");
};

export function getGuestId(): string {
  try {
    const existing = localStorage.getItem(GUEST_KEY);
    if (existing) return existing;
    const id = `guest_${randomId()}`;
    localStorage.setItem(GUEST_KEY, id);
    return id;
  } catch {
    return `guest_${randomId()}`;
  }
}

export function getUserId(): string | null {
  try {
    return localStorage.getItem(USER_KEY);
  } catch {
    return null;
  }
}

/** Development stand-in for sign-in, used only while Clerk is not configured. */
export const DEV_USER_ID = process.env.NEXT_PUBLIC_DEV_USER_ID ?? "dev";

/** Fired when the signed-in state changes in this tab, so the nav can follow without a reload. */
export const AUTH_EVENT = "clinx:auth-change";

export function setDevUser(id: string) {
  try {
    localStorage.setItem(USER_KEY, id);
  } catch {
    /* ignore */
  }
  if (typeof window !== "undefined") window.dispatchEvent(new Event(AUTH_EVENT));
}

export const isGuest = (): boolean => getUserId() === null;

export async function identityHeaders(): Promise<Record<string, string>> {
  if (typeof window === "undefined") {
    if (!clerkEnabled) return { "x-user-id": process.env.DEV_USER_ID ?? "dev" };
    const token = await serverToken();
    return token ? { authorization: `Bearer ${token}` } : {};
  }
  if (clerkEnabled) {
    const token = await browserToken();
    return token ? { authorization: `Bearer ${token}` } : { "x-guest-id": getGuestId() };
  }
  const user = getUserId();
  return user ? { "x-user-id": user } : { "x-guest-id": getGuestId() };
}

/** Forget the development stand-in user in this browser. */
export function clearDevUser() {
  try {
    localStorage.removeItem(USER_KEY);
  } catch {
    /* ignore */
  }
  if (typeof window !== "undefined") window.dispatchEvent(new Event(AUTH_EVENT));
}
