"use client";

import Link from "next/link";
import clsx from "clsx";
import { Activity, ArrowLeftRight, Building2, ClipboardList, CreditCard, FileText, Layers, LayoutDashboard, LifeBuoy, MoreVertical, Search, Settings, Sparkles } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import type { Clinic } from "@clinix/contracts";
import { useAccount } from "@/components/auth/useAccount";
import { Logo } from "@/components/ui/Logo";
import { copy } from "@/lib/copy";
import { initials } from "@/lib/initials";
import { LocationSwitcher } from "./LocationSwitcher";

const icon = { size: 18, strokeWidth: 1.5, "aria-hidden": true } as const;
const row = "relative flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium";
const idle = "text-ink-grey hover:bg-[#f7f8fc] hover:text-ink";

/** Left navigation for one clinic once it has a report. The clinic switcher keeps the same screen and swaps the clinic. */
export function Sidebar({ clinic, clinics = [clinic], site, onOpenChat }: { clinic: Clinic; clinics?: Clinic[]; site?: string | null; onOpenChat: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { email, name, signOut } = useAccount();
  const base = `/app/clinics/${clinic.id}`;
  const items: { href: string; label: string; icon: typeof Activity; exact?: boolean }[] = [
    { href: base, label: copy.nav.dashboard, icon: LayoutDashboard, exact: true },
    { href: `${base}/competitors`, label: copy.nav.competitors, icon: Search },
    { href: `${base}/report`, label: copy.nav.report, icon: FileText },
    { href: `${base}/findings`, label: copy.nav.findings, icon: Building2 },
    { href: `${base}/disciplines`, label: copy.nav.disciplines, icon: Layers },
    { href: `${base}/actions`, label: copy.nav.actions, icon: ClipboardList },
    { href: `${base}/compare`, label: copy.nav.compare, icon: ArrowLeftRight },
  ];
  // While an analysis is open, it is the current place in the app: one extra entry, highlighted, that goes nowhere new.
  if (pathname.startsWith(`${base}/run/`)) items.splice(1, 0, { href: pathname, label: copy.nav.analysis, icon: Activity, exact: true });
  const switchClinic = (id: string) => {
    const rest = pathname.startsWith(base) ? pathname.slice(base.length) : "";
    router.push(`/app/clinics/${id}${rest.startsWith("/run") ? "" : rest}`);
  };
  return (
    <aside className="flex w-full flex-col gap-5 border-b border-[#e7eaf2] bg-white p-4 md:sticky md:top-0 md:h-screen md:w-[256px] md:shrink-0 md:overflow-y-auto md:border-r md:border-b-0 md:px-4 md:py-6">
      <Logo surface="light" height={28} href={base} className="px-2" />
      <div>
        <LocationSwitcher clinic={clinic} clinics={clinics} site={site} onSwitch={switchClinic} />
        <Link href="/onboarding" className="mt-1 inline-flex min-h-9 items-center gap-1.5 px-3 text-xs font-medium text-primary hover:text-[#4338ca]"><span aria-hidden className="text-base leading-none">+</span>Add a clinic</Link>
      </div>
      <nav aria-label="Main" className="flex flex-row gap-1 overflow-x-auto md:flex-col">
        {items.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link key={href} href={href} aria-current={active ? "page" : undefined} className={clsx(row, active ? "bg-[#f1f0ff] font-semibold text-primary" : idle)}>
              {active && <span aria-hidden className="absolute top-2 bottom-2 -left-4 hidden w-[3px] rounded-r-full bg-primary md:block" />}
              <Icon {...icon} />{label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto flex flex-col gap-1">
        <button type="button" onClick={onOpenChat} className="mb-2 flex items-center gap-3 rounded-xl border border-[#e7eaf2] bg-white px-3 py-3 text-left text-sm font-medium text-[#101936] hover:border-primary/40"><Sparkles {...icon} className="text-primary" />{copy.nav.chat}</button>
        <Link href="/onboarding" className={clsx(row, idle)}><Settings {...icon} />Settings</Link>
        <Link href="/pricing" className={clsx(row, idle)}><CreditCard {...icon} />Billing</Link>
        <Link href="/contact" className={clsx(row, idle)}><LifeBuoy {...icon} />Help &amp; support</Link>
        <div className="mt-3 flex items-center gap-3 border-t border-[#e7eaf2] px-1 pt-4">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#eceefb] text-sm font-semibold text-[#101936]" aria-hidden>{initials(name, email)}</span>
          <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-[#101936]">{name ?? "Account"}</span>{email && <span className="block truncate text-xs text-muted">{email}</span>}</span>
          <button type="button" onClick={signOut} aria-label="Sign out" title="Sign out" className="grid size-8 place-items-center rounded-lg text-muted hover:bg-[#f7f8fc]"><MoreVertical {...icon} /></button>
        </div>
      </div>
    </aside>
  );
}
