import { redirect } from "next/navigation";

// Setup lives outside the app shell (it has no clinic yet). Keep the old path working.
export default function AppOnboardingRedirect() {
  redirect("/onboarding");
}
