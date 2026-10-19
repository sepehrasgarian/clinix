"use client";

import clsx from "clsx";
import { ArrowLeftRight, Building2, ClipboardList, LayoutDashboard, MessageSquareText, Plus, Search } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Clinic } from "@clinix/contracts";
import { copy } from "@/lib/copy";

export function Sidebar({ clinic, onOpenChat }: { clinic: Clinic; onOpenChat: () => void }) {
  const pathname = usePathname();
  const base = `/app/clinics/${clinic.id}`;
  const items = [
    { href: "/app", label: copy.nav.dashboard, icon: LayoutDashboard, exact: true },
    { href: `${base}/findings`, label: copy.nav.findings, icon: Search },
    { href: `${base}/actions`, label: copy.nav.actions, icon: ClipboardList },
    { href: `${base}/competitors`, label: copy.nav.competitors, icon: Building2 },
    { href: `${base}/compare`, label: copy.nav.compare, icon: ArrowLeftRight },
  ];
  return (
    <aside className="flex w-full flex-col gap-6 border-b border-line bg-card p-4 md:min-h-screen md:w-60 md:border-r md:border-b-0">
      <Link href="/app" className="flex items-center gap-2 px-2 text-lg font-semibold tracking-tight">
        <span aria-hidden className="inline-block size-6 rounded-md bg-primary" />
        Clinix
      </Link>
      <div className="rounded-xl border border-line bg-surface px-3 py-2">
        <p className="text-xs text-faint">Clinic</p>
        <p className="truncate font-medium">{clinic.name}</p>
        <p className="truncate text-xs text-muted">{clinic.address}, {clinic.city}</p>
        <Link href="/onboarding" className="mt-2 inline-flex min-h-9 items-center gap-1 text-xs font-medium text-primary">
          <Plus size={14} aria-hidden /> Add a clinic
        </Link>
      </div>
      <nav aria-label="Main" className="flex flex-row gap-1 overflow-x-auto md:flex-col">
        {items.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={clsx("flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium", active ? "bg-primary-soft text-primary" : "text-muted hover:bg-surface hover:text-ink")}
            >
              <Icon aria-hidden size={18} />
              {label}
            </Link>
          );
        })}
      </nav>
      <button type="button" onClick={onOpenChat} className="mt-auto flex min-h-11 items-center gap-3 rounded-lg border border-line px-3 text-sm font-medium hover:bg-surface">
        <MessageSquareText aria-hidden size={18} className="text-primary" />
        {copy.nav.chat}
      </button>
    </aside>
  );
}
