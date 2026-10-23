import Link from "next/link";
import clsx from "clsx";
import { ArrowRight, MapPin, Users } from "lucide-react";
import type { Clinic } from "@clinix/contracts";
import { copy } from "@/lib/copy";
import { RunAnalysisButton } from "./RunAnalysisButton";
import { statusChip, type Completed, type HeroState } from "@/lib/dashboard";
import { formatDate } from "@/lib/format";

const chipTone = { success: "bg-[#e6f7ee] text-[#16875a]", primary: "bg-[#eeefff] text-primary", warning: "bg-warning-soft text-warning", neutral: "bg-[#f1f2f7] text-muted" };
const action = "inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#5146e5] px-5 text-sm font-semibold text-white hover:bg-[#4338ca]";

/** The one primary action for where the account really is. Retry lives with the failure it belongs to. */
function primaryAction(hero: HeroState, latest: Completed | null, base: string): { label: string; href: string } | null {
  const t = copy.dashboard.hero;
  if (hero.kind === "completed") return { label: t.viewReport, href: `${base}/report` };
  if (hero.kind === "none") return { label: copy.dashboard.welcome.action, href: "/start" };
  if (hero.kind === "setup") return { label: t.setupAction, href: "/start" };
  if (hero.kind === "processing") return { label: t.details, href: `${base}/run/${hero.analysis.id}` };
  return latest ? { label: t.viewPrevious, href: `${base}/report` } : null;
}

/** Which clinic, how current the information is, and what to do next. */
export function DashboardHeader({ clinic, hero, latest }: { clinic: Clinic; hero: HeroState; latest: Completed | null }) {
  const t = copy.dashboard;
  const base = `/app/clinics/${clinic.id}`;
  const chip = statusChip(hero);
  const next = primaryAction(hero, latest, base);
  const date = latest?.report.generatedAt;
  const canRerun = hero.kind === "completed" || hero.kind === "failed";
  return (
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0 max-w-2xl">
        <p className="text-[11px] font-semibold tracking-[0.12em] text-faint uppercase">{t.eyebrow}</p>
        <h1 className="mt-1 text-[clamp(30px,3.2vw,38px)] leading-[1.1] font-semibold tracking-[-0.03em] text-[#101a35]">{t.heading}</h1>
        <p className="mt-2 text-[15px] text-muted">{t.subtitle}</p>
        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-muted">
          <span className="inline-flex min-w-0 items-center gap-1.5 font-semibold text-[#101a35]"><MapPin size={16} strokeWidth={1.5} aria-hidden className="shrink-0" /><span className="truncate">{clinic.name}</span><span className="font-normal text-muted">· {clinic.city}</span></span>
          <span className={clsx("rounded-full px-2.5 py-0.5 text-xs font-semibold", chipTone[chip.tone])}>{chip.label}</span>
          {date && <span>{t.lastAnalysis}: <span className="font-semibold text-[#101a35]">{formatDate(date)}</span></span>}
          {latest && <span className="inline-flex items-center gap-1.5"><Users size={16} strokeWidth={1.5} aria-hidden />{latest.report.competitors.length} {t.competitorsAnalyzed}</span>}
        </div>
      </div>
      <div className="flex flex-wrap items-start gap-3">
        {canRerun && <RunAnalysisButton clinic={clinic} />}
        {next && <Link href={next.href} className={action}>{next.label} <ArrowRight size={16} aria-hidden /></Link>}
      </div>
    </header>
  );
}
