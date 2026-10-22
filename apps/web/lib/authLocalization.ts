import type { ComponentProps } from "react";
import type { ClerkProvider } from "@clerk/nextjs";
import type { LandingCopy } from "@/lib/i18n/landing";

type Localization = NonNullable<ComponentProps<typeof ClerkProvider>["localization"]>;

/**
 * Clerk's own wording for sign-in and sign-up, in the visitor's language. Clerk applies one localization to the whole
 * app, so the divider and main button are neutral enough for both forms; title, subtitle and the footer link are per form.
 */
export function clerkLocalization(t: LandingCopy["auth"]): Localization {
  return {
    dividerText: t.divider,
    formButtonPrimary: t.continue,
    formFieldLabel__emailAddress: t.email,
    formFieldLabel__password: t.password,
    formFieldInputPlaceholder__emailAddress: t.emailPlaceholder,
    signIn: { start: { title: t.signInTitle, subtitle: t.signInSubtitle, actionText: t.noAccount, actionLink: t.getStarted } },
    signUp: { start: { title: t.signUpTitle, subtitle: t.signUpSubtitle, actionText: t.haveAccount, actionLink: t.signIn } },
  };
}
