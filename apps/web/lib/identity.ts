/**
 * Who is calling the API from the browser. Before any account exists, a guest id minted once
 * per browser. After the dev "continue" (and, from Day 4, Clerk sign-in) a user identity.
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

/** Dev-only stand-in for sign-in until Clerk lands. */
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

export function identityHeaders(): Record<string, string> {
  // Server components act as the dev user until Clerk lands (configurable so a real clinic can be viewed).
  if (typeof window === "undefined") return { "x-user-id": process.env.DEV_USER_ID ?? "dev" };
  const user = getUserId();
  return user ? { "x-user-id": user } : { "x-guest-id": getGuestId() };
}
