"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { Building2, Check, ChevronDown, Plus } from "lucide-react";
import type { Clinic } from "@clinix/contracts";
import { websiteHost } from "@/lib/website";
import { ClinicLogo } from "@/components/onboarding/ClinicLogo";

const PLAN_LOCATIONS = { essential: 1, growth: 3, scale: 6 } as const;

/** The plan the owner chose in setup, when this browser still holds it: it decides how many locations the account may have. */
function chosenLimit(): number | null {
  try {
    const plan = (JSON.parse(localStorage.getItem("clinix.onboarding") ?? "null") as { pending?: { plan?: keyof typeof PLAN_LOCATIONS } } | null)?.pending?.plan;
    return plan ? PLAN_LOCATIONS[plan] ?? null : null;
  } catch {
    return null;
  }
}

function Logo({ clinic, site }: { clinic: Clinic; site?: string | null }) {
  const placeholder = <span className="grid size-11 shrink-0 place-items-center rounded-full border border-[#ecedf5] bg-[#f7f8fc] text-faint" aria-hidden><Building2 size={18} strokeWidth={1.5} /></span>;
  const address = site ?? clinic.website;
  const host = address ? websiteHost(address) : null;
  if (!host && !clinic.placeId) return placeholder;
  return <ClinicLogo round site={host} placeId={clinic.placeId} />;
}

/** The clinic selector: the current clinic, and on open every location with how many the plan allows. */
export function LocationSwitcher({ clinic, clinics, site, onSwitch }: { clinic: Clinic; clinics: Clinic[]; site?: string | null; onSwitch: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const [limit, setLimit] = useState<number | null>(null);
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handle = setTimeout(() => setLimit(chosenLimit()), 0);
    return () => clearTimeout(handle);
  }, []);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => { if (!root.current?.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", esc); };
  }, [open]);
  return (
    <div ref={root} className="relative">
      <button type="button" id="clinic-switcher" aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen((v) => !v)} className="flex w-full items-center gap-3 rounded-[22px] border border-[#e7eaf2] bg-white px-3 py-2.5 text-left shadow-[0_4px_20px_rgba(20,27,65,.035)] hover:border-primary/30">
        <Logo clinic={clinic} site={site} />
        <span className="min-w-0 flex-1"><span className="block truncate font-semibold text-[#111b35]" title={clinic.name}>{clinic.name}</span><span className="block truncate text-[13px] text-muted">{clinic.city}{clinic.province ? `, ${clinic.province}` : ""}</span></span>
        <ChevronDown size={18} strokeWidth={1.5} aria-hidden className={clsx("shrink-0 text-muted transition-transform duration-150", open && "rotate-180")} />
      </button>
      {open && (
        <div className="absolute inset-x-0 top-full z-30 mt-2 rounded-[22px] border border-[#e7eaf2] bg-white p-2 shadow-[0_18px_40px_-16px_rgba(20,27,65,.25)]">
          <div className="flex items-center justify-between px-3 pt-2 pb-2 text-[11px] font-semibold tracking-[0.1em] text-muted uppercase"><span>Your locations</span><span className="tracking-normal normal-case">{limit ? `${clinics.length} of ${limit} used` : `${clinics.length} ${clinics.length === 1 ? "location" : "locations"}`}</span></div>
          <ul role="listbox" aria-label="Your locations">
            {clinics.map((c) => {
              const current = c.id === clinic.id;
              return (
                <li key={c.id} role="option" aria-selected={current}>
                  <button type="button" onClick={() => { setOpen(false); if (!current) onSwitch(c.id); }} className={clsx("flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left", current ? "bg-[#eeefff]" : "hover:bg-[#f7f8fc]")}>
                    <Logo clinic={c} site={current ? site : undefined} />
                    <span className="min-w-0 flex-1"><span className={clsx("block truncate font-semibold", current ? "text-primary" : "text-[#111b35]")}>{c.name}</span><span className="block truncate text-[13px] text-muted">{c.city}{c.province ? `, ${c.province}` : ""}</span></span>
                    {current && <Check size={18} strokeWidth={1.5} aria-hidden className="shrink-0 text-primary" />}
                  </button>
                </li>
              );
            })}
          </ul>
          <Link href="/onboarding" className="mt-1 flex min-h-12 items-center gap-3 rounded-2xl border-t border-[#eef0f7] px-3 pt-1 text-[15px] font-semibold text-primary hover:text-[#4338ca]"><Plus size={18} strokeWidth={1.5} aria-hidden />Add a location</Link>
        </div>
      )}
    </div>
  );
}
