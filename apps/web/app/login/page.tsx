import type { Metadata } from "next";
import { AuthPanel } from "@/components/auth/AuthPanel";
import { AuthShell } from "@/components/auth/AuthShell";
import { getLanding } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getLanding()).login.title };
}

/** The old /login address shows the sign-in form. */
export default function LoginPage() {
  return <AuthShell><AuthPanel mode="sign-in" /></AuthShell>;
}
