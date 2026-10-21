"use client";

import { BarChart3, Building2, ChevronRight, MapPin, MessageCircle, Star } from "lucide-react";
import { Chip, type ChipTone } from "@/components/landing/Chip";
import { useLanding } from "@/components/i18n/LangProvider";

const icons = [Building2, MapPin, MessageCircle, BarChart3];
const bar = "mt-5 flex items-center justify-between gap-3 rounded-[18px] border border-[#ecedf5] bg-white";

function ClinicDetail({ title, sub }: { title: string; sub: string }) {
  return (
    <div className={`${bar} p-3`}>
      <span className="grid h-11 w-[72px] shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#e6ecf9] to-[#d3dcf1] text-[#7f8db3]"><Building2 size={18} aria-hidden /></span>
      <span className="min-w-0 flex-1"><span className="block text-[15px] leading-tight font-bold">{title}</span><span className="mt-1 block text-[13px] text-ink-grey">{sub}</span></span>
      <ChevronRight size={16} className="shrink-0 text-ink-grey" aria-hidden />
    </div>
  );
}

function CompetitorsDetail({ title, sub }: { title: string; sub: string }) {
  const dots = [["#fde3e8", "#ef4444"], ["#f6d9f1", "#c026d3"], ["#e6defb", "#7c5cf5"], ["#7c6cf0", "#ffffff"]];
  return (
    <div className={`${bar} p-3`}>
      <span aria-hidden className="flex shrink-0 -space-x-2.5">{dots.map(([bg, dot], i) => <span key={bg} className="grid size-9 place-items-center rounded-full ring-2 ring-white" style={{ background: bg, zIndex: i }}><span className="size-1.5 rounded-full" style={{ background: dot }} /></span>)}</span>
      <span className="min-w-0 flex-1"><span className="block text-[15px] leading-tight font-bold">{title}</span><span className="mt-1 block text-[13px] text-ink-grey">{sub}</span></span>
      <ChevronRight size={16} className="shrink-0 text-ink-grey" aria-hidden />
    </div>
  );
}

function QuoteDetail({ quote }: { quote: string }) {
  return (
    <div className={`${bar} rounded-full px-4 py-2.5`}>
      <span aria-hidden className="flex shrink-0 gap-0.5 text-[#f59e0b]">{[0, 1, 2, 3, 4].map((n) => <Star key={n} size={13} fill="currentColor" strokeWidth={0} />)}</span>
      <span className="min-w-0 flex-1 truncate text-[13.5px] italic">{quote}</span>
      <ChevronRight size={16} className="shrink-0 text-ink-grey" aria-hidden />
    </div>
  );
}

function PlanDetail() {
  const plan = useLanding().how.plan;
  return (
    <div className="mt-5 space-y-1 rounded-[18px] border border-[#ecedf5] bg-white px-3 py-2.5">
      {plan.map((p, i) => (
        <div key={p.label} className="flex items-center justify-between gap-2 py-1.5">
          <span className="flex items-center gap-3 text-[14.5px] font-medium"><span className="grid size-6 place-items-center rounded-full bg-[#eee9ff] text-[11px] font-bold text-primary">{i + 1}</span>{p.label}</span>
          <Chip tone={p.tone as ChipTone}>{p.level}</Chip>
        </div>
      ))}
    </div>
  );
}

/** One step card: icon, title, text, and a small preview of what that step produces. */
export function StepCard({ index }: { index: number }) {
  const s = useLanding().how.steps[index];
  const Icon = icons[index];
  return (
    <div className="rounded-[22px] border border-[#ecedf5] bg-white p-6 shadow-[0_22px_50px_-36px_rgba(76,70,180,.45)]">
      <div className="flex items-start gap-4">
        <span className="grid size-16 shrink-0 place-items-center rounded-full bg-[#eeeaff] text-[#4338ca]"><Icon size={24} strokeWidth={1.6} aria-hidden /></span>
        <div className="pt-1">
          <h3 className="text-[19px] leading-snug font-bold tracking-[-0.01em]">{s.title}</h3>
          <p className="mt-1.5 text-[15px] leading-[1.5] text-ink-grey">{s.text}</p>
        </div>
      </div>
      {index === 0 && <ClinicDetail title={s.card} sub={s.cardSub} />}
      {index === 1 && <CompetitorsDetail title={s.card} sub={s.cardSub} />}
      {index === 2 && <QuoteDetail quote={s.card} />}
      {index === 3 && <PlanDetail />}
    </div>
  );
}
