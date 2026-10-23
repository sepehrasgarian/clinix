"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell, CalendarDays, ChevronDown } from "lucide-react";
import { useAccount } from "@/components/auth/useAccount";
import { initials } from "@/lib/initials";

const ranges = ["Last 7 days", "Last 30 days", "Last 90 days"] as const;

/** Date range, what changed since the last analysis, and the account. The dot shows only when the latest report has new findings. */
export function TopBar({ changesHref, hasChanges }: { changesHref: string; hasChanges: boolean }) {
  const { name, email } = useAccount();
  const [range, setRange] = useState<(typeof ranges)[number]>("Last 30 days");
  return (
    <div className="mb-2 flex items-center justify-end gap-3">
      <label className="relative flex min-h-11 items-center gap-2 rounded-xl border border-[#e7eaf2] bg-white px-3.5 text-sm font-medium text-[#101a35]">
        <CalendarDays size={18} strokeWidth={1.5} aria-hidden />
        <span className="sr-only">Date range</span>
        <select value={range} onChange={(e) => setRange(e.target.value as (typeof ranges)[number])} className="appearance-none bg-transparent pr-6 outline-none">
          {ranges.map((r) => <option key={r}>{r}</option>)}
        </select>
        <ChevronDown size={16} aria-hidden className="pointer-events-none absolute right-3 text-muted" />
      </label>
      <Link href={changesHref} aria-label={hasChanges ? "Changes since your last analysis (new)" : "Changes since your last analysis"} className="relative grid size-11 place-items-center rounded-xl border border-[#e7eaf2] bg-white text-[#101a35]">
        <Bell size={18} strokeWidth={1.5} aria-hidden />
        {hasChanges && <span aria-hidden className="absolute top-2.5 right-3 size-2 rounded-full bg-[#e5484d]" />}
      </Link>
      <span className="grid size-11 place-items-center rounded-full bg-[#eceefb] text-sm font-semibold text-[#111b35]" title={name ?? email ?? undefined}>{initials(name, email)}</span>
    </div>
  );
}
