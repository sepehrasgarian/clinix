import type { Metadata } from "next";
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";

export const metadata: Metadata = { title: "Your clinic – Clinix" };

export default function StartPage() {
  return <OnboardingFlow />;
}
