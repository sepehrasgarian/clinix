"use client";

import { useState, type ReactNode } from "react";
import type { Clinic } from "@clinix/contracts";
import { ChatDrawer } from "./ChatDrawer";
import { Sidebar } from "./Sidebar";

export function AppShell({ clinic, clinics = [clinic], competitorNames, children }: { clinic: Clinic; clinics?: Clinic[]; competitorNames?: Record<string, string>; children: ReactNode }) {
  const [chatOpen, setChatOpen] = useState(false);
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <Sidebar clinic={clinic} clinics={clinics} onOpenChat={() => setChatOpen(true)} />
      <main className="flex-1 px-4 py-6 md:px-8 md:py-8">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
      <ChatDrawer open={chatOpen} onClose={() => setChatOpen(false)} clinicId={clinic.id} competitorNames={competitorNames} />
    </div>
  );
}
