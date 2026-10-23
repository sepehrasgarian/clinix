import Link from "next/link";
import { ArrowRight, BarChart3, ClipboardList, Layers, ShieldCheck, Target } from "lucide-react";
import { Pill } from "@/components/ui/Pill";
import { copy } from "@/lib/copy";
import type { Opportunity } from "@/lib/dashboard";
import { toneForLevel } from "@/lib/format";
import { panel } from "./panel";

const previewIcons = [ShieldCheck, BarChart3, ClipboardList, Layers];

/** The three highest-priority recommendations from the latest completed report. */
export function Opportunities({ items, allHref, onOpen }: { items: Opportunity[]; allHref: string; onOpen: (o: Opportunity) => void }) {
  const t = copy.dashboard.opportunities;
  return (
    <section className={`${panel} p-5 sm:p-6`} aria-labelledby="opps-title">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#f1f0ff] text-primary" aria-hidden><Target size={19} strokeWidth={1.5} /></span>
          <div><h2 id="opps-title" className="text-[18px] font-bold">{t.title}</h2><p className="text-[13px] text-muted">{items.length ? t.sub : t.none}</p></div>
        </div>
        <Link href={allHref} className="inline-flex min-h-9 items-center gap-1 text-sm font-semibold text-primary">{t.all} <ArrowRight size={14} aria-hidden /></Link>
      </div>
      {items.length > 0 && (
        <ol className="mt-2 divide-y divide-[#eef0f7]">
          {items.map((o, i) => (
            <li key={o.rec.id} className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-4 gap-y-3 py-5 sm:grid-cols-[auto_minmax(0,1fr)_auto]">
              <span className="grid size-10 place-items-center rounded-full bg-[#f0efff] text-sm font-semibold text-primary tabular-nums" aria-hidden>{String(i + 1).padStart(2, "0")}</span>
              <div className="min-w-0 border-l border-[#e6eaf2] pl-4">
                <h3 className="text-[15px] leading-snug font-semibold text-[#111b35]">{o.rec.title}</h3>
                <p className="mt-1 line-clamp-2 text-[13px] leading-snug text-muted">{o.rec.firstStep}</p>
                <div className="mt-2.5 flex flex-wrap items-center gap-1.5"><Pill tone={toneForLevel(o.rec.impact)}>{o.rec.impact} impact</Pill><Pill>{o.rec.effort} effort</Pill></div>
              </div>
              <div className="col-span-2 flex flex-wrap items-center justify-between gap-x-6 gap-y-1 pl-14 sm:col-span-1 sm:w-44 sm:flex-col sm:items-end sm:justify-center sm:pl-0 sm:text-right">
                {o.evidence && <p className="text-xs leading-snug text-muted">{o.evidence}</p>}
                <button type="button" onClick={() => onOpen(o)} className="inline-flex min-h-9 items-center gap-1.5 text-sm font-semibold text-primary hover:text-[#4338ca]">{t.view} <ArrowRight size={14} aria-hidden /></button>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

/** Before any report exists: what the report will hold, labelled as a preview so it is never read as a finding. */
export function ReportPreview() {
  const t = copy.dashboard.opportunities;
  return (
    <section className={`${panel} p-5 sm:p-6`} aria-labelledby="preview-title">
      <div className="flex flex-wrap items-center gap-2"><h2 id="preview-title" className="text-[17px] font-bold">{copy.dashboard.welcome.upcomingTitle}</h2><Pill tone="primary">{t.previewTag}</Pill></div>
      <p className="text-[13px] text-muted">{t.previewText}</p>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {copy.onboarding.run.gets.map((g, i) => { const Icon = previewIcons[i]; return (
          <li key={g.title} className="rounded-2xl border border-[#eef0f7] p-4"><span className="grid size-9 place-items-center rounded-xl bg-[#eeefff] text-primary" aria-hidden><Icon size={16} /></span><h3 className="mt-3 text-[14px] font-semibold">{g.title}</h3><p className="mt-1 text-[12.5px] leading-snug text-muted">{g.text}</p></li>
        ); })}
      </ul>
    </section>
  );
}
