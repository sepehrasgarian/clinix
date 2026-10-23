import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * Sign-in has two sources: Clerk when its publishable key is set, the development stand-in otherwise.
 * Each test loads the modules fresh with the environment it needs.
 */
const load = async (clerk: boolean, auth: { isLoaded: boolean; isSignedIn: boolean } = { isLoaded: true, isSignedIn: true }) => {
  vi.resetModules();
  vi.stubEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", clerk ? "pk_test_x" : "");
  vi.doMock("@clerk/nextjs", () => ({
    useAuth: () => auth,
    UserButton: () => <button type="button">User menu</button>,
    OrganizationSwitcher: () => <button type="button">Team switcher</button>,
    SignIn: () => <div>Clerk sign-in form</div>,
    SignUp: () => <div>Clerk sign-up form</div>,
    ClerkProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  }));
  return {
    identity: await import("@/lib/identity"),
    authLib: await import("@/lib/auth"),
    AccountMenu: (await import("@/components/auth/AccountMenu")).AccountMenu,
    TeamSwitcher: (await import("@/components/auth/TeamSwitcher")).TeamSwitcher,
    AuthPanel: (await import("@/components/auth/AuthPanel")).AuthPanel,
    useSignedIn: (await import("@/components/auth/useSignedIn")).useSignedIn,
  };
};

afterEach(() => {
  vi.unstubAllEnvs();
  vi.doUnmock("@clerk/nextjs");
  localStorage.clear();
  delete (window as Window & { Clerk?: unknown }).Clerk;
});

describe("identity headers", () => {
  it("sends the Clerk token as a bearer when signed in, and a guest id when not", async () => {
    const { identity } = await load(true);
    (window as Window & { Clerk?: unknown }).Clerk = { session: { getToken: async () => "tok_123" } };
    expect(await identity.identityHeaders()).toEqual({ authorization: "Bearer tok_123" });
    (window as Window & { Clerk?: unknown }).Clerk = { session: null };
    expect(await identity.identityHeaders()).toMatchObject({ "x-guest-id": expect.stringMatching(/^guest_/) });
  });

  it("falls back to the development stand-in without a Clerk key", async () => {
    const { identity } = await load(false);
    expect(await identity.identityHeaders()).toMatchObject({ "x-guest-id": expect.stringMatching(/^guest_/) });
    identity.setDevUser("dev_1");
    expect(await identity.identityHeaders()).toEqual({ "x-user-id": "dev_1" });
    identity.clearDevUser();
    expect(await identity.identityHeaders()).toMatchObject({ "x-guest-id": expect.any(String) });
  });

  it("builds sign-in and sign-up links that return the visitor to where they were", async () => {
    const { authLib } = await load(true);
    expect(authLib.signUpUrl("/start")).toBe("/sign-up?redirect_url=%2Fstart");
    expect(authLib.signInUrl("/app/clinics/c1")).toBe("/sign-in?redirect_url=%2Fapp%2Fclinics%2Fc1");
  });
});

describe("AccountMenu and AuthPanel", () => {
  it("shows Clerk's user menu and forms when Clerk is configured", async () => {
    const { AccountMenu, AuthPanel } = await load(true);
    render(<AccountMenu />);
    expect(screen.getByRole("button", { name: "User menu" })).toBeInTheDocument();
    render(<AuthPanel mode="sign-up" />);
    expect(screen.getByText("Clerk sign-up form")).toBeInTheDocument();
  });

  it("offers the team switcher only to a signed-in person on Clerk", async () => {
    const clerk = await load(true);
    render(<clerk.TeamSwitcher />);
    expect(screen.getByRole("button", { name: "Team switcher" })).toBeInTheDocument();
    const signedOut = await load(true, { isLoaded: true, isSignedIn: false });
    expect(render(<signedOut.TeamSwitcher />).container).toBeEmptyDOMElement();
    const dev = await load(false);
    expect(render(<dev.TeamSwitcher />).container).toBeEmptyDOMElement();
  });

  it("shows nothing for a signed-out visitor", async () => {
    const { AccountMenu } = await load(true, { isLoaded: true, isSignedIn: false });
    const { container } = render(<AccountMenu />);
    expect(container).toBeEmptyDOMElement();
  });

  it("offers a plain sign-out and the development panel without a Clerk key", async () => {
    const { AccountMenu, AuthPanel, identity } = await load(false);
    identity.setDevUser("dev_1");
    render(<AccountMenu />);
    fireEvent.click(screen.getByRole("button", { name: /sign out/i }));
    expect(identity.isGuest()).toBe(true);
    render(<AuthPanel mode="sign-in" />);
    expect(screen.getByText(/Start a free analysis/)).toBeInTheDocument();
  });
});
