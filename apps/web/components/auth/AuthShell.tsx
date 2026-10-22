import type { ReactNode } from "react";
import { Logo } from "@/components/ui/Logo";

/** A focused page for signing in or up: the logo above one centered card, nothing else. */
export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-screen flex-col items-center gap-[21px] bg-surface px-4 pt-[83px] pb-16">
      <Logo surface="light" height={44} />
      {children}
    </main>
  );
}
