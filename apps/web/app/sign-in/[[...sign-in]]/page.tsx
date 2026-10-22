import type { Metadata } from "next";
import { AuthPanel } from "@/components/auth/AuthPanel";
import { AuthShell } from "@/components/auth/AuthShell";

export const metadata: Metadata = { title: "Sign in" };

export default function SignInPage() {
  return <AuthShell><AuthPanel mode="sign-in" /></AuthShell>;
}
