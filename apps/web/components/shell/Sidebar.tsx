"use client";

import clsx from "clsx";
import { ArrowLeftRight, Building2, ChevronsUpDown, ClipboardList, FileText, Layers, LayoutDashboard, MessageSquareText, Plus, Search } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { Clinic } from "@clinix/contracts";
import { AccountMenu } from "@/components/auth/AccountMenu";
import { Logo } from "@/components/ui/Logo";
import { copy } from "@/lib/copy";

/** Left navigation for one clinic. With several clinics, a switcher keeps the same screen and swaps the clinic. */
export function Sidebar({ clinic, clinics = [clinic], onOpenChat }: { clinic: Clinic; clinics?: Clinic[]; onOpenChat: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const base = `/app/clinics/${clinic.id}`;
  const items = [
    { href: base, label: copy.nav.dashboard, icon: LayoutDashboard, exact: true },
    { href: `${base}/report`, label: copy.nav.report, icon: FileText },
    { href: `${base}/findings`, label: copy.nav.findings, icon: Search },
    { href: `${base}/disciplines`, label: copy.nav.disciplines, icon: Layers },
    { href: `${base}/actions`, label: copy.nav.actions, icon: ClipboardList },
    { href: `${base}/competitors`, label: copy.nav.competitors, icon: Building2 },
    { href: `${base}/compare`, label: copy.nav.compare, icon: ArrowLeftRight },
  ];
  const switchClinic = (id: string) => {
    const rest = pathname.startsWith(base) ? pathname.slice(base.length) : "";
    router.push(`/app/clinics/${id}${rest.startsWith("/run") ? "" : rest}`);
  };
  return (
    <aside className="flex w-full flex-col gap-6 border-b border-line bg-card p-4 md:min-h-screen md:w-60 md:border-r md:border-b-0">
      <Logo surface="light" height={22} href={base} className="px-1" />
      <div className="rounded-xl border border-line bg-surface px-3 py-2">
        <label htmlFor="clinic-switcher" className="text-xs text-faint">Clinic</label>
        {clinics.length > 1 ? (
          <div className="relative">
            <select id="clinic-switcher" value={clinic.id} onChange={(e) => switchClinic(e.target.value)} className="min-h-9 w-full appearance-none truncate rounded-md bg-transparent pr-6 font-medium outline-none focus-visible:ring-2 focus-visible:ring-primary">
              {clinics.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <ChevronsUpDown size={14} aria-hidden className="pointer-events-none absolute top-1/2 right-0 -translate-y-1/2 text-faint" />
          </div>
        ) : (
          <p id="clinic-switcher" className="truncate font-medium">{clinic.name}</p>
        )}
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
      <div className="flex min-h-9 items-center justify-between px-1 text-sm text-muted"><span>Account</span><AccountMenu /></div>
    </aside>
  );
}
