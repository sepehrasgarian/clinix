import type { Metadata } from "next";
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";

export const metadata: Metadata = { title: "Your clinic – ClinX" };

export default function StartPage() {
  return <OnboardingFlow />;
}
