"use client";

import Link from "next/link";
import clsx from "clsx";
import { Check, CreditCard, FileText, Headphones, Hospital, LayoutDashboard, Lock, MessageCircle, Search, Settings } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import type { Clinic } from "@clinix/contracts";
import { useAccount } from "@/components/auth/useAccount";
import { Logo } from "@/components/ui/Logo";
import { LocationSwitcher } from "./LocationSwitcher";

const icon = { size: 20, strokeWidth: 1.5, "aria-hidden": true } as const;
const row = "flex min-h-12 items-center gap-4 rounded-2xl px-4 text-[15px] font-medium text-ink-grey";

/** The sidebar until the first report exists: the analysis screens are visible but closed, and the way back into setup stays near. */
export function SetupSidebar({ clinic, clinics = [clinic], site }: { clinic: Clinic; clinics?: Clinic[]; site?: string | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const { email, signOut } = useAccount();
  const base = `/app/clinics/${clinic.id}`;
  const locked = [
    { label: "Competitors", icon: Search },
    { label: "Reports", icon: FileText },
    { label: "Recommendations", icon: Check },
    { label: "Ask Clinx", icon: MessageCircle, beta: true },
  ];
  const links = [
    { href: "/onboarding", label: "Locations", icon: Hospital },
    { href: "/onboarding", label: "Settings", icon: Settings },
    { href: "/start", label: "Billing", icon: CreditCard },
  ];
  const active = pathname === base;
  return (
    <aside className="flex w-full flex-col gap-4 border-b border-[#e7eaf2] bg-white p-4 md:sticky md:top-0 md:h-screen md:w-[256px] md:shrink-0 md:overflow-y-auto md:border-r md:border-b-0 md:px-4 md:py-7">
      <Logo surface="light" height={34} href={base} className="mb-3 px-3" />
      <LocationSwitcher clinic={clinic} clinics={clinics} site={site} onSwitch={(id) => router.push(`/app/clinics/${id}`)} />
      <Link href="/onboarding" className="-mt-1 inline-flex min-h-9 items-center gap-2 px-3 text-sm font-medium text-primary hover:text-[#4338ca]"><span aria-hidden className="text-lg leading-none">+</span>Add a location</Link>
      <nav aria-label="Main" className="mt-2 flex flex-col gap-1.5">
        <Link href={base} aria-current={active ? "page" : undefined} className={clsx(row, active ? "bg-[#eeefff] font-semibold text-primary" : "hover:bg-[#f7f8fc] hover:text-ink")}><LayoutDashboard {...icon} />Dashboard</Link>
        {locked.map(({ label, icon: Icon, beta }) => (
          <span key={label} aria-disabled="true" title="Finish setup to unlock" className={row}>
            <Icon {...icon} />
            <span>{label}</span>
            {beta && <span className="rounded-full bg-[#eeefff] px-2.5 py-0.5 text-xs font-semibold text-primary">Beta</span>}
            <Lock aria-hidden size={15} className="ml-auto text-faint" /><span className="sr-only">Locked until setup is finished</span>
          </span>
        ))}
      </nav>
      <nav aria-label="Account" className="mt-1 flex flex-col gap-1.5 border-t border-[#e7eaf2] pt-4">
        {links.map(({ href, label, icon: Icon }) => <Link key={label} href={href} className={clsx(row, "hover:bg-[#f7f8fc] hover:text-ink")}><Icon {...icon} />{label}</Link>)}
      </nav>
      <div className="mt-auto border-t border-[#e7eaf2] pt-4">
        <div className="flex items-center gap-3 px-2">
          <span className="grid size-11 shrink-0 place-items-center rounded-full bg-[#e8eafd] text-sm font-semibold text-primary" aria-hidden>{(email ?? "?").slice(0, 1).toUpperCase()}</span>
          <span className="min-w-0 truncate text-sm text-muted">{email ?? "Account"}</span>
        </div>
        <button type="button" onClick={signOut} className="mt-3 min-h-9 px-3 text-sm font-medium text-muted hover:text-ink">Sign out</button>
        <Link href="/contact" className="mt-2 flex items-center gap-3 rounded-2xl px-3 py-2 hover:bg-[#f7f8fc]">
          <Headphones {...icon} className="shrink-0 text-ink-grey" />
          <span><span className="block text-sm font-semibold text-[#111b35]">Need help?</span><span className="block text-xs text-muted">Help centre &amp; FAQ</span></span>
        </Link>
      </div>
    </aside>
  );
}
