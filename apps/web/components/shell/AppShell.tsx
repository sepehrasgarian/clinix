"use client";

import { useState, type ReactNode } from "react";
import type { Clinic } from "@clinix/contracts";
import { ChatDrawer } from "./ChatDrawer";
import { SetupSidebar } from "./SetupSidebar";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";

export function AppShell({ clinic, clinics = [clinic], locked = false, site, hasChanges = false, competitorNames, children }: { clinic: Clinic; clinics?: Clinic[]; locked?: boolean; site?: string | null; hasChanges?: boolean; competitorNames?: Record<string, string>; children: ReactNode }) {
  const [chatOpen, setChatOpen] = useState(false);
  return (
    <div className="flex min-h-screen flex-col bg-[#f7f8fc] md:flex-row">
      {locked ? <SetupSidebar clinic={clinic} clinics={clinics} site={site} /> : <Sidebar clinic={clinic} clinics={clinics} site={site} onOpenChat={() => setChatOpen(true)} />}
      <main className="min-w-0 flex-1 px-4 py-6 md:px-8 md:py-6">
        <div className="mx-auto max-w-[1480px]">
          {!locked && <TopBar changesHref={`/app/clinics/${clinic.id}/compare`} hasChanges={hasChanges} />}
          {children}
        </div>
      </main>
      <ChatDrawer open={chatOpen} onClose={() => setChatOpen(false)} clinicId={clinic.id} competitorNames={competitorNames} />
    </div>
  );
}
