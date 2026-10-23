import Link from "next/link";
import { ArrowRight, ChevronRight, Lightbulb } from "lucide-react";
import { copy } from "@/lib/copy";
import { formatDate } from "@/lib/format";
import { panel } from "./panel";

/** What the report says is holding the clinic back: kept findings about the clinic, in their own words. */
export function HoldingBack({ claims, href }: { claims: string[]; href: string }) {
  const t = copy.dashboard.insights;
  return (
    <section className={`${panel} p-6`} aria-labelledby="holding-title">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#f0efff] text-primary" aria-hidden><Lightbulb size={19} strokeWidth={1.5} /></span>
          <div><h2 id="holding-title" className="text-[18px] font-semibold text-[#111b35]">{t.holdingTitle}</h2><p className="text-[13px] text-muted">{t.holdingSub}</p></div>
        </div>
        {claims.length > 0 && <Link href={href} className="inline-flex min-h-9 items-center gap-1 text-sm font-semibold text-primary">{t.holdingAll} <ArrowRight size={14} aria-hidden /></Link>}
      </div>
      {claims.length === 0 ? (
        <div className="mt-4 rounded-xl bg-[#f7f8fc] p-4"><p className="text-[14px] font-semibold text-[#111b35]">{t.holdingEmptyTitle}</p><p className="mt-1 text-[13px] text-muted">{t.holdingNone}</p></div>
      ) : (
        <ul className="mt-2 divide-y divide-[#eef0f7]">
          {claims.map((c) => (
            <li key={c}><Link href={href} className="flex items-center gap-3 py-3.5 text-[14px] leading-snug text-[#111b35] hover:text-primary"><span className="min-w-0 flex-1">{c}</span><ChevronRight size={16} aria-hidden className="shrink-0 text-faint" /></Link></li>
          ))}
        </ul>
      )}
    </section>
  );
}

/** The comparison with the previous analysis. Rendered only when the report carries one. */
export function SinceLast({ since, href }: { since: { date: string; summary: string; newFindings: number; resolved: number; completed: number }; href: string }) {
  const t = copy.dashboard.insights;
  return (
    <section className={`${panel} p-5 sm:p-6`} aria-labelledby="since-title">
      <h2 id="since-title" className="text-[17px] font-bold">{t.sinceTitle}</h2>
      <p className="text-[13px] text-muted">{formatDate(since.date)}</p>
      <p className="mt-2 text-[14px] leading-relaxed">{since.summary}</p>
      <p className="mt-2 text-[13px] text-muted tabular-nums">{since.newFindings} {t.newFindings} · {since.resolved} {t.resolved} · {since.completed} {t.completed}</p>
      <Link href={href} className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary">{t.sinceAll} <ArrowRight size={14} aria-hidden /></Link>
    </section>
  );
}
