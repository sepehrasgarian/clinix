/**
 * Sign-in is provided by Clerk once its publishable key is set. Without it (a teammate's clone
 * before keys, the unit tests) the app keeps the guest first look and the development stand-in.
 */
export const clerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

export const SIGN_IN_PATH = "/sign-in";
export const SIGN_UP_PATH = "/sign-up";

/** The URL that brings a visitor back to where they were once signed in. */
export const signInUrl = (returnTo: string) => `${SIGN_IN_PATH}?redirect_url=${encodeURIComponent(returnTo)}`;
export const signUpUrl = (returnTo: string) => `${SIGN_UP_PATH}?redirect_url=${encodeURIComponent(returnTo)}`;

type TokenSource = () => Promise<string | null>;
const KEY = "__clinxServerToken" as const;

/** Server code registers how to get the signed-in user's token; `lib/api.ts` asks for it on every server call. */
export const registerServerToken = (source: TokenSource) => {
  (globalThis as Record<string, unknown>)[KEY] = source;
};
export const serverToken = (): Promise<string | null> => {
  const source = (globalThis as Record<string, unknown>)[KEY] as TokenSource | undefined;
  return source ? source() : Promise.resolve(null);
};

/** The session token in the browser, from the Clerk script the provider loads. Null when signed out. */
export async function browserToken(): Promise<string | null> {
  const clerk = (window as Window & { Clerk?: { session?: { getToken(): Promise<string | null> } | null } }).Clerk;
  try {
    return (await clerk?.session?.getToken()) ?? null;
  } catch {
    return null;
  }
}
