import type { SignIn } from "@clerk/nextjs";
import type { ComponentProps } from "react";

type Appearance = NonNullable<ComponentProps<typeof SignIn>["appearance"]>;

/**
 * How Clerk's sign-in and sign-up forms look here: a white card with a soft shadow, rounded fields, an indigo main
 * button and a quiet footer. Clerk's styles live in the `clerk` layer, so these classes override them.
 */
export const clerkAppearance: Appearance = {
  variables: {
    colorPrimary: "#4338ca",
    colorForeground: "#0e1526",
    colorMutedForeground: "#4b5566",
    colorBackground: "#ffffff",
    colorInput: "#ffffff",
    colorInputForeground: "#0e1526",
    borderRadius: "0.75rem",
    fontFamily: "var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif",
    fontSize: "13.5px",
  },
  elements: {
    rootBox: "flex w-full justify-center",
    cardBox: "mx-auto w-full max-w-[418px] overflow-hidden rounded-[24px] border border-[#ecedf5] shadow-[0_40px_80px_-40px_rgba(14,21,38,.35)]",
    card: "gap-5 rounded-none border-0 bg-white p-[28px] shadow-none",
    header: "gap-1",
    headerTitle: "text-[23px]! font-bold tracking-[-0.02em]",
    headerSubtitle: "mb-1 text-[13px]! text-[#4b5566]",
    socialButtonsBlockButton: "h-[44px] rounded-xl border border-[#e3e6ee] bg-white text-[15px] font-semibold shadow-none hover:bg-[#f6f8fb]",
    socialButtonsBlockButtonText: "font-semibold",
    dividerLine: "bg-[#e3e6ee]",
    dividerText: "text-[11px]! font-medium tracking-[0.08em] text-[#4b5566] uppercase",
    formFieldLabel: "text-sm font-semibold text-[#0e1526]",
    formFieldInput: "min-h-[43px]! rounded-xl border border-[#e3e6ee] bg-white text-[15px]! shadow-none placeholder:text-[#9aa3bd] focus:border-[#6366f1]",
    formButtonPrimary: "h-[44px] rounded-xl bg-[#4338ca] bg-none after:hidden text-[15px] font-bold normal-case shadow-none hover:bg-[#3730a3]",
    footer: "bg-white bg-none",
    footerAction: "bg-white py-4",
    footerActionText: "text-sm text-[#4b5566]",
    footerActionLink: "text-sm font-bold text-[#4338ca] hover:text-[#3730a3]",
  },
};
