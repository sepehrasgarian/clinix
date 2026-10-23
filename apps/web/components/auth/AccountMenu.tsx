"use client";

import { UserButton } from "@clerk/nextjs";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { clerkEnabled } from "@/lib/auth";
import { clearDevUser } from "@/lib/identity";
import { useSignedIn } from "./useSignedIn";

/** Shown only to a signed-in person: the account menu with sign-out. */
export function AccountMenu({ afterSignOut = "/", label = "Sign out" }: { afterSignOut?: string; label?: string }) {
  const router = useRouter();
  const signedIn = useSignedIn();
  if (!signedIn) return null;
  if (clerkEnabled) {
    return <UserButton />;
  }
  return (
    <button type="button" onClick={() => { clearDevUser(); router.push(afterSignOut); }} className="inline-flex min-h-9 items-center gap-1.5 text-sm font-medium text-muted hover:text-ink">
      <LogOut size={14} aria-hidden /> {label}
    </button>
  );
}
