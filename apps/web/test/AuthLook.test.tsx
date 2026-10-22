import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AuthShell } from "@/components/auth/AuthShell";
import { clerkAppearance } from "@/lib/authAppearance";
import { clerkLocalization } from "@/lib/authLocalization";
import { landingFor } from "@/lib/i18n/landing";
import { LANGS } from "@/lib/i18n/languages";

describe("sign-in page shell", () => {
  it("shows the logo, linked home, above whatever the form is", () => {
    render(<AuthShell><p>the form</p></AuthShell>);
    expect(screen.getByRole("link", { name: /clinx\.app home/i })).toHaveAttribute("href", "/");
    expect(screen.getByText("the form")).toBeInTheDocument();
    expect(screen.queryByRole("navigation")).toBeNull();
  });
});

describe("Clerk wording", () => {
  it("welcomes the visitor back on sign-in and offers to get started", () => {
    const l = clerkLocalization(landingFor("en").auth);
    expect(l.signIn?.start).toMatchObject({ title: "Welcome back", subtitle: "Sign in to your Clinx dashboard.", actionText: "No account?", actionLink: "Get started" });
    expect(l.signUp?.start).toMatchObject({ title: "Create your account", actionText: "Already have an account?", actionLink: "Sign in" });
    expect(l.formFieldInputPlaceholder__emailAddress).toBe("you@clinic.com");
  });
  it("is translated into every language, never empty", () => {
    for (const lang of LANGS) {
      const l = clerkLocalization(landingFor(lang).auth);
      for (const v of [l.dividerText, l.formButtonPrimary, l.formFieldLabel__emailAddress, l.formFieldLabel__password, l.signIn?.start?.title, l.signUp?.start?.title]) {
        expect(typeof v === "string" && v.trim() !== "").toBe(true);
      }
    }
    expect(clerkLocalization(landingFor("fr").auth).signIn?.start?.title).toBe("Bon retour");
    expect(clerkLocalization(landingFor("zh").auth).formButtonPrimary).toBe("继续");
  });
});

describe("Clerk look", () => {
  it("uses the brand indigo and a rounded white card", () => {
    expect(clerkAppearance.variables?.colorPrimary).toBe("#4338ca");
    const elements = clerkAppearance.elements as Record<string, unknown>;
    expect(String(elements.cardBox)).toContain("rounded-[24px]");
    expect(String(elements.formButtonPrimary)).toContain("bg-[#4338ca]");
  });
});
