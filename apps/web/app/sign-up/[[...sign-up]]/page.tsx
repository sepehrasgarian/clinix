import type { Metadata } from "next";
import { AuthPanel } from "@/components/auth/AuthPanel";
import { AuthShell } from "@/components/auth/AuthShell";

export const metadata: Metadata = { title: "Create your account" };

export default function SignUpPage() {
  return <AuthShell><AuthPanel mode="sign-up" /></AuthShell>;
}
