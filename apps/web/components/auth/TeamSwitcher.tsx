"use client";

import { OrganizationSwitcher } from "@clerk/nextjs";
import { clerkEnabled } from "@/lib/auth";
import { useSignedIn } from "./useSignedIn";

/** Lets a signed-in person switch between their personal clinics and an organization's. Clerk only. */
export function TeamSwitcher() {
  const signedIn = useSignedIn();
  if (!clerkEnabled || !signedIn) return null;
  return <OrganizationSwitcher hidePersonal={false} afterCreateOrganizationUrl="/app" afterSelectOrganizationUrl="/app" afterSelectPersonalUrl="/app" />;
}
