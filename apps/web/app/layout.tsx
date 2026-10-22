import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import "@/lib/auth.server";
import { clerkEnabled } from "@/lib/auth";
import { LangProvider } from "@/components/i18n/LangProvider";
import { getLang } from "@/lib/i18n/server";
import { landingFor } from "@/lib/i18n/landing";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin", "latin-ext", "cyrillic"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin", "latin-ext", "cyrillic"] });

export const metadata: Metadata = {
  title: { default: "Clinx \u2013 Clinic Market Insights", template: "%s \u2013 Clinx" },
  description: "Competitor and review intelligence for clinics, turned into a ranked action plan.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const lang = await getLang();
  return (
    <html lang={lang} className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        {clerkEnabled ? (
          <ClerkProvider signInUrl="/sign-in" signUpUrl="/sign-up" signInFallbackRedirectUrl="/app" signUpFallbackRedirectUrl="/start" afterSignOutUrl="/">
            <LangProvider lang={lang} landing={landingFor(lang)}>{children}</LangProvider>
          </ClerkProvider>
        ) : (
          <LangProvider lang={lang} landing={landingFor(lang)}>{children}</LangProvider>
        )}
      </body>
    </html>
  );
}
